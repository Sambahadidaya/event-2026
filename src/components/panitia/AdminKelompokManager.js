'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import {
    Users, Search, ChevronDown, ChevronRight, Plus, Trash2, Edit, ExternalLink, RefreshCw,
    X, Check, CheckCircle2, UploadCloud, ImageIcon, Crown, Hash, Sparkles, Layers,
    Link, UserCheck, UserPlus, UserX, AlertCircle, ArrowRight, ArrowLeft, Info
} from 'lucide-react';
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
    const [modalTab, setModalTab] = useState('info'); // 'info' | 'members'
    const [editingKelompok, setEditingKelompok] = useState(null);
    const [pesertaWajibOptions, setPesertaWajibOptions] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]); // Array dari {nama_anggota, nim_anggota, prodi, kelas, kampus}
    const [memberSearchQuery, setMemberSearchQuery] = useState('');
    const [memberStatusFilter, setMemberStatusFilter] = useState('belum'); // 'semua', 'sudah', 'belum'
    const [fotoFile, setFotoFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    const [formState, setFormState] = useState({
        nama_kelompok: '',
        nama_kabim: '',
        urutan: 1,
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
        if (lockedKabimUrutan !== null) return;
        setExpandedKelompokId(prev => prev === kelompokId ? null : kelompokId);
    };

    const openAddModal = () => {
        setEditingKelompok(null);
        setModalTab('info');
        setFormState({
            nama_kelompok: '',
            nama_kabim: '',
            urutan: Math.min(8, kelompokList.length + 1) || 1,
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
        setModalTab('info');
        setFormState({
            nama_kelompok: kelompok.nama_kelompok || '',
            nama_kabim: kelompok.nama_kabim || '',
            urutan: kelompok.urutan || 1,
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
            setSelectedMembers(prev => [
                ...prev,
                {
                    nama_anggota: peserta.nama,
                    nim_anggota: peserta.nim,
                    prodi: peserta.prodi,
                    kelas: peserta.kelas,
                    kampus: peserta.kampus
                }
            ]);
        }
    };

    const handleSelectAllFiltered = () => {
        const available = filteredPesertaWajib.filter(p => !p.sudah_berkelompok || selectedMembers.some(m => m.nim_anggota === p.nim));
        const newMembers = [...selectedMembers];
        available.forEach(p => {
            if (!newMembers.some(m => m.nim_anggota === p.nim)) {
                newMembers.push({
                    nama_anggota: p.nama,
                    nim_anggota: p.nim,
                    prodi: p.prodi,
                    kelas: p.kelas,
                    kampus: p.kampus
                });
            }
        });
        setSelectedMembers(newMembers);
    };

    const handleClearSelectedMembers = () => {
        setSelectedMembers([]);
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
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
            urutan: parseInt(formState.urutan, 10) || 1,
            link_instagram: formState.link_instagram.trim(),
            foto_kelompok: uploadedUrl,
            keterangan: formState.keterangan.trim()
        };

        if (!payload.nama_kelompok || !payload.nama_kabim) {
            alert('Nama Kelompok & Nama Kabim wajib diisi!');
            setModalTab('info');
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
            filtered = filtered.filter(p => !p.sudah_berkelompok || selectedMembers.some(m => m.nim_anggota === p.nim));
        }

        const query = memberSearchQuery.toLowerCase().trim();
        if (query) {
            filtered = filtered.filter(p =>
                (p.nama || '').toLowerCase().includes(query) ||
                (p.nim || '').toLowerCase().includes(query) ||
                (p.prodi || '').toLowerCase().includes(query) ||
                (p.kelas || '').toLowerCase().includes(query)
            );
        }
        return filtered;
    }, [pesertaWajibOptions, memberSearchQuery, memberStatusFilter, selectedMembers]);

    // Detail members ter-expand saat ini
    const activeExpandedMembers = useMemo(() => {
        if (!expandedKelompokId) return [];
        const match = kelompokList.find(k => k.id === expandedKelompokId);
        return match ? (match.kelompok_members || []) : [];
    }, [expandedKelompokId, kelompokList]);

    const getInitials = (name = '') => {
        const parts = name.trim().split(' ').filter(Boolean);
        if (parts.length === 0) return 'PK';
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[1][0]).toUpperCase();
    };

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
                        className="w-full md:w-auto px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                    >
                        <Plus size={18} /> Tambah Kelompok
                    </button>
                )}
            </div>

            {/* Tabel Daftar Kelompok */}
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr className="bg-gray-50/70 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-slate-800">
                                <th className="p-4 w-16 text-center">Urutan</th>
                                <th className="p-4">Nama Kelompok</th>
                                <th className="p-4">Nama Kabim</th>
                                <th className="p-4 text-center">Jumlah Anggota</th>
                                <th className="p-4">Instagram</th>
                                {canModify && <th className="p-4 text-center w-28">Aksi</th>}
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
                                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer ${isExpanded ? 'bg-blue-50/30 dark:bg-blue-900/15' : ''}`}
                                    >
                                        <td className="p-4 text-center font-bold">
                                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 font-extrabold text-blue-600 dark:text-blue-400 text-xs">
                                                {k.urutan}
                                            </span>
                                        </td>
                                        <td className="p-4 font-bold text-gray-900 dark:text-white">
                                            <div className="flex items-center gap-3">
                                                {k.foto_kelompok ? (
                                                    <img src={k.foto_kelompok} alt="" className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs" />
                                                ) : (
                                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                                                        {getInitials(k.nama_kelompok)}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-extrabold text-slate-800 dark:text-white">{k.nama_kelompok}</p>
                                                    {k.keterangan && <p className="text-[11px] text-slate-400 font-normal truncate max-w-xs">{k.keterangan}</p>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 font-semibold text-gray-700 dark:text-gray-300">
                                            <span className="inline-flex items-center gap-1.5">
                                                <Crown size={14} className="text-amber-500" />
                                                {k.nama_kabim}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40">
                                                {(k.kelompok_members || []).length} Anggota
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {k.link_instagram ? (
                                                <a
                                                    href={k.link_instagram}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/40 border border-pink-200/50 dark:border-pink-900/40 hover:underline"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>
                                                    @{k.link_instagram.split('/').filter(Boolean).pop() || 'instagram'}
                                                </a>
                                            ) : (
                                                <span className="text-xs text-slate-400">-</span>
                                            )}
                                        </td>
                                        {canModify && (
                                            <td className="p-4" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex justify-center gap-1.5">
                                                    <button
                                                        onClick={(e) => openEditModal(e, k)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-all hover:scale-105 cursor-pointer"
                                                        title="Edit Kelompok"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleDelete(e, k.id)}
                                                        className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-xl transition-all hover:scale-105 cursor-pointer"
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
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-2">
                            <Users size={18} className="text-blue-500" /> Detail Anggota Kelompok
                        </h3>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                            Total: {activeExpandedMembers.length} Orang
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs sm:text-sm">
                            <thead>
                                <tr className="bg-gray-50/70 dark:bg-slate-800/50 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-slate-800">
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
                                            <td className="p-3 font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-[10px] font-extrabold flex items-center justify-center shrink-0">
                                                    {getInitials(m.nama_anggota)}
                                                </div>
                                                {m.nama_anggota}
                                            </td>
                                            <td className="p-3 text-gray-700 dark:text-gray-300 font-mono text-xs">{m.nim_anggota}</td>
                                            <td className="p-3 text-gray-700 dark:text-gray-300">{m.no_wa || '-'}</td>
                                            <td className="p-3 text-gray-700 dark:text-gray-300">{m.prodi || '-'}</td>
                                            <td className="p-3 text-gray-700 dark:text-gray-300">{m.angkatan || '-'}</td>
                                            <td className="p-3 text-gray-700 dark:text-gray-300">
                                                {m.kelas ? (
                                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold">
                                                        {m.kelas}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* ✨ MODERN REDESIGNED MODAL TAMBAH / EDIT KELOMPOK ✨ */}
            {/* ============================================================ */}
            {modalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">

                        {/* Header Modal */}
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                                    <Users size={22} />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white flex items-center gap-2">
                                        {editingKelompok ? 'Edit Data Kelompok' : 'Tambah Kelompok Baru'}
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        {editingKelompok ? `Perbarui informasi dan susunan anggota untuk ${editingKelompok.nama_kelompok}` : 'Tentukan nama, kabim, urutan kelompok, dan tugaskan mahasiswa anggota'}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setModalOpen(false)}
                                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                                title="Tutup Modal"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Interactive Tab Switcher */}
                        <div className="px-6 pt-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setModalTab('info')}
                                className={`pb-3 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${modalTab === 'info'
                                        ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                                    }`}
                            >
                                <Info size={16} />
                                1. Informasi Kelompok
                                {formState.nama_kelompok && formState.nama_kabim && (
                                    <Check size={14} className="text-emerald-500 font-bold" />
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => setModalTab('members')}
                                className={`pb-3 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${modalTab === 'members'
                                        ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                                    }`}
                            >
                                <UserPlus size={16} />
                                2. Anggota Kelompok
                                <span className={`px-2 py-0.5 text-[11px] font-extrabold rounded-full transition-all ${selectedMembers.length > 0
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                    }`}>
                                    {selectedMembers.length} Terpilih
                                </span>
                            </button>
                        </div>

                        {/* Modal Body Container */}
                        <div className="flex-1 overflow-y-auto p-6">

                            {/* TAB 1: INFORMASI KELOMPOK */}
                            {modalTab === 'info' && (
                                <div className="space-y-5 animate-in fade-in duration-200">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                                        {/* Nama Kelompok */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                                <Users size={14} className="text-blue-500" />
                                                Nama Kelompok <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formState.nama_kelompok}
                                                onChange={(e) => setFormState(prev => ({ ...prev, nama_kelompok: e.target.value }))}
                                                className="w-full px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-900 dark:text-white transition-all placeholder:text-slate-400"
                                                placeholder="Contoh: Kelompok Gajah Mada"
                                            />
                                        </div>

                                        {/* Nama Kabim */}
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                                <Crown size={14} className="text-amber-500" />
                                                Nama Kakak Pembimbing (Kabim) <span className="text-rose-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formState.nama_kabim}
                                                onChange={(e) => setFormState(prev => ({ ...prev, nama_kabim: e.target.value }))}
                                                className="w-full px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-900 dark:text-white transition-all placeholder:text-slate-400"
                                                placeholder="Contoh: Kak Arya & Kak Cindy"
                                            />
                                        </div>

                                        {/* Urutan Kelompok Selector (Pills 1 to 8) */}
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                                <Hash size={14} className="text-indigo-500" />
                                                Urutan / No. Kelompok <span className="text-rose-500">*</span>
                                            </label>
                                            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                                                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => {
                                                    const isSelected = parseInt(formState.urutan, 10) === num;
                                                    return (
                                                        <button
                                                            key={num}
                                                            type="button"
                                                            onClick={() => setFormState(prev => ({ ...prev, urutan: num }))}
                                                            className={`py-2.5 rounded-xl font-extrabold text-sm border transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${isSelected
                                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/30 scale-105'
                                                                    : 'bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:bg-blue-50/50'
                                                                }`}
                                                        >
                                                            <span>#{num}</span>
                                                            <span className="text-[9px] opacity-75 font-normal">Grup {num}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Link Instagram */}
                                        <div className="space-y-1.5 md:col-span-2">
                                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-500"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>
                                                Link / Username Akun Instagram
                                            </label>
                                            <div className="relative">
                                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">
                                                    @
                                                </div>
                                                <input
                                                    type="text"
                                                    value={formState.link_instagram}
                                                    onChange={(e) => setFormState(prev => ({ ...prev, link_instagram: e.target.value }))}
                                                    className="w-full pl-8 pr-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-900 dark:text-white transition-all placeholder:text-slate-400"
                                                    placeholder="https://instagram.com/kelompok_gajahmada atau nama_akun"
                                                />
                                            </div>
                                        </div>

                                        {/* Foto Kelompok Drag & Drop Area */}
                                        <div className="space-y-1.5 md:col-span-2">
                                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                                                <ImageIcon size={14} className="text-emerald-500" />
                                                Foto / Logo Kelompok
                                            </label>

                                            <div
                                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                                onDragLeave={() => setIsDragging(false)}
                                                onDrop={(e) => {
                                                    e.preventDefault();
                                                    setIsDragging(false);
                                                    const file = e.dataTransfer.files[0];
                                                    if (file && file.type.startsWith('image/')) {
                                                        setFotoFile(file);
                                                        setFormState(prev => ({ ...prev, foto_kelompok: URL.createObjectURL(file) }));
                                                    }
                                                }}
                                                className={`relative border-2 border-dashed rounded-2xl p-4 sm:p-5 transition-all text-center ${isDragging
                                                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20'
                                                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800/30 hover:border-slate-300'
                                                    }`}
                                            >
                                                {formState.foto_kelompok ? (
                                                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                                        <img
                                                            src={formState.foto_kelompok}
                                                            alt="Preview Kelompok"
                                                            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-white dark:border-slate-700 shadow-md"
                                                        />
                                                        <div className="text-center sm:text-left space-y-2">
                                                            <div className="flex items-center gap-2 justify-center sm:justify-start">
                                                                <span className="text-xs font-bold text-slate-800 dark:text-white">Foto Terpilih</span>
                                                                <CheckCircle2 size={15} className="text-emerald-500" />
                                                            </div>
                                                            <p className="text-xs text-slate-400">
                                                                {fotoFile ? fotoFile.name : 'Foto kelompok saat ini'}
                                                            </p>
                                                            <div className="flex items-center gap-2 justify-center sm:justify-start pt-1">
                                                                <label className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold border border-blue-200 dark:border-blue-800/40 hover:bg-blue-100 transition-colors cursor-pointer inline-flex items-center gap-1.5">
                                                                    <UploadCloud size={14} /> Ganti Foto
                                                                    <input
                                                                        type="file"
                                                                        accept="image/*"
                                                                        className="hidden"
                                                                        onChange={(e) => {
                                                                            const file = e.target.files[0];
                                                                            if (file) {
                                                                                setFotoFile(file);
                                                                                setFormState(prev => ({ ...prev, foto_kelompok: URL.createObjectURL(file) }));
                                                                            }
                                                                        }}
                                                                    />
                                                                </label>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setFotoFile(null);
                                                                        setFormState(prev => ({ ...prev, foto_kelompok: '' }));
                                                                    }}
                                                                    className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-900/40 hover:bg-rose-100 transition-colors cursor-pointer inline-flex items-center gap-1"
                                                                >
                                                                    <Trash2 size={13} /> Hapus
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <label className="flex flex-col items-center justify-center gap-2 cursor-pointer py-2">
                                                        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
                                                            <UploadCloud size={24} />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white">
                                                                Klik untuk upload atau drag & drop file foto kelompok
                                                            </p>
                                                            <p className="text-[11px] text-slate-400 mt-0.5">
                                                                Format didukung: PNG, JPG, WEBP (Maksimal 5MB)
                                                            </p>
                                                        </div>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={(e) => {
                                                                const file = e.target.files[0];
                                                                if (file) {
                                                                    setFotoFile(file);
                                                                    setFormState(prev => ({ ...prev, foto_kelompok: URL.createObjectURL(file) }));
                                                                }
                                                            }}
                                                        />
                                                    </label>
                                                )}
                                            </div>
                                        </div>

                                        {/* Keterangan / Deskripsi */}
                                        <div className="space-y-1.5 md:col-span-2">
                                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                                Keterangan / Slogan Kelompok
                                            </label>
                                            <textarea
                                                value={formState.keterangan}
                                                onChange={(e) => setFormState(prev => ({ ...prev, keterangan: e.target.value }))}
                                                rows={2}
                                                className="w-full px-4 py-2.5 text-sm border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-900 dark:text-white transition-all placeholder:text-slate-400"
                                                placeholder="Tulis yel-yel, slogan, atau deskripsi singkat kelompok..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: PILIH ANGGOTA KELOMPOK */}
                            {modalTab === 'members' && (
                                <div className="space-y-5 animate-in fade-in duration-200">

                                    {/* Header & Selected Members Counter Strip */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
                                        <div>
                                            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                                                <UserPlus size={16} className="text-blue-600" />
                                                Daftar Anggota Kelompok
                                            </h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                Pilih mahasiswa PKKMB (status lunas) yang akan ditugaskan ke kelompok ini.
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                type="button"
                                                onClick={handleSelectAllFiltered}
                                                className="px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 rounded-xl border border-blue-200 dark:border-blue-800/60 hover:bg-blue-50 shadow-2xs transition-all cursor-pointer"
                                            >
                                                Pilih Semua Filter
                                            </button>
                                            {selectedMembers.length > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={handleClearSelectedMembers}
                                                    className="px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-800 rounded-xl border border-rose-200 dark:border-rose-900/40 hover:bg-rose-50 shadow-2xs transition-all cursor-pointer"
                                                >
                                                    Kosongkan ({selectedMembers.length})
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Selected Members Chips Drawer */}
                                    {selectedMembers.length > 0 && (
                                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
                                            <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                                                <span>Anggota Terpilih ({selectedMembers.length} Orang):</span>
                                                <span className="text-[11px] font-normal text-slate-400">Klik tanda silang (x) untuk menghapus</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 custom-scrollbar">
                                                {selectedMembers.map(m => (
                                                    <span
                                                        key={m.nim_anggota}
                                                        className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-xl text-xs font-bold bg-blue-600 text-white shadow-2xs animate-in zoom-in-90 duration-150"
                                                    >
                                                        <span>{m.nama_anggota}</span>
                                                        <span className="text-[10px] opacity-75 font-mono">({m.nim_anggota})</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedMembers(prev => prev.filter(x => x.nim_anggota !== m.nim_anggota))}
                                                            className="w-4 h-4 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center transition-colors cursor-pointer"
                                                        >
                                                            <X size={10} />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Search & Filter Bar */}
                                    <div className="flex flex-col sm:flex-row gap-2.5">
                                        <div className="relative flex-1">
                                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Cari nama mahasiswa, NIM, atau prodi..."
                                                value={memberSearchQuery}
                                                onChange={(e) => setMemberSearchQuery(e.target.value)}
                                                className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-900 dark:text-white transition-all placeholder:text-slate-400"
                                            />
                                            {memberSearchQuery && (
                                                <button
                                                    type="button"
                                                    onClick={() => setMemberSearchQuery('')}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                                                >
                                                    <X size={14} />
                                                </button>
                                            )}
                                        </div>
                                        <select
                                            value={memberStatusFilter}
                                            onChange={(e) => setMemberStatusFilter(e.target.value)}
                                            className="py-2.5 px-3.5 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-800 dark:text-white font-semibold cursor-pointer"
                                        >
                                            <option value="belum">Belum Ada Kelompok</option>
                                            <option value="semua">Semua Peserta Wajib</option>
                                            <option value="sudah">Sudah Berkelompok</option>
                                        </select>
                                    </div>

                                    {/* Member Card Grid */}
                                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl max-h-72 overflow-y-auto bg-slate-50/40 dark:bg-slate-900/60 p-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5 custom-scrollbar">
                                        {filteredPesertaWajib.length === 0 ? (
                                            <div className="col-span-full py-10 text-center text-slate-400 space-y-1">
                                                <Users size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                                                <p className="text-xs sm:text-sm font-semibold">Tidak ada peserta yang cocok dengan pencarian.</p>
                                                <p className="text-[11px]">Coba sesuaikan kata kunci atau ubah filter status kelompok.</p>
                                            </div>
                                        ) : (
                                            filteredPesertaWajib.map(p => {
                                                const isChecked = selectedMembers.some(m => m.nim_anggota === p.nim);
                                                const isAssignedOther = p.sudah_berkelompok && !isChecked;

                                                return (
                                                    <div
                                                        key={p.id || p.nim}
                                                        onClick={() => {
                                                            if (!isAssignedOther) {
                                                                handleToggleMemberSelection(p);
                                                            }
                                                        }}
                                                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${isChecked
                                                                ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 shadow-xs'
                                                                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/70 hover:border-blue-300 dark:hover:border-slate-600'
                                                            } ${isAssignedOther ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-900' : 'cursor-pointer hover:scale-[1.01]'}`}
                                                    >
                                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                            <div className={`w-8 h-8 rounded-xl font-extrabold text-xs flex items-center justify-center shrink-0 transition-colors ${isChecked
                                                                    ? 'bg-blue-600 text-white'
                                                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                                                }`}>
                                                                {getInitials(p.nama)}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className={`text-xs font-bold truncate ${isChecked ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-white'
                                                                    }`}>
                                                                    {p.nama}
                                                                </p>
                                                                <div className="flex items-center gap-1.5 flex-wrap mt-0.5 text-[10px]">
                                                                    <span className="font-mono text-slate-500 dark:text-slate-400 font-semibold">{p.nim}</span>
                                                                    {p.prodi && (
                                                                        <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium truncate max-w-[90px]">
                                                                            {p.prodi}
                                                                        </span>
                                                                    )}
                                                                    {p.kelas && (
                                                                        <span className="px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-medium">
                                                                            {p.kelas}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Status / Checkbox */}
                                                        {isAssignedOther ? (
                                                            <span className="text-[9px] font-bold text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full shrink-0">
                                                                Sudah Berkelompok
                                                            </span>
                                                        ) : (
                                                            <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all ${isChecked
                                                                    ? 'bg-blue-600 border-blue-600 text-white'
                                                                    : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700'
                                                                }`}>
                                                                {isChecked && <Check size={13} className="stroke-[3]" />}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium self-start sm:self-center">
                                {formState.nama_kelompok ? (
                                    <span className="inline-flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                        <strong>{formState.nama_kelompok}</strong> (Urutan #{formState.urutan}) • {selectedMembers.length} Anggota Terpilih
                                    </span>
                                ) : (
                                    <span className="text-slate-400 italic">Isi informasi kelompok & pilih anggota</span>
                                )}
                            </div>

                            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="flex-1 sm:flex-none px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                                >
                                    Batal
                                </button>

                                {modalTab === 'info' ? (
                                    <button
                                        type="button"
                                        onClick={() => setModalTab('members')}
                                        className="flex-1 sm:flex-none px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                                    >
                                        Pilih Anggota ({selectedMembers.length}) <ArrowRight size={15} />
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setModalTab('info')}
                                        className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                    >
                                        <ArrowLeft size={15} /> Kembali ke Info
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={submitting || !formState.nama_kelompok || !formState.nama_kabim}
                                    className="flex-1 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                                >
                                    {submitting ? (
                                        <>
                                            <RefreshCw size={15} className="animate-spin" /> Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 size={16} /> {editingKelompok ? 'Update Kelompok' : 'Simpan Kelompok'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}

