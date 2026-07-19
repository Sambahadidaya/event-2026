'use client';

import { useState, useEffect } from 'react';
import { Users, Search, ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react';
import PageHero from '@/components/public/PageHero';
import { getTeams } from '@/api/supabase/public/team';

const InstagramIcon = ({ size = 14, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

export default function PkkmbKelompok() {
    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [expandedTeam, setExpandedTeam] = useState(null);

    useEffect(() => {
        const fetchTeam = async () => {
            const data = await getTeams('pkkmb');
                
            if (data) {
                setTeam(data);
            }
            setLoading(false);
        };
        fetchTeam();
    }, []);

    const filteredTeam = team.filter(t => t.title.toLowerCase().includes(filter.toLowerCase()));

    const toggleExpand = (id) => {
        if (expandedTeam === id) {
            setExpandedTeam(null);
        } else {
            setExpandedTeam(id);
        }
    };

    return (
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12 animate-in fade-in duration-500 space-y-8 pb-20">
            <PageHero site="pkkmb" icon={Users} title="Kelompok PKKMB" subtitle="Informasi pembagian kelompok dan anggota" />
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
                    background: linear-gradient(to bottom, transparent, #3b82f6);
                    animation: dropFall 3s infinite linear;
                }
            `}} />

            <div className="flex flex-col md:flex-row md:items-center justify-end gap-4 mb-8">
                <div className="relative w-full md:w-72 lg:w-96 md:ml-auto">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <Search size={18} />
                    </div>
                    <input
                        type="text" 
                        placeholder="Cari nama kelompok..." 
                        value={filter} 
                        onChange={e => setFilter(e.target.value)}
                        className="w-full pl-11 p-3.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all placeholder-gray-400"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : filteredTeam.length === 0 ? (
                <div className="glass p-12 rounded-2xl text-center">
                    <Users size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Belum Ada Kelompok</h3>
                    <p className="text-gray-500 dark:text-gray-400">Data kelompok kosong atau kata kunci yang dicari tidak ditemukan.</p>
                </div>
            ) : (
                <div className="glass p-6 sm:p-10 rounded-3xl relative max-w-4xl mx-auto mt-4">
                    {/* Background Line */}
                    <div className="absolute left-[32px] sm:left-[48px] top-8 bottom-8 w-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                        {/* Looping Glow Line */}
                        <div className="timeline-glow"></div>
                    </div>

                    <div className="space-y-6 relative">
                        {filteredTeam.map((t, index) => {
                            const isExpanded = expandedTeam === t.id;
                            
                            return (
                                <div key={t.id} className="relative flex items-start group">
                                    {/* Static Marker Circle */}
                                    <div className="absolute left-[26px] sm:left-[42px] top-8 w-4 h-4 rounded-full bg-white dark:bg-gray-900 border-4 border-blue-500 z-10 transition-colors group-hover:border-blue-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/50"></div>

                                    {/* Content Card */}
                                    <div className="w-full pl-[56px] sm:pl-[80px]">
                                        <div className={`bg-white dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-sm border transition-all duration-300 hover:shadow-md ${isExpanded ? 'border-blue-300 dark:border-blue-700 shadow-md' : 'border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-900/50'}`}>
                                            
                                            {/* Card Header (Always Visible) */}
                                            <div 
                                                className="p-4 sm:p-6 flex items-center justify-between cursor-pointer"
                                                onClick={() => toggleExpand(t.id)}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 flex-shrink-0 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
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
                                                            {t.instagram_link && (
                                                                <a href={t.instagram_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-pink-600 hover:text-pink-500 mt-1 font-medium transition-colors" onClick={(e) => e.stopPropagation()}>
                                                                    <InstagramIcon size={14} /> @{t.instagram_link.split('/').pop() || 'instagram'}
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <button className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 bg-gray-50 hover:bg-blue-50 dark:bg-gray-900/50 dark:hover:bg-blue-900/30 rounded-full transition-colors">
                                                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                </button>
                                            </div>

                                            {/* Expanded Content */}
                                            {isExpanded && (
                                                <div className="p-4 sm:p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 animate-in slide-in-from-top-4 fade-in duration-300 rounded-b-2xl">
                                                    
                                                    {/* Deskripsi (dari kolom content lama) */}
                                                    {t.content && t.content.trim() !== '' && (
                                                        <div className="mb-6 text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap pl-3 border-l-2 border-blue-200 dark:border-blue-800/50 text-sm">
                                                            {t.content}
                                                        </div>
                                                    )}

                                                    {/* Daftar Anggota */}
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                                            <Users size={16} className="text-blue-500" /> Anggota Tim
                                                        </h4>
                                                        
                                                        {(!t.team_members || t.team_members.length === 0) ? (
                                                            <p className="text-sm text-gray-500 italic">Belum ada data anggota.</p>
                                                        ) : (
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                {t.team_members.map(member => (
                                                                    <div key={member.id} className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center gap-3">
                                                                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
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
            )}
        </div>
    );
}
