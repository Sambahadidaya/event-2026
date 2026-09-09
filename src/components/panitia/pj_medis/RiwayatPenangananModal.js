'use client';

import { useState, useEffect, useRef } from 'react';
import {
    X, Save, AlertCircle, HeartPulse, User, Shield, Search,
    Pill, CheckCircle2, ChevronRight, RotateCcw, Plus, Trash2, ShieldCheck
} from 'lucide-react';
import { searchPesertaForMedis } from '@/api/supabase/admin/obat';

export default function RiwayatPenangananModal({
    isOpen,
    onClose,
    onSave,
    masterObatList = [],
    adminList = [],
    editingData = null,
    site = 'pkkmb'
}) {
    // Target Switch: 'peserta' | 'panitia'
    const [targetType, setTargetType] = useState('peserta');

    // State Target Peserta
    const [selectedPeserta, setSelectedPeserta] = useState(null);
    const [searchPesertaInput, setSearchPesertaInput] = useState('');
    const [pesertaResults, setPesertaResults] = useState([]);
    const [isSearchingPeserta, setIsSearchingPeserta] = useState(false);
    const [hasSearchedPeserta, setHasSearchedPeserta] = useState(false);
    const debounceTimerRef = useRef(null);

    // State Target Panitia (Searchable)
    const [selectedPanitia, setSelectedPanitia] = useState(null);
    const [searchPanitiaInput, setSearchPanitiaInput] = useState('');

    // State Multi-Obat
    const [pakaiObat, setPakaiObat] = useState(false);
    // Array of { id, nama_obat, sisa_obat, stok_obat, is_non_depleting, jumlah }
    const [selectedObatList, setSelectedObatList] = useState([]);
    const [pickerObatId, setPickerObatId] = useState('');

    // State Keterangan
    const [keterangan, setKeterangan] = useState('');

    // UI State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setError('');
            if (editingData) {
                // Pre-populate data jika sedang edit
                if (editingData.peserta_id) {
                    setTargetType('peserta');
                    setSelectedPeserta(editingData.peserta || {
                        id: editingData.peserta_id,
                        nama_anggota: 'Peserta',
                        nim_anggota: '-'
                    });
                    setSelectedPanitia(null);
                } else if (editingData.panitia_id) {
                    setTargetType('panitia');
                    const adminFound = adminList.find(a => a.id === editingData.panitia_id);
                    setSelectedPanitia(adminFound || editingData.panitia || {
                        id: editingData.panitia_id,
                        nama: 'Panitia',
                        role: '-'
                    });
                    setSelectedPeserta(null);
                }

                // Populate obat jika ada relasi multi-obat atau pemakaian_obat legacy
                if (Array.isArray(editingData.riwayat_penanganan_obat) && editingData.riwayat_penanganan_obat.length > 0) {
                    setPakaiObat(true);
                    const formatted = editingData.riwayat_penanganan_obat.map(rel => ({
                        id: rel.obat_id,
                        nama_obat: rel.master_obat?.nama_obat || 'Obat',
                        sisa_obat: rel.master_obat?.sisa_obat ?? rel.master_obat?.stok_obat ?? 0,
                        stok_obat: rel.master_obat?.stok_obat ?? 0,
                        is_non_depleting: Boolean(rel.master_obat?.is_non_depleting),
                        jumlah: rel.jumlah || 1
                    }));
                    setSelectedObatList(formatted);
                } else if (editingData.pemakaian_obat_id && editingData.pemakaian_obat) {
                    setPakaiObat(true);
                    const master = editingData.pemakaian_obat.master_obat;
                    setSelectedObatList([{
                        id: master?.id || editingData.pemakaian_obat.obat_id,
                        nama_obat: master?.nama_obat || 'Obat',
                        sisa_obat: master?.sisa_obat ?? master?.stok_obat ?? 0,
                        stok_obat: master?.stok_obat ?? 0,
                        is_non_depleting: Boolean(master?.is_non_depleting),
                        jumlah: editingData.pemakaian_obat.pemakaian_obat || 1
                    }]);
                } else {
                    setPakaiObat(false);
                    setSelectedObatList([]);
                }

                setKeterangan(editingData.keterangan || '');
            } else {
                // Reset form tambah baru
                setTargetType('peserta');
                setSelectedPeserta(null);
                setSearchPesertaInput('');
                setPesertaResults([]);
                setHasSearchedPeserta(false);
                setSelectedPanitia(null);
                setSearchPanitiaInput('');
                setPakaiObat(false);
                setSelectedObatList([]);
                setPickerObatId('');
                setKeterangan('');
            }
        }
    }, [isOpen, editingData, adminList]);

    // Handle search peserta dengan debounce
    useEffect(() => {
        if (targetType !== 'peserta' || selectedPeserta) return;
        if (!searchPesertaInput.trim()) {
            setPesertaResults([]);
            setHasSearchedPeserta(false);
            setIsSearchingPeserta(false);
            return;
        }

        setIsSearchingPeserta(true);
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

        debounceTimerRef.current = setTimeout(async () => {
            try {
                const res = await searchPesertaForMedis(searchPesertaInput, site);
                if (res.success) {
                    setPesertaResults(res.data || []);
                }
            } catch (err) {
                console.error('Search error:', err);
            } finally {
                setIsSearchingPeserta(false);
                setHasSearchedPeserta(true);
            }
        }, 600);

        return () => {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        };
    }, [searchPesertaInput, targetType, selectedPeserta, site]);

    if (!isOpen) return null;

    // Filtered panitia list based on searchPanitiaInput
    const filteredPanitiaList = adminList.filter(a => {
        if (!searchPanitiaInput.trim()) return true;
        const q = searchPanitiaInput.toLowerCase();
        return (a.nama || '').toLowerCase().includes(q) || (a.role || '').toLowerCase().includes(q);
    });

    const handleSelectPeserta = (p) => {
        setSelectedPeserta(p);
        setSearchPesertaInput('');
        setPesertaResults([]);
        setHasSearchedPeserta(false);
    };

    const handleResetPeserta = () => {
        setSelectedPeserta(null);
        setSearchPesertaInput('');
        setPesertaResults([]);
        setHasSearchedPeserta(false);
    };

    const handleSelectPanitia = (adm) => {
        setSelectedPanitia(adm);
        setSearchPanitiaInput('');
    };

    const handleResetPanitia = () => {
        setSelectedPanitia(null);
        setSearchPanitiaInput('');
    };

    // Multi-Obat actions
    const handleAddObatToSelection = () => {
        if (!pickerObatId) return;
        const obatObj = masterObatList.find(o => String(o.id) === String(pickerObatId));
        if (!obatObj) return;

        // Cek jika sudah pernah ditambahkan
        if (selectedObatList.some(item => item.id === obatObj.id)) {
            setError(`Obat "${obatObj.nama_obat}" sudah ada dalam daftar.`);
            return;
        }

        const sisa = obatObj.sisa_obat ?? obatObj.stok_obat ?? 0;
        if (!obatObj.is_non_depleting && sisa <= 0) {
            setError(`Stok obat "${obatObj.nama_obat}" habis.`);
            return;
        }

        setSelectedObatList(prev => [
            ...prev,
            {
                id: obatObj.id,
                nama_obat: obatObj.nama_obat,
                sisa_obat: sisa,
                stok_obat: obatObj.stok_obat,
                is_non_depleting: Boolean(obatObj.is_non_depleting),
                jumlah: 1
            }
        ]);
        setPickerObatId('');
        setError('');
    };

    const handleRemoveObatFromSelection = (obatId) => {
        setSelectedObatList(prev => prev.filter(o => o.id !== obatId));
    };

    const handleUpdateJumlahObat = (obatId, newJumlah) => {
        const val = parseInt(newJumlah, 10);
        setSelectedObatList(prev => prev.map(o => {
            if (o.id === obatId) {
                const max = o.is_non_depleting ? 999 : (o.sisa_obat > 0 ? o.sisa_obat : 1);
                const safeVal = isNaN(val) ? 1 : Math.max(1, Math.min(val, max));
                return { ...o, jumlah: safeVal };
            }
            return o;
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        let targetId = null;
        if (targetType === 'peserta') {
            if (!selectedPeserta) {
                setError('Pilih nama peserta yang ditangani terlebih dahulu.');
                return;
            }
            targetId = selectedPeserta.id;
        } else {
            if (!selectedPanitia) {
                setError('Pilih nama panitia yang ditangani terlebih dahulu.');
                return;
            }
            targetId = selectedPanitia.id;
        }

        const ket = keterangan.trim();
        if (!ket) {
            setError('Keterangan penanganan medis wajib diisi.');
            return;
        }

        if (pakaiObat) {
            if (selectedObatList.length === 0) {
                setError('Pilih minimal satu jenis obat atau nonaktifkan opsi "Berikan Obat Medis".');
                return;
            }

            for (const o of selectedObatList) {
                const jml = parseInt(o.jumlah, 10);
                if (isNaN(jml) || jml <= 0) {
                    setError(`Jumlah untuk obat "${o.nama_obat}" tidak valid.`);
                    return;
                }
                if (!o.is_non_depleting && jml > o.sisa_obat) {
                    setError(`Jumlah pemakaian obat "${o.nama_obat}" melebihi sisa stok yang tersedia (${o.sisa_obat}).`);
                    return;
                }
            }
        }

        setLoading(true);
        try {
            await onSave({
                target_type: targetType,
                target_id: targetId,
                keterangan: ket,
                site: site || 'pkkmb',
                obat_list: pakaiObat ? selectedObatList.map(o => ({ obat_id: o.id, jumlah: o.jumlah })) : []
            });
            onClose();
        } catch (err) {
            console.error('Error saving riwayat penanganan:', err);
            setError(err.message || 'Gagal mencatat riwayat penanganan.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-xl">
                            <HeartPulse size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-white text-base">
                                {editingData ? 'Edit Riwayat Penanganan' : 'Tambah Penanganan Medis'}
                            </h3>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                                Catat tindakan medis untuk peserta maupun panitia ({site.toUpperCase()})
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

                {/* Form Body Scrollable */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    {error && (
                        <div className="flex items-center gap-2 p-3 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900/50">
                            <AlertCircle size={16} className="shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Switch: Pasien Peserta vs Panitia */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Kategori yang Ditangani <span className="text-rose-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/70 rounded-2xl">
                            <button
                                type="button"
                                onClick={() => {
                                    setTargetType('peserta');
                                    setSelectedPanitia(null);
                                }}
                                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                    targetType === 'peserta'
                                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                <User size={15} />
                                <span>Peserta (Mahasiswa)</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setTargetType('panitia');
                                    setSelectedPeserta(null);
                                }}
                                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                    targetType === 'panitia'
                                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                <Shield size={15} />
                                <span>Panitia (Admin)</span>
                            </button>
                        </div>
                    </div>

                    {/* SECTION PESERTA */}
                    {targetType === 'peserta' && (
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Pilih Peserta <span className="text-rose-500">*</span>
                            </label>

                            {selectedPeserta ? (
                                <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-2xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                                            {selectedPeserta.nama_anggota?.charAt(0).toUpperCase() || 'P'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800 dark:text-white">
                                                {selectedPeserta.nama_anggota}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                NIM: {selectedPeserta.nim_anggota || '-'} • {selectedPeserta.kelompok?.nama_kelompok ? (selectedPeserta.kelompok.urutan !== '-' ? `Kel. ${selectedPeserta.kelompok.urutan}` : selectedPeserta.kelompok.nama_kelompok) : 'Peserta'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleResetPeserta}
                                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                                        title="Ganti Peserta"
                                    >
                                        <RotateCcw size={16} />
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="relative">
                                        <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder={`Ketik nama atau NIM peserta ${site.toUpperCase()}...`}
                                            value={searchPesertaInput}
                                            onChange={(e) => setSearchPesertaInput(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        />
                                    </div>

                                    {isSearchingPeserta && (
                                        <p className="text-xs text-blue-500 animate-pulse font-medium">Mencari peserta...</p>
                                    )}

                                    {pesertaResults.length > 0 && (
                                        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 bg-slate-50/50 dark:bg-slate-800/30">
                                            {pesertaResults.map((m) => (
                                                <button
                                                    key={m.id}
                                                    type="button"
                                                    onClick={() => handleSelectPeserta(m)}
                                                    className="w-full p-2.5 text-left hover:bg-blue-50/60 dark:hover:bg-blue-950/40 flex items-center justify-between transition-colors group"
                                                >
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600">
                                                            {m.nama_anggota}
                                                        </p>
                                                        <span className="text-[11px] text-slate-400">
                                                            NIM: {m.nim_anggota || '-'} • {m.kelompok?.nama_kelompok || 'Kelompok'}
                                                        </span>
                                                    </div>
                                                    <ChevronRight size={14} className="text-slate-400 group-hover:text-blue-500" />
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {hasSearchedPeserta && pesertaResults.length === 0 && !isSearchingPeserta && (
                                        <p className="text-xs text-slate-400 italic">Peserta tidak ditemukan.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* SECTION PANITIA (SEARCHABLE) */}
                    {targetType === 'panitia' && (
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Pilih Panitia <span className="text-rose-500">*</span>
                            </label>

                            {selectedPanitia ? (
                                <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 rounded-2xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                                            {selectedPanitia.nama?.charAt(0).toUpperCase() || 'P'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800 dark:text-white">
                                                {selectedPanitia.nama}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                Role: {selectedPanitia.role || 'Panitia'} {selectedPanitia.email ? `• ${selectedPanitia.email}` : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleResetPanitia}
                                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
                                        title="Ganti Panitia"
                                    >
                                        <RotateCcw size={16} />
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="relative">
                                        <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Ketik nama atau role panitia..."
                                            value={searchPanitiaInput}
                                            onChange={(e) => setSearchPanitiaInput(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        />
                                    </div>

                                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl max-h-44 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 bg-slate-50/50 dark:bg-slate-800/30">
                                        {filteredPanitiaList.length === 0 ? (
                                            <p className="p-3 text-xs text-slate-400 italic text-center">Panitia tidak ditemukan.</p>
                                        ) : (
                                            filteredPanitiaList.map((adm) => (
                                                <button
                                                    key={adm.id}
                                                    type="button"
                                                    onClick={() => handleSelectPanitia(adm)}
                                                    className="w-full p-2.5 text-left hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 flex items-center justify-between transition-colors group"
                                                >
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600">
                                                            {adm.nama}
                                                        </p>
                                                        <span className="text-[11px] text-slate-400">
                                                            {adm.role || 'Panitia'}
                                                        </span>
                                                    </div>
                                                    <ChevronRight size={14} className="text-slate-400 group-hover:text-indigo-500" />
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TOGGLE PEMBERIAN OBAT (MULTI-OBAT) */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <label className="flex items-center justify-between cursor-pointer p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                            <span className="flex items-center gap-2.5">
                                <div className={`p-1.5 rounded-lg ${pakaiObat ? 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400' : 'bg-slate-200 text-slate-500 dark:bg-slate-700'}`}>
                                    <Pill size={16} />
                                </div>
                                <div>
                                    <span className="text-xs font-bold text-slate-800 dark:text-white block">
                                        Berikan Obat Medis?
                                    </span>
                                    <span className="text-[11px] text-slate-400">
                                        {pakaiObat ? 'Dapat memilih satu atau beberapa jenis obat sekaligus' : 'Cukup catat tindakan medis & istirahat tanpa obat'}
                                    </span>
                                </div>
                            </span>
                            <input
                                type="checkbox"
                                checked={pakaiObat}
                                onChange={(e) => setPakaiObat(e.target.checked)}
                                className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 cursor-pointer"
                            />
                        </label>
                    </div>

                    {/* SECTION MULTI-OBAT PICKER */}
                    {pakaiObat && (
                        <div className="p-4 bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 rounded-2xl space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                    Daftar Obat yang Diberikan
                                </span>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                    {selectedObatList.length} jenis obat dipilih
                                </span>
                            </div>

                            {/* Dropdown Add Obat */}
                            <div className="flex gap-2">
                                <select
                                    value={pickerObatId}
                                    onChange={(e) => setPickerObatId(e.target.value)}
                                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                                >
                                    <option value="">-- Pilih Obat untuk Ditambahkan --</option>
                                    {masterObatList.map((o) => (
                                        <option key={o.id} value={o.id} disabled={selectedObatList.some(item => item.id === o.id)}>
                                            {o.nama_obat} {o.is_non_depleting ? '(Non-Depleting)' : `(Sisa: ${o.sisa_obat ?? o.stok_obat})`}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={handleAddObatToSelection}
                                    disabled={!pickerObatId}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                                >
                                    <Plus size={14} />
                                    <span>Tambah</span>
                                </button>
                            </div>

                            {/* List of Selected Medicines */}
                            {selectedObatList.length > 0 ? (
                                <div className="space-y-2 pt-1">
                                    {selectedObatList.map((o) => (
                                        <div
                                            key={o.id}
                                            className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between gap-2 shadow-xs"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                                        {o.nama_obat}
                                                    </p>
                                                    {o.is_non_depleting && (
                                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 text-[9px] font-bold rounded-md">
                                                            <ShieldCheck size={10} />
                                                            Non-Depleting
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-slate-400">
                                                    {o.is_non_depleting ? 'Stok tidak berkurang' : `Sisa stok: ${o.sisa_obat}`}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[10px] text-slate-400">Qty:</span>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max={o.is_non_depleting ? 999 : (o.sisa_obat > 0 ? o.sisa_obat : 1)}
                                                        value={o.jumlah}
                                                        onChange={(e) => handleUpdateJumlahObat(o.id, e.target.value)}
                                                        className="w-14 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-100 text-center focus:outline-none focus:ring-1 focus:ring-rose-500"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveObatFromSelection(o.id)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                                                    title="Hapus obat"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center py-2 text-[11px] text-rose-500/80 italic">
                                    Belum ada obat yang ditambahkan ke penanganan ini.
                                </p>
                            )}
                        </div>
                    )}

                    {/* KETERANGAN PENANGANAN */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Keterangan / Tindakan Medis <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            rows="3"
                            placeholder="Contoh: Mengeluh pusing dan mual, diberikan obat dan diistirahatkan di tenda medis selama 30 menit..."
                            value={keterangan}
                            onChange={(e) => setKeterangan(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-800 dark:text-slate-100 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-none"
                        />
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
                            className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-500/20 transition-all disabled:opacity-50"
                        >
                            <Save size={16} />
                            <span>{loading ? 'Menyimpan...' : (editingData ? 'Simpan Perubahan' : 'Catat Penanganan')}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
