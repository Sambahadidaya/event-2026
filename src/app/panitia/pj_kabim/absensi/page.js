'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    UserCheck,
    Plus,
    Edit,
    Trash2,
    Search,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Clock,
    Users
} from 'lucide-react';
import { getCurrentAdmin } from '@/api/supabase/admin/auth';
import {
    getJadwalAcaraPkkmbList,
    getKelompokMembersForKabim,
    getAbsensiPesertaByJadwal,
    createAbsensiPeserta,
    updateAbsensiPeserta,
    deleteAbsensiPeserta
} from '@/api/supabase/admin/absensi_peserta';
import TombolCetak from '@/components/panitia/TombolCetak';
import { hasAccess, getKabimFilter } from '@/lib/adminRoleData';
import { getAbsensiDisplayDate } from '@/lib/dateUtils';
import AbsensiPesertaFormModal from '@/components/panitia/absensi/AbsensiPesertaFormModal';
import ConfirmModal from '@/components/panitia/ConfirmModal';

export default function AbsensiPesertaPage() {
    const router = useRouter();
    const [admin, setAdmin] = useState(null);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);

    // Lists loaded on mount
    const [jadwalList, setJadwalList] = useState([]);
    const [membersList, setMembersList] = useState([]);
    const [loadingInit, setLoadingInit] = useState(true);

    // Selection & filter state
    const [selectedJadwalId, setSelectedJadwalId] = useState('');
    const [historyData, setHistoryData] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editData, setEditData] = useState(null);
    const [preselectedMember, setPreselectedMember] = useState(null);

    // Delete state
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [deletingLoading, setDeletingLoading] = useState(false);

    // Initial auth & data load
    useEffect(() => {
        const checkUserAndLoad = async () => {
            const currentAdmin = await getCurrentAdmin();
            if (!currentAdmin || !hasAccess(currentAdmin.role, '/panitia/pj_kabim/absensi')) {
                router.replace('/panitia/login');
                return;
            }
            setAdmin(currentAdmin);

            const isSuper = currentAdmin.role === 'super_admin' || currentAdmin.role === 'admin_pkkmb';
            setIsSuperAdmin(isSuper);

            const kabimFilter = getKabimFilter(currentAdmin.role);

            try {
                const [jadwalRes, membersRes] = await Promise.all([
                    getJadwalAcaraPkkmbList(),
                    getKelompokMembersForKabim(kabimFilter)
                ]);

                if (jadwalRes.success) {
                    setJadwalList(jadwalRes.data || []);
                }
                if (membersRes.success) {
                    setMembersList(membersRes.data || []);
                }
            } catch (err) {
                console.error('Error loading initial absensi peserta data:', err);
            } finally {
                setLoadingInit(false);
            }
        };

        checkUserAndLoad();
    }, [router]);

    // Fetch history records when jadwal selection changes
    const fetchHistory = useCallback(async (jadwalId) => {
        if (!jadwalId) {
            setHistoryData([]);
            return;
        }
        setLoadingHistory(true);
        try {
            const res = await getAbsensiPesertaByJadwal(jadwalId);
            if (res.success) {
                setHistoryData(res.data || []);
            } else {
                setHistoryData([]);
            }
        } catch (err) {
            console.error('Error fetching absensi peserta history:', err);
            setHistoryData([]);
        } finally {
            setLoadingHistory(false);
        }
    }, []);

    useEffect(() => {
        fetchHistory(selectedJadwalId);
    }, [selectedJadwalId, fetchHistory]);

    // Format jadwal list for dropdown
    const jadwalOptions = useMemo(() => {
        return jadwalList.map(j => ({ value: j.id, label: j.judul }));
    }, [jadwalList]);

    // Map merged members + attendance data
    const combinedData = useMemo(() => {
        if (!selectedJadwalId) return [];

        const attendanceMap = new Map();
        historyData.forEach(item => {
            if (item.kelompok_members_id) {
                attendanceMap.set(String(item.kelompok_members_id), item);
            }
        });

        return membersList.map(member => {
            const attendance = attendanceMap.get(String(member.id));
            const isAttended = Boolean(attendance);

            return {
                memberId: member.id,
                nama_anggota: member.nama_anggota,
                nim_anggota: member.nim_anggota,
                urutan_kelompok: member.urutan_kelompok,
                nama_kelompok: member.nama_kelompok,
                isAttended,
                statusAbsen: isAttended ? 'Sudah Diabsen' : 'Belum Diabsen',
                attendanceId: attendance?.id || null,
                jenis_absensi: attendance?.jenis_absensi || 'Belum Diabsen',
                keterangan: attendance?.keterangan || '',
                created_by: attendance?.created_by || '',
                created_at: attendance?.created_at || null,
                attendanceRaw: attendance || null
            };
        });
    }, [membersList, historyData, selectedJadwalId]);

    // Filtered combined data based on search & status filter
    const filteredData = useMemo(() => {
        return combinedData.filter(item => {
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch =
                (item.nama_anggota || '').toLowerCase().includes(searchLower) ||
                (item.nim_anggota || '').toLowerCase().includes(searchLower) ||
                (item.nama_kelompok || '').toLowerCase().includes(searchLower) ||
                `kelompok ${item.urutan_kelompok}`.toLowerCase().includes(searchLower);

            let matchesStatus = true;
            if (statusFilter !== 'all') {
                if (statusFilter === 'Sudah Diabsen') {
                    matchesStatus = item.isAttended;
                } else if (statusFilter === 'Belum Diabsen') {
                    matchesStatus = !item.isAttended;
                } else {
                    matchesStatus = item.jenis_absensi === statusFilter;
                }
            }

            return matchesSearch && matchesStatus;
        });
    }, [combinedData, searchQuery, statusFilter]);

    // Summary counts
    const totalCounts = useMemo(() => {
        let hadir = 0, izin = 0, sakit = 0, alpha = 0, belum = 0;
        combinedData.forEach(item => {
            if (!item.isAttended) {
                belum++;
            } else {
                const type = (item.jenis_absensi || '').toLowerCase();
                if (type === 'hadir') hadir++;
                else if (type === 'izin') izin++;
                else if (type === 'sakit') sakit++;
                else if (type === 'alpha') alpha++;
            }
        });
        return { hadir, izin, sakit, alpha, belum, total: combinedData.length };
    }, [combinedData]);

    // Handle mutations
    const handleSave = async (payload) => {
        try {
            if (editData) {
                const res = await updateAbsensiPeserta(editData.id, payload);
                if (res.success) {
                    await fetchHistory(selectedJadwalId);
                    return true;
                }
            } else {
                const res = await createAbsensiPeserta({
                    ...payload,
                    created_by: admin?.nama || admin?.email || 'PJ Kabim'
                });
                if (res.success) {
                    await fetchHistory(selectedJadwalId);
                    return true;
                }
            }
        } catch (err) {
            console.error('Error saving absensi peserta:', err);
        }
        return false;
    };

    const triggerAbsenMember = (item) => {
        const targetMember = membersList.find(m => String(m.id) === String(item.memberId));
        setPreselectedMember(targetMember || null);
        setEditData(null);
        setIsModalOpen(true);
    };

    const triggerEdit = (item) => {
        setPreselectedMember(null);
        setEditData(item.attendanceRaw);
        setIsModalOpen(true);
    };

    const triggerDelete = (attendanceId) => {
        setDeletingId(attendanceId);
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingId) return;
        setDeletingLoading(true);
        try {
            const res = await deleteAbsensiPeserta(deletingId);
            if (res.success) {
                await fetchHistory(selectedJadwalId);
                setIsConfirmOpen(false);
            } else {
                alert(res.error || 'Gagal menghapus data absensi.');
            }
        } catch (err) {
            console.error('Error deleting absensi record:', err);
            alert('Terjadi kesalahan saat menghapus data.');
        } finally {
            setDeletingLoading(false);
            setDeletingId(null);
        }
    };

    const selectedJadwal = useMemo(() => {
        return jadwalList.find(j => j.id === selectedJadwalId);
    }, [jadwalList, selectedJadwalId]);

    if (loadingInit || !admin) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-9 h-9 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-2xl shadow-sm">
                        <UserCheck size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white leading-tight">
                            Absensi Peserta PKKMB
                        </h2>
                        <p className="text-xs text-slate-450 dark:text-slate-500 mt-1 font-medium">
                            Catat dan pantau kehadiran anggota kelompok PKKMB per sesi jadwal acara.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            setEditData(null);
                            setPreselectedMember(null);
                            setIsModalOpen(true);
                        }}
                        disabled={!selectedJadwalId}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Plus size={16} />
                        <span>Isi Absen Baru</span>
                    </button>
                </div>
            </div>

            {/* Selection & Toolbar Filter */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-xs">
                <div className="w-full md:w-96 flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        Pilih Sesi Jadwal Acara PKKMB
                    </label>
                    <select
                        value={selectedJadwalId}
                        onChange={(e) => setSelectedJadwalId(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:border-blue-500"
                    >
                        <option value="">-- Pilih Sesi Acara (Default Kosong) --</option>
                        {jadwalList.map(j => (
                            <option key={j.id} value={j.id}>{j.judul}</option>
                        ))}
                    </select>
                </div>

                {selectedJadwalId && (
                    <div className="w-full md:w-auto flex flex-wrap items-center gap-3 pt-2 md:pt-0">
                        {/* Search field */}
                        <div className="relative w-full sm:w-56">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Cari nama, NIM, kel..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        {/* Status filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="py-2 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl text-slate-700 dark:text-slate-200 text-xs focus:outline-none focus:border-blue-500"
                        >
                            <option value="all">Semua Status</option>
                            <option value="Hadir">Hadir</option>
                            <option value="Izin">Izin</option>
                            <option value="Sakit">Sakit</option>
                            <option value="Alpha">Alpha</option>
                            <option value="Sudah Diabsen">Sudah Diabsen</option>
                            <option value="Belum Diabsen">Belum Diabsen</option>
                        </select>

                        {/* Export actions */}
                        <TombolCetak
                            label="Cetak / Export"
                            pdfTitle={`Laporan Absensi Peserta PKKMB - ${selectedJadwal?.judul || 'Sesi'}`}
                            pdfSite="pkkmb"
                            pdfData={filteredData.map(item => ({
                                nama_anggota: item.nama_anggota,
                                nim_anggota: item.nim_anggota || '-',
                                kelompok: `Kel. ${item.urutan_kelompok || item.nama_kelompok || '-'}`,
                                jenis_absensi: item.jenis_absensi,
                                status_absen: item.statusAbsen,
                                keterangan: item.keterangan || '-',
                                created_by: item.created_by ? item.created_by.replace('_', ' ') : '-',
                                tanggal_input: item.created_at || '-'
                            }))}
                            pdfColumns={[
                                { key: 'nama_anggota', label: 'Nama Peserta' },
                                { key: 'nim_anggota', label: 'NIM', align: 'center' },
                                { key: 'kelompok', label: 'Kelompok', align: 'center' },
                                { key: 'status_absen', label: 'Status', align: 'center' },
                                { key: 'jenis_absensi', label: 'Kehadiran', align: 'center' },
                                { key: 'keterangan', label: 'Keterangan' },
                                { key: 'created_by', label: 'Diinput Oleh', align: 'center' }
                            ]}
                            pdfDocumentType="absensi_peserta_report"
                            pdfExtraProps={{
                                printedBy: admin?.nama || admin?.email || 'PJ Kabim',
                                sessionName: selectedJadwal?.judul || 'Sesi Acara',
                                summaryCards: [
                                    { label: 'Hadir', value: totalCounts.hadir, color: '#059669' },
                                    { label: 'Izin', value: totalCounts.izin, color: '#0284c7' },
                                    { label: 'Sakit', value: totalCounts.sakit, color: '#d97706' },
                                    { label: 'Alpha', value: totalCounts.alpha, color: '#dc2626' },
                                    { label: 'Belum Diabsen', value: totalCounts.belum, color: '#64748b' }
                                ]
                            }}
                            excelData={filteredData.map(item => ({
                                nama_anggota: item.nama_anggota,
                                nim_anggota: item.nim_anggota || '-',
                                kelompok: `Kel. ${item.urutan_kelompok || item.nama_kelompok || '-'}`,
                                jenis_absensi: item.jenis_absensi,
                                status_absen: item.statusAbsen,
                                keterangan: item.keterangan || '-',
                                created_by: item.created_by ? item.created_by.replace('_', ' ') : '-',
                                tanggal_input: item.created_at ? getAbsensiDisplayDate({ created_at: item.created_at }) : '-'
                            }))}
                            excelColumns={[
                                { key: 'nama_anggota', label: 'Nama Peserta' },
                                { key: 'nim_anggota', label: 'NIM' },
                                { key: 'kelompok', label: 'Kelompok' },
                                { key: 'status_absen', label: 'Status' },
                                { key: 'jenis_absensi', label: 'Kehadiran' },
                                { key: 'keterangan', label: 'Keterangan' },
                                { key: 'created_by', label: 'Diinput Oleh' },
                                { key: 'tanggal_input', label: 'Tanggal Input' }
                            ]}
                            excelFilename={`absensi-peserta-${selectedJadwal?.judul?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'sesi'}`}
                        />
                    </div>
                )}
            </div>

            {/* Content Table */}
            {!selectedJadwalId ? (
                <div className="flex flex-col items-center justify-center p-12 border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 rounded-2xl text-center space-y-3">
                    <AlertCircle size={32} className="text-slate-400" />
                    <div className="space-y-1">
                        <h4 className="font-bold text-slate-700 dark:text-slate-350 text-sm">
                            Tidak Ada Sesi Jadwal Acara Dipilih
                        </h4>
                        <p className="text-xs text-slate-400 dark:text-slate-500 max-w-md">
                            Silakan pilih salah satu sesi jadwal acara PKKMB di dropdown filter atas untuk memuat daftar anggota kelompok dan riwayat absensi.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900/50 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60">
                                    <th className="px-5 py-4 w-14 text-center">No</th>
                                    <th className="px-5 py-4">Nama Peserta</th>
                                    <th className="px-5 py-4 w-32 text-center">NIM</th>
                                    <th className="px-5 py-4 w-32 text-center">Kelompok</th>
                                    <th className="px-5 py-4 w-36 text-center">Status Absen</th>
                                    <th className="px-5 py-4 w-32 text-center">Jenis Absen</th>
                                    <th className="px-5 py-4">Keterangan</th>
                                    <th className="px-5 py-4 w-36 text-center">Diinput Oleh</th>
                                    <th className="px-5 py-4 w-40 text-center">Waktu Input</th>
                                    <th className="px-5 py-4 w-28 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-xs">
                                {loadingHistory ? (
                                    Array.from({ length: 4 }).map((_, i) => (
                                        <tr key={`skel-${i}`} className="animate-pulse">
                                            <td colSpan={10} className="px-5 py-4">
                                                <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded-lg w-full"></div>
                                            </td>
                                        </tr>
                                    ))
                                ) : filteredData.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="px-5 py-12 text-center text-slate-450 dark:text-slate-500">
                                            {membersList.length === 0
                                                ? 'Belum ada anggota kelompok yang terdaftar untuk akun Anda.'
                                                : 'Tidak ditemukan data peserta sesuai kriteria filter.'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredData.map((item, index) => {
                                        let badgeClass = '';
                                        if (item.jenis_absensi === 'Hadir') badgeClass = 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30';
                                        else if (item.jenis_absensi === 'Izin') badgeClass = 'text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/30';
                                        else if (item.jenis_absensi === 'Sakit') badgeClass = 'text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/30';
                                        else if (item.jenis_absensi === 'Alpha') badgeClass = 'text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/30';
                                        else badgeClass = 'text-slate-500 bg-slate-100 dark:text-slate-400 dark:bg-slate-800/40';

                                        return (
                                            <tr key={item.memberId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="px-5 py-3.5 text-center font-medium text-slate-450">
                                                    {index + 1}
                                                </td>
                                                <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-slate-100">
                                                    {item.nama_anggota}
                                                </td>
                                                <td className="px-5 py-3.5 text-center font-mono text-slate-600 dark:text-slate-350">
                                                    {item.nim_anggota || '-'}
                                                </td>
                                                <td className="px-5 py-3.5 text-center">
                                                    <span className="inline-block px-2 py-0.5 font-semibold text-[11px] rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                                        Kel. {item.urutan_kelompok || item.nama_kelompok || '-'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-center">
                                                    {item.isAttended ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold rounded-full text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40">
                                                            <CheckCircle2 size={12} />
                                                            Sudah Diabsen
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold rounded-full text-slate-500 bg-slate-100 dark:text-slate-400 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                                                            <Clock size={12} />
                                                            Belum Diabsen
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3.5 text-center">
                                                    {item.isAttended ? (
                                                        <span className={`inline-block px-2.5 py-0.5 text-xs font-bold rounded-md ${badgeClass}`}>
                                                            {item.jenis_absensi}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400">-</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3.5 text-slate-650 dark:text-slate-350 max-w-xs truncate" title={item.keterangan}>
                                                    {item.keterangan || '-'}
                                                </td>
                                                <td className="px-5 py-3.5 text-center text-slate-450 capitalize">
                                                    {item.created_by ? item.created_by.replace('_', ' ') : '-'}
                                                </td>
                                                <td className="px-5 py-3.5 text-center text-slate-450">
                                                    {item.created_at ? getAbsensiDisplayDate({ created_at: item.created_at }) : '-'}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        {item.isAttended ? (
                                                            <>
                                                                <button
                                                                    onClick={() => triggerEdit(item)}
                                                                    className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-all"
                                                                    title="Edit Absensi"
                                                                >
                                                                    <Edit size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={() => triggerDelete(item.attendanceId)}
                                                                    className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all"
                                                                    title="Hapus Absensi"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <button
                                                                onClick={() => triggerAbsenMember(item)}
                                                                className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-600 text-blue-600 dark:text-blue-400 hover:text-white font-bold text-[11px] rounded-lg transition-all border border-blue-200 dark:border-blue-900/50"
                                                                title="Isi Kehadiran"
                                                            >
                                                                <Plus size={12} />
                                                                Absen
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}

                                {/* Summary Rows */}
                                {combinedData.length > 0 && (
                                    <>
                                        <tr className="bg-slate-50 dark:bg-slate-900/60 border-t-2 border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300">
                                            <td colSpan={4} className="px-5 py-2.5 text-right tracking-wide">Jumlah Hadir :</td>
                                            <td colSpan={2} className="px-5 py-2.5 text-center">
                                                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{totalCounts.hadir}</span>
                                            </td>
                                            <td colSpan={4} className="px-5 py-2.5 text-slate-400"></td>
                                        </tr>
                                        <tr className="bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300">
                                            <td colSpan={4} className="px-5 py-2.5 text-right tracking-wide">Jumlah Izin :</td>
                                            <td colSpan={2} className="px-5 py-2.5 text-center">
                                                <span className="text-blue-600 dark:text-blue-400 font-extrabold">{totalCounts.izin}</span>
                                            </td>
                                            <td colSpan={4} className="px-5 py-2.5 text-slate-400"></td>
                                        </tr>
                                        <tr className="bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300">
                                            <td colSpan={4} className="px-5 py-2.5 text-right tracking-wide">Jumlah Sakit :</td>
                                            <td colSpan={2} className="px-5 py-2.5 text-center">
                                                <span className="text-amber-600 dark:text-amber-400 font-extrabold">{totalCounts.sakit}</span>
                                            </td>
                                            <td colSpan={4} className="px-5 py-2.5 text-slate-400"></td>
                                        </tr>
                                        <tr className="bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300">
                                            <td colSpan={4} className="px-5 py-2.5 text-right tracking-wide">Jumlah Alpha :</td>
                                            <td colSpan={2} className="px-5 py-2.5 text-center">
                                                <span className="text-rose-600 dark:text-rose-400 font-extrabold">{totalCounts.alpha}</span>
                                            </td>
                                            <td colSpan={4} className="px-5 py-2.5 text-slate-400"></td>
                                        </tr>
                                        <tr className="bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300">
                                            <td colSpan={4} className="px-5 py-2.5 text-right tracking-wide">Belum Diabsen :</td>
                                            <td colSpan={2} className="px-5 py-2.5 text-center">
                                                <span className="text-slate-500 dark:text-slate-400 font-extrabold">{totalCounts.belum}</span>
                                            </td>
                                            <td colSpan={4} className="px-5 py-2.5 text-slate-400"></td>
                                        </tr>
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal for Input / Edit Absensi Peserta */}
            <AbsensiPesertaFormModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditData(null);
                    setPreselectedMember(null);
                }}
                onSave={handleSave}
                jadwalList={jadwalOptions}
                membersList={membersList}
                historyList={historyData}
                defaultJadwalId={selectedJadwalId}
                editData={editData}
                preselectedMember={preselectedMember}
            />

            {/* Delete confirmation modal */}
            <ConfirmModal
                open={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Hapus Absensi Peserta"
                message="Apakah Anda yakin ingin menghapus data absensi peserta ini? Tindakan ini tidak dapat dibatalkan."
                confirmLabel="Ya, Hapus"
                cancelLabel="Batal"
                loading={deletingLoading}
            />
        </div>
    );
}
