'use client';

import { useState, useEffect, useMemo } from 'react';
import { Users, Search, ChevronDown, ChevronUp, Image as ImageIcon, Check, X, ShieldCheck } from 'lucide-react';
import PageHero from '@/components/public/PageHero';
import ScheduleBarrier from '@/components/public/ScheduleBarrier';
import { getVerifiedPoseTeams, getTeams } from '@/api/supabase/public/team';
import { JENIS_LOMBA, NAMA_LOMBA } from '@/lib/lombaData';

const InstagramIcon = ({ size = 14, className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
);

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

    useEffect(() => {
        const fetchData = async () => {
            const data = await getTeams('pose');
            
            if (data) {
                // Filter verified only on client since getTeams already includes members
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

    return (
        <ScheduleBarrier pageType="team">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 animate-in fade-in duration-500 space-y-8 pb-20">
            <PageHero site="pose" icon={Users} title="Tim POSE" subtitle="Informasi pembagian tim dan peserta lomba" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div className="flex flex-wrap gap-2">
                    {['Semua', ...JENIS_LOMBA].map(f => (
                        <button
                            key={f}
                            onClick={() => setMainFilter(f)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${mainFilter === f ? 'bg-orange-500 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-orange-900/40'}`}
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
                        className="w-full pl-11 p-3.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 outline-none focus:ring-2 focus:ring-orange-500 shadow-sm transition-all placeholder-gray-400"
                    />
                </div>
            </div>

            {mainFilter !== 'Semua' && SUB_FILTERS[mainFilter] && (
                <div className="flex flex-wrap gap-2 mb-8 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mr-2 flex items-center">Lomba:</span>
                    {SUB_FILTERS[mainFilter].map(f => (
                        <button
                            key={f}
                            onClick={() => setSubFilter(f)}
                            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${subFilter === f ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 font-bold shadow-sm border border-orange-200 dark:border-orange-800' : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 border border-transparent'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 space-y-4">
                            <div className="flex gap-4 items-center">
                                <div className="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
                                <div className="space-y-2 flex-1">
                                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                                </div>
                            </div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                            <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                <div className="flex gap-2 items-center">
                                    <div className="flex -space-x-2">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-800"></div>
                                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-800"></div>
                                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-800"></div>
                                    </div>
                                    <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredTeam.length === 0 ? (
                <div className="glass p-12 rounded-2xl text-center shadow-sm">
                    <Users size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Belum Ada Tim</h3>
                    <p className="text-gray-500 dark:text-gray-400">Belum ada tim yang terverifikasi atau kata kunci tidak ditemukan.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        <ShieldCheck className="text-orange-500" /> Tim Terverifikasi
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTeam.map((t, index) => {
                            const isExpanded = expandedTeam === t.id;
                            const points = [t.poin1, t.poin2, t.poin3, t.poin4, t.poin5].filter(p => p === true || p === false);

                            return (
                                <div key={t.id} className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm hover:shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-300 flex flex-col group">
                                    <div className="p-6 flex-1 flex flex-col">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-4">
                                                {t.gambar ? (
                                                    <div className="w-14 h-14 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm group-hover:scale-105 transition-transform">
                                                        <img src={t.gambar} alt={t.title} className="w-full h-full object-cover" />
                                                    </div>
                                                ) : (
                                                    <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400 border border-gray-100 dark:border-gray-700 group-hover:scale-105 transition-transform">
                                                        <ImageIcon size={24} />
                                                    </div>
                                                )}
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight leading-tight mb-1">{t.title}</h3>
                                                    {t.nama_lomba && (
                                                        <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300">
                                                            {t.nama_lomba}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {t.content && t.content.trim() !== '' && (
                                            <p className="text-sm text-gray-600 dark:text-gray-400 italic mb-4 line-clamp-2">
                                                "{t.content}"
                                            </p>
                                        )}

                                        <div className="mt-auto pt-4 border-t border-gray-50 dark:border-gray-700/50">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex -space-x-2">
                                                        {t.team_members?.slice(0, 3).map((m, i) => (
                                                            <div key={i} className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-300 z-10">
                                                                {m.nama.charAt(0).toUpperCase()}
                                                            </div>
                                                        ))}
                                                        {t.team_members?.length > 3 && (
                                                            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 z-10">
                                                                +{t.team_members.length - 3}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-gray-500 font-medium">{t.team_members?.length || 0} Anggota</span>
                                                </div>
                                                <button 
                                                    onClick={() => toggleExpand(t.id)}
                                                    className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:text-orange-400 transition-colors"
                                                >
                                                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Content */}
                                    <div className={`transition-all duration-300 overflow-hidden bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 ${isExpanded ? 'max-h-96 opacity-100 overflow-y-auto' : 'max-h-0 opacity-0'}`}>
                                        <div className="p-6">
                                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Daftar Anggota</h4>
                                            {(!t.team_members || t.team_members.length === 0) ? (
                                                <p className="text-sm text-gray-500 italic">Belum ada data anggota.</p>
                                            ) : (
                                                <div className="space-y-3">
                                                    {t.team_members.map(member => (
                                                        <div key={member.id} className="bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-xs shrink-0">
                                                                {member.nama.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{member.nama}</p>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    <span className="text-[10px] text-gray-500 truncate">{member.jabatan || 'Anggota'}</span>
                                                                    {member.kampus && member.kampus !== 'Umum' && (
                                                                        <>
                                                                            <span className="text-[10px] text-gray-300">•</span>
                                                                            <span className="text-[10px] font-medium bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-400 truncate">{member.kampus}</span>
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
                        })}
                    </div>
                </div>
            )}
        </div>
        </ScheduleBarrier>
    );
}
