'use client';

import { useState, useEffect } from 'react';
import { X, Save, AlertCircle, ShieldAlert, UserCheck, AlertTriangle } from 'lucide-react';

export default function RiwayatPelanggaranModal({
    isOpen,
    onClose,
    onSave,
    selectedPeserta = null,
    pelanggaranMasterList = []
}) {
    const [selectedPelanggaranId, setSelectedPelanggaranId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setSelectedPelanggaranId(pelanggaranMasterList.length > 0 ? String(pelanggaranMasterList[0].id) : '');
            setError('');
        }
    }, [isOpen, pelanggaranMasterList]);

    if (!isOpen || !selectedPeserta) return null;

    const currentSelectedPelanggaran = pelanggaranMasterList.find(
        p => String(p.id) === String(selectedPelanggaranId)
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedPelanggaranId) {
            setError('Pilih jenis pelanggaran yang dilakukan.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await onSave({
                peserta_id: selectedPeserta.id,
                pelanggaran_id: selectedPelanggaranId
            });
            onClose();
        } catch (err) {
            console.error('Error recording violation:', err);
            setError(err.message || 'Gagal mencatat pelanggaran.');
        } finally {
            setLoading(false);
        }
    };

    const getBadgeStyle = (jenis) => {
        if (jenis === 'Ringan') {
            return 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800';
        }
        if (jenis === 'Sedang') {
            return 'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-800';
        }
        return 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-900';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-xl">
                            <ShieldAlert size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-white text-base">
                                Tambah Pelanggaran Peserta
                            </h3>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                                Catat sanksi atau pelanggaran tata tertib peserta
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

                    {/* Info Peserta (Read-only Card) */}
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Identitas Peserta
                            </span>
                            <span className="text-[11px] px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold">
                                {selectedPeserta.kelompok?.nama_kelompok ? `Kelompok ${selectedPeserta.kelompok.urutan}` : 'PKKMB'}
                            </span>
                        </div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white">
                            {selectedPeserta.nama_anggota}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                            <span>NIM: <strong className="text-slate-700 dark:text-slate-200">{selectedPeserta.nim_anggota || '-'}</strong></span>
                            {selectedPeserta.kelompok?.nama_kabim && (
                                <span>Kabim: <strong className="text-slate-700 dark:text-slate-200">{selectedPeserta.kelompok.nama_kabim}</strong></span>
                            )}
                        </div>
                    </div>

                    {/* Pilih Pelanggaran */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Nama Pelanggaran <span className="text-rose-500">*</span>
                        </label>
                        {pelanggaranMasterList.length === 0 ? (
                            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-700 dark:text-amber-300">
                                Belum ada data Master Pelanggaran. Silakan tambahkan master pelanggaran terlebih dahulu.
                            </div>
                        ) : (
                            <select
                                value={selectedPelanggaranId}
                                onChange={(e) => setSelectedPelanggaranId(e.target.value)}
                                required
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                            >
                                {pelanggaranMasterList.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.nama_pelanggaran} ({p.jenis_pelanggaran})
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Preview Jenis Pelanggaran */}
                    {currentSelectedPelanggaran && (
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Tingkat Sanksi
                            </label>
                            <div className="flex items-center">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${getBadgeStyle(currentSelectedPelanggaran.jenis_pelanggaran)}`}>
                                    <span className={`w-2 h-2 rounded-full ${
                                        currentSelectedPelanggaran.jenis_pelanggaran === 'Ringan' ? 'bg-amber-500' :
                                        currentSelectedPelanggaran.jenis_pelanggaran === 'Sedang' ? 'bg-orange-500' : 'bg-rose-500'
                                    }`} />
                                    Pelanggaran Tingkat {currentSelectedPelanggaran.jenis_pelanggaran}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
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
                            disabled={loading || pelanggaranMasterList.length === 0}
                            className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-500/20 transition-all disabled:opacity-50"
                        >
                            <Save size={16} />
                            <span>{loading ? 'Menyimpan...' : 'Catat Pelanggaran'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
