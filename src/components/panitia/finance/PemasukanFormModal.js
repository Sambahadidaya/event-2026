'use client';

import { useState, useEffect } from 'react';
import { X, Upload, Check, AlertCircle, TrendingUp } from 'lucide-react';
import { createFormTransaksiPemasukan } from '@/api/supabase/admin/finance';
import { uploadFile } from '@/api/supabase/storage';

export default function PemasukanFormModal({ isOpen, onClose, onSuccess, siteType = 'all', accounts = [], categories = [] }) {
    const [judul, setJudul] = useState('');
    const [keterangan, setKeterangan] = useState('');
    const [nominal, setNominal] = useState('');
    const [metodePembayaran, setMetodePembayaran] = useState('');
    const [penanggungJawab, setPenanggungJawab] = useState('');
    const [site, setSite] = useState(siteType === 'all' ? 'pose' : siteType);
    const [akunPembayaranId, setAkunPembayaranId] = useState('');
    const [akunPendapatanId, setAkunPendapatanId] = useState('');
    const [kategoriId, setKategoriId] = useState('');

    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const assetAccounts = accounts.filter(a => a.akun_type === 'Asset');
    const revenueAccounts = accounts.filter(a => a.akun_type === 'Revenue');
    const incomeCategories = categories.filter(c => c.type_transaksi === 'income');

    // Pre-select defaults
    useEffect(() => {
        if (assetAccounts.length > 0 && !akunPembayaranId) {
            setAkunPembayaranId(assetAccounts[0].id);
            setMetodePembayaran(assetAccounts[0].nama_akun);
        }
        if (revenueAccounts.length > 0 && !akunPendapatanId) {
            setAkunPendapatanId(revenueAccounts[0].id);
        }
        if (incomeCategories.length > 0 && !kategoriId) {
            setKategoriId(incomeCategories[0].id);
        }
    }, [accounts, categories]);

    if (!isOpen) return null;

    const handleAssetAccountChange = (accId) => {
        setAkunPembayaranId(accId);
        const acc = assetAccounts.find(a => a.id === accId);
        if (acc) setMetodePembayaran(acc.nama_akun);
    };

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

            if (selectedFile) {
                const formData = new FormData();
                formData.append('file', selectedFile);
                const uploadRes = await uploadFile(formData, 'bukti-bayar', 'pemasukan/');

                if (!uploadRes.success) {
                    setErrorMsg(uploadRes.error || 'Gagal mengupload bukti pembayaran');
                    setLoading(false);
                    return;
                }
                buktiUrl = uploadRes.url;
            }

            const res = await createFormTransaksiPemasukan({
                judul: judul.trim(),
                keterangan: keterangan.trim(),
                nominal: Number(nominal),
                metode_pembayaran: metodePembayaran || 'Tunai',
                bukti_pembayaran: buktiUrl,
                penanggung_jawab: penanggungJawab.trim() || 'Pemasukan Panitia',
                site: siteType === 'all' ? site : siteType,
                akun_pembayaran_id: akunPembayaranId || null,
                akun_pendapatan_id: akunPendapatanId || null,
                kategori_transaksi_id: kategoriId || null
            });

            if (res.success) {
                setJudul('');
                setKeterangan('');
                setNominal('');
                setSelectedFile(null);
                onSuccess?.();
                onClose();
            } else {
                setErrorMsg(res.error || 'Gagal menyimpan transaksi pemasukan.');
            }
        } catch (err) {
            setErrorMsg('Terjadi kesalahan internal.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden border border-gray-100 dark:border-gray-800">
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                        <TrendingUp size={20} />
                        <h3 className="font-extrabold text-base sm:text-lg text-gray-900 dark:text-white">
                            Form Transaksi Pemasukan (Income)
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
                            Judul / Deskripsi Pemasukan <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Contoh: Dana Sponsor A, Penjualan Merchandise, Iuran Tambahan"
                            value={judul}
                            onChange={(e) => setJudul(e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/30"
                        />
                    </div>

                    {/* Nominal & Metode Pembayaran (Dinamis dari Akun Asset) */}
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
                                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/30 font-semibold"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Akun Penerima / Metode Bayar
                            </label>
                            <select
                                value={akunPembayaranId}
                                onChange={(e) => handleAssetAccountChange(e.target.value)}
                                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/30 font-medium"
                            >
                                <option value="">-- Pilih Akun Asset --</option>
                                {assetAccounts.map(a => (
                                    <option key={a.id} value={a.id}>{a.kode_akun} - {a.nama_akun}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Pembayar / Sponsor & Site */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                Sumber / Pembayar / Sponsor
                            </label>
                            <input
                                type="text"
                                placeholder="Nama Sponsor / Donatur / Peserta"
                                value={penanggungJawab}
                                onChange={(e) => setPenanggungJawab(e.target.value)}
                                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/30"
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
                                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/30"
                                >
                                    <option value="pose">POSE</option>
                                    <option value="pkkmb">PKKMB</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Akun Pendapatan */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Akun Pendapatan (Revenue)
                        </label>
                        <select
                            value={akunPendapatanId}
                            onChange={(e) => setAkunPendapatanId(e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        >
                            <option value="">-- Pilih Akun Pendapatan --</option>
                            {revenueAccounts.map(a => (
                                <option key={a.id} value={a.id}>{a.kode_akun} - {a.nama_akun}</option>
                            ))}
                        </select>
                    </div>

                    {/* Keterangan Detail */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Keterangan Tambahan
                        </label>
                        <textarea
                            rows={2}
                            placeholder="Detail keterangan penerimaan dana..."
                            value={keterangan}
                            onChange={(e) => setKeterangan(e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/30"
                        />
                    </div>

                    {/* Upload Bukti Pembayaran */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Bukti Transfer / Dokumen Penerimaan (Opsional)
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
                                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{selectedFile.name}</span>
                                ) : (
                                    <span>Pilih file bukti (JPG, PNG, PDF max 10MB)</span>
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
                            className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                        >
                            <Check size={16} />
                            {loading ? 'Menyimpan...' : 'Simpan Pemasukan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
