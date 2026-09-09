'use client';

import { useState } from 'react';
import {
    Share2,
    CheckCircle2,
    AlertCircle,
    Send,
    ExternalLink,
    Video,
    Link as LinkIcon,
    Users,
    User,
    Calendar,
    Sparkles,
    Check
} from 'lucide-react';
import PageHero from '@/components/public/PageHero';
import {
    checkPesertaPkkmbByNim,
    getRiwayatTugasSosmedPublic,
    submitTugasSosmedPublic
} from '@/api/supabase/public/tugas_sosmed';

// Custom Brand Icons
const TikTokIcon = ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.85.12V9.32a6.34 6.34 0 0 0-.85-.06A6.33 6.33 0 0 0 3.15 15.6a6.33 6.33 0 0 0 10.74 4.54 6.27 6.27 0 0 0 1.93-4.54V9.07a8.28 8.28 0 0 0 4.84 1.54V7.17a4.83 4.83 0 0 1-1.07-.48z"/>
    </svg>
);

const InstagramIcon = ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
);

const YouTubeIcon = ({ size = 16, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
);

export default function TugasSosmedPublicPage() {
    const [nimInput, setNimInput] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [verifiedPeserta, setVerifiedPeserta] = useState(null);
    const [riwayatList, setRiwayatList] = useState([]);

    // Form states
    const [tipeTugas, setTipeTugas] = useState('kelompok'); // 'kelompok' | 'individu'
    const [platform, setPlatform] = useState('TikTok');
    const [labelHari, setLabelHari] = useState('Hari 1');
    const [linkKonten, setLinkKonten] = useState('');
    const [keterangan, setKeterangan] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Toast
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    // Verifikasi NIM
    const handleVerifyNim = async (e) => {
        e?.preventDefault();
        if (!nimInput.trim()) {
            showToast('Silakan masukkan NIM Anda terlebih dahulu.', 'error');
            return;
        }

        setVerifying(true);
        try {
            const res = await checkPesertaPkkmbByNim(nimInput.trim());
            if (res.success) {
                setVerifiedPeserta(res.data);
                showToast(`Identitas terverifikasi: ${res.data.nama}`, 'success');

                // Load riwayat
                const riwRes = await getRiwayatTugasSosmedPublic(nimInput.trim());
                if (riwRes.success) {
                    setRiwayatList(riwRes.data || []);
                }
            } else {
                setVerifiedPeserta(null);
                setRiwayatList([]);
                showToast(res.error || 'NIM tidak ditemukan dalam data PKKMB.', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Gagal memverifikasi NIM.', 'error');
        } finally {
            setVerifying(false);
        }
    };

    // Submit Tugas
    const handleSubmitTugas = async (e) => {
        e.preventDefault();
        if (!verifiedPeserta) {
            showToast('Silakan verifikasi identitas NIM Anda terlebih dahulu.', 'error');
            return;
        }
        if (!linkKonten.trim()) {
            showToast('Tautan link konten wajib diisi.', 'error');
            return;
        }

        setSubmitting(true);
        try {
            const res = await submitTugasSosmedPublic({
                nim: verifiedPeserta.nim,
                tipe_tugas: tipeTugas,
                platform,
                link_konten: linkKonten,
                label_hari: tipeTugas === 'kelompok' ? labelHari : null,
                keterangan
            });

            if (res.success) {
                showToast(res.message || 'Tugas sosial media berhasil dikirim!', 'success');
                setLinkKonten('');
                setKeterangan('');

                // Refresh riwayat
                const riwRes = await getRiwayatTugasSosmedPublic(verifiedPeserta.nim);
                if (riwRes.success) {
                    setRiwayatList(riwRes.data || []);
                }
            } else {
                showToast(res.error || 'Gagal mengirimkan tugas.', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Terjadi kesalahan saat mengirim tugas.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const platformIcons = {
        TikTok: TikTokIcon,
        Instagram: InstagramIcon,
        YouTube: YouTubeIcon,
        Lainnya: LinkIcon
    };

    return (
        <div className="min-h-screen py-10 px-4 md:px-8 max-w-4xl mx-auto space-y-8">
            {/* Toast */}
            {toast && (
                <div
                    className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium transition-all ${
                        toast.type === 'error'
                            ? 'bg-rose-600 text-white'
                            : 'bg-emerald-600 text-white'
                    }`}
                >
                    {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                    <span>{toast.message}</span>
                </div>
            )}

            {/* Hero */}
            <PageHero
                site="pkkmb"
                icon={Share2}
                title="Pengumpulan Tugas Sosial Media"
                subtitle="Kirimkan tautan konten video / postingan TikTok, Instagram, atau YouTube untuk tugas kelompok harian dan individu PKKMB 2026"
            />

            {/* STEP 1: VERIFIKASI NIM */}
            <div className="glass rounded-3xl p-6 md:p-8 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                        1
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                        Verifikasi Data Peserta
                    </h2>
                </div>

                <form onSubmit={handleVerifyNim} className="flex flex-col sm:flex-row gap-3">
                    <input
                        type="text"
                        placeholder="Masukkan NIM Anda (contoh: 2401001)..."
                        value={nimInput}
                        onChange={(e) => setNimInput(e.target.value)}
                        className="flex-1 px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm"
                    />
                    <button
                        type="submit"
                        disabled={verifying}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 shrink-0"
                    >
                        {verifying ? 'Memeriksa...' : 'Cek NIM Saya'}
                    </button>
                </form>

                {verifiedPeserta && (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shrink-0">
                                <CheckCircle2 size={20} />
                            </div>
                            <div>
                                <div className="font-bold text-gray-900 dark:text-white text-base">
                                    {verifiedPeserta.nama}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-0.5">
                                    <span>NIM: {verifiedPeserta.nim}</span>
                                    <span>•</span>
                                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                                        Kelompok #{verifiedPeserta.kelompok_urutan} ({verifiedPeserta.kelompok_nama})
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300 self-start sm:self-center">
                            Terverifikasi
                        </div>
                    </div>
                )}
            </div>

            {/* STEP 2: FORM PENGUMPULAN TUGAS */}
            {verifiedPeserta && (
                <div className="glass rounded-3xl p-6 md:p-8 border border-gray-200 dark:border-gray-800 shadow-sm space-y-6 animate-in fade-in duration-300">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-purple-600/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm">
                            2
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                Formulir Pengumpulan Tugas Sosial Media
                            </h2>
                            <p className="text-xs text-gray-500">
                                Pastikan akun sosial media tidak di-private saat panitia memeriksa tugas
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmitTugas} className="space-y-5">
                        {/* Tab Switcher: Kelompok vs Individu */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                                Tipe Tugas Sosial Media
                            </label>
                            <div className="grid grid-cols-2 gap-3 p-1.5 bg-gray-100 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => setTipeTugas('kelompok')}
                                    className={`py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                                        tipeTugas === 'kelompok'
                                            ? 'bg-white dark:bg-gray-900 text-purple-600 dark:text-purple-400 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                                >
                                    <Users size={16} />
                                    Tugas Kelompok (Harian)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTipeTugas('individu')}
                                    className={`py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                                        tipeTugas === 'individu'
                                            ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                                >
                                    <User size={16} />
                                    Tugas Individu
                                </button>
                            </div>
                        </div>

                        {/* Hari Acara (Hanya untuk tugas kelompok) */}
                        {tipeTugas === 'kelompok' && (
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                                    Hari Pelaksanaan Konten
                                </label>
                                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                                    {['Hari 1', 'Hari 2', 'Hari 3', 'Hari 4', 'Hari 5'].map(hari => (
                                        <button
                                            key={hari}
                                            type="button"
                                            onClick={() => setLabelHari(hari)}
                                            className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                                                labelHari === hari
                                                    ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-500 shadow-xs'
                                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                                            }`}
                                        >
                                            {hari}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Platform Selector */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                                Platform Konten
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {['TikTok', 'Instagram', 'YouTube', 'Lainnya'].map(p => {
                                    const Icon = platformIcons[p];
                                    const isSelected = platform === p;
                                    return (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setPlatform(p)}
                                            className={`p-3 rounded-2xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                                                isSelected
                                                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-500 shadow-sm'
                                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50'
                                            }`}
                                        >
                                            <Icon size={16} />
                                            {p}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Link Konten Input */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                                Link URL Konten (Wajib)
                            </label>
                            <div className="relative">
                                <LinkIcon size={18} className="absolute left-3.5 top-3.5 text-gray-400" />
                                <input
                                    type="url"
                                    required
                                    placeholder="https://vt.tiktok.com/... atau https://instagram.com/p/..."
                                    value={linkKonten}
                                    onChange={(e) => setLinkKonten(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                                />
                            </div>
                        </div>

                        {/* Keterangan Tambahan */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                                Keterangan / Catatan Tambahan (Opsional)
                            </label>
                            <textarea
                                rows="2"
                                placeholder="Tuliskan judul konten atau nama akun pengunggah..."
                                value={keterangan}
                                onChange={(e) => setKeterangan(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all"
                        >
                            <Send size={16} />
                            {submitting ? 'Mengirimkan Tautan...' : 'Kirim Tugas Sosial Media'}
                        </button>
                    </form>
                </div>
            )}

            {/* STEP 3: RIWAYAT SUBMISSION */}
            {verifiedPeserta && (
                <div className="glass rounded-3xl p-6 md:p-8 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                                3
                            </div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                Riwayat Submission (Saya & Kelompok)
                            </h2>
                        </div>
                        <span className="text-xs text-gray-500 font-medium">
                            {riwayatList.length} Konten Dikirim
                        </span>
                    </div>

                    {riwayatList.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">
                            <Share2 size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Belum ada tugas sosial media yang dikirimkan.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {riwayatList.map((item) => (
                                <div
                                    key={item.id}
                                    className="p-4 bg-white dark:bg-gray-800/60 rounded-2xl border border-gray-200 dark:border-gray-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                                                {item.platform}
                                            </span>
                                            <span className="text-xs font-semibold capitalize text-gray-500 dark:text-gray-400">
                                                {item.tipe_tugas === 'kelompok' ? `Kelompok (${item.label_hari || 'Hari 1'})` : 'Individu'}
                                            </span>
                                        </div>
                                        <a
                                            href={item.link_konten}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline break-all"
                                        >
                                            <ExternalLink size={13} className="shrink-0" />
                                            {item.link_konten}
                                        </a>
                                        {item.keterangan && (
                                            <p className="text-xs text-gray-400 italic">
                                                "{item.keterangan}"
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3 self-start sm:self-center shrink-0">
                                        {item.nilai !== null && item.nilai !== undefined ? (
                                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                                                ✅ Dinilai ({item.nilai} Poin)
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                                                ⏳ Menunggu Review
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
