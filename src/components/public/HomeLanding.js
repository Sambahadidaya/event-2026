'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import * as LucideIcons from 'lucide-react';
import { getTheme } from '@/lib/siteThemes';
import WaveDivider from '@/components/public/WaveDivider';
import Carousel from '@/components/public/Carousel';

/**
 * =========================================================================================
 * KONFIGURASI STATUS TAMPILAN LOGO PKKMB 2026
 * =========================================================================================
 * Ubah nilai variabel `IS_PKKMB_LOGO_REVEALED` di bawah ini untuk mengontrol tampilan Logo PKKMB:
 * 
 * 📌 PANDUAN CARA MENGONTROL STATUS LOGO PKKMB:
 * 
 * 1. MENSAMARKAN / MENGUNCI LOGO (Ketika Logo Belum Dirilis / Belum Boleh Dilihat):
 *    Set -> const IS_PKKMB_LOGO_REVEALED = false;
 *    - Div Logo PKKMB di Hero section akan disamarkan (Blur & Opacity rendah).
 *    - Tampil Overlay Icon Mata Tertutup (EyeOff) & Tulisan "Belum Bisa Dilihat".
 *    - Tombol "Lihat Filosofi Logo" akan TERKUNCI / DISABLED (tidak bisa diklik).
 * 
 * 2. MEMBUKA / MENGAKTIFKAN LOGO (Ketika Logo Sudah Resmi Dirilis):
 *    Set -> const IS_PKKMB_LOGO_REVEALED = true;
 *    - Div Logo PKKMB akan tampil tajam & jernih secara normal.
 *    - Overlay icon mata tertutup otomatis hilang.
 *    - Tombol "Lihat Filosofi Logo" BISA DIKLIK untuk membuka Modal Filosofi Logo.
 * =========================================================================================
 */
const IS_PKKMB_LOGO_REVEALED = true;

// Get Lucide Icon Component dynamically from serialized name
const getLucideIcon = (name) => {
    return LucideIcons[name] || LucideIcons.HelpCircle;
};

// Custom Hook for Number Counting Animation
const useCountUp = (endValue, trigger) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!trigger || endValue === 0) return;
        let start = 0;
        const duration = 5000;
        const increment = Math.ceil(endValue / (duration / 30));

        const timer = setInterval(() => {
            start += increment;
            if (start >= endValue) {
                setCount(endValue);
                clearInterval(timer);
            } else {
                setCount(start);
            }
        }, 30);

        return () => clearInterval(timer);
    }, [endValue, trigger]);

    return count;
};

// Scroll Reveal Wrapper
const RevealWrapper = ({ children, delay = 0, className = "" }) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
                observer.disconnect();
            }
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            className={`transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'} ${className}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
};

const StatCard = ({ stat, theme }) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef(null);

    const match = stat.value.match(/^(\d+)(.*)$/);
    const isSingleNumber = match && !match[2].includes('–') && !match[2].includes('-');

    const endValue = isSingleNumber ? parseInt(match[1], 10) : 0;
    const suffix = isSingleNumber ? match[2] : stat.value;

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
                observer.disconnect();
            }
        }, { threshold: 0.1 });

        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    const count = useCountUp(endValue, isVisible);
    const IconComponent = getLucideIcon(stat.iconName);

    return (
        <div ref={ref} className="glass rounded-[2rem] p-8 text-center hover:-translate-y-2 transition-all duration-500 hover:shadow-2xl hover:shadow-black/5 group border border-white/40 dark:border-white/10">
            <div className="w-14 h-14 rounded-full mx-auto mb-5 flex items-center justify-center bg-white/50 dark:bg-slate-800/50 border border-gray-200 dark:border-white/10 group-hover:scale-110 transition-transform duration-500 shadow-sm">
                <IconComponent size={24} className="text-gray-700 dark:text-gray-300" />
            </div>
            <p className="text-3xl md:text-4xl font-black mb-2 tracking-tight text-gray-900 dark:text-white">
                {isSingleNumber ? `${count}${suffix}` : stat.value}
            </p>
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-[0.15em]">
                {stat.label}
            </p>
        </div>
    );
};

// Philosophy Modal Component
// PhilosophyModal Component (Versi Perbaikan Layout & Scroll)
const PhilosophyModal = ({ isOpen, onClose, type, theme, logoSlides, mascotInfo, isPkkmb }) => {
    const [slideIndex, setSlideIndex] = useState(0);
    const touchStartX = useRef(null);
    const touchEndX = useRef(null);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setSlideIndex(0);
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    const isLogo = type === 'logo';
    const slides = logoSlides || [];
    const currentData = isLogo ? slides[slideIndex] : mascotInfo;

    if (!currentData) return null;

    const nextSlide = () => {
        if (isLogo && slides.length > 1) setSlideIndex((prev) => (prev + 1) % slides.length);
    };

    const prevSlide = () => {
        if (isLogo && slides.length > 1) setSlideIndex((prev) => (prev - 1 + slides.length) % slides.length);
    };

    const handleTouchStart = (e) => {
        touchStartX.current = e.targetTouches[0].clientX;
    };
    const handleTouchMove = (e) => {
        touchEndX.current = e.targetTouches[0].clientX;
    };
    const handleTouchEnd = () => {
        if (!touchStartX.current || !touchEndX.current) return;
        const diff = touchStartX.current - touchEndX.current;
        if (diff > 50) nextSlide();
        if (diff < -50) prevSlide();
        touchStartX.current = null;
        touchEndX.current = null;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal Container: Mengunci tinggi tetap konsisten pada Desktop (h-[80vh] / h-[600px]) */}
            <div className="relative w-full max-w-4xl h-[85vh] md:h-[600px] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col md:flex-row">

                {/* Image Section: Ukuran disesuaikan agar proporsional di Mobile */}
                <div
                    className="relative w-full md:w-1/2 h-48 sm:h-64 md:h-full p-4 md:p-12 flex items-center justify-center bg-gray-50 dark:bg-slate-800/50 shrink-0"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <div className="relative w-full h-full max-h-[180px] sm:max-h-[220px] md:max-h-full aspect-square flex items-center justify-center">
                        <Image
                            src={currentData.image}
                            alt={currentData.title}
                            fill
                            className="object-contain drop-shadow-xl"
                            priority
                        />
                    </div>

                    {isLogo && slides.length > 1 && (
                        <>
                            <button onClick={prevSlide} className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 dark:bg-slate-800/80 hover:bg-white text-gray-800 dark:text-white shadow-lg backdrop-blur-sm transition-all hover:scale-110">
                                <LucideIcons.ChevronLeft size={20} />
                            </button>
                            <button onClick={nextSlide} className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 dark:bg-slate-800/80 hover:bg-white text-gray-800 dark:text-white shadow-lg backdrop-blur-sm transition-all hover:scale-110">
                                <LucideIcons.ChevronRight size={20} />
                            </button>

                            {/* Slide Indicators */}
                            <div className="absolute bottom-2 md:bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                {slides.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSlideIndex(idx)}
                                        aria-label={`Go to slide ${idx + 1}`}
                                        className={`h-2 rounded-full transition-all cursor-pointer ${idx === slideIndex ? 'bg-blue-600 w-6' : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 w-2'}`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Content Section: Diberi h-full & overflow-y-auto agar judul & teks tidak pernah terpotong */}
                <div className="w-full md:w-1/2 p-6 md:p-12 flex flex-col justify-start md:justify-center relative overflow-y-auto min-h-0 flex-1">
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 transition-colors z-10">
                        <LucideIcons.X size={24} />
                    </button>

                    <div>
                        <span className={`inline-block px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-full w-fit mb-3 border ${theme.badge}`}>
                            Filosofi {isLogo ? 'Logo' : 'Maskot'}
                        </span>
                        <h3 className="text-xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-4 leading-tight pr-6">
                            {currentData.title}
                        </h3>

                        {/* Menambahkan whitespace-pre-line agar \n berfungsi & teks aman discroll */}
                        <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base leading-relaxed font-serif italic whitespace-pre-line">
                            "{currentData.desc}"
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Poster Modal Component
const PosterModal = ({ isOpen, onClose, lomba, theme }) => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const modalRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
            setIsFullscreen(false);
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen || !lomba) return null;

    const posterSrc = lomba.poster ? (typeof lomba.poster === 'string' ? lomba.poster : lomba.poster.src) : null;

    const handleDownload = async () => {
        if (!posterSrc) return;
        try {
            const response = await fetch(posterSrc);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Poster_${lomba.nama.replace(/\s+/g, '_')}.webp`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            const a = document.createElement('a');
            a.href = posterSrc;
            a.target = '_blank';
            a.download = `Poster_${lomba.nama.replace(/\s+/g, '_')}`;
            a.click();
        }
    };

    const toggleFullscreen = () => {
        if (!isFullscreen) {
            setIsFullscreen(true);
            if (modalRef.current && modalRef.current.requestFullscreen) {
                modalRef.current.requestFullscreen().catch(() => { });
            }
        } else {
            setIsFullscreen(false);
            if (document.fullscreenElement && document.exitFullscreen) {
                document.exitFullscreen().catch(() => { });
            }
        }
    };

    return (
        <div ref={modalRef} className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-300 ${isFullscreen ? 'bg-black/95 p-0' : ''}`}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
            <div className={`relative w-full ${isFullscreen ? 'max-w-none h-full rounded-none border-none' : 'max-w-2xl max-h-[90vh] rounded-3xl shadow-2xl border border-white/20'} bg-white dark:bg-slate-900 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col z-10 transition-all duration-300`}>
                {/* Header */}
                <div className="p-3.5 sm:p-5 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 shrink-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`px-2.5 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-full border shrink-0 ${theme.badge}`}>
                            Poster Lomba
                        </span>
                        <h3 className="text-sm sm:text-lg font-black text-gray-900 dark:text-white truncate">
                            {lomba.nama}
                        </h3>
                    </div>

                    {/* Action Buttons: Fullscreen, Download, Close */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        {lomba.poster && (
                            <>
                                {/* Tombol Fullscreen */}
                                <button
                                    onClick={toggleFullscreen}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-200/80 dark:bg-slate-700/80 hover:bg-gray-300 dark:hover:bg-slate-600 text-gray-800 dark:text-gray-100 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                                    title={isFullscreen ? "Keluar Mode Fullscreen" : "Tampilan Layar Penuh"}
                                >
                                    {isFullscreen ? <LucideIcons.Minimize2 size={15} /> : <LucideIcons.Maximize2 size={15} />}
                                    <span className="hidden sm:inline">{isFullscreen ? "Normal" : "Fullscreen"}</span>
                                </button>

                                {/* Tombol Download Poster */}
                                <button
                                    onClick={handleDownload}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
                                    title="Download Poster Lomba"
                                >
                                    <LucideIcons.Download size={15} />
                                    <span>Unduh</span>
                                </button>
                            </>
                        )}

                        <button
                            onClick={onClose}
                            className="p-1.5 sm:p-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-300 transition-colors ml-1"
                            aria-label="Close Poster"
                        >
                            <LucideIcons.X size={20} />
                        </button>
                    </div>
                </div>

                {/* Poster Content */}
                <div className="p-3 sm:p-4 overflow-y-auto flex items-center justify-center bg-gray-900/5 dark:bg-slate-950/50 flex-1 min-h-0">
                    {lomba.poster ? (
                        <div className={`relative w-full ${isFullscreen ? 'h-[85vh]' : 'h-[60vh] max-h-[550px]'} flex items-center justify-center`}>
                            <Image
                                src={lomba.poster}
                                alt={`Poster ${lomba.nama}`}
                                fill
                                className="object-contain drop-shadow-2xl rounded-xl"
                                priority
                            />
                        </div>
                    ) : (
                        <div className="py-12 text-center text-gray-400">
                            <LucideIcons.ImageOff size={48} className="mx-auto mb-3 opacity-50" />
                            <p className="text-sm font-medium">Poster belum tersedia</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Lomba Card Component with 3-dots action menu overlay
const LombaCard = ({ lomba, theme, lombaKategori, openPosterModal }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const cardRef = useRef(null);

    const IconComponent = getLucideIcon(lomba.lucideIcon);
    const kategori = (lombaKategori && lombaKategori[lomba.nama]) || [];

    // Close menu when clicking outside the card
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (cardRef.current && !cardRef.current.contains(e.target)) {
                setIsMenuOpen(false);
            }
        };
        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isMenuOpen]);

    // Handle contacts list (supporting 1 or 2 contacts)
    const contactsList = lomba.contacts || (lomba.contactPerson ? [{ name: lomba.contactPersonName || 'Panitia', link: lomba.contactPerson }] : []);

    return (
        <div ref={cardRef} className="glass rounded-[2rem] p-6 md:p-8 group hover:-translate-y-2 transition-all duration-500 hover:shadow-2xl hover:shadow-black/5 flex flex-col border border-white/40 dark:border-white/10 relative overflow-hidden min-h-[350px] md:min-h-[370px] justify-between">
            <div className={`absolute top-0 right-0 w-36 h-36 bg-gradient-to-br ${theme.gradient} opacity-5 blur-2xl rounded-full group-hover:opacity-10 transition-opacity`} />

            {/* Content section */}
            <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center bg-white/60 dark:bg-slate-800/60 border border-gray-200 dark:border-white/10 shadow-xs shrink-0">
                        <IconComponent size={26} className="text-gray-900 dark:text-white" />
                    </div>

                    <div className="flex items-center gap-2">
                        <span className={`inline-block px-3.5 py-1.5 text-xs md:text-sm font-extrabold uppercase tracking-widest rounded-full border ${theme.badge}`}>
                            {lomba.jenis}
                        </span>

                        {/* 3-Dots Menu Trigger Button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-2 md:p-2.5 rounded-full bg-white/70 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-white/10 transition-all hover:scale-105 active:scale-95 shadow-sm cursor-pointer z-10"
                            aria-label="Menu Aksi"
                        >
                            <LucideIcons.MoreVertical size={18} />
                        </button>
                    </div>
                </div>

                <div className="space-y-1">
                    <h3 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white leading-snug">
                        {lomba.nama}
                    </h3>
                    {/* <p className="text-sm md:text-base font-bold text-orange-600 dark:text-orange-400">
                        Total Uang Pembinaan: {lomba.hadiah}
                    </p> */}
                </div>

                <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base leading-relaxed line-clamp-3 md:line-clamp-4">
                    {lomba.desc}
                </p>

                {/* Kategori Badge dari DB & Static Kategori (Pojok Kanan Bawah) */}
                {(kategori.length > 0 || lomba.kategori) && (
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100/80 dark:border-slate-800/60 mt-auto">
                        <div className="flex flex-wrap items-center gap-1.5">
                            {kategori.map((kat, idx) => (
                                <span key={idx} className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-slate-800/80 text-gray-700 dark:text-gray-200 font-bold text-xs uppercase tracking-wide border border-gray-200/50 dark:border-slate-700/50">
                                    {kat}
                                </span>
                            ))}
                        </div>
                        {lomba.kategori && (
                            <span className="px-2.5 py-1 rounded-lg bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 font-black text-xs uppercase tracking-wide border border-orange-500/20 shadow-xs ml-auto">
                                {lomba.kategori}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* 3-Dots Action Overlay Menu (Fills upper/partial section of the card) */}
            <div
                className={`absolute top-16 right-4 left-4 md:right-6 md:left-6 z-30 bg-white/95 dark:bg-slate-900/95 border border-gray-200/80 dark:border-slate-700/80 rounded-2xl p-3.5 md:p-4 shadow-2xl backdrop-blur-xl flex flex-col gap-2.5
                ${isMenuOpen
                        ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
                        : 'opacity-0 -translate-y-3 scale-95 pointer-events-none'
                    }
                transition-none md:transition-all md:duration-300 md:ease-out origin-top-right`}
            >
                <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800/80">
                    <span className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 px-1">
                        Menu Aksi
                    </span>
                    <button
                        onClick={() => setIsMenuOpen(false)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 cursor-pointer rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <LucideIcons.X size={16} />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    {/* Tombol Daftar */}
                    <Link
                        href={lomba.linkDaftar}
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-bold text-white transition-all shadow-sm ${theme.btnPrimary} hover:opacity-90 active:scale-95`}
                    >
                        <LucideIcons.UserPlus size={16} />
                        Daftar
                    </Link>

                    {/* Tombol Ketentuan */}
                    <Link
                        href={lomba.linkKetentuan}
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-bold bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-white/10 transition-all active:scale-95"
                    >
                        <LucideIcons.FileText size={16} />
                        Ketentuan
                    </Link>
                </div>

                {/* Tombol Poster */}
                <button
                    onClick={() => {
                        setIsMenuOpen(false);
                        openPosterModal(lomba);
                    }}
                    className="flex items-center justify-center gap-1.5 w-full px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-bold bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-white/10 transition-all active:scale-95 cursor-pointer"
                >
                    <LucideIcons.Image size={16} />
                    Poster Lomba
                </button>

                {/* Tombol Contact Person (1 atau 2 kontak) */}
                <div className="flex flex-col gap-1.5 pt-1.5 border-t border-gray-100 dark:border-slate-800/80">
                    {contactsList.map((contact, idx) => (
                        <a
                            key={idx}
                            href={contact.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-gray-200/50 dark:border-white/10 transition-all active:scale-95 text-center truncate"
                        >
                            <LucideIcons.MessageCircle size={15} className="shrink-0" />
                            <span className="truncate">Kontak {contact.name}</span>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default function HomeLanding({ site, content, logoSlides, mascotInfo, lombaList, lombaKategori }) {
    const theme = getTheme(site);
    const isPkkmb = site === 'pkkmb';

    const [modalConfig, setModalConfig] = useState({ isOpen: false, type: null });
    const [posterModal, setPosterModal] = useState({ isOpen: false, lomba: null });

    const openModal = (type) => setModalConfig({ isOpen: true, type });
    const closeModal = () => setModalConfig({ isOpen: false, type: null });

    const openPosterModal = (lomba) => setPosterModal({ isOpen: true, lomba });
    const closePosterModal = () => setPosterModal({ isOpen: false, lomba: null });

    if (!content) return null;

    // Hitung total nominal hadiah seluruh lomba
    const totalPrizePool = lombaList ? lombaList.reduce((acc, curr) => acc + (curr.hadiahNominal || 0), 0) : 0;
    const formatRupiah = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
    return (
        <div className="animate-in fade-in duration-700 w-full overflow-hidden">
            {/* ── HERO ── */}
            <section className={`relative overflow-hidden min-h-screen flex flex-col ${theme.heroGradient}`}>
                <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
                    <div className={`absolute top-20 right-[10%] w-72 h-72 rounded-full blur-[90px] ${theme.blob1} opacity-70`} />
                    <div className={`absolute bottom-32 left-[5%] w-64 h-64 rounded-full blur-[80px] ${theme.blob2} opacity-70`} />
                </div>

                <div className="relative flex-1 flex flex-col w-full max-w-6xl mx-auto px-4 md:px-8 py-16 justify-center">
                    {isPkkmb ? (
                        /* PKKMB Layout (No Mascot, Left aligned on desktop, Logo on Right, Mobile logo below title) */
                        <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16 mt-8 md:mt-16">

                            {/* Text Content */}
                            <div className="flex-1 text-center md:text-left max-w-3xl flex flex-col items-center md:items-start">
                                <span className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold tracking-wide border ${theme.badge} mb-6 shadow-sm`}>
                                    <LucideIcons.Sparkles size={16} />
                                    {theme.tagline}
                                </span>
                                <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1] text-gray-900 dark:text-white mb-6">
                                    Selamat Datang di{' '}
                                    <span className={`block mt-2 text-transparent bg-clip-text bg-gradient-to-r ${theme.gradientText}`}>
                                        {content.title}
                                    </span>
                                </h1>
                                <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-10 font-medium">
                                    {content.description}
                                </p>
                                <div className="flex flex-wrap gap-4 justify-center md:justify-start mb-8">
                                    <Link
                                        href={`/${site}/pemberitahuan`}
                                        className={`inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-white text-base font-bold transition-all hover:-translate-y-1 hover:shadow-xl ${theme.btnPrimary}`}
                                    >
                                        <LucideIcons.Bell size={18} />
                                        Lihat Pengumuman
                                    </Link>
                                    <Link
                                        href={`/${site}/contact`}
                                        className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-bold glass hover:-translate-y-1 transition-all hover:shadow-xl hover:shadow-black/5 text-gray-800 dark:text-white border border-gray-200 dark:border-white/10"
                                    >
                                        <LucideIcons.MessageCircle size={18} />
                                        Hubungi Panitia
                                    </Link>
                                </div>

                                {/* Mobile Logo Box (shows BELOW title & CTA on mobile) */}
                                <div className="md:hidden w-full flex flex-col items-center">
                                    <div className={`relative glass p-6 rounded-[2rem] shadow-2xl ${theme.ring} mb-4 w-56 flex flex-col items-center justify-center group hover:scale-[1.02] transition-transform duration-500 overflow-hidden`}>
                                        <div className={`absolute -inset-4 rounded-[3.5rem] blur-2xl opacity-40 ${theme.blob1} group-hover:opacity-60 transition-opacity`} />

                                        {/* Gambar Logo (Disamarkan jika IS_PKKMB_LOGO_REVEALED = false) */}
                                        <Image
                                            src={content.logo}
                                            alt={`Logo ${content.title}`}
                                            width={200}
                                            height={200}
                                            className={`relative w-32 h-32 object-contain drop-shadow-2xl transition-all duration-500 ${!IS_PKKMB_LOGO_REVEALED
                                                ? 'blur-xl opacity-25 scale-95 select-none pointer-events-none'
                                                : ''
                                                }`}
                                            priority
                                        />

                                        {/* Overlay Icon Mata Tertutup bila logo belum dipublikasikan */}
                                        {!IS_PKKMB_LOGO_REVEALED && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs rounded-[2rem] z-10 p-3 text-center transition-all duration-300">
                                                <div className="p-3 rounded-full bg-white/90 dark:bg-slate-800/90 text-rose-500 dark:text-rose-400 shadow-xl mb-2 border border-rose-200 dark:border-rose-900/50 animate-pulse">
                                                    <LucideIcons.EyeOff size={24} />
                                                </div>
                                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-white px-2.5 py-0.5 rounded-full bg-rose-600/90 dark:bg-rose-700/90 shadow-md border border-white/20">
                                                    Belum Bisa Dilihat
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Tombol Lihat Filosofi Logo (Disabled jika IS_PKKMB_LOGO_REVEALED = false) */}
                                    <button
                                        onClick={() => IS_PKKMB_LOGO_REVEALED && openModal('logo')}
                                        disabled={!IS_PKKMB_LOGO_REVEALED}
                                        title={!IS_PKKMB_LOGO_REVEALED ? "Logo belum dirilis, filosofi belum bisa dibuka" : "Lihat Filosofi Logo"}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm ring-1 ring-black/5 dark:ring-white/10 ${IS_PKKMB_LOGO_REVEALED
                                            ? 'text-gray-700 dark:text-gray-200 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 backdrop-blur-md cursor-pointer active:scale-95'
                                            : 'text-gray-400 dark:text-gray-500 bg-gray-200/50 dark:bg-slate-800/40 opacity-60 cursor-not-allowed pointer-events-none'
                                            }`}
                                    >
                                        {IS_PKKMB_LOGO_REVEALED ? <LucideIcons.ArrowUpWideNarrow size={16} /> : <LucideIcons.EyeOff size={16} />}
                                        Lihat Filosofi Logo
                                    </button>
                                </div>
                            </div>

                            {/* Desktop Logo Box (hidden on mobile, shows on right on desktop) */}
                            <div className="hidden md:flex flex-col items-center w-72 lg:w-96 shrink-0">
                                <div className={`relative glass p-10 rounded-[3rem] shadow-2xl ${theme.ring} mb-6 w-full flex flex-col items-center justify-center group hover:scale-[1.02] transition-transform duration-500 overflow-hidden`}>
                                    <div className={`absolute -inset-4 rounded-[3.5rem] blur-2xl opacity-40 ${theme.blob1} group-hover:opacity-60 transition-opacity`} />

                                    {/* Gambar Logo (Disamarkan jika IS_PKKMB_LOGO_REVEALED = false) */}
                                    <Image
                                        src={content.logo}
                                        alt={`Logo ${content.title}`}
                                        width={240}
                                        height={240}
                                        className={`relative w-56 h-56 object-contain drop-shadow-2xl transition-all duration-500 ${!IS_PKKMB_LOGO_REVEALED
                                            ? 'blur-2xl opacity-25 scale-95 select-none pointer-events-none'
                                            : ''
                                            }`}
                                        priority
                                    />

                                    {/* Overlay Icon Mata Tertutup bila logo belum dipublikasikan */}
                                    {!IS_PKKMB_LOGO_REVEALED && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs rounded-[3rem] z-10 p-4 text-center transition-all duration-300">
                                            <div className="p-4 rounded-full bg-white/90 dark:bg-slate-800/90 text-rose-500 dark:text-rose-400 shadow-xl mb-3 border border-rose-200 dark:border-rose-900/50 animate-pulse">
                                                <LucideIcons.EyeOff size={34} />
                                            </div>
                                            <span className="text-xs font-extrabold uppercase tracking-widest text-white px-4 py-1.5 rounded-full bg-rose-600/90 dark:bg-rose-700/90 shadow-md border border-white/20">
                                                Belum Bisa Dilihat
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Tombol Lihat Filosofi Logo (Disabled jika IS_PKKMB_LOGO_REVEALED = false) */}
                                <button
                                    onClick={() => IS_PKKMB_LOGO_REVEALED && openModal('logo')}
                                    disabled={!IS_PKKMB_LOGO_REVEALED}
                                    title={!IS_PKKMB_LOGO_REVEALED ? "Logo belum dirilis, filosofi belum bisa dibuka" : "Lihat Filosofi Logo"}
                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm ring-1 ring-black/5 dark:ring-white/10 ${IS_PKKMB_LOGO_REVEALED
                                        ? 'text-gray-700 dark:text-gray-200 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 backdrop-blur-md cursor-pointer active:scale-95'
                                        : 'text-gray-400 dark:text-gray-500 bg-gray-200/50 dark:bg-slate-800/40 opacity-60 cursor-not-allowed pointer-events-none'
                                        }`}
                                >
                                    {IS_PKKMB_LOGO_REVEALED ? <LucideIcons.ArrowUpWideNarrow size={16} /> : <LucideIcons.EyeOff size={16} />}
                                    Lihat Filosofi Logo
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* POSE Layout (Logo + Mascot as columns) */
                        <>
                            <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24 mt-8 md:mt-16">
                                <span className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold tracking-wide border ${theme.badge} mb-6 shadow-sm`}>
                                    <LucideIcons.Sparkles size={16} />
                                    {theme.tagline}
                                </span>
                                <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.1] text-gray-900 dark:text-white mb-6">
                                    Selamat Datang di{' '}
                                    <span className={`block mt-2 text-transparent bg-clip-text bg-gradient-to-r ${theme.gradientText}`}>
                                        {content.title}
                                    </span>
                                </h1>
                                <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed mx-auto mb-10 font-medium">
                                    {content.description}
                                </p>
                                <div className="flex flex-wrap gap-4 justify-center">
                                    <Link
                                        href={`/${site}/pemberitahuan`}
                                        className={`inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-white text-base font-bold transition-all hover:-translate-y-1 hover:shadow-xl ${theme.btnPrimary}`}
                                    >
                                        <LucideIcons.Bell size={18} />
                                        Lihat Pengumuman
                                    </Link>
                                    <Link
                                        href={`/${site}/contact`}
                                        className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-bold glass hover:-translate-y-1 transition-all hover:shadow-xl hover:shadow-black/5 text-gray-800 dark:text-white border border-gray-200 dark:border-white/10"
                                    >
                                        <LucideIcons.MessageCircle size={18} />
                                        Hubungi Panitia
                                    </Link>
                                </div>
                            </div>

                            <RevealWrapper delay={200}>
                                <div className="grid grid-cols-2 gap-4 md:gap-8 max-w-4xl mx-auto items-end mt-12 md:mt-16">
                                    {/* Logo Box */}
                                    <div className="flex flex-col items-center">
                                        <div className={`relative glass p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-2xl ${theme.ring} mb-4 md:mb-6 w-full flex justify-center group hover:scale-[1.02] transition-transform duration-500`}>
                                            <div className={`absolute -inset-4 rounded-[3.5rem] blur-2xl opacity-40 ${theme.blob1} group-hover:opacity-60 transition-opacity`} />
                                            <Image
                                                src={content.logo}
                                                alt={`Logo ${content.title}`}
                                                width={240}
                                                height={240}
                                                className="relative w-32 h-32 sm:w-48 sm:h-48 md:w-56 md:h-56 object-contain drop-shadow-2xl"
                                                priority
                                            />
                                        </div>
                                        <button
                                            onClick={() => openModal('logo')}
                                            className="flex items-center gap-2 px-4 md:px-6 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-bold text-gray-700 dark:text-gray-200 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 backdrop-blur-md transition-all shadow-sm ring-1 ring-black/5 dark:ring-white/10 cursor-pointer"
                                        >
                                            <LucideIcons.ArrowUpWideNarrow size={16} /> Lihat Filosofi Logo
                                        </button>
                                    </div>

                                    {/* Mascot Box */}
                                    {mascotInfo && (
                                        <div className="flex flex-col items-center">
                                            <div className={`relative glass p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-2xl ${theme.ring} mb-4 md:mb-6 w-full flex justify-center group hover:scale-[1.02] transition-transform duration-500`}>
                                                <div className={`absolute -inset-4 rounded-[3.5rem] blur-2xl opacity-40 ${theme.blob2} group-hover:opacity-60 transition-opacity`} />
                                                <Image
                                                    src={mascotInfo.image}
                                                    alt={`Maskot ${content.title}`}
                                                    width={240}
                                                    height={240}
                                                    className="relative w-32 h-32 sm:w-48 sm:h-48 md:w-56 md:h-56 object-contain drop-shadow-2xl"
                                                    priority
                                                />
                                            </div>
                                            <button
                                                onClick={() => openModal('mascot')}
                                                className="flex items-center gap-2 px-4 md:px-6 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-bold text-gray-700 dark:text-gray-200 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 backdrop-blur-md transition-all shadow-sm ring-1 ring-black/5 dark:ring-white/10 cursor-pointer"
                                            >
                                                <LucideIcons.ArrowUpWideNarrow size={16} /> Lihat Filosofi Maskot
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </RevealWrapper>
                        </>
                    )}
                </div>

                <WaveDivider fillClass={theme.waveToAlt} />
            </section>

            {/* ── STATS ── */}
            <section className={`relative ${theme.sectionAlt}`}>
                <div className="w-full max-w-6xl mx-auto px-4 md:px-8 pt-20 pb-24">
                    <RevealWrapper>
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                                Informasi Singkat
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 text-base md:text-lg max-w-2xl mx-auto">{content.subtitle}</p>
                        </div>
                        <div className="mt-8">
                            <Carousel
                                items={content.stats}
                                animated={true}
                                renderItem={(stat) => <StatCard stat={stat} theme={theme} />}
                            />
                        </div>
                    </RevealWrapper>
                </div>
                <WaveDivider fillClass={theme.waveToBase} />
            </section>

            {/* ── DAFTAR PERLOMBAAN (POSE ONLY) ── */}
            {!isPkkmb && lombaList && lombaList.length > 0 && (
                <section className={`relative ${theme.sectionBase}`}>
                    <div className="w-full max-w-6xl mx-auto px-4 md:px-8 pt-20 pb-24">
                        <RevealWrapper>
                            <div className="text-center mb-10">
                                <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                                    Daftar Perlombaan & Kompetisi
                                </h2>
                                <p className="text-gray-500 dark:text-gray-400 text-base md:text-lg max-w-2xl mx-auto">
                                    Jelajahi berbagai cabang olahraga dan kreativitas seni bergengsi serta total hadiahnya
                                </p>
                            </div>

                            {/* Banner Total Hadiah */}
                            {/* <div className="max-w-md mx-auto mb-16 bg-gradient-to-r from-orange-500 to-amber-500 dark:from-purple-900/80 dark:to-violet-850/80 p-5 rounded-2xl shadow-lg text-center text-white border border-orange-400/20 dark:border-purple-800/30">
                                <p className="text-xs uppercase tracking-widest font-black opacity-80 mb-1">
                                    Grand Prize POSE 2026
                                </p>
                                <p className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-xs">
                                    Total Hadiah: {formatRupiah(totalPrizePool)}
                                </p>
                            </div> */}

                            <div className="mt-8">
                                <Carousel
                                    items={lombaList}
                                    animated={true}
                                    autoPlay={false}
                                    renderItem={(lomba) => (
                                        <LombaCard
                                            lomba={lomba}
                                            theme={theme}
                                            lombaKategori={lombaKategori}
                                            openPosterModal={openPosterModal}
                                        />
                                    )}
                                />
                            </div>
                        </RevealWrapper>
                    </div>
                    <WaveDivider fillClass={theme.waveToAlt} />
                </section>
            )}

            {/* ── FEATURES ── */}
            <section className={`relative ${site === 'pose' ? theme.sectionAlt : theme.sectionBase}`}>
                <div className="w-full max-w-6xl mx-auto px-4 md:px-8 pt-20 pb-24">
                    <RevealWrapper>
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                                Jelajahi Portal
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 text-base md:text-lg max-w-2xl mx-auto">Akses cepat ke halaman penting untuk menunjang kegiatanmu</p>
                        </div>
                        <div className="mt-8">
                            <Carousel
                                items={content.features}
                                animated={true}
                                autoPlay={false}
                                renderItem={(feat) => {
                                    const IconComponent = getLucideIcon(feat.iconName);
                                    return (
                                        <Link
                                            href={feat.href}
                                            className="glass rounded-[2rem] p-6 md:p-8 group hover:-translate-y-2 transition-all duration-500 hover:shadow-2xl hover:shadow-black/5 flex flex-col h-full border border-white/40 dark:border-white/10 relative overflow-hidden h-[280px]"
                                        >
                                            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${theme.gradient} opacity-5 blur-2xl rounded-full group-hover:opacity-10 transition-opacity`} />
                                            <div className="w-12 h-12 rounded-full mb-4 flex items-center justify-center bg-white/50 dark:bg-slate-800/50 border border-gray-200 dark:border-white/10 group-hover:scale-110 transition-transform duration-500 shadow-sm">
                                                <IconComponent size={20} className="text-gray-700 dark:text-gray-300" />
                                            </div>
                                            <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white mb-2">
                                                {feat.title}
                                            </h3>
                                            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed flex-1">{feat.desc}</p>
                                            <div className="mt-4 flex items-center gap-2 text-xs font-bold text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                                                <span>Buka halaman</span>
                                                <LucideIcons.ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </Link>
                                    );
                                }}
                            />
                        </div>
                    </RevealWrapper>
                </div>
                <WaveDivider fillClass={theme.waveToAlt} />
            </section>

            {/* ── TIMELINE ── */}
            <section className={`relative ${site === 'pose' ? theme.sectionBase : theme.sectionAlt}`}>
                <div className="w-full max-w-6xl mx-auto px-4 md:px-8 pt-20 pb-24">
                    <RevealWrapper>
                        <div className="text-center mb-16">
                            <style>{`
                                @keyframes subtle-float {
                                    0%, 100% { transform: translateY(0); }
                                    50% { transform: translateY(-4px); }
                                }
                                .animate-subtle-float {
                                    animation: subtle-float 3s ease-in-out infinite;
                                }
                                @media (max-width: 640px) {
                                    .animate-subtle-float {
                                        animation: none;
                                    }
                                }
                            `}</style>
                            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4 border border-gray-900 dark:border-white text-gray-900 dark:text-white animate-subtle-float">
                                <LucideIcons.Flame size={14} />
                                Rangkaian Acara
                            </span>
                            <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                                Jadwal Kegiatan
                            </h2>
                        </div>
                        <div className="mt-8">
                            <Carousel
                                items={content.timeline}
                                animated={true}
                                renderItem={(item, i) => (
                                    <div className="relative glass rounded-[2rem] p-6 md:p-8 overflow-hidden group hover:shadow-xl transition-all duration-500 border border-white/40 dark:border-white/10 h-[250px] md:h-[280px] flex flex-col justify-center">
                                        <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${theme.gradient} opacity-70 group-hover:opacity-100 transition-opacity`} />
                                        <span className={`inline-block text-xs font-black uppercase tracking-widest mb-2 bg-clip-text text-transparent bg-gradient-to-r ${theme.gradientText}`}>
                                            {item.day}
                                        </span>
                                        <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2 leading-snug">{item.title}</h3>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed relative z-10">{item.desc}</p>
                                        <span className="absolute bottom-2 right-4 text-6xl md:text-8xl font-black text-gray-900/[0.03] dark:text-white/[0.02] select-none pointer-events-none group-hover:scale-110 transition-transform duration-500 leading-none">
                                            {i + 1}
                                        </span>
                                    </div>
                                )}
                            />
                        </div>
                    </RevealWrapper>
                </div>
                <WaveDivider fillClass={theme.waveToFooter} />
            </section>

            <PhilosophyModal
                isOpen={modalConfig.isOpen}
                onClose={closeModal}
                type={modalConfig.type}
                theme={theme}
                logoSlides={logoSlides}
                mascotInfo={mascotInfo}
                isPkkmb={isPkkmb}
            />

            <PosterModal
                isOpen={posterModal.isOpen}
                onClose={closePosterModal}
                lomba={posterModal.lomba}
                theme={theme}
            />
        </div>
    );
}
