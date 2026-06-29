'use client';

import { ChevronDown } from 'lucide-react';

export default function DashboardSelect({
    icon: Icon,
    value,
    onChange,
    options = [],
    disabled = false,
    className = '',
}) {
    return (
        <div className={`relative flex items-center min-w-0 ${className}`}>
            <div className="flex items-center w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm hover:border-blue-300 dark:hover:border-blue-600 focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-400 dark:focus-within:border-blue-500 transition-all">
                {Icon && <Icon size={16} className="ml-3 text-gray-400 dark:text-gray-500 shrink-0 pointer-events-none" />}
                <select
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                    className="w-full appearance-none bg-transparent border-none outline-none py-2.5 pl-2 pr-9 text-sm text-gray-700 dark:text-gray-200 font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {options.map(opt => (
                        <option key={opt.value} value={opt.value} className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">
                            {opt.label}
                        </option>
                    ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 text-gray-400 dark:text-gray-500 pointer-events-none" />
            </div>
        </div>
    );
}
