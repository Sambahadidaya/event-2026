'use client';

import { useEffect, useState } from 'react';
import { getBerita } from '@/api/supabase/berita';
import { Bell } from 'lucide-react';
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
