import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div className={`bg-card/90 border border-border/80 rounded-xl shadow-md p-6 animate-fade-in transition-all dark:shadow-black/20 ${className}`}>
      {children}
    </div>
  );
};