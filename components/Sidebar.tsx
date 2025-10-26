import React from 'react';
import type { AppView } from '../types';
import { Spinner } from './ui/Spinner';

interface SidebarProps {
    activeView: AppView;
    setActiveView: (view: AppView) => void;
    isProfileComplete: boolean;
    savedItemsCount: number;
    isLoading: {
        discover: boolean;
        generate: boolean;
    }
}

const NavItem = ({ icon, label, isActive, count, isLoading, ...props }: any) => (
    <div className="relative">
        <button
            {...props}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-muted-foreground`}
        >
            {icon}
            <span className="flex-1 text-left">{label}</span>
            {isLoading && <Spinner />}
            {count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {count}
                </span>
            )}
        </button>
        {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-primary rounded-r-full"></div>}
    </div>
);


export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, isProfileComplete, savedItemsCount, isLoading }) => {
    
    const navItems = [
        {
            id: 'home',
            label: 'Home',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
            )
        },
        {
            id: 'profile',
            label: 'My Profile',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
            )
        },
        {
            id: 'discover',
            label: 'Discover',
            icon: (
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                   <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                 </svg>
            ),
            disabled: !isProfileComplete,
            title: !isProfileComplete ? "Please fill out your profile first." : "Find matching professors and programs",
            isLoading: isLoading.discover,
        },
        {
            id: 'generate',
            label: 'Generate',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
            ),
            disabled: !isProfileComplete,
            title: !isProfileComplete ? "Please complete your profile first." : "Generate Emails and Statements of Purpose",
            isLoading: isLoading.generate,
        },
        {
            id: 'saved',
            label: 'Saved',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-3.13L5 18V4z" />
                </svg>
            ),
            count: savedItemsCount
        },
    ]
    
    return (
        <aside className="w-64 bg-background/30 border-r border-border p-4 flex-col flex-shrink-0 hidden md:flex transition-colors">
            <nav className="flex flex-col space-y-2">
               {navItems.map(item => (
                   <NavItem
                       key={item.id}
                       label={item.label}
                       icon={item.icon}
                       isActive={activeView === item.id}
                       onClick={() => setActiveView(item.id as AppView)}
                       count={item.count}
                       disabled={item.disabled}
                       title={item.title}
                       isLoading={item.isLoading}
                   />
               ))}
            </nav>
        </aside>
    );
};
