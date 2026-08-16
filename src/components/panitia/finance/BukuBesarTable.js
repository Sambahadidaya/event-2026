'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { BookOpenCheck, Search, Filter, ArrowUpRight, ArrowDownLeft, DollarSign } from 'lucide-react';
import { getJournalEntry, getMasterAccount } from '@/api/supabase/admin/finance';
import DashboardHeaderFilters, { SITE_OPTIONS_FINANCE } from '@/components/panitia/DashboardHeaderFilters';
import DateRangeFilter from '@/components/panitia/DateRangeFilter';
import TombolCetak from '@/components/panitia/TombolCetak';

export default function BukuBesarTable({ siteType = 'all', adminRole = '' }) {
    const [journals, setJournals] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAccountId, setSelectedAccountId] = useState('all');
    const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
    const [lastSyncedAt, setLastSyncedAt] = useState(null);
    const [currentSite, setCurrentSite] = useState(siteType);

    useEffect(() => {
        setCurrentSite(siteType);
    }, [siteType]);

    const fetchData = useCallback(async (overrideSite = currentSite) => {
        setLoading(true);
        const targetSite = overrideSite || currentSite;
        try {
            const [jeData, accData] = await Promise.all([
                getJournalEntry(targetSite, dateRange.startDate, dateRange.endDate),
                getMasterAccount(targetSite)
            ]);

            setJournals(jeData || []);
            setAccounts(accData || []);
            setLastSyncedAt(Date.now());
        } catch (error) {
            console.error("Error fetching Buku Besar data:", error);
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

    // Filter accounts by selection
    const activeAccounts = useMemo(() => {
        if (selectedAccountId === 'all') return accounts;
        return accounts.filter(a => a.id === selectedAccountId);
    }, [accounts, selectedAccountId]);

    // Group journal entries by account_id and calculate running balance
    const ledgerByAccount = useMemo(() => {
        const map = {};

        // Pre-initialize empty arrays for accounts
        accounts.forEach(acc => {
            map[acc.id] = {
                account: acc,
                entries: [],
                totalDebit: 0,
                totalCredit: 0,
                finalBalance: 0
            };
        });

        // Populate entries
        journals.forEach(item => {
            const accId = item.account_id || item.account?.id;
            if (!accId) return;

            if (!map[accId]) {
                map[accId] = {
                    account: item.account || { nama_akun: 'Akun', kode_akun: '-', akun_type: 'Asset' },
                    entries: [],
                    totalDebit: 0,
                    totalCredit: 0,
                    finalBalance: 0
                };
            }

            // Filter searchQuery if specified
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchKode = item.kode_id?.toLowerCase().includes(q);
                const matchDesc = item.description?.toLowerCase().includes(q);
                if (!matchKode && !matchDesc) return;
            }

            map[accId].entries.push(item);
        });

        // Compute running balance for each account
        Object.keys(map).forEach(accId => {
            const accObj = map[accId];
            // Sort entries ascending by journal_date / created_at for proper running balance
            accObj.entries.sort((a, b) => new Date(a.journal_date || a.created_at) - new Date(b.journal_date || b.created_at));

            let runningBalance = 0;
            const isDebitNormal = ['asset', 'expense'].includes(accObj.account?.akun_type?.toLowerCase());

            accObj.entries = accObj.entries.map(e => {
                const d = Number(e.debit || 0);
                const c = Number(e.credit || 0);
                accObj.totalDebit += d;
                accObj.totalCredit += c;

                if (isDebitNormal) {
                    runningBalance += (d - c);
                } else {
                    runningBalance += (c - d);
                }

                return { ...e, runningBalance };
            });

            accObj.finalBalance = runningBalance;
        });

        return map;
    }, [journals, accounts, searchQuery]);

    // Build multi-sheet data for Excel
    const ledgerSheets = useMemo(() => {
        return activeAccounts.map(acc => {
            const accLedger = ledgerByAccount[acc.id] || { entries: [] };
            return {
                sheetName: `${acc.kode_akun} - ${acc.nama_akun}`.slice(0, 31).replace(/[:\\/?*\[\]]/g, '_'),
                data: accLedger.entries.map(e => ({
                    kode_id: e.kode_id || '-',
                    journal_date: e.journal_date ? new Date(e.journal_date).toLocaleDateString('id-ID') : '-',
                    description: e.description || '-',
                    debit: e.debit || 0,
                    credit: e.credit || 0,
                    runningBalance: e.runningBalance || 0
                })),
                columns: [
                    { key: 'kode_id', label: 'Kode Jurnal' },
                    { key: 'journal_date', label: 'Tanggal' },
                    { key: 'description', label: 'Deskripsi' },
                    { key: 'debit', label: 'Debit' },
                    { key: 'credit', label: 'Kredit' },
                    { key: 'runningBalance', label: 'Saldo Akhir' }
                ]
            };
        }).filter(sheet => sheet.data.length > 0);
    }, [activeAccounts, ledgerByAccount]);

    // Build ledger list data for PDF
    const ledgerPDFData = useMemo(() => {
        return activeAccounts.map(acc => {
            const accLedger = ledgerByAccount[acc.id];
            if (!accLedger || accLedger.entries.length === 0) return null;
            return {
                account: acc,
                entries: accLedger.entries,
                totalDebit: accLedger.totalDebit,
                totalCredit: accLedger.totalCredit,
                finalBalance: accLedger.finalBalance
            };
        }).filter(Boolean);
    }, [activeAccounts, ledgerByAccount]);

    return (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <DashboardHeaderFilters
                title="Buku Besar (General Ledger per Akun)"
                subtitle={currentSite === 'all' ? "Rincian saldo dan transaksi mutasi per masing-masing akun akuntansi." : `Buku besar per akun site ${currentSite.toUpperCase()}`}
                icon={BookOpenCheck}
                showSiteFilter={true}
                siteFilter={currentSite}
                siteOptions={SITE_OPTIONS_FINANCE}
                onSiteFilterChange={handleSiteChange}
                adminRole={adminRole}
                onRefresh={() => fetchData()}
                loading={loading}
                lastSyncedAt={lastSyncedAt}
            />

            {/* Filter Bar */}
            <div className="bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-center gap-3 flex-1">
                    {/* Search Input */}
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Cari kode jurnal/deskripsi..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
                        />
                    </div>

                    {/* Account Selector */}
                    <div className="w-full sm:w-64">
                        <select
                            value={selectedAccountId}
                            onChange={(e) => setSelectedAccountId(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white font-medium cursor-pointer"
                        >
                            <option value="all">Semua Akun ({accounts.length})</option>
                            {accounts.map(acc => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.kode_akun} - {acc.nama_akun} ({acc.akun_type})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <DateRangeFilter
                    startDate={dateRange.startDate}
                    endDate={dateRange.endDate}
                    onFilterChange={(s, e) => setDateRange({ startDate: s, endDate: e })}
                />

                <div className="flex flex-wrap items-center gap-2">
                    <TombolCetak
                        label="Cetak / Export"
                        pdfTitle="Laporan Buku Besar (General Ledger)"
                        pdfSite={currentSite}
                        pdfData={ledgerPDFData}
                        pdfDocumentType="ledger"
                        excelSheets={ledgerSheets.length > 0 ? ledgerSheets : null}
                        excelData={journals}
                        excelColumns={[
                            { key: 'kode_id', label: 'Kode Jurnal' },
                            { key: 'journal_date', label: 'Tanggal', format: 'datetime' },
                            { key: 'description', label: 'Deskripsi' },
                            { key: 'debit', label: 'Debit' },
                            { key: 'credit', label: 'Kredit' }
                        ]}
                        excelFilename={`Buku_Besar_${currentSite}`}
                    />
                </div>
            </div>

            {/* Content: Loop over active accounts */}
            {loading ? (
                <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-100 dark:border-gray-800 text-center">
                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-sm text-gray-500">Memuat Buku Besar per Akun...</p>
                </div>
            ) : activeAccounts.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-100 dark:border-gray-800 text-center text-gray-500">
                    Belum ada master akun terdaftar.
                </div>
            ) : (
                <div className="space-y-6">
                    {activeAccounts.map(acc => {
                        const ledger = ledgerByAccount[acc.id] || { entries: [], totalDebit: 0, totalCredit: 0, finalBalance: 0 };
                        const isDebitNormal = ['asset', 'expense'].includes(acc.akun_type?.toLowerCase());

                        return (
                            <div key={acc.id} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                                {/* Header Card per Account */}
                                <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-sm font-mono shrink-0">
                                            {acc.kode_akun}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg flex items-center gap-2">
                                                {acc.nama_akun}
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-normal uppercase">
                                                    {acc.akun_type}
                                                </span>
                                            </h3>
                                            <p className="text-xs text-gray-500">
                                                Saldo Normal: <span className="font-semibold">{isDebitNormal ? 'DEBIT' : 'KREDIT'}</span> | Total Transaksi: {ledger.entries.length}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Mini summary badges */}
                                    <div className="flex items-center gap-3 text-xs sm:text-sm">
                                        <div className="bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
                                            <span className="text-gray-500 block text-[10px]">Total Debit</span>
                                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                                                Rp {ledger.totalDebit.toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                        <div className="bg-rose-50 dark:bg-rose-900/20 px-3 py-1.5 rounded-xl border border-rose-100 dark:border-rose-800/50">
                                            <span className="text-gray-500 block text-[10px]">Total Kredit</span>
                                            <span className="font-extrabold text-rose-600 dark:text-rose-400">
                                                Rp {ledger.totalCredit.toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                        <div className="bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-xl border border-blue-100 dark:border-blue-800/50">
                                            <span className="text-gray-500 block text-[10px]">Saldo Akhir</span>
                                            <span className="font-extrabold text-blue-600 dark:text-blue-400">
                                                Rp {ledger.finalBalance.toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Table Entries */}
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs sm:text-sm">
                                        <thead className="bg-gray-50/80 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                                            <tr>
                                                <th className="px-4 py-3 font-semibold text-center w-12">No</th>
                                                <th className="px-4 py-3 font-semibold">Kode Jurnal</th>
                                                <th className="px-4 py-3 font-semibold">Tanggal</th>
                                                <th className="px-4 py-3 font-semibold">Deskripsi / Keterangan</th>
                                                <th className="px-4 py-3 font-semibold text-right">Debit (Rp)</th>
                                                <th className="px-4 py-3 font-semibold text-right">Kredit (Rp)</th>
                                                <th className="px-4 py-3 font-semibold text-right">Saldo Berjalan (Rp)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {ledger.entries.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="px-6 py-6 text-center text-gray-400 italic text-xs">
                                                        Belum ada transaksi mutasi untuk akun ini.
                                                    </td>
                                                </tr>
                                            ) : (
                                                ledger.entries.map((entry, idx) => (
                                                    <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                        <td className="px-4 py-2.5 text-center text-gray-500 font-medium">{idx + 1}</td>
                                                        <td className="px-4 py-2.5 font-mono text-xs text-gray-500 font-bold">{entry.kode_id}</td>
                                                        <td className="px-4 py-2.5 text-xs text-gray-600 dark:text-gray-300">{entry.journal_date || '-'}</td>
                                                        <td className="px-4 py-2.5 text-xs text-gray-700 dark:text-gray-300 max-w-sm truncate">
                                                            {entry.description || '-'}
                                                        </td>
                                                        <td className="px-4 py-2.5 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                                                            {Number(entry.debit || 0) > 0 ? `Rp ${Number(entry.debit).toLocaleString('id-ID')}` : '-'}
                                                        </td>
                                                        <td className="px-4 py-2.5 text-right font-semibold text-rose-600 dark:text-rose-400">
                                                            {Number(entry.credit || 0) > 0 ? `Rp ${Number(entry.credit).toLocaleString('id-ID')}` : '-'}
                                                        </td>
                                                        <td className="px-4 py-2.5 text-right font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                                                            Rp {entry.runningBalance.toLocaleString('id-ID')}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
