'use client';

import { useEffect, useState } from 'react';
import { getBerita } from '@/api/supabase/public/berita';
import { Bell } from 'lucide-react';
import Link from "next/link";
import PageHero from '@/components/public/PageHero';
import AnnouncementTimeline from '@/components/public/AnnouncementTimeline';

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

            const data = await getBerita('pose');

            if (data) {
                setBerita(data);
                localStorage.setItem('pose_berita', JSON.stringify(data));
                localStorage.setItem('pose_berita_time', Date.now().toString());
            }
            setLoading(false);
        };

        fetchBerita();
    }, []);

    const filteredBerita = berita.filter((b) =>
        b.title.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-8 animate-in fade-in duration-500 pb-20">
            <PageHero site="pose" icon={Bell} title="Pemberitahuan" subtitle="Informasi terbaru seputar POSE" />
            <div className="max-w-3xl mx-auto mt-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
                <div>
                    <h4 className="font-bold text-gray-955 dark:text-white">Status Pendaftaran Anda</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Lihat Perkembangan Pendaftaran Anda yang sudah pernah mendaftar dari perangkat ini.</p>
                </div>
                <Link href="/pose/register/dashboard" className="shrink-0 px-5 py-2.5 bg-black hover:bg-gray-850 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black text-sm font-semibold rounded-xl transition-colors shadow-xs whitespace-nowrap">
                    Lihat Dashboard Saya
                </Link>
            </div>
            <AnnouncementTimeline
                site="pose"
                items={filteredBerita}
                loading={loading}
                filter={filter}
                onFilterChange={setFilter}
            />
        </div>
    );
}
