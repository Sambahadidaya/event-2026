'use client';

import { useState, useEffect, useMemo } from 'react';
import { Users, Search, ChevronDown, ChevronUp, Image as ImageIcon, Trophy, Calendar, Medal } from 'lucide-react';
import PageHero from '@/components/public/PageHero';
import { supabase } from '@/lib/supabase';

const InstagramIcon = ({ size = 14, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);
const SUB_FILTERS = {
    'Olahraga': ['Semua', 'Badminton', 'Tenis Meja', 'Tarik Tambang', 'Pidato Bahasa Inggris', 'Puisi', 'Mobile Legend'],
    'Kreativitas': ['Semua', 'Desain Poster', 'Laporan Keuangan', 'Bisnis Model Kanvas', 'Desain Kemasan', 'Film Pendek', 'Konten Promosi Digital']
};

export default function PoseTeam() {
    const [team, setTeam] = useState([]);
    const [jadwal, setJadwal] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filters state
    const [searchQuery, setSearchQuery] = useState('');
    const [mainFilter, setMainFilter] = useState('Semua'); // Semua, Kreativitas, Olahraga
    const [subFilter, setSubFilter] = useState('Semua');
    
    const [expandedTeam, setExpandedTeam] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            const { data } = await supabase
                .from('team')
                .select('*, team_members(*)')
                .eq('type', 'pose')
                .order('created_at', { ascending: false });
            if (data) {
                setTeam(data);
            }

            // Fetch schedules
            const { data: jadwalData } = await supabase
                .from('jadwal_pertandingan')
                .select('*, team1:team1_id(*), team2:team2_id(*)')
                .order('waktu', { ascending: true });
            
            if (jadwalData) {
                setJadwal(jadwalData);
            }
            
            setLoading(false);
        };
        fetchData();
    }, []);

    // Reset sub-filter when main filter changes
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

    // Lomba yang sedang berlangsung
    const activeJadwal = useMemo(() => {
        return jadwal.filter(j => j.status === 'Berlangsung' && (subFilter === 'Semua' || (j.nama_lomba && j.nama_lomba.toLowerCase() === subFilter.toLowerCase())));
    }, [jadwal, subFilter]);

    // Upcoming Lomba
    const upcomingJadwal = useMemo(() => {
        return jadwal.filter(j => j.status === 'Belum Mulai' && (subFilter === 'Semua' || (j.nama_lomba && j.nama_lomba.toLowerCase() === subFilter.toLowerCase())));
    }, [jadwal, subFilter]);

    // Hitung poin untuk Klasemen
    const klasemenData = useMemo(() => {
        const data = filteredTeam.map(t => {
            let totalWin = 0;
            if (t.poin1) totalWin++;
            if (t.poin2) totalWin++;
            if (t.poin3) totalWin++;
            if (t.poin4) totalWin++;
            if (t.poin5) totalWin++;
            return { ...t, totalWin };
        });
        // Urutkan dari win terbanyak
        return data.sort((a, b) => b.totalWin - a.totalWin);
    }, [filteredTeam]);

    return (
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12 animate-in fade-in duration-500 space-y-8 pb-20">
            <PageHero site="pose" icon={Users} title="Tim POSE" subtitle="Informasi pembagian tim, jadwal, dan klasemen pertandingan" />
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes dropFall {
                    0% { top: -200px; }
                    100% { top: 100%; }
                }
                .timeline-glow {
                    position: absolute;
                    left: 0;
                    width: 100%;
                    height: 200px;
                    background: linear-gradient(to bottom, transparent, #f97316);
                    animation: dropFall 3s infinite linear;
                }
            `}} />

            {/* Main Filters & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div className="flex flex-wrap gap-2">
                    {['Semua', 'Kreativitas', 'Olahraga'].map(f => (
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

            {/* Sub Filters */}
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

            {/* Lomba Berlangsung Section (Khusus Olahraga) */}
            {mainFilter === 'Olahraga' && activeJadwal.length > 0 && (
                <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl p-6 sm:p-8 text-white shadow-lg mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-20">
                        <Trophy size={120} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="flex h-3 w-3 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                            </span>
                            <h3 className="font-bold text-lg">SEDANG BERLANGSUNG</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {activeJadwal.map(j => (
                                <div key={j.id} className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20">
                                    <div className="text-center text-sm font-medium text-orange-100 mb-4">{j.nama_lomba}</div>
                                    <div className="flex items-center justify-between">
                                        <div className="text-center flex-1">
                                            <div className="font-bold text-lg">{j.team1?.title || 'TBD'}</div>
                                        </div>
                                        <div className="px-4 text-2xl font-black">{j.skor_team1} - {j.skor_team2}</div>
                                        <div className="text-center flex-1">
                                            <div className="font-bold text-lg">{j.team2?.title || 'TBD'}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : filteredTeam.length === 0 ? (
                <div className="glass p-12 rounded-2xl text-center">
                    <Users size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Belum Ada Tim</h3>
                    <p className="text-gray-500 dark:text-gray-400">Data tim kosong atau kata kunci yang dicari tidak ditemukan.</p>
                </div>
            ) : (
                <div className="space-y-12">
                    {/* Teams List */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <Users className="text-orange-500" /> Daftar Tim
                        </h2>
                        <div className="glass p-6 sm:p-10 rounded-3xl relative">
                            {/* Background Line */}
                            <div className="absolute left-[32px] sm:left-[48px] top-8 bottom-8 w-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden hidden sm:block">
                                <div className="timeline-glow"></div>
                            </div>

                            <div className="space-y-6 relative">
                                {filteredTeam.map((t, index) => {
                                    const isExpanded = expandedTeam === t.id;
                                    
                                    return (
                                        <div key={t.id} className="relative flex items-start group">
                                            {/* Static Marker Circle */}
                                            <div className="absolute left-[26px] sm:left-[42px] top-8 w-4 h-4 rounded-full bg-white dark:bg-gray-900 border-4 border-orange-500 z-10 transition-colors group-hover:border-orange-400 group-hover:bg-orange-50 dark:group-hover:bg-orange-900/50 hidden sm:block"></div>

                                            {/* Content Card */}
                                            <div className="w-full sm:pl-[80px]">
                                                <div className={`bg-white dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-sm border transition-all duration-300 hover:shadow-md ${isExpanded ? 'border-orange-300 dark:border-orange-700 shadow-md' : 'border-gray-100 dark:border-gray-700 hover:border-orange-200 dark:hover:border-orange-900/50'}`}>
                                                    
                                                    {/* Card Header (Always Visible) */}
                                                    <div 
                                                        className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer gap-4"
                                                        onClick={() => toggleExpand(t.id)}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 flex-shrink-0 rounded-full bg-orange-50 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
                                                                {index + 1}
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                {t.gambar ? (
                                                                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                                                                        <img src={t.gambar} alt={t.title} className="w-full h-full object-cover" />
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                                                                        <ImageIcon size={20} />
                                                                    </div>
                                                                )}
                                                                <div>
                                                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">{t.title}</h3>
                                                                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                                                                        {t.nama_lomba && (
                                                                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300">
                                                                                {t.nama_lomba}
                                                                            </span>
                                                                        )}
                                                                        {t.instagram_link && (
                                                                            <a href={t.instagram_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-pink-600 hover:text-pink-500 font-medium transition-colors" onClick={(e) => e.stopPropagation()}>
                                                                                <InstagramIcon size={14} /> @{t.instagram_link.split('/').pop() || 'instagram'}
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                                                            {/* Point indicators */}
                                                            {mainFilter === 'Olahraga' && (
                                                                <div className="flex items-center gap-1">
                                                                    {[t.poin1, t.poin2, t.poin3, t.poin4, t.poin5].map((poin, i) => (
                                                                        <div key={i} className={`w-2 h-6 rounded-sm ${poin ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            <button className="p-2 text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 bg-gray-50 hover:bg-orange-50 dark:bg-gray-900/50 dark:hover:bg-orange-900/30 rounded-full transition-colors ml-auto sm:ml-0">
                                                                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Expanded Content */}
                                                    {isExpanded && (
                                                        <div className="p-4 sm:p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 animate-in slide-in-from-top-4 fade-in duration-300 rounded-b-2xl">
                                                            {/* Deskripsi */}
                                                            {t.content && t.content.trim() !== '' && (
                                                                <div className="mb-6 text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap pl-3 border-l-2 border-orange-200 dark:border-orange-800/50 text-sm">
                                                                    {t.content}
                                                                </div>
                                                            )}

                                                            {/* Daftar Anggota */}
                                                            <div>
                                                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                                                    <Users size={16} className="text-orange-500" /> Anggota Tim
                                                                </h4>
                                                                
                                                                {(!t.team_members || t.team_members.length === 0) ? (
                                                                    <p className="text-sm text-gray-500 italic">Belum ada data anggota.</p>
                                                                ) : (
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                        {t.team_members.map(member => (
                                                                            <div key={member.id} className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center gap-3">
                                                                                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-sm">
                                                                                    {member.nama.charAt(0).toUpperCase()}
                                                                                </div>
                                                                                <div>
                                                                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{member.nama}</p>
                                                                                    {member.jabatan && <p className="text-xs text-gray-500 dark:text-gray-400">{member.jabatan}</p>}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Klasemen & Bagan Section */}
                    {mainFilter !== 'Semua' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            
                            {/* Klasemen Table (Kreativitas) / Bagan Table (Olahraga) */}
                            <div className="glass p-6 sm:p-8 rounded-3xl">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                    <Medal className="text-yellow-500" /> 
                                    {mainFilter === 'Kreativitas' ? 'Klasemen Poin' : 'Papan Kedudukan (Bagan)'}
                                </h2>
                                
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                                <th className="pb-3 font-semibold text-gray-500 dark:text-gray-400 w-12 text-center">#</th>
                                                <th className="pb-3 font-semibold text-gray-500 dark:text-gray-400">Tim</th>
                                                {mainFilter === 'Kreativitas' ? (
                                                    <th className="pb-3 font-semibold text-gray-500 dark:text-gray-400 text-center">Score</th>
                                                ) : (
                                                    <th className="pb-3 font-semibold text-gray-500 dark:text-gray-400 text-center">Win Streak</th>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {klasemenData.slice(0, 10).map((t, i) => (
                                                <tr key={t.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                    <td className="py-4 text-center font-bold text-gray-400">
                                                        {i === 0 ? <span className="text-yellow-500">1</span> :
                                                         i === 1 ? <span className="text-gray-400">2</span> :
                                                         i === 2 ? <span className="text-amber-600">3</span> : i + 1}
                                                    </td>
                                                    <td className="py-4">
                                                        <div className="flex items-center gap-3">
                                                            {t.gambar ? (
                                                                <img src={t.gambar} alt="" className="w-8 h-8 rounded-full object-cover bg-gray-100" />
                                                            ) : (
                                                                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs">
                                                                    {t.title.charAt(0)}
                                                                </div>
                                                            )}
                                                            <span className="font-semibold text-gray-900 dark:text-white">{t.title}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 text-center font-black text-gray-900 dark:text-white">
                                                        {t.totalWin}
                                                    </td>
                                                </tr>
                                            ))}
                                            {klasemenData.length === 0 && (
                                                <tr>
                                                    <td colSpan={3} className="py-8 text-center text-gray-500">Belum ada data klasemen.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Jadwal Pertandingan (Khusus Olahraga) */}
                            {mainFilter === 'Olahraga' && (
                                <div className="glass p-6 sm:p-8 rounded-3xl">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                        <Calendar className="text-blue-500" /> Jadwal Pertandingan
                                    </h2>
                                    
                                    <div className="space-y-4">
                                        {upcomingJadwal.length > 0 ? (
                                            upcomingJadwal.map(j => (
                                                <div key={j.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <div className="text-xs text-orange-500 font-semibold mb-1">{j.nama_lomba}</div>
                                                        <div className="font-bold text-sm text-gray-900 dark:text-white">{j.team1?.title || 'TBD'} vs {j.team2?.title || 'TBD'}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md inline-block">
                                                            {new Date(j.waktu).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8 text-gray-500 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                                                Belum ada jadwal tersisa.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
