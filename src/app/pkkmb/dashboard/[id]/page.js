'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import {
    Users, Crown, GraduationCap, FileText, CheckCircle2,
    LogOut, ArrowLeft, AlertCircle, RefreshCw,
    ExternalLink, ShieldCheck
} from 'lucide-react';
import { getKelompokMemberByIdPublic } from '@/api/supabase/public/kelompok';
import { getTugasByNim, getMateri } from '@/api/supabase/public/materi';

export default function PkkmbMemberDashboardPage({ params }) {
    const unwrappedParams = use(params);
    const memberId = unwrappedParams.id;
    const router = useRouter();

    const [memberData, setMemberData] = useState(null);
    const [tugasList, setTugasList] = useState([]);
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

            // Ambil data tugas jika memiliki NIM
            if (member.nim_anggota) {
                const submittedTugas = await getTugasByNim(member.nim_anggota);
                setTugasList(submittedTugas || []);
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

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 mb-4 animate-spin">
                    <RefreshCw size={24} />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Memuat Dashboard Peserta...</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Mengambil data kelompok dan pengumpulan tugas</p>
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

                        <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                                <span>Tugas Terkumpul</span>
                                <span className="font-bold text-slate-900 dark:text-white">
                                    {totalTugasTerkumpul} Sesi
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

            {/* 3. REKAPITULASI PENGUMPULAN TUGAS */}
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
        </div>
    );
}
