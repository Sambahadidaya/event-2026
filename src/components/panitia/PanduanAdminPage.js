'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Menu, X, BookOpen, ChevronRight, History, Calendar, Sparkles } from 'lucide-react';

export default function PanduanAdminPage({ site, data }) {
    const [activeSection, setActiveSection] = useState(data.sections[0]?.id || '');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const observer = useRef(null);

    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setActiveSection(id);
            setSidebarOpen(false);
        }
    };

    useEffect(() => {
        if (typeof window !== 'undefined' && window.location.hash) {
            const id = window.location.hash.replace('#', '');
            setTimeout(() => {
                scrollToSection(id);
            }, 300);
        }
    }, []);

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
            rootMargin: '-10% 0px -60% 0px',
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
    }, [data.sections, data.updateVersi]);

    const getActiveTitle = () => {
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
        return 'Panduan Panitia';
    };

    const siteBadgeColor = site === 'pkkmb'
        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20'
        : 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/20';

    return (
        <div className="space-y-6 pb-12">
            {/* Header Banner - Responsive to Light & Dark Theme */}
            <div className="bg-gradient-to-br from-slate-50 via-white to-blue-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/40 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xs relative overflow-hidden transition-colors">
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-500/10 via-indigo-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 max-w-3xl">
                    <div className="flex items-center gap-2 mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${siteBadgeColor}`}>
                            Panduan Admin {site.toUpperCase()} 2026
                        </span>
                    </div>
                    <h1 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                        Pusat Dokumentasi & Operational Guide Panitia
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-2 text-xs md:text-sm leading-relaxed">
                        Panduan teknis pengoperasian panel admin, pembagian tugas divisi panitia, serta catatan pembaruan sistem terkini.
                    </p>
                </div>
            </div>

            {/* Mobile Second Navbar Button */}
            <div className="md:hidden flex justify-between items-center p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors"
                >
                    <Menu size={16} />
                    <span>Daftar Isi Panduan</span>
                </button>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full max-w-[180px] truncate">
                    {getActiveTitle()}
                </span>
            </div>

            {/* Main Content & Sidebar Grid */}
            <div className="flex flex-col md:flex-row gap-6 items-start relative">

                {/* Desktop Sidebar - Sticky Top-4 relative to container scroll */}
                <aside className="hidden md:block w-72 shrink-0 sticky top-4 z-20">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-xs space-y-3 max-h-[80vh] overflow-y-auto scrollbar-thin">
                        <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3">
                            Daftar Isi Panduan
                        </h2>
                        <div className="space-y-1">
                            {data.sections.map((section) => {
                                const isParentActive = activeSection === section.id || (section.subsections && section.subsections.some(sub => activeSection === sub.id));

                                return (
                                    <div key={section.id} className="space-y-1">
                                        <button
                                            onClick={() => scrollToSection(section.id)}
                                            className={`w-full flex items-center justify-between text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${isParentActive
                                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                                                }`}
                                        >
                                            <span className="truncate">{section.title}</span>
                                            <ChevronRight size={14} className={`transition-transform duration-200 ${isParentActive ? 'rotate-90 text-white' : 'opacity-40'}`} />
                                        </button>

                                        {section.subsections && (
                                            <ul className="pl-3 pr-1 py-1 space-y-1 border-l border-slate-200 dark:border-slate-800 ml-3.5">
                                                {section.subsections.map((sub) => (
                                                    <li key={sub.id}>
                                                        <button
                                                            onClick={() => scrollToSection(sub.id)}
                                                            className={`w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all truncate block ${activeSection === sub.id
                                                                ? 'text-blue-600 dark:text-cyan-400 bg-blue-50/60 dark:bg-cyan-950/30 font-bold'
                                                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
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

                            {/* Extra Link & Nested List for Update Versi Admin in Sidebar */}
                            {data.updateVersi && data.updateVersi.length > 0 && (
                                <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
                                    <button
                                        onClick={() => scrollToSection('update-versi')}
                                        className={`w-full flex items-center justify-between text-left px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${activeSection === 'update-versi' || activeSection.startsWith('update-')
                                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                                            }`}
                                    >
                                        <span className="truncate flex items-center gap-1.5">
                                            <History size={13} className="shrink-0" />
                                            Update Versi
                                        </span>
                                        <span className="font-semibold rounded-md shrink-0">
                                            {data.updateVersi[0]?.versi}
                                        </span>
                                    </button>

                                    {/* Nested UL LI for each admin version update */}
                                    <ul className="pl-3 pr-1 py-1 space-y-1 border-l border-slate-200 dark:border-slate-800 ml-3.5 animate-in slide-in-from-top-1 duration-250">
                                        {data.updateVersi.map((u) => {
                                            const versionId = `update-${u.versi.replace(/[^a-zA-Z0-9]/g, '-')}`;
                                            return (
                                                <li key={u.versi}>
                                                    <button
                                                        onClick={() => scrollToSection(versionId)}
                                                        className={`w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all truncate block ${activeSection === versionId
                                                            ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/30'
                                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
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

                {/* Mobile Drawer Navigation */}
                {sidebarOpen && (
                    <div className="fixed inset-0 z-50 md:hidden animate-in fade-in duration-200">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setSidebarOpen(false)} />
                        <div className="absolute top-16 left-0 bottom-0 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between animate-in slide-in-from-left duration-300">
                            <div className="space-y-4 flex-1 flex flex-col min-h-0">
                                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                        Menu Panduan Admin
                                    </h2>
                                    <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400">
                                        <X size={18} />
                                    </button>
                                </div>
                                <nav className="space-y-2 overflow-y-auto flex-1 pr-1 scrollbar-thin">
                                    {data.sections.map((section) => {
                                        const isParentActive = activeSection === section.id || (section.subsections && section.subsections.some(sub => activeSection === sub.id));
                                        return (
                                            <div key={section.id} className="space-y-1">
                                                <button
                                                    onClick={() => scrollToSection(section.id)}
                                                    className={`w-full flex items-center justify-between text-left px-3 py-2 rounded-xl text-xs font-bold transition-all ${isParentActive
                                                        ? 'bg-blue-600 text-white'
                                                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                        }`}
                                                >
                                                    <span>{section.title}</span>
                                                    <ChevronRight size={14} className={isParentActive ? 'rotate-90' : ''} />
                                                </button>
                                                {section.subsections && (
                                                    <ul className="pl-3 py-1 space-y-1 border-l border-slate-200 dark:border-slate-800 ml-3">
                                                        {section.subsections.map((sub) => (
                                                            <li key={sub.id}>
                                                                <button
                                                                    onClick={() => scrollToSection(sub.id)}
                                                                    className={`w-full text-left px-2.5 py-1 rounded-lg text-[11px] block ${activeSection === sub.id
                                                                        ? 'text-blue-600 dark:text-cyan-400 bg-blue-50 dark:bg-cyan-950/40 font-bold'
                                                                        : 'text-slate-500 dark:text-slate-400'
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

                                    {data.updateVersi && data.updateVersi.length > 0 && (
                                        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
                                            <button
                                                onClick={() => scrollToSection('update-versi')}
                                                className={`w-full flex items-center justify-between text-left px-3 py-2 rounded-xl text-xs font-bold transition-all ${activeSection === 'update-versi' || activeSection.startsWith('update-')
                                                    ? 'bg-emerald-600 text-white'
                                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                    }`}
                                            >
                                                <span className="flex items-center gap-1.5">
                                                    <History size={14} className="text-emerald-500 dark:text-emerald-400" />
                                                    Catatan Update Versi
                                                </span>
                                                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                                    {data.updateVersi[0]?.versi}
                                                </span>
                                            </button>

                                            <ul className="pl-3 py-1 space-y-1 border-l border-slate-200 dark:border-slate-800 ml-3">
                                                {data.updateVersi.map((u) => {
                                                    const versionId = `update-${u.versi.replace(/[^a-zA-Z0-9]/g, '-')}`;
                                                    return (
                                                        <li key={u.versi}>
                                                            <button
                                                                onClick={() => scrollToSection(versionId)}
                                                                className={`w-full text-left px-2.5 py-1 rounded-lg text-[11px] block ${activeSection === versionId
                                                                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 font-bold'
                                                                    : 'text-slate-500 dark:text-slate-400'
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
                        </div>
                    </div>
                )}

                {/* Right Content Pane */}
                <div className="flex-1 space-y-6 min-w-0">
                    {data.sections.map((section) => (
                        <section
                            key={section.id}
                            id={section.id}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xs scroll-mt-24 transition-all"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">
                                    <BookOpen size={20} />
                                </div>
                                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                                    {section.title}
                                </h2>
                            </div>

                            <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                                {section.content}
                            </p>

                            {section.image && (
                                <div className="mt-5 space-y-2">
                                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                        Tampilan Modul Admin
                                    </h4>
                                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                                        <Image
                                            src={section.image}
                                            alt={`Panduan ${section.title}`}
                                            className="w-full h-auto object-contain"
                                        />
                                    </div>
                                </div>
                            )}

                            {section.subsections && (
                                <div className="mt-6 space-y-6 border-t border-slate-100 dark:border-slate-800/80 pt-6">
                                    {section.subsections.map((sub) => (
                                        <div key={sub.id} id={sub.id} className="scroll-mt-24 space-y-2">
                                            <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                <span className="w-1.5 h-3.5 bg-blue-500 rounded-full shrink-0"></span>
                                                {sub.title}
                                            </h3>
                                            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line pl-3.5">
                                                {sub.content}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    ))}

                    {/* Admin Update Versi Section (UL / LI List) */}
                    {data.updateVersi && data.updateVersi.length > 0 && (
                        <section
                            id="update-versi"
                            className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/40 rounded-3xl p-6 md:p-8 shadow-xs scroll-mt-24"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                                    <History size={22} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                                            Catatan Update Versi Panel Admin
                                        </h2>
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-white">
                                            <Sparkles size={11} />
                                            Admin Release
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        Riwayat pembaruan modul panitia, hak akses role, dan keamanan sistem
                                    </p>
                                </div>
                            </div>

                            <ul className="space-y-5 list-none p-0 m-0">
                                {data.updateVersi.map((updateItem, index) => {
                                    const versionId = `update-${updateItem.versi.replace(/[^a-zA-Z0-9]/g, '-')}`;
                                    return (
                                        <li
                                            key={updateItem.versi || index}
                                            id={versionId}
                                            className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-xs relative overflow-hidden transition-all hover:border-emerald-300 dark:hover:border-emerald-800/80 scroll-mt-24"
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                                                <div className="flex items-center gap-2.5">
                                                    <span className="px-3 py-1 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs">
                                                        {updateItem.versi}
                                                    </span>
                                                    <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">
                                                        {updateItem.judul}
                                                    </h3>
                                                </div>
                                                <div className="flex items-center gap-1 text-xs font-semibold text-slate-400 dark:text-slate-500">
                                                    <Calendar size={13} />
                                                    <span>{updateItem.tanggal}</span>
                                                </div>
                                            </div>

                                            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                                                {updateItem.isi}
                                            </p>

                                            {updateItem.image && (
                                                <div className="mt-4 space-y-2">
                                                    <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                                        Screenshot Pembaruan
                                                    </h4>
                                                    <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-black">
                                                        <Image
                                                            src={updateItem.image}
                                                            alt={`Update Admin ${updateItem.versi}`}
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
    );
}
