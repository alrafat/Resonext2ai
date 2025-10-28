


import React, { useState, useMemo, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { UserProfile, ProfessorProfile, AnalysisResult, AppView, SavedProfessor, TieredUniversities, ProfessorRecommendation, Sop, ProgramDiscoveryResult, ProgramDetails, SavedProgram, UniversityWithPrograms, UserData } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { generateAnalysisAndEmail, regenerateEmail, generateSop, findProgramsForSpecificUniversity, findProgramsBroadly, isGeminiConfigured } from './services/geminiService';
import * as dataService from './services/dataService';
import { isSupabaseConfigured } from './services/supabaseClient';

// Components
import { Login } from './components/Login';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { Home } from './components/Home';
import { ProfileForm } from './components/ProfileForm';
import { SavedTab } from './components/SavedTab';
import { SopGenerationModal } from './components/SopGenerationModal';
import { AnalysisResultModal } from './components/AnalysisResultModal';
import { DiscoverView } from './components/DiscoverView';
import { GenerateView } from './components/GenerateView';
import { DiscoveryStage } from './components/DiscoveryTab';
import { ConfigurationSetup } from './components/ConfigurationSetup';
import { Card } from './components/ui/Card';


const createNewProfile = (name: string): UserProfile => ({
    id: crypto.randomUUID(),
    profileName: name,
    name: '',
    bachelor: { university: '', major: '', gpa: '' },
    master: { university: '', major: '', gpa: '' },
    researchInterests: '',
    relevantCoursework: '', academicSummary: '', workExperience: '', conferences: '', portfolio: '',
    futureGoals: '', cvContent: '', cvFileName: '', cvMimeType: '', demoSop: '', sampleSops: []
});

type SopGenerationState = {
    isOpen: boolean;
    professor: ProfessorProfile | ProfessorRecommendation | SavedProfessor | null;
    university: string;
    papers: string[];
    profileId?: string;
}

interface AnalysisModalState {
  isOpen: boolean;
  result: AnalysisResult | null;
  professor: ProfessorProfile | ProfessorRecommendation | SavedProfessor | null;
}

function App() {
     // --- Critical Configuration Check ---
    if (!isSupabaseConfigured()) {
        return <ConfigurationSetup />;
    }
    
    // --- App-level State ---
    const [session, setSession] = useState<Session | null>(null);
    const [authError, setAuthError] = useState<string | null>(null);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // --- User-Specific Data State ---
    const [profiles, setProfiles] = useState<UserProfile[]>([]);
    const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
    const [savedProfessors, setSavedProfessors] = useState<SavedProfessor[]>([]);
    const [savedPrograms, setSavedPrograms] = useState<SavedProgram[]>([]);
    const [sops, setSops] = useState<Sop[]>([]);

    // Theme & View State
    const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'dark');
    const [activeView, setActiveView] = useLocalStorage<AppView>('activeView', 'home');
    
    // --- Component & Loading States ---
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [analyzingSavedProfId, setAnalyzingSavedProfId] = useState<string | null>(null);
    const [discoveryStage, setDiscoveryStage] = useState<DiscoveryStage>('search');
    const [countryQuery, setCountryQuery] = useState('');
    const [stateQuery, setStateQuery] = useState('');
    const [universityQuery, setUniversityQuery] = useState('');
    const [departmentQuery, setDepartmentQuery] = useState('');
    const [interestQuery, setInterestQuery] = useState('');
    const [universities, setUniversities] = useState<TieredUniversities | null>(null);
    const [professors, setProfessors] = useState<ProfessorRecommendation[]>([]);
    const [groundingSources, setGroundingSources] = useState<any[]>([]);
    const [selectedUniversity, setSelectedUniversity] = useState<string | null>(null);
    const [selectedProfessor, setSelectedProfessor] = useState<ProfessorRecommendation | null>(null);
    const [programDiscoveryResults, setProgramDiscoveryResults] = useState<ProgramDiscoveryResult | null>(null);
    const [programStateQuery, setProgramStateQuery] = useState('');
    const [isDiscoveryLoading, setIsDiscoveryLoading] = useState(false);
    const [isSopLoading, setIsSopLoading] = useState(false);
    const [isProgramDiscoveryLoading, setIsProgramDiscoveryLoading] = useState(false);
    const [isProgramDiscoveryLoadMoreLoading, setIsProgramDiscoveryLoadMoreLoading] = useState(false);
    const [sopGenerationState, setSopGenerationState] = useState<SopGenerationState>({ isOpen: false, professor: null, university: '', papers: []});
    const [newlyCreatedSopId, setNewlyCreatedSopId] = useState<string | null>(null);
    const [analysisModalState, setAnalysisModalState] = useState<AnalysisModalState>({ isOpen: false, result: null, professor: null });

    // --- Supabase Session Management ---
    useEffect(() => {
        dataService.getSession().then(({ data: { session } }) => {
          setSession(session);
          setIsInitialLoad(false); 
        });
    
        const { data: { subscription } } = dataService.onAuthStateChange((_event, session) => {
          setSession(session);
        });
    
        return () => subscription?.unsubscribe();
    }, []);

    // --- Data Synchronization ---
    useEffect(() => {
        if (!session?.user?.email) {
            setProfiles([]);
            setActiveProfileId(null);
            setSavedProfessors([]);
            setSavedPrograms([]);
            setSops([]);
            return;
        }

        let isMounted = true;
        
        const loadAndInitializeUserData = async () => {
            try {
                const email = session.user!.email!;
                const existingData = await dataService.getUserData(email);

                if (!isMounted) return;

                if (existingData) {
                    const userProfiles = existingData.profiles || [];
                    const userActiveProfileId = existingData.activeProfileId && userProfiles.some(p => p.id === existingData.activeProfileId)
                        ? existingData.activeProfileId
                        : (userProfiles.length > 0 ? userProfiles[0].id : null);
                    
                    setProfiles(userProfiles);
                    setActiveProfileId(userActiveProfileId);
                    setSavedProfessors(existingData.savedProfessors || []);
                    setSavedPrograms(existingData.savedPrograms || []);
                    setSops(existingData.sops || []);
                } else {
                    // **THE FIX**: This is the new, safe logic.
                    // If no data is found, do NOT create a default profile automatically.
                    // Instead, set an empty state. The UI (`ProfileForm`) will now
                    // prompt the user to create their first profile, making the
                    // action explicit and preventing accidental data overwrites.
                    setProfiles([]);
                    setActiveProfileId(null);
                    setSavedProfessors([]);
                    setSavedPrograms([]);
                    setSops([]);
                }
            } catch (e: any) {
                console.error("Fatal error: Could not load user data.", e);
                setError(`Could not load your profile due to a database error. Please check your connection and refresh. Details: ${e.message}`);
            }
        };

        loadAndInitializeUserData();

        return () => { isMounted = false; };
    }, [session]);


    // Save data back to the data service whenever it changes for the logged-in user
    useEffect(() => {
        if (isInitialLoad || !session?.user?.email) return;
        
        // This safeguard prevents saving an empty state during the initial login/load flicker,
        // but the main data loss prevention is now in the data loading useEffect.
        // We only save if there is at least one profile, which is now only created via user action.
        if (profiles.length === 0 && activeProfileId === null) {
            // This is a valid state for a new user, but we don't want to save "nothing"
            // over potentially existing data if there was a load flicker.
            // The first save will happen when the first profile is created.
            return;
        }

        const currentDataInState: UserData = { profiles, activeProfileId, savedProfessors, savedPrograms, sops };
        dataService.saveUserData(session.user.email, currentDataInState);
    }, [profiles, activeProfileId, savedProfessors, savedPrograms, sops, session, isInitialLoad]);

    // --- Derived State ---
    const activeProfile = useMemo(() => profiles.find(p => p.id === activeProfileId) || null, [profiles, activeProfileId]);
    const isProfileComplete = useMemo(() => !!(activeProfile?.name && activeProfile.academicSummary && activeProfile.researchInterests && activeProfile.bachelor?.major), [activeProfile]);
    const savedProfessorIds = useMemo(() => new Set(savedProfessors.map(p => p.id)), [savedProfessors]);
    const savedProgramIds = useMemo(() => new Set(savedPrograms.map(p => p.id)), [savedPrograms]);
    
    // --- Theme Management ---
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
    }, [theme]);
    
    // --- Handlers ---
    const handleLogin = async (email: string, pass: string) => {
        setAuthError(null);
        setError(null);
        const { error } = await dataService.signIn(email, pass);
        if (error) {
            setAuthError(error.message);
        } else {
            // Let the data sync useEffect handle setting the correct view
        }
    };

    const handleSignUp = async (fullName: string, email: string, pass: string) => {
        setAuthError(null);
        setError(null);
        const { error } = await dataService.signUp(email, pass, { fullName });
        if (error) {
            setAuthError(error.message);
        } else {
            setActiveView('profile'); // New user should be directed to profile creation
        }
    };
    
    const handleLogout = async () => {
        const { error } = await dataService.signOut();
        if (error) {
            console.error('Error logging out:', error.message);
        }
        setSession(null); 
        setProfiles([]);
        setActiveProfileId(null);
        setSavedProfessors([]);
        setSavedPrograms([]);
        setSops([]);
        setActiveView('home');
    };

    const handleSaveAnalysisToProfessor = (profToSave: ProfessorProfile | ProfessorRecommendation | SavedProfessor, result: AnalysisResult) => {
        const existingProf = savedProfessors.find(p => p.name === profToSave.name && p.university === profToSave.university);

        if (existingProf) {
            setSavedProfessors(prev => prev.map(p => 
                p.id === existingProf.id ? { ...p, ...result } : p
            ));
        } else {
            const newSavedProf: SavedProfessor = {
                id: 'id' in profToSave ? profToSave.id : `${profToSave.name}-${profToSave.university}`.replace(/\s+/g, '-'),
                name: profToSave.name,
                university: profToSave.university,
                department: profToSave.department,
                researchSummary: 'researchSummary' in profToSave ? profToSave.researchSummary : ('researchFocus' in profToSave ? profToSave.researchFocus : ''),
                labWebsite: profToSave.labWebsite,
                email: profToSave.email,
                feedback: '',
                emailSent: false,
                outcome: 'pending',
                ...result
            };
            if('designation' in profToSave) newSavedProf.designation = profToSave.designation;
            if('suggestedPapers' in profToSave) newSavedProf.suggestedPapers = profToSave.suggestedPapers;
            
            setSavedProfessors(prev => [...prev, newSavedProf]);
        }
    };

    const handleRegenerateForModal = async (prompt: string) => {
        if (!activeProfile || !analysisModalState.professor || !analysisModalState.result) {
            setError("Cannot regenerate. Missing original context.");
            return;
        }
        setIsRegenerating(true);
        setError(null);
        try {
            const regeneratedData = await regenerateEmail(activeProfile, analysisModalState.professor as ProfessorProfile, analysisModalState.result, prompt);
            setAnalysisModalState(prev => ({ ...prev, result: { ...prev.result!, ...regeneratedData } }));
        } catch (e: any) { setError(e.message || "An error occurred during regeneration."); } finally { setIsRegenerating(false); }
    };

    const handleGenerateEmailForDiscoveredProf = async (prof: ProfessorRecommendation, profileToUse: UserProfile, papers: string[]) => {
        setIsDiscoveryLoading(true);
        setError(null);
        const profProfile: ProfessorProfile = { name: prof.name, university: prof.university, department: prof.department, email: prof.email, labWebsite: prof.labWebsite, researchFocus: prof.researchSummary };
        try {
            const result = await generateAnalysisAndEmail(profileToUse, profProfile, papers);
            setAnalysisModalState({ isOpen: true, result, professor: prof });
        } catch (e: any) { setError(e.message || "An error occurred during analysis."); } finally { setIsDiscoveryLoading(false); }
    };

    const handleSaveProfessor = (prof: ProfessorRecommendation) => {
        if (savedProfessorIds.has(prof.id)) {
            setSavedProfessors(prev => prev.filter(p => p.id !== prof.id));
        } else {
            const newSavedProf: SavedProfessor = { ...prof, feedback: '', emailSent: false, outcome: 'pending', suggestedPapers: prof.suggestedPapers || [] };
            setSavedProfessors(prev => [...prev, newSavedProf]);
        }
    };

    const handleUpdateSavedProfessor = (updatedProf: SavedProfessor) => setSavedProfessors(prev => prev.map(p => p.id === updatedProf.id ? updatedProf : p));
    const handleDeleteSavedProfessor = (profToDelete: SavedProfessor) => setSavedProfessors(prev => prev.filter(p => p.id !== profToDelete.id));
    const handleAddSavedProfessor = (newProf: SavedProfessor) => setSavedProfessors(prev => [...prev, newProf]);

    const handleAnalyzeSavedProfessor = async (prof: SavedProfessor, papers: string[]) => {
        if (!activeProfile) return;
        setAnalyzingSavedProfId(prof.id);
        setError(null);
        const profProfile: ProfessorProfile = { name: prof.name, university: prof.university, department: prof.department, email: prof.email, labWebsite: prof.labWebsite, researchFocus: prof.researchSummary };
        try {
            const result = await generateAnalysisAndEmail(activeProfile, profProfile, papers);
            setSavedProfessors(prev => prev.map(p => p.id === prof.id ? { ...p, ...result } : p));
        } catch (e: any) { setError(e.message || `Failed to analyze ${prof.name}.`); } finally { setAnalyzingSavedProfId(null); }
    };
    
    const handleRegenerateForSavedProfessor = async (prof: SavedProfessor, prompt: string) => {
        if (!activeProfile || !prof.alignmentSummary || !prof.outreachEmail || !prof.emailSubject) return;
        setAnalyzingSavedProfId(prof.id);
        setError(null);
        const profProfile: ProfessorProfile = { name: prof.name, university: prof.university, department: prof.department, email: prof.email, labWebsite: prof.labWebsite, researchFocus: prof.researchSummary };
        const previousResult: AnalysisResult = { alignmentSummary: prof.alignmentSummary, outreachEmail: prof.outreachEmail, emailSubject: prof.emailSubject };
        try {
            const regeneratedData = await regenerateEmail(activeProfile, profProfile, previousResult, prompt);
            setSavedProfessors(prev => prev.map(p => p.id === prof.id ? { ...p, ...regeneratedData } : p));
        } catch (e: any) { setError(e.message || `Failed to regenerate email for ${prof.name}.`); } finally { setAnalyzingSavedProfId(null); }
    };

    const handleManualGenerateAndSaveEmail = async (profData: ProfessorProfile, papers: string[], profileToUse: UserProfile) => {
        if (!profileToUse) { setError("Please select a profile to use for generation."); return; }
        setIsDiscoveryLoading(true);
        setError(null);
        try {
            const result = await generateAnalysisAndEmail(profileToUse, profData, papers);
            const newSavedProfessor: SavedProfessor = { id: `${profData.name}-${profData.university}`.replace(/\s+/g, '-'), name: profData.name, university: profData.university, department: profData.department, email: profData.email, labWebsite: profData.labWebsite, researchSummary: profData.researchFocus, feedback: '', emailSent: false, outcome: 'pending', ...result };
            setSavedProfessors(prev => [...prev, newSavedProfessor]);
            setActiveView('generate');
        } catch (e) { setError(e instanceof Error ? e.message : 'An unknown error occurred during analysis.'); } finally { setIsDiscoveryLoading(false); }
    };

    const handleManualSaveAndGenerateSop = (profData: ProfessorProfile, papers: string[], profileToUse: UserProfile) => {
        const newSavedProfessor: SavedProfessor = { id: `${profData.name}-${profData.university}`.replace(/\s+/g, '-'), name: profData.name, university: profData.university, department: profData.department, email: profData.email, labWebsite: profData.labWebsite, researchSummary: profData.researchFocus, feedback: '', emailSent: false, outcome: 'pending' };
        setSavedProfessors(prev => [...prev, newSavedProfessor]);
        handleOpenSopModal(newSavedProfessor, newSavedProfessor.university, papers, profileToUse.id);
    };

    const handleFindProgramsForSpecificUniversity = async (universityName: string, profileToUse: UserProfile, keywords: string) => {
        setIsProgramDiscoveryLoading(true);
        setError(null);
        setProgramDiscoveryResults(null);
        try {
            const results = await findProgramsForSpecificUniversity(profileToUse, universityName, keywords);
            setProgramDiscoveryResults(results);
        } catch (e: any) { setError(e.message || "Failed to find programs for this university. Please try again."); } finally { setIsProgramDiscoveryLoading(false); }
    }

    const handleFindProgramsBroadly = async (country: string, profileToUse: UserProfile, keywords: string) => {
        setIsProgramDiscoveryLoading(true);
        setError(null);
        setProgramDiscoveryResults(null);
        try {
            const results = await findProgramsBroadly(profileToUse, country, undefined, keywords, programStateQuery);
            setProgramDiscoveryResults(results);
        } catch (e: any) { setError(e.message || "Failed to find programs. Please try a different query."); } finally { setIsProgramDiscoveryLoading(false); }
    }

    const handleLoadMoreProgramsBroadly = async (country: string, profileToUse: UserProfile, keywords: string) => {
        if (!programDiscoveryResults) return;
        setIsProgramDiscoveryLoadMoreLoading(true);
        setError(null);
        try {
            const existingUniversities = programDiscoveryResults.universities;
            const newResults = await findProgramsBroadly(profileToUse, country, existingUniversities, keywords, programStateQuery);
            setProgramDiscoveryResults(prev => ({ ...prev!, universities: [...(prev?.universities || []), ...newResults.universities] }));
        } catch (e: any) { setError(e.message || "Failed to load more programs."); } finally { setIsProgramDiscoveryLoadMoreLoading(false); }
    }
    
    const handleSaveProgram = (program: ProgramDetails, universityName: string) => {
        const programId = `${program.programName}-${universityName}`.replace(/\s+/g, '-').toLowerCase();
        if (savedProgramIds.has(programId)) {
            setSavedPrograms(prev => prev.filter(p => p.id !== programId));
        } else {
            const newSavedProgram: SavedProgram = { id: programId, universityName: universityName, applicationStatus: 'Not Started', deadline: '', notes: '', ...program };
            setSavedPrograms(prev => [...prev, newSavedProgram]);
        }
    };
    
    const handleDeleteSavedProgram = (programId: string) => setSavedPrograms(prev => prev.filter(p => p.id !== programId));
    const handleUpdateSavedProgram = (updatedProgram: SavedProgram) => setSavedPrograms(prev => prev.map(p => p.id === updatedProgram.id ? updatedProgram : p));

    const handleOpenSopModal = (professor: ProfessorProfile | ProfessorRecommendation | SavedProfessor, university: string, papers: string[] = [], profileId?: string) => setSopGenerationState({ isOpen: true, professor, university, papers, profileId });
    const handleCloseSopModal = () => setSopGenerationState({ isOpen: false, professor: null, university: '', papers: [] });

    const handleGenerateSopFromModal = async (program: string) => {
        const { professor, university, papers, profileId } = sopGenerationState;
        const profileToUse = profileId ? profiles.find(p => p.id === profileId) : activeProfile;
        if (!profileToUse || !professor) return;
        handleCloseSopModal();
        setIsSopLoading(true);
        setError(null);
        setActiveView('generate');
        try {
            const content = await generateSop(profileToUse, university, program, [professor], papers);
            const newSop: Sop = { id: crypto.randomUUID(), profileId: profileToUse.id, university: university, program, content, targetProfessors: [{ name: professor.name, researchSummary: 'researchSummary' in professor ? professor.researchSummary : ('researchFocus' in professor ? professor.researchFocus : '') }], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
            setSops(prev => [...prev, newSop]);
            setNewlyCreatedSopId(newSop.id);
        } catch (e: any) { setError(e.message || "Failed to generate SOP."); } finally { setIsSopLoading(false); }
    }

    if (isInitialLoad) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p>Loading...</p>
            </div>
        );
    }
    
    if (!session) {
        return <Login onLogin={handleLogin} onSignUp={handleSignUp} error={authError} />;
    }

    if (error) {
        return (
             <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card className="max-w-md text-center bg-destructive/10 border-destructive/20">
                    <h2 className="text-xl font-bold text-destructive">An Error Occurred</h2>
                    <p className="mt-2 text-destructive/80">{error}</p>
                    <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-destructive text-destructive-foreground rounded-md">
                        Refresh Page
                    </button>
                </Card>
            </div>
        )
    }
    
    // --- View Props ---
    const discoverViewProps = {
      professorDiscoveryProps: { profiles, activeProfileId: activeProfileId!, onGenerateEmail: handleGenerateEmailForDiscoveredProf, onGenerateSop: handleOpenSopModal, onSaveProfessor: handleSaveProfessor, savedProfessorIds, stage: discoveryStage, setStage: setDiscoveryStage, countryQuery, setCountryQuery, stateQuery, setStateQuery, universityQuery, setUniversityQuery, departmentQuery, setDepartmentQuery, interestQuery, setInterestQuery, universities, setUniversities, professors, setProfessors, groundingSources, setGroundingSources, selectedUniversity, setSelectedUniversity, selectedProfessor, setSelectedProfessor, isLoading: isDiscoveryLoading, setIsLoading: setIsDiscoveryLoading, error, setError },
      programDiscoveryProps: { profiles, activeProfileId: activeProfileId!, onFindProgramsForSpecificUniversity: handleFindProgramsForSpecificUniversity, onFindProgramsBroadly: handleFindProgramsBroadly, onLoadMoreProgramsBroadly: handleLoadMoreProgramsBroadly, results: programDiscoveryResults, isLoading: isProgramDiscoveryLoading, isLoadMoreLoading: isProgramDiscoveryLoadMoreLoading, error, setError, savedProgramIds, onSaveProgram: handleSaveProgram, stateQuery: programStateQuery, setStateQuery: setProgramStateQuery }
    };

    const generateViewProps = {
        emailTabProps: { savedProfessors, onUpdateProfessor: handleUpdateSavedProfessor, profiles, activeProfileId: activeProfileId!, onManualGenerateAndSaveEmail: handleManualGenerateAndSaveEmail, onManualSaveAndGenerateSop: handleManualSaveAndGenerateSop, isLoading: isDiscoveryLoading },
        sopTabProps: { profiles, activeProfileId: activeProfileId!, savedProfessors, savedPrograms, sops: sops.filter(s => s.profileId === activeProfile?.id), setSops, newlyCreatedSopId, clearNewlyCreatedSopId: () => setNewlyCreatedSopId(null), isLoading: isSopLoading, setIsLoading: setIsSopLoading }
    };

    return (
        <div className="bg-background text-foreground font-sans min-h-screen">
            {!isGeminiConfigured && (
                <div className="bg-amber-500/10 text-amber-600 dark:text-amber-300 text-center p-2 text-sm font-medium sticky top-0 z-50">
                    <strong>Warning:</strong> The Gemini API key (<code>API_KEY</code>) is not configured. AI-powered features will not be available.
                </div>
            )}
            <Header 
              session={session}
              onLogout={handleLogout} 
              setActiveView={setActiveView} 
              theme={theme}
              setTheme={setTheme}
            />
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 flex pt-4 pb-24 md:pb-4">
                <Sidebar 
                    activeView={activeView}
                    setActiveView={setActiveView}
                    isProfileComplete={isProfileComplete}
                    savedItemsCount={savedProfessors.length + savedPrograms.length}
                    isLoading={{ discover: isDiscoveryLoading || isProgramDiscoveryLoading, generate: isSopLoading }}
                />
                <div className="flex-grow md:pl-6">
                    {activeView === 'home' && <Home setActiveView={setActiveView} isProfileComplete={isProfileComplete} />}
                    {activeView === 'profile' && <ProfileForm profiles={profiles} setProfiles={setProfiles} activeProfileId={activeProfileId} setActiveProfileId={setActiveProfileId} createNewProfile={createNewProfile} />}
                    {activeView === 'discover' && isProfileComplete && <DiscoverView {...discoverViewProps} />}
                    {activeView === 'generate' && isProfileComplete && <GenerateView {...generateViewProps} />}
                    {activeView === 'saved' && (
                        <SavedTab
                            savedProfessors={savedProfessors}
                            onUpdateProfessor={handleUpdateSavedProfessor}
                            onDeleteProfessor={handleDeleteSavedProfessor}
                            onAddProfessor={handleAddSavedProfessor}
                            onAnalyzeProfessor={handleAnalyzeSavedProfessor}
                            onRegenerateProfessor={handleRegenerateForSavedProfessor}
                            onGenerateSop={(prof, papers) => handleOpenSopModal(prof, prof.university, papers)}
                            analyzingId={analyzingSavedProfId}
                            savedPrograms={savedPrograms}
                            onDeleteProgram={handleDeleteSavedProgram}
                            onUpdateProgram={handleUpdateSavedProgram}
                        />
                    )}
                    {/* Fallback for users who need to complete their profile */}
                    {(activeView === 'discover' || activeView === 'generate') && !isProfileComplete && <Home setActiveView={setActiveView} isProfileComplete={isProfileComplete} />}

                </div>
            </main>
            <BottomNav activeView={activeView} setActiveView={setActiveView} isProfileComplete={isProfileComplete} />

            {sopGenerationState.isOpen && sopGenerationState.professor && (
                <SopGenerationModal 
                    isOpen={sopGenerationState.isOpen}
                    onClose={handleCloseSopModal}
                    onSubmit={handleGenerateSopFromModal}
                    professorName={sopGenerationState.professor.name}
                    universityName={sopGenerationState.university}
                />
            )}
            
            <AnalysisResultModal
                isOpen={analysisModalState.isOpen}
                onClose={() => setAnalysisModalState({isOpen: false, result: null, professor: null})}
                result={analysisModalState.result}
                professor={analysisModalState.professor}
                isRegenerating={isRegenerating}
                onRegenerate={handleRegenerateForModal}
                onSaveAnalysis={(result) => {
                    if (analysisModalState.professor) {
                        handleSaveAnalysisToProfessor(analysisModalState.professor, result)
                    }
                }}
            />
        </div>
    );
}

export default App;