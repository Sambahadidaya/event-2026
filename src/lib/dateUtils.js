/**
 * Utility: Format date to Indonesian style "4 agustus 2026 08.00WIB"
 * @param {string|Date} dateStr
 * @returns {string}
 */
export function formatIndoDate(dateStr) {
    if (!dateStr) return '-';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '-';

        const day = d.getDate();
        const months = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        const month = months[d.getMonth()];
        const year = d.getFullYear();

        const pad = (num) => String(num).padStart(2, '0');
        const hours = pad(d.getHours());
        const minutes = pad(d.getMinutes());

        return `${day} ${month} ${year}, ${hours}.${minutes} WIB`;
    } catch (e) {
        return '-';
    }
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
