'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    ShieldAlert,
    Search,
    Edit3,
    CheckCircle2,
    AlertTriangle,
    Save,
    X,
    Shield,
    Zap,
    AlertCircle,
    RotateCcw
} from 'lucide-react';
import { getCurrentAdmin } from '@/api/supabase/admin/auth';
import { hasAccess } from '@/lib/adminRoleData';
import {
    getDefaultPoinPelanggaran,
    updateDefaultPoinPelanggaran,
    getMasterPelanggaranWithPoin,
    updatePoinPelanggaranItem
} from '@/api/supabase/admin/master_nilai_pelanggaran';

export default function MasterNilaiPelanggaranPage() {
    const router = useRouter();
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [defaultPoinList, setDefaultPoinList] = useState([]);
    const [pelanggaranList, setPelanggaranList] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterJenis, setFilterJenis] = useState('all');

    // Modals
    const [editItemModal, setEditItemModal] = useState({ open: false, item: null });
    const [editCategoryModal, setEditCategoryModal] = useState({ open: false, category: null });

    // Toast
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [defRes, itemRes] = await Promise.all([
                getDefaultPoinPelanggaran(),
                getMasterPelanggaranWithPoin()
            ]);

            if (defRes.success) setDefaultPoinList(defRes.data || []);
            if (itemRes.success) setPelanggaranList(itemRes.data || []);

            if (!defRes.success || !itemRes.success) {
                showToast('Gagal memuat sebagian data pelanggaran', 'error');
            }
        } catch (err) {
            console.error('Error fetching data:', err);
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
                if (!hasAccess(currentAdmin.role, '/panitia/pj_kabim/master_nilai_pelanggaran')) {
                    router.push('/panitia/dashboard');
                    return;
                }
                setAdmin(currentAdmin);
                await fetchData();
            } catch (err) {
                console.error(err);
            }
        };
        init();
    }, [router, fetchData]);

    // Filter list
    const filteredList = useMemo(() => {
        return pelanggaranList.filter(item => {
            const matchQuery = (item.nama_pelanggaran || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchJenis = filterJenis === 'all' || item.jenis_pelanggaran === filterJenis;
            return matchQuery && matchJenis;
        });
    }, [pelanggaranList, searchQuery, filterJenis]);

    // Save Poin Item
    const handleSaveItemModal = async () => {
        if (!editItemModal.item) return;
        setSaving(true);
        try {
            const res = await updatePoinPelanggaranItem({
                id: editItemModal.item.id,
                poin_pengurangan: editItemModal.item.poin_pengurangan
            });
            if (res.success) {
                showToast('Poin pelanggaran berhasil diperbarui', 'success');
                setEditItemModal({ open: false, item: null });
                await fetchData();
            } else {
                showToast(res.error || 'Gagal memperbarui poin', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Terjadi kesalahan saat menyimpan', 'error');
        } finally {
            setSaving(false);
        }
    };

    // Save Poin Default Kategori
    const handleSaveCategoryModal = async () => {
        if (!editCategoryModal.category) return;
        setSaving(true);
        try {
            const res = await updateDefaultPoinPelanggaran({
                jenis_pelanggaran: editCategoryModal.category.jenis_pelanggaran,
                default_poin: editCategoryModal.category.default_poin,
                apply_to_all_existing: editCategoryModal.category.apply_to_all_existing
            });
            if (res.success) {
                showToast('Default poin kategori berhasil diperbarui', 'success');
                setEditCategoryModal({ open: false, category: null });
                await fetchData();
            } else {
                showToast(res.error || 'Gagal memperbarui default kategori', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Terjadi kesalahan saat menyimpan', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
            {/* Toast */}
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-rose-600/10 via-amber-600/10 to-transparent p-6 rounded-2xl border border-rose-500/20">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-rose-600 text-white rounded-xl shadow-lg shadow-rose-500/20">
                        <ShieldAlert size={26} />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                            Master Nilai Pengurangan Pelanggaran
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Konfigurasi poin pengurangan untuk kriteria Kedisiplinan peserta PKKMB 2026
                        </p>
                    </div>
                </div>
            </div>

            {/* Category Cards (Ringan / Sedang / Berat) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {['Ringan', 'Sedang', 'Berat'].map(jenis => {
                    const defObj = defaultPoinList.find(d => d.jenis_pelanggaran === jenis);
                    const defaultPoin = defObj ? Number(defObj.default_poin) : (jenis === 'Ringan' ? 2 : jenis === 'Sedang' ? 5 : 10);
                    const totalItem = pelanggaranList.filter(p => p.jenis_pelanggaran === jenis).length;

                    const colorTheme = jenis === 'Ringan'
                        ? { bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-900', text: 'text-blue-700 dark:text-blue-400', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300' }
                        : jenis === 'Sedang'
                        ? { bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-900', text: 'text-amber-700 dark:text-amber-400', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300' }
                        : { bg: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-200 dark:border-rose-900', text: 'text-rose-700 dark:text-rose-400', badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300' };

                    return (
                        <div
                            key={jenis}
                            className={`p-5 rounded-2xl border ${colorTheme.bg} ${colorTheme.border} shadow-sm space-y-3 relative overflow-hidden`}
                        >
                            <div className="flex items-center justify-between">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${colorTheme.badge}`}>
                                    Kategori {jenis}
                                </span>
                                <button
                                    onClick={() =>
                                        setEditCategoryModal({
                                            open: true,
                                            category: {
                                                jenis_pelanggaran: jenis,
                                                default_poin: defaultPoin,
                                                apply_to_all_existing: false
                                            }
                                        })
                                    }
                                    className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-white/60 dark:hover:bg-slate-800/60 transition-colors"
                                    title={`Edit Default Poin ${jenis}`}
                                >
                                    <Edit3 size={15} />
                                </button>
                            </div>

                            <div className="flex items-baseline gap-2">
                                <span className={`text-3xl font-extrabold ${colorTheme.text}`}>
                                    -{defaultPoin}
                                </span>
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                    Poin / Pelanggaran
                                </span>
                            </div>

                            <div className="text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-800/60 flex justify-between items-center">
                                <span>Total Aturan: <strong>{totalItem}</strong> jenis</span>
                                <span className="text-[11px] italic">Default Poin</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
                <div className="relative w-full md:w-80">
                    <Search size={17} className="absolute left-3.5 top-3 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari nama pelanggaran..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    {['all', 'Ringan', 'Sedang', 'Berat'].map(type => (
                        <button
                            key={type}
                            onClick={() => setFilterJenis(type)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                filterJenis === type
                                    ? 'bg-rose-600 text-white shadow-sm'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                        >
                            {type === 'all' ? 'Semua' : type}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table Pelanggaran */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                {loading ? (
                    <div className="p-12 text-center text-slate-400">
                        <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                        Memuat data master pelanggaran...
                    </div>
                ) : filteredList.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="font-medium text-sm">Tidak ada pelanggaran yang sesuai filter.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-medium border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="py-3.5 px-4 w-12 text-center">#</th>
                                    <th className="py-3.5 px-4">Nama Pelanggaran</th>
                                    <th className="py-3.5 px-4 w-36">Kategori</th>
                                    <th className="py-3.5 px-4 w-44">Poin Pengurangan</th>
                                    <th className="py-3.5 px-4 text-center w-24">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {filteredList.map((item, idx) => {
                                    const poin = item.poin_pengurangan !== undefined && item.poin_pengurangan !== null
                                        ? Number(item.poin_pengurangan)
                                        : (item.jenis_pelanggaran === 'Berat' ? 10 : item.jenis_pelanggaran === 'Ringan' ? 2 : 5);

                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="py-3.5 px-4 text-center font-medium text-slate-400 text-xs">
                                                {idx + 1}
                                            </td>
                                            <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                                                {item.nama_pelanggaran}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                    item.jenis_pelanggaran === 'Berat'
                                                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                                        : item.jenis_pelanggaran === 'Sedang'
                                                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                                        : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                                                }`}>
                                                    {item.jenis_pelanggaran}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span className="inline-flex items-center gap-1 font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900 text-xs">
                                                    -{poin} Poin
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                <button
                                                    onClick={() =>
                                                        setEditItemModal({
                                                            open: true,
                                                            item: { ...item, poin_pengurangan: poin }
                                                        })
                                                    }
                                                    className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                                                    title="Ubah Poin Item Ini"
                                                >
                                                    <Edit3 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Edit Poin Pelanggaran Satuan */}
            {editItemModal.open && editItemModal.item && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                    Edit Poin Pengurangan
                                </h3>
                                <p className="text-xs text-slate-500">
                                    {editItemModal.item.nama_pelanggaran}
                                </p>
                            </div>
                            <button
                                onClick={() => setEditItemModal({ open: false, item: null })}
                                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                Poin Pengurangan (Minus)
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="1"
                                value={editItemModal.item.poin_pengurangan}
                                onChange={(e) =>
                                    setEditItemModal(prev => ({
                                        ...prev,
                                        item: { ...prev.item, poin_pengurangan: e.target.value }
                                    }))
                                }
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none font-bold text-base"
                            />
                            <p className="text-xs text-slate-400">
                                Poin ini akan mengurangi nilai kedisiplinan peserta setiap kali melakukan pelanggaran ini.
                            </p>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setEditItemModal({ open: false, item: null })}
                                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveItemModal}
                                disabled={saving}
                                className="px-5 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-500/20 flex items-center gap-2"
                            >
                                <Save size={16} />
                                {saving ? 'Menyimpan...' : 'Simpan Poin'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Edit Default Poin Kategori */}
            {editCategoryModal.open && editCategoryModal.category && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                    Edit Default Poin: {editCategoryModal.category.jenis_pelanggaran}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Atur standar poin pengurangan kategori ini
                                </p>
                            </div>
                            <button
                                onClick={() => setEditCategoryModal({ open: false, category: null })}
                                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                    Nilai Default Poin
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="1"
                                    value={editCategoryModal.category.default_poin}
                                    onChange={(e) =>
                                        setEditCategoryModal(prev => ({
                                            ...prev,
                                            category: { ...prev.category, default_poin: e.target.value }
                                        }))
                                    }
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none font-bold text-base"
                                />
                            </div>

                            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                                <label className="flex items-start gap-2.5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editCategoryModal.category.apply_to_all_existing}
                                        onChange={(e) =>
                                            setEditCategoryModal(prev => ({
                                                ...prev,
                                                category: { ...prev.category, apply_to_all_existing: e.target.checked }
                                            }))
                                        }
                                        className="w-4 h-4 mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                                    />
                                    <span className="text-xs text-slate-700 dark:text-slate-300">
                                        <strong>Terapkan ke semua aturan saat ini</strong> yang berada di kategori {editCategoryModal.category.jenis_pelanggaran}.
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setEditCategoryModal({ open: false, category: null })}
                                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveCategoryModal}
                                disabled={saving}
                                className="px-5 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-500/20 flex items-center gap-2"
                            >
                                <Save size={16} />
                                {saving ? 'Menyimpan...' : 'Simpan Default'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
