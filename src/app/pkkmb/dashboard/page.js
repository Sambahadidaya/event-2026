'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    LayoutDashboard, KeyRound, ArrowRight, Loader2,
    AlertCircle, QrCode, ShieldCheck, Camera, Upload,
    X, Crop, Check, ScanLine
} from 'lucide-react';
import PageHero from '@/components/public/PageHero';
import { getKelompokMemberByIdPublic } from '@/api/supabase/public/kelompok';
import { Html5Qrcode } from 'html5-qrcode';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

function PkkmbDashboardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [uniqueId, setUniqueId] = useState('');
    const [loading, setLoading] = useState(false);
    const [pageChecking, setPageChecking] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    // QR Scanner States
    const [showScanner, setShowScanner] = useState(false);
    const [cameraActive, setCameraActive] = useState(false);
    const [imageToCrop, setImageToCrop] = useState(null);
    const [crop, setCrop] = useState({ unit: '%', width: 50, height: 50, x: 25, y: 25 });
    const [completedCrop, setCompletedCrop] = useState(null);

    const imgRef = useRef(null);
    const html5QrCodeRef = useRef(null);

    // Cek localStorage & URL query saat pertama kali load
    useEffect(() => {
        const checkAutoLogin = async () => {
            const tokenFromUrl = searchParams.get('token') || searchParams.get('id');
            const savedId = localStorage.getItem('pkkmb_member_id');

            const targetId = tokenFromUrl || savedId;

            if (targetId) {
                const trimmed = targetId.trim();
                try {
                    const member = await getKelompokMemberByIdPublic(trimmed);
                    if (member && member.id) {
                        localStorage.setItem('pkkmb_member_id', member.id);
                        router.replace(`/pkkmb/dashboard/${member.id}`);
                        return;
                    } else {
                        // Jika ID di localStorage tidak valid, hapus
                        localStorage.removeItem('pkkmb_member_id');
                    }
                } catch (e) {
                    console.error('Error auto-verifying member id:', e);
                }
            }
            setPageChecking(false);
        };

        checkAutoLogin();
    }, [searchParams, router]);

    // Cleanup camera scanner on unmount
    useEffect(() => {
        return () => {
            if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
                html5QrCodeRef.current.stop().catch(e => console.error("Failed to clear scanner", e));
            }
        };
    }, []);

    const extractIdFromResult = (rawResult) => {
        if (!rawResult) return '';
        let cleaned = rawResult.trim();
        try {
            if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
                const url = new URL(cleaned);
                const queryToken = url.searchParams.get('token') || url.searchParams.get('id');
                if (queryToken) return queryToken;

                // Cek jika path berakhiran dengan ID: /pkkmb/dashboard/[id]
                const pathParts = url.pathname.split('/').filter(Boolean);
                if (pathParts.length > 0) {
                    return pathParts[pathParts.length - 1];
                }
            }
        } catch {
            // Biarkan cleaned apa adanya
        }
        return cleaned;
    };

    const handleProcessValidation = async (targetId) => {
        const trimmed = extractIdFromResult(targetId);

        if (!trimmed) {
            setErrorMessage('Silakan masukkan ID unik Anda terlebih dahulu.');
            return;
        }

        setLoading(true);
        setErrorMessage('');

        try {
            const member = await getKelompokMemberByIdPublic(trimmed);

            if (!member || !member.id) {
                setErrorMessage('ID unik tidak ditemukan atau tidak valid. Pastikan ID sesuai dengan kartu QR Anda.');
                setLoading(false);
                return;
            }

            // Simpan ID ke localStorage agar login otomatis berikutnya
            localStorage.setItem('pkkmb_member_id', member.id);

            // Validasi berhasil, arahkan ke halaman dashboard peserta
            router.push(`/pkkmb/dashboard/${member.id}`);
        } catch (err) {
            console.error('Error validating member ID:', err);
            setErrorMessage(err.message || 'Terjadi kesalahan saat memverifikasi ID unik.');
            setLoading(false);
        }
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        handleProcessValidation(uniqueId);
    };

    const handleQRCapture = async (result) => {
        if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
            await html5QrCodeRef.current.stop().catch(console.error);
        }
        setCameraActive(false);
        setShowScanner(false);
        setImageToCrop(null);

        const extracted = extractIdFromResult(result);
        setUniqueId(extracted);
        await handleProcessValidation(extracted);
    };

    const startCamera = async () => {
        try {
            if (!html5QrCodeRef.current) {
                html5QrCodeRef.current = new Html5Qrcode('pkkmb-qr-reader');
            }

            setCameraActive(true);
            setErrorMessage('');
            await html5QrCodeRef.current.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 300, height: 300 } },
                (decodedText) => handleQRCapture(decodedText),
                () => { /* ignore frame errors */ }
            );
        } catch (err) {
            console.error("Camera start failed:", err);
            setErrorMessage("Gagal mengakses kamera. Pastikan izin kamera telah diberikan.");
            setCameraActive(false);
        }
    };

    const stopCamera = async () => {
        if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
            await html5QrCodeRef.current.stop().catch(console.error);
        }
        setCameraActive(false);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            setImageToCrop(event.target.result);
            if (cameraActive) stopCamera();
        };
        reader.readAsDataURL(file);
    };

    const captureCameraFrame = () => {
        const video = document.querySelector('#pkkmb-qr-reader video');
        if (video) {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0);
            setImageToCrop(canvas.toDataURL('image/jpeg'));
            stopCamera();
        }
    };

    const handleScanCrop = async () => {
        if (!imgRef.current || !completedCrop || !completedCrop.width || !completedCrop.height) {
            setErrorMessage("Area crop tidak valid.");
            return;
        }

        const canvas = document.createElement('canvas');
        const image = imgRef.current;

        const cropX = Math.floor((completedCrop.x / 100) * image.naturalWidth);
        const cropY = Math.floor((completedCrop.y / 100) * image.naturalHeight);
        const cropWidth = Math.floor((completedCrop.width / 100) * image.naturalWidth);
        const cropHeight = Math.floor((completedCrop.height / 100) * image.naturalHeight);

        if (cropWidth <= 0 || cropHeight <= 0) {
            setErrorMessage("Area crop terlalu kecil.");
            return;
        }

        canvas.width = cropWidth;
        canvas.height = cropHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        ctx.drawImage(
            image,
            cropX,
            cropY,
            cropWidth,
            cropHeight,
            0,
            0,
            canvas.width,
            canvas.height
        );

        setLoading(true);
        setErrorMessage('');

        try {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const jsQR = (await import('jsqr')).default;
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
            });

            if (code) {
                setImageToCrop(null);
                setCompletedCrop(null);
                handleQRCapture(code.data);
            } else {
                setLoading(false);
                setErrorMessage("QR Code tidak terdeteksi pada area crop. Silakan paskan posisi QR.");
            }
        } catch (err) {
            console.error("jsQR scan failed:", err);
            setLoading(false);
            setErrorMessage("Gagal memproses gambar crop QR.");
        }
    };

    if (pageChecking) {
        return (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20 flex flex-col items-center justify-center min-h-[50vh]">
                <Loader2 size={36} className="text-blue-600 animate-spin mb-4" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Memeriksa sesi peserta...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12">
            <PageHero
                site="pkkmb"
                icon={LayoutDashboard}
                title="Dashboard Peserta PKKMB"
                subtitle="Akses informasi kelompok, kakak pembimbing, dan rekapitulasi pengumpulan tugas Anda."
            />

            <div className="max-w-xl mx-auto">
                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
                    <div className="text-center mb-8 relative z-10">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                            <KeyRound size={28} />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            Verifikasi ID Peserta
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
                            Masukkan ID unik atau Scan Kartu QR PKKMB Anda untuk membuka dashboard.
                        </p>
                    </div>

                    {errorMessage && (
                        <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3 text-rose-700 dark:text-rose-400 text-xs sm:text-sm animate-in fade-in duration-200">
                            <AlertCircle size={18} className="shrink-0 mt-0.5" />
                            <p>{errorMessage}</p>
                        </div>
                    )}

                    {showScanner ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300 relative z-10">
                            <div className={`w-full bg-slate-950 rounded-2xl overflow-hidden shadow-inner flex flex-col items-center justify-center border-2 border-slate-200 dark:border-slate-800 group ${imageToCrop ? 'hidden' : 'aspect-square relative'}`}>
                                <div id="pkkmb-qr-reader" className="w-full h-full [&>video]:object-cover [&>video]:w-full [&>video]:h-full"></div>
                                {!cameraActive && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-950/90 p-6 text-center">
                                        <Camera size={44} className="mb-3 opacity-60 text-blue-400" />
                                        <p className="text-xs font-semibold text-slate-300">Kamera belum aktif</p>
                                        <p className="text-[11px] text-slate-500 mt-1">Klik tombol &ldquo;Buka Kamera&rdquo; atau upload gambar QR Anda.</p>
                                    </div>
                                )}
                                {cameraActive && (
                                    <div className="absolute inset-0 border-[36px] border-black/40 pointer-events-none">
                                        <div className="absolute inset-0 border-2 border-blue-500 animate-pulse"></div>
                                    </div>
                                )}

                                {cameraActive && (
                                    <div className="absolute bottom-4 left-0 right-0 flex justify-center z-10">
                                        <button
                                            type="button"
                                            onClick={captureCameraFrame}
                                            className="bg-white/90 backdrop-blur text-slate-900 py-1.5 px-4 rounded-full text-xs font-bold flex items-center shadow-lg hover:bg-white transition-all cursor-pointer"
                                        >
                                            <Crop size={14} className="mr-1.5" />
                                            Ambil Gambar & Crop
                                        </button>
                                    </div>
                                )}
                            </div>

                            {imageToCrop && (
                                <div className="flex flex-col items-center space-y-3">
                                    <div className="relative w-full bg-slate-950 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center border-2 border-slate-200 dark:border-slate-800 p-2">
                                        <ReactCrop
                                            crop={crop}
                                            onChange={(_, percentCrop) => setCrop(percentCrop)}
                                            onComplete={(_, percentCrop) => setCompletedCrop(percentCrop)}
                                            className="max-h-[45vh] w-auto mx-auto rounded-xl overflow-hidden"
                                        >
                                            <img
                                                ref={imgRef}
                                                src={imageToCrop}
                                                alt="Crop QR"
                                                className="max-h-[45vh] w-auto object-contain"
                                                onLoad={() => {
                                                    setCompletedCrop({
                                                        unit: '%',
                                                        x: 25,
                                                        y: 25,
                                                        width: 50,
                                                        height: 50
                                                    });
                                                }}
                                            />
                                        </ReactCrop>
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center font-medium">
                                        Posisikan kotak pada barcode / QR Code kartu PKKMB.
                                    </p>

                                    <div className="grid grid-cols-2 gap-3 w-full">
                                        <button
                                            type="button"
                                            onClick={() => setImageToCrop(null)}
                                            className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center justify-center transition-all cursor-pointer"
                                        >
                                            <X size={15} className="mr-1.5" /> Batal
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleScanCrop}
                                            className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center transition-all shadow-sm cursor-pointer"
                                        >
                                            <Check size={15} className="mr-1.5" /> Scan Hasil Crop
                                        </button>
                                    </div>
                                </div>
                            )}

                            {!imageToCrop && (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={cameraActive ? stopCamera : startCamera}
                                            className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${cameraActive
                                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                                                }`}
                                        >
                                            <Camera size={16} className="mr-1.5" />
                                            {cameraActive ? 'Stop Kamera' : 'Buka Kamera'}
                                        </button>

                                        <label className="cursor-pointer py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center justify-center transition-all">
                                            <Upload size={16} className="mr-1.5" />
                                            <span>Upload Foto</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleFileUpload}
                                            />
                                        </label>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            stopCamera();
                                            setShowScanner(false);
                                            setImageToCrop(null);
                                        }}
                                        className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-bold transition-all flex justify-center items-center cursor-pointer"
                                    >
                                        <X size={15} className="mr-1.5" /> Tutup Scanner (Input Manual)
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <form onSubmit={handleFormSubmit} className="space-y-5 relative z-10">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                    <KeyRound size={14} className="text-blue-600 dark:text-blue-400" />
                                    ID Unik Peserta
                                </label>
                                <input
                                    type="text"
                                    value={uniqueId}
                                    onChange={(e) => {
                                        setUniqueId(e.target.value);
                                        if (errorMessage) setErrorMessage('');
                                    }}
                                    placeholder="Contoh: 123e4567-e89b-12d3-a456-426614174000"
                                    className="w-full px-4 py-3.5 text-sm font-mono border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white transition-all placeholder:text-slate-400"
                                    disabled={loading}
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-3 pt-1">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            <span>Memverifikasi ID...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Masuk ke Dashboard</span>
                                            <ArrowRight size={18} />
                                        </>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    disabled={loading}
                                    onClick={() => {
                                        setShowScanner(true);
                                        setErrorMessage('');
                                    }}
                                    className="w-full py-3 px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                                >
                                    <ScanLine size={16} className="text-blue-600 dark:text-blue-400" />
                                    <span>Scan Kartu QR PKKMB</span>
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Informasi Bantuan */}
                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-2">
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold">
                            <ShieldCheck size={15} className="text-emerald-500" />
                            <span>Bantuan & Panduan Akses</span>
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            <li>ID Unik tertera pada Kartu QR PKKMB Anda.</li>
                            <li>Setelah berhasil masuk, perangkat ini akan mengingat ID Anda secara otomatis.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PkkmbDashboardLoginPage() {
    return (
        <Suspense fallback={
            <div className="max-w-4xl mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[50vh]">
                <Loader2 size={36} className="text-blue-600 animate-spin mb-4" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Memuat portal dashboard...</p>
            </div>
        }>
            <PkkmbDashboardContent />
        </Suspense>
    );
}
