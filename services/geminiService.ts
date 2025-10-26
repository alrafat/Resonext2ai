
import { GoogleGenAI, Type } from "@google/genai";
import type { UserProfile, ProfessorProfile, AnalysisResult, TieredUniversities, UniversityRecommendation, ProfessorRecommendation, SavedProfessor, ProgramDiscoveryResult, UniversityWithPrograms } from '../types';

// This variable is injected by the Vite build process (see vite.config.ts)
const apiKey = process.env.API_KEY;

// Export a flag to check for the API key without crashing the app.
export const isGeminiConfigured = !!apiKey;

// Initialize with an empty string if the key is missing. The @google/genai library will
// throw an error upon the first API call, which can be caught by the UI,
// rather than crashing the entire application on load.
const ai = new GoogleGenAI({ apiKey: apiKey || '' });
const model = 'gemini-2.5-flash'; // Standardize on a reliable and available model

/**
 * A helper function to safely parse JSON from a model response.
 * It handles responses that might be wrapped in markdown code blocks.
 * @param jsonText The raw text from the model response.
 * @returns A parsed JSON object.
 */
function parseJsonFromResponse<T>(jsonText: string): T {
    const markdownRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = jsonText.match(markdownRegex);
    const cleanJson = match ? match[1] : jsonText;
    try {
        return JSON.parse(cleanJson);
    } catch (e) {
        console.error("Failed to parse JSON from response:", cleanJson);
        throw new Error("Received an invalid JSON response from the model.");
    }
}

// --- Service Functions - Now Directly Calling the Gemini API ---

export const extractTextFromFile = async (fileContent: string, mimeType: string): Promise<string> => {
    if (!isGeminiConfigured) throw new Error("Gemini API key not configured.");
    const textPart = { text: "You are a text extraction tool. Your only task is to extract all textual content from the provided document. Output ONLY the raw, unformatted text. Do not add any commentary, greetings, or explanations before or after the extracted text." };
    const filePart = { inlineData: { mimeType, data: fileContent } };
    const response = await ai.models.generateContent({ model, contents: { parts: [textPart, filePart] } });
    return response.text;
};

export const extractProfileFromCV = async (cvContent: string, cvMimeType: string): Promise<Partial<UserProfile>> => {
    if (!isGeminiConfigured) throw new Error("Gemini API key not configured.");
    const prompt = `From the provided CV, extract the user's professional and academic profile information. Populate all fields of the provided JSON schema. If a specific piece of information isn't found, use an empty string "" or a default empty object for degrees.`;
    const cvPart = { inlineData: { mimeType: cvMimeType, data: cvContent } };

    const degreeSchema = {
        type: Type.OBJECT,
        properties: {
            university: { type: Type.STRING },
            major: { type: Type.STRING },
            gpa: { type: Type.STRING }
        },
        required: ["university", "major", "gpa"]
    };

    const response = await ai.models.generateContent({
        model,
        contents: { parts: [{ text: prompt }, cvPart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "The user's full name." },
                    bachelor: degreeSchema,
                    master: degreeSchema,
                    academicSummary: { type: Type.STRING, description: "A concise one-paragraph academic summary." },
                    researchInterests: { type: Type.STRING, description: "A summary of the user's research interests." },
                    relevantCoursework: { type: Type.STRING, description: "A comma-separated list of relevant coursework." },
                    workExperience: { type: Type.STRING, description: "A summary of relevant work experience." },
                    conferences: { type: Type.STRING, description: "A summary of conference presentations or attendance." },
                    portfolio: { type: Type.STRING, description: "URL to a personal website or portfolio, if available." },
                    futureGoals: { type: Type.STRING, description: "A summary of future goals or academic vision after graduate studies." }
                },
                required: [ "name", "bachelor", "master", "academicSummary", "researchInterests", "relevantCoursework", "workExperience", "conferences", "portfolio", "futureGoals" ]
            }
        }
    });
    
    return parseJsonFromResponse<Partial<UserProfile>>(response.text);
};

export const generateAnalysisAndEmail = async (userProfile: UserProfile, professorProfile: ProfessorProfile, selectedPapers?: string[]): Promise<AnalysisResult> => {
    if (!isGeminiConfigured) throw new Error("Gemini API key not configured.");
    const prompt = `Analyze the alignment between the student's profile and the professor's research. Based on this, generate a concise alignment summary and a personalized, professional outreach email.

Student Profile:
- Name: ${userProfile.name}
- Degrees: ${userProfile.bachelor.major} (B.S.), ${userProfile.master?.major ? userProfile.master.major + ' (M.S.)' : 'N/A'}
- Academic Summary: ${userProfile.academicSummary}
- Research Interests: ${userProfile.researchInterests}
- Relevant Experience: ${userProfile.workExperience}
- Future Goals: ${userProfile.futureGoals}
- Portfolio: ${userProfile.portfolio}

Professor Profile:
- Name: ${professorProfile.name}
- University: ${professorProfile.university}
- Research Focus: ${professorProfile.researchFocus}
- Lab Website: ${professorProfile.labWebsite}
${selectedPapers && selectedPapers.length > 0 ? `- Selected Papers to mention: ${selectedPapers.join(', ')}` : ''}

Task:
1.  **Alignment Summary:** Write a 2-3 sentence summary highlighting the key points of alignment between the student and professor.
2.  **Email Subject:** Create a clear and professional subject line.
3.  **Outreach Email:** Draft a respectful and concise email from the student to the professor. It should:
    -   Briefly introduce the student.
    -   Clearly state the purpose: interest in their PhD program and specific research.
    -   Demonstrate genuine interest by referencing the professor's work (and selected papers if provided).
    -   Connect the student's background and interests to the professor's research.
    -   End with a clear call to action (e.g., asking about research opportunities or a brief chat).
    -   Maintain a professional and academic tone.`;
    
    const response = await ai.models.generateContent({
        model, contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: { alignmentSummary: { type: Type.STRING }, outreachEmail: { type: Type.STRING }, emailSubject: { type: Type.STRING } },
                required: ["alignmentSummary", "outreachEmail", "emailSubject"]
            }
        }
    });
    return parseJsonFromResponse<AnalysisResult>(response.text);
};

export const regenerateEmail = async (userProfile: UserProfile, professorProfile: ProfessorProfile, previousResult: AnalysisResult, prompt: string): Promise<Partial<AnalysisResult>> => {
    if (!isGeminiConfigured) throw new Error("Gemini API key not configured.");
    const regenerationPrompt = `You are an expert academic editor. A student has an existing draft of an outreach email to a professor. Your task is to revise it based on their specific request.

Original Email Subject: ${previousResult.emailSubject}
Original Email Body:
${previousResult.outreachEmail}

Student's Revision Request: "${prompt}"

Based *only* on the student's request, revise the subject and body. Output a new JSON object with the updated "outreachEmail" and "emailSubject". Do not change other aspects unless requested.`;
    
    const response = await ai.models.generateContent({
        model, contents: regenerationPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: { outreachEmail: { type: Type.STRING }, emailSubject: { type: Type.STRING } },
                required: ["outreachEmail", "emailSubject"]
            }
        }
    });
    return parseJsonFromResponse<Partial<AnalysisResult>>(response.text);
};

export const generateSop = async (userProfile: UserProfile, university: string, program: string, targetProfessors?: (SavedProfessor | ProfessorProfile | ProfessorRecommendation)[], selectedPapers?: string[]): Promise<string> => {
    if (!isGeminiConfigured) throw new Error("Gemini API key not configured.");
    const styleGuidance = (userProfile.demoSop || (userProfile.sampleSops && userProfile.sampleSops.length > 0))
    ? `
    WRITING STYLE GUIDANCE:
    The user has provided the following sample document(s). Analyze their structure, tone, and style (e.g., sentence complexity, vocabulary, narrative flow). Your generated SOP should emulate this style to ensure authenticity.
    
    Demo SOP 1 (User's own writing):
    ---
    ${userProfile.demoSop || 'Not provided.'}
    ---
    
    ${(userProfile.sampleSops || []).map((sop, i) => `
    Reference SOP ${i + 1}:
    ---
    ${sop.content}
    ---
    `).join('\n')}
    ` : "STYLE GUIDANCE: Write in a clear, confident, and professional academic tone.";
    
    const prompt = `You are an expert Statement of Purpose (SOP) writer for graduate school applications. Your task is to draft a compelling SOP based on the student's profile for a specific program.

Student Profile: ${JSON.stringify(userProfile, null, 2)}
Target University: ${university}
Target Program: ${program}
${/* FIX: The `targetProfessors` array can contain objects with different property names for research info ('researchSummary' vs 'researchFocus'). This checks for the correct property before accessing it to resolve the type error. */ ''}
${targetProfessors && targetProfessors.length > 0 ? `Target Professor(s) of Interest: ${targetProfessors.map(p => `${p.name} (Research: ${'researchSummary' in p ? p.researchSummary : p.researchFocus})`).join('; ')}` : ''}
${selectedPapers && selectedPapers.length > 0 ? `Selected Papers to reference: ${selectedPapers.join(', ')}` : ''}

${styleGuidance}

TASK:
Write a comprehensive, well-structured Statement of Purpose (approx. 800-1000 words). The SOP should:
1.  **Introduction:** Hook the reader and state the applicant's purpose for applying to the ${program} at ${university}.
2.  **Academic & Research Background:** Detail the student's academic journey, highlighting relevant projects, coursework, and research experiences. Connect these experiences to their stated research interests.
3.  **Why this Program:** Specifically address why the ${program} at ${university} is the ideal fit. Mention specific curriculum, resources, or faculty.
4.  **Professor Alignment:** If target professors are listed, dedicate a paragraph to explaining why their research is a strong match for the applicant's interests and goals. Reference their work specifically.
5.  **Future Goals:** Articulate clear, long-term career goals and how this graduate program is a critical step toward achieving them.
6.  **Conclusion:** Summarize the applicant's key strengths and reiterate their strong interest and suitability for the program.

Output the SOP content directly.`;
    
    const response = await ai.models.generateContent({
        model, contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: { type: Type.OBJECT, properties: { sopContent: { type: Type.STRING } }, required: ["sopContent"] }
        }
    });
    const result = parseJsonFromResponse<{ sopContent: string }>(response.text);
    return result.sopContent;
};

export const regenerateSop = async (userProfile: UserProfile, originalSop: string, prompt: string): Promise<string> => {
    if (!isGeminiConfigured) throw new Error("Gemini API key not configured.");
    const regenerationPrompt = `You are an expert academic editor. A student has a draft of their Statement of Purpose (SOP). Your task is to revise it based on their specific request, using their profile for context.

Student Profile: ${JSON.stringify(userProfile, null, 2)}

Original SOP:
---
${originalSop}
---

Student's Revision Request: "${prompt}"

Based on the student's request, revise the SOP. Ensure the tone remains professional and academic.`;
    
    const response = await ai.models.generateContent({
        model, contents: regenerationPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: { type: Type.OBJECT, properties: { sopContent: { type: Type.STRING } }, required: ["sopContent"] }
        }
    });
    const result = parseJsonFromResponse<{ sopContent: string }>(response.text);
    return result.sopContent;
};

export const findMatchingUniversities = async (userProfile: UserProfile, country: string, state?: string): Promise<TieredUniversities> => {
    if (!isGeminiConfigured) throw new Error("Gemini API key not configured.");
    const prompt = `
        TASK: Use Google Search to find universities matching the student profile for the specified country/state.
        - Categorize universities into three tiers: 'highTier' (ambitious), 'mediumTier' (good match), and 'lowTier' (safer).
        - For each university, provide its name, country, and any available US News and QS rankings.

        STUDENT PROFILE:
        ${JSON.stringify({ researchInterests: userProfile.researchInterests, academicSummary: userProfile.academicSummary }, null, 2)}

        LOCATION:
        - Country: ${country}
        ${state ? `- State/Province: ${state}` : ''}

        CRITICAL: Your response MUST be a single, raw JSON object. Do not include any text, explanations, or markdown formatting (like \`\`\`json). The entire output must be parsable JSON conforming to this exact structure:
        {
          "highTier": [ { "name": "University Name", "country": "${country}", "usNewsRanking": "Ranking String", "qsRanking": "Ranking String" } ],
          "mediumTier": [ { "name": "University Name", "country": "${country}", "usNewsRanking": "Ranking String", "qsRanking": "Ranking String" } ],
          "lowTier": [ { "name": "University Name", "country": "${country}", "usNewsRanking": "Ranking String", "qsRanking": "Ranking String" } ]
        }
        - If a ranking is not available, use the string "Not Ranked".
    `;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { tools: [{ googleSearch: {} }] } });
    const result = parseJsonFromResponse<TieredUniversities>(response.text);
    result.groundingSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    return result;
};

export const findMatchingProfessors = async (userProfile: UserProfile, universityName: string, department?: string, researchInterest?: string, existingProfessors?: ProfessorRecommendation[]): Promise<UniversityRecommendation> => {
    if (!isGeminiConfigured) throw new Error("Gemini API key not configured.");
    const prompt = `
        TASK: Use Google Search to find professors at a specific university whose research aligns with the student's profile.
        - For each professor, find their name, designation, department, email, lab website, a concise research summary, and 1-2 recent, relevant papers with titles and public links.

        STUDENT PROFILE:
        ${JSON.stringify({ researchInterests: userProfile.researchInterests }, null, 2)}

        SEARCH CRITERIA:
        - University: ${universityName}
        ${department ? `- Department: ${department}` : ''}
        ${researchInterest ? `- Specific Research Interest: ${researchInterest}` : ''}
        ${existingProfessors && existingProfessors.length > 0 ? `- EXCLUDE these professors: ${existingProfessors.map(p => p.name).join(', ')}` : ''}

        CRITICAL: Your response MUST be a single, raw JSON object. Do not include any text, explanations, or markdown formatting (like \`\`\`json). The entire output must be parsable JSON conforming to this exact structure:
        {
          "professors": [
            {
              "id": "unique-id-string (e.g., name-university)",
              "name": "Professor Name",
              "university": "${universityName}",
              "department": "Professor's Department",
              "designation": "Professor's Title",
              "researchSummary": "Concise summary of research.",
              "labWebsite": "URL",
              "email": "professor@email.com",
              "suggestedPapers": [
                { "title": "Paper Title", "link": "URL to paper" }
              ]
            }
          ]
        }
        - Generate a unique ID for each professor.
    `;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { tools: [{ googleSearch: {} }] } });
    const result = parseJsonFromResponse<UniversityRecommendation>(response.text);
    result.groundingSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (result.professors) {
        result.professors.forEach(p => { if (!p.university) { p.university = universityName; } });
    }
    return result;
};

export const findProgramsForSpecificUniversity = async (userProfile: UserProfile, universityName: string, keywords?: string): Promise<ProgramDiscoveryResult> => {
    if (!isGeminiConfigured) throw new Error("Gemini API key not configured.");
    const prompt = `
        TASK: Use Google Search to find relevant graduate programs (Master's or PhD) at a specific university that match a student's profile.
        - For each program, find its name, degree type, relevance to the student, key application requirements (IELTS, TOEFL, GRE/GMAT, GPA), fee, deadlines, and direct links to program and application pages.

        STUDENT PROFILE:
        ${JSON.stringify({ researchInterests: userProfile.researchInterests, academicSummary: userProfile.academicSummary }, null, 2)}

        SEARCH CRITERIA:
        - University: ${universityName}
        ${keywords ? `- Keywords: ${keywords}` : ''}

        CRITICAL: Your response MUST be a single, raw JSON object. Do not include any text, explanations, or markdown formatting (like \`\`\`json). The entire output must be parsable JSON conforming to this exact structure:
        {
          "universityName": "${universityName}",
          "usNewsRanking": "Ranking String",
          "qsRanking": "Ranking String",
          "recommendedPrograms": [
            {
              "programName": "Program Name",
              "degreeType": "e.g., MSc, PhD",
              "fieldRelevance": "Why this program is a good fit.",
              "applicationRequirements": { "ielts": "Score or N/A", "toefl": "Score or N/A", "greGmat": "Required/Optional/Not Required", "gpaRequirement": "e.g., 3.0/4.0" },
              "applicationFee": "e.g., $150 USD",
              "applicationDeadlines": [ { "intake": "e.g., Fall 2025", "deadline": "e.g., 2024-12-15" } ],
              "programLink": "URL",
              "applicationLink": "URL"
            }
          ]
        }
        - If information is not found, use "Not specified" or "N/A".
    `;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { tools: [{ googleSearch: {} }] } });
    const result = parseJsonFromResponse<{ universityName: string, usNewsRanking: string, qsRanking: string, recommendedPrograms: any[] }>(response.text);
    const groundingSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    return { universities: [{ universityName: result.universityName, usNewsRanking: result.usNewsRanking, qsRanking: result.qsRanking, recommendedPrograms: result.recommendedPrograms, groundingSources: groundingSources }] };
};

export const findProgramsBroadly = async (userProfile: UserProfile, country?: string, existingUniversities?: UniversityWithPrograms[], keywords?: string, state?: string): Promise<ProgramDiscoveryResult> => {
    if (!isGeminiConfigured) throw new Error("Gemini API key not configured.");
    const prompt = `
        TASK: Use Google Search to find universities and relevant graduate programs that match a student's profile, focusing on a specific country or region.
        - Find 3-5 suitable universities.
        - For each university, find 1-2 relevant programs and provide details as specified in the schema.
        - Categorize each university as 'high', 'medium', or 'low' tier based on rankings and fit.

        STUDENT PROFILE:
        ${JSON.stringify({ researchInterests: userProfile.researchInterests, academicSummary: userProfile.academicSummary }, null, 2)}

        SEARCH CRITERIA:
        ${country ? `- Country: ${country}` : '- Focus on global results, primarily in North America and Europe.'}
        ${state ? `- State/Province: ${state}` : ''}
        ${keywords ? `- Keywords: ${keywords}` : ''}
        ${existingUniversities && existingUniversities.length > 0 ? `- EXCLUDE these universities: ${existingUniversities.map(u => u.universityName).join(', ')}` : ''}

        CRITICAL: Your response MUST be a single, raw JSON object. Do not include any text, explanations, or markdown formatting (like \`\`\`json). The entire output must be parsable JSON conforming to this exact structure:
        {
          "universities": [
            {
              "universityName": "University Name",
              "usNewsRanking": "Ranking String",
              "qsRanking": "Ranking String",
              "tier": "high",
              "recommendedPrograms": [
                {
                  "programName": "Program Name",
                  "degreeType": "e.g., MSc, PhD",
                  "fieldRelevance": "Why this program is a good fit.",
                  "applicationRequirements": { "ielts": "Score or N/A", "toefl": "Score or N/A", "greGmat": "Required/Optional/Not Required", "gpaRequirement": "e.g., 3.0/4.0" },
                  "applicationFee": "e.g., $150 USD",
                  "applicationDeadlines": [ { "intake": "e.g., Fall 2025", "deadline": "e.g., 2024-12-15" } ],
                  "programLink": "URL",
                  "applicationLink": "URL"
                }
              ]
            }
          ]
        }
        - If information is not found, use "Not specified" or "N/A".
    `;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { tools: [{ googleSearch: {} }] } });
    const result = parseJsonFromResponse<ProgramDiscoveryResult>(response.text);
    const groundingSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (result.universities && groundingSources) {
        result.universities.forEach(uni => { uni.groundingSources = groundingSources; });
    }
    return result;
};
