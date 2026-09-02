'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Trophy, Award, Users, AlertCircle, CheckCircle, Sparkles, ScrollText, FileText, CheckCircle2 } from 'lucide-react';
import PageHero from '@/components/public/PageHero';
import ScheduleBarrier from '@/components/public/ScheduleBarrier';
import PengembangBarrier from '@/components/public/PengembangBarrier';
import TombolCetakSertifikat from '@/components/public/TombolCetakSertifikat';
import { getSertifikatInfoByKodeForm } from '@/api/sertifikat/route';

export default function SertifikatPosePage() {
    const searchParams = useSearchParams();
    const queryKode = searchParams?.get('kode') || '';
    const [kodeForm, setKodeForm] = useState(queryKode);
    const [verifying, setVerifying] = useState(false);
    const [result, setResult] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [verifyStatus, setVerifyStatus] = useState(null);

    const handleVerify = async (e, customKode) => {
        if (e) e.preventDefault();
        const codeToVerify = (customKode !== undefined ? customKode : kodeForm)?.trim();
        if (!codeToVerify) return;

        setVerifying(true);
        setErrorMsg(null);
        setResult(null);
        setVerifyStatus(null);

        const res = await getSertifikatInfoByKodeForm(codeToVerify);
        setVerifying(false);

        if (res.success) {
            setResult(res);
            setVerifyStatus('success');
        } else {
            setVerifyStatus('error');
            setErrorMsg(res.error || 'Terjadi kesalahan saat memverifikasi kode form tim.');
        }
    };

    useEffect(() => {
        if (queryKode && queryKode.trim()) {
            const clean = queryKode.trim();
            setKodeForm(clean);
            handleVerify(null, clean);
        }
    }, [queryKode]);

    return (
        <PengembangBarrier site="pose" route="/sertifikat">
            <ScheduleBarrier pageType="jadwal">
                <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12 animate-in fade-in duration-500 space-y-8 pb-24">
                    <PageHero
                        site="pose"
                        icon={Award}
                        title="Cetak Sertifikat Digital POSE 2026"
                        subtitle="Dapatkan e-sertifikat resmi keikutsertaan atau kejuaraan Anda di ajang Pekan Olahraga & Seni (POSE) 2026."
                    />

                    {/* Form Input Kode Form */}
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
                                            className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white font-bold text-base outline-none focus:ring-2 focus:ring-amber-500/50 transition-all shadow-xs"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={verifying}
                                        className="px-7 py-3.5 bg-slate-950 hover:bg-slate-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-slate-950 font-bold text-base rounded-2xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 disabled:opacity-60 shrink-0"
                                    >
                                        <Search size={18} />
                                        <span>{verifying ? 'Memverifikasi...' : 'Cari Tim'}</span>
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Success Alert */}
                    {verifyStatus === 'success' && (
                        <div className="p-4.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 rounded-2xl flex items-center gap-3.5 animate-in fade-in duration-300 shadow-xs">
                            <CheckCircle size={22} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span className="font-bold text-sm">Tim Anda terverifikasi! Sertifikat digital siap dibuat dan diunduh.</span>
                        </div>
                    )}

                    {/* Error Alert */}
                    {verifyStatus === 'error' && (
                        <div className="p-4.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-100 rounded-2xl flex items-center gap-3.5 animate-in fade-in duration-300 shadow-xs">
                            <AlertCircle size={22} className="text-red-500 shrink-0" />
                            <span className="font-bold text-sm">{errorMsg}</span>
                        </div>
                    )}

                    {/* Certificate Result Preview Card */}
                    {result && result.team && (
                        <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
                            {/* Hero Card */}
                            <div className="bg-slate-950 dark:bg-gray-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800 dark:border-gray-800">
                                <div className="absolute -top-10 -right-10 opacity-10 pointer-events-none transform rotate-12">
                                    <Award size={220} />
                                </div>

                                <div className="relative z-10 space-y-6">
                                    <div className="flex flex-wrap items-center justify-between gap-4">
                                        <div className="flex items-center gap-2.5">
                                            {result.isJuara ? (
                                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs font-black uppercase tracking-wider shadow-xs">
                                                    <Trophy size={15} className="text-amber-400" />
                                                    <span>JUARA {result.peringkat}</span>
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/20 text-blue-300 border border-blue-500/40 rounded-full text-xs font-black uppercase tracking-wider shadow-xs">
                                                    <Award size={15} className="text-blue-400" />
                                                    <span>SERTIFIKAT PESERTA</span>
                                                </div>
                                            )}

                                            <span className="px-3 py-1 bg-white/10 text-white/80 rounded-full text-xs font-bold">
                                                {result.team.jenis_lomba}
                                            </span>
                                        </div>

                                        <div className="text-xs text-gray-400 font-mono">
                                            Kode: <span className="text-white font-bold">{result.team.kode_form}</span>
                                        </div>
                                    </div>

                                    {/* Team Title & Subtitle */}
                                    <div className="space-y-2">
                                        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                                            {result.team.title}
                                        </h2>
                                        <p className="text-sm text-gray-300 flex items-center gap-2">
                                            <span>Cabang Perlombaan:</span>
                                            <span className="text-amber-400 font-bold px-2.5 py-0.5 bg-amber-400/10 rounded-lg border border-amber-400/20">
                                                {result.team.nama_lomba}
                                            </span>
                                        </p>
                                    </div>

                                    {/* Team Members List */}
                                    {result.team.team_members && result.team.team_members.length > 0 && (
                                        <div className="space-y-2 pt-2 border-t border-slate-800">
                                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                                <Users size={14} className="text-amber-400" />
                                                <span>Anggota Tim Terdaftar ({result.team.team_members.length} Orang)</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {result.team.team_members.map((m, idx) => (
                                                    <span
                                                        key={m.id || idx}
                                                        className="px-3 py-1 bg-white/5 border border-white/10 rounded-xl text-xs text-gray-200 font-medium"
                                                    >
                                                        {m.nama} {m.jabatan ? `(${m.jabatan})` : ''}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Multi-page Notice for Kreativitas */}
                                    {result.team.jenis_lomba === 'Kreativitas' && (
                                        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-start gap-2.5">
                                            <Sparkles size={16} className="text-amber-400 mt-0.5 shrink-0" />
                                            <div>
                                                <span className="font-bold">Sertifikat Multi-Halaman:</span>
                                                <span className="ml-1 text-amber-300/90">
                                                    Karena perlombaan ini bertipe <strong>Kreativitas</strong>, sertifikat akan menyertakan halaman tambahan yang memuat rincian nilai per kriteria dari setiap juri penilai.
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Button: Animated Download Button */}
                                    <div className="pt-2">
                                        <TombolCetakSertifikat
                                            type="peserta_juara"
                                            kodeForm={result.team.kode_form}
                                            label={result.isJuara ? `Unduh Sertifikat Juara ${result.peringkat}` : 'Unduh Sertifikat Peserta'}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </ScheduleBarrier>
        </PengembangBarrier>
    );
}
