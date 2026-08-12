'use server';

/**
 * Server Action to get the current server time in ISO string format.
 * This runs on the server environment, preventing client-side clock manipulation.
 * @returns {Promise<string>} Current server time in ISO format
 */
export async function getServerTime() {
    return new Date().toISOString();
}
