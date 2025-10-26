import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';

interface LoginProps {
  onLogin: (email: string, password: string) => void;
  error: string | null;
}

export const Login: React.FC<LoginProps> = ({ onLogin, error }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      onLogin(email, password);
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans flex flex-col items-center justify-center p-4 transition-colors">
        <div className="text-center mb-8 animate-fade-in">
            <div className="flex items-center justify-center space-x-3">
                 <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-10 w-10">
                    <defs>
                        <linearGradient id="logoGradientLogin" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--ring))" />
                        <stop offset="100%" stopColor="hsl(var(--primary))" />
                        </linearGradient>
                    </defs>
                    <path
                        fill="url(#logoGradientLogin)"
                        d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
                    />
                </svg>
                <h1 className="text-4xl font-bold text-foreground/90 font-serifDisplay">Resonext.ai</h1>
            </div>
            <p className="text-muted-foreground mt-2">Your AI-powered graduate school co-pilot.</p>
        </div>
        <Card className="max-w-md w-full">
            <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                    label="Email Address"
                    id="email"
                    type="email"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                />
                <Input
                    label="Password"
                    id="password"
                    type="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                />
                 {error && <p className="text-sm text-destructive text-center">{error}</p>}
                <Button type="submit" className="w-full" variant="primary" glow>
                    Login / Sign Up
                </Button>
            </form>
        </Card>
    </div>
  );
};