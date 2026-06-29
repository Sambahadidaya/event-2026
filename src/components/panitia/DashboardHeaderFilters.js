'use client';

import { RefreshCw, MonitorPlay, Filter } from 'lucide-react';
import DashboardSelect from './DashboardSelect';
import { formatSyncTime } from '@/lib/dashboardUtils';

const SITE_OPTIONS = [
    { value: 'all', label: 'Semua Situs' },
    { value: 'portal', label: 'Portal Utama' },
    { value: 'pkkmb', label: 'PKKMB' },
    { value: 'pose', label: 'POSE' },
];

const SITE_OPTIONS_FAQ = [
    { value: 'all', label: 'Semua Situs' },
    { value: 'pkkmb', label: 'PKKMB' },
    { value: 'pose', label: 'POSE' },
];

export default function DashboardHeaderFilters({
    title,
    subtitle,
    icon: Icon,
    adminRole,
    siteFilter,
    onSiteFilterChange,
    showSiteFilter = true,
    siteOptions,
    timeFilter,
    onTimeFilterChange,
    timeFilterOptions,
    timeFilterDisabled = false,
    onRefresh,
    loading = false,
    lastSyncedAt,
    extraFilters,
}) {
    const isSuperAdmin = !adminRole || adminRole === 'super_admin';
    const options = siteOptions || (title?.includes('FAQ') ? SITE_OPTIONS_FAQ : SITE_OPTIONS);

    return (
        <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 sm:p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
                    {Icon && <Icon size={22} />}
                </div>
                <div className="min-w-0">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">{title}</h2>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
                {showSiteFilter && isSuperAdmin && onSiteFilterChange && (
                    <DashboardSelect
                        icon={MonitorPlay}
                        value={siteFilter}
                        onChange={(e) => onSiteFilterChange(e.target.value)}
                        options={options}
                        className="w-full sm:w-auto sm:min-w-[150px]"
                    />
                )}
                {timeFilterOptions && onTimeFilterChange && (
                    <DashboardSelect
                        icon={Filter}
                        value={timeFilter}
                        onChange={(e) => onTimeFilterChange(e.target.value)}
                        options={timeFilterOptions}
                        disabled={timeFilterDisabled}
                        className="w-full sm:w-auto sm:min-w-[180px]"
                    />
                )}
                {extraFilters}
                <button
                    type="button"
                    onClick={onRefresh}
                    disabled={loading}
                    className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 px-3 sm:px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-60 w-full sm:w-auto justify-center sm:justify-start shadow-sm"
                >
                    <RefreshCw size={16} className={`shrink-0 ${loading ? 'animate-spin text-blue-500' : 'text-gray-500'}`} />
                    <span className="flex flex-col items-start leading-tight">
                        <span className="text-gray-700 dark:text-gray-200">Refresh</span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-normal">
                            {formatSyncTime(lastSyncedAt)}
                        </span>
                    </span>
                </button>
            </div>
        </div>
    );
}
