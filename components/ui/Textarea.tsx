import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  labelClassName?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ label, id, labelClassName, ...props }) => {
  return (
    <div>
      <label htmlFor={id} className={`block text-sm font-medium text-muted-foreground mb-2 ${labelClassName}`}>
        {label}
      </label>
      <textarea
        id={id}
        className="w-full bg-secondary border border-border rounded-lg shadow-sm px-4 py-2 text-foreground placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-all duration-200"
        rows={4}
        {...props}
      ></textarea>
    </div>
  );
};