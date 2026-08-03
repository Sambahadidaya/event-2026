'use client';

import { useEffect, useState, useCallback } from 'react';
import { FileText, Search, Link as LinkIcon, Check, X, Download, Trash2 } from 'lucide-react';
import { getPengumpulanLomba, updateStatusPengumpulan, deletePengumpulanLomba } from '@/api/supabase/admin/submission';
import TablePagination from '@/components/panitia/TablePagination';
import { formatDateTime } from '@/lib/dashboardUtils';

const ITEMS_PER_PAGE = 10;

export default function AdminPesertaPengumpulan({ refreshTrigger = 0, lockedLomba = null, namaLomba = 'all', teamId = null }) {
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

    const handleDelete = async (id) => {
        if (!window.confirm("Yakin ingin menghapus data pengumpulan ini? Statusnya akan kembali menjadi 'Belum Mengumpulkan'.")) return;
        
        const res = await deletePengumpulanLomba(id);
        if (res.success) {
            setData(prev => prev.filter(item => item.id !== id));
            window.alert("Berhasil dihapus.");
            // Jika ada callback onDelete untuk sinkronisasi state induk, bisa dipanggil di sini.
        } else {
            window.alert("Gagal menghapus: " + res.error);
        }
    };

    useEffect(() => {
        fetchData();
    }, [fetchData, refreshTrigger]);

    const filteredData = data.filter(item => {
        if (teamId && item.team_id !== teamId) {
            return false;
        }

        const targetLomba = lockedLomba || (namaLomba !== 'all' ? namaLomba : null);
        if (targetLomba && item.form_pengumpulan?.form_register?.nama_lomba !== targetLomba) {
            return false;
        }

        const query = searchQuery.toLowerCase();
        return (
            item.team?.title?.toLowerCase().includes(query) ||
            item.team?.kode_form?.toLowerCase().includes(query) ||
            item.form_pengumpulan?.form_register?.nama_lomba?.toLowerCase().includes(query)
        );
    });

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE) || 1;
    const paginatedData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div className="space-y-4 sm:space-y-6 mt-4">
            <h2 className="text-md font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText size={18} className="text-blue-500" /> Hasil Pengumpulan Lomba
            </h2>

            <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                {!teamId && (
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
                )}

                <div className="overflow-x-auto rounded-xl border border-gray-250/50 dark:border-gray-700">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-55 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="p-4 font-semibold">Tim & Kode</th>
                                <th className="p-4 font-semibold">Lomba</th>
                                <th className="p-4 font-semibold">File / Link</th>
                                <th className="p-4 font-semibold">Keterangan</th>
                                <th className="p-4 font-semibold">Tanggal Submit</th>
                                <th className="p-4 font-semibold text-center">Aksi</th>
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
                                    <td colSpan="5" className="p-8 text-center text-gray-500 italic">
                                        Tidak ada data pengumpulan yang ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="p-4 font-medium text-gray-900 dark:text-white">
                                            <div>{item.team?.title || 'Unknown Team'}</div>
                                            <div className="text-xs font-mono text-gray-500">{item.team?.kode_form || '-'}</div>
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
                                        </td>
                                        <td className="p-4 text-xs text-gray-700 dark:text-gray-300 max-w-[200px] whitespace-normal break-words" title={item.keterangan}>
                                            {item.keterangan || <span className="text-gray-400 italic">Tidak ada keterangan</span>}
                                        </td>
                                        <td className="p-4 text-gray-500 dark:text-gray-400 text-xs">
                                            {formatDateTime(item.created_at)}
                                        </td>
                                        <td className="p-4 text-center">
                                            <button 
                                                onClick={() => handleDelete(item.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                title="Hapus Pengumpulan"
                                            >
                                                <Trash2 size={16} />
                                            </button>
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
                        totalItems={filteredData.length}
                        itemsPerPage={ITEMS_PER_PAGE}
                        onPageChange={setCurrentPage}
                    />
                )}
            </div>
        </div>
    );
}
