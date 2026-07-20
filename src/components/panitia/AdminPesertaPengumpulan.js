'use client';

import { useEffect, useState, useCallback } from 'react';
import { FileText, Search, Link as LinkIcon, Check, X, Download } from 'lucide-react';
import { getPengumpulanLomba, updateStatusPengumpulan } from '@/api/supabase/admin/submission';
import TablePagination from '@/components/panitia/TablePagination';
import { formatDateTime } from '@/lib/dashboardUtils';

const ITEMS_PER_PAGE = 10;

export default function AdminPesertaPengumpulan({ refreshTrigger = 0 }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const pengumpulanData = await getPengumpulanLomba();
        if (pengumpulanData) {
            setData(pengumpulanData);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData, refreshTrigger]);

    const handleToggleStatus = async (item) => {
        const res = await updateStatusPengumpulan(item.id, !item.status_pengumpulan);
        if (res.success) {
            fetchData();
        } else {
            window.alert('Gagal mengubah status.');
        }
    };

    const filteredData = data.filter(item => 
        item.team?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.team?.kode_form?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.form_pengumpulan?.form_register?.nama_lomba?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const paginatedData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div className="space-y-4 sm:space-y-6 mt-8">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText size={20} className="text-blue-500" /> Hasil Pengumpulan Lomba
            </h2>

            <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                    <div className="relative w-full sm:w-72">
                        <input
                            type="text"
                            placeholder="Cari tim, kode form, lomba..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="p-4 font-semibold">Tim & Kode</th>
                                <th className="p-4 font-semibold">Lomba</th>
                                <th className="p-4 font-semibold">File / Link</th>
                                <th className="p-4 font-semibold">Status Diterima</th>
                                <th className="p-4 font-semibold">Tanggal Submit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                            <p>Memuat data...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-500">
                                        Tidak ada data yang ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-medium text-gray-900 dark:text-white">
                                                {item.team?.title || 'Unknown Team'}
                                            </div>
                                            <div className="text-xs font-mono text-gray-500">
                                                {item.team?.kode_form || '-'}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-gray-900 dark:text-white">
                                                {item.form_pengumpulan?.form_register?.nama_lomba}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {item.form_pengumpulan?.form_register?.jenis_lomba}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <a 
                                                href={item.file_link} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 rounded-lg transition-colors text-xs font-medium"
                                            >
                                                {item.file_link?.startsWith('http') && (item.file_link?.includes('drive') || item.file_link?.includes('youtu')) ? (
                                                    <><LinkIcon size={14} /> Buka Tautan</>
                                                ) : (
                                                    <><Download size={14} /> Unduh File</>
                                                )}
                                            </a>
                                            {item.keterangan && (
                                                <div className="text-xs text-gray-500 mt-1 max-w-[200px] truncate" title={item.keterangan}>
                                                    {item.keterangan}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <button
                                                onClick={() => handleToggleStatus(item)}
                                                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors flex items-center gap-1 ${
                                                    item.status_pengumpulan
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200'
                                                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 hover:bg-yellow-200'
                                                }`}
                                            >
                                                {item.status_pengumpulan ? <Check size={14} /> : <X size={14} />}
                                                {item.status_pengumpulan ? 'Diterima' : 'Belum Dicek'}
                                            </button>
                                        </td>
                                        <td className="p-4 text-gray-500 dark:text-gray-400">
                                            {formatDateTime(item.created_at)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {!loading && filteredData.length > 0 && (
                    <TablePagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                )}
            </div>
        </div>
    );
}
