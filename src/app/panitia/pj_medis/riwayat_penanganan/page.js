'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    HeartPulse,
    Plus,
    Trash2,
    Edit3,
    Search,
    AlertCircle,
    CheckCircle2,
    User,
    Shield,
    Pill,
    Calendar,
    Activity,
    Users
} from 'lucide-react';
import { getCurrentAdmin } from '@/api/supabase/admin/auth';
import { hasAccess } from '@/lib/adminRoleData';
import {
    getRiwayatPenangananMedis,
    getMasterObat,
    getAdminsForMedis,
    createRiwayatPenangananMedis,
    updateRiwayatPenangananMedis,
    deleteRiwayatPenangananMedis
} from '@/api/supabase/admin/obat';
import RiwayatPenangananModal from '@/components/panitia/pj_medis/RiwayatPenangananModal';
import ConfirmModal from '@/components/panitia/ConfirmModal';
import TombolCetak from '@/components/panitia/TombolCetak';
import TablePagination from '@/components/panitia/TablePagination';

const ITEMS_PER_PAGE = 10;

export default function RiwayatPenangananPage() {
    const router = useRouter();
    const [admin, setAdmin] = useState(null);
    const [riwayatList, setRiwayatList] = useState([]);
    const [masterList, setMasterList] = useState([]);
    const [adminList, setAdminList] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all'); // 'all' | 'peserta' | 'panitia' | 'dengan_obat' | 'tanpa_obat'
    const [currentPage, setCurrentPage] = useState(1);

    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // Delete
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
            const [riwayatRes, masterRes, adminsRes] = await Promise.all([
                getRiwayatPenangananMedis(),
                getMasterObat(),
                getAdminsForMedis()
            ]);

            if (riwayatRes.success) {
                setRiwayatList(riwayatRes.data || []);
            } else {
                showToast(riwayatRes.error || 'Gagal memuat riwayat penanganan', 'error');
            }

            if (masterRes.success) {
                setMasterList(masterRes.data || []);
            }

            if (adminsRes.success) {
                setAdminList(adminsRes.data || []);
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

                if (!hasAccess(currentAdmin.role, '/panitia/pj_medis/riwayat_penanganan')) {
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

    // Filtering
    const filteredData = useMemo(() => {
        return riwayatList.filter((item) => {
            // Category Filter
            if (categoryFilter === 'peserta' && !item.peserta_id) return false;
            if (categoryFilter === 'panitia' && !item.panitia_id) return false;
            if (categoryFilter === 'dengan_obat' && !item.pemakaian_obat_id) return false;
            if (categoryFilter === 'tanpa_obat' && item.pemakaian_obat_id) return false;

            // Search Filter
            if (!searchQuery.trim()) return true;
            const q = searchQuery.toLowerCase().trim();

            const namaPeserta = item.peserta?.nama_anggota || '';
            const nimPeserta = item.peserta?.nim_anggota || '';
            const namaPanitia = item.panitia?.nama || '';
            const namaObat = item.pemakaian_obat?.master_obat?.nama_obat || '';
            const keterangan = item.keterangan || '';

            return (
                namaPeserta.toLowerCase().includes(q) ||
                nimPeserta.toLowerCase().includes(q) ||
                namaPanitia.toLowerCase().includes(q) ||
                namaObat.toLowerCase().includes(q) ||
                keterangan.toLowerCase().includes(q)
            );
        });
    }, [riwayatList, categoryFilter, searchQuery]);

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE) || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedData = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, categoryFilter]);

    // Stats
    const stats = useMemo(() => {
        const total = riwayatList.length;
        const pesertaCount = riwayatList.filter(r => r.peserta_id).length;
        const panitiaCount = riwayatList.filter(r => r.panitia_id).length;
        const denganObatCount = riwayatList.filter(r => r.pemakaian_obat_id).length;
        return { total, pesertaCount, panitiaCount, denganObatCount };
    }, [riwayatList]);

    // Save
    const handleSave = async (payload) => {
        if (editingItem) {
            const res = await updateRiwayatPenangananMedis(editingItem.id, payload);
            if (!res.success) throw new Error(res.error);
            showToast('Riwayat penanganan medis berhasil diperbarui');
        } else {
            const res = await createRiwayatPenangananMedis(payload);
            if (!res.success) throw new Error(res.error);
            showToast('Penanganan medis berhasil dicatat');
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
            const res = await deleteRiwayatPenangananMedis(deletingId);
            if (res.success) {
                showToast('Catatan penanganan medis berhasil dihapus');
                await fetchData();
            } else {
                showToast(res.error || 'Gagal menghapus catatan', 'error');
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
        { key: 'kategori', label: 'Kategori' },
        { key: 'nama_pasien', label: 'Nama Pasien' },
        { key: 'identitas', label: 'Identitas / Kelompok' },
        { key: 'nama_obat', label: 'Obat Diberikan' },
        { key: 'jumlah_obat', label: 'Jumlah Obat' },
        { key: 'sisa_obat', label: 'Sisa Obat' },
        { key: 'keterangan', label: 'Tindakan / Keterangan' },
        { key: 'created_at_fmt', label: 'Waktu Penanganan' }
    ];

    const printData = useMemo(() => {
        return filteredData.map((item, idx) => {
            const isPeserta = !!item.peserta_id;
            const nama = isPeserta
                ? (item.peserta?.nama_anggota || 'Peserta')
                : (item.panitia?.nama || 'Panitia');

            const identitas = isPeserta
                ? `NIM: ${item.peserta?.nim_anggota || '-'} (${item.peserta?.kelompok?.nama_kelompok || 'Kelompok'})`
                : `Role: ${item.panitia?.role || 'Panitia'}`;

            const obatInfo = item.pemakaian_obat?.master_obat;
            const namaObat = obatInfo ? obatInfo.nama_obat : 'Tanpa Obat';
            const jumlahObat = item.pemakaian_obat ? item.pemakaian_obat.pemakaian_obat : '-';
            const sisaObat = obatInfo ? (obatInfo.sisa_obat ?? obatInfo.stok_obat) : '-';

            const dateStr = item.created_at ? new Date(item.created_at).toLocaleString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) : '-';

            return {
                no: idx + 1,
                kategori: isPeserta ? 'Peserta' : 'Panitia',
                nama_pasien: nama,
                identitas: identitas,
                nama_obat: namaObat,
                jumlah_obat: jumlahObat,
                sisa_obat: sisaObat,
                keterangan: item.keterangan || '-',
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
                        <div className="p-2.5 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-2xl">
                            <HeartPulse size={24} />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                            Riwayat Penanganan Medis
                        </h1>
                    </div>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Catatan riwayat tindakan medis terhadap peserta maupun panitia selama rangkaian acara
                    </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                    <TombolCetak
                        pdfTitle="Laporan Riwayat Penanganan Medis PKKMB 2026"
                        pdfSite="pkkmb"
                        pdfData={printData}
                        pdfColumns={printColumns}
                        excelData={printData}
                        excelColumns={printColumns}
                        excelFilename="riwayat-penanganan-medis"
                    />

                    <button
                        onClick={() => {
                            setEditingItem(null);
                            setIsModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-500/20 transition-all hover:scale-105 active:scale-95"
                    >
                        <Plus size={16} />
                        <span>Tambah Penanganan</span>
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Penanganan</span>
                    <p className="mt-1 text-2xl font-black text-slate-800 dark:text-white">
                        {loading ? '...' : stats.total} Kasus
                    </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pasien Peserta</span>
                    <p className="mt-1 text-2xl font-black text-blue-600 dark:text-blue-400">
                        {loading ? '...' : stats.pesertaCount} Orang
                    </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pasien Panitia</span>
                    <p className="mt-1 text-2xl font-black text-indigo-600 dark:text-indigo-400">
                        {loading ? '...' : stats.panitiaCount} Orang
                    </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Diberikan Obat</span>
                    <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">
                        {loading ? '...' : stats.denganObatCount} Kasus
                    </p>
                </div>
            </div>

            {/* Filter Tabs & Search */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                    {[
                        { id: 'all', label: 'Semua Kasus' },
                        { id: 'peserta', label: 'Peserta Saja' },
                        { id: 'panitia', label: 'Panitia Saja' },
                        { id: 'dengan_obat', label: 'Dengan Obat' },
                        { id: 'tanpa_obat', label: 'Tanpa Obat' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setCategoryFilter(tab.id)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                categoryFilter === tab.id
                                    ? 'bg-rose-600 text-white shadow-sm shadow-rose-500/30'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <Search size={18} className="text-slate-400 shrink-0" />
                    <input
                        type="text"
                        placeholder="Cari nama pasien, NIM, nama obat, atau keterangan penanganan..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-base">
                            Rekam Medis & Tindakan
                        </h3>
                        <p className="text-xs text-slate-400">
                            Daftar rekam jejak bantuan medis yang telah dilakukan
                        </p>
                    </div>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                        {filteredData.length} Data
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="bg-slate-50/75 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                                <th className="py-3.5 px-4 w-14 text-center">No</th>
                                <th className="py-3.5 px-4 w-28">Kategori</th>
                                <th className="py-3.5 px-4">Nama Pasien</th>
                                <th className="py-3.5 px-4">Obat Diberikan</th>
                                <th className="py-3.5 px-4 w-28 text-center">Jumlah</th>
                                <th className="py-3.5 px-4 w-28 text-center">Sisa Stok</th>
                                <th className="py-3.5 px-4 min-w-[200px]">Keterangan</th>
                                <th className="py-3.5 px-4 w-40">Waktu</th>
                                <th className="py-3.5 px-4 w-24 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                            {loading ? (
                                Array.from({ length: 4 }).map((_, idx) => (
                                    <tr key={idx} className="animate-pulse">
                                        <td className="py-4 px-4 text-center"><div className="h-4 w-4 bg-slate-200 dark:bg-slate-800 rounded mx-auto" /></td>
                                        <td className="py-4 px-4"><div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" /></td>
                                        <td className="py-4 px-4"><div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                                        <td className="py-4 px-4"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                                        <td className="py-4 px-4 text-center"><div className="h-4 w-8 bg-slate-200 dark:bg-slate-800 rounded mx-auto" /></td>
                                        <td className="py-4 px-4 text-center"><div className="h-4 w-8 bg-slate-200 dark:bg-slate-800 rounded mx-auto" /></td>
                                        <td className="py-4 px-4"><div className="h-4 w-44 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                                        <td className="py-4 px-4"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                                        <td className="py-4 px-4 text-center"><div className="h-6 w-14 bg-slate-200 dark:bg-slate-800 rounded mx-auto" /></td>
                                    </tr>
                                ))
                            ) : paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-14 text-center">
                                        <div className="inline-flex p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 mb-2">
                                            <HeartPulse size={28} />
                                        </div>
                                        <p className="font-bold text-slate-800 dark:text-slate-200 text-base">
                                            Belum Ada Catatan Penanganan Medis
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            Klik tombol &quot;Tambah Penanganan&quot; untuk mencatat pasien yang ditangani.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((item, index) => {
                                    const isPeserta = !!item.peserta_id;
                                    const obatInfo = item.pemakaian_obat?.master_obat;
                                    const pemakaian = item.pemakaian_obat?.pemakaian_obat;

                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="py-4 px-4 text-center text-xs font-semibold text-slate-400">
                                                {startIndex + index + 1}
                                            </td>

                                            {/* Badge Kategori */}
                                            <td className="py-4 px-4">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                                    isPeserta
                                                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/60'
                                                        : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/60'
                                                }`}>
                                                    {isPeserta ? <User size={12} /> : <Shield size={12} />}
                                                    <span>{isPeserta ? 'Peserta' : 'Panitia'}</span>
                                                </span>
                                            </td>

                                            {/* Nama Pasien */}
                                            <td className="py-4 px-4">
                                                {isPeserta ? (
                                                    <div>
                                                        <p className="font-bold text-slate-800 dark:text-slate-100">
                                                            {item.peserta?.nama_anggota || 'Peserta'}
                                                        </p>
                                                        <p className="text-xs text-slate-400">
                                                            NIM: {item.peserta?.nim_anggota || '-'} • {item.peserta?.kelompok?.nama_kelompok || 'Kelompok'}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <p className="font-bold text-slate-800 dark:text-slate-100">
                                                            {item.panitia?.nama || 'Panitia'}
                                                        </p>
                                                        <p className="text-xs text-slate-400">
                                                            {item.panitia?.role || 'Panitia'}
                                                        </p>
                                                    </div>
                                                )}
                                            </td>

                                            {/* Nama Obat */}
                                            <td className="py-4 px-4">
                                                {obatInfo ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold">
                                                        <Pill size={13} />
                                                        <span>{obatInfo.nama_obat}</span>
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">
                                                        Tanpa Obat
                                                    </span>
                                                )}
                                            </td>

                                            {/* Jumlah Pemakaian */}
                                            <td className="py-4 px-4 text-center font-bold text-slate-700 dark:text-slate-300 text-xs">
                                                {pemakaian ? `${pemakaian} pcs` : '-'}
                                            </td>

                                            {/* Sisa Obat Terkini */}
                                            <td className="py-4 px-4 text-center">
                                                {obatInfo ? (
                                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                                        {obatInfo.sisa_obat ?? obatInfo.stok_obat}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-slate-400">-</span>
                                                )}
                                            </td>

                                            {/* Keterangan */}
                                            <td className="py-4 px-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                                                {item.keterangan || '-'}
                                            </td>

                                            {/* Waktu */}
                                            <td className="py-4 px-4 text-xs text-slate-500 dark:text-slate-400">
                                                {formatDateTime(item.created_at)}
                                            </td>

                                            {/* Aksi */}
                                            <td className="py-4 px-4 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() => {
                                                            setEditingItem(item);
                                                            setIsModalOpen(true);
                                                        }}
                                                        title="Edit Riwayat"
                                                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                                                    >
                                                        <Edit3 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handlePromptDelete(item.id)}
                                                        title="Hapus Riwayat"
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

            {/* Modal Tambah/Edit Riwayat Penanganan */}
            <RiwayatPenangananModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                masterObatList={masterList}
                adminList={adminList}
                editingData={editingItem}
            />

            {/* Confirm Modal for Delete */}
            <ConfirmModal
                open={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                loading={deletingLoading}
                title="Hapus Riwayat Penanganan Medis"
                message="Apakah Anda yakin ingin menghapus catatan penanganan ini? Jika penanganan ini menggunakan obat, stok obat akan otomatis dikembalikan."
                confirmLabel="Ya, Hapus"
                cancelLabel="Batal"
            />
        </div>
    );
}
