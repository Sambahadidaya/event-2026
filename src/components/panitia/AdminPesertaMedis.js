'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import {
    Search, Activity, Heart, AlertTriangle,
    Eye, GraduationCap, Phone, UserCheck, X
} from 'lucide-react';
import { getDataMedisAll } from '@/api/supabase/admin/medis';
import { getCurrentAdmin } from '@/api/supabase/admin/auth';
import { getSiteFromRole } from '@/lib/adminRoleData';
import TombolCetak from '@/components/panitia/TombolCetak';
import DashboardHeaderFilters from '@/components/panitia/DashboardHeaderFilters';
import TablePagination from '@/components/panitia/TablePagination';

const ITEMS_PER_PAGE = 10;

export default function AdminPesertaMedis() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [lastSyncedAt, setLastSyncedAt] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedSite, setSelectedSite] = useState('pkkmb');
    const [adminRole, setAdminRole] = useState(null);

    // Modal Detail Spesifik Anggota
    const [detailMemberModal, setDetailMemberModal] = useState(null);

    const isSuperAdmin = adminRole === 'super_admin';

    const getInitials = (name = '') => {
        const parts = name.trim().split(' ').filter(Boolean);
        if (parts.length === 0) return 'PK';
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[1][0]).toUpperCase();
    };

    const fetchData = useCallback(async (siteTarget) => {
        setLoading(true);
        const res = await getDataMedisAll(siteTarget);
        setData(res || []);
        setLastSyncedAt(Date.now());
        setLoading(false);
    }, []);

    // Load admin session & auth
    useEffect(() => {
        getCurrentAdmin().then(admin => {
            if (admin) {
                setAdminRole(admin.role);
                const isSuper = admin.role === 'super_admin';
                const detectedSite = getSiteFromRole(admin.role);
                const initialSite = isSuper ? 'pkkmb' : detectedSite;
                setSelectedSite(initialSite);
                fetchData(initialSite);
            }
        });
    }, [fetchData]);

    const handleSiteChange = async (site) => {
        setSelectedSite(site);
        await fetchData(site);
    };

    // Search dan filter berdasarkan: Nama, NIM, Nama Kelompok, atau Nama Kabim
    const filteredData = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return data;

        return data.filter(item =>
            (item.nama && item.nama.toLowerCase().includes(query)) ||
            (item.nim && item.nim.toLowerCase().includes(query)) ||
            (item.nama_kelompok && item.nama_kelompok.toLowerCase().includes(query)) ||
            (item.nama_kabim && item.nama_kabim.toLowerCase().includes(query)) ||
            (item.prodi && item.prodi.toLowerCase().includes(query))
        );
    }, [data, searchQuery]);

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE) || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedData = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    // Reset pagination saat query pencarian berubah
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedSite]);

    return (
        <div className="space-y-6">
            <DashboardHeaderFilters
                title={`Data Medis & Riwayat Penyakit Peserta (${selectedSite.toUpperCase()})`}
                subtitle={`Pantau kondisi kesehatan, alergi, dan riwayat penyakit darurat peserta ${selectedSite.toUpperCase()} 2026`}
                icon={Heart}
                showSiteFilter={isSuperAdmin}
                selectedSite={selectedSite}
                onSiteChange={handleSiteChange}
                onRefresh={() => fetchData(selectedSite)}
                loading={loading}
                lastSyncedAt={lastSyncedAt}
            />

            {/* Panel Aksi: Search & Download Buttons */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder={`Cari nama, nim, kelompok peserta ${selectedSite.toUpperCase()}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="flex flex-wrap w-full md:w-auto gap-2 items-center">
                    {/* Super Admin Site Selector Toggle */}
                    {isSuperAdmin && (
                        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700">
                            <button
                                onClick={() => handleSiteChange('pkkmb')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    selectedSite === 'pkkmb'
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                }`}
                            >
                                PKKMB
                            </button>
                            <button
                                onClick={() => handleSiteChange('pose')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    selectedSite === 'pose'
                                        ? 'bg-amber-600 text-white shadow-xs'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                }`}
                            >
                                POSE
                            </button>
                        </div>
                    )}

                    <TombolCetak
                        label="Cetak / Export"
                        pdfTitle={`LAPORAN DATA MEDIS PESERTA ${selectedSite.toUpperCase()} 2026`}
                        pdfSite={selectedSite}
                        pdfData={filteredData}
                        pdfDocumentType="medis"
                        excelData={filteredData.map(item => ({
                            'Nama Lengkap': item.nama || '-',
                            'NIM': item.nim || '-',
                            'Prodi': item.prodi || '-',
                            'Email/WA': item.email_wa || '-',
                            'Kelompok / Kampus': item.nama_kelompok || '-',
                            'Kabim': item.nama_kabim || '-',
                            'Status Verifikasi': item.status_pembayaran || '-',
                            'Riwayat Penyakit': item.riwayat_penyakit || '-',
                            'Penanganan Medis': item.penanganan || '-',
                            'Alergi': item.alergi || '-',
                            'Nama Orang Tua/Wali': item.nama_ortu_wali || '-',
                            'WA Orang Tua/Wali': item.no_wa_ortu_wali || '-',
                            'Tanggal Input': item.created_at
                        }))}
                        excelColumns={[
                            { key: 'Nama Lengkap', label: 'Nama Lengkap' },
                            { key: 'NIM', label: 'NIM' },
                            { key: 'Prodi', label: 'Prodi' },
                            { key: 'Email/WA', label: 'Email/WA' },
                            { key: 'Kelompok / Kampus', label: 'Kelompok / Kampus' },
                            { key: 'Kabim', label: 'Kabim' },
                            { key: 'Status Verifikasi', label: 'Status Verifikasi' },
                            { key: 'Riwayat Penyakit', label: 'Riwayat Penyakit' },
                            { key: 'Penanganan Medis', label: 'Penanganan Medis' },
                            { key: 'Alergi', label: 'Alergi' },
                            { key: 'Nama Orang Tua/Wali', label: 'Nama Orang Tua/Wali' },
                            { key: 'WA Orang Tua/Wali', label: 'WA Orang Tua/Wali' },
                            { key: 'Tanggal Input', label: 'Tanggal Input', format: 'datetime' }
                        ]}
                        excelFilename={`laporan-medis-peserta-${selectedSite}_${new Date().toISOString().split('T')[0]}`}
                    />
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
                                <th className="p-4">Kelompok / Kampus</th>
                                <th className="p-4">Penyakit</th>
                                <th className="p-4">Penanganan</th>
                                <th className="p-4">Alergi</th>
                                <th className="p-4">Kontak Wali / Ortu</th>
                                <th className="p-4 text-center w-24">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={11} className="p-4"><div className="h-8 bg-gray-100 dark:bg-slate-800 rounded-lg w-full"></div></td>
                                    </tr>
                                ))
                            ) : paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className="p-8 text-center text-gray-500">Tidak ditemukan data medis peserta {selectedSite.toUpperCase()}.</td>
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
                                            {item.nama_kabim && item.nama_kabim !== '-' && (
                                                <div className="text-[10px] text-gray-400">PJ: {item.nama_kabim}</div>
                                            )}
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
                                        <td className="p-4 text-center">
                                            <button
                                                type="button"
                                                onClick={() => setDetailMemberModal(item)}
                                                className="px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-xs hover:scale-105 active:scale-95 cursor-pointer border border-blue-200/50 dark:border-blue-800/50"
                                                title="Lihat Detail Lengkap Anggota"
                                            >
                                                <Eye size={14} />
                                                <span>Lihat</span>
                                            </button>
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

            {/* Modal Detail Lengkap Anggota & Data Medis */}
            {detailMemberModal && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">

                        {/* Header Modal */}
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-blue-50/50 via-white to-indigo-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/20 flex items-center justify-between">
                            <div className="flex items-center gap-3.5">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-base flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                                    {getInitials(detailMemberModal.nama)}
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white leading-tight">
                                        {detailMemberModal.nama}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                        <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-lg border border-blue-200/50 dark:border-blue-900/40">
                                            NIM: {detailMemberModal.nim}
                                        </span>
                                        {detailMemberModal.nama_kelompok && detailMemberModal.nama_kelompok !== '-' && (
                                            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg">
                                                {detailMemberModal.nama_kelompok} {detailMemberModal.nama_kabim && detailMemberModal.nama_kabim !== '-' ? `(PJ: ${detailMemberModal.nama_kabim})` : ''}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setDetailMemberModal(null)}
                                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                                title="Tutup Modal"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body Modal */}
                        <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(92vh-140px)]">

                            {/* Section 1: Informasi Akademik & Kontak */}
                            <div className="bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl p-4.5">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                                    <GraduationCap size={15} className="text-blue-500" /> Data Akademik & Kontak Mahasiswa
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs sm:text-sm">
                                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <span className="text-[11px] text-slate-400 block font-medium mb-0.5">Program Studi</span>
                                        <span className="font-bold text-slate-800 dark:text-slate-100">{detailMemberModal.prodi || '-'}</span>
                                    </div>
                                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <span className="text-[11px] text-slate-400 block font-medium mb-0.5">Kampus / Angkatan</span>
                                        <span className="font-bold text-slate-800 dark:text-slate-100">
                                            {detailMemberModal.kampus || '-'} • Angkatan {detailMemberModal.angkatan || '-'}
                                        </span>
                                    </div>
                                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 sm:col-span-2 flex items-center justify-between">
                                        <div>
                                            <span className="text-[11px] text-slate-400 block font-medium mb-0.5">No. WhatsApp Peserta</span>
                                            <span className="font-bold font-mono text-slate-800 dark:text-slate-100">{detailMemberModal.email_wa || '-'}</span>
                                        </div>
                                        {detailMemberModal.email_wa && detailMemberModal.email_wa !== '-' && (
                                            <a
                                                href={`https://wa.me/${detailMemberModal.email_wa.replace(/\D/g, '').replace(/^0/, '62')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 font-bold text-xs border border-emerald-200/60 dark:border-emerald-800/60 transition-all cursor-pointer"
                                            >
                                                <Phone size={13} /> Chat WA
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Data Medis & Kesehatan */}
                            <div className="bg-red-50/20 dark:bg-red-950/10 border border-red-100/70 dark:border-red-900/30 rounded-2xl p-4.5">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-500 mb-3 flex items-center gap-2">
                                    <Activity size={15} className="text-rose-500" /> Informasi Medis & Kesehatan
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs sm:text-sm">
                                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <span className="text-[11px] text-slate-400 block font-medium mb-1">Riwayat Penyakit</span>
                                        {detailMemberModal.riwayat_penyakit && detailMemberModal.riwayat_penyakit !== '-' ? (
                                            <span className="inline-block px-2.5 py-1 rounded-lg bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 font-bold text-xs border border-red-200 dark:border-red-900/50">
                                                {detailMemberModal.riwayat_penyakit}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 font-medium italic">Tidak ada catatan penyakit</span>
                                        )}
                                    </div>
                                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <span className="text-[11px] text-slate-400 block font-medium mb-1">Alergi</span>
                                        {detailMemberModal.alergi && detailMemberModal.alergi !== '-' ? (
                                            <span className="inline-block px-2.5 py-1 rounded-lg bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400 font-bold text-xs border border-orange-200 dark:border-orange-900/50">
                                                {detailMemberModal.alergi}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 font-medium italic">Tidak ada riwayat alergi</span>
                                        )}
                                    </div>
                                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 sm:col-span-2">
                                        <span className="text-[11px] text-slate-400 block font-medium mb-1">Penanganan Khusus</span>
                                        <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                                            {detailMemberModal.penanganan && detailMemberModal.penanganan !== '-' ? detailMemberModal.penanganan : '-'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Kontak Orang Tua / Wali */}
                            <div className="bg-amber-50/20 dark:bg-amber-950/10 border border-amber-100/70 dark:border-amber-900/30 rounded-2xl p-4.5">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-2">
                                    <UserCheck size={15} className="text-amber-500" /> Kontak Orang Tua / Wali
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs sm:text-sm">
                                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <span className="text-[11px] text-slate-400 block font-medium mb-0.5">Nama Orang Tua / Wali</span>
                                        <span className="font-bold text-slate-800 dark:text-slate-100">
                                            {detailMemberModal.nama_ortu_wali || '-'}
                                        </span>
                                    </div>
                                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                        <div>
                                            <span className="text-[11px] text-slate-400 block font-medium mb-0.5">No. WA Orang Tua / Wali</span>
                                            <span className="font-bold font-mono text-slate-800 dark:text-slate-100">
                                                {detailMemberModal.no_wa_ortu_wali || '-'}
                                            </span>
                                        </div>
                                        {detailMemberModal.no_wa_ortu_wali && detailMemberModal.no_wa_ortu_wali !== '-' && (
                                            <a
                                                href={`https://wa.me/${detailMemberModal.no_wa_ortu_wali.replace(/\D/g, '').replace(/^0/, '62')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 font-bold text-xs border border-emerald-200/60 dark:border-emerald-800/60 transition-all cursor-pointer"
                                            >
                                                <Phone size={13} /> Chat Ortu
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Footer Modal */}
                        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 flex items-center justify-end">
                            <button
                                type="button"
                                onClick={() => setDetailMemberModal(null)}
                                className="px-6 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer"
                            >
                                Tutup
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
