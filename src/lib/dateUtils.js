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
