
import { createClient } from '@supabase/supabase-js'

// These variables are injected by the Vite build process (see vite.config.ts)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// Export a flag to check if the app is configured, preventing a crash on load.
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Initialize the client with empty strings if variables are missing.
// The Supabase library will then handle connection errors gracefully on the first API call
// instead of the app crashing on startup.
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
