import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Input: React.FC<InputProps> = ({ label, id, ...props }) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-muted-foreground mb-2">
        {label}
      </label>
      <input
        id={id}
        className="w-full bg-secondary border border-border rounded-lg shadow-sm px-4 py-2 text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all duration-200"
        {...props}
      />
    </div>
  );
};