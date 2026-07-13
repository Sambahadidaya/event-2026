'use client';

import { useEffect, useState } from 'react';
import { getUserTeams } from '@/api/supabase/team';
import { Trophy, ArrowLeft, Clock, CheckCircle2, XCircle, Search, Plus } from 'lucide-react';
import Link from 'next/link';

export default function PublicDashboardRegister() {
    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserTeams = async () => {
            const token = localStorage.getItem('pose_user_token');
            if (!token) {
                setLoading(false);
                return;
            }

            const data = await getUserTeams(token);

            if (data) {
                setTeam(data);
            }
            setLoading(false);
        };

        fetchUserTeams();
    }, []);

    const getStatusInfo = (status) => {
        if (status === true) return { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30', label: 'Disetujui' };
        if (status === false) return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30', label: 'Ditolak' };
        return { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30', label: 'Menunggu Verifikasi' };
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-12 sm:pt-32 sm:pb-20 bg-gray-50 dark:bg-gray-950">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
                
                <div className="flex items-center justify-between mb-8">
                    <Link href="/pose/register" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors font-medium">
                        <ArrowLeft size={16} /> Daftar Lomba
                    </Link>
                    <Link href="/pose/register" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-colors">
                        <Plus size={16} /> Pendaftaran Baru
                    </Link>
                </div>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Status Pendaftaran Saya</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Berikut adalah daftar tim yang Anda daftarkan di perangkat ini. Pantau status verifikasinya di sini.
                    </p>
                </div>

                {team.length === 0 ? (
                    <div className="bg-white dark:bg-gray-900 p-12 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 text-center">
                        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Belum Ada Pendaftaran</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            Anda belum mendaftarkan tim apa pun dari perangkat ini, atau pendaftaran Anda dilakukan di perangkat lain.
                        </p>
                        <Link href="/pose/register" className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors shadow-sm">
                            Mulai Mendaftar
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5">
                        {team.map((t) => {
                            const status = getStatusInfo(t.verivikasi);
                            const StatusIcon = status.icon;

                            return (
                                <div key={t.id} className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            {t.gambar ? (
                                                <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 flex-shrink-0">
                                                    <img src={t.gambar} alt="Logo" className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 flex-shrink-0">
                                                    <Trophy size={24} />
                                                </div>
                                            )}
                                            
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{t.title}</h3>
                                                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                    <span className="font-semibold px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                                                        {t.jenis_lomba}
                                                    </span>
                                                    <span>•</span>
                                                    <span>{t.nama_lomba}</span>
                                                    <span>•</span>
                                                    <span>{t.team_members[0]?.count || 0} Anggota</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex sm:justify-end border-t sm:border-t-0 pt-4 sm:pt-0 border-gray-100 dark:border-gray-800">
                                            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm ${status.bg} ${status.color}`}>
                                                <StatusIcon size={18} />
                                                {status.label}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
