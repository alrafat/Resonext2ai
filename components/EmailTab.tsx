
import React, { useState, useMemo, useEffect } from 'react';
import type { SavedProfessor, UserProfile, ProfessorProfile } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { ManualProfessorEntry } from './ManualProfessorEntry';

interface EmailTabProps {
    savedProfessors: SavedProfessor[];
    onUpdateProfessor: (updatedProf: SavedProfessor) => void;
    profiles: UserProfile[];
    activeProfileId: string;
    onManualGenerateAndSaveEmail: (profData: ProfessorProfile, papers: string[], profileToUse: UserProfile) => Promise<void>;
    onManualSaveAndGenerateSop: (profData: ProfessorProfile, papers: string[], profileToUse: UserProfile) => void;
    isLoading: boolean;
}

const EmailEditor: React.FC<{
    professor: SavedProfessor;
    onSave: (updatedProf: SavedProfessor) => void;
    onBack: () => void;
}> = ({ professor, onSave, onBack }) => {
    const [subject, setSubject] = useState(professor.emailSubject || '');
    const [body, setBody] = useState(professor.outreachEmail || '');
    const [copySuccess, setCopySuccess] = useState(false);

    useEffect(() => {
        setSubject(professor.emailSubject || '');
        setBody(professor.outreachEmail || '');
    }, [professor]);

    const handleSave = () => {
        onSave({ ...professor, emailSubject: subject, outreachEmail: body });
    };
    
    const handleCopyToClipboard = () => {
        const fullEmail = `Subject: ${subject}\n\n${body}`;
        navigator.clipboard.writeText(fullEmail);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    }
    
     const createMailtoLink = () => {
        if (!professor?.email) return '#';
        const encodedSubject = encodeURIComponent(subject);
        const encodedBody = encodeURIComponent(body);
        return `mailto:${professor.email}?subject=${encodedSubject}&body=${encodedBody}`;
    };


    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
                 <div>
                     <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground mb-3 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Email List
                    </button>
                    <h2 className="text-2xl font-bold text-foreground">To: {professor.name}</h2>
                    <p className="text-muted-foreground">{professor.university}</p>
                </div>
                 <div className="flex flex-wrap gap-2 flex-shrink-0">
                    <Button onClick={handleSave}>Save Changes</Button>
                </div>
            </div>
            
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">Alignment Summary</label>
                     <div className="p-4 bg-secondary/50 border-l-4 border-primary rounded-r-lg">
                        <p className="text-foreground/90 italic text-sm">
                            {professor.alignmentSummary || "No alignment summary saved."}
                        </p>
                    </div>
                </div>

                 <Input 
                    label="Subject"
                    id={`subject-${professor.id}`}
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                 />
                 <Textarea
                    label="Body"
                    id={`body-${professor.id}`}
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    rows={15}
                 />
            </div>
            
             <div className="mt-6 flex flex-wrap gap-2">
                <Button variant="secondary" onClick={handleCopyToClipboard}>
                    {copySuccess ? '✓ Copied!' : 'Copy Email'}
                </Button>
                 {professor.email && (
                    <a href={createMailtoLink()} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center px-5 py-2.5 border text-sm font-semibold rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background transition-all duration-200 border-border text-foreground bg-secondary hover:bg-accent focus:ring-ring">
                        Send with Mail App
                    </a>
                )}
            </div>

        </div>
    );
};


export const EmailTab: React.FC<EmailTabProps> = ({ savedProfessors, onUpdateProfessor, profiles, activeProfileId, onManualGenerateAndSaveEmail, onManualSaveAndGenerateSop, isLoading }) => {
    const [activeProfessor, setActiveProfessor] = useState<SavedProfessor | null>(null);
    const [isAddingManually, setIsAddingManually] = useState(false);
    
    const professorsWithEmails = useMemo(() => {
        return savedProfessors.filter(p => p.outreachEmail && p.emailSubject);
    }, [savedProfessors]);

    if (activeProfessor) {
        return (
            <EmailEditor 
                professor={activeProfessor}
                onSave={(updatedProf) => {
                    onUpdateProfessor(updatedProf);
                    setActiveProfessor(updatedProf);
                }}
                onBack={() => setActiveProfessor(null)}
            />
        )
    }

    return (
        <Card>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-foreground">Email Generator</h2>
                 <Button onClick={() => setIsAddingManually(true)} variant="primary">
                    + Add Manually
                </Button>
            </div>
            
            {isAddingManually && (
                <div className="mb-6">
                    <ManualProfessorEntry
                        profiles={profiles}
                        activeProfileId={activeProfileId}
                        onSaveAndGenerateEmail={onManualGenerateAndSaveEmail}
                        onSaveAndGenerateSop={onManualSaveAndGenerateSop}
                        onCancel={() => setIsAddingManually(false)}
                        isLoading={isLoading}
                    />
                </div>
            )}

            {professorsWithEmails.length > 0 ? (
                <div className="space-y-3">
                    {professorsWithEmails.map(prof => (
                        <button 
                            key={prof.id} 
                            onClick={() => setActiveProfessor(prof)}
                            className="w-full text-left p-4 bg-secondary border border-border rounded-lg hover:bg-accent transition-colors"
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="font-semibold text-foreground">{prof.name}</h3>
                                    <p className="text-sm text-muted-foreground">{prof.university}</p>
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                            <p className="text-sm text-foreground/80 mt-2 pt-2 border-t border-border">
                                <span className="font-medium">Subject:</span> {prof.emailSubject}
                            </p>
                        </button>
                    ))}
                </div>
            ) : (
                !isAddingManually && (
                    <div className="text-center py-12">
                         <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <h3 className="mt-2 text-lg font-medium text-foreground">No Saved Emails</h3>
                        <p className="mt-1 text-sm text-muted-foreground">Generate and save emails, or add a professor manually to start.</p>
                    </div>
                )
            )}
        </Card>
    );
};
