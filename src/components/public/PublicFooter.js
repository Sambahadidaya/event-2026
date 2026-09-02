'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mail, ExternalLink } from 'lucide-react';
import { getTheme } from '@/lib/siteThemes';
import { panduanData } from '@/data/panduanData';
import logoPkkmb from '@/assets/logopkkmb.png';
import logoPose from '@/assets/logopose.jpg';

// Sponsor POSE
import sponsorPose1 from '@/assets/Sponsor_pose/1.png';
import sponsorPose2 from '@/assets/Sponsor_pose/2.png';
import sponsorPose3 from '@/assets/Sponsor_pose/3.png';

const SPONSOR_DATA = {
    pose: [
        {
            id: 1,
            img: sponsorPose1,
            name: 'Merchion.id',
            website: 'https://linktr.ee/Merchion.id',
            instagram: 'https://www.instagram.com/merchion.id/'
        },
        {
            id: 2,
            img: sponsorPose2,
            name: 'Mbok Darmi',
            links: [
                { type: 'website', url: 'https://susumbokdarmi.com/', title: 'Website' },
                { type: 'linktree', url: 'https://linktr.ee/Susu.Mbok.Darmi', title: 'Linktree' },
                { type: 'instagram', url: 'https://www.instagram.com/susu_mbokdarmi/', title: 'Instagram' },
            ]
        },
        {
            id: 3,
            img: sponsorPose3,
            name: 'Bank Mandiri',
            links: [
                { type: 'website', url: 'https://www.bankmandiri.co.id/', title: 'Website Mandiri' },
                { type: 'website', url: 'https://www.bankmandiri.co.id/livin/', title: 'Website Livin' },
                { type: 'linkinbio', url: 'https://linkin.bio/bankmandiri/', title: 'Linkinbio' },
                { type: 'instagram', url: 'https://www.instagram.com/bankmandiri/', title: 'Instagram' },
            ]
        },
    ],
    pkkmb: [], // Kosong: section otomatis disembunyikan
};

// Helper untuk mengekstrak seluruh link dari objek sponsor
const getSponsorLinks = (sponsor) => {
    if (Array.isArray(sponsor.links) && sponsor.links.length > 0) {
        return sponsor.links;
    }

    const result = [];
    if (sponsor.website && sponsor.website !== '#') {
        if (Array.isArray(sponsor.website)) {
            sponsor.website.forEach((url, idx) => {
                if (url && url !== '#') result.push({ type: 'website', url, title: `Website ${idx + 1}` });
            });
        } else {
            result.push({ type: 'website', url: sponsor.website, title: 'Website' });
        }
    }
    if (sponsor.linkee && sponsor.linkee !== '#') {
        result.push({ type: 'linkee', url: sponsor.linkee, title: 'Linkee' });
    }
    if (sponsor.linktree && sponsor.linktree !== '#') {
        result.push({ type: 'linktree', url: sponsor.linktree, title: 'Linktree' });
    }
    if (sponsor.lynkid && sponsor.lynkid !== '#') {
        result.push({ type: 'lynkid', url: sponsor.lynkid, title: 'Lynkid' });
    }
    if (sponsor.instagram && sponsor.instagram !== '#') {
        result.push({ type: 'instagram', url: sponsor.instagram, title: 'Instagram' });
    }

    // Fallback jika menggunakan placeholder '#' di awal
    if (result.length === 0) {
        if (sponsor.website) result.push({ type: 'website', url: sponsor.website, title: 'Website' });
        if (sponsor.linkee) result.push({ type: 'linkee', url: sponsor.linkee, title: 'Linkee' });
        if (sponsor.lynkid) result.push({ type: 'lynkid', url: sponsor.lynkid, title: 'Lynkid' });
        if (sponsor.instagram) result.push({ type: 'instagram', url: sponsor.instagram, title: 'Instagram' });
    }

    return result;
};

const renderLinkIcon = (type) => {
    switch (type) {
        case 'website':
            return (
                <svg className="w-4 h-4 md:w-5 md:h-5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
            );
        case 'linkee':
        case 'linktree':
        case 'lynkid':
            return (
                <svg className="w-4 h-4 md:w-5 md:h-5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
            );
        case 'instagram':
            return (
                <svg className="w-4 h-4 md:w-5 md:h-5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
            );
        default:
            return (
                <svg className="w-4 h-4 md:w-5 md:h-5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
            );
    }
};

export default function PublicFooter({ site, links = [] }) {
    const pathname = usePathname();
    const theme = getTheme(site);
    const year = new Date().getFullYear();
    const logo = site === 'pkkmb' ? logoPkkmb : logoPose;
    const latestVersion = panduanData[site]?.updateVersi?.[0]?.versi || 'v1.2';
    const isPkkmb = site === 'pkkmb';

    const sponsorList = SPONSOR_DATA[site] || [];
    const [isVisible, setIsVisible] = useState(false);
    const sponsorRef = useRef(null);

    useEffect(() => {
        if (!sponsorRef.current || sponsorList.length === 0) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting);
            },
            { threshold: 0.1 }
        );
        observer.observe(sponsorRef.current);
        return () => observer.disconnect();
    }, [sponsorList.length]);

    if (pathname && pathname.startsWith('/pkkmb/materi/')) {
        return null;
    }

    return (
        <footer className={`relative z-10 mt-auto ${theme.footerBg} text-white overflow-hidden`}>
            {/* Dekorasi top border modern */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            {/* ── SPONSOR MARQUEE SECTION ── */}
            {sponsorList.length > 0 && (
                <div ref={sponsorRef} className="w-full border-b border-white/10 pt-6 md:pt-10 lg:pt-12 pb-8 md:pb-12 lg:pb-14 relative z-10 bg-black/10">
                    <style>{`
                        @keyframes marquee {
                            from { transform: translateX(0); }
                            to { transform: translateX(-50%); }
                        }
                        .animate-marquee {
                            animation: marquee 30s linear infinite;
                            will-change: transform;
                            animation-play-state: ${isVisible ? 'running' : 'paused'};
                        }
                        .sponsor-marquee-container:hover .animate-marquee {
                            animation-play-state: paused !important;
                        }
                    `}</style>

                    {/* Judul terpisah dari area hover marquee */}
                    <p className="text-center text-xs md:text-sm lg:text-base font-bold uppercase tracking-[0.2em] text-white/40 mb-5 md:mb-8 lg:mb-10">
                        Official Sponsor & Partner
                    </p>

                    {/* Container Marquee khusus dengan Mask Image Gradient untuk fade transparan di kiri-kanan */}
                    <div className="sponsor-marquee-container relative overflow-hidden w-full [mask-image:linear-gradient(to_right,transparent_0%,black_8%,black_92%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_right,transparent_0%,black_8%,black_92%,transparent_100%)]">
                        <div className="animate-marquee flex items-center w-max">
                            {/* Duplikasi array untuk infinite loop seamless */}
                            {[...sponsorList, ...sponsorList, ...sponsorList, ...sponsorList].map((sponsor, i) => {
                                const activeLinks = getSponsorLinks(sponsor);

                                return (
                                    <div
                                        key={`${sponsor.id}-${i}`}
                                        className="group relative mx-2 sm:mx-3 md:mx-4 flex flex-col items-center justify-center h-28 md:h-40 lg:h-48 w-36 md:w-56 lg:w-72 shrink-0 cursor-pointer pt-2 pb-6"
                                    >
                                        {/* Logo Image dengan rasio 5:3 lebih besar */}
                                        <Image
                                            src={sponsor.img}
                                            alt={sponsor.name}
                                            width={300}
                                            height={180}
                                            className="h-14 md:h-24 lg:h-32 w-auto aspect-[5/3] object-contain opacity-80 grayscale transition-all duration-300 ease-out group-hover:opacity-100 group-hover:grayscale-0 group-hover:-translate-y-5 md:group-hover:-translate-y-7 lg:group-hover:-translate-y-8 group-hover:scale-105 group-hover:drop-shadow-2xl"
                                        />

                                        {/* Hover Action Buttons - Tumbuh ke Bawah sehingga tidak pernah menutup gambar logo */}
                                        {activeLinks.length > 0 && (
                                            <div className="absolute top-[62%] md:top-[64%] lg:top-[65%] left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2 max-w-[95%] flex-wrap justify-center opacity-0 translate-y-1 scale-90 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100 z-30">
                                                {activeLinks.map((linkItem, lIdx) => (
                                                    <a
                                                        key={lIdx}
                                                        href={linkItem.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="p-1.5 md:p-2 lg:p-2.5 rounded-full bg-white/25 hover:bg-white/50 text-white transition-all backdrop-blur-md border border-white/30 hover:scale-110 shadow-lg flex items-center justify-center"
                                                        title={linkItem.title || 'Kunjungi Link'}
                                                    >
                                                        {renderLinkIcon(linkItem.type)}
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

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
