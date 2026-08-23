'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Users, Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Image as ImageIcon, ExternalLink, ArrowUp } from 'lucide-react';
import PageHero from '@/components/public/PageHero';
import { getKelompokPublic } from '@/api/supabase/public/kelompok';
import PengembangBarrier from '@/components/public/PengembangBarrier';

// Horizontal Scroll Carousel Row Component
function HorizontalScrollRow({ children }) {
    const rowRef = useRef(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const childArray = Array.isArray(children) ? children : [children];

    const handleScroll = () => {
        if (!rowRef.current) return;
        const container = rowRef.current;
        const scrollPosition = container.scrollLeft + container.clientWidth / 2;
        const items = container.querySelectorAll('.carousel-card-item');

        items.forEach((item, index) => {
            const itemLeft = item.offsetLeft;
            const itemRight = itemLeft + item.offsetWidth;
            if (scrollPosition >= itemLeft && scrollPosition <= itemRight) {
                setActiveIndex(index);
            }
        });
    };

    const scrollToIndex = (index) => {
        if (index < 0 || index >= childArray.length) return;
        setActiveIndex(index);

        if (rowRef.current) {
            const items = rowRef.current.querySelectorAll('.carousel-card-item');
            if (items[index]) {
                items[index].scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'center'
                });
            }
        }
    };

    const handleNext = () => scrollToIndex(Math.min(activeIndex + 1, childArray.length - 1));
    const handlePrev = () => scrollToIndex(Math.max(activeIndex - 1, 0));

    return (
        <div className="relative group/row w-full">
            {/* Left Button */}
            <button
                type="button"
                onClick={handlePrev}
                disabled={activeIndex === 0}
                aria-label="Previous card"
                className={`absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-white/90 dark:bg-gray-800/90 text-gray-800 dark:text-gray-200 shadow-lg border border-gray-200 dark:border-gray-700 transition-all flex items-center justify-center ${activeIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'opacity-100 hover:scale-110 active:scale-95'}`}
            >
                <ChevronLeft size={20} />
            </button>

            {/* Scroll Container */}
            <div
                ref={rowRef}
                onScroll={handleScroll}
                className="flex items-start overflow-x-auto scrollbar-none py-8 flex-nowrap scroll-smooth px-[12vw] md:px-8 gap-4 md:gap-6 snap-x snap-mandatory w-full"
            >
                {childArray.map((child, idx) => (
                    <div key={idx} className="carousel-card-item flex-none w-[76vw] sm:w-[350px] snap-center snap-always">
                        {child}
                    </div>
                ))}
            </div>

            {/* Right Button */}
            <button
                type="button"
                onClick={handleNext}
                disabled={activeIndex === childArray.length - 1}
                aria-label="Next card"
                className={`absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-white/90 dark:bg-gray-800/90 text-gray-800 dark:text-gray-200 shadow-lg border border-gray-200 dark:border-gray-700 transition-all flex items-center justify-center ${activeIndex === childArray.length - 1 ? 'opacity-30 cursor-not-allowed' : 'opacity-100 hover:scale-110 active:scale-95'}`}
            >
                <ChevronRight size={20} />
            </button>
        </div>
    );
}

export default function PkkmbKelompok() {
    const [kelompok, setKelompok] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedKelompok, setExpandedKelompok] = useState(null);
    const [showScrollTop, setShowScrollTop] = useState(false);

    useEffect(() => {
        const fetchKelompok = async () => {
            const data = await getKelompokPublic();
            setKelompok(data || []);
            setLoading(false);
        };
        fetchKelompok();

        const handleScroll = () => {
            if (window.scrollY > 300) {
                setShowScrollTop(true);
            } else {
                setShowScrollTop(false);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

    const toggleExpand = (id) => {
        if (expandedKelompok === id) {
            setExpandedKelompok(null);
        } else {
            setExpandedKelompok(id);
        }
    };

    const filteredKelompok = useMemo(() => {
        return kelompok.filter(k =>
            k.nama_kelompok.toLowerCase().includes(searchQuery.toLowerCase()) ||
            k.nama_kabim.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [kelompok, searchQuery]);

    return (
        <div className="min-h-screen pt-24 pb-12 sm:pt-32 sm:pb-20 text-gray-900 dark:text-gray-150 transition-colors duration-300">
            <PengembangBarrier>

                <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-8 pb-20">
                    <PageHero site="pkkmb" icon={Users} title="Kelompok PKKMB" subtitle="Informasi pembagian kelompok dan anggota peserta PKKMB 2026" />

                    {/* Search Bar */}
                    <div className="flex flex-col md:flex-row md:items-center justify-end gap-4 mt-12">
                        <div className="relative w-full md:w-72 lg:w-80">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                <Search size={18} />
                            </div>
                            <input
                                type="text"
                                placeholder="Cari kelompok / kabim..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-11 p-3 text-sm border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-400"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 space-y-4">
                                    <div className="flex gap-4 items-center">
                                        <div className="w-14 h-14 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
                                        <div className="space-y-2 flex-1">
                                            <div className="h-5 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
                                            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
                                        </div>
                                    </div>
                                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
                                </div>
                            ))}
                        </div>
                    ) : filteredKelompok.length === 0 ? (
                        <div className="p-12 rounded-3xl text-center border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 mt-12">
                            <Users size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Belum Ada Kelompok</h3>
                            <p className="text-gray-500 dark:text-gray-400">Data kelompok tidak ditemukan atau kosong.</p>
                        </div>
                    ) : (
                        <div className="mt-12 space-y-4 w-full">
                            <HorizontalScrollRow>
                                {filteredKelompok.map((k, index) => {
                                    const uniqueId = k.id || `kelompok-${index}`;
                                    return (
                                        <KelompokCard
                                            key={uniqueId}
                                            item={k}
                                            isExpanded={expandedKelompok === uniqueId}
                                            onToggleExpand={() => toggleExpand(uniqueId)}
                                        />
                                    );
                                })}
                            </HorizontalScrollRow>
                        </div>
                    )}
                </div>

                {/* Scroll to Top FAB */}
                {showScrollTop && (
                    <button
                        onClick={scrollToTop}
                        className="fixed bottom-8 right-8 z-50 p-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center border border-blue-500"
                        aria-label="Scroll to top"
                    >
                        <ArrowUp size={20} />
                    </button>
                )}
            </PengembangBarrier>
        </div>
    );
}

function KelompokCard({ item, isExpanded, onToggleExpand }) {
    return (
        <div className="glass rounded-3xl overflow-hidden transition-all duration-300 flex flex-col group w-full">
            {/* Seluruh area atas bisa diklik untuk expand/collapse */}
            <div
                className="p-6 flex-1 flex flex-col cursor-pointer select-none"
                onClick={onToggleExpand}
            >
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                        {item.foto_kelompok ? (
                            <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/40 dark:border-white/10 shadow-xs shrink-0">
                                <img src={item.foto_kelompok} alt={item.nama_kelompok} className="w-full h-full object-cover" />
                            </div>
                        ) : (
                            <div className="w-14 h-14 rounded-2xl bg-white/30 dark:bg-black/30 flex items-center justify-center text-gray-400 border border-white/40 dark:border-white/10 shrink-0">
                                <ImageIcon size={24} className="opacity-40" />
                            </div>
                        )}
                        <div className="min-w-0">
                            <h3 className="text-base font-bold text-gray-900 dark:text-white truncate leading-snug mb-1" title={item.nama_kelompok}>
                                {item.nama_kelompok}
                            </h3>
                            <div className="flex flex-wrap gap-1.5 items-center">
                                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100/70 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">
                                    PJ: {item.nama_kabim}
                                </span>
                                {item.link_instagram && (
                                    <a
                                        href={item.link_instagram}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={e => e.stopPropagation()}
                                        className="inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded bg-pink-50/70 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400"
                                    >
                                        @{item.link_instagram.split('/').pop() || 'ig'}
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* Indikator expand di pojok kanan atas */}
                    <div className="w-7 h-7 rounded-full bg-white/30 dark:bg-white/10 flex items-center justify-center text-gray-500 dark:text-gray-400 shrink-0 ml-2">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                </div>

                {item.keterangan && item.keterangan.trim() !== '' && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic mb-4 line-clamp-2 leading-relaxed flex-1">
                        "{item.keterangan}"
                    </p>
                )}

                <div className="mt-auto pt-4 border-t border-white/20 dark:border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                            {item.kelompok_members?.slice(0, 3).map((m, i) => (
                                <div key={i} className="w-7 h-7 rounded-full bg-blue-100/60 dark:bg-blue-900/40 border-2 border-white/60 dark:border-white/20 flex items-center justify-center text-[10px] font-bold text-blue-700 dark:text-blue-300 z-10">
                                    {m.nama_anggota.charAt(0).toUpperCase()}
                                </div>
                            ))}
                            {item.kelompok_members?.length > 3 && (
                                <div className="w-7 h-7 rounded-full bg-white/30 dark:bg-white/10 border-2 border-white/60 dark:border-white/20 flex items-center justify-center text-[10px] font-bold text-gray-500 dark:text-gray-400 z-10">
                                    +{item.kelompok_members.length - 3}
                                </div>
                            )}
                        </div>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold">{(item.kelompok_members || []).length} Anggota</span>
                    </div>
                </div>
            </div>

            {/* Expanded Content */}
            <div className={`transition-all duration-300 overflow-hidden bg-white/20 dark:bg-white/5 border-t border-white/20 dark:border-white/10 ${isExpanded ? 'max-h-96 opacity-100 overflow-y-auto' : 'max-h-0 opacity-0'}`}>
                <div className="p-5">
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white mb-3">Daftar Anggota (Nama Saja)</h4>
                    {(!item.kelompok_members || item.kelompok_members.length === 0) ? (
                        <p className="text-xs text-gray-500 italic">Belum ada data anggota.</p>
                    ) : (
                        <div className="grid grid-cols-1 gap-2">
                            {item.kelompok_members.map(member => (
                                <div key={member.id || Math.random()} className="bg-white dark:bg-gray-950 p-2.5 rounded-xl border border-gray-200/60 dark:border-gray-800 shadow-2xs flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-900/50 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-xs shrink-0">
                                        {member.nama_anggota.charAt(0).toUpperCase()}
                                    </div>
                                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{member.nama_anggota}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
