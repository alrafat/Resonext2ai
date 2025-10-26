import React, { useState } from 'react';
import type { UserProfile, ProfessorRecommendation, TieredUniversities, ProgramDiscoveryResult, ProgramDetails } from '../types';
import { TabContainer, Tab } from './ui/Tabs';
import { DiscoveryTab, DiscoveryStage } from './DiscoveryTab';
import { ProgramDiscoveryTab } from './ProgramDiscoveryTab';

// Grouping props for professor discovery
interface ProfessorDiscoveryProps {
  profiles: UserProfile[];
  activeProfileId: string;
  onGenerateEmail: (professor: ProfessorRecommendation, profileToUse: UserProfile, papers: string[]) => void;
  onGenerateSop: (professor: ProfessorRecommendation, university: string, papers: string[]) => void;
  onSaveProfessor: (professor: ProfessorRecommendation) => void;
  savedProfessorIds: Set<string>;
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

// Grouping props for program discovery
interface ProgramDiscoveryProps {
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

// Main props for the DiscoverView
export interface DiscoverViewProps {
    professorDiscoveryProps: ProfessorDiscoveryProps;
    programDiscoveryProps: ProgramDiscoveryProps;
}


export const DiscoverView: React.FC<DiscoverViewProps> = ({ professorDiscoveryProps, programDiscoveryProps }) => {
    const [activeSubView, setActiveSubView] = useState<'professors' | 'programs'>('professors');

    return (
        <div>
            <TabContainer>
                <Tab active={activeSubView === 'professors'} onClick={() => setActiveSubView('professors')}>
                    Find Professors
                </Tab>
                <Tab active={activeSubView === 'programs'} onClick={() => setActiveSubView('programs')}>
                    Find Programs
                </Tab>
            </TabContainer>
            
            {activeSubView === 'professors' && (
                <DiscoveryTab {...professorDiscoveryProps} />
            )}
            {activeSubView === 'programs' && (
                <ProgramDiscoveryTab {...programDiscoveryProps} />
            )}
        </div>
    );
};
