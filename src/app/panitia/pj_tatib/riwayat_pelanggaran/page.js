'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    ClipboardList,
    Plus,
    Trash2,
    Search,
    AlertCircle,
    CheckCircle2,
    User,
    ShieldAlert,
    Clock,
    Users,
    ChevronRight,
    RotateCcw,
    Sparkles
} from 'lucide-react';
import { getCurrentAdmin } from '@/api/supabase/admin/auth';
import { hasAccess } from '@/lib/adminRoleData';
import {
    getMasterPelanggaran,
    searchKelompokMembers,
    getRiwayatPelanggaranByPeserta,
    createRiwayatPelanggaran,
    deleteRiwayatPelanggaran
} from '@/api/supabase/admin/pelanggaran';
import RiwayatPelanggaranModal from '@/components/panitia/pj_tatib/RiwayatPelanggaranModal';
import ConfirmModal from '@/components/panitia/ConfirmModal';

export default function RiwayatPelanggaranTatibPage() {
    const router = useRouter();
    const [admin, setAdmin] = useState(null);
    const [masterList, setMasterList] = useState([]);

    // Search state with 1.5s debounce
    const [searchInput, setSearchInput] = useState('');
    const [isDebouncing, setIsDebouncing] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);

    // Selected peserta & their violations
    const [selectedPeserta, setSelectedPeserta] = useState(null);
    const [riwayatList, setRiwayatList] = useState([]);
    const [loadingRiwayat, setLoadingRiwayat] = useState(false);

    // Modals
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [deletingLoading, setDeletingLoading] = useState(false);

    // Toast notification
    const [toast, setToast] = useState(null);
    const debounceTimerRef = useRef(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    // Load initial admin auth & master pelanggaran list
    useEffect(() => {
        const init = async () => {
            try {
                const currentAdmin = await getCurrentAdmin();
                if (!currentAdmin) {
                    router.push('/panitia/login');
                    return;
                }

                if (!hasAccess(currentAdmin.role, '/panitia/pj_tatib/riwayat_pelanggaran')) {
                    router.push('/panitia/dashboard');
                    return;
                }

                setAdmin(currentAdmin);

                const masterRes = await getMasterPelanggaran();
                if (masterRes.success) {
                    setMasterList(masterRes.data || []);
                }
            } catch (err) {
                console.error('Init error:', err);
                router.push('/panitia/login');
            }
        };

        init();
    }, [router]);

    // Handle 1.5s debounce for nama peserta input
    useEffect(() => {
        if (!searchInput.trim()) {
            setSearchResults([]);
            setIsDebouncing(false);
            setIsSearching(false);
            setHasSearched(false);
            return;
        }

        setIsDebouncing(true);
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(async () => {
            setIsDebouncing(false);
            setIsSearching(true);
            try {
                const res = await searchKelompokMembers(searchInput);
                if (res.success) {
                    setSearchResults(res.data || []);
                } else {
                    showToast(res.error || 'Gagal mencari nama peserta', 'error');
                }
            } catch (err) {
                console.error('Search error:', err);
                showToast('Terjadi kesalahan pencarian peserta', 'error');
            } finally {
                setIsSearching(false);
                setHasSearched(true);
            }
        }, 1500); // Jeda 1.5 detik persis sesuai instruksi

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [searchInput]);

    // Fetch riwayat when a peserta is chosen
    const fetchRiwayatPeserta = useCallback(async (pesertaId) => {
        if (!pesertaId) return;
        setLoadingRiwayat(true);
        try {
            const res = await getRiwayatPelanggaranByPeserta(pesertaId);
            if (res.success) {
                setRiwayatList(res.data || []);
            } else {
                showToast(res.error || 'Gagal memuat riwayat pelanggaran', 'error');
            }
        } catch (err) {
            console.error('Fetch riwayat error:', err);
            showToast('Terjadi kesalahan memuat riwayat', 'error');
        } finally {
            setLoadingRiwayat(false);
        }
    }, []);

    const handleSelectPeserta = (peserta) => {
        setSelectedPeserta(peserta);
        setSearchResults([]);
        fetchRiwayatPeserta(peserta.id);
    };

    const handleResetPeserta = () => {
        setSelectedPeserta(null);
        setRiwayatList([]);
        setSearchInput('');
        setSearchResults([]);
        setHasSearched(false);
    };

    const handleSavePelanggaran = async (payload) => {
        const res = await createRiwayatPelanggaran(payload);
        if (!res.success) {
            throw new Error(res.error);
        }
        showToast('Pelanggaran berhasil dicatat');
        if (selectedPeserta) {
            await fetchRiwayatPeserta(selectedPeserta.id);
        }
    };

    const handlePromptDelete = (id) => {
        setDeletingId(id);
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingId) return;
        setDeletingLoading(true);
        try {
            const res = await deleteRiwayatPelanggaran(deletingId);
            if (res.success) {
                showToast('Catatan pelanggaran berhasil dihapus');
                if (selectedPeserta) {
                    await fetchRiwayatPeserta(selectedPeserta.id);
                }
            } else {
                showToast(res.error || 'Gagal menghapus pelanggaran', 'error');
            }
        } catch (err) {
            console.error('Delete error:', err);
            showToast('Terjadi kesalahan menghapus pelanggaran', 'error');
        } finally {
            setDeletingLoading(false);
            setIsConfirmOpen(false);
            setDeletingId(null);
        }
    };

    // Summary counts for selected peserta
    const counts = useMemo(() => {
        const total = riwayatList.length;
        const ringan = riwayatList.filter(r => r.master_pelanggaran?.jenis_pelanggaran === 'Ringan').length;
        const sedang = riwayatList.filter(r => r.master_pelanggaran?.jenis_pelanggaran === 'Sedang').length;
        const berat = riwayatList.filter(r => r.master_pelanggaran?.jenis_pelanggaran === 'Berat').length;
        return { total, ringan, sedang, berat };
    }, [riwayatList]);

    const getBadgeStyle = (jenis) => {
        if (jenis === 'Ringan') {
            return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/80';
        }
        if (jenis === 'Sedang') {
            return 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800/80';
        }
        return 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/80';
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return '-';
        try {
            const d = new Date(dateStr);
            return d.toLocaleString('id-ID', {
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
                <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-sm font-medium animate-in slide-in-from-bottom-5 duration-200 ${toast.type === 'error'
                    ? 'bg-rose-500 text-white border-rose-600'
                    : 'bg-emerald-600 text-white border-emerald-700'
                    }`}>
                    {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                    <span>{toast.message}</span>
                </div>
            )}

            {/* Header */}
            <div>
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-xl">
                        <ClipboardList size={22} />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        Riwayat Pelanggaran Peserta
                    </h1>
                </div>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Cari nama peserta untuk melihat rekam jejak dan mencatat pelanggaran tata tertib
                </p>
            </div>

            {/* Search Input Section */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                        <Search size={15} className="text-blue-500" />
                        Cari Nama Peserta (Jeda otomatis 1.5 detik saat mengetik)
                    </span>
                    {(isDebouncing || isSearching) && (
                        <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 animate-pulse flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                            {isDebouncing ? 'Menunggu selesai mengetik (1.5s)...' : 'Mengecek ke database...'}
                        </span>
                    )}
                </label>

                <div className="relative">
                    <input
                        type="text"
                        placeholder="Ketik nama atau NIM peserta..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-inner"
                    />
                </div>

                {/* Candidate Search Results List */}
                {!selectedPeserta && searchResults.length > 0 && (
                    <div className="pt-2">
                        <p className="text-xs font-semibold text-slate-400 mb-2">
                            Pilih peserta dari hasil pencarian:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
                            {searchResults.map((member) => (
                                <button
                                    key={member.id}
                                    type="button"
                                    onClick={() => handleSelectPeserta(member)}
                                    className="text-left p-3.5 rounded-2xl bg-slate-50 hover:bg-blue-50/70 dark:bg-slate-800/50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700/80 hover:border-blue-300 dark:hover:border-blue-800 transition-all group"
                                >
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {member.nama_anggota}
                                        </p>
                                        <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-500 transition-transform group-hover:translate-x-1" />
                                    </div>
                                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                        <span>NIM: <strong>{member.nim_anggota || '-'}</strong></span>
                                        <span>•</span>
                                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                                            {member.kelompok?.nama_kelompok ? `Kel. ${member.kelompok.urutan}` : 'Kelompok -'}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {!selectedPeserta && hasSearched && searchResults.length === 0 && !isDebouncing && !isSearching && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
                        <AlertCircle size={16} className="shrink-0" />
                        <span>Tidak ditemukan peserta dengan nama &quot;{searchInput}&quot;.</span>
                    </div>
                )}
            </div>

            {/* CONDITIONAL RENDERING: Render data only after selecting peserta */}
            {!selectedPeserta ? (
                /* Empty Prompt State */
                <div className="py-20 px-4 text-center rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="inline-flex p-5 rounded-3xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 mb-4 animate-bounce duration-1000">
                        <User size={40} />
                    </div>
                    <h3 className="font-black text-slate-800 dark:text-white text-lg sm:text-xl">
                        Pilih Peserta Terlebih Dahulu
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
                        Ketik nama peserta pada kolom pencarian di atas. Setelah jeda 1.5 detik, daftar peserta akan muncul dan riwayat pelanggaran akan ditampilkan setelah Anda memilih peserta.
                    </p>
                </div>
            ) : (
                /* Selected Peserta Dashboard & Table */
                <div className="space-y-6 animate-in fade-in duration-300">
                    {/* Peserta Profile Banner */}
                    <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-xl shadow-blue-500/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-black text-xl shrink-0">
                                {selectedPeserta.nama_anggota.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold backdrop-blur-md">
                                        {selectedPeserta.kelompok?.nama_kelompok ? `Kelompok ${selectedPeserta.kelompok.urutan}` : 'Peserta'}
                                    </span>
                                    {selectedPeserta.kelompok?.nama_kabim && (
                                        <span className="text-xs text-blue-100">
                                            Kabim: {selectedPeserta.kelompok.nama_kabim}
                                        </span>
                                    )}
                                </div>
                                <h2 className="text-xl sm:text-2xl font-black mt-1">
                                    {selectedPeserta.nama_anggota}
                                </h2>
                                <p className="text-xs text-blue-100">
                                    NIM: <strong>{selectedPeserta.nim_anggota || 'Tanpa NIM'}</strong>
                                    {selectedPeserta.kelompok?.nama_kelompok && ` • ${selectedPeserta.kelompok.nama_kelompok}`}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                            <button
                                onClick={handleResetPeserta}
                                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold backdrop-blur-md border border-white/20 transition-all"
                            >
                                <RotateCcw size={15} />
                                <span>Ganti Peserta</span>
                            </button>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-white text-blue-700 hover:bg-blue-50 active:bg-blue-100 text-xs font-black rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95"
                            >
                                <Plus size={16} />
                                <span>Tambah Pelanggaran</span>
                            </button>
                        </div>
                    </div>

                    {/* Stats for Selected Peserta */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Pelanggaran</span>
                            <p className="mt-1 text-2xl font-black text-slate-800 dark:text-white">
                                {loadingRiwayat ? '...' : counts.total}
                            </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tingkat Ringan</span>
                            <p className="mt-1 text-2xl font-black text-amber-600 dark:text-amber-400">
                                {loadingRiwayat ? '...' : counts.ringan}
                            </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tingkat Sedang</span>
                            <p className="mt-1 text-2xl font-black text-orange-600 dark:text-orange-400">
                                {loadingRiwayat ? '...' : counts.sedang}
                            </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tingkat Berat</span>
                            <p className="mt-1 text-2xl font-black text-rose-600 dark:text-rose-400">
                                {loadingRiwayat ? '...' : counts.berat}
                            </p>
                        </div>
                    </div>

                    {/* Table of Violations for this Peserta */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
                        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-white text-base">
                                    Daftar Catatan Pelanggaran
                                </h3>
                                <p className="text-xs text-slate-400">
                                    Riwayat sanksi yang pernah dicatat oleh tim tata tertib
                                </p>
                            </div>
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                                {riwayatList.length} Catatan
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/75 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                                        <th className="py-3.5 px-4 w-14 text-center">No</th>
                                        <th className="py-3.5 px-4">Nama Pelanggaran</th>
                                        <th className="py-3.5 px-4 w-40">Tingkat</th>
                                        <th className="py-3.5 px-4 w-48">Waktu Pelanggaran</th>
                                        <th className="py-3.5 px-4 w-24 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                                    {loadingRiwayat ? (
                                        Array.from({ length: 3 }).map((_, idx) => (
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
                                                <td className="py-4 px-4">
                                                    <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    <div className="h-6 w-8 bg-slate-200 dark:bg-slate-800 rounded mx-auto" />
                                                </td>
                                            </tr>
                                        ))
                                    ) : riwayatList.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-14 text-center">
                                                <div className="inline-flex p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mb-2">
                                                    <Sparkles size={28} />
                                                </div>
                                                <p className="font-bold text-slate-800 dark:text-slate-200 text-base">
                                                    Catatan Bersih!
                                                </p>
                                                <p className="text-xs text-slate-400 mt-1">
                                                    Peserta ini belum memiliki catatan pelanggaran tata tertib apapun.
                                                </p>
                                            </td>
                                        </tr>
                                    ) : (
                                        riwayatList.map((item, index) => {
                                            const jenis = item.master_pelanggaran?.jenis_pelanggaran || 'Ringan';
                                            return (
                                                <tr
                                                    key={item.id}
                                                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                                                >
                                                    <td className="py-4 px-4 text-center text-xs font-semibold text-slate-400">
                                                        {index + 1}
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <p className="font-bold text-slate-800 dark:text-slate-100">
                                                            {item.master_pelanggaran?.nama_pelanggaran || 'Pelanggaran'}
                                                        </p>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${getBadgeStyle(jenis)}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${jenis === 'Ringan' ? 'bg-amber-500' :
                                                                jenis === 'Sedang' ? 'bg-orange-500' : 'bg-rose-500'
                                                                }`} />
                                                            {jenis}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4 text-xs text-slate-500 dark:text-slate-400">
                                                        {formatDateTime(item.created_at)}
                                                    </td>
                                                    <td className="py-4 px-4 text-center">
                                                        <button
                                                            onClick={() => handlePromptDelete(item.id)}
                                                            title="Hapus / Cabut Pelanggaran"
                                                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Tambah Pelanggaran */}
            <RiwayatPelanggaranModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSavePelanggaran}
                selectedPeserta={selectedPeserta}
                pelanggaranMasterList={masterList}
            />

            {/* Confirm Modal for Delete */}
            <ConfirmModal
                open={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                loading={deletingLoading}
                title="Hapus Catatan Pelanggaran"
                message="Apakah Anda yakin ingin menghapus catatan pelanggaran ini dari rekam jejak peserta?"
                confirmLabel="Ya, Hapus"
                cancelLabel="Batal"
            />
        </div>
    );
}
