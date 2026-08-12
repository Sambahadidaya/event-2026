'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Search, Download, FileText, Activity, Heart, AlertTriangle } from 'lucide-react';
import { getDataMedisAll } from '@/api/supabase/admin/medis';
import { exportMedisToExcel } from '@/lib/excel/medis';
import { generatePdfAction } from '@/api/pdf/route';
import DashboardHeaderFilters from '@/components/panitia/DashboardHeaderFilters';
import TablePagination from '@/components/panitia/TablePagination';

const ITEMS_PER_PAGE = 10;

export default function AdminPesertaMedis() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [lastSyncedAt, setLastSyncedAt] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    // States untuk export loading
    const [exportingPdf, setExportingPdf] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const res = await getDataMedisAll();
        setData(res || []);
        setLastSyncedAt(Date.now());
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Search dan filter berdasarkan: Nama, NIM, Nama Kelompok, atau Nama Kabim
    const filteredData = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return data;

        return data.filter(item =>
            (item.nama && item.nama.toLowerCase().includes(query)) ||
            (item.nim && item.nim.toLowerCase().includes(query)) ||
            (item.nama_kelompok && item.nama_kelompok.toLowerCase().includes(query)) ||
            (item.nama_kabim && item.nama_kabim.toLowerCase().includes(query))
        );
    }, [data, searchQuery]);

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE) || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedData = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    // Reset pagination saat query pencarian berubah
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    // Handle excel export
    const handleExportExcel = () => {
        exportMedisToExcel(filteredData);
    };

    // Handle PDF export via Puppeteer Action
    const handleExportPdf = async () => {
        if (filteredData.length === 0) {
            alert('Tidak ada data medis untuk diexport.');
            return;
        }
        setExportingPdf(true);
        try {
            const res = await generatePdfAction({
                type: 'medis',
                title: 'LAPORAN DATA MEDIS PESERTA PKKMB 2026',
                data: filteredData,
                site: 'pkkmb',
                printedBy: 'PJ Medis'
            });

            if (res.success && res.base64Pdf) {
                const byteCharacters = atob(res.base64Pdf);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: 'application/pdf' });

                const link = document.createElement('a');
                link.href = window.URL.createObjectURL(blob);
                link.download = `laporan-medis-pkkmb_${new Date().toISOString().split('T')[0]}.pdf`;
                link.click();
            } else {
                alert(res.error || 'Gagal membuat file PDF.');
            }
        } catch (err) {
            console.error('Pdf error:', err);
            alert('Terjadi kesalahan saat mendownload PDF.');
        } finally {
            setExportingPdf(false);
        }
    };

    return (
        <div className="space-y-6">
            <DashboardHeaderFilters
                title="Data Medis & Riwayat Penyakit Peserta"
                subtitle="Pantau kondisi kesehatan, alergi, dan riwayat penyakit darurat peserta PKKMB 2026"
                icon={Heart}
                showSiteFilter={false}
                onRefresh={fetchData}
                loading={loading}
                lastSyncedAt={lastSyncedAt}
            />

            {/* Panel Aksi: Search & Download Buttons */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari nama, nim, kelompok, atau kabim..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="flex flex-wrap w-full md:w-auto gap-2">
                    <button
                        onClick={handleExportExcel}
                        className="flex-1 md:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                        <Download size={16} /> Excel
                    </button>
                    <button
                        onClick={handleExportPdf}
                        disabled={exportingPdf}
                        className="flex-1 md:flex-none px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-600/55 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                        <FileText size={16} /> {exportingPdf ? 'Membuat PDF...' : 'Unduh PDF'}
                    </button>
                </div>
            </div>

            {/* Info Metrics singkat */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 p-4 border border-gray-100 dark:border-slate-800 rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-500 flex items-center justify-center"><Activity size={20} /></div>
                    <div>
                        <p className="text-xs text-gray-400">Riwayat Penyakit</p>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                            {data.filter(item => item.riwayat_penyakit !== '-' && item.riwayat_penyakit !== '').length} Orang
                        </h4>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 border border-gray-100 dark:border-slate-800 rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/20 text-orange-500 flex items-center justify-center"><AlertTriangle size={20} /></div>
                    <div>
                        <p className="text-xs text-gray-400">Memiliki Alergi</p>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                            {data.filter(item => item.alergi !== '-' && item.alergi !== '').length} Orang
                        </h4>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 border border-gray-100 dark:border-slate-800 rounded-2xl flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-500 flex items-center justify-center"><Heart size={20} /></div>
                    <div>
                        <p className="text-xs text-gray-400">Total Peserta Terdata</p>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">{data.length} Orang</h4>
                    </div>
                </div>
            </div>

            {/* Tabel Data Medis */}
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-slate-800">
                                <th className="p-4 w-12 text-center">No</th>
                                <th className="p-4">Nama Lengkap</th>
                                <th className="p-4">NIM</th>
                                <th className="p-4">Prodi</th>
                                <th className="p-4">No Wa</th>
                                <th className="p-4">Kelompok / Kabim</th>
                                <th className="p-4">Penyakit</th>
                                <th className="p-4">Penanganan</th>
                                <th className="p-4">Alergi</th>
                                <th className="p-4">Kontak Wali / Ortu</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={9} className="p-4"><div className="h-8 bg-gray-100 dark:bg-slate-800 rounded-lg w-full"></div></td>
                                    </tr>
                                ))
                            ) : paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="p-8 text-center text-gray-500">Tidak ditemukan data medis peserta.</td>
                                </tr>
                            ) : paginatedData.map((item, idx) => {
                                const hasMedis = item.riwayat_penyakit !== '-' || item.alergi !== '-';
                                return (
                                    <tr key={item.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors ${hasMedis ? 'bg-red-50/5 dark:bg-red-950/5' : ''}`}>
                                        <td className="p-4 text-center text-gray-500 font-medium">{startIndex + idx + 1}</td>
                                        <td className="p-4 font-bold text-gray-900 dark:text-white">{item.nama}</td>
                                        <td className="p-4 text-gray-700 dark:text-gray-300 font-mono text-xs">{item.nim}</td>
                                        <td className="p-4 text-gray-600 dark:text-gray-400 text-xs">{item.prodi}</td>
                                        <td className="p-4 text-gray-600 dark:text-gray-400 text-xs">{item.email_wa}</td>
                                        <td className="p-4">
                                            <div className="font-semibold text-gray-800 dark:text-gray-200">{item.nama_kelompok}</div>
                                            <div className="text-[10px] text-gray-400">PJ: {item.nama_kabim}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${item.riwayat_penyakit !== '-' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'text-gray-400'}`}>
                                                {item.riwayat_penyakit}
                                            </span>
                                        </td>
                                        <td className="p-4 text-xs text-gray-600 dark:text-gray-400 max-w-xs truncate" title={item.penanganan}>{item.penanganan}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${item.alergi !== '-' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' : 'text-gray-400'}`}>
                                                {item.alergi}
                                            </span>
                                        </td>
                                        <td className="p-4 text-xs">
                                            <div className="font-semibold text-gray-800 dark:text-gray-200">{item.nama_ortu_wali}</div>
                                            <div className="text-[10px] text-gray-400">{item.no_wa_ortu_wali}</div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="p-4 border-t border-gray-100 dark:border-slate-800">
                        <TablePagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
