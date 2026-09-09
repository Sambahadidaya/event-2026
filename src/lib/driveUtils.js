/**
 * Helper utilities for Google Drive URLs and Embeds
 */

/**
 * Extract Google Drive file ID from a URL or raw ID
 * @param {string} input 
 * @returns {string|null}
 */
export function extractDriveFileId(input) {
    if (!input || typeof input !== 'string') return null;
    const clean = input.trim();

    // Match /file/d/{id} pattern
    const fileMatch = clean.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileMatch && fileMatch[1]) return fileMatch[1];

    // Match id={id} query param
    const idMatch = clean.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idMatch && idMatch[1]) return idMatch[1];

    // Match /open?id={id}
    const openMatch = clean.match(/\/open\?id=([a-zA-Z0-9_-]+)/);
    if (openMatch && openMatch[1]) return openMatch[1];

    // If input itself looks like a direct Drive ID (alphanumeric + _ - with length >= 15)
    if (/^[a-zA-Z0-9_-]{15,}$/.test(clean)) {
        return clean;
    }

    return null;
}

/**
 * Generate Google Drive iframe preview URL from input URL or ID
 * @param {string} input 
 * @returns {string|null}
 */
export function getDriveEmbedUrl(input) {
    const fileId = extractDriveFileId(input);
    if (!fileId) return null;
    return `https://drive.google.com/file/d/${fileId}/preview`;
}

/**
 * Format Google Drive direct view/download URL
 * @param {string} input 
 * @returns {string|null}
 */
export function getDriveViewUrl(input) {
    if (!input) return null;
    const clean = input.trim();
    if (clean.startsWith('http://') || clean.startsWith('https://')) {
        return clean;
    }
    const fileId = extractDriveFileId(clean);
    if (fileId) {
        return `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
    }
    return clean;
}
