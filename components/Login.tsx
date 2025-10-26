import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal'; // A new component for modals

interface LoginProps {
  onLogin: (email: string, password: string) => void;
  onSignUp: (fullName: string, email: string, password: string) => void;
  error: string | null;
}

export const Login: React.FC<LoginProps> = ({ onLogin, onSignUp, error }) => {
  const [view, setView] = useState<'login' | 'signup'>('login');
  
  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [formError, setFormError] = useState<string | null>(null);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (email && password) {
      onLogin(email, password);
    }
  };
  
  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (password.length < 5) {
        setFormError("Password must be at least 5 characters long.");
        return;
    }
    if (password !== confirmPassword) {
        setFormError("Passwords do not match.");
        return;
    }
    if (fullName && email && password) {
        onSignUp(fullName, email, password);
    }
  };
  
  const handleGoogleLogin = () => {
      // In a real app, this would trigger the Google OAuth flow.
      // Here, we'll just show an alert to inform the user.
      alert("Login with Google is for demonstration purposes. A real implementation requires a backend server for security. Please use the email/password sign up.");
  };

  const clearForm = () => {
    setFullName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFormError(null);
  };

  return (
    <>
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
              {view === 'login' ? (
                  <form onSubmit={handleLoginSubmit} className="space-y-6">
                      <h2 className="text-2xl font-bold text-center text-foreground">Welcome Back</h2>
                      <Input label="Email Address" id="email" type="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
                      <div>
                        <Input label="Password" id="password" type="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
                        <div className="text-right mt-2">
                          <button type="button" onClick={() => setIsForgotModalOpen(true)} className="text-sm font-medium text-primary hover:underline">Forgot Password?</button>
                        </div>
                      </div>
                      {(error || formError) && <p className="text-sm text-destructive text-center">{error || formError}</p>}
                      <Button type="submit" className="w-full" variant="primary" glow>Login</Button>
                      <div className="relative my-2"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div><div className="relative flex justify-center text-sm"><span className="bg-card px-2 text-muted-foreground">or</span></div></div>
                      <Button type="button" onClick={handleGoogleLogin} className="w-full" variant="secondary">Login with Google</Button>
                      <p className="text-center text-sm text-muted-foreground">Don't have an account?{' '}
                          <button type="button" onClick={() => { setView('signup'); clearForm(); }} className="font-medium text-primary hover:underline">Sign Up</button>
                      </p>
                  </form>
              ) : (
                  <form onSubmit={handleSignUpSubmit} className="space-y-6">
                      <h2 className="text-2xl font-bold text-center text-foreground">Create Account</h2>
                      <Input label="Full Name" id="fullName" type="text" name="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" required />
                      <Input label="Email Address" id="email-signup" type="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
                      <Input label="Password" id="password-signup" type="password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 5 characters" required />
                      <Input label="Confirm Password" id="confirm-password" type="password" name="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required />
                      {(error || formError) && <p className="text-sm text-destructive text-center">{error || formError}</p>}
                      <Button type="submit" className="w-full" variant="primary" glow>Sign Up</Button>
                      <p className="text-center text-sm text-muted-foreground">Already have an account?{' '}
                          <button type="button" onClick={() => { setView('login'); clearForm(); }} className="font-medium text-primary hover:underline">Login</button>
                      </p>
                  </form>
              )}
          </Card>
      </div>

      <Modal isOpen={isForgotModalOpen} onClose={() => setIsForgotModalOpen(false)} title="Forgot Password">
        <p className="text-sm text-muted-foreground">
            This is a demonstration application. In a real-world scenario, a password reset link would be sent to your email address.
        </p>
      </Modal>
    </>
  );
};