'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Sliders,
    Save,
    RotateCcw,
    CheckCircle2,
    AlertTriangle,
    Info,
    Edit3,
    X,
    Check,
    Percent,
    Shield
} from 'lucide-react';
import { getCurrentAdmin } from '@/api/supabase/admin/auth';
import { hasAccess } from '@/lib/adminRoleData';
import {
    getMasterPenilaian,
    updateMasterPenilaian,
    updateBatchMasterPenilaian,
    resetMasterPenilaian
} from '@/api/supabase/admin/master_penilaian';

export default function MasterPenilaianPage() {
    const router = useRouter();
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('reguler'); // 'reguler' | 'nonreg'
    const [kriteriaList, setKriteriaList] = useState([]);
    const [editModal, setEditModal] = useState({ open: false, item: null });
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchKriteria = useCallback(async (kategori) => {
        setLoading(true);
        try {
            const res = await getMasterPenilaian({ kategori });
            if (res.success) {
                setKriteriaList(res.data || []);
            } else {
                showToast(res.error || 'Gagal memuat master penilaian', 'error');
            }
        } catch (err) {
            console.error('Error fetching master penilaian:', err);
            showToast('Terjadi kesalahan memuat data', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            try {
                const currentAdmin = await getCurrentAdmin();
                if (!currentAdmin) {
                    router.push('/panitia/login');
                    return;
                }
                if (!hasAccess(currentAdmin.role, '/panitia/pj_kabim/master_penilaian')) {
                    router.push('/panitia/dashboard');
                    return;
                }
                setAdmin(currentAdmin);
                await fetchKriteria(activeTab);
            } catch (err) {
                console.error('Init error:', err);
            }
        };
        init();
    }, [router, activeTab, fetchKriteria]);

    // Total bobot aktif saat ini
    const totalBobot = useMemo(() => {
        return kriteriaList
            .filter(item => item.aktif)
            .reduce((acc, curr) => acc + parseFloat(curr.bobot_persen || 0), 0);
    }, [kriteriaList]);

    const isTotalValid = Math.abs(totalBobot - 100) < 0.01;

    // Handle Edit Modal
    const handleOpenEdit = (item) => {
        setEditModal({
            open: true,
            item: {
                ...item,
                bobot_persen: item.bobot_persen,
                keterangan: item.keterangan || ''
            }
        });
    };

    const handleSaveEditModal = async () => {
        if (!editModal.item) return;
        setSaving(true);
        try {
            const res = await updateMasterPenilaian({
                id: editModal.item.id,
                bobot_persen: editModal.item.bobot_persen,
                aktif: editModal.item.aktif,
                keterangan: editModal.item.keterangan
            });

            if (res.success) {
                showToast('Kriteria berhasil diperbarui', 'success');
                setEditModal({ open: false, item: null });
                await fetchKriteria(activeTab);
            } else {
                showToast(res.error || 'Gagal memperbarui kriteria', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Terjadi kesalahan saat menyimpan', 'error');
        } finally {
            setSaving(false);
        }
    };

    // Handle Reset Default 20%
    const handleReset = async () => {
        if (!window.confirm(`Kembalikan bobot kriteria ${activeTab.toUpperCase()} ke masing-masing 20%?`)) {
            return;
        }
        setSaving(true);
        try {
            const res = await resetMasterPenilaian({ kategori: activeTab });
            if (res.success) {
                showToast(res.message || 'Bobot berhasil di-reset', 'success');
                await fetchKriteria(activeTab);
            } else {
                showToast(res.error || 'Gagal me-reset bobot', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Terjadi kesalahan me-reset data', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
            {/* Toast Notification */}
            {toast && (
                <div
                    className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium transition-all ${
                        toast.type === 'error'
                            ? 'bg-rose-600 text-white'
                            : 'bg-emerald-600 text-white'
                    }`}
                >
                    {toast.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
                    <span>{toast.message}</span>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-transparent p-6 rounded-2xl border border-blue-500/20">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20">
                        <Sliders size={26} />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                            Master Penilaian PKKMB 2026
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Kelola bobot 5 pilar penilaian kelulusan untuk kategori Reguler & Non-Reguler
                        </p>
                    </div>
                </div>

                {/* Reset Button */}
                <button
                    onClick={handleReset}
                    disabled={saving || loading}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-medium transition-all border border-slate-300 dark:border-slate-700"
                >
                    <RotateCcw size={16} />
                    Reset ke 20%
                </button>
            </div>

            {/* Tab Selector & Bobot Progress Bar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Tab Switcher */}
                <div className="lg:col-span-2 flex p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <button
                        onClick={() => setActiveTab('reguler')}
                        className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                            activeTab === 'reguler'
                                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/50 dark:border-slate-700'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <Percent size={16} />
                        Kategori Reguler
                    </button>
                    <button
                        onClick={() => setActiveTab('nonreg')}
                        className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                            activeTab === 'nonreg'
                                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm border border-slate-200/50 dark:border-slate-700'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <Percent size={16} />
                        Kategori Non-Reguler
                    </button>
                </div>

                {/* Status Ringkasan Bobot */}
                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Total Bobot Aktif
                        </span>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className={`text-2xl font-bold ${isTotalValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
                                {totalBobot.toFixed(1)}%
                            </span>
                            <span className="text-xs text-slate-400">/ 100%</span>
                        </div>
                    </div>
                    <div>
                        {isTotalValid ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                                <CheckCircle2 size={14} /> Tepat 100%
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                                <AlertTriangle size={14} /> Belum 100%
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Alert Warning Jika Belum 100% */}
            {!isTotalValid && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-3 text-amber-800 dark:text-amber-300 text-sm">
                    <AlertTriangle size={18} className="shrink-0" />
                    <span>
                        <strong>Perhatian:</strong> Total bobot kriteria saat ini adalah <strong>{totalBobot.toFixed(1)}%</strong>. Pastikan total bobot bernilai tepat <strong>100%</strong> agar kalkulasi nilai akhir adil dan akurat.
                    </span>
                </div>
            )}

            {/* Table Kriteria */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <h2 className="font-semibold text-slate-800 dark:text-slate-200 text-base">
                        Daftar 5 Kriteria Penilaian ({activeTab === 'reguler' ? 'Reguler' : 'Non-Reguler'})
                    </h2>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                        {kriteriaList.length} kriteria terdaftar
                    </span>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-slate-400">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                        Memuat master penilaian...
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-medium border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="py-3.5 px-4 w-12 text-center">#</th>
                                    <th className="py-3.5 px-4">Nama Kriteria</th>
                                    <th className="py-3.5 px-4">Kode</th>
                                    <th className="py-3.5 px-4 w-56">Bobot (%)</th>
                                    <th className="py-3.5 px-4">Status</th>
                                    <th className="py-3.5 px-4">Keterangan</th>
                                    <th className="py-3.5 px-4 text-center w-24">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {kriteriaList.map((item, index) => (
                                    <tr
                                        key={item.id}
                                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                                    >
                                        <td className="py-3.5 px-4 text-center font-medium text-slate-400">
                                            {index + 1}
                                        </td>
                                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                                            {item.nama_kriteria}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span className="px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                                {item.kode_kriteria}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between items-center text-xs font-semibold">
                                                    <span className="text-slate-700 dark:text-slate-300">
                                                        {parseFloat(item.bobot_persen).toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all"
                                                        style={{ width: `${Math.min(100, item.bobot_persen)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            {item.aktif ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                                                    <Check size={12} /> Aktif
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                                                    Nonaktif
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate">
                                            {item.keterangan || '-'}
                                        </td>
                                        <td className="py-3.5 px-4 text-center">
                                            <button
                                                onClick={() => handleOpenEdit(item)}
                                                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors"
                                                title="Edit Bobot Kriteria"
                                            >
                                                <Edit3 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Edit Kriteria */}
            {editModal.open && editModal.item && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                    Edit Bobot Kriteria
                                </h3>
                                <p className="text-xs text-slate-500">
                                    {editModal.item.nama_kriteria} ({editModal.item.kategori_peserta?.toUpperCase()})
                                </p>
                            </div>
                            <button
                                onClick={() => setEditModal({ open: false, item: null })}
                                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                    Bobot Persentase (%)
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.5"
                                        value={editModal.item.bobot_persen}
                                        onChange={(e) =>
                                            setEditModal(prev => ({
                                                ...prev,
                                                item: { ...prev.item, bobot_persen: e.target.value }
                                            }))
                                        }
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none pr-10 font-semibold"
                                    />
                                    <span className="absolute right-3.5 top-3 text-slate-400 font-bold text-sm">%</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                    Keterangan / Deskripsi
                                </label>
                                <textarea
                                    rows="3"
                                    value={editModal.item.keterangan || ''}
                                    onChange={(e) =>
                                        setEditModal(prev => ({
                                            ...prev,
                                            item: { ...prev.item, keterangan: e.target.value }
                                        }))
                                    }
                                    placeholder="Penjelasan kriteria penilaian ini..."
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="aktif-toggle"
                                    checked={editModal.item.aktif}
                                    onChange={(e) =>
                                        setEditModal(prev => ({
                                            ...prev,
                                            item: { ...prev.item, aktif: e.target.checked }
                                        }))
                                    }
                                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="aktif-toggle" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Aktifkan kriteria ini dalam perhitungan
                                </label>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setEditModal({ open: false, item: null })}
                                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveEditModal}
                                disabled={saving}
                                className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
                            >
                                <Save size={16} />
                                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
