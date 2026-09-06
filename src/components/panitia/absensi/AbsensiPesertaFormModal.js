'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Save, AlertCircle, UserCheck } from 'lucide-react';
import SearchableDropdown from './SearchableDropdown';

export default function AbsensiPesertaFormModal({
    isOpen,
    onClose,
    onSave,
    jadwalList = [],       // { value: id, label: judul }
    membersList = [],      // { id, nama_anggota, nim_anggota, nama_kelompok, urutan_kelompok }
    historyList = [],      // Array data absensi_peserta_pkkmb untuk sesi ini
    defaultJadwalId = '',
    editData = null,
    preselectedMember = null
}) {
    const [jadwalId, setJadwalId] = useState('');
    const [memberId, setMemberId] = useState('');
    const [jenisAbsensi, setJenisAbsensi] = useState('Hadir');
    const [keterangan, setKeterangan] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const statusOptions = [
        { value: 'Hadir', label: 'Hadir' },
        { value: 'Izin', label: 'Izin' },
        { value: 'Sakit', label: 'Sakit' },
        { value: 'Alpha', label: 'Alpha' }
    ];

    useEffect(() => {
        if (isOpen) {
            if (editData) {
                setJadwalId(editData.jadwal_acara_pkkmb_id ? String(editData.jadwal_acara_pkkmb_id) : defaultJadwalId);
                setMemberId(editData.kelompok_members_id ? String(editData.kelompok_members_id) : '');
                setJenisAbsensi(editData.jenis_absensi || 'Hadir');
                setKeterangan(editData.keterangan || '');
            } else {
                setJadwalId(defaultJadwalId ? String(defaultJadwalId) : '');
                if (preselectedMember) {
                    setMemberId(String(preselectedMember.id));
                } else {
                    setMemberId('');
                }
                setJenisAbsensi('Hadir');
                setKeterangan('');
            }
            setError('');
        }
    }, [isOpen, editData, preselectedMember, defaultJadwalId]);

    // Set ID anggota yang SUDAH ABSEN pada jadwalId yang dipilih
    const alreadyAttendedMemberIds = useMemo(() => {
        if (!jadwalId) return new Set();

        const setOfIds = new Set();
        historyList.forEach(item => {
            if (String(item.jadwal_acara_pkkmb_id) === String(jadwalId) && item.kelompok_members_id) {
                setOfIds.add(String(item.kelompok_members_id));
            }
        });
        return setOfIds;
    }, [historyList, jadwalId]);

    // Opsi Peserta untuk SearchableDropdown
    const memberOptions = useMemo(() => {
        return membersList.map(m => {
            const mId = String(m.id);
            const isAttended = !editData && (!preselectedMember || String(preselectedMember.id) !== mId) && alreadyAttendedMemberIds.has(mId);
            const labelText = `${m.nama_anggota} (${m.nim_anggota || 'Tanpa NIM'}) - Kel. ${m.urutan_kelompok || m.nama_kelompok || '-'}`;

            return {
                value: mId,
                label: isAttended ? `${labelText} (Sudah Diabsen)` : labelText,
                disabled: isAttended
            };
        });
    }, [membersList, alreadyAttendedMemberIds, editData, preselectedMember]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!jadwalId) {
            setError('Pilih Sesi Jadwal Acara terlebih dahulu.');
            return;
        }
        if (!memberId) {
            setError('Nama Anggota / Peserta wajib dipilih.');
            return;
        }
        if (!jenisAbsensi) {
            setError('Jenis Absensi wajib dipilih.');
            return;
        }

        setLoading(true);
        setError('');

        const payload = {
            jadwal_acara_pkkmb_id: jadwalId,
            kelompok_members_id: memberId,
            jenis_absensi: jenisAbsensi,
            keterangan: keterangan.trim()
        };

        const success = await onSave(payload);
        setLoading(false);

        if (success) {
            onClose();
        } else {
            setError('Gagal menyimpan data absensi peserta. Silakan coba lagi.');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl">
                            <UserCheck size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-white text-base">
                                {editData ? 'Edit Absensi Peserta' : 'Isi Absensi Peserta'}
                            </h3>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                                Catat kehadiran anggota kelompok PKKMB
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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

                    {/* Sesi / Jadwal Acara */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Sesi / Jadwal Acara <span className="text-rose-500">*</span>
                        </label>
                        <SearchableDropdown
                            options={jadwalList}
                            value={jadwalId}
                            onChange={(val) => setJadwalId(val)}
                            placeholder="-- Pilih Sesi Acara --"
                            disabled={Boolean(editData) || Boolean(defaultJadwalId)}
                        />
                    </div>

                    {/* Nama Peserta / Anggota */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Nama Anggota / Peserta <span className="text-rose-500">*</span>
                        </label>
                        <SearchableDropdown
                            options={memberOptions}
                            value={memberId}
                            onChange={(val) => setMemberId(val)}
                            placeholder="-- Cari atau Pilih Anggota --"
                            disabled={Boolean(editData) || Boolean(preselectedMember)}
                        />
                    </div>

                    {/* Jenis Absensi */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Jenis Kehadiran <span className="text-rose-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {statusOptions.map((opt) => {
                                const isSelected = jenisAbsensi === opt.value;
                                let activeBg = 'bg-blue-600 text-white border-blue-600';
                                if (opt.value === 'Hadir') activeBg = 'bg-emerald-600 text-white border-emerald-600';
                                if (opt.value === 'Izin') activeBg = 'bg-blue-600 text-white border-blue-600';
                                if (opt.value === 'Sakit') activeBg = 'bg-amber-600 text-white border-amber-600';
                                if (opt.value === 'Alpha') activeBg = 'bg-rose-600 text-white border-rose-600';

                                return (
                                    <button
                                        type="button"
                                        key={opt.value}
                                        onClick={() => setJenisAbsensi(opt.value)}
                                        className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                                            isSelected
                                                ? activeBg
                                                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-850'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Keterangan */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Keterangan (Opsional)
                        </label>
                        <textarea
                            rows={3}
                            value={keterangan}
                            onChange={(e) => setKeterangan(e.target.value)}
                            placeholder="Contoh: Sakit demam, Izin ada urusan keluarga, dll."
                            className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
                        >
                            <Save size={15} />
                            <span>{loading ? 'Menyimpan...' : 'Simpan Absen'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
