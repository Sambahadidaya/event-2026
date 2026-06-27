'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Bell, Search } from 'lucide-react';
import PageHero from '@/components/public/PageHero';

export default function PosePemberitahuan() {
    const [berita, setBerita] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        const fetchBerita = async () => {
            const cached = localStorage.getItem('pose_berita');
            const cacheTime = localStorage.getItem('pose_berita_time');
            const ONE_DAY = 86400000;

            if (cached && cacheTime && (Date.now() - parseInt(cacheTime)) < ONE_DAY) {
                setBerita(JSON.parse(cached));
                setLoading(false);
                return;
            }

            const { data } = await supabase
                .from('berita')
                .select('*')
                .eq('type', 'pose')
                .order('created_at', { ascending: false });

            if (data) {
                setBerita(data);
                localStorage.setItem('pose_berita', JSON.stringify(data));
                localStorage.setItem('pose_berita_time', Date.now().toString());
            }
            setLoading(false);
        };

        fetchBerita();
    }, []);

    const filteredBerita = berita.filter(b => b.title.toLowerCase().includes(filter.toLowerCase()));

    return (
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-8 animate-in fade-in duration-500 pb-20">
            <PageHero site="pose" icon={Bell} title="Pemberitahuan" subtitle="Informasi terbaru seputar POSE" />
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

            <div className="flex flex-col md:flex-row md:items-center justify-end gap-4 mb-8">
                <div className="relative w-full md:w-72 lg:w-96 md:ml-auto">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <Search size={18} />
                    </div>
                    <input
                        type="text" 
                        placeholder="Cari pengumuman..." 
                        value={filter} 
                        onChange={e => setFilter(e.target.value)}
                        className="w-full pl-11 p-3.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 outline-none focus:ring-2 focus:ring-orange-500 shadow-sm transition-all placeholder-gray-400"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : filteredBerita.length === 0 ? (
                <div className="glass p-12 rounded-2xl text-center">
                    <Bell size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Belum Ada Informasi</h3>
                    <p className="text-gray-500 dark:text-gray-400">Pemberitahuan atau kata kunci yang dicari tidak ditemukan.</p>
                </div>
            ) : (
                <div className="glass p-6 sm:p-10 rounded-3xl relative max-w-4xl mx-auto mt-4">
                    {/* Background Line */}
                    <div className="absolute left-[32px] sm:left-[48px] top-8 bottom-8 w-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                        {/* Looping Glow Line */}
                        <div className="timeline-glow"></div>
                    </div>

                    <div className="space-y-8 relative">
                        {filteredBerita.map((item, index) => {
                            return (
                                <div key={item.id} className="relative flex items-center group">
                                    
                                    {/* Static Marker Circle */}
                                    <div className="absolute left-[26px] sm:left-[42px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white dark:bg-gray-900 border-4 border-orange-500 z-10 transition-colors group-hover:border-orange-400 group-hover:bg-orange-50 dark:group-hover:bg-orange-900/50"></div>

                                    {/* Content Card */}
                                    <div className="w-full pl-[56px] sm:pl-[80px]">
                                        <div className="bg-white dark:bg-gray-800/90 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-md hover:border-orange-200 dark:hover:border-orange-900/50">
                                            <div className="flex items-center gap-2 mb-4 justify-start">
                                                <span className="inline-flex items-center px-3.5 py-1.5 text-sm font-bold text-orange-700 bg-orange-50 dark:bg-orange-900/40 dark:text-orange-300 rounded-full border border-orange-100 dark:border-orange-800/50">
                                                    {item.custom_date ? new Date(item.custom_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </span>
                                            </div>
                                            <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white mb-3 tracking-tight">{item.title}</h3>
                                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{item.content}</p>
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
