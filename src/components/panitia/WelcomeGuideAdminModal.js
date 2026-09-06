'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sparkles, CheckCircle2, ArrowRight, X, Play, Loader2, Compass, BookOpen } from 'lucide-react';
import { getWelcomeGuideAdminConfig, shouldShowWelcomeGuideAdmin, markWelcomeGuideAdminAsSeen } from '@/api/logic/welcomeGuideAdminLogic';
import { shouldShowUpdateAdminPopup } from '@/api/logic/updateVersionAdminLogic';

export default function WelcomeGuideAdminModal({ site }) {
    const [isOpen, setIsOpen] = useState(false);
    const [config, setConfig] = useState(null);
    const [loadingIframe, setLoadingIframe] = useState(true);
    const pathname = usePathname();
    const router = useRouter();
    const pollIntervalRef = useRef(null);

    useEffect(() => {
        const guideData = getWelcomeGuideAdminConfig(site, pathname);
        if (!guideData) {
            setIsOpen(false);
            setConfig(null);
            return;
        }

        setConfig(guideData);
        setLoadingIframe(true);

        if (!shouldShowWelcomeGuideAdmin(site, pathname)) {
            setIsOpen(false);
            return;
        }

        // Fungsi untuk memicu pembukaan modal panduan
        const triggerOpen = () => {
            setIsOpen(true);
        };

        // Jika ada UpdateVersionAdminModal yang sedang aktif/akan tampil, tunggu sampai modal tersebut ditutup user
        if (shouldShowUpdateAdminPopup(site)) {
            pollIntervalRef.current = setInterval(() => {
                if (!shouldShowUpdateAdminPopup(site)) {
                    clearInterval(pollIntervalRef.current);
                    pollIntervalRef.current = null;
                    // Beri jeda halus setelah UpdateVersionAdminModal ditutup
                    setTimeout(triggerOpen, 600);
                }
            }, 500);
        } else {
            // Delay 2 detik sebelum memunculkan modal agar halaman termuat dengan tenang
            const timer = setTimeout(triggerOpen, 2000);
            return () => clearTimeout(timer);
        }

        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
            }
        };
    }, [site, pathname]);

    // Lock body scroll saat modal terbuka
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen || !config) return null;

    const handleDismiss = () => {
        markWelcomeGuideAdminAsSeen(site, pathname);
        setIsOpen(false);
    };

    const handleViewGuide = () => {
        markWelcomeGuideAdminAsSeen(site, pathname);
        setIsOpen(false);
        if (config.ctaHref) {
            const el = document.getElementById('admin-pkkmb-overview') || document.getElementById('admin-pose-overview');
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                router.push(config.ctaHref);
            }
        }
    };

    const hasVideo = Boolean(config.youtubeId && config.youtubeId !== 'kosong');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 transition-none md:transition-opacity md:duration-300 md:animate-in md:fade-in">
            {/* Backdrop Overlay */}
            <div
                className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xs"
                onClick={handleDismiss}
            />

            {/* Modal Container */}
            <div
                className={`relative w-full ${hasVideo ? 'max-w-3xl lg:max-w-4xl' : 'max-w-lg'} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 transition-none md:transition-all md:duration-300 md:animate-in md:zoom-95 flex flex-col text-slate-900 dark:text-slate-100 max-h-[90vh]`}
            >
                {/* Header Section */}
                <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 dark:border-slate-800/80 flex items-start justify-between bg-slate-50/70 dark:bg-slate-900/60 shrink-0">
                    <div className="space-y-1 pr-4">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider text-white shadow-sm ${site === 'pose' ? 'bg-gradient-to-r from-orange-500 to-amber-500' : 'bg-gradient-to-r from-blue-600 to-cyan-600'}`}>
                                <Compass size={12} className="shrink-0" />
                                Panduan Panitia {site ? site.toUpperCase() : ''}
                            </span>
                            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                                Versi {config.currentVersion}
                            </span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-snug">
                            {config.title}
                        </h3>
                        {config.subtitle && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                {config.subtitle}
                            </p>
                        )}
                    </div>

                    <button
                        onClick={handleDismiss}
                        className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                        aria-label="Tutup modal panduan admin"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body Content */}
                <div className="p-5 sm:p-6 overflow-y-auto flex-1">
                    {hasVideo ? (
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-6 items-start">
                            {/* Video Guide Section */}
                            <div className="md:col-span-7 space-y-2 order-1">
                                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                                    <span className="flex items-center gap-1.5">
                                        <Play size={13} className={site === 'pose' ? 'text-orange-500' : 'text-blue-500'} />
                                        Video Tutorial Admin
                                    </span>
                                    <span className="text-[11px] font-normal text-slate-400">Putar langsung</span>
                                </div>

                                <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-200/80 dark:border-slate-800 shadow-inner">
                                    {loadingIframe && (
                                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xs text-white">
                                            <Loader2 size={32} className={`animate-spin mb-2 ${site === 'pose' ? 'text-orange-500' : 'text-blue-500'}`} />
                                            <span className="text-xs font-semibold text-slate-300">Memuat Video...</span>
                                        </div>
                                    )}
                                    <iframe
                                        src={`https://www.youtube.com/embed/${config.youtubeId}?autoplay=0&rel=0&modestbranding=1`}
                                        title={config.title}
                                        className="w-full h-full"
                                        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowFullScreen
                                        onLoad={() => setLoadingIframe(false)}
                                    />
                                </div>
                            </div>

                            {/* Text Highlights Section */}
                            <div className="md:col-span-5 space-y-3.5 order-2 flex flex-col justify-between">
                                <div className="space-y-2.5">
                                    <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                                        {config.greeting}
                                    </p>
                                    <div className="space-y-2 pt-1">
                                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                            Petunjuk Utama Divisi:
                                        </p>
                                        <ul className="space-y-2">
                                            {config.highlights.map((item, idx) => (
                                                <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                                                    <CheckCircle2
                                                        size={15}
                                                        className={`shrink-0 mt-0.5 ${site === 'pose' ? 'text-orange-500' : 'text-blue-500'}`}
                                                    />
                                                    <span className="leading-snug">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Single Column Layout bila tanpa video */
                        <div className="space-y-4">
                            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                {config.greeting}
                            </p>

                            <div className="space-y-2.5 pt-1">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    Arahan & Prosedur Divisi:
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {config.highlights.map((item, idx) => (
                                        <div
                                            key={idx}
                                            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start gap-2.5"
                                        >
                                            <CheckCircle2
                                                size={16}
                                                className={`shrink-0 mt-0.5 ${site === 'pose' ? 'text-orange-500' : 'text-blue-500'}`}
                                            />
                                            <span className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
                                                {item}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Section */}
                <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/60 flex flex-col sm:flex-row items-center justify-end gap-2.5 shrink-0">
                    <button
                        onClick={handleDismiss}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-200/80 dark:border-slate-700 shadow-2xs cursor-pointer"
                    >
                        Tutup Sambutan
                    </button>
                    {config.ctaHref && (
                        <button
                            onClick={handleViewGuide}
                            className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer ${site === 'pose' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            <span>{config.ctaLabel || 'Buka Panduan'}</span>
                            <ArrowRight size={14} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
