'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Save, AlertCircle, HeartPulse, User } from 'lucide-react';
import SearchableDropdown from '@/components/panitia/absensi/SearchableDropdown';

export default function MedisPanitiaFormModal({
    isOpen,
    onClose,
    onSave,
    adminList = [],     // Array of admin objects: [{ id, nama, role, email }]
    existingList = [],  // Array data yang sudah ada untuk validasi duplikat opsional
    editData = null
}) {
    const [panitiaId, setPanitiaId] = useState('');
    const [namaPanitia, setNamaPanitia] = useState('');
    const [divisi, setDivisi] = useState('');
    const [riwayatPenyakit, setRiwayatPenyakit] = useState('');
    const [penanganan, setPenanganan] = useState('');
    const [alergi, setAlergi] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Format opsi admin untuk SearchableDropdown
    const adminOptions = useMemo(() => {
        return adminList.map(adm => {
            const adminId = adm.id || adm.value;
            const adminName = adm.nama || adm.label || adm.name;
            const roleName = adm.role ? ` (${adm.role})` : '';

            return {
                value: adminId,
                label: `${adminName}${roleName}`
            };
        });
    }, [adminList]);

    // Reset atau isi state saat modal dibuka/ditutup
    useEffect(() => {
        if (isOpen) {
            if (editData) {
                setPanitiaId(editData.panitia_id || '');
                setNamaPanitia(editData.nama || '');
                setDivisi(editData.divisi && editData.divisi !== '-' ? editData.divisi : '');
                setRiwayatPenyakit(editData.riwayat_penyakit && editData.riwayat_penyakit !== '-' ? editData.riwayat_penyakit : '');
                setPenanganan(editData.penanganan && editData.penanganan !== '-' ? editData.penanganan : '');
                setAlergi(editData.alergi && editData.alergi !== '-' ? editData.alergi : '');
            } else {
                setPanitiaId('');
                setNamaPanitia('');
                setDivisi('');
                setRiwayatPenyakit('');
                setPenanganan('');
                setAlergi('');
            }
            setError('');
        }
    }, [isOpen, editData]);

    if (!isOpen) return null;

    const handleAdminSelect = (selectedId) => {
        setPanitiaId(selectedId);
        const selectedAdmin = adminList.find(a => String(a.id || a.value) === String(selectedId));
        if (selectedAdmin) {
            setNamaPanitia(selectedAdmin.nama || selectedAdmin.label || '');
        }
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!panitiaId) {
            setError('Nama Panitia wajib dipilih dari daftar.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const payload = {
                panitia_id: panitiaId,
                nama: namaPanitia,
                divisi: divisi.trim() || '-',
                riwayat_penyakit: riwayatPenyakit.trim() || '-',
                penanganan: penanganan.trim() || '-',
                alergi: alergi.trim() || '-'
            };

            const success = await onSave(payload);
            if (success) {
                onClose();
            } else {
                setError('Gagal menyimpan data medis panitia. Silakan periksa koneksi atau input Anda.');
            }
        } catch (err) {
            setError(err.message || 'Terjadi kesalahan sistem saat menyimpan.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden transform scale-100 transition-all duration-300">
                {/* Header Modal */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                            <HeartPulse size={18} />
                        </div>
                        <h3 className="text-base font-bold text-slate-800 dark:text-white">
                            {editData ? 'Edit Data Medis Panitia' : 'Tambah Data Medis Panitia'}
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    {error && (
                        <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl text-sm">
                            <AlertCircle size={16} className="shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Dropdown Nama Panitia (FK ke admins) */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <User size={13} className="text-blue-500" />
                            Nama Panitia <span className="text-rose-500">*</span>
                        </label>
                        {editData ? (
                            <input
                                type="text"
                                value={namaPanitia}
                                disabled
                                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-300 text-sm cursor-not-allowed font-medium"
                            />
                        ) : (
                            <SearchableDropdown
                                options={adminOptions}
                                value={panitiaId}
                                onChange={handleAdminSelect}
                                placeholder="Pilih atau cari nama panitia..."
                            />
                        )}
                        <p className="text-[11px] text-slate-400">Pilih akun panitia yang terdaftar di sistem admin.</p>
                    </div>

                    {/* Divisi */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Divisi / Jabatan
                        </label>
                        <input
                            type="text"
                            placeholder="Contoh: Acara, Medis, Logistik, Konsumsi..."
                            value={divisi}
                            onChange={(e) => setDivisi(e.target.value)}
                            maxLength={50}
                            className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all"
                        />
                    </div>

                    {/* Riwayat Penyakit */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Riwayat Penyakit
                        </label>
                        <input
                            type="text"
                            placeholder="Contoh: Asma, Maag kronis, Migrain (atau kosongkan / '-')..."
                            value={riwayatPenyakit}
                            onChange={(e) => setRiwayatPenyakit(e.target.value)}
                            maxLength={255}
                            className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all"
                        />
                    </div>

                    {/* Penanganan */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Penanganan Medis Khusus
                        </label>
                        <textarea
                            placeholder="Contoh: Berikan inhaler biru di tas samping, istirahatkan di ruang ber-AC..."
                            value={penanganan}
                            onChange={(e) => setPenanganan(e.target.value)}
                            maxLength={255}
                            rows={2}
                            className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 resize-none transition-all"
                        />
                    </div>

                    {/* Alergi */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Riwayat Alergi
                        </label>
                        <input
                            type="text"
                            placeholder="Contoh: Udang/Seafood, Dingin, Debu, Paracetamol..."
                            value={alergi}
                            onChange={(e) => setAlergi(e.target.value)}
                            maxLength={255}
                            className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all"
                        />
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4.5 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                            disabled={loading}
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                            disabled={loading || !panitiaId}
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <Save size={16} />
                            )}
                            Simpan Data
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
