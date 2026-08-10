'use client';

import { Chart as ChartJS, ArcElement, BarElement, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

ChartJS.register(ArcElement, BarElement, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function SalesChart({ type = 'bar', title, labels = [], values = [], colors = [] }) {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    const isDark = theme === 'dark';
    const textColor = isDark ? '#9ca3af' : '#4b5563';
    const gridColor = isDark ? '#1f2937' : '#f3f4f6';

    const defaultColors = [
        '#3b82f6', // blue
        '#10b981', // emerald
        '#8b5cf6', // violet
        '#f59e0b', // amber
        '#ef4444', // red
        '#ec4899', // pink
        '#06b6d4', // cyan
    ];

    const finalColors = colors.length > 0 ? colors : defaultColors;

    const baseOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: type === 'doughnut' ? 'bottom' : 'top',
                labels: {
                    color: textColor,
                    usePointStyle: true,
                    font: { size: 11 }
                }
            },
            tooltip: {
                padding: 10,
                cornerRadius: 8
            }
        }
    };

    const cartesianOptions = {
        ...baseOptions,
        scales: {
            x: {
                grid: { color: gridColor },
                ticks: { color: textColor, font: { size: 10 } }
            },
            y: {
                grid: { color: gridColor },
                ticks: { color: textColor, font: { size: 10 } }
            }
        }
    };

    const doughnutOptions = {
        ...baseOptions,
        cutout: '60%',
        borderWidth: 0
    };

    const chartData = {
        labels,
        datasets: [{
            label: title,
            data: values,
            backgroundColor: type === 'doughnut' ? finalColors : finalColors[0],
            borderColor: type === 'line' ? finalColors[0] : 'transparent',
            borderWidth: type === 'line' ? 2 : 0,
            fill: type === 'line' ? false : true,
            tension: type === 'line' ? 0.3 : 0,
            hoverOffset: type === 'doughnut' ? 4 : 0
        }]
    };

    if (!mounted) {
        return (
            <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 h-72 animate-pulse flex items-center justify-center">
                <div className="text-gray-400 text-sm">Loading chart...</div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 h-full flex flex-col min-h-[300px]">
            <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-4 text-sm sm:text-base">{title}</h3>
            <div className="flex-1 relative min-h-[220px]">
                {type === 'doughnut' && (
                    <div className="w-[85%] max-w-[240px] aspect-square mx-auto flex items-center justify-center">
                        <Doughnut data={chartData} options={doughnutOptions} />
                    </div>
                )}
                {type === 'bar' && (
                    <Bar data={chartData} options={cartesianOptions} />
                )}
                {type === 'line' && (
                    <Line data={chartData} options={cartesianOptions} />
                )}
            </div>
        </div>
    );
}
