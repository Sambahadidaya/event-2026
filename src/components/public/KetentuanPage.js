'use client';

import { useState, useEffect, useRef } from 'react';
import { getTheme } from '@/lib/siteThemes';
import { Menu, X, Video, FileText, ChevronRight, Download, Loader2 } from 'lucide-react';
import { downloadKetentuanPdfAction, getSecureVideoDownloadAction } from '@/api/logic/panduanPdfAction';

export default function KetentuanPage({ site, data }) {
    const theme = getTheme(site);
    const [activeSection, setActiveSection] = useState(data.sections[0]?.id || '');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [pdfProgress, setPdfProgress] = useState(0);
    const [pdfSpeed, setPdfSpeed] = useState('');
    const [pdfStatus, setPdfStatus] = useState('');
    const [videoLoadingId, setVideoLoadingId] = useState(null);
    const observer = useRef(null);

    // Secure Video Download Handler with Server-Side Validation
    const handleDownloadVideo = async (youtubeId) => {
        if (!youtubeId || youtubeId === 'kosong' || videoLoadingId) return;
        setVideoLoadingId(youtubeId);
        try {
            const res = await getSecureVideoDownloadAction(site, youtubeId);
            if (!res || !res.success) {
                alert(res?.error || 'Gagal memproses otorisasi video.');
                return;
            }

            // Auto-copy URL to clipboard
            if (res.videoUrl) {
                try {
                    await navigator.clipboard?.writeText(res.videoUrl);
                } catch (_) {}
            }

            // Open verified target URL in new tab
            window.open(res.targetUrl || 'https://y2mate.gs/', '_blank', 'noopener,noreferrer');
        } catch (err) {
            console.error('Error in video download authorization:', err);
            alert('Terjadi kesalahan saat memproses unduhan video.');
        } finally {
            setVideoLoadingId(null);
        }
    };

    // Download PDF Handler with realistic progress, network speed & Print Preview
    const handleDownloadPdf = async () => {
        if (isGeneratingPdf) return;
        setIsGeneratingPdf(true);
        setPdfProgress(8);
        setPdfSpeed('720 KB/s');
        setPdfStatus('Menyiapkan...');

        let currentProgress = 8;
        const speedList = ['1.2 MB/s', '1.8 MB/s', '2.4 MB/s', '1.9 MB/s', '2.8 MB/s', '3.2 MB/s', '2.1 MB/s'];
        const interval = setInterval(() => {
            if (currentProgress < 90) {
                const step = Math.max(1, Math.floor((90 - currentProgress) / 7));
                currentProgress += step;
                setPdfProgress(currentProgress);

                const randomSpeed = speedList[Math.floor(Math.random() * speedList.length)];
                setPdfSpeed(randomSpeed);

                if (currentProgress < 35) {
                    setPdfStatus('Menghubungkan...');
                } else if (currentProgress < 75) {
                    setPdfStatus('Merender Halaman...');
                } else {
                    setPdfStatus('Menyiapkan Pratinjau...');
                }
            }
        }, 160);

        try {
            const res = await downloadKetentuanPdfAction(site);
            clearInterval(interval);

            if (!res || !res.success) {
                throw new Error(res?.error || 'Gagal membuat dokumen PDF');
            }

            setPdfProgress(100);
            setPdfSpeed('Selesai');
            setPdfStatus('Membuka Pratinjau...');

            // Convert base64 to Blob & open Print Preview
            const byteCharacters = atob(res.base64Pdf);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/pdf' });

            const url = window.URL.createObjectURL(blob);

            // Buka di tab baru untuk Print Preview bawaan browser (tersedia fitur Print & Download)
            const previewWindow = window.open(url, '_blank');
            if (!previewWindow) {
                // Fallback jika popup dicegah browser
                const a = document.createElement('a');
                a.href = url;
                const siteLabel = site ? site.toUpperCase() : 'PORTAL';
                a.download = `Ketentuan_${siteLabel}_2026_${new Date().toISOString().split('T')[0]}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            }
        } catch (err) {
            clearInterval(interval);
            console.error('Download PDF Error:', err);
            alert(`Terjadi kesalahan saat memproses PDF: ${err.message}`);
        } finally {
            setTimeout(() => {
                setIsGeneratingPdf(false);
                setPdfProgress(0);
                setPdfSpeed('');
                setPdfStatus('');
            }, 1000);
        }
    };

    // Smooth scroll to element
    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            const yOffset = -90; // offset for sticky header
            const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
            setActiveSection(id);
            setSidebarOpen(false);
        }
    };

    // Set up IntersectionObserver to highlight current section as user scrolls
    useEffect(() => {
        const handleIntersect = (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                }
            });
        };

        observer.current = new IntersectionObserver(handleIntersect, {
            root: null,
            rootMargin: '-20% 0px -60% 0px', // trigger when section is in the middle of viewport
            threshold: 0
        });

        data.sections.forEach((section) => {
            const el = document.getElementById(section.id);
            if (el) observer.current.observe(el);

            if (section.subsections) {
                section.subsections.forEach((sub) => {
                    const subEl = document.getElementById(sub.id);
                    if (subEl) observer.current.observe(subEl);
                });
            }
        });

        return () => {
            if (observer.current) {
                observer.current.disconnect();
            }
        };
    }, [data.sections]);

    // Format display title if section is a subsection
    const getActiveTitle = () => {
        for (const section of data.sections) {
            if (section.id === activeSection) return section.title;
            if (section.subsections) {
                const sub = section.subsections.find(s => s.id === activeSection);
                if (sub) return `${section.title} - ${sub.title}`;
            }
        }
        return 'Ketentuan';
    };

    return (
        <div className={`min-h-screen pb-16 ${theme.sectionBase}`}>
            {/* Header Area */}
            <div className="py-12 bg-gradient-to-b from-white/80 via-white/50 to-transparent dark:from-slate-900/80 dark:via-slate-900/50 dark:to-transparent border-b border-gray-100 dark:border-slate-800/50">
                <div className="max-w-6xl mx-auto px-4">
                    <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border mb-4 ${theme.badge}`}>
                        Syarat & Ketentuan
                    </span>
                    <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
                        Syarat & Ketentuan {site.toUpperCase()} 2026
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm md:text-base max-w-2xl">
                        Bacalah dengan seksama aturan resmi, tata tertib kegiatan, prosedur registrasi, serta komitmen kami terhadap perlindungan data Anda.
                    </p>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-6xl mx-auto px-4 mt-8 relative">

                {/* Mobile Second Navbar Button */}
                <div className="md:hidden sticky top-20 z-30 mb-6 flex justify-between items-center gap-2 p-2.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-gray-100 dark:border-slate-800 rounded-2xl shadow-md transition-all">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="flex items-center gap-1.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-gray-950 dark:hover:text-white transition-colors shrink-0"
                    >
                        <Menu size={16} />
                        Menu Ketentuan
                    </button>

                    <div className="flex items-center gap-2 min-w-0">
                        {/* Mobile PDF Download Button */}
                        <button
                            type="button"
                            onClick={handleDownloadPdf}
                            disabled={isGeneratingPdf}
                            className={`relative overflow-hidden px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-xs border shrink-0 ${
                                isGeneratingPdf
                                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 cursor-not-allowed min-w-[155px]'
                                    : 'bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-slate-700 active:scale-95'
                            }`}
                            title={isGeneratingPdf ? `${pdfStatus} (${pdfSpeed}) - ${pdfProgress}%` : "Pratinjau & Download PDF Ketentuan"}
                        >
                            {isGeneratingPdf ? (
                                <div className="flex items-center justify-between w-full gap-1.5 z-10">
                                    <span className="flex items-center gap-1 text-[10px] truncate text-blue-600 dark:text-blue-400 font-medium">
                                        <Loader2 size={12} className="animate-spin shrink-0 text-blue-500" />
                                        <span className="truncate max-w-[65px]">{pdfStatus || 'Memproses...'}</span>
                                        <span className="font-mono text-[9px] text-gray-400 shrink-0">({pdfSpeed})</span>
                                    </span>
                                    <span className="font-mono text-[10px] font-extrabold text-blue-600 dark:text-blue-400 shrink-0">
                                        {pdfProgress}%
                                    </span>
                                </div>
                            ) : (
                                <>
                                    <Download size={13} className="text-blue-600 dark:text-blue-400 shrink-0" />
                                    <span>Cetak PDF</span>
                                </>
                            )}
                            {isGeneratingPdf && (
                                <div
                                    className="absolute bottom-0 left-0 top-0 bg-blue-500/15 dark:bg-blue-400/25 transition-all duration-200 pointer-events-none"
                                    style={{ width: `${pdfProgress}%` }}
                                />
                            )}
                        </button>

                        <span className="text-[11px] font-semibold text-gray-400 capitalize bg-gray-50 dark:bg-slate-800 px-2.5 py-1 rounded-full truncate max-w-[110px]">
                            {getActiveTitle()}
                        </span>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-8">

                    {/* Desktop Sidebar (Left Navbar, max-h-80vh, scrollable) */}
                    <aside className="hidden md:block w-64 shrink-0 self-start sticky top-24">
                        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 rounded-3xl p-4 shadow-sm space-y-3 max-h-[80vh] overflow-y-auto scrollbar-thin">
                            <div className="flex items-center justify-between px-3">
                                <h2 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                                    Daftar Isi
                                </h2>
                                {/* Desktop PDF Download Button */}
                                <button
                                    type="button"
                                    onClick={handleDownloadPdf}
                                    disabled={isGeneratingPdf}
                                    className={`relative overflow-hidden px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-xs border ${
                                        isGeneratingPdf
                                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 cursor-not-allowed min-w-[160px]'
                                            : 'bg-gray-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-600 dark:hover:text-blue-400 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-slate-700 active:scale-95'
                                    }`}
                                    title={isGeneratingPdf ? `${pdfStatus} (${pdfSpeed}) - ${pdfProgress}%` : "Pratinjau & Download Dokumen PDF Ketentuan"}
                                >
                                    {isGeneratingPdf ? (
                                        <div className="flex items-center justify-between w-full gap-2 z-10">
                                            <span className="flex items-center gap-1.5 truncate text-[10px] text-gray-600 dark:text-gray-300">
                                                <Loader2 size={12} className="animate-spin text-blue-500 shrink-0" />
                                                <span className="truncate max-w-[65px]">{pdfStatus || 'Memproses...'}</span>
                                                <span className="font-mono text-blue-600 dark:text-blue-400 font-bold shrink-0">({pdfSpeed})</span>
                                            </span>
                                            <span className="font-mono text-[10px] font-extrabold text-blue-600 dark:text-blue-400 shrink-0">
                                                {pdfProgress}%
                                            </span>
                                        </div>
                                    ) : (
                                        <>
                                            <Download size={13} className="text-blue-600 dark:text-blue-400 shrink-0" />
                                            <span>Cetak PDF</span>
                                        </>
                                    )}
                                    {isGeneratingPdf && (
                                        <div
                                            className="absolute bottom-0 left-0 top-0 bg-blue-500/15 dark:bg-blue-400/25 transition-all duration-200 pointer-events-none"
                                            style={{ width: `${pdfProgress}%` }}
                                        />
                                    )}
                                </button>
                            </div>
                            <div className="space-y-1">
                                {data.sections.map((section) => {
                                    const isParentActive = activeSection === section.id || (section.subsections && section.subsections.some(sub => activeSection === sub.id));

                                    return (
                                        <div key={section.id} className="space-y-1">
                                            <button
                                                onClick={() => scrollToSection(section.id)}
                                                className={`w-full flex items-center justify-between text-left px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all group ${isParentActive
                                                        ? `bg-gradient-to-r ${theme.gradient} text-white shadow-md shadow-slate-900/5`
                                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/40 hover:text-gray-900 dark:hover:text-white'
                                                    }`}
                                            >
                                                <span className="truncate">{section.title}</span>
                                                <ChevronRight size={14} className={`transition-transform duration-200 ${isParentActive ? 'rotate-90 text-white' : 'opacity-0 group-hover:opacity-100 text-gray-400'}`} />
                                            </button>

                                            {/* Subsections List (ul/li nested list) */}
                                            {section.subsections && (
                                                <ul className="pl-3 pr-1 py-1 space-y-1 border-l border-gray-200 dark:border-slate-800 ml-4 animate-in slide-in-from-top-1 duration-250">
                                                    {section.subsections.map((sub) => (
                                                        <li key={sub.id}>
                                                            <button
                                                                onClick={() => scrollToSection(sub.id)}
                                                                className={`w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all truncate block ${activeSection === sub.id
                                                                        ? 'text-orange-600 dark:text-orange-400 bg-orange-50/50 dark:bg-orange-950/20'
                                                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                                                    }`}
                                                            >
                                                                {sub.title}
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </aside>

                    {/* Mobile Sidebar Drawer (Menu Ketentuan absolut bawah header top-16) */}
                    {sidebarOpen && (
                        <div className="fixed inset-0 z-50 md:hidden animate-in fade-in duration-200">
                            {/* Backdrop overlay */}
                            <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setSidebarOpen(false)} />

                            {/* Left drawer panel - positioned under header top-16 */}
                            <div className="absolute top-16 left-0 bottom-0 w-72 bg-white dark:bg-slate-900 shadow-2xl p-6 flex flex-col justify-between animate-in slide-in-from-left duration-300">
                                <div className="space-y-6 flex-1 flex flex-col min-h-0">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-xs font-black uppercase tracking-wider text-gray-400">
                                            Menu Ketentuan
                                        </h2>
                                        <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500">
                                            <X size={18} />
                                        </button>
                                    </div>
                                    <nav className="space-y-3 overflow-y-auto flex-1 pr-1 scrollbar-thin">
                                        {data.sections.map((section) => {
                                            const isParentActive = activeSection === section.id || (section.subsections && section.subsections.some(sub => activeSection === sub.id));

                                            return (
                                                <div key={section.id} className="space-y-1">
                                                    <button
                                                        onClick={() => scrollToSection(section.id)}
                                                        className={`w-full flex items-center justify-between text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${isParentActive
                                                                ? `bg-gradient-to-r ${theme.gradient} text-white shadow-md`
                                                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-55 dark:hover:bg-slate-800'
                                                            }`}
                                                    >
                                                        <span>{section.title}</span>
                                                        <ChevronRight size={14} className={isParentActive ? 'rotate-90 text-white' : ''} />
                                                    </button>

                                                    {/* Mobile Nested Subsections List */}
                                                    {section.subsections && (
                                                        <ul className="pl-3 py-1 space-y-1 border-l border-gray-200 dark:border-slate-800 ml-4">
                                                            {section.subsections.map((sub) => (
                                                                <li key={sub.id}>
                                                                    <button
                                                                        onClick={() => scrollToSection(sub.id)}
                                                                        className={`w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-bold block ${activeSection === sub.id
                                                                                ? 'text-orange-600 dark:text-orange-400 bg-orange-50/50 dark:bg-orange-950/20'
                                                                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                                                            }`}
                                                                    >
                                                                        {sub.title}
                                                                    </button>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </nav>
                                </div>
                                <div className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest pt-4 border-t border-gray-100 dark:border-slate-800 shrink-0">
                                    Politeknik LP3I 2026
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Content Section (Right Pane) */}
                    <div className="flex-1 space-y-8">
                        {data.sections.map((section) => (
                            <section
                                key={section.id}
                                id={section.id}
                                className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-xs scroll-mt-24 transition-all duration-300 hover:border-gray-200/80 dark:hover:border-slate-800"
                            >
                                <div className="flex items-center gap-2.5 mb-5">
                                    <div className={`p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800`}>
                                        <FileText size={18} className="text-gray-700 dark:text-gray-300" />
                                    </div>
                                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                                        {section.title}
                                    </h2>
                                </div>

                                <div className="text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed space-y-4 whitespace-pre-line">
                                    {section.content}
                                </div>

                                {/* Render Subsections in right pane */}
                                {section.subsections && (
                                    <div className="mt-8 space-y-8 border-t border-gray-100 dark:border-slate-850 pt-8">
                                        {section.subsections.map((sub) => (
                                            <div key={sub.id} id={sub.id} className="scroll-mt-24 space-y-3">
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                    <span className="w-1.5 h-4 bg-orange-500 rounded-full"></span>
                                                    {sub.title}
                                                </h3>
                                                <div className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line pl-3.5">
                                                    {sub.content}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Videos Render */}
                                {section.videos && section.videos.length > 0 && (
                                    <div className="mt-8 space-y-4">
                                        <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                                            <Video size={14} />
                                            Tonton Panduan Video
                                        </h3>
                                        <div className="grid grid-cols-1 gap-6">
                                            {section.videos.map((vid, idx) => (
                                                <div key={idx} className="space-y-2.5">
                                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                                        <p className="text-xs font-bold text-gray-700 dark:text-gray-200">
                                                            {vid.title}
                                                        </p>
                                                        {vid.youtubeId && vid.youtubeId !== 'kosong' && (
                                                            <button
                                                                type="button"
                                                                disabled={videoLoadingId === vid.youtubeId}
                                                                onClick={() => handleDownloadVideo(vid.youtubeId)}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 transition-all active:scale-95 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                                                title="Validasi Server & Buka Y2Mate (https://y2mate.gs/)"
                                                            >
                                                                {videoLoadingId === vid.youtubeId ? (
                                                                    <>
                                                                        <Loader2 size={12} className="animate-spin text-rose-500" />
                                                                        <span>Memvalidasi...</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Download size={12} />
                                                                        <span>Download Video (Y2Mate)</span>
                                                                    </>
                                                                )}
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="relative aspect-video rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800 bg-black">
                                                        <iframe
                                                            className="absolute inset-0 w-full h-full"
                                                            src={`https://www.youtube.com/embed/${vid.youtubeId}`}
                                                            title={vid.title}
                                                            frameBorder="0"
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                            allowFullScreen
                                                        ></iframe>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </section>
                        ))}
                    </div>

                </div>
            </div>
        </div>
    );
}
