'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import {
    Users, Search, ChevronRight, CheckCircle2, Clock, XCircle,
    BarChart2, X, CreditCard, AlertTriangle, RefreshCw
} from 'lucide-react';
import { getDataPesertaRekapPkkmb } from '@/api/supabase/admin/pembayaran_pkkmb';
import TombolCetak from '@/components/panitia/TombolCetak';

const ITEMS_PER_PAGE = 15;

function StatusBadge({ status }) {
    const s = (status || 'pending').toLowerCase();
    if (s === 'lunas') return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 size={11} /> Lunas
        </span>
    );
    if (s === 'ditolak') return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300">
            <XCircle size={11} /> Ditolak
        </span>
    );
    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
            <Clock size={11} /> Pending
        </span>
    );
}

function TahapanBadge({ tahapan }) {
    const colors = {
        'full': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
        'tahap 1': 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300',
        'tahap 2': 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
    };
    const cls = colors[tahapan] || 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
    return (
        <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-semibold capitalize ${cls}`}>
            {tahapan || '-'}
        </span>
    );
}

export default function DataPesertaPkkmbPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('semua');
    const [kelasFilter, setKelasFilter] = useState('semua');
    const [currentPage, setCurrentPage] = useState(1);

    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedPeserta, setSelectedPeserta] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const res = await getDataPesertaRekapPkkmb();
        setData(res || []);
        setLoading(false);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const stats = useMemo(() => {
        const totalLunas = data.filter(d => d.status_pembayaran?.toLowerCase() === 'lunas').length;
        const totalPending = data.filter(d => (d.status_pembayaran || 'pending').toLowerCase() === 'pending').length;
        const totalDitolak = data.filter(d => d.status_pembayaran?.toLowerCase() === 'ditolak').length;
        const totalTunggakan = data.reduce((s, d) => s + (d.sisa_tunggakan || 0), 0);
        const totalDibayar = data.reduce((s, d) => s + (d.total_dibayar || 0), 0);
        return { totalLunas, totalPending, totalDitolak, totalTunggakan, totalDibayar };
    }, [data]);

    const filtered = useMemo(() => {
        return data.filter(d => {
            if (statusFilter !== 'semua') {
                const s = (d.status_pembayaran || 'pending').toLowerCase();
                if (s !== statusFilter) return false;
            }
            if (kelasFilter !== 'semua' && d.kelas !== kelasFilter) return false;
            if (search.trim()) {
                const q = search.toLowerCase();
                return (
                    d.nama?.toLowerCase().includes(q) ||
                    d.nim?.toLowerCase().includes(q) ||
                    d.email_wa?.toLowerCase().includes(q) ||
                    d.kampus?.toLowerCase().includes(q)
                );
            }
            return true;
        });
    }, [data, search, statusFilter, kelasFilter]);

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
    const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    useEffect(() => { setCurrentPage(1); }, [search, statusFilter, kelasFilter]);

    const excelData = filtered.map((d, i) => ({
        No: i + 1,
        Nama: d.nama,
        NIM: d.nim,
        Kampus: d.kampus,
        Kelas: d.kelas,
        Email_WA: d.email_wa,
        Status: d.status_pembayaran || 'pending',
        Total_Tagihan: d.total_tagihan,
        Total_Dibayar: d.total_dibayar,
        Sisa_Tunggakan: d.sisa_tunggakan,
        Jumlah_Tahapan: d.tahapan_detail?.length || 0
    }));

    return (
        <div className="space-y-6">
            {/* Page Title */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                        <Users className="text-blue-500" size={24} />
                        Rekap Data Peserta PKKMB
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Overview pembayaran per peserta — tagihan, tunggakan, dan status pelunasan
                    </p>
                </div>
                <button
                    onClick={fetchData}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all disabled:opacity-50"
                >
                    <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Stats Cards (2 Rows, 3 Cards per Row, Menyatu) */}
            <div className="space-y-3">
                {/* Row 1: Total Peserta, Total Dibayar, Total Tunggakan */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 dark:divide-gray-800">
                    <div className="p-4 flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1 truncate">Total Peserta</p>
                            <h3 className="text-lg sm:text-xl font-extrabold text-blue-800 dark:text-blue-200">{data.length}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center shrink-0">
                            <Users size={20} />
                        </div>
                    </div>
                    <div className="p-4 flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-1 truncate">Total Dibayar</p>
                            <h3 className="text-lg sm:text-xl font-extrabold text-indigo-800 dark:text-indigo-200">Rp {stats.totalDibayar.toLocaleString('id-ID')}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 flex items-center justify-center shrink-0">
                            <CreditCard size={20} />
                        </div>
                    </div>
                    <div className="p-4 flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-rose-700 dark:text-rose-300 mb-1 truncate">Total Tunggakan</p>
                            <h3 className="text-lg sm:text-xl font-extrabold text-rose-800 dark:text-rose-200">Rp {stats.totalTunggakan.toLocaleString('id-ID')}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-500 flex items-center justify-center shrink-0">
                            <AlertTriangle size={20} />
                        </div>
                    </div>
                </div>

                {/* Row 2: Total Lunas, Total Ditolak, Total Pending */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 dark:divide-gray-800">
                    <div className="p-4 flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-1 truncate">Total Lunas</p>
                            <h3 className="text-lg sm:text-xl font-extrabold text-emerald-800 dark:text-emerald-200">{stats.totalLunas}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center shrink-0">
                            <CheckCircle2 size={20} />
                        </div>
                    </div>
                    <div className="p-4 flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-rose-700 dark:text-rose-300 mb-1 truncate">Total Ditolak</p>
                            <h3 className="text-lg sm:text-xl font-extrabold text-rose-800 dark:text-rose-200">{stats.totalDitolak}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-500 flex items-center justify-center shrink-0">
                            <XCircle size={20} />
                        </div>
                    </div>
                    <div className="p-4 flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1 truncate">Total Pending</p>
                            <h3 className="text-lg sm:text-xl font-extrabold text-amber-800 dark:text-amber-200">{stats.totalPending}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center shrink-0">
                            <Clock size={20} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 items-center">
                <div className="relative flex-1 w-full">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Cari nama, NIM, kampus, email..."
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                    <option value="semua">Semua Status</option>
                    <option value="lunas">Lunas</option>
                    <option value="pending">Pending</option>
                    <option value="ditolak">Ditolak</option>
                </select>
                <select
                    value={kelasFilter}
                    onChange={e => setKelasFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                    <option value="semua">Semua Kelas</option>
                    <option value="Reguler">Reguler</option>
                    <option value="NonReguler">Non Reguler</option>
                    <option value="KIP">KIP</option>
                </select>
                <TombolCetak
                    label="Export Excel"
                    disablePdf={true}
                    excelData={excelData}
                    excelFilename="Rekap_Peserta_PKKMB"
                    excelColumns={[
                        { key: 'No', label: 'No' },
                        { key: 'Nama', label: 'Nama' },
                        { key: 'NIM', label: 'NIM' },
                        { key: 'Kampus', label: 'Kampus' },
                        { key: 'Kelas', label: 'Kelas' },
                        { key: 'Email_WA', label: 'Email/WA' },
                        { key: 'Status', label: 'Status' },
                        { key: 'Total_Tagihan', label: 'Total Tagihan' },
                        { key: 'Total_Dibayar', label: 'Total Dibayar' },
                        { key: 'Sisa_Tunggakan', label: 'Sisa Tunggakan' },
                        { key: 'Jumlah_Tahapan', label: 'Jml. Tahapan' }
                    ]}
                />
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50/80 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                            <tr>
                                {['No', 'Nama / NIM', 'Kampus', 'Kelas', 'Status', 'Total Dibayar', 'Total Tagihan', 'Tunggakan', 'Detail'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {loading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <tr key={i}>
                                        {Array.from({ length: 9 }).map((_, j) => (
                                            <td key={j} className="px-4 py-3">
                                                <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-16 text-center text-gray-400 dark:text-gray-500 text-sm">
                                        Tidak ada data yang ditemukan.
                                    </td>
                                </tr>
                            ) : paginated.map((d, i) => {
                                const rowIdx = (currentPage - 1) * ITEMS_PER_PAGE + i + 1;
                                const isLunas = d.status_pembayaran?.toLowerCase() === 'lunas';
                                const hasTunggakan = d.sisa_tunggakan > 0;
                                return (
                                    <tr key={d.nim} className={`hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors ${hasTunggakan && !isLunas ? 'border-l-2 border-l-rose-400' : ''}`}>
                                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{rowIdx}</td>
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-gray-900 dark:text-white">{d.nama}</div>
                                            <div className="font-mono text-xs text-gray-400 dark:text-gray-500">{d.nim}</div>
                                            {d.email_wa && <div className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[140px]">{d.email_wa}</div>}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300 text-xs">{d.kampus || '-'}</td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-0.5 text-xs rounded-lg font-semibold bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                                                {d.kelas || '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3"><StatusBadge status={d.status_pembayaran} /></td>
                                        <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400 text-xs">
                                            Rp {(d.total_dibayar || 0).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300 text-xs">
                                            {d.total_tagihan ? `Rp ${d.total_tagihan.toLocaleString('id-ID')}` : '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {d.status_pembayaran?.toLowerCase() === 'ditolak' ? (
                                                <span className="text-xs font-bold text-rose-600 dark:text-rose-400">Ditolak</span>
                                            ) : d.sisa_tunggakan > 0 ? (
                                                <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                                                    Rp {d.sisa_tunggakan.toLocaleString('id-ID')}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-emerald-500 font-semibold">Lunas</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => { setSelectedPeserta(d); setDetailOpen(true); }}
                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                                            >
                                                Lihat <ChevronRight size={13} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Halaman {currentPage} dari {totalPages} ({filtered.length} peserta)
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-400 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                ← Prev
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-400 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {detailOpen && selectedPeserta && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
                            <div>
                                <h3 className="font-extrabold text-gray-900 dark:text-white">{selectedPeserta.nama}</h3>
                                <p className="text-xs font-mono text-gray-400 dark:text-gray-500">{selectedPeserta.nim} • {selectedPeserta.kelas}</p>
                            </div>
                            <button
                                onClick={() => { setDetailOpen(false); setSelectedPeserta(null); }}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-4 space-y-4 overflow-y-auto">
                            {/* Summary */}
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { label: 'Total Tagihan', value: `Rp ${(selectedPeserta.total_tagihan || 0).toLocaleString('id-ID')}`, color: 'blue' },
                                    { label: 'Sudah Dibayar', value: `Rp ${(selectedPeserta.total_dibayar || 0).toLocaleString('id-ID')}`, color: 'emerald' },
                                    { 
                                        label: 'Sisa Tunggakan', 
                                        value: selectedPeserta.status_pembayaran?.toLowerCase() === 'ditolak' 
                                            ? 'Ditolak' 
                                            : (selectedPeserta.sisa_tunggakan > 0 ? `Rp ${selectedPeserta.sisa_tunggakan.toLocaleString('id-ID')}` : 'Lunas'), 
                                        color: selectedPeserta.status_pembayaran?.toLowerCase() === 'ditolak' || selectedPeserta.sisa_tunggakan > 0 ? 'rose' : 'emerald' 
                                    }
                                ].map(s => (
                                    <div key={s.label} className={`p-3 rounded-xl bg-${s.color}-50 dark:bg-${s.color}-900/20 border border-${s.color}-100 dark:border-${s.color}-800/30`}>
                                        <p className={`text-[10px] font-semibold text-${s.color}-600 dark:text-${s.color}-400 mb-0.5`}>{s.label}</p>
                                        <p className={`text-xs font-extrabold text-${s.color}-800 dark:text-${s.color}-200 leading-tight`}>{s.value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Status Badge */}
                            <div className="flex items-center justify-between px-1">
                                <span className="text-xs text-gray-500 font-semibold">Status Keseluruhan:</span>
                                <StatusBadge status={selectedPeserta.status_pembayaran} />
                            </div>

                            {/* Tahapan Detail */}
                            <div>
                                <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                                    <BarChart2 size={13} /> Riwayat Pembayaran
                                </p>
                                <div className="space-y-2">
                                    {(selectedPeserta.tahapan_detail || []).length === 0 ? (
                                        <p className="text-xs text-gray-400 text-center py-4">Belum ada riwayat pembayaran.</p>
                                    ) : (
                                        selectedPeserta.tahapan_detail.map((t, idx) => (
                                            <div key={t.id || idx} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                                                <div className="flex items-center gap-2">
                                                    <TahapanBadge tahapan={t.tahapan} />
                                                    <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{t.jenis_bayar || '-'}</span>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-bold text-gray-900 dark:text-white">
                                                        Rp {(t.nominal || 0).toLocaleString('id-ID')}
                                                    </p>
                                                    <StatusBadge status={t.status_pembayaran} />
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex justify-end">
                            <button
                                onClick={() => { setDetailOpen(false); setSelectedPeserta(null); }}
                                className="px-5 py-2 rounded-xl text-xs font-bold bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
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
