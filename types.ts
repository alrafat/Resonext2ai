// FIX: Centralized type definitions to resolve module resolution errors across the application.
// All components now import their required types from this single source of truth.

export type AppView = 'home' | 'profile' | 'discover' | 'generate' | 'saved';

export interface SampleSop {
  id: string;
  content: string; // This will hold the extracted text
  fileName?: string;
  fileContent?: string; // base64
  fileMimeType?: string;
}

export interface DegreeInfo {
    university: string;
    major: string;
    gpa: string;
}

export interface UserProfile {
  id: string;
  profileName: string;
  name: string;
  bachelor: DegreeInfo;
  master?: DegreeInfo;
  researchInterests: string;
  relevantCoursework: string;
  academicSummary: string;
  workExperience: string;
  conferences?: string;
  portfolio: string;
  futureGoals?: string;
  cvContent: string;
  cvFileName:string;
  cvMimeType?: string;
  demoSop?: string;
  sampleSops?: SampleSop[];
}

export interface ProfessorProfile {
  name: string;
  university: string;
  department: string;
  email: string;
  labWebsite: string;
  researchFocus: string;
  selectedPaperLink?: string;
}

export interface AnalysisResult {
  alignmentSummary: string;
  outreachEmail: string;
  emailSubject: string;
}

export interface University {
    name: string;
    country: string;
    usNewsRanking?: string;
    qsRanking?: string;
}

export interface TieredUniversities {
    highTier: University[];
    mediumTier: University[];
    lowTier: University[];
    groundingSources?: any[];
}

export interface SuggestedPaper {
    title: string;
    link: string;
}

export interface ProfessorRecommendation {
    id: string;
    name: string;
    university: string;
    department: string;
    researchSummary: string;
    labWebsite: string;
    email: string;
    designation?: string;
    suggestedPapers?: SuggestedPaper[];
}

export interface UniversityRecommendation {
    universityName: string;
    professors: ProfessorRecommendation[];
    groundingSources?: any[];
}

// Updated to support manual entries with more link types
export interface SavedProfessor extends ProfessorRecommendation {
    universityProfileLink?: string;
    googleScholarLink?: string;
    feedback: string;
    emailSent: boolean;
    outcome: 'pending' | 'positive' | 'negative';
    // Include the analysis result if it was generated and saved for this professor
    alignmentSummary?: string;
    outreachEmail?: string;
    emailSubject?: string;
}

export interface Sop {
    id: string;
    profileId: string; // Link to the user profile used to generate it
    university: string;
    program: string;
    content: string;
    targetProfessors?: { name: string; researchSummary: string; }[];
    createdAt: string;
    updatedAt: string;
}

export interface ApplicationDeadline {
  intake: string;
  deadline: string;
}

export interface ProgramDetails {
  programName: string;
  degreeType: string;
  fieldRelevance: string;
  applicationRequirements: {
    ielts: string;
    toefl: string;
    greGmat: string;
    gpaRequirement: string;
  };
  applicationFee: string;
  applicationDeadlines: ApplicationDeadline[];
  programLink: string;
  applicationLink: string;
}

export interface UniversityWithPrograms {
  universityName: string;
  usNewsRanking?: string;
  qsRanking?: string;
  tier?: 'high' | 'medium' | 'low';
  recommendedPrograms: ProgramDetails[];
  groundingSources?: any[];
}

export interface ProgramDiscoveryResult {
  universities: UniversityWithPrograms[];
}


export interface SavedProgram extends ProgramDetails {
    id: string;
    universityName: string;
}