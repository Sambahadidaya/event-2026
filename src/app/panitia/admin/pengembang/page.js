'use client';

import { useState, useEffect } from 'react';
import {
    getAdminStatusPengembangan,
    updateStatusPengembangan,
    addPengembanganRoute,
    deletePengembanganRoute,
    toggleAllBySite
} from '@/api/supabase/admin/pengembang';
import {
    Wrench,
    Lock,
    Unlock,
    RefreshCw,
    AlertCircle,
    Terminal,
    Plus,
    Trash2,
    CheckCircle2,
    Shield,
    X,
    FolderKanban,
    Globe
} from 'lucide-react';

export default function PengembangAdminPage() {
    const [routesData, setRoutesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [message, setMessage] = useState(null);

    // Active site tab: 'pkkmb' | 'pose' | 'all'
    const [activeTab, setActiveTab] = useState('pkkmb');

    // Add route modal state
    const [showAddModal, setShowAddModal] = useState(false);
    const [newRouteForm, setNewRouteForm] = useState({
        site: 'pkkmb',
        route: '',
        label: '',
        kunci: false
    });
    const [formSubmitting, setFormSubmitting] = useState(false);

    // Delete confirmation state
    const [deleteTarget, setDeleteTarget] = useState(null);

    const fetchStatus = async () => {
        setLoading(true);
        const res = await getAdminStatusPengembangan();
        if (res.success) {
            setRoutesData(res.data || []);
        } else {
            showMessage(res.error || 'Gagal memuat status pengembangan', 'error');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    const showMessage = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 5000);
    };

    const handleToggleKunci = async (item) => {
        setActionLoadingId(item.id);
        const newKunci = !item.kunci;
        const res = await updateStatusPengembangan(item.id, newKunci);
        if (res.success) {
            setRoutesData(prev =>
                prev.map(r => r.id === item.id ? { ...r, kunci: newKunci } : r)
            );
            showMessage(
                `Kunci [${item.site.toUpperCase()}] "${item.label}" berhasil ${newKunci ? 'diaktifkan (terkunci)' : 'dinonaktifkan (terbuka)'}!`,
                'success'
            );
        } else {
            showMessage(res.error || 'Gagal memperbarui status kunci', 'error');
        }
        setActionLoadingId(null);
    };

    const handleBulkToggle = async (site, targetKunci) => {
        setBulkLoading(true);
        const res = await toggleAllBySite(site, targetKunci);
        if (res.success) {
            setRoutesData(prev =>
                prev.map(r => r.site === site ? { ...r, kunci: targetKunci } : r)
            );
            showMessage(
                `Seluruh halaman [${site.toUpperCase()}] berhasil ${targetKunci ? 'dikunci' : 'dibuka'}!`,
                'success'
            );
        } else {
            showMessage(res.error || 'Gagal mengubah seluruh status kunci', 'error');
        }
        setBulkLoading(false);
    };

    const handleAddRouteSubmit = async (e) => {
        e.preventDefault();
        if (!newRouteForm.route || !newRouteForm.label) {
            showMessage('Rute dan Label wajib diisi!', 'error');
            return;
        }

        setFormSubmitting(true);
        const res = await addPengembanganRoute(
            newRouteForm.site,
            newRouteForm.route,
            newRouteForm.label,
            newRouteForm.kunci
        );

        if (res.success) {
            showMessage(`Rute kuncian "${newRouteForm.label}" berhasil ditambahkan!`, 'success');
            setNewRouteForm({ site: activeTab === 'all' ? 'pkkmb' : activeTab, route: '', label: '', kunci: false });
            setShowAddModal(false);
            fetchStatus();
        } else {
            showMessage(res.error || 'Gagal menambahkan rute kuncian baru', 'error');
        }
        setFormSubmitting(false);
    };

    const handleDeleteRoute = async () => {
        if (!deleteTarget) return;
        setActionLoadingId(deleteTarget.id);
        const res = await deletePengembanganRoute(deleteTarget.id);
        if (res.success) {
            setRoutesData(prev => prev.filter(r => r.id !== deleteTarget.id));
            showMessage(`Rute kuncian "${deleteTarget.label}" berhasil dihapus.`, 'success');
            setDeleteTarget(null);
        } else {
            showMessage(res.error || 'Gagal menghapus rute kuncian', 'error');
        }
        setActionLoadingId(null);
    };

    // Filtered data by active tab
    const pkkmbRoutes = routesData.filter(r => r.site === 'pkkmb');
    const poseRoutes = routesData.filter(r => r.site === 'pose');
    const displayedRoutes = activeTab === 'all'
        ? routesData
        : activeTab === 'pkkmb'
            ? pkkmbRoutes
            : poseRoutes;

    const lockedCountPkkmb = pkkmbRoutes.filter(r => r.kunci).length;
    const lockedCountPose = poseRoutes.filter(r => r.kunci).length;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium animate-pulse">Memuat data pengembangan...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Title / Action bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Wrench size={22} className="text-violet-600 dark:text-violet-400 animate-spin-slow" />
                        Mode Pengembangan (Barrier per Site)
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Atur status kunci (barrier) halaman publik untuk site PKKMB dan POSE secara terpisah.
                    </p>
                </div>
                <div className="flex items-center gap-2.5">
                    <button
                        onClick={() => {
                            setNewRouteForm({
                                site: activeTab === 'all' ? 'pkkmb' : activeTab,
                                route: '',
                                label: '',
                                kunci: false
                            });
                            setShowAddModal(true);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
                    >
                        <Plus size={16} />
                        <span>Tambah Route Kuncian</span>
                    </button>
                    <button
                        onClick={fetchStatus}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-all active:scale-95"
                        title="Segarkan data"
                    >
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>

            {/* Toast Message */}
            {message && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 border animate-in slide-in-from-top-4 duration-300 shadow-md ${message.type === 'error'
                    ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900/50 text-red-700 dark:text-red-400'
                    : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400'
                    }`}>
                    <AlertCircle size={20} className="shrink-0" />
                    <p className="text-sm font-semibold">{message.text}</p>
                </div>
            )}

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-900/80 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 w-fit">
                <button
                    onClick={() => setActiveTab('pkkmb')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'pkkmb'
                        ? 'bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                >
                    <FolderKanban size={15} />
                    <span>Site PKKMB</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${lockedCountPkkmb > 0
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                        : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                        }`}>
                        {lockedCountPkkmb}/{pkkmbRoutes.length} Dikunci
                    </span>
                </button>

                <button
                    onClick={() => setActiveTab('pose')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'pose'
                        ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                >
                    <FolderKanban size={15} />
                    <span>Site POSE</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${lockedCountPose > 0
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                        : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                        }`}>
                        {lockedCountPose}/{poseRoutes.length} Dikunci
                    </span>
                </button>

                <button
                    onClick={() => setActiveTab('all')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'all'
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                >
                    <Globe size={15} />
                    <span>Semua ({routesData.length})</span>
                </button>
            </div>

            {/* Bulk Actions Header (if tab is pkkmb or pose) */}
            {activeTab !== 'all' && (
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${activeTab === 'pkkmb' ? 'bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400'}`}>
                            <Shield size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                                Bulk Control — Site {activeTab.toUpperCase()}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Kunci atau buka sekaligus semua halaman pada site {activeTab.toUpperCase()}.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleBulkToggle(activeTab, false)}
                            disabled={bulkLoading}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-900/50 transition-all disabled:opacity-50"
                        >
                            <Unlock size={14} />
                            <span>Buka Semua {activeTab.toUpperCase()}</span>
                        </button>
                        <button
                            onClick={() => handleBulkToggle(activeTab, true)}
                            disabled={bulkLoading}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-900/50 transition-all disabled:opacity-50"
                        >
                            <Lock size={14} />
                            <span>Kunci Semua {activeTab.toUpperCase()}</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Main Route List */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden p-6 sm:p-8 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                    <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <span>Daftar Kuncian Halaman</span>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-normal">
                            {displayedRoutes.length} rute terdaftar
                        </span>
                    </h3>
                </div>

                {displayedRoutes.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm font-medium">Belum ada rute kuncian terdaftar untuk filter ini.</p>
                        <p className="text-xs mt-1">Klik tombol &quot;Tambah Route Kuncian&quot; di atas untuk menambahkan.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {displayedRoutes.map((item) => {
                            const isLocked = Boolean(item.kunci);
                            const isLoadingThis = actionLoadingId === item.id;

                            return (
                                <div
                                    key={item.id}
                                    className={`p-5 rounded-2xl border transition-all flex items-center justify-between gap-4 ${isLocked
                                        ? 'bg-amber-50/40 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/30'
                                        : 'bg-slate-50/60 dark:bg-slate-800/30 border-slate-200/80 dark:border-slate-800/80'
                                        }`}
                                >
                                    <div className="space-y-1 min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${item.site === 'pkkmb'
                                                ? 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300'
                                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                }`}>
                                                {item.site}
                                            </span>
                                            <h4 className="text-sm font-bold text-slate-800 dark:text-white truncate">
                                                {item.label || item.route}
                                            </h4>
                                        </div>

                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
                                            <Terminal size={12} className="shrink-0 text-slate-400" />
                                            <span className="truncate">/{item.site}{item.route}</span>
                                        </div>
                                    </div>

                                    {/* Action items */}
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${isLocked
                                            ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
                                            : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                                            }`}>
                                            {isLocked ? <Lock size={10} /> : <Unlock size={10} />}
                                            <span>{isLocked ? 'Terkunci' : 'Terbuka'}</span>
                                        </span>

                                        <button
                                            onClick={() => handleToggleKunci(item)}
                                            disabled={isLoadingThis}
                                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none focus:ring-2 focus:ring-violet-500 ${isLocked ? 'bg-violet-600' : 'bg-slate-300 dark:bg-slate-700'
                                                } ${isLoadingThis ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            title={isLocked ? 'Klik untuk membuka halaman' : 'Klik untuk mengunci halaman'}
                                        >
                                            <span
                                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isLocked ? 'translate-x-5' : 'translate-x-0'
                                                    }`}
                                            />
                                        </button>

                                        <button
                                            onClick={() => setDeleteTarget(item)}
                                            className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
                                            title="Hapus rute kuncian ini"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal Tambah Route */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-6 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <Plus size={18} className="text-violet-600 dark:text-violet-400" />
                                Tambah Rute Kuncian Baru
                            </h3>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleAddRouteSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Target Site
                                </label>
                                <select
                                    value={newRouteForm.site}
                                    onChange={(e) => setNewRouteForm({ ...newRouteForm, site: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                                >
                                    <option value="pkkmb">PKKMB</option>
                                    <option value="pose">POSE</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Label Tampilan
                                </label>
                                <input
                                    type="text"
                                    placeholder="Contoh: Jadwal Pertandingan, Kelompok, dsb."
                                    value={newRouteForm.label}
                                    onChange={(e) => setNewRouteForm({ ...newRouteForm, label: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Rute URL (Sub-path)
                                </label>
                                <div className="flex items-center gap-2">
                                    <span className="px-3 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-500 font-bold">
                                        /{newRouteForm.site}
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="/kelompok atau /jadwal"
                                        value={newRouteForm.route}
                                        onChange={(e) => setNewRouteForm({ ...newRouteForm, route: e.target.value })}
                                        className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/70 dark:border-slate-800">
                                <div>
                                    <span className="block text-xs font-bold text-slate-800 dark:text-white">Status Awal Kunci</span>
                                    <span className="block text-[11px] text-slate-500">Kunci halaman langsung saat ditambahkan?</span>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={newRouteForm.kunci}
                                    onChange={(e) => setNewRouteForm({ ...newRouteForm, kunci: e.target.checked })}
                                    className="w-4 h-4 text-violet-600 rounded focus:ring-violet-500 cursor-pointer"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={formSubmitting}
                                    className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                                >
                                    {formSubmitting ? 'Menyimpan...' : 'Simpan Rute Kuncian'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Konfirmasi Hapus */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in zoom-in-95 duration-200 text-center">
                        <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-950/50 rounded-full flex items-center justify-center text-red-600 dark:text-red-400">
                            <Trash2 size={24} />
                        </div>

                        <div className="space-y-1">
                            <h3 className="text-base font-bold text-slate-800 dark:text-white">
                                Hapus Rute Kuncian?
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                Halaman <span className="font-bold text-slate-700 dark:text-slate-200">&quot;{deleteTarget.label}&quot;</span> (/{deleteTarget.site}{deleteTarget.route}) tidak akan lagi dilindungi oleh barrier pengembang.
                            </p>
                        </div>

                        <div className="flex items-center justify-center gap-3 pt-2">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                className="w-1/2 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleDeleteRoute}
                                className="w-1/2 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                            >
                                Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
