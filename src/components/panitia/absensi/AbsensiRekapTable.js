'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Calendar, AlertCircle } from 'lucide-react';

export default function AbsensiRekapTable({ data = [], searchQuery = '' }) {
    const [expandedRow, setExpandedRow] = useState(null);

    const handleRowClick = (nama) => {
        if (expandedRow === nama) {
            setExpandedRow(null);
        } else {
            setExpandedRow(nama);
        }
    };

    const filteredData = data.filter(item =>
        (item.nama || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900/50 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60">
                            <th className="px-6 py-4.5 text-center w-14">No</th>
                            <th className="px-6 py-4.5">Nama Panitia</th>
                            <th className="px-6 py-4.5 text-center">Hadir</th>
                            <th className="px-6 py-4.5 text-center">Izin</th>
                            <th className="px-6 py-4.5 text-center">Sakit</th>
                            <th className="px-6 py-4.5 text-center">Alpha</th>
                            <th className="px-6 py-4.5 text-center w-16">Detail</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm">
                        {filteredData.length > 0 ? (
                            filteredData.map((item, index) => {
                                const isExpanded = expandedRow === item.nama;
                                return (
                                    <React.Fragment key={item.nama}>
                                        <tr
                                            onClick={() => handleRowClick(item.nama)}
                                            className={`hover:bg-slate-50/75 dark:hover:bg-slate-800/30 cursor-pointer transition-colors ${
                                                isExpanded ? 'bg-blue-50/20 dark:bg-blue-950/10' : ''
                                            }`}
                                        >
                                            <td className="px-6 py-4 text-center font-medium text-slate-400 dark:text-slate-500">{index + 1}</td>
                                            <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-100">{item.nama}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-950/25 rounded-lg min-w-8">
                                                    {item.hadir}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold text-blue-600 dark:text-blue-450 bg-blue-50 dark:bg-blue-950/25 rounded-lg min-w-8">
                                                    {item.izin}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold text-amber-600 dark:text-amber-450 bg-amber-50 dark:bg-amber-950/25 rounded-lg min-w-8">
                                                    {item.sakit}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold text-rose-600 dark:text-rose-450 bg-rose-50 dark:bg-rose-950/25 rounded-lg min-w-8">
                                                    {item.alpha}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex justify-center text-slate-400">
                                                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                </div>
                                            </td>
                                        </tr>

                                        {isExpanded && (
                                            <tr className="bg-slate-50/50 dark:bg-slate-900/40">
                                                <td colSpan={7} className="px-8 py-5 border-t border-slate-100 dark:border-slate-800">
                                                    <div className="space-y-3.5">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar size={15} className="text-blue-500" />
                                                            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Detail Sesi Absensi Panitia</span>
                                                        </div>
                                                        {item.detail && item.detail.length > 0 ? (
                                                            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-inner">
                                                                <table className="w-full text-left text-xs border-collapse">
                                                                    <thead>
                                                                        <tr className="bg-slate-100 dark:bg-slate-800/80 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700/80">
                                                                            <th className="px-4 py-3 text-center w-10">No</th>
                                                                            <th className="px-4 py-3">Sesi / Judul Absensi</th>
                                                                            <th className="px-4 py-3 text-center w-28">Status</th>
                                                                            <th className="px-4 py-3">Keterangan</th>
                                                                            <th className="px-4 py-3 text-center w-36">Tanggal Input</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-600 dark:text-slate-350">
                                                                        {item.detail.map((det, dIdx) => {
                                                                            let badgeClass = '';
                                                                            if (det.type_absen === 'Hadir') badgeClass = 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30';
                                                                            else if (det.type_absen === 'Izin') badgeClass = 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/30';
                                                                            else if (det.type_absen === 'Sakit') badgeClass = 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30';
                                                                            else if (det.type_absen === 'Alpha') badgeClass = 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/30';

                                                                            return (
                                                                                <tr key={det.id} className="hover:bg-slate-150/30 dark:hover:bg-slate-800/20">
                                                                                    <td className="px-4 py-2.5 text-center font-medium text-slate-400">{dIdx + 1}</td>
                                                                                    <td className="px-4 py-2.5 font-semibold text-slate-700 dark:text-slate-200">{det.judul_absen}</td>
                                                                                    <td className="px-4 py-2.5 text-center">
                                                                                        <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded ${badgeClass}`}>
                                                                                            {det.type_absen}
                                                                                        </span>
                                                                                    </td>
                                                                                    <td className="px-4 py-2.5 max-w-xs truncate" title={det.keterangan_absen}>
                                                                                        {det.keterangan_absen || '-'}
                                                                                    </td>
                                                                                    <td className="px-4 py-2.5 text-center text-[10px] text-slate-400">
                                                                                        {new Date(det.created_at).toLocaleString('id-ID', {
                                                                                            day: 'numeric',
                                                                                            month: 'short',
                                                                                            year: 'numeric',
                                                                                            hour: '2-digit',
                                                                                            minute: '2-digit'
                                                                                        })}
                                                                                    </td>
                                                                                </tr>
                                                                            );
                                                                        })}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 p-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/20 text-slate-450 dark:text-slate-500">
                                                                <AlertCircle size={15} />
                                                                <span className="text-xs">Belum ada riwayat absensi untuk panitia ini.</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-slate-450 dark:text-slate-500 bg-slate-50/20 dark:bg-slate-900/5">
                                    Tidak ada data panitia yang ditemukan.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
