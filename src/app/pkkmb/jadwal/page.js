'use client';

import { useState, useEffect } from 'react';
import { getMateri } from '@/api/supabase/public/materi';
import { useRouter } from 'next/navigation';
import { Clock, Calendar as CalendarIcon, User } from 'lucide-react';

export default function PkkmbJadwalPage() {
    const [materiList, setMateriList] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchMateri = async () => {
            const data = await getMateri();
            // Filter out draft/hidden materials
            setMateriList(data?.filter(m => !m.status) || []);
            setLoading(false);
        };
        fetchMateri();
    }, []);

    return (
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
            <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-5 duration-700">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                    Jadwal & Materi PKKMB
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                    Akses seluruh materi dan tugas PKKMB sesuai dengan jadwal yang telah ditentukan.
                </p>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : materiList.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                    Belum ada jadwal materi yang dirilis.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {materiList.map((materi, idx) => (
                        <MateriCard key={materi.id} materi={materi} index={idx} router={router} />
                    ))}
                </div>
            )}
        </div>
    );
}

function MateriCard({ materi, index, router }) {
    const [timeLeft, setTimeLeft] = useState('');
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        const targetDate = new Date(materi.tanggal).getTime();

        const updateTimer = () => {
            const now = new Date().getTime();
            const difference = targetDate - now;

            if (difference <= 0) {
                setIsActive(true);
                setTimeLeft('Sedang Berlangsung');
                return;
            }

            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            if (days > 0) {
                setTimeLeft(`${days} Hari ${hours} Jam`);
            } else if (hours > 0) {
                setTimeLeft(`${hours} Jam ${minutes} Menit`);
            } else {
                setTimeLeft(`${minutes} Menit ${seconds} Detik`);
            }
        };

        updateTimer(); // Initial call
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [materi.tanggal]);

    const handleMasuk = () => {
        if (isActive) {
            router.push(`/pkkmb/materi/${materi.id}`);
        }
    };

    return (
        <div
            className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800 flex flex-col animate-in fade-in slide-in-from-bottom-10"
            style={{ animationDelay: `${index * 150}ms`, animationFillMode: 'both' }}
        >
            <div className="relative h-48 sm:h-56 overflow-hidden group">
                <img
                    src={materi.foto_header}
                    alt={materi.judul}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h3 className="text-xl font-bold line-clamp-2 leading-tight">{materi.judul}</h3>
                </div>
            </div>

            <div className="p-6 flex-1 flex flex-col gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <User size={16} className="text-blue-500" />
                    <span className="font-medium line-clamp-1">{materi.pemateri}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <CalendarIcon size={16} className="text-blue-500" />
                    <span>{new Date(materi.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>

                <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                        <Clock size={16} className={isActive ? "text-green-500" : "text-orange-500"} />
                        <span className={isActive ? "text-green-600 dark:text-green-400" : "text-orange-600 dark:text-orange-400"}>
                            {timeLeft}
                        </span>
                    </div>
                </div>

                <button
                    onClick={handleMasuk}
                    disabled={!isActive}
                    className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-300 ${isActive
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-600/30 active:scale-[0.98]'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                        }`}
                >
                    {isActive ? 'Masuk Materi' : 'Belum Dimulai'}
                </button>
            </div>
        </div>
    );
}
