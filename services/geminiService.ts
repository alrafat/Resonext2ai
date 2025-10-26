import { GoogleGenAI, Type } from "@google/genai";
import type { UserProfile, ProfessorProfile, AnalysisResult, TieredUniversities, UniversityRecommendation, ProfessorRecommendation, SavedProfessor, SuggestedPaper, ProgramDiscoveryResult, DegreeInfo, UniversityWithPrograms } from '../types';

// Per instructions, API key is in environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

/**
 * A helper function to safely parse JSON from a model response.
 * The model might sometimes return JSON wrapped in markdown.
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

/**
 * Extracts raw text from a file.
 * @param fileContent Base64 encoded string of the file.
 * @param mimeType The MIME type of the file (e.g., 'application/pdf').
 * @returns A promise that resolves to the extracted text content.
 */
export const extractTextFromFile = async (fileContent: string, mimeType: string): Promise<string> => {
    const model = 'gemini-2.5-flash';

    const textPart = { text: "Extract all text content from the provided file. Return only the raw text, without any additional formatting or commentary." };
    const filePart = {
        inlineData: {
            mimeType: mimeType,
            data: fileContent
        }
    };

    const response = await ai.models.generateContent({
        model: model,
        contents: { parts: [textPart, filePart] },
    });

    return response.text;
};


/**
 * Extracts structured information from a user's CV.
 * @param cvContent Base64 encoded string of the CV PDF.
 * @param cvMimeType The MIME type of the CV file.
 * @returns A promise that resolves to a partial UserProfile object.
 */
export const extractProfileFromCV = async (cvContent: string, cvMimeType: string): Promise<Partial<UserProfile>> => {
    const model = 'gemini-2.5-pro'; 
    
    const textPart = {
        text: `
        Extract the following information from the provided CV.

        - **Full Name** (key: "name")
        - **Bachelor's Degree Info**: An object with "university", "major", and "gpa". (key: "bachelor")
        - **Master's Degree Info**: An object with "university", "major", and "gpa". If not present, use empty strings. (key: "master")
        - **Academic Summary**: A detailed summary of their academic history, including all degrees, universities, majors, and graduation dates. Format this as a concise paragraph. (key: "academicSummary")
        - **Research Interests**: Summarize from projects, publications, or an explicit interests section. (key: "researchInterests")
        - **Relevant Coursework** (key: "relevantCoursework")
        - **Work Experience**: Summarize key roles and accomplishments. (key: "workExperience")
        - **Conference Presentations/Attendance**: List any conferences mentioned. (key: "conferences")
        - **Portfolio/Personal Website URL** (key: "portfolio")
        - **Future Goals**: Summarize from a personal statement or objectives section, if present. (key: "futureGoals")

        Return the information in a single JSON object. If a field is not found, return an empty string for it.
        `
    };

    const cvPart = {
        inlineData: {
            mimeType: cvMimeType,
            data: cvContent
        }
    };
    
    const degreeSchema = {
        type: Type.OBJECT,
        properties: {
            university: { type: Type.STRING },
            major: { type: Type.STRING },
            gpa: { type: Type.STRING },
        },
        required: ["university", "major", "gpa"]
    };
    
    const response = await ai.models.generateContent({
        model: model,
        contents: { parts: [textPart, cvPart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    bachelor: degreeSchema,
                    master: degreeSchema,
                    academicSummary: { type: Type.STRING },
                    researchInterests: { type: Type.STRING },
                    relevantCoursework: { type: Type.STRING },
                    workExperience: { type: Type.STRING },
                    conferences: { type: Type.STRING },
                    portfolio: { type: Type.STRING },
                    futureGoals: { type: Type.STRING },
                },
                required: ["name", "bachelor", "master", "academicSummary", "researchInterests", "relevantCoursework", "workExperience", "conferences", "portfolio", "futureGoals"]
            }
        }
    });

    return parseJsonFromResponse<Partial<UserProfile>>(response.text);
};


/**
 * Analyzes alignment and generates an outreach email.
 * @param userProfile The student's profile.
 * @param professorProfile The professor's profile.
 * @param selectedPapers Optional array of paper titles or links to focus on.
 * @returns A promise that resolves to an AnalysisResult object.
 */
export const generateAnalysisAndEmail = async (userProfile: UserProfile, professorProfile: ProfessorProfile, selectedPapers?: string[]): Promise<AnalysisResult> => {
    const model = 'gemini-2.5-pro';
    
    const prompt = `
    Analyze the alignment between a student's profile and a professor's research. Based on the analysis, generate a concise, professional, and personalized outreach email from the student to the professor.

    **Student Profile:**
    - Name: ${userProfile.name}
    - Bachelor's Degree: ${userProfile.bachelor.major} from ${userProfile.bachelor.university} (GPA: ${userProfile.bachelor.gpa})
    - Master's Degree: ${userProfile.master?.major ? `${userProfile.master.major} from ${userProfile.master.university} (GPA: ${userProfile.master.gpa})` : 'N/A'}
    - Full Academic Summary: ${userProfile.academicSummary}
    - Research Interests: ${userProfile.researchInterests}
    - Relevant Coursework: ${userProfile.relevantCoursework}
    - Work Experience: ${userProfile.workExperience}
    - Conferences Attended/Presented: ${userProfile.conferences || 'N/A'}
    - Portfolio: ${userProfile.portfolio}

    **Professor Profile:**
    - Name: ${professorProfile.name}
    - University: ${professorProfile.university}
    - Department: ${professorProfile.department}
    - Lab Website or Faculty Profile: ${professorProfile.labWebsite}
    - Research Focus: ${professorProfile.researchFocus}
${(selectedPapers && selectedPapers.length > 0) ? `
    **Key Research Papers to Reference:**
    - ${selectedPapers.join('\n- ')}
    Base the email's technical discussion on these specific papers. This is a critical instruction.
    ` : ''}

    **Task:**
    1.  **Alignment Summary:** Briefly summarize the key points of alignment. Highlight specific skills, projects, or interests from the student's full academic history (Bachelors/Masters) that are relevant to the professor's research. If specific papers are provided, mention how the student's background relates to them. This should be 2-4 sentences.
    2.  **Outreach Email:** Draft a professional email from the student (${userProfile.name}) to the professor (${professorProfile.name}). The email should:
        - Briefly introduce the student and their full academic background.
        - Express genuine interest in the professor's research, mentioning the specific projects or papers provided. This is very important.
        - Connect the student's own experience to the professor's work in a compelling way.
        - Inquire about potential graduate research opportunities.
        - Mention that their CV is attached.
        - Keep the email concise and respectful (around 250-300 words).
        - End with a professional closing.
    3.  **Email Subject:** Create a clear and concise subject line for the email. Examples: "Prospective PhD Student Inquiry: [Your Name]", "Inquiry from [Your Name] re: Research in [Professor's Research Area]".

    **Output Format:**
    Return a JSON object with three keys: "alignmentSummary", "outreachEmail", and "emailSubject". The value for each should be a string.
    `;
    
    const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    alignmentSummary: { type: Type.STRING, description: "A summary of the alignment between the student and professor." },
                    outreachEmail: { type: Type.STRING, description: "The full text of the outreach email." },
                    emailSubject: { type: Type.STRING, description: "The subject line for the email." },
                },
                required: ["alignmentSummary", "outreachEmail", "emailSubject"]
            }
        }
    });

    return parseJsonFromResponse<AnalysisResult>(response.text);
};


/**
 * Regenerates an outreach email based on user feedback.
 * @param userProfile The student's profile.
 * @param professorProfile The professor's profile.
 * @param previousResult The previous analysis and email.
 * @param prompt The user's prompt for revision.
 * @returns A promise that resolves to a partial AnalysisResult with new email and subject.
 */
export const regenerateEmail = async (
    userProfile: UserProfile,
    professorProfile: ProfessorProfile,
    previousResult: AnalysisResult,
    prompt: string
): Promise<Partial<AnalysisResult>> => {
    const model = 'gemini-2.5-pro';

    const regenerationPrompt = `
    You are an expert academic editor. A student is writing an outreach email to a professor.
    Your task is to revise the ORIGINAL email based on the student's request.

    **Student Profile:**
    - Name: ${userProfile.name}
    - Academic History: ${userProfile.academicSummary}
    - Research Interests: ${userProfile.researchInterests}

    **Professor Profile:**
    - Name: ${professorProfile.name}
    - Research Focus: ${professorProfile.researchFocus}

    **Original Email Subject:**
    ${previousResult.emailSubject}

    **Original Email Body:**
    ${previousResult.outreachEmail}

    **Student's Revision Request:**
    "${prompt}"

    **Your Task:**
    Rewrite the email subject and body based on the student's request.
    - Adhere to the request closely.
    - Maintain a professional and respectful tone.
    - Ensure the core purpose of the email (inquiring about research opportunities) remains clear.
    - Keep the email concise.

    **Output Format:**
    Return a JSON object with two keys: "outreachEmail" and "emailSubject".
    `;

    const response = await ai.models.generateContent({
        model: model,
        contents: regenerationPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    outreachEmail: { type: Type.STRING, description: "The revised full text of the outreach email." },
                    emailSubject: { type: Type.STRING, description: "The revised subject line for the email." },
                },
                required: ["outreachEmail", "emailSubject"]
            }
        }
    });
    
    return parseJsonFromResponse<Partial<AnalysisResult>>(response.text);
};


/**
 * Generates a Statement of Purpose.
 * @param userProfile The student's full profile.
 * @param university The target university.
 * @param program The target program.
 * @param targetProfessors Optional array of professors to mention.
 * @param selectedPapers Optional array of paper titles or links to focus on.
 * @returns A promise that resolves to the full SOP content string.
 */
export const generateSop = async (
    userProfile: UserProfile,
    university: string,
    program: string,
    targetProfessors?: (SavedProfessor | ProfessorProfile | ProfessorRecommendation)[],
    selectedPapers?: string[]
): Promise<string> => {
    const model = 'gemini-2.5-pro';

    const prompt = `
    You are an expert Statement of Purpose (SOP) writer and editor for international university applications. Your task is to generate a complete, tailored SOP.

    **Instructions:**
    - Write in formal, fluent academic English.
    - Maintain an authentic tone reflecting the student's profile.
    - Structure the SOP logically with an introduction, academic journey, research fit, and future goals.
    - Use active voice and specific examples from the student's profile.
    - Seamlessly integrate keywords and themes from the target program or professors.
    - Target length: 800–1200 words.
    ${(userProfile.sampleSops && userProfile.sampleSops.length > 0) || userProfile.demoSop ? `
    - **Crucially, you must follow the tone, style, and structure of the provided example SOPs.** Adapt their narrative flow and writing voice to the student's details and the target university. This is the most important instruction.
    ` : ''}

    ---
    **INPUT DATA**

    **Student Profile:**
    - Name: ${userProfile.name}
    - Academic History: ${userProfile.academicSummary}
    - Bachelor's Degree: ${userProfile.bachelor.major} from ${userProfile.bachelor.university} (GPA: ${userProfile.bachelor.gpa})
    - Master's Degree: ${userProfile.master?.major ? `${userProfile.master.major} from ${userProfile.master.university} (GPA: ${userProfile.master.gpa})` : 'N/A'}
    - Research Interests: ${userProfile.researchInterests}
    - Relevant Coursework: ${userProfile.relevantCoursework}
    - Work Experience: ${userProfile.workExperience}
    - Conferences Attended/Presented: ${userProfile.conferences || 'N/A'}
    - Portfolio: ${userProfile.portfolio}
    - Stated Future Goals: ${userProfile.futureGoals || 'Not specified.'}

    **Target Application:**
    - University: ${university}
    - Program: ${program}
    ${targetProfessors && targetProfessors.length > 0 ? `
    **Target Professors to Mention:**
    ${targetProfessors.map(p => `- Dr. ${p.name}: Specializes in ${'researchSummary' in p ? p.researchSummary : ('researchFocus' in p ? p.researchFocus : '')}`).join('\n')}
    ` : ''}
    ${(selectedPapers && selectedPapers.length > 0) ? `
    **Key Research Papers to Mention:**
    - ${selectedPapers.join('\n- ')}
    Weave references to these specific papers into the SOP to demonstrate deep interest and alignment.
    ` : ''}

    ${userProfile.sampleSops && userProfile.sampleSops.filter(s => s.content.trim()).length > 0 ? `
    **Best Example SOPs for Style Reference (Primary):**
    ---
    ${userProfile.sampleSops.filter(s => s.content.trim()).map((sop, index) => `Sample ${index + 1}:\n${sop.content}`).join('\n---\n')}
    ---
    ` : ''}

    ${userProfile.demoSop ? `
    **User's Own Demo SOP for Additional Context:**
    ---
    ${userProfile.demoSop}
    ---
    ` : ''}

    ---
    **YOUR TASK**

    Generate a complete Statement of Purpose based on all the information provided. The SOP should be a single block of text. Do not use markdown formatting like headers (e.g., ### Introduction).
    `;

    const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    sopContent: { type: Type.STRING, description: "The full text of the Statement of Purpose." },
                },
                required: ["sopContent"]
            }
        }
    });
    
    const result = parseJsonFromResponse<{sopContent: string}>(response.text);
    return result.sopContent;
};

/**
 * Regenerates an SOP based on user feedback.
 * @param userProfile The student's profile for context.
 * @param originalSop The original SOP text.
 * @param prompt The user's revision request.
 * @returns A promise that resolves to the new SOP content string.
 */
export const regenerateSop = async (
    userProfile: UserProfile,
    originalSop: string,
    prompt: string
): Promise<string> => {
    const model = 'gemini-2.5-pro';

    const regenerationPrompt = `
    You are an expert academic editor. A student has written a Statement of Purpose and wants you to revise it based on their request.

    **Student Profile Context:**
    - Name: ${userProfile.name}
    - Academic History: ${userProfile.academicSummary}
    - Research Interests: ${userProfile.researchInterests}
    - Stated Future Goals: ${userProfile.futureGoals || 'Not specified.'}

    **Original Statement of Purpose:**
    ---
    ${originalSop}
    ---

    **Student's Revision Request:**
    "${prompt}"

    **Your Task:**
    Rewrite the entire Statement of Purpose based on the student's request.
    - Adhere to the request closely.
    - Maintain a formal, fluent academic English tone.
    - Ensure the core narrative and structure are preserved unless the request asks for a major change.
    - Refer to the provided style references for the student's preferred tone and structure.
    - The output should be the full, revised SOP text. Do not add any extra commentary or markdown.

    ${userProfile.sampleSops && userProfile.sampleSops.filter(s => s.content.trim()).length > 0 ? `
    **Best Example SOPs for Style Reference (Primary):**
    ---
    ${userProfile.sampleSops.filter(s => s.content.trim()).map((sop, index) => `Sample ${index + 1}:\n${sop.content}`).join('\n---\n')}
    ---
    ` : ''}

    ${userProfile.demoSop ? `
    **User's Own Demo SOP for Additional Context:**
    ---
    ${userProfile.demoSop}
    ---
    ` : ''}

    **Output Format:**
    Return a JSON object with a single key: "sopContent".
    `;

    const response = await ai.models.generateContent({
        model: model,
        contents: regenerationPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    sopContent: { type: Type.STRING, description: "The full, revised text of the Statement of Purpose." },
                },
                required: ["sopContent"]
            }
        }
    });
    
    const result = parseJsonFromResponse<{sopContent: string}>(response.text);
    return result.sopContent;
};


/**
 * Finds universities in a country that match a student's profile, categorized by tier.
 * @param userProfile The student's profile.
 * @param country The country to search for universities in.
 * @param state Optional state/province to narrow the search.
 * @returns A promise that resolves to a TieredUniversities object.
 */
export const findMatchingUniversities = async (userProfile: UserProfile, country: string, state?: string): Promise<TieredUniversities> => {
    const model = 'gemini-2.5-pro';
    
    let prompt = `
    You are an expert academic research assistant. Your task is to find universities in ${country} that match a student's profile and categorize them by tier. You MUST use your search tool.
    `;

    if (state) {
        prompt += `
    **Location Constraint:** If a state or province is provided, you MUST limit your search to universities within **${state}**, ${country}.
    `;
    }

    prompt += `
    **Student Profile:**
    - Field of Study: ${userProfile.bachelor.major}
    - Research Interests: ${userProfile.researchInterests}
    - Academic History: ${userProfile.academicSummary}

    **Task:**
    1.  List universities in the specified location that are known for strong graduate programs in the student's field.
    2.  For each university, you MUST use your search tool to find its latest "Best Global Universities" ranking from U.S. News & World Report.
    3.  Categorize the universities into three tiers:
        - **highTier**: Ambitious, top-tier programs. List 3-5.
        - **mediumTier**: Strong, well-regarded programs that are a good match. List 3-5.
        - **lowTier**: Solid, potentially safer options with good research in the area. List 3-5.
    
    **Data Extraction Requirements (for each university):**
    - **name**: The full, official name of the university.
    - **country**: The country where the university is located.
    - **usNewsRanking**: The U.S. News Best Global Universities ranking as a string (e.g., "#12", "Tied #56", or "Not Ranked"). If a ranking is found, you must include it.

    **Output Format:**
    You MUST return the final result as a single, valid JSON object. Do not include any other text or markdown formatting like \`\`\`json. The structure must be:
    {
      "highTier": [ { "name": "...", "country": "...", "usNewsRanking": "..." } ],
      "mediumTier": [ { "name": "...", "country": "...", "usNewsRanking": "..." } ],
      "lowTier": [ { "name": "...", "country": "...", "usNewsRanking": "..." } ]
    }
    `;

    const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
            tools: [{googleSearch: {}}],
        }
    });

    const result = parseJsonFromResponse<TieredUniversities>(response.text);
    result.groundingSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    return result;
};

/**
 * Finds professors at a university that match a student's profile.
 * @param userProfile The student's profile.
 * @param universityName The name of the university to search in.
 * @param department Optional department to narrow the search.
 * @param researchInterest Optional research interest to narrow the search.
 * @param existingProfessors Optional array of professors to exclude from results.
 * @returns A promise that resolves to a UniversityRecommendation object.
 */
export const findMatchingProfessors = async (
    userProfile: UserProfile, 
    universityName: string, 
    department?: string, 
    researchInterest?: string,
    existingProfessors?: ProfessorRecommendation[]
): Promise<UniversityRecommendation> => {
    const model = 'gemini-2.5-pro';
    
    let prompt = `
    You are an expert academic research assistant. Your task is to identify professors at ${universityName} whose research aligns with a student's profile. You MUST use your search tool to find real, verifiable information.

    **Student Profile:**
    - Field of Study: ${userProfile.bachelor.major}
    - Research Interests: ${userProfile.researchInterests}
    - Academic History: ${userProfile.academicSummary}
    `;

    if (department) {
        prompt += `\n- **Constraint:** Focus your search within the **${department}** department.`;
    }
    if (researchInterest) {
        prompt += `\n- **Constraint:** Specifically look for research related to **${researchInterest}**.`;
    }
    if (existingProfessors && existingProfessors.length > 0) {
        prompt += `
        \n- **Constraint:** You MUST exclude the following professors from your results as they have already been found:
          - ${existingProfessors.map(p => p.name).join('\n          - ')}
        `;
    }

    prompt += `
    **Search and Data Extraction Task:**
    For ${universityName}, find up to 10 ${existingProfessors && existingProfessors.length > 0 ? 'more' : ''} professors. For each professor, you MUST perform a web search to find the following information. Do not invent or hallucinate information.
    
    1.  **Full Name:** The professor's full name.
    2.  **Designation:** Their current academic title (e.g., Assistant Professor). Exclude any professors with "Emeritus" in their title.
    3.  **Department:** Their primary department.
    4.  **Research Summary:** A brief (2-3 sentences) summary of their research, based on their university profile or lab website.
    5.  **Lab Website:** Their official university faculty profile URL or lab website URL. This must be a real, working URL.
    6.  **Email:** Their university email address, if publicly available on their profile.
    7.  **Suggested Papers:** Use your search tool to find their Google Scholar page or publication list. Identify 2-3 of their most recent or highly cited relevant research papers. For each paper, provide:
        - \`title\`: The full, correct title of the paper.
        - \`link\`: A direct, working URL to the paper's page (e.g., on Google Scholar, ACM Digital Library, arXiv, or the publisher's site).

    **Output Format:**
    You MUST return the final result as a single, valid JSON object with the following structure. Do not include any other text or markdown formatting like \`\`\`json.

    {
      "universityName": "${universityName}",
      "professors": [
        {
          "id": "A unique ID, e.g., JaneDoe-UniversityofScience",
          "name": "Professor's Full Name",
          "designation": "Professor's Title",
          "university": "${universityName}",
          "department": "Professor's Department",
          "researchSummary": "A 2-3 sentence summary of their research.",
          "labWebsite": "A valid URL to their lab or profile page.",
          "email": "Their public email address or an empty string.",
          "suggestedPapers": [
            {
              "title": "Full title of a real paper.",
              "link": "A valid URL to the paper."
            },
            {
              "title": "Full title of another real paper.",
              "link": "A valid URL to that paper."
            }
          ]
        }
      ]
    }

    If a field (like email) cannot be found, return an empty string. If no papers can be reliably found, return an empty array for "suggestedPapers".
    `;

    const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
            tools: [{googleSearch: {}}],
        }
    });
    
    const result = parseJsonFromResponse<UniversityRecommendation>(response.text);
    result.groundingSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

    // The model sometimes forgets to add the university name to each professor. Let's ensure it's there.
    if (result.professors) {
        result.professors.forEach(p => {
            if (!p.university) {
                p.university = universityName;
            }
        });
    }

    return result;
};

/**
 * Generates keyword suggestions for research interest searches based on a user's profile.
 * @param userProfile The student's profile.
 * @returns A promise that resolves to an array of keyword strings.
 */
export const generateResearchInterestSuggestions = async (userProfile: UserProfile): Promise<string[]> => {
    const model = 'gemini-2.5-flash';

    const prompt = `
    Based on the following student profile, suggest 5-7 concise keywords or short phrases (2-3 words max) that would be effective for searching for professors with similar research interests.

    **Student Profile:**
    - Field of Study: ${userProfile.bachelor.major}
    - Research Interests: ${userProfile.researchInterests}
    - Academic Summary: ${userProfile.academicSummary}

    **Task:**
    Generate a list of keywords. Examples: "Machine Learning", "Computational Linguistics", "AI Ethics", "Robotics", "Data Science".

    **Output Format:**
    Return a single JSON object with one key: "keywords", which is an array of strings.
    `;

    const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    keywords: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                    },
                },
                required: ["keywords"],
            }
        }
    });

    const result = parseJsonFromResponse<{ keywords: string[] }>(response.text);
    return result.keywords;
};


/**
 * Generates keyword suggestions for program searches based on a user's profile.
 * @param userProfile The student's profile.
 * @returns A promise that resolves to an array of keyword strings.
 */
export const generateProgramKeywordSuggestions = async (userProfile: UserProfile): Promise<string[]> => {
    const model = 'gemini-2.5-flash';

    const prompt = `
    Based on the following student profile, suggest 5-7 concise keywords or short phrases (2-3 words max) that would be effective for searching for relevant graduate programs.

    **Student Profile:**
    - Field of Study: ${userProfile.bachelor.major}
    - Research Interests: ${userProfile.researchInterests}
    - Academic Summary: ${userProfile.academicSummary}

    **Task:**
    Generate a list of keywords. Examples: "Machine Learning", "Computational Linguistics", "AI Ethics", "Robotics", "Data Science".

    **Output Format:**
    Return a single JSON object with one key: "keywords", which is an array of strings.
    `;

    const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    keywords: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                    },
                },
                required: ["keywords"],
            }
        }
    });

    const result = parseJsonFromResponse<{ keywords: string[] }>(response.text);
    return result.keywords;
};


/**
 * Finds relevant programs at a specific university.
 * @param userProfile The student's profile.
 * @param universityName The name of the university to search.
 * @param keywords Optional keywords to refine the program search.
 * @returns A promise that resolves to a ProgramDiscoveryResult object.
 */
export const findProgramsForSpecificUniversity = async (userProfile: UserProfile, universityName: string, keywords?: string): Promise<ProgramDiscoveryResult> => {
    const model = 'gemini-2.5-pro';

    const prompt = `
    You are an expert academic advisor. Your goal is to find suitable graduate programs (Master's or PhD) for an international student at a specific university, based on their profile and real-time web search results.

    **Student Profile:**
    - Field of Study: ${userProfile.bachelor.major}
    - Research Interests: ${userProfile.researchInterests}
    - Academic Background: ${userProfile.academicSummary}

    **Target University:**
    ${universityName}

    ${keywords ? `**Program Keywords:**
    - The student is particularly interested in programs related to these keywords: **${keywords}**. You MUST prioritize programs that match these keywords.` : ''}

    **Task:**
    1.  First, use your search tool to find the latest "Best Global Universities" ranking from U.S. News & World Report AND the latest QS World University Ranking for ${universityName}.
    2.  Then, use your search tool to find graduate programs (Master's/PhD) at ${universityName} that are relevant to the student's profile. Prioritize official university websites (.edu, .ac domains).
    3.  For each relevant program you find (up to 5), extract the detailed application requirements for international students.
    4.  Present the results in a structured JSON format as specified below.

    **Data Extraction Requirements (for each program):**
    - **programName**: The full name of the program (e.g., "Master of Data Science").
    - **degreeType**: The degree awarded (e.g., "MSc", "MA", "PhD").
    - **fieldRelevance**: A short (1-2 sentence) description of why this program is a good match for the student's profile.
    - **applicationRequirements**: An object containing: "ielts", "toefl", "greGmat", "gpaRequirement".
    - **applicationFee**: The fee in the local currency or USD (e.g., "CAD 168.25").
    - **applicationDeadlines**: An array of objects, where each object represents an application cycle with "intake" and "deadline".
    - **programLink**: The direct, official URL to the program's detail page.
    - **applicationLink**: The direct, official URL to the application portal.

    If a piece of information is not explicitly available, you MUST use the string "Not specified on official website".

    **Output Format:**
    You MUST return the final result as a single, valid JSON object with the structure: { "universityName": "...", "usNewsRanking": "...", "qsRanking": "...", "recommendedPrograms": [...] }.
    `;
    
    const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
            tools: [{googleSearch: {}}],
        }
    });
    
    const result = parseJsonFromResponse<{ universityName: string, usNewsRanking: string, qsRanking: string, recommendedPrograms: any[] }>(response.text);
    const groundingSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

    return {
        universities: [{
            universityName: result.universityName,
            usNewsRanking: result.usNewsRanking,
            qsRanking: result.qsRanking,
            recommendedPrograms: result.recommendedPrograms,
            groundingSources: groundingSources,
        }]
    };
};

/**
 * Finds relevant universities and programs based on profile and optional country.
 * @param userProfile The student's profile.
 * @param country Optional country to filter the search.
 * @param existingUniversities Optional array of universities to exclude from results.
 * @param keywords Optional keywords to refine the program search.
 * @param state Optional state/province to refine the search within a country.
 * @returns A promise that resolves to a ProgramDiscoveryResult object.
 */
export const findProgramsBroadly = async (userProfile: UserProfile, country?: string, existingUniversities?: UniversityWithPrograms[], keywords?: string, state?: string): Promise<ProgramDiscoveryResult> => {
    const model = 'gemini-2.5-pro';

    let prompt = `
    You are an expert academic advisor. Your goal is to find suitable graduate programs for an international student by searching the web and categorizing universities by tier.

    **Student Profile:**
    - Field of Study: ${userProfile.bachelor.major}
    - Research Interests: ${userProfile.researchInterests}
    - Academic Background: ${userProfile.academicSummary}
    
    ${keywords ? `**Program Keywords:**
    - The student is particularly interested in programs related to these keywords: **${keywords}**. You MUST prioritize finding programs that match these keywords.` : ''}

    **Task:**
    1. Based on the student's profile, identify a list of 5-9 ${existingUniversities && existingUniversities.length > 0 ? 'more' : ''} highly suitable universities.
    `;
    
    if (country && state) {
        prompt += `2. **IMPORTANT:** Limit your search for universities to the state/province of **${state}** in the country of **${country}**.`;
    } else if (country) {
        prompt += `2. **IMPORTANT:** Limit your search for universities to the country of **${country}**.`;
    } else {
        prompt += '2. Your search for universities can be global, but prioritize well-regarded institutions in major academic hubs (e.g., USA, UK, Canada, Europe, Australia).';
    }

    prompt += `
    3. **IMPORTANT**: For EACH university, you MUST use your search tool to find its latest "Best Global Universities" ranking from U.S. News & World Report AND its latest QS World University Ranking.
    4. **IMPORTANT**: For EACH university, you MUST assign a tier: "high", "medium", or "low", based on its academic standing and relevance to the student's ambitious, target, or safer application strategy.
    `;

    if (existingUniversities && existingUniversities.length > 0) {
        prompt += `
    5. **IMPORTANT:** You MUST exclude the following universities from your search, as they have already been listed:
        - ${existingUniversities.map(u => u.universityName).join('\n        - ')}
        `;
    }

    prompt += `
    ${existingUniversities && existingUniversities.length > 0 ? '6.' : '5.'} For EACH university you identify, use your search tool to find 1-3 of their MOST relevant graduate programs (Master's or PhD).
    ${existingUniversities && existingUniversities.length > 0 ? '7.' : '6.'} For EACH program, extract the detailed application information for international students. You MUST search for official university websites.
    ${existingUniversities && existingUniversities.length > 0 ? '8.' : '7.'} Structure the entire output as a single JSON object.

    If you cannot find a piece of information, use the string "Not specified on official website". If deadlines are not found, use an empty array.

    **Output Format:**
    You MUST return the final result as a single, valid JSON object with the key "universities" which is an array. Each object in the array represents a university and must have the following structure. Do not include any other text or markdown formatting like \`\`\`json.
    
    {
      "universities": [
        {
          "universityName": "Example University",
          "usNewsRanking": "#10",
          "qsRanking": "#12",
          "tier": "high",
          "recommendedPrograms": [
            {
              "programName": "MSc in Example Science",
              "degreeType": "MSc",
              "fieldRelevance": "A short description of why this program is a good match.",
              "applicationRequirements": {
                "ielts": "7.0",
                "toefl": "100",
                "greGmat": "Required",
                "gpaRequirement": "3.5/4.0"
              },
              "applicationFee": "150 USD",
              "applicationDeadlines": [
                { "intake": "Fall 2025", "deadline": "Jan 15, 2025" }
              ],
              "programLink": "https://example.edu/program",
              "applicationLink": "https://example.edu/apply"
            }
          ]
        }
      ]
    }
    `;

    const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
            tools: [{googleSearch: {}}],
        }
    });
    
    const result = parseJsonFromResponse<ProgramDiscoveryResult>(response.text);
    const groundingSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

    if (result.universities && groundingSources) {
        result.universities.forEach(uni => {
            uni.groundingSources = groundingSources;
        });
    }

    return result;
};
