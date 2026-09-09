'use client';

import { useState, useEffect } from 'react';
import { getBerita } from '@/api/supabase/public/berita';
import { upsertBerita, deleteBerita, deleteMultipleBerita } from '@/api/supabase/admin/berita';
import { getCurrentAdmin } from '@/api/supabase/admin/auth';
import { RefreshCw, Plus, Trash2, Search, FileText, Edit2, Newspaper, X, Check, Calendar } from 'lucide-react';

export default function AdminBeritaMultimediaManager({ initialSite = 'pkkmb' }) {
    const [site, setSite] = useState(initialSite);
    const [adminRole, setAdminRole] = useState(null);
    const [berita, setBerita] = useState([]);
    const [filter, setFilter] = useState('');
    
    // Modal & Form States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [customDate, setCustomDate] = useState('');
    const [editingId, setEditingId] = useState(null);
    
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Bulk action state
    const [selectedIds, setSelectedIds] = useState([]);

    // Check admin role
    useEffect(() => {
        const fetchAdmin = async () => {
            const admin = await getCurrentAdmin();
            if (admin) {
                setAdminRole(admin.role);
                if (admin.role !== 'super_admin') {
                    if (admin.role.includes('pose')) {
                        setSite('pose');
                    } else {
                        setSite('pkkmb');
                    }
                }
            }
        };
        fetchAdmin();
    }, []);

    const fetchBerita = async (currentSite = site) => {
        setLoading(true);
        const cacheKey = `${currentSite}_berita`;
        const cacheTimeKey = `${currentSite}_berita_time`;
        const cached = localStorage.getItem(cacheKey);
        const cacheTime = localStorage.getItem(cacheTimeKey);
        const ONE_DAY = 86400000;

        if (cached && cacheTime && (Date.now() - parseInt(cacheTime)) < ONE_DAY) {
            try {
                setBerita(JSON.parse(cached));
                setLoading(false);
                return;
            } catch {
                // fall through to fetch
            }
        }

        const data = await getBerita(currentSite);
        if (data) {
            setBerita(data);
            localStorage.setItem(cacheKey, JSON.stringify(data));
            localStorage.setItem(cacheTimeKey, Date.now().toString());
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchBerita(site);
        setSelectedIds([]);
    }, [site]);

    const handleRefresh = () => {
        localStorage.removeItem(`${site}_berita`);
        localStorage.removeItem(`${site}_berita_time`);
        fetchBerita(site);
        setSelectedIds([]);
    };

    const openAddModal = () => {
        setEditingId(null);
        setTitle('');
        setContent('');
        setCustomDate('');
        setIsModalOpen(true);
    };

    const handleEditClick = (item) => {
        setEditingId(item.id);
        setTitle(item.title || '');
        setContent(item.content || '');
        setCustomDate(item.custom_date || '');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setTitle('');
        setContent('');
        setCustomDate('');
    };

    const handleAddOrUpdate = async (e) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) {
            alert('Judul dan isi berita wajib diisi.');
            return;
        }

        setIsSubmitting(true);
        
        const payload = { 
            title: title.trim(), 
            content: content.trim(), 
            type: site,
            custom_date: customDate || null 
        };

        const res = await upsertBerita(payload, editingId);

        if (res.success) {
            closeModal();
            handleRefresh();
        } else {
            alert('Gagal menyimpan: ' + (res.error || 'Terjadi kesalahan'));
        }
        setIsSubmitting(false);
    };

    const handleDelete = async (id) => {
        if (!confirm('Apakah Anda yakin ingin menghapus berita ini secara permanen?')) return;
        const res = await deleteBerita(id);
        if (res.success) handleRefresh();
        else alert('Gagal menghapus: ' + (res.error || 'Terjadi kesalahan'));
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Hapus ${selectedIds.length} data terpilih secara permanen?`)) return;
        const res = await deleteMultipleBerita(selectedIds);
        if (res.success) handleRefresh();
        else alert('Gagal menghapus terpilih');
    };

    const filteredBerita = berita.filter(b => 
        b.title.toLowerCase().includes(filter.toLowerCase()) ||
        b.content?.toLowerCase().includes(filter.toLowerCase())
    );

    const toggleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(filteredBerita.map(b => b.id));
        } else {
            setSelectedIds([]);
        }
    };

    const toggleSelect = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(itemId => itemId !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const isSuperAdmin = adminRole === 'super_admin';

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-16 animate-in fade-in duration-500">
            {/* Header & Site Switcher */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md">
                <div>
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${site === 'pkkmb' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'}`}>
                            <Newspaper size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">
                                Manajemen Berita & Informasi {site.toUpperCase()}
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                Kelola pengumuman resmi, siaran pers, dan berita seputar kegiatan {site.toUpperCase()}.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Site Switcher for Super Admin */}
                {isSuperAdmin ? (
                    <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={() => { setSite('pkkmb'); }}
                            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${site === 'pkkmb' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}
                        >
                            PKKMB
                        </button>
                        <button
                            type="button"
                            onClick={() => { setSite('pose'); }}
                            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${site === 'pose' ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}
                        >
                            POSE
                        </button>
                    </div>
                ) : (
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider ${site === 'pkkmb' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'}`}>
                        Portal {site.toUpperCase()}
                    </span>
                )}
            </div>

            {/* Content Table Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
                {/* Actions Toolbar */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-80 flex-shrink-0">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><Search size={16} /></div>
                        <input
                            type="text"
                            placeholder="Cari berdasarkan judul atau isi..."
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                            className="w-full pl-10 p-2.5 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                        />
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                        {selectedIds.length > 0 && (
                            <button
                                onClick={handleBulkDelete}
                                className="flex items-center gap-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/30 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors shadow-sm whitespace-nowrap"
                            >
                                <Trash2 size={16} /> Hapus ({selectedIds.length})
                            </button>
                        )}
                        <button
                            onClick={handleRefresh}
                            className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm whitespace-nowrap"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin text-blue-500' : 'text-slate-500'} />
                            Refresh
                        </button>
                        <button
                            onClick={openAddModal}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-md transition-all ${site === 'pkkmb' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25'}`}
                        >
                            <Plus size={16} />
                            Tambah Berita
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider font-semibold">
                            <tr>
                                <th className="px-6 py-4 w-12">
                                    <input 
                                        type="checkbox" 
                                        className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-slate-800"
                                        checked={filteredBerita.length > 0 && selectedIds.length === filteredBerita.length}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th className="px-6 py-4 w-1/3">Judul Berita</th>
                                <th className="px-6 py-4 w-1/2">Cuplikan Konten</th>
                                <th className="px-6 py-4 w-1/6 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredBerita.map(item => (
                                <tr key={item.id} className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${selectedIds.includes(item.id) ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''}`}>
                                    <td className="px-6 py-4">
                                        <input 
                                            type="checkbox" 
                                            className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 bg-white dark:bg-slate-800"
                                            checked={selectedIds.includes(item.id)}
                                            onChange={() => toggleSelect(item.id)}
                                        />
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">
                                        <div className="line-clamp-2">{item.title}</div>
                                        <div className="flex flex-wrap gap-2 items-center mt-1.5">
                                            <span className="text-xs text-slate-400 font-normal">
                                                Dibuat: {item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : '-'}
                                            </span>
                                            {item.custom_date && (
                                                <span className="text-[11px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                                                    <Calendar size={11} /> Kegiatan: {new Date(item.custom_date).toLocaleDateString('id-ID')}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                        <div className="line-clamp-2 text-xs sm:text-sm">{item.content}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleEditClick(item)}
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                                                title="Edit Berita"
                                            >
                                                <Edit2 size={15} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
                                                title="Hapus Berita"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredBerita.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-6 py-16 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center">
                                            <FileText size={48} className="text-slate-300 dark:text-slate-600 mb-3" />
                                            <p className="text-base font-semibold text-slate-700 dark:text-slate-300">Tidak ada berita ditemukan</p>
                                            <p className="text-xs text-slate-400 mt-1">Data berita kosong atau kata kunci pencarian tidak cocok.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Overlay Form Tambah / Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                            <div className="flex items-center gap-2.5 font-bold text-slate-800 dark:text-white text-base sm:text-lg">
                                {editingId ? <Edit2 size={20} className="text-amber-500" /> : <FileText size={20} className="text-blue-500" />}
                                <span>{editingId ? `Edit Berita ${site.toUpperCase()}` : `Buat Berita Baru ${site.toUpperCase()}`}</span>
                            </div>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleAddOrUpdate} className="p-6 overflow-y-auto space-y-5 flex-1">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Judul Informasi <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    required
                                    type="text"
                                    placeholder="Masukkan judul berita/informasi..."
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className="w-full px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Tanggal Kegiatan (Opsional)
                                </label>
                                <input
                                    type="date"
                                    value={customDate}
                                    onChange={e => setCustomDate(e.target.value)}
                                    className="w-full px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Isi Konten Lengkap <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    required
                                    placeholder="Tuliskan detail informasi di sini..."
                                    rows={6}
                                    value={content}
                                    onChange={e => setContent(e.target.value)}
                                    className="w-full p-4 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none text-slate-900 dark:text-white leading-relaxed"
                                />
                            </div>

                            {/* Modal Footer */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs sm:text-sm font-medium transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`px-6 py-2.5 rounded-xl font-medium text-xs sm:text-sm flex items-center gap-2 text-white shadow-md transition-all ${
                                        editingId
                                            ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/25'
                                            : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25'
                                    } disabled:opacity-50`}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <RefreshCw size={16} className="animate-spin" />
                                            <span>Menyimpan...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Check size={16} />
                                            <span>{editingId ? 'Perbarui Berita' : 'Publikasikan Berita'}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
