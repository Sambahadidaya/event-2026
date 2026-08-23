'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mail, ExternalLink } from 'lucide-react';
import { getTheme } from '@/lib/siteThemes';
import { panduanData } from '@/data/panduanData';
import logoPkkmb from '@/assets/logopkkmb.png';
import logoPose from '@/assets/logopose.jpg';

export default function PublicFooter({ site, links = [] }) {
    const pathname = usePathname();
    const theme = getTheme(site);
    const year = new Date().getFullYear();
    const logo = site === 'pkkmb' ? logoPkkmb : logoPose;
    const latestVersion = panduanData[site]?.updateVersi?.[0]?.versi || 'v1.2';
    const isPkkmb = site === 'pkkmb';

    if (pathname && pathname.startsWith('/pkkmb/materi/')) {
        return null;
    }

    return (
        <footer className={`relative z-10 mt-auto ${theme.footerBg} text-white overflow-hidden`}>
            {/* Dekorasi top border modern */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <div className="max-w-6xl mx-auto px-6 md:px-8 pt-16 pb-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">
                    {/* Brand */}
                    <div className="md:col-span-4 flex flex-col items-start text-left">
                        <div className="flex items-center gap-4 mb-5">
                            <div className="w-14 h-14 rounded-2xl overflow-hidden ring-4 ring-white/10 shrink-0 bg-white/10 shadow-xl">
                                <Image
                                    src={logo}
                                    alt={`Logo ${theme.name}`}
                                    width={56}
                                    height={56}
                                    className="w-full h-full object-cover transition-transform hover:scale-105 duration-500"
                                />
                            </div>
                            <div>
                                <p className="font-bold text-2xl tracking-tight text-white">{theme.name} <span className="text-white/60 font-medium">{year}</span></p>
                                <p className="text-white/70 text-sm font-medium tracking-wide mt-0.5">{theme.tagline}</p>
                            </div>
                        </div>
                        <p className="text-white/60 text-sm leading-relaxed max-w-sm">
                            Portal resmi informasi kegiatan {theme.name} Politeknik LP3I. Temukan pengumuman, jadwal, dan hubungi panitia di sini.
                        </p>
                    </div>

                    {/* Navigasi */}
                    <div className="md:col-span-5 flex flex-col items-start w-full">
                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 mb-6">Navigasi</h3>
                        <nav className="grid grid-cols-2 gap-x-6 sm:gap-x-8 gap-y-3.5 w-full">
                            {links.map(link => {
                                const isActive = pathname === link.href || (link.href !== `/${site}` && link.href !== '/' && pathname?.startsWith(link.href));
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`text-sm transition-all duration-300 inline-flex items-center gap-2.5 group relative ${isActive
                                            ? (isPkkmb
                                                ? 'text-[#FFC872] font-bold translate-x-1'
                                                : site === 'pose'
                                                    ? 'text-[#FCBF49] font-bold translate-x-1'
                                                    : 'text-teal-300 font-bold translate-x-1')
                                            : 'text-white/70 hover:text-white font-medium'
                                            }`}
                                    >
                                        <span
                                            className={`rounded-full transition-all duration-300 shrink-0 ${isActive
                                                    ? (isPkkmb
                                                        ? 'w-2 h-2 bg-[#FFC872] shadow-sm shadow-[#FFC872]/80 ring-2 ring-[#FFC872]/40 scale-110'
                                                        : site === 'pose'
                                                            ? 'w-2 h-2 bg-[#FCBF49] shadow-sm shadow-[#FCBF49]/80 ring-2 ring-[#FCBF49]/40 scale-110'
                                                            : 'w-2 h-2 bg-teal-300 shadow-sm shadow-teal-300/80 ring-2 ring-teal-300/40 scale-110')
                                                    : 'w-1.5 h-1.5 bg-white/20 group-hover:bg-white group-hover:scale-125'
                                                }`}
                                        />
                                        <span className="group-hover:translate-x-1 transition-transform duration-300 truncate">
                                            {link.label}
                                        </span>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Portal & CTA */}
                    <div className="md:col-span-3 flex flex-col items-start mt-2 md:mt-0">
                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 mb-6">Hubungi Kami</h3>
                        <p className="text-white/60 text-sm mb-6 leading-relaxed max-w-xs">
                            Ada pertanyaan seputar kegiatan? Jangan ragu hubungi panitia kami.
                        </p>
                        <Link
                            href={`/${site}/contact`}
                            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-sm font-medium transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-white/5 backdrop-blur-sm group"
                        >
                            <Mail size={16} className="text-white/70 group-hover:text-white transition-colors" />
                            <span>Hubungi Panitia</span>
                        </Link>

                        <div className="mt-8 pt-6 border-t border-white/5 w-full md:hidden"></div>

                        {site === 'pkkmb' && (
                            <Link
                                href="/"
                                onClick={() => {
                                    if (typeof window !== 'undefined') {
                                        sessionStorage.setItem('portal_access', 'true');
                                    }
                                }}
                                className="inline-flex items-center gap-2 text-xs font-medium text-white/40 hover:text-white/90 transition-colors mt-2 md:mt-6 group"
                            >
                                <span>Kembali ke Portal Kampus</span>
                                <ExternalLink size={14} className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                        )}
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-14 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <p className="text-xs text-white/50 font-medium text-center md:text-left">
                            © {year} <span className="text-white/80">{site === 'pkkmb' ? 'PKKMB' : 'POSE'}</span> · Politeknik LP3I Bandung. All rights reserved
                        </p>
                        <Link
                            href={`/${site}/panduan#update-versi`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 hover:bg-white/20 text-white/80 hover:text-white border border-white/15 transition-all duration-300 shadow-xs"
                            title="Lihat Catatan Pembaruan Versi"
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>{latestVersion}</span>
                        </Link>
                    </div>
                    <a href='https://samba.my.id'
                        className="text-xs text-white/30 font-medium tracking-wider hover:text-white transition-colors duration-300">
                        Solo Developed by <span className="text-white/50 hover:text-white transition-colors duration-300">Samba</span>
                    </a>
                </div>
            </div>
        </footer>
    );
}

