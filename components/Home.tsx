import React from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import type { AppView } from '../types';

interface HomeProps {
    setActiveView: (view: AppView) => void;
    isProfileComplete: boolean;
}

const ActionCard = ({ icon, title, description, onClick, disabled, ctaText }: { icon: React.ReactNode, title: string, description: string, onClick: () => void, disabled: boolean, ctaText: string }) => (
    <div className={`bg-card/80 border border-border rounded-xl p-6 text-center transition-all duration-300 transform-gpu ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:border-primary/50 hover:bg-accent hover:-translate-y-1'}`}>
        <div className={`mx-auto w-12 h-12 flex items-center justify-center rounded-lg bg-secondary mb-4 ${disabled ? 'text-muted-foreground' : 'text-primary'}`}>
            {icon}
        </div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground h-10">{description}</p>
        <div className="mt-6">
            <Button onClick={onClick} disabled={disabled} variant="secondary" className="w-full">
                {ctaText}
            </Button>
        </div>
    </div>
);


export const Home: React.FC<HomeProps> = ({ setActiveView, isProfileComplete }) => {
    return (
        <div className="text-center py-10 animate-fade-in">
            <div className="flex items-center justify-center space-x-4">
                 <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-12 w-12">
                      <defs>
                        <linearGradient id="logoGradientHome" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--ring))" />
                          <stop offset="100%" stopColor="hsl(var(--primary))" />
                        </linearGradient>
                      </defs>
                      <path
                        fill="url(#logoGradientHome)"
                        d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
                      />
                 </svg>
                <h1 className="text-4xl sm:text-5xl font-bold text-foreground/90 font-serifDisplay tracking-tight">Welcome to Resonext.ai</h1>
            </div>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Your AI co-pilot for graduate school applications. Analyze research, discover opportunities, and generate personalized outreach.
            </p>

             {!isProfileComplete && (
                <div className="mt-8">
                    <Card className="max-w-xl mx-auto bg-amber-500/10 border-amber-500/30 dark:bg-amber-900/20 dark:border-amber-500/20">
                        <h3 className="text-lg font-semibold text-amber-700 dark:text-amber-300">Get Started</h3>
                        <p className="text-amber-800/80 dark:text-amber-400/80 mt-2">
                           Your profile is incomplete. Fill it out to unlock powerful discovery features and personalize your outreach.
                        </p>
                         <Button variant="primary" onClick={() => setActiveView('profile')} glow className="mt-4">
                            Complete Your Profile
                        </Button>
                    </Card>
                </div>
            )}
            
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                <ActionCard 
                    icon={
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                         </svg>
                    }
                    title="Find Professors"
                    description="Discover professors whose research aligns with your interests and academic background."
                    onClick={() => setActiveView('discover')}
                    disabled={!isProfileComplete}
                    ctaText="Start Discovery"
                />
                <ActionCard 
                    icon={
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path d="M12 14l9-5-9-5-9 5 9 5z" />
                            <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0v7.5" />
                        </svg>
                    }
                    title="Find Programs"
                    description="Search universities for relevant Master's or PhD programs and their application requirements."
                    onClick={() => setActiveView('discover')}
                    disabled={!isProfileComplete}
                    ctaText="Search Programs"
                />
            </div>
        </div>
    );
};
