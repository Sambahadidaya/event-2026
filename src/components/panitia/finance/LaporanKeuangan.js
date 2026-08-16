'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    PieChart, Printer, TrendingUp, TrendingDown, DollarSign,
    FileText, Wallet, Layers, ShieldCheck, Activity
} from 'lucide-react';
import { getTransactionFinance, getJournalEntry, getMasterAccount } from '@/api/supabase/admin/finance';
import DashboardHeaderFilters, { SITE_OPTIONS_FINANCE } from '@/components/panitia/DashboardHeaderFilters';
import DateRangeFilter from '@/components/panitia/DateRangeFilter';
import TombolCetak from '@/components/panitia/TombolCetak';

export default function LaporanKeuangan({ siteType = 'all', adminRole = '' }) {
    const [transactions, setTransactions] = useState([]);
    const [journals, setJournals] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('laba_rugi');
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
            const [txData, jeData, accData] = await Promise.all([
                getTransactionFinance(targetSite, dateRange.startDate, dateRange.endDate),
                getJournalEntry(targetSite, dateRange.startDate, dateRange.endDate),
                getMasterAccount(targetSite)
            ]);

            setTransactions(txData || []);
            setJournals(jeData || []);
            setAccounts(accData || []);
            setLastSyncedAt(Date.now());
        } catch (error) {
            console.error("Error fetching Laporan Keuangan:", error);
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

    // Calculate core figures
    const metrics = useMemo(() => {
        let totalIncome = 0;
        let totalExpense = 0;
        const incomeCategories = {};
        const expenseCategories = {};

        transactions.forEach(t => {
            const isExpense = t.kategori?.type_transaksi === 'expense' || t.kode_payer?.startsWith('EXP');
            const val = Number(t.nominal || 0);
            const catName = t.kategori?.nama_kategori || (isExpense ? 'Pengeluaran Panitia' : 'Pendapatan Peserta');

            if (isExpense) {
                totalExpense += val;
                expenseCategories[catName] = (expenseCategories[catName] || 0) + val;
            } else {
                totalIncome += val;
                incomeCategories[catName] = (incomeCategories[catName] || 0) + val;
            }
        });

        const netIncome = totalIncome - totalExpense;

        // Assets, Liabilities, Equity breakdown from journals/accounts
        let totalAsset = 0;
        let totalLiability = 0;
        let totalEquity = 0;

        // Group by account type
        accounts.forEach(acc => {
            const type = acc.akun_type?.toLowerCase();
            const accJournals = journals.filter(j => (j.account_id || j.account?.id) === acc.id);
            let bal = 0;

            accJournals.forEach(j => {
                const d = Number(j.debit || 0);
                const c = Number(j.credit || 0);
                if (['asset', 'expense'].includes(type)) {
                    bal += (d - c);
                } else {
                    bal += (c - d);
                }
            });

            if (type === 'asset') totalAsset += bal;
            if (type === 'liability') totalLiability += bal;
            if (type === 'equity') totalEquity += bal;
        });

        return {
            totalIncome,
            totalExpense,
            netIncome,
            incomeCategories,
            expenseCategories,
            totalAsset,
            totalLiability,
            totalEquity
        };
    }, [transactions, journals, accounts]);

    const excelSheets = useMemo(() => {
        const totalIncome = metrics.totalIncome || 0;
        const totalExpense = metrics.totalExpense || 0;
        const netIncome = metrics.netIncome || 0;

        if (activeTab === 'laba_rugi') {
            const rowData = [];
            rowData.push({ keterangan: '1. Pendapatan (Revenue)', nominal: '' });
            Object.entries(metrics.incomeCategories || {}).forEach(([cat, val]) => {
                rowData.push({ keterangan: `   ${cat}`, nominal: val });
            });
            rowData.push({ keterangan: 'Total Pendapatan', nominal: totalIncome });
            rowData.push({ keterangan: '', nominal: '' });
            rowData.push({ keterangan: '2. Beban / Pengeluaran (Expenses)', nominal: '' });
            Object.entries(metrics.expenseCategories || {}).forEach(([cat, val]) => {
                rowData.push({ keterangan: `   ${cat}`, nominal: val });
            });
            rowData.push({ keterangan: 'Total Beban Pengeluaran', nominal: totalExpense });
            rowData.push({ keterangan: '', nominal: '' });
            rowData.push({ keterangan: 'LABA BERSIH (NET INCOME)', nominal: netIncome });

            return [
                {
                    sheetName: 'Laba Rugi',
                    data: rowData,
                    columns: [
                        { key: 'keterangan', label: 'Keterangan' },
                        { key: 'nominal', label: 'Nominal (Rp)' }
                    ]
                }
            ];
        }

        if (activeTab === 'kas_besar') {
            const last10 = transactions.slice(0, 10);
            const rowData = last10.map(t => {
                const isExpense = t.kategori?.type_transaksi === 'expense' || t.kode_payer?.startsWith('EXP');
                return {
                    kode_id: t.kode_id || '-',
                    tanggal_transaksi: t.tanggal_transaksi || '-',
                    keterangan: t.keterangan || '-',
                    nama_payer: t.nama_payer || '-',
                    nominal: isExpense ? -Number(t.nominal || 0) : Number(t.nominal || 0)
                };
            });
            rowData.push({ keterangan: 'TOTAL PEMASUKAN', nominal: totalIncome });
            rowData.push({ keterangan: 'TOTAL PENGELUARAN', nominal: -totalExpense });
            rowData.push({ keterangan: 'SALDO KAS BERSIH', nominal: netIncome });

            return [
                {
                    sheetName: 'Kas Besar',
                    data: rowData,
                    columns: [
                        { key: 'kode_id', label: 'Kode' },
                        { key: 'tanggal_transaksi', label: 'Tanggal' },
                        { key: 'keterangan', label: 'Uraian' },
                        { key: 'nama_payer', label: 'Pembayar/Vendor' },
                        { key: 'nominal', label: 'Nominal (Rp)' }
                    ]
                }
            ];
        }

        if (activeTab === 'perubahan_modal') {
            const rowData = [
                { keterangan: 'Modal Awal Kegiatan', nominal: 0 },
                { keterangan: '+ Laba Bersih Periode Ini', nominal: netIncome },
                { keterangan: '- Prive / Penarikan Modal', nominal: 0 },
                { keterangan: 'MODAL AKHIR PANITIA', nominal: netIncome }
            ];
            return [
                {
                    sheetName: 'Perubahan Modal',
                    data: rowData,
                    columns: [
                        { key: 'keterangan', label: 'Keterangan' },
                        { key: 'nominal', label: 'Nominal (Rp)' }
                    ]
                }
            ];
        }

        if (activeTab === 'posisi_keuangan') {
            const rowData = [
                { klasifikasi: 'ASET', keterangan: 'Kas & Bank / QRIS', nominal: totalIncome },
                { klasifikasi: 'ASET', keterangan: 'TOTAL ASET', nominal: totalIncome },
                { klasifikasi: '', keterangan: '', nominal: '' },
                { klasifikasi: 'KEWAJIBAN & EKUITAS', keterangan: 'Kewajiban (Utang)', nominal: totalExpense },
                { klasifikasi: 'KEWAJIBAN & EKUITAS', keterangan: 'Ekuitas (Modal Akhir)', nominal: netIncome },
                { klasifikasi: 'KEWAJIBAN & EKUITAS', keterangan: 'TOTAL KEWAJIBAN & EKUITAS', nominal: totalIncome }
            ];
            return [
                {
                    sheetName: 'Posisi Keuangan',
                    data: rowData,
                    columns: [
                        { key: 'klasifikasi', label: 'Klasifikasi' },
                        { key: 'keterangan', label: 'Pos Keuangan' },
                        { key: 'nominal', label: 'Nominal (Rp)' }
                    ]
                }
            ];
        }

        if (activeTab === 'arus_kas') {
            const rowData = [
                { keterangan: '1. Arus Kas dari Aktivitas Operasional', nominal: '' },
                { keterangan: '   Penerimaan Kas dari Peserta (Iuran/Lomba)', nominal: totalIncome },
                { keterangan: '   Pembayaran Kas untuk Beban Operasional', nominal: -totalExpense },
                { keterangan: '   Kas Bersih dari Aktivitas Operasional', nominal: netIncome },
                { keterangan: '2. Arus Kas dari Aktivitas Investasi', nominal: '' },
                { keterangan: '   Pembelian Peralatan / Aset Tetap', nominal: 0 },
                { keterangan: '3. Arus Kas dari Aktivitas Pendanaan', nominal: '' },
                { keterangan: '   Sponsor / Hibah / Injeksi Modal', nominal: 0 },
                { keterangan: 'KENAIKAN BERSIH KAS & SETARA KAS', nominal: netIncome }
            ];
            return [
                {
                    sheetName: 'Arus Kas',
                    data: rowData,
                    columns: [
                        { key: 'keterangan', label: 'Uraian Arus Kas' },
                        { key: 'nominal', label: 'Nominal (Rp)' }
                    ]
                }
            ];
        }

        if (activeTab === 'perubahan_ekuitas') {
            const rowData = [
                { keterangan: 'Saldo Awal Periode', modal_disetor: 0, saldo_laba: 0, total_ekuitas: 0 },
                { keterangan: '+ Laba Tahun Berjalan', modal_disetor: 0, saldo_laba: netIncome, total_ekuitas: netIncome },
                { keterangan: 'SALDO AKHIR EKUITAS', modal_disetor: 0, saldo_laba: netIncome, total_ekuitas: netIncome }
            ];
            return [
                {
                    sheetName: 'Perubahan Ekuitas',
                    data: rowData,
                    columns: [
                        { key: 'keterangan', label: 'Keterangan Ekuitas' },
                        { key: 'modal_disetor', label: 'Modal Disetor' },
                        { key: 'saldo_laba', label: 'Saldo Laba' },
                        { key: 'total_ekuitas', label: 'Total Ekuitas' }
                    ]
                }
            ];
        }

        return [];
    }, [activeTab, metrics, transactions]);

    const handlePrint = () => {
        window.print();
    };

    const TABS = [
        { id: 'laba_rugi', label: 'Laporan Laba Rugi', icon: TrendingUp },
        { id: 'kas_besar', label: 'Laporan Kas Besar', icon: Wallet },
        { id: 'perubahan_modal', label: 'Perubahan Modal', icon: Layers },
        { id: 'posisi_keuangan', label: 'Posisi Keuangan (Neraca)', icon: ShieldCheck },
        { id: 'arus_kas', label: 'Laporan Arus Kas', icon: Activity },
        { id: 'perubahan_ekuitas', label: 'Perubahan Ekuitas', icon: DollarSign },
    ];

    return (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500 print:space-y-2">
            {/* Header */}
            <div className="print:hidden">
                <DashboardHeaderFilters
                    title="Laporan Keuangan"
                    subtitle={currentSite === 'all' ? "Pusat rincian laporan akuntansi resmi (Laba Rugi, Kas Besar, Neraca, Arus Kas)." : `Laporan keuangan site ${currentSite.toUpperCase()}`}
                    icon={PieChart}
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

            {/* Print Title Header */}
            <div className="hidden print:block text-center border-b pb-4 mb-4">
                <h1 className="text-2xl font-bold">PORTAL KAMPUS 2026</h1>
                <h2 className="text-lg font-semibold uppercase">{TABS.find(t => t.id === activeTab)?.label} ({currentSite.toUpperCase()})</h2>
                <p className="text-xs text-gray-500">Tanggal cetak: {new Date().toLocaleDateString('id-ID')}</p>
            </div>

            {/* Sub-report Tab Navigation */}
            <div className="bg-white dark:bg-gray-900 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-x-auto flex items-center gap-1.5 print:hidden custom-scrollbar">
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${isActive ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                        >
                            <Icon size={16} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Top Toolbar: Date & Print */}
            <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 print:hidden">
                <DateRangeFilter
                    startDate={dateRange.startDate}
                    endDate={dateRange.endDate}
                    onFilterChange={(s, e) => setDateRange({ startDate: s, endDate: e })}
                />

                <div className="flex items-center gap-2">
                    <TombolCetak
                        label="Cetak / Export"
                        pdfTitle={`Laporan Keuangan - ${activeTab.replace(/_/g, ' ').toUpperCase()}`}
                        pdfSite={currentSite}
                        pdfData={transactions}
                        pdfDocumentType="financial_report"
                        pdfTabType={activeTab}
                        pdfMetrics={metrics}
                        excelSheets={excelSheets}
                        excelFilename={`Laporan_Keuangan_${activeTab}_${currentSite}`}
                    />
                </div>
            </div>

            {/* TAB CONTENT */}
            {loading ? (
                <div className="bg-white dark:bg-gray-900 p-12 rounded-2xl border border-gray-100 dark:border-gray-800 text-center">
                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-sm text-gray-500">Memuat laporan keuangan...</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* 1. LABA RUGI */}
                    {activeTab === 'laba_rugi' && (
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-6">
                            <div className="border-b pb-4 dark:border-gray-800">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Laporan Laba Rugi (Income Statement)</h2>
                                <p className="text-xs text-gray-500">Perincian pendapatan dan beban operasional kegiatan</p>
                            </div>

                            {/* Section Pendapatan */}
                            <div className="space-y-3">
                                <h3 className="font-bold text-emerald-600 dark:text-emerald-400 text-sm uppercase tracking-wider">1. Pendapatan (Revenue)</h3>
                                <div className="space-y-2">
                                    {Object.entries(metrics.incomeCategories).map(([cat, amt]) => (
                                        <div key={cat} className="flex justify-between text-sm py-1 border-b border-gray-100 dark:border-gray-800/50">
                                            <span className="text-gray-700 dark:text-gray-300">{cat}</span>
                                            <span className="font-semibold text-gray-900 dark:text-white">Rp {amt.toLocaleString('id-ID')}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between font-extrabold text-sm py-2 bg-emerald-50 dark:bg-emerald-900/20 px-3 rounded-xl text-emerald-700 dark:text-emerald-300">
                                    <span>Total Pendapatan</span>
                                    <span>Rp {metrics.totalIncome.toLocaleString('id-ID')}</span>
                                </div>
                            </div>

                            {/* Section Beban */}
                            <div className="space-y-3">
                                <h3 className="font-bold text-rose-600 dark:text-rose-400 text-sm uppercase tracking-wider">2. Beban / Pengeluaran (Expenses)</h3>
                                <div className="space-y-2">
                                    {Object.keys(metrics.expenseCategories).length === 0 ? (
                                        <p className="text-xs text-gray-400 italic">Belum ada catatan pengeluaran.</p>
                                    ) : (
                                        Object.entries(metrics.expenseCategories).map(([cat, amt]) => (
                                            <div key={cat} className="flex justify-between text-sm py-1 border-b border-gray-100 dark:border-gray-800/50">
                                                <span className="text-gray-700 dark:text-gray-300">{cat}</span>
                                                <span className="font-semibold text-gray-900 dark:text-white">Rp {amt.toLocaleString('id-ID')}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="flex justify-between font-extrabold text-sm py-2 bg-rose-50 dark:bg-rose-900/20 px-3 rounded-xl text-rose-700 dark:text-rose-300">
                                    <span>Total Beban Pengeluaran</span>
                                    <span>Rp {metrics.totalExpense.toLocaleString('id-ID')}</span>
                                </div>
                            </div>

                            {/* Net Income Summary */}
                            <div className={`p-4 rounded-2xl border flex items-center justify-between font-bold text-lg ${metrics.netIncome >= 0 ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 text-blue-800 dark:text-blue-200' : 'bg-rose-50 dark:bg-rose-900/30 border-rose-200 text-rose-800 dark:text-rose-200'}`}>
                                <span>LABA BERSIH (NET INCOME)</span>
                                <span>Rp {metrics.netIncome.toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                    )}

                    {/* 2. KAS BESAR */}
                    {activeTab === 'kas_besar' && (
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-6">
                            <div className="border-b pb-4 dark:border-gray-800">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Laporan Kas Besar (Cash Ledger Summary)</h2>
                                <p className="text-xs text-gray-500">Ringkasan arus kas masuk dan keluar per kategori transaksi</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
                                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase mb-1">Pemasukan Kas Besar</p>
                                    <h3 className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">
                                        Rp {metrics.totalIncome.toLocaleString('id-ID')}
                                    </h3>
                                </div>
                                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800">
                                    <p className="text-xs text-rose-600 dark:text-rose-400 font-bold uppercase mb-1">Pengeluaran Kas Besar</p>
                                    <h3 className="text-2xl font-extrabold text-rose-700 dark:text-rose-300">
                                        Rp {metrics.totalExpense.toLocaleString('id-ID')}
                                    </h3>
                                </div>
                            </div>

                            {/* Daftar Transaksi Ringkas */}
                            <div className="space-y-3">
                                <h3 className="font-bold text-gray-900 dark:text-white text-sm">Mutasi Kas Terakhir ({transactions.length} transaksi)</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500">
                                            <tr>
                                                <th className="p-2">Kode</th>
                                                <th className="p-2">Tanggal</th>
                                                <th className="p-2">Uraian</th>
                                                <th className="p-2">Pembayar/Vendor</th>
                                                <th className="p-2 text-right">Nominal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {transactions.slice(0, 10).map(t => {
                                                const isExpense = t.kategori?.type_transaksi === 'expense' || t.kode_payer?.startsWith('EXP');
                                                return (
                                                    <tr key={t.id}>
                                                        <td className="p-2 font-mono">{t.kode_id}</td>
                                                        <td className="p-2">{t.tanggal_transaksi || '-'}</td>
                                                        <td className="p-2">{t.keterangan || '-'}</td>
                                                        <td className="p-2 font-semibold">{t.nama_payer || '-'}</td>
                                                        <td className={`p-2 text-right font-extrabold ${isExpense ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                            {isExpense ? '-' : '+'} Rp {Number(t.nominal || 0).toLocaleString('id-ID')}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 3. PERUBAHAN MODAL */}
                    {activeTab === 'perubahan_modal' && (
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-6">
                            <div className="border-b pb-4 dark:border-gray-800">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Laporan Perubahan Modal (Capital Statement)</h2>
                                <p className="text-xs text-gray-500">Rekapitulasi perkembangan ekuitas dan modal akhir panitia</p>
                            </div>

                            <div className="space-y-3 max-w-2xl">
                                <div className="flex justify-between py-2 border-b text-sm">
                                    <span className="text-gray-600 dark:text-gray-400 font-medium">Modal Awal Kegiatan</span>
                                    <span className="font-bold text-gray-900 dark:text-white">Rp 0</span>
                                </div>
                                <div className="flex justify-between py-2 border-b text-sm">
                                    <span className="text-emerald-600 font-medium">+ Laba Bersih Periode Ini</span>
                                    <span className="font-bold text-emerald-600">Rp {metrics.netIncome.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b text-sm">
                                    <span className="text-rose-600 font-medium">- Prive / Penarikan Modal</span>
                                    <span className="font-bold text-rose-600">Rp 0</span>
                                </div>
                                <div className="flex justify-between py-3 bg-emerald-50 dark:bg-emerald-900/30 px-4 rounded-xl font-extrabold text-base text-emerald-800 dark:text-emerald-200">
                                    <span>MODAL AKHIR PANITIA</span>
                                    <span>Rp {metrics.netIncome.toLocaleString('id-ID')}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 4. POSISI KEUANGAN (NERACA) */}
                    {activeTab === 'posisi_keuangan' && (
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-6">
                            <div className="border-b pb-4 dark:border-gray-800">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Laporan Posisi Keuangan (Balance Sheet)</h2>
                                <p className="text-xs text-gray-500">Aset, Kewajiban, dan Ekuitas Organisasi</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* ASET */}
                                <div className="space-y-3">
                                    <h3 className="font-bold text-blue-600 dark:text-blue-400 text-sm uppercase tracking-wider">ASET (ASSETS)</h3>
                                    <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>Kas & Bank / QRIS</span>
                                            <span className="font-bold">Rp {metrics.totalIncome.toLocaleString('id-ID')}</span>
                                        </div>
                                        <div className="flex justify-between font-extrabold text-sm text-blue-700 dark:text-blue-300 border-t pt-2">
                                            <span>TOTAL ASET</span>
                                            <span>Rp {metrics.totalIncome.toLocaleString('id-ID')}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* KEWAJIBAN & EKUITAS */}
                                <div className="space-y-3">
                                    <h3 className="font-bold text-purple-600 dark:text-purple-400 text-sm uppercase tracking-wider">KEWAJIBAN & EKUITAS</h3>
                                    <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>Kewajiban (Utang)</span>
                                            <span className="font-bold">Rp {metrics.totalExpense.toLocaleString('id-ID')}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span>Ekuitas (Modal Akhir)</span>
                                            <span className="font-bold">Rp {metrics.netIncome.toLocaleString('id-ID')}</span>
                                        </div>
                                        <div className="flex justify-between font-extrabold text-sm text-purple-700 dark:text-purple-300 border-t pt-2">
                                            <span>TOTAL KEWAJIBAN & EKUITAS</span>
                                            <span>Rp {metrics.totalIncome.toLocaleString('id-ID')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 5. ARUS KAS */}
                    {activeTab === 'arus_kas' && (
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-6">
                            <div className="border-b pb-4 dark:border-gray-800">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Laporan Arus Kas (Cash Flow Statement)</h2>
                                <p className="text-xs text-gray-500">Arus kas dari Aktivitas Operasional, Investasi, dan Pendanaan</p>
                            </div>

                            <div className="space-y-4 max-w-3xl">
                                <div className="space-y-2">
                                    <h4 className="font-bold text-xs uppercase text-gray-500">1. Arus Kas dari Aktivitas Operasional</h4>
                                    <div className="pl-4 space-y-1 text-sm border-l-2 border-emerald-500">
                                        <div className="flex justify-between">
                                            <span>Penerimaan Kas dari Peserta (Iuran/Lomba)</span>
                                            <span className="font-semibold text-emerald-600">+ Rp {metrics.totalIncome.toLocaleString('id-ID')}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Pembayaran Kas untuk Beban Operasional</span>
                                            <span className="font-semibold text-rose-600">- Rp {metrics.totalExpense.toLocaleString('id-ID')}</span>
                                        </div>
                                        <div className="flex justify-between font-bold pt-1 border-t text-gray-900 dark:text-white">
                                            <span>Kas Bersih dari Aktivitas Operasional</span>
                                            <span>Rp {metrics.netIncome.toLocaleString('id-ID')}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-bold text-xs uppercase text-gray-500">2. Arus Kas dari Aktivitas Investasi</h4>
                                    <div className="pl-4 text-sm border-l-2 border-gray-300 dark:border-gray-700">
                                        <div className="flex justify-between">
                                            <span>Pembelian Peralatan / Aset Tetap</span>
                                            <span className="font-semibold text-gray-400">Rp 0</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-bold text-xs uppercase text-gray-500">3. Arus Kas dari Aktivitas Pendanaan</h4>
                                    <div className="pl-4 text-sm border-l-2 border-gray-300 dark:border-gray-700">
                                        <div className="flex justify-between">
                                            <span>Sponsor / Hibah / Injeksi Modal</span>
                                            <span className="font-semibold text-gray-400">Rp 0</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex justify-between font-extrabold text-base text-emerald-800 dark:text-emerald-200">
                                    <span>KENAIKAN BERSIH KAS & SETARA KAS</span>
                                    <span>Rp {metrics.netIncome.toLocaleString('id-ID')}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 6. PERUBAHAN EKUITAS */}
                    {activeTab === 'perubahan_ekuitas' && (
                        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 space-y-6">
                            <div className="border-b pb-4 dark:border-gray-800">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Laporan Perubahan Ekuitas (Statement of Equity)</h2>
                                <p className="text-xs text-gray-500">Rincian mutasi ekuitas saldo laba ditahan dan cadangan dana</p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500">
                                        <tr>
                                            <th className="p-3">Keterangan Ekuitas</th>
                                            <th className="p-3 text-right">Modal Disetor</th>
                                            <th className="p-3 text-right">Saldo Laba</th>
                                            <th className="p-3 text-right">Total Ekuitas</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        <tr>
                                            <td className="p-3 font-semibold">Saldo Awal Periode</td>
                                            <td className="p-3 text-right">Rp 0</td>
                                            <td className="p-3 text-right">Rp 0</td>
                                            <td className="p-3 text-right font-bold">Rp 0</td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 font-semibold text-emerald-600">+ Laba Tahun Berjalan</td>
                                            <td className="p-3 text-right">Rp 0</td>
                                            <td className="p-3 text-right text-emerald-600 font-semibold">Rp {metrics.netIncome.toLocaleString('id-ID')}</td>
                                            <td className="p-3 text-right font-bold text-emerald-600">Rp {metrics.netIncome.toLocaleString('id-ID')}</td>
                                        </tr>
                                    </tbody>
                                    <tfoot className="bg-emerald-50 dark:bg-emerald-900/30 font-extrabold">
                                        <tr>
                                            <td className="p-3">SALDO AKHIR EKUITAS</td>
                                            <td className="p-3 text-right">Rp 0</td>
                                            <td className="p-3 text-right">Rp {metrics.netIncome.toLocaleString('id-ID')}</td>
                                            <td className="p-3 text-right text-base text-emerald-700 dark:text-emerald-300">
                                                Rp {metrics.netIncome.toLocaleString('id-ID')}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
