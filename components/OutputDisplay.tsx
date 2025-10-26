import React, { useState, useEffect } from 'react';
import type { AnalysisResult, ProfessorProfile, ProfessorRecommendation, SavedProfessor } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Spinner } from './ui/Spinner';
import { Textarea } from './ui/Textarea';

interface OutputDisplayProps {
  result: AnalysisResult | null;
  isLoading: boolean;
  isRegenerating: boolean;
  error: string | null;
  professor: ProfessorProfile | ProfessorRecommendation | SavedProfessor | null;
  onSaveAnalysis: (result: AnalysisResult) => void;
  onRegenerate: (prompt: string) => void;
}

const Placeholder = () => (
    <div className="text-center p-8 flex flex-col items-center justify-center h-full">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.375 3.375 0 0112 18.75v-1.5a5.375 5.375 0 015.375-5.375M12 12.75A5.25 5.25 0 006.75 7.5v-1.5a6.75 6.75 0 1113.5 0v1.5a5.25 5.25 0 00-5.25 5.25v1.5" />
        </svg>
        <h3 className="mt-4 text-lg font-semibold text-muted-foreground">Output Panel</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Your generated analysis and email will appear here.
        </p>
    </div>
);


const LoadingState = () => (
  <div className="flex flex-col items-center justify-center p-8 min-h-[400px]">
    <Spinner />
    <p className="mt-4 text-muted-foreground">Analyzing profiles and crafting the perfect email...</p>
  </div>
);

const ErrorState: React.FC<{ error: string }> = ({ error }) => (
  <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-lg text-center">
    <h3 className="text-lg font-semibold text-destructive">Analysis Failed</h3>
    <p className="mt-2 text-destructive/80">{error}</p>
  </div>
);

const ResultDisplay: React.FC<{ result: AnalysisResult, professor: ProfessorProfile | ProfessorRecommendation | SavedProfessor | null, onSave: (result: AnalysisResult) => void, onRegenerate: (prompt: string) => void, isRegenerating: boolean }> = ({ result, professor, onSave, onRegenerate, isRegenerating }) => {
  const [emailText, setEmailText] = useState(result.outreachEmail);
  const [subjectText, setSubjectText] = useState(result.emailSubject);
  const [copiedStates, setCopiedStates] = useState({ subject: false, body: false });
  const [saved, setSaved] = useState(false);
  const [isRegenerateVisible, setIsRegenerateVisible] = useState(false);
  const [regeneratePrompt, setRegeneratePrompt] = useState('');
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(true);

  useEffect(() => {
    setEmailText(result.outreachEmail);
    setSubjectText(result.emailSubject);
    setSaved(false); // Reset saved state when new result comes in
  }, [result]);

  const handleCopy = (text: string, key: 'subject' | 'body') => {
    navigator.clipboard.writeText(text);
    setCopiedStates(prev => ({ ...prev, [key]: true }));
    setTimeout(() => setCopiedStates(prev => ({ ...prev, [key]: false })), 2000);
  };
  
  const handleSave = () => {
    const updatedResult = { ...result, outreachEmail: emailText, emailSubject: subjectText };
    onSave(updatedResult);
    setSaved(true);
  };

  const handleDownload = () => {
      const blob = new Blob([`Subject: ${subjectText}\n\n${emailText}`], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `email_to_${professor?.name || 'professor'}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const createMailtoLink = () => {
    if (!professor?.email) return '#';
    const subject = encodeURIComponent(subjectText);
    const body = encodeURIComponent(emailText);
    return `mailto:${professor.email}?subject=${subject}&body=${body}`;
  };

  const handleRegenerateClick = () => {
    onRegenerate(regeneratePrompt);
    setRegeneratePrompt('');
  };

  return (
    <div className="space-y-6">
       <div className="pb-4 border-b border-border">
          <h3 className="text-xl font-bold text-foreground">Generated Outreach</h3>
          <p className="text-sm text-muted-foreground">For Dr. {professor?.name || '...'} at {professor?.university || '...'}</p>
       </div>

      <div className="flex flex-wrap gap-2 items-center">
          <Button onClick={handleSave} variant="secondary" className="px-3 py-1 text-sm" disabled={saved}>
              {saved ? '✓ Saved' : 'Save Analysis'}
          </Button>
          <Button onClick={handleDownload} variant="secondary" className="px-3 py-1 text-sm">Download .txt</Button>
          {professor?.email && (
              <a href={createMailtoLink()} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center px-3 py-1 border text-sm font-medium rounded-md shadow-sm border-border text-foreground bg-secondary hover:bg-accent focus:ring-ring transition-all duration-150">
                  Send with Gmail
              </a>
          )}
          <Button variant="secondary" className="px-3 py-1 text-sm" onClick={() => setIsRegenerateVisible(!isRegenerateVisible)}>
            Regenerate...
          </Button>
      </div>

      <div className="border border-border rounded-lg">
        <button
          onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
          className="w-full flex justify-between items-center p-3 bg-secondary/50 rounded-t-lg hover:bg-accent/50"
        >
          <h4 className="font-semibold text-foreground">Alignment Summary</h4>
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-muted-foreground transition-transform ${isSummaryExpanded ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
        {isSummaryExpanded && (
          <div className="p-3 border-t border-border">
            <p className="text-foreground/90 whitespace-pre-wrap text-sm">{result.alignmentSummary}</p>
          </div>
        )}
      </div>

       {isRegenerateVisible && (
        <div className="p-4 bg-secondary/50 rounded-lg space-y-3 animate-fade-in">
            <Textarea label="Regeneration Prompt" id="regenerate-prompt" value={regeneratePrompt} onChange={(e) => setRegeneratePrompt(e.target.value)} placeholder="e.g., Make it more concise, emphasize my Python skills..." />
            <Button onClick={handleRegenerateClick} disabled={isRegenerating || !regeneratePrompt}>
                {isRegenerating ? <Spinner /> : 'Regenerate with Prompt'}
            </Button>
        </div>
      )}

      <div className="space-y-4">
        <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="email-subject" className="block text-sm font-medium text-muted-foreground">Subject</label>
               <button onClick={() => handleCopy(subjectText, 'subject')} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  {copiedStates.subject ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <input 
              id="email-subject"
              value={subjectText}
              onChange={(e) => setSubjectText(e.target.value)}
              className="w-full bg-input border border-border rounded-md shadow-sm px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition"
            />
        </div>
        <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="email-body" className="block text-sm font-medium text-muted-foreground">Body</label>
               <button onClick={() => handleCopy(emailText, 'body')} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  {copiedStates.body ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <textarea
              id="email-body"
              value={emailText}
              onChange={(e) => setEmailText(e.target.value)}
              className="w-full h-80 bg-input border border-border rounded-md shadow-sm px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition font-mono text-sm"
            />
        </div>
      </div>
    </div>
  );
};

export const OutputDisplay: React.FC<OutputDisplayProps> = ({ result, isLoading, error, professor, onSaveAnalysis, onRegenerate, isRegenerating }) => {
  return (
    <Card className="min-h-[500px] flex flex-col">
      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState error={error} />
      ) : result ? (
        <ResultDisplay result={result} professor={professor} onSave={onSaveAnalysis} onRegenerate={onRegenerate} isRegenerating={isRegenerating} />
      ) : (
        <Placeholder />
      )}
    </Card>
  );
};