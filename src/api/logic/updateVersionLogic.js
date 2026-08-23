import { updateVersionConfig } from '@/data/updateVersionData';

export function getUpdateVersionConfig(site) {
    return updateVersionConfig[site] || null;
}

export function shouldShowUpdatePopup(site) {
    if (typeof window === 'undefined') return false;
    const config = updateVersionConfig[site];
    if (!config) return false;

    try {
        const lastSeenVersion = localStorage.getItem(config.storageKey);
        return lastSeenVersion !== config.currentVersion;
    } catch (e) {
        console.error('Error reading localStorage:', e);
        return false;
    }
}

export function markVersionAsSeen(site) {
    if (typeof window === 'undefined') return;
    const config = updateVersionConfig[site];
    if (!config) return;

    try {
        localStorage.setItem(config.storageKey, config.currentVersion);
    } catch (e) {
        console.error('Error writing to localStorage:', e);
    }
}
