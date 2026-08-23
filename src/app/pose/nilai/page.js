'use client';

import { useState } from 'react';
import { Search, Trophy, Calendar, UserCheck, AlertCircle, CheckCircle, FileText, Star, MessageSquare, Info, Award, BarChart2 } from 'lucide-react';
import PageHero from '@/components/public/PageHero';
import ScheduleBarrier from '@/components/public/ScheduleBarrier';
import { getNilaiByKodeForm } from '@/api/supabase/public/penilaian';
import PengembangBarrier from '@/components/public/PengembangBarrier';

export default function CekNilaiPage() {
    const [kodeForm, setKodeForm] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [result, setResult] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [verifyStatus, setVerifyStatus] = useState(null);

    const handleVerify = async (e) => {
        e.preventDefault();
        if (!kodeForm.trim()) return;

        setVerifying(true);
        setErrorMsg(null);
        setResult(null);
        setVerifyStatus(null);

        const res = await getNilaiByKodeForm(kodeForm.trim());
        setVerifying(false);

        if (res.success) {
            setResult(res);
            setVerifyStatus('success');
        } else {
            setVerifyStatus('error');
            setErrorMsg(res.error || 'Terjadi kesalahan saat memverifikasi kode.');
        }
    };

    return (
        <PengembangBarrier site="pose" route="/nilai">
            <ScheduleBarrier pageType="jadwal">
                <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12 animate-in fade-in duration-500 space-y-8 pb-24">
                    <PageHero
                        site="pose"
                        icon={Trophy}
                        title="Cek Nilai Penilaian Juri"
                        subtitle="Masukkan Kode Form Tim Anda untuk melihat hasil penilaian, kritik, dan saran dari juri."
                    />

                    {/* Form Verifikasi */}
                    <div className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-3xl border border-gray-200/80 dark:border-gray-800 shadow-sm hover:shadow-md transition-all space-y-6">
                        <form onSubmit={handleVerify} className="space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                        Kode Form Tim Peserta
                                    </label>
                                    <span className="text-[11px] font-medium text-gray-400">Format: PsXXXXXXXX</span>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <div className="relative flex-1">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                            <Search size={18} />
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Masukkan Kode Form (contoh: PsKrBmc28MF54xL)"
                                            value={kodeForm}
                                            onChange={(e) => setKodeForm(e.target.value)}
                                            className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white font-bold text-base outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-white transition-all shadow-xs"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={verifying}
                                        className="px-7 py-3.5 bg-slate-950 hover:bg-slate-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-slate-950 font-bold text-base rounded-2xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 disabled:opacity-60 shrink-0"
                                    >
                                        <Search size={18} />
                                        <span>{verifying ? 'Memverifikasi...' : 'Cek Nilai'}</span>
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Success Alert */}
                    {verifyStatus === 'success' && (
                        <div className="p-4.5 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl flex items-center gap-3.5 animate-in fade-in duration-300 shadow-xs">
                            <CheckCircle size={22} className="text-gray-900 dark:text-white shrink-0" />
                            <span className="font-bold text-sm">Verifikasi Berhasil! Data penilaian tim Anda ditemukan.</span>
                        </div>
                    )}

                    {/* Error Alert */}
                    {verifyStatus === 'error' && (
                        <div className="p-4.5 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 rounded-2xl flex items-center gap-3.5 animate-in fade-in duration-300 shadow-xs">
                            <AlertCircle size={22} className="text-orange-500 shrink-0" />
                            <span className="font-bold text-sm">Gagal Verifikasi: {errorMsg}</span>
                        </div>
                    )}

                    {/* Result Display: Belum Ditilai */}
                    {result && result.nilaiList.length === 0 && (
                        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 sm:p-8 rounded-3xl shadow-xs space-y-3 animate-in slide-in-from-top-4 duration-300">
                            <div className="flex items-start sm:items-center gap-3 text-gray-900 dark:text-white">
                                <div className="p-2.5 bg-orange-500/10 rounded-2xl shrink-0">
                                    <Info size={22} className="text-orange-500" />
                                </div>
                                <span className="font-bold text-base sm:text-lg">
                                    Tim Anda terdaftar, namun belum ada penilaian juri yang dirilis.
                                </span>
                            </div>
                            {result.team?.title && (
                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 pl-12 font-medium">
                                    Tim: <span className="font-bold text-gray-900 dark:text-white">{result.team.title}</span> ({result.team.nama_lomba || 'POSE'})
                                </p>
                            )}
                        </div>
                    )}

                    {/* Result Display: Has Nilai */}
                    {result && result.nilaiList.length > 0 && (
                        <div className="space-y-8 animate-in slide-in-from-top-4 duration-300">
                            {/* Summary Header Card */}
                            <div className="bg-slate-950 dark:bg-gray-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800 dark:border-gray-800">
                                <div className="absolute -top-10 -right-10 opacity-10 pointer-events-none transform rotate-12">
                                    <Trophy size={200} />
                                </div>
                                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="space-y-2.5">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 text-white/90 border border-white/20 rounded-full text-xs font-bold uppercase tracking-wider">
                                            <Award size={14} className="text-orange-500" />
                                            <span>Hasil Penilaian Resmi</span>
                                        </div>
                                        <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{result.team.title}</h2>
                                        <p className="text-sm text-gray-400 flex items-center gap-2">
                                            <span>Cabang Lomba:</span>
                                            <span className="text-orange-500 font-bold px-2 py-0.5 bg-orange-500/10 rounded-md border border-orange-500/20">{result.team.nama_lomba}</span>
                                        </p>
                                    </div>
                                    <div className="bg-white/5 backdrop-blur-md px-6 py-5 rounded-2xl border border-white/10 flex flex-col items-center shrink-0 min-w-[170px] shadow-inner">
                                        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Rata-Rata Nilai Akhir</span>
                                        <span className="text-4xl sm:text-5xl font-black text-orange-500 mt-1">
                                            {(result.nilaiList.reduce((acc, curr) => acc + (parseFloat(curr.nilai_akhir) || 0), 0) / result.nilaiList.length).toFixed(2)}
                                        </span>
                                        <span className="text-[10px] text-gray-400 mt-1 font-medium">Dari {result.nilaiList.length} Juri Penilai</span>
                                    </div>
                                </div>
                            </div>

                            {/* Judges Detailed breakdown list */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between px-1">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <Star className="text-orange-500 fill-orange-500" size={20} />
                                        <span>Rincian Penilaian Juri ({result.nilaiList.length})</span>
                                    </h3>
                                    <span className="text-xs font-medium text-gray-400">Skala Penilaian 0 - 100</span>
                                </div>

                                {result.nilaiList.map((item, index) => {
                                    const criteriaList = item.detail_nilai_lomba || [];
                                    return (
                                        <div key={item.id} className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/80 dark:border-gray-800 p-6 sm:p-7 shadow-xs hover:border-gray-300 dark:hover:border-gray-700 transition-all space-y-6">
                                            {/* Juri Header */}
                                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-150 dark:border-gray-800 pb-5">
                                                <div className="flex items-center gap-3.5">
                                                    <div className="w-11 h-11 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white flex items-center justify-center font-extrabold text-sm border border-gray-200/80 dark:border-gray-700 shadow-xs">
                                                        Juri #{index + 1}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5 text-base">
                                                            <UserCheck size={18} className="text-orange-500" />
                                                            {item.form_nilai_lomba?.nama_juri || 'Juri Penilai'}
                                                        </h4>
                                                        <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5 font-medium">
                                                            <Calendar size={13} />
                                                            {new Date(item.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="px-4.5 py-2 bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-black rounded-2xl text-base shadow-xs border border-slate-800 dark:border-gray-200 flex items-center gap-2">
                                                    <span className="text-xs font-semibold text-gray-400 dark:text-gray-600 uppercase">Nilai Akhir:</span>
                                                    <span>{item.nilai_akhir !== null ? Number(item.nilai_akhir).toFixed(2) : '-'}</span>
                                                </div>
                                            </div>

                                            {/* Criteria Score List */}
                                            <div className="space-y-3.5">
                                                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                                    <BarChart2 size={15} className="text-gray-500 dark:text-gray-400" />
                                                    <span>Breakdown Nilai Kriteria</span>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                                    {criteriaList.map((crit) => {
                                                        const scoreNum = Number(crit.nilai) || 0;
                                                        return (
                                                            <div key={crit.id} className="p-4 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-200/80 dark:border-gray-800/80 space-y-2">
                                                                <div className="flex items-center justify-between gap-3">
                                                                    <div>
                                                                        <div className="text-sm font-bold text-gray-900 dark:text-gray-100">{crit.judul_nilai}</div>
                                                                        <div className="text-[11px] text-gray-500 font-semibold mt-0.5">Bobot: {crit.bobot_nilai}%</div>
                                                                    </div>
                                                                    <div className="text-base font-black text-gray-900 dark:text-white bg-white dark:bg-gray-900 px-3 py-1 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs">
                                                                        {crit.nilai} <span className="text-xs text-gray-400 font-normal">/100</span>
                                                                    </div>
                                                                </div>
                                                                {/* Visual Progress Bar */}
                                                                <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-slate-900 dark:bg-white transition-all duration-500 rounded-full"
                                                                        style={{ width: `${Math.min(100, Math.max(0, scoreNum))}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Kritik & Saran */}
                                            {(item.kritik || item.saran) && (
                                                <div className="pt-3 border-t border-gray-150 dark:border-gray-800 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {item.kritik && (
                                                        <div className="bg-gray-50 dark:bg-gray-950 p-4 rounded-2xl border border-gray-200/80 dark:border-gray-800 space-y-1">
                                                            <div className="text-xs font-bold text-orange-500 uppercase tracking-wider flex items-center gap-1.5">
                                                                <MessageSquare size={13} />
                                                                <span>Catatan Kritik Juri</span>
                                                            </div>
                                                            <p className="text-sm text-gray-700 dark:text-gray-300 italic leading-relaxed">"{item.kritik}"</p>
                                                        </div>
                                                    )}
                                                    {item.saran && (
                                                        <div className="bg-gray-50 dark:bg-gray-950 p-4 rounded-2xl border border-gray-200/80 dark:border-gray-800 space-y-1">
                                                            <div className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                                                                <MessageSquare size={13} />
                                                                <span>Saran Masukan Juri</span>
                                                            </div>
                                                            <p className="text-sm text-gray-700 dark:text-gray-300 italic leading-relaxed">"{item.saran}"</p>
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
        </PengembangBarrier>
    );
}

