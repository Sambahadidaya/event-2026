'use client';

import { useState, useEffect } from 'react';
import { X, Upload, Check, AlertCircle, PlusCircle } from 'lucide-react';
import { createFormTransaksiPengeluaran } from '@/api/supabase/admin/finance';
import { uploadFile } from '@/api/supabase/storage';

export default function PengeluaranFormModal({ isOpen, onClose, onSuccess, siteType = 'all', accounts = [], categories = [] }) {
    const [judul, setJudul] = useState('');
    const [keterangan, setKeterangan] = useState('');
    const [nominal, setNominal] = useState('');
    const [metodePembayaran, setMetodePembayaran] = useState('Tunai');
    const [penanggungJawab, setPenanggungJawab] = useState('');
    const [site, setSite] = useState(siteType === 'all' ? 'pose' : siteType);
    const [akunPembayaranId, setAkunPembayaranId] = useState('');
    const [akunBebanId, setAkunBebanId] = useState('');
    const [kategoriId, setKategoriId] = useState('');
    
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Pre-select accounts if available
    useEffect(() => {
        if (accounts.length > 0) {
            const assetAcc = accounts.find(a => a.akun_type === 'Asset');
            const expAcc = accounts.find(a => a.akun_type === 'Expense');
            if (assetAcc && !akunPembayaranId) setAkunPembayaranId(assetAcc.id);
            if (expAcc && !akunBebanId) setAkunBebanId(expAcc.id);
        }
    }, [accounts, akunPembayaranId, akunBebanId]);

    // Pre-select category if available
    useEffect(() => {
        if (categories.length > 0) {
            const expCat = categories.find(c => c.type_transaksi === 'expense');
            if (expCat && !kategoriId) setKategoriId(expCat.id);
        }
    }, [categories, kategoriId]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        if (!judul.trim() || !nominal || Number(nominal) <= 0) {
            setErrorMsg('Judul dan Nominal transaksi wajib diisi dengan benar.');
            return;
        }

        setLoading(true);

        try {
            let buktiUrl = null;

            // Handle file upload if file is selected
            if (selectedFile) {
                const formData = new FormData();
                formData.append('file', selectedFile);
                const uploadRes = await uploadFile(formData, 'bukti-bayar', 'pengeluaran/');

                if (!uploadRes.success) {
                    setErrorMsg(uploadRes.error || 'Gagal mengupload bukti pembayaran');
                    setLoading(false);
                    return;
                }
                buktiUrl = uploadRes.url;
            }

            const res = await createFormTransaksiPengeluaran({
                judul: judul.trim(),
                keterangan: keterangan.trim(),
                nominal: Number(nominal),
                metode_pembayaran: metodePembayaran,
                bukti_pembayaran: buktiUrl,
                penanggung_jawab: penanggungJawab.trim() || 'Panitia Keuangan',
                site: siteType === 'all' ? site : siteType,
                akun_pembayaran_id: akunPembayaranId || null,
                akun_beban_id: akunBebanId || null,
                kategori_transaksi_id: kategoriId || null
            });

            if (res.success) {
                // Reset Form
                setJudul('');
                setKeterangan('');
                setNominal('');
                setSelectedFile(null);
                onSuccess?.();
                onClose();
            } else {
                setErrorMsg(res.error || 'Gagal menyimpan transaksi pengeluaran.');
            }
        } catch (err) {
            setErrorMsg('Terjadi kesalahan internal.');
        } finally {
            setLoading(false);
        }
    };

    const assetAccounts = accounts.filter(a => a.akun_type === 'Asset');
    const expenseAccounts = accounts.filter(a => a.akun_type === 'Expense');
    const expenseCategories = categories.filter(c => c.type_transaksi === 'expense');

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden border border-gray-100 dark:border-gray-800">
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                        <PlusCircle size={20} />
                        <h3 className="font-extrabold text-base sm:text-lg text-gray-900 dark:text-white">
                            Form Transaksi Pengeluaran
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

                    {/* Judul */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Judul Pengeluaran <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Contoh: Konsumsi Panitia, Sewa Sound System"
                            value={judul}
                            onChange={(e) => setJudul(e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500/30"
                        />
                    </div>

                    {/* Nominal & Metode Pembayaran */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Nominal (Rp) <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="number"
                                required
                                min="0"
                                placeholder="100000"
                                value={nominal}
                                onChange={(e) => setNominal(e.target.value)}
                                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500/30 font-semibold"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Metode Pembayaran (Akun Asset)
                            </label>
                            <select
                                value={metodePembayaran}
                                onChange={(e) => setMetodePembayaran(e.target.value)}
                                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500/30"
                            >
                                <option value="Tunai">Tunai / Cash</option>
                                {assetAccounts.map(a => (
                                    <option key={a.id} value={a.nama_akun}>{a.kode_akun} - {a.nama_akun}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Penanggung Jawab & Site (if siteType == 'all') */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Penanggung Jawab
                            </label>
                            <input
                                type="text"
                                placeholder="Nama Panitia / Vendor"
                                value={penanggungJawab}
                                onChange={(e) => setPenanggungJawab(e.target.value)}
                                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500/30"
                            />
                        </div>

                        {siteType === 'all' && (
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                    Event / Site <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={site}
                                    onChange={(e) => setSite(e.target.value)}
                                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500/30"
                                >
                                    <option value="pose">POSE</option>
                                    <option value="pkkmb">PKKMB</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Akun Pembayaran & Akun Beban (Double-Entry Account Mapping) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                                Akun Sumber (Kas/Bank)
                            </label>
                            <select
                                value={akunPembayaranId}
                                onChange={(e) => setAkunPembayaranId(e.target.value)}
                                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            >
                                <option value="">-- Pilih Akun Sumber --</option>
                                {assetAccounts.map(a => (
                                    <option key={a.id} value={a.id}>{a.kode_akun} - {a.nama_akun}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                                Akun Beban / Pengeluaran
                            </label>
                            <select
                                value={akunBebanId}
                                onChange={(e) => setAkunBebanId(e.target.value)}
                                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            >
                                <option value="">-- Pilih Akun Beban --</option>
                                {expenseAccounts.map(a => (
                                    <option key={a.id} value={a.id}>{a.kode_akun} - {a.nama_akun}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Kategori Transaksi */}
                    {expenseCategories.length > 0 && (
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Kategori Transaksi Pengeluaran
                            </label>
                            <select
                                value={kategoriId}
                                onChange={(e) => setKategoriId(e.target.value)}
                                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            >
                                <option value="">-- Opsional --</option>
                                {expenseCategories.map(c => (
                                    <option key={c.id} value={c.id}>{c.nama_kategori} {c.nama_sub_kategori ? `(${c.nama_sub_kategori})` : ''}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Keterangan Detail */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Keterangan Tambahan
                        </label>
                        <textarea
                            rows={2}
                            placeholder="Detail keperluan pengeluaran..."
                            value={keterangan}
                            onChange={(e) => setKeterangan(e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500/30"
                        />
                    </div>

                    {/* Upload Bukti Pembayaran */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Bukti Pembayaran / Nota (Opsional)
                        </label>
                        <div className="relative border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-3 text-center hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                            <input
                                type="file"
                                accept="image/*,application/pdf"
                                onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="flex flex-col items-center justify-center gap-1 text-xs text-gray-500">
                                <Upload size={18} className="text-gray-400" />
                                {selectedFile ? (
                                    <span className="font-semibold text-rose-600 dark:text-rose-400">{selectedFile.name}</span>
                                ) : (
                                    <span>Pilih atau seret file nota/bukti bayar (JPG, PNG, PDF max 10MB)</span>
                                )}
                            </div>
                        </div>
                    </div>

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
                            className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                        >
                            <Check size={16} />
                            {loading ? 'Menyimpan...' : 'Simpan Pengeluaran'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
