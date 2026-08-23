'use client';

import { useEffect, useState, useRef } from 'react';
import { getFormPengumpulanFields } from '@/api/supabase/public/submission';
import Link from 'next/link';
import { ArrowRight, Trophy, Image as ImageIcon, ArrowUp, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import PageHero from '@/components/public/PageHero';
import ScheduleBarrier from '@/components/public/ScheduleBarrier';
import PengembangBarrier from '@/components/public/PengembangBarrier';

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

    const handleNext = () => {
        scrollToIndex(Math.min(activeIndex + 1, childArray.length - 1));
    };

    const handlePrev = () => {
        scrollToIndex(Math.max(activeIndex - 1, 0));
    };

    return (
        <div className="relative group/row w-full">
            {/* Left Button */}
            <button
                type="button"
                onClick={handlePrev}
                disabled={activeIndex === 0}
                aria-label="Previous card"
                className={`absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-white/90 dark:bg-gray-800/90 text-gray-800 dark:text-gray-200 shadow-lg border border-gray-200 dark:border-gray-700 transition-all flex items-center justify-center ${activeIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'opacity-100 hover:scale-110 active:scale-95'
                    }`}
            >
                <ChevronLeft size={20} />
            </button>

            {/* Scroll Container */}
            <div
                ref={rowRef}
                onScroll={handleScroll}
                className="flex items-center overflow-x-auto scrollbar-none py-8 flex-nowrap scroll-smooth px-[12vw] md:px-8 gap-4 md:gap-6 snap-x snap-mandatory"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {childArray.map((child, idx) => {
                    const isCenter = idx === activeIndex;

                    return (
                        <div
                            key={idx}
                            className={`carousel-card-item snap-center shrink-0 transition-all duration-300 ease-in-out transform w-[75vw] sm:w-[280px] md:w-[310px] ${isCenter
                                ? 'scale-105 z-10 opacity-100'
                                : 'scale-90 opacity-50 blur-[0.3px] md:scale-100 md:opacity-100 md:blur-none'
                                }`}
                        >
                            {child}
                        </div>
                    );
                })}
            </div>

            {/* Right Button */}
            <button
                type="button"
                onClick={handleNext}
                disabled={activeIndex === childArray.length - 1}
                aria-label="Next card"
                className={`absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-white/90 dark:bg-gray-800/90 text-gray-800 dark:text-gray-200 shadow-lg border border-gray-200 dark:border-gray-700 transition-all flex items-center justify-center ${activeIndex === childArray.length - 1 ? 'opacity-30 cursor-not-allowed' : 'opacity-100 hover:scale-110 active:scale-95'
                    }`}
            >
                <ChevronRight size={20} />
            </button>
        </div>
    );
}

export default function PoseSubmitPage() {
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasToken, setHasToken] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');

    // Scroll to Top FAB State
    const [showScrollTop, setShowScrollTop] = useState(false);

    useEffect(() => {
        const fetchForms = async () => {
            const data = await getFormPengumpulanFields('pose');
            if (data) {
                // Filter hanya data yang jenis lombanya adalah 'Kreativitas'
                const kreativitasForms = data.filter(form =>
                    form.jenis_lomba && form.jenis_lomba.toLowerCase() === 'kreativitas'
                );
                setForms(kreativitasForms);
            }
            if (typeof window !== 'undefined') {
                if (localStorage.getItem('pose_submit_token') || localStorage.getItem('pose_user_token')) {
                    setHasToken(true);
                }
            }
            setLoading(false);
        };

        fetchForms();
    }, []);

    useEffect(() => {
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

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Filter Logic
    const filteredForms = forms.filter(form =>
        form.nama_lomba?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <PengembangBarrier site="pose" route="/submission">
            <ScheduleBarrier pageType="jadwal">
                <div className="min-h-screen pt-24 pb-12 sm:pt-32 sm:pb-20 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-150 transition-colors duration-300">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <PageHero
                            title="Pengumpulan Karya"
                            subtitle="Pilih cabang lomba kreativitas dan kumpulkan hasil karya terbaikmu di sini!"
                            icon={Trophy}
                        />

                        {/* Search Bar */}
                        <div className="mt-8 flex justify-end">
                            <div className="relative w-full md:w-80">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
                                <input
                                    type="text"
                                    placeholder="Cari cabang lomba kreativitas..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm focus:ring-1 focus:ring-black dark:focus:ring-white outline-none transition-all placeholder-gray-400"
                                />
                            </div>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8 animate-pulse">
                                {[1, 2, 3].map(n => (
                                    <div key={n} className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-xs">
                                        <div className="h-48 bg-gray-200 dark:bg-gray-800 w-full" />
                                        <div className="p-6 space-y-4">
                                            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
                                            <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                                            <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-xl w-full mt-4" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredForms.length === 0 ? (
                            <div className="text-center mt-12 p-12 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl">
                                <Trophy size={48} className="mx-auto text-gray-400 mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Belum Ada Pengumpulan</h3>
                                <p className="text-gray-500 dark:text-gray-400">Tidak ada pengumpulan karya yang cocok dengan pencarian Anda saat ini.</p>
                            </div>
                        ) : (
                            <div className="mt-8 space-y-4">
                                <span className="text-sm font-bold text-gray-400 dark:text-gray-500 block uppercase tracking-wider md:text-left">
                                    Daftar Lomba Kreativitas
                                </span>
                                <HorizontalScrollRow>
                                    {filteredForms.map((form) => (
                                        <FormCard key={form.link_id || form.id} form={form} />
                                    ))}
                                </HorizontalScrollRow>
                            </div>
                        )}
                    </div>
                </div>

                {showScrollTop && (
                    <button
                        onClick={scrollToTop}
                        className="fixed bottom-24 right-8 z-50 p-3.5 rounded-full bg-black hover:bg-gray-900 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center border border-gray-200 dark:border-gray-800"
                        aria-label="Scroll to top"
                    >
                        <ArrowUp size={20} />
                    </button>
                )}
            </ScheduleBarrier>
        </PengembangBarrier>
    );
}

function FormCard({ form }) {
    return (
        <div className="group h-full bg-white dark:bg-gray-900/60 rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col">
            <div className="relative h-44 w-full bg-gray-100 dark:bg-gray-950 overflow-hidden shrink-0">
                {form.gambar ? (
                    <img
                        src={form.gambar}
                        alt={form.nama_lomba}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-700">
                        <ImageIcon size={40} className="opacity-30" />
                    </div>
                )}
                <div className="absolute top-3.5 left-3.5">
                    <span className="px-2.5 py-0.5 bg-black/90 dark:bg-white/95 text-[10px] font-bold uppercase tracking-wider rounded-md text-white dark:text-black">
                        {form.jenis_lomba}
                    </span>
                </div>
            </div>

            <div className="p-5 flex flex-col flex-1">
                <h3 className="text-lg font-bold text-gray-950 dark:text-white mb-1.5 line-clamp-2">
                    {form.nama_lomba}
                </h3>
                {form.keterangan ? (
                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-5 line-clamp-3 leading-relaxed flex-1">
                        {form.keterangan}
                    </p>
                ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-5 flex-1 italic">
                        Kumpulkan hasil karya tim kamu untuk cabang lomba {form.nama_lomba}.
                    </p>
                )}

                <Link
                    href={`/pose/submission/${form.link_id}`}
                    className="inline-flex items-center justify-center gap-1.5 w-full px-4 py-2.5 bg-black dark:bg-white hover:bg-gray-900 dark:hover:bg-gray-100 text-white dark:text-black rounded-xl text-xs font-bold transition-all"
                >
                    <span>Submit Karya</span>
                    <ArrowRight size={14} />
                </Link>
            </div>
        </div>
    );
}