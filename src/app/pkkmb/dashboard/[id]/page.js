'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import {
    Users, Crown, GraduationCap, FileText, CheckCircle2,
    LogOut, ArrowLeft, AlertCircle, RefreshCw,
    ExternalLink, ShieldCheck, CalendarCheck, ShieldAlert,
    HeartPulse, XCircle, Info, Clock, AlertTriangle
} from 'lucide-react';
import {
    getKelompokMemberByIdPublic,
    getAbsensiByMemberIdPublic,
    getPelanggaranByMemberIdPublic
} from '@/api/supabase/public/kelompok';
import { getTugasByNim } from '@/api/supabase/public/materi';

export default function PkkmbMemberDashboardPage({ params }) {
    const unwrappedParams = use(params);
    const memberId = unwrappedParams.id;
    const router = useRouter();

    const [memberData, setMemberData] = useState(null);
    const [tugasList, setTugasList] = useState([]);
    const [absensiList, setAbsensiList] = useState([]);
    const [pelanggaranList, setPelanggaranList] = useState([]);
    const [activeTab, setActiveTab] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchData = async () => {
        if (!memberId) {
            setError('ID Anggota tidak valid.');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError('');

        try {
            const member = await getKelompokMemberByIdPublic(memberId);

            if (!member || !member.id) {
                setError('Data anggota tidak ditemukan atau ID unik salah.');
                setLoading(false);
                return;
            }

            setMemberData(member);
            // Simpan ID yang terverifikasi ke localStorage
            localStorage.setItem('pkkmb_member_id', member.id);

            // Fetch tugas, absensi, dan pelanggaran peserta secara paralel
            const fetchPromises = [
                getAbsensiByMemberIdPublic(member.id),
                getPelanggaranByMemberIdPublic(member.id)
            ];

            if (member.nim_anggota) {
                fetchPromises.push(getTugasByNim(member.nim_anggota));
            }

            const results = await Promise.all(fetchPromises);
            setAbsensiList(results[0] || []);
            setPelanggaranList(results[1] || []);

            if (member.nim_anggota && results[2]) {
                setTugasList(results[2] || []);
            } else {
                setTugasList([]);
            }
        } catch (err) {
            console.error('Error loading member dashboard:', err);
            setError(err.message || 'Terjadi kesalahan saat memuat data dashboard.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [memberId]);

    const handleLogout = () => {
        // Hapus token/id dari localStorage dan kembalikan ke halaman login dashboard
        localStorage.removeItem('pkkmb_member_id');
        router.push('/pkkmb/dashboard');
    };

    const getInitials = (name = '') => {
        const parts = name.trim().split(' ').filter(Boolean);
        if (parts.length === 0) return 'PK';
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[1][0]).toUpperCase();
    };

    const formatDate = (isoString) => {
        if (!isoString) return '-';
        try {
            const d = new Date(isoString);
            return d.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return isoString;
        }
    };

    const getAbsensiBadge = (jenis = '') => {
        const j = (jenis || '').toLowerCase().trim();
        if (j === 'hadir') {
            return {
                bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
                icon: CheckCircle2,
                label: 'Hadir'
            };
        }
        if (j === 'izin') {
            return {
                bg: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800',
                icon: Info,
                label: 'Izin'
            };
        }
        if (j === 'sakit') {
            return {
                bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
                icon: HeartPulse,
                label: 'Sakit'
            };
        }
        if (j === 'alfa') {
            return {
                bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800',
                icon: XCircle,
                label: 'Alfa'
            };
        }
        return {
            bg: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
            icon: Clock,
            label: jenis || 'Tercatat'
        };
    };

    const getPelanggaranBadge = (jenis = '') => {
        const j = (jenis || '').toLowerCase().trim();
        if (j === 'berat') {
            return {
                bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800',
                label: 'Pelanggaran Berat'
            };
        }
        if (j === 'sedang') {
            return {
                bg: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800',
                label: 'Pelanggaran Sedang'
            };
        }
        return {
            bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
            label: 'Pelanggaran Ringan'
        };
    };

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 mb-4 animate-spin">
                    <RefreshCw size={24} />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Memuat Dashboard Peserta...</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Mengambil data kelompok, tugas, absensi, dan tata tertib</p>
            </div>
        );
    }

    if (error || !memberData) {
        return (
            <div className="max-w-xl mx-auto px-4 sm:px-6 py-16">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center shadow-sm">
                    <div className="w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4">
                        <AlertCircle size={28} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Akses Dashboard Gagal</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-6">
                        {error || 'Data peserta tidak dapat ditemukan.'}
                    </p>
                    <button
                        onClick={handleLogout}
                        className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white font-semibold text-xs inline-flex items-center gap-2 transition-all cursor-pointer"
                    >
                        <ArrowLeft size={15} /> Kembali ke Halaman Verifikasi
                    </button>
                </div>
            </div>
        );
    }

    const kelompok = memberData.kelompok || {};
    const totalTugasTerkumpul = tugasList.length;

    // Statistik Absensi
    const totalAbsensi = absensiList.length;
    const totalHadir = absensiList.filter(a => (a.jenis_absensi || '').toLowerCase() === 'hadir').length;
    const totalIzin = absensiList.filter(a => (a.jenis_absensi || '').toLowerCase() === 'izin').length;
    const totalSakit = absensiList.filter(a => (a.jenis_absensi || '').toLowerCase() === 'sakit').length;
    const totalAlfa = absensiList.filter(a => (a.jenis_absensi || '').toLowerCase() === 'alfa').length;

    // Statistik Pelanggaran
    const totalPelanggaran = pelanggaranList.length;
    const totalRingan = pelanggaranList.filter(p => (p.master_pelanggaran?.jenis_pelanggaran || '').toLowerCase() === 'ringan').length;
    const totalSedang = pelanggaranList.filter(p => (p.master_pelanggaran?.jenis_pelanggaran || '').toLowerCase() === 'sedang').length;
    const totalBerat = pelanggaranList.filter(p => (p.master_pelanggaran?.jenis_pelanggaran || '').toLowerCase() === 'berat').length;

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-10 space-y-6 animate-in fade-in duration-200">
            {/* Header Navigation Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center shrink-0">
                        <GraduationCap size={20} className="text-blue-400" />
                    </div>
                    <div>
                        <h1 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white leading-tight">
                            Portal Peserta PKKMB 2026
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            ID: <span className="font-mono text-slate-700 dark:text-slate-300">{memberData.id}</span>
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Keluar dari sesi dashboard"
                >
                    <LogOut size={14} className="text-rose-500" />
                    <span>Keluar (Logout)</span>
                </button>
            </div>

            {/* Profil Peserta & Kelompok Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 1. Kartu Profil Peserta */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold">
                                Peserta PKKMB
                            </span>
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                <ShieldCheck size={14} /> Terverifikasi
                            </span>
                        </div>

                        <div className="flex items-center gap-3.5 mb-5">
                            <div className="w-13 h-13 rounded-xl bg-blue-600 text-white text-lg font-bold flex items-center justify-center shrink-0">
                                {getInitials(memberData.nama_anggota)}
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-base font-bold text-slate-900 dark:text-white truncate">
                                    {memberData.nama_anggota}
                                </h2>
                                <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                                    NIM: {memberData.nim_anggota || '-'}
                                </p>
                            </div>
                        </div>

                        {/* Statistik Ringkas */}
                        <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                                <span className="flex items-center gap-1.5">
                                    <FileText size={13} className="text-blue-500" />
                                    Tugas Terkumpul
                                </span>
                                <span className="font-bold text-slate-900 dark:text-white">
                                    {totalTugasTerkumpul} Sesi
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                                <span className="flex items-center gap-1.5">
                                    <CalendarCheck size={13} className="text-emerald-500" />
                                    Kehadiran
                                </span>
                                <span className="font-bold text-slate-900 dark:text-white">
                                    {totalHadir} / {totalAbsensi} Hadir
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                                <span className="flex items-center gap-1.5">
                                    <ShieldAlert size={13} className={totalPelanggaran > 0 ? 'text-rose-500' : 'text-emerald-500'} />
                                    Catatan Pelanggaran
                                </span>
                                <span className={`font-bold ${totalPelanggaran > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                    {totalPelanggaran === 0 ? '0 (Bersih)' : `${totalPelanggaran} Catatan`}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
                        <p className="text-[11px] text-slate-400">
                            Terdaftar resmi di database PKKMB
                        </p>
                    </div>
                </div>

                {/* 2. Kartu Kelompok & Kabim */}
                <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Users size={14} className="text-slate-600 dark:text-slate-400" />
                                Informasi Kelompok
                            </span>
                            {kelompok.urutan && (
                                <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
                                    Kelompok #{kelompok.urutan}
                                </span>
                            )}
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-5">
                            {kelompok.foto_kelompok ? (
                                <img
                                    src={kelompok.foto_kelompok}
                                    alt={kelompok.nama_kelompok || 'Kelompok'}
                                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                                />
                            ) : (
                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-slate-800 text-white font-bold text-xl flex items-center justify-center shrink-0">
                                    {getInitials(kelompok.nama_kelompok || 'Kelompok')}
                                </div>
                            )}

                            <div className="space-y-1.5 flex-1 min-w-0">
                                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                                    {kelompok.nama_kelompok || 'Belum Ditentukan'}
                                </h3>

                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold">
                                    <Crown size={13} className="text-amber-500 shrink-0" />
                                    <span>Kabim: {kelompok.nama_kabim || '-'}</span>
                                </div>

                                {kelompok.keterangan && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                                        {kelompok.keterangan}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                        {kelompok.link_instagram ? (
                            <a
                                href={kelompok.link_instagram}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>
                                <span>Instagram Kelompok</span>
                                <ExternalLink size={12} className="text-slate-400" />
                            </a>
                        ) : (
                            <span className="text-xs text-slate-400">Instagram kelompok belum dicantumkan</span>
                        )}

                        <button
                            onClick={() => router.push('/pkkmb/kelompok')}
                            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                            <span>Daftar Anggota Kelompok</span>
                            <ArrowLeft size={12} className="rotate-180" />
                        </button>
                    </div>
                </div>
            </div>

            {/* TAB FILTER REKAPITULASI */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                <button
                    onClick={() => setActiveTab('all')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${activeTab === 'all'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                        }`}
                >
                    Semua Rekap
                </button>

                <button
                    onClick={() => setActiveTab('tugas')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap inline-flex items-center gap-1.5 cursor-pointer ${activeTab === 'tugas'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                        }`}
                >
                    <FileText size={13} />
                    <span>Tugas</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {totalTugasTerkumpul}
                    </span>
                </button>

                <button
                    onClick={() => setActiveTab('absensi')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap inline-flex items-center gap-1.5 cursor-pointer ${activeTab === 'absensi'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                        }`}
                >
                    <CalendarCheck size={13} />
                    <span>Kehadiran</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {totalAbsensi}
                    </span>
                </button>

                <button
                    onClick={() => setActiveTab('pelanggaran')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap inline-flex items-center gap-1.5 cursor-pointer ${activeTab === 'pelanggaran'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                        }`}
                >
                    <ShieldAlert size={13} />
                    <span>Pelanggaran</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${totalPelanggaran > 0 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-bold' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                        {totalPelanggaran}
                    </span>
                </button>
            </div>

            {/* 1. REKAPITULASI PENGUMPULAN TUGAS */}
            {(activeTab === 'all' || activeTab === 'tugas') && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
                        <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <FileText size={18} className="text-blue-600 dark:text-blue-400" />
                                Rekapitulasi Pengumpulan Tugas PKKMB
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Daftar tugas materi PKKMB yang telah Anda kumpulkan melalui portal resmi.
                            </p>
                        </div>

                        <span className="px-3 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                            {totalTugasTerkumpul} Tugas Terkumpul
                        </span>
                    </div>

                    {/* Grid List Tugas */}
                    {tugasList.length === 0 ? (
                        <div className="p-8 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800 text-center">
                            <FileText size={28} className="mx-auto mb-2 text-slate-400" />
                            <h4 className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                                Belum Ada Tugas yang Dikumpulkan
                            </h4>
                            <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                                Anda belum mengunggah tugas untuk sesi materi PKKMB yang tersedia.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            {tugasList.map((tugas, idx) => {
                                const judulMateri = tugas.materi_pkkmb?.judul || 'Materi PKKMB';
                                const pemateri = tugas.materi_pkkmb?.pemateri || '-';
                                const fileList = (tugas.file_tugas || '').split(',').filter(Boolean);

                                return (
                                    <div
                                        key={tugas.id || idx}
                                        className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between space-y-3"
                                    >
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                                    <CheckCircle2 size={13} /> Selesai Dikumpulkan
                                                </span>
                                                <span className="text-[11px] text-slate-400">
                                                    {formatDate(tugas.created_at)}
                                                </span>
                                            </div>

                                            <h4 className="font-semibold text-sm text-slate-900 dark:text-white leading-snug">
                                                {judulMateri}
                                            </h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                Pemateri: <span className="text-slate-700 dark:text-slate-300 font-medium">{pemateri}</span>
                                            </p>
                                        </div>

                                        {/* File Lampiran */}
                                        <div className="pt-2.5 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                                            <span>{fileList.length} Berkas Diunggah</span>
                                            {fileList.length > 0 && (
                                                <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                                                    Tersimpan di Cloud
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* 2. REKAPITULASI KEHADIRAN / ABSENSI */}
            {(activeTab === 'all' || activeTab === 'absensi') && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
                        <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <CalendarCheck size={18} className="text-emerald-600 dark:text-emerald-400" />
                                Rekapitulasi Kehadiran & Absensi
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Catatan kehadiran resmi pada rangkaian kegiatan dan sesi materi PKKMB 2026.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                Hadir: {totalHadir}
                            </span>
                            {totalIzin > 0 && (
                                <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
                                    Izin: {totalIzin}
                                </span>
                            )}
                            {totalSakit > 0 && (
                                <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                    Sakit: {totalSakit}
                                </span>
                            )}
                            {totalAlfa > 0 && (
                                <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                                    Alfa: {totalAlfa}
                                </span>
                            )}
                            <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                Total: {totalAbsensi} Sesi
                            </span>
                        </div>
                    </div>

                    {/* Grid List Absensi */}
                    {absensiList.length === 0 ? (
                        <div className="p-8 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800 text-center">
                            <CalendarCheck size={28} className="mx-auto mb-2 text-slate-400" />
                            <h4 className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                                Belum Ada Catatan Kehadiran
                            </h4>
                            <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                                Presensi kehadiran Anda akan otomatis tampil di sini setelah panitia melakukan pencatatan absensi sesi acara.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            {absensiList.map((item, idx) => {
                                const badge = getAbsensiBadge(item.jenis_absensi);
                                const BadgeIcon = badge.icon;
                                const judulAcara = item.jadwal_acara_pkkmb?.judul || 'Sesi Acara PKKMB';

                                return (
                                    <div
                                        key={item.id || idx}
                                        className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between space-y-3"
                                    >
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${badge.bg}`}>
                                                    <BadgeIcon size={13} />
                                                    {badge.label}
                                                </span>
                                                <span className="text-[11px] text-slate-400">
                                                    {formatDate(item.created_at)}
                                                </span>
                                            </div>

                                            <h4 className="font-semibold text-sm text-slate-900 dark:text-white leading-snug">
                                                {judulAcara}
                                            </h4>

                                            {item.keterangan ? (
                                                <p className="text-xs text-slate-600 dark:text-slate-400 bg-white/60 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                                                    <span className="font-medium text-slate-700 dark:text-slate-300">Catatan: </span>
                                                    {item.keterangan}
                                                </p>
                                            ) : (
                                                <p className="text-[11px] text-slate-400 italic">
                                                    Tidak ada keterangan khusus
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* 3. REKAPITULASI PELANGGARAN & TATA TERTIB */}
            {(activeTab === 'all' || activeTab === 'pelanggaran') && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
                        <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <ShieldAlert size={18} className="text-amber-500" />
                                Rekapitulasi Catatan Tata Tertib & Pelanggaran
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Catatan kepatuhan dan kedisiplinan terhadap tata tertib peserta selama PKKMB 2026.
                            </p>
                        </div>

                        {totalPelanggaran > 0 ? (
                            <div className="flex flex-wrap items-center gap-2">
                                {totalRingan > 0 && (
                                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                        Ringan: {totalRingan}
                                    </span>
                                )}
                                {totalSedang > 0 && (
                                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
                                        Sedang: {totalSedang}
                                    </span>
                                )}
                                {totalBerat > 0 && (
                                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                                        Berat: {totalBerat}
                                    </span>
                                )}
                                <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                    Total: {totalPelanggaran} Catatan
                                </span>
                            </div>
                        ) : (
                            <span className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-1.5">
                                <ShieldCheck size={14} /> 0 Catatan Pelanggaran
                            </span>
                        )}
                    </div>

                    {/* Konten Pelanggaran */}
                    {pelanggaranList.length === 0 ? (
                        <div className="p-8 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40 text-center">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-xs">
                                <ShieldCheck size={26} />
                            </div>
                            <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
                                Bebas dari Catatan Pelanggaran
                            </h4>
                            <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80 mt-1.5 max-w-md mx-auto leading-relaxed">
                                Luar biasa! Anda tidak memiliki catatan pelanggaran tata tertib. Tetap pertahankan kedisiplinan dan integritas hingga seluruh rangkaian PKKMB 2026 berakhir.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            {pelanggaranList.map((item, idx) => {
                                const namaPelanggaran = item.master_pelanggaran?.nama_pelanggaran || 'Pelanggaran Tata Tertib';
                                const jenisPelanggaran = item.master_pelanggaran?.jenis_pelanggaran || 'Ringan';
                                const badge = getPelanggaranBadge(jenisPelanggaran);

                                return (
                                    <div
                                        key={item.id || idx}
                                        className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between space-y-3"
                                    >
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${badge.bg}`}>
                                                    <AlertTriangle size={13} />
                                                    {badge.label}
                                                </span>
                                                <span className="text-[11px] text-slate-400">
                                                    {formatDate(item.created_at)}
                                                </span>
                                            </div>

                                            <h4 className="font-semibold text-sm text-slate-900 dark:text-white leading-snug">
                                                {namaPelanggaran}
                                            </h4>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
