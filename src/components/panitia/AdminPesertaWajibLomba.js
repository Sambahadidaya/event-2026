'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Users, Search, RefreshCw, Download, ShieldAlert, ChevronDown, BarChart3, UserCheck } from 'lucide-react';
import {
    Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale,
    LinearScale, BarElement, Title
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { getCurrentAdmin } from '@/api/supabase/admin/auth';
import { getPesertaWajibLombaData } from '@/api/supabase/admin/peserta';
import DashboardHeaderFilters from '@/components/panitia/DashboardHeaderFilters';
import DashboardOverviewCards from '@/components/panitia/DashboardOverviewCards';
import TablePagination from '@/components/panitia/TablePagination';
import { exportToExcel } from '@/lib/excel/xlsx';
import TombolCetak from '@/components/panitia/TombolCetak';
import { KAMPUS_DATA } from '@/lib/lombaData';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const CACHE_KEY = 'peserta_wajib_lomba_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 menit
const ITEMS_PER_PAGE = 15;

export default function AdminPesertaWajibLomba() {
    const [adminRole, setAdminRole] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastSyncedAt, setLastSyncedAt] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [kampusFilter, setKampusFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [kampusFilterOpen, setKampusFilterOpen] = useState(false);
    const [statusFilterOpen, setStatusFilterOpen] = useState(false);

    // Auth check
    useEffect(() => {
        getCurrentAdmin().then(admin => {
            if (admin) {
                setAdminRole(admin.role);
            }
            setAuthLoading(false);
        });
    }, []);

    const fetchData = useCallback(async (forceRefresh = false) => {
        setLoading(true);
        try {
            if (!forceRefresh) {
                const cached = localStorage.getItem(CACHE_KEY);
                const cachedAt = localStorage.getItem(CACHE_KEY + '_time');
                if (cached && cachedAt && Date.now() - Number(cachedAt) < CACHE_TTL) {
                    setData(JSON.parse(cached));
                    setLastSyncedAt(Number(cachedAt));
                    setLoading(false);
                    return;
                }
            }

            const json = await getPesertaWajibLombaData();
            if (json.success) {
                setData(json.data || []);
                const now = Date.now();
                localStorage.setItem(CACHE_KEY, JSON.stringify(json.data || []));
                localStorage.setItem(CACHE_KEY + '_time', now.toString());
                setLastSyncedAt(now);
            }
        } catch (err) {
            console.error('Fetch error', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!authLoading && adminRole && (adminRole === 'admin_pose' || adminRole === 'super_admin')) {
            fetchData();
        }
    }, [authLoading, adminRole, fetchData]);

    // ------- COMPUTED DATA -------
    const filteredData = useMemo(() => {
        let result = data;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(p =>
                p.nama?.toLowerCase().includes(q) ||
                p.nim?.toLowerCase().includes(q) ||
                p.kampus?.toLowerCase().includes(q)
            );
        }
        if (kampusFilter !== 'all') {
            result = result.filter(p => p.kampus === kampusFilter);
        }
        if (statusFilter === 'belum') {
            result = result.filter(p => p.total_lomba === 0);
        } else if (statusFilter === 'satu') {
            result = result.filter(p => p.total_lomba === 1);
        } else if (statusFilter === 'dua') {
            result = result.filter(p => p.total_lomba >= 2);
        }
        return result;
    }, [data, searchQuery, kampusFilter, statusFilter]);

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const pagedData = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredData.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredData, currentPage]);

    // Doughnut chart: distribusi 0/1/2 lomba
    const doughnutData = useMemo(() => {
        const belum = data.filter(p => p.total_lomba === 0).length;
        const satu = data.filter(p => p.total_lomba === 1).length;
        const dua = data.filter(p => p.total_lomba >= 2).length;
        return {
            labels: ['Belum Ikut Lomba', 'Ikut 1 Lomba', 'Ikut 2 Lomba'],
            datasets: [{
                data: [belum, satu, dua],
                backgroundColor: ['#f87171', '#fbbf24', '#34d399'],
                borderColor: ['#ef4444', '#f59e0b', '#10b981'],
                borderWidth: 2,
            }]
        };
    }, [data]);

    // Bar chart: peserta per kampus
    const kampusChartData = useMemo(() => {
        const kampusNames = KAMPUS_DATA.filter(k => k.nama !== 'Lainnya').map(k => k.nama);
        const counts = kampusNames.map(k => data.filter(p => p.kampus === k).length);
        return {
            labels: kampusNames,
            datasets: [{
                label: 'Jumlah Peserta Wajib',
                data: counts,
                backgroundColor: 'rgba(99, 102, 241, 0.7)',
                borderColor: 'rgba(99, 102, 241, 1)',
                borderWidth: 1,
                borderRadius: 6,
            }]
        };
    }, [data]);

    // Bar chart: lomba paling banyak
    const lombaChartData = useMemo(() => {
        const lombaCounter = {};
        data.forEach(p => {
            (p.lomba_diikuti || []).forEach(lomba => {
                lombaCounter[lomba] = (lombaCounter[lomba] || 0) + 1;
            });
        });
        const sorted = Object.entries(lombaCounter).sort((a, b) => b[1] - a[1]);
        return {
            labels: sorted.map(([l]) => l),
            datasets: [{
                label: 'Peserta dari Wajib',
                data: sorted.map(([, c]) => c),
                backgroundColor: 'rgba(16, 185, 129, 0.7)',
                borderColor: 'rgba(16, 185, 129, 1)',
                borderWidth: 1,
                borderRadius: 6,
            }]
        };
    }, [data]);

    const overviewCards = useMemo(() => {
        const total = data.length;
        const sudahIkut = data.filter(p => p.total_lomba > 0).length;
        const belumIkut = data.filter(p => p.total_lomba === 0).length;
        const penuh = data.filter(p => p.total_lomba >= 2).length;
        return [
            { label: 'Total Peserta Wajib', value: total, icon: Users, iconBg: 'bg-blue-50 dark:bg-blue-900/20', iconClass: 'text-blue-500' },
            { label: 'Sudah Ikut Lomba', value: sudahIkut, icon: UserCheck, iconBg: 'bg-green-50 dark:bg-green-900/20', iconClass: 'text-green-500', subtext: `${penuh} sudah maks (2 lomba)`, subtextClass: 'text-emerald-600' },
            { label: 'Belum Ikut Lomba', value: belumIkut, icon: Users, iconBg: 'bg-red-50 dark:bg-red-900/20', iconClass: 'text-red-500', subtext: `${total > 0 ? ((belumIkut / total) * 100).toFixed(1) : 0}% dari total`, subtextClass: 'text-red-500' },
        ];
    }, [data]);

    const handleExportExcel = () => {
        const rows = filteredData.map(p => ({
            'NIM': p.nim || '-',
            'Nama': p.nama || '-',
            'Kampus': p.kampus || '-',
            'Prodi': p.prodi || '-',
            'Status Bayar': p.status_pembayaran || '-',
            'Total Lomba': p.total_lomba || 0,
            'Lomba Diikuti': (p.lomba_diikuti || []).join(', ') || '-',
        }));
        exportToExcel(rows, 'Peserta_Wajib_Lomba_POSE2026');
    };

    const uniqueKampus = useMemo(() => [...new Set(data.map(p => p.kampus).filter(Boolean))].sort(), [data]);

    if (authLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!adminRole || (adminRole !== 'admin_pose' && adminRole !== 'super_admin')) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
                <ShieldAlert size={48} className="text-red-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Akses Ditolak</h2>
                <p className="text-gray-500 text-sm max-w-xs">Halaman ini hanya dapat diakses oleh <strong>admin_pose</strong> dan <strong>super_admin</strong>.</p>
            </div>
        );
    }

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { mode: 'index' } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
    };

    const barHorizOptions = {
        ...chartOptions,
        indexAxis: 'y',
        scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } }
    };

    return (
        <div className="space-y-5 animate-in fade-in duration-500">
            <DashboardHeaderFilters
                title="Peserta Wajib & Lomba"
                subtitle="Pantau partisipasi lomba mahasiswa LP3I yang sudah daftar wajib"
                icon={UserCheck}
                showSiteFilter={false}
                extraFilters={null}
                onRefresh={() => fetchData(true)}
                loading={loading}
                lastSyncedAt={lastSyncedAt}
            />

            {/* Overview */}
            <DashboardOverviewCards cards={overviewCards} />

            {/* 3 Charts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Doughnut */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <BarChart3 size={16} className="text-violet-500" />
                        Distribusi Partisipasi Lomba
                    </h3>
                    <div className="relative h-52 mx-auto max-w-[200px]">
                        <Doughnut
                            data={doughnutData}
                            options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { font: { size: 10 } } } } }}
                        />
                    </div>
                </div>

                {/* Bar per kampus */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <BarChart3 size={16} className="text-blue-500" />
                        Peserta Wajib per Kampus
                    </h3>
                    <div className="relative h-52">
                        <Bar data={kampusChartData} options={barHorizOptions} />
                    </div>
                </div>

                {/* Bar per lomba */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <BarChart3 size={16} className="text-green-500" />
                        Peserta Wajib per Lomba
                    </h3>
                    <div className="relative h-52">
                        {lombaChartData.labels.length > 0
                            ? <Bar data={lombaChartData} options={chartOptions} />
                            : <div className="flex items-center justify-center h-full text-gray-400 text-sm">Belum ada data lomba</div>
                        }
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="flex flex-wrap gap-2 items-center">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                        <input
                            type="text"
                            placeholder="Cari nama / NIM / kampus..."
                            value={searchQuery}
                            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            className="pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-violet-500/30 outline-none w-56"
                        />
                    </div>

                    {/* Kampus Filter */}
                    <div className="relative" id="kampus-filter-wrapper">
                        <button
                            type="button"
                            onClick={() => setKampusFilterOpen(!kampusFilterOpen)}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            <span>{kampusFilter === 'all' ? 'Semua Kampus' : kampusFilter}</span>
                            <ChevronDown size={14} />
                        </button>
                        {kampusFilterOpen && (
                            <div className="absolute z-20 mt-1 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-56 overflow-y-auto">
                                <button
                                    type="button"
                                    onClick={() => { setKampusFilter('all'); setCurrentPage(1); setKampusFilterOpen(false); }}
                                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${kampusFilter === 'all' ? 'font-bold text-violet-600' : 'text-gray-700 dark:text-gray-300'}`}
                                >Semua Kampus</button>
                                {uniqueKampus.map(k => (
                                    <button
                                        key={k}
                                        type="button"
                                        onClick={() => { setKampusFilter(k); setCurrentPage(1); setKampusFilterOpen(false); }}
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${kampusFilter === k ? 'font-bold text-violet-600' : 'text-gray-700 dark:text-gray-300'}`}
                                    >{k}</button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Status Filter */}
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setStatusFilterOpen(!statusFilterOpen)}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            <span>{{ all: 'Semua Status', belum: 'Belum Lomba', satu: 'Ikut 1 Lomba', dua: 'Ikut 2 Lomba' }[statusFilter]}</span>
                            <ChevronDown size={14} />
                        </button>
                        {statusFilterOpen && (
                            <div className="absolute z-20 mt-1 w-44 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg">
                                {[['all', 'Semua Status'], ['belum', 'Belum Lomba'], ['satu', 'Ikut 1 Lomba'], ['dua', 'Ikut 2 Lomba']].map(([val, label]) => (
                                    <button
                                        key={val}
                                        type="button"
                                        onClick={() => { setStatusFilter(val); setCurrentPage(1); setStatusFilterOpen(false); }}
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${statusFilter === val ? 'font-bold text-violet-600' : 'text-gray-700 dark:text-gray-300'}`}
                                    >{label}</button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Integrated TombolCetak */}
                <TombolCetak
                    label="Cetak / Export"
                    pdfTitle="Laporan Peserta Wajib & Lomba POSE 2026"
                    pdfSite="pose"
                    pdfData={filteredData.map(p => ({
                        ...p,
                        lomba_text: (p.lomba_diikuti || []).join(', ') || '-'
                    }))}
                    pdfColumns={[
                        { key: 'nim', label: 'NIM' },
                        { key: 'nama', label: 'Nama' },
                        { key: 'kampus', label: 'Kampus' },
                        { key: 'prodi', label: 'Prodi' },
                        { key: 'created_at', label: 'Tanggal Input', format: 'datetime' },
                        { key: 'status_pembayaran', label: 'Status Bayar' },
                        { key: 'total_lomba', label: 'Total Lomba', align: 'center' },
                        { key: 'lomba_text', label: 'Lomba Diikuti' }
                    ]}
                    excelData={filteredData.map(p => ({
                        'NIM': p.nim || '-',
                        'Nama': p.nama || '-',
                        'Kampus': p.kampus || '-',
                        'Prodi': p.prodi || '-',
                        'Tanggal Input': p.created_at,
                        'Status Bayar': p.status_pembayaran || '-',
                        'Total Lomba': p.total_lomba || 0,
                        'Lomba Diikuti': (p.lomba_diikuti || []).join(', ') || '-'
                    }))}
                    excelColumns={[
                        { key: 'NIM', label: 'NIM' },
                        { key: 'Nama', label: 'Nama' },
                        { key: 'Kampus', label: 'Kampus' },
                        { key: 'Prodi', label: 'Prodi' },
                        { key: 'Tanggal Input', label: 'Tanggal Input', format: 'datetime' },
                        { key: 'Status Bayar', label: 'Status Bayar' },
                        { key: 'Total Lomba', label: 'Total Lomba' },
                        { key: 'Lomba Diikuti', label: 'Lomba Diikuti' }
                    ]}
                    excelFilename="Peserta_Wajib_Lomba_POSE2026"
                />
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-40 gap-3 text-gray-500">
                        <div className="w-6 h-6 border-3 border-violet-500 border-t-transparent rounded-full animate-spin" />
                        Memuat data...
                    </div>
                ) : filteredData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
                        <Users size={32} />
                        <p className="text-sm">Tidak ada data yang sesuai filter</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px]">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">No</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">NIM</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Nama</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Kampus</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Prodi</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Lomba Diikuti</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                {pagedData.map((p, idx) => (
                                    <tr key={p.nim || idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                        <td className="px-4 py-3 text-xs text-gray-500">{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                                        <td className="px-4 py-3 text-xs font-mono text-gray-700 dark:text-gray-300">{p.nim || '-'}</td>
                                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">{p.nama || '-'}</td>
                                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">{p.kampus || '-'}</td>
                                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 max-w-[160px] truncate" title={p.prodi}>{p.prodi || '-'}</td>
                                        <td className="px-4 py-3">
                                            {p.lomba_diikuti && p.lomba_diikuti.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {p.lomba_diikuti.map((lomba, i) => (
                                                        <span key={i} className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                                                            {lomba}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">Belum ikut lomba</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-block px-2 py-0.5 text-xs font-bold rounded-full ${
                                                p.total_lomba === 0 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                                                p.total_lomba === 1 ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                                                'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                            }`}>
                                                {p.total_lomba} / 2
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {!loading && filteredData.length > ITEMS_PER_PAGE && (
                    <TablePagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredData.length}
                        itemsPerPage={ITEMS_PER_PAGE}
                        onPageChange={setCurrentPage}
                    />
                )}
            </div>
        </div>
    );
}
