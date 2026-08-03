'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import SearchableDropdown from './SearchableDropdown';

export default function AbsensiFormModal({
    isOpen,
    onClose,
    onSave,
    formAbsenList = [], // { value: id, label: judul_absen }
    adminList = [],     // { value: id, label: nama }
    historyList = [],   // Array data riwayat absensi dari database/parent
    defaultFormId = '',
    editData = null
}) {
    const [formId, setFormId] = useState('');
    const [namaPanitia, setNamaPanitia] = useState('');
    const [typeAbsen, setTypeAbsen] = useState('');
    const [keterangan, setKeterangan] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const statusOptions = [
        { value: 'Hadir', label: 'Hadir' },
        { value: 'Izin', label: 'Izin' },
        { value: 'Sakit', label: 'Sakit' },
        { value: 'Alpha', label: 'Alpha' }
    ];

    // Reset state saat modal dibuka/ditutup
    useEffect(() => {
        if (isOpen) {
            if (editData) {
                setFormId(editData.form_id ? String(editData.form_id) : '');
                setNamaPanitia(editData.nama_panitia || '');
                setTypeAbsen(editData.type_absen || '');
                setKeterangan(editData.keterangan_absen || '');
            } else {
                setFormId(defaultFormId ? String(defaultFormId) : '');
                setNamaPanitia('');
                setTypeAbsen('');
                setKeterangan('');
            }
            setError('');
        }
    }, [isOpen, editData, defaultFormId]);

    // 1. Ambil Set NAMA PANITIA yang SUDAH ABSEN pada formId/sesi yang sedang dipilih
    const alreadyAttendedNames = useMemo(() => {
        if (!formId) return new Set();

        const setOfNames = new Set();
        historyList.forEach(item => {
            if (String(item.form_id) === String(formId) && item.nama_panitia) {
                setOfNames.add(item.nama_panitia.trim().toLowerCase());
            }
        });
        return setOfNames;
    }, [historyList, formId]);

    // 2. Buat Opsi Admin: Menandai `disabled: true` jika panitia sudah pernah diabsen
    const adminOptions = useMemo(() => {
        return adminList.map(adm => {
            const adminName = adm.nama || adm.label || adm.value;
            const cleanName = String(adminName).trim().toLowerCase();
            const isAttended = !editData && formId && alreadyAttendedNames.has(cleanName);

            return {
                value: adminName,
                // Beri label indikator jika sudah diabsen
                label: isAttended ? `${adminName} (Sudah Diabsen)` : adminName,
                // Kunci/disable opsi ini agar tidak bisa diklik di SearchableDropdown
                disabled: isAttended
            };
        });
    }, [adminList, alreadyAttendedNames, editData, formId]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formId) {
            setError('Pilih Sesi/Judul Absensi terlebih dahulu.');
            return;
        }
        if (!namaPanitia) {
            setError('Nama Panitia wajib dipilih.');
            return;
        }
        if (!typeAbsen) {
            setError('Jenis Absen wajib dipilih.');
            return;
        }

        // Proteksi Validasi Ganda (Mencegah submit jika bypass dropdown)
        if (!editData) {
            const cleanInputName = namaPanitia.trim().toLowerCase();
            const isAlreadyExist = historyList.some(
                item => String(item.form_id) === String(formId) &&
                    item.nama_panitia &&
                    item.nama_panitia.trim().toLowerCase() === cleanInputName
            );

            if (isAlreadyExist) {
                setError(`Panitia "${namaPanitia}" sudah diabsen pada sesi ini!`);
                return;
            }
        }

        setLoading(true);
        setError('');
        try {
            const success = await onSave({
                form_id: formId,
                nama_panitia: namaPanitia,
                type_absen: typeAbsen,
                keterangan_absen: keterangan.trim()
            });
            if (success) {
                onClose();
            } else {
                setError('Gagal menyimpan data absensi. Silakan coba lagi.');
            }
        } catch (err) {
            setError(err.message || 'Terjadi kesalahan sistem.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden transform scale-100 transition-all duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/80">
                    <h3 className="text-base font-bold text-slate-800 dark:text-white">
                        {editData ? 'Edit Data Absen Panitia' : 'Input Absen Panitia'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl text-sm">
                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Judul Absensi */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Judul Absensi</label>
                        <SearchableDropdown
                            options={formAbsenList}
                            value={formId}
                            onChange={(val) => {
                                setFormId(val);
                                setNamaPanitia(''); // Reset pilihan panitia jika sesi absen berganti
                                setError('');
                            }}
                            placeholder="Pilih Judul Absensi"
                            disabled={!!editData}
                        />
                    </div>

                    {/* Nama Panitia */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Nama Panitia</label>
                        {editData ? (
                            <input
                                type="text"
                                value={namaPanitia}
                                disabled
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-500 dark:text-slate-400 text-sm cursor-not-allowed"
                            />
                        ) : (
                            <SearchableDropdown
                                options={adminOptions}
                                value={namaPanitia}
                                onChange={(val) => {
                                    setNamaPanitia(val);
                                    setError('');
                                }}
                                placeholder={
                                    !formId
                                        ? "Pilih Judul Absensi Terlebih Dahulu"
                                        : "Cari Nama Panitia..."
                                }
                                disabled={!formId}
                            />
                        )}
                    </div>

                    {/* Jenis Absen */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Jenis Absen</label>
                        <SearchableDropdown
                            options={statusOptions}
                            value={typeAbsen}
                            onChange={(val) => setTypeAbsen(val)}
                            placeholder="Pilih Kehadiran"
                        />
                    </div>

                    {/* Keterangan */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Keterangan Absen</label>
                            <span className={`text-[10px] font-semibold ${keterangan.length > 135 ? 'text-amber-500' : 'text-slate-450 dark:text-slate-500'}`}>
                                {keterangan.length} / 150 Karakter
                            </span>
                        </div>
                        <textarea
                            placeholder="Tulis keterangan jika Izin/Sakit/Alpha (Maksimal 150 Karakter)..."
                            value={keterangan}
                            onChange={(e) => setKeterangan(e.target.value.slice(0, 150))}
                            maxLength={150}
                            rows={3}
                            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 resize-none"
                        />
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4.5 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-xl transition-all"
                            disabled={loading}
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
                            disabled={loading || (!editData && !formId)}
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <Save size={16} />
                            )}
                            Simpan
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}