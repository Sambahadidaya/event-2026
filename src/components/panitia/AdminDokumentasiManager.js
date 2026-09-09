'use client';

import { useState, useEffect, useMemo } from 'react';
import { Camera, Plus, Trash2, Edit2, Search, RefreshCw, ExternalLink, Play, Film, Upload, X, Check, ImageIcon, Video } from 'lucide-react';
import { getDokumentasi } from '@/api/supabase/public/dokumentasi';
import { upsertDokumentasi, deleteDokumentasi, saveCuplikanBatch } from '@/api/supabase/admin/dokumentasi';
import { uploadFile } from '@/api/supabase/storage';
import { getCurrentAdmin } from '@/api/supabase/admin/auth';
import { extractDriveFileId, getDriveEmbedUrl } from '@/lib/driveUtils';

export default function AdminDokumentasiManager({ initialSite = 'pkkmb' }) {
    const [site, setSite] = useState(initialSite);
    const [adminRole, setAdminRole] = useState(null);
    const [dokumentasiList, setDokumentasiList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDate, setFilterDate] = useState('');

    // Modal & Form states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [judul, setJudul] = useState('');
    const [tanggal, setTanggal] = useState('');
    const [linkGdrive, setLinkGdrive] = useState('');
    const [headerFoto, setHeaderFoto] = useState('');
    const [uploadingImage, setUploadingImage] = useState(false);

    // Cuplikan list state: [{ judul_cuplikan: '', link_gdrive_video: '', tipe_cuplikan: 'video' | 'foto', urutan: 1 }]
    const [cuplikanList, setCuplikanList] = useState([]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeVideoModal, setActiveVideoModal] = useState(null);

    // Check admin role
    useEffect(() => {
        const fetchAdmin = async () => {
            const admin = await getCurrentAdmin();
            if (admin) {
                setAdminRole(admin.role);
                // If not super_admin, lock site according to role
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
            const data = await getDokumentasi(currentSite);
            setDokumentasiList(data || []);
        } catch (err) {
            console.error('Error fetching dokumentasi list:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchList(site);
    }, [site]);

    // Image upload handler for header
    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await uploadFile(formData, 'dokumentasi-header', 'headers/');
            if (res.success && res.url) {
                setHeaderFoto(res.url);
            } else {
                alert(res.error || 'Gagal mengunggah foto.');
            }
        } catch (err) {
            console.error('Upload error:', err);
            alert('Terjadi kesalahan saat mengunggah foto.');
        } finally {
            setUploadingImage(false);
        }
    };

    // Cuplikan helpers
    const addCuplikanRow = () => {
        setCuplikanList(prev => [
            ...prev,
            { judul_cuplikan: '', link_gdrive_video: '', tipe_cuplikan: 'video', urutan: prev.length + 1 }
        ]);
    };

    const updateCuplikanRow = (index, field, value) => {
        setCuplikanList(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const removeCuplikanRow = (index) => {
        setCuplikanList(prev => prev.filter((_, idx) => idx !== index));
    };

    const openAddModal = () => {
        setEditingId(null);
        setJudul('');
        setTanggal('');
        setLinkGdrive('');
        setHeaderFoto('');
        setCuplikanList([]);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setJudul('');
        setTanggal('');
        setLinkGdrive('');
        setHeaderFoto('');
        setCuplikanList([]);
    };

    const handleEditClick = (item) => {
        setEditingId(item.id);
        setJudul(item.judul || '');
        setTanggal(item.tanggal || '');
        setLinkGdrive(item.link_gdrive || '');
        setHeaderFoto(item.header_foto || '');
        setCuplikanList(
            (item.dokumentasi_cuplikan || []).map((c, idx) => ({
                judul_cuplikan: c.judul_cuplikan || '',
                link_gdrive_video: c.link_gdrive_video || '',
                tipe_cuplikan: c.tipe_cuplikan === 'foto' ? 'foto' : 'video',
                urutan: c.urutan || idx + 1
            }))
        );
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!judul.trim()) {
            alert('Judul dokumentasi wajib diisi.');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                site,
                judul: judul.trim(),
                tanggal: tanggal || null,
                link_gdrive: linkGdrive.trim() || null,
                header_foto: headerFoto.trim() || null
            };

            const res = await upsertDokumentasi(payload, editingId);
            if (!res.success) {
                alert('Gagal menyimpan: ' + res.error);
                setIsSubmitting(false);
                return;
            }

            const dokId = res.data?.id || editingId;

            // Simpan cuplikan jika ada
            if (dokId) {
                const cuplikanRes = await saveCuplikanBatch(dokId, cuplikanList);
                if (!cuplikanRes.success) {
                    alert('Dokumentasi tersimpan, namun gagal memperbarui cuplikan: ' + cuplikanRes.error);
                }
            }

            closeModal();
            fetchList(site);
        } catch (err) {
            console.error('Submit error:', err);
            alert('Terjadi kesalahan saat menyimpan data.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id, judulText) => {
        if (!confirm(`Hapus dokumentasi "${judulText || 'ini'}" beserta seluruh cuplikannya?`)) return;

        const res = await deleteDokumentasi(id);
        if (res.success) {
            fetchList(site);
            if (editingId === id) closeModal();
        } else {
            alert('Gagal menghapus: ' + res.error);
        }
    };

    // Filter list
    const filteredList = useMemo(() => {
        return dokumentasiList.filter(item => {
            const matchSearch = !searchQuery || 
                (item.judul && item.judul.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (item.tanggal_wib && item.tanggal_wib.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (item.link_gdrive && item.link_gdrive.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchDate = !filterDate || item.tanggal === filterDate;
            return matchSearch && matchDate;
        });
    }, [dokumentasiList, searchQuery, filterDate]);

    const isSuperAdmin = adminRole === 'super_admin';

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-16 animate-in fade-in duration-500">
            {/* Header & Site Switcher */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md">
                <div>
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${site === 'pkkmb' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'}`}>
                            <Camera size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">
                                Manajemen Dokumentasi {site.toUpperCase()}
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                Kelola album foto header, link Google Drive folder, serta cuplikan foto dan video kegiatan.
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
                            Daftar Dokumentasi Acara ({filteredList.length})
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Semua album dokumentasi yang tersimpan untuk portal {site.toUpperCase()}.
                        </p>
                    </div>

                    {/* Filter & Actions */}
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari judul, tanggal, link..."
                                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs outline-none"
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
                            <span>Tambah Dokumentasi</span>
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="p-16 text-center text-slate-400">
                        <RefreshCw size={28} className="animate-spin mx-auto mb-2 text-blue-500" />
                        <p className="text-sm">Memuat data dokumentasi...</p>
                    </div>
                ) : filteredList.length === 0 ? (
                    <div className="p-16 text-center text-slate-400">
                        <Camera size={44} className="mx-auto mb-3 opacity-40 text-slate-400" />
                        <p className="text-base font-semibold text-slate-700 dark:text-slate-300">Tidak ada dokumentasi ditemukan</p>
                        <p className="text-xs text-slate-400 mt-1">Klik tombol &ldquo;Tambah Dokumentasi&rdquo; untuk membuat album baru.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                        {filteredList.map((item) => {
                            const fotoCount = (item.dokumentasi_cuplikan || []).filter(c => c.tipe_cuplikan === 'foto').length;
                            const videoCount = (item.dokumentasi_cuplikan || []).filter(c => c.tipe_cuplikan !== 'foto').length;
                            
                            return (
                                <div
                                    key={item.id}
                                    className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/60 overflow-hidden flex flex-col group hover:shadow-md transition-all"
                                >
                                    {/* Header Foto Preview */}
                                    <div className="relative aspect-[4/3] bg-slate-200 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
                                        {item.header_foto ? (
                                            <img
                                                src={item.header_foto}
                                                alt={item.judul}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center text-slate-400 text-xs">
                                                <Camera size={32} className="opacity-40 mb-1" />
                                                <span>Tidak Ada Foto Header</span>
                                            </div>
                                        )}

                                        {/* Tanggal badge */}
                                        {item.tanggal_wib && (
                                            <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-lg text-[10px] font-semibold bg-black/70 text-white backdrop-blur-md">
                                                {item.tanggal_wib}
                                            </div>
                                        )}

                                        {/* Cuplikan count badges */}
                                        <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1">
                                            {videoCount > 0 && (
                                                <div className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-600/90 text-white backdrop-blur-md flex items-center gap-1 shadow-xs">
                                                    <Film size={10} />
                                                    <span>{videoCount} Video</span>
                                                </div>
                                            )}
                                            {fotoCount > 0 && (
                                                <div className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-600/90 text-white backdrop-blur-md flex items-center gap-1 shadow-xs">
                                                    <ImageIcon size={10} />
                                                    <span>{fotoCount} Foto</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Card Content */}
                                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 uppercase">
                                                    {item.site}
                                                </span>
                                                <span className="text-[11px]">{item.dokumentasi_cuplikan?.length || 0} cuplikan</span>
                                            </div>
                                            <h3 className="font-bold text-slate-800 dark:text-white text-base line-clamp-2 leading-snug">
                                                {item.judul}
                                            </h3>
                                        </div>

                                        {/* Actions */}
                                        <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-700/60">
                                            {item.link_gdrive && (
                                                <a
                                                    href={item.link_gdrive}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-full py-1.5 px-3 rounded-lg text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center justify-center gap-1.5 transition-colors border border-blue-200/50 dark:border-blue-800/30"
                                                >
                                                    <ExternalLink size={12} />
                                                    <span>Buka Folder Google Drive</span>
                                                </a>
                                            )}

                                            <div className="flex items-center justify-end gap-2 pt-1">
                                                <button
                                                    type="button"
                                                    onClick={() => handleEditClick(item)}
                                                    className="flex-1 py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                                                >
                                                    <Edit2 size={13} />
                                                    <span>Edit Data</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(item.id, item.judul)}
                                                    className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/40 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 dark:text-rose-400 transition-colors"
                                                    title="Hapus album"
                                                >
                                                    <Trash2 size={15} />
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
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                            <div className="flex items-center gap-2.5 font-bold text-slate-800 dark:text-white text-base sm:text-lg">
                                {editingId ? <Edit2 size={20} className="text-amber-500" /> : <Camera size={20} className="text-blue-500" />}
                                <span>{editingId ? `Edit Dokumentasi ${site.toUpperCase()}` : `Tambah Dokumentasi Baru ${site.toUpperCase()}`}</span>
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
                            {/* Judul & Tanggal */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                        Judul Dokumentasi <span className="text-rose-500">*</span> (Maks 100 karakter)
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        maxLength={100}
                                        value={judul}
                                        onChange={(e) => setJudul(e.target.value)}
                                        placeholder="Contoh: Dokumentasi PKKMB Hari Ke-1 (Opening & Sidang Senat)"
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                        Tanggal Kegiatan
                                    </label>
                                    <input
                                        type="date"
                                        value={tanggal}
                                        onChange={(e) => setTanggal(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm outline-none transition-all"
                                    />
                                </div>
                            </div>

                            {/* Header Foto Upload & Link Google Drive */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Header Foto */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                        Foto Header Album (Opsional, Maks 5MB)
                                    </label>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-3">
                                            <label className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer text-xs font-medium transition-all">
                                                <Upload size={14} />
                                                <span>{uploadingImage ? 'Mengunggah...' : 'Pilih Foto Header'}</span>
                                                <input
                                                    type="file"
                                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                                    disabled={uploadingImage}
                                                    onChange={handleImageUpload}
                                                    className="hidden"
                                                />
                                            </label>
                                            <span className="text-xs text-slate-400">atau paste URL</span>
                                        </div>
                                        <input
                                            type="text"
                                            maxLength={255}
                                            value={headerFoto}
                                            onChange={(e) => setHeaderFoto(e.target.value)}
                                            placeholder="https://... URL gambar"
                                            className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        {headerFoto && (
                                            <div className="relative w-full h-24 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                                                <img src={headerFoto} alt="Header Preview" className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => setHeaderFoto('')}
                                                    className="absolute top-1.5 right-1.5 p-1 bg-black/60 text-white rounded-full hover:bg-rose-600 transition-colors"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Link Google Drive Folder */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                        Link Folder Google Drive (Maks 255 karakter)
                                    </label>
                                    <input
                                        type="url"
                                        maxLength={255}
                                        value={linkGdrive}
                                        onChange={(e) => setLinkGdrive(e.target.value)}
                                        placeholder="https://drive.google.com/drive/folders/..."
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm outline-none transition-all"
                                    />
                                    <p className="text-[11px] text-slate-400 mt-1.5">
                                        Tautan folder Google Drive tempat pengunjung dapat mengunduh seluruh arsip foto.
                                    </p>
                                </div>
                            </div>

                            {/* Section Cuplikan Foto & Video */}
                            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                            <Film size={16} className="text-blue-500" />
                                            <span>Daftar Cuplikan (Foto & Video)</span>
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Tambahkan cuplikan video Google Drive atau foto sorotan menarik dari kegiatan ini.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addCuplikanRow}
                                        className="px-3.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-blue-200 dark:border-blue-800/50"
                                    >
                                        <Plus size={14} />
                                        <span>Tambah Cuplikan</span>
                                    </button>
                                </div>

                                {cuplikanList.length === 0 ? (
                                    <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/20">
                                        <p className="text-xs text-slate-400">Belum ada cuplikan ditambahkan. Klik tombol &ldquo;Tambah Cuplikan&rdquo; di atas jika ada foto/video highlight.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {cuplikanList.map((cup, idx) => {
                                            const isFoto = cup.tipe_cuplikan === 'foto';
                                            const embedUrl = !isFoto ? getDriveEmbedUrl(cup.link_gdrive_video) : null;

                                            return (
                                                <div
                                                    key={idx}
                                                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/40 space-y-3"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-bold flex items-center justify-center">
                                                                {idx + 1}
                                                            </span>
                                                            {/* Toggle Tipe: Video / Foto */}
                                                            <div className="flex items-center p-0.5 bg-slate-200 dark:bg-slate-700 rounded-lg">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateCuplikanRow(idx, 'tipe_cuplikan', 'video')}
                                                                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-all ${
                                                                        !isFoto
                                                                            ? 'bg-blue-600 text-white shadow-xs'
                                                                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                                                                    }`}
                                                                >
                                                                    <Video size={12} />
                                                                    <span>Video (GDrive)</span>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateCuplikanRow(idx, 'tipe_cuplikan', 'foto')}
                                                                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-all ${
                                                                        isFoto
                                                                            ? 'bg-emerald-600 text-white shadow-xs'
                                                                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                                                                    }`}
                                                                >
                                                                    <ImageIcon size={12} />
                                                                    <span>Foto</span>
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() => removeCuplikanRow(idx)}
                                                            className="text-rose-500 hover:text-rose-700 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                                                            title="Hapus baris cuplikan"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                                                                Judul Cuplikan
                                                            </label>
                                                            <input
                                                                type="text"
                                                                maxLength={100}
                                                                value={cup.judul_cuplikan}
                                                                onChange={(e) => updateCuplikanRow(idx, 'judul_cuplikan', e.target.value)}
                                                                placeholder={isFoto ? 'Contoh: Foto Penyerahan Sertifikat' : 'Contoh: Cuplikan Yel-yel Kelompok 1'}
                                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                                                                {isFoto ? 'URL / Link Gambar Foto' : 'Link / File ID Google Drive Video'}
                                                            </label>
                                                            <div className="flex gap-2">
                                                                <input
                                                                    type="text"
                                                                    maxLength={255}
                                                                    value={cup.link_gdrive_video}
                                                                    onChange={(e) => updateCuplikanRow(idx, 'link_gdrive_video', e.target.value)}
                                                                    placeholder={isFoto ? 'https://... URL gambar' : 'File ID atau Link Google Drive Video...'}
                                                                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500"
                                                                />
                                                                {!isFoto && embedUrl && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setActiveVideoModal({ title: cup.judul_cuplikan || `Cuplikan #${idx + 1}`, url: embedUrl })}
                                                                        className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium flex items-center gap-1 shrink-0 transition-colors shadow-xs"
                                                                    >
                                                                        <Play size={12} />
                                                                        <span>Tes</span>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
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
                                            <span>{editingId ? 'Perbarui Dokumentasi' : 'Simpan Dokumentasi'}</span>
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
