'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Search, Inbox, MessageSquare, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function KontakDashboard() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('pkkmb');
    const [searchQuery, setSearchQuery] = useState('');
    const [adminRole, setAdminRole] = useState(null);
    const router = useRouter();
    
    // Pagination (optional but good for elegant design)
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const CACHE_KEY = 'kontak_data_cache';

    const fetchData = async (forceRefresh = false) => {
        if (forceRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

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

        if (currentRole === 'admin_pkkmb') setActiveTab('pkkmb');
        if (currentRole === 'admin_pose') setActiveTab('pose');

        if (!forceRefresh) {
            const cachedData = localStorage.getItem(`${CACHE_KEY}_${currentRole}`);
            if (cachedData) {
                try {
                    setData(JSON.parse(cachedData));
                    setLoading(false);
                } catch (e) {
                    console.error('Failed to parse cache', e);
                }
            }
        }

        let query = supabase.from('kontak').select('*').order('created_at', { ascending: false });

        if (currentRole === 'admin_pkkmb') {
            query = query.eq('site', 'pkkmb');
        } else if (currentRole === 'admin_pose') {
            query = query.eq('site', 'pose');
        }

        const { data: kontakData, error } = await query;

        if (!error && kontakData) {
            setData(kontakData);
            localStorage.setItem(`${CACHE_KEY}_${currentRole}`, JSON.stringify(kontakData));
        }
        
        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredData = data.filter(item => {
        const matchesTab = adminRole === 'super_admin' ? item.site === activeTab : true;
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = 
            (item.nama && item.nama.toLowerCase().includes(searchLower)) ||
            (item.email && item.email.toLowerCase().includes(searchLower)) ||
            (item.whatsapp && item.whatsapp.toLowerCase().includes(searchLower)) ||
            (item.pesan && item.pesan.toLowerCase().includes(searchLower));
        return matchesTab && matchesSearch;
    });

    const pkkmbCount = data.filter(item => item.site === 'pkkmb').length;
    const poseCount = data.filter(item => item.site === 'pose').length;

    // Pagination logic
    const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

    // Reset page when tab or search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, searchQuery]);

    const handleRefresh = () => {
        fetchData(true);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }) + ' WIB';
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header section with Stats */}
            <div className={`grid grid-cols-1 ${(!adminRole || adminRole === 'super_admin') ? 'md:grid-cols-2' : ''} gap-4`}>
                {(!adminRole || adminRole === 'super_admin' || adminRole === 'admin_pkkmb') && (
                    <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-blue-100 font-medium mb-1">Total Pesan PKKMB</p>
                                    <h3 className="text-4xl font-bold">{pkkmbCount}</h3>
                                </div>
                                <div className="p-3 bg-white/20 rounded-xl">
                                    <Inbox className="text-white" size={24} />
                                </div>
                            </div>
                        </div>
                        <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    </div>
                )}

                {(!adminRole || adminRole === 'super_admin' || adminRole === 'admin_pose') && (
                    <div className="bg-gradient-to-br from-purple-500 to-purple-700 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-purple-100 font-medium mb-1">Total Pesan POSE</p>
                                    <h3 className="text-4xl font-bold">{poseCount}</h3>
                                </div>
                                <div className="p-3 bg-white/20 rounded-xl">
                                    <MessageSquare className="text-white" size={24} />
                                </div>
                            </div>
                        </div>
                        <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col">
                {/* Toolbar */}
                <div className="p-4 md:p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col md:flex-row justify-between items-center gap-4">
                    
                    {/* Tabs */}
                    {(!adminRole || adminRole === 'super_admin') ? (
                        <div className="flex p-1 bg-gray-200 dark:bg-gray-800 rounded-xl self-start md:self-auto">
                            <button 
                                onClick={() => setActiveTab('pkkmb')}
                                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'pkkmb' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                            >
                                PKKMB
                            </button>
                            <button 
                                onClick={() => setActiveTab('pose')}
                                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'pose' ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                            >
                                POSE
                            </button>
                        </div>
                    ) : (
                        <div className="flex p-1 bg-gray-200 dark:bg-gray-800 rounded-xl self-start md:self-auto px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase">
                            Data Kontak {adminRole === 'admin_pkkmb' ? 'PKKMB' : 'POSE'}
                        </div>
                    )}

                    <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                        {/* Search */}
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="text"
                                placeholder="Cari pesan, nama, email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            />
                        </div>
                        
                        {/* Refresh Button */}
                        <button 
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="p-2.5 w-full md:w-auto flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-sm disabled:opacity-50"
                            title="Perbarui Data"
                        >
                            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                            <span className="md:hidden">Refresh Data</span>
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap md:whitespace-normal">
                        <thead className="bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                            <tr>
                                <th className="px-6 py-4 font-medium w-16 text-center">No</th>
                                <th className="px-6 py-4 font-medium">Nama Lengkap</th>
                                <th className="px-6 py-4 font-medium">Email/WhatsApp</th>
                                <th className="px-6 py-4 font-medium w-1/3">Pesan</th>
                                <th className="px-6 py-4 font-medium">Tanggal</th>
                                <th className="px-6 py-4 font-medium text-center">Status Web</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {loading && data.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-500">
                                            <RefreshCw size={28} className="animate-spin mb-3 text-blue-500" />
                                            <p>Memuat data kontak...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-500 bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl mx-6 p-8 border border-dashed border-gray-200 dark:border-gray-700">
                                            <Filter size={32} className="mb-3 text-gray-400" />
                                            <p className="text-base font-medium text-gray-700 dark:text-gray-300">Tidak ada pesan ditemukan</p>
                                            <p className="text-sm mt-1">Coba sesuaikan kata kunci pencarian Anda atau segarkan data.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                                        <td className="px-6 py-4 text-center text-gray-500 font-medium">
                                            {startIndex + index + 1}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-semibold text-gray-800 dark:text-gray-200">{item.nama}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.email ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded">Email</span>
                                                    <span className="text-gray-600 dark:text-gray-400">{item.email}</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded">WA</span>
                                                    <span className="text-gray-600 dark:text-gray-400">{item.whatsapp}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-gray-600 dark:text-gray-400 md:line-clamp-2" title={item.pesan}>{item.pesan}</p>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-xs whitespace-nowrap">
                                            {formatDate(item.created_at)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${item.site === 'pkkmb' ? 'bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-900/20 dark:border-blue-800/50' : 'bg-purple-50 text-purple-600 border border-purple-100 dark:bg-purple-900/20 dark:border-purple-800/50'}`}>
                                                {item.site}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
                        <p>Menampilkan <span className="font-medium text-gray-900 dark:text-white">{filteredData.length > 0 ? startIndex + 1 : 0}</span> hingga <span className="font-medium text-gray-900 dark:text-white">{Math.min(startIndex + itemsPerPage, filteredData.length)}</span> dari <span className="font-medium text-gray-900 dark:text-white">{filteredData.length}</span> data</p>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-all flex items-center justify-center bg-white dark:bg-gray-800"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <span className="px-4 font-medium bg-gray-50 dark:bg-gray-800 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700">Halaman {currentPage} dari {totalPages}</span>
                            <button 
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-all flex items-center justify-center bg-white dark:bg-gray-800"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
