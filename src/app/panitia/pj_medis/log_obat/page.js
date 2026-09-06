'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    ClipboardList,
    Plus,
    Trash2,
    Edit3,
    Search,
    AlertCircle,
    CheckCircle2,
    Pill,
    History,
    Calendar,
    Activity
} from 'lucide-react';
import { getCurrentAdmin } from '@/api/supabase/admin/auth';
import { hasAccess } from '@/lib/adminRoleData';
import {
    getLogObat,
    getMasterObat,
    createLogObat,
    updateLogObat,
    deleteLogObat
} from '@/api/supabase/admin/obat';
import LogObatModal from '@/components/panitia/pj_medis/LogObatModal';
import ConfirmModal from '@/components/panitia/ConfirmModal';
import TombolCetak from '@/components/panitia/TombolCetak';
import TablePagination from '@/components/panitia/TablePagination';

const ITEMS_PER_PAGE = 10;

export default function LogObatPage() {
    const router = useRouter();
    const [admin, setAdmin] = useState(null);
    const [logList, setLogList] = useState([]);
    const [masterList, setMasterList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // Delete state
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [deletingLoading, setDeletingLoading] = useState(false);

    // Toast
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    // Load data
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [logRes, masterRes] = await Promise.all([
                getLogObat(),
                getMasterObat()
            ]);

            if (logRes.success) {
                setLogList(logRes.data || []);
            } else {
                showToast(logRes.error || 'Gagal memuat log pemakaian obat', 'error');
            }

            if (masterRes.success) {
                setMasterList(masterRes.data || []);
            }
        } catch (err) {
            console.error('Fetch error:', err);
            showToast('Terjadi kesalahan saat memuat data', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            try {
                const currentAdmin = await getCurrentAdmin();
                if (!currentAdmin) {
                    router.push('/panitia/login');
                    return;
                }

                if (!hasAccess(currentAdmin.role, '/panitia/pj_medis/log_obat')) {
                    router.push('/panitia/dashboard');
                    return;
                }

                setAdmin(currentAdmin);
                await fetchData();
            } catch (err) {
                console.error('Init error:', err);
                router.push('/panitia/login');
            }
        };

        init();
    }, [router, fetchData]);

    // Search filter
    const filteredData = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return logList;
        return logList.filter(item => {
            const nama = item.master_obat?.nama_obat || '';
            return nama.toLowerCase().includes(query);
        });
    }, [logList, searchQuery]);

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE) || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedData = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    // Stats
    const stats = useMemo(() => {
        const totalTransaksi = logList.length;
        const totalPcsTerpakai = logList.reduce((acc, curr) => acc + (curr.pemakaian_obat || 0), 0);
        return { totalTransaksi, totalPcsTerpakai };
    }, [logList]);

    // Save
    const handleSave = async (payload) => {
        if (editingItem) {
            const res = await updateLogObat(editingItem.id, payload);
            if (!res.success) throw new Error(res.error);
            showToast('Log pemakaian obat berhasil diperbarui');
        } else {
            const res = await createLogObat(payload);
            if (!res.success) throw new Error(res.error);
            showToast('Pemakaian obat berhasil dicatat & sisa stok dikurangi');
        }
        await fetchData();
    };

    // Delete
    const handlePromptDelete = (id) => {
        setDeletingId(id);
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingId) return;
        setDeletingLoading(true);
        try {
            const res = await deleteLogObat(deletingId);
            if (res.success) {
                showToast('Log pemakaian obat dihapus & sisa stok obat dikembalikan');
                await fetchData();
            } else {
                showToast(res.error || 'Gagal menghapus log pemakaian', 'error');
            }
        } catch (err) {
            console.error('Delete error:', err);
            showToast('Terjadi kesalahan saat menghapus', 'error');
        } finally {
            setDeletingLoading(false);
            setIsConfirmOpen(false);
            setDeletingId(null);
        }
    };

    // Export preparations
    const printColumns = [
        { key: 'no', label: 'No' },
        { key: 'nama_obat', label: 'Nama Obat' },
        { key: 'stok_obat', label: 'Stok Awal' },
        { key: 'pemakaian_obat', label: 'Jumlah Pemakaian' },
        { key: 'sisa_obat', label: 'Sisa Obat' },
        { key: 'created_at_fmt', label: 'Waktu Pemakaian' }
    ];

    const printData = useMemo(() => {
        return filteredData.map((item, idx) => {
            const dateStr = item.created_at ? new Date(item.created_at).toLocaleString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) : '-';

            return {
                no: idx + 1,
                nama_obat: item.master_obat?.nama_obat || '-',
                stok_obat: item.master_obat?.stok_obat ?? '-',
                pemakaian_obat: item.pemakaian_obat ?? 0,
                sisa_obat: item.master_obat?.sisa_obat ?? '-',
                created_at_fmt: dateStr
            };
        });
    }, [filteredData]);

    const formatDateTime = (dateStr) => {
        if (!dateStr) return '-';
        try {
            return new Date(dateStr).toLocaleString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-sm font-medium animate-in slide-in-from-bottom-5 duration-200 ${
                    toast.type === 'error'
                        ? 'bg-rose-500 text-white border-rose-600'
                        : 'bg-emerald-600 text-white border-emerald-700'
                }`}>
                    {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                    <span>{toast.message}</span>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                            <ClipboardList size={24} />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                            Log Pemakaian Obat
                        </h1>
                    </div>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Catatan audit penggunaan obat medis oleh tim medis selama kegiatan
                    </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                    <TombolCetak
                        pdfTitle="Laporan Log Pemakaian Obat Medis PKKMB 2026"
                        pdfSite="pkkmb"
                        pdfData={printData}
                        pdfColumns={printColumns}
                        excelData={printData}
                        excelColumns={printColumns}
                        excelFilename="log-pemakaian-obat"
                    />

                    <button
                        onClick={() => {
                            setEditingItem(null);
                            setIsModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
                    >
                        <Plus size={16} />
                        <span>Catat Pemakaian</span>
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                        <History size={24} />
                    </div>
                    <div>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Transaksi Pemakaian</span>
                        <p className="text-2xl font-black text-slate-800 dark:text-white mt-0.5">
                            {loading ? '...' : stats.totalTransaksi} Log
                        </p>
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                        <Pill size={24} />
                    </div>
                    <div>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Obat Terpakai (Unit/Pcs)</span>
                        <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-0.5">
                            {loading ? '...' : stats.totalPcsTerpakai} Butir / Pcs
                        </p>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
                <Search size={18} className="text-slate-400 shrink-0" />
                <input
                    type="text"
                    placeholder="Cari berdasarkan nama obat..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                        Reset
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-base">
                            Daftar Catatan Pengeluaran & Pemakaian Obat
                        </h3>
                        <p className="text-xs text-slate-400">
                            Riwayat log pemakaian obat beserta informasi stok dan sisa obat
                        </p>
                    </div>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                        {filteredData.length} Catatan
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="bg-slate-50/75 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                                <th className="py-3.5 px-4 w-14 text-center">No</th>
                                <th className="py-3.5 px-4">Nama Obat</th>
                                <th className="py-3.5 px-4 w-32 text-center">Stok Awal</th>
                                <th className="py-3.5 px-4 w-36 text-center">Jumlah Pemakaian</th>
                                <th className="py-3.5 px-4 w-32 text-center">Sisa Obat Terkini</th>
                                <th className="py-3.5 px-4 w-44">Waktu Pemakaian</th>
                                <th className="py-3.5 px-4 w-28 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                            {loading ? (
                                Array.from({ length: 4 }).map((_, idx) => (
                                    <tr key={idx} className="animate-pulse">
                                        <td className="py-4 px-4 text-center"><div className="h-4 w-4 bg-slate-200 dark:bg-slate-800 rounded mx-auto" /></td>
                                        <td className="py-4 px-4"><div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                                        <td className="py-4 px-4 text-center"><div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded mx-auto" /></td>
                                        <td className="py-4 px-4 text-center"><div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto" /></td>
                                        <td className="py-4 px-4 text-center"><div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded mx-auto" /></td>
                                        <td className="py-4 px-4"><div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                                        <td className="py-4 px-4 text-center"><div className="h-6 w-14 bg-slate-200 dark:bg-slate-800 rounded mx-auto" /></td>
                                    </tr>
                                ))
                            ) : paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-14 text-center">
                                        <div className="inline-flex p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mb-2">
                                            <ClipboardList size={28} />
                                        </div>
                                        <p className="font-bold text-slate-800 dark:text-slate-200 text-base">
                                            Belum Ada Catatan Pemakaian Obat
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            Klik tombol &quot;Catat Pemakaian&quot; untuk mencatat pengeluaran obat.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((item, index) => {
                                    const namaObat = item.master_obat?.nama_obat || 'Obat Tidak Diketahui';
                                    const stokAwal = item.master_obat?.stok_obat ?? '-';
                                    const sisaObat = item.master_obat?.sisa_obat ?? '-';

                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="py-4 px-4 text-center text-xs font-semibold text-slate-400">
                                                {startIndex + index + 1}
                                            </td>
                                            <td className="py-4 px-4">
                                                <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                                                    {namaObat}
                                                </p>
                                            </td>
                                            <td className="py-4 px-4 text-center font-semibold text-slate-600 dark:text-slate-300">
                                                {stokAwal}
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60">
                                                    -{item.pemakaian_obat} unit
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                                    {sisaObat}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-xs text-slate-500 dark:text-slate-400">
                                                {formatDateTime(item.created_at)}
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() => {
                                                            setEditingItem(item);
                                                            setIsModalOpen(true);
                                                        }}
                                                        title="Edit Log Pemakaian"
                                                        className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition-colors"
                                                    >
                                                        <Edit3 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handlePromptDelete(item.id)}
                                                        title="Hapus Log Pemakaian"
                                                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                        <TablePagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </div>

            {/* Modal Tambah/Edit Log Obat */}
            <LogObatModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                masterObatList={masterList}
                editingData={editingItem}
            />

            {/* Confirm Modal for Delete */}
            <ConfirmModal
                open={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                loading={deletingLoading}
                title="Hapus Log Pemakaian Obat"
                message="Apakah Anda yakin ingin menghapus catatan pemakaian obat ini? Jumlah obat yang pernah dipakai akan otomatis dikembalikan ke sisa stok obat."
                confirmLabel="Ya, Hapus & Kembalikan Stok"
                cancelLabel="Batal"
            />
        </div>
    );
}
