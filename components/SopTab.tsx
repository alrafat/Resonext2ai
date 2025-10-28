

import React, { useState, useMemo, useEffect } from 'react';
import type { Sop, UserProfile, SavedProfessor, SavedProgram } from '../types';
import { generateSop, regenerateSop } from '../services/geminiService';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Spinner } from './ui/Spinner';

interface SopTabProps {
    profiles: UserProfile[];
    activeProfileId: string;
    savedProfessors: SavedProfessor[];
    savedPrograms: SavedProgram[];
    sops: Sop[];
    setSops: React.Dispatch<React.SetStateAction<Sop[]>>;
    newlyCreatedSopId: string | null;
    clearNewlyCreatedSopId: () => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
}

const SopEditor: React.FC<{
    sop: Sop;
    onSave: (updatedSop: Sop) => void;
    onBack: () => void;
    onRegenerate: (sop: Sop, prompt: string) => Promise<void>;
    isLoading: boolean;
}> = ({ sop, onSave, onBack, onRegenerate, isLoading }) => {
    const [content, setContent] = useState(sop.content);
    const [isRegenVisible, setRegenVisible] = useState(false);
    const [regenPrompt, setRegenPrompt] = useState('');
    const [copyDocSuccess, setCopyDocSuccess] = useState(false);

    useEffect(() => {
        setContent(sop.content)
    }, [sop])

    const handleSave = () => {
        onSave({ ...sop, content, updatedAt: new Date().toISOString() });
    };

    const handleRegenerateClick = async () => {
        if (!regenPrompt) return;
        await onRegenerate(sop, regenPrompt);
        setRegenPrompt('');
        setRegenVisible(false);
    };
    
    const handleDownload = () => {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SOP_${sop.university.replace(/\s/g, '_')}_${sop.program.replace(/\s/g, '_')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleCopyToDocs = () => {
        navigator.clipboard.writeText(content);
        setCopyDocSuccess(true);
        setTimeout(() => setCopyDocSuccess(false), 2500);
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
                <div>
                     <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground mb-3 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to SOP List
                    </button>
                    <h2 className="text-2xl font-bold text-foreground">{sop.university}</h2>
                    <p className="text-muted-foreground">{sop.program}</p>
                </div>
                 <div className="flex flex-wrap gap-2 flex-shrink-0">
                    <Button onClick={handleSave}>Save Changes</Button>
                    <Button variant="secondary" onClick={() => setRegenVisible(!isRegenVisible)}>
                        Regenerate
                    </Button>
                </div>
            </div>

            {isRegenVisible && (
                <div className="mb-4 p-4 bg-secondary rounded-lg space-y-3 animate-fade-in">
                    <Textarea label="Regeneration Prompt" id="regenerate-prompt" value={regenPrompt} onChange={(e) => setRegenPrompt(e.target.value)} placeholder="e.g., Make the tone more enthusiastic, mention my experience with Python..." />
                    <Button onClick={handleRegenerateClick} disabled={isLoading || !regenPrompt}>
                        {isLoading ? <Spinner /> : 'Regenerate with Prompt'}
                    </Button>
                </div>
            )}
            
            <div className="relative bg-background border border-border rounded-lg shadow-lg">
                {isLoading && (
                    <div className="absolute inset-0 bg-background/80 flex flex-col justify-center items-center z-10 rounded-md">
                        <Spinner />
                        <p className="mt-2 text-muted-foreground">AI is writing...</p>
                    </div>
                )}
                <textarea 
                    id="sop-content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={25}
                    className="w-full h-full bg-transparent p-6 md:p-10 text-foreground font-serif text-base leading-relaxed focus:outline-none resize-y disabled:opacity-70"
                    disabled={isLoading}
                />
            </div>
            
            <div className="mt-6 flex flex-wrap gap-2">
                <Button variant="secondary" onClick={handleDownload}>Download .txt</Button>
                <Button variant="secondary" onClick={handleCopyToDocs}>
                    {copyDocSuccess ? '✓ Copied!' : 'Copy for Google Docs'}
                </Button>
            </div>
        </div>
    );
};

const SopCreator: React.FC<{
    onGenerate: (university: string, program: string, professors: SavedProfessor[], profileToUse: UserProfile) => void;
    onBack: () => void;
    savedProfessors: SavedProfessor[];
    savedPrograms: SavedProgram[];
    isLoading: boolean;
    profiles: UserProfile[];
    activeProfileId: string;
}> = ({ onGenerate, onBack, savedProfessors, savedPrograms, isLoading, profiles, activeProfileId }) => {
    const [university, setUniversity] = useState('');
    const [program, setProgram] = useState('');
    const [selectedProfIds, setSelectedProfIds] = useState<Set<string>>(new Set());
    const [selectedProfileId, setSelectedProfileId] = useState(activeProfileId);

    const handleGenerate = () => {
        const selectedProfs = savedProfessors.filter(p => selectedProfIds.has(p.id));
        const profileToUse = profiles.find(p => p.id === selectedProfileId);
        if (profileToUse) {
            onGenerate(university, program, selectedProfs, profileToUse);
        }
    };

    const toggleProfessor = (profId: string) => {
        setSelectedProfIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(profId)) {
                newSet.delete(profId);
            } else {
                newSet.add(profId);
            }
            return newSet;
        });
    };

    return (
        <div>
             <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Cancel
            </button>
            <h2 className="text-2xl font-bold text-foreground mb-4">Create New SOP</h2>
            <div className="space-y-4">
                 <div>
                    <label htmlFor="profile-select-sop" className="block text-sm font-medium text-muted-foreground mb-2">Using Profile</label>
                    <select
                        id="profile-select-sop"
                        value={selectedProfileId}
                        onChange={e => setSelectedProfileId(e.target.value)}
                        className="w-full bg-input border border-border rounded-md shadow-sm px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
                    >
                        {profiles.map(p => <option key={p.id} value={p.id}>{p.profileName}</option>)}
                    </select>
                </div>
                <Input label="Target University" id="university" value={university} onChange={e => setUniversity(e.target.value)} placeholder="e.g., University of Toronto" />
                <Input label="Target Program" id="program" value={program} onChange={e => setProgram(e.target.value)} placeholder="e.g., MSc in Data Science" />
                
                 {savedPrograms.length > 0 && (
                    <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-2">Suggestions from Saved Programs</label>
                        <div className="flex flex-wrap gap-2">
                            {savedPrograms.map(prog => (
                                <button
                                    key={prog.id}
                                    type="button"
                                    onClick={() => {
                                        setUniversity(prog.universityName);
                                        setProgram(prog.programName);
                                    }}
                                    className="px-3 py-1.5 text-xs bg-secondary text-secondary-foreground rounded-full hover:bg-accent transition"
                                >
                                    {prog.programName} at {prog.universityName}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {savedProfessors.length > 0 && (
                    <div className="pt-2">
                        <label className="block text-sm font-medium text-muted-foreground mb-2">Target Professors (Optional)</label>
                        <div className="max-h-48 overflow-y-auto space-y-2 p-3 bg-secondary border border-border rounded-md">
                            {savedProfessors.map(prof => (
                                <div key={prof.id} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id={`prof-${prof.id}`}
                                        checked={selectedProfIds.has(prof.id)}
                                        onChange={() => toggleProfessor(prof.id)}
                                        className="h-4 w-4 rounded border-border bg-input text-primary focus:ring-ring"
                                    />
                                    <label htmlFor={`prof-${prof.id}`} className="ml-3 text-sm text-foreground">{prof.name} ({prof.university})</label>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="pt-2">
                    <Button onClick={handleGenerate} disabled={isLoading || !university || !program} className="w-full">
                        {isLoading ? <Spinner /> : 'Generate SOP'}
                    </Button>
                </div>
            </div>
        </div>
    );
};


export const SopTab: React.FC<SopTabProps> = ({ profiles, activeProfileId, savedProfessors, savedPrograms, sops, setSops, newlyCreatedSopId, clearNewlyCreatedSopId, isLoading, setIsLoading }) => {
    const [view, setView] = useState<'list' | 'creator' | 'editor'>('list');
    const [activeSop, setActiveSop] = useState<Sop | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (newlyCreatedSopId) {
            const newSop = sops.find(s => s.id === newlyCreatedSopId);
            if (newSop) {
                setActiveSop(newSop);
                setView('editor');
                clearNewlyCreatedSopId();
            }
        }
    }, [newlyCreatedSopId, sops, clearNewlyCreatedSopId])

    const handleGenerateSop = async (university: string, program: string, targetProfessors: SavedProfessor[], profileToUse: UserProfile) => {
        setIsLoading(true);
        setError(null);
        try {
            const content = await generateSop(profileToUse, university, program, targetProfessors);
            const newSop: Sop = {
                id: crypto.randomUUID(),
                profileId: profileToUse.id,
                university,
                program,
                content,
                targetProfessors: targetProfessors.map(p => ({ name: p.name, researchSummary: p.researchSummary })),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            setSops(prev => [...prev, newSop]);
            setActiveSop(newSop);
            setView('editor');
        } catch (e: any) {
            setError(e.message || "Failed to generate SOP. Please try again.");
            setView('creator');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateSop = (updatedSop: Sop) => {
        setSops(prev => prev.map(s => s.id === updatedSop.id ? updatedSop : s));
        setActiveSop(updatedSop);
    };

    const handleDeleteSop = (sopId: string) => {
        setSops(prev => prev.filter(s => s.id !== sopId));
    };

    const handleRegenerateSop = async (sopToRegen: Sop, prompt: string) => {
        setIsLoading(true);
        setError(null);
        const profileForSop = profiles.find(p => p.id === sopToRegen.profileId);
        if (!profileForSop) {
            setError("Could not find the original profile used to generate this SOP.");
            setIsLoading(false);
            return;
        }
        try {
            const newContent = await regenerateSop(profileForSop, sopToRegen.content, prompt);
            const updatedSop = { ...sopToRegen, content: newContent, updatedAt: new Date().toISOString() };
            handleUpdateSop(updatedSop);
        } catch(e: any) {
            setError(e.message || "Failed to regenerate SOP. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }

    const sortedSops = useMemo(() => {
        return [...sops].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }, [sops]);

    if (view === 'editor' && activeSop) {
        // Render editor without the Card wrapper for a full-width feel
        return (
             <SopEditor
                sop={activeSop}
                onSave={handleUpdateSop}
                onBack={() => { setView('list'); setActiveSop(null); }}
                onRegenerate={handleRegenerateSop}
                isLoading={isLoading}
            />
        )
    }

    return (
        <Card>
            {error && <p className="text-destructive text-center mb-4 p-3 bg-destructive/10 rounded-md">{error}</p>}

            {view === 'list' && (
                <div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                        <h2 className="text-2xl font-bold text-foreground">SOP Dashboard</h2>
                        <Button onClick={() => setView('creator')}>+ Create New SOP</Button>
                    </div>
                    {sortedSops.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {sortedSops.map(sop => (
                                <div key={sop.id} className="p-4 bg-secondary border border-border rounded-lg flex flex-col justify-between">
                                    <div>
                                        <h3 className="font-semibold text-foreground">{sop.university}</h3>
                                        <p className="text-sm text-muted-foreground mb-2">{sop.program}</p>
                                        {sop.targetProfessors && sop.targetProfessors.length > 0 && (
                                            <div className="mb-2">
                                                <p className="text-xs text-muted-foreground font-medium">Targeting:</p>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {sop.targetProfessors.map(p => (
                                                        <span key={p.name} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">{p.name}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        <p className="text-xs text-muted-foreground mt-3">Last updated: {new Date(sop.updatedAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                                        <Button variant="secondary" className="text-sm py-1 px-3 flex-grow" onClick={() => { setActiveSop(sop); setView('editor'); }}>Edit</Button>
                                        <Button variant="secondary" className="text-sm py-1 px-3 bg-destructive/10 border-destructive/20 hover:bg-destructive/20 text-destructive" onClick={() => handleDeleteSop(sop.id)}>Delete</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                         <div className="text-center py-12">
                            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <h3 className="mt-2 text-lg font-medium text-foreground">No Statements of Purpose</h3>
                            <p className="mt-1 text-sm text-muted-foreground">Click "Create New SOP" to generate your first document.</p>
                        </div>
                    )}
                </div>
            )}

            {view === 'creator' && (
                <SopCreator 
                    onGenerate={handleGenerateSop}
                    onBack={() => setView('list')}
                    savedProfessors={savedProfessors}
                    savedPrograms={savedPrograms}
                    isLoading={isLoading}
                    profiles={profiles}
                    activeProfileId={activeProfileId}
                />
            )}
        </Card>
    );
};