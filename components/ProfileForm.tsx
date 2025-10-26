import React, { useState, useMemo, useEffect } from 'react';
import type { UserProfile, SampleSop, DegreeInfo } from '../types';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Button } from './ui/Button';
import { Spinner } from './ui/Spinner';
import { extractProfileFromCV, extractTextFromFile } from '../services/geminiService';


interface ProfileFormProps {
  profiles: UserProfile[];
  setProfiles: React.Dispatch<React.SetStateAction<UserProfile[]>>;
  activeProfileId: string;
  setActiveProfileId: (id: string) => void;
  createNewProfile: (name: string) => UserProfile;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });
};

const VALID_FILE_TYPES = [
    'application/pdf', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];
const ACCEPTED_FILE_EXTENSIONS = ".pdf,.docx";

const DegreeSection: React.FC<{
    degreeType: 'bachelor' | 'master';
    degreeInfo: DegreeInfo;
    onChange: (degreeType: 'bachelor' | 'master', field: keyof DegreeInfo, value: string) => void;
    title: string;
}> = ({ degreeType, degreeInfo, onChange, title }) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="border border-border rounded-lg">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="w-full flex justify-between items-center p-3 bg-secondary/50 rounded-t-lg hover:bg-accent/50"
            >
              <h3 className="font-semibold text-foreground">{title}</h3>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            {isOpen && (
              <div className="p-4 space-y-4 border-t border-border">
                <Input label="University" name="university" id={`${degreeType}-university`} value={degreeInfo.university} onChange={(e) => onChange(degreeType, 'university', e.target.value)} />
                <Input label="Major" name="major" id={`${degreeType}-major`} value={degreeInfo.major} onChange={(e) => onChange(degreeType, 'major', e.target.value)} />
                <Input label="GPA" name="gpa" id={`${degreeType}-gpa`} value={degreeInfo.gpa} onChange={(e) => onChange(degreeType, 'gpa', e.target.value)} placeholder="e.g., 3.8 / 4.0" />
              </div>
            )}
        </div>
    );
};


export const ProfileForm: React.FC<ProfileFormProps> = ({ profiles, setProfiles, activeProfileId, setActiveProfileId, createNewProfile }) => {
  const [isExtracting, setIsExtracting] = useState(false);
  const [isExtractingSop, setIsExtractingSop] = useState<{ [key: string]: boolean }>({});
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const activeProfile = useMemo(() => profiles.find(p => p.id === activeProfileId), [profiles, activeProfileId]);

  // Local state for editing the active profile to avoid saving on every keystroke
  const [editedProfile, setEditedProfile] = useState(activeProfile);

  useEffect(() => {
      // When the active profile changes from props, update the local editing state
      setEditedProfile(profiles.find(p => p.id === activeProfileId));
  }, [activeProfileId, profiles]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editedProfile) return;
    setEditedProfile({ ...editedProfile, [e.target.name]: e.target.value });
  };
  
  const handleDegreeChange = (degreeType: 'bachelor' | 'master', field: keyof DegreeInfo, value: string) => {
    if (!editedProfile) return;
    const currentDegree = editedProfile[degreeType] || { university: '', major: '', gpa: '' };
    setEditedProfile({
        ...editedProfile,
        [degreeType]: { ...currentDegree, [field]: value }
    });
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editedProfile) {
      if (!VALID_FILE_TYPES.includes(file.type)) {
        setExtractionError("Please upload a PDF or DOCX file.");
        return;
      }
      setExtractionError(null);
      try {
        const base64String = await fileToBase64(file);
        setEditedProfile({ ...editedProfile, cvContent: base64String, cvFileName: file.name, cvMimeType: file.type });
      } catch (error) {
        console.error("Error converting file to base64", error);
        setExtractionError("Could not read the selected file.");
        setEditedProfile({ ...editedProfile, cvContent: '', cvFileName: '', cvMimeType: '' });
      }
    }
  };
  
  const handleExtract = async () => {
    if (!editedProfile || !editedProfile.cvContent || !editedProfile.cvMimeType) {
      setExtractionError("Please upload your CV (PDF or DOCX) first.");
      return;
    }
    setIsExtracting(true);
    setExtractionError(null);
    try {
      const extractedData = await extractProfileFromCV(editedProfile.cvContent, editedProfile.cvMimeType);
      setEditedProfile({
        ...editedProfile,
        ...extractedData,
        portfolio: extractedData.portfolio || editedProfile.portfolio,
      });
    } catch (e) {
      console.error(e);
      setExtractionError("Failed to extract information from CV. The file might be image-based or protected. Please try again.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleAddProfile = () => {
      if (profiles.length < 5) {
          const newProfile = createNewProfile(`Profile ${profiles.length + 1}`);
          setProfiles(prev => [...prev, newProfile]);
          setActiveProfileId(newProfile.id);
      }
  };

  const handleDeleteProfile = () => {
      if (profiles.length > 1) {
          const newProfiles = profiles.filter(p => p.id !== activeProfileId);
          setProfiles(newProfiles);
          setActiveProfileId(newProfiles[0].id);
      }
  };

  const handleAddSampleSop = () => {
    if (!editedProfile) return;
    const currentSops = editedProfile.sampleSops || [];
    if (currentSops.length < 3) {
      const newSop: SampleSop = { id: crypto.randomUUID(), content: '' };
      setEditedProfile({ ...editedProfile, sampleSops: [...currentSops, newSop] });
    }
  };

  const handleRemoveSampleSop = (id: string) => {
    if (!editedProfile) return;
    const updatedSops = (editedProfile.sampleSops || []).filter(sop => sop.id !== id);
    setEditedProfile({ ...editedProfile, sampleSops: updatedSops });
  };

  const handleSampleSopChange = (id: string, content: string) => {
    if (!editedProfile) return;
    const updatedSops = (editedProfile.sampleSops || []).map(sop =>
      sop.id === id ? { ...sop, content } : sop
    );
    setEditedProfile({ ...editedProfile, sampleSops: updatedSops });
  };
  
  const handleSampleSopFileChange = async (sopId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editedProfile) return;

    if (!VALID_FILE_TYPES.includes(file.type)) {
        alert("Please upload a PDF or DOCX file.");
        return;
    }

    try {
        const base64String = await fileToBase64(file);
        
        // Update local state with file info first
        let updatedSops = (editedProfile.sampleSops || []).map(sop => 
            sop.id === sopId ? { ...sop, fileName: file.name, fileContent: base64String, fileMimeType: file.type, content: '' } : sop
        );
        setEditedProfile({ ...editedProfile, sampleSops: updatedSops });
        
        // Start extraction
        setIsExtractingSop(prev => ({ ...prev, [sopId]: true }));
        const extractedText = await extractTextFromFile(base64String, file.type);

        // Update with extracted text, making sure to get the latest version of the sops array
        setEditedProfile(currentProfile => {
            if (!currentProfile) return currentProfile;
            const finalSops = (currentProfile.sampleSops || []).map(s =>
                s.id === sopId ? {...s, content: extractedText} : s
            );
            return {...currentProfile, sampleSops: finalSops};
        });

    } catch (error) {
        console.error("Error processing SOP file:", error);
        alert("Failed to process the SOP file.");
    } finally {
        setIsExtractingSop(prev => ({ ...prev, [sopId]: false }));
    }
  };

  const handleRemoveSampleSopFile = (sopId: string) => {
     if (!editedProfile) return;
     const updatedSops = (editedProfile.sampleSops || []).map(sop =>
      sop.id === sopId ? { ...sop, content: '', fileName: undefined, fileContent: undefined, fileMimeType: undefined } : sop
    );
    setEditedProfile({ ...editedProfile, sampleSops: updatedSops });
  };
  
  const handleSaveProfile = () => {
    if (editedProfile) {
        setProfiles(prev => prev.map(p => p.id === activeProfileId ? editedProfile : p));
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
    }
  };


  if (!editedProfile) {
      return <Card><p>No active profile selected. Please select or create a profile.</p></Card>
  }

  return (
    <Card>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2 sm:mb-0">My Profiles</h2>
          <div className="flex items-center gap-2">
            <select
                value={activeProfileId}
                onChange={e => setActiveProfileId(e.target.value)}
                className="w-full sm:w-auto bg-input border border-border rounded-md shadow-sm px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
            >
                {profiles.map(p => <option key={p.id} value={p.id}>{p.profileName}</option>)}
            </select>
            <Button onClick={handleAddProfile} variant="secondary" className="px-3 py-2 text-sm" disabled={profiles.length >= 5}>
              + Add
            </Button>
          </div>
      </div>

      <div className="space-y-6">
        <hr className="border-border" />
        <div className="flex items-end gap-4">
            <div className="flex-grow">
                 <Input label="Profile Name" name="profileName" id="profileName" value={editedProfile.profileName} onChange={handleInputChange} placeholder="e.g., AI Research Profile" />
            </div>
            <Button onClick={handleDeleteProfile} variant="secondary" className="px-3 py-2 text-sm bg-destructive/10 border-destructive/20 hover:bg-destructive/20 text-destructive" disabled={profiles.length <= 1}>
              Delete
            </Button>
        </div>
        <hr className="border-border" />
        <div>
            <label className="block text-sm font-medium text-muted-foreground">
                Upload CV/Resume (PDF, DOCX)
            </label>
            {!editedProfile.cvFileName ? (
                <div 
                    className="mt-2 flex justify-center rounded-lg border border-dashed border-border px-6 py-10 hover:border-primary/50 transition cursor-pointer"
                    onClick={() => document.getElementById('cv-upload')?.click()}
                >
                    <div className="text-center">
                         <svg className="mx-auto h-12 w-12 text-muted-foreground/80" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.158 10.308a4.872 4.872 0 0 1-1.158.795 4.872 4.872 0 0 1-6.41 0c-.23-.194-.46-.4-.685-.623a4.872 4.872 0 0 1-1.12-3.418c0-.795.193-1.56.54-2.24l.322-.644a4.872 4.872 0 0 1 1.12-2.091 4.872 4.872 0 0 1 2.73-1.635 4.872 4.872 0 0 1 3.418 0c.937.266 1.8.723 2.528 1.368a4.872 4.872 0 0 1 1.368 2.528 4.872 4.872 0 0 1 0 3.418 4.872 4.872 0 0 1-1.635 2.73c-.644.322-1.305.54-2.091.685a4.872 4.872 0 0 1-.795 1.158Z" />
                        </svg>
                        <div className="mt-4 flex text-sm leading-6 text-muted-foreground">
                            <label htmlFor="cv-upload" className="relative cursor-pointer rounded-md font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-background hover:text-primary/90">
                                <span>Upload a file</span>
                            </label>
                        </div>
                        <p className="text-xs leading-5 text-muted-foreground/80">PDF or DOCX</p>
                    </div>
                    <input id="cv-upload" name="cv-upload" type="file" className="sr-only" accept={ACCEPTED_FILE_EXTENSIONS} onChange={handleFileChange} />
                </div>
            ) : (
                <div className="mt-2 flex items-center justify-between rounded-lg border border-border bg-secondary/50 px-4 py-3">
                    <div className="flex items-center space-x-3 overflow-hidden">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-sm font-medium text-foreground truncate" title={editedProfile.cvFileName}>{editedProfile.cvFileName}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setEditedProfile({...editedProfile, cvFileName: '', cvContent: '', cvMimeType: ''})}
                        className="text-muted-foreground hover:text-foreground transition flex-shrink-0 ml-4"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
        
          <div className="mt-2 flex items-center justify-between">
            <Button onClick={handleExtract} disabled={isExtracting || !editedProfile.cvContent} variant="secondary">
              {isExtracting ? <Spinner /> : '✨ Extract Info from CV'}
            </Button>
            <p className="text-xs text-muted-foreground text-right">
              Auto-fills the form below.
            </p>
          </div>
          {extractionError && <p className="mt-2 text-sm text-destructive">{extractionError}</p>}
        <hr className="border-border" />
        
        <Input label="Full Name" name="name" id="name" value={editedProfile.name} onChange={handleInputChange} placeholder="e.g., Jane Doe" />
        
        <DegreeSection
            title="Bachelor's Degree"
            degreeType="bachelor"
            degreeInfo={editedProfile.bachelor}
            onChange={handleDegreeChange}
        />

        <DegreeSection
            title="Master's Degree (Optional)"
            degreeType="master"
            degreeInfo={editedProfile.master || { university: '', major: '', gpa: '' }}
            onChange={handleDegreeChange}
        />

        <Textarea label="Academic Summary" name="academicSummary" id="academicSummary" value={editedProfile.academicSummary} onChange={handleInputChange} placeholder="e.g., Completed M.S. at University X and B.S. at University Y." />
        <Textarea label="Research Interests" name="researchInterests" id="researchInterests" value={editedProfile.researchInterests} onChange={handleInputChange} placeholder="Describe your research interests in a few sentences." />
        <Textarea label="Future Goals & Vision" name="futureGoals" id="futureGoals" value={editedProfile.futureGoals || ''} onChange={handleInputChange} placeholder="Describe your long-term academic and career aspirations after completing your graduate studies." />
        <Textarea label="Relevant Coursework" name="relevantCoursework" id="relevantCoursework" value={editedProfile.relevantCoursework} onChange={handleInputChange} placeholder="List key courses like 'Machine Learning', 'AI Ethics', etc." />
        <Textarea label="Relevant Work Experience" name="workExperience" id="workExperience" value={editedProfile.workExperience} onChange={handleInputChange} placeholder="Summarize key roles and accomplishments from your work experience." />
        <Textarea label="Conference Presentations/Attendance (Optional)" name="conferences" id="conferences" value={editedProfile.conferences || ''} onChange={handleInputChange} placeholder="e.g., Presented at NeurIPS 2023, Attended CVPR 2022." />
        <Input label="Personal Website / Portfolio URL (Optional)" name="portfolio" id="portfolio" value={editedProfile.portfolio} onChange={handleInputChange} placeholder="https://your-portfolio.com" />
        
        <hr className="border-border" />
        
        <Textarea 
          label="Your Demo SOP for Style Reference (Optional)" 
          name="demoSop" 
          id="demoSop" 
          value={editedProfile.demoSop || ''} 
          onChange={handleInputChange} 
          placeholder="Paste an old SOP of yours here. The AI will learn your personal writing style and tone for authenticity." 
          rows={6}
        />

        <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Sample Best SOPs for Style Reference (Optional)</label>
            <p className="text-xs text-muted-foreground mb-3">Add 1-3 examples of high-quality SOPs by uploading a PDF/DOCX. The AI will extract the text and learn their structure and tone.</p>
            <div className="space-y-4">
                {(editedProfile.sampleSops || []).map((sop, index) => (
                    <div key={sop.id} className="relative p-4 bg-secondary/50 border border-border rounded-lg">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="text-sm font-semibold text-muted-foreground">Sample SOP {index + 1}</h4>
                            <button 
                              onClick={() => handleRemoveSampleSop(sop.id)}
                              className="text-muted-foreground hover:text-destructive p-1"
                              title="Remove Sample SOP"
                            >
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                        
                        {!sop.fileName ? (
                             <div 
                                className="flex justify-center rounded-lg border border-dashed border-border px-6 py-6 hover:border-primary/50 transition cursor-pointer"
                                onClick={() => document.getElementById(`sop-upload-${sop.id}`)?.click()}
                            >
                                <div className="text-center">
                                    <svg className="mx-auto h-8 w-8 text-muted-foreground/80" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3 3m3-3l3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" /></svg>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        <span className="font-semibold text-primary">Upload a file</span> or paste content below.
                                    </p>
                                    <p className="text-xs text-muted-foreground/80">PDF or DOCX</p>
                                </div>
                                <input id={`sop-upload-${sop.id}`} type="file" className="sr-only" accept={ACCEPTED_FILE_EXTENSIONS} onChange={(e) => handleSampleSopFileChange(sop.id, e)} />
                            </div>
                        ) : (
                            <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/50 px-4 py-3 mb-3">
                                <div className="flex items-center space-x-3 overflow-hidden">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    <span className="text-sm font-medium text-foreground truncate" title={sop.fileName}>{sop.fileName}</span>
                                </div>
                                <button type="button" onClick={() => handleRemoveSampleSopFile(sop.id)} className="text-muted-foreground hover:text-foreground transition flex-shrink-0 ml-4"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
                            </div>
                        )}
                        
                        <div className="mt-3 relative">
                            {isExtractingSop[sop.id] && (
                                <div className="absolute inset-0 bg-background/80 flex flex-col justify-center items-center z-10 rounded-md">
                                    <Spinner />
                                    <p className="mt-2 text-sm text-muted-foreground">Extracting text...</p>
                                </div>
                            )}
                            <Textarea
                                label="SOP Content (auto-filled from file)"
                                labelClassName="text-xs"
                                id={`sample-sop-${sop.id}`}
                                value={sop.content}
                                onChange={(e) => handleSampleSopChange(sop.id, e.target.value)}
                                placeholder={sop.fileName ? "Extracted text will appear here..." : "Or paste content of a great SOP here..."}
                                rows={8}
                                disabled={isExtractingSop[sop.id]}
                            />
                        </div>
                    </div>
                ))}
                {(editedProfile.sampleSops || []).length < 3 && (
                    <Button variant="secondary" onClick={handleAddSampleSop} className="text-sm">
                        + Add Another Sample SOP
                    </Button>
                )}
            </div>
        </div>
        <div className="mt-8 pt-6 border-t border-border flex justify-end">
            <Button onClick={handleSaveProfile} variant="primary" glow>
                {saveSuccess ? "✓ Saved!" : "Save Profile"}
            </Button>
        </div>
      </div>
    </Card>
  );
};
