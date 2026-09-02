'use client';

import { useState } from 'react';
import { Award, Loader2, Download, CheckCircle2 } from 'lucide-react';
import { generateSertifikatPoseAction } from '@/api/sertifikat/route';

/**
 * TombolCetakSertifikat — Komponen tombol cetak sertifikat dengan progress bar halus
 * Terinspirasi dari TombolCetak.js
 *
 * @param {Object} props
 * @param {'peserta_juara' | 'partisipasi'} [props.type="peserta_juara"]
 * @param {string} [props.kodeForm=""]
 * @param {string} [props.pesertaId=""]
 * @param {string} [props.label="Cetak Sertifikat"]
 * @param {string} [props.className=""]
 * @param {Function} [props.onSuccess] - Callback when successfully printed
 */
export default function TombolCetakSertifikat({
    type = 'peserta_juara',
    kodeForm = '',
    pesertaId = '',
    label = 'Cetak & Unduh Sertifikat',
    className = '',
    onSuccess = null
}) {
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isComplete, setIsComplete] = useState(false);

    const handleDownload = async () => {
        if (loading) return;
        if (type === 'peserta_juara' && !kodeForm) {
            alert('Kode form diperlukan.');
            return;
        }
        if (type === 'partisipasi' && !pesertaId) {
            alert('Peserta ID diperlukan.');
            return;
        }

        setLoading(true);
        setIsComplete(false);
        setProgress(15);

        // Smooth simulated progress increments
        const t1 = setTimeout(() => setProgress(45), 400);
        const t2 = setTimeout(() => setProgress(75), 1200);
        const t3 = setTimeout(() => setProgress(88), 2400);

        try {
            const res = await generateSertifikatPoseAction({
                type,
                kode_form: kodeForm,
                pesertaId
            });

            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);

            if (!res || !res.success) {
                throw new Error(res?.error || 'Gagal membuat sertifikat.');
            }

            setProgress(96);

            // Convert base64 to Blob & trigger clean download
            const byteCharacters = atob(res.base64Pdf);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/pdf' });

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = res.filename || `Sertifikat_POSE_${kodeForm || pesertaId}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

            setProgress(100);
            setIsComplete(true);

            if (onSuccess) {
                onSuccess(res);
            }
        } catch (err) {
            console.error('Download Sertifikat Error:', err);
            alert(`Terjadi kesalahan: ${err.message}`);
        } finally {
            setTimeout(() => {
                setLoading(false);
                setProgress(0);
                setTimeout(() => setIsComplete(false), 3000);
            }, 600);
        }
    };

    return (
        <button
            type="button"
            onClick={handleDownload}
            disabled={loading}
            className={`relative overflow-hidden group transition-all duration-300 font-bold rounded-2xl active:scale-[0.98] shadow-md hover:shadow-lg disabled:opacity-90 disabled:cursor-not-allowed ${
                isComplete
                    ? 'bg-emerald-600 text-white border border-emerald-500'
                    : loading
                    ? 'bg-slate-900 dark:bg-gray-800 text-white border border-slate-700 dark:border-gray-700'
                    : 'bg-gradient-to-r from-amber-600 via-amber-700 to-orange-600 hover:from-amber-500 hover:via-amber-600 hover:to-orange-500 text-white border border-amber-500/40 shadow-amber-950/20'
            } ${className || 'px-6 py-4 text-base flex items-center justify-center gap-3 w-full sm:w-auto'}`}
        >
            {/* Animated Loading Progress Bar Overlay */}
            {loading && (
                <div
                    className="absolute inset-y-0 left-0 bg-white/20 dark:bg-white/15 transition-all duration-300 ease-out pointer-events-none"
                    style={{ width: `${progress}%` }}
                />
            )}

            {/* Button Inner Content */}
            <div className="relative z-10 flex items-center justify-center gap-2.5 w-full">
                {isComplete ? (
                    <>
                        <CheckCircle2 size={20} className="text-white animate-in zoom-in-75 duration-200 shrink-0" />
                        <span>Sertifikat Berhasil Diunduh!</span>
                    </>
                ) : loading ? (
                    <>
                        <Loader2 size={20} className="animate-spin text-white shrink-0" />
                        <span className="truncate">Membuat Sertifikat Digital...</span>
                        <span className="font-mono text-xs font-black text-amber-300 dark:text-amber-400 shrink-0 ml-1">
                            {progress}%
                        </span>
                    </>
                ) : (
                    <>
                        <Award size={20} className="text-amber-200 group-hover:rotate-12 transition-transform duration-300 shrink-0" />
                        <span>{label}</span>
                        <Download size={17} className="text-white/80 group-hover:translate-y-0.5 transition-transform shrink-0" />
                    </>
                )}
            </div>
        </button>
    );
}
