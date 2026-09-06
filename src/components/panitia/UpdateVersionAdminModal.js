'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, CheckCircle2, ArrowRight, X, Calendar } from 'lucide-react';
import { getUpdateVersionAdminConfig, shouldShowUpdateAdminPopup, markAdminVersionAsSeen } from '@/api/logic/updateVersionAdminLogic';

export default function UpdateVersionAdminModal({ site }) {
    const [isOpen, setIsOpen] = useState(false);
    const [config, setConfig] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const versionData = getUpdateVersionAdminConfig(site);
        if (!versionData) return;

        setConfig(versionData);

        // Delay 1.5 detik sebelum memunculkan modal agar panitia sempat melihat halaman
        const timer = setTimeout(() => {
            if (shouldShowUpdateAdminPopup(site)) {
                setIsOpen(true);
            }
        }, 1500);

        return () => clearTimeout(timer);
    }, [site]);

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

    if (!isOpen || !config || !config.updates || config.updates.length === 0) return null;

    const latestUpdate = config.updates[0];

    const handleDismiss = () => {
        markAdminVersionAsSeen(site);
        setIsOpen(false);
    };

    const handleViewDetails = () => {
        markAdminVersionAsSeen(site);
        setIsOpen(false);
        const el = document.getElementById('update-versi');
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            router.push('/panitia/panduan#update-versi');
        }
    };

    const badgeColor = site === 'pkkmb'
        ? 'bg-blue-600 text-white'
        : 'bg-orange-500 text-white';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 transition-none md:transition-opacity md:duration-300 md:animate-in md:fade-in">
            {/* Backdrop Overlay */}
            <div
                className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xs"
                onClick={handleDismiss}
            />

            {/* Modal Container */}
            <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 transition-none md:transition-all md:duration-300 md:animate-in md:zoom-in-95 flex flex-col text-slate-900 dark:text-slate-100">

                {/* Header Section */}
                <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800/80 flex items-start justify-between bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="space-y-1.5 pr-6">
                        <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${badgeColor}`}>
                                <Sparkles size={12} className="shrink-0" />
                                Update Admin {site ? site.toUpperCase() : ''}
                            </span>
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <Calendar size={12} className="shrink-0" />
                                {latestUpdate.date}
                            </span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-snug">
                            {latestUpdate.title}
                        </h3>
                    </div>

                    <button
                        onClick={handleDismiss}
                        className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                        aria-label="Tutup modal update admin"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body Section */}
                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Catatan Pembaruan Modul ({latestUpdate.version})
                    </p>

                    <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
                        {latestUpdate.highlights.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2.5">
                                <CheckCircle2 size={16} className={`shrink-0 mt-0.5 ${site === 'pkkmb' ? 'text-blue-600 dark:text-blue-400' : 'text-orange-500 dark:text-orange-400'}`} />
                                <span className="leading-relaxed">{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Footer Action Buttons */}
                <div className="p-5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-end gap-2.5">
                    <button
                        onClick={handleDismiss}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200/60 dark:border-slate-700/60 cursor-pointer"
                    >
                        Oke, Mengerti
                    </button>
                    <button
                        onClick={handleViewDetails}
                        className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer ${site === 'pkkmb' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-500 hover:bg-orange-600'}`}
                    >
                        <span>Lihat Detail Panduan</span>
                        <ArrowRight size={14} />
                    </button>
                </div>

            </div>
        </div>
    );
}
