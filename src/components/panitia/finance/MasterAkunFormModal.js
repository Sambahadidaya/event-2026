'use client';

import { useState, useEffect } from 'react';
import { X, Check, AlertCircle, Receipt } from 'lucide-react';
import { upsertMasterAccount } from '@/api/supabase/admin/finance';

export default function MasterAkunFormModal({ isOpen, onClose, onSuccess, initialData = null, siteType = 'all', adminRole = '' }) {
    const [kodeAkun, setKodeAkun] = useState('');
    const [namaAkun, setNamaAkun] = useState('');
    const [akunType, setAkunType] = useState('Asset');
    const [site, setSite] = useState(siteType === 'all' ? 'pose' : siteType);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const isSuperAdmin = !adminRole || adminRole === 'super_admin';

    useEffect(() => {
        if (initialData) {
            setKodeAkun(initialData.kode_akun || '');
            setNamaAkun(initialData.nama_akun || '');
            setAkunType(initialData.akun_type || 'Asset');
            setSite(initialData.site || (siteType === 'all' ? 'pose' : siteType));
        } else {
            setKodeAkun('');
            setNamaAkun('');
            setAkunType('Asset');
            setSite(siteType === 'all' ? 'pose' : siteType);
        }
    }, [initialData, isOpen, siteType]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        if (!kodeAkun.trim() || !namaAkun.trim()) {
            setErrorMsg('Kode Akun dan Nama Akun wajib diisi.');
            return;
        }

        setLoading(true);

        const targetSite = isSuperAdmin ? site : (siteType === 'all' ? 'pose' : siteType);

        const res = await upsertMasterAccount({
            kode_akun: kodeAkun.trim(),
            nama_akun: namaAkun.trim(),
            akun_type: akunType,
            site: targetSite
        }, initialData?.id || null);

        setLoading(false);

        if (res.success) {
            onSuccess?.();
            onClose();
        } else {
            setErrorMsg(res.error || 'Gagal menyimpan data akun.');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden border border-gray-100 dark:border-gray-800">
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                        <Receipt size={20} />
                        <h3 className="font-extrabold text-base sm:text-lg text-gray-900 dark:text-white">
                            {initialData ? 'Edit Master Akun' : 'Tambah Master Akun (COA)'}
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
                <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
                    {errorMsg && (
                        <div className="p-3 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                            <AlertCircle size={16} className="shrink-0" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {/* Event / Site */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Event / Site Akses <span className="text-rose-500">*</span>
                        </label>
                        <select
                            value={site}
                            onChange={(e) => setSite(e.target.value)}
                            disabled={!isSuperAdmin}
                            className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/30 disabled:opacity-60 disabled:bg-gray-100 dark:disabled:bg-gray-800"
                        >
                            <option value="pose">POSE</option>
                            <option value="pkkmb">PKKMB</option>
                            <option value="portal">Portal Utama</option>
                        </select>
                        {!isSuperAdmin && (
                            <p className="text-[10px] text-gray-400 mt-1">Situs dikunci sesuai hak akses role Anda ({adminRole}).</p>
                        )}
                    </div>

                    {/* Kode Akun */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Kode Akun <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Contoh: 1001, 4001, 5001"
                            value={kodeAkun}
                            onChange={(e) => setKodeAkun(e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono focus:ring-2 focus:ring-emerald-500/30"
                        />
                    </div>

                    {/* Nama Akun */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Nama Akun <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Contoh: Kas, QRIS, Pendapatan Iuran, Beban Konsumsi"
                            value={namaAkun}
                            onChange={(e) => setNamaAkun(e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/30"
                        />
                    </div>

                    {/* Jenis Akun (Account Type) */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Jenis / Tipe Akun <span className="text-rose-500">*</span>
                        </label>
                        <select
                            value={akunType}
                            onChange={(e) => setAkunType(e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500/30 font-semibold"
                        >
                            <option value="Asset">Asset (Aset / Harta / Kas / Bank)</option>
                            <option value="Liability">Liability (Kewajiban / Hutang)</option>
                            <option value="Equity">Equity (Modal / Ekuitas)</option>
                            <option value="Revenue">Revenue (Pendapatan / Income)</option>
                            <option value="Expense">Expense (Beban / Pengeluaran)</option>
                        </select>
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
                            {loading ? 'Menyimpan...' : 'Simpan Akun'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
