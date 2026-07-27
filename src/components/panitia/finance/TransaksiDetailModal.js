'use client';

import { useState } from 'react';
import { X, Eye, Receipt, ArrowUpRight, ArrowDownRight, BookOpen } from 'lucide-react';
import { formatDateTime } from '@/lib/dashboardUtils';
import BuktiPreviewModal from './BuktiPreviewModal';
import InvoicePrintButton from './InvoicePrintButton';

export default function TransaksiDetailModal({ isOpen, onClose, transaction, journalEntries = [] }) {
    const [buktiModalOpen, setBuktiModalOpen] = useState(false);

    if (!isOpen || !transaction) return null;

    const isIncome = transaction.kategori?.type_transaksi === 'income' || transaction.nominal > 0 && !transaction.kode_payer?.startsWith('EXP');

    // Filter journal entries for this transaction
    const relatedJournals = journalEntries.filter(j => j.transaction_id === transaction.id);

    return (
        <>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden border border-gray-100 dark:border-gray-800 max-h-[90vh]">
                    {/* Header Modal */}
                    <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                        <div className="flex items-center gap-2">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isIncome ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30'}`}>
                                {isIncome ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                            </div>
                            <div>
                                <h3 className="font-extrabold text-base sm:text-lg text-gray-900 dark:text-white">
                                    Detail Transaksi {transaction.kode_id}
                                </h3>
                                <p className="text-xs text-gray-500">Site: <span className="uppercase font-bold">{transaction.site}</span></p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Body Content */}
                    <div className="p-4 sm:p-6 space-y-5 overflow-y-auto max-h-[70vh]">
                        {/* Summary Info Card */}
                        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-medium text-gray-500">Nominal Transaksi</span>
                                <span className={`text-xl font-extrabold ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                    Rp {Number(transaction.nominal || 0).toLocaleString('id-ID')}
                                </span>
                            </div>
                            <hr className="border-gray-200 dark:border-gray-700/60" />
                            <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                                <div>
                                    <span className="text-gray-500 block font-medium">Pembayar / Penerima:</span>
                                    <span className="font-bold text-gray-900 dark:text-white">{transaction.nama_payer || '-'}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block font-medium">Kode Payer / ID:</span>
                                    <span className="font-mono text-gray-800 dark:text-gray-200">{transaction.kode_payer || '-'}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block font-medium">Metode Pembayaran:</span>
                                    <span className="font-semibold text-gray-800 dark:text-gray-200">{transaction.metode_pembayaran || '-'}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block font-medium">Kategori Payer:</span>
                                    <span className="font-semibold text-gray-800 dark:text-gray-200">{transaction.kategori_payer || '-'}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block font-medium">Tanggal Transaksi:</span>
                                    <span className="text-gray-800 dark:text-gray-200">{transaction.tanggal_transaksi || '-'}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block font-medium">Dibuat Pada:</span>
                                    <span className="text-gray-800 dark:text-gray-200">{formatDateTime(transaction.created_at)}</span>
                                </div>
                            </div>
                            {transaction.keterangan && (
                                <div className="pt-2">
                                    <span className="text-xs text-gray-500 block font-medium">Keterangan:</span>
                                    <p className="text-xs text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 mt-1">
                                        {transaction.keterangan}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Bukti Bayar Preview */}
                        {transaction.bukti_pembayaran && (
                            <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Bukti Pembayaran</h4>
                                <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                    <span className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-xs">{transaction.bukti_pembayaran}</span>
                                    <button
                                        type="button"
                                        onClick={() => setBuktiModalOpen(true)}
                                        className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
                                    >
                                        <Eye size={14} /> Lihat Bukti
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Associated Journal Entries */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <BookOpen size={14} /> Jurnal Entry Terkait (Double Entry)
                            </h4>
                            {relatedJournals.length === 0 ? (
                                <p className="text-xs text-gray-400 italic bg-gray-50 dark:bg-gray-800/30 p-3 rounded-xl">Belum ada jurnal entry untuk transaksi ini.</p>
                            ) : (
                                <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                                            <tr>
                                                <th className="px-3 py-2 font-semibold">Kode Jurnal</th>
                                                <th className="px-3 py-2 font-semibold">Akun</th>
                                                <th className="px-3 py-2 font-semibold text-right">Debit</th>
                                                <th className="px-3 py-2 font-semibold text-right">Kredit</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {relatedJournals.map(j => (
                                                <tr key={j.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                    <td className="px-3 py-2 font-mono text-gray-500">{j.kode_id}</td>
                                                    <td className="px-3 py-2">
                                                        <span className="font-semibold text-gray-900 dark:text-white">{j.account?.nama_akun || 'Akun'}</span>
                                                        <span className="text-[10px] text-gray-400 block font-mono">({j.account?.kode_akun || '-'})</span>
                                                    </td>
                                                    <td className="px-3 py-2 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                                                        {j.debit > 0 ? `Rp ${Number(j.debit).toLocaleString('id-ID')}` : '-'}
                                                    </td>
                                                    <td className="px-3 py-2 text-right font-semibold text-rose-600 dark:text-rose-400">
                                                        {j.credit > 0 ? `Rp ${Number(j.credit).toLocaleString('id-ID')}` : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Modal */}
                    <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                        <InvoicePrintButton transaction={transaction} site={transaction.site} />
                        <button
                            onClick={onClose}
                            className="px-5 py-2 rounded-xl text-xs font-bold bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            </div>

            <BuktiPreviewModal
                isOpen={buktiModalOpen}
                onClose={() => setBuktiModalOpen(false)}
                url={transaction.bukti_pembayaran}
                title={`Bukti Pembayaran - ${transaction.kode_id}`}
            />
        </>
    );
}
