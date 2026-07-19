'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Users, Search, CheckCircle, XCircle, Trash2, Eye, CheckCircle2, Clock } from 'lucide-react';
import { getPeserta, updateStatusPembayaranPeserta, deletePeserta } from '@/api/supabase/admin/peserta';
import { useRouter } from 'next/navigation';
import DashboardHeaderFilters from '@/components/panitia/DashboardHeaderFilters';
import TablePagination from '@/components/panitia/TablePagination';
import DetailModal from '@/components/panitia/DetailModal';
import { formatDateTime } from '@/lib/dashboardUtils';

const ITEMS_PER_PAGE = 10;

export default function AdminPesertaWajib({ siteType }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [lastSyncedAt, setLastSyncedAt] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedPeserta, setSelectedPeserta] = useState(null);
    const [verifikasiItem, setVerifikasiItem] = useState(null);
    const [verifikasiLoading, setVerifikasiLoading] = useState(false);
    const router = useRouter();

    const fetchData = useCallback(async () => {
        setLoading(true);

        const pesertaData = await getPeserta(siteType);

        if (pesertaData) {
            setData(pesertaData);
            setLastSyncedAt(Date.now());
        }
        setLoading(false);
    }, [siteType]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredData = useMemo(() => {
        const searchLower = searchQuery.toLowerCase();
        if (searchQuery) {
            return data.filter(item =>
                (item.nama && item.nama.toLowerCase().includes(searchLower)) ||
                (item.nim && item.nim.toLowerCase().includes(searchLower)) ||
                (item.prodi && item.prodi.toLowerCase().includes(searchLower))
            );
        }
        return data;
    }, [data, searchQuery]);

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE) || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedData = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const updateStatus = async (status) => {
        if (!verifikasiItem) return;
        setVerifikasiLoading(true);
        
        const res = await updateStatusPembayaranPeserta(verifikasiItem.id, status);

        if (res.success) {
            setData(data.map(d => d.id === verifikasiItem.id ? { ...d, status_pembayaran: status } : d));
            setVerifikasiItem(null);
        } else {
            window.alert('Gagal mengupdate status.');
        }
        setVerifikasiLoading(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Hapus data peserta ini secara permanen?')) return;

        const res = await deletePeserta(id);
        if (res.success) {
            setData(data.filter(d => d.id !== id));
        } else {
            window.alert('Gagal menghapus data.');
        }
    };

    const handleViewDetail = (item) => {
        setSelectedPeserta(item);
        setDetailModalOpen(true);
    };
    const getDetailFields = () => {
        if (!selectedPeserta) return [];
        return [
            { label: 'Nama Lengkap', value: selectedPeserta.nama },
            { label: 'Kategori', value: selectedPeserta.kategori },
            { label: 'Kampus', value: selectedPeserta.kampus || '-' },
            { label: 'NIM', value: selectedPeserta.nim || '-' },
            { label: 'Program Studi', value: selectedPeserta.prodi || '-' },
            { label: 'Angkatan', value: selectedPeserta.angkatan || '-' },
            { label: 'Email / WhatsApp', value: selectedPeserta.email_wa || '-' },
            { label: 'Status Pembayaran', value: selectedPeserta.status_pembayaran },
            { label: 'Waktu Pendaftaran', value: formatDateTime(selectedPeserta.created_at) },
            {
                label: 'Bukti Bayar',
                value: selectedPeserta.bukti_bayar ? (
                    <a href={selectedPeserta.bukti_bayar} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        Lihat Bukti Bayar
                    </a>
                ) : 'Tidak ada bukti bayar'
            }
        ];
    };


    return (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
            <DashboardHeaderFilters
                title="Data Peserta"
                subtitle={`Kelola data pendaftaran dan pembayaran wajib untuk ${siteType.toUpperCase()}`}
                icon={Users}
                showSiteFilter={false}
                onRefresh={fetchData}
                loading={loading}
                lastSyncedAt={lastSyncedAt}
            />

            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <h3 className="font-bold text-base sm:text-lg text-gray-800 dark:text-gray-200">Daftar Peserta</h3>
                    <div className="relative flex-1 sm:flex-none sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Cari nama, NIM, prodi..."
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
                                <th className="px-4 py-3 font-medium">No</th>
                                <th className="px-4 py-3 font-medium">Nama</th>
                                <th className="px-4 py-3 font-medium">Kampus</th>
                                <th className="px-4 py-3 font-medium">NIM</th>
                                <th className="px-4 py-3 font-medium">Email/WA</th>
                                <th className="px-4 py-3 font-medium w-44">Tanggal</th>
                                <th className="px-4 py-3 font-medium text-center">Aksi</th>
                                <th className="px-4 py-3 font-medium w-32 text-center">Verifikasi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {loading && data.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">Memuat data peserta...</td>
                                </tr>
                            ) : paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-16 text-center text-gray-500">Tidak ada data ditemukan.</td>
                                </tr>
                            ) : paginatedData.map((item, index) => (
                                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="px-4 py-3 text-center text-gray-500 font-medium">{startIndex + index + 1}</td>

                                    {/* Nama */}
                                    <td className="px-4 py-3">
                                        <p className="font-semibold text-gray-800 dark:text-gray-200">{item.nama}</p>
                                    </td>

                                    {/* Kampus */}
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                        {item.kampus && item.kampus !== 'Dosen' && item.kampus !== 'Umum' ? item.kampus : '-'}
                                    </td>

                                    {/* NIM */}
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                        {item.nim && item.nim !== 'Dosen' && item.nim !== 'Umum' ? item.nim : '-'}
                                    </td>

                                    {/* Email */}
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                        {item.email_wa || '-'}
                                    </td>

                                    {/* Tanggal */}
                                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                                        {formatDateTime(item.created_at)}
                                    </td>

                                    {/* Aksi */}
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            type="button"
                                            onClick={() => handleViewDetail(item)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-medium transition-colors"
                                        >
                                            <Eye size={14} /> Lihat
                                        </button>
                                    </td>

                                    {/* Verifikasi */}
                                    <td className="px-4 py-3 text-center">
                                        {item.status_pembayaran === 'Lunas' ? (
                                            <button
                                                type="button"
                                                onClick={() => setVerifikasiItem(item)}
                                                className="inline-flex items-center justify-center gap-1 w-full px-2 py-1.5 text-xs font-semibold rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/50 hover:bg-green-100 transition-colors"
                                            >
                                                <CheckCircle2 size={14} /> Lunas
                                            </button>
                                        ) : item.status_pembayaran === 'Ditolak' ? (
                                            <button
                                                type="button"
                                                onClick={() => setVerifikasiItem(item)}
                                                className="inline-flex items-center justify-center gap-1 w-full px-2 py-1.5 text-xs font-semibold rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50 hover:bg-red-100 transition-colors"
                                            >
                                                <XCircle size={14} /> Ditolak
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => setVerifikasiItem(item)}
                                                className="inline-flex items-center justify-center gap-1 w-full px-2 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 hover:bg-amber-100 transition-colors"
                                            >
                                                <Clock size={14} /> Pending
                                            </button>
                                        )}
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
                            colSpan={8}
                        />
                    </table>
                </div>
            </div>
            <DetailModal
                open={detailModalOpen}
                onClose={() => setDetailModalOpen(false)}
                title="Detail Peserta"
                fields={getDetailFields()}
            />

            {verifikasiItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg flex flex-col overflow-hidden border border-gray-100 dark:border-gray-800">
                        <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Verifikasi Peserta</h3>
                            <button onClick={() => setVerifikasiItem(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                &times;
                            </button>
                        </div>
                        <div className="p-4 sm:p-6">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Pilih aksi untuk memverifikasi pembayaran atas nama <span className="font-bold text-gray-900 dark:text-white">{verifikasiItem.nama}</span>.
                            </p>
                            <div className="flex justify-between mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <button
                                    onClick={() => handleDelete(verifikasiItem.id)}
                                    className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
                                >
                                    <Trash2 size={16} /> Hapus Permanen
                                </button>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => updateStatus('Ditolak')}
                                        disabled={verifikasiLoading}
                                        className="px-4 py-2 rounded-xl text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                                    >
                                        Tolak
                                    </button>
                                    <button
                                        onClick={() => updateStatus('Lunas')}
                                        disabled={verifikasiLoading}
                                        className="px-4 py-2 rounded-xl text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                                    >
                                        Lunas
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
