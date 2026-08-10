'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Users, DollarSign, Trophy, Award } from 'lucide-react';
import DashboardHeaderFilters from '@/components/panitia/DashboardHeaderFilters';
import DashboardSelect from '@/components/panitia/DashboardSelect';
import SalesChart from '@/components/panitia/SalesChart';
import { getSalesSummary, getSalesGrafik } from '@/api/supabase/admin/sales';
import { NAMA_LOMBA } from '@/lib/lombaData';

export default function SalesDashboardPage() {
    const [loading, setLoading] = useState(true);
    const [lombaFilter, setLombaFilter] = useState('all');
    const [stats, setStats] = useState({
        totalKomisi: 0,
        totalEntries: 0,
        topReferrer: '-',
        lombaTerlaris: '-'
    });
    const [chartData, setChartData] = useState({
        lombaLabels: [],
        lombaValues: [],
        sumberLabels: [],
        sumberValues: [],
        bulananLabels: [],
        bulananValues: []
    });

    const loadData = async () => {
        setLoading(true);
        try {
            // 1. Get raw grouped data to compute stats
            const summary = await getSalesSummary(lombaFilter);
            const charts = await getSalesGrafik();

            // Calculate stats
            const totalKom = summary.reduce((sum, item) => sum + item.total_nominal, 0);
            const totalEnt = summary.length; // number of unique identities

            let topRef = '-';
            if (summary.length > 0) {
                const top = summary[0]; // sorted descending by default
                topRef = top.nama_nim ? `${top.nama_nim} (${top.sumber})` : top.sumber;
            }

            // Calculate Lomba Terlaris based on chart data
            let bestLomba = '-';
            if (charts.lombaData && charts.lombaData.length > 0) {
                const sortedLomba = [...charts.lombaData].sort((a, b) => b.value - a.value);
                bestLomba = sortedLomba[0].label;
            }

            setStats({
                totalKomisi: totalKom,
                totalEntries: totalEnt,
                topReferrer: topRef,
                lombaTerlaris: bestLomba
            });

            // Map chart data
            setChartData({
                lombaLabels: charts.lombaData.map(d => d.label),
                lombaValues: charts.lombaData.map(d => d.value),
                sumberLabels: charts.sumberData.map(d => d.label),
                sumberValues: charts.sumberData.map(d => d.value),
                bulananLabels: charts.bulananData.map(d => d.label),
                bulananValues: charts.bulananData.map(d => d.value)
            });

        } catch (error) {
            console.error("Failed to load sales dashboard stats:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [lombaFilter]);

    // Flatten all competition names for the dropdown filter
    const allLombaList = [
        { value: 'all', label: 'Semua Lomba' },
        ...Object.values(NAMA_LOMBA).flat().map(name => ({ value: name, label: name }))
    ];

    const extraFilters = (
        <div className="w-full sm:w-auto">
            <DashboardSelect
                icon={Trophy}
                value={lombaFilter}
                onChange={(e) => setLombaFilter(e.target.value)}
                options={allLombaList}
            />
        </div>
    );

    return (
        <div className="space-y-6">
            <DashboardHeaderFilters
                title="Dashboard Sales & Referral"
                subtitle="Pantau data referral, komisi dosen/panitia, dan performa promosi lomba POSE 2026."
                icon={TrendingUp}
                showSiteFilter={false}
                extraFilters={extraFilters}
                onRefresh={loadData}
            />

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase">Total Utang Komisi</p>
                        <h4 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                            Rp {stats.totalKomisi.toLocaleString('id-ID')}
                        </h4>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase">Identitas Sales Aktif</p>
                        <h4 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                            {stats.totalEntries} Orang
                        </h4>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4">
                    <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-xl flex items-center justify-center">
                        <Award size={24} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase truncate">Top Referrer</p>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white mt-1 truncate">
                            {stats.topReferrer}
                        </h4>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center">
                        <Trophy size={24} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase truncate">Lomba Terlaris</p>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white mt-1 truncate">
                            {stats.lombaTerlaris}
                        </h4>
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <SalesChart
                        type="bar"
                        title="Akumulasi Komisi per Cabang Lomba (Rp)"
                        labels={chartData.lombaLabels}
                        values={chartData.lombaValues}
                    />
                </div>
                <div>
                    <SalesChart
                        type="doughnut"
                        title="Distribusi Sumber Informasi"
                        labels={chartData.sumberLabels}
                        values={chartData.sumberValues}
                    />
                </div>
                <div className="lg:col-span-3">
                    <SalesChart
                        type="line"
                        title="Trend Pendaftaran via Referral (Bulanan)"
                        labels={chartData.bulananLabels}
                        values={chartData.bulananValues}
                    />
                </div>
            </div>
        </div>
    );
}
