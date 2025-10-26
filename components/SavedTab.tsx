import React, { useState, useMemo, useEffect } from 'react';
import type { SavedProfessor, SavedProgram } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Spinner } from './ui/Spinner';
import { Textarea } from './ui/Textarea';
import { TabContainer, Tab } from './ui/Tabs';

// --- Saved Professor Components (migrated from SavedProfessorsTab) ---

interface SavedProfessorCardProps {
    professor: SavedProfessor;
    onUpdate: (professor: SavedProfessor) => void;
    onDelete: (professor: SavedProfessor) => void;
    onAnalyze: (professor: SavedProfessor, papers: string[]) => void;
    onRegenerate: (professor: SavedProfessor, prompt: string) => void;
    onGenerateSop: (professor: SavedProfessor, papers: string[]) => void;
    analyzingId: string | null;
    editingId: string | null;
    setEditingId: (id: string | null) => void;
}

const SavedProfessorCard: React.FC<SavedProfessorCardProps> = ({ professor, onUpdate, onDelete, onAnalyze, onRegenerate, onGenerateSop, analyzingId, editingId, setEditingId }) => {
    const [isEmailVisible, setIsEmailVisible] = useState(false);
    const [editedProfessor, setEditedProfessor] = useState(professor);
    const [editedSubject, setEditedSubject] = useState(professor.emailSubject || '');
    const [editedBody, setEditedBody] = useState(professor.outreachEmail || '');
    const [isRegenerateVisible, setIsRegenerateVisible] = useState(false);
    const [regeneratePrompt, setRegeneratePrompt] = useState('');
    const [manualPaperLink, setManualPaperLink] = useState('');
    const [selectedPapers, setSelectedPapers] = useState<Set<string>>(new Set());

    useEffect(() => {
        setEditedSubject(professor.emailSubject || '');
        setEditedBody(professor.outreachEmail || '');
    }, [professor.emailSubject, professor.outreachEmail]);

    const isAnalyzing = analyzingId === professor.id;
    const isEditing = editingId === professor.id;
    const hasSavedEmail = !!professor.outreachEmail;

    const handleUpdateField = (field: keyof SavedProfessor, value: any) => {
        const currentVal = professor[field];
        if (currentVal !== value) {
            onUpdate({ ...professor, [field]: value });
        }
    };

    const handleUnsaveEmail = () => {
        setIsEmailVisible(false);
        onUpdate({
            ...professor,
            alignmentSummary: undefined,
            outreachEmail: undefined,
            emailSubject: undefined,
        });
    };
    
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditedProfessor(prev => ({...prev, [e.target.name]: e.target.value}));
    };
    
    const handleSave = () => {
        onUpdate(editedProfessor);
        setEditingId(null);
    };

    const handleCancel = () => {
        setEditedProfessor(professor);
        setEditingId(null);
    };

    const handleRegenerateClick = () => {
        if (!regeneratePrompt) return;
        onRegenerate(professor, regeneratePrompt);
        setRegeneratePrompt('');
        setIsRegenerateVisible(false);
    }
    
    const handlePaperSelection = (paperTitle: string) => {
        setSelectedPapers(prev => {
            const newSet = new Set(prev);
            if (newSet.has(paperTitle)) newSet.delete(paperTitle);
            else newSet.add(paperTitle);
            return newSet;
        });
    };

    const getCombinedPapers = (): string[] => {
        const combined = [...selectedPapers];
        if (manualPaperLink) combined.push(manualPaperLink);
        return combined;
    };
    
    const outcomeClasses = {
        pending: 'bg-muted text-muted-foreground',
        positive: 'bg-green-500/10 text-green-400 border-green-500/20',
        negative: 'bg-red-500/10 text-red-400 border-red-500/20'
    }[professor.outcome];

    if (isEditing) {
        return (
             <div className="p-4 bg-secondary border border-primary/50 rounded-lg space-y-4">
                <h3 className="font-semibold text-foreground">Editing {professor.name}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Name" name="name" id={`edit-name-${professor.id}`} value={editedProfessor.name} onChange={handleFormChange} />
                    <Input label="University" name="university" id={`edit-university-${professor.id}`} value={editedProfessor.university} onChange={handleFormChange} />
                    <Input label="Designation" name="designation" id={`edit-designation-${professor.id}`} value={editedProfessor.designation || ''} onChange={handleFormChange} />
                    <Input label="Department" name="department" id={`edit-department-${professor.id}`} value={editedProfessor.department} onChange={handleFormChange} />
                    <Input label="Email" name="email" id={`edit-email-${professor.id}`} type="email" value={editedProfessor.email} onChange={handleFormChange} />
                </div>
                <Input label="University Profile URL" name="universityProfileLink" id={`edit-uni-link-${professor.id}`} value={editedProfessor.universityProfileLink || ''} onChange={handleFormChange} />
                <Input label="Lab Website URL" name="labWebsite" id={`edit-lab-link-${professor.id}`} value={editedProfessor.labWebsite} onChange={handleFormChange} />
                <Input label="Google Scholar URL" name="googleScholarLink" id={`edit-scholar-link-${professor.id}`} value={editedProfessor.googleScholarLink || ''} onChange={handleFormChange} />
                <div className="flex gap-2 justify-end pt-2">
                    <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
                    <Button onClick={handleSave}>Save Changes</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="p-4 bg-secondary/50 border border-border rounded-lg space-y-4">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-semibold text-foreground">{professor.name}</h3>
                    <p className="text-sm text-muted-foreground">{professor.designation}</p>
                    <p className="text-sm text-muted-foreground/80">{professor.department}</p>
                    <p className="text-xs text-muted-foreground/80">{professor.university}</p>
                </div>
                <div className="flex items-center space-x-1">
                    <button onClick={() => setEditingId(professor.id)} title="Edit Professor" className="text-muted-foreground hover:text-primary p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg>
                    </button>
                    <button onClick={() => onDelete(professor)} title="Unsave Professor" className="text-muted-foreground hover:text-destructive p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
                {professor.universityProfileLink && <a href={professor.universityProfileLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">University Profile</a>}
                {professor.labWebsite && <a href={professor.labWebsite} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Lab Website</a>}
                {professor.googleScholarLink && <a href={professor.googleScholarLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Scholar</a>}
                {professor.email && <a href={`mailto:${professor.email}`} className="text-primary hover:underline">{professor.email}</a>}
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex items-center space-x-2"><input id={`email-sent-${professor.id}`} type="checkbox" checked={professor.emailSent} onChange={(e) => handleUpdateField('emailSent', e.target.checked)} className="h-4 w-4 rounded border-border bg-input text-primary focus:ring-ring" /><label htmlFor={`email-sent-${professor.id}`} className="text-sm text-foreground">Email Sent</label></div>
                <div className="flex items-center space-x-2"><label htmlFor={`outcome-${professor.id}`} className="text-sm text-foreground">Outcome:</label><select id={`outcome-${professor.id}`} value={professor.outcome} onChange={(e) => handleUpdateField('outcome', e.target.value as 'pending' | 'positive' | 'negative')} className={`text-xs rounded-md px-2 py-1 border focus:outline-none focus:ring-2 focus:ring-ring ${outcomeClasses}`}><option value="pending">Pending</option><option value="positive">Positive</option><option value="negative">Negative</option></select></div>
            </div>
            <div className="border-t border-border pt-4 space-y-2">
                {!hasSavedEmail && (
                    <div className="space-y-3">
                        {(professor.suggestedPapers && professor.suggestedPapers.length > 0) && (
                            <div className="pt-2">
                                <h4 className="text-sm font-semibold text-muted-foreground mb-2">Select papers to reference:</h4>
                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                    {professor.suggestedPapers.map((paper, index) => (
                                        <div key={index} className="flex items-start gap-3">
                                            <input 
                                                type="checkbox" 
                                                id={`saved-paper-${professor.id}-${index}`}
                                                checked={selectedPapers.has(paper.title)}
                                                onChange={() => handlePaperSelection(paper.title)}
                                                className="mt-1 h-4 w-4 rounded border-border bg-input text-primary focus:ring-ring"
                                            />
                                            <label htmlFor={`saved-paper-${professor.id}-${index}`} className="text-sm text-foreground">
                                                {paper.title}
                                                <a href={paper.link} target="_blank" rel="noopener noreferrer" className="text-primary/90 hover:underline ml-2">[Link]</a>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <Input 
                            label="Or add another paper URL" 
                            id={`paper-link-${professor.id}`} 
                            value={manualPaperLink} 
                            onChange={e => setManualPaperLink(e.target.value)} 
                            placeholder="Provide a paper link for better generation" 
                        />
                    </div>
                )}
                <div className="flex flex-wrap gap-2 pt-2">
                    {hasSavedEmail ? (<Button variant="primary" className="flex-grow text-sm py-2" onClick={() => setIsEmailVisible(!isEmailVisible)}>{isEmailVisible ? 'Hide Saved Email' : 'View Saved Email'}</Button>) : (<Button variant="primary" className="flex-grow text-sm py-2" onClick={() => onAnalyze(professor, getCombinedPapers())} disabled={isAnalyzing} icon={isAnalyzing ? <Spinner /> : null}>Generate Email</Button>)}
                    <Button variant="primary" className="flex-grow text-sm py-2" onClick={() => onGenerateSop(professor, getCombinedPapers())} disabled={isAnalyzing}>Generate SOP</Button>
                </div>
            </div>
            {isEmailVisible && hasSavedEmail && (<div className="space-y-4 pt-4 border-t border-border">
                <div className="flex justify-end gap-2"><Button variant="secondary" className="text-xs py-1 px-2" onClick={() => setIsRegenerateVisible(!isRegenerateVisible)}>{isRegenerateVisible ? 'Cancel' : 'Regenerate'}</Button><Button variant="secondary" className="text-xs py-1 px-2 bg-destructive/10 border-destructive/20 hover:bg-destructive/20 text-destructive" onClick={handleUnsaveEmail}>Unsave Email</Button></div>
                {isAnalyzing && <div className="flex justify-center items-center gap-2 p-4"><Spinner /> <span className="text-sm text-muted-foreground">Regenerating...</span></div>}
                {!isAnalyzing && isRegenerateVisible && (<div className="p-3 bg-background/50 rounded-lg space-y-2"><Textarea label="Regeneration Prompt" id={`regen-prompt-${professor.id}`} value={regeneratePrompt} onChange={(e) => setRegeneratePrompt(e.target.value)} placeholder="e.g., Make it more formal..." rows={2} /><Button onClick={handleRegenerateClick} disabled={!regeneratePrompt} className="text-sm py-1 px-3">Regenerate with Prompt</Button></div>)}
                {!isAnalyzing && (<>
                    <div><h4 className="text-sm font-semibold text-muted-foreground mb-1">Alignment Summary</h4><p className="text-sm text-foreground whitespace-pre-wrap">{professor.alignmentSummary}</p></div>
                    <div><label htmlFor={`subject-${professor.id}`} className="text-sm font-semibold text-muted-foreground mb-1 block">Email Subject</label><input id={`subject-${professor.id}`} value={editedSubject} onChange={e => setEditedSubject(e.target.value)} onBlur={() => handleUpdateField('emailSubject', editedSubject)} className="w-full text-sm bg-input p-2 rounded-md border border-border focus:ring-1 focus:ring-ring focus:outline-none" /></div>
                    <div><label htmlFor={`body-${professor.id}`} className="text-sm font-semibold text-muted-foreground mb-1 block">Email Body</label><textarea id={`body-${professor.id}`} value={editedBody} onChange={e => setEditedBody(e.target.value)} onBlur={() => handleUpdateField('outreachEmail', editedBody)} rows={8} className="w-full text-sm bg-input p-3 rounded-md max-h-60 overflow-y-auto border border-border focus:ring-1 focus:ring-ring focus:outline-none" /></div>
                </>)}
            </div>)}
            <div><label htmlFor={`feedback-${professor.id}`} className="block text-sm font-medium text-muted-foreground mb-1">Feedback / Notes</label><textarea id={`feedback-${professor.id}`} value={professor.feedback} onChange={(e) => onUpdate({...professor, feedback: e.target.value})} placeholder="e.g., Replied on 08/15, suggested to apply..." rows={2} className="w-full text-sm bg-input border border-border rounded-lg shadow-sm px-4 py-2 text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all duration-200" /></div>
        </div>
    );
}

const AddProfessorForm: React.FC<{ onAdd: (prof: SavedProfessor) => void, onCancel: () => void }> = ({ onAdd, onCancel }) => {
    const [prof, setProf] = useState({ name: '', university: '', designation: '', department: '', email: '', universityProfileLink: '', labWebsite: '', googleScholarLink: '' });
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setProf(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newProfessor: SavedProfessor = { id: `${prof.name}-${prof.university}`.replace(/\s+/g, ''), ...prof, researchSummary: '', feedback: '', emailSent: false, outcome: 'pending' };
        onAdd(newProfessor);
        onCancel();
    };
    return (
        <form onSubmit={handleSubmit} className="p-4 bg-secondary border border-border rounded-lg space-y-4 mb-4">
            <h3 className="font-semibold text-lg text-foreground">Add Professor Manually</h3>
            <Input label="Name" name="name" id="add-name" value={prof.name} onChange={handleChange} required />
            <Input label="University" name="university" id="add-university" value={prof.university} onChange={handleChange} required />
            <Input label="Designation" name="designation" id="add-designation" value={prof.designation || ''} onChange={handleChange} placeholder="e.g., Assistant Professor" />
            <Input label="Department" name="department" id="add-department" value={prof.department} onChange={handleChange} />
            <Input label="Email" name="email" id="add-email" type="email" value={prof.email} onChange={handleChange} />
            <Input label="University Profile URL" name="universityProfileLink" id="add-uni-link" value={prof.universityProfileLink} onChange={handleChange} />
            <Input label="Lab Website URL" name="labWebsite" id="add-lab-link" value={prof.labWebsite} onChange={handleChange} />
            <Input label="Google Scholar URL" name="googleScholarLink" id="add-scholar-link" value={prof.googleScholarLink} onChange={handleChange} />
            <div className="flex gap-2 justify-end"><Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button><Button type="submit">Add Professor</Button></div>
        </form>
    );
};

const ProfessorsView: React.FC<{
  savedProfessors: SavedProfessor[];
  onUpdate: (professor: SavedProfessor) => void;
  onDelete: (professor: SavedProfessor) => void;
  onAdd: (professor: SavedProfessor) => void;
  onAnalyze: (professor: SavedProfessor, papers: string[]) => void;
  onRegenerate: (professor: SavedProfessor, prompt: string) => void;
  onGenerateSop: (professor: SavedProfessor, papers: string[]) => void;
  analyzingId: string | null;
}> = (props) => {
    const [isAdding, setIsAdding] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [emailStatusFilter, setEmailStatusFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('name-asc');
    const [editingId, setEditingId] = useState<string | null>(null);

    const displayedProfessors = useMemo(() => {
        return props.savedProfessors.filter(p => {
            const term = searchTerm.toLowerCase();
            const matchesTerm = p.name.toLowerCase().includes(term) || p.university.toLowerCase().includes(term) || p.department.toLowerCase().includes(term) || (p.researchSummary || '').toLowerCase().includes(term);
            const matchesEmail = emailStatusFilter === 'all' || (emailStatusFilter === 'sent' && p.emailSent) || (emailStatusFilter === 'pending' && !p.emailSent);
            return matchesTerm && matchesEmail;
        }).sort((a, b) => {
            switch (sortOrder) {
                case 'name-desc': return b.name.localeCompare(a.name);
                case 'uni-asc': return a.university.localeCompare(b.university);
                case 'uni-desc': return b.university.localeCompare(a.university);
                default: return a.name.localeCompare(b.name);
            }
        });
    }, [props.savedProfessors, searchTerm, emailStatusFilter, sortOrder]);
    
    const handleUpdateAndCloseEditor = (prof: SavedProfessor) => {
        props.onUpdate(prof);
        setEditingId(null);
    }

    const exportToCSV = () => {
        const headers = "Name,University,Department,Email Sent,Outcome,Email,Profile URL,Lab URL,Scholar URL,Notes";
        const rows = displayedProfessors.map(p => [p.name, p.university, p.department, p.emailSent, p.outcome, p.email, p.universityProfileLink, p.labWebsite, p.googleScholarLink, `"${p.feedback.replace(/"/g, '""')}"`].map(val => val || '').join(','));
        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "professors.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-foreground">Professor Database</h2>
                <Button onClick={() => setIsAdding(!isAdding)} variant={isAdding ? 'secondary' : 'primary'}>{isAdding ? 'Cancel' : '+ Add Manually'}</Button>
            </div>
            {isAdding && <AddProfessorForm onAdd={props.onAdd} onCancel={() => setIsAdding(false)} />}
            <div className="p-4 bg-secondary/50 border border-border rounded-lg mb-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input label="Filter by Name, Uni, etc." id="search-term" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search..." />
                    <div><label htmlFor="email-filter" className="block text-sm font-medium text-muted-foreground mb-2">Email Status</label><select id="email-filter" value={emailStatusFilter} onChange={e => setEmailStatusFilter(e.target.value)} className="w-full bg-input border border-border rounded-lg shadow-sm px-3 py-2.5 text-foreground"><option value="all">All</option><option value="sent">Sent</option><option value="pending">Pending</option></select></div>
                    <div><label htmlFor="sort-order" className="block text-sm font-medium text-muted-foreground mb-2">Sort By</label><select id="sort-order" value={sortOrder} onChange={e => setSortOrder(e.target.value)} className="w-full bg-input border border-border rounded-lg shadow-sm px-3 py-2.5 text-foreground"><option value="name-asc">Name (A-Z)</option><option value="name-desc">Name (Z-A)</option><option value="uni-asc">University (A-Z)</option><option value="uni-desc">University (Z-A)</option></select></div>
                </div>
                <div className="pt-2 border-t border-border/50 flex items-center gap-2"><h4 className="text-sm font-medium text-muted-foreground">Export:</h4><Button variant="secondary" onClick={exportToCSV} className="text-sm py-1 px-3">Export to CSV</Button></div>
            </div>
            {displayedProfessors.length > 0 ? (<div className="space-y-4">{displayedProfessors.map(prof => (<SavedProfessorCard key={prof.id} professor={prof} onUpdate={handleUpdateAndCloseEditor} onDelete={props.onDelete} onAnalyze={props.onAnalyze} onRegenerate={props.onRegenerate} onGenerateSop={props.onGenerateSop} analyzingId={props.analyzingId} editingId={editingId} setEditingId={setEditingId} />))}</div>) : (<div className="text-center py-12"><svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg><h3 className="mt-2 text-lg font-medium text-foreground">No Saved Professors</h3><p className="mt-1 text-sm text-muted-foreground">Your saved professors will appear here. Try broadening your filters.</p></div>)}
        </div>
    )
};


// --- Saved Program Components ---
const SavedProgramCard: React.FC<{program: SavedProgram; onDelete: (id: string) => void;}> = ({ program, onDelete }) => {
    return (
        <div className="p-4 bg-background/80 border border-border/50 rounded-lg space-y-4">
            <div className="flex justify-between items-start">
                 <div>
                    <h3 className="text-md font-semibold text-primary">{program.programName}</h3>
                    <p className="text-sm text-muted-foreground">{program.degreeType}</p>
                </div>
                <button onClick={() => onDelete(program.id)} title="Unsave Program" className="text-muted-foreground hover:text-destructive p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
                <div><h4 className="text-sm font-semibold text-muted-foreground mb-2">Requirements</h4><ul className="text-sm space-y-1 text-muted-foreground"><li><strong>IELTS:</strong> {program.applicationRequirements.ielts}</li><li><strong>TOEFL:</strong> {program.applicationRequirements.toefl}</li><li><strong>GRE/GMAT:</strong> {program.applicationRequirements.greGmat}</li><li><strong>GPA:</strong> {program.applicationRequirements.gpaRequirement}</li></ul></div>
                <div><h4 className="text-sm font-semibold text-muted-foreground mb-2">Details</h4><ul className="text-sm space-y-1 text-muted-foreground"><li><strong>Fee:</strong> {program.applicationFee}</li><li><strong>Deadlines:</strong>{program.applicationDeadlines?.length > 0 ? (<ul className="list-none list-inside pl-2 pt-1 space-y-1">{program.applicationDeadlines.map((d, i) => (<li key={i}><span className="font-semibold text-foreground">{d.intake}:</span> {d.deadline}</li>))}</ul>) : (<span className="pl-2">Not specified</span>)}</li></ul></div>
            </div>
            <div className="flex flex-wrap gap-4 pt-4 border-t border-border">
                <a href={program.programLink} target="_blank" rel="noopener noreferrer" className="text-sm inline-flex items-center gap-2 text-foreground bg-secondary hover:bg-accent px-3 py-1.5 rounded-md transition">Program Page<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg></a>
                <a href={program.applicationLink} target="_blank" rel="noopener noreferrer" className="text-sm inline-flex items-center gap-2 text-primary-foreground bg-primary hover:bg-primary/90 px-3 py-1.5 rounded-md transition glow-on-hover">Application Link<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg></a>
            </div>
        </div>
    );
};

const SavedProgramAccordion: React.FC<{
    universityName: string;
    programs: SavedProgram[];
    onDelete: (id: string) => void;
}> = ({ universityName, programs, onDelete }) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="border border-border rounded-lg bg-secondary/50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-4"
            >
                <h3 className="text-lg font-bold text-foreground">{universityName}</h3>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-muted-foreground transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>
            {isOpen && (
                <div className="p-4 border-t border-border space-y-4">
                    {programs.map(program => (
                        <SavedProgramCard key={program.id} program={program} onDelete={onDelete} />
                    ))}
                </div>
            )}
        </div>
    );
};


const ProgramsView: React.FC<{savedPrograms: SavedProgram[]; onDelete: (id: string) => void;}> = ({ savedPrograms, onDelete }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredAndGroupedPrograms = useMemo(() => {
        const filtered = savedPrograms.filter(p =>
            p.programName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.universityName.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return filtered.reduce((acc, program) => {
            const { universityName } = program;
            if (!acc[universityName]) {
                acc[universityName] = [];
            }
            acc[universityName].push(program);
            return acc;
        }, {} as Record<string, SavedProgram[]>);
    }, [savedPrograms, searchTerm]);

    return (
        <div>
             <h2 className="text-2xl font-bold text-foreground mb-4">Saved Programs</h2>
             <div className="mb-6">
                 <Input 
                    label="Search Saved Programs"
                    id="program-search"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="e.g., Plant Science, University of Toronto..."
                 />
             </div>
             {Object.keys(filteredAndGroupedPrograms).length > 0 ? (
                <div className="space-y-4">
                    {Object.entries(filteredAndGroupedPrograms)
                        .sort(([uniA], [uniB]) => uniA.localeCompare(uniB))
                        .map(([uniName, programs]) => (
                            <SavedProgramAccordion 
                                key={uniName} 
                                universityName={uniName} 
                                programs={programs} 
                                onDelete={onDelete} 
                            />
                        ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path d="M12 14l9-5-9-5-9 5 9 5z" />
                        <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0v7.5" />
                    </svg>
                    <h3 className="mt-2 text-lg font-medium text-foreground">No Saved Programs Found</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {searchTerm ? "Try a different search term." : "Your saved programs will appear here."}
                    </p>
                </div>
            )}
        </div>
    )
}

// --- Main Saved Tab Component ---

interface SavedTabProps {
  savedProfessors: SavedProfessor[];
  onUpdateProfessor: (professor: SavedProfessor) => void;
  onDeleteProfessor: (professor: SavedProfessor) => void;
  onAddProfessor: (professor: SavedProfessor) => void;
  onAnalyzeProfessor: (professor: SavedProfessor, papers: string[]) => void;
  onRegenerateProfessor: (professor: SavedProfessor, prompt: string) => void;
  onGenerateSop: (professor: SavedProfessor, papers: string[]) => void;
  analyzingId: string | null;
  savedPrograms: SavedProgram[];
  onDeleteProgram: (id: string) => void;
}

type SavedView = 'professors' | 'programs';

export const SavedTab: React.FC<SavedTabProps> = (props) => {
    const [activeTab, setActiveTab] = useState<SavedView>('professors');

    return (
        <Card>
            <TabContainer>
                <Tab active={activeTab === 'professors'} onClick={() => setActiveTab('professors')}>
                    Professors
                    <span className="ml-1.5 bg-muted text-muted-foreground text-xs font-semibold px-2 py-0.5 rounded-full">{props.savedProfessors.length}</span>
                </Tab>
                <Tab active={activeTab === 'programs'} onClick={() => setActiveTab('programs')}>
                    Programs
                    <span className="ml-1.5 bg-muted text-muted-foreground text-xs font-semibold px-2 py-0.5 rounded-full">{props.savedPrograms.length}</span>
                </Tab>
            </TabContainer>

            {activeTab === 'professors' && (
                <ProfessorsView 
                    savedProfessors={props.savedProfessors}
                    onUpdate={props.onUpdateProfessor}
                    onDelete={props.onDeleteProfessor}
                    onAdd={props.onAddProfessor}
                    onAnalyze={props.onAnalyzeProfessor}
                    onRegenerate={props.onRegenerateProfessor}
                    onGenerateSop={props.onGenerateSop}
                    analyzingId={props.analyzingId}
                />
            )}
            {activeTab === 'programs' && (
                <ProgramsView savedPrograms={props.savedPrograms} onDelete={props.onDeleteProgram} />
            )}
        </Card>
    );
};