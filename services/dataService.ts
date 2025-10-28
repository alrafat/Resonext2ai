

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
    const { data, error } = await supabase.auth.signUp(credentials);

    // If signup is successful, create an initial entry in the user_data table
    if (!error && data.user) {
        const initialUserData: UserData = {
            profiles: [],
            activeProfileId: null,
            savedProfessors: [],
            savedPrograms: [],
            sops: [],
        };
        await supabase
            .from('user_data')
            .insert({ user_email: data.user.email, data: initialUserData });
    }

    return { data, error };
}

export async function signIn(email: string, password: string): Promise<AuthTokenResponse> {
    const supabase = getSupabase();
    if (!supabase) return createConfigError();
    return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut(): Promise<{ error: null }> {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
    }
    return { error: null }; // signOut doesn't return an error in the same way, so we normalize the response
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
 */
export async function getUserData(email: string): Promise<UserData | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('user_data')
        .select('data')
        .eq('user_email', email)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116: "object not found" - this is expected if user has no data yet
        console.error("Error fetching user data:", error);
        return null;
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