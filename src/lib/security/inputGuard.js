import { panduanData } from '@/data/panduanData';
import { ketentuanData } from '@/data/ketentuanData';

const ALLOWED_SITES = new Set(['pkkmb', 'pose']);
const YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

/**
 * Validate and sanitize site parameter
 * @param {string} site
 * @returns {string} sanitized site ('pkkmb' | 'pose')
 * @throws {Error} if invalid
 */
export function sanitizeSite(site) {
    if (!site || typeof site !== 'string') {
        throw new Error('Parameter site tidak valid');
    }
    const cleanSite = site.trim().toLowerCase();
    if (!ALLOWED_SITES.has(cleanSite)) {
        throw new Error(`Site '${cleanSite}' tidak diizinkan`);
    }
    return cleanSite;
}

/**
 * Validate YouTube video ID format
 * @param {string} youtubeId
 * @returns {string} clean youtubeId
 * @throws {Error} if invalid format
 */
export function sanitizeYoutubeId(youtubeId) {
    if (!youtubeId || typeof youtubeId !== 'string') {
        throw new Error('ID Video YouTube tidak boleh kosong');
    }
    const cleanId = youtubeId.trim();
    if (!YOUTUBE_ID_REGEX.test(cleanId)) {
        throw new Error('Format ID Video YouTube tidak valid');
    }
    return cleanId;
}

/**
 * Verify if a YouTube ID exists in the registered portal data
 * @param {string} site
 * @param {string} youtubeId
 * @returns {boolean}
 */
export function isRegisteredVideo(site, youtubeId) {
    const cleanSite = sanitizeSite(site);
    const cleanId = sanitizeYoutubeId(youtubeId);

    // Check in panduanData
    const panduanSections = panduanData[cleanSite]?.sections || [];
    for (const sec of panduanSections) {
        if (sec.youtubeId === cleanId) return true;
    }

    // Check in ketentuanData
    const ketentuanSections = ketentuanData[cleanSite]?.sections || [];
    for (const sec of ketentuanSections) {
        if (sec.videos && Array.isArray(sec.videos)) {
            for (const v of sec.videos) {
                if (v.youtubeId === cleanId) return true;
            }
        }
    }

    return false;
}
