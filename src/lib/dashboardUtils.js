export const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const DAY_HEADERS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export const TRAFFIC_LEVELS = [
    {
        min: 200,
        label: '≥ 200',
        cell: 'bg-[#1e40af] border-[#1e3a8a]/40 text-white dark:bg-[#3b82f6] dark:border-blue-400/25 dark:text-white',
        swatch: 'bg-[#1e40af] dark:bg-[#3b82f6]',
    },
    {
        min: 150,
        label: '≥ 150',
        cell: 'bg-[#2563eb] border-[#1d4ed8]/35 text-white dark:bg-[#2563eb]/85 dark:border-blue-400/20 dark:text-white',
        swatch: 'bg-[#2563eb] dark:bg-[#2563eb]/85',
    },
    {
        min: 100,
        label: '≥ 100',
        cell: 'bg-[#60a5fa] border-[#3b82f6]/25 text-[#1e3a8a] dark:bg-[#1d4ed8]/70 dark:border-blue-500/20 dark:text-blue-50',
        swatch: 'bg-[#60a5fa] dark:bg-[#1d4ed8]/70',
    },
    {
        min: 50,
        label: '≥ 50',
        cell: 'bg-[#bfdbfe] border-[#93c5fd]/50 text-[#1e40af] dark:bg-[#1e3a8a]/45 dark:border-blue-700/30 dark:text-blue-100',
        swatch: 'bg-[#bfdbfe] dark:bg-[#1e3a8a]/45',
    },
    {
        min: 1,
        label: '≥ 1',
        cell: 'bg-[#dbeafe] border-[#bfdbfe]/60 text-[#2563eb] dark:bg-[#172554]/50 dark:border-blue-900/40 dark:text-blue-200',
        swatch: 'bg-[#dbeafe] dark:bg-[#172554]/50',
    },
    {
        min: 0,
        label: '0',
        cell: 'bg-slate-50 border-slate-200/80 text-slate-400 dark:bg-slate-800/40 dark:border-slate-700/50 dark:text-slate-500',
        swatch: 'bg-slate-100 dark:bg-slate-700/50',
    },
];

export function startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

export function toDateKey(date) {
    const d = startOfDay(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

export function getTrafficLevel(count, levels = TRAFFIC_LEVELS) {
    for (const level of levels) {
        if (count >= level.min) return level;
    }
    return levels[levels.length - 1];
}

export function getCalendarCells(year, month) {
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let startPad = firstDay.getDay() - 1;
    if (startPad < 0) startPad = 6;

    const cells = [];
    for (let i = 0; i < startPad; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
}

export function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    }) + ' WIB';
}

export function formatSyncTime(timestamp) {
    if (!timestamp) return 'Belum disinkron';
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'Baru saja';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} menit lalu`;
    return new Date(timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export function getDaysBetween(startKey, endKey) {
    const start = startOfDay(new Date(startKey));
    const end = startOfDay(new Date(endKey));
    return Math.round((end - start) / 86400000);
}

export function buildDailyCounts(items, dateField = 'created_at') {
    const map = {};
    items.forEach(item => {
        const key = toDateKey(new Date(item[dateField]));
        map[key] = (map[key] || 0) + 1;
    });
    return map;
}

export function filterByDateRange(items, range, dateField = 'created_at') {
    if (!range?.start || !range?.end) return items;
    const start = startOfDay(new Date(range.start));
    const end = startOfDay(new Date(range.end));
    end.setDate(end.getDate() + 1);
    return items.filter(item => {
        const d = new Date(item[dateField]);
        return d >= start && d < end;
    });
}

export function isDateInRange(dateKey, range) {
    if (!range?.start || !range?.end || !dateKey) return false;
    return dateKey >= range.start && dateKey <= range.end;
}
