import { formatWibDateTime } from './dashboardUtils';

/**
 * Utility: Format date to Indonesian style "04 Agustus 2026 Pukul 08.00 WIB"
 * @param {string|Date} dateStr
 * @returns {string}
 */
export function formatIndoDate(dateStr) {
    return formatWibDateTime(dateStr);
}

/**
 * Convert ISO date string to datetime-local input string in WIB (Asia/Jakarta)
 * @param {string|Date} isoString
 * @returns {string} format "YYYY-MM-DDTHH:mm"
 */
export function toWibInputString(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    const formatter = new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
    const parts = formatter.format(date);
    return parts.replace(' ', 'T');
}

/**
 * Convert datetime-local input string in WIB to ISO string UTC
 * @param {string} wibString format "YYYY-MM-DDTHH:mm"
 * @returns {string|null} ISO 8601 UTC string
 */
export function wibInputToIso(wibString) {
    if (!wibString) return null;
    const clean = wibString.length === 16 ? wibString + ':00' : wibString;
    const withTz = clean.includes('+') || clean.endsWith('Z') ? clean : `${clean}+07:00`;
    const date = new Date(withTz);
    return isNaN(date.getTime()) ? null : date.toISOString();
}

/**
 * Get the display date for an absensi record.
 * If the record has been updated (updated_at > created_at by >1s), use updated_at.
 * @param {{ created_at: string, updated_at?: string }} item
 * @returns {string} formatted date string
 */
export function getAbsensiDisplayDate(item) {
    if (!item) return '-';
    const displayDate =
        item.updated_at &&
            new Date(item.updated_at).getTime() - new Date(item.created_at).getTime() > 1000
            ? item.updated_at
            : item.created_at;
    return formatIndoDate(displayDate);
}

