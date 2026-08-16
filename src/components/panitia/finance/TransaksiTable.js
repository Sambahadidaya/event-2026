'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    ArrowLeftRight, Search, PlusCircle, Eye, Trash2,
    TrendingUp, TrendingDown, DollarSign, ExternalLink
} from 'lucide-react';
import {
    getTransactionFinance, deleteTransactionFinance,
    getJournalEntry, getMasterAccount, getMasterTransactionCategory
} from '@/api/supabase/admin/finance';
import DashboardHeaderFilters, { SITE_OPTIONS_FINANCE } from '@/components/panitia/DashboardHeaderFilters';
import TablePagination from '@/components/panitia/TablePagination';
import DateRangeFilter from '@/components/panitia/DateRangeFilter';
import TransaksiDetailModal from './TransaksiDetailModal';
import PengeluaranFormModal from './PengeluaranFormModal';
import PemasukanFormModal from './PemasukanFormModal';
import TombolCetak from '@/components/panitia/TombolCetak';

const ITEMS_PER_PAGE = 10;

export default function TransaksiTable({ siteType = 'all', adminRole = '' }) {
    const [transactions, setTransactions] = useState([]);
    const [journalEntries, setJournalEntries] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [categories, setCategories] = useState([]);

    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('semua'); // 'semua' | 'income' | 'expense'
    const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
    const [currentPage, setCurrentPage] = useState(1);
    const [lastSyncedAt, setLastSyncedAt] = useState(null);

    // Modal state
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedTx, setSelectedTx] = useState(null);

    const [expenseModalOpen, setExpenseModalOpen] = useState(false);
    const [incomeModalOpen, setIncomeModalOpen] = useState(false);

    const [currentSite, setCurrentSite] = useState(siteType);

    useEffect(() => {
        setCurrentSite(siteType);
    }, [siteType]);

    const fetchData = useCallback(async (overrideSite = currentSite) => {
        setLoading(true);
        try {
            const targetSite = overrideSite || currentSite;
            const [txData, jeData, accData, catData] = await Promise.all([
                getTransactionFinance(targetSite, dateRange.startDate, dateRange.endDate),
                getJournalEntry(targetSite),
                getMasterAccount(targetSite),
                getMasterTransactionCategory(targetSite)
            ]);

            setTransactions(txData || []);
            setJournalEntries(jeData || []);
            setAccounts(accData || []);
            setCategories(catData || []);
            setLastSyncedAt(Date.now());
        } catch (error) {
            console.error("Error fetching transactions:", error);
        } finally {
            setLoading(false);
        }
    }, [currentSite, dateRange]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSiteChange = (newSite) => {
        setCurrentSite(newSite);
        fetchData(newSite);
    };

    const handleDelete = async (id, kode) => {
        if (window.confirm(`Apakah Anda yakin ingin menghapus transaksi "${kode}"? Jurnal terkait juga akan terhapus.`)) {
            const res = await deleteTransactionFinance(id);
            if (res.success) {
                setTransactions(prev => prev.filter(t => t.id !== id));
            } else {
                window.alert(`Gagal menghapus: ${res.error}`);
            }
        }
    };

    const handleViewDetail = (tx) => {
        setSelectedTx(tx);
        setDetailModalOpen(true);
    };

    const filteredData = useMemo(() => {
        return transactions.filter(item => {
            const isExpense = item.kategori?.type_transaksi === 'expense' || item.kode_payer?.startsWith('EXP');

            if (typeFilter === 'income' && isExpense) return false;
            if (typeFilter === 'expense' && !isExpense) return false;

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchKode = item.kode_id?.toLowerCase().includes(q);
                const matchPayer = item.nama_payer?.toLowerCase().includes(q);
                const matchKodePayer = item.kode_payer?.toLowerCase().includes(q);
                const matchMetode = item.metode_pembayaran?.toLowerCase().includes(q);
                const matchKet = item.keterangan?.toLowerCase().includes(q);
                return matchKode || matchPayer || matchKodePayer || matchMetode || matchKet;
            }
            return true;
        });
    }, [transactions, typeFilter, searchQuery]);

    // Financial Statistics
    const stats = useMemo(() => {
        let totalIncome = 0;
        let totalExpense = 0;

        filteredData.forEach(item => {
            const isExpense = item.kategori?.type_transaksi === 'expense' || item.kode_payer?.startsWith('EXP');
            const val = Number(item.nominal || 0);
            if (isExpense) {
                totalExpense += val;
            } else {
                totalIncome += val;
                
                const comm = Number(item.potongan_sales || 0);
                if (comm > 0) {
                    totalExpense += comm;
                }
            }
        });

        const netBalance = totalIncome - totalExpense;

        return { totalIncome, totalExpense, netBalance };
    }, [filteredData]);

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE) || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedData = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, typeFilter, dateRange]);

    return (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <DashboardHeaderFilters
                title="Riwayat Transaksi"
                subtitle={currentSite === 'all' ? "Pusat arus kas masuk (pemasukan peserta) dan keluar (pengeluaran panitia)." : `Riwayat transaksi site ${currentSite.toUpperCase()}`}
                icon={ArrowLeftRight}
                showSiteFilter={true}
                siteFilter={currentSite}
                siteOptions={SITE_OPTIONS_FINANCE}
                onSiteFilterChange={handleSiteChange}
                adminRole={adminRole}
                onRefresh={() => fetchData()}
                loading={loading}
                lastSyncedAt={lastSyncedAt}
            />

            {/* Top 3 Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 1. Total Pemasukan */}
                <div className="bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-500 font-medium mb-1">Total Pemasukan (Income)</p>
                        <h3 className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                            Rp {stats.totalIncome.toLocaleString('id-ID')}
                        </h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <TrendingUp size={20} />
                    </div>
                </div>

                {/* 2. Total Pengeluaran */}
                <div className="bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-500 font-medium mb-1">Total Pengeluaran (Expense)</p>
                        <h3 className="text-xl sm:text-2xl font-extrabold text-rose-600 dark:text-rose-400">
                            Rp {stats.totalExpense.toLocaleString('id-ID')}
                        </h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                        <TrendingDown size={20} />
                    </div>
                </div>

                {/* 3. Saldo Bersih */}
                <div className="bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-500 font-medium mb-1">Saldo Bersih (Net Balance)</p>
                        <h3 className={`text-xl sm:text-2xl font-extrabold ${stats.netBalance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600'}`}>
                            Rp {stats.netBalance.toLocaleString('id-ID')}
                        </h3>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <DollarSign size={20} />
                    </div>
                </div>
            </div>

            {/* Main Table Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                {/* Header controls */}
                <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                    {/* Search & Type filter */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 flex-1">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Cari nama, kode, keterangan..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
                            />
                        </div>

                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="w-full sm:w-44 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white font-medium cursor-pointer"
                        >
                            <option value="semua">Semua Transaksi</option>
                            <option value="income">Pemasukan (Income)</option>
                            <option value="expense">Pengeluaran (Expense)</option>
                        </select>

                        <DateRangeFilter
                            startDate={dateRange.startDate}
                            endDate={dateRange.endDate}
                            onFilterChange={(s, e) => setDateRange({ startDate: s, endDate: e })}
                        />
                    </div>

                    {/* Tombol Aksi (TombolCetak, Input Pemasukan & Pengeluaran) */}
                    <div className="flex flex-wrap items-center gap-2">
                        <TombolCetak
                            label="Cetak / Export"
                            pdfTitle="Riwayat Transaksi Keuangan"
                            pdfSite={currentSite}
                            pdfData={filteredData}
                            pdfColumns={[
                                { key: 'kode_id', label: 'Kode ID' },
                                { key: 'tanggal_transaksi', label: 'Tanggal Transaksi', format: 'datetime' },
                                { key: 'site', label: 'Site' },
                                { key: 'nama_payer', label: 'Pembayar / Vendor' },
                                { key: 'metode_pembayaran', label: 'Metode' },
                                { key: 'nominal', label: 'Nominal', align: 'right', format: 'currency' },
                                { key: 'keterangan', label: 'Keterangan' }
                            ]}
                            excelData={filteredData}
                            excelColumns={[
                                { key: 'kode_id', label: 'Kode ID' },
                                { key: 'tanggal_transaksi', label: 'Tanggal Transaksi', format: 'datetime' },
                                { key: 'site', label: 'Site' },
                                { key: 'nama_payer', label: 'Pembayar / Vendor' },
                                { key: 'metode_pembayaran', label: 'Metode' },
                                { key: 'nominal', label: 'Nominal' },
                                { key: 'keterangan', label: 'Keterangan' }
                            ]}
                            excelFilename={`Riwayat_Transaksi_${currentSite}`}
                        />
                        <button
                            type="button"
                            onClick={() => setIncomeModalOpen(true)}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs transition-colors shrink-0"
                        >
                            <PlusCircle size={16} /> Input Pemasukan
                        </button>
                        <button
                            type="button"
                            onClick={() => setExpenseModalOpen(true)}
                            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs transition-colors shrink-0"
                        >
                            <PlusCircle size={16} /> Input Pengeluaran
                        </button>
                    </div>
                </div>

                {/* Table Data */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50/80 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                            <tr>
                                <th className="px-4 py-3.5 font-semibold text-center w-12">No</th>
                                <th className="px-4 py-3.5 font-semibold">Kode</th>
                                <th className="px-4 py-3.5 font-semibold">Site</th>
                                <th className="px-4 py-3.5 font-semibold">Jenis</th>
                                <th className="px-4 py-3.5 font-semibold">Pembayar / Vendor</th>
                                <th className="px-4 py-3.5 font-semibold">Metode</th>
                                <th className="px-4 py-3.5 font-semibold">Nominal (Rp)</th>
                                <th className="px-4 py-3.5 font-semibold">Keterangan</th>
                                <th className="px-4 py-3.5 font-semibold text-center w-28">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={9} className="px-4 py-4">
                                            <div className="h-6 bg-gray-100 dark:bg-gray-800 rounded-lg w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                                        Belum ada transaksi terdaftar.
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((item, idx) => {
                                    const isExpense = item.kategori?.type_transaksi === 'expense' || item.kode_payer?.startsWith('EXP');

                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="px-4 py-3 text-center text-gray-500 font-medium">{startIndex + idx + 1}</td>
                                            <td className="px-4 py-3 font-mono font-bold text-gray-900 dark:text-white text-xs">{item.kode_id}</td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-extrabold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                                                    {item.site}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${isExpense ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'}`}>
                                                    {isExpense ? 'Expense' : 'Income'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="font-bold text-gray-900 dark:text-white">{item.nama_payer || '-'}</p>
                                                <span className="text-[10px] text-gray-400 font-mono block">{item.kode_payer || '-'}</span>
                                            </td>
                                            <td className="px-4 py-3 text-xs font-semibold text-gray-700 dark:text-gray-300">
                                                {item.metode_pembayaran || '-'}
                                            </td>
                                            <td className={`px-4 py-3 font-extrabold ${isExpense ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                Rp {Number(item.nominal || 0).toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300 max-w-xs truncate">
                                                {item.keterangan || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleViewDetail(item)}
                                                        className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-colors"
                                                        title="Detail Transaksi & Jurnal"
                                                    >
                                                        <Eye size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(item.id, item.kode_id)}
                                                        className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors"
                                                        title="Hapus Transaksi"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
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
                    colSpan={9}
                />
            </div>

            {/* Modals */}
            <TransaksiDetailModal
                isOpen={detailModalOpen}
                onClose={() => setDetailModalOpen(false)}
                transaction={selectedTx}
                journalEntries={journalEntries}
            />

            <PengeluaranFormModal
                isOpen={expenseModalOpen}
                onClose={() => setExpenseModalOpen(false)}
                onSuccess={fetchData}
                siteType={siteType}
                accounts={accounts}
                categories={categories}
            />

            <PemasukanFormModal
                isOpen={incomeModalOpen}
                onClose={() => setIncomeModalOpen(false)}
                onSuccess={fetchData}
                siteType={siteType}
                accounts={accounts}
                categories={categories}
            />
        </div>
    );
}
