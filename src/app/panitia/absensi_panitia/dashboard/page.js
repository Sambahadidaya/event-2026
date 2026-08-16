'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, Search, RefreshCw, FileDown, Printer, ShieldAlert } from 'lucide-react';
import { getCurrentAdmin } from '@/api/supabase/admin/auth';
import { getDashboardStats } from '@/api/supabase/admin/absensi';
import TombolCetak from '@/components/panitia/TombolCetak';
import { hasAccess } from '@/lib/adminRoleData';
import AbsensiDashboardCharts from '@/components/panitia/absensi/AbsensiDashboardCharts';
import AbsensiRekapTable from '@/components/panitia/absensi/AbsensiRekapTable';

export default function AbsensiDashboard() {
    const router = useRouter();
    const [admin, setAdmin] = useState(null);
    const [site, setSite] = useState('pkkmb');
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [exportingPdf, setExportingPdf] = useState(false);
    const [lastSynced, setLastSynced] = useState(null);

    // Fetch initial user auth
    useEffect(() => {
        const checkUser = async () => {
            const currentAdmin = await getCurrentAdmin();
            if (!currentAdmin || !hasAccess(currentAdmin.role, '/panitia/absensi_panitia/dashboard')) {
                router.replace('/panitia/login');
                return;
            }
            setAdmin(currentAdmin);

            const isSuper = currentAdmin.role === 'super_admin';
            setIsSuperAdmin(isSuper);

            if (isSuper) {
                setSite('pkkmb'); // Default for super admin
            } else {
                // Infer site from role or type
                const inferredSite = currentAdmin.role.includes('pose') || currentAdmin.type === 'pose' ? 'pose' : 'pkkmb';
                setSite(inferredSite);
            }
        };
        checkUser();
    }, [router]);

    // Fetch Dashboard stats
    const fetchStats = useCallback(async (currentSite) => {
        if (!currentSite) return;
        setLoading(true);
        try {
            const res = await getDashboardStats(currentSite);
            if (res.success && res.data) {
                setStats(res.data.stats || []);
            } else {
                setStats([]);
            }
            setLastSynced(new Date());
        } catch (err) {
            console.error('Error fetching absensi stats:', err);
            setStats([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (admin) {
            fetchStats(site);
        }
    }, [admin, site, fetchStats]);

    // Handle PDF generation using report.js format
    const handleExportPDF = async () => {
        if (stats.length === 0) {
            alert('Tidak ada data untuk dicetak.');
            return;
        }

        setExportingPdf(true);
        try {
            const columns = [
                { key: 'nama', label: 'Nama Panitia' },
                { key: 'hadir', label: 'Hadir', align: 'center' },
                { key: 'izin', label: 'Izin', align: 'center' },
                { key: 'sakit', label: 'Sakit', align: 'center' },
                { key: 'alpha', label: 'Alpha', align: 'center' }
            ];

            const title = `Rekapitulasi Kehadiran Panitia ${site.toUpperCase()}`;

            const res = await generatePdfAction({
                type: 'absensi_report',
                title,
                site,
                columns,
                data: stats,
                printedBy: admin?.nama || 'Sekretaris Panitia'
            });

            if (!res || !res.success) {
                throw new Error(res?.error || 'Gagal membuat PDF');
            }

            const byteCharacters = atob(res.base64Pdf);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/pdf' });

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `rekap-absen-panitia-${site}-${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Print PDF Error:', err);
            alert(`Terjadi kesalahan saat mencetak PDF: ${err.message}`);
        } finally {
            setExportingPdf(false);
        }
    };

    // Handle Excel generation using xlsx.js format
    const handleExportExcel = () => {
        if (stats.length === 0) {
            alert('Tidak ada data untuk diexport.');
            return;
        }

        const columns = [
            { key: 'nama', label: 'Nama Panitia' },
            { key: 'hadir', label: 'Total Hadir' },
            { key: 'izin', label: 'Total Izin' },
            { key: 'sakit', label: 'Total Sakit' },
            { key: 'alpha', label: 'Total Alpha' }
        ];

        exportToExcel(
            stats,
            columns,
            `rekap-absen-panitia-${site}`
        );
    };

    if (!admin) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-9 h-9 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-2xl shadow-sm">
                        <BarChart3 size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white leading-tight">
                            Dashboard Absensi Panitia
                        </h2>
                        <p className="text-xs text-slate-450 dark:text-slate-500 mt-1 font-medium">
                            Rekapitulasi status kehadiran, grafik analitik, dan detail performa panitia.
                        </p>
                    </div>
                </div>

                {/* Filters and Controls */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Site Switcher for Super Admin */}
                    {isSuperAdmin && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Site:</span>
                            <select
                                value={site}
                                onChange={(e) => setSite(e.target.value)}
                                className="px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30"
                            >
                                <option value="pkkmb">PKKMB</option>
                                <option value="pose">POSE</option>
                            </select>
                        </div>
                    )}

                    {/* Sync button */}
                    <button
                        onClick={() => fetchStats(site)}
                        disabled={loading}
                        className="p-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350 border border-slate-200 dark:border-slate-800 rounded-xl transition-all disabled:opacity-50"
                        title="Perbarui Data"
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                    </button>

                    {/* Integrated TombolCetak */}
                    <TombolCetak
                        label="Cetak / Export"
                        pdfTitle={`Rekapitulasi Kehadiran Panitia ${site.toUpperCase()}`}
                        pdfSite={site}
                        pdfData={stats}
                        pdfColumns={[
                            { key: 'nama', label: 'Nama Panitia' },
                            { key: 'hadir', label: 'Hadir', align: 'center' },
                            { key: 'izin', label: 'Izin', align: 'center' },
                            { key: 'sakit', label: 'Sakit', align: 'center' },
                            { key: 'alpha', label: 'Alpha', align: 'center' }
                        ]}
                        pdfDocumentType="absensi_report"
                        excelData={stats}
                        excelColumns={[
                            { key: 'nama', label: 'Nama Panitia' },
                            { key: 'hadir', label: 'Total Hadir' },
                            { key: 'izin', label: 'Total Izin' },
                            { key: 'sakit', label: 'Total Sakit' },
                            { key: 'alpha', label: 'Total Alpha' }
                        ]}
                        excelFilename={`rekap-absen-panitia-${site}`}
                    />
                </div>
            </div>

            {/* Sync timestamp status */}
            {lastSynced && (
                <div className="text-[10px] text-slate-450 dark:text-slate-500 font-medium text-right -mt-2">
                    Sinkronisasi terakhir: {lastSynced.toLocaleTimeString('id-ID')}
                </div>
            )}

            {/* Loading skeleton */}
            {loading && stats.length === 0 ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                        <div className="h-44 bg-slate-100 dark:bg-slate-800 rounded-2xl col-span-1"></div>
                        <div className="h-44 bg-slate-100 dark:bg-slate-800 rounded-2xl col-span-2"></div>
                    </div>
                    <div className="h-80 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
                </div>
            ) : (
                <>
                    {/* Charts component */}
                    <AbsensiDashboardCharts statsData={stats} />

                    {/* Table search and rekap table */}
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-xs">
                            <div className="w-full sm:w-72 relative">
                                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Cari nama panitia..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <span className="text-xs text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider">
                                Total: {stats.length} Anggota Panitia
                            </span>
                        </div>

                        {/* Recapitulation Table */}
                        <AbsensiRekapTable data={stats} searchQuery={searchQuery} />
                    </div>
                </>
            )}
        </div>
    );
}