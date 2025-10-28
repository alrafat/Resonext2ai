import React from 'react';
import type { AppView } from '../types';

interface BottomNavProps {
    activeView: AppView;
    setActiveView: (view: AppView) => void;
    isProfileComplete: boolean;
}

const NavItem = ({ icon, label, isActive, ...props }: any) => (
    <button
        {...props}
        className={`flex flex-col items-center justify-center space-y-1 w-full pt-2 pb-1 text-xs font-medium transition-colors ${
            isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
        } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-muted-foreground`}
    >
        {icon}
        <span>{label}</span>
    </button>
);

export const BottomNav: React.FC<BottomNavProps> = ({ activeView, setActiveView, isProfileComplete }) => {
    
    const icons = {
        home: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
        ),
        discover: (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
               <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
             </svg>
        ),
        saved: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-3.13L5 18V4z" />
            </svg>
        ),
        generate: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
        ),
        profile: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
        ),
    };

    const navItems = [
        { id: 'home', label: 'Home', icon: icons.home },
        { id: 'discover', label: 'Discover', icon: icons.discover, disabled: !isProfileComplete, title: 'Find Professors & Programs' },
        { id: 'generate', label: 'Generate', icon: icons.generate, disabled: !isProfileComplete, title: 'Generate Emails & SOPs'},
        { id: 'saved', label: 'Saved', icon: icons.saved },
        { id: 'profile', label: 'Profile', icon: icons.profile },
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-10 flex justify-around transition-colors">
           {navItems.map(item => (
               <NavItem
                   key={item.id}
                   label={item.label}
                   icon={item.icon}
                   isActive={activeView === item.id}
                   onClick={() => setActiveView(item.id as AppView)}
                   disabled={item.disabled}
                   title={item.title}
               />
           ))}
        </nav>
    );
};