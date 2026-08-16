'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { BookMarked, Search, Filter, CheckCircle2, AlertTriangle } from 'lucide-react';
import { getJournalEntry } from '@/api/supabase/admin/finance';
import DashboardHeaderFilters, { SITE_OPTIONS_FINANCE } from '@/components/panitia/DashboardHeaderFilters';
import TablePagination from '@/components/panitia/TablePagination';
import DateRangeFilter from '@/components/panitia/DateRangeFilter';
import TombolCetak from '@/components/panitia/TombolCetak';

const ITEMS_PER_PAGE = 10;

export default function JurnalEntryTable({ siteType = 'all', adminRole = '' }) {
    const [journals, setJournals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
    const [currentPage, setCurrentPage] = useState(1);
    const [lastSyncedAt, setLastSyncedAt] = useState(null);
    const [currentSite, setCurrentSite] = useState(siteType);

    useEffect(() => {
        setCurrentSite(siteType);
    }, [siteType]);

    const fetchData = useCallback(async (overrideSite = currentSite) => {
        setLoading(true);
        const targetSite = overrideSite || currentSite;
        const data = await getJournalEntry(targetSite, dateRange.startDate, dateRange.endDate);
        if (data) {
            setJournals(data);
            setLastSyncedAt(Date.now());
        }
        setLoading(false);
    }, [currentSite, dateRange]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSiteChange = (newSite) => {
        setCurrentSite(newSite);
        fetchData(newSite);
    };

    const filteredData = useMemo(() => {
        return journals.filter(item => {
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchKode = item.kode_id?.toLowerCase().includes(q);
                const matchAcc = item.account?.nama_akun?.toLowerCase().includes(q);
                const matchKodeAcc = item.account?.kode_akun?.toLowerCase().includes(q);
                const matchDesc = item.description?.toLowerCase().includes(q);
                const matchPayer = item.transaction?.nama_payer?.toLowerCase().includes(q);
                return matchKode || matchAcc || matchKodeAcc || matchDesc || matchPayer;
            }
            return true;
        });
    }, [journals, searchQuery]);

    // Balance calculation
    const totals = useMemo(() => {
        const totalDebit = filteredData.reduce((acc, curr) => acc + Number(curr.debit || 0), 0);
        const totalCredit = filteredData.reduce((acc, curr) => acc + Number(curr.credit || 0), 0);
        const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;
        return { totalDebit, totalCredit, isBalanced };
    }, [filteredData]);

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE) || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedData = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, dateRange]);

    return (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <DashboardHeaderFilters
                title="Jurnal Entry (General Ledger)"
                subtitle={currentSite === 'all' ? "Pencatatan pembukuan berpasangan (Debit & Kredit) otomatis seluruh sistem." : `Jurnal entry otomatis site ${currentSite.toUpperCase()}`}
                icon={BookMarked}
                showSiteFilter={true}
                siteFilter={currentSite}
                siteOptions={SITE_OPTIONS_FINANCE}
                onSiteFilterChange={handleSiteChange}
                adminRole={adminRole}
                onRefresh={() => fetchData()}
                loading={loading}
                lastSyncedAt={lastSyncedAt}
            />

            {/* Balance Checker Header Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Total Debit */}
                <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-500 font-medium mb-0.5">Total Debit</p>
                        <h3 className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                            Rp {totals.totalDebit.toLocaleString('id-ID')}
                        </h3>
                    </div>
                </div>

                {/* Total Credit */}
                <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-500 font-medium mb-0.5">Total Kredit</p>
                        <h3 className="text-xl font-extrabold text-rose-600 dark:text-rose-400">
                            Rp {totals.totalCredit.toLocaleString('id-ID')}
                        </h3>
                    </div>
                </div>

                {/* Balance Status */}
                <div className={`p-4 rounded-2xl border flex items-center justify-between ${totals.isBalanced ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'}`}>
                    <div>
                        <p className="text-xs font-semibold mb-0.5 uppercase tracking-wider">Status Neraca (Balance)</p>
                        <h3 className="text-lg font-extrabold flex items-center gap-2">
                            {totals.isBalanced ? (
                                <>
                                    <CheckCircle2 size={18} /> SEIMBANG (BALANCED)
                                </>
                            ) : (
                                <>
                                    <AlertTriangle size={18} /> TIDAK SEIMBANG
                                </>
                            )}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Table Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Cari kode jurnal, nama akun, deskripsi..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
                        />
                    </div>

                    <DateRangeFilter
                        startDate={dateRange.startDate}
                        endDate={dateRange.endDate}
                        onFilterChange={(s, e) => setDateRange({ startDate: s, endDate: e })}
                    />

                    <div className="flex flex-wrap items-center gap-2">
                        <TombolCetak
                            label="Cetak / Export"
                            pdfTitle="Laporan Jurnal Umum (Journal Entries)"
                            pdfSite={currentSite}
                            pdfData={filteredData}
                            pdfColumns={[
                                { key: 'kode_id', label: 'Kode Jurnal' },
                                { key: 'journal_date', label: 'Tanggal', format: 'datetime' },
                                { key: 'description', label: 'Deskripsi' },
                                { key: 'debit', label: 'Debit', align: 'right', format: 'currency' },
                                { key: 'credit', label: 'Kredit', align: 'right', format: 'currency' }
                            ]}
                            excelData={filteredData}
                            excelColumns={[
                                { key: 'kode_id', label: 'Kode Jurnal' },
                                { key: 'journal_date', label: 'Tanggal', format: 'datetime' },
                                { key: 'description', label: 'Deskripsi' },
                                { key: 'debit', label: 'Debit' },
                                { key: 'credit', label: 'Kredit' }
                            ]}
                            excelFilename={`Jurnal_Entry_${currentSite}`}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50/80 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                            <tr>
                                <th className="px-4 py-3.5 font-semibold text-center w-12">No</th>
                                <th className="px-4 py-3.5 font-semibold">Kode Jurnal</th>
                                <th className="px-4 py-3.5 font-semibold">Site</th>
                                <th className="px-4 py-3.5 font-semibold">Tanggal</th>
                                <th className="px-4 py-3.5 font-semibold">Nama Akun (COA)</th>
                                <th className="px-4 py-3.5 font-semibold">Deskripsi / Keterangan</th>
                                <th className="px-4 py-3.5 font-semibold text-right">Debit (Rp)</th>
                                <th className="px-4 py-3.5 font-semibold text-right">Kredit (Rp)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={8} className="px-4 py-4">
                                            <div className="h-6 bg-gray-100 dark:bg-gray-800 rounded-lg w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                        Belum ada data jurnal entry.
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((item, idx) => {
                                    const itemSite = item.site || item.transaction?.site || 'all';
                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="px-4 py-3 text-center text-gray-500 font-medium">{startIndex + idx + 1}</td>
                                            <td className="px-4 py-3 font-mono text-xs text-gray-500 font-bold">{item.kode_id}</td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-extrabold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                                                    {itemSite}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">{item.journal_date || '-'}</td>
                                            <td className="px-4 py-3">
                                                <span className="font-bold text-gray-900 dark:text-white block">{item.account?.nama_akun || 'Akun'}</span>
                                                <span className="text-[10px] text-gray-400 font-mono">Kode: {item.account?.kode_akun || '-'} ({item.account?.akun_type || '-'})</span>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300 max-w-xs truncate">
                                                {item.description || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                                                {Number(item.debit || 0) > 0 ? `Rp ${Number(item.debit).toLocaleString('id-ID')}` : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right font-extrabold text-rose-600 dark:text-rose-400">
                                                {Number(item.credit || 0) > 0 ? `Rp ${Number(item.credit).toLocaleString('id-ID')}` : '-'}
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
                    colSpan={8}
                />
            </div>
        </div>
    );
}
