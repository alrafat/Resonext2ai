import React from 'react';
import type { AppView } from '../types';
import type { Session } from '@supabase/supabase-js';
import { Button } from './ui/Button';

interface HeaderProps {
  session: Session | null;
  onLogout: () => void;
  setActiveView: (view: AppView) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

const ThemeSwitcher: React.FC<{ theme: 'light' | 'dark'; setTheme: (theme: 'light' | 'dark') => void }> = ({ theme, setTheme }) => {
    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    return (
        <Button onClick={toggleTheme} variant="secondary" className="px-3 py-2 text-sm" title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
            {theme === 'light' ? (
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                   <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            )}
        </Button>
    );
};


export const Header: React.FC<HeaderProps> = ({ session, onLogout, setActiveView, theme, setTheme }) => {
  const currentUserFullName = session?.user?.user_metadata?.full_name;

  return (
    <header className="bg-background/80 backdrop-blur-lg border-b border-border sticky top-0 z-20 transition-colors">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button onClick={() => setActiveView('home')} className="flex items-center space-x-3 group">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 group-hover:opacity-80 transition-opacity">
              <defs>
                <linearGradient id="logoGradientHeader" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--ring))" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" />
                </linearGradient>
              </defs>
              <path
                fill="url(#logoGradientHeader)"
                d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
              />
            </svg>
            <h1 className="text-2xl font-bold text-foreground/90 group-hover:text-foreground transition-opacity font-serifDisplay tracking-tight">Resonext.ai</h1>
          </button>
          {session && (
            <div className="flex items-center space-x-2 sm:space-x-4">
              {currentUserFullName && <span className="text-sm text-muted-foreground hidden sm:block">{currentUserFullName}</span>}
              <ThemeSwitcher theme={theme} setTheme={setTheme} />
              <Button onClick={onLogout} variant="secondary" className="px-4 py-2 text-sm">
                Logout
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};