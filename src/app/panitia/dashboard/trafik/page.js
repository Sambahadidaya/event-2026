'use client';

import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Filler, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useTheme } from 'next-themes';
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { RefreshCw, Filter, MonitorPlay, Activity } from 'lucide-react';
import { useRouter } from 'next/navigation';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Filler, Tooltip, Legend);

export default function TrafikDashboard() {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [rawTrafik, setRawTrafik] = useState([]);
    const [loading, setLoading] = useState(true);
    const [adminRole, setAdminRole] = useState(null);
    const router = useRouter();

    const [siteFilter, setSiteFilter] = useState('all'); // all, pkkmb, pose, portal
    const [timeFilter, setTimeFilter] = useState('week'); // today (perjam), week (perhari), month (perminggu)

    const fetchAdminAndTrafik = async () => {
        setLoading(true);
        
        // Fetch Admin Role
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            router.push('/panitia/login');
            return;
        }

        const { data: admin } = await supabase
            .from('admins')
            .select('role')
            .eq('user_id', session.user.id)
            .single();

        let initialSiteFilter = 'all';
        if (admin) {
            setAdminRole(admin.role);
            if (admin.role === 'admin_pkkmb') {
                initialSiteFilter = 'pkkmb';
                setSiteFilter('pkkmb');
            } else if (admin.role === 'admin_pose') {
                initialSiteFilter = 'pose';
                setSiteFilter('pose');
            }
        }

        // default fetch all data from last 30 days to cover all filters
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        let query = supabase.from('trafik_kunjungan').select('*').gte('visited_at', thirtyDaysAgo.toISOString());
        
        // If not super admin, we can also strictly filter from database to be safe
        if (admin && admin.role === 'admin_pkkmb') {
            query = query.eq('site', 'pkkmb');
        } else if (admin && admin.role === 'admin_pose') {
            query = query.eq('site', 'pose');
        }

        const { data, error } = await query;

        if (data && !error) {
            setRawTrafik(data);
            localStorage.setItem(`admin_trafik_data_${admin?.role || 'all'}`, JSON.stringify(data));
            localStorage.setItem(`admin_trafik_time_${admin?.role || 'all'}`, Date.now().toString());
        }
        setLoading(false);
    };

    useEffect(() => {
        setMounted(true);
        fetchAdminAndTrafik();
        // Ignoring cache temporarily for simpler RBAC implementation
    }, []);

    const isDark = theme === 'dark';
    const textColor = isDark ? '#9ca3af' : '#4b5563';
    const gridColor = isDark ? '#374151' : '#f3f4f6';

    const processedData = useMemo(() => {
        // Filter by site
        let filtered = rawTrafik;
        if (siteFilter !== 'all') {
            filtered = filtered.filter(item => item.site === siteFilter);
        }

        // Filter and group by time
        const now = new Date();
        const labels = [];
        const dataPoints = [];

        if (timeFilter === 'today') {
            // Last 24 hours, group by hour
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            filtered = filtered.filter(item => new Date(item.visited_at) >= startOfDay);

            for (let i = 0; i < 24; i++) {
                labels.push(`${i.toString().padStart(2, '0')}:00`);
                dataPoints.push(0);
            }

            filtered.forEach(item => {
                const date = new Date(item.visited_at);
                const hour = date.getHours();
                dataPoints[hour]++;
            });

        } else if (timeFilter === 'week') {
            // Last 7 days, group by day
            const startOfWeek = new Date();
            startOfWeek.setDate(startOfWeek.getDate() - 6);
            startOfWeek.setHours(0, 0, 0, 0);
            filtered = filtered.filter(item => new Date(item.visited_at) >= startOfWeek);

            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                labels.push(d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }));
                dataPoints.push(0);
            }

            filtered.forEach(item => {
                const date = new Date(item.visited_at);
                const dayDiff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
                if (dayDiff >= 0 && dayDiff < 7) {
                    dataPoints[6 - dayDiff]++;
                }
            });

        } else if (timeFilter === 'month') {
            // Last 4 weeks, group by week
            const startOfMonth = new Date();
            startOfMonth.setDate(startOfMonth.getDate() - 27);
            startOfMonth.setHours(0, 0, 0, 0);
            filtered = filtered.filter(item => new Date(item.visited_at) >= startOfMonth);

            labels.push('Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4');
            dataPoints.push(0, 0, 0, 0);

            filtered.forEach(item => {
                const date = new Date(item.visited_at);
                const dayDiff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
                if (dayDiff >= 0 && dayDiff < 28) {
                    const weekIdx = 3 - Math.floor(dayDiff / 7);
                    dataPoints[weekIdx]++;
                }
            });
        }

        return { labels, dataPoints, total: filtered.length };
    }, [rawTrafik, siteFilter, timeFilter]);

    const chartData = {
        labels: processedData.labels,
        datasets: [
            {
                label: 'Kunjungan',
                data: processedData.dataPoints,
                borderColor: '#3b82f6',
                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#3b82f6',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                tension: 0.4,
                fill: true
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                titleColor: isDark ? '#f9fafb' : '#111827',
                bodyColor: isDark ? '#d1d5db' : '#4b5563',
                borderColor: isDark ? '#374151' : '#e5e7eb',
                borderWidth: 1,
                padding: 12,
                displayColors: false,
                callbacks: {
                    label: function (context) {
                        return `${context.parsed.y} Kunjungan`;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: textColor, font: { family: 'Inter, sans-serif' } }
            },
            y: {
                grid: { color: gridColor, borderDash: [4, 4] },
                ticks: { color: textColor, font: { family: 'Inter, sans-serif' }, precision: 0 },
                beginAtZero: true
            }
        },
        interaction: {
            intersect: false,
            mode: 'index',
        },
    };

    if (!mounted) return <div className="animate-pulse h-96 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header & Filters */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                        <Activity size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Analisis Trafik</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Pantau pergerakan pengunjung situs Anda</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {(!adminRole || adminRole === 'super_admin') && (
                        <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800/50">
                            <MonitorPlay size={16} className="ml-3 text-gray-500" />
                            <select
                                value={siteFilter}
                                onChange={(e) => setSiteFilter(e.target.value)}
                                className="bg-transparent border-none outline-none py-2 px-3 text-sm text-gray-700 dark:text-gray-200 font-medium cursor-pointer"
                            >
                                <option value="all">Semua Situs</option>
                                <option value="portal">Portal Utama</option>
                                <option value="pkkmb">PKKMB</option>
                                <option value="pose">POSE</option>
                            </select>
                        </div>
                    )}
                    <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800/50">
                        <Filter size={16} className="ml-3 text-gray-500" />
                        <select
                            value={timeFilter}
                            onChange={(e) => setTimeFilter(e.target.value)}
                            className="bg-transparent border-none outline-none py-2 px-3 text-sm text-gray-700 dark:text-gray-200 font-medium cursor-pointer"
                        >
                            <option value="today">Hari Ini (Per Jam)</option>
                            <option value="week">7 Hari Terakhir (Per Hari)</option>
                            <option value="month">4 Minggu Terakhir</option>
                        </select>
                    </div>

                    <button
                        onClick={fetchAdminAndTrafik}
                        className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin text-blue-500' : 'text-gray-500'} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">Total Kunjungan</p>
                        <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{processedData.total}</h3>
                        <p className="text-xs text-blue-500 mt-2 font-medium">Berdasarkan filter aktif</p>
                    </div>
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                        <Activity size={28} className="text-blue-500" />
                    </div>
                </div>
                {/* Additional context cards */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-2">Rata-rata Harian</p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {timeFilter === 'week' ? Math.round(processedData.total / 7) : timeFilter === 'month' ? Math.round(processedData.total / 28) : processedData.total}
                    </h3>
                </div>
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-2">Puncak Akses</p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {processedData.dataPoints.length > 0 ? processedData.labels[processedData.dataPoints.indexOf(Math.max(...processedData.dataPoints))] : '-'}
                    </h3>
                </div>
            </div>

            {/* Main Chart */}
            <div className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">Grafik Kunjungan Aktif</h3>
                        <p className="text-sm text-gray-500">Visualisasi data berdasarkan waktu pengunjung</p>
                    </div>
                </div>
                <div className="h-80 w-full relative">
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-900/50 z-10 backdrop-blur-sm">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : null}
                    <Line data={chartData} options={chartOptions} />
                </div>
            </div>
        </div>
    );
}
