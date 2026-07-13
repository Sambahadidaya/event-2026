'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { UsersRound, Search, Filter } from 'lucide-react';
import { getPeserta } from '@/api/supabase/peserta';
import { useRouter } from 'next/navigation';
import DashboardHeaderFilters from '@/components/panitia/DashboardHeaderFilters';
import TablePagination from '@/components/panitia/TablePagination';

const ITEMS_PER_PAGE = 10;
const CACHE_KEY = 'pose_peserta_cache';

export default function PesertaDashboard() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [lastSyncedAt, setLastSyncedAt] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    const router = useRouter();

    const fetchData = useCallback(async (forceRefresh = false) => {
        setLoading(true);

        const cacheKey = CACHE_KEY;
        const timeKey = `${CACHE_KEY}_time`;

        if (!forceRefresh) {
            const cachedData = localStorage.getItem(cacheKey);
            const cachedAt = localStorage.getItem(timeKey);
            if (cachedData) {
                try {
                    setData(JSON.parse(cachedData));
                    if (cachedAt) setLastSyncedAt(Number(cachedAt));
                    setLoading(false);
                    return;
                } catch (e) {
                    console.error('Failed to parse cache', e);
                }
            }
        }

        // Ambil semua peserta
        const pesertaData = await getPeserta();

        if (pesertaData) {
            setData(pesertaData);
            const now = Date.now();
            localStorage.setItem(cacheKey, JSON.stringify(pesertaData));
            localStorage.setItem(timeKey, now.toString());
            setLastSyncedAt(now);
        }
        setLoading(false);
    }, [router]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredData = useMemo(() => {
        let result = data;

        const searchLower = searchQuery.toLowerCase();
        if (searchQuery) {
            result = result.filter(item =>
                (item.nama && item.nama.toLowerCase().includes(searchLower)) ||
                (item.nim && item.nim.toLowerCase().includes(searchLower)) ||
                (item.kampus && item.kampus.toLowerCase().includes(searchLower)) ||
                (item.email_wa && item.email_wa.toLowerCase().includes(searchLower))
            );
        }
        return result;
    }, [data, searchQuery]);

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE) || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedData = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    return (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
            <DashboardHeaderFilters
                title="Manajemen Peserta"
                subtitle="Daftar seluruh individu yang berpartisipasi dalam POSE"
                icon={UsersRound}
                showSiteFilter={false}
                onRefresh={() => fetchData(true)}
                loading={loading}
                lastSyncedAt={lastSyncedAt}
            />

            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <h3 className="font-bold text-base sm:text-lg text-gray-800 dark:text-gray-200">Daftar Individu</h3>
                    <div className="relative flex-1 sm:flex-none sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Cari nama, NIM, kampus..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500/30"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                            <tr>
                                <th className="px-4 py-3 font-medium w-12 text-center">No</th>
                                <th className="px-4 py-3 font-medium">Nama Lengkap</th>
                                <th className="px-4 py-3 font-medium">Kampus</th>
                                <th className="px-4 py-3 font-medium">NIM / Prodi / Angktn</th>
                                <th className="px-4 py-3 font-medium">Kontak</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {loading && data.length === 0 ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={`skel-${i}`} className="animate-pulse bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                                        <td colSpan={6} className="px-4 py-4"><div className="h-8 bg-gray-100 dark:bg-gray-800 rounded-lg w-full"></div></td>
                                    </tr>
                                ))
                            ) : paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center text-gray-500">Tidak ada peserta ditemukan.</td>
                                </tr>
                            ) : paginatedData.map((item, index) => (
                                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="px-4 py-3 text-center text-gray-500 font-medium">{startIndex + index + 1}</td>
                                    <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-200">{item.nama}</td>
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 font-medium">{item.kampus || '-'}</td>
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">
                                        {item.nim || '-'}<br/>
                                        <span className="text-gray-400">{item.prodi || '-'} • {item.angkatan || '-'}</span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">{item.email_wa || '-'}</td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs font-semibold px-2 py-1 rounded-lg border inline-block ${
                                            item.status_pembayaran === 'Lunas'
                                                ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                                                : item.status_pembayaran === 'Ditolak'
                                                ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                                                : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
                                        }`}>
                                            {item.status_pembayaran || 'Pending'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <TablePagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={filteredData.length}
                            itemsPerPage={ITEMS_PER_PAGE}
                            onPageChange={setCurrentPage}
                            colSpan={6}
                        />
                    </table>
                </div>
            </div>
        </div>
    );
}
