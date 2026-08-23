'use client';

import React from 'react';
import * as LucideIcons from 'lucide-react';
import { getTheme } from '@/lib/siteThemes';
import { lombaPoseList } from '@/data/lombaPose';
import Carousel from '@/components/public/Carousel';

const getLucideIcon = (name) => {
    return LucideIcons[name] || LucideIcons.Trophy;
};

const PjLombaCard = ({ lomba, theme }) => {
    const IconComponent = getLucideIcon(lomba.lucideIcon);
    const contactsList = lomba.contacts || [];

    return (
        <div className="glass rounded-[2rem] p-6 group hover:-translate-y-2 transition-all duration-500 hover:shadow-2xl hover:shadow-black/5 flex flex-col border border-white/50 dark:border-white/10 relative overflow-hidden justify-between h-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-md min-h-[200px]">
            {/* Soft Ambient Glow */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${theme.gradient} opacity-10 blur-2xl rounded-full group-hover:opacity-20 transition-opacity`} />

            {/* Header Card: Icon & Nama Lomba */}
            <div className="flex items-center gap-3 relative z-10 mb-4 pb-3 border-b border-gray-100 dark:border-slate-800/80">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white dark:bg-slate-800 border border-gray-200/80 dark:border-white/10 shadow-xs shrink-0 text-[#E85D04]">
                    <IconComponent size={24} />
                </div>
                <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 dark:text-gray-500 block">
                        PJ Lomba
                    </span>
                    <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white leading-snug tracking-tight">
                        {lomba.nama}
                    </h3>
                </div>
            </div>

            {/* Contact Buttons (Nama Kontak & Link WA) */}
            <div className="space-y-2 relative z-10 flex-1 flex flex-col justify-center">
                {contactsList.map((contact, idx) => (
                    <a
                        key={idx}
                        href={contact.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold bg-green-500/10 hover:bg-green-600 text-green-700 dark:text-green-400 hover:text-white border border-green-500/20 hover:border-green-600 transition-all duration-200 active:scale-95 group/btn shadow-2xs"
                    >
                        <span className="flex items-center gap-2.5 truncate font-bold">
                            <LucideIcons.MessageCircle size={18} className="shrink-0 text-green-600 dark:text-green-400 group-hover/btn:text-white transition-colors" />
                            <span className="truncate">{contact.name}</span>
                        </span>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 opacity-90 group-hover/btn:opacity-100 shrink-0">
                            Chat WA <LucideIcons.ChevronRight size={12} />
                        </span>
                    </a>
                ))}
            </div>
        </div>
    );
};

export default function PjLombaContactSection({ site = 'pose' }) {
    const theme = getTheme(site);

    return (
        <section className="mt-16 pt-12 border-t border-gray-100 dark:border-slate-800/80">
            <div className="text-center mb-8">
                <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-widest border mb-3 ${theme.badge}`}>
                    <LucideIcons.Sparkles size={14} />
                    Panitia Lomba POSE 2026
                </span>
                <h2 className="text-2xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
                    Kontak Penanggung Jawab (PJ) Lomba
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base max-w-2xl mx-auto">
                    Hubungi langsung panitia penanggung jawab masing-masing cabang lomba di bawah ini.
                </p>
            </div>

            <div className="mt-6">
                <Carousel
                    items={lombaPoseList}
                    animated={true}
                    autoPlay={false}
                    renderItem={(lomba) => (
                        <PjLombaCard lomba={lomba} theme={theme} />
                    )}
                />
            </div>
        </section>
    );
}
