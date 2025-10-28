import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { setupSupabase } from '../services/supabaseClient';

export const ConfigurationSetup: React.FC = () => {
    const [supabaseUrl, setSupabaseUrl] = useState('');
    const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!supabaseUrl || !supabaseAnonKey) {
            setError('Both Supabase URL and Anon Key are required.');
            return;
        }
        try {
            // Test the credentials by trying to create a client
            const client = setupSupabase(supabaseUrl, supabaseAnonKey);
            if (client) {
                // Reload the application to re-initialize all services with the new config
                window.location.reload();
            } else {
                throw new Error("Client creation failed");
            }
        } catch (err) {
            console.error(err);
            setError('Could not connect to Supabase with the provided credentials. Please double-check them.');
            // Clear local storage if setup fails
            localStorage.removeItem('SUPABASE_URL');
            localStorage.removeItem('SUPABASE_ANON_KEY');
        }
    };

    return (
        <div className="min-h-screen bg-background font-sans flex flex-col items-center justify-center p-4">
            <div className="text-center mb-8 animate-fade-in">
                <div className="flex items-center justify-center space-x-3">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-10 w-10">
                        <defs><linearGradient id="logoGradientSetup" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="hsl(var(--ring))" /><stop offset="100%" stopColor="hsl(var(--primary))" /></linearGradient></defs>
                        <path fill="url(#logoGradientSetup)" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                    </svg>
                    <h1 className="text-4xl font-bold text-foreground/90 font-serifDisplay">Resonext.ai</h1>
                </div>
                <p className="text-muted-foreground mt-2">Application Setup</p>
            </div>

            <Card className="max-w-lg w-full">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <h2 className="text-2xl font-bold text-center text-foreground">Connect to Database</h2>
                    <div className="text-sm text-muted-foreground text-left space-y-2">
                        <p>This application requires a Supabase backend for data storage.</p>
                        <p>Please enter the URL and public "anon" key from your Supabase project settings to continue. This information will be stored locally in your browser for this development session.</p>
                    </div>

                    <Input 
                        label="Supabase Project URL" 
                        id="supabase-url" 
                        type="url" 
                        value={supabaseUrl} 
                        onChange={(e) => setSupabaseUrl(e.target.value)} 
                        placeholder="https://your-project-ref.supabase.co" 
                        required 
                    />
                    <Input 
                        label="Supabase Anon (Public) Key" 
                        id="supabase-key" 
                        type="text" 
                        value={supabaseAnonKey} 
                        onChange={(e) => setSupabaseAnonKey(e.target.value)} 
                        placeholder="ey..." 
                        required 
                    />
                    
                    {error && <p className="text-sm text-destructive text-center">{error}</p>}
                    
                    <Button type="submit" className="w-full" variant="primary" glow>
                        Save & Continue
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                        Don't have a Supabase project? You can create one for free at <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">supabase.com</a>.
                    </p>
                </form>
            </Card>
        </div>
    );
};
