import React, { useState } from 'react';
import { Input } from './ui/Input';
import { Button } from './ui/Button';

interface SopGenerationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (program: string) => void;
    professorName: string;
    universityName: string;
}

export const SopGenerationModal: React.FC<SopGenerationModalProps> = ({ isOpen, onClose, onSubmit, professorName, universityName }) => {
    const [program, setProgram] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (program) {
            onSubmit(program);
        }
    }

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div 
                className="bg-card border border-border rounded-xl shadow-lg p-6 w-full max-w-md animate-fade-in"
                onClick={e => e.stopPropagation()}
            >
                <form onSubmit={handleSubmit}>
                    <h2 className="text-xl font-bold text-foreground">Generate Statement of Purpose</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        For <span className="font-semibold text-foreground">{universityName}</span>
                        {professorName && <> targeting <span className="font-semibold text-foreground">Dr. {professorName}</span></>}
                        .
                    </p>
                    <div className="mt-6">
                        <Input 
                            label="What is the name of the program you are applying to?"
                            id="program-name"
                            value={program}
                            onChange={e => setProgram(e.target.value)}
                            placeholder="e.g., PhD in Computer Science"
                            required
                        />
                    </div>
                    <div className="mt-6 flex justify-end gap-2">
                        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button type="submit" variant="primary" disabled={!program}>Generate</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};