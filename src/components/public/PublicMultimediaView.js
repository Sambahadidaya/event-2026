'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Camera, Video, Film, Search, Calendar, ExternalLink, Play, ChevronLeft, ChevronRight, X, Sparkles, ImageIcon, Eye } from 'lucide-react';
import { getDokumentasi, getKontenMultimedia } from '@/api/supabase/public/dokumentasi';
import { getDriveEmbedUrl } from '@/lib/driveUtils';
import PageHero from '@/components/public/PageHero';

// ============================================================
// Horizontal Scroll Carousel Row (Pattern dari /pose/register)
// ============================================================
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
            {/* Left Nav Button */}
            <button
                type="button"
                onClick={handlePrev}
                disabled={activeIndex === 0}
                aria-label="Previous card"
                className={`absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-white/90 dark:bg-gray-800/90 text-gray-800 dark:text-gray-200 shadow-xl border border-gray-200 dark:border-gray-700 transition-all flex items-center justify-center ${activeIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'opacity-100 hover:scale-110 active:scale-95'}`}
            >
                <ChevronLeft size={20} />
            </button>

            {/* Scroll Container */}
            <div
                ref={rowRef}
                onScroll={handleScroll}
                className="flex items-stretch overflow-x-auto scrollbar-none py-6 flex-nowrap scroll-smooth px-[10vw] md:px-8 gap-5 md:gap-7 snap-x snap-mandatory w-full"
            >
                {childArray.map((child, idx) => (
                    <div key={idx} className="carousel-card-item flex-none w-[78vw] sm:w-[350px] md:w-[380px] snap-center snap-always flex">
                        {child}
                    </div>
                ))}
            </div>

            {/* Right Nav Button */}
            <button
                type="button"
                onClick={handleNext}
                disabled={activeIndex === childArray.length - 1}
                aria-label="Next card"
                className={`absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-white/90 dark:bg-gray-800/90 text-gray-800 dark:text-gray-200 shadow-xl border border-gray-200 dark:border-gray-700 transition-all flex items-center justify-center ${activeIndex === childArray.length - 1 ? 'opacity-30 cursor-not-allowed' : 'opacity-100 hover:scale-110 active:scale-95'}`}
            >
                <ChevronRight size={20} />
            </button>
        </div>
    );
}

// ============================================================
// Main Public Multimedia View Component
// ============================================================
export default function PublicMultimediaView({
    site = 'pkkmb',
    initialFilterType = 'all' // 'all' | 'dokumentasi' | 'konten'
}) {
    const isPkkmb = site === 'pkkmb';

    const [dokumentasiData, setDokumentasiData] = useState([]);
    const [kontenData, setKontenData] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [filterType, setFilterType] = useState(initialFilterType); // 'all' | 'dokumentasi' | 'konten'
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDate, setFilterDate] = useState('');

    // Modals
    const [selectedDokumentasi, setSelectedDokumentasi] = useState(null);
    const [activeCuplikanIndex, setActiveCuplikanIndex] = useState(0);
    const [selectedKonten, setSelectedKonten] = useState(null);

    useEffect(() => {
        const loadAllData = async () => {
            setLoading(true);
            try {
                const [doks, kontens] = await Promise.all([
                    getDokumentasi(site),
                    getKontenMultimedia(site)
                ]);
                setDokumentasiData(doks || []);
                setKontenData(kontens || []);
            } catch (err) {
                console.error('Error fetching public multimedia data:', err);
            } finally {
                setLoading(false);
            }
        };

        loadAllData();
    }, [site]);

    // Filtered items
    const filteredDokumentasi = useMemo(() => {
        if (filterType === 'konten') return [];
        return dokumentasiData.filter(item => {
            const q = searchQuery.toLowerCase();
            const matchSearch = !searchQuery ||
                (item.judul && item.judul.toLowerCase().includes(q)) ||
                (item.tanggal_wib && item.tanggal_wib.toLowerCase().includes(q)) ||
                (item.tanggal && item.tanggal.includes(q)) ||
                (item.dokumentasi_cuplikan && item.dokumentasi_cuplikan.some(c => c.judul_cuplikan?.toLowerCase().includes(q)));
            const matchDate = !filterDate || item.tanggal === filterDate;
            return matchSearch && matchDate;
        });
    }, [dokumentasiData, filterType, searchQuery, filterDate]);

    const filteredKonten = useMemo(() => {
        if (filterType === 'dokumentasi') return [];
        return kontenData.filter(item => {
            const q = searchQuery.toLowerCase();
            const matchSearch = !searchQuery ||
                (item.judul && item.judul.toLowerCase().includes(q)) ||
                (item.deskripsi && item.deskripsi.toLowerCase().includes(q)) ||
                (item.tanggal_wib && item.tanggal_wib.toLowerCase().includes(q)) ||
                (item.tanggal && item.tanggal.includes(q));
            const matchDate = !filterDate || item.tanggal === filterDate;
            return matchSearch && matchDate;
        });
    }, [kontenData, filterType, searchQuery, filterDate]);

    // Open Dokumentasi Modal
    const handleOpenDokumentasi = (item) => {
        setSelectedDokumentasi(item);
        setActiveCuplikanIndex(0);
    };

    return (
        <div className="min-h-screen pb-24 animate-in fade-in duration-300">
            {/* Hero Section */}
            <PageHero
                badge={isPkkmb ? 'PKKMB 2026' : 'POSE 2026'}
                title={
                    filterType === 'dokumentasi'
                        ? `Dokumentasi Acara ${site.toUpperCase()}`
                        : filterType === 'konten'
                        ? `Konten Multimedia ${site.toUpperCase()}`
                        : `Galeri & Multimedia ${site.toUpperCase()}`
                }
                subtitle="Saksikan keseruan, kilas balik kegiatan, dokumentasi foto, dan video eksklusif persembahan Divisi Multimedia."
                gradient={
                    isPkkmb
                        ? 'from-blue-600 via-indigo-600 to-sky-500'
                        : 'from-emerald-600 via-teal-600 to-cyan-500'
                }
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 space-y-12">
                {/* Control Panel: Filters & Search */}
                <div className="bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl p-4 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl space-y-4">
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                        {/* Type Toggle: Semua | Dokumentasi | Konten */}
                        <div className="inline-flex p-1.5 rounded-2xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/60 dark:border-slate-700/60 self-start">
                            <button
                                type="button"
                                onClick={() => setFilterType('all')}
                                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                                    filterType === 'all'
                                        ? isPkkmb
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : 'bg-emerald-600 text-white shadow-md'
                                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                <Sparkles size={15} />
                                <span>Semua</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setFilterType('dokumentasi')}
                                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                                    filterType === 'dokumentasi'
                                        ? isPkkmb
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : 'bg-emerald-600 text-white shadow-md'
                                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                <Camera size={15} />
                                <span>Dokumentasi ({dokumentasiData.length})</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setFilterType('konten')}
                                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                                    filterType === 'konten'
                                        ? isPkkmb
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : 'bg-emerald-600 text-white shadow-md'
                                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                <Video size={15} />
                                <span>Konten Video ({kontenData.length})</span>
                            </button>
                        </div>

                        {/* Search & Date Filter */}
                        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                            {/* Search Input */}
                            <div className="relative flex-1 sm:w-72">
                                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari judul, deskripsi, tanggal..."
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>

                            {/* Date Filter */}
                            <div className="relative">
                                <input
                                    type="date"
                                    value={filterDate}
                                    onChange={(e) => setFilterDate(e.target.value)}
                                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                                    title="Filter berdasarkan tanggal"
                                />
                            </div>

                            {(searchQuery || filterDate) && (
                                <button
                                    type="button"
                                    onClick={() => { setSearchQuery(''); setFilterDate(''); }}
                                    className="text-xs font-semibold text-rose-500 hover:text-rose-600 hover:underline px-2"
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="py-24 text-center space-y-3">
                        <div className="inline-block p-4 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse">
                            <Film size={32} className={isPkkmb ? 'text-blue-500' : 'text-emerald-500'} />
                        </div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            Memuat multimedia dan dokumentasi...
                        </p>
                    </div>
                ) : (
                    <div className="space-y-16">
                        {/* ============================================================ */}
                        {/* SECTION 1: DOKUMENTASI KEGIATAN & ALBUM FOTO */}
                        {/* ============================================================ */}
                        {(filterType === 'all' || filterType === 'dokumentasi') && (
                            <section className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-2xl ${isPkkmb ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                                            <Camera size={22} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                                                Dokumentasi Acara
                                            </h2>
                                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                                Album foto dan cuplikan momen bersejarah {site.toUpperCase()} 2026.
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                        {filteredDokumentasi.length} Album
                                    </span>
                                </div>

                                {filteredDokumentasi.length === 0 ? (
                                    <div className="p-12 text-center bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                                        <Camera size={40} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                            Tidak ada dokumentasi yang cocok dengan pencarian.
                                        </p>
                                    </div>
                                ) : (
                                    <HorizontalScrollRow>
                                        {filteredDokumentasi.map((item) => {
                                            const fotoCount = (item.dokumentasi_cuplikan || []).filter(c => c.tipe_cuplikan === 'foto').length;
                                            const videoCount = (item.dokumentasi_cuplikan || []).filter(c => c.tipe_cuplikan !== 'foto').length;

                                            return (
                                                <div
                                                    key={item.id}
                                                    className="w-full h-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group/card"
                                                >
                                                    {/* Header image / thumbnail */}
                                                    <div className="relative w-full aspect-[4/3] bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                                                        {item.header_foto ? (
                                                            <img
                                                                src={item.header_foto}
                                                                alt={item.judul}
                                                                className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                                                                <Camera size={32} className="opacity-40 mb-1" />
                                                                <span className="text-xs">Foto Album</span>
                                                            </div>
                                                        )}

                                                        {/* Badge Tanggal */}
                                                        {item.tanggal_wib && (
                                                            <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-semibold bg-black/60 text-white backdrop-blur-md flex items-center gap-1.5 shadow">
                                                                <Calendar size={12} />
                                                                <span>{item.tanggal_wib}</span>
                                                            </div>
                                                        )}

                                                        {/* Cuplikan count badges */}
                                                        <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                                                            {videoCount > 0 && (
                                                                <div className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-600/90 text-white backdrop-blur-md flex items-center gap-1 shadow">
                                                                    <Film size={12} />
                                                                    <span>{videoCount} Video</span>
                                                                </div>
                                                            )}
                                                            {fotoCount > 0 && (
                                                                <div className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-600/90 text-white backdrop-blur-md flex items-center gap-1 shadow">
                                                                    <ImageIcon size={12} />
                                                                    <span>{fotoCount} Foto</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Card Body */}
                                                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                                        <div>
                                                            <h3 className="font-bold text-slate-800 dark:text-white text-base sm:text-lg line-clamp-2 leading-snug group-hover/card:text-blue-600 dark:group-hover/card:text-blue-400 transition-colors">
                                                                {item.judul}
                                                            </h3>
                                                        </div>

                                                        {/* Actions */}
                                                        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenDokumentasi(item)}
                                                                className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                                                                    isPkkmb
                                                                        ? 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-600 dark:hover:text-white'
                                                                        : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-600 dark:hover:text-white'
                                                                }`}
                                                            >
                                                                <Eye size={14} />
                                                                <span>Lihat Detail & Cuplikan</span>
                                                            </button>

                                                            {item.link_gdrive && (
                                                                <a
                                                                    href={item.link_gdrive}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="w-full py-2 px-3 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5 transition-colors"
                                                                >
                                                                    <ExternalLink size={13} />
                                                                    <span>Unduh Album di Google Drive</span>
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </HorizontalScrollRow>
                                )}
                            </section>
                        )}

                        {/* ============================================================ */}
                        {/* SECTION 2: KONTEN MULTIMEDIA / VIDEO HIGHLIGHTS */}
                        {/* ============================================================ */}
                        {(filterType === 'all' || filterType === 'konten') && (
                            <section className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-2xl ${isPkkmb ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400'}`}>
                                            <Video size={22} />
                                        </div>
                                        <div>
                                            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                                                Konten & Video Sorotan
                                            </h2>
                                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                                Aftermovie, video promosi, dan tayangan kreatif multimedia {site.toUpperCase()}.
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                        {filteredKonten.length} Video
                                    </span>
                                </div>

                                {filteredKonten.length === 0 ? (
                                    <div className="p-12 text-center bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                                        <Video size={40} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                            Tidak ada konten video yang cocok dengan pencarian.
                                        </p>
                                    </div>
                                ) : (
                                    <HorizontalScrollRow>
                                        {filteredKonten.map((item) => {
                                            const embedUrl = getDriveEmbedUrl(item.link_gdrive_video);
                                            return (
                                                <div
                                                    key={item.id}
                                                    className="w-full h-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group/card"
                                                >
                                                    {/* Video Thumbnail / Preview */}
                                                    <div className="relative w-full aspect-video bg-black overflow-hidden shrink-0 flex items-center justify-center">
                                                        {item.thumbnail ? (
                                                            <img
                                                                src={item.thumbnail}
                                                                alt={item.judul}
                                                                className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                                                            />
                                                        ) : embedUrl ? (
                                                            <iframe
                                                                src={embedUrl}
                                                                className="w-full h-full pointer-events-none border-0"
                                                                tabIndex={-1}
                                                            />
                                                        ) : (
                                                            <div className="flex flex-col items-center justify-center text-slate-500 text-xs">
                                                                <Video size={32} className="opacity-40 mb-1" />
                                                                <span>Video Multimedia</span>
                                                            </div>
                                                        )}

                                                        {/* Play overlay button */}
                                                        {embedUrl && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setSelectedKonten(item)}
                                                                aria-label={`Putar ${item.judul}`}
                                                                className="absolute inset-0 bg-black/40 opacity-90 group-hover/card:opacity-100 flex items-center justify-center transition-all backdrop-blur-[2px]"
                                                            >
                                                                <div className="p-4 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-2xl group-hover/card:scale-110 active:scale-95 transition-all">
                                                                    <Play size={24} fill="white" className="translate-x-0.5" />
                                                                </div>
                                                            </button>
                                                        )}

                                                        {/* Tanggal badge */}
                                                        {item.tanggal_wib && (
                                                            <div className="absolute bottom-2.5 left-2.5 px-2.5 py-0.5 rounded-lg text-[10px] font-semibold bg-black/70 text-white backdrop-blur-md">
                                                                {item.tanggal_wib}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Card Details */}
                                                    <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                                                        <div className="space-y-2">
                                                            <h3 className="font-bold text-slate-800 dark:text-white text-base line-clamp-2 leading-snug group-hover/card:text-blue-600 dark:group-hover/card:text-blue-400 transition-colors">
                                                                {item.judul}
                                                            </h3>
                                                            {item.deskripsi && (
                                                                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                                                                    {item.deskripsi}
                                                                </p>
                                                            )}
                                                        </div>

                                                        {embedUrl && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setSelectedKonten(item)}
                                                                className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                                                                    isPkkmb
                                                                        ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300'
                                                                        : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300'
                                                                }`}
                                                            >
                                                                <Play size={13} fill="currentColor" />
                                                                <span>Tonton Video Penuh</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </HorizontalScrollRow>
                                )}
                            </section>
                        )}
                    </div>
                )}
            </div>

            {/* ============================================================ */}
            {/* MODAL 1: DOKUMENTASI CUPLIKAN & FOTO/VIDEO VIEWER */}
            {/* ============================================================ */}
            {selectedDokumentasi && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        {/* Header Modal */}
                        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start gap-4 shrink-0 bg-slate-50/50 dark:bg-slate-800/30">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                                        Dokumentasi {selectedDokumentasi.site}
                                    </span>
                                    {selectedDokumentasi.tanggal_wib && (
                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                            • {selectedDokumentasi.tanggal_wib}
                                        </span>
                                    )}
                                </div>
                                <h3 className="font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white">
                                    {selectedDokumentasi.judul}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedDokumentasi(null)}
                                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body: Foto / Video Viewer & Cuplikan Selector */}
                        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
                            {selectedDokumentasi.dokumentasi_cuplikan && selectedDokumentasi.dokumentasi_cuplikan.length > 0 ? (
                                <div className="space-y-4">
                                    {/* Active Cuplikan Viewer */}
                                    {(() => {
                                        const currentCuplikan = selectedDokumentasi.dokumentasi_cuplikan[activeCuplikanIndex] || selectedDokumentasi.dokumentasi_cuplikan[0];
                                        const isFoto = currentCuplikan?.tipe_cuplikan === 'foto';
                                        const embedUrl = !isFoto ? getDriveEmbedUrl(currentCuplikan?.link_gdrive_video) : null;

                                        return (
                                            <div className="space-y-3">
                                                {isFoto ? (
                                                    <div className="relative w-full max-h-[55vh] rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center p-2 shadow-lg">
                                                        {currentCuplikan?.link_gdrive_video ? (
                                                            <img
                                                                src={currentCuplikan.link_gdrive_video}
                                                                alt={currentCuplikan.judul_cuplikan || 'Cuplikan Foto'}
                                                                className="max-h-[50vh] w-auto max-w-full object-contain rounded-xl"
                                                            />
                                                        ) : (
                                                            <div className="p-12 text-center text-slate-500">
                                                                <ImageIcon size={40} className="mx-auto mb-2 opacity-40" />
                                                                <span className="text-xs">Foto cuplikan tidak tersedia</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-lg">
                                                        {embedUrl ? (
                                                            <iframe
                                                                src={embedUrl}
                                                                allow="autoplay"
                                                                allowFullScreen
                                                                className="w-full h-full border-0"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-sm">
                                                                <Video size={40} className="mb-2 opacity-50" />
                                                                <span>Link video Google Drive tidak valid atau tidak tersedia</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 px-1">
                                                    <div>
                                                        <h4 className="font-bold text-sm sm:text-base text-slate-800 dark:text-white flex items-center gap-2">
                                                            {isFoto ? <ImageIcon size={16} className="text-emerald-500" /> : <Play size={16} className="text-blue-500" />}
                                                            <span>{currentCuplikan.judul_cuplikan || `Cuplikan #${activeCuplikanIndex + 1}`}</span>
                                                        </h4>
                                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                                            {isFoto ? 'Foto' : 'Video'} {activeCuplikanIndex + 1} dari {selectedDokumentasi.dokumentasi_cuplikan.length}
                                                        </span>
                                                    </div>

                                                    {isFoto && currentCuplikan?.link_gdrive_video && (
                                                        <a
                                                            href={currentCuplikan.link_gdrive_video}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                                                        >
                                                            <ExternalLink size={12} />
                                                            <span>Buka Foto Resolusi Penuh</span>
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Selector Cuplikan (Wrap buttons - tidak overflow horizontal terhalang) */}
                                    {selectedDokumentasi.dokumentasi_cuplikan.length > 1 && (
                                        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                Pilih Cuplikan Lainnya:
                                            </p>
                                            <div className="flex flex-wrap gap-2.5 py-1">
                                                {selectedDokumentasi.dokumentasi_cuplikan.map((cup, idx) => {
                                                    const isCupFoto = cup.tipe_cuplikan === 'foto';
                                                    const isActive = activeCuplikanIndex === idx;

                                                    return (
                                                        <button
                                                            key={idx}
                                                            type="button"
                                                            onClick={() => setActiveCuplikanIndex(idx)}
                                                            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 border ${
                                                                isActive
                                                                    ? isCupFoto
                                                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                                                                        : 'bg-blue-600 text-white border-blue-600 shadow-md'
                                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                                                            }`}
                                                        >
                                                            {isCupFoto ? (
                                                                <ImageIcon size={13} />
                                                            ) : (
                                                                <Play size={13} fill={isActive ? 'white' : 'currentColor'} />
                                                            )}
                                                            <span>{cup.judul_cuplikan || `Cuplikan #${idx + 1}`}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8 space-y-3">
                                    {selectedDokumentasi.header_foto && (
                                        <div className="relative max-w-lg mx-auto aspect-video rounded-2xl overflow-hidden shadow-md">
                                            <img
                                                src={selectedDokumentasi.header_foto}
                                                alt={selectedDokumentasi.judul}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Dokumentasi ini berisi arsip foto kegiatan lengkap yang tersimpan di Google Drive.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0 bg-slate-50/50 dark:bg-slate-800/30">
                            <span className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
                                Ingin mengunduh seluruh dokumentasi foto beresolusi penuh?
                            </span>
                            {selectedDokumentasi.link_gdrive ? (
                                <a
                                    href={selectedDokumentasi.link_gdrive}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md hover:shadow-blue-500/25"
                                >
                                    <ExternalLink size={15} />
                                    <span>Buka Folder Google Drive Asli</span>
                                </a>
                            ) : (
                                <span className="text-xs text-slate-400 italic">Folder Google Drive belum ditautkan</span>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* MODAL 2: KONTEN VIDEO PREVIEW */}
            {/* ============================================================ */}
            {selectedKonten && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-2">
                                    <Play size={16} className="text-blue-500" />
                                    {selectedKonten.judul}
                                </h3>
                                {selectedKonten.tanggal_wib && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {selectedKonten.tanggal_wib}
                                    </p>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedKonten(null)}
                                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="relative w-full aspect-video bg-black">
                            {getDriveEmbedUrl(selectedKonten.link_gdrive_video) ? (
                                <iframe
                                    src={getDriveEmbedUrl(selectedKonten.link_gdrive_video)}
                                    allow="autoplay"
                                    allowFullScreen
                                    className="w-full h-full border-0"
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-sm">
                                    <Video size={36} className="opacity-40 mb-2" />
                                    <span>Video tidak dapat dimuat</span>
                                </div>
                            )}
                        </div>

                        {selectedKonten.deskripsi && (
                            <div className="p-5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed overflow-y-auto">
                                {selectedKonten.deskripsi}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
