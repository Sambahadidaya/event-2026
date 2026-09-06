'use client';

import { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Pill, Package, Layers } from 'lucide-react';

export default function MasterObatModal({
    isOpen,
    onClose,
    onSave,
    editingData = null
}) {
    const [namaObat, setNamaObat] = useState('');
    const [stokObat, setStokObat] = useState('');
    const [sisaObat, setSisaObat] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (editingData) {
                setNamaObat(editingData.nama_obat || '');
                setStokObat(editingData.stok_obat ?? '');
                setSisaObat(editingData.sisa_obat ?? '');
            } else {
                setNamaObat('');
                setStokObat('');
                setSisaObat('');
            }
            setError('');
        }
    }, [isOpen, editingData]);

    if (!isOpen) return null;

    const handleStokChange = (val) => {
        setStokObat(val);
        // Jika mode tambah baru, sisa obat otomatis mengikuti stok obat awal
        if (!editingData) {
            setSisaObat(val);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const nama = namaObat.trim();
        const stok = parseInt(stokObat, 10);
        const sisa = parseInt(sisaObat, 10);

        if (!nama) {
            setError('Nama obat wajib diisi.');
            return;
        }

        if (isNaN(stok) || stok < 0) {
            setError('Stok obat harus berupa angka valid (minimal 0).');
            return;
        }

        if (isNaN(sisa) || sisa < 0) {
            setError('Sisa obat harus berupa angka valid (minimal 0).');
            return;
        }

        if (sisa > stok) {
            setError('Sisa obat tidak boleh lebih besar dari stok obat.');
            return;
        }

        setLoading(true);
        try {
            await onSave({
                nama_obat: nama,
                stok_obat: stok,
                sisa_obat: sisa
            });
            onClose();
        } catch (err) {
            console.error('Error saving master obat:', err);
            setError(err.message || 'Gagal menyimpan data obat.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl">
                            <Pill size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-white text-base">
                                {editingData ? 'Edit Master Obat' : 'Tambah Obat Baru'}
                            </h3>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                                Kelola persediaan dan stok obat tim medis
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="flex items-center gap-2 p-3 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900/50">
                            <AlertCircle size={16} className="shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Nama Obat */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Nama Obat <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Contoh: Paracetamol 500mg, Promag, Betadine..."
                            value={namaObat}
                            onChange={(e) => setNamaObat(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-800 dark:text-slate-100 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                    </div>

                    {/* Grid Stok & Sisa */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <Package size={14} className="text-slate-400" />
                                <span>Jumlah Stok <span className="text-rose-500">*</span></span>
                            </label>
                            <input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={stokObat}
                                onChange={(e) => handleStokChange(e.target.value)}
                                required
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-800 dark:text-slate-100 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <Layers size={14} className="text-slate-400" />
                                <span>Sisa Obat <span className="text-rose-500">*</span></span>
                            </label>
                            <input
                                type="number"
                                min="0"
                                placeholder="0"
                                value={sisaObat}
                                onChange={(e) => setSisaObat(e.target.value)}
                                required
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-800 dark:text-slate-100 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                        </div>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                        💡 <strong>Catatan:</strong> Sisa obat akan berkurang secara otomatis ketika terdapat penanganan atau log pemakaian obat yang dicatat.
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
                        >
                            <Save size={16} />
                            <span>{loading ? 'Menyimpan...' : (editingData ? 'Simpan Perubahan' : 'Tambah Obat')}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
