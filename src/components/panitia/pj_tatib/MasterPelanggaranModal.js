'use client';

import { useState, useEffect } from 'react';
import { X, Save, AlertCircle, ShieldAlert } from 'lucide-react';

export default function MasterPelanggaranModal({
    isOpen,
    onClose,
    onSave,
    editData = null
}) {
    const [namaPelanggaran, setNamaPelanggaran] = useState('');
    const [jenisPelanggaran, setJenisPelanggaran] = useState('Ringan');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const jenisOptions = [
        { value: 'Ringan', label: 'Ringan', color: 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
        { value: 'Sedang', label: 'Sedang', color: 'bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800' },
        { value: 'Berat', label: 'Berat', color: 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800' }
    ];

    useEffect(() => {
        if (isOpen) {
            if (editData) {
                setNamaPelanggaran(editData.nama_pelanggaran || '');
                setJenisPelanggaran(editData.jenis_pelanggaran || 'Ringan');
            } else {
                setNamaPelanggaran('');
                setJenisPelanggaran('Ringan');
            }
            setError('');
        }
    }, [isOpen, editData]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmedNama = namaPelanggaran.trim();
        if (!trimmedNama) {
            setError('Nama pelanggaran wajib diisi.');
            return;
        }
        if (!jenisPelanggaran) {
            setError('Pilih jenis pelanggaran.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await onSave({
                nama_pelanggaran: trimmedNama,
                jenis_pelanggaran: jenisPelanggaran
            });
            onClose();
        } catch (err) {
            console.error('Error saving master pelanggaran:', err);
            setError(err.message || 'Gagal menyimpan data master pelanggaran.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl">
                            <ShieldAlert size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-white text-base">
                                {editData ? 'Edit Master Pelanggaran' : 'Tambah Master Pelanggaran'}
                            </h3>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                                Aturan tata tertib dan sanksi PKKMB
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

                    {/* Nama Pelanggaran */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Nama / Deskripsi Pelanggaran <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Contoh: Datang terlambat lebih dari 15 menit"
                            value={namaPelanggaran}
                            onChange={(e) => setNamaPelanggaran(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400"
                        />
                    </div>

                    {/* Jenis Pelanggaran */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Jenis / Tingkat Pelanggaran <span className="text-rose-500">*</span>
                        </label>
                        <div className="grid grid-cols-3 gap-2.5">
                            {jenisOptions.map((opt) => {
                                const isSelected = jenisPelanggaran === opt.value;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setJenisPelanggaran(opt.value)}
                                        className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                                            isSelected
                                                ? `${opt.color} ring-2 ring-blue-500/30 shadow-sm`
                                                : 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        <span className={`w-2 h-2 rounded-full ${
                                            opt.value === 'Ringan' ? 'bg-amber-500' :
                                            opt.value === 'Sedang' ? 'bg-orange-500' : 'bg-rose-500'
                                        }`} />
                                        {opt.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80">
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
                            <span>{loading ? 'Menyimpan...' : editData ? 'Simpan Perubahan' : 'Tambah Pelanggaran'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
