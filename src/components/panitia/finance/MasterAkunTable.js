'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Receipt, Search, Plus, Edit2, Trash2, ShieldAlert } from 'lucide-react';
import { getMasterAccount, deleteMasterAccount } from '@/api/supabase/admin/finance';
import DashboardHeaderFilters, { SITE_OPTIONS_FINANCE } from '@/components/panitia/DashboardHeaderFilters';
import TablePagination from '@/components/panitia/TablePagination';
import MasterAkunFormModal from './MasterAkunFormModal';
import TombolCetak from '@/components/panitia/TombolCetak';

const ITEMS_PER_PAGE = 10;

export default function MasterAkunTable({ siteType = 'all', adminRole = '' }) {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('semua');
    const [currentPage, setCurrentPage] = useState(1);
    const [lastSyncedAt, setLastSyncedAt] = useState(null);
    const [currentSite, setCurrentSite] = useState(siteType);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);

    useEffect(() => {
        setCurrentSite(siteType);
    }, [siteType]);

    const fetchData = useCallback(async (overrideSite = currentSite) => {
        setLoading(true);
        const targetSite = overrideSite || currentSite;
        const data = await getMasterAccount(targetSite);
        if (data) {
            setAccounts(data);
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
        if (window.confirm(`Apakah Anda yakin ingin menghapus akun "${nama}"?`)) {
            const res = await deleteMasterAccount(id);
            if (res.success) {
                setAccounts(prev => prev.filter(a => a.id !== id));
            } else {
                window.alert(`Gagal menghapus: ${res.error}`);
            }
        }
    };

    const handleOpenCreate = () => {
        setEditingAccount(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (account) => {
        setEditingAccount(account);
        setIsModalOpen(true);
    };

    const filteredData = useMemo(() => {
        return accounts.filter(item => {
            if (typeFilter !== 'semua' && item.akun_type?.toLowerCase() !== typeFilter.toLowerCase()) {
                return false;
            }
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchKode = item.kode_akun?.toLowerCase().includes(q);
                const matchNama = item.nama_akun?.toLowerCase().includes(q);
                const matchType = item.akun_type?.toLowerCase().includes(q);
                return matchKode || matchNama || matchType;
            }
            return true;
        });
    }, [accounts, typeFilter, searchQuery]);

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE) || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedData = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, typeFilter]);

    const getBadgeStyle = (type) => {
        switch (type?.toLowerCase()) {
            case 'asset':
                return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300';
            case 'revenue':
                return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300';
            case 'expense':
                return 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300';
            case 'liability':
                return 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300';
            case 'equity':
                return 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300';
            default:
                return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
        }
    };

    return (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <DashboardHeaderFilters
                title="Master Akuntansi (Chart of Accounts)"
                subtitle="Kelola bagan akun standar (Kas, QRIS, Pendapatan, Beban) untuk jurnal akuntansi."
                icon={Receipt}
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
                                placeholder="Cari kode atau nama akun..."
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
                            <option value="semua">Semua Tipe Akun</option>
                            <option value="Asset">Asset</option>
                            <option value="Revenue">Revenue</option>
                            <option value="Expense">Expense</option>
                            <option value="Liability">Liability</option>
                            <option value="Equity">Equity</option>
                        </select>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                        <TombolCetak
                            label="Cetak / Export"
                            pdfTitle="Master Akuntansi (Chart of Accounts)"
                            pdfSite={currentSite}
                            pdfData={filteredData}
                            pdfColumns={[
                                { key: 'kode_id', label: 'Kode ID' },
                                { key: 'site', label: 'Site' },
                                { key: 'kode_akun', label: 'Kode Akun' },
                                { key: 'nama_akun', label: 'Nama Akun' },
                                { key: 'akun_type', label: 'Tipe Akun' },
                                { key: 'created_at', label: 'Tanggal Dibuat', format: 'datetime' }
                            ]}
                            excelData={filteredData}
                            excelColumns={[
                                { key: 'kode_id', label: 'Kode ID' },
                                { key: 'site', label: 'Site' },
                                { key: 'kode_akun', label: 'Kode Akun' },
                                { key: 'nama_akun', label: 'Nama Akun' },
                                { key: 'akun_type', label: 'Tipe Akun' },
                                { key: 'created_at', label: 'Tanggal Dibuat', format: 'datetime' }
                            ]}
                            excelFilename={`Master_Akun_${currentSite}`}
                        />
                        <button
                            type="button"
                            onClick={handleOpenCreate}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors shrink-0"
                        >
                            <Plus size={16} /> Tambah Akun Baru
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50/80 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                            <tr>
                                <th className="px-4 py-3.5 font-semibold text-center w-12">No</th>
                                <th className="px-4 py-3.5 font-semibold">Kode ID</th>
                                <th className="px-4 py-3.5 font-semibold">Site</th>
                                <th className="px-4 py-3.5 font-semibold">Kode Akun</th>
                                <th className="px-4 py-3.5 font-semibold">Nama Akun</th>
                                <th className="px-4 py-3.5 font-semibold">Tipe / Jenis</th>
                                <th className="px-4 py-3.5 font-semibold text-center w-28">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={7} className="px-4 py-4">
                                            <div className="h-6 bg-gray-100 dark:bg-gray-800 rounded-lg w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        Belum ada data master akun. Klik "Tambah Akun Baru" untuk membuat.
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((item, idx) => (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-4 py-3 text-center text-gray-500 font-medium">{startIndex + idx + 1}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-gray-400">{item.kode_id}</td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-extrabold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                                                {item.site || 'all'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-mono font-bold text-gray-900 dark:text-white">{item.kode_akun}</td>
                                        <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">{item.nama_akun}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${getBadgeStyle(item.akun_type)}`}>
                                                {item.akun_type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenEdit(item)}
                                                    className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition-colors"
                                                    title="Edit Akun"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(item.id, item.nama_akun)}
                                                    className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors"
                                                    title="Hapus Akun"
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
                    colSpan={6}
                />
            </div>

            {/* Modal */}
            <MasterAkunFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchData}
                initialData={editingAccount}
                siteType={currentSite}
                adminRole={adminRole}
            />
        </div>
    );
}
