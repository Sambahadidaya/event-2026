import { updateVersionAdminConfig } from '@/data/updateVersionAdminData';

export function getUpdateVersionAdminConfig(site) {
    return updateVersionAdminConfig[site] || null;
}

export function shouldShowUpdateAdminPopup(site) {
    if (typeof window === 'undefined') return false;
    const config = updateVersionAdminConfig[site];
    if (!config) return false;

    try {
        const lastSeenVersion = localStorage.getItem(config.storageKey);
        return lastSeenVersion !== config.currentVersion;
    } catch (e) {
        console.error('Error reading localStorage for admin update version:', e);
        return false;
    }
}

export function markAdminVersionAsSeen(site) {
    if (typeof window === 'undefined') return;
    const config = updateVersionAdminConfig[site];
    if (!config) return;

    try {
        localStorage.setItem(config.storageKey, config.currentVersion);
    } catch (e) {
        console.error('Error writing to localStorage for admin update version:', e);
    }
}
