'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Table2, Search, CheckCircle2, AlertTriangle } from 'lucide-react';
import { getJournalEntry, getMasterAccount } from '@/api/supabase/admin/finance';
import DashboardHeaderFilters, { SITE_OPTIONS_FINANCE } from '@/components/panitia/DashboardHeaderFilters';
import DateRangeFilter from '@/components/panitia/DateRangeFilter';
import PrintPDFButton from './PrintPDFButton';
import ExportExcelButton from './ExportExcelButton';

export default function NeracaLajurTable({ siteType = 'all', adminRole = '' }) {
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
            console.error("Error fetching Neraca Lajur:", error);
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

    // Calculate Worksheet (Neraca Lajur) rows
    const worksheetRows = useMemo(() => {
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

        // Map accounts to worksheet rows
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

            // Categorize into Laba Rugi or Neraca Sheet
            const isLabaRugi = ['revenue', 'expense'].includes(type);

            const lrDebit = isLabaRugi ? netDebit : 0;
            const lrCredit = isLabaRugi ? netCredit : 0;
            const sheetDebit = !isLabaRugi ? netDebit : 0;
            const sheetCredit = !isLabaRugi ? netCredit : 0;

            return {
                account: acc,
                netDebit,
                netCredit,
                lrDebit,
                lrCredit,
                sheetDebit,
                sheetCredit
            };
        });

        // Search filter
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

    // Grand Totals & Laba/Rugi calculation
    const summaryCalculations = useMemo(() => {
        let totalNS_D = 0;
        let totalNS_K = 0;
        let totalLR_D = 0;
        let totalLR_K = 0;
        let totalSheet_D = 0;
        let totalSheet_K = 0;

        worksheetRows.forEach(row => {
            totalNS_D += row.netDebit;
            totalNS_K += row.netCredit;
            totalLR_D += row.lrDebit;
            totalLR_K += row.lrCredit;
            totalSheet_D += row.sheetDebit;
            totalSheet_K += row.sheetCredit;
        });

        const isNSBalanced = Math.abs(totalNS_D - totalNS_K) < 0.01;

        // Net profit or loss: Total Kredit LR (Pendapatan) - Total Debit LR (Beban)
        const netProfitLoss = totalLR_K - totalLR_D;
        const isProfit = netProfitLoss >= 0;
        const absNetValue = Math.abs(netProfitLoss);

        // Balancing row values
        const adjLR_D = isProfit ? absNetValue : 0;
        const adjLR_K = !isProfit ? absNetValue : 0;
        const adjSheet_D = !isProfit ? absNetValue : 0;
        const adjSheet_K = isProfit ? absNetValue : 0;

        // Final balanced totals
        const finalLR_D = totalLR_D + adjLR_D;
        const finalLR_K = totalLR_K + adjLR_K;
        const finalSheet_D = totalSheet_D + adjSheet_D;
        const finalSheet_K = totalSheet_K + adjSheet_K;

        const isWorksheetBalanced = Math.abs(finalLR_D - finalLR_K) < 0.01 && Math.abs(finalSheet_D - finalSheet_K) < 0.01;

        return {
            totalNS_D,
            totalNS_K,
            totalLR_D,
            totalLR_K,
            totalSheet_D,
            totalSheet_K,
            isNSBalanced,
            netProfitLoss,
            isProfit,
            absNetValue,
            adjLR_D,
            adjLR_K,
            adjSheet_D,
            adjSheet_K,
            finalLR_D,
            finalLR_K,
            finalSheet_D,
            finalSheet_K,
            isWorksheetBalanced
        };
    }, [worksheetRows]);

    // Formatted data for export/print
    const formattedExportData = useMemo(() => {
        const data = worksheetRows.map(row => ({
            kode_akun: row.account?.kode_akun || '-',
            nama_akun: row.account?.nama_akun || '-',
            akun_type: row.account?.akun_type || '-',
            ns_debit: row.netDebit,
            ns_credit: row.netCredit,
            lr_debit: row.lrDebit,
            lr_credit: row.lrCredit,
            sheet_debit: row.sheetDebit,
            sheet_credit: row.sheetCredit
        }));

        // Add summary rows to export
        data.push({
            isSummaryRow: true,
            summaryType: 'total',
            noLabel: '',
            kode_akun: '',
            nama_akun: 'TOTAL NOMINAL',
            akun_type: '',
            ns_debit: summaryCalculations.totalNS_D,
            ns_credit: summaryCalculations.totalNS_K,
            lr_debit: summaryCalculations.totalLR_D,
            lr_credit: summaryCalculations.totalLR_K,
            sheet_debit: summaryCalculations.totalSheet_D,
            sheet_credit: summaryCalculations.totalSheet_K
        });

        data.push({
            isSummaryRow: true,
            summaryType: 'adjustment',
            noLabel: '',
            kode_akun: '',
            nama_akun: summaryCalculations.isProfit ? 'LABA BERSIH (PENYESUAIAN)' : 'RUGI BERSIH (PENYESUAIAN)',
            akun_type: '',
            ns_debit: 0,
            ns_credit: 0,
            lr_debit: summaryCalculations.adjLR_D,
            lr_credit: summaryCalculations.adjLR_K,
            sheet_debit: summaryCalculations.adjSheet_D,
            sheet_credit: summaryCalculations.adjSheet_K
        });

        data.push({
            isSummaryRow: true,
            summaryType: 'final',
            noLabel: '',
            kode_akun: '',
            nama_akun: 'TOTAL SETELAH PENUTUPAN',
            akun_type: '',
            ns_debit: summaryCalculations.totalNS_D,
            ns_credit: summaryCalculations.totalNS_K,
            lr_debit: summaryCalculations.finalLR_D,
            lr_credit: summaryCalculations.finalLR_K,
            sheet_debit: summaryCalculations.finalSheet_D,
            sheet_credit: summaryCalculations.finalSheet_K
        });

        return data;
    }, [worksheetRows, summaryCalculations]);

    const exportColumns = [
        { key: 'kode_akun', label: 'Kode Akun' },
        { key: 'nama_akun', label: 'Nama Akun' },
        { key: 'akun_type', label: 'Tipe' },
        { key: 'ns_debit', label: 'Neraca Saldo (Debit)', align: 'right', format: 'currency' },
        { key: 'ns_credit', label: 'Neraca Saldo (Kredit)', align: 'right', format: 'currency' },
        { key: 'lr_debit', label: 'Laba Rugi (Debit)', align: 'right', format: 'currency' },
        { key: 'lr_credit', label: 'Laba Rugi (Kredit)', align: 'right', format: 'currency' },
        { key: 'sheet_debit', label: 'Neraca Sheet (Debit)', align: 'right', format: 'currency' },
        { key: 'sheet_credit', label: 'Neraca Sheet (Kredit)', align: 'right', format: 'currency' }
    ];

    return (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500 print:space-y-2">
            {/* Header */}
            <div className="print:hidden">
                <DashboardHeaderFilters
                    title="Neraca Lajur (Worksheet)"
                    subtitle={currentSite === 'all' ? "Kertas kerja akuntansi terpadu mengombinasikan Neraca Saldo, Laba Rugi, dan Neraca Sheet." : `Neraca lajur site ${currentSite.toUpperCase()}`}
                    icon={Table2}
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
                <h2 className="text-lg font-semibold uppercase">Laporan Neraca Lajur ({currentSite.toUpperCase()})</h2>
                <p className="text-xs text-gray-500">Dicetak pada: {new Date().toLocaleDateString('id-ID')}</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 print:grid-cols-3">
                {/* Neraca Saldo Status */}
                <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between shadow-xs">
                    <div>
                        <p className="text-xs text-gray-500 font-medium mb-0.5">Total Neraca Saldo</p>
                        <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
                            Rp {summaryCalculations.totalNS_D.toLocaleString('id-ID')}
                        </h3>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                            Status: <span className={summaryCalculations.isNSBalanced ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>
                                {summaryCalculations.isNSBalanced ? 'Seimbang' : 'Tidak Seimbang'}
                            </span>
                        </p>
                    </div>
                </div>

                {/* Laba / Rugi Bersih */}
                <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between shadow-xs">
                    <div>
                        <p className="text-xs text-gray-500 font-medium mb-0.5">
                            {summaryCalculations.isProfit ? 'Laba Bersih Operasional' : 'Rugi Bersih Operasional'}
                        </p>
                        <h3 className={`text-lg font-extrabold ${summaryCalculations.isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            Rp {summaryCalculations.absNetValue.toLocaleString('id-ID')}
                        </h3>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                            Kredit LR - Debit LR
                        </p>
                    </div>
                </div>

                {/* Status Keseimbangan Worksheet */}
                <div className={`p-4 rounded-2xl border flex items-center justify-between shadow-xs ${summaryCalculations.isWorksheetBalanced ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'}`}>
                    <div>
                        <p className="text-xs font-semibold mb-0.5 uppercase tracking-wider">Status Neraca Lajur</p>
                        <h3 className="text-base font-extrabold flex items-center gap-2">
                            {summaryCalculations.isWorksheetBalanced ? (
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

                    <ExportExcelButton
                        data={formattedExportData}
                        columns={exportColumns}
                        filename={`Neraca_Lajur_${currentSite}`}
                    />
                    <PrintPDFButton
                        title="Laporan Neraca Lajur (Worksheet)"
                        site={currentSite}
                        data={formattedExportData}
                        columns={exportColumns}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50/80 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                            <tr>
                                <th rowSpan={2} className="px-3 py-3 font-semibold text-center w-10 border-r border-gray-200 dark:border-gray-700">NO</th>
                                <th rowSpan={2} className="px-3 py-3 font-semibold border-r border-gray-200 dark:border-gray-700">KODE AKUN</th>
                                <th rowSpan={2} className="px-3 py-3 font-semibold border-r border-gray-200 dark:border-gray-700">NAMA AKUN</th>
                                <th rowSpan={2} className="px-3 py-3 font-semibold border-r border-gray-200 dark:border-gray-700">TIPE</th>
                                <th colSpan={2} className="px-3 py-2 font-semibold text-center border-r border-gray-200 dark:border-gray-700 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300">
                                    NERACA SALDO
                                </th>
                                <th colSpan={2} className="px-3 py-2 font-semibold text-center border-r border-gray-200 dark:border-gray-700 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300">
                                    LABA RUGI
                                </th>
                                <th colSpan={2} className="px-3 py-2 font-semibold text-center bg-purple-50/50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-300">
                                    NERACA SHEET
                                </th>
                            </tr>
                            <tr className="border-t border-gray-200 dark:border-gray-800">
                                <th className="px-3 py-2 text-right font-medium text-xs border-r border-gray-200 dark:border-gray-700 bg-blue-50/30 dark:bg-blue-950/10">DEBIT</th>
                                <th className="px-3 py-2 text-right font-medium text-xs border-r border-gray-200 dark:border-gray-700 bg-blue-50/30 dark:bg-blue-950/10">KREDIT</th>
                                <th className="px-3 py-2 text-right font-medium text-xs border-r border-gray-200 dark:border-gray-700 bg-amber-50/30 dark:bg-amber-950/10">DEBIT</th>
                                <th className="px-3 py-2 text-right font-medium text-xs border-r border-gray-200 dark:border-gray-700 bg-amber-50/30 dark:bg-amber-950/10">KREDIT</th>
                                <th className="px-3 py-2 text-right font-medium text-xs border-r border-gray-200 dark:border-gray-700 bg-purple-50/30 dark:bg-purple-950/10">DEBIT</th>
                                <th className="px-3 py-2 text-right font-medium text-xs bg-purple-50/30 dark:bg-purple-950/10">KREDIT</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={10} className="px-4 py-4">
                                            <div className="h-6 bg-gray-100 dark:bg-gray-800 rounded-lg w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : worksheetRows.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                                        Belum ada data neraca lajur.
                                    </td>
                                </tr>
                            ) : (
                                worksheetRows.map((row, idx) => (
                                    <tr key={row.account.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-3 py-2.5 text-center text-gray-500 font-medium text-xs border-r border-gray-100 dark:border-gray-800">{idx + 1}</td>
                                        <td className="px-3 py-2.5 font-mono font-bold text-gray-900 dark:text-white text-xs border-r border-gray-100 dark:border-gray-800">
                                            {row.account.kode_akun}
                                        </td>
                                        <td className="px-3 py-2.5 font-bold text-gray-900 dark:text-white text-xs border-r border-gray-100 dark:border-gray-800">
                                            {row.account.nama_akun}
                                        </td>
                                        <td className="px-3 py-2.5 border-r border-gray-100 dark:border-gray-800">
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                                                {row.account.akun_type}
                                            </span>
                                        </td>

                                        {/* Neraca Saldo */}
                                        <td className="px-3 py-2.5 text-right font-medium text-xs text-emerald-600 dark:text-emerald-400 border-r border-gray-100 dark:border-gray-800">
                                            {row.netDebit > 0 ? `Rp ${row.netDebit.toLocaleString('id-ID')}` : '-'}
                                        </td>
                                        <td className="px-3 py-2.5 text-right font-medium text-xs text-rose-600 dark:text-rose-400 border-r border-gray-100 dark:border-gray-800">
                                            {row.netCredit > 0 ? `Rp ${row.netCredit.toLocaleString('id-ID')}` : '-'}
                                        </td>

                                        {/* Laba Rugi */}
                                        <td className="px-3 py-2.5 text-right font-medium text-xs text-amber-600 dark:text-amber-400 border-r border-gray-100 dark:border-gray-800 bg-amber-50/10 dark:bg-amber-950/5">
                                            {row.lrDebit > 0 ? `Rp ${row.lrDebit.toLocaleString('id-ID')}` : '-'}
                                        </td>
                                        <td className="px-3 py-2.5 text-right font-medium text-xs text-amber-600 dark:text-amber-400 border-r border-gray-100 dark:border-gray-800 bg-amber-50/10 dark:bg-amber-950/5">
                                            {row.lrCredit > 0 ? `Rp ${row.lrCredit.toLocaleString('id-ID')}` : '-'}
                                        </td>

                                        {/* Neraca Sheet */}
                                        <td className="px-3 py-2.5 text-right font-medium text-xs text-purple-600 dark:text-purple-400 border-r border-gray-100 dark:border-gray-800 bg-purple-50/10 dark:bg-purple-950/5">
                                            {row.sheetDebit > 0 ? `Rp ${row.sheetDebit.toLocaleString('id-ID')}` : '-'}
                                        </td>
                                        <td className="px-3 py-2.5 text-right font-medium text-xs text-purple-600 dark:text-purple-400 bg-purple-50/10 dark:bg-purple-950/5">
                                            {row.sheetCredit > 0 ? `Rp ${row.sheetCredit.toLocaleString('id-ID')}` : '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        <tfoot className="bg-gray-50 dark:bg-gray-800/90 font-extrabold border-t-2 border-gray-200 dark:border-gray-700">
                            {/* Baris Total Nominal */}
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                                <td colSpan={4} className="px-4 py-3 text-right uppercase tracking-wider text-xs font-bold text-gray-700 dark:text-gray-300">
                                    TOTAL NOMINAL:
                                </td>
                                <td className="px-3 py-3 text-right text-emerald-600 dark:text-emerald-400 text-xs border-r border-gray-200 dark:border-gray-700">
                                    Rp {summaryCalculations.totalNS_D.toLocaleString('id-ID')}
                                </td>
                                <td className="px-3 py-3 text-right text-rose-600 dark:text-rose-400 text-xs border-r border-gray-200 dark:border-gray-700">
                                    Rp {summaryCalculations.totalNS_K.toLocaleString('id-ID')}
                                </td>
                                <td className="px-3 py-3 text-right text-amber-600 dark:text-amber-400 text-xs border-r border-gray-200 dark:border-gray-700">
                                    Rp {summaryCalculations.totalLR_D.toLocaleString('id-ID')}
                                </td>
                                <td className="px-3 py-3 text-right text-amber-600 dark:text-amber-400 text-xs border-r border-gray-200 dark:border-gray-700">
                                    Rp {summaryCalculations.totalLR_K.toLocaleString('id-ID')}
                                </td>
                                <td className="px-3 py-3 text-right text-purple-600 dark:text-purple-400 text-xs border-r border-gray-200 dark:border-gray-700">
                                    Rp {summaryCalculations.totalSheet_D.toLocaleString('id-ID')}
                                </td>
                                <td className="px-3 py-3 text-right text-purple-600 dark:text-purple-400 text-xs">
                                    Rp {summaryCalculations.totalSheet_K.toLocaleString('id-ID')}
                                </td>
                            </tr>

                            {/* Baris Penyesuai Laba / Rugi Bersih */}
                            <tr className="border-b border-gray-200 dark:border-gray-700 bg-blue-50/40 dark:bg-blue-950/20 text-blue-900 dark:text-blue-200">
                                <td colSpan={4} className="px-4 py-3 text-right uppercase tracking-wider text-xs font-bold">
                                    {summaryCalculations.isProfit ? 'LABA BERSIH (PENYESUAIAN)' : 'RUGI BERSIH (PENYESUAIAN)'}:
                                </td>
                                <td className="px-3 py-3 text-right text-xs text-gray-400 border-r border-gray-200 dark:border-gray-700">-</td>
                                <td className="px-3 py-3 text-right text-xs text-gray-400 border-r border-gray-200 dark:border-gray-700">-</td>
                                <td className="px-3 py-3 text-right text-xs font-bold border-r border-gray-200 dark:border-gray-700">
                                    {summaryCalculations.adjLR_D > 0 ? `Rp ${summaryCalculations.adjLR_D.toLocaleString('id-ID')}` : '-'}
                                </td>
                                <td className="px-3 py-3 text-right text-xs font-bold border-r border-gray-200 dark:border-gray-700">
                                    {summaryCalculations.adjLR_K > 0 ? `Rp ${summaryCalculations.adjLR_K.toLocaleString('id-ID')}` : '-'}
                                </td>
                                <td className="px-3 py-3 text-right text-xs font-bold border-r border-gray-200 dark:border-gray-700">
                                    {summaryCalculations.adjSheet_D > 0 ? `Rp ${summaryCalculations.adjSheet_D.toLocaleString('id-ID')}` : '-'}
                                </td>
                                <td className="px-3 py-3 text-right text-xs font-bold">
                                    {summaryCalculations.adjSheet_K > 0 ? `Rp ${summaryCalculations.adjSheet_K.toLocaleString('id-ID')}` : '-'}
                                </td>
                            </tr>

                            {/* Baris Total Akhir / Balanced Total */}
                            <tr className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white">
                                <td colSpan={4} className="px-4 py-3.5 text-right uppercase tracking-wider text-xs font-extrabold">
                                    TOTAL SETELAH PENUTUPAN:
                                </td>
                                <td className="px-3 py-3.5 text-right text-emerald-600 dark:text-emerald-400 text-sm border-r border-gray-200 dark:border-gray-700">
                                    Rp {summaryCalculations.totalNS_D.toLocaleString('id-ID')}
                                </td>
                                <td className="px-3 py-3.5 text-right text-rose-600 dark:text-rose-400 text-sm border-r border-gray-200 dark:border-gray-700">
                                    Rp {summaryCalculations.totalNS_K.toLocaleString('id-ID')}
                                </td>
                                <td className="px-3 py-3.5 text-right text-amber-600 dark:text-amber-400 text-sm border-r border-gray-200 dark:border-gray-700">
                                    Rp {summaryCalculations.finalLR_D.toLocaleString('id-ID')}
                                </td>
                                <td className="px-3 py-3.5 text-right text-amber-600 dark:text-amber-400 text-sm border-r border-gray-200 dark:border-gray-700">
                                    Rp {summaryCalculations.finalLR_K.toLocaleString('id-ID')}
                                </td>
                                <td className="px-3 py-3.5 text-right text-purple-600 dark:text-purple-400 text-sm border-r border-gray-200 dark:border-gray-700">
                                    Rp {summaryCalculations.finalSheet_D.toLocaleString('id-ID')}
                                </td>
                                <td className="px-3 py-3.5 text-right text-purple-600 dark:text-purple-400 text-sm">
                                    Rp {summaryCalculations.finalSheet_K.toLocaleString('id-ID')}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
}
