'use client';

import { useEffect, useState, useCallback } from 'react';
import { FileText, Search, Plus, Link as LinkIcon, Trash2, Copy } from 'lucide-react';
import { getFormPengumpulan, upsertFormPengumpulan, deleteFormPengumpulan } from '@/api/supabase/admin/submission';
import { getFormRegisterAll } from '@/api/supabase/admin/peserta';
import { useRouter } from 'next/navigation';
import DashboardHeaderFilters from '@/components/panitia/DashboardHeaderFilters';
import TablePagination from '@/components/panitia/TablePagination';
import { formatDateTime } from '@/lib/dashboardUtils';
import { nanoid } from 'nanoid';

const ITEMS_PER_PAGE = 10;

export default function AdminFormPengumpulan({ hideCreateButton = false, refreshTrigger = 0 }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showCreateModal, setShowCreateModal] = useState(false);
    
    // Modal states
    const [formRegisterId, setFormRegisterId] = useState('');
    const [availableRegisters, setAvailableRegisters] = useState([]);
    const [createLoading, setCreateLoading] = useState(false);

    const router = useRouter();

    const fetchData = useCallback(async () => {
        setLoading(true);
        const formsData = await getFormPengumpulan();
        if (formsData) {
            setData(formsData);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData, refreshTrigger]);

    const handleOpenModal = async () => {
        setFormRegisterId('');
        setShowCreateModal(true);
        // Fetch form registers to link
        const registers = await getFormRegisterAll('pose');
        setAvailableRegisters(registers || []);
    };

    const handleCreateForm = async (e) => {
        e.preventDefault();
        if (!formRegisterId) {
            window.alert('Pilih Form Register terlebih dahulu.');
            return;
        }

        setCreateLoading(true);
        const linkId = nanoid(32);

        const res = await upsertFormPengumpulan({
            form_id: formRegisterId,
            link_id: linkId,
            status: true
        });

        if (!res.success) {
            console.error(res.error);
            window.alert('Gagal membuat Form Pengumpulan.');
        } else {
            setShowCreateModal(false);
            fetchData();
            window.alert('Berhasil membuat Form Pengumpulan!');
        }
        setCreateLoading(false);
    };

    const handleToggleStatus = async (item) => {
        if (!window.confirm(`Yakin ingin mengubah status form ini menjadi ${!item.status ? 'Aktif' : 'Non-aktif'}?`)) return;
        
        const res = await upsertFormPengumpulan({
            status: !item.status
        }, item.id);

        if (res.success) {
            fetchData();
        } else {
            window.alert('Gagal mengubah status.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Yakin ingin menghapus form ini secara permanen? Data pengumpulan tim terkait form ini juga mungkin akan terhapus.')) return;
        const res = await deleteFormPengumpulan(id);
        if (res.success) {
            fetchData();
        } else {
            window.alert('Gagal menghapus form.');
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        window.alert('Link berhasil disalin!');
    };

    const filteredData = data.filter(item => 
        item.form_register?.nama_lomba?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.form_register?.jenis_lomba?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.link_id?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
    const paginatedData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div className="space-y-4 sm:space-y-6">
            {!hideCreateButton && (
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FileText size={20} className="text-blue-500" /> Form Pengumpulan
                    </h2>
                    <button
                        onClick={handleOpenModal}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <Plus size={16} /> Buat Form Pengumpulan
                    </button>
                </div>
            )}

            <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                    <div className="relative w-full sm:w-72">
                        <input
                            type="text"
                            placeholder="Cari berdasarkan lomba atau link id..."
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
                                <th className="p-4 font-semibold">Terkait Lomba</th>
                                <th className="p-4 font-semibold">Link Akses</th>
                                <th className="p-4 font-semibold">Status</th>
                                <th className="p-4 font-semibold">Dibuat</th>
                                <th className="p-4 font-semibold text-right">Aksi</th>
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
                                                {item.form_register?.nama_lomba || 'Lomba tidak diketahui'}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {item.form_register?.jenis_lomba}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <span className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs font-mono text-gray-600 dark:text-gray-300">
                                                    /pose/submission/{item.link_id.substring(0, 8)}...
                                                </span>
                                                <button
                                                    onClick={() => copyToClipboard(`${window.location.origin}/pose/submission/${item.link_id}`)}
                                                    className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                                                    title="Copy Link"
                                                >
                                                    <Copy size={14} />
                                                </button>
                                                <a 
                                                    href={`/pose/submission/${item.link_id}`} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                                                    title="Buka Link"
                                                >
                                                    <LinkIcon size={14} />
                                                </a>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <button
                                                onClick={() => handleToggleStatus(item)}
                                                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                                                    item.status
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200'
                                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200'
                                                }`}
                                            >
                                                {item.status ? 'Aktif' : 'Non-aktif'}
                                            </button>
                                        </td>
                                        <td className="p-4 text-gray-500 dark:text-gray-400">
                                            {formatDateTime(item.created_at)}
                                        </td>
                                        <td className="p-4 text-right space-x-2">
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="p-2 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                                title="Hapus"
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

            {/* Modal Create */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <form onSubmit={handleCreateForm} className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md flex flex-col border border-gray-100 dark:border-gray-800">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                                <Plus size={20} className="text-blue-500" /> Buat Form Pengumpulan
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pilih Form Register Terkait *</label>
                                <select
                                    required
                                    value={formRegisterId}
                                    onChange={(e) => setFormRegisterId(e.target.value)}
                                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="" disabled>Pilih Lomba...</option>
                                    {availableRegisters.map(reg => (
                                        <option key={reg.id} value={reg.id}>
                                            {reg.nama_lomba} ({reg.jenis_lomba}) - {reg.site?.toUpperCase()}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex justify-end gap-3 rounded-b-2xl">
                            <button
                                type="button"
                                onClick={() => setShowCreateModal(false)}
                                disabled={createLoading}
                                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={createLoading}
                                className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                {createLoading ? 'Membuat...' : 'Buat Form'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
