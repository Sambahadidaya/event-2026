'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Users, Building2, Bell, MessageCircle, Trophy, BookOpen, Palette, Flame, ArrowRight, Sparkles, X, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { getTheme } from '@/lib/siteThemes';
import WaveDivider from '@/components/public/WaveDivider';

import logoPkkmb from '@/assets/logopkkmb.png';
import logoPose from '@/assets/logopose.jpg';
import maskotPkkmb from '@/assets/maskotpkkmb.png';

// Logo Parts for Slider
import logoPkkmbUtama from '@/assets/logo_pkkmb/logo.png';
import logoPart1 from '@/assets/logo_pkkmb/pecah-gelombang handap lagu.png';
import logoPart2 from '@/assets/logo_pkkmb/pecah-lagu.png';
import logoPart3 from '@/assets/logo_pkkmb/pecah-matahari.png';
import logoPart4 from '@/assets/logo_pkkmb/pecah-motif.png';
import logoPart5 from '@/assets/logo_pkkmb/pecah-titik+gelombang.png';

const logoSlides = [
    { image: logoPkkmbUtama, title: 'Kesatuan Logo', desc: 'Logo ini mencerminkan semangat juang dan kebersamaan seluruh elemen mahasiswa baru Politeknik LP3I.' },
    { image: logoPart1, title: 'Gelombang Bawah', desc: 'Melambangkan fondasi yang kuat dan pergerakan yang dinamis menuju masa depan yang cerah.' },
    { image: logoPart2, title: 'Bentuk Lagu', desc: 'Harmoni dan keseimbangan dalam setiap langkah perjalanan mahasiswa selama menempuh pendidikan.' },
    { image: logoPart3, title: 'Matahari', desc: 'Pancaran semangat, energi positif, dan pencerahan ilmu pengetahuan yang menyinari sivitas akademika.' },
    { image: logoPart4, title: 'Motif Tradisional', desc: 'Menjunjung tinggi nilai budaya dan kearifan lokal di tengah modernisasi pendidikan kampus.' },
    { image: logoPart5, title: 'Titik dan Gelombang', desc: 'Sinergi antara fokus pada tujuan dan fleksibilitas dalam menghadapi berbagai rintangan.' },
];

const mascotInfo = {
    image: maskotPkkmb,
    title: 'Maskot PKKMB 2026',
    desc: 'Maskot ini mencerminkan karakter mahasiswa yang cerdas, tangguh, adaptif, dan selalu bersemangat dalam meraih prestasi, baik secara akademik maupun non-akademik di lingkungan Politeknik LP3I.'
};

const siteContent = {
    pkkmb: {
        logo: logoPkkmb,
        title: 'PKKMB 2026',
        subtitle: 'Pengenalan Kehidupan Kampus bagi Mahasiswa Baru',
        description: 'Selamat datang, generasi baru Politeknik LP3I! PKKMB adalah gerbang awal perjalanan akademismu — temukan pengumuman, kelompok, dan informasi penting di sini.',
        stats: [
            { icon: Calendar, label: 'Tanggal Acara', value: '21 - 26 September' },
            { icon: Users, label: 'Mahasiswa Baru', value: '300+' },
            { icon: Building2, label: 'Program Studi', value: '11 Prodi' },
            { icon: Building2, label: 'Cabang Kampus', value: '6 Cabang' },
        ],
        features: [
            { icon: Bell, title: 'Pemberitahuan', desc: 'Pengumuman resmi dan info terbaru seputar kegiatan PKKMB.', href: '/pkkmb/pemberitahuan' },
            { icon: Users, title: 'Kelompok', desc: 'Cek pembagian kelompok dan daftar anggota kelompokmu.', href: '/pkkmb/kelompok' },
            { icon: BookOpen, title: 'Materi', desc: 'Cek jadwal Materi PKKMB.', href: '/pkkmb/jadwal' },
            { icon: MessageCircle, title: 'Kontak', desc: 'Hubungi panitia jika ada pertanyaan seputar PKKMB.', href: '/pkkmb/contact' },
        ],
        timeline: [
            { day: 'Hari 1', title: 'Opening & Perkenalan', desc: 'Upacara pembukaan, sambutan pimpinan, dan pengenalan kampus.' },
            { day: 'Hari 2', title: 'Kegiatan Inti', desc: 'Workshop, team building, dan pengenalan organisasi kemahasiswaan.' },
            { day: 'Hari 3', title: 'Kegiatan Inti', desc: 'Workshop, team building, dan pengenalan organisasi kemahasiswaan.' },
            { day: 'Hari 4', title: 'Kegiatan Inti', desc: 'Workshop, team building, dan pengenalan organisasi kemahasiswaan.' },
            { day: 'Hari 5', title: 'Kegiatan Inti', desc: 'Workshop, team building, dan pengenalan organisasi kemahasiswaan.' },
            { day: 'Hari 6', title: 'Penutupan', desc: 'Presentasi kelompok, penyerahan sertifikat, dan closing ceremony.' },
        ],
    },
    pose: {
        logo: logoPose,
        title: 'POSE 2026',
        subtitle: 'Pekan Olahraga dan Seni',
        description: 'Raih prestasi, tunjukkan bakat! POSE adalah ajang bergengsi antarprodi — olahraga, seni, dan semangat juara dalam satu panggung.',
        stats: [
            { icon: Calendar, label: 'Tanggal Acara', value: '15 - 26 September' },
            { icon: Trophy, label: 'Cabang lomba', value: '15 Cabang' },
            { icon: Palette, label: 'Jenis Lomba', value: '3 Jenis' },
        ],
        features: [
            { icon: Bell, title: 'Pemberitahuan', desc: 'Jadwal pertandingan, hasil lomba, dan pengumuman resmi POSE.', href: '/pose/pemberitahuan' },
            { icon: Users, title: 'Tim', desc: 'Cek susunan tim pertandingan setiap cabang.', href: '/pose/team' },
            { icon: Trophy, title: 'Klasemen', desc: 'Cek klasemen pertandingan setiap cabang.', href: '/pose/klasemen' },
            { icon: Flame, title: 'Sertifikat', desc: 'Cek sertifikat juara lomba.', href: '/pose/sertifikat' },
            { icon: MessageCircle, title: 'Kontak', desc: 'Hubungi panitia POSE untuk pendaftaran dan informasi.', href: '/pose/contact' },
        ],
        timeline: [
            { day: 'Fase 1', title: 'Pendaftaran & Seleksi', desc: 'Pendaftaran atlet dan audisi cabang seni dari setiap prodi.' },
            { day: 'Fase 2', title: 'Pertandingan', desc: 'Babak penyisihan dan semifinal seluruh cabang olahraga & seni.' },
            { day: 'Fase 3', title: 'Grand Final', desc: 'Final cabang unggulan, penyerahan piala, dan closing ceremony.' },
        ],
    },
};

// Custom Hook for Number Counting Animation
const useCountUp = (endValue, trigger) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!trigger || endValue === 0) return;
        let start = 0;
        const duration = 5000;
        const stepTime = Math.abs(Math.floor(duration / endValue));
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

    // Extract numbers like "500+" -> 500, "+"
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

    return (
        <div ref={ref} className="glass rounded-[2rem] p-8 text-center hover:-translate-y-2 transition-all duration-500 hover:shadow-2xl hover:shadow-black/5 group border border-white/40 dark:border-white/10">
            <div className="w-14 h-14 rounded-full mx-auto mb-5 flex items-center justify-center bg-white/50 dark:bg-slate-800/50 border border-gray-200 dark:border-white/10 group-hover:scale-110 transition-transform duration-500 shadow-sm">
                <stat.icon size={24} className="text-gray-700 dark:text-gray-300" />
            </div>
            <p className={`text-3xl md:text-4xl font-black mb-2 tracking-tight bg-clip-text text-transparent bg-gradient-to-r ${theme.gradientText}`}>
                {isSingleNumber ? `${count}${suffix}` : stat.value}
            </p>
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-[0.15em]">
                {stat.label}
            </p>
        </div>
    );
};

// Philosophy Modal Component
const PhilosophyModal = ({ isOpen, onClose, type, theme }) => {
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
    const currentData = isLogo ? logoSlides[slideIndex] : mascotInfo;

    const nextSlide = () => {
        if (isLogo) setSlideIndex((prev) => (prev + 1) % logoSlides.length);
    };

    const prevSlide = () => {
        if (isLogo) setSlideIndex((prev) => (prev - 1 + logoSlides.length) % logoSlides.length);
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
            <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col md:flex-row max-h-[90vh]">

                {/* Image Section */}
                <div
                    className="relative w-full md:w-1/2 p-8 md:p-12 flex items-center justify-center bg-gray-50 dark:bg-slate-800/50"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <div className="relative w-full aspect-square max-w-[280px] md:max-w-sm">
                        <Image
                            src={currentData.image}
                            alt={currentData.title}
                            fill
                            className="object-contain drop-shadow-xl"
                        />
                    </div>
                    {isLogo && (
                        <>
                            <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 dark:bg-slate-800/80 hover:bg-white text-gray-800 dark:text-white shadow-lg backdrop-blur-sm transition-all hover:scale-110">
                                <ChevronLeft size={24} />
                            </button>
                            <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 dark:bg-slate-800/80 hover:bg-white text-gray-800 dark:text-white shadow-lg backdrop-blur-sm transition-all hover:scale-110">
                                <ChevronRight size={24} />
                            </button>

                            {/* Slide Indicators */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                {logoSlides.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSlideIndex(idx)}
                                        aria-label={`Go to slide ${idx + 1}`}
                                        className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${idx === slideIndex ? 'bg-blue-600 w-6' : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'}`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Content Section */}
                <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center relative overflow-y-auto">
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 transition-colors z-10">
                        <X size={24} />
                    </button>

                    <span className={`inline-block px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-full w-fit mb-4 border ${theme.badge}`}>
                        Filosofi {isLogo ? 'Logo' : 'Maskot'}
                    </span>
                    <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight">
                        {currentData.title}
                    </h3>

                    {/* Different font for philosophy text */}
                    <p className="text-gray-600 dark:text-gray-300 text-base md:text-lg leading-relaxed font-serif italic">
                        "{currentData.desc}"
                    </p>
                </div>
            </div>
        </div>
    );
};

export default function HomeLanding({ site }) {
    const theme = getTheme(site);
    const content = siteContent[site];
    const isPkkmb = site === 'pkkmb';

    const [modalConfig, setModalConfig] = useState({ isOpen: false, type: null });

    const openModal = (type) => setModalConfig({ isOpen: true, type });
    const closeModal = () => setModalConfig({ isOpen: false, type: null });

    return (
        <div className="animate-in fade-in duration-700 overflow-x-hidden">
            {/* ── HERO ── */}
            <section className={`relative min-h-[calc(100vh-5rem)] flex flex-col ${theme.heroGradient}`}>
                <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
                    <div className={`absolute top-20 right-[10%] w-72 h-72 rounded-full blur-[90px] ${theme.blob1} opacity-70`} />
                    <div className={`absolute bottom-32 left-[5%] w-64 h-64 rounded-full blur-[80px] ${theme.blob2} opacity-70`} />
                </div>

                <div className="relative flex-1 flex flex-col w-full max-w-6xl mx-auto px-4 md:px-8 py-16">
                    {/* Top: Text Content */}
                    <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24 mt-8 md:mt-16">
                        <span className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold tracking-wide border ${theme.badge} mb-6 shadow-sm`}>
                            <Sparkles size={16} />
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
                                <Bell size={18} />
                                Lihat Pengumuman
                            </Link>
                            <Link
                                href={`/${site}/contact`}
                                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-base font-bold glass hover:-translate-y-1 transition-all hover:shadow-xl hover:shadow-black/5 text-gray-800 dark:text-white border border-gray-200 dark:border-white/10"
                            >
                                <MessageCircle size={18} />
                                Hubungi Panitia
                            </Link>
                        </div>
                    </div>

                    {/* Bottom: Images & Philosophy */}
                    <RevealWrapper delay={200}>
                        <div className={`grid ${isPkkmb ? 'md:grid-cols-2 gap-8 md:gap-16 max-w-4xl' : 'grid-cols-1 max-w-sm'} mx-auto items-end`}>
                            {/* Logo Box */}
                            <div className="flex flex-col items-center">
                                <div className={`relative glass p-10 md:p-12 rounded-[3rem] shadow-2xl ${theme.ring} mb-6 w-full flex justify-center group hover:scale-[1.02] transition-transform duration-500`}>
                                    <div className={`absolute -inset-4 rounded-[3.5rem] blur-2xl opacity-40 ${theme.blob1} group-hover:opacity-60 transition-opacity`} />
                                    <Image
                                        src={content.logo}
                                        alt={`Logo ${content.title}`}
                                        width={240}
                                        height={240}
                                        className="relative w-48 h-48 md:w-56 md:h-56 object-contain drop-shadow-2xl"
                                        priority
                                    />
                                </div>
                                <button
                                    onClick={() => openModal('logo')}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold text-gray-700 dark:text-gray-200 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 backdrop-blur-md transition-all shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                                >
                                    <Search size={16} /> Filosofi Logo
                                </button>
                            </div>

                            {/* Mascot Box (Only PKKMB) */}
                            {isPkkmb && (
                                <div className="flex flex-col items-center mt-12 md:mt-0">
                                    <div className={`relative glass p-10 md:p-12 rounded-[3rem] shadow-2xl ${theme.ring} mb-6 w-full flex justify-center group hover:scale-[1.02] transition-transform duration-500`}>
                                        <div className={`absolute -inset-4 rounded-[3.5rem] blur-2xl opacity-40 ${theme.blob2} group-hover:opacity-60 transition-opacity`} />
                                        <Image
                                            src={maskotPkkmb}
                                            alt="Maskot PKKMB"
                                            width={240}
                                            height={240}
                                            className="relative w-48 h-48 md:w-56 md:h-56 object-contain drop-shadow-2xl"
                                            priority
                                        />
                                    </div>
                                    <button
                                        onClick={() => openModal('mascot')}
                                        className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold text-gray-700 dark:text-gray-200 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 backdrop-blur-md transition-all shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                                    >
                                        <Search size={16} /> Filosofi Maskot
                                    </button>
                                </div>
                            )}
                        </div>
                    </RevealWrapper>
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                            {content.stats.map((stat) => (
                                <StatCard key={stat.label} stat={stat} theme={theme} />
                            ))}
                        </div>
                    </RevealWrapper>
                </div>
                <WaveDivider fillClass={theme.waveToBase} />
            </section>

            {/* ── FEATURES ── */}
            <section className={`relative ${theme.sectionBase}`}>
                <div className="w-full max-w-6xl mx-auto px-4 md:px-8 pt-20 pb-24">
                    <RevealWrapper>
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                                Jelajahi Portal
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 text-base md:text-lg max-w-2xl mx-auto">Akses cepat ke halaman penting untuk menunjang kegiatanmu</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                            {content.features.map((feat, i) => (
                                <RevealWrapper key={feat.href} delay={i * 100}>
                                    <Link
                                        href={feat.href}
                                        className="glass rounded-[2rem] p-8 md:p-10 group hover:-translate-y-2 transition-all duration-500 hover:shadow-2xl hover:shadow-black/5 flex flex-col h-full border border-white/40 dark:border-white/10 relative overflow-hidden"
                                    >
                                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${theme.gradient} opacity-5 blur-2xl rounded-full group-hover:opacity-10 transition-opacity`} />
                                        <div className="w-14 h-14 rounded-full mb-6 flex items-center justify-center bg-white/50 dark:bg-slate-800/50 border border-gray-200 dark:border-white/10 group-hover:scale-110 transition-transform duration-500 shadow-sm">
                                            <feat.icon size={24} className="text-gray-700 dark:text-gray-300" />
                                        </div>
                                        <h3 className="text-xl font-black text-gray-900 dark:text-white mb-3">
                                            {feat.title}
                                        </h3>
                                        <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed flex-1">{feat.desc}</p>
                                        <div className="mt-6 flex items-center gap-2 text-sm font-bold text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                                            <span>Buka halaman</span>
                                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </Link>
                                </RevealWrapper>
                            ))}
                        </div>
                    </RevealWrapper>
                </div>
                <WaveDivider fillClass={theme.waveToAlt} />
            </section>

            {/* ── TIMELINE ── */}
            <section className={`relative ${theme.sectionAlt}`}>
                <div className="w-full max-w-6xl mx-auto px-4 md:px-8 pt-20 pb-24">
                    <RevealWrapper>
                        <div className="text-center mb-16">
                            <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4 border ${theme.badge}`}>
                                <Flame size={14} />
                                Rangkaian Acara
                            </span>
                            <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                                Jadwal Kegiatan
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                            {content.timeline.map((item, i) => (
                                <RevealWrapper key={item.day} delay={i * 100}>
                                    <div className="relative glass rounded-[2rem] p-8 md:p-10 overflow-hidden group hover:shadow-xl transition-all duration-500 border border-white/40 dark:border-white/10">
                                        <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${theme.gradient} opacity-70 group-hover:opacity-100 transition-opacity`} />
                                        <span className={`inline-block text-sm font-black uppercase tracking-widest mb-3 bg-clip-text text-transparent bg-gradient-to-r ${theme.gradientText}`}>
                                            {item.day}
                                        </span>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 leading-snug">{item.title}</h3>
                                        <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed relative z-10">{item.desc}</p>
                                        <span className="absolute bottom-0 right-4 text-8xl font-black text-gray-900/[0.03] dark:text-white/[0.02] select-none pointer-events-none group-hover:scale-110 transition-transform duration-500 leading-none">
                                            {i + 1}
                                        </span>
                                    </div>
                                </RevealWrapper>
                            ))}
                        </div>
                    </RevealWrapper>
                </div>
                <WaveDivider fillClass={theme.waveToFooter} />
            </section>

            <PhilosophyModal isOpen={modalConfig.isOpen} onClose={closeModal} type={modalConfig.type} theme={theme} />
        </div>
    );
}
