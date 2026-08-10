'use client';

import { useState } from 'react';
import { Search, Trophy, Calendar, UserCheck, AlertCircle, CheckCircle, FileText, Star, MessageSquare } from 'lucide-react';
import PageHero from '@/components/public/PageHero';
import ScheduleBarrier from '@/components/public/ScheduleBarrier';
import { getNilaiByKodeForm } from '@/api/supabase/public/penilaian';

export default function CekNilaiPage() {
    const [kodeForm, setKodeForm] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [result, setResult] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);

    const handleVerify = async (e) => {
        e.preventDefault();
        if (!kodeForm.trim()) return;

        setVerifying(true);
        setErrorMsg(null);
        setResult(null);

        const res = await getNilaiByKodeForm(kodeForm.trim());
        setVerifying(false);

        if (res.success) {
            setResult(res);
            if (res.nilaiList.length === 0) {
                setErrorMsg('Tim Anda terdaftar, namun belum ada penilaian juri yang dirilis.');
            }
        } else {
            setErrorMsg(res.error || 'Terjadi kesalahan saat memverifikasi kode.');
        }
    };

    return (
        <ScheduleBarrier pageType="jadwal">
            <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12 animate-in fade-in duration-500 space-y-8 pb-20">
                <PageHero
                    site="pose"
                    icon={Trophy}
                    title="Cek Nilai Penilaian Juri"
                    subtitle="Masukkan Kode Form Tim Anda untuk melihat hasil penilaian, kritik, dan saran dari juri."
                />

                {/* Form Verifikasi */}
                <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
                    <form onSubmit={handleVerify} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                                Kode Form Tim
                            </label>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                        <Search size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Masukkan Kode Form Anda (contoh: POSE-XXXXXX)"
                                        value={kodeForm}
                                        onChange={(e) => setKodeForm(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-bold text-base outline-none focus:ring-2 focus:ring-orange-500 shadow-sm"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={verifying}
                                    className="px-6 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-base rounded-2xl shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60 shrink-0"
                                >
                                    <span>{verifying ? 'Memverifikasi...' : 'Cek Nilai'}</span>
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Error Alert */}
                {errorMsg && !result && (
                    <div className="p-4 bg-red-100 dark:bg-red-900/40 border border-red-200 dark:border-red-800 text-red-850 dark:text-red-200 rounded-2xl flex items-center gap-3">
                        <AlertCircle size={24} className="text-red-650 shrink-0" />
                        <span className="font-semibold text-sm">{errorMsg}</span>
                    </div>
                )}

                {/* Result Display */}
                {result && result.nilaiList.length > 0 && (
                    <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
                        {/* Summary Card */}
                        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black dark:from-black dark:via-gray-900 dark:to-black rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-gray-700/50">
                            <div className="absolute -top-10 -right-10 opacity-10 pointer-events-none transform rotate-12">
                                <Trophy size={180} />
                            </div>
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="space-y-2">
                                    <span className="px-3 py-1 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
                                        Hasil Penilaian Juri
                                    </span>
                                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{result.team.title}</h2>
                                    <p className="text-sm text-gray-400">
                                        Cabang Lomba: <span className="text-orange-400 font-bold">{result.team.nama_lomba}</span>
                                    </p>
                                </div>
                                <div className="bg-white/5 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/10 flex flex-col items-center shrink-0 min-w-[150px]">
                                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Rata-Rata Nilai Akhir</span>
                                    <span className="text-4xl sm:text-5xl font-black text-orange-400 mt-1">
                                        {(result.nilaiList.reduce((acc, curr) => acc + (parseFloat(curr.nilai_akhir) || 0), 0) / result.nilaiList.length).toFixed(2)}
                                    </span>
                                    <span className="text-[10px] text-gray-500 mt-1">Dari {result.nilaiList.length} Juri</span>
                                </div>
                            </div>
                        </div>

                        {/* Judges Detailed breakdown list */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 px-1">
                                <Star className="text-yellow-500" size={20} />
                                Rincian Penilaian Juri ({result.nilaiList.length})
                            </h3>

                            {result.nilaiList.map((item, index) => {
                                const criteriaList = item.detail_nilai_lomba || [];
                                return (
                                    <div key={item.id} className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-750 p-6 shadow-sm space-y-6">
                                        {/* Juri Header */}
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-100 dark:border-gray-700 pb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold">
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <h4 className="font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                                                        <UserCheck size={16} className="text-violet-500" />
                                                        {item.form_nilai_lomba?.nama_juri || 'Juri Anonim'}
                                                    </h4>
                                                    <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                                                        <Calendar size={12} />
                                                        {new Date(item.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="px-4 py-2 bg-amber-500 text-white font-extrabold rounded-2xl text-base shadow-sm">
                                                Nilai: {item.nilai_akhir !== null ? Number(item.nilai_akhir).toFixed(2) : '-'}
                                            </div>
                                        </div>

                                        {/* Criteria Score List */}
                                        <div className="space-y-3">
                                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                                <FileText size={14} className="text-violet-500" />
                                                <span>Breakdown Nilai Kriteria</span>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {criteriaList.map((crit) => (
                                                    <div key={crit.id} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800/80 flex items-center justify-between gap-4">
                                                        <div>
                                                            <div className="text-sm font-bold text-gray-800 dark:text-gray-200">{crit.judul_nilai}</div>
                                                            <div className="text-[10px] text-gray-500 font-semibold mt-0.5">Bobot: {crit.bobot_nilai}%</div>
                                                        </div>
                                                        <div className="text-base font-extrabold text-gray-900 dark:text-white">
                                                            {crit.nilai} <span className="text-xs text-gray-400 font-semibold">/100</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Kritik & Saran */}
                                        {(item.kritik || item.saran) && (
                                            <div className="pt-2 border-t border-gray-100 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {item.kritik && (
                                                    <div className="bg-red-50/50 dark:bg-red-950/10 p-4 rounded-2xl border border-red-100/50 dark:border-red-900/20">
                                                        <div className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                                            <MessageSquare size={12} />
                                                            <span>Catatan Kritik</span>
                                                        </div>
                                                        <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{item.kritik}"</p>
                                                    </div>
                                                )}
                                                {item.saran && (
                                                    <div className="bg-green-50/50 dark:bg-green-950/10 p-4 rounded-2xl border border-green-100/50 dark:border-green-900/20">
                                                        <div className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                                            <MessageSquare size={12} />
                                                            <span>Saran Masukan</span>
                                                        </div>
                                                        <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{item.saran}"</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </ScheduleBarrier>
    );
}
