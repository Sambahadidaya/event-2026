'use client';

import { useMemo } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

export default function AbsensiDashboardCharts({ statsData = [] }) {
    // 1. Overall Stats calculation (for Doughnut chart)
    const overallStats = useMemo(() => {
        let totalHadir = 0;
        let totalIzin = 0;
        let totalSakit = 0;
        let totalAlpha = 0;

        statsData.forEach(item => {
            totalHadir += item.hadir || 0;
            totalIzin += item.izin || 0;
            totalSakit += item.sakit || 0;
            totalAlpha += item.alpha || 0;
        });

        return {
            hadir: totalHadir,
            izin: totalIzin,
            sakit: totalSakit,
            alpha: totalAlpha,
            total: totalHadir + totalIzin + totalSakit + totalAlpha
        };
    }, [statsData]);

    // 2. Data for Doughnut Chart
    const doughnutData = {
        labels: ['Hadir', 'Izin', 'Sakit', 'Alpha'],
        datasets: [
            {
                data: [
                    overallStats.hadir,
                    overallStats.izin,
                    overallStats.sakit,
                    overallStats.alpha
                ],
                backgroundColor: [
                    'rgba(16, 185, 129, 0.85)', // Hadir: Emerald
                    'rgba(59, 130, 246, 0.85)',  // Izin: Blue
                    'rgba(245, 158, 11, 0.85)',  // Sakit: Amber
                    'rgba(239, 68, 68, 0.85)'    // Alpha: Red
                ],
                borderColor: [
                    '#10b981',
                    '#3b12f6',
                    '#f59e0b',
                    '#ef4444'
                ],
                borderWidth: 1.5,
                hoverOffset: 6
            }
        ]
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    usePointStyle: true,
                    boxWidth: 8,
                    boxHeight: 8,
                    font: {
                        family: "'Inter', sans-serif",
                        size: 11,
                        weight: '500'
                    },
                    padding: 15
                }
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                padding: 10,
                cornerRadius: 8,
                callbacks: {
                    label: function (context) {
                        const value = context.raw || 0;
                        const pct = overallStats.total > 0 ? ((value / overallStats.total) * 100).toFixed(1) : 0;
                        return ` ${context.label}: ${value} (${pct}%)`;
                    }
                }
            }
        },
        cutout: '65%'
    };

    // 3. Data for Bar Chart (Attendance per Panitia)
    const barData = useMemo(() => {
        const labels = statsData.map(item => item.nama);
        const hadirCounts = statsData.map(item => item.hadir);
        const izinCounts = statsData.map(item => item.izin);
        const sakitCounts = statsData.map(item => item.sakit);
        const alphaCounts = statsData.map(item => item.alpha);

        return {
            labels,
            datasets: [
                {
                    label: 'Hadir',
                    data: hadirCounts,
                    backgroundColor: 'rgba(16, 185, 129, 0.8)',
                    borderRadius: 4
                },
                {
                    label: 'Izin',
                    data: izinCounts,
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderRadius: 4
                },
                {
                    label: 'Sakit',
                    data: sakitCounts,
                    backgroundColor: 'rgba(245, 158, 11, 0.8)',
                    borderRadius: 4
                },
                {
                    label: 'Alpha',
                    data: alphaCounts,
                    backgroundColor: 'rgba(239, 68, 68, 0.8)',
                    borderRadius: 4
                }
            ]
        };
    }, [statsData]);

    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    usePointStyle: true,
                    boxWidth: 8,
                    boxHeight: 8,
                    font: {
                        family: "'Inter', sans-serif",
                        size: 11
                    }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                padding: 10,
                cornerRadius: 8
            }
        },
        scales: {
            x: {
                stacked: true,
                grid: { display: false },
                ticks: {
                    font: {
                        family: "'Inter', sans-serif",
                        size: 9
                    },
                    maxRotation: 45,
                    minRotation: 0
                }
            },
            y: {
                stacked: true,
                grid: { color: 'rgba(148, 163, 184, 0.1)' },
                ticks: {
                    beginAtZero: true,
                    stepSize: 1,
                    font: {
                        family: "'Inter', sans-serif",
                        size: 10
                    }
                }
            }
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Doughnut Chart */}
            <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm flex flex-col">
                <div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-sm">Persentase Kehadiran</h4>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Proporsi status kehadiran panitia</p>
                </div>
                <div className="flex-1 min-h-[220px] relative flex items-center justify-center mt-4">
                    {overallStats.total > 0 ? (
                        <>
                            <Doughnut data={doughnutData} options={doughnutOptions} />
                            <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
                                <span className="text-2xl font-extrabold text-slate-800 dark:text-white">
                                    {overallStats.hadir}
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Hadir
                                </span>
                            </div>
                        </>
                    ) : (
                        <div className="text-xs text-slate-400 dark:text-slate-500">
                            Tidak ada data grafik.
                        </div>
                    )}
                </div>
            </div>

            {/* Bar Chart */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm flex flex-col">
                <div>
                    <h4 className="font-bold text-slate-800 dark:text-white text-sm">Absensi per Personil</h4>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Statistik kehadiran per nama panitia</p>
                </div>
                <div className="flex-1 min-h-[220px] mt-4">
                    {statsData.length > 0 ? (
                        <Bar data={barData} options={barOptions} />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 dark:text-slate-500">
                            Tidak ada data grafik.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
