'use client';

import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useTheme } from 'next-themes';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import DashboardHeaderFilters from '@/components/panitia/DashboardHeaderFilters';
import DashboardOverviewCards from '@/components/panitia/DashboardOverviewCards';
import DashboardCalendarLegend from '@/components/panitia/DashboardCalendarLegend';
import DashboardDonutChart from '@/components/panitia/DashboardDonutChart';
import {
    MONTH_NAMES, startOfDay, toDateKey, getDaysBetween, filterByDateRange
} from '@/lib/dashboardUtils';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const TIME_FILTER_OPTIONS = [
    { value: 'today', label: 'Hari Ini (Per Jam)' },
    { value: 'week', label: '7 Hari Terakhir (Per Hari)' },
    { value: 'month', label: '4 Minggu Terakhir' },
];

export default function TrafikDashboard() {
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [rawTrafik, setRawTrafik] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formatting, setFormatting] = useState(false);
    const [adminRole, setAdminRole] = useState(null);
    const [lastSyncedAt, setLastSyncedAt] = useState(null);
    const router = useRouter();

    const [siteFilter, setSiteFilter] = useState('all');
    const [timeFilter, setTimeFilter] = useState('week');
    const [referenceDate, setReferenceDate] = useState(() => startOfDay(new Date()));
    const [draftStartDate, setDraftStartDate] = useState('');
    const [draftEndDate, setDraftEndDate] = useState('');
    const [appliedDateRange, setAppliedDateRange] = useState(null);
    const [calendarMonth, setCalendarMonth] = useState(() => {
        const now = new Date();
        return { year: now.getFullYear(), month: now.getMonth() };
    });

    const fetchAdminAndTrafik = useCallback(async (forceRefresh = false) => {
        setLoading(true);

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

        let role = 'all';
        if (admin) {
            role = admin.role;
            setAdminRole(admin.role);
            if (admin.role === 'admin_pkkmb') setSiteFilter('pkkmb');
            else if (admin.role === 'admin_pose') setSiteFilter('pose');
        }

        const storageKey = `admin_trafik_data_${role}`;
        const timeKey = `admin_trafik_time_${role}`;

        if (!forceRefresh) {
            const cached = localStorage.getItem(storageKey);
            const cachedAt = localStorage.getItem(timeKey);
            if (cached && cachedAt && Date.now() - Number(cachedAt) < 5 * 60 * 1000) {
                setRawTrafik(JSON.parse(cached));
                setLastSyncedAt(Number(cachedAt));
                setLoading(false);
                return;
            }
        }

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        let query = supabase.from('trafik_kunjungan').select('*').gte('visited_at', thirtyDaysAgo.toISOString());

        if (admin?.role === 'admin_pkkmb') query = query.eq('site', 'pkkmb');
        else if (admin?.role === 'admin_pose') query = query.eq('site', 'pose');

        const { data, error } = await query;

        if (data && !error) {
            setRawTrafik(data);
            const now = Date.now();
            localStorage.setItem(storageKey, JSON.stringify(data));
            localStorage.setItem(timeKey, now.toString());
            setLastSyncedAt(now);
        }
        setLoading(false);
    }, [router]);

    useEffect(() => {
        setMounted(true);
        fetchAdminAndTrafik();
    }, [fetchAdminAndTrafik]);

    const siteFilteredData = useMemo(() => {
        if (siteFilter === 'all') return rawTrafik;
        return rawTrafik.filter(item => item.site === siteFilter);
    }, [rawTrafik, siteFilter]);

    const rangeFilteredData = useMemo(() => {
        if (!appliedDateRange) return siteFilteredData;
        return filterByDateRange(siteFilteredData, appliedDateRange, 'visited_at');
    }, [siteFilteredData, appliedDateRange]);

    const dailyCounts = useMemo(() => {
        const map = {};
        siteFilteredData.forEach(item => {
            const key = toDateKey(new Date(item.visited_at));
            map[key] = (map[key] || 0) + 1;
        });
        return map;
    }, [siteFilteredData]);

    const processedData = useMemo(() => {
        let filtered = appliedDateRange ? [...rangeFilteredData] : [...siteFilteredData];
        const ref = startOfDay(referenceDate);
        const labels = [];
        const dataPoints = [];

        if (appliedDateRange) {
            const days = getDaysBetween(appliedDateRange.start, appliedDateRange.end) + 1;
            for (let i = 0; i < days; i++) {
                const d = startOfDay(new Date(appliedDateRange.start));
                d.setDate(d.getDate() + i);
                labels.push(d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' }));
                dataPoints.push(0);
            }
            filtered.forEach(item => {
                const key = toDateKey(new Date(item.visited_at));
                const idx = getDaysBetween(appliedDateRange.start, key);
                if (idx >= 0 && idx < days) dataPoints[idx]++;
            });
        } else if (timeFilter === 'today') {
            const dayEnd = new Date(ref);
            dayEnd.setDate(dayEnd.getDate() + 1);
            filtered = filtered.filter(item => {
                const d = new Date(item.visited_at);
                return d >= ref && d < dayEnd;
            });
            for (let i = 0; i < 24; i++) {
                labels.push(`${String(i).padStart(2, '0')}:00`);
                dataPoints.push(0);
            }
            filtered.forEach(item => {
                dataPoints[new Date(item.visited_at).getHours()]++;
            });
        } else if (timeFilter === 'week') {
            const rangeStart = new Date(ref);
            rangeStart.setDate(rangeStart.getDate() - 6);
            filtered = filtered.filter(item => new Date(item.visited_at) >= rangeStart && new Date(item.visited_at) < new Date(ref.getTime() + 86400000));
            for (let i = 6; i >= 0; i--) {
                const d = new Date(ref);
                d.setDate(d.getDate() - i);
                labels.push(d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }));
                dataPoints.push(0);
            }
            filtered.forEach(item => {
                const date = startOfDay(new Date(item.visited_at));
                const dayDiff = Math.round((ref - date) / 86400000);
                if (dayDiff >= 0 && dayDiff < 7) dataPoints[6 - dayDiff]++;
            });
        } else if (timeFilter === 'month') {
            const rangeStart = new Date(ref);
            rangeStart.setDate(rangeStart.getDate() - 27);
            filtered = filtered.filter(item => new Date(item.visited_at) >= rangeStart && new Date(item.visited_at) < new Date(ref.getTime() + 86400000));
            for (let w = 0; w < 4; w++) {
                const weekStart = new Date(ref);
                weekStart.setDate(weekStart.getDate() - (3 - w) * 7 - 6);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                labels.push(`${weekStart.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} – ${weekEnd.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`);
                dataPoints.push(0);
            }
            filtered.forEach(item => {
                const date = startOfDay(new Date(item.visited_at));
                const dayDiff = Math.round((ref - date) / 86400000);
                if (dayDiff >= 0 && dayDiff < 28) dataPoints[3 - Math.floor(dayDiff / 7)]++;
            });
        }

        return { labels, dataPoints, total: filtered.length };
    }, [siteFilteredData, rangeFilteredData, timeFilter, referenceDate, appliedDateRange]);

    const pkkmbCount = rangeFilteredData.filter(item => item.site === 'pkkmb').length;
    const poseCount = rangeFilteredData.filter(item => item.site === 'pose').length;
    const portalCount = rangeFilteredData.filter(item => item.site === 'portal').length;

    const chartPeriodLabel = useMemo(() => {
        if (appliedDateRange) {
            return `${new Date(appliedDateRange.start).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} – ${new Date(appliedDateRange.end).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
        }
        const ref = startOfDay(referenceDate);
        if (timeFilter === 'today') {
            return ref.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        }
        if (timeFilter === 'week') {
            const start = new Date(ref);
            start.setDate(start.getDate() - 6);
            return `${start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} – ${ref.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`;
        }
        const start = new Date(ref);
        start.setDate(start.getDate() - 27);
        return `${start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} – ${ref.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }, [referenceDate, timeFilter, appliedDateRange]);

    const navigateChart = (direction) => {
        const delta = direction === 'next' ? 1 : -1;
        const nextRef = new Date(referenceDate);
        if (appliedDateRange) {
            const days = getDaysBetween(appliedDateRange.start, appliedDateRange.end) + 1;
            nextRef.setDate(nextRef.getDate() + delta * days);
            const start = toDateKey(nextRef);
            const endDate = new Date(nextRef);
            endDate.setDate(endDate.getDate() + days - 1);
            setAppliedDateRange({ start, end: toDateKey(endDate) });
            setDraftStartDate(start);
            setDraftEndDate(toDateKey(endDate));
        } else if (timeFilter === 'today') {
            nextRef.setDate(nextRef.getDate() + delta);
        } else if (timeFilter === 'week') {
            nextRef.setDate(nextRef.getDate() + delta * 7);
        } else {
            nextRef.setDate(nextRef.getDate() + delta * 28);
        }
        setReferenceDate(startOfDay(nextRef));
        setCalendarMonth({ year: nextRef.getFullYear(), month: nextRef.getMonth() });
    };

    const applyDateRange = () => {
        const diff = getDaysBetween(draftStartDate, draftEndDate);
        if (!draftStartDate || !draftEndDate || diff < 0 || diff > 30) return;
        setAppliedDateRange({ start: draftStartDate, end: draftEndDate });
        const start = startOfDay(new Date(draftStartDate));
        setReferenceDate(start);
        setCalendarMonth({ year: start.getFullYear(), month: start.getMonth() });
    };

    const clearDateRange = () => {
        setDraftStartDate('');
        setDraftEndDate('');
        setAppliedDateRange(null);
    };

    const navigateCalendarMonth = (direction) => {
        setCalendarMonth(prev => {
            let month = prev.month + (direction === 'next' ? 1 : -1);
            let year = prev.year;
            if (month > 11) { month = 0; year++; }
            if (month < 0) { month = 11; year--; }
            return { year, month };
        });
    };

    const handleCalendarDayClick = (day, dateKey) => {
        if (!dateKey) return;
        setDraftStartDate(dateKey);
        setDraftEndDate(dateKey);
        setAppliedDateRange({ start: dateKey, end: dateKey });
        const d = startOfDay(new Date(dateKey));
        setReferenceDate(d);
    };

    const formatMonthData = async () => {
        if (adminRole !== 'super_admin') return;
        const { year, month } = calendarMonth;
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

        const targets = rawTrafik.filter(item => {
            const visited = new Date(item.visited_at);
            if (visited < monthStart || visited > monthEnd) return false;
            if (siteFilter !== 'all' && item.site !== siteFilter) return false;
            return true;
        });

        if (targets.length === 0) {
            window.alert(`Tidak ada data trafik untuk ${MONTH_NAMES[month]} ${year}.`);
            return;
        }

        const siteLabel = siteFilter === 'all' ? 'semua situs' : siteFilter.toUpperCase();
        if (!window.confirm(`Hapus ${targets.length} data trafik ${siteLabel} pada ${MONTH_NAMES[month]} ${year}?`)) return;

        setFormatting(true);
        const ids = targets.map(item => item.id);
        const { error } = await supabase.from('trafik_kunjungan').delete().in('id', ids);

        if (error) {
            window.alert('Gagal menghapus data.');
            setFormatting(false);
            return;
        }

        const remaining = rawTrafik.filter(item => !ids.includes(item.id));
        setRawTrafik(remaining);
        const role = adminRole || 'all';
        const now = Date.now();
        localStorage.setItem(`admin_trafik_data_${role}`, JSON.stringify(remaining));
        localStorage.setItem(`admin_trafik_time_${role}`, now.toString());
        setLastSyncedAt(now);
        setFormatting(false);
    };

    const isDark = theme === 'dark';
    const textColor = isDark ? '#9ca3af' : '#4b5563';
    const gridColor = isDark ? '#374151' : '#f3f4f6';

    const chartData = {
        labels: processedData.labels,
        datasets: [{
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
        }]
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
                callbacks: { label: (ctx) => `${ctx.parsed.y} Kunjungan` }
            }
        },
        scales: {
            x: { grid: { display: false }, ticks: { color: textColor, font: { family: 'Inter, sans-serif' }, maxRotation: 45 } },
            y: { grid: { color: gridColor, borderDash: [4, 4] }, ticks: { color: textColor, font: { family: 'Inter, sans-serif' }, precision: 0 }, beginAtZero: true }
        },
        interaction: { intersect: false, mode: 'index' },
    };

    const dayCount = appliedDateRange
        ? getDaysBetween(appliedDateRange.start, appliedDateRange.end) + 1
        : timeFilter === 'today' ? 1 : timeFilter === 'week' ? 7 : 28;

    if (!mounted) return <div className="animate-pulse h-96 bg-gray-100 dark:bg-gray-800 rounded-xl" />;

    return (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
            <DashboardHeaderFilters
                title="Analisis Trafik"
                subtitle="Pantau pergerakan pengunjung situs Anda"
                icon={Activity}
                adminRole={adminRole}
                siteFilter={siteFilter}
                onSiteFilterChange={setSiteFilter}
                timeFilter={timeFilter}
                onTimeFilterChange={(v) => { setTimeFilter(v); clearDateRange(); }}
                timeFilterOptions={TIME_FILTER_OPTIONS}
                timeFilterDisabled={Boolean(appliedDateRange)}
                onRefresh={() => fetchAdminAndTrafik(true)}
                loading={loading}
                lastSyncedAt={lastSyncedAt}
            />

            <DashboardOverviewCards
                cards={[
                    { key: 'total', label: 'Total Kunjungan', value: processedData.total, subtext: 'Berdasarkan filter aktif', icon: Activity },
                    { key: 'avg', label: 'Rata-rata Harian', value: Math.round(processedData.total / dayCount) || 0, subtext: `${dayCount} hari dalam filter` },
                    { key: 'peak', label: 'Puncak Akses', value: processedData.dataPoints.length > 0 ? processedData.labels[processedData.dataPoints.indexOf(Math.max(...processedData.dataPoints))] : '-', subtext: 'Periode tertinggi' },
                ]}
                dateRangeProps={{
                    startDate: draftStartDate,
                    endDate: draftEndDate,
                    onStartChange: setDraftStartDate,
                    onEndChange: setDraftEndDate,
                    onApply: applyDateRange,
                    onClear: clearDateRange,
                    appliedRange: appliedDateRange,
                }}
            />

            <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="mb-4 sm:mb-6">
                    <h3 className="font-bold text-base sm:text-lg text-gray-800 dark:text-gray-200">Grafik Kunjungan Aktif</h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{chartPeriodLabel}</p>
                </div>
                <div className="h-64 sm:h-80 w-full relative">
                    <button type="button" onClick={() => navigateChart('prev')} className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300" aria-label="Periode sebelumnya">
                        <ChevronLeft size={18} />
                    </button>
                    <button type="button" onClick={() => navigateChart('next')} className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300" aria-label="Periode berikutnya">
                        <ChevronRight size={18} />
                    </button>
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-900/50 z-10 backdrop-blur-sm">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}
                    <div className="px-8 sm:px-10 h-full">
                        <Line data={chartData} options={chartOptions} />
                    </div>
                </div>
            </div>

            <DashboardCalendarLegend
                calendarMonth={calendarMonth}
                onNavigateMonth={navigateCalendarMonth}
                dailyCounts={dailyCounts}
                appliedDateRange={appliedDateRange}
                onDayClick={handleCalendarDayClick}
                onFormatMonth={formatMonthData}
                formatting={formatting}
                loading={loading}
                showFormatButton={adminRole === 'super_admin'}
                countLabel="kunjungan"
                legendDescription="Skala biru sequential — semakin gelap, semakin tinggi kunjungan harian (filter situs aktif)."
                donutChart={
                    <DashboardDonutChart
                        title="Distribusi Situs Kunjungan"
                        labels={['PKKMB', 'POSE', 'PORTAL KAMPUS']}
                        values={[pkkmbCount, poseCount, portalCount]}
                        colors={['#3b82f6', '#a855f7', '#10b981']}
                    />
                }
            />
        </div>
    );
}
