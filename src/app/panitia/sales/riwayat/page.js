'use client';

import { useEffect, useState, useRef } from 'react';
import { ClipboardList, Search, Trophy, TrendingUp, Users, DollarSign, FileText, FileSpreadsheet, ChevronDown, Loader2 } from 'lucide-react';
import DashboardHeaderFilters from '@/components/panitia/DashboardHeaderFilters';
import DashboardSelect from '@/components/panitia/DashboardSelect';
import SalesRiwayatTable from '@/components/panitia/SalesRiwayatTable';
import TombolCetak from '@/components/panitia/TombolCetak';
import { getSalesSummary, deleteSalesEntry, getSalesRiwayatDetail, getSalesAllDetail } from '@/api/supabase/admin/sales';
import { generatePdfAction } from '@/api/pdf/route';
import { generateSalesExcelAction } from '@/api/excel/sales';
import { NAMA_LOMBA } from '@/lib/lombaData';

export default function SalesRiwayatPage() {
    const [loading, setLoading] = useState(true);
    const [salesSummary, setSalesSummary] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [lombaFilter, setLombaFilter] = useState('all');
    const [exportLoading, setExportLoading] = useState(false);
    const [showExportDropdown, setShowExportDropdown] = useState(false);
    const exportDropdownRef = useRef(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await getSalesSummary(lombaFilter);
            setSalesSummary(data || []);
        } catch (error) {
            console.error("Failed to load sales history summary:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [lombaFilter]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target)) {
                setShowExportDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDelete = async (row) => {
        const identifier = row.nama_nim || row.sumber;
        const confirmMsg = `Apakah Anda yakin ingin menghapus semua data sales untuk "${identifier}"?\nTindakan ini tidak dapat dibatalkan.`;

        if (window.confirm(confirmMsg)) {
            setLoading(true);
            try {
                const details = await getSalesRiwayatDetail(row.nama_nim, row.sumber);
                if (details && details.length > 0) {
                    for (const item of details) {
                        await deleteSalesEntry(item.id);
                    }
                    window.alert("Berhasil menghapus seluruh data sales terkait.");
                    loadData();
                } else {
                    window.alert("Tidak ada data detail untuk dihapus.");
                }
            } catch (error) {
                console.error("Error deleting sales group:", error);
                window.alert("Gagal menghapus data sales.");
            } finally {
                setLoading(false);
            }
        }
    };

    const handleExportPDF = async () => {
        setExportLoading(true);
        setShowExportDropdown(false);
        try {
            const detailData = await getSalesAllDetail(lombaFilter);
            const result = await generatePdfAction({
                type: 'sales_report',
                site: 'pose',
                summaryData: salesSummary,
                detailData,
                namaLombaFilter: lombaFilter,
                printedBy: 'Admin'
            });

            if (!result.success) throw new Error(result.error);

            const byteArr = Uint8Array.from(atob(result.base64Pdf), c => c.charCodeAt(0));
            const blob = new Blob([byteArr], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'Laporan-Sales-POSE-2026.pdf';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export PDF error:', err);
            window.alert('Gagal mengekspor PDF: ' + (err.message || 'Terjadi kesalahan.'));
        } finally {
            setExportLoading(false);
        }
    };

    const handleExportExcel = async () => {
        setExportLoading(true);
        setShowExportDropdown(false);
        try {
            const detailData = await getSalesAllDetail(lombaFilter);
            const result = await generateSalesExcelAction({
                summaryData: salesSummary,
                detailData
            });

            if (!result.success) throw new Error(result.error);

            const byteArr = Uint8Array.from(atob(result.base64Excel), c => c.charCodeAt(0));
            const blob = new Blob([byteArr], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'Laporan-Sales-POSE-2026.xlsx';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export Excel error:', err);
            window.alert('Gagal mengekspor Excel: ' + (err.message || 'Terjadi kesalahan.'));
        } finally {
            setExportLoading(false);
        }
    };

    // Stat cards dari summary
    const totalKomisi = salesSummary.reduce((s, r) => s + (r.total_nominal || 0), 0);
    const totalIdentitas = salesSummary.length;
    const topReferrer = salesSummary.length > 0
        ? (salesSummary[0].nama_nim ? `${salesSummary[0].nama_nim} (${salesSummary[0].sumber})` : salesSummary[0].sumber)
        : '-';

    const allLombaList = [
        { value: 'all', label: 'Semua Lomba' },
        ...Object.values(NAMA_LOMBA).flat().map(name => ({ value: name, label: name }))
    ];

    const extraFilters = (
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama / NIM..."
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
            </div>

            {/* Dropdown Lomba */}
            <DashboardSelect
                icon={Trophy}
                value={lombaFilter}
                onChange={(e) => setLombaFilter(e.target.value)}
                options={allLombaList}
            />

            {/* Integrated TombolCetak */}
            <TombolCetak
                label="Cetak / Export"
                pdfTitle="Laporan Riwayat Sales POSE 2026"
                pdfSite="pose"
                pdfData={salesSummary}
                pdfDocumentType="sales_report"
                pdfExtraProps={{
                    summaryData: salesSummary,
                    detailData: salesSummary,
                    namaLombaFilter: lombaFilter
                }}
                excelData={salesSummary.map((row, idx) => ({
                    'No': idx + 1,
                    'Sumber': row.sumber || '-',
                    'Nama / NIM': row.nama_nim || '-',
                    'Total Nominal Komisi (Rp)': row.total_nominal || 0
                }))}
                excelColumns={[
                    { key: 'Sumber', label: 'Sumber' },
                    { key: 'Nama / NIM', label: 'Nama / NIM' },
                    { key: 'Total Nominal Komisi (Rp)', label: 'Total Nominal Komisi (Rp)', align: 'right', format: 'currency' }
                ]}
                excelFilename="Laporan-Sales-POSE-2026"
            />
        </div>
    );

    return (
        <div className="space-y-6">
            <DashboardHeaderFilters
                title="Riwayat Sales & Referral"
                subtitle="Lihat akumulasi nominal komisi per identitas sales, hapus entri, dan klik untuk menampilkan riwayat detail."
                icon={ClipboardList}
                showSiteFilter={false}
                extraFilters={extraFilters}
                onRefresh={loadData}
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center flex-shrink-0">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase">Total Utang Komisi</p>
                        <h4 className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                            Rp {totalKomisi.toLocaleString('id-ID')}
                        </h4>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase">Identitas Sales Aktif</p>
                        <h4 className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                            {totalIdentitas} Orang
                        </h4>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4">
                    <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-xl flex items-center justify-center flex-shrink-0">
                        <TrendingUp size={24} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase truncate">Top Referrer</p>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white mt-1 truncate">
                            {topReferrer}
                        </h4>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-10 text-center animate-pulse">
                    <span className="text-sm text-gray-500">Memuat data riwayat sales...</span>
                </div>
            ) : (
                <SalesRiwayatTable
                    data={salesSummary}
                    onDelete={handleDelete}
                    namaLombaFilter={lombaFilter}
                    searchQuery={searchQuery}
                />
            )}
        </div>
    );
}
