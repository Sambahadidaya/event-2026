'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    ShieldAlert,
    Plus,
    Edit2,
    Trash2,
    Search,
    AlertCircle,
    CheckCircle2,
    AlertTriangle,
    Shield
} from 'lucide-react';
import { getCurrentAdmin } from '@/api/supabase/admin/auth';
import { hasAccess } from '@/lib/adminRoleData';
import {
    getMasterPelanggaran,
    createMasterPelanggaran,
    updateMasterPelanggaran,
    deleteMasterPelanggaran
} from '@/api/supabase/admin/pelanggaran';
import MasterPelanggaranModal from '@/components/panitia/tatib/MasterPelanggaranModal';
import ConfirmModal from '@/components/panitia/ConfirmModal';

export default function MasterPelanggaranPage() {
    const router = useRouter();
    const [admin, setAdmin] = useState(null);
    const [pelanggaranList, setPelanggaranList] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [jenisFilter, setJenisFilter] = useState('all');

    // Modals
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editData, setEditData] = useState(null);

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [deletingLoading, setDeletingLoading] = useState(false);

    // Toast notification
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchPelanggaran = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getMasterPelanggaran();
            if (res.success) {
                setPelanggaranList(res.data || []);
            } else {
                showToast(res.error || 'Gagal memuat master pelanggaran', 'error');
            }
        } catch (err) {
            console.error('Error fetching master pelanggaran:', err);
            showToast('Terjadi kesalahan memuat data', 'error');
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

                if (!hasAccess(currentAdmin.role, '/panitia/pj_tatib/master_pelanggaran')) {
                    router.push('/panitia/dashboard');
                    return;
                }

                setAdmin(currentAdmin);
                await fetchPelanggaran();
            } catch (err) {
                console.error('Init error:', err);
                router.push('/panitia/login');
            }
        };

        init();
    }, [router, fetchPelanggaran]);

    // Summary counts
    const counts = useMemo(() => {
        const total = pelanggaranList.length;
        const ringan = pelanggaranList.filter(p => p.jenis_pelanggaran === 'Ringan').length;
        const sedang = pelanggaranList.filter(p => p.jenis_pelanggaran === 'Sedang').length;
        const berat = pelanggaranList.filter(p => p.jenis_pelanggaran === 'Berat').length;
        return { total, ringan, sedang, berat };
    }, [pelanggaranList]);

    // Filtered data
    const filteredList = useMemo(() => {
        return pelanggaranList.filter(item => {
            const matchSearch = (item.nama_pelanggaran || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchJenis = jenisFilter === 'all' || item.jenis_pelanggaran === jenisFilter;
            return matchSearch && matchJenis;
        });
    }, [pelanggaranList, searchQuery, jenisFilter]);

    const handleOpenAdd = () => {
        setEditData(null);
        setIsFormModalOpen(true);
    };

    const handleOpenEdit = (item) => {
        setEditData(item);
        setIsFormModalOpen(true);
    };

    const handleSave = async (payload) => {
        if (editData) {
            const res = await updateMasterPelanggaran(editData.id, payload);
            if (!res.success) throw new Error(res.error);
            showToast('Master pelanggaran berhasil diperbarui');
        } else {
            const res = await createMasterPelanggaran(payload);
            if (!res.success) throw new Error(res.error);
            showToast('Master pelanggaran berhasil ditambahkan');
        }
        await fetchPelanggaran();
    };

    const handlePromptDelete = (id) => {
        setDeletingId(id);
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingId) return;
        setDeletingLoading(true);
        try {
            const res = await deleteMasterPelanggaran(deletingId);
            if (res.success) {
                showToast('Master pelanggaran berhasil dihapus');
                await fetchPelanggaran();
            } else {
                showToast(res.error || 'Gagal menghapus pelanggaran', 'error');
            }
        } catch (err) {
            console.error('Delete error:', err);
            showToast('Terjadi kesalahan menghapus data', 'error');
        } finally {
            setDeletingLoading(false);
            setIsConfirmOpen(false);
            setDeletingId(null);
        }
    };

    const getBadgeStyle = (jenis) => {
        if (jenis === 'Ringan') {
            return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/80';
        }
        if (jenis === 'Sedang') {
            return 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800/80';
        }
        return 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/80';
    };

    const formatDate = (dateStr) => {
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
            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-sm font-medium animate-in slide-in-from-bottom-5 duration-200 ${toast.type === 'error'
                    ? 'bg-rose-500 text-white border-rose-600'
                    : 'bg-emerald-600 text-white border-emerald-700'
                    }`}>
                    {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                    <span>{toast.message}</span>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl">
                            <ShieldAlert size={22} />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                            Master Pelanggaran
                        </h1>
                    </div>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Kelola daftar aturan tata tertib dan tingkat sanksi kegiatan PKKMB
                    </p>
                </div>

                <button
                    onClick={handleOpenAdd}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-bold rounded-2xl shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    <Plus size={18} />
                    <span>Tambah Pelanggaran</span>
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
                        <span>Total Aturan</span>
                        <Shield size={16} className="text-blue-500" />
                    </div>
                    <p className="mt-2 text-2xl font-black text-slate-800 dark:text-white">
                        {loading ? '...' : counts.total}
                    </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
                        <span>Ringan</span>
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    </div>
                    <p className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400">
                        {loading ? '...' : counts.ringan}
                    </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
                        <span>Sedang</span>
                        <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
                    </div>
                    <p className="mt-2 text-2xl font-black text-orange-600 dark:text-orange-400">
                        {loading ? '...' : counts.sedang}
                    </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
                        <span>Berat</span>
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    </div>
                    <p className="mt-2 text-2xl font-black text-rose-600 dark:text-rose-400">
                        {loading ? '...' : counts.berat}
                    </p>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="relative w-full sm:w-80">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari nama pelanggaran..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                    {['all', 'Ringan', 'Sedang', 'Berat'].map((jenis) => (
                        <button
                            key={jenis}
                            onClick={() => setJenisFilter(jenis)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${jenisFilter === jenis
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                        >
                            {jenis === 'all' ? 'Semua Tingkat' : jenis}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table / List */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="bg-slate-50/75 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                                <th className="py-3.5 px-4 w-14 text-center">No</th>
                                <th className="py-3.5 px-4">Nama Pelanggaran</th>
                                <th className="py-3.5 px-4 w-40">Tingkat</th>
                                <th className="py-3.5 px-4 w-36 hidden md:table-cell">Dibuat</th>
                                <th className="py-3.5 px-4 w-28 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, idx) => (
                                    <tr key={idx} className="animate-pulse">
                                        <td className="py-4 px-4 text-center">
                                            <div className="h-4 w-4 bg-slate-200 dark:bg-slate-800 rounded mx-auto" />
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" />
                                        </td>
                                        <td className="py-4 px-4 hidden md:table-cell">
                                            <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <div className="h-7 w-16 bg-slate-200 dark:bg-slate-800 rounded-xl mx-auto" />
                                        </td>
                                    </tr>
                                ))
                            ) : filteredList.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-16 text-center">
                                        <div className="inline-flex p-4 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400 mb-3">
                                            <ShieldAlert size={36} />
                                        </div>
                                        <p className="font-bold text-slate-700 dark:text-slate-200 text-base">
                                            Belum Ada Master Pelanggaran
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                                            {searchQuery || jenisFilter !== 'all'
                                                ? 'Tidak ditemukan pelanggaran yang sesuai dengan filter pencarian.'
                                                : 'Mulai dengan menambahkan master pelanggaran untuk tata tertib kegiatan.'}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredList.map((item, index) => (
                                    <tr
                                        key={item.id}
                                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                                    >
                                        <td className="py-4 px-4 text-center text-xs font-semibold text-slate-400">
                                            {index + 1}
                                        </td>
                                        <td className="py-4 px-4">
                                            <p className="font-semibold text-slate-800 dark:text-slate-100">
                                                {item.nama_pelanggaran}
                                            </p>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${getBadgeStyle(item.jenis_pelanggaran)}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${item.jenis_pelanggaran === 'Ringan' ? 'bg-amber-500' :
                                                    item.jenis_pelanggaran === 'Sedang' ? 'bg-orange-500' : 'bg-rose-500'
                                                    }`} />
                                                {item.jenis_pelanggaran}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-xs text-slate-400 hidden md:table-cell">
                                            {formatDate(item.created_at)}
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => handleOpenEdit(item)}
                                                    title="Edit"
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handlePromptDelete(item.id)}
                                                    title="Hapus"
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            <MasterPelanggaranModal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                onSave={handleSave}
                editData={editData}
            />

            <ConfirmModal
                open={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                loading={deletingLoading}
                title="Hapus Master Pelanggaran"
                message="Apakah Anda yakin ingin menghapus master pelanggaran ini? Riwayat pelanggaran yang terkait dengan aturan ini mungkin akan terpengaruh."
                confirmLabel="Ya, Hapus"
                cancelLabel="Batal"
            />
        </div>
    );
}
