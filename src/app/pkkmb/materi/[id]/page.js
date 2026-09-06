'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { getMateriById, getTugasByNimAndMateri, saveTugas } from '@/api/supabase/public/materi';
import { checkPesertaPkkmbByNim } from '@/api/supabase/public/peserta';
import { uploadFile } from '@/api/supabase/storage';
import { formatIndoDate } from '@/lib/dateUtils';
import PengembangBarrier from '@/components/public/PengembangBarrier';

import {
    ArrowLeft,
    BookOpen,
    FileCheck2,
    User,
    Calendar as CalendarIcon,
    Upload,
    X,
    Loader2,
    Lock,
    AlertCircle,
    CheckCircle2,
    Plus,
    Maximize2,
    Eye,
    RefreshCw,
    Info
} from 'lucide-react';
import SamsMateriBot from '@/components/SamsMateriBot';
import ThemeToggle from '@/components/ThemeToggle';
import SiteBackground from '@/components/public/SiteBackground';

const PdfViewer = dynamic(() => import('@/components/public/PdfViewer'), {
    ssr: false,
    loading: () => (
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl p-12 shadow-sm border border-gray-200/50 dark:border-gray-800/50 flex flex-col items-center justify-center min-h-[500px]">
            <Loader2 size={32} className="animate-spin text-blue-500 mb-3" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Memuat PDF Dokumen...</p>
        </div>
    )
});

// Client-side image compression using Canvas API
const compressImageClient = (file) => {
    return new Promise((resolve) => {
        if (!file || !file.type.startsWith('image/')) {
            return resolve(file);
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const maxDim = 1200;

                if (width > maxDim || height > maxDim) {
                    if (width > height) {
                        height = Math.round((height * maxDim) / width);
                        width = maxDim;
                    } else {
                        width = Math.round((width * maxDim) / height);
                        height = maxDim;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob && blob.size < file.size) {
                            const newFileName = file.name.replace(/\.[^.]+$/, '.jpg');
                            const compressedFile = new File([blob], newFileName, {
                                type: 'image/jpeg',
                                lastModified: Date.now(),
                            });
                            resolve(compressedFile);
                        } else {
                            resolve(file);
                        }
                    },
                    'image/jpeg',
                    0.8
                );
            };
            img.onerror = () => resolve(file);
        };
        reader.onerror = () => resolve(file);
    });
};

const RATE_LIMIT_STORAGE_KEY = 'pkkmb_nim_rate_limit';
const MAX_NIM_CHECKS = 6;
const WINDOW_DURATION_MS = 60 * 1000; // 1 menit
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 menit

const getRateLimitData = () => {
    if (typeof window === 'undefined') return { timestamps: [], lockoutUntil: null };
    try {
        const data = localStorage.getItem(RATE_LIMIT_STORAGE_KEY);
        if (data) return JSON.parse(data);
    } catch (e) {
        console.error('Failed to read rate limit data', e);
    }
    return { timestamps: [], lockoutUntil: null };
};

const saveRateLimitData = (data) => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.error('Failed to save rate limit data', e);
    }
};

const formatLockoutDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
        return `${mins} menit ${secs > 0 ? `${secs} detik` : ''}`.trim();
    }
    return `${secs} detik`;
};

export default function PkkmbMateriDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [materi, setMateri] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') === 'tugas' ? 'tugas' : 'materi');
    const [isMobile, setIsMobile] = useState(false);

    // Form Tugas States (Hanya NIM + Multi Foto)
    const [nimInput, setNimInput] = useState('');
    const [isCheckingNim, setIsCheckingNim] = useState(false);
    const [pesertaData, setPesertaData] = useState(null);
    const [existingTugas, setExistingTugas] = useState(null);
    const [nimError, setNimError] = useState('');
    const [photos, setPhotos] = useState([]); // Array of { id, file: File|null, previewUrl: string, isExisting: boolean, name: string }
    const [isCompressing, setIsCompressing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitSuccessMsg, setSubmitSuccessMsg] = useState('');
    const [submitError, setSubmitError] = useState('');

    // Rate Limit States
    const [isLockedOut, setIsLockedOut] = useState(false);
    const [lockoutRemaining, setLockoutRemaining] = useState(0);

    // Modal Full Screen Preview Image
    const [fullScreenImage, setFullScreenImage] = useState(null); // string url or null
    const [fullScreenIndex, setFullScreenIndex] = useState(0);

    const fileInputRef = useRef(null);

    // Check & Countdown Lockout Timer
    useEffect(() => {
        const checkLockout = () => {
            const data = getRateLimitData();
            const now = Date.now();
            if (data.lockoutUntil && now < data.lockoutUntil) {
                const remaining = Math.ceil((data.lockoutUntil - now) / 1000);
                setIsLockedOut(true);
                setLockoutRemaining(remaining);
            } else {
                if (data.lockoutUntil && now >= data.lockoutUntil) {
                    // Reset lockout after 5 minutes passed
                    saveRateLimitData({ timestamps: [], lockoutUntil: null });
                }
                setIsLockedOut(false);
                setLockoutRemaining(0);
            }
        };

        checkLockout();
        const interval = setInterval(checkLockout, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (searchParams.get('tab') === 'tugas') {
            setActiveTab('tugas');
        }
    }, [searchParams]);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        const fetchMateri = async () => {
            const data = await getMateriById(id);
            if (!data) {
                router.push('/pkkmb/jadwal'); // redirect if not found
            } else {
                setMateri(data);
            }
            setLoading(false);
        };
        fetchMateri();
    }, [id, router]);

    // Debounce check NIM (1.5 detik setelah 9 digit) + Check Tugas Sebelumnya + Rate Limit 5x per menit
    useEffect(() => {
        const cleanedNim = nimInput.trim();
        setSubmitSuccess(false);
        setSubmitError('');

        if (isLockedOut) {
            setPesertaData(null);
            setExistingTugas(null);
            setIsCheckingNim(false);
            return;
        }

        if (cleanedNim.length === 0) {
            setPesertaData(null);
            setExistingTugas(null);
            setPhotos(prev => prev.filter(p => !p.isExisting));
            setNimError('');
            setIsCheckingNim(false);
            return;
        }

        if (cleanedNim.length < 9) {
            setPesertaData(null);
            setExistingTugas(null);
            setPhotos(prev => prev.filter(p => !p.isExisting));
            setNimError('NIM harus terdiri dari 9 digit angka.');
            setIsCheckingNim(false);
            return;
        }

        if (cleanedNim.length > 9) {
            setPesertaData(null);
            setExistingTugas(null);
            setPhotos(prev => prev.filter(p => !p.isExisting));
            setNimError('NIM maksimal 9 digit.');
            setIsCheckingNim(false);
            return;
        }

        // Tepat 9 digit -> jalankan debounce 1.5 detik
        setNimError('');
        setIsCheckingNim(true);
        setPesertaData(null);
        setExistingTugas(null);

        const timer = setTimeout(async () => {
            try {
                const now = Date.now();
                const rateData = getRateLimitData();

                // 1. Cek jika sedang terkena lockout
                if (rateData.lockoutUntil && now < rateData.lockoutUntil) {
                    const remaining = Math.ceil((rateData.lockoutUntil - now) / 1000);
                    setIsLockedOut(true);
                    setLockoutRemaining(remaining);
                    setIsCheckingNim(false);
                    return;
                }

                // 2. Filter timestamp dalam 1 menit terakhir
                const recentTimestamps = (rateData.timestamps || []).filter(t => now - t < WINDOW_DURATION_MS);

                // Jika sudah mencapai batas 5 kali dalam 1 menit, aktifkan lockout 5 menit
                if (recentTimestamps.length >= MAX_NIM_CHECKS) {
                    const newLockoutUntil = now + LOCKOUT_DURATION_MS;
                    saveRateLimitData({
                        timestamps: [],
                        lockoutUntil: newLockoutUntil
                    });
                    setIsLockedOut(true);
                    setLockoutRemaining(Math.ceil(LOCKOUT_DURATION_MS / 1000));
                    setIsCheckingNim(false);
                    return;
                }

                // Catat percobaan ini
                recentTimestamps.push(now);
                saveRateLimitData({
                    timestamps: recentTimestamps,
                    lockoutUntil: null
                });

                // 3. Cek Peserta PKKMB
                const peserta = await checkPesertaPkkmbByNim(cleanedNim);
                if (peserta && peserta.nama) {
                    setPesertaData(peserta);
                    setNimError('');

                    // 4. Cek apakah sudah pernah kumpulkan tugas untuk materi ini
                    const tugasLama = await getTugasByNimAndMateri(cleanedNim, id);
                    if (tugasLama && tugasLama.file_tugas) {
                        setExistingTugas(tugasLama);
                        setPhotos([]);
                    } else {
                        setExistingTugas(null);
                        setPhotos(prev => prev.filter(p => !p.isExisting));
                    }
                } else {
                    setPesertaData(null);
                    setExistingTugas(null);
                    setPhotos(prev => prev.filter(p => !p.isExisting));
                    setNimError('NIM tidak ditemukan dalam data peserta PKKMB.');
                }
            } catch (err) {
                setPesertaData(null);
                setExistingTugas(null);
                setPhotos(prev => prev.filter(p => !p.isExisting));
                setNimError('Gagal memeriksa data NIM.');
            } finally {
                setIsCheckingNim(false);
            }
        }, 1500);

        return () => clearTimeout(timer);
    }, [nimInput, id, isLockedOut]);

    // Handle Image Selection with Client-side compression
    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const availableSlots = 3 - photos.length;
        if (availableSlots <= 0) {
            alert('Maksimal 3 foto yang dapat diunggah.');
            return;
        }

        const selectedFiles = files.slice(0, availableSlots);
        setIsCompressing(true);

        try {
            const newPhotos = [];
            for (const file of selectedFiles) {
                if (!file.type.startsWith('image/')) {
                    alert(`File "${file.name}" bukan gambar.`);
                    continue;
                }

                // Compress di client
                const compressed = await compressImageClient(file);
                const previewUrl = URL.createObjectURL(file);

                newPhotos.push({
                    id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                    file: compressed,
                    previewUrl,
                    isExisting: false,
                    name: compressed.name
                });
            }

            setPhotos(prev => [...prev, ...newPhotos]);
        } catch (err) {
            console.error('Error compressing files:', err);
            alert('Gagal memproses gambar.');
        } finally {
            setIsCompressing(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemovePhoto = (photoId) => {
        setPhotos(prev => {
            const item = prev.find(p => p.id === photoId);
            if (item && !item.isExisting && item.previewUrl) {
                URL.revokeObjectURL(item.previewUrl);
            }
            return prev.filter(p => p.id !== photoId);
        });
    };

    const openFullScreen = (index) => {
        setFullScreenIndex(index);
        setFullScreenImage(photos[index]?.previewUrl || null);
    };

    const closeFullScreen = () => {
        setFullScreenImage(null);
    };

    const handleTugasSubmit = async (e) => {
        e.preventDefault();
        setSubmitError('');
        setSubmitSuccess(false);

        if (!pesertaData || !pesertaData.nama) {
            setSubmitError('NIM belum valid atau belum terdaftar.');
            return;
        }

        if (photos.length === 0) {
            setSubmitError('Silakan pilih minimal 1 foto bukti tugas rangkuman.');
            return;
        }

        setIsSubmitting(true);

        try {
            // Upload only new files, keep existing URLs
            const finalUrls = [];
            for (let i = 0; i < photos.length; i++) {
                const item = photos[i];
                if (item.isExisting) {
                    finalUrls.push(item.previewUrl);
                } else if (item.file) {
                    const formData = new FormData();
                    formData.append('file', item.file);

                    const uploadRes = await uploadFile(formData, 'materi-tugas');
                    if (!uploadRes.success) {
                        throw new Error(`Gagal mengupload foto ke-${i + 1}: ${uploadRes.error || 'Terjadi kesalahan'}`);
                    }
                    finalUrls.push(uploadRes.url);
                }
            }

            // Gabungkan URL dipisahkan koma
            const fileTugasString = finalUrls.join(',');

            // Simpan ke database tugas_materi (Insert atau Update)
            const payload = {
                materi_id: id,
                nama: pesertaData.nama,
                kampus: pesertaData.kampus || 'Kampus Bandung',
                nim: nimInput.trim(),
                file_tugas: fileTugasString,
            };

            const saveRes = await saveTugas(payload);
            if (!saveRes.success) {
                throw new Error(saveRes.error || 'Gagal menyimpan tugas ke database.');
            }

            // Revoke local object URLs
            photos.forEach(p => {
                if (!p.isExisting && p.previewUrl) URL.revokeObjectURL(p.previewUrl);
            });

            setPhotos([]);
            setExistingTugas({
                ...payload,
                created_at: new Date().toISOString()
            });

            setSubmitSuccessMsg('Tugas berhasil dikumpulkan dan tersimpan di sistem PKKMB 2026!');
            setSubmitSuccess(true);
        } catch (error) {
            console.error('Submit error:', error);
            setSubmitError(error.message || 'Terjadi kesalahan saat mengumpulkan tugas.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!materi) return null;

    const isClosed = Boolean(materi.tutup);

    return (
        <main className="min-h-screen relative flex flex-col font-sans text-slate-900 dark:text-slate-100 overflow-clip">
            <SiteBackground site="pkkmb" subtle />
            <PengembangBarrier site="pkkmb" route="/materi">

                {/* Header Fixed */}
                <div className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                        <button
                            onClick={() => router.push('/pkkmb/jadwal')}
                            className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                            <ArrowLeft size={18} /> Kembali ke Jadwal
                        </button>
                        {!isClosed && (
                            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                                <button
                                    onClick={() => setActiveTab('materi')}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'materi' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                >
                                    <BookOpen size={16} /> Materi
                                </button>
                                <button
                                    onClick={() => setActiveTab('tugas')}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'tugas' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                >
                                    <FileCheck2 size={16} /> Tugas
                                </button>
                            </div>
                        )}
                        <div className="flex items-center ml-2 border-l border-gray-200 dark:border-gray-700 pl-2">
                            <ThemeToggle />
                        </div>
                    </div>
                </div>

                {/* Kondisi Materi Ditutup */}
                {isClosed ? (
                    <div className="flex-1 w-full max-w-3xl mx-auto px-4 py-32 flex flex-col items-center justify-center animate-in fade-in zoom-in-95">
                        <div className="w-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl p-8 sm:p-12 shadow-xl border border-red-200 dark:border-red-900/40 text-center flex flex-col items-center">
                            <div className="w-20 h-20 bg-red-100 dark:bg-red-950/60 rounded-3xl flex items-center justify-center mb-6 text-red-600 dark:text-red-400 shadow-lg shadow-red-500/10">
                                <Lock size={40} />
                            </div>
                            <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-100 dark:bg-red-950/70 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/60 mb-4">
                                Akses Ditutup
                            </span>
                            <h1 className="text-2xl sm:text-3xl font-extrabold mb-2 text-gray-900 dark:text-white">
                                {materi.judul}
                            </h1>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-6">
                                Pemateri: <strong className="text-gray-700 dark:text-gray-300">{materi.pemateri}</strong>
                            </p>
                            <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-2xl border border-red-200/80 dark:border-red-900/50 max-w-lg mb-8 text-sm text-red-700 dark:text-red-300">
                                <p className="font-semibold mb-1">Pemberitahuan:</p>
                                <p>
                                    Akses tayangan materi dan pengumpulan tugas untuk sesi ini telah resmi ditutup oleh panitia PKKMB 2026.
                                </p>
                            </div>
                            <button
                                onClick={() => router.push('/pkkmb/jadwal')}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-600/30 transition-all active:scale-95 flex items-center gap-2 text-sm"
                            >
                                <ArrowLeft size={16} /> Kembali ke Daftar Jadwal
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Konten Utama Saat Materi Dibuka */
                    <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-24 flex flex-col lg:flex-row lg:items-start gap-6">

                        {/* Left Content (Materi / Tugas) */}
                        <div className={`flex-1 flex flex-col gap-6 ${activeTab === 'materi' && !isMobile ? 'lg:w-2/3 lg:flex-none' : 'w-full'}`}>

                            {/* Header Card */}
                            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl overflow-hidden shadow-sm border border-gray-200/50 dark:border-gray-800/50 animate-in fade-in slide-in-from-bottom-5">
                                <div className="h-48 md:h-64 relative group overflow-hidden">
                                    <img src={materi.foto_header} alt={materi.judul} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                </div>
                                <div className="p-6 md:p-8">
                                    <h1 className="text-2xl md:text-3xl font-extrabold line-clamp-2 leading-tight mb-4">{materi.judul}</h1>
                                    <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-600 dark:text-gray-300">
                                        <div className="flex items-center gap-1.5"><User size={16} className="text-blue-500" /> {materi.pemateri}</div>
                                        <div className="flex items-center gap-1.5"><CalendarIcon size={16} className="text-blue-500" /> {formatIndoDate(materi.tanggal)}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Tab 1: PDF Viewer Component */}
                            <div className={activeTab === 'materi' ? 'block animate-in fade-in' : 'hidden'}>
                                <PdfViewer fileUrl={materi.file_pdf} />
                            </div>

                            {/* Tab 2: Form Pengumpulan Tugas (Inline Redesign) */}
                            <div className={activeTab === 'tugas' ? 'block animate-in fade-in' : 'hidden'}>
                                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-200/50 dark:border-gray-800/50">

                                    <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                                        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-sm">
                                            <FileCheck2 size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">Form Pengumpulan Tugas</h2>
                                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                                Unggah foto rangkuman materi Anda (Maksimal 3 foto). Klik foto untuk melihat full screen.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Alert Sukses */}
                                    {submitSuccess && (
                                        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3 text-emerald-800 dark:text-emerald-300 animate-in fade-in">
                                            <CheckCircle2 size={20} className="text-emerald-500 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-bold text-sm">Berhasil!</p>
                                                <p className="text-xs mt-0.5 text-emerald-700 dark:text-emerald-400">
                                                    {submitSuccessMsg || 'Berkas tugas Anda telah berhasil tersimpan di sistem PKKMB 2026.'}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Alert Error */}
                                    {submitError && (
                                        <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 flex items-start gap-3 text-red-800 dark:text-red-300 animate-in fade-in">
                                            <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
                                            <p className="text-sm font-medium">{submitError}</p>
                                        </div>
                                    )}

                                    <form onSubmit={handleTugasSubmit} className="space-y-6">

                                        {/* Input NIM dengan Auto-Lookup & Rate Limit */}
                                        <div>
                                            <label className="block text-sm font-bold mb-1.5 text-gray-700 dark:text-gray-300">
                                                Nomor Induk Mahasiswa (NIM) <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    required
                                                    type="text"
                                                    disabled={isLockedOut || isSubmitting}
                                                    maxLength={9}
                                                    value={nimInput}
                                                    onChange={e => {
                                                        const val = e.target.value.replace(/[^0-9]/g, '');
                                                        setNimInput(val);
                                                    }}
                                                    className={`w-full px-4 py-3 border rounded-2xl outline-none text-sm font-semibold tracking-wide transition-all ${isLockedOut
                                                        ? 'bg-red-50/40 dark:bg-red-950/20 border-red-300 dark:border-red-800/70 text-red-600 dark:text-red-400 cursor-not-allowed opacity-80'
                                                        : 'bg-gray-50 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500'
                                                        }`}
                                                    placeholder={isLockedOut ? 'Pengecekan NIM dibatasi sementara...' : 'Masukkan 9 digit NIM Anda'}
                                                />
                                                {isCheckingNim && !isLockedOut && (
                                                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs text-blue-500 font-medium bg-blue-50 dark:bg-blue-950/80 px-2.5 py-1 rounded-lg">
                                                        <Loader2 size={14} className="animate-spin" /> Memeriksa...
                                                    </div>
                                                )}
                                            </div>

                                            {/* Status / Output NIM / Rate Limit Lockout */}
                                            <div className="mt-2 min-h-[22px]">
                                                {isLockedOut ? (
                                                    <span className="text-xs font-semibold text-red-600 dark:text-red-400 flex items-center gap-1.5 animate-in fade-in bg-red-50 dark:bg-red-950/40 p-2.5 rounded-xl border border-red-200 dark:border-red-800/60">
                                                        <AlertCircle size={15} className="shrink-0 text-red-500" />
                                                        <span>
                                                            Maaf Anda terlalu sering memasukkan NIM yang berganti-ganti, dimohon tunggu {formatLockoutDuration(lockoutRemaining)}.
                                                        </span>
                                                    </span>
                                                ) : pesertaData ? (
                                                    <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 animate-in fade-in">
                                                        <CheckCircle2 size={16} />
                                                        <span>Nama: {pesertaData.nama} {pesertaData.kampus ? `(${pesertaData.kampus})` : ''}</span>
                                                    </div>
                                                ) : nimError ? (
                                                    <p className="text-xs font-semibold text-red-500 flex items-center gap-1 animate-in fade-in">
                                                        <AlertCircle size={14} /> {nimError}
                                                    </p>
                                                ) : !isCheckingNim && (
                                                    <p className="text-[11px] text-gray-400 dark:text-gray-500">
                                                        *Nama mahasiswa dan status tugas akan otomatis dicek setelah memasukkan 9 digit NIM.
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Status Info jika sudah pernah mengumpulkan: sembunyikan form upload/submit */}
                                        {existingTugas ? (
                                            <div className="p-6 sm:p-8 rounded-3xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/70 flex flex-col items-center text-center gap-3 animate-in fade-in">
                                                <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
                                                    <CheckCircle2 size={32} />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-extrabold text-emerald-900 dark:text-emerald-100">
                                                        Tugas Sudah Dikumpulkan
                                                    </h3>
                                                    <p className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-300 mt-1 max-w-md leading-relaxed">
                                                        Halo <strong>{pesertaData?.nama}</strong>, Anda telah berhasil mengumpulkan tugas rangkuman untuk materi ini. Tugas yang telah dikirim bersifat final dan tidak dapat diubah atau dikumpulkan ulang.
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {/* Input Multi-Foto (Maksimal 3 Foto) */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                                                            Foto Bukti Rangkuman <span className="text-red-500">*</span>
                                                        </label>
                                                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                                            {photos.length}/3 Foto
                                                        </span>
                                                    </div>

                                                    {/* Grid Preview Foto */}
                                                    {photos.length > 0 && (
                                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                                                            {photos.map((item, idx) => (
                                                                <div key={item.id} className="relative group rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 aspect-[4/3] shadow-sm">
                                                                    <img
                                                                        src={item.previewUrl}
                                                                        alt={`Foto ${idx + 1}`}
                                                                        className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
                                                                        onClick={() => openFullScreen(idx)}
                                                                    />

                                                                    {/* Overlay Action Buttons */}
                                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2 pointer-events-none">
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                openFullScreen(idx);
                                                                            }}
                                                                            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg transition-transform active:scale-90 pointer-events-auto"
                                                                            title="Lihat Full Screen"
                                                                        >
                                                                            <Maximize2 size={16} />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleRemovePhoto(item.id);
                                                                            }}
                                                                            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg transition-transform active:scale-90 pointer-events-auto"
                                                                            title="Hapus foto"
                                                                        >
                                                                            <X size={16} />
                                                                        </button>
                                                                    </div>

                                                                    {/* Badge Info */}
                                                                    <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none">
                                                                        <span className="px-2 py-0.5 bg-black/60 backdrop-blur-md rounded-md text-[10px] text-white font-medium">
                                                                            Foto {idx + 1}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Box Tambah Foto (Jika < 3) */}
                                                    {photos.length < 3 && (
                                                        <div
                                                            onClick={() => fileInputRef.current?.click()}
                                                            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${isCompressing
                                                                ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 cursor-wait'
                                                                : 'border-gray-300 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20'
                                                                }`}
                                                        >
                                                            <input
                                                                ref={fileInputRef}
                                                                type="file"
                                                                accept="image/*"
                                                                multiple
                                                                onChange={handleFileSelect}
                                                                className="hidden"
                                                                disabled={isCompressing || isSubmitting}
                                                            />
                                                            <div className="flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400">
                                                                {isCompressing ? (
                                                                    <>
                                                                        <Loader2 size={28} className="animate-spin text-blue-500" />
                                                                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                                                                            Mengompres gambar...
                                                                        </span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                                                            {photos.length > 0 ? <Plus size={20} /> : <Upload size={20} />}
                                                                        </div>
                                                                        <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                                            {photos.length > 0 ? 'Tambah Foto Lain' : 'Klik atau seret foto bukti tugas di sini'}
                                                                        </p>
                                                                        <p className="text-[11px] text-gray-400">
                                                                            Bisa unggah hingga 3 foto (JPG, PNG, WEBP). Klik foto untuk cek full screen.
                                                                        </p>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Tombol Submit */}
                                                <button
                                                    type="submit"
                                                    disabled={!pesertaData || photos.length === 0 || isSubmitting || isCheckingNim || isCompressing || isLockedOut}
                                                    className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-lg hover:shadow-blue-600/30 transition-all flex justify-center items-center gap-2 text-sm active:scale-[0.99]"
                                                >
                                                    {isSubmitting ? (
                                                        <>
                                                            <Loader2 size={18} className="animate-spin" />
                                                            <span>Mengirim Tugas ({photos.length} Foto)...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FileCheck2 size={18} />
                                                            <span>Kumpulkan Tugas</span>
                                                        </>
                                                    )}
                                                </button>
                                            </>
                                        )}
                                    </form>

                                </div>
                            </div>
                        </div>

                        {/* Right Content (SamsMateriBot) - Sticky di Desktop */}
                        {activeTab === 'materi' && (
                            <div className={`${isMobile ? 'w-full' : 'w-1/3 shrink-0 sticky top-24 self-start h-[calc(100vh-8rem)]'}`}>
                                <SamsMateriBot materiContext={`Materi: ${materi.judul}. Pemateri: ${materi.pemateri}`} isMobile={isMobile} />
                            </div>
                        )}
                    </div>
                )}

                {/* Modal Full Screen Preview Image */}
                {fullScreenImage && (
                    <div
                        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in"
                        onClick={closeFullScreen}
                    >
                        <div
                            className="max-w-4xl max-h-[90vh] relative flex flex-col items-center gap-3"
                            onClick={e => e.stopPropagation()}
                        >
                            <img
                                src={fullScreenImage}
                                alt="Full Screen Preview"
                                className="max-w-full max-h-[75vh] sm:max-h-[80vh] object-contain rounded-2xl shadow-2xl bg-black/40"
                            />

                            {/* Navigasi foto jika ada lebih dari 1 */}
                            {photos.length > 1 && (
                                <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                                    {photos.map((p, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => openFullScreen(idx)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${fullScreenIndex === idx
                                                ? 'bg-blue-600 text-white shadow-md'
                                                : 'bg-white/20 text-gray-200 hover:bg-white/30'
                                                }`}
                                        >
                                            Foto {idx + 1}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Tombol Tutup */}
                            <button
                                type="button"
                                className="absolute -top-3 -right-3 w-9 h-9 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
                                onClick={closeFullScreen}
                                title="Tutup"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>
                )}

            </PengembangBarrier>
        </main>
    );
}