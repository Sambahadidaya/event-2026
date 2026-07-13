'use client';

import { useEffect, useState } from 'react';
import { getFormRegister } from '@/api/supabase/peserta';
import Link from 'next/link';
import { ArrowRight, Trophy, Image as ImageIcon } from 'lucide-react';
import PageHero from '@/components/public/PageHero';
import ScheduleBarrier from '@/components/public/ScheduleBarrier';

export default function PoseRegisterPage() {
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasToken, setHasToken] = useState(false);

    useEffect(() => {
        const fetchForms = async () => {
            const data = await getFormRegister();

            if (data) {
                setForms(data);
            }
            if (typeof window !== 'undefined') {
                if (localStorage.getItem('pose_user_token')) {
                    setHasToken(true);
                }
            }
            setLoading(false);
        };

        fetchForms();
    }, []);

    return (
        <ScheduleBarrier pageType="register">
        <div className="min-h-screen pt-24 pb-12 sm:pt-32 sm:pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <PageHero 
                    title="Pendaftaran Lomba" 
                    subtitle="Pilih lomba yang ingin kamu ikuti dan jadilah juara!" 
                    icon={Trophy}
                />

                {hasToken && (
                    <div className="max-w-3xl mx-auto mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                            <h4 className="font-bold text-blue-900 dark:text-blue-100">Status Pendaftaran Anda</h4>
                            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">Anda sudah pernah mendaftar lomba dari perangkat ini. Klik tombol untuk melihat perkembangan verifikasi data Anda.</p>
                        </div>
                        <Link href="/pose/register/dashboard" className="shrink-0 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm whitespace-nowrap">
                            Lihat Dashboard Saya
                        </Link>
                    </div>
                )}

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
                        {[1, 2, 3].map(n => (
                            <div key={n} className="bg-white/50 dark:bg-gray-900/50 rounded-3xl overflow-hidden border border-gray-200/50 dark:border-gray-800/50 shadow-sm animate-pulse">
                                <div className="h-48 bg-gray-200 dark:bg-gray-800 w-full" />
                                <div className="p-6 space-y-4">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
                                    <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                                    <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-xl w-full mt-4" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : forms.length === 0 ? (
                    <div className="text-center mt-20 p-12 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-800/50 rounded-3xl">
                        <Trophy size={48} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Belum Ada Lomba Terbuka</h3>
                        <p className="text-gray-600 dark:text-gray-400">Pendaftaran lomba POSE saat ini sedang ditutup atau belum tersedia form pendaftaran.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
                        {forms.map((form) => (
                            <div key={form.id} className="group bg-white/70 dark:bg-gray-900/70 backdrop-blur-md rounded-3xl overflow-hidden border border-gray-200/50 dark:border-gray-800/50 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
                                <div className="relative h-48 w-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                    {form.gambar ? (
                                        <img 
                                            src={form.gambar} 
                                            alt={form.nama_lomba} 
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <ImageIcon size={48} className="opacity-20" />
                                        </div>
                                    )}
                                    <div className="absolute top-4 left-4">
                                        <span className="px-3 py-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-xs font-bold uppercase tracking-wider rounded-full shadow-sm text-blue-600 dark:text-blue-400">
                                            {form.jenis_lomba}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="p-6 flex flex-col flex-1">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                                        {form.nama_lomba}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 flex-1">
                                        Daftarkan tim kamu untuk mengikuti cabang lomba {form.nama_lomba}.
                                    </p>
                                    
                                    <Link 
                                        href={`/pose/register/${form.link_id}`}
                                        className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                    >
                                        <span>Daftar Sekarang</span>
                                        <ArrowRight size={18} />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
        </ScheduleBarrier>
    );
}
