import React, { useState, useMemo, useEffect } from 'react';
import type { UserProfile, ProgramDiscoveryResult, ProgramDetails, UniversityWithPrograms } from '../types';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Spinner } from './ui/Spinner';

interface ProgramDiscoveryTabProps {
    profiles: UserProfile[];
    activeProfileId: string;
    onFindProgramsForSpecificUniversity: (universityName: string, profileToUse: UserProfile, keywords: string) => void;
    onFindProgramsBroadly: (country: string, profileToUse: UserProfile, keywords: string) => void;
    onLoadMoreProgramsBroadly: (country: string, profileToUse: UserProfile, keywords: string) => void;
    results: ProgramDiscoveryResult | null;
    isLoading: boolean;
    isLoadMoreLoading: boolean;
    error: string | null;
    setError: (error: string | null) => void;
    savedProgramIds: Set<string>;
    onSaveProgram: (program: ProgramDetails, universityName: string) => void;
    stateQuery: string;
    setStateQuery: (query: string) => void;
}

const ProgramCard: React.FC<{
    program: ProgramDetails;
    universityName: string;
    isSaved: boolean;
    onSaveProgram: (program: ProgramDetails, universityName: string) => void;
}> = ({ program, universityName, isSaved, onSaveProgram }) => {
    return (
        <div className="p-4 bg-secondary border border-border rounded-lg space-y-4">
            <div className="flex justify-between items-start">
                 <h3 className="text-lg font-semibold text-primary pr-4">{program.programName} <span className="text-base font-normal text-muted-foreground">({program.degreeType})</span></h3>
                 <button
                    onClick={() => onSaveProgram(program, universityName)}
                    title={isSaved ? "Unsave Program" : "Save Program"}
                    className={`p-2 rounded-full transition-colors flex-shrink-0 ${isSaved ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-accent'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-3.13L5 18V4z" />
                    </svg>
                </button>
            </div>
            
            <div>
                <h4 className="text-sm font-semibold text-foreground/90 mb-1">Field Relevance:</h4>
                <p className="text-sm text-muted-foreground">{program.fieldRelevance}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                    <h4 className="text-sm font-semibold text-foreground/90 mb-2">Application Requirements</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                        <li><strong>IELTS:</strong> {program.applicationRequirements.ielts}</li>
                        <li><strong>TOEFL:</strong> {program.applicationRequirements.toefl}</li>
                        <li><strong>GRE/GMAT:</strong> {program.applicationRequirements.greGmat}</li>
                        <li><strong>GPA:</strong> {program.applicationRequirements.gpaRequirement}</li>
                    </ul>
                </div>
                 <div>
                    <h4 className="text-sm font-semibold text-foreground/90 mb-2">Application Details</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                        <li><strong>Fee:</strong> {program.applicationFee}</li>
                        <li>
                            <strong>Deadlines:</strong>
                            {program.applicationDeadlines && program.applicationDeadlines.length > 0 ? (
                                <ul className="list-none list-inside pl-2 pt-1 space-y-1">
                                    {program.applicationDeadlines.map((d, i) => (
                                        <li key={i} className="flex">
                                            <span className="text-muted-foreground mr-2">-</span>
                                            <span>
                                                <span className="font-semibold text-foreground/90">{d.intake}:</span> {d.deadline}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <span className="pl-2">Not specified</span>
                            )}
                        </li>
                    </ul>
                </div>
            </div>
             <div className="flex flex-wrap gap-4 pt-4 border-t border-border">
                <a href={program.programLink} target="_blank" rel="noopener noreferrer" className="text-sm inline-flex items-center gap-2 text-foreground bg-secondary hover:bg-accent px-3 py-1.5 rounded-md transition">
                   Program Page
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
                 <a href={program.applicationLink} target="_blank" rel="noopener noreferrer" className="text-sm inline-flex items-center gap-2 text-primary-foreground bg-primary hover:bg-primary/90 px-3 py-1.5 rounded-md transition glow-on-hover">
                   Application Link
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
            </div>
        </div>
    );
}


const UniversityAccordion: React.FC<{
    uni: UniversityWithPrograms;
    savedProgramIds: Set<string>;
    onSaveProgram: (program: ProgramDetails, universityName: string) => void;
    isOpen: boolean;
    onToggle: () => void;
}> = ({ uni, savedProgramIds, onSaveProgram, isOpen, onToggle }) => {

    const getProgramId = (program: ProgramDetails, universityName: string) => {
        return `${program.programName}-${universityName}`.replace(/\s+/g, '-').toLowerCase();
    }

    return (
        <div className="border border-border rounded-lg bg-secondary/50">
            <button onClick={onToggle} className="w-full flex justify-between items-center p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 text-left">
                    <h3 className="text-lg font-bold text-foreground">{uni.universityName}</h3>
                    <div className="flex flex-wrap gap-2 mt-1 sm:mt-0">
                        {uni.usNewsRanking && uni.usNewsRanking !== "Not Ranked" && (
                            <span className="text-xs font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 px-2 py-0.5 rounded-full flex-shrink-0">U.S. News: {uni.usNewsRanking}</span>
                        )}
                        {uni.qsRanking && uni.qsRanking !== "Not Ranked" && (
                            <span className="text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full flex-shrink-0">QS: {uni.qsRanking}</span>
                        )}
                    </div>
                </div>
                 <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-muted-foreground transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>
            {isOpen && (
                <div className="p-4 border-t border-border space-y-6 animate-fade-in">
                     {uni.groundingSources && uni.groundingSources.length > 0 && (
                        <div className="p-3 bg-secondary/50 border border-border rounded-md">
                            <h4 className="text-sm font-semibold text-muted-foreground mb-2">Sources used:</h4>
                            <ul className="list-disc list-inside text-xs space-y-1">
                                {uni.groundingSources.map((source, index) => (
                                    source.web && (
                                        <li key={index}>
                                            <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
                                                {source.web.title || source.web.uri}
                                            </a>
                                        </li>
                                    )
                                ))}
                            </ul>
                        </div>
                    )}
                    {uni.recommendedPrograms.map((program, index) => {
                         const programId = getProgramId(program, uni.universityName);
                         const isSaved = savedProgramIds.has(programId);
                        return (
                           <ProgramCard 
                                key={programId}
                                program={program}
                                universityName={uni.universityName}
                                isSaved={isSaved}
                                onSaveProgram={onSaveProgram}
                           />
                        )
                    })}
                </div>
            )}
        </div>
    );
};

const FilterButton: React.FC<{
    label: string;
    isActive: boolean;
    onClick: () => void;
    tier: 'high' | 'medium' | 'low';
}> = ({ label, isActive, onClick, tier }) => {
    const tierColors = {
        high: 'border-amber-500/50 text-amber-600 hover:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/10',
        medium: 'border-sky-500/50 text-sky-600 hover:bg-sky-500/10 dark:text-sky-300 dark:hover:bg-sky-500/10',
        low: 'border-emerald-500/50 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/10',
    };
    const activeColors = {
        high: 'bg-amber-500/20',
        medium: 'bg-sky-500/20',
        low: 'bg-emerald-500/20',
    };

    return (
        <button
            onClick={onClick}
            className={`px-3 py-1.5 text-sm font-medium border rounded-full transition-colors ${tierColors[tier]} ${isActive ? activeColors[tier] : ''}`}
        >
            {label}
        </button>
    );
};


const ResultsDisplay: React.FC<{ results: ProgramDiscoveryResult; savedProgramIds: Set<string>; onSaveProgram: (program: ProgramDetails, universityName: string) => void; }> = ({ results, savedProgramIds, onSaveProgram }) => {
    const [tierFilters, setTierFilters] = useState<Set<'high' | 'medium' | 'low'>>(new Set(['high', 'medium', 'low']));
    const [openUniversities, setOpenUniversities] = useState<Set<string>>(() => 
        new Set(results.universities.length > 0 ? [results.universities[0].universityName] : [])
    );

    const handleToggleUniversity = (uniName: string) => {
        setOpenUniversities(prev => {
            const newSet = new Set(prev);
            if (newSet.has(uniName)) {
                newSet.delete(uniName);
            } else {
                newSet.add(uniName);
            }
            return newSet;
        });
    };

    const handleTierFilterChange = (tier: 'high' | 'medium' | 'low') => {
        setTierFilters(prev => {
            const newSet = new Set(prev);
            if (newSet.has(tier)) {
                if (newSet.size > 1) newSet.delete(tier);
            } else {
                newSet.add(tier);
            }
            return newSet;
        });
    };
    
    const handleSelectAllTiers = () => {
        setTierFilters(new Set(['high', 'medium', 'low']));
    };

    const categorizedUniversities = useMemo(() => {
        const high: UniversityWithPrograms[] = [];
        const medium: UniversityWithPrograms[] = [];
        const low: UniversityWithPrograms[] = [];
        const untiered: UniversityWithPrograms[] = [];

        results.universities.forEach(uni => {
            if (uni.tier === 'high') high.push(uni);
            else if (uni.tier === 'medium') medium.push(uni);
            else if (uni.tier === 'low') low.push(uni);
            else untiered.push(uni);
        });
        return { high, medium, low, untiered };
    }, [results]);

    const hasTieredResults = categorizedUniversities.high.length > 0 || categorizedUniversities.medium.length > 0 || categorizedUniversities.low.length > 0;

    const UniversityList: React.FC<{ title: string; list: UniversityWithPrograms[]; tier?: 'high' | 'medium' | 'low' }> = ({ title, list, tier }) => {
        if (!list || list.length === 0) return null;

        const tierColor = tier ? {
            high: 'border-amber-500/50 text-amber-600 dark:text-amber-300',
            medium: 'border-sky-500/50 text-sky-600 dark:text-sky-300',
            low: 'border-emerald-500/50 text-emerald-600 dark:text-emerald-300',
        }[tier] : 'text-muted-foreground';

        return (
            <div>
                <h3 className={`text-sm font-semibold uppercase tracking-wider mb-3 ${tierColor}`}>{title}</h3>
                <div className="space-y-4">
                    {list.map((uni, index) => (
                        <UniversityAccordion 
                            key={uni.universityName + index} 
                            uni={uni} 
                            savedProgramIds={savedProgramIds} 
                            onSaveProgram={onSaveProgram} 
                            isOpen={openUniversities.has(uni.universityName)}
                            onToggle={() => handleToggleUniversity(uni.universityName)}
                        />
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="mt-8 space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-foreground">Program Recommendations</h2>
                <p className="text-muted-foreground">Found {results.universities.length} matching universit{results.universities.length === 1 ? 'y' : 'ies'}.</p>
            </div>
            {hasTieredResults && (
                <div className="p-4 bg-secondary/50 border border-border rounded-lg">
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
            )}
            <div className="space-y-8">
                {tierFilters.has('high') && <UniversityList title="High Tier (Ambitious)" list={categorizedUniversities.high} tier="high" />}
                {tierFilters.has('medium') && <UniversityList title="Medium Tier (Target)" list={categorizedUniversities.medium} tier="medium" />}
                {tierFilters.has('low') && <UniversityList title="Low Tier (Safer)" list={categorizedUniversities.low} tier="low" />}
                {categorizedUniversities.untiered.length > 0 && <UniversityList title="Results" list={categorizedUniversities.untiered} />}
            </div>
        </div>
    );
}

export const ProgramDiscoveryTab: React.FC<ProgramDiscoveryTabProps> = ({ profiles, activeProfileId, onFindProgramsForSpecificUniversity, onFindProgramsBroadly, onLoadMoreProgramsBroadly, results, isLoading, isLoadMoreLoading, error, setError, savedProgramIds, onSaveProgram, stateQuery, setStateQuery }) => {
    const [searchMode, setSearchMode] = useState<'broad' | 'specific'>('broad');
    const [universityQuery, setUniversityQuery] = useState('');
    const [countryQuery, setCountryQuery] = useState('');
    const [searchProfileId, setSearchProfileId] = useState(activeProfileId);
    const searchProfile = useMemo(() => profiles.find(p => p.id === searchProfileId)!, [profiles, searchProfileId]);
    const [programKeywords, setProgramKeywords] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (searchMode === 'specific') {
            if (!universityQuery) {
                setError("Please enter a university name.");
                return;
            }
            onFindProgramsForSpecificUniversity(universityQuery, searchProfile, programKeywords);
        } else {
            onFindProgramsBroadly(countryQuery, searchProfile, programKeywords);
        }
    };
    
    const handleLoadMore = () => {
        setError(null);
        onLoadMoreProgramsBroadly(countryQuery, searchProfile, programKeywords);
    };

    return (
        <Card>
            <h2 className="text-2xl font-bold text-foreground mb-2">Discover University Programs</h2>
            <p className="text-muted-foreground mb-6 text-sm">Find relevant programs and their specific application requirements for international students.</p>
            
            <div className="p-4 bg-card/70 border border-border rounded-lg">
                <div className="flex border-b border-border mb-4">
                    <button onClick={() => setSearchMode('broad')} className={`px-4 py-2 text-sm font-medium ${searchMode === 'broad' ? 'text-foreground border-b-2 border-primary' : 'text-muted-foreground'}`}>Broad Discovery</button>
                    <button onClick={() => setSearchMode('specific')} className={`px-4 py-2 text-sm font-medium ${searchMode === 'specific' ? 'text-foreground border-b-2 border-primary' : 'text-muted-foreground'}`}>Specific University</button>
                </div>

                <form onSubmit={handleSearch} className="space-y-4">
                    <div>
                        <label htmlFor="profile-select-program" className="block text-sm font-medium text-muted-foreground mb-2">Using Profile</label>
                        <select
                            id="profile-select-program"
                            value={searchProfileId}
                            onChange={e => setSearchProfileId(e.target.value)}
                            className="w-full bg-input border border-border rounded-md shadow-sm px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
                        >
                            {profiles.map(p => <option key={p.id} value={p.id}>{p.profileName}</option>)}
                        </select>
                    </div>

                    {searchMode === 'broad' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Country (Optional)"
                                id="country-program-search"
                                value={countryQuery}
                                onChange={(e) => setCountryQuery(e.target.value)}
                                placeholder="e.g., Canada (leave blank for global)"
                            />
                            <Input
                                label="State / Province (Optional)"
                                id="state-program-search"
                                value={stateQuery}
                                onChange={(e) => setStateQuery(e.target.value)}
                                placeholder="e.g., Ontario"
                            />
                        </div>
                    ) : (
                        <Input
                            label="Enter University Name"
                            id="university-program-search"
                            value={universityQuery}
                            onChange={(e) => setUniversityQuery(e.target.value)}
                            placeholder="e.g., University of Melbourne"
                        />
                    )}
                    
                    <div>
                        <Input
                            label="Program Keywords (Optional)"
                            id="program-keywords"
                            value={programKeywords}
                            onChange={e => setProgramKeywords(e.target.value)}
                            placeholder="e.g., AI, Data Science, HCI"
                        />
                    </div>

                    <div className="pt-2">
                        <Button type="submit" disabled={isLoading || (searchMode === 'specific' && !universityQuery)} className="w-full" variant="primary">
                            {isLoading ? <Spinner /> : 'Find Programs'}
                        </Button>
                    </div>
                </form>
            </div>

            {isLoading && (
                <div className="text-center p-6 min-h-[300px] flex flex-col justify-center items-center">
                    <Spinner />
                    <p className="mt-2 text-muted-foreground">Searching official university websites...</p>
                    <p className="text-xs text-muted-foreground/80">This may take a moment.</p>
                </div>
            )}

            {!isLoading && error && <p className="text-destructive text-center mt-4 p-3 bg-destructive/10 rounded-md">{error}</p>}
            
            {!isLoading && results && (
                <>
                    <ResultsDisplay results={results} savedProgramIds={savedProgramIds} onSaveProgram={onSaveProgram} />
                    {results.universities.length > 0 && searchMode === 'broad' && (
                         <div className="mt-6 text-center">
                            <Button onClick={handleLoadMore} disabled={isLoadMoreLoading} variant="secondary">
                                {isLoadMoreLoading ? <Spinner /> : 'Load More Programs'}
                            </Button>
                        </div>
                    )}
                </>
            )}
        </Card>
    );
};