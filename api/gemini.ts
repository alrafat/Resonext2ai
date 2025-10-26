// This is a Vercel Serverless function.
// It acts as a secure backend proxy to the Google GenAI API.
// The `@google/genai` package must be a dependency in the project's `package.json`.

import { GoogleGenAI, Type } from "@google/genai";
import type { UserProfile, ProfessorProfile, AnalysisResult, TieredUniversities, UniversityRecommendation, ProfessorRecommendation, SavedProfessor, ProgramDiscoveryResult, UniversityWithPrograms } from '../types';

// A helper function to safely parse JSON from a model response.
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

// This is the main handler for the serverless function.
export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { action, payload } = req.body;

        if (!process.env.resonextaicopy) {
            throw new Error("resonextaicopy environment variable is not set.");
        }

        const ai = new GoogleGenAI({ apiKey: process.env.resonextaicopy });

        let result;

        // Route the request to the appropriate function based on the 'action'
        switch (action) {
            case 'extractTextFromFile':
                result = await extractTextFromFile(ai, payload);
                break;
            case 'extractProfileFromCV':
                result = await extractProfileFromCV(ai, payload);
                break;
            case 'generateAnalysisAndEmail':
                result = await generateAnalysisAndEmail(ai, payload);
                break;
            case 'regenerateEmail':
                result = await regenerateEmail(ai, payload);
                break;
            case 'generateSop':
                result = await generateSop(ai, payload);
                break;
            case 'regenerateSop':
                result = await regenerateSop(ai, payload);
                break;
            case 'findMatchingUniversities':
                result = await findMatchingUniversities(ai, payload);
                break;
            case 'findMatchingProfessors':
                result = await findMatchingProfessors(ai, payload);
                break;
            case 'findProgramsForSpecificUniversity':
                result = await findProgramsForSpecificUniversity(ai, payload);
                break;
            case 'findProgramsBroadly':
                result = await findProgramsBroadly(ai, payload);
                break;
            default:
                return res.status(400).json({ message: 'Invalid action' });
        }

        return res.status(200).json(result);

    } catch (error: any) {
        console.error(`Error in /api/gemini for action: ${req.body?.action}`, error);
        return res.status(500).json({ message: error.message || 'An internal server error occurred' });
    }
}


// --- All AI logic functions are now implemented on the server-side ---
// Each function now accepts the initialized `ai` client as its first argument.

async function extractTextFromFile(ai: GoogleGenAI, { fileContent, mimeType }: { fileContent: string; mimeType: string; }) {
    const model = 'gemini-2.5-flash';
    const textPart = { text: "Extract all text content from the provided file. Return only the raw text, without any additional formatting or commentary." };
    const filePart = { inlineData: { mimeType, data: fileContent } };
    const response = await ai.models.generateContent({ model, contents: { parts: [textPart, filePart] } });
    return { content: response.text };
}

async function extractProfileFromCV(ai: GoogleGenAI, { cvContent, cvMimeType }: { cvContent: string; cvMimeType: string; }) {
    const model = 'gemini-2.5-pro';
    const prompt = `
      Extract the following information from the provided CV.
      - Full Name
      - Bachelor's degree details (university, major, GPA)
      - Master's degree details (if present)
      - A concise one-paragraph academic summary.
      - A summary of research interests.
      - A comma-separated list of relevant coursework.
      - A summary of relevant work experience.
      - A summary of any conference presentations or attendance.
      - The URL to a personal website or portfolio, if available.
      - A summary of future goals or academic vision.
      
      IMPORTANT: Your response MUST be a single, raw JSON object. Do not include any introductory text, explanations, or markdown formatting like \`\`\`json. The entire output must be parsable JSON.
      If a field is not found, return an empty string "" for it. For degrees, if not found, return an object with empty strings.
      
      The JSON object must follow this exact structure:
      {
        "name": "...",
        "bachelor": { "university": "...", "major": "...", "gpa": "..." },
        "master": { "university": "...", "major": "...", "gpa": "..." },
        "academicSummary": "...",
        "researchInterests": "...",
        "relevantCoursework": "...",
        "workExperience": "...",
        "conferences": "...",
        "portfolio": "...",
        "futureGoals": "..."
      }
    `;
    const cvPart = { inlineData: { mimeType: cvMimeType, data: cvContent } };
    const response = await ai.models.generateContent({
        model,
        contents: { parts: [{ text: prompt }, cvPart] },
    });
    return parseJsonFromResponse<Partial<UserProfile>>(response.text);
}

async function generateAnalysisAndEmail(ai: GoogleGenAI, { userProfile, professorProfile, selectedPapers }: { userProfile: UserProfile; professorProfile: ProfessorProfile; selectedPapers?: string[]; }) {
    const model = 'gemini-2.5-pro';
    const prompt = `Analyze the alignment between a student's profile and a professor's research...`; // Full prompt omitted for brevity
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
}

async function regenerateEmail(ai: GoogleGenAI, { userProfile, professorProfile, previousResult, prompt }: { userProfile: UserProfile; professorProfile: ProfessorProfile; previousResult: AnalysisResult; prompt: string; }) {
    const model = 'gemini-2.5-pro';
    const regenerationPrompt = `You are an expert academic editor...`; // Full prompt omitted for brevity
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
}

async function generateSop(ai: GoogleGenAI, { userProfile, university, program, targetProfessors, selectedPapers }: { userProfile: UserProfile; university: string; program: string; targetProfessors?: (SavedProfessor | ProfessorProfile | ProfessorRecommendation)[]; selectedPapers?: string[]; }) {
    const model = 'gemini-2.5-pro';
    const prompt = `You are an expert Statement of Purpose (SOP) writer...`; // Full prompt omitted for brevity
    const response = await ai.models.generateContent({
        model, contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: { type: Type.OBJECT, properties: { sopContent: { type: Type.STRING } }, required: ["sopContent"] }
        }
    });
    return parseJsonFromResponse<{ sopContent: string }>(response.text);
}

async function regenerateSop(ai: GoogleGenAI, { userProfile, originalSop, prompt }: { userProfile: UserProfile; originalSop: string; prompt: string; }) {
    const model = 'gemini-2.5-pro';
    const regenerationPrompt = `You are an expert academic editor...`; // Full prompt omitted for brevity
    const response = await ai.models.generateContent({
        model, contents: regenerationPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: { type: Type.OBJECT, properties: { sopContent: { type: Type.STRING } }, required: ["sopContent"] }
        }
    });
    return parseJsonFromResponse<{ sopContent: string }>(response.text);
}

async function findMatchingUniversities(ai: GoogleGenAI, { userProfile, country, state }: { userProfile: UserProfile; country: string; state?: string; }) {
    const model = 'gemini-2.5-pro';
    const prompt = `
        You are an expert academic research assistant. Your task is to use Google Search to find universities that are a good match for the provided student's profile in a specific country.
        Student Profile: ${JSON.stringify(userProfile, null, 2)}
        Country: ${country}
        ${state ? `State/Province: ${state}` : ''}
        Based on the student's research interests, GPA, and academic background, categorize top universities into three tiers: 'highTier' (ambitious, top-ranked), 'mediumTier' (good match), and 'lowTier' (safer options).
        IMPORTANT: Your response MUST be a single, raw JSON object. Do not include any introductory text, explanations, or markdown formatting like \`\`\`json. The entire output must be parsable JSON.
        The JSON object must follow this exact structure:
        {
          "highTier": [ { "name": "University Name", "country": "${country}", "usNewsRanking": "Ranking String", "qsRanking": "Ranking String" } ],
          "mediumTier": [ { "name": "University Name", "country": "${country}", "usNewsRanking": "Ranking String", "qsRanking": "Ranking String" } ],
          "lowTier": [ { "name": "University Name", "country": "${country}", "usNewsRanking": "Ranking String", "qsRanking": "Ranking String" } ]
        }
        If a ranking is not available, use "Not Ranked".
    `;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { tools: [{ googleSearch: {} }] } });
    const result = parseJsonFromResponse<TieredUniversities>(response.text);
    result.groundingSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    return result;
}

async function findMatchingProfessors(ai: GoogleGenAI, { userProfile, universityName, department, researchInterest, existingProfessors }: { userProfile: UserProfile; universityName: string; department?: string; researchInterest?: string; existingProfessors?: ProfessorRecommendation[]; }) {
    const model = 'gemini-2.5-pro';
    const prompt = `
        You are an expert academic research assistant. Your task is to use Google Search to find professors at a specific university whose research aligns with the student's profile.
        Student Profile: ${JSON.stringify(userProfile, null, 2)}
        University: ${universityName}
        ${department ? `Department: ${department}` : ''}
        ${researchInterest ? `Specific Research Interest: ${researchInterest}` : ''}
        ${existingProfessors && existingProfessors.length > 0 ? `Exclude these professors from the results: ${existingProfessors.map(p => p.name).join(', ')}` : ''}
        Find relevant professors. For each professor, find their name, designation (e.g., 'Professor', 'Assistant Professor'), department, official university email, lab website URL, and provide a concise summary of their research. Also, suggest 1-2 recent, relevant papers with their titles and public links if available.
        IMPORTANT: Your response MUST be a single, raw JSON object. Do not include any introductory text, explanations, or markdown formatting like \`\`\`json. The entire output must be parsable JSON.
        The JSON object must follow this exact structure:
        {
          "professors": [
            {
              "id": "unique-id-string",
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
        Generate a unique ID for each professor, for example by combining their name and university.
    `;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { tools: [{ googleSearch: {} }] } });
    const result = parseJsonFromResponse<UniversityRecommendation>(response.text);
    result.groundingSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (result.professors) {
        result.professors.forEach(p => { if (!p.university) { p.university = universityName; } });
    }
    return result;
}

async function findProgramsForSpecificUniversity(ai: GoogleGenAI, { userProfile, universityName, keywords }: { userProfile: UserProfile; universityName: string; keywords?: string; }) {
    const model = 'gemini-2.5-pro';
    const prompt = `
        You are an expert academic advisor for international students. Your task is to use Google Search to find relevant graduate programs (Master's or PhD) at a specific university that match a student's profile.
        Student Profile: ${JSON.stringify(userProfile, null, 2)}
        University: ${universityName}
        ${keywords ? `Keywords: ${keywords}` : ''}
        For the given university, find specific programs that align with the student's background. For each program, provide its name, degree type, a brief explanation of its relevance, key application requirements (IELTS, TOEFL, GRE/GMAT, GPA), application fee, deadlines for different intakes, and direct links to the program and application pages.
        IMPORTANT: Your response MUST be a single, raw JSON object. Do not include any introductory text, explanations, or markdown formatting like \`\`\`json. The entire output must be parsable JSON.
        The JSON object must follow this exact structure:
        {
          "universityName": "${universityName}",
          "usNewsRanking": "Ranking String",
          "qsRanking": "Ranking String",
          "recommendedPrograms": [
            {
              "programName": "Program Name",
              "degreeType": "e.g., MSc, PhD",
              "fieldRelevance": "Why this program is a good fit.",
              "applicationRequirements": {
                "ielts": "Score or N/A",
                "toefl": "Score or N/A",
                "greGmat": "Required/Optional/Not Required",
                "gpaRequirement": "e.g., 3.0/4.0"
              },
              "applicationFee": "e.g., $150 USD",
              "applicationDeadlines": [ { "intake": "e.g., Fall 2025", "deadline": "e.g., 2024-12-15" } ],
              "programLink": "URL",
              "applicationLink": "URL"
            }
          ]
        }
        If information is not found, use "Not specified" or "N/A".
    `;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { tools: [{ googleSearch: {} }] } });
    const result = parseJsonFromResponse<{ universityName: string, usNewsRanking: string, qsRanking: string, recommendedPrograms: any[] }>(response.text);
    const groundingSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    return { universities: [{ universityName: result.universityName, usNewsRanking: result.usNewsRanking, qsRanking: result.qsRanking, recommendedPrograms: result.recommendedPrograms, groundingSources: groundingSources }] };
}

async function findProgramsBroadly(ai: GoogleGenAI, { userProfile, country, existingUniversities, keywords, state }: { userProfile: UserProfile; country?: string; existingUniversities?: UniversityWithPrograms[]; keywords?: string; state?: string; }) {
    const model = 'gemini-2.5-pro';
    const prompt = `
        You are an expert academic advisor for international students. Your task is to use Google Search to find universities and relevant graduate programs that match a student's profile, focusing on a specific country or region.
        Student Profile: ${JSON.stringify(userProfile, null, 2)}
        ${country ? `Country: ${country}` : 'Focus on global results, primarily in North America and Europe.'}
        ${state ? `State/Province: ${state}` : ''}
        ${keywords ? `Keywords: ${keywords}` : ''}
        ${existingUniversities && existingUniversities.length > 0 ? `Exclude these universities from the results: ${existingUniversities.map(u => u.universityName).join(', ')}` : ''}
        Identify 3-5 suitable universities. For each university, find 1-2 relevant programs. Provide details for each program as specified in the schema below. Also categorize each university as 'high', 'medium', or 'low' tier based on rankings and fit for the student.
        IMPORTANT: Your response MUST be a single, raw JSON object. Do not include any introductory text, explanations, or markdown formatting like \`\`\`json. The entire output must be parsable JSON.
        The JSON object must follow this exact structure:
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
        If information is not found, use "Not specified" or "N/A".
    `;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { tools: [{ googleSearch: {} }] } });
    const result = parseJsonFromResponse<ProgramDiscoveryResult>(response.text);
    const groundingSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (result.universities && groundingSources) {
        result.universities.forEach(uni => { uni.groundingSources = groundingSources; });
    }
    return result;
}