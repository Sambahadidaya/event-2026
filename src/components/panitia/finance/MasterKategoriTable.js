'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Tags, Search, Plus, Edit2, Trash2 } from 'lucide-react';
import { getMasterTransactionCategory, deleteMasterTransactionCategory } from '@/api/supabase/admin/finance';
import DashboardHeaderFilters, { SITE_OPTIONS_FINANCE } from '@/components/panitia/DashboardHeaderFilters';
import TablePagination from '@/components/panitia/TablePagination';
import MasterKategoriFormModal from './MasterKategoriFormModal';

const ITEMS_PER_PAGE = 10;

export default function MasterKategoriTable({ siteType = 'all', adminRole = '' }) {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('semua');
    const [currentPage, setCurrentPage] = useState(1);
    const [lastSyncedAt, setLastSyncedAt] = useState(null);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    const [currentSite, setCurrentSite] = useState(siteType);

    useEffect(() => {
        setCurrentSite(siteType);
    }, [siteType]);

    const fetchData = useCallback(async (overrideSite = currentSite) => {
        setLoading(true);
        const targetSite = overrideSite || currentSite;
        const data = await getMasterTransactionCategory(targetSite);
        if (data) {
            setCategories(data);
            setLastSyncedAt(Date.now());
        }
        setLoading(false);
    }, [currentSite]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSiteChange = (newSite) => {
        setCurrentSite(newSite);
        fetchData(newSite);
    };

    const handleDelete = async (id, nama) => {
        if (window.confirm(`Apakah Anda yakin ingin menghapus kategori "${nama}"?`)) {
            const res = await deleteMasterTransactionCategory(id);
            if (res.success) {
                setCategories(prev => prev.filter(c => c.id !== id));
            } else {
                window.alert(`Gagal menghapus: ${res.error}`);
            }
        }
    };

    const handleOpenCreate = () => {
        setEditingCategory(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (category) => {
        setEditingCategory(category);
        setIsModalOpen(true);
    };

    const filteredData = useMemo(() => {
        return categories.filter(item => {
            if (typeFilter !== 'semua' && item.type_transaksi?.toLowerCase() !== typeFilter.toLowerCase()) {
                return false;
            }
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchKode = item.kode_id?.toLowerCase().includes(q);
                const matchNama = item.nama_kategori?.toLowerCase().includes(q);
                const matchSub = item.nama_sub_kategori?.toLowerCase().includes(q);
                const matchLomba = item.nama_lomba?.toLowerCase().includes(q);
                return matchKode || matchNama || matchSub || matchLomba;
            }
            return true;
        });
    }, [categories, typeFilter, searchQuery]);

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE) || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedData = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, typeFilter]);

    return (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <DashboardHeaderFilters
                title="Master Kategori Transaksi"
                subtitle={currentSite === 'all' ? "Pengelompokan kategori pemasukan & pengeluaran (PKKMB & POSE)." : `Master kategori transaksi site ${currentSite.toUpperCase()}`}
                icon={Tags}
                showSiteFilter={true}
                siteFilter={currentSite}
                siteOptions={SITE_OPTIONS_FINANCE}
                onSiteFilterChange={handleSiteChange}
                adminRole={adminRole}
                onRefresh={() => fetchData()}
                loading={loading}
                lastSyncedAt={lastSyncedAt}
            />

            {/* Action Bar & Controls */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    {/* Search & Filter */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 flex-1">
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Cari nama kategori..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
                            />
                        </div>

                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="w-full sm:w-48 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white font-medium cursor-pointer"
                        >
                            <option value="semua">Semua Tipe Transaksi</option>
                            <option value="income">Income (Pemasukan)</option>
                            <option value="expense">Expense (Pengeluaran)</option>
                        </select>
                    </div>

                    {/* Create Button */}
                    <button
                        type="button"
                        onClick={handleOpenCreate}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors"
                    >
                        <Plus size={16} /> Tambah Kategori Baru
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50/80 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                            <tr>
                                <th className="px-4 py-3.5 font-semibold text-center w-12">No</th>
                                <th className="px-4 py-3.5 font-semibold">Kode ID</th>
                                <th className="px-4 py-3.5 font-semibold">Site</th>
                                <th className="px-4 py-3.5 font-semibold">Tipe</th>
                                <th className="px-4 py-3.5 font-semibold">Nama Kategori</th>
                                <th className="px-4 py-3.5 font-semibold">Sub Kategori</th>
                                <th className="px-4 py-3.5 font-semibold">Detail Lomba (POSE)</th>
                                <th className="px-4 py-3.5 font-semibold text-center w-28">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={8} className="px-4 py-4">
                                            <div className="h-6 bg-gray-100 dark:bg-gray-800 rounded-lg w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                        Belum ada kategori transaksi. Klik "Tambah Kategori Baru" untuk membuat.
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((item, idx) => (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-4 py-3 text-center text-gray-500 font-medium">{startIndex + idx + 1}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-gray-400">{item.kode_id}</td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-extrabold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                                                {item.site}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${item.type_transaksi === 'income' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'}`}>
                                                {item.type_transaksi}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">{item.nama_kategori}</td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{item.nama_sub_kategori || '-'}</td>
                                        <td className="px-4 py-3 text-xs text-gray-500">
                                            {item.nama_lomba ? `${item.kategori_lomba || ''} - ${item.nama_lomba}` : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenEdit(item)}
                                                    className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition-colors"
                                                    title="Edit Kategori"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(item.id, item.nama_kategori)}
                                                    className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors"
                                                    title="Hapus Kategori"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <TablePagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredData.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={setCurrentPage}
                    colSpan={8}
                />
            </div>

            {/* Modal */}
            <MasterKategoriFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchData}
                initialData={editingCategory}
                siteType={siteType}
            />
        </div>
    );
}
