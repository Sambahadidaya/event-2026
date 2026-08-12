'use client';

import { useState, useEffect } from 'react';
import { getAdminStatusPengembangan, updateStatusPengembangan } from '@/api/supabase/admin/pengembang';
import { Wrench, Lock, Unlock, RefreshCw, AlertCircle, Terminal, CheckCircle2, Shield } from 'lucide-react';

export default function PengembangAdminPage() {
    const [statusData, setStatusData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const fetchStatus = async () => {
        setLoading(true);
        const res = await getAdminStatusPengembangan();
        if (res.success) {
            setStatusData(res.data);
        } else {
            showMessage(res.error || 'Gagal memuat status pengembangan', 'error');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    const showMessage = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 5000);
    };

    const handleToggleKunci = async () => {
        if (!statusData) return;
        setActionLoading(true);
        const newKunci = !statusData.kunci;
        const res = await updateStatusPengembangan(statusData.id, newKunci);
        if (res.success) {
            setStatusData({ ...statusData, kunci: newKunci });
            showMessage(
                `Kunci pengembangan berhasil ${newKunci ? 'diaktifkan (terkunci)' : 'dinonaktifkan (terbuka)'}!`,
                'success'
            );
        } else {
            showMessage(res.error || 'Gagal memperbarui status', 'error');
        }
        setActionLoading(false);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium animate-pulse">Memuat data pengembangan...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Title / Action bar */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Wrench size={22} className="text-violet-600 dark:text-violet-400 animate-spin-slow" />
                        Mode Pengembangan (Barrier)
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Kunci atau buka halaman ketentuan publik saat pemeliharaan data/sistem.
                    </p>
                </div>
                <button
                    onClick={fetchStatus}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-all active:scale-95"
                    title="Segarkan data"
                >
                    <RefreshCw size={18} />
                </button>
            </div>

            {/* Toast Message */}
            {message && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 border animate-in slide-in-from-top-4 duration-300 shadow-md ${message.type === 'error'
                        ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900/50 text-red-700 dark:text-red-400'
                        : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400'
                    }`}>
                    <AlertCircle size={20} className="shrink-0" />
                    <p className="text-sm font-semibold">{message.text}</p>
                </div>
            )}

            {/* Dashboard Content */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Control Panel Card */}
                <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden flex flex-col justify-between p-6 sm:p-8">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border ${statusData?.kunci
                                    ? 'bg-amber-50 text-amber-700 border-amber-200/50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                                }`}>
                                {statusData?.kunci ? (
                                    <>
                                        <Lock size={12} />
                                        Website Dikunci (Mode Pengembangan)
                                    </>
                                ) : (
                                    <>
                                        <Unlock size={12} />
                                        Website Terbuka (Normal)
                                    </>
                                )}
                            </span>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                                {statusData?.kunci ? 'Mode Pengembangan Sedang Aktif' : 'Website Terbuka Untuk Publik'}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                {statusData?.kunci
                                    ? 'Seluruh pengunjung biasa yang mencoba mengakses halaman ketentuan publik akan langsung diarahkan ke layar pemeliharaan bernuansa hitam-putih formal. Ini berguna ketika panitia sedang melakukan sinkronisasi data.'
                                    : 'Pengunjung dapat mengakses halaman Ketentuan PKKMB dan POSE dengan normal seperti biasa.'}
                            </p>
                        </div>
                    </div>

                    {/* Interactive Switch */}
                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div>
                            <span className="block text-sm font-bold text-slate-800 dark:text-white">Toggle Status Kunci</span>
                            <span className="block text-xs text-slate-400 dark:text-slate-500">Klik sakelar di sebelah kanan untuk mengubah status kunci</span>
                        </div>

                        <button
                            onClick={handleToggleKunci}
                            disabled={actionLoading}
                            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 ${statusData?.kunci ? 'bg-violet-600' : 'bg-slate-200 dark:bg-slate-700'
                                } ${actionLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <span
                                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${statusData?.kunci ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                            />
                        </button>
                    </div>
                </div>

                {/* Sidebar Info Card */}
                <div className="bg-slate-100/50 dark:bg-slate-900/30 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 p-6 space-y-6 flex flex-col justify-between">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Shield size={14} className="text-violet-500" />
                                Cakupan Proteksi
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Barrier ini akan memproteksi rute halaman berikut:
                            </p>
                        </div>

                        <ul className="space-y-2.5">
                            <li className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-800/60">
                                <Terminal size={14} className="text-slate-400 shrink-0" />
                                <span className="truncate">/pkkmb/kelompok</span>
                            </li>
                            <li className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-800/60">
                                <Terminal size={14} className="text-slate-400 shrink-0" />
                                <span className="truncate">/pkkmb/jadwal</span>
                            </li>
                            <li className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-800/60">
                                <Terminal size={14} className="text-slate-400 shrink-0" />
                                <span className="truncate">/pkkmb/materi</span>
                            </li>
                            <li className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-800/60">
                                <Terminal size={14} className="text-slate-400 shrink-0" />
                                <span className="truncate">/pkkmb/ketentuan</span>
                            </li>
                            <li className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-800/60">
                                <Terminal size={14} className="text-slate-400 shrink-0" />
                                <span className="truncate">/pose/team</span>
                            </li>
                            <li className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-800/60">
                                <Terminal size={14} className="text-slate-400 shrink-0" />
                                <span className="truncate">/pose/jadwal</span>
                            </li>
                            <li className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-800/60">
                                <Terminal size={14} className="text-slate-400 shrink-0" />
                                <span className="truncate">/pose/ketentuan</span>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/35 dark:border-amber-900/30 rounded-2xl p-4 text-xs text-amber-800 dark:text-amber-400 leading-normal flex gap-2">
                        <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-500" />
                        <div>
                            <span className="font-bold block mb-0.5">Saran Pemakaian</span>
                            Disarankan untuk mengaktifkan kunci ini hanya selama pemeliharaan terjadwal agar kenyamanan pengunjung tetap terjaga.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
