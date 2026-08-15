'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { getTheme } from '@/lib/siteThemes';
import { Menu, X, Video, BookOpen, ChevronRight, Play, ShieldCheck, History, Calendar, Sparkles } from 'lucide-react';

export default function PanduanPage({ site, data }) {
    const theme = getTheme(site);
    const [activeSection, setActiveSection] = useState(data.sections[0]?.id || '');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeVideoSectionId, setActiveVideoSectionId] = useState(null);
    const observer = useRef(null);

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

    // Auto scroll if URL has hash (e.g. #update-versi from footer link)
    useEffect(() => {
        if (typeof window !== 'undefined' && window.location.hash) {
            const id = window.location.hash.replace('#', '');
            setTimeout(() => {
                scrollToSection(id);
            }, 300);
        }
    }, []);

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

        if (data.privacyPolicy) {
            const el = document.getElementById('kebijakan-privasi');
            if (el) observer.current.observe(el);
        }

        if (data.updateVersi && data.updateVersi.length > 0) {
            const el = document.getElementById('update-versi');
            if (el) observer.current.observe(el);
            data.updateVersi.forEach(u => {
                const subId = `update-${u.versi.replace(/[^a-zA-Z0-9]/g, '-')}`;
                const subEl = document.getElementById(subId);
                if (subEl) observer.current.observe(subEl);
            });
        }

        return () => {
            if (observer.current) {
                observer.current.disconnect();
            }
        };
    }, [data.sections, data.privacyPolicy, data.updateVersi]);

    // Format display title if section is a subsection or privacy policy
    const getActiveTitle = () => {
        if (activeSection === 'kebijakan-privasi') return 'Keamanan Data & Privasi';
        if (activeSection === 'update-versi') return 'Catatan Update Versi';
        if (activeSection.startsWith('update-')) {
            const vItem = data.updateVersi?.find(u => `update-${u.versi.replace(/[^a-zA-Z0-9]/g, '-')}` === activeSection);
            if (vItem) return `Update ${vItem.versi}`;
        }
        for (const section of data.sections) {
            if (section.id === activeSection) return section.title;
            if (section.subsections) {
                const sub = section.subsections.find(s => s.id === activeSection);
                if (sub) return `${section.title} - ${sub.title}`;
            }
        }
        return 'Panduan';
    };

    return (
        <div className={`min-h-screen pb-16 ${theme.sectionBase}`}>
            {/* Header Area */}
            <div className="py-12 bg-gradient-to-b from-white/80 via-white/50 to-transparent dark:from-slate-900/80 dark:via-slate-900/50 dark:to-transparent border-b border-gray-100 dark:border-slate-800/50">
                <div className="max-w-6xl mx-auto px-4">
                    <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border mb-4 ${theme.badge}`}>
                        Pusat Bantuan & Panduan
                    </span>
                    <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
                        Panduan Penggunaan Portal {site.toUpperCase()} 2026
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm md:text-base max-w-2xl">
                        Pelajari alur pendaftaran, penggunaan fitur-fitur portal, tata cara pengumpulan tugas & karya, serta visualisasi navigasi halaman.
                    </p>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-6xl mx-auto px-4 mt-8 relative">

                {/* Mobile Second Navbar Button */}
                <div className="md:hidden mb-6 flex justify-between items-center p-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-sm">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-gray-950 transition-colors"
                    >
                        <Menu size={16} />
                        Menu Panduan
                    </button>
                    <span className="text-xs font-semibold text-gray-400 capitalize bg-gray-50 dark:bg-slate-800 px-3 py-1 rounded-full max-w-[180px] truncate">
                        {getActiveTitle()}
                    </span>
                </div>

                <div className="flex flex-col md:flex-row gap-8">

                    {/* Desktop Sidebar (Left Navbar, max-h-80vh, scrollable) */}
                    <aside className="hidden md:block w-64 shrink-0 self-start sticky top-24">
                        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 rounded-3xl p-4 shadow-sm space-y-3 max-h-[80vh] overflow-y-auto scrollbar-thin">
                            <h2 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-3">
                                Daftar Isi
                            </h2>
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

                                {/* Extra Link for Kebijakan Privasi in Sidebar */}
                                {data.privacyPolicy && (
                                    <div className="pt-2 mt-2 border-t border-gray-100 dark:border-slate-800/60">
                                        <button
                                            onClick={() => scrollToSection('kebijakan-privasi')}
                                            className={`w-full flex items-center justify-between text-left px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all group ${activeSection === 'kebijakan-privasi'
                                                ? `bg-gradient-to-r ${theme.gradient} text-white shadow-md shadow-slate-900/5`
                                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-55 dark:hover:bg-slate-800/40 hover:text-gray-900 dark:hover:text-white'
                                                }`}
                                        >
                                            <span className="truncate">Keamanan Data & Privasi</span>
                                            <ChevronRight size={14} className={`transition-transform duration-200 ${activeSection === 'kebijakan-privasi' ? 'rotate-90 text-white' : 'opacity-0 group-hover:opacity-100 text-gray-400'}`} />
                                        </button>
                                    </div>
                                )}

                                {/* Extra Link for Update Versi in Sidebar */}
                                {data.updateVersi && data.updateVersi.length > 0 && (
                                    <div className="pt-1 mt-1 border-t border-gray-100 dark:border-slate-800/60 space-y-1">
                                        <button
                                            onClick={() => scrollToSection('update-versi')}
                                            className={`w-full flex items-center justify-between text-left px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all group ${activeSection === 'update-versi' || activeSection.startsWith('update-')
                                                ? `bg-gradient-to-r ${theme.gradient} text-white shadow-md shadow-slate-900/5`
                                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-55 dark:hover:bg-slate-800/40 hover:text-gray-900 dark:hover:text-white'
                                                }`}
                                        >
                                            <span className="flex items-center gap-1.5">
                                                <History size={13} className="shrink-0" />
                                                Update Versi
                                            </span>
                                            <span className="shrink-0">
                                                {data.updateVersi[0]?.versi}
                                            </span>
                                        </button>

                                        {/* Nested UL LI for each version update */}
                                        <ul className="pl-3 pr-1 py-1 space-y-1 border-l border-gray-200 dark:border-slate-800 ml-4 animate-in slide-in-from-top-1 duration-250">
                                            {data.updateVersi.map((u) => {
                                                const versionId = `update-${u.versi.replace(/[^a-zA-Z0-9]/g, '-')}`;
                                                return (
                                                    <li key={u.versi}>
                                                        <button
                                                            onClick={() => scrollToSection(versionId)}
                                                            className={`w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all truncate block ${activeSection === versionId
                                                                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                                                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                                                }`}
                                                        >
                                                            {u.versi} — {u.judul}
                                                        </button>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </aside>

                    {/* Mobile Sidebar Drawer (Menu Panduan absolut bawah header top-16) */}
                    {sidebarOpen && (
                        <div className="fixed inset-0 z-50 md:hidden animate-in fade-in duration-200">
                            {/* Backdrop overlay */}
                            <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setSidebarOpen(false)} />

                            {/* Left drawer panel - positioned under header top-16 */}
                            <div className="absolute top-16 left-0 bottom-0 w-72 bg-white dark:bg-slate-900 shadow-2xl p-6 flex flex-col justify-between animate-in slide-in-from-left duration-300">
                                <div className="space-y-6 flex-1 flex flex-col min-h-0">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-xs font-black uppercase tracking-wider text-gray-400">
                                            Menu Panduan
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
                                                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
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

                                        {/* Mobile Extra Link for Kebijakan Privasi */}
                                        {data.privacyPolicy && (
                                            <div className="pt-2 mt-2 border-t border-gray-150 dark:border-slate-800">
                                                <button
                                                    onClick={() => scrollToSection('kebijakan-privasi')}
                                                    className={`w-full flex items-center justify-between text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeSection === 'kebijakan-privasi'
                                                        ? `bg-gradient-to-r ${theme.gradient} text-white shadow-md`
                                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-55 dark:hover:bg-slate-800'
                                                        }`}
                                                >
                                                    <span>Keamanan Data & Privasi</span>
                                                    <ChevronRight size={14} className={activeSection === 'kebijakan-privasi' ? 'rotate-90' : ''} />
                                                </button>
                                            </div>
                                        )}

                                        {/* Mobile Extra Link for Update Versi */}
                                        {data.updateVersi && data.updateVersi.length > 0 && (
                                            <div className="pt-1 mt-1 border-t border-gray-150 dark:border-slate-800 space-y-1">
                                                <button
                                                    onClick={() => scrollToSection('update-versi')}
                                                    className={`w-full flex items-center justify-between text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeSection === 'update-versi' || activeSection.startsWith('update-')
                                                        ? `bg-gradient-to-r ${theme.gradient} text-white shadow-md`
                                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-55 dark:hover:bg-slate-800'
                                                        }`}
                                                >
                                                    <span className="flex items-center">
                                                        <History size={14} className="shrink-0" />
                                                        Update Versi
                                                    </span>
                                                    <span className="shrink-0">
                                                        {data.updateVersi[0]?.versi}
                                                    </span>
                                                </button>

                                                {/* Mobile Nested UL LI for each version update */}
                                                <ul className="pl-3 py-1 space-y-1 border-l border-gray-200 dark:border-slate-800 ml-4">
                                                    {data.updateVersi.map((u) => {
                                                        const versionId = `update-${u.versi.replace(/[^a-zA-Z0-9]/g, '-')}`;
                                                        return (
                                                            <li key={u.versi}>
                                                                <button
                                                                    onClick={() => scrollToSection(versionId)}
                                                                    className={`w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-bold block ${activeSection === versionId
                                                                        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                                                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                                                        }`}
                                                                >
                                                                    {u.versi} — {u.judul}
                                                                </button>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </div>
                                        )}
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
                                        <BookOpen size={18} className="text-gray-700 dark:text-gray-300" />
                                    </div>
                                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                                        {section.title}
                                    </h2>
                                </div>

                                <div className="text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed space-y-4 whitespace-pre-line">
                                    {section.content}
                                </div>

                                {/* Render Screenshot Image if exists */}
                                {section.image && (
                                    <div className="mt-6 space-y-2">
                                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                                            Tampilan Halaman
                                        </h4>
                                        <div className="relative rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
                                            <Image
                                                src={section.image}
                                                alt={`Tampilan halaman ${section.title}`}
                                                className="w-full h-auto object-contain"
                                                priority
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Render Video Iframe if exists */}
                                {section.youtubeId && (
                                    <div className="mt-6 space-y-3">
                                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                                            <Video size={14} />
                                            Tonton Panduan Video
                                        </h4>
                                        <div className="relative aspect-video rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800 bg-black group/video">
                                            {activeVideoSectionId === section.id ? (
                                                <iframe
                                                    className="absolute inset-0 w-full h-full"
                                                    src={`https://www.youtube.com/embed/${section.youtubeId}?autoplay=1`}
                                                    title={`Video tutorial ${section.title}`}
                                                    frameBorder="0"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                    allowFullScreen
                                                ></iframe>
                                            ) : (
                                                <button
                                                    onClick={() => setActiveVideoSectionId(section.id)}
                                                    className="absolute inset-0 w-full h-full flex items-center justify-center cursor-pointer group-hover/video:scale-105 transition-transform"
                                                >
                                                    {/* Thumbnail & Play Icon */}
                                                    <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 shadow-2xl">
                                                        <Play size={20} className="fill-white" />
                                                        <span className="text-xs font-bold">Putar Video Tutorial</span>
                                                    </div>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}

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
                            </section>
                        ))}

                        {/* Kebijakan Privasi & Keamanan Data Section at the bottom */}
                        {data.privacyPolicy && (
                            <section
                                id="kebijakan-privasi"
                                className="bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-slate-900/40 dark:to-slate-800/30 border border-blue-105/85 dark:border-slate-800/60 rounded-3xl p-6 md:p-8 shadow-xs scroll-mt-24 transition-all duration-300 hover:border-blue-200/80 dark:hover:border-slate-750"
                            >
                                <div className="flex items-center gap-2.5 mb-5">
                                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200/30 dark:border-blue-500/20">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight animate-in fade-in">
                                        {data.privacyPolicy.title}
                                    </h2>
                                </div>
                                <div className="text-sm md:text-base text-gray-650 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                                    {data.privacyPolicy.content}
                                </div>
                            </section>
                        )}

                        {/* Catatan Update Versi Section (UL/LI Format) */}
                        {data.updateVersi && data.updateVersi.length > 0 && (
                            <section
                                id="update-versi"
                                className="bg-gradient-to-br from-emerald-50/60 via-slate-50/50 to-emerald-50/30 dark:from-slate-900/80 dark:via-slate-900/50 dark:to-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30 rounded-3xl p-6 md:p-8 shadow-xs scroll-mt-24 transition-all duration-300"
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/40 dark:border-emerald-500/20">
                                        <History size={22} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                                                Catatan Update Versi Portal
                                            </h2>
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500 text-white shadow-xs">
                                                <Sparkles size={11} />
                                                Terbaru
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                            Riwayat pembaruan sistem, perbaikan bug, dan peluncuran fitur baru
                                        </p>
                                    </div>
                                </div>

                                {/* List ul li Update Versi */}
                                <ul className="space-y-6 list-none p-0 m-0">
                                    {data.updateVersi.map((updateItem, index) => {
                                        const versionId = `update-${updateItem.versi.replace(/[^a-zA-Z0-9]/g, '-')}`;
                                        return (
                                            <li
                                                key={updateItem.versi || index}
                                                id={versionId}
                                                className="bg-white dark:bg-slate-900/90 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-xs relative overflow-hidden transition-all hover:border-emerald-300 dark:hover:border-emerald-800 scroll-mt-24"
                                            >
                                                <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-gray-100 dark:border-slate-800">
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="px-3 py-1 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs">
                                                            {updateItem.versi}
                                                        </span>
                                                        <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-white">
                                                            {updateItem.judul}
                                                        </h3>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-xs font-semibold text-gray-400 dark:text-gray-500">
                                                        <Calendar size={13} />
                                                        <span>{updateItem.tanggal}</span>
                                                    </div>
                                                </div>

                                                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                                                    {updateItem.isi}
                                                </p>

                                                {/* Preview Gambar Update jika tersedia */}
                                                {updateItem.image && (
                                                    <div className="mt-4 space-y-2">
                                                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                                            Tampilan Pembaruan
                                                        </h4>
                                                        <div className="relative rounded-xl overflow-hidden border border-gray-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                                                            <Image
                                                                src={updateItem.image}
                                                                alt={`Update ${updateItem.versi}`}
                                                                className="w-full h-auto object-contain"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </section>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
