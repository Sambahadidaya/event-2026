'use client';

import { useState, useEffect, useMemo } from 'react';
import { Video, Plus, Trash2, Edit2, Search, RefreshCw, Play, Upload, X, Check } from 'lucide-react';
import { getKontenMultimedia } from '@/api/supabase/public/dokumentasi';
import { upsertKontenMultimedia, deleteKontenMultimedia } from '@/api/supabase/admin/dokumentasi';
import { uploadFile } from '@/api/supabase/storage';
import { getCurrentAdmin } from '@/api/supabase/admin/auth';
import { extractDriveFileId, getDriveEmbedUrl } from '@/lib/driveUtils';

export default function AdminKontenMultimediaManager({ initialSite = 'pkkmb' }) {
    const [site, setSite] = useState(initialSite);
    const [adminRole, setAdminRole] = useState(null);
    const [kontenList, setKontenList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDate, setFilterDate] = useState('');

    // Modal & Form states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [judul, setJudul] = useState('');
    const [deskripsi, setDeskripsi] = useState('');
    const [tanggal, setTanggal] = useState('');
    const [linkGdriveVideo, setLinkGdriveVideo] = useState('');
    const [thumbnail, setThumbnail] = useState('');
    const [uploadingImage, setUploadingImage] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeVideoModal, setActiveVideoModal] = useState(null);

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

    const fetchList = async (currentSite = site) => {
        setLoading(true);
        try {
            const data = await getKontenMultimedia(currentSite);
            setKontenList(data || []);
        } catch (err) {
            console.error('Error fetching konten multimedia list:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchList(site);
    }, [site]);

    // Thumbnail upload handler
    const handleThumbnailUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await uploadFile(formData, 'dokumentasi-header', 'konten-thumbs/');
            if (res.success && res.url) {
                setThumbnail(res.url);
            } else {
                alert(res.error || 'Gagal mengunggah thumbnail.');
            }
        } catch (err) {
            console.error('Upload thumbnail error:', err);
            alert('Terjadi kesalahan saat mengunggah gambar.');
        } finally {
            setUploadingImage(false);
        }
    };

    const openAddModal = () => {
        setEditingId(null);
        setJudul('');
        setDeskripsi('');
        setTanggal('');
        setLinkGdriveVideo('');
        setThumbnail('');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setJudul('');
        setDeskripsi('');
        setTanggal('');
        setLinkGdriveVideo('');
        setThumbnail('');
    };

    const handleEditClick = (item) => {
        setEditingId(item.id);
        setJudul(item.judul || '');
        setDeskripsi(item.deskripsi || '');
        setTanggal(item.tanggal || '');
        setLinkGdriveVideo(item.link_gdrive_video || '');
        setThumbnail(item.thumbnail || '');
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!judul.trim()) {
            alert('Judul konten multimedia wajib diisi.');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                site,
                judul: judul.trim(),
                deskripsi: deskripsi.trim() || null,
                tanggal: tanggal || null,
                link_gdrive_video: linkGdriveVideo.trim() || null,
                thumbnail: thumbnail.trim() || null
            };

            const res = await upsertKontenMultimedia(payload, editingId);
            if (!res.success) {
                alert('Gagal menyimpan: ' + res.error);
                setIsSubmitting(false);
                return;
            }

            closeModal();
            fetchList(site);
        } catch (err) {
            console.error('Submit error:', err);
            alert('Terjadi kesalahan saat menyimpan konten.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id, judulText) => {
        if (!confirm(`Hapus konten multimedia "${judulText || 'ini'}"?`)) return;

        const res = await deleteKontenMultimedia(id);
        if (res.success) {
            fetchList(site);
            if (editingId === id) closeModal();
        } else {
            alert('Gagal menghapus: ' + res.error);
        }
    };

    // Filter list
    const filteredList = useMemo(() => {
        return kontenList.filter(item => {
            const matchSearch = !searchQuery ||
                (item.judul && item.judul.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (item.deskripsi && item.deskripsi.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (item.tanggal_wib && item.tanggal_wib.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchDate = !filterDate || item.tanggal === filterDate;
            return matchSearch && matchDate;
        });
    }, [kontenList, searchQuery, filterDate]);

    const isSuperAdmin = adminRole === 'super_admin';
    const currentEmbedUrl = getDriveEmbedUrl(linkGdriveVideo);

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-16 animate-in fade-in duration-500">
            {/* Header & Site Switcher */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md">
                <div>
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${site === 'pkkmb' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'}`}>
                            <Video size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">
                                Manajemen Konten Multimedia {site.toUpperCase()}
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                Publikasikan video sorotan, video promosi, dan konten visual interaktif.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Site Switcher for Super Admin */}
                {isSuperAdmin ? (
                    <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <button
                            type="button"
                            onClick={() => { setSite('pkkmb'); closeModal(); }}
                            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${site === 'pkkmb' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}
                        >
                            PKKMB
                        </button>
                        <button
                            type="button"
                            onClick={() => { setSite('pose'); closeModal(); }}
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

            {/* List Table / Card View */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50 dark:bg-slate-800/30">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                            Daftar Konten Multimedia ({filteredList.length})
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Semua video dan konten interaktif yang tampil di portal {site.toUpperCase()}.
                        </p>
                    </div>

                    {/* Filter & Search & Add Button */}
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari judul, deskripsi, tanggal..."
                                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs outline-none"
                        />

                        {(searchQuery || filterDate) && (
                            <button
                                type="button"
                                onClick={() => { setSearchQuery(''); setFilterDate(''); }}
                                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white underline"
                            >
                                Reset
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={() => fetchList(site)}
                            disabled={loading}
                            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                            title="Refresh data"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin text-blue-500' : ''} />
                        </button>

                        <button
                            type="button"
                            onClick={openAddModal}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-md transition-all ${site === 'pkkmb' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/25'}`}
                        >
                            <Plus size={16} />
                            <span>Tambah Konten</span>
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="p-16 text-center text-slate-400">
                        <RefreshCw size={28} className="animate-spin mx-auto mb-2 text-blue-500" />
                        <p className="text-sm">Memuat data konten...</p>
                    </div>
                ) : filteredList.length === 0 ? (
                    <div className="p-16 text-center text-slate-400">
                        <Video size={44} className="mx-auto mb-3 opacity-40 text-slate-400" />
                        <p className="text-base font-semibold text-slate-700 dark:text-slate-300">Tidak ada konten multimedia yang cocok</p>
                        <p className="text-xs text-slate-400 mt-1">Klik tombol &ldquo;Tambah Konten&rdquo; untuk mempublikasikan video baru.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                        {filteredList.map((item) => {
                            const embedUrl = getDriveEmbedUrl(item.link_gdrive_video);
                            return (
                                <div
                                    key={item.id}
                                    className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/60 overflow-hidden flex flex-col group hover:shadow-md transition-all"
                                >
                                    {/* Thumbnail or Video Iframe */}
                                    <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                                        {item.thumbnail ? (
                                            <img src={item.thumbnail} alt={item.judul} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : embedUrl ? (
                                            <iframe
                                                src={embedUrl}
                                                className="w-full h-full pointer-events-none border-0"
                                                tabIndex={-1}
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center text-slate-500 text-xs">
                                                <Video size={28} className="mb-1 opacity-50" />
                                                <span>Video Belum Tersedia</span>
                                            </div>
                                        )}

                                        {embedUrl && (
                                            <button
                                                type="button"
                                                onClick={() => setActiveVideoModal({ title: item.judul, url: embedUrl })}
                                                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[2px]"
                                            >
                                                <div className="p-3.5 rounded-full bg-blue-600 text-white shadow-xl hover:scale-110 active:scale-95 transition-all">
                                                    <Play size={20} fill="white" />
                                                </div>
                                            </button>
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 uppercase">
                                                    {item.site}
                                                </span>
                                                <span>{item.tanggal_wib}</span>
                                            </div>
                                            <h3 className="font-bold text-slate-800 dark:text-white text-base line-clamp-1">
                                                {item.judul}
                                            </h3>
                                            {item.deskripsi && (
                                                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                                                    {item.deskripsi}
                                                </p>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700/60">
                                            {embedUrl ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveVideoModal({ title: item.judul, url: embedUrl })}
                                                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                                >
                                                    <Play size={12} fill="currentColor" />
                                                    <span>Tonton Video</span>
                                                </button>
                                            ) : (
                                                <span className="text-xs text-slate-400">Tidak ada link</span>
                                            )}

                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => handleEditClick(item)}
                                                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                                                    title="Edit konten"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(item.id, item.judul)}
                                                    className="p-2 rounded-lg border border-rose-200 dark:border-rose-900/40 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 dark:text-rose-400 transition-colors"
                                                    title="Hapus konten"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal Overlay Form Tambah / Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                            <div className="flex items-center gap-2.5 font-bold text-slate-800 dark:text-white text-base sm:text-lg">
                                {editingId ? <Edit2 size={20} className="text-amber-500" /> : <Video size={20} className="text-blue-500" />}
                                <span>{editingId ? `Edit Konten Multimedia ${site.toUpperCase()}` : `Tambah Konten Multimedia Baru ${site.toUpperCase()}`}</span>
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
                        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Judul */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                        Judul Konten <span className="text-rose-500">*</span> (Maks 100 karakter)
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        maxLength={100}
                                        value={judul}
                                        onChange={(e) => setJudul(e.target.value)}
                                        placeholder="Contoh: Aftermovie PKKMB Hari Ke-2"
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm outline-none transition-all"
                                    />
                                </div>

                                {/* Tanggal */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                        Tanggal Publikasi
                                    </label>
                                    <input
                                        type="date"
                                        value={tanggal}
                                        onChange={(e) => setTanggal(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm outline-none transition-all"
                                    />
                                </div>
                            </div>

                            {/* Deskripsi */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Deskripsi Singkat (Maks 255 karakter)
                                </label>
                                <textarea
                                    rows={3}
                                    maxLength={255}
                                    value={deskripsi}
                                    onChange={(e) => setDeskripsi(e.target.value)}
                                    placeholder="Ringkasan atau keterangan menarik seputar video ini..."
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm outline-none transition-all resize-none leading-relaxed"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Link Google Drive Video */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                        Link / File ID Video Google Drive (Maks 255 karakter)
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            maxLength={255}
                                            value={linkGdriveVideo}
                                            onChange={(e) => setLinkGdriveVideo(e.target.value)}
                                            placeholder="File ID atau Link Google Drive..."
                                            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 text-xs font-mono outline-none transition-all"
                                        />
                                        {currentEmbedUrl && (
                                            <button
                                                type="button"
                                                onClick={() => setActiveVideoModal({ title: judul || 'Tes Video', url: currentEmbedUrl })}
                                                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium flex items-center gap-1.5 shrink-0 transition-colors shadow-xs"
                                            >
                                                <Play size={14} />
                                                <span>Putar</span>
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-1.5">
                                        Sistem akan otomatis mengonversi ID atau link share Google Drive ke preview video interaktif.
                                    </p>
                                </div>

                                {/* Thumbnail Upload / Link */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                        Thumbnail Video (Opsional, Maks 5MB)
                                    </label>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-3">
                                            <label className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer text-xs font-medium transition-all">
                                                <Upload size={14} />
                                                <span>{uploadingImage ? 'Mengunggah...' : 'Pilih Thumbnail'}</span>
                                                <input
                                                    type="file"
                                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                                    disabled={uploadingImage}
                                                    onChange={handleThumbnailUpload}
                                                    className="hidden"
                                                />
                                            </label>
                                            <span className="text-xs text-slate-400">atau paste URL</span>
                                        </div>
                                        <input
                                            type="text"
                                            maxLength={255}
                                            value={thumbnail}
                                            onChange={(e) => setThumbnail(e.target.value)}
                                            placeholder="https://... URL gambar thumbnail"
                                            className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        {thumbnail && (
                                            <div className="relative w-full h-24 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                                                <img src={thumbnail} alt="Thumbnail Preview" className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => setThumbnail('')}
                                                    className="absolute top-1.5 right-1.5 p-1 bg-black/60 text-white rounded-full hover:bg-rose-600 transition-colors"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
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
                                    disabled={isSubmitting || uploadingImage}
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
                                            <span>{editingId ? 'Perbarui Konten' : 'Simpan Konten'}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Video Preview Modal */}
            {activeVideoModal && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl">
                        <div className="p-4 border-b border-slate-800 flex justify-between items-center text-white">
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                                <Play size={16} className="text-emerald-400" />
                                {activeVideoModal.title}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setActiveVideoModal(null)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <div className="relative w-full aspect-video bg-black">
                            <iframe
                                src={activeVideoModal.url}
                                allow="autoplay"
                                allowFullScreen
                                className="w-full h-full border-0"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
