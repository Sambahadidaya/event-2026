'use client';

import { useEffect, useState, useRef } from 'react';
import { getUserTeams } from '@/api/supabase/public/team';
import { Trophy, ArrowLeft, Clock, CheckCircle2, XCircle, Search, Plus, ChevronDown, UserPlus, Layers } from 'lucide-react';
import Link from 'next/link';

export default function PublicDashboardRegister() {
    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showMulaiDropdown, setShowMulaiDropdown] = useState(false);
    const dropdownRef = useRef(null);
    const dropdownMulaiRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
            if (dropdownMulaiRef.current && !dropdownMulaiRef.current.contains(event.target)) {
                setShowMulaiDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
        <div className="min-h-screen pt-24 pb-24 sm:pt-32 sm:pb-32 bg-gray-50 dark:bg-gray-950">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">

                <div className="flex items-center justify-between mb-8">
                    <Link href="/pose/register" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors font-medium">
                        <ArrowLeft size={16} /> Daftar Lomba
                    </Link>

                    {/* Dropdown Pendaftaran Baru */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            type="button"
                            onClick={() => setShowDropdown(!showDropdown)}
                            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-colors cursor-pointer"
                        >
                            <Plus size={16} />
                            <span>Pendaftaran Baru</span>
                            <ChevronDown size={14} className={`transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
                        </button>

                        {showDropdown && (
                            <ul className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                                <li>
                                    <Link
                                        href="/pose/register"
                                        onClick={() => setShowDropdown(false)}
                                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                    >
                                        <UserPlus size={16} className="text-blue-600 dark:text-blue-400" />
                                        <div>
                                            <div className="font-semibold">Register Utama</div>
                                            <div className="text-[11px] text-gray-400">Pendaftaran Lomba Utama</div>
                                        </div>
                                    </Link>
                                </li>
                                <li className="my-1 border-t border-gray-100 dark:border-gray-800/60" />
                                <li>
                                    <Link
                                        href="/pose/register/lanjut"
                                        onClick={() => setShowDropdown(false)}
                                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                                    >
                                        <Layers size={16} className="text-purple-600 dark:text-purple-400" />
                                        <div>
                                            <div className="font-semibold">Register Lanjutan</div>
                                            <div className="text-[11px] text-gray-400">Pendaftaran Lomba Lanjutan</div>
                                        </div>
                                    </Link>
                                </li>
                            </ul>
                        )}
                    </div>
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
                        <div className="relative inline-block text-left" ref={dropdownMulaiRef}>
                            <button
                                type="button"
                                onClick={() => setShowMulaiDropdown(!showMulaiDropdown)}
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors shadow-sm cursor-pointer"
                            >
                                <span>Mulai Mendaftar</span>
                                <ChevronDown size={16} className={`transition-transform duration-200 ${showMulaiDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            {showMulaiDropdown && (
                                <ul className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-2xl py-2 z-[60] text-left animate-in fade-in slide-in-from-bottom-2 duration-150">
                                    <li>
                                        <Link
                                            href="/pose/register"
                                            onClick={() => setShowMulaiDropdown(false)}
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                        >
                                            <UserPlus size={16} className="text-blue-600 dark:text-blue-400" />
                                            <div>
                                                <div className="font-semibold">Register Utama</div>
                                                <div className="text-[11px] text-gray-400">Pendaftaran Lomba Utama</div>
                                            </div>
                                        </Link>
                                    </li>
                                    <li className="my-1 border-t border-gray-100 dark:border-gray-800/60" />
                                    <li>
                                        <Link
                                            href="/pose/register/lanjut"
                                            onClick={() => setShowMulaiDropdown(false)}
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                                        >
                                            <Layers size={16} className="text-purple-600 dark:text-purple-400" />
                                            <div>
                                                <div className="font-semibold">Register Lanjutan</div>
                                                <div className="text-[11px] text-gray-400">Pendaftaran Lomba Lanjutan</div>
                                            </div>
                                        </Link>
                                    </li>
                                </ul>
                            )}
                        </div>
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
                                                    <span>{t.kode_form}</span>
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
