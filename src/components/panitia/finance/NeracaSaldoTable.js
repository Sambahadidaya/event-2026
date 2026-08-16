'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Scale, Search, CheckCircle2, AlertTriangle, Printer } from 'lucide-react';
import { getJournalEntry, getMasterAccount } from '@/api/supabase/admin/finance';
import DashboardHeaderFilters, { SITE_OPTIONS_FINANCE } from '@/components/panitia/DashboardHeaderFilters';
import DateRangeFilter from '@/components/panitia/DateRangeFilter';
import TombolCetak from '@/components/panitia/TombolCetak';

export default function NeracaSaldoTable({ siteType = 'all', adminRole = '' }) {
    const [journals, setJournals] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
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
            console.error("Error fetching Neraca Saldo:", error);
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

    // Calculate Trial Balance rows
    const trialBalanceRows = useMemo(() => {
        const accMap = {};

        // Aggregate debit & credit per account
        journals.forEach(item => {
            const accId = item.account_id || item.account?.id;
            if (!accId) return;

            if (!accMap[accId]) {
                accMap[accId] = { debit: 0, credit: 0 };
            }
            accMap[accId].debit += Number(item.debit || 0);
            accMap[accId].credit += Number(item.credit || 0);
        });

        // Map accounts to rows with net Debit / Credit balance
        const rows = accounts.map(acc => {
            const totals = accMap[acc.id] || { debit: 0, credit: 0 };
            const type = acc.akun_type?.toLowerCase() || 'asset';
            const isDebitNormal = ['asset', 'expense'].includes(type);

            let netDebit = 0;
            let netCredit = 0;

            if (isDebitNormal) {
                const diff = totals.debit - totals.credit;
                if (diff >= 0) {
                    netDebit = diff;
                } else {
                    netCredit = Math.abs(diff);
                }
            } else {
                const diff = totals.credit - totals.debit;
                if (diff >= 0) {
                    netCredit = diff;
                } else {
                    netDebit = Math.abs(diff);
                }
            }

            return {
                account: acc,
                grossDebit: totals.debit,
                grossCredit: totals.credit,
                netDebit,
                netCredit
            };
        });

        // Filter search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            return rows.filter(r =>
                r.account.kode_akun?.toLowerCase().includes(q) ||
                r.account.nama_akun?.toLowerCase().includes(q) ||
                r.account.akun_type?.toLowerCase().includes(q)
            );
        }

        return rows;
    }, [accounts, journals, searchQuery]);

    // Grand Totals
    const grandTotals = useMemo(() => {
        const totalDebit = trialBalanceRows.reduce((acc, curr) => acc + curr.netDebit, 0);
        const totalCredit = trialBalanceRows.reduce((acc, curr) => acc + curr.netCredit, 0);
        const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;
        return { totalDebit, totalCredit, isBalanced };
    }, [trialBalanceRows]);

    // Formatted data for export/print
    const formattedTrialBalanceData = useMemo(() => {
        return trialBalanceRows.map(row => ({
            kode_akun: row.account?.kode_akun || '-',
            nama_akun: row.account?.nama_akun || '-',
            akun_type: row.account?.akun_type || '-',
            totalDebit: row.netDebit,
            totalCredit: row.netCredit
        }));
    }, [trialBalanceRows]);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500 print:space-y-2">
            {/* Header */}
            <div className="print:hidden">
                <DashboardHeaderFilters
                    title="Neraca Saldo (Trial Balance)"
                    subtitle={currentSite === 'all' ? "Ikhtisar saldo Debit & Kredit seluruh akun akuntansi untuk memastikan keseimbangan neraca." : `Neraca saldo site ${currentSite.toUpperCase()}`}
                    icon={Scale}
                    showSiteFilter={true}
                    siteFilter={currentSite}
                    siteOptions={SITE_OPTIONS_FINANCE}
                    onSiteFilterChange={handleSiteChange}
                    adminRole={adminRole}
                    onRefresh={() => fetchData()}
                    loading={loading}
                    lastSyncedAt={lastSyncedAt}
                />
            </div>

            {/* Print Header */}
            <div className="hidden print:block text-center border-b pb-4">
                <h1 className="text-2xl font-bold">PORTAL KAMPUS 2026</h1>
                <h2 className="text-lg font-semibold uppercase">Laporan Neraca Saldo ({currentSite.toUpperCase()})</h2>
                <p className="text-xs text-gray-500">Dicetak pada: {new Date().toLocaleDateString('id-ID')}</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 print:grid-cols-3">
                {/* Total Debit */}
                <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between shadow-xs">
                    <div>
                        <p className="text-xs text-gray-500 font-medium mb-0.5">Total Debit</p>
                        <h3 className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                            Rp {grandTotals.totalDebit.toLocaleString('id-ID')}
                        </h3>
                    </div>
                </div>

                {/* Total Kredit */}
                <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between shadow-xs">
                    <div>
                        <p className="text-xs text-gray-500 font-medium mb-0.5">Total Kredit</p>
                        <h3 className="text-xl font-extrabold text-rose-600 dark:text-rose-400">
                            Rp {grandTotals.totalCredit.toLocaleString('id-ID')}
                        </h3>
                    </div>
                </div>

                {/* Status Balance */}
                <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-xs ${grandTotals.isBalanced ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'}`}>
                    <div>
                        <p className="text-xs font-semibold mb-0.5 uppercase tracking-wider">Status Keseimbangan</p>
                        <h3 className="text-base font-extrabold flex items-center gap-2">
                            {grandTotals.isBalanced ? (
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

            {/* Controls */}
            <div className="bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 print:hidden">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Cari kode akun, nama akun, tipe..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <DateRangeFilter
                        startDate={dateRange.startDate}
                        endDate={dateRange.endDate}
                        onFilterChange={(s, e) => setDateRange({ startDate: s, endDate: e })}
                    />

                    <TombolCetak
                        label="Cetak / Export"
                        pdfTitle="Laporan Neraca Saldo (Trial Balance)"
                        pdfSite={currentSite}
                        pdfData={formattedTrialBalanceData}
                        pdfColumns={[
                            { key: 'kode_akun', label: 'Kode Akun' },
                            { key: 'nama_akun', label: 'Nama Akun' },
                            { key: 'akun_type', label: 'Tipe' },
                            { key: 'totalDebit', label: 'Debit', align: 'right', format: 'currency' },
                            { key: 'totalCredit', label: 'Kredit', align: 'right', format: 'currency' }
                        ]}
                        excelData={formattedTrialBalanceData}
                        excelColumns={[
                            { key: 'kode_akun', label: 'Kode Akun' },
                            { key: 'nama_akun', label: 'Nama Akun' },
                            { key: 'akun_type', label: 'Tipe' },
                            { key: 'totalDebit', label: 'Debit' },
                            { key: 'totalCredit', label: 'Kredit' }
                        ]}
                        excelFilename={`Neraca_Saldo_${currentSite}`}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50/80 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                            <tr>
                                <th className="px-4 py-3.5 font-semibold text-center w-12">No</th>
                                <th className="px-4 py-3.5 font-semibold">Kode Akun</th>
                                <th className="px-4 py-3.5 font-semibold">Nama Akun (Chart of Account)</th>
                                <th className="px-4 py-3.5 font-semibold">Klasifikasi Tipe</th>
                                <th className="px-4 py-3.5 font-semibold text-right">Debit (Rp)</th>
                                <th className="px-4 py-3.5 font-semibold text-right">Kredit (Rp)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-4 py-4">
                                            <div className="h-6 bg-gray-100 dark:bg-gray-800 rounded-lg w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : trialBalanceRows.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        Belum ada data neraca saldo.
                                    </td>
                                </tr>
                            ) : (
                                trialBalanceRows.map((row, idx) => (
                                    <tr key={row.account.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-4 py-3 text-center text-gray-500 font-medium">{idx + 1}</td>
                                        <td className="px-4 py-3 font-mono font-bold text-gray-900 dark:text-white text-xs">
                                            {row.account.kode_akun}
                                        </td>
                                        <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                                            {row.account.nama_akun}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                                                {row.account.akun_type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                            {row.netDebit > 0 ? `Rp ${row.netDebit.toLocaleString('id-ID')}` : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-rose-600 dark:text-rose-400">
                                            {row.netCredit > 0 ? `Rp ${row.netCredit.toLocaleString('id-ID')}` : '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        <tfoot className="bg-gray-50/90 dark:bg-gray-800/90 font-extrabold border-t-2 border-gray-200 dark:border-gray-700">
                            <tr>
                                <td colSpan={4} className="px-4 py-4 text-right uppercase tracking-wider text-xs">
                                    TOTAL NERACA SALDO:
                                </td>
                                <td className="px-4 py-4 text-right text-emerald-600 dark:text-emerald-400 text-base">
                                    Rp {grandTotals.totalDebit.toLocaleString('id-ID')}
                                </td>
                                <td className="px-4 py-4 text-right text-rose-600 dark:text-rose-400 text-base">
                                    Rp {grandTotals.totalCredit.toLocaleString('id-ID')}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
}
