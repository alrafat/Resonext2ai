

import { getSupabase } from './supabaseClient';
import type { UserData } from '../types';
import type { AuthTokenResponse, SignUpWithPasswordCredentials, Session, AuthError } from '@supabase/supabase-js';

const createConfigError = (): AuthTokenResponse => ({
    data: { user: null, session: null },
    error: {
        message: 'Supabase client is not configured. Please check your environment variables.',
        name: 'ConfigurationError',
        status: 500,
    } as AuthError,
});

// --- Auth ---

export async function signUp(email: string, password: string, options: { fullName: string }): Promise<AuthTokenResponse> {
    const supabase = getSupabase();
    if (!supabase) return createConfigError();
    
    const credentials: SignUpWithPasswordCredentials = {
        email,
        password,
        options: {
            data: {
                full_name: options.fullName
            }
        }
    };
    // Let the main app component handle data creation on first login
    return supabase.auth.signUp(credentials);
}

export async function signIn(email: string, password: string): Promise<AuthTokenResponse> {
    const supabase = getSupabase();
    if (!supabase) return createConfigError();
    return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut(): Promise<{ error: AuthError | null }> {
    const supabase = getSupabase();
    if (!supabase) {
        return { error: null };
    }
    // Using { scope: 'global' } can help ensure all sessions are terminated.
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    return { error };
}


export async function signInWithGoogle() {
    const supabase = getSupabase();
    if (!supabase) {
        console.error("Supabase not configured, cannot sign in with Google.");
        return;
    }
    // Before calling this, ensure you have enabled the Google provider in your Supabase project's Authentication settings.
    await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
}

// --- Session Management ---

export function getSession(): Promise<{ data: { session: Session | null }, error: AuthError | null }> {
    const supabase = getSupabase();
    if (!supabase) return Promise.resolve({ data: { session: null }, error: null });
    return supabase.auth.getSession();
}

export function onAuthStateChange(callback: (event: string, session: import('@supabase/supabase-js').Session | null) => void) {
    const supabase = getSupabase();
    if (!supabase) {
        // Return a dummy subscription object that does nothing, preventing a crash.
        return { data: { subscription: { unsubscribe: () => {} } } };
    }
    return supabase.auth.onAuthStateChange(callback);
}

// --- User Data ---

/**
 * Fetches the data payload for a specific user from the 'user_data' table.
 * @param email The user's email.
 * @returns A promise that resolves to the UserData or null if not found.
 * @throws {AuthError} If a database or network error occurs.
 */
export async function getUserData(email: string): Promise<UserData | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('user_data')
        .select('data')
        .eq('user_email', email)
        .single();

    if (error) {
        // 'PGRST116' is the code for "object not found". This is an expected
        // outcome for a new user and should not be treated as an error.
        if (error.code === 'PGRST116') {
            return null;
        }
        // For any other error (network, permissions, etc.), we must throw it
        // so the UI can catch it and prevent data-destroying actions.
        console.error("Error fetching user data:", error);
        throw error;
    }

    return data ? data.data : null;
}

/**
 * Saves or updates the data payload for a specific user in the 'user_data' table.
 * @param email The user's email.
 * @param data The UserData object to save.
 */
export async function saveUserData(email: string, data: UserData): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) {
        console.error("Supabase not configured, cannot save user data.");
        return;
    }
    
    const { error } = await supabase
        .from('user_data')
        .upsert({ user_email: email, data: data }, { onConflict: 'user_email' });

    if (error) {
        console.error("Error saving user data:", error);
    }
}