'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getMateriById, insertTugas } from '@/api/supabase/public/materi';
import { checkPesertaPkkmbByNim } from '@/api/supabase/public/peserta';
import { uploadFile } from '@/api/supabase/storage';
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
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    Download
} from 'lucide-react';
import SamsMateriBot from '@/components/SamsMateriBot';
import ThemeToggle from '@/components/ThemeToggle';
import SiteBackground from '@/components/public/SiteBackground';

// === IMPORT REACT-PDF ===
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Konfigurasi PDF.js Worker dari CDN
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PkkmbMateriDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [materi, setMateri] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('materi'); // 'materi' or 'tugas'
    const [isMobile, setIsMobile] = useState(false);

    // React PDF State
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [containerWidth, setContainerWidth] = useState(0);
    const pdfContainerRef = useRef(null);

    // Modal Tugas State
    const [showModal, setShowModal] = useState(false);
    const [tugasForm, setTugasForm] = useState({ nama: '', kampus: '', nim: '' });
    const [tugasFile, setTugasFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    // ResizeObserver untuk menyesuaikan lebar PDF dengan layar mobile
    useEffect(() => {
        if (!pdfContainerRef.current) return;
        const resizeObserver = new ResizeObserver((entries) => {
            if (entries[0]) {
                setContainerWidth(entries[0].contentRect.width);
            }
        });
        resizeObserver.observe(pdfContainerRef.current);
        return () => resizeObserver.disconnect();
    }, [materi, activeTab]);

    function onDocumentLoadSuccess({ numPages }) {
        setNumPages(numPages);
        setPageNumber(1);
    }

    const handleTugasSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // 1. Validate NIM
            const peserta = await checkPesertaPkkmbByNim(tugasForm.nim);
            if (!peserta) {
                throw new Error("NIM tidak terdaftar sebagai peserta PKKMB. Pastikan NIM benar.");
            }

            // 2. Upload file
            if (!tugasFile) throw new Error("File tugas belum dipilih.");

            const formData = new FormData();
            formData.append('file', tugasFile);

            const uploadRes = await uploadFile(formData, 'materi-tugas');
            if (!uploadRes.success) throw new Error("Gagal mengupload file: " + uploadRes.error);

            // 3. Insert to DB
            const payload = {
                materi_id: id,
                nama: tugasForm.nama,
                kampus: tugasForm.kampus,
                nim: tugasForm.nim,
                file_tugas: uploadRes.url,
            };

            const insertRes = await insertTugas(payload);
            if (!insertRes.success) throw new Error("Gagal menyimpan tugas: " + insertRes.error);

            alert("Tugas berhasil dikumpulkan!");
            setShowModal(false);
            setTugasForm({ nama: '', kampus: '', nim: '' });
            setTugasFile(null);
        } catch (error) {
            alert(error.message);
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

    return (
        <main className="min-h-screen relative flex flex-col font-sans text-slate-900 dark:text-slate-100 overflow-x-hidden">
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
                        <div className="flex items-center ml-2 border-l border-gray-200 dark:border-gray-700 pl-2">
                            <ThemeToggle />
                        </div>
                    </div>
                </div>

                <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-24 flex flex-col lg:flex-row gap-6">

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
                                    <div className="flex items-center gap-1.5"><CalendarIcon size={16} className="text-blue-500" /> {new Date(materi.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                                </div>
                            </div>
                        </div>

                        {/* Content Area - PDF Viewer Native + Mobile Support */}
                        <div className={activeTab === 'materi' ? 'block animate-in fade-in' : 'hidden'}>
                            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl p-3 sm:p-4 shadow-sm border border-gray-200/50 dark:border-gray-800/50 flex flex-col min-h-[600px] sm:min-h-[800px]">

                                {/* Toolbar Top (Navigasi Halaman + Opsi 2 Download/Buka) */}
                                <div className="flex flex-wrap items-center justify-between gap-3 p-3 mb-3 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-200/60 dark:border-gray-700/60">
                                    {/* Navigasi Halaman */}
                                    <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
                                        <button
                                            disabled={pageNumber <= 1}
                                            onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
                                            className="p-1.5 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-40 transition shadow-sm"
                                        >
                                            <ChevronLeft size={18} />
                                        </button>
                                        <span>
                                            Halaman {pageNumber} dari {numPages || '--'}
                                        </span>
                                        <button
                                            disabled={pageNumber >= (numPages || 1)}
                                            onClick={() => setPageNumber(prev => Math.min(prev + 1, numPages || 1))}
                                            className="p-1.5 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-40 transition shadow-sm"
                                        >
                                            <ChevronRight size={18} />
                                        </button>
                                    </div>

                                    {/* Opsi 2: Tombol Buka di Tab Baru / Download */}
                                    <a
                                        href={materi.file_pdf}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all active:scale-95"
                                    >
                                        <ExternalLink size={16} />
                                        <span>Buka Tab Baru / Unduh</span>
                                    </a>
                                </div>

                                {/* Opsi 3: React PDF Viewer Canvas */}
                                <div
                                    ref={pdfContainerRef}
                                    className="flex-1 w-full bg-gray-100 dark:bg-gray-950 rounded-2xl overflow-auto p-2 sm:p-4 flex justify-center items-start border border-gray-200 dark:border-gray-800"
                                >
                                    <Document
                                        file={materi.file_pdf}
                                        onLoadSuccess={onDocumentLoadSuccess}
                                        loading={
                                            <div className="flex items-center gap-2 py-20 text-sm text-gray-500 font-medium">
                                                <Loader2 size={20} className="animate-spin text-blue-500" /> Memuat PDF...
                                            </div>
                                        }
                                        error={
                                            <div className="text-center p-6 text-red-500 text-sm flex flex-col items-center gap-2">
                                                <p>Gagal memuat dokumen langsung di dalam aplikasi.</p>
                                                <a
                                                    href={materi.file_pdf}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="underline text-blue-600 font-semibold"
                                                >
                                                    Klik di sini untuk membuka PDF secara langsung
                                                </a>
                                            </div>
                                        }
                                    >
                                        {containerWidth > 0 && (
                                            <Page
                                                pageNumber={pageNumber}
                                                width={containerWidth ? Math.min(containerWidth - 24, 800) : undefined}
                                                renderAnnotationLayer={false}
                                                renderTextLayer={false}
                                                className="shadow-lg rounded-xl overflow-hidden"
                                            />
                                        )}
                                    </Document>
                                </div>

                            </div>
                        </div>

                        <div className={activeTab === 'tugas' ? 'block animate-in fade-in' : 'hidden'}>
                            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl p-8 shadow-sm border border-gray-200/50 dark:border-gray-800/50 flex flex-col items-center text-center">
                                <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-6">
                                    <FileCheck2 size={40} className="text-blue-500" />
                                </div>
                                <h2 className="text-2xl font-bold mb-4">Pengumpulan Tugas</h2>
                                <p className="text-gray-600 dark:text-gray-400 max-w-lg mb-8">
                                    Silakan unggah foto bukti rangkuman materi yang telah ditulis di buku catatan Anda.
                                    Pastikan NIM yang Anda masukkan sesuai dengan data pendaftaran PKKMB.
                                </p>
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-600/30 transition-all active:scale-95 flex items-center gap-2"
                                >
                                    <Upload size={20} /> Isi Tugas
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Content (SamsMateriBot) */}
                    {activeTab === 'materi' && (
                        <div className={`${isMobile ? 'w-full' : 'w-1/3 shrink-0 sticky top-24 h-[calc(100vh-8rem)]'}`}>
                            <SamsMateriBot materiContext={`Materi: ${materi.judul}. Pemateri: ${materi.pemateri}`} isMobile={isMobile} />
                        </div>
                    )}
                </div>

                {/* Modal Upload Tugas */}
                {showModal && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                        <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
                            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                <h3 className="font-bold text-lg">Kumpulkan Tugas</h3>
                                <button onClick={() => setShowModal(false)} className="p-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500">
                                    <X size={18} />
                                </button>
                            </div>
                            <form onSubmit={handleTugasSubmit} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">Nama Lengkap *</label>
                                    <input required type="text" value={tugasForm.nama} onChange={e => setTugasForm({ ...tugasForm, nama: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-blue-500" placeholder="Masukkan nama Anda" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">NIM *</label>
                                    <input required type="text" value={tugasForm.nim} onChange={e => setTugasForm({ ...tugasForm, nim: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-blue-500" placeholder="Masukkan NIM terdaftar" />
                                    <p className="text-[11px] text-gray-500 mt-1">*Sistem akan memvalidasi NIM Anda dengan data pendaftaran PKKMB.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">Kampus *</label>
                                    <input required type="text" value={tugasForm.kampus} onChange={e => setTugasForm({ ...tugasForm, kampus: e.target.value })} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-blue-500" placeholder="Contoh: UNIKOM" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">Foto Rangkuman *</label>
                                    <div className="relative border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                        <input required type="file" accept="image/*" onChange={e => setTugasFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                        <div className="text-gray-500 text-sm flex flex-col items-center">
                                            <Upload size={24} className="mb-2 text-blue-500" />
                                            {tugasFile ? tugasFile.name : 'Klik atau seret gambar ke sini'}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-600/30 transition-all flex justify-center items-center gap-2 mt-4"
                                >
                                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Kirim Tugas'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </PengembangBarrier>
        </main>
    );
}