'use client';

import { useState, useEffect } from 'react';
import { X, Check, AlertCircle, Tags } from 'lucide-react';
import { upsertMasterTransactionCategory } from '@/api/supabase/admin/finance';
import { JENIS_LOMBA, NAMA_LOMBA } from '@/lib/lombaData';

export default function MasterKategoriFormModal({ isOpen, onClose, onSuccess, initialData = null, siteType = 'all' }) {
    const [site, setSite] = useState(siteType === 'all' ? 'pose' : siteType);
    const [typeTransaksi, setTypeTransaksi] = useState('income');
    const [namaKategori, setNamaKategori] = useState('');
    const [namaSubKategori, setNamaSubKategori] = useState('');
    const [kategoriLomba, setKategoriLomba] = useState('');
    const [namaLomba, setNamaLomba] = useState('');

    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (initialData) {
            setSite(initialData.site || 'pose');
            setTypeTransaksi(initialData.type_transaksi || 'income');
            setNamaKategori(initialData.nama_kategori || '');
            setNamaSubKategori(initialData.nama_sub_kategori || '');
            setKategoriLomba(initialData.kategori_lomba || '');
            setNamaLomba(initialData.nama_lomba || '');
        } else {
            setSite(siteType === 'all' ? 'pose' : siteType);
            setTypeTransaksi('income');
            setNamaKategori('');
            setNamaSubKategori('');
            setKategoriLomba('');
            setNamaLomba('');
        }
    }, [initialData, isOpen, siteType]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        if (!namaKategori.trim()) {
            setErrorMsg('Nama Kategori wajib diisi.');
            return;
        }

        setLoading(true);

        const res = await upsertMasterTransactionCategory({
            site: siteType === 'all' ? site : siteType,
            type_transaksi: typeTransaksi,
            nama_kategori: namaKategori.trim(),
            nama_sub_kategori: namaSubKategori.trim() || null,
            kategori_lomba: site === 'pose' && kategoriLomba ? kategoriLomba : null,
            nama_lomba: site === 'pose' && namaLomba ? namaLomba : null
        }, initialData?.id || null);

        setLoading(false);

        if (res.success) {
            onSuccess?.();
            onClose();
        } else {
            setErrorMsg(res.error || 'Gagal menyimpan kategori transaksi.');
        }
    };

    const availableLomba = kategoriLomba && NAMA_LOMBA[kategoriLomba] ? NAMA_LOMBA[kategoriLomba] : [];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden border border-gray-100 dark:border-gray-800">
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                        <Tags size={20} />
                        <h3 className="font-extrabold text-base sm:text-lg text-gray-900 dark:text-white">
                            {initialData ? 'Edit Kategori Transaksi' : 'Tambah Kategori Transaksi'}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body Form */}
                <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                    {errorMsg && (
                        <div className="p-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                            <AlertCircle size={16} className="shrink-0" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {/* Event / Site & Type Transaksi */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {siteType === 'all' && (
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    Site / Event <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={site}
                                    onChange={(e) => setSite(e.target.value)}
                                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-medium"
                                >
                                    <option value="pose">POSE</option>
                                    <option value="pkkmb">PKKMB</option>
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Jenis Transaksi <span className="text-rose-500">*</span>
                            </label>
                            <select
                                value={typeTransaksi}
                                onChange={(e) => setTypeTransaksi(e.target.value)}
                                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-bold"
                            >
                                <option value="income">Income (Pemasukan)</option>
                                <option value="expense">Expense (Pengeluaran)</option>
                            </select>
                        </div>
                    </div>

                    {/* Nama Kategori */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Nama Kategori <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Contoh: Iuran, Sponsorship, Konsumsi, Hadiah"
                            value={namaKategori}
                            onChange={(e) => setNamaKategori(e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/30"
                        />
                    </div>

                    {/* Nama Sub Kategori */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Nama Sub Kategori (Opsional)
                        </label>
                        <input
                            type="text"
                            placeholder="Contoh: Wajib, Lomba, Panitia, Vendor"
                            value={namaSubKategori}
                            onChange={(e) => setNamaSubKategori(e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/30"
                        />
                    </div>

                    {/* Fields Khusus Lomba jika Site = POSE */}
                    {site === 'pose' && (
                        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl space-y-3 border border-gray-100 dark:border-gray-800">
                            <p className="text-xs font-bold text-gray-500">Mapping Detail Lomba POSE (Opsional)</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                                        Kategori Lomba
                                    </label>
                                    <select
                                        value={kategoriLomba}
                                        onChange={(e) => {
                                            setKategoriLomba(e.target.value);
                                            setNamaLomba('');
                                        }}
                                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                    >
                                        <option value="">-- Pilih Kategori --</option>
                                        {Object.values(JENIS_LOMBA).map(j => (
                                            <option key={j} value={j}>{j}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                                        Nama Lomba
                                    </label>
                                    <select
                                        value={namaLomba}
                                        onChange={(e) => setNamaLomba(e.target.value)}
                                        disabled={!kategoriLomba}
                                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white disabled:opacity-50"
                                    >
                                        <option value="">-- Pilih Nama Lomba --</option>
                                        {availableLomba.map(n => (
                                            <option key={n} value={n}>{n}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="pt-2 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                        >
                            <Check size={16} />
                            {loading ? 'Menyimpan...' : 'Simpan Kategori'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
