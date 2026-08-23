'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
    Users,
    Search,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
    Image as ImageIcon,
    Check,
    X,
    ShieldCheck,
    ArrowUp
} from 'lucide-react';
import PageHero from '@/components/public/PageHero';
import ScheduleBarrier from '@/components/public/ScheduleBarrier';
import { getTeamsPublic } from '@/api/supabase/public/team';
import { JENIS_LOMBA, NAMA_LOMBA } from '@/lib/lombaData';
import PengembangBarrier from '@/components/public/PengembangBarrier';

// 1. Component HorizontalScrollRow yang sudah di-upgrade
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
            {/* Menggunakan items-start agar tinggi card tidak memanjang berbarengan saat ada card di-expand */}
            <div
                ref={rowRef}
                onScroll={handleScroll}
                className="flex items-start overflow-x-auto scrollbar-none py-8 flex-nowrap scroll-smooth px-[12vw] md:px-8 gap-4 md:gap-6 snap-x snap-mandatory"
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
                            <div className="w-full">
                                {child}
                            </div>
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
                className={`absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-white/90 dark:bg-gray-800/90 text-gray-800 dark:text-gray-200 shadow-lg border border-gray-200 dark:border-gray-700 transition-all flex items-center justify-center ${activeIndex === childArray.length - 1 ? 'opacity-30 cursor-not-allowed' : 'opacity-100 hover:scale-110 active:scale-95'}`}
            >
                <ChevronRight size={20} />
            </button>
        </div>
    );
}

const SUB_FILTERS = JENIS_LOMBA.reduce((acc, jenis) => {
    if (NAMA_LOMBA[jenis]) {
        acc[jenis] = ['Semua', ...NAMA_LOMBA[jenis]];
    }
    return acc;
}, {});

export default function PoseTeam() {
    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [mainFilter, setMainFilter] = useState('Semua');
    const [subFilter, setSubFilter] = useState('Semua');
    const [expandedTeam, setExpandedTeam] = useState(null);
    const [showScrollTop, setShowScrollTop] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            const data = await getTeamsPublic('pose');
            if (data) {
                const verifiedTeams = data.filter(t => t.verivikasi === true);
                setTeam(verifiedTeams);
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    useEffect(() => {
        setSubFilter('Semua');
    }, [mainFilter]);

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

    const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

    const toggleExpand = (id) => {
        if (expandedTeam === id) {
            setExpandedTeam(null);
        } else {
            setExpandedTeam(id);
        }
    };

    const filteredTeam = useMemo(() => {
        return team.filter(t => {
            const matchSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchMain = mainFilter === 'Semua' || (t.jenis_lomba && t.jenis_lomba.toLowerCase() === mainFilter.toLowerCase());
            const matchSub = subFilter === 'Semua' || (t.nama_lomba && t.nama_lomba.toLowerCase() === subFilter.toLowerCase());
            return matchSearch && matchMain && matchSub;
        });
    }, [team, searchQuery, mainFilter, subFilter]);

    const isFilterActive = mainFilter !== 'Semua' || subFilter !== 'Semua' || searchQuery.trim() !== '';

    return (
        <PengembangBarrier>

            <ScheduleBarrier pageType="jadwal">
                <div className="min-h-screen pt-24 pb-12 sm:pt-32 sm:pb-20 text-gray-900 dark:text-gray-150 transition-colors duration-300">
                    <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-8 pb-20">
                        <PageHero site="pose" icon={Users} title="Tim POSE" subtitle="Informasi tim dan peserta lomba" />

                        {/* Filter and Search Bar */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-12">
                            <div className="flex flex-wrap gap-2">
                                {['Semua', ...JENIS_LOMBA].map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setMainFilter(f)}
                                        className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${mainFilter === f ? 'bg-black dark:bg-white text-white dark:text-black border-transparent shadow-xs' : 'bg-white dark:bg-gray-900 text-gray-650 dark:text-gray-300 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-850'}`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>

                            <div className="relative w-full md:w-72 lg:w-80">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                    <Search size={18} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Cari nama tim..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-11 p-3 text-sm border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all placeholder-gray-400"
                                />
                            </div>
                        </div>

                        {mainFilter !== 'Semua' && SUB_FILTERS[mainFilter] && (
                            <div className="flex flex-wrap gap-2 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mr-2 flex items-center">Lomba:</span>
                                {SUB_FILTERS[mainFilter].map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setSubFilter(f)}
                                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${subFilter === f ? 'bg-black dark:bg-white text-white dark:text-black font-bold shadow-xs' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-850 border border-transparent'}`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        )}

                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
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
                        ) : filteredTeam.length === 0 ? (
                            <div className="p-12 rounded-3xl text-center border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 mt-12">
                                <Users size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Belum Ada Tim</h3>
                                <p className="text-gray-500 dark:text-gray-400">Belum ada tim yang terverifikasi atau kata kunci tidak ditemukan.</p>
                            </div>
                        ) : isFilterActive ? (
                            // Menggunakan HorizontalScrollRow saat mode filter aktif
                            <div className="mt-12 space-y-4">
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                    <ShieldCheck className="text-black dark:text-white" /> Hasil Pencarian Tim
                                </h2>
                                <HorizontalScrollRow>
                                    {filteredTeam.map((t, index) => {
                                        // Fallback ID unik (memperbaiki BUG expand)
                                        const uniqueId = t.id || `filter-team-${index}`;
                                        return (
                                            <TeamCard
                                                key={uniqueId}
                                                team={t}
                                                isExpanded={expandedTeam === uniqueId}
                                                onToggleExpand={() => toggleExpand(uniqueId)}
                                            />
                                        );
                                    })}
                                </HorizontalScrollRow>
                            </div>
                        ) : (
                            // Menggunakan HorizontalScrollRow saat mode biasa (Grouping)
                            <div className="mt-12 space-y-16">
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                    <ShieldCheck className="text-black dark:text-white" /> Tim Terverifikasi
                                </h2>

                                {JENIS_LOMBA.map(jenis => {
                                    const jenisTeams = team.filter(t => t.jenis_lomba === jenis);
                                    if (jenisTeams.length === 0) return null;

                                    return (
                                        <div key={jenis} className="space-y-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-1.5 h-6 bg-black dark:bg-white rounded-full"></div>
                                                <h3 className="text-xl font-black text-gray-950 dark:text-white">
                                                    {jenis}
                                                </h3>
                                            </div>

                                            <HorizontalScrollRow>
                                                {jenisTeams.map((t, index) => {
                                                    // Fallback ID unik (memperbaiki BUG expand)
                                                    const uniqueId = t.id || `group-team-${jenis}-${index}`;
                                                    return (
                                                        <TeamCard
                                                            key={uniqueId}
                                                            team={t}
                                                            isExpanded={expandedTeam === uniqueId}
                                                            onToggleExpand={() => toggleExpand(uniqueId)}
                                                        />
                                                    );
                                                })}
                                            </HorizontalScrollRow>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Scroll to Top FAB */}
                {showScrollTop && (
                    <button
                        onClick={scrollToTop}
                        className="fixed bottom-8 right-8 z-50 p-3.5 rounded-full bg-black hover:bg-gray-900 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center border border-gray-200 dark:border-gray-800"
                        aria-label="Scroll to top"
                    >
                        <ArrowUp size={20} />
                    </button>
                )}
            </ScheduleBarrier>
        </PengembangBarrier>

    );
}

function TeamCard({ team, isExpanded, onToggleExpand }) {
    return (
        <div className="glass rounded-3xl overflow-hidden transition-all duration-300 flex flex-col group">
            {/* Seluruh area atas bisa diklik untuk expand/collapse */}
            <div
                className="p-6 flex-1 flex flex-col cursor-pointer select-none"
                onClick={onToggleExpand}
            >
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                        {team.gambar ? (
                            <div className="w-14 h-14 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-xs shrink-0">
                                <img src={team.gambar} alt={team.title} className="w-full h-full object-cover" />
                            </div>
                        ) : (
                            <div className="w-14 h-14 rounded-2xl bg-white/30 dark:bg-black/30 flex items-center justify-center text-gray-400 border border-white/40 dark:border-white/10 shrink-0">
                                <ImageIcon size={24} className="opacity-40" />
                            </div>
                        )}
                        <div className="min-w-0">
                            <h3 className="text-base font-bold text-gray-900 dark:text-white truncate leading-snug mb-1" title={team.title}>
                                {team.title}
                            </h3>
                            <div className="flex flex-wrap gap-1.5 items-center">
                                {team.nama_lomba && (
                                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-white/50 dark:bg-white/10 text-gray-800 dark:text-gray-300">
                                        {team.nama_lomba}
                                    </span>
                                )}
                                {team.jenis_kategori && (
                                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-black text-white dark:bg-white dark:text-black capitalize">
                                        {team.jenis_kategori}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* Indikator expand di pojok kanan atas */}
                    <div className="w-7 h-7 rounded-full bg-white/30 dark:bg-white/10 flex items-center justify-center text-gray-500 dark:text-gray-400 shrink-0 ml-2">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                </div>

                {team.content && team.content.trim() !== '' && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic mb-4 line-clamp-2 leading-relaxed flex-1">
                        "{team.content}"
                    </p>
                )}

                <div className="mt-auto pt-4 border-t border-white/20 dark:border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                            {team.team_members?.slice(0, 3).map((m, i) => (
                                <div key={i} className="w-7 h-7 rounded-full bg-white/40 dark:bg-white/10 border-2 border-white/60 dark:border-white/20 flex items-center justify-center text-[10px] font-bold text-gray-700 dark:text-gray-300 z-10">
                                    {m.nama.charAt(0).toUpperCase()}
                                </div>
                            ))}
                            {team.team_members?.length > 3 && (
                                <div className="w-7 h-7 rounded-full bg-white/30 dark:bg-white/10 border-2 border-white/60 dark:border-white/20 flex items-center justify-center text-[10px] font-bold text-gray-500 dark:text-gray-400 z-10">
                                    +{team.team_members.length - 3}
                                </div>
                            )}
                        </div>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold">{team.team_members?.length || 0} Anggota</span>
                    </div>
                </div>
            </div>

            {/* Expanded Content */}
            <div className={`transition-all duration-300 overflow-hidden bg-white/20 dark:bg-white/5 border-t border-white/20 dark:border-white/10 ${isExpanded ? 'max-h-96 opacity-100 overflow-y-auto' : 'max-h-0 opacity-0'}`}>
                <div className="p-5">
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white mb-3">Daftar Anggota</h4>
                    {(!team.team_members || team.team_members.length === 0) ? (
                        <p className="text-xs text-gray-500 italic">Belum ada data anggota.</p>
                    ) : (
                        <div className="space-y-2">
                            {team.team_members.map(member => (
                                <div key={member.id || Math.random()} className="bg-white dark:bg-gray-950 p-2.5 rounded-xl border border-gray-200/60 dark:border-gray-800 shadow-2xs flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-850 flex items-center justify-center text-gray-700 dark:text-gray-300 font-bold text-xs shrink-0">
                                        {member.nama.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{member.nama}</p>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="text-[10px] text-gray-500 truncate">{member.jabatan || 'Anggota'}</span>
                                            {member.kampus && member.kampus !== 'Umum' && (
                                                <>
                                                    <span className="text-[10px] text-gray-300 dark:text-gray-800">•</span>
                                                    <span className="text-[10px] font-medium bg-gray-100 dark:bg-gray-850 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-400 truncate">{member.kampus}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
