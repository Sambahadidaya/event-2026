import { welcomeGuideConfig } from '@/data/welcomeGuideData';

/**
 * Normalisasi pathname (misal '/pose/' -> '/pose')
 */
function normalizePathname(pathname) {
    if (!pathname) return '';
    const cleaned = pathname.replace(/\/+$/, '');
    return cleaned === '' ? '/' : cleaned;
}

/**
 * Mengambil konfigurasi welcome guide berdasarkan site dan pathname
 */
export function getWelcomeGuideConfig(site, pathname) {
    const siteConfig = welcomeGuideConfig[site];
    if (!siteConfig) return null;

    const normalized = normalizePathname(pathname);
    
    // Cek kecocokan langsung pathname
    if (siteConfig[normalized]) {
        return siteConfig[normalized];
    }

    // Fallback jika berada di root site
    const rootPath = `/${site}`;
    if (normalized === rootPath && siteConfig[rootPath]) {
        return siteConfig[rootPath];
    }

    return null;
}

/**
 * Memeriksa apakah pop-up panduan perlu dimunculkan berdasarkan versi yang tersimpan di localStorage
 */
export function shouldShowWelcomeGuide(site, pathname) {
    if (typeof window === 'undefined') return false;
    const config = getWelcomeGuideConfig(site, pathname);
    if (!config) return false;

    try {
        const lastSeenVersion = localStorage.getItem(config.storageKey);
        return lastSeenVersion !== config.currentVersion;
    } catch (e) {
        console.error('Error reading localStorage for welcome guide:', e);
        return false;
    }
}

/**
 * Menandai bahwa pop-up panduan untuk halaman ini sudah dilihat
 */
export function markWelcomeGuideAsSeen(site, pathname) {
    if (typeof window === 'undefined') return;
    const config = getWelcomeGuideConfig(site, pathname);
    if (!config) return;

    try {
        localStorage.setItem(config.storageKey, config.currentVersion);
    } catch (e) {
        console.error('Error writing to localStorage for welcome guide:', e);
    }
}
