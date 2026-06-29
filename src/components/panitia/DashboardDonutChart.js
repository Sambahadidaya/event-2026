'use client';

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function DashboardDonutChart({ title, labels, values, colors = ['#3b82f6', '#ef4444'] }) {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    const isDark = theme === 'dark';
    const textColor = isDark ? '#9ca3af' : '#4b5563';

    const donutOptions = {
        plugins: {
            legend: {
                position: 'bottom',
                labels: { color: textColor, padding: 16, usePointStyle: true, font: { size: 11 } },
            },
        },
        cutout: '70%',
        borderWidth: 0,
        maintainAspectRatio: false,
    };

    const donutData = {
        labels,
        datasets: [{ data: values, backgroundColor: colors, hoverOffset: 4 }],
    };

    if (!mounted) {
        return (
            <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 h-72 animate-pulse" />
        );
    }

    return (
        <div className="bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 h-full flex flex-col">
            <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-4 text-center text-sm sm:text-base">{title}</h3>
            <div className="flex-1 min-h-[200px] relative flex justify-center items-center p-2">
                <div className="w-[80%] max-w-[220px] aspect-square flex items-center justify-center">
                    <Doughnut data={donutData} options={donutOptions} />
                </div>
            </div>
        </div>
    );
}
