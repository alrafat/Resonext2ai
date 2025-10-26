import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  glow?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', glow = false, icon, className, ...props }) => {
  const baseClasses = "inline-flex items-center justify-center px-5 py-2.5 border text-sm font-semibold rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantClasses = {
    primary: "border-transparent text-primary-foreground bg-primary hover:bg-primary/90 focus:ring-ring bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-400 dark:to-indigo-500 hover:shadow-lg hover:-translate-y-0.5",
    secondary: "border-border text-foreground bg-secondary hover:bg-accent focus:ring-ring",
  };
  
  const glowClass = glow ? "glow-on-hover" : "";

  const finalClassName = [
    baseClasses,
    variantClasses[variant],
    glowClass,
    className
  ].filter(Boolean).join(' ');

  return (
    <button className={finalClassName} {...props}>
      {icon && <span className="mr-2 -ml-1 h-5 w-5">{icon}</span>}
      {children}
    </button>
  );
};