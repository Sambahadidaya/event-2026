import { welcomeGuideAdminConfig } from '@/data/welcomeGuideAdminData';

/**
 * Normalisasi pathname (misal '/panitia/panduan/' -> '/panitia/panduan')
 */
function normalizePathname(pathname) {
    if (!pathname) return '';
    const cleaned = pathname.replace(/\/+$/, '');
    return cleaned === '' ? '/' : cleaned;
}

/**
 * Mengambil konfigurasi welcome guide admin berdasarkan site dan pathname
 */
export function getWelcomeGuideAdminConfig(site, pathname) {
    const targetSite = site === 'pose' ? 'pose' : 'pkkmb';
    const siteConfig = welcomeGuideAdminConfig[targetSite];
    if (!siteConfig) return null;

    const normalized = normalizePathname(pathname);
    
    // Cek kecocokan langsung pathname
    if (siteConfig[normalized]) {
        return siteConfig[normalized];
    }

    return null;
}

/**
 * Memeriksa apakah pop-up panduan admin perlu dimunculkan berdasarkan versi yang tersimpan di localStorage
 */
export function shouldShowWelcomeGuideAdmin(site, pathname) {
    if (typeof window === 'undefined') return false;
    const config = getWelcomeGuideAdminConfig(site, pathname);
    if (!config) return false;

    try {
        const lastSeenVersion = localStorage.getItem(config.storageKey);
        return lastSeenVersion !== config.currentVersion;
    } catch (e) {
        console.error('Error reading localStorage for admin welcome guide:', e);
        return false;
    }
}

/**
 * Menandai bahwa pop-up panduan admin untuk halaman ini sudah dilihat
 */
export function markWelcomeGuideAdminAsSeen(site, pathname) {
    if (typeof window === 'undefined') return;
    const config = getWelcomeGuideAdminConfig(site, pathname);
    if (!config) return;

    try {
        localStorage.setItem(config.storageKey, config.currentVersion);
    } catch (e) {
        console.error('Error writing to localStorage for admin welcome guide:', e);
    }
}
