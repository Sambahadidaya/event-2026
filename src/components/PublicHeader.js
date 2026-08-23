'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, ChevronRight, Sparkles } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { usePathname } from 'next/navigation';
import { getTheme } from '@/lib/siteThemes';
import logoPkkmb from '@/assets/logopkkmb.png';
import logoPose from '@/assets/logopose.jpg';

export default function PublicHeader({ site, links = [] }) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();
    const theme = getTheme(site);
    const isPkkmb = site === 'pkkmb';
    const logo = isPkkmb ? logoPkkmb : logoPose;

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, []);

    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    const hoverColor = isPkkmb ? 'hover:text-[#30A0E0]' : 'hover:text-[#FCBF49]';

    if (pathname && pathname.startsWith('/pkkmb/materi/')) {
        return null;
    }

    return (
        <>
            {/* Header Main Bar */}
            <header
                className="sticky top-4 z-40 mx-4 md:mx-8 px-4 md:px-6 py-2.5 rounded-2xl flex justify-between items-center transition-all duration-300 glass shadow-lg shadow-black/5 dark:shadow-black/20"
            >
                {/* Brand Logo & Name */}
                <Link href={`/${site}`} className="font-bold text-lg tracking-tight flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-white/20 shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                        <Image
                            src={logo}
                            alt={`Logo ${theme.name}`}
                            className="w-full h-full object-cover"
                            width={40}
                            height={40}
                        />
                    </div>
                    <span className={`hidden sm:block bg-clip-text text-transparent bg-gradient-to-r ${theme.gradientText} font-extrabold text-base md:text-lg tracking-tight`}>
                        {theme.name}
                    </span>
                </Link>

                <div className="flex items-center gap-4 lg:gap-6">
                    {/* Desktop Navigation Links */}
                    <nav className="hidden lg:flex items-center gap-5 xl:gap-7 text-sm font-semibold">
                        {links.map(link => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`relative py-1.5 px-0.5 group transition-colors flex items-center ${
                                        isActive
                                            ? (isPkkmb ? 'text-[#0068BB] dark:text-[#30A0E0] font-extrabold' : 'text-[#E85D04] dark:text-[#FCBF49] font-extrabold')
                                            : `text-gray-600 dark:text-gray-300 ${hoverColor} font-semibold`
                                    }`}
                                >
                                    <span>{link.label}</span>

                                    {/* Underline Animation (Hover & Active) */}
                                    <span
                                        className={`absolute bottom-0 left-0 h-[2.5px] rounded-full transition-all duration-300 ease-out ${
                                            isActive
                                                ? `w-full ${isPkkmb ? 'bg-[#0068BB] dark:bg-[#30A0E0]' : 'bg-[#E85D04] dark:bg-[#FCBF49]'}`
                                                : `w-0 group-hover:w-full ${isPkkmb ? 'bg-[#30A0E0]' : 'bg-[#FCBF49]'}`
                                        }`}
                                    />
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Controls (Theme Toggle & Mobile Menu Trigger) */}
                    <div className="flex items-center gap-2.5 lg:pl-4 lg:border-l lg:border-gray-200/50 dark:lg:border-slate-800">
                        <ThemeToggle />

                        <button
                            onClick={() => setIsOpen(true)}
                            className="lg:hidden p-2 rounded-xl text-gray-700 dark:text-gray-200 bg-gray-100/70 dark:bg-slate-800/70 hover:bg-gray-200 dark:hover:bg-slate-700 transition-all border border-gray-200/50 dark:border-white/10 shadow-2xs active:scale-95"
                            aria-label="Open menu"
                        >
                            <Menu size={22} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Backdrop Overlay */}
            <div
                className={`lg:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[55] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsOpen(false)}
            />

            {/* Mobile Navigation Drawer */}
            <div
                className={`lg:hidden fixed top-0 right-0 h-[100dvh] w-[85vw] max-w-xs bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-l border-gray-200/80 dark:border-slate-800 shadow-2xl z-[60] flex flex-col justify-between transition-transform duration-300 ease-out ${
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                {/* Mobile Drawer Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-slate-800/80 bg-gray-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl overflow-hidden ring-2 ring-white/20 shadow-2xs">
                            <Image src={logo} alt="" className="w-full h-full object-cover" width={36} height={36} />
                        </div>
                        <div>
                            <span className={`font-extrabold text-base block bg-clip-text text-transparent bg-gradient-to-r ${theme.gradientText}`}>
                                {theme.name}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block -mt-0.5">
                                Navigasi Menu
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-2xs"
                        aria-label="Close menu"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Mobile Drawer Nav Links */}
                <nav className="flex flex-col p-4 gap-2 overflow-y-auto flex-1 scrollbar-thin">
                    {links.map(link => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsOpen(false)}
                                className={`group px-4 py-3 rounded-2xl text-xs md:text-sm transition-all duration-200 flex items-center justify-between ${
                                    isActive
                                        ? (isPkkmb
                                            ? 'bg-gradient-to-r from-[#0068BB] to-[#30A0E0] text-white shadow-md shadow-[#0068BB]/20 font-bold scale-[1.01]'
                                            : 'bg-gradient-to-r from-[#5B4FCF] via-[#E85D04] to-[#E85D04] text-white shadow-md shadow-[#E85D04]/20 font-bold scale-[1.01]')
                                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-slate-800/70 hover:text-gray-900 dark:hover:text-white font-semibold hover:translate-x-1'
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    {isActive && <Sparkles size={14} className="animate-pulse shrink-0" />}
                                    <span>{link.label}</span>
                                </span>
                                <ChevronRight
                                    size={16}
                                    className={`shrink-0 transition-transform ${
                                        isActive ? 'text-white translate-x-0' : 'text-gray-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5'
                                    }`}
                                />
                            </Link>
                        );
                    })}
                </nav>

                {/* Mobile Drawer Footer */}
                <div className="p-5 border-t border-gray-100 dark:border-slate-800/80 bg-gray-50/50 dark:bg-slate-950/40 space-y-3">
                    <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white dark:bg-slate-800/80 border border-gray-200/60 dark:border-slate-700/60 shadow-2xs">
                        <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Tema Tampilan</span>
                        <ThemeToggle />
                    </div>
                    <div className="text-center text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-widest pt-1">
                        {theme.name} • Politeknik LP3I 2026
                    </div>
                </div>
            </div>
        </>
    );
}
