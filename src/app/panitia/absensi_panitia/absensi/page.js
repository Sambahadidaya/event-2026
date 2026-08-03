'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { UserCheck, Plus, Edit, Trash2, Search, Printer, FileDown, AlertCircle } from 'lucide-react';
import { getCurrentAdmin } from '@/api/supabase/admin/auth';
import { getFormAbsen, getAdminsBySite, getDataAbsen, createDataAbsen, updateDataAbsen, deleteDataAbsen } from '@/api/supabase/admin/absensi';
import { generatePdfAction } from '@/api/pdf/route';
import { exportToExcel } from '@/lib/excel/xlsx';
import { hasAccess } from '@/lib/adminRoleData';
import { formatIndoDate, getAbsensiDisplayDate } from '@/lib/dateUtils';
import AbsensiFormModal from '@/components/panitia/absensi/AbsensiFormModal';
import ConfirmModal from '@/components/panitia/ConfirmModal';

export default function AbsensiPanitiaPage() {
    const router = useRouter();
    const [admin, setAdmin] = useState(null);
    const [site, setSite] = useState('pkkmb');
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);

    // Lists loaded on mount
    const [forms, setForms] = useState([]);
    const [adminsList, setAdminsList] = useState([]);

    // Selection state
    const [selectedFormId, setSelectedFormId] = useState('');
    const [historyData, setHistoryData] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Modal state
    const [isAbsenOpen, setIsAbsenOpen] = useState(false);
    const [editData, setEditData] = useState(null);

    // Delete state
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [deletingLoading, setDeletingLoading] = useState(false);

    const [exportingPdf, setExportingPdf] = useState(false);

    // Initial auth check
    useEffect(() => {
        const checkUser = async () => {
            const currentAdmin = await getCurrentAdmin();
            if (!currentAdmin || !hasAccess(currentAdmin.role, '/panitia/absensi_panitia/absensi')) {
                router.replace('/panitia/login');
                return;
            }
            setAdmin(currentAdmin);

            const isSuper = currentAdmin.role === 'super_admin';
            setIsSuperAdmin(isSuper);

            if (isSuper) {
                setSite('pkkmb');
            } else {
                const inferredSite = currentAdmin.role.includes('pose') || currentAdmin.type === 'pose' ? 'pose' : 'pkkmb';
                setSite(inferredSite);
            }
        };
        checkUser();
    }, [router]);

    // Fetch session forms and admins of site
    const initializeData = useCallback(async (currentSite) => {
        if (!currentSite) return;
        try {
            const [formRes, adminRes] = await Promise.all([
                getFormAbsen(currentSite),
                getAdminsBySite(currentSite)
            ]);

            if (formRes.success) {
                setForms(formRes.data || []);
            } else {
                setForms([]);
            }

            if (adminRes.success) {
                setAdminsList(adminRes.data || []);
            } else {
                setAdminsList([]);
            }
        } catch (err) {
            console.error('Error initializing absensi page data:', err);
        }
    }, []);

    useEffect(() => {
        if (admin) {
            initializeData(site);
            // Reset active form selection when switching site
            setSelectedFormId('');
            setHistoryData([]);
        }
    }, [admin, site, initializeData]);

    // Fetch history records when form selection changes
    const fetchHistory = useCallback(async (formId) => {
        if (!formId) {
            setHistoryData([]);
            return;
        }
        setLoadingHistory(true);
        try {
            const res = await getDataAbsen(formId);
            if (res.success) {
                setHistoryData(res.data || []);
            } else {
                setHistoryData([]);
            }
        } catch (err) {
            console.error('Error fetching history:', err);
            setHistoryData([]);
        } finally {
            setLoadingHistory(false);
        }
    }, []);

    useEffect(() => {
        fetchHistory(selectedFormId);
    }, [selectedFormId, fetchHistory]);

    // Format lists for searchable dropdown options
    const formOptions = useMemo(() => {
        return forms.map(f => ({ value: f.id, label: f.judul_absen }));
    }, [forms]);

    // Handle mutations
    const handleSave = async (data) => {
        try {
            if (editData) {
                const res = await updateDataAbsen(editData.id, data);
                if (res.success) {
                    await fetchHistory(selectedFormId);
                    return true;
                }
            } else {
                // Attach creator/admin metadata
                const res = await createDataAbsen({
                    ...data,
                    create_by: admin?.nama || 'System'
                });
                if (res.success) {
                    await fetchHistory(selectedFormId);
                    return true;
                }
            }
        } catch (err) {
            console.error('Error saving data:', err);
        }
        return false;
    };

    const triggerEdit = (item) => {
        setEditData(item);
        setIsAbsenOpen(true);
    };

    const triggerDelete = (id) => {
        setDeletingId(id);
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingId) return;
        setDeletingLoading(true);
        try {
            const res = await deleteDataAbsen(deletingId);
            if (res.success) {
                await fetchHistory(selectedFormId);
                setIsConfirmOpen(false);
            } else {
                alert(res.error || 'Gagal menghapus data.');
            }
        } catch (err) {
            console.error('Error deleting record:', err);
            alert('Terjadi kesalahan saat menghapus data.');
        } finally {
            setDeletingLoading(false);
            setDeletingId(null);
        }
    };

    // Client-side search and status filter
    const filteredHistory = useMemo(() => {
        return historyData.filter(item => {
            const matchesSearch = (item.nama_panitia || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'all' || item.type_absen === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [historyData, searchQuery, statusFilter]);

    // Calculate totals of status for summary rows
    const totalCounts = useMemo(() => {
        let hadir = 0, izin = 0, sakit = 0, alpha = 0;
        filteredHistory.forEach(item => {
            const type = (item.type_absen || '').toLowerCase();
            if (type === 'hadir') hadir++;
            else if (type === 'izin') izin++;
            else if (type === 'sakit') sakit++;
            else if (type === 'alpha') alpha++;
        });
        return { hadir, izin, sakit, alpha };
    }, [filteredHistory]);

    // Print PDF using Puppeteer backend action
    const handleExportPDF = async () => {
        if (filteredHistory.length === 0) {
            alert('Tidak ada data untuk dicetak.');
            return;
        }

        const selectedForm = forms.find(f => f.id === selectedFormId);
        const title = `Laporan Kehadiran Panitia - ${selectedForm?.judul_absen || 'Sesi'}`;

        setExportingPdf(true);
        try {
            const columns = [
                { key: 'nama_panitia', label: 'Nama Panitia' },
                { key: 'type_absen', label: 'Jenis Absen', align: 'center' },
                { key: 'keterangan_absen', label: 'Keterangan' },
                { key: 'create_by', label: 'Diinput Oleh', align: 'center' },
                { key: 'tanggal_input', label: 'Tanggal Input', align: 'center' }
            ];

            const dataMapped = filteredHistory.map(item => {
                const displayDate = item.updated_at && new Date(item.updated_at).getTime() - new Date(item.created_at).getTime() > 1000
                    ? item.updated_at
                    : item.created_at;
                return {
                    ...item,
                    tanggal_input: displayDate,
                    create_by: item.create_by ? item.create_by.replace('_', ' ') : '-'
                };
            });

            const res = await generatePdfAction({
                type: 'absensi_report',
                title,
                site,
                columns,
                data: dataMapped,
                includeSummary: true,
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
            a.download = `absen-${selectedForm?.judul_absen.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${site}.pdf`;
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

    // Export Excel using xlsx.js
    // Export Excel using xlsx.js
    const handleExportExcel = () => {
        if (filteredHistory.length === 0) {
            alert('Tidak ada data untuk diexport.');
            return;
        }

        const selectedForm = forms.find(f => f.id === selectedFormId);
        const columns = [
            { key: 'nama_panitia', label: 'Nama Panitia' },
            { key: 'type_absen', label: 'Jenis Absen' },
            { key: 'keterangan_absen', label: 'Keterangan Absen' },
            { key: 'create_by', label: 'Diinput Oleh' },
            { key: 'tanggal_input', label: 'Tanggal Input' }
        ];

        const formattedForExcel = filteredHistory.map(item => {
            const displayDate = item.updated_at && new Date(item.updated_at).getTime() - new Date(item.created_at).getTime() > 1000
                ? item.updated_at
                : item.created_at;
            return {
                ...item,
                create_by: item.create_by ? item.create_by.replace('_', ' ') : '-',
                tanggal_input: formatIndoDate(displayDate)
            };
        });

        // Add total summary to the excel rows dengan key yang SAMA
        const dataWithSummary = [...formattedForExcel];

        dataWithSummary.push({
            isSummaryRow: true,
            nama_panitia: 'Jumlah Hadir',
            type_absen: totalCounts.hadir,
            keterangan_absen: '',
            create_by: '',
            tanggal_input: ''
        });

        dataWithSummary.push({
            isSummaryRow: true,
            nama_panitia: 'Jumlah Izin',
            type_absen: totalCounts.izin,
            keterangan_absen: '',
            create_by: '',
            tanggal_input: ''
        });

        dataWithSummary.push({
            isSummaryRow: true,
            nama_panitia: 'Jumlah Sakit',
            type_absen: totalCounts.sakit,
            keterangan_absen: '',
            create_by: '',
            tanggal_input: ''
        });

        dataWithSummary.push({
            isSummaryRow: true,
            nama_panitia: 'Jumlah Alpha',
            type_absen: totalCounts.alpha,
            keterangan_absen: '',
            create_by: '',
            tanggal_input: ''
        });

        exportToExcel(
            dataWithSummary,
            columns,
            `riwayat-absen-${selectedForm?.judul_absen.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
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
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-2xl shadow-sm">
                        <UserCheck size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white leading-tight">
                            Absensi Panitia
                        </h2>
                        <p className="text-xs text-slate-450 dark:text-slate-500 mt-1 font-medium">
                            Isi kehadiran panitia harian dan kelola riwayat catatan kehadiran.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {isSuperAdmin && (
                        <div className="flex items-center gap-2 mr-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Site:</span>
                            <select
                                value={site}
                                onChange={(e) => setSite(e.target.value)}
                                className="px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-semibold focus:outline-none"
                            >
                                <option value="pkkmb">PKKMB</option>
                                <option value="pose">POSE</option>
                            </select>
                        </div>
                    )}
                    <button
                        onClick={() => {
                            setEditData(null);
                            setIsAbsenOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                    >
                        <Plus size={16} />
                        <span>Isi Absen Baru</span>
                    </button>
                </div>
            </div>

            {/* Selection & Toolbar Filter */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs">
                <div className="w-full sm:w-80 flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Pilih Sesi Absensi</label>
                    <select
                        value={selectedFormId}
                        onChange={(e) => setSelectedFormId(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:border-blue-500"
                    >
                        <option value="">-- Pilih Absensi (Default Kosong) --</option>
                        {forms.map(f => (
                            <option key={f.id} value={f.id}>{f.judul_absen}</option>
                        ))}
                    </select>
                </div>

                {selectedFormId && (
                    <div className="w-full sm:w-auto flex flex-wrap items-center gap-3 pt-4 sm:pt-0">
                        {/* Search field */}
                        <div className="relative w-full sm:w-56">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Cari nama panitia..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        {/* Jenis Absensi filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="py-2 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-700 dark:text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                        >
                            <option value="all">Semua Jenis</option>
                            <option value="Hadir">Hadir</option>
                            <option value="Izin">Izin</option>
                            <option value="Sakit">Sakit</option>
                            <option value="Alpha">Alpha</option>
                        </select>

                        {/* Export actions */}
                        <button
                            onClick={handleExportExcel}
                            disabled={filteredHistory.length === 0}
                            className="p-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-emerald-600 border border-slate-200 dark:border-slate-800 rounded-xl transition-all disabled:opacity-50"
                            title="Export Excel"
                        >
                            <FileDown size={16} />
                        </button>
                        <button
                            onClick={handleExportPDF}
                            disabled={filteredHistory.length === 0 || exportingPdf}
                            className="p-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-blue-600 border border-slate-200 dark:border-slate-800 rounded-xl transition-all disabled:opacity-50"
                            title="Cetak PDF"
                        >
                            {exportingPdf ? (
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <Printer size={16} />
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* History Table */}
            {!selectedFormId ? (
                <div className="flex flex-col items-center justify-center p-12 border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 rounded-2xl text-center space-y-3">
                    <AlertCircle size={28} className="text-slate-400" />
                    <div className="space-y-1">
                        <h4 className="font-bold text-slate-700 dark:text-slate-350 text-sm">Tidak Ada Sesi Absensi Dipilih</h4>
                        <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm">
                            Silakan pilih salah satu judul sesi absensi di dropdown filter atas untuk memuat riwayat kehadiran panitia.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900/50 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60">
                                    <th className="px-6 py-4.5 w-16 text-center">No</th>
                                    <th className="px-6 py-4.5">Nama Panitia</th>
                                    <th className="px-6 py-4.5 w-32 text-center">Jenis Absen</th>
                                    <th className="px-6 py-4.5">Keterangan</th>
                                    <th className="px-6 py-4.5 w-44 text-center">Diinput Oleh</th>
                                    <th className="px-6 py-4.5 w-52 text-center">Tanggal Input</th>
                                    <th className="px-6 py-4.5 w-28 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm">
                                {loadingHistory ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <tr key={`skel-${i}`} className="animate-pulse">
                                            <td colSpan={6} className="px-6 py-5">
                                                <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded-lg w-full"></div>
                                            </td>
                                        </tr>
                                    ))
                                ) : filteredHistory.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-slate-450 dark:text-slate-500">
                                            Belum ada data kehadiran panitia untuk sesi ini.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredHistory.map((item, index) => {
                                        let badgeClass = '';
                                        if (item.type_absen === 'Hadir') badgeClass = 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/25';
                                        else if (item.type_absen === 'Izin') badgeClass = 'text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/25';
                                        else if (item.type_absen === 'Sakit') badgeClass = 'text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/25';
                                        else if (item.type_absen === 'Alpha') badgeClass = 'text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/25';

                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="px-6 py-4 text-center font-medium text-slate-450">{index + 1}</td>
                                                <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-100">
                                                    {item.nama_panitia}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-block px-2.5 py-0.5 text-xs font-bold rounded ${badgeClass}`}>
                                                        {item.type_absen}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-650 dark:text-slate-350 max-w-xs truncate" title={item.keterangan_absen}>
                                                    {item.keterangan_absen || '-'}
                                                </td>
                                                <td className="px-6 py-4 text-center text-xs text-slate-450 capitalize">
                                                    {item.create_by ? item.create_by.replace('_', ' ') : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-center text-xs text-slate-450">
                                                    {getAbsensiDisplayDate(item)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => triggerEdit(item)}
                                                            className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-all"
                                                            title="Edit Absen"
                                                        >
                                                            <Edit size={15} />
                                                        </button>
                                                        <button
                                                            onClick={() => triggerDelete(item.id)}
                                                            className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all"
                                                            title="Hapus Absen"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}

                                {/* Summary / Totals Row */}
                                {filteredHistory.length > 0 && (
                                    <tr className="bg-slate-50 dark:bg-slate-900/60 border-t-2 border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">
                                        <td colSpan={2} className="px-6 py-3 text-right tracking-wide">Jumlah Hadir :</td>
                                        <td className="px-6 py-3 text-center">
                                            <div className="flex flex-col gap-0.5 items-center">
                                                <span className="text-emerald-600 dark:text-emerald-400">{totalCounts.hadir}</span>
                                            </div>
                                        </td>
                                        <td colSpan={4} className="px-6 py-3 text-slate-400"></td>
                                    </tr>
                                )}
                                {filteredHistory.length > 0 && (
                                    <tr className="bg-slate-50 dark:bg-slate-900/60 border-t-2 border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">
                                        <td colSpan={2} className="px-6 py-3 text-right tracking-wide">Jumlah Izin :</td>
                                        <td className="px-6 py-3 text-center">
                                            <div className="flex flex-col gap-0.5 items-center">
                                                <span className="text-blue-600 dark:text-blue-400">{totalCounts.izin}</span>
                                            </div>
                                        </td>
                                        <td colSpan={4} className="px-6 py-3 text-slate-400"></td>
                                    </tr>
                                )}
                                {filteredHistory.length > 0 && (
                                    <tr className="bg-slate-50 dark:bg-slate-900/60 border-t-2 border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">
                                        <td colSpan={2} className="px-6 py-3 text-right tracking-wide">Jumlah Sakit :</td>
                                        <td className="px-6 py-3 text-center">
                                            <div className="flex flex-col gap-0.5 items-center">
                                                <span className="text-amber-600 dark:text-amber-400">{totalCounts.sakit}</span>
                                            </div>
                                        </td>
                                        <td colSpan={4} className="px-6 py-3 text-slate-400"></td>
                                    </tr>
                                )}
                                {filteredHistory.length > 0 && (
                                    <tr className="bg-slate-50 dark:bg-slate-900/60 border-t-2 border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">
                                        <td colSpan={2} className="px-6 py-3 text-right tracking-wide">Jumlah Alpha :</td>
                                        <td className="px-6 py-3 text-center">
                                            <div className="flex flex-col gap-0.5 items-center">
                                                <span className="text-rose-600 dark:text-rose-400">{totalCounts.alpha}</span>
                                            </div>
                                        </td>
                                        <td colSpan={4} className="px-6 py-3 text-slate-400"></td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal for Input / Edit Absensi */}
            <AbsensiFormModal
                isOpen={isAbsenOpen}
                onClose={() => {
                    setIsAbsenOpen(false);
                    setEditData(null);
                }}
                onSave={handleSave}
                formAbsenList={formOptions}
                adminList={adminsList}
                historyList={historyData}
                defaultFormId={selectedFormId}
                editData={editData}
            />

            {/* Delete confirmation modal */}
            <ConfirmModal
                open={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Hapus Absen Panitia"
                message="Apakah Anda yakin ingin menghapus data absen panitia ini? Tindakan ini tidak dapat dibatalkan."
                confirmLabel="Ya, Hapus"
                cancelLabel="Batal"
                loading={deletingLoading}
            />
        </div>
    );
}
