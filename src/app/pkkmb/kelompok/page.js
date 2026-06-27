'use client';

import { useState, useEffect } from 'react';
import { Users, Search } from 'lucide-react';
import PageHero from '@/components/public/PageHero';
import { supabase } from '@/lib/supabase';

export default function PkkmbKelompok() {
    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        const fetchTeam = async () => {
            const cached = localStorage.getItem('pkkmb_team');
            const cacheTime = localStorage.getItem('pkkmb_team_time');
            const ONE_DAY = 86400000;

            if (cached && cacheTime && (Date.now() - parseInt(cacheTime)) < ONE_DAY) {
                setTeam(JSON.parse(cached));
                setLoading(false);
            } else {
                const { data } = await supabase.from('team').select('*').eq('type', 'pkkmb').order('created_at', { ascending: false });
                if (data) {
                    setTeam(data);
                    localStorage.setItem('pkkmb_team', JSON.stringify(data));
                    localStorage.setItem('pkkmb_team_time', Date.now().toString());
                }
                setLoading(false);
            }
        };
        fetchTeam();
    }, []);

    const filteredTeam = team.filter(t => t.title.toLowerCase().includes(filter.toLowerCase()));

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

                    <div className="space-y-8 relative">
                        {filteredTeam.map((t, index) => {
                            return (
                                <div key={t.id} className="relative flex items-center group">
                                    
                                    {/* Static Marker Circle */}
                                    <div className="absolute left-[26px] sm:left-[42px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white dark:bg-gray-900 border-4 border-blue-500 z-10 transition-colors group-hover:border-blue-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/50"></div>

                                    {/* Content Card */}
                                    <div className="w-full pl-[56px] sm:pl-[80px]">
                                        <div className="bg-white dark:bg-gray-800/90 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900/50">
                                            <div className="flex items-center gap-4 mb-4 justify-start">
                                                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                                                    {index + 1}
                                                </div>
                                                <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">{t.title}</h3>
                                            </div>
                                            <div className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap pl-2 border-l-2 border-blue-100 dark:border-blue-900/50">
                                                {t.content}
                                            </div>
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
