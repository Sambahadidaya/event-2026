'use client';

import { useEffect, useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { useTheme } from 'next-themes';
import { MessageSquare, Clock, HelpCircle, Filter } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function FaqDashboard() {
    const [history, setHistory] = useState([]);
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [adminRole, setAdminRole] = useState(null);
    const [siteFilter, setSiteFilter] = useState('all');
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
        const fetchRoleAndHistory = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/panitia/login');
                return;
            }

            const { data: admin } = await supabase
                .from('admins')
                .select('role')
                .eq('user_id', session.user.id)
                .single();

            let currentRole = admin?.role || 'super_admin';
            setAdminRole(currentRole);

            if (currentRole === 'admin_pkkmb') setSiteFilter('pkkmb');
            if (currentRole === 'admin_pose') setSiteFilter('pose');

            let query = supabase.from('riwayat_pertanyaan').select('*').order('created_at', { ascending: false });

            if (currentRole === 'admin_pkkmb') {
                query = query.eq('site', 'pkkmb');
            } else if (currentRole === 'admin_pose') {
                query = query.eq('site', 'pose');
            }

            const { data } = await query;
            if (data) {
                setHistory(data);
            }
        };
        fetchRoleAndHistory();
    }, []);

    const filteredHistory = history.filter(h => {
        if (adminRole === 'super_admin' && siteFilter !== 'all') {
            return h.site === siteFilter;
        }
        return true;
    });

    const isDark = theme === 'dark';
    const textColor = isDark ? '#9ca3af' : '#4b5563';

    const terjawabCount = filteredHistory.filter(h => h.jawaban !== 'Maaf, saya tidak menemukan jawaban yang tepat. Silakan hubungi panitia melalui menu Kontak.').length;
    const tidakDimengertiCount = filteredHistory.length - terjawabCount;
    const akurasi = filteredHistory.length > 0 ? Math.round((terjawabCount / filteredHistory.length) * 100) : 0;

    const donutOptions = {
        plugins: { legend: { position: 'bottom', labels: { color: textColor, padding: 20, usePointStyle: true } } },
        cutout: '70%',
        borderWidth: 0
    };

    const donutData = {
        labels: ['Terjawab', 'Tidak Dimengerti'],
        datasets: [{ data: [terjawabCount, tidakDimengertiCount], backgroundColor: ['#3b82f6', '#ef4444'] }]
    };

    if (!mounted) return null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 relative">
                    {(!adminRole || adminRole === 'super_admin') && (
                        <div className="absolute top-4 right-4 text-xs font-medium bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                            <select
                                value={siteFilter}
                                onChange={(e) => setSiteFilter(e.target.value)}
                                className="bg-transparent border-none outline-none pr-6 cursor-pointer"
                            >
                                <option value="all">Semua</option>
                                <option value="pkkmb">PKKMB</option>
                                <option value="pose">POSE</option>
                            </select>
                        </div>
                    )}
                    <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-6 text-center mt-2">Status Resolusi Chatbot</h3>
                    <div className="h-64 relative flex justify-center"><Doughnut data={donutData} options={donutOptions} /></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center text-center">
                        <MessageSquare size={24} className="text-blue-500 mb-2" />
                        <p className="text-2xl font-bold">{filteredHistory.length}</p>
                        <p className="text-xs text-gray-500">Total Interaksi</p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center text-center">
                        <HelpCircle size={24} className="text-emerald-500 mb-2" />
                        <p className="text-2xl font-bold">{akurasi}%</p>
                        <p className="text-xs text-gray-500">Akurasi Jawaban</p>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">Riwayat Pertanyaan Real-time</h3>
                    <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Sinkronisasi Aktif
                    </span>
                </div>

                <div className="flex-1 overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                            <tr>
                                <th className="px-6 py-4 font-medium w-24">ID</th>
                                <th className="px-6 py-4 font-medium w-40">Waktu (WIB)</th>
                                <th className="px-6 py-4 font-medium">Site</th>
                                <th className="px-6 py-4 font-medium">Input Pertanyaan</th>
                                <th className="px-6 py-4 font-medium">Respons Bot</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {filteredHistory.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500 bg-gray-50/30 dark:bg-gray-800/20">
                                        <MessageSquare size={32} className="mx-auto mb-3 text-gray-400 opacity-50" />
                                        Belum ada riwayat percakapan terekam.
                                    </td>
                                </tr>
                            ) : (
                                filteredHistory.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-6 py-4 text-gray-500 font-mono text-xs">#{item.id}</td>
                                        <td className="px-6 py-4 flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                            <Clock size={14} /> {new Date(item.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold uppercase text-gray-500">{item.site}</td>
                                        <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-200 truncate max-w-xs" title={item.pertanyaan}>
                                            {item.pertanyaan}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400 truncate max-w-xs" title={item.jawaban}>
                                            {item.jawaban === 'Maaf, saya tidak menemukan jawaban yang tepat. Silakan hubungi panitia melalui menu Kontak.' ? (
                                                <span className="text-red-500 dark:text-red-400">Tidak dimengerti</span>
                                            ) : (
                                                item.jawaban
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
