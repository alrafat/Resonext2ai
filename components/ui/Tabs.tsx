import React from 'react';

interface TabProps {
    children: React.ReactNode;
    active: boolean;
    onClick: () => void;
}

export const Tab: React.FC<TabProps> = ({ children, active, onClick }) => (
    <button
        onClick={onClick}
        className={`whitespace-nowrap py-4 px-3 border-b-2 font-medium text-sm transition-colors ${
            active
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
        }`}
    >
        {children}
    </button>
);

interface TabContainerProps {
    children: React.ReactNode;
}

export const TabContainer: React.FC<TabContainerProps> = ({ children }) => (
    <div className="border-b border-border mb-6">
        <nav className="-mb-px flex space-x-4" aria-label="Tabs">
            {children}
        </nav>
    </div>
);