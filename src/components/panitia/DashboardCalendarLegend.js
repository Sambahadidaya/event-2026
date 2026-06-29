'use client';

import { useMemo } from 'react';
import { ChevronLeft, ChevronRight, Eraser } from 'lucide-react';
import {
    MONTH_NAMES, DAY_HEADERS, TRAFFIC_LEVELS,
    getCalendarCells, getTrafficLevel, toDateKey, isDateInRange
} from '@/lib/dashboardUtils';

export default function DashboardCalendarLegend({
    calendarMonth,
    onNavigateMonth,
    dailyCounts = {},
    appliedDateRange,
    onDayClick,
    onFormatMonth,
    formatting = false,
    loading = false,
    levels = TRAFFIC_LEVELS,
    legendTitle = 'Keterangan Warna',
    legendDescription = 'Skala biru sequential — semakin gelap, semakin tinggi aktivitas harian.',
    showFormatButton = false,
    countLabel = 'data',
    donutChart = null,
}) {
    const calendarCells = useMemo(
        () => getCalendarCells(calendarMonth.year, calendarMonth.month),
        [calendarMonth]
    );

    const calendarRows = useMemo(() => {
        const rows = [];
        for (let i = 0; i < calendarCells.length; i += 7) {
            const week = calendarCells.slice(i, i + 7);
            while (week.length < 7) week.push(null);
            rows.push(week);
        }
        return rows;
    }, [calendarCells]);

    const todayKey = toDateKey(new Date());

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
            <div className={`bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-x-auto ${donutChart ? 'lg:col-span-1' : 'lg:col-span-2'}`}>
                <div className="flex items-center justify-between mb-4 gap-3 flex-wrap min-w-[280px]">
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => onNavigateMonth('prev')}
                            className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
                            aria-label="Bulan sebelumnya"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-200 min-w-[120px] text-center">
                            {MONTH_NAMES[calendarMonth.month]} {calendarMonth.year}
                        </h3>
                        <button
                            type="button"
                            onClick={() => onNavigateMonth('next')}
                            className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
                            aria-label="Bulan berikutnya"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                    {showFormatButton && onFormatMonth && (
                        <button
                            type="button"
                            onClick={onFormatMonth}
                            disabled={formatting || loading}
                            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Hapus data bulan ini"
                        >
                            <Eraser size={14} className={formatting ? 'animate-pulse' : ''} />
                            Format
                        </button>
                    )}
                </div>

                <div className="flex justify-center">
                    <table className="border-collapse w-auto">
                        <thead>
                            <tr>
                                {DAY_HEADERS.map(day => (
                                    <th key={day} className="pb-1.5 px-0.5 text-[10px] font-semibold text-gray-400 dark:text-gray-500 text-center w-8 sm:w-9">
                                        {day}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {calendarRows.map((week, rowIdx) => (
                                <tr key={rowIdx}>
                                    {week.map((day, colIdx) => {
                                        const dateKey = day
                                            ? `${calendarMonth.year}-${String(calendarMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                                            : null;
                                        const count = dateKey ? (dailyCounts[dateKey] || 0) : 0;
                                        const level = getTrafficLevel(count, levels);
                                        const inRange = isDateInRange(dateKey, appliedDateRange);
                                        const isToday = dateKey === todayKey;
                                        const outOfRange = appliedDateRange && dateKey && !inRange;

                                        return (
                                            <td key={colIdx} className="p-0.5">
                                                {day ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => onDayClick?.(day, dateKey)}
                                                        title={`${day} ${MONTH_NAMES[calendarMonth.month]}: ${count} ${countLabel}`}
                                                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-md border flex flex-col items-center justify-center leading-none transition-all hover:brightness-95 dark:hover:brightness-110 ${level.cell} ${
                                                            inRange ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-gray-900' : ''
                                                        } ${isToday && !inRange ? 'ring-1 ring-slate-400/60 dark:ring-slate-500/60' : ''} ${
                                                            outOfRange ? 'opacity-40' : ''
                                                        }`}
                                                    >
                                                        <span className="text-[10px] sm:text-[11px] font-semibold">{day}</span>
                                                        <span className="text-[7px] sm:text-[8px] font-normal opacity-75 mt-0.5">{count}</span>
                                                    </button>
                                                ) : (
                                                    <div className="w-8 h-8 sm:w-9 sm:h-9" />
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {donutChart && (
                <div className="lg:col-span-1 flex items-stretch">
                    {donutChart}
                </div>
            )}

            <div className={`bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 ${donutChart ? 'lg:col-span-1' : ''}`}>
                <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-3">{legendTitle}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">{legendDescription}</p>
                <ul className="space-y-2">
                    {levels.map(level => (
                        <li key={level.label} className="flex items-center gap-2.5">
                            <span className={`w-6 h-6 rounded-md border border-black/5 dark:border-white/5 shrink-0 ${level.swatch}`} />
                            <span className="text-xs text-gray-600 dark:text-gray-300">
                                {level.label} {countLabel}
                            </span>
                        </li>
                    ))}
                </ul>
                {appliedDateRange && (
                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">Rentang dipilih</p>
                        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 leading-snug">
                            {new Date(appliedDateRange.start).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                            {' – '}
                            {new Date(appliedDateRange.end).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
