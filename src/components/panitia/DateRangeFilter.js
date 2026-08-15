'use client';

import { Calendar, X, Check } from 'lucide-react';
import { getDaysBetween } from '@/lib/dashboardUtils';

export default function DateRangeFilter({
    startDate,
    endDate,
    onStartChange,
    onEndChange,
    onFilterChange,
    onApply,
    onClear,
    appliedRange,
    maxDays = 365,
    showLabel = true,
}) {
    const startVal = startDate ?? '';
    const endVal = endDate ?? '';

    const handleStartChange = (val) => {
        if (onStartChange) {
            onStartChange(val);
        } else if (onFilterChange) {
            onFilterChange(val || null, endDate || null);
        }
    };

    const handleEndChange = (val) => {
        if (onEndChange) {
            onEndChange(val);
        } else if (onFilterChange) {
            onFilterChange(startDate || null, val || null);
        }
    };

    const handleClear = () => {
        if (onClear) {
            onClear();
        } else if (onFilterChange) {
            onFilterChange(null, null);
        }
    };

    const diff = startVal && endVal ? getDaysBetween(startVal, endVal) : 0;
    const isValid = Boolean(startVal && endVal && diff >= 0 && diff <= maxDays);
    const canApply = isValid || (Boolean(appliedRange) && (!startVal || !endVal));
    const hasError = Boolean(startVal && endVal && (diff < 0 || diff > maxDays));

    const handleApplyClick = () => {
        if (!startVal || !endVal) {
            handleClear();
        } else if (isValid && onApply) {
            onApply();
        }
    };

    return (
        <div className="space-y-1.5">
            {showLabel && <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Filter Tanggal</p>}
            <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-blue-500/30 w-full sm:w-auto">
                    <Calendar size={15} className="text-gray-400 shrink-0" />
                    <input
                        type="date"
                        value={startVal}
                        onChange={(e) => handleStartChange(e.target.value)}
                        onClick={(e) => {
                            try { e.target.showPicker?.(); } catch (err) {}
                        }}
                        className="bg-transparent border-none outline-none py-0.5 text-xs text-gray-900 dark:text-white font-medium cursor-pointer dark:[color-scheme:dark] min-w-[105px] shrink-0"
                        title="Tanggal awal"
                    />
                    <span className="text-gray-400 text-xs shrink-0">–</span>
                    <input
                        type="date"
                        value={endVal}
                        onChange={(e) => handleEndChange(e.target.value)}
                        onClick={(e) => {
                            try { e.target.showPicker?.(); } catch (err) {}
                        }}
                        className="bg-transparent border-none outline-none py-0.5 text-xs text-gray-900 dark:text-white font-medium cursor-pointer dark:[color-scheme:dark] min-w-[105px] shrink-0"
                        title="Tanggal akhir"
                    />
                    {(startVal || endVal || appliedRange) && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors shrink-0 ml-auto"
                            title="Reset tanggal"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
                {onApply && (
                    <button
                        type="button"
                        onClick={handleApplyClick}
                        disabled={!canApply}
                        className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed w-full sm:w-auto shrink-0"
                    >
                        <Check size={14} /> Oke
                    </button>
                )}
            </div>
            {hasError && (
                <p className="text-[11px] text-red-500 dark:text-red-400 font-medium">
                    {diff < 0 ? 'Tanggal akhir harus setelah tanggal awal' : `Maksimal rentang ${maxDays} hari`}
                </p>
            )}
        </div>
    );
}
