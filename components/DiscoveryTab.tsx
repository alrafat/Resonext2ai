import React, { useState, useMemo, useEffect } from 'react';
import { findMatchingUniversities, findMatchingProfessors, generateResearchInterestSuggestions } from '../services/geminiService';
import type { UserProfile, University, ProfessorRecommendation, TieredUniversities, SuggestedPaper, ProfessorProfile } from '../types';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Spinner } from './ui/Spinner';

export type DiscoveryStage = 'search' | 'universities' | 'professors' | 'detail';

interface DiscoveryTabProps {
  profiles: UserProfile[];
  activeProfileId: string;
  onGenerateEmail: (professor: ProfessorRecommendation, profileToUse: UserProfile, papers: string[]) => void;
  onGenerateSop: (professor: ProfessorRecommendation, university: string, papers: string[]) => void;
  onSaveProfessor: (professor: ProfessorRecommendation) => void;
  savedProfessorIds: Set<string>;
  
  // State and setters lifted to parent
  stage: DiscoveryStage;
  setStage: (stage: DiscoveryStage) => void;
  countryQuery: string;
  setCountryQuery: (query: string) => void;
  stateQuery: string;
  setStateQuery: (query: string) => void;
  universityQuery: string;
  setUniversityQuery: (query: string) => void;
  departmentQuery: string;
  setDepartmentQuery: (query: string) => void;
  interestQuery: string;
  setInterestQuery: (query: string) => void;
  universities: TieredUniversities | null;
  setUniversities: (universities: TieredUniversities | null) => void;
  professors: ProfessorRecommendation[];
  setProfessors: (professors: ProfessorRecommendation[]) => void;
  groundingSources: any[];
  setGroundingSources: (sources: any[]) => void;
  selectedUniversity: string | null;
  setSelectedUniversity: (uni: string | null) => void;
  selectedProfessor: ProfessorRecommendation | null;
  setSelectedProfessor: (prof: ProfessorRecommendation | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

const FilterButton: React.FC<{
    label: string;
    isActive: boolean;
    onClick: () => void;
    tier: 'high' | 'medium' | 'low';
}> = ({ label, isActive, onClick, tier }) => {
    const tierClasses = {
        high: 'border-amber-400/50 text-amber-400 hover:bg-amber-500/10',
        medium: 'border-sky-400/50 text-sky-400 hover:bg-sky-500/10',
        low: 'border-emerald-400/50 text-emerald-400 hover:bg-emerald-500/10',
    };
    const activeClasses = {
        high: 'bg-amber-500/20',
        medium: 'bg-sky-500/20',
        low: 'bg-emerald-500/20',
    };

    return (
        <button
            onClick={onClick}
            className={`px-3 py-1.5 text-sm font-medium border rounded-full transition-colors ${tierClasses[tier]} ${isActive ? activeClasses[tier] : ''}`}
        >
            {label}
        </button>
    );
};


export const DiscoveryTab: React.FC<DiscoveryTabProps> = (props) => {
    const {
        profiles, activeProfileId, onGenerateEmail, onGenerateSop, onSaveProfessor, savedProfessorIds,
        stage, setStage, countryQuery, setCountryQuery, stateQuery, setStateQuery, universityQuery, setUniversityQuery,
        departmentQuery, setDepartmentQuery, interestQuery, setInterestQuery,
        universities, setUniversities, professors, setProfessors, groundingSources, setGroundingSources,
        selectedUniversity, setSelectedUniversity, selectedProfessor, setSelectedProfessor, isLoading,
        setIsLoading, error, setError
    } = props;
    
    const [searchProfileId, setSearchProfileId] = useState(activeProfileId);
    const searchProfile = useMemo(() => profiles.find(p => p.id === searchProfileId)!, [profiles, searchProfileId]);
    const [isLoadMoreLoading, setIsLoadMoreLoading] = useState(false);
    
    // State for paper selection in detail view
    const [selectedPapers, setSelectedPapers] = useState<Set<string>>(new Set());
    const [manualPaperLink, setManualPaperLink] = useState('');

    // State for university tier filters
    const [tierFilters, setTierFilters] = useState<Set<'high' | 'medium' | 'low'>>(new Set(['high', 'medium', 'low']));
    
    // State for AI-powered interest suggestions
    const [interestSuggestions, setInterestSuggestions] = useState<string[]>([]);
    const [isInterestSuggestionsLoading, setIsInterestSuggestionsLoading] = useState(false);
    
    const fetchKeywords = async (forceRefresh = false) => {
        if (!searchProfile) return;

        const cacheKey = `interest_suggestions_${searchProfile.id}`;
        if (!forceRefresh) {
            const cachedSuggestions = localStorage.getItem(cacheKey);
            if (cachedSuggestions) {
                setInterestSuggestions(JSON.parse(cachedSuggestions));
                return;
            }
        }
        
        setIsInterestSuggestionsLoading(true);
        setError(null);
        try {
            const suggestions = await generateResearchInterestSuggestions(searchProfile);
            setInterestSuggestions(suggestions);
            localStorage.setItem(cacheKey, JSON.stringify(suggestions));
        } catch (e: any) {
            console.error("Failed to get interest suggestions:", e);
        } finally {
            setIsInterestSuggestionsLoading(false);
        }
    };

    useEffect(() => {
        fetchKeywords();
    }, [searchProfile]);

    const handleInterestSuggestionClick = (suggestion: string) => {
        // FIX: Changed to direct state update instead of functional update, as the prop type doesn't support it.
        const keywords = interestQuery ? interestQuery.split(',').map(k => k.trim()).filter(Boolean) : [];
        if (!keywords.some(k => k.toLowerCase() === suggestion.toLowerCase())) {
            keywords.push(suggestion);
        }
        setInterestQuery(keywords.join(', '));
    };


    const handleTierFilterChange = (tier: 'high' | 'medium' | 'low') => {
        setTierFilters(prev => {
            const newSet = new Set(prev);
            if (newSet.has(tier)) {
                // Prevent unselecting the last active filter
                if (newSet.size > 1) {
                    newSet.delete(tier);
                }
            } else {
                newSet.add(tier);
            }
            return newSet;
        });
    };

    const handleSelectAllTiers = () => {
        if (tierFilters.size === 3) {
            // This is a UX choice: if all are selected, the next click on "All" might mean "none"
            // but for this app, we'll just keep it simple and do nothing, or maybe unselect all but one.
            // Let's make it so it unselects all but one if you click it again.
            // Or just make sure it re-selects all.
            return;
        }
        setTierFilters(new Set(['high', 'medium', 'low']));
    };

    const handleFindUniversities = async () => {
        if (!countryQuery) {
            setError("Please enter a country name.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const results = await findMatchingUniversities(searchProfile, countryQuery, stateQuery);
            setUniversities(results);
            setStage('universities');
        } catch (e) {
            setError('Failed to find universities. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFindProfessors = async (uniName: string) => {
        setIsLoading(true);
        setError(null);
        setSelectedUniversity(uniName);
        try {
            const result = await findMatchingProfessors(searchProfile, uniName, departmentQuery, interestQuery);
            setProfessors(result.professors || []);
            setGroundingSources(result.groundingSources || []);
            setStage('professors');
        } catch (e) {
            setError('Failed to find professors for this university. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleLoadMoreProfessors = async () => {
        if (!selectedUniversity) return;
        setIsLoadMoreLoading(true);
        setError(null);
        try {
            const result = await findMatchingProfessors(searchProfile, selectedUniversity, departmentQuery, interestQuery, professors);
            // FIX: Changed to direct state update instead of functional update to match prop type.
            setProfessors([...professors, ...(result.professors || [])]);
            // FIX: Changed to direct state update instead of functional update to match prop type.
            setGroundingSources([...groundingSources, ...(result.groundingSources || [])]);
        } catch (e) {
            setError('Failed to load more professors.');
        } finally {
            setIsLoadMoreLoading(false);
        }
    };

    const handleSelectProfessor = (prof: ProfessorRecommendation) => {
        setSelectedProfessor(prof);
        // Reset paper selections for the new professor
        setSelectedPapers(new Set());
        setManualPaperLink('');
        setStage('detail');
    }
    
    const handlePaperSelection = (paperTitle: string) => {
        setSelectedPapers(prev => {
            const newSet = new Set(prev);
            if (newSet.has(paperTitle)) {
                newSet.delete(paperTitle);
            } else {
                newSet.add(paperTitle);
            }
            return newSet;
        });
    };

    const getCombinedPapers = (): string[] => {
        const combined = [...selectedPapers];
        if (manualPaperLink) {
            combined.push(manualPaperLink);
        }
        return combined;
    }

    const handleBack = () => {
        setError(null);
        if (stage === 'detail') setStage('professors');
        else if (stage === 'professors') {
            setSelectedUniversity(null);
            setProfessors([]);
            setGroundingSources([]);
            setStage(universities ? 'universities' : 'search');
        }
        else if (stage === 'universities') setStage('search');
    };

    const renderBackButton = (text: string) => (
        <button onClick={handleBack} className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {text}
        </button>
    );
    
    const UniversityList: React.FC<{title: string; tier: 'high' | 'medium' | 'low'; list: University[]}> = ({ title, tier, list }) => {
        const tierColor = {
            high: 'border-amber-400/50 text-amber-400',
            medium: 'border-sky-400/50 text-sky-400',
            low: 'border-emerald-400/50 text-emerald-400',
        }[tier];

        if (!list || list.length === 0) return null;

        return (
            <div>
                <h3 className={`text-sm font-semibold uppercase tracking-wider mb-2 ${tierColor}`}>{title}</h3>
                <ul className="space-y-2 mb-6">
                    {list.map((uni) => (
                       <li key={uni.name}>
                           <button onClick={() => handleFindProfessors(uni.name)} className="w-full text-left p-3 bg-secondary rounded-md hover:bg-accent transition flex justify-between items-center">
                               <div className="flex items-baseline">
                                    <span className="font-medium text-foreground">{uni.name}</span>
                                    {/* FIX: Changed uni.ranking to uni.usNewsRanking to match the University type definition. */}
                                    {uni.usNewsRanking && uni.usNewsRanking !== "Not Ranked" && (
                                        <span className="ml-2 text-xs font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{uni.usNewsRanking}</span>
                                    )}
                                </div>
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                               </svg>
                           </button>
                       </li>
                    ))}
                </ul>
            </div>
        );
    }

    return (
        <Card>
             {isLoading && (
                <div className="text-center p-6 min-h-[300px] flex flex-col justify-center items-center">
                    <Spinner />
                    <p className="mt-2 text-muted-foreground">Searching for the best matches...</p>
                </div>
            )}

            {!isLoading && error && <p className="text-destructive text-center mb-4">{error}</p>}
            
            {!isLoading && stage === 'search' && (
                <>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Search for Professors</h2>
                    <p className="text-muted-foreground mb-6 text-sm">Find aligned professors at universities worldwide.</p>
                    
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="profile-select" className="block text-sm font-medium text-muted-foreground mb-2">Using Profile</label>
                            <select
                                id="profile-select"
                                value={searchProfileId}
                                onChange={e => setSearchProfileId(e.target.value)}
                                className="w-full bg-input border-border rounded-md shadow-sm px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
                            >
                                {profiles.map(p => <option key={p.id} value={p.id}>{p.profileName}</option>)}
                            </select>
                        </div>
                        <hr className="border-border !my-6" />
                        <div className="space-y-4">
                             <Input 
                                label="Country"
                                id="country-search"
                                value={countryQuery}
                                onChange={(e) => setCountryQuery(e.target.value)}
                                placeholder="e.g., Canada, USA"
                            />
                             <Input 
                                label="State / Province (Optional)"
                                id="state-search"
                                value={stateQuery}
                                onChange={(e) => setStateQuery(e.target.value)}
                                placeholder="e.g., California, Ontario"
                            />
                            <div className="mt-2">
                                <Button onClick={handleFindUniversities} disabled={isLoading || !countryQuery} className="w-full" variant="primary">
                                    Find Universities
                                </Button>
                            </div>
                        </div>
                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-border" /></div>
                            <div className="relative flex justify-center"><span className="bg-card px-2 text-sm text-muted-foreground">OR</span></div>
                        </div>
                        <div className="space-y-4">
                            <Input 
                                label="Specific University"
                                id="university-search"
                                value={universityQuery}
                                onChange={(e) => setUniversityQuery(e.target.value)}
                                placeholder="e.g., Massachusetts Institute of Technology"
                            />
                            <Input 
                                label="Department (Optional)"
                                id="department-search"
                                value={departmentQuery}
                                onChange={(e) => setDepartmentQuery(e.target.value)}
                                placeholder="e.g., Electrical Engineering and Computer Science"
                            />
                            <div>
                                <Input 
                                    label="Research Interest (Optional)"
                                    id="interest-search"
                                    value={interestQuery}
                                    onChange={(e) => setInterestQuery(e.target.value)}
                                    placeholder="e.g., Artificial Intelligence"
                                />
                                {(isInterestSuggestionsLoading || interestSuggestions.length > 0) && (
                                    <div className="mt-2">
                                        {isInterestSuggestionsLoading ? (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Spinner />
                                                <span>Getting AI suggestions...</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-wrap gap-2 items-center">
                                                <div className="flex flex-wrap gap-2 flex-grow">
                                                {interestSuggestions.map(s => (
                                                    <button
                                                        key={s}
                                                        type="button"
                                                        onClick={() => handleInterestSuggestionClick(s)}
                                                        className="px-2.5 py-1 text-xs bg-secondary text-secondary-foreground rounded-full hover:bg-accent transition"
                                                    >
                                                        + {s}
                                                    </button>
                                                ))}
                                                </div>
                                                <button 
                                                    onClick={() => fetchKeywords(true)} 
                                                    className="p-1.5 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                                                    title="Refresh suggestions"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.667 0l3.181-3.183m-4.991-2.691V5.006h-4.992v.001M21.015 4.356v4.992m0 0h-4.992m4.992 0l-3.181-3.183a8.25 8.25 0 00-11.667 0L2.985 9.348z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="pt-2">
                                <Button onClick={() => handleFindProfessors(universityQuery)} disabled={isLoading || !universityQuery} className="w-full" variant="primary">
                                    Find Professors Directly
                                </Button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {!isLoading && stage === 'universities' && universities && (
                <>
                    {renderBackButton("Back to Search")}
                    <h2 className="text-xl font-bold text-foreground mb-4">Suggested Universities in {countryQuery}</h2>

                    <div className="mb-6 p-4 bg-secondary border border-border rounded-lg">
                        <h3 className="text-sm font-medium text-muted-foreground mb-3">Filter by Tier:</h3>
                        <div className="flex flex-wrap gap-2">
                             <button
                                onClick={handleSelectAllTiers}
                                className={`px-3 py-1.5 text-sm font-medium border rounded-full transition-colors ${tierFilters.size === 3 ? 'bg-primary/20 border-primary/50 text-primary' : 'border-border text-muted-foreground hover:bg-accent'}`}
                            >
                                All Tiers
                            </button>
                            <FilterButton label="High Tier" tier="high" isActive={tierFilters.has('high')} onClick={() => handleTierFilterChange('high')} />
                            <FilterButton label="Medium Tier" tier="medium" isActive={tierFilters.has('medium')} onClick={() => handleTierFilterChange('medium')} />
                            <FilterButton label="Low Tier" tier="low" isActive={tierFilters.has('low')} onClick={() => handleTierFilterChange('low')} />
                        </div>
                    </div>

                    {tierFilters.has('high') && <UniversityList title="High Tier (Ambitious)" tier="high" list={universities.highTier} />}
                    {tierFilters.has('medium') && <UniversityList title="Medium Tier (Target)" tier="medium" list={universities.mediumTier} />}
                    {tierFilters.has('low') && <UniversityList title="Low Tier (Safer)" tier="low" list={universities.lowTier} />}
                </>
            )}
            
            {!isLoading && stage === 'professors' && selectedUniversity && (
                 <>
                    {renderBackButton(universities ? "Back to Universities" : "Back to Search")}
                    <h2 className="text-xl font-bold text-foreground mb-4">Suggested Professors at {selectedUniversity}</h2>
                    {groundingSources && groundingSources.length > 0 && (
                        <div className="mb-4 p-3 bg-secondary border border-border rounded-md">
                            <h4 className="text-sm font-semibold text-muted-foreground mb-2">Sources used for this search:</h4>
                            <ul className="list-disc list-inside text-xs space-y-1">
                                {groundingSources.map((source, index) => (
                                    source.web && (
                                        <li key={index}>
                                            <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-sky-500 dark:text-sky-400 hover:underline break-all">
                                                {source.web.title || source.web.uri}
                                            </a>
                                        </li>
                                    )
                                ))}
                            </ul>
                        </div>
                    )}
                    <ul className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                        {professors.length > 0 ? professors.map((prof) => (
                           <li key={prof.id} className="bg-secondary rounded-md hover:bg-accent transition-colors duration-200">
                               <div className="flex items-center justify-between p-4">
                                    <button onClick={() => handleSelectProfessor(prof)} className="flex-grow text-left pr-4">
                                        <h3 className="font-semibold text-foreground">{prof.name}</h3>
                                        <p className="text-sm text-muted-foreground">{prof.designation}</p>
                                        <p className="text-sm text-muted-foreground/80">{prof.department}</p>
                                    </button>
                                    <button
                                        onClick={() => onSaveProfessor(prof)}
                                        title={savedProfessorIds.has(prof.id) ? "Unsave Professor" : "Save Professor"}
                                        className={`p-2 rounded-full transition-colors flex-shrink-0 ${savedProfessorIds.has(prof.id) ? 'bg-sky-500/20 text-sky-400' : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-accent'}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-3.13L5 18V4z" />
                                        </svg>
                                    </button>
                               </div>
                           </li>
                        )) : <p className="text-muted-foreground text-center p-4">No specific professors found. This may happen for smaller departments. Try a broader search.</p>}
                    </ul>
                     {professors.length > 0 && (
                        <div className="mt-4 text-center">
                            <Button onClick={handleLoadMoreProfessors} disabled={isLoadMoreLoading} variant="secondary">
                                {isLoadMoreLoading ? <Spinner /> : 'Load More'}
                            </Button>
                        </div>
                    )}
                </>
            )}

            {!isLoading && stage === 'detail' && selectedProfessor && (
                 <>
                    {renderBackButton("Back to Professors")}
                     <div className="p-4 bg-secondary rounded-lg border border-border space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-xl font-bold text-foreground">{selectedProfessor.name}</h2>
                                <p className="text-muted-foreground">{selectedProfessor.designation}</p>
                                <p className="text-muted-foreground/80">{selectedProfessor.department}</p>
                                <p className="text-sm text-muted-foreground/80">{selectedProfessor.university}</p>
                            </div>
                            <button 
                                onClick={() => onSaveProfessor(selectedProfessor)}
                                title={savedProfessorIds.has(selectedProfessor.id) ? "Professor Saved" : "Save Professor"}
                                className={`p-2 rounded-full transition ${savedProfessorIds.has(selectedProfessor.id) ? 'bg-sky-500/20 text-sky-400' : 'bg-accent hover:bg-muted text-muted-foreground'}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-3.13L5 18V4z" />
                                </svg>
                            </button>
                        </div>

                        <p className="text-foreground bg-background/50 p-3 rounded-md text-sm">{selectedProfessor.researchSummary}</p>
                        
                         <div className="flex flex-wrap gap-4 items-center text-sm pt-2">
                            {selectedProfessor.labWebsite && <a href={selectedProfessor.labWebsite} target="_blank" rel="noopener noreferrer" className="text-sky-500 dark:text-sky-400 hover:underline flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                Profile / Lab Site
                            </a>}
                            {selectedProfessor.email && <a href={`mailto:${selectedProfessor.email}`} className="text-sky-500 dark:text-sky-400 hover:underline flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                Email
                            </a>}
                        </div>
                        
                        {(selectedProfessor.suggestedPapers && selectedProfessor.suggestedPapers.length > 0) && (
                            <div className="pt-2 border-t border-border">
                                <h4 className="text-sm font-semibold text-muted-foreground mb-2">Suggested Recent Papers:</h4>
                                <div className="space-y-2">
                                    {selectedProfessor.suggestedPapers.map((paper, index) => (
                                        <div key={index} className="flex items-start gap-3">
                                            <input 
                                                type="checkbox" 
                                                id={`paper-${index}`}
                                                checked={selectedPapers.has(paper.title)}
                                                onChange={() => handlePaperSelection(paper.title)}
                                                className="mt-1 h-4 w-4 rounded border-border bg-input text-primary focus:ring-ring"
                                            />
                                            <label htmlFor={`paper-${index}`} className="text-sm text-foreground">
                                                {paper.title}
                                                <a href={paper.link} target="_blank" rel="noopener noreferrer" className="text-sky-500 dark:text-sky-400 hover:underline ml-2">[Link]</a>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="pt-2">
                            <Input 
                                label="Or add a specific paper URL"
                                id="manual-paper"
                                value={manualPaperLink}
                                onChange={e => setManualPaperLink(e.target.value)}
                                placeholder="https://scholar.google.com/..."
                            />
                        </div>
                    </div>
                    <div className="mt-6 space-y-2">
                        <Button onClick={() => onGenerateEmail(selectedProfessor, searchProfile, getCombinedPapers())} className="w-full" variant="primary">
                           Generate Email
                        </Button>
                         <Button onClick={() => onGenerateSop(selectedProfessor, selectedProfessor.university, getCombinedPapers())} className="w-full" variant="primary">
                           Generate SOP
                        </Button>
                    </div>
                </>
            )}

        </Card>
    );
};
