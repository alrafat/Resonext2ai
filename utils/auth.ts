// IMPORTANT: This is a placeholder for a real, secure hashing algorithm.
// In a production application, you would use a library like `bcrypt` on a server.
// Storing passwords, even "hashed" this way, on the client-side is insecure.
// This is for demonstration purposes only to show the principle of not storing plain text.

/**
 * A simple, non-secure "hashing" function for demonstration.
 * @param password The plain-text password.
 * @returns A base64 encoded string.
 */
export const hashPassword = (password: string): string => {
  // Appending a simple "salt" to make direct lookups slightly harder.
  return btoa(password + 'resonext_salt_demo'); 
};

/**
 * Compares a plain-text password with a stored "hash".
 * @param password The plain-text password from a login attempt.
 * @param hash The stored "hash" from the user database.
 * @returns True if the passwords match, false otherwise.
 */
export const comparePassword = (password: string, hash: string): boolean => {
  return hashPassword(password) === hash;
};
