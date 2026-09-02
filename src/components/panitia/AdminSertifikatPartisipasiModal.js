'use client';

import { useState, useEffect, useMemo } from 'react';
import { Award, X, Search, CheckCircle2, AlertCircle, Loader2, Download, CheckSquare, Square, UserCheck } from 'lucide-react';
import { getPesertaWajibPoseLunas } from '@/api/supabase/admin/sertifikat';
import TombolCetakSertifikat from '@/components/public/TombolCetakSertifikat';
import { generateSertifikatPoseAction } from '@/api/sertifikat/route';

export default function AdminSertifikatPartisipasiModal({ isOpen, onClose, formWajib }) {
    const [pesertaList, setPesertaList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [batchLoading, setBatchLoading] = useState(false);
    const [batchProgress, setBatchProgress] = useState(0); // 0 - 100
    const [batchStatusText, setBatchStatusText] = useState('');

    useEffect(() => {
        if (!isOpen || !formWajib) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch peserta lunas for this form wajib
                const data = await getPesertaWajibPoseLunas(formWajib.kode_form);
                setPesertaList(data || []);
            } catch (err) {
                console.error('Error fetching peserta for certificate:', err);
                setPesertaList([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        setSelectedIds([]);
        setSearchQuery('');
    }, [isOpen, formWajib]);

    const filteredList = useMemo(() => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return pesertaList;
        return pesertaList.filter(p =>
            (p.nama && p.nama.toLowerCase().includes(q)) ||
            (p.nim && p.nim.toLowerCase().includes(q)) ||
            (p.kampus && p.kampus.toLowerCase().includes(q))
        );
    }, [pesertaList, searchQuery]);

    const handleToggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedIds.length === filteredList.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredList.map(p => p.id));
        }
    };

    // Handler to batch generate and download selected certificates
    const handleBatchPrint = async () => {
        const idsToProcess = selectedIds.length > 0 ? selectedIds : filteredList.map(p => p.id);
        if (idsToProcess.length === 0) {
            alert('Tidak ada peserta yang dipilih untuk dicetak.');
            return;
        }

        setBatchLoading(true);
        setBatchProgress(5);

        try {
            for (let i = 0; i < idsToProcess.length; i++) {
                const id = idsToProcess[i];
                const currentPeserta = pesertaList.find(p => p.id === id);
                setBatchStatusText(`Membuat sertifikat ${i + 1} dari ${idsToProcess.length}: ${currentPeserta?.nama || ''}`);

                const res = await generateSertifikatPoseAction({
                    type: 'partisipasi',
                    pesertaId: id
                });

                if (res && res.success && res.base64Pdf) {
                    // Trigger download
                    const byteCharacters = atob(res.base64Pdf);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let j = 0; j < byteCharacters.length; j++) {
                        byteNumbers[j] = byteCharacters.charCodeAt(j);
                    }
                    const byteArray = new Uint8Array(byteNumbers);
                    const blob = new Blob([byteArray], { type: 'application/pdf' });

                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = res.filename || `Sertifikat_${id}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url);
                }

                // Update progress
                const currentPercent = Math.round(((i + 1) / idsToProcess.length) * 100);
                setBatchProgress(currentPercent);

                // Delay between downloads to prevent browser throttling
                if (i < idsToProcess.length - 1) {
                    await new Promise(r => setTimeout(r, 600));
                }
            }

            setBatchStatusText('Semua sertifikat selesai diunduh!');
            setTimeout(() => {
                setBatchStatusText('');
                setBatchProgress(0);
                setBatchLoading(false);
            }, 2000);
        } catch (err) {
            console.error('Batch Print Error:', err);
            alert(`Terjadi kesalahan saat mencetak batch: ${err.message}`);
            setBatchLoading(false);
            setBatchProgress(0);
        }
    };

    if (!isOpen || !formWajib) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 dark:border-gray-800">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                            <Award size={22} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                Cetak Sertifikat Partisipasi
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {formWajib.judul} {formWajib.kode_form ? `(${formWajib.kode_form})` : ''} — Khusus Peserta Status Lunas
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-9 h-9 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex items-center justify-center transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Batch Progress Bar Overlay (If Running) */}
                {batchLoading && (
                    <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/50 p-4 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-200">
                            <div className="flex items-center gap-2">
                                <Loader2 size={15} className="animate-spin text-amber-600" />
                                <span>{batchStatusText}</span>
                            </div>
                            <span className="font-mono">{batchProgress}%</span>
                        </div>
                        <div className="w-full h-2 bg-amber-200 dark:bg-amber-900 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-amber-600 rounded-full transition-all duration-300"
                                style={{ width: `${batchProgress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Controls: Search + Select All + Batch Download */}
                <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-gray-900">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Cari nama, NIM, atau kampus..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-amber-500/30 outline-none text-gray-900 dark:text-white"
                        />
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                        <button
                            type="button"
                            onClick={handleSelectAll}
                            disabled={loading || filteredList.length === 0}
                            className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                            {selectedIds.length === filteredList.length && filteredList.length > 0 ? (
                                <CheckSquare size={15} className="text-amber-500" />
                            ) : (
                                <Square size={15} />
                            )}
                            <span>{selectedIds.length === filteredList.length && filteredList.length > 0 ? 'Batal Pilih' : 'Pilih Semua'}</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleBatchPrint}
                            disabled={loading || batchLoading || (selectedIds.length === 0 && filteredList.length === 0)}
                            className="relative overflow-hidden px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <Download size={14} />
                            <span>
                                {selectedIds.length > 0 ? `Cetak (${selectedIds.length}) Terpilih` : 'Cetak Semua'}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Table Content */}
                <div className="overflow-y-auto flex-1 p-4 sm:p-6">
                    {loading ? (
                        <div className="py-16 text-center space-y-3">
                            <Loader2 size={32} className="animate-spin text-amber-500 mx-auto" />
                            <p className="text-sm text-gray-500 font-medium">Memuat data peserta lunas...</p>
                        </div>
                    ) : filteredList.length === 0 ? (
                        <div className="py-16 text-center space-y-3">
                            <AlertCircle size={36} className="text-gray-400 mx-auto" />
                            <p className="text-base font-bold text-gray-800 dark:text-gray-200">Belum Ada Peserta Berstatus Lunas</p>
                            <p className="text-xs text-gray-500 max-w-sm mx-auto">
                                Sertifikat partisipasi hanya dapat diterbitkan untuk peserta yang pembayaran form wajibnya telah terverifikasi Lunas.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-gray-800 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
                            {filteredList.map((peserta) => {
                                const isSelected = selectedIds.includes(peserta.id);
                                return (
                                    <div
                                        key={peserta.id}
                                        className={`p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors ${
                                            isSelected
                                                ? 'bg-amber-50/60 dark:bg-amber-950/20'
                                                : 'hover:bg-gray-50/80 dark:hover:bg-gray-800/40'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3.5 flex-1 min-w-0">
                                            <button
                                                type="button"
                                                onClick={() => handleToggleSelect(peserta.id)}
                                                className="text-gray-400 hover:text-amber-500 shrink-0 p-1"
                                            >
                                                {isSelected ? (
                                                    <CheckSquare size={18} className="text-amber-500" />
                                                ) : (
                                                    <Square size={18} />
                                                )}
                                            </button>

                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                                                        {peserta.nama}
                                                    </h4>
                                                    <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold rounded-md uppercase">
                                                        Lunas
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex flex-wrap items-center gap-2">
                                                    <span>NIM: <strong className="text-gray-700 dark:text-gray-300">{peserta.nim || '-'}</strong></span>
                                                    <span>•</span>
                                                    <span>{peserta.kampus || 'LP3I'}</span>
                                                    {peserta.prodi && (
                                                        <>
                                                            <span>•</span>
                                                            <span>{peserta.prodi}</span>
                                                        </>
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="shrink-0 self-end sm:self-center w-full sm:w-auto">
                                            <TombolCetakSertifikat
                                                type="partisipasi"
                                                pesertaId={peserta.id}
                                                label="Cetak Sertifikat"
                                                className="px-3.5 py-2 text-xs"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 sm:p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-medium">
                        Total {pesertaList.length} peserta lunas terdaftar
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
}
