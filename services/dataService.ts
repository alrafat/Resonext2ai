import { supabase } from './supabaseClient';
import type { UserData } from '../types';
import type { AuthTokenResponse, SignUpWithPasswordCredentials } from '@supabase/supabase-js';

// --- Auth ---

export async function signUp(email: string, password: string, options: { fullName: string }): Promise<AuthTokenResponse> {
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
    return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut(): Promise<{ error: null }> {
    await supabase.auth.signOut();
    return { error: null }; // signOut doesn't return an error in the same way, so we normalize the response
}

export async function signInWithGoogle() {
    // Before calling this, ensure you have enabled the Google provider in your Supabase project's Authentication settings.
    await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
}

// --- Session Management ---

export function getSession() {
    return supabase.auth.getSession();
}

export function onAuthStateChange(callback: (event: string, session: import('@supabase/supabase-js').Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
}

// --- User Data ---

/**
 * Fetches the data payload for a specific user from the 'user_data' table.
 * @param email The user's email.
 * @returns A promise that resolves to the UserData or null if not found.
 */
export async function getUserData(email: string): Promise<UserData | null> {
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
    const { error } = await supabase
        .from('user_data')
        .upsert({ user_email: email, data: data }, { onConflict: 'user_email' });

    if (error) {
        console.error("Error saving user data:", error);
    }
}