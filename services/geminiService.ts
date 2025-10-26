import type { UserProfile, ProfessorProfile, AnalysisResult, TieredUniversities, UniversityRecommendation, ProfessorRecommendation, SavedProfessor, ProgramDiscoveryResult, UniversityWithPrograms } from '../types';

/**
 * A helper function to call our secure backend API endpoint.
 * @param action The specific AI task to perform.
 * @param payload The data required for the task.
 * @returns A promise that resolves to the JSON response from the API.
 */
async function callApi<T>(action: string, payload: any): Promise<T> {
    const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown server error occurred.' }));
        throw new Error(errorData.message || `API request failed with status ${response.status}`);
    }

    return response.json();
}


export const extractTextFromFile = async (fileContent: string, mimeType: string): Promise<string> => {
    const result = await callApi<{ content: string }>('extractTextFromFile', { fileContent, mimeType });
    return result.content;
};

export const extractProfileFromCV = async (cvContent: string, cvMimeType: string): Promise<Partial<UserProfile>> => {
    return callApi<Partial<UserProfile>>('extractProfileFromCV', { cvContent, cvMimeType });
};

export const generateAnalysisAndEmail = async (userProfile: UserProfile, professorProfile: ProfessorProfile, selectedPapers?: string[]): Promise<AnalysisResult> => {
    return callApi<AnalysisResult>('generateAnalysisAndEmail', { userProfile, professorProfile, selectedPapers });
};

export const regenerateEmail = async (userProfile: UserProfile, professorProfile: ProfessorProfile, previousResult: AnalysisResult, prompt: string): Promise<Partial<AnalysisResult>> => {
    return callApi<Partial<AnalysisResult>>('regenerateEmail', { userProfile, professorProfile, previousResult, prompt });
};

export const generateSop = async (userProfile: UserProfile, university: string, program: string, targetProfessors?: (SavedProfessor | ProfessorProfile | ProfessorRecommendation)[], selectedPapers?: string[]): Promise<string> => {
    const result = await callApi<{ sopContent: string }>('generateSop', { userProfile, university, program, targetProfessors, selectedPapers });
    return result.sopContent;
};

export const regenerateSop = async (userProfile: UserProfile, originalSop: string, prompt: string): Promise<string> => {
    const result = await callApi<{ sopContent: string }>('regenerateSop', { userProfile, originalSop, prompt });
    return result.sopContent;
};

export const findMatchingUniversities = async (userProfile: UserProfile, country: string, state?: string): Promise<TieredUniversities> => {
    return callApi<TieredUniversities>('findMatchingUniversities', { userProfile, country, state });
};

export const findMatchingProfessors = async (userProfile: UserProfile, universityName: string, department?: string, researchInterest?: string, existingProfessors?: ProfessorRecommendation[]): Promise<UniversityRecommendation> => {
    return callApi<UniversityRecommendation>('findMatchingProfessors', { userProfile, universityName, department, researchInterest, existingProfessors });
};

export const findProgramsForSpecificUniversity = async (userProfile: UserProfile, universityName: string, keywords?: string): Promise<ProgramDiscoveryResult> => {
    return callApi<ProgramDiscoveryResult>('findProgramsForSpecificUniversity', { userProfile, universityName, keywords });
};

export const findProgramsBroadly = async (userProfile: UserProfile, country?: string, existingUniversities?: UniversityWithPrograms[], keywords?: string, state?: string): Promise<ProgramDiscoveryResult> => {
    return callApi<ProgramDiscoveryResult>('findProgramsBroadly', { userProfile, country, existingUniversities, keywords, state });
};