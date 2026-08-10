'use client';

import { useState, Fragment } from 'react';
import { Trash2, Tag } from 'lucide-react';
import { getSalesRiwayatDetail } from '@/api/supabase/admin/sales';

export default function SalesRiwayatTable({ data = [], onDelete, namaLombaFilter = 'all', searchQuery = '' }) {
    const [expandedRow, setExpandedRow] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [details, setDetails] = useState([]);
    const [expandedKey, setExpandedKey] = useState(null);

    const handleRowClick = async (row) => {
        if (expandedKey === row.raw_key) {
            setExpandedKey(null);
            setDetails([]);
            return;
        }

        setExpandedKey(row.raw_key);
        setDetailLoading(true);
        try {
            const res = await getSalesRiwayatDetail(row.nama_nim, row.sumber);
            setDetails(res || []);
        } catch (error) {
            console.error("Failed to fetch sales details:", error);
        } finally {
            setDetailLoading(false);
        }
    };

    // Client-side search filtering
    const filteredData = data.filter(item => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        const namaNim = (item.nama_nim || '').toLowerCase();
        const sumber = (item.sumber || '').toLowerCase();
        return namaNim.includes(query) || sumber.includes(query);
    });

    return (
        <div className="space-y-4">
            <div className="overflow-x-auto bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase">
                            <th className="px-6 py-4 w-16">No</th>
                            <th className="px-6 py-4">Sumber</th>
                            <th className="px-6 py-4">Nama / NIM</th>
                            <th className="px-6 py-4 text-right">Total Nominal Komisi</th>
                            <th className="px-6 py-4 text-center w-24">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm text-gray-700 dark:text-gray-300">
                        {filteredData.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-10 text-center text-gray-400 dark:text-gray-500">
                                    Tidak ada data sales.
                                </td>
                            </tr>
                        ) : (
                            filteredData.map((row, idx) => {
                                const isExpanded = expandedKey === row.raw_key;
                                return (
                                    <Fragment key={row.raw_key}>
                                        <tr
                                            className={`hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer ${isExpanded ? 'bg-blue-50/20 dark:bg-blue-900/10' : ''}`}
                                            onClick={() => handleRowClick(row)}
                                        >
                                            <td className="px-6 py-4 font-medium">{idx + 1}</td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                                                    <Tag size={12} className="text-gray-400" />
                                                    {row.sumber}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                                                {row.nama_nim || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-blue-600 dark:text-blue-400">
                                                Rp {(row.total_nominal || 0).toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={() => onDelete(row)}
                                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all"
                                                    title="Hapus semua data sales untuk identitas ini"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>

                                        {isExpanded && (
                                            <tr className="bg-gray-50/30 dark:bg-gray-900/50">
                                                <td colSpan="5" className="px-6 py-4 border-t border-gray-100 dark:border-gray-800">
                                                    <div className="space-y-3">
                                                        <h4 className="font-bold text-gray-900 dark:text-white text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400">
                                                            Detail Riwayat Referral: {row.nama_nim || row.sumber}
                                                        </h4>
                                                        
                                                        {detailLoading ? (
                                                            <div className="py-4 text-center text-xs text-gray-500">
                                                                Memuat detail riwayat...
                                                            </div>
                                                        ) : (
                                                            <div className="overflow-x-auto border border-gray-100 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900">
                                                                <table className="w-full text-left border-collapse text-xs">
                                                                    <thead>
                                                                        <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 font-semibold">
                                                                            <th className="px-4 py-2.5">No</th>
                                                                            <th className="px-4 py-2.5">Sumber</th>
                                                                            <th className="px-4 py-2.5">Nama / NIM</th>
                                                                            <th className="px-4 py-2.5">NIM Target Sales</th>
                                                                            <th className="px-4 py-2.5">Nominal</th>
                                                                            <th className="px-4 py-2.5">% Komisi</th>
                                                                            <th className="px-4 py-2.5">Nama Lomba</th>
                                                                            <th className="px-4 py-2.5">Tanggal Transaksi</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-600 dark:text-gray-400">
                                                                        {details.map((det, dIdx) => (
                                                                            <tr key={det.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                                                                                <td className="px-4 py-2 font-medium">{dIdx + 1}</td>
                                                                                <td className="px-4 py-2">{det.sumber}</td>
                                                                                <td className="px-4 py-2">{det.nama_nim || '-'}</td>
                                                                                <td className="px-4 py-2 font-semibold text-gray-800 dark:text-gray-200">{det.target_nim || '-'}</td>
                                                                                <td className="px-4 py-2 text-right">Rp {det.nominal.toLocaleString('id-ID')}</td>
                                                                                <td className="px-4 py-2">{det.persen_komisi}%</td>
                                                                                <td className="px-4 py-2">{det.nama_lomba}</td>
                                                                                <td className="px-4 py-2">{det.tanggal_transaksi}</td>
                                                                            </tr>
                                                                        ))}
                                                                        <tr className="bg-gray-50/50 dark:bg-gray-800/50 font-bold text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-700">
                                                                            <td colSpan="4" className="px-4 py-3 text-right">Total Nominal:</td>
                                                                            <td className="px-4 py-3 text-right text-blue-600 dark:text-blue-400">
                                                                                Rp {details.reduce((sum, item) => sum + item.nominal, 0).toLocaleString('id-ID')}
                                                                            </td>
                                                                            <td colSpan="3" className="px-4 py-3"></td>
                                                                        </tr>
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
