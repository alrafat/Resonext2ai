import React from 'react';
import type { AnalysisResult, ProfessorProfile, SavedProfessor, ProfessorRecommendation } from '../types';
import { OutputDisplay } from './OutputDisplay';
import { Button } from './ui/Button';

interface AnalysisResultModalProps {
    isOpen: boolean;
    onClose: () => void;
    result: AnalysisResult | null;
    professor: ProfessorProfile | SavedProfessor | ProfessorRecommendation | null;
    isRegenerating: boolean;
    onRegenerate: (prompt: string) => void;
    onSaveAnalysis: (result: AnalysisResult) => void;
}

export const AnalysisResultModal: React.FC<AnalysisResultModalProps> = ({
    isOpen,
    onClose,
    result,
    professor,
    isRegenerating,
    onRegenerate,
    onSaveAnalysis,
}) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-card border border-border rounded-xl shadow-lg w-full max-w-2xl animate-fade-in max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6">
                    <OutputDisplay
                        result={result}
                        isLoading={false} // Modal only opens when loading is done
                        isRegenerating={isRegenerating}
                        error={null} // Error is handled in the parent component
                        professor={professor}
                        onSaveAnalysis={onSaveAnalysis}
                        onRegenerate={onRegenerate}
                    />
                </div>
                 <div className="px-6 py-4 bg-secondary/50 border-t border-border sticky bottom-0">
                    <Button onClick={onClose} variant="secondary">Close</Button>
                </div>
            </div>
        </div>
    );
};
