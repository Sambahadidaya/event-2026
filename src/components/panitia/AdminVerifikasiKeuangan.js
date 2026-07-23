'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import {
    FileCheck, Search, Eye, CheckCircle2, XCircle, Clock,
    FileText, UserCheck, Filter, X, FileImage, ExternalLink
} from 'lucide-react';
import { getPesertaKeuangan, updateStatusPembayaranPeserta } from '@/api/supabase/admin/peserta';
import DashboardHeaderFilters from '@/components/panitia/DashboardHeaderFilters';
import TablePagination from '@/components/panitia/TablePagination';
import { formatDateTime } from '@/lib/dashboardUtils';

const ITEMS_PER_PAGE = 10;

export default function AdminVerifikasiKeuangan({ siteType = 'all', adminRole = '' }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('semua');
    const [activeTab, setActiveTab] = useState('wajib'); // 'wajib' | 'register'
    const [lastSyncedAt, setLastSyncedAt] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    const isPkkmbAdmin = Boolean(adminRole && adminRole.includes('pkkmb'));

    useEffect(() => {
        if (isPkkmbAdmin) {
            setActiveTab('wajib');
        }
    }, [isPkkmbAdmin]);

    // Modal state for Bukti Pembayaran preview
    const [buktiModalOpen, setBuktiModalOpen] = useState(false);
    const [selectedBuktiUrl, setSelectedBuktiUrl] = useState(null);
    const [selectedBuktiNama, setSelectedBuktiNama] = useState('');

    // Modal state for Verifikasi Detail
    const [verifikasiModalOpen, setVerifikasiModalOpen] = useState(false);
    const [verifikasiItem, setVerifikasiItem] = useState(null);
    const [verifikasiLoading, setVerifikasiLoading] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const pesertaData = await getPesertaKeuangan(siteType);
        if (pesertaData) {
            setData(pesertaData);
            setLastSyncedAt(Date.now());
        }
        setLoading(false);
    }, [siteType]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Calculate header summary statistics
    const stats = useMemo(() => {
        const totalWajib = data.filter(item => item.jenis_form === 'wajib').length;
        const totalRegister = data.filter(item => item.jenis_form === 'register').length;
        const totalLunas = data.filter(item => item.status_pembayaran?.toLowerCase() === 'lunas').length;
        const totalDitolak = data.filter(item => item.status_pembayaran?.toLowerCase() === 'ditolak').length;
        const totalPending = data.filter(item => !item.status_pembayaran || item.status_pembayaran?.toLowerCase() === 'pending').length;

        return { totalWajib, totalRegister, totalLunas, totalDitolak, totalPending };
    }, [data]);

    // Filter data by active tab (jenis_form), search query, and status filter
    const filteredData = useMemo(() => {
        return data.filter(item => {
            // Filter by activeTab (wajib vs register)
            if (activeTab === 'wajib' && item.jenis_form !== 'wajib') return false;
            if (activeTab === 'register' && item.jenis_form !== 'register') return false;

            // Filter by statusPembayaran
            if (statusFilter === 'lunas' && item.status_pembayaran?.toLowerCase() !== 'lunas') return false;
            if (statusFilter === 'ditolak' && item.status_pembayaran?.toLowerCase() !== 'ditolak') return false;
            if (statusFilter === 'pending' && (item.status_pembayaran && item.status_pembayaran?.toLowerCase() !== 'pending')) return false;

            // Search query filter
            if (searchQuery.trim()) {
                const searchLower = searchQuery.toLowerCase();
                const matchNama = item.nama && item.nama.toLowerCase().includes(searchLower);
                const matchNim = item.nim && item.nim.toLowerCase().includes(searchLower);
                const matchKampus = item.kampus && item.kampus.toLowerCase().includes(searchLower);
                const matchEmailWa = item.email_wa && item.email_wa.toLowerCase().includes(searchLower);
                const matchKategori = item.kategori && item.kategori.toLowerCase().includes(searchLower);
                return matchNama || matchNim || matchKampus || matchEmailWa || matchKategori;
            }

            return true;
        });
    }, [data, activeTab, statusFilter, searchQuery]);

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE) || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedData = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter, activeTab]);

    const handleUpdateStatus = async (status) => {
        if (!verifikasiItem) return;
        setVerifikasiLoading(true);

        const res = await updateStatusPembayaranPeserta(verifikasiItem.id, status);

        if (res.success) {
            setData(prev => prev.map(d => d.id === verifikasiItem.id ? { ...d, status_pembayaran: status } : d));
            setVerifikasiModalOpen(false);
            setVerifikasiItem(null);
        } else {
            window.alert('Gagal mengupdate status pembayaran.');
        }
        setVerifikasiLoading(false);
    };

    const handleViewBukti = (item) => {
        setSelectedBuktiUrl(item.bukti_bayar);
        setSelectedBuktiNama(item.nama);
        setBuktiModalOpen(true);
    };

    const handleOpenVerifikasi = (item) => {
        setVerifikasiItem(item);
        setVerifikasiModalOpen(true);
    };

    return (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
            {/* Header / Title bar */}
            <DashboardHeaderFilters
                title="Verifikasi Pembayaran"
                subtitle={
                    siteType === 'all'
                        ? 'Pusat verifikasi seluruh pendaftaran (PKKMB & POSE)'
                        : `Pusat verifikasi pendaftaran site ${siteType.toUpperCase()}`
                }
                icon={FileCheck}
                showSiteFilter={false}
                onRefresh={fetchData}
                loading={loading}
                lastSyncedAt={lastSyncedAt}
            />

            {/* 5 Header Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                {/* 1. Total Peserta Wajib */}
                <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1 truncate">Total Peserta Wajib</p>
                        <h3 className="text-xl sm:text-2xl font-extrabold text-blue-600 dark:text-blue-400">{stats.totalWajib}</h3>
                        <p className="text-[11px] text-gray-400 mt-1">Form Wajib</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center shrink-0">
                        <FileText size={20} />
                    </div>
                </div>

                {/* 2. Total Peserta Register */}
                <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1 truncate">Total Peserta Register</p>
                        <h3 className="text-xl sm:text-2xl font-extrabold text-violet-600 dark:text-violet-400">{stats.totalRegister}</h3>
                        <p className="text-[11px] text-gray-400 mt-1">Form Register</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/20 text-violet-500 flex items-center justify-center shrink-0">
                        <UserCheck size={20} />
                    </div>
                </div>

                {/* 3. Total Sudah Bayar */}
                <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1 truncate">Total Sudah Bayar</p>
                        <h3 className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{stats.totalLunas}</h3>
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">Lunas</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={20} />
                    </div>
                </div>

                {/* 4. Total Pembayaran Ditolak */}
                <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1 truncate">Total Ditolak</p>
                        <h3 className="text-xl sm:text-2xl font-extrabold text-rose-600 dark:text-rose-400">{stats.totalDitolak}</h3>
                        <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium mt-1">Ditolak</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-500 flex items-center justify-center shrink-0">
                        <XCircle size={20} />
                    </div>
                </div>

                {/* 5. Total Belum Bayar */}
                <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-1 truncate">Total Belum Bayar</p>
                        <h3 className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400">{stats.totalPending}</h3>
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-1">Pending</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center shrink-0">
                        <Clock size={20} />
                    </div>
                </div>
            </div>

            {/* Main Table Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                {/* Header Controls: Switch Tab + Search + Status Filter */}
                <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                    {/* Switch Toggle (Form Wajib vs Form Register) */}
                    <div className="flex items-center bg-gray-200/80 dark:bg-gray-800 p-1 rounded-xl shrink-0 self-start lg:self-auto">
                        <button
                            type="button"
                            onClick={() => setActiveTab('wajib')}
                            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'wajib'
                                    ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            <FileText size={16} />
                            Form Wajib
                            <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                                {stats.totalWajib}
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => !isPkkmbAdmin && setActiveTab('register')}
                            disabled={isPkkmbAdmin}
                            title={isPkkmbAdmin ? "Form Register tidak tersedia untuk role Admin PKKMB" : ""}
                            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${isPkkmbAdmin
                                    ? 'opacity-40 cursor-not-allowed text-gray-400 dark:text-gray-500'
                                    : activeTab === 'register'
                                        ? 'bg-white dark:bg-gray-900 text-violet-600 dark:text-violet-400 shadow-sm'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            <UserCheck size={16} />
                            Form Register
                            <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300">
                                {stats.totalRegister}
                            </span>
                        </button>
                    </div>

                    {/* Search & Filter Dropdown */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 flex-1 max-w-xl">
                        {/* Search Input */}
                        <div className="relative w-full flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Cari nama, NIM, kampus, email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-emerald-500/30 text-gray-900 dark:text-white"
                            />
                        </div>

                        {/* Dropdown Filter Status */}
                        <div className="relative w-full sm:w-48 shrink-0">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full pl-9 pr-8 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-emerald-500/30 text-gray-900 dark:text-white appearance-none cursor-pointer font-medium"
                            >
                                <option value="semua">Semua Status</option>
                                <option value="pending">Pending</option>
                                <option value="lunas">Lunas</option>
                                <option value="ditolak">Ditolak</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table Data */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50/80 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                            <tr>
                                <th className="px-4 py-3.5 font-semibold text-center w-12">No</th>
                                <th className="px-4 py-3.5 font-semibold">Nama</th>
                                <th className="px-4 py-3.5 font-semibold">Kategori</th>
                                <th className="px-4 py-3.5 font-semibold">NIM</th>
                                <th className="px-4 py-3.5 font-semibold">Kampus</th>
                                <th className="px-4 py-3.5 font-semibold">Email / WA</th>
                                <th className="px-4 py-3.5 font-semibold text-center">Bukti Pembayaran</th>
                                <th className="px-4 py-3.5 font-semibold">Tanggal</th>
                                <th className="px-4 py-3.5 font-semibold text-center w-36">Verifikasi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={`skeleton-${i}`} className="animate-pulse">
                                        <td colSpan={9} className="px-4 py-4">
                                            <div className="h-6 bg-gray-100 dark:bg-gray-800 rounded-lg w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-16 text-center text-gray-500 dark:text-gray-400">
                                        <p className="font-semibold text-base mb-1">Tidak ada data ditemukan</p>
                                        <p className="text-xs">Coba sesuaikan pencarian atau filter status yang Anda gunakan.</p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((item, index) => {
                                    const isLunas = item.status_pembayaran === 'lunas';
                                    const isDitolak = item.status_pembayaran === 'ditolak';

                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            {/* No */}
                                            <td className="px-4 py-3 text-center text-gray-500 font-medium">{startIndex + index + 1}</td>

                                            {/* Nama */}
                                            <td className="px-4 py-3">
                                                <p className="font-bold text-gray-900 dark:text-white">{item.nama}</p>
                                                {item.site_type && (
                                                    <span className="inline-block mt-0.5 px-1.5 py-0.2 text-[10px] uppercase font-bold tracking-wider rounded bg-gray-100 dark:bg-gray-800 text-gray-500">
                                                        {item.site_type}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Kategori */}
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                                                    {item.kategori || '-'}
                                                </span>
                                            </td>

                                            {/* NIM */}
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300 font-mono text-xs">
                                                {item.nim && item.nim !== 'Dosen' && item.nim !== 'Umum' ? item.nim : '-'}
                                            </td>

                                            {/* Kampus */}
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                                {item.kampus || '-'}
                                            </td>

                                            {/* Email / WA */}
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-xs">
                                                {item.email_wa || '-'}
                                            </td>

                                            {/* Bukti Pembayaran */}
                                            <td className="px-4 py-3 text-center">
                                                {item.bukti_bayar ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleViewBukti(item)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl text-xs font-bold transition-all shadow-xs"
                                                    >
                                                        <Eye size={14} /> Lihat Bukti
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">Tidak ada</span>
                                                )}
                                            </td>

                                            {/* Tanggal */}
                                            <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                                                {formatDateTime(item.created_at)}
                                            </td>

                                            {/* Verifikasi (Paling Pojok Kanan) */}
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenVerifikasi(item)}
                                                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 w-full rounded-xl text-xs font-extrabold transition-all shadow-xs ${isLunas
                                                            ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100'
                                                            : isDitolak
                                                                ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 hover:bg-rose-100'
                                                                : 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 hover:bg-amber-100'
                                                        }`}
                                                >
                                                    {isLunas ? (
                                                        <>
                                                            <CheckCircle2 size={14} /> Lunas
                                                        </>
                                                    ) : isDitolak ? (
                                                        <>
                                                            <XCircle size={14} /> Ditolak
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Clock size={14} /> Verifikasi
                                                        </>
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <TablePagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredData.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={setCurrentPage}
                    colSpan={9}
                />
            </div>

            {/* ================= MODAL BUKTI PEMBAYARAN (POP UP INLINE) ================= */}
            {buktiModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden border border-gray-100 dark:border-gray-800 max-h-[90vh]">
                        {/* Header Modal */}
                        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                            <div className="flex items-center gap-2">
                                <FileImage size={20} className="text-blue-500" />
                                <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white truncate">
                                    Bukti Pembayaran - {selectedBuktiNama}
                                </h3>
                            </div>
                            <button
                                onClick={() => setBuktiModalOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Body Modal (Media Viewer) */}
                        <div className="p-4 sm:p-6 overflow-y-auto flex items-center justify-center min-h-[300px] bg-slate-950/5 dark:bg-slate-950/40">
                            {selectedBuktiUrl ? (
                                selectedBuktiUrl.toLowerCase().endsWith('.pdf') ? (
                                    <iframe
                                        src={selectedBuktiUrl}
                                        className="w-full h-[500px] rounded-xl border border-gray-200 dark:border-gray-700"
                                        title="Bukti Pembayaran PDF"
                                    />
                                ) : (
                                    <img
                                        src={selectedBuktiUrl}
                                        alt={`Bukti pembayaran ${selectedBuktiNama}`}
                                        className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-md border border-gray-200 dark:border-gray-800"
                                    />
                                )
                            ) : (
                                <p className="text-sm text-gray-500">Bukti pembayaran tidak tersedia.</p>
                            )}
                        </div>

                        {/* Footer Modal */}
                        <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                            {selectedBuktiUrl && (
                                <a
                                    href={selectedBuktiUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                                >
                                    <ExternalLink size={14} /> Buka di tab terpisah jika perlu
                                </a>
                            )}
                            <button
                                onClick={() => setBuktiModalOpen(false)}
                                className="ml-auto px-5 py-2 rounded-xl text-xs font-bold bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ================= MODAL DETAIL & VERIFIKASI ================= */}
            {verifikasiModalOpen && verifikasiItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden border border-gray-100 dark:border-gray-800">
                        {/* Header Modal */}
                        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                            <h3 className="font-extrabold text-base sm:text-lg text-gray-900 dark:text-white">
                                Detail & Verifikasi Pembayaran
                            </h3>
                            <button
                                onClick={() => { setVerifikasiModalOpen(false); setVerifikasiItem(null); }}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Body Modal Detail */}
                        <div className="p-4 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            <div className="p-3.5 bg-gray-50 dark:bg-gray-800/60 rounded-xl space-y-2 border border-gray-100 dark:border-gray-800">
                                <div className="flex justify-between items-start text-xs sm:text-sm">
                                    <span className="text-gray-500 font-medium">Nama Lengkap</span>
                                    <span className="font-bold text-gray-900 dark:text-white text-right">{verifikasiItem.nama}</span>
                                </div>
                                <div className="flex justify-between items-start text-xs sm:text-sm">
                                    <span className="text-gray-500 font-medium">Kategori</span>
                                    <span className="font-semibold text-gray-800 dark:text-gray-200 text-right">{verifikasiItem.kategori || '-'}</span>
                                </div>
                                <div className="flex justify-between items-start text-xs sm:text-sm">
                                    <span className="text-gray-500 font-medium">NIM</span>
                                    <span className="font-mono text-gray-800 dark:text-gray-200 text-right">{verifikasiItem.nim || '-'}</span>
                                </div>
                                <div className="flex justify-between items-start text-xs sm:text-sm">
                                    <span className="text-gray-500 font-medium">Kampus</span>
                                    <span className="font-semibold text-gray-800 dark:text-gray-200 text-right">{verifikasiItem.kampus || '-'}</span>
                                </div>
                                <div className="flex justify-between items-start text-xs sm:text-sm">
                                    <span className="text-gray-500 font-medium">Email / WhatsApp</span>
                                    <span className="font-semibold text-gray-800 dark:text-gray-200 text-right">{verifikasiItem.email_wa || '-'}</span>
                                </div>
                                <div className="flex justify-between items-start text-xs sm:text-sm">
                                    <span className="text-gray-500 font-medium">Jenis Form</span>
                                    <span className="font-bold uppercase text-blue-600 dark:text-blue-400 text-right">{verifikasiItem.jenis_form}</span>
                                </div>
                                <div className="flex justify-between items-start text-xs sm:text-sm">
                                    <span className="text-gray-500 font-medium">Status Saat Ini</span>
                                    <span className={`font-extrabold text-right ${verifikasiItem.status_pembayaran?.toLowerCase() === 'lunas' ? 'text-emerald-600 dark:text-emerald-400' :
                                            verifikasiItem.status_pembayaran?.toLowerCase() === 'ditolak' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
                                        }`}>
                                        {verifikasiItem.status_pembayaran || 'pending'}
                                    </span>
                                </div>
                            </div>

                            {/* Bukti Bayar Preview Link */}
                            {verifikasiItem.bukti_bayar && (
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 mb-1.5">Bukti Bayar Peserta:</p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            handleViewBukti(verifikasiItem);
                                        }}
                                        className="w-full py-2 px-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold border border-blue-200 dark:border-blue-800/50 hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Eye size={14} /> Lihat Preview Bukti Pembayaran
                                    </button>
                                </div>
                            )}

                            <p className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2">
                                Tentukan keputusan verifikasi pembayaran peserta ini:
                            </p>
                        </div>

                        {/* Action Buttons: Tolak & Setujui */}
                        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => handleUpdateStatus('ditolak')}
                                disabled={verifikasiLoading}
                                className="flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <XCircle size={16} /> Tolak Pembayaran
                            </button>
                            <button
                                type="button"
                                onClick={() => handleUpdateStatus('lunas')}
                                disabled={verifikasiLoading}
                                className="flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <CheckCircle2 size={16} /> Setujui (Lunas)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
