'use client';

import { Calendar, X, Check } from 'lucide-react';
import { getDaysBetween } from '@/lib/dashboardUtils';

export default function DateRangeFilter({
    startDate,
    endDate,
    onStartChange,
    onEndChange,
    onApply,
    onClear,
    appliedRange,
    maxDays = 30,
}) {
    const diff = startDate && endDate ? getDaysBetween(startDate, endDate) : 0;
    const isValid = startDate && endDate && diff >= 0 && diff <= maxDays;
    const hasError = startDate && endDate && (diff < 0 || diff > maxDays);

    return (
        <div className="space-y-2">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Filter Tanggal</p>
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/80 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/30">
                    <Calendar size={15} className="ml-2.5 text-gray-400 shrink-0" />
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => onStartChange(e.target.value)}
                        className="flex-1 min-w-0 bg-transparent border-none outline-none py-2 text-xs sm:text-sm text-gray-700 dark:text-gray-200 font-medium cursor-pointer dark:[color-scheme:dark]"
                        title="Tanggal awal"
                    />
                    <span className="text-gray-400 text-xs shrink-0">–</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => onEndChange(e.target.value)}
                        className="flex-1 min-w-0 bg-transparent border-none outline-none py-2 pr-1 text-xs sm:text-sm text-gray-700 dark:text-gray-200 font-medium cursor-pointer dark:[color-scheme:dark]"
                        title="Tanggal akhir"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onApply}
                        disabled={!isValid}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <Check size={14} />
                        Oke
                    </button>
                    {(appliedRange || startDate || endDate) && (
                        <button
                            type="button"
                            onClick={onClear}
                            className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-400 hover:text-red-500 hover:border-red-200 dark:hover:border-red-800 transition-colors"
                            title="Hapus filter"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>
            {hasError && (
                <p className="text-[11px] text-red-500 dark:text-red-400 font-medium">
                    {diff < 0 ? 'Tanggal akhir harus setelah tanggal awal' : `Maksimal rentang ${maxDays} hari`}
                </p>
            )}
            {appliedRange ? (
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    {getDaysBetween(appliedRange.start, appliedRange.end) + 1} hari dipilih
                </p>
            ) : (
                <p className="text-xs text-gray-400 dark:text-gray-500">Pilih rentang tanggal (maks. {maxDays} hari)</p>
            )}
        </div>
    );
}
