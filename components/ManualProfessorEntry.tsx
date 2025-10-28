

import React, { useState } from 'react';
import type { ProfessorProfile, UserProfile } from '../types';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Button } from './ui/Button';
import { Spinner } from './ui/Spinner';

interface ManualProfessorEntryProps {
  profiles: UserProfile[];
  activeProfileId: string;
  onSaveAndGenerateEmail: (profData: ProfessorProfile, papers: string[], profileToUse: UserProfile) => Promise<void>;
  onSaveAndGenerateSop: (profData: ProfessorProfile, papers: string[], profileToUse: UserProfile) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const ManualProfessorEntry: React.FC<ManualProfessorEntryProps> = ({
  profiles,
  activeProfileId,
  onSaveAndGenerateEmail,
  onSaveAndGenerateSop,
  onCancel,
  isLoading,
}) => {
  const [profile, setProfile] = useState<ProfessorProfile>({
    name: '', university: '', department: '', email: '', labWebsite: '', researchFocus: '', selectedPaperLink: ''
  });
  const [selectedProfileId, setSelectedProfileId] = useState(activeProfileId);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfile(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleGenerateEmail = () => {
    const papers = profile.selectedPaperLink ? [profile.selectedPaperLink] : [];
    const profileToUse = profiles.find(p => p.id === selectedProfileId);
    if (profileToUse) {
      onSaveAndGenerateEmail(profile, papers, profileToUse);
    }
  };
  
  const handleGenerateSop = () => {
    const papers = profile.selectedPaperLink ? [profile.selectedPaperLink] : [];
    const profileToUse = profiles.find(p => p.id === selectedProfileId);
    if (profileToUse) {
      onSaveAndGenerateSop(profile, papers, profileToUse);
    }
  };

  return (
    <div className="p-4 bg-secondary/50 border border-border rounded-lg animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-foreground">Enter Professor Details Manually</h3>
        <Button onClick={onCancel} variant="secondary" className="text-sm py-1 px-3">Cancel</Button>
      </div>
      <div className="space-y-4">
         <div>
            <label htmlFor="profile-select-manual-email" className="block text-sm font-medium text-muted-foreground mb-2">Using Profile</label>
            <select
                id="profile-select-manual-email"
                value={selectedProfileId}
                onChange={e => setSelectedProfileId(e.target.value)}
                className="w-full bg-input border border-border rounded-md shadow-sm px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
            >
                {profiles.map(p => <option key={p.id} value={p.id}>{p.profileName}</option>)}
            </select>
        </div>
        <Input label="Professor's Name" name="name" id="prof-name-manual" value={profile.name} onChange={handleChange} placeholder="e.g., Dr. Alan Turing" required />
        <Input label="Professor's University" name="university" id="prof-university-manual" value={profile.university} onChange={handleChange} placeholder="e.g., Bletchley Park University" required />
        <Input label="Professor's Email (Optional)" name="email" id="prof-email-manual" type="email" value={profile.email} onChange={handleChange} placeholder="e.g., a.turing@bletchley.edu" />
        <Input label="Department (Optional)" name="department" id="prof-department-manual" value={profile.department} onChange={handleChange} placeholder="e.g., Department of Cryptography" />
        <Input label="Lab Website URL (Optional)" name="labWebsite" id="prof-labWebsite-manual" value={profile.labWebsite} onChange={handleChange} placeholder="https://professors-lab.edu" />
        <Textarea label="Research Focus (Optional)" name="researchFocus" id="prof-researchFocus-manual" value={profile.researchFocus} onChange={handleChange} placeholder="Briefly describe their research focus if known, e.g., 'Natural Language Processing, AI safety'." />
        <Input label="Specific Research Paper URL (Optional)" name="selectedPaperLink" id="prof-paperLink-manual" value={profile.selectedPaperLink || ''} onChange={handleChange} placeholder="Provide a direct link to a paper for more focused generation" />
      </div>
      <div className="mt-6 space-y-2">
        <Button onClick={handleGenerateEmail} disabled={isLoading || !profile.name || !profile.university} className="w-full" variant="primary" icon={isLoading ? <Spinner /> : null}>
          Generate & Save Email
        </Button>
        <Button onClick={handleGenerateSop} disabled={isLoading || !profile.name || !profile.university} className="w-full" variant="primary">
          Save & Generate SOP
        </Button>
      </div>
    </div>
  );
};