'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    ShieldAlert,
    Search,
    AlertCircle,
    CheckCircle2,
    Users,
    UserX,
    Filter,
    Clock,
    Sparkles,
    Shield
} from 'lucide-react';
import { getCurrentAdmin } from '@/api/supabase/admin/auth';
import { hasAccess, getKabimFilter } from '@/lib/adminRoleData';
import { getRiwayatPelanggaranForKabim } from '@/api/supabase/admin/pelanggaran';

export default function RiwayatPelanggaranKabimPage() {
    const router = useRouter();
    const [admin, setAdmin] = useState(null);
    const [lockedKabimUrutan, setLockedKabimUrutan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [riwayatList, setRiwayatList] = useState([]);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedJenis, setSelectedJenis] = useState('all');
    const [selectedKelompok, setSelectedKelompok] = useState('all');

    // Toast
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchRiwayat = useCallback(async (urutanFilter) => {
        setLoading(true);
        try {
            const res = await getRiwayatPelanggaranForKabim(urutanFilter);
            if (res.success) {
                setRiwayatList(res.data || []);
            } else {
                showToast(res.error || 'Gagal mengambil riwayat pelanggaran', 'error');
            }
        } catch (err) {
            console.error('Error fetching kabim riwayat:', err);
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

                if (!hasAccess(currentAdmin.role, '/panitia/pj_kabim/riwayat_pelanggaran')) {
                    router.push('/panitia/dashboard');
                    return;
                }

                setAdmin(currentAdmin);
                const filter = getKabimFilter(currentAdmin.role);
                setLockedKabimUrutan(filter);

                await fetchRiwayat(filter);
            } catch (err) {
                console.error('Init kabim page error:', err);
                router.push('/panitia/login');
            }
        };

        init();
    }, [router, fetchRiwayat]);

    // Distinct list of kelompok available in the data
    const availableKelompok = useMemo(() => {
        const map = new Map();
        riwayatList.forEach(item => {
            const kel = item.kelompok_members?.kelompok;
            if (kel && kel.urutan !== undefined) {
                map.set(Number(kel.urutan), kel.nama_kelompok || `Kelompok ${kel.urutan}`);
            }
        });
        return Array.from(map.entries())
            .map(([urutan, nama]) => ({ urutan, nama }))
            .sort((a, b) => a.urutan - b.urutan);
    }, [riwayatList]);

    // Statistics counts
    const stats = useMemo(() => {
        const total = riwayatList.length;
        const uniquePeserta = new Set(riwayatList.map(r => r.peserta_id)).size;
        const ringan = riwayatList.filter(r => r.master_pelanggaran?.jenis_pelanggaran === 'Ringan').length;
        const sedang = riwayatList.filter(r => r.master_pelanggaran?.jenis_pelanggaran === 'Sedang').length;
        const berat = riwayatList.filter(r => r.master_pelanggaran?.jenis_pelanggaran === 'Berat').length;
        return { total, uniquePeserta, ringan, sedang, berat };
    }, [riwayatList]);

    // Filtered list
    const filteredList = useMemo(() => {
        return riwayatList.filter(item => {
            const member = item.kelompok_members;
            const pelanggaran = item.master_pelanggaran;
            const q = searchQuery.toLowerCase();

            const matchSearch =
                (member?.nama_anggota || '').toLowerCase().includes(q) ||
                (member?.nim_anggota || '').toLowerCase().includes(q) ||
                (pelanggaran?.nama_pelanggaran || '').toLowerCase().includes(q);

            const matchJenis =
                selectedJenis === 'all' ||
                pelanggaran?.jenis_pelanggaran === selectedJenis;

            const matchKelompok =
                selectedKelompok === 'all' ||
                String(member?.kelompok?.urutan) === String(selectedKelompok);

            return matchSearch && matchJenis && matchKelompok;
        });
    }, [riwayatList, searchQuery, selectedJenis, selectedKelompok]);

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
            <div>
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl">
                        <ShieldAlert size={22} />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        Riwayat Pelanggaran Kelompok
                    </h1>
                </div>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Pantau rekam jejak tata tertib dan sanksi peserta kelompok bimbingan Anda
                    {lockedKabimUrutan && lockedKabimUrutan.length > 0 && (
                        <span className="font-semibold text-blue-600 dark:text-blue-400 ml-1">
                            (Kelompok {lockedKabimUrutan.join(', ')})
                        </span>
                    )}
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
                        <span>Total Pelanggaran</span>
                        <ShieldAlert size={16} className="text-blue-500" />
                    </div>
                    <p className="mt-2 text-2xl font-black text-slate-800 dark:text-white">
                        {loading ? '...' : stats.total}
                    </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
                        <span>Peserta Melanggar</span>
                        <UserX size={16} className="text-rose-500" />
                    </div>
                    <p className="mt-2 text-2xl font-black text-slate-800 dark:text-white">
                        {loading ? '...' : stats.uniquePeserta}
                    </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
                        <span>Tingkat Ringan</span>
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    </div>
                    <p className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400">
                        {loading ? '...' : stats.ringan}
                    </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
                        <span>Tingkat Sedang</span>
                        <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
                    </div>
                    <p className="mt-2 text-2xl font-black text-orange-600 dark:text-orange-400">
                        {loading ? '...' : stats.sedang}
                    </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm col-span-2 lg:col-span-1">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
                        <span>Tingkat Berat</span>
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    </div>
                    <p className="mt-2 text-2xl font-black text-rose-600 dark:text-rose-400">
                        {loading ? '...' : stats.berat}
                    </p>
                </div>
            </div>

            {/* Filter and Search Section */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
                <div className="relative w-full md:w-80">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari nama, NIM, atau jenis pelanggaran..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    {/* Filter Kelompok (if multiple kelompok available) */}
                    {availableKelompok.length > 1 && (
                        <select
                            value={selectedKelompok}
                            onChange={(e) => setSelectedKelompok(e.target.value)}
                            className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                            <option value="all">Semua Kelompok</option>
                            {availableKelompok.map((k) => (
                                <option key={k.urutan} value={String(k.urutan)}>
                                    Kelompok {k.urutan}
                                </option>
                            ))}
                        </select>
                    )}

                    {/* Filter Tingkat Sanksi */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                        {['all', 'Ringan', 'Sedang', 'Berat'].map((jenis) => (
                            <button
                                key={jenis}
                                onClick={() => setSelectedJenis(jenis)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                                    selectedJenis === jenis
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                            >
                                {jenis === 'all' ? 'Semua' : jenis}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="bg-slate-50/75 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                                <th className="py-3.5 px-4 w-12 text-center">No</th>
                                <th className="py-3.5 px-4 w-32">Kelompok</th>
                                <th className="py-3.5 px-4 w-36">NIM</th>
                                <th className="py-3.5 px-4">Nama Peserta</th>
                                <th className="py-3.5 px-4">Nama Pelanggaran</th>
                                <th className="py-3.5 px-4 w-36">Tingkat</th>
                                <th className="py-3.5 px-4 w-44">Waktu</th>
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
                                            <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" />
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                                        </td>
                                    </tr>
                                ))
                            ) : filteredList.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-16 text-center">
                                        <div className="inline-flex p-4 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mb-3">
                                            <Sparkles size={36} />
                                        </div>
                                        <p className="font-bold text-slate-800 dark:text-slate-200 text-base">
                                            Tidak Ada Catatan Pelanggaran
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                                            {searchQuery || selectedJenis !== 'all' || selectedKelompok !== 'all'
                                                ? 'Tidak ditemukan riwayat pelanggaran yang sesuai dengan filter pencarian.'
                                                : 'Seluruh peserta kelompok binaan Anda memiliki rekam jejak tata tertib yang bersih.'}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredList.map((item, index) => {
                                    const member = item.kelompok_members;
                                    const pelanggaran = item.master_pelanggaran;
                                    const jenis = pelanggaran?.jenis_pelanggaran || 'Ringan';
                                    const kelompok = member?.kelompok;

                                    return (
                                        <tr
                                            key={item.id}
                                            className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                                        >
                                            <td className="py-4 px-4 text-center text-xs font-semibold text-slate-400">
                                                {index + 1}
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                                    {kelompok?.urutan ? `Kel. ${kelompok.urutan}` : '-'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                                                {member?.nim_anggota || '-'}
                                            </td>
                                            <td className="py-4 px-4">
                                                <p className="font-bold text-slate-800 dark:text-slate-100">
                                                    {member?.nama_anggota || '-'}
                                                </p>
                                            </td>
                                            <td className="py-4 px-4">
                                                <p className="font-medium text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
                                                    {pelanggaran?.nama_pelanggaran || '-'}
                                                </p>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${getBadgeStyle(jenis)}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                                        jenis === 'Ringan' ? 'bg-amber-500' :
                                                        jenis === 'Sedang' ? 'bg-orange-500' : 'bg-rose-500'
                                                    }`} />
                                                    {jenis}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                                {formatDateTime(item.created_at)}
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
    );
}
