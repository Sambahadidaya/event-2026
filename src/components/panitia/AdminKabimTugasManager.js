'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    BookOpen, RefreshCw, Trash2, Image as ImageIcon, Search,
    CheckCircle2, XCircle, AlertCircle, FileCheck, Layers,
    ExternalLink, X, Eye, Users, ChevronRight, Download, Maximize2
} from 'lucide-react';
import { getMateriListForKabim, getTugasKabimByMateri, deleteTugasKabim } from '@/api/supabase/admin/tugas_kabim';

export default function AdminKabimTugasManager() {
    const [materiList, setMateriList] = useState([]);
    const [selectedMateri, setSelectedMateri] = useState('');
    const [tugasList, setTugasList] = useState([]);
    const [loadingMateri, setLoadingMateri] = useState(true);
    const [loadingTugas, setLoadingTugas] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'sudah' | 'belum'
    const [previewImage, setPreviewImage] = useState(null);
    const [activePreviewIndex, setActivePreviewIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(null);
    const [toastMessage, setToastMessage] = useState(null);

    // Fetch daftar materi saat pertama kali dimount
    const fetchMateriList = useCallback(async () => {
        setLoadingMateri(true);
        const res = await getMateriListForKabim();
        if (res.success) {
            setMateriList(res.data || []);
        } else {
            showToast(res.error || 'Gagal memuat materi', 'error');
        }
        setLoadingMateri(false);
    }, []);

    // Fetch daftar tugas berdasarkan materi yang dipilih
    const fetchTugasList = useCallback(async (materiId) => {
        if (!materiId) {
            setTugasList([]);
            return;
        }
        setLoadingTugas(true);
        const res = await getTugasKabimByMateri(materiId);
        if (res.success) {
            setTugasList(res.data || []);
        } else {
            showToast(res.error || 'Gagal memuat data tugas', 'error');
            setTugasList([]);
        }
        setLoadingTugas(false);
    }, []);

    useEffect(() => {
        fetchMateriList();
    }, [fetchMateriList]);

    useEffect(() => {
        if (selectedMateri) {
            fetchTugasList(selectedMateri);
        } else {
            setTugasList([]);
        }
    }, [selectedMateri, fetchTugasList]);

    const showToast = (message, type = 'success') => {
        setToastMessage({ message, type });
        setTimeout(() => setToastMessage(null), 3500);
    };

    const handleDeleteTugas = async (tugasId, namaPeserta) => {
        if (!tugasId) return;
        const confirmDelete = window.confirm(
            `Apakah Anda yakin ingin menghapus tugas dari "${namaPeserta}"?\nData tugas yang dihapus tidak dapat dikembalikan.`
        );
        if (!confirmDelete) return;

        setIsDeleting(tugasId);
        const res = await deleteTugasKabim(tugasId);
        setIsDeleting(null);

        if (res.success) {
            showToast(`Tugas milik "${namaPeserta}" berhasil dihapus.`);
            fetchTugasList(selectedMateri);
        } else {
            showToast(res.error || 'Gagal menghapus tugas.', 'error');
        }
    };

    // Format tanggal Indonesia
    const formatTanggal = (dateString) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).format(date);
        } catch {
            return dateString;
        }
    };

    // Filtering data pencarian dan status
    const filteredData = useMemo(() => {
        return tugasList.filter(item => {
            const matchesSearch =
                (item.nama || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.nim || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.kampus || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.kelompok_nama || '').toLowerCase().includes(searchQuery.toLowerCase());

            if (!matchesSearch) return false;

            if (statusFilter === 'sudah') return item.status_tugas === true;
            if (statusFilter === 'belum') return item.status_tugas === false;

            return true;
        });
    }, [tugasList, searchQuery, statusFilter]);

    // Statistik tugas
    const stats = useMemo(() => {
        const total = tugasList.length;
        const sudah = tugasList.filter(t => t.status_tugas).length;
        const belum = total - sudah;
        const percentage = total > 0 ? Math.round((sudah / total) * 100) : 0;
        return { total, sudah, belum, percentage };
    }, [tugasList]);

    return (
        <div className="space-y-6 animate-in fade-in duration-300 pb-20">
            {/* Notification Toast */}
            {toastMessage && (
                <div
                    className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-medium transition-all transform animate-in slide-in-from-bottom-5 ${
                        toastMessage.type === 'error'
                            ? 'bg-rose-50 dark:bg-rose-950/90 text-rose-700 dark:text-rose-200 border-rose-200 dark:border-rose-800'
                            : 'bg-emerald-50 dark:bg-emerald-950/90 text-emerald-700 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                    }`}
                >
                    {toastMessage.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                    <span>{toastMessage.message}</span>
                </div>
            )}

            {/* Header Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
                            <FileCheck size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Review Tugas Anggota Kelompok
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                Pantau pengumpulan tugas materi peserta PKKMB untuk kelompok binaan Anda.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-auto">
                    <button
                        onClick={() => {
                            if (selectedMateri) fetchTugasList(selectedMateri);
                            fetchMateriList();
                        }}
                        disabled={loadingTugas || loadingMateri}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl transition-all shadow-sm hover:border-blue-300 dark:hover:border-blue-700 disabled:opacity-50"
                    >
                        <RefreshCw size={15} className={loadingTugas || loadingMateri ? 'animate-spin text-blue-600' : ''} />
                        <span>Segarkan</span>
                    </button>
                </div>
            </div>

            {/* Selector Materi & Filter Bar */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Dropdown Materi */}
                    <div className="md:col-span-1">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                            Pilih Materi PKKMB <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                            <select
                                value={selectedMateri}
                                onChange={(e) => setSelectedMateri(e.target.value)}
                                disabled={loadingMateri}
                                className="w-full pl-3.5 pr-10 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                            >
                                <option value="">— Pilih Materi Terlebih Dahulu —</option>
                                {materiList.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.judul} {m.pemateri ? `(${m.pemateri})` : ''}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                <BookOpen size={16} />
                            </div>
                        </div>
                    </div>

                    {/* Input Pencarian */}
                    <div className="md:col-span-1">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                            Cari Anggota / NIM
                        </label>
                        <div className="relative">
                            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari nama, NIM, atau kampus..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                disabled={!selectedMateri}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>
                    </div>

                    {/* Filter Status */}
                    <div className="md:col-span-1">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                            Filter Status Pengumpulan
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                type="button"
                                disabled={!selectedMateri}
                                onClick={() => setStatusFilter('all')}
                                className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all truncate ${
                                    statusFilter === 'all'
                                        ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                        : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-750'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                Semua
                            </button>
                            <button
                                type="button"
                                disabled={!selectedMateri}
                                onClick={() => setStatusFilter('sudah')}
                                className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all truncate ${
                                    statusFilter === 'sudah'
                                        ? 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                        : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-750'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                ✅ Sudah
                            </button>
                            <button
                                type="button"
                                disabled={!selectedMateri}
                                onClick={() => setStatusFilter('belum')}
                                className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all truncate ${
                                    statusFilter === 'belum'
                                        ? 'bg-rose-50 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                                        : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-750'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                ❌ Belum
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* State jika Materi Belum Dipilih */}
            {!selectedMateri ? (
                <div className="bg-white dark:bg-gray-900 rounded-3xl p-12 text-center border border-dashed border-gray-200 dark:border-gray-800 max-w-2xl mx-auto my-8">
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-8 ring-blue-50/50 dark:ring-blue-900/10">
                        <BookOpen size={30} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                        Pilih Materi Terlebih Dahulu
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md mx-auto leading-relaxed">
                        Silakan tentukan materi PKKMB pada dropdown di atas untuk menampilkan daftar anggota kelompok beserta status pengumpulan tugasnya.
                    </p>
                </div>
            ) : (
                <>
                    {/* Summary Statistics Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                                <Users size={22} />
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                                    Total Anggota
                                </p>
                                <p className="text-xl font-bold text-gray-800 dark:text-white mt-0.5">
                                    {stats.total} Peserta
                                </p>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                                <CheckCircle2 size={22} />
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                                    Sudah Mengumpulkan
                                </p>
                                <div className="flex items-baseline gap-2 mt-0.5">
                                    <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                                        {stats.sudah}
                                    </span>
                                    <span className="text-xs font-medium text-emerald-600/80 dark:text-emerald-400/80">
                                        ({stats.percentage}%)
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/40 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl">
                                <XCircle size={22} />
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                                    Belum Mengumpulkan
                                </p>
                                <div className="flex items-baseline gap-2 mt-0.5">
                                    <span className="text-xl font-bold text-rose-600 dark:text-rose-400">
                                        {stats.belum}
                                    </span>
                                    <span className="text-xs font-medium text-rose-600/80 dark:text-rose-400/80">
                                        ({stats.total > 0 ? 100 - stats.percentage : 0}%)
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table Container */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                        {loadingTugas ? (
                            <div className="p-16 text-center">
                                <div className="inline-block animate-spin text-blue-600 mb-3">
                                    <RefreshCw size={28} />
                                </div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Memuat data tugas anggota...
                                </p>
                            </div>
                        ) : filteredData.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Search size={20} />
                                </div>
                                <h4 className="text-base font-semibold text-gray-700 dark:text-gray-300">
                                    Tidak ada data yang sesuai
                                </h4>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                    Coba ubah kata kunci pencarian atau filter status.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400 border-collapse">
                                    <thead className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-700 text-xs uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400">
                                        <tr>
                                            <th className="py-3.5 px-4 w-12 text-center">No</th>
                                            <th className="py-3.5 px-4">Materi</th>
                                            <th className="py-3.5 px-4">Nama / NIM</th>
                                            <th className="py-3.5 px-4">Kampus</th>
                                            <th className="py-3.5 px-4 text-center">Status</th>
                                            <th className="py-3.5 px-4 text-center">Bukti Tugas</th>
                                            <th className="py-3.5 px-4">Tanggal Upload</th>
                                            <th className="py-3.5 px-4 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {filteredData.map((item, index) => (
                                            <tr
                                                key={item.id || index}
                                                className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors"
                                            >
                                                {/* No */}
                                                <td className="py-4 px-4 text-center font-medium text-gray-400 text-xs">
                                                    {index + 1}
                                                </td>

                                                {/* Materi */}
                                                <td className="py-4 px-4 text-gray-700 dark:text-gray-300 font-medium">
                                                    <div className="flex items-center gap-2 max-w-[200px]" title={item.materi_judul}>
                                                        <BookOpen size={16} className="text-blue-500 shrink-0" />
                                                        <span className="truncate">{item.materi_judul}</span>
                                                    </div>
                                                </td>

                                                {/* Nama & NIM */}
                                                <td className="py-4 px-4">
                                                    <div>
                                                        <div className="font-bold text-gray-900 dark:text-white">
                                                            {item.nama}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                {item.nim}
                                                            </span>
                                                            {item.kelompok_nama && (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                                                                    Kelompok {item.kelompok_urutan}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Kampus */}
                                                <td className="py-4 px-4 text-gray-600 dark:text-gray-400">
                                                    <span className="text-sm font-medium">
                                                        {item.kampus || '-'}
                                                    </span>
                                                    {item.prodi && item.prodi !== '-' && (
                                                        <span className="block text-xs text-gray-400 mt-0.5">
                                                            {item.prodi}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Status (Badge dengan Icon & Text) */}
                                                <td className="py-4 px-4 text-center">
                                                    {item.status_tugas ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shadow-xs">
                                                            <span>✅</span>
                                                            <span>Sudah</span>
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 shadow-xs">
                                                            <span>❌</span>
                                                            <span>Belum</span>
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Bukti Tugas */}
                                                <td className="py-4 px-4 text-center">
                                                    {item.bukti_tugas ? (
                                                        <button
                                                            onClick={() => {
                                                                setActivePreviewIndex(0);
                                                                setPreviewImage(item.bukti_tugas);
                                                            }}
                                                            className="mx-auto w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors shadow-xs"
                                                            title="Lihat Foto Bukti"
                                                        >
                                                            <ImageIcon size={18} />
                                                        </button>
                                                    ) : (
                                                        <span className="text-gray-400 font-semibold">-</span>
                                                    )}
                                                </td>

                                                {/* Tanggal Upload */}
                                                <td className="py-4 px-4 text-xs font-medium text-gray-600 dark:text-gray-400">
                                                    {item.created_at ? formatTanggal(item.created_at) : '-'}
                                                </td>

                                                {/* Aksi Hapus */}
                                                <td className="py-4 px-4 text-center">
                                                    {item.tugas_id ? (
                                                        <button
                                                            onClick={() => handleDeleteTugas(item.tugas_id, item.nama)}
                                                            disabled={isDeleting === item.tugas_id}
                                                            title="Hapus tugas peserta ini"
                                                            className="w-8 h-8 mx-auto rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 flex items-center justify-center transition-colors disabled:opacity-50"
                                                        >
                                                            {isDeleting === item.tugas_id ? (
                                                                <RefreshCw size={14} className="animate-spin text-red-500" />
                                                            ) : (
                                                                <Trash2 size={14} />
                                                            )}
                                                        </button>
                                                    ) : (
                                                        <span className="text-gray-400 font-semibold">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Modal Image Preview (Sama dengan PKKMB Tugas) */}
            {previewImage && (() => {
                let rawList = [];
                try {
                    const parsed = JSON.parse(previewImage);
                    if (Array.isArray(parsed)) {
                        rawList = parsed;
                    } else {
                        rawList = previewImage.split(',');
                    }
                } catch {
                    rawList = typeof previewImage === 'string' ? previewImage.split(',') : [];
                }

                const imageList = rawList.map(u => {
                    const trimmed = typeof u === 'string' ? u.trim().replace(/^["'\[\]]+|["'\[\]]+$/g, '') : '';
                    if (!trimmed) return null;
                    if (trimmed.startsWith('http')) return trimmed;
                    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qttrkptegnfwoseutfga.supabase.co';
                    return `${supabaseUrl}/storage/v1/object/public/materi-tugas/${trimmed}`;
                }).filter(Boolean);

                const activeImg = typeof activePreviewIndex === 'number' && imageList[activePreviewIndex]
                    ? imageList[activePreviewIndex]
                    : imageList[0];

                return (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in"
                        onClick={() => setPreviewImage(null)}
                    >
                        <div
                            className="max-w-4xl max-h-[90vh] relative flex flex-col items-center gap-3"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={activeImg}
                                alt="Preview Tugas"
                                className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl bg-black/40"
                            />

                            {/* Thumbnails / Pills if multi images */}
                            {imageList.length > 1 && (
                                <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                                    {imageList.map((imgUrl, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setActivePreviewIndex(idx)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                activeImg === imgUrl
                                                    ? 'bg-blue-600 text-white shadow-md'
                                                    : 'bg-white/20 text-gray-200 hover:bg-white/30'
                                            }`}
                                        >
                                            Foto {idx + 1}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Close Button */}
                            <button
                                className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform text-lg leading-none"
                                onClick={() => setPreviewImage(null)}
                                title="Tutup Preview"
                            >
                                &times;
                            </button>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
