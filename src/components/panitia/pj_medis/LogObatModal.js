'use client';

import { useState, useEffect } from 'react';
import { X, Save, AlertCircle, ClipboardList, Pill, ArrowRight } from 'lucide-react';

export default function LogObatModal({
    isOpen,
    onClose,
    onSave,
    masterObatList = [],
    editingData = null
}) {
    const [selectedObatId, setSelectedObatId] = useState('');
    const [pemakaianObat, setPemakaianObat] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (editingData) {
                setSelectedObatId(editingData.obat_id || editingData.master_obat?.id || '');
                setPemakaianObat(String(editingData.pemakaian_obat || ''));
            } else {
                setSelectedObatId(masterObatList.length > 0 ? String(masterObatList[0].id) : '');
                setPemakaianObat('1');
            }
            setError('');
        }
    }, [isOpen, editingData, masterObatList]);

    if (!isOpen) return null;

    const currentObat = masterObatList.find(o => String(o.id) === String(selectedObatId));
    const sisaSaatIni = currentObat ? (currentObat.sisa_obat !== null ? currentObat.sisa_obat : currentObat.stok_obat) : 0;
    
    // Jika sedang edit obat yang sama, stok lama ditambahkan kembali untuk cek batas kapasitas
    const pemakaianLama = editingData && String(editingData.obat_id) === String(selectedObatId) 
        ? (editingData.pemakaian_obat || 0) 
        : 0;
    const maxPemakaian = sisaSaatIni + pemakaianLama;

    const jumlahInput = parseInt(pemakaianObat, 10) || 0;
    const estimasiSisa = maxPemakaian - jumlahInput;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!selectedObatId) {
            setError('Pilih obat yang digunakan.');
            return;
        }

        const pemakaian = parseInt(pemakaianObat, 10);
        if (isNaN(pemakaian) || pemakaian <= 0) {
            setError('Jumlah pemakaian harus lebih dari 0.');
            return;
        }

        if (pemakaian > maxPemakaian) {
            setError(`Pemakaian (${pemakaian}) melebihi sisa obat yang tersedia (${maxPemakaian}).`);
            return;
        }

        setLoading(true);
        try {
            await onSave({
                obat_id: selectedObatId,
                pemakaian_obat: pemakaian
            });
            onClose();
        } catch (err) {
            console.error('Error saving log obat:', err);
            setError(err.message || 'Gagal menyimpan log pemakaian obat.');
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
                        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
                            <ClipboardList size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-white text-base">
                                {editingData ? 'Edit Log Pemakaian Obat' : 'Catat Pemakaian Obat'}
                            </h3>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                                Catat penggunaan obat agar stok otomatis disesuaikan
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

                    {/* Pilih Obat */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                            <span>Nama Obat <span className="text-rose-500">*</span></span>
                            {currentObat && (
                                <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                                    Stok Awal: {currentObat.stok_obat} • Sisa: {sisaSaatIni}
                                </span>
                            )}
                        </label>
                        {masterObatList.length === 0 ? (
                            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-700 dark:text-amber-300">
                                Belum ada data Master Obat. Silakan tambahkan master obat terlebih dahulu di menu Master Obat.
                            </div>
                        ) : (
                            <select
                                value={selectedObatId}
                                onChange={(e) => setSelectedObatId(e.target.value)}
                                required
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                            >
                                {masterObatList.map((obat) => (
                                    <option key={obat.id} value={obat.id}>
                                        {obat.nama_obat} (Tersedia: {obat.sisa_obat ?? obat.stok_obat})
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Jumlah Pemakaian */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Jumlah Obat yang Digunakan <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="number"
                            min="1"
                            max={maxPemakaian > 0 ? maxPemakaian : 1}
                            placeholder="1"
                            value={pemakaianObat}
                            onChange={(e) => setPemakaianObat(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-800 dark:text-slate-100 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                        />
                    </div>

                    {/* Live Stock Calculation Preview */}
                    {currentObat && (
                        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl space-y-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                Simulasi Perubahan Stok
                            </span>
                            <div className="flex items-center justify-between text-xs">
                                <div>
                                    <span className="text-slate-500 block">Sisa Saat Ini</span>
                                    <strong className="text-slate-800 dark:text-white text-sm">{maxPemakaian}</strong>
                                </div>
                                <ArrowRight size={16} className="text-slate-400 shrink-0" />
                                <div>
                                    <span className="text-slate-500 block">Digunakan</span>
                                    <strong className="text-rose-600 dark:text-rose-400 text-sm">-{jumlahInput}</strong>
                                </div>
                                <ArrowRight size={16} className="text-slate-400 shrink-0" />
                                <div>
                                    <span className="text-slate-500 block">Sisa Akhir</span>
                                    <strong className={`text-sm ${estimasiSisa < 0 ? 'text-rose-600 font-black' : 'text-emerald-600 dark:text-emerald-400 font-bold'}`}>
                                        {estimasiSisa}
                                    </strong>
                                </div>
                            </div>
                        </div>
                    )}

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
                            disabled={loading || masterObatList.length === 0}
                            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
                        >
                            <Save size={16} />
                            <span>{loading ? 'Menyimpan...' : (editingData ? 'Simpan Perubahan' : 'Catat Pemakaian')}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
