import React from 'react';
import { Card } from './Card';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
    >
        <div 
            className="bg-card border border-border rounded-xl shadow-lg w-full max-w-md animate-fade-in"
            onClick={e => e.stopPropagation()}
        >
            <div className="p-6 border-b border-border flex justify-between items-center">
                <h2 className="text-xl font-bold text-foreground">{title}</h2>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div className="p-6">
                {children}
            </div>
            <div className="px-6 py-4 bg-secondary/50 border-t border-border flex justify-end">
                <Button onClick={onClose} variant="secondary">Close</Button>
            </div>
        </div>
    </div>
  );
};
