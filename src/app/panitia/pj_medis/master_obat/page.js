'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Pill,
    Plus,
    Trash2,
    Edit3,
    Search,
    AlertCircle,
    CheckCircle2,
    Package,
    Layers,
    AlertTriangle,
    RotateCcw
} from 'lucide-react';
import { getCurrentAdmin } from '@/api/supabase/admin/auth';
import { hasAccess } from '@/lib/adminRoleData';
import {
    getMasterObat,
    createMasterObat,
    updateMasterObat,
    deleteMasterObat
} from '@/api/supabase/admin/obat';
import MasterObatModal from '@/components/panitia/pj_medis/MasterObatModal';
import ConfirmModal from '@/components/panitia/ConfirmModal';
import TombolCetak from '@/components/panitia/TombolCetak';
import TablePagination from '@/components/panitia/TablePagination';

const ITEMS_PER_PAGE = 10;

export default function MasterObatPage() {
    const router = useRouter();
    const [admin, setAdmin] = useState(null);
    const [dataList, setDataList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // Confirm delete state
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [deletingLoading, setDeletingLoading] = useState(false);

    // Toast
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    // Initial load
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getMasterObat();
            if (res.success) {
                setDataList(res.data || []);
            } else {
                showToast(res.error || 'Gagal memuat data master obat', 'error');
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

                if (!hasAccess(currentAdmin.role, '/panitia/pj_medis/master_obat')) {
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
        if (!query) return dataList;
        return dataList.filter(item =>
            item.nama_obat && item.nama_obat.toLowerCase().includes(query)
        );
    }, [dataList, searchQuery]);

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE) || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedData = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    // Stats
    const stats = useMemo(() => {
        const totalVarian = dataList.length;
        const totalStok = dataList.reduce((acc, curr) => acc + (curr.stok_obat || 0), 0);
        const totalSisa = dataList.reduce((acc, curr) => acc + (curr.sisa_obat ?? curr.stok_obat ?? 0), 0);
        const obatMenipis = dataList.filter(item => {
            const sisa = item.sisa_obat ?? item.stok_obat ?? 0;
            return sisa <= 5;
        }).length;
        return { totalVarian, totalStok, totalSisa, obatMenipis };
    }, [dataList]);

    // Handle create or update
    const handleSave = async (payload) => {
        if (editingItem) {
            const res = await updateMasterObat(editingItem.id, payload);
            if (!res.success) throw new Error(res.error);
            showToast('Data master obat berhasil diperbarui');
        } else {
            const res = await createMasterObat(payload);
            if (!res.success) throw new Error(res.error);
            showToast('Obat baru berhasil ditambahkan');
        }
        await fetchData();
    };

    // Handle delete
    const handlePromptDelete = (id) => {
        setDeletingId(id);
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingId) return;
        setDeletingLoading(true);
        try {
            const res = await deleteMasterObat(deletingId);
            if (res.success) {
                showToast('Obat berhasil dihapus');
                await fetchData();
            } else {
                showToast(res.error || 'Gagal menghapus obat', 'error');
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
        { key: 'sisa_obat', label: 'Sisa Obat' },
        { key: 'terpakai', label: 'Terpakai' },
        { key: 'created_at_fmt', label: 'Tanggal Input' }
    ];

    const printData = useMemo(() => {
        return filteredData.map((item, idx) => {
            const sisa = item.sisa_obat ?? item.stok_obat ?? 0;
            const terpakai = (item.stok_obat || 0) - sisa;
            const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            }) : '-';

            return {
                no: idx + 1,
                nama_obat: item.nama_obat || '-',
                stok_obat: item.stok_obat ?? 0,
                sisa_obat: sisa,
                terpakai: terpakai >= 0 ? terpakai : 0,
                created_at_fmt: dateStr
            };
        });
    }, [filteredData]);

    const formatDateTime = (dateStr) => {
        if (!dateStr) return '-';
        try {
            return new Date(dateStr).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
            {/* Toast Notification */}
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
                        <div className="p-2.5 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-2xl">
                            <Pill size={24} />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                            Master Data Obat
                        </h1>
                    </div>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Kelola katalog obat, pembaruan stok awal, dan pemantauan sisa persediaan medis
                    </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                    <TombolCetak
                        pdfTitle="Laporan Master Obat Medis PKKMB 2026"
                        pdfSite="pkkmb"
                        pdfData={printData}
                        pdfColumns={printColumns}
                        excelData={printData}
                        excelColumns={printColumns}
                        excelFilename="master-obat-medis"
                    />

                    <button
                        onClick={() => {
                            setEditingItem(null);
                            setIsModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95"
                    >
                        <Plus size={16} />
                        <span>Tambah Obat</span>
                    </button>
                </div>
            </div>

            {/* Stats Overview Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Varian Obat</span>
                    <p className="mt-1 text-2xl font-black text-slate-800 dark:text-white">
                        {loading ? '...' : stats.totalVarian}
                    </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Stok Masuk</span>
                    <p className="mt-1 text-2xl font-black text-blue-600 dark:text-blue-400">
                        {loading ? '...' : stats.totalStok}
                    </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Sisa Stok Tersedia</span>
                    <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">
                        {loading ? '...' : stats.totalSisa}
                    </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Stok Kritis / Habis</span>
                    <p className="mt-1 text-2xl font-black text-rose-600 dark:text-rose-400">
                        {loading ? '...' : stats.obatMenipis}
                    </p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
                <Search size={18} className="text-slate-400 shrink-0" />
                <input
                    type="text"
                    placeholder="Cari nama obat..."
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
                            Katalog Obat & Status Persediaan
                        </h3>
                        <p className="text-xs text-slate-400">
                            Data master obat yang dapat digunakan pada riwayat penanganan medis
                        </p>
                    </div>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                        {filteredData.length} Obat
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="bg-slate-50/75 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                                <th className="py-3.5 px-4 w-14 text-center">No</th>
                                <th className="py-3.5 px-4">Nama Obat</th>
                                <th className="py-3.5 px-4 w-32 text-center">Jumlah Stok</th>
                                <th className="py-3.5 px-4 w-32 text-center">Sisa Obat</th>
                                <th className="py-3.5 px-4 w-28 text-center">Terpakai</th>
                                <th className="py-3.5 px-4 w-40">Tanggal Dibuat</th>
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
                                        <td className="py-4 px-4"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                                        <td className="py-4 px-4 text-center"><div className="h-6 w-14 bg-slate-200 dark:bg-slate-800 rounded mx-auto" /></td>
                                    </tr>
                                ))
                            ) : paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-14 text-center">
                                        <div className="inline-flex p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 mb-2">
                                            <Package size={28} />
                                        </div>
                                        <p className="font-bold text-slate-800 dark:text-slate-200 text-base">
                                            {searchQuery ? 'Obat tidak ditemukan' : 'Belum Ada Data Obat'}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            {searchQuery ? `Tidak ada obat dengan kata kunci "${searchQuery}"` : 'Klik tombol "Tambah Obat" untuk menambahkan master obat.'}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((item, index) => {
                                    const sisa = item.sisa_obat ?? item.stok_obat ?? 0;
                                    const terpakai = (item.stok_obat || 0) - sisa;

                                    let badgeStyle = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
                                    if (sisa === 0) {
                                        badgeStyle = 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-900';
                                    } else if (sisa <= 5) {
                                        badgeStyle = 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800';
                                    }

                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="py-4 px-4 text-center text-xs font-semibold text-slate-400">
                                                {startIndex + index + 1}
                                            </td>
                                            <td className="py-4 px-4">
                                                <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                                                    {item.nama_obat}
                                                </p>
                                            </td>
                                            <td className="py-4 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                                                {item.stok_obat ?? 0}
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badgeStyle}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                                        sisa === 0 ? 'bg-rose-500' : sisa <= 5 ? 'bg-amber-500' : 'bg-emerald-500'
                                                    }`} />
                                                    {sisa} {sisa === 0 ? '(Habis)' : ''}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-center font-semibold text-slate-500 dark:text-slate-400">
                                                {terpakai >= 0 ? terpakai : 0}
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
                                                        title="Edit Obat"
                                                        className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors"
                                                    >
                                                        <Edit3 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handlePromptDelete(item.id)}
                                                        title="Hapus Obat"
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

            {/* Modal Tambah/Edit Master Obat */}
            <MasterObatModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                editingData={editingItem}
            />

            {/* Confirm Modal for Delete */}
            <ConfirmModal
                open={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                loading={deletingLoading}
                title="Hapus Master Obat"
                message="Apakah Anda yakin ingin menghapus data obat ini? Catatan riwayat pemakaian yang terkait mungkin akan terhapus."
                confirmLabel="Ya, Hapus"
                cancelLabel="Batal"
            />
        </div>
    );
}
