'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Users, Search, ChevronDown, ChevronRight, Plus, Trash2, Edit, ExternalLink, RefreshCw } from 'lucide-react';
import { getKelompokAdmin, getKelompokByUrutan, getPesertaPkkmbWajib, createKelompok, updateKelompok, deleteKelompok } from '@/api/supabase/admin/kelompok';
import { getCurrentAdmin } from '@/api/supabase/admin/auth';
import { getKabimFilter } from '@/lib/adminRoleData';
import DashboardHeaderFilters from '@/components/panitia/DashboardHeaderFilters';
import TablePagination from '@/components/panitia/TablePagination';
import { uploadFile } from '@/api/supabase/storage';

const ITEMS_PER_PAGE = 8;

export default function AdminKelompokManager() {
    const [kelompokList, setKelompokList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [lastSyncedAt, setLastSyncedAt] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    
    // Auth & Role-based flags
    const [adminRole, setAdminRole] = useState(null);
    const [lockedKabimUrutan, setLockedKabimUrutan] = useState(null); // Nilai 1-8 jika role adalah pj_kabim
    const [canModify, setCanModify] = useState(false); // Hanya super_admin & admin_pkkmb

    // Detail members (Expand state)
    const [expandedKelompokId, setExpandedKelompokId] = useState(null);
    
    // Modal Tambah/Edit Kelompok
    const [modalOpen, setModalOpen] = useState(false);
    const [editingKelompok, setEditingKelompok] = useState(null);
    const [pesertaWajibOptions, setPesertaWajibOptions] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]); // Array dari {nama_anggota, nim_anggota}
    const [memberSearchQuery, setMemberSearchQuery] = useState('');
    const [memberStatusFilter, setMemberStatusFilter] = useState('belum'); // 'semua', 'sudah', 'belum'
    const [fotoFile, setFotoFile] = useState(null);

    const [formState, setFormState] = useState({
        nama_kelompok: '',
        nama_kabim: '',
        urutan: 0,
        link_instagram: '',
        foto_kelompok: '',
        keterangan: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const checkRoleAndPermissions = async () => {
        const admin = await getCurrentAdmin();
        if (admin) {
            setAdminRole(admin.role);
            const isSuper = admin.role === 'super_admin';
            const isAdminPkkmb = admin.role === 'admin_pkkmb';
            setCanModify(isSuper || isAdminPkkmb);

            const filter = getKabimFilter(admin.role);
            if (filter !== null) {
                setLockedKabimUrutan(filter);
            }
        }
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        await checkRoleAndPermissions();

        // 1. Ambil data kelompok sesuai role
        let data = [];
        if (lockedKabimUrutan !== null) {
            // Ambil data satu kelompok saja sesuai urutan kabim
            const singelKelompok = await getKelompokByUrutan(lockedKabimUrutan);
            data = singelKelompok ? [singelKelompok] : [];
            // Untuk PJ Kabim, detail members langsung tampil secara default
            if (singelKelompok) {
                setExpandedKelompokId(singelKelompok.id);
            }
        } else {
            // super_admin / admin_pkkmb
            data = await getKelompokAdmin();
        }

        setKelompokList(data || []);
        setLastSyncedAt(Date.now());

        // 2. Ambil list peserta wajib PKKMB untuk dropdown modal jika punya akses edit
        if (canModify) {
            const peserta = await getPesertaPkkmbWajib();
            setPesertaWajibOptions(peserta || []);
        }

        setLoading(false);
    }, [lockedKabimUrutan, canModify]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredData = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return kelompokList;
        return kelompokList.filter(k => 
            k.nama_kelompok.toLowerCase().includes(query) ||
            k.nama_kabim.toLowerCase().includes(query)
        );
    }, [kelompokList, searchQuery]);

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE) || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedData = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const handleRowClick = (kelompokId) => {
        // Jika yang login adalah PJ Kabim, biarkan detail members tetap terbuka, tidak perlu toggle klik.
        if (lockedKabimUrutan !== null) return;

        if (expandedKelompokId === kelompokId) {
            setExpandedKelompokId(null);
        } else {
            setExpandedKelompokId(kelompokId);
        }
    };

    const openAddModal = () => {
        setEditingKelompok(null);
        setFormState({
            nama_kelompok: '',
            nama_kabim: '',
            urutan: kelompokList.length + 1,
            link_instagram: '',
            foto_kelompok: '',
            keterangan: ''
        });
        setSelectedMembers([]);
        setFotoFile(null);
        setMemberSearchQuery('');
        setMemberStatusFilter('belum');
        setModalOpen(true);
    };

    const openEditModal = (e, kelompok) => {
        e.stopPropagation();
        setEditingKelompok(kelompok);
        setFormState({
            nama_kelompok: kelompok.nama_kelompok || '',
            nama_kabim: kelompok.nama_kabim || '',
            urutan: kelompok.urutan || 0,
            link_instagram: kelompok.link_instagram || '',
            foto_kelompok: kelompok.foto_kelompok || '',
            keterangan: kelompok.keterangan || ''
        });
        setSelectedMembers(kelompok.kelompok_members || []);
        setFotoFile(null);
        setMemberSearchQuery('');
        setMemberStatusFilter('belum');
        setModalOpen(true);
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm('Hapus kelompok ini secara permanen beserta semua anggotanya?')) return;
        
        const res = await deleteKelompok(id);
        if (res.success) {
            setKelompokList(prev => prev.filter(k => k.id !== id));
            if (expandedKelompokId === id) setExpandedKelompokId(null);
        } else {
            alert(res.error || 'Gagal menghapus kelompok.');
        }
    };

    const handleToggleMemberSelection = (peserta) => {
        const index = selectedMembers.findIndex(m => m.nim_anggota === peserta.nim);
        if (index > -1) {
            setSelectedMembers(prev => prev.filter(m => m.nim_anggota !== peserta.nim));
        } else {
            setSelectedMembers(prev => [...prev, { nama_anggota: peserta.nama, nim_anggota: peserta.nim }]);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        let uploadedUrl = formState.foto_kelompok;
        if (fotoFile) {
            const formData = new FormData();
            formData.append('file', fotoFile);
            const uploadRes = await uploadFile(formData, 'team-images', 'pkkmb/');
            if (uploadRes.success) {
                uploadedUrl = uploadRes.url;
            } else {
                alert('Gagal mengupload foto kelompok: ' + (uploadRes.error || 'Terjadi kesalahan'));
                setSubmitting(false);
                return;
            }
        }

        const payload = {
            nama_kelompok: formState.nama_kelompok.trim(),
            nama_kabim: formState.nama_kabim.trim(),
            urutan: parseInt(formState.urutan) || 0,
            link_instagram: formState.link_instagram.trim(),
            foto_kelompok: uploadedUrl,
            keterangan: formState.keterangan.trim()
        };

        if (!payload.nama_kelompok || !payload.nama_kabim) {
            alert('Nama Kelompok & Nama Kabim wajib diisi!');
            setSubmitting(false);
            return;
        }

        let res;
        if (editingKelompok) {
            res = await updateKelompok(editingKelompok.id, payload, selectedMembers);
        } else {
            res = await createKelompok(payload, selectedMembers);
        }

        if (res.success) {
            setModalOpen(false);
            fetchData();
        } else {
            alert(res.error || 'Gagal menyimpan data kelompok.');
        }
        setSubmitting(false);
    };

    const filteredPesertaWajib = useMemo(() => {
        let filtered = pesertaWajibOptions;

        // Filter by status berkelompok
        if (memberStatusFilter === 'sudah') {
            filtered = filtered.filter(p => p.sudah_berkelompok);
        } else if (memberStatusFilter === 'belum') {
            filtered = filtered.filter(p => !p.sudah_berkelompok);
        }

        const query = memberSearchQuery.toLowerCase().trim();
        if (query) {
            filtered = filtered.filter(p =>
                (p.nama || '').toLowerCase().includes(query) ||
                (p.nim || '').toLowerCase().includes(query)
            );
        }
        return filtered;
    }, [pesertaWajibOptions, memberSearchQuery, memberStatusFilter]);

    // Ambil detail members ter-expand saat ini
    const activeExpandedMembers = useMemo(() => {
        if (!expandedKelompokId) return [];
        const match = kelompokList.find(k => k.id === expandedKelompokId);
        return match ? (match.kelompok_members || []) : [];
    }, [expandedKelompokId, kelompokList]);

    return (
        <div className="space-y-6">
            <DashboardHeaderFilters
                title="Manajemen Kelompok PKKMB"
                subtitle={lockedKabimUrutan !== null ? `Data kelompok asuhan Kabim Urutan ke-${lockedKabimUrutan}` : 'Kelola data kelompok dan pembagian anggota PKKMB 2026'}
                icon={Users}
                showSiteFilter={false}
                onRefresh={fetchData}
                loading={loading}
                lastSyncedAt={lastSyncedAt}
            />

            {/* Aksi & Search Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-80">
                    <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cari kelompok / kabim..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                {canModify && (
                    <button
                        onClick={openAddModal}
                        className="w-full md:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                        <Plus size={16} /> Tambah Kelompok
                    </button>
                )}
            </div>

            {/* Tabel Daftar Kelompok */}
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-slate-800">
                                <th className="p-4 w-12 text-center">Urutan</th>
                                <th className="p-4">Nama Kelompok</th>
                                <th className="p-4">Nama Kabim</th>
                                <th className="p-4 text-center">Jumlah Anggota</th>
                                <th className="p-4">Instagram</th>
                                {canModify && <th className="p-4 text-center">Aksi</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="p-4"><div className="h-8 bg-gray-100 dark:bg-slate-800 rounded-lg w-full"></div></td>
                                    </tr>
                                ))
                            ) : paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500 dark:text-gray-400">Tidak ada data kelompok.</td>
                                </tr>
                            ) : paginatedData.map((k) => {
                                const isExpanded = expandedKelompokId === k.id;
                                return (
                                    <tr
                                        key={k.id}
                                        onClick={() => handleRowClick(k.id)}
                                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer ${isExpanded ? 'bg-blue-50/20 dark:bg-blue-900/10' : ''}`}
                                    >
                                        <td className="p-4 text-center font-bold text-gray-700 dark:text-gray-300">{k.urutan}</td>
                                        <td className="p-4 font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
                                            {k.foto_kelompok && (
                                                <img src={k.foto_kelompok} alt="" className="w-8 h-8 rounded-full object-cover border" />
                                            )}
                                            {k.nama_kelompok}
                                        </td>
                                        <td className="p-4 font-medium text-gray-700 dark:text-gray-300">{k.nama_kabim}</td>
                                        <td className="p-4 text-center">
                                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                                {(k.kelompok_members || []).length} Orang
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {k.link_instagram ? (
                                                <a
                                                    href={k.link_instagram}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="inline-flex items-center gap-1 text-xs text-pink-600 hover:underline"
                                                >
                                                    @{k.link_instagram.split('/').pop() || 'instagram'} <ExternalLink size={12} />
                                                </a>
                                            ) : '-'}
                                        </td>
                                        {canModify && (
                                            <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={(e) => openEditModal(e, k)}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                                        title="Edit Kelompok"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDelete(e, k.id)}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                                        title="Hapus Kelompok"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {lockedKabimUrutan === null && totalPages > 1 && (
                    <div className="p-4 border-t border-gray-100 dark:border-slate-800">
                        <TablePagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </div>

            {/* TABEL DETAIL MEMBERS (Tampil jika ada row yang ter-expand atau langsung aktif bagi PJ Kabim) */}
            {expandedKelompokId && (
                <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm p-6 animate-in slide-in-from-top-4 duration-300">
                    <h3 className="font-bold text-base text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Users size={18} className="text-blue-500" /> Detail Anggota Kelompok
                    </h3>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs sm:text-sm">
                            <thead>
                                <tr className="bg-gray-50/50 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-slate-800">
                                    <th className="p-3 w-12 text-center">No</th>
                                    <th className="p-3">Nama Lengkap</th>
                                    <th className="p-3">NIM</th>
                                    <th className="p-3">No. WA</th>
                                    <th className="p-3">Program Studi</th>
                                    <th className="p-3">Angkatan</th>
                                    <th className="p-3">Kelas</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                {activeExpandedMembers.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-6 text-center text-gray-400 italic">Belum ada anggota yang terdaftar di kelompok ini.</td>
                                    </tr>
                                ) : (
                                    activeExpandedMembers.map((m, idx) => (
                                        <tr key={m.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                                            <td className="p-3 text-center text-gray-500 font-medium">{idx + 1}</td>
                                            <td className="p-3 font-bold text-gray-900 dark:text-white">{m.nama_anggota}</td>
                                            <td className="p-3 text-gray-700 dark:text-gray-300 font-mono">{m.nim_anggota}</td>
                                            <td className="p-3 text-gray-700 dark:text-gray-300">{m.no_wa || '-'}</td>
                                            <td className="p-3 text-gray-700 dark:text-gray-300">{m.prodi || '-'}</td>
                                            <td className="p-3 text-gray-700 dark:text-gray-300">{m.angkatan || '-'}</td>
                                            <td className="p-3 text-gray-700 dark:text-gray-300">{m.kelas || '-'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MODAL TAMBAH/EDIT KELOMPOK */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b dark:border-slate-800 flex items-center justify-between">
                            <h3 className="font-extrabold text-lg text-gray-900 dark:text-white">
                                {editingKelompok ? 'Edit Kelompok' : 'Tambah Kelompok Baru'}
                            </h3>
                            <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer">✕</button>
                        </div>

                        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Nama Kelompok *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formState.nama_kelompok}
                                        onChange={(e) => setFormState(prev => ({ ...prev, nama_kelompok: e.target.value }))}
                                        className="w-full px-4 py-2.5 text-sm border dark:border-slate-800 bg-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Contoh: Kelompok Gajah Mada"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Nama Kabim *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formState.nama_kabim}
                                        onChange={(e) => setFormState(prev => ({ ...prev, nama_kabim: e.target.value }))}
                                        className="w-full px-4 py-2.5 text-sm border dark:border-slate-800 bg-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Nama Kakak Pembimbing"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Urutan Kelompok *</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max="8"
                                        value={formState.urutan}
                                        onChange={(e) => setFormState(prev => ({ ...prev, urutan: e.target.value }))}
                                        className="w-full px-4 py-2.5 text-sm border dark:border-slate-800 bg-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Link Instagram</label>
                                    <input
                                        type="url"
                                        value={formState.link_instagram}
                                        onChange={(e) => setFormState(prev => ({ ...prev, link_instagram: e.target.value }))}
                                        className="w-full px-4 py-2.5 text-sm border dark:border-slate-800 bg-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="https://instagram.com/kelompok_anda"
                                    />
                                </div>
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Foto Kelompok</label>
                                    <div className="flex items-center gap-3">
                                        {formState.foto_kelompok && (
                                            <img src={formState.foto_kelompok} alt="Preview" className="w-16 h-16 object-cover rounded-lg border dark:border-slate-800" />
                                        )}
                                        <div className="flex-1">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        setFotoFile(file);
                                                        setFormState(prev => ({ ...prev, foto_kelompok: URL.createObjectURL(file) }));
                                                    }
                                                }}
                                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gray-100 dark:file:bg-slate-800 file:text-gray-700 dark:file:text-gray-300 hover:file:bg-gray-200 cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Keterangan / Deskripsi</label>
                                    <textarea
                                        value={formState.keterangan}
                                        onChange={(e) => setFormState(prev => ({ ...prev, keterangan: e.target.value }))}
                                        rows={3}
                                        className="w-full px-4 py-2.5 text-sm border dark:border-slate-800 bg-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Tulis deskripsi singkat kelompok..."
                                    />
                                </div>
                            </div>

                            {/* PILIH ANGGOTA DARI PESERTA WAJIB */}
                            <div className="border-t dark:border-slate-800 pt-6 space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-bold text-sm text-gray-900 dark:text-white uppercase tracking-wider">Pilih Anggota Kelompok</h4>
                                    <span className="text-xs text-blue-600 font-bold bg-blue-50 dark:bg-blue-900/30 px-2.5 py-0.5 rounded-full">
                                        {selectedMembers.length} Terpilih
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400">Pilih dari peserta wajib PKKMB yang sudah melakukan registrasi form wajib.</p>

                                {/* Search Bar Peserta & Filter */}
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <div className="relative flex-1">
                                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Cari nama atau NIM peserta..."
                                            value={memberSearchQuery}
                                            onChange={(e) => setMemberSearchQuery(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <select
                                        value={memberStatusFilter}
                                        onChange={(e) => setMemberStatusFilter(e.target.value)}
                                        className="py-2 px-3 text-xs border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="semua">Semua Peserta</option>
                                        <option value="belum">Belum Berkelompok</option>
                                        <option value="sudah">Sudah Berkelompok</option>
                                    </select>
                                </div>

                                <div className="border dark:border-slate-800 rounded-2xl max-h-60 overflow-y-auto divide-y dark:divide-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {filteredPesertaWajib.length === 0 ? (
                                        <p className="col-span-2 text-center text-xs text-gray-400 py-6">Tidak ada peserta wajib terdaftar atau cocok.</p>
                                    ) : (
                                        filteredPesertaWajib.map(p => {
                                            const isChecked = selectedMembers.some(m => m.nim_anggota === p.nim);
                                            return (
                                                <div
                                                    key={p.id}
                                                    onClick={() => {
                                                        if (!p.sudah_berkelompok || isChecked) {
                                                            handleToggleMemberSelection(p);
                                                        }
                                                    }}
                                                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${isChecked ? 'bg-blue-50/60 dark:bg-blue-900/20 border-blue-500/50 text-blue-600 dark:text-blue-400' : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700/60 text-gray-700 dark:text-gray-300 hover:border-gray-200'} ${p.sudah_berkelompok && !isChecked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                >
                                                    <div className="min-w-0 pr-2">
                                                        <p className="text-xs font-bold truncate">
                                                            {p.nama}
                                                            {p.sudah_berkelompok && (
                                                                <span className="ml-2 px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[9px] font-semibold">
                                                                    Sudah ada grup
                                                                </span>
                                                            )}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">{p.nim}</p>
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        disabled={p.sudah_berkelompok && !isChecked}
                                                        onChange={() => {}} // Di-handle oleh parent div click
                                                        className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0 disabled:opacity-50"
                                                    />
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            <div className="border-t dark:border-slate-800 pt-6 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-4 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer"
                                >
                                    {submitting ? 'Menyimpan...' : 'Simpan Kelompok'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
