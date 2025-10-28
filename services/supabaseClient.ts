

import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js';

// A private variable to hold the client instance.
let _supabase: SupabaseClient | null = null;

const getKeys = () => {
    // 1. Try environment variables (for production deployments like Vercel)
    const envUrl = process.env.SUPABASE_URL;
    const envKey = process.env.SUPABASE_ANON_KEY;

    if (envUrl && envUrl !== 'undefined' && envKey && envKey !== 'undefined') {
        return { url: envUrl, key: envKey };
    }

    // 2. Fallback to localStorage (for local development in tools like AI Studio)
    if (typeof window !== 'undefined') {
        const storedUrl = localStorage.getItem('SUPABASE_URL');
        const storedKey = localStorage.getItem('SUPABASE_ANON_KEY');
        if (storedUrl && storedKey) {
            return { url: storedUrl, key: storedKey };
        }
    }

    // 3. If no keys are found, return null.
    return { url: null, key: null };
};

// Initialize the client on module load.
const { url, key } = getKeys();
if (url && key) {
    try {
        _supabase = createClient(url, key);
    } catch (e) {
        console.error("Failed to create Supabase client:", e);
        _supabase = null;
    }
}

/**
 * Returns the singleton Supabase client instance.
 * @returns {SupabaseClient | null} The Supabase client or null if not configured.
 */
export const getSupabase = (): SupabaseClient | null => _supabase;

/**
 * Checks if the Supabase client has been successfully configured and initialized.
 * @returns {boolean} True if the client is available, false otherwise.
 */
export const isSupabaseConfigured = (): boolean => !!_supabase;

/**
 * Creates and stores a new Supabase client instance from user-provided credentials.
 * This should be used by a setup UI to configure the app for local development.
 * @param {string} newUrl - The Supabase project URL.
 * @param {string} newKey - The Supabase anon (public) key.
 * @returns {SupabaseClient | null} The new client instance or null on failure.
 */
export const setupSupabase = (newUrl: string, newKey: string): SupabaseClient | null => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('SUPABASE_URL', newUrl);
        localStorage.setItem('SUPABASE_ANON_KEY', newKey);
    }
    try {
        _supabase = createClient(newUrl, newKey);
    } catch (e) {
        console.error("Failed to create Supabase client with provided credentials:", e);
        _supabase = null;
    }
    return _supabase;
};