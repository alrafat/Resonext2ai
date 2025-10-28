

import React, { useState } from 'react';
import type { SavedProfessor, UserProfile, ProfessorProfile, SavedProgram, Sop } from '../types';
import { TabContainer, Tab } from './ui/Tabs';
import { EmailTab } from './EmailTab';
import { SopTab } from './SopTab';

interface EmailTabProps {
    savedProfessors: SavedProfessor[];
    onUpdateProfessor: (updatedProf: SavedProfessor) => void;
    profiles: UserProfile[];
    activeProfileId: string;
    onManualGenerateAndSaveEmail: (profData: ProfessorProfile, papers: string[], profileToUse: UserProfile) => Promise<void>;
    onManualSaveAndGenerateSop: (profData: ProfessorProfile, papers: string[], profileToUse: UserProfile) => void;
    isLoading: boolean;
}

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

export interface GenerateViewProps {
    emailTabProps: EmailTabProps;
    sopTabProps: SopTabProps;
}

export const GenerateView: React.FC<GenerateViewProps> = ({ emailTabProps, sopTabProps }) => {
    const [activeSubView, setActiveSubView] = useState<'emails' | 'sops'>('emails');

    return (
        <div>
            <TabContainer>
                <Tab active={activeSubView === 'emails'} onClick={() => setActiveSubView('emails')}>
                    Email Generator
                </Tab>
                <Tab active={activeSubView === 'sops'} onClick={() => setActiveSubView('sops')}>
                    SOP Generator
                </Tab>
            </TabContainer>
            
            {activeSubView === 'emails' && (
                <EmailTab {...emailTabProps} />
            )}
            {activeSubView === 'sops' && (
                <SopTab {...sopTabProps} />
            )}
        </div>
    );
};