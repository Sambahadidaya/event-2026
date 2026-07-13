'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
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
            <header
                className={`sticky top-4 z-40 mx-4 md:mx-8 px-4 md:px-6 py-2.5 rounded-2xl flex justify-between items-center transition-all duration-300
                glass shadow-lg shadow-black/5 dark:shadow-black/20`}
            >
                <Link href={`/${site}`} className="font-bold text-lg tracking-tight flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-white/20 shrink-0 group-hover:scale-105 transition-transform">
                        <Image
                            src={logo}
                            alt={`Logo ${theme.name}`}
                            className="w-full h-full object-cover"
                            width={40}
                            height={40}
                        />
                    </div>
                    <span className={`hidden sm:block bg-clip-text text-transparent bg-gradient-to-r ${theme.gradientText} font-extrabold`}>
                        {theme.name}
                    </span>
                </Link>

                <div className="flex items-center gap-4 md:gap-6">
                    <nav className="hidden md:flex gap-6 text-sm font-medium">
                        {links.map(link => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`transition-colors ${isActive
                                        ? (isPkkmb ? 'text-[#0068BB] dark:text-[#30A0E0]' : 'text-[#E85D04] dark:text-[#FCBF49]')
                                        : `text-gray-600 dark:text-gray-300 ${hoverColor}`
                                    }`}
                                >
                                    {link.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="flex items-center gap-2 md:pl-4 md:border-l md:border-gray-200/50 dark:md:border-gray-700/50">
                        <ThemeToggle />
                        <button
                            onClick={() => setIsOpen(true)}
                            className="md:hidden p-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-gray-800/60 transition-colors"
                            aria-label="Open menu"
                        >
                            <Menu size={24} />
                        </button>
                    </div>
                </div>
            </header>

            <div
                className={`md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsOpen(false)}
            />

            <div className={`md:hidden fixed top-0 right-0 h-[100dvh] w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-l border-gray-200/50 dark:border-white/10 shadow-2xl z-[60] flex flex-col transition-transform duration-300
                ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg overflow-hidden">
                            <Image src={logo} alt="" className="w-full h-full object-cover" width={32} height={32} />
                        </div>
                        <span className={`font-bold bg-clip-text text-transparent bg-gradient-to-r ${theme.gradientText}`}>
                            {theme.name}
                        </span>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                        aria-label="Close menu"
                    >
                        <X size={24} />
                    </button>
                </div>
                <nav className="flex flex-col p-4 gap-1 overflow-y-auto">
                    {links.map(link => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsOpen(false)}
                                className={`px-4 py-3 rounded-xl font-medium transition-colors ${
                                    isActive
                                        ? (isPkkmb ? 'bg-[#0068BB]/10 text-[#0068BB] dark:text-[#30A0E0]' : 'bg-orange-500/10 text-[#E85D04] dark:text-[#FCBF49]')
                                        : `text-gray-700 dark:text-gray-200 ${isPkkmb ? 'hover:bg-[#0068BB]/10 hover:text-[#0068BB]' : 'hover:bg-orange-500/10 hover:text-[#E85D04]'}`
                                }`}
                            >
                                {link.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </>
    );
}
