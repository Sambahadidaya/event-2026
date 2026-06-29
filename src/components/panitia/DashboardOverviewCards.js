'use client';

import DateRangeFilter from './DateRangeFilter';

export default function DashboardOverviewCards({ cards = [], dateRangeProps }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            {cards.map((card, idx) => (
                <div
                    key={card.key || idx}
                    className="bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3"
                >
                    <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">{card.label}</p>
                        <h3 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white truncate">{card.value}</h3>
                        {card.subtext && (
                            <p className={`text-xs mt-1.5 font-medium truncate ${card.subtextClass || 'text-blue-500'}`}>
                                {card.subtext}
                            </p>
                        )}
                    </div>
                    {card.icon && (
                        <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shrink-0 ${card.iconBg || 'bg-blue-50 dark:bg-blue-900/20'}`}>
                            <card.icon size={card.iconSize || 24} className={card.iconClass || 'text-blue-500'} />
                        </div>
                    )}
                </div>
            ))}
            {dateRangeProps && (
                <div className="bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 sm:col-span-2 xl:col-span-1">
                    <DateRangeFilter {...dateRangeProps} />
                </div>
            )}
        </div>
    );
}
