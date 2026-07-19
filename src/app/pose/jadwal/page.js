'use client';

import { useState, useEffect, useMemo } from 'react';
import { Calendar, Trophy, Medal, Check, X } from 'lucide-react';
import PageHero from '@/components/public/PageHero';
import ScheduleBarrier from '@/components/public/ScheduleBarrier';
import { getTeams } from '@/api/supabase/public/team';
import { getJadwalPertandingan, getHasilPertandingan } from '@/api/supabase/public/jadwal';
import { JENIS_LOMBA, NAMA_LOMBA } from '@/lib/lombaData';

// Komponen Countdown Timer
const CountdownTimer = ({ targetTime }) => {
    const [timeStr, setTimeStr] = useState('00:00:00');

    useEffect(() => {
        if (!targetTime) return;

        const updateTimer = () => {
            const target = new Date(targetTime).getTime();
            const now = new Date().getTime();
            const diff = Math.max(0, target - now);

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const secs = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeStr(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [targetTime]);

    return <span>{timeStr}</span>;
};

// Komponen Timer untuk Lomba Live
const LiveTimer = ({ startTime }) => {
    const [timeStr, setTimeStr] = useState('00:00:00');

    useEffect(() => {
        if (!startTime) return;

        const updateTimer = () => {
            const start = new Date(startTime).getTime();
            const now = new Date().getTime();
            const diff = Math.max(0, now - start);

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const secs = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeStr(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [startTime]);

    return (
        <div className="mt-2 text-xl font-mono tracking-widest text-white/90 drop-shadow-md">
            {timeStr}
        </div>
    );
};

const SUB_FILTERS = JENIS_LOMBA.reduce((acc, jenis) => {
    if (NAMA_LOMBA[jenis]) {
        acc[jenis] = ['Semua', ...NAMA_LOMBA[jenis]];
    }
    return acc;
}, {});

export default function PoseJadwal() {
    const [team, setTeam] = useState([]);
    const [jadwal, setJadwal] = useState([]);
    const [hasilMap, setHasilMap] = useState({}); // { pertandingan_id: { team_id: { skor, menang } } }
    const [winCountMap, setWinCountMap] = useState({}); // { team_id: totalWin }
    const [loading, setLoading] = useState(true);

    const [mainFilter, setMainFilter] = useState('Olahraga');
    const [subFilter, setSubFilter] = useState('Semua');
    const [statusFilter, setStatusFilter] = useState('Semua');

    useEffect(() => {
        const fetchData = async () => {
            const [teamData, jadwalData, hasilData] = await Promise.all([
                getTeams('pose'),
                getJadwalPertandingan(),
                getHasilPertandingan()
            ]);

            if (teamData) setTeam(teamData.filter(t => t.verivikasi === true));
            if (jadwalData) setJadwal(jadwalData);
            if (hasilData) {
                const hMap = {};
                const wMap = {};
                hasilData.forEach(h => {
                    if (!hMap[h.pertandingan_id]) hMap[h.pertandingan_id] = {};
                    hMap[h.pertandingan_id][h.team_id] = { skor: h.skor, menang: h.menang };
                    if (h.menang) {
                        wMap[h.team_id] = (wMap[h.team_id] || 0) + 1;
                    }
                });
                setHasilMap(hMap);
                setWinCountMap(wMap);
            }

            setLoading(false);
        };
        fetchData();
    }, []);

    useEffect(() => {
        setSubFilter('Semua');
        setStatusFilter('Semua');
    }, [mainFilter]);

    const activeJadwal = useMemo(() => {
        return jadwal.filter(j => j.status === 'Berlangsung' && (subFilter === 'Semua' || (j.nama_lomba && j.nama_lomba.toLowerCase() === subFilter.toLowerCase())));
    }, [jadwal, subFilter]);

    const displayJadwal = useMemo(() => {
        let filtered = jadwal.filter(j => {
            const matchSub = subFilter === 'Semua' || (j.nama_lomba && j.nama_lomba.toLowerCase() === subFilter.toLowerCase());
            const matchStatus = statusFilter === 'Semua' ||
                (statusFilter === 'Live' && j.status === 'Berlangsung') ||
                (statusFilter === 'Belum Dimulai' && j.status === 'Belum Mulai') ||
                (statusFilter === 'Selesai' && j.status === 'Selesai');
            return matchSub && matchStatus;
        });

        const statusWeight = { 'Berlangsung': 1, 'Belum Mulai': 2, 'Selesai': 3 };

        return filtered.sort((a, b) => {
            const weightA = statusWeight[a.status] || 4;
            const weightB = statusWeight[b.status] || 4;
            if (weightA !== weightB) return weightA - weightB;
            return new Date(a.waktu) - new Date(b.waktu);
        });
    }, [jadwal, subFilter, statusFilter]);

    const filteredTeam = useMemo(() => {
        return team.filter(t => {
            const matchMain = t.jenis_lomba && t.jenis_lomba.toLowerCase() === mainFilter.toLowerCase();
            const matchSub = subFilter === 'Semua' || (t.nama_lomba && t.nama_lomba.toLowerCase() === subFilter.toLowerCase());
            return matchMain && matchSub;
        });
    }, [team, mainFilter, subFilter]);

    // Klasemen dihitung dari hasil_pertandingan (winCountMap)
    const klasemenData = useMemo(() => {
        const data = filteredTeam.map(t => ({
            ...t,
            totalWin: winCountMap[t.id] || 0,
            // Ambil daftar menang/kalah per pertandingan tim ini
            matches: jadwal
                .filter(j => j.team1_id === t.id || j.team2_id === t.id)
                .map(j => hasilMap[j.id]?.[t.id] ?? null)
        }));

        return data.sort((a, b) => b.totalWin - a.totalWin);
    }, [filteredTeam, winCountMap, jadwal, hasilMap]);

    return (
        <ScheduleBarrier pageType="jadwal">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12 animate-in fade-in duration-500 space-y-8 pb-20">
            <PageHero site="pose" icon={Calendar} title="Jadwal & Bagan" subtitle="Jadwal pertandingan dan papan kedudukan (klasemen)" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div className="flex flex-wrap gap-2">
                    {JENIS_LOMBA.map(f => (
                        <button
                            key={f}
                            onClick={() => setMainFilter(f)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${mainFilter === f ? 'bg-orange-500 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-orange-900/40'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {SUB_FILTERS[mainFilter] && (
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

            {/* Live Section */}
            {mainFilter === 'Olahraga' && activeJadwal.length > 0 && (
                <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black dark:from-black dark:via-gray-900 dark:to-black rounded-3xl p-6 sm:p-8 text-white shadow-2xl mb-8 relative overflow-hidden border border-gray-700/50">
                    <div className="absolute -top-10 -right-10 opacity-10 pointer-events-none transform rotate-12">
                        <Trophy size={200} />
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="flex h-4 w-4 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-600 border-2 border-gray-900"></span>
                            </span>
                            <h3 className="font-bold text-xl tracking-wide uppercase text-gray-100">Sedang Berlangsung</h3>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {activeJadwal.map(j => {
                                const hasil = hasilMap[j.id] || {};
                                const skor1Val = hasil[j.team1_id]?.skor ?? 0;
                                const skor2Val = hasil[j.team2_id]?.skor ?? 0;

                                return (
                                    <div key={j.id} className="bg-gray-800/60 backdrop-blur-md rounded-2xl p-6 border border-gray-700 shadow-inner flex flex-col items-center relative overflow-hidden">
                                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50"></div>

                                        <div className="text-center text-xs font-bold text-orange-400 mb-6 tracking-widest uppercase bg-orange-900/30 px-3 py-1 rounded-full border border-orange-800/50">{j.nama_lomba}</div>

                                        <div className="flex items-center justify-between w-full">
                                            <div className="text-center flex-1 flex flex-col items-center">
                                                {j.team1?.gambar ? (
                                                    <img src={j.team1.gambar} alt={j.team1.title} className="w-16 h-16 rounded-full object-cover border-2 border-gray-600 mb-3 shadow-md bg-gray-700" />
                                                ) : (
                                                    <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 border-2 border-gray-600 mb-3 shadow-md text-xl font-bold">{j.team1?.title?.charAt(0) || '?'}</div>
                                                )}
                                                <div className="font-bold text-lg leading-tight">{j.team1?.title || 'TBD'}</div>
                                            </div>

                                            <div className="px-6 flex flex-col items-center">
                                                <div className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400 tabular-nums tracking-tighter drop-shadow-sm">
                                                    {skor1Val} - {skor2Val}
                                                </div>
                                                <LiveTimer startTime={j.started_at || j.waktu} />
                                            </div>

                                            <div className="text-center flex-1 flex flex-col items-center">
                                                {j.team2?.gambar ? (
                                                    <img src={j.team2.gambar} alt={j.team2.title} className="w-16 h-16 rounded-full object-cover border-2 border-gray-600 mb-3 shadow-md bg-gray-700" />
                                                ) : (
                                                    <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 border-2 border-gray-600 mb-3 shadow-md text-xl font-bold">{j.team2?.title?.charAt(0) || '?'}</div>
                                                )}
                                                <div className="font-bold text-lg leading-tight">{j.team2?.title || 'TBD'}</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-pulse">
                    <div className="glass p-6 sm:p-8 rounded-3xl h-fit space-y-6">
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="glass p-6 sm:p-8 rounded-3xl h-fit space-y-6">
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Bagan / Klasemen Poin */}
                    <div className="glass p-6 sm:p-8 rounded-3xl h-fit">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <Medal className="text-yellow-500" />
                            {mainFilter === 'Kreativitas' ? 'Klasemen Kejuaraan' : 'Papan Kedudukan (Bagan)'}
                        </h2>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-700">
                                        <th className="pb-3 font-semibold text-gray-500 dark:text-gray-400 w-12 text-center">#</th>
                                        <th className="pb-3 font-semibold text-gray-500 dark:text-gray-400">Tim</th>
                                        <th className="pb-3 font-semibold text-gray-500 dark:text-gray-400">Lomba</th>
                                        {mainFilter === 'Kreativitas' ? (
                                            <th className="pb-3 font-semibold text-gray-500 dark:text-gray-400 text-center">Predikat</th>
                                        ) : (
                                            <th className="pb-3 font-semibold text-gray-500 dark:text-gray-400 text-center">Menang</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {klasemenData.map((t, i) => {
                                        let predikat = 'Peserta';
                                        if (mainFilter === 'Kreativitas') {
                                            if (t.totalWin === 1) predikat = 'Juara 1';
                                            else if (t.totalWin === 2) predikat = 'Juara 2';
                                            else if (t.totalWin === 3) predikat = 'Juara 3';
                                            else if (t.totalWin === 4) predikat = 'Juara Harapan 1';
                                            else if (t.totalWin === 5) predikat = 'Juara Harapan 2';
                                        }

                                        return (
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
                                                        <span className="font-semibold text-gray-900 dark:text-white line-clamp-1">{t.title}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 text-sm text-gray-600 dark:text-gray-400">
                                                    {t.nama_lomba}
                                                </td>
                                                <td className="py-4 text-center">
                                                    {mainFilter === 'Kreativitas' ? (
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${predikat.includes('Juara 1') ? 'bg-yellow-100 text-yellow-700' : predikat.includes('Juara 2') ? 'bg-gray-200 text-gray-700' : predikat.includes('Juara 3') ? 'bg-orange-100 text-orange-700' : predikat.includes('Harapan') ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                                                            {predikat}
                                                        </span>
                                                    ) : (
                                                        <div className="flex items-center justify-center gap-1">
                                                            {t.matches.map((m, idx) => m !== null && (
                                                                <div key={idx} className={`w-5 h-5 rounded-full flex items-center justify-center ${m.menang ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                                                                    {m.menang ? <Check size={10} strokeWidth={3} /> : <X size={10} strokeWidth={3} />}
                                                                </div>
                                                            ))}
                                                            {t.matches.filter(m => m !== null).length === 0 && <span className="text-gray-400 text-xs">-</span>}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {klasemenData.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="py-8 text-center text-gray-500">Belum ada data kedudukan.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Jadwal Pertandingan */}
                    <div className="glass p-6 sm:p-8 rounded-3xl h-fit">
                        <div className="flex flex-col sm:flex-col sm:items-center justify-between mb-6 gap-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Calendar className="text-blue-500" /> Jadwal Pertandingan
                            </h2>
                            <div className="flex gap-2 text-sm bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                                {['Semua', 'Live', 'Belum Dimulai', 'Selesai'].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setStatusFilter(s)}
                                        className={`px-3 py-1.5 rounded-md font-medium transition-colors ${statusFilter === s ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            {displayJadwal.length > 0 ? (
                                displayJadwal.map(j => {
                                    const hasil = hasilMap[j.id] || {};
                                    const skor1Val = hasil[j.team1_id]?.skor ?? 0;
                                    const skor2Val = hasil[j.team2_id]?.skor ?? 0;

                                    return (
                                        <div key={j.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="text-xs text-orange-500 font-semibold">{j.nama_lomba}</div>
                                                    {j.status === 'Berlangsung' ? (
                                                        <span className="text-[10px] font-bold text-red-600 bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded animate-pulse">Live</span>
                                                    ) : j.status === 'Selesai' ? (
                                                        <span className="text-[10px] font-bold text-green-600 bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded">Selesai</span>
                                                    ) : null}
                                                </div>
                                                <div className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                                                    <span>{j.team1?.title || 'TBD'}</span>
                                                    {j.status === 'Selesai' || j.status === 'Berlangsung' ? (
                                                        <span className="text-gray-900 dark:text-white font-black px-2">{skor1Val} - {skor2Val}</span>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs italic">vs</span>
                                                    )}
                                                    <span>{j.team2?.title || 'TBD'}</span>
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-col items-end gap-1">
                                                <div className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg inline-block">
                                                    {j.waktu ? new Date(j.waktu.substring(0, 16)).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                                                </div>
                                                {j.status === 'Belum Mulai' && (
                                                    <div className="text-[11px] font-mono font-bold text-gray-400 bg-gray-50 dark:bg-gray-900 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700">
                                                        <CountdownTimer targetTime={j.waktu} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-10 text-gray-500 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                                    Belum ada jadwal yang akan datang.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
        </ScheduleBarrier>
    );
}
