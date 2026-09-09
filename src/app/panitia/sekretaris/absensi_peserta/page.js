'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    UserCheck,
    Search,
    Calendar,
    Save,
    RotateCcw,
    AlertCircle,
    CheckCircle2,
    Users,
    Activity,
    Layers,
    Clock,
    FileText
} from 'lucide-react';
import { getCurrentAdmin } from '@/api/supabase/admin/auth';
import { hasAccess, getSiteFromRole } from '@/lib/adminRoleData';
import {
    getJadwalAcaraPkkmbList,
    getKelompokMembersForKabim,
    getPesertaListForPose,
    getAbsensiPesertaByJadwal,
    getAbsensiPesertaPoseByJudul,
    saveBatchAbsensiPesertaPkkmb,
    saveBatchAbsensiPesertaPose
} from '@/api/supabase/admin/absensi_peserta';
import TombolCetak from '@/components/panitia/TombolCetak';
import TablePagination from '@/components/panitia/TablePagination';

const ITEMS_PER_PAGE = 15;

const STATUS_OPTIONS = [
    { value: 'Hadir', label: 'Hadir', activeClass: 'bg-emerald-600 text-white border-emerald-600', inactiveClass: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-emerald-50 hover:text-emerald-700' },
    { value: 'Izin', label: 'Izin', activeClass: 'bg-blue-600 text-white border-blue-600', inactiveClass: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-blue-50 hover:text-blue-700' },
    { value: 'Sakit', label: 'Sakit', activeClass: 'bg-amber-600 text-white border-amber-600', inactiveClass: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-amber-50 hover:text-amber-700' },
    { value: 'Alpha', label: 'Alpha', activeClass: 'bg-rose-600 text-white border-rose-600', inactiveClass: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-rose-50 hover:text-rose-700' },
];

export default function AbsensiPesertaSekretarisPage() {
    const router = useRouter();
    const [admin, setAdmin] = useState(null);
    const [site, setSite] = useState('pkkmb');
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);

    // PKKMB Sessions & POSE Sessions
    const [jadwalList, setJadwalList] = useState([]);
    const [selectedJadwalId, setSelectedJadwalId] = useState('');
    const [poseJudulAbsen, setPoseJudulAbsen] = useState('');

    // Participant Master List
    const [pesertaList, setPesertaList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Attendance State Mapping: { [pesertaId]: { jenis_absensi: 'Hadir'|'Izin'|'Sakit'|'Alpha', keterangan: string } }
    const [absensiMap, setAbsensiMap] = useState({});
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);

    // Toast
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    // Get Storage Key for LocalStorage Draft
    const getStorageDraftKey = useCallback(() => {
        if (site === 'pkkmb') {
            return selectedJadwalId ? `absensi_peserta_draft_pkkmb_${selectedJadwalId}` : null;
        } else {
            return poseJudulAbsen ? `absensi_peserta_draft_pose_${poseJudulAbsen.trim().toLowerCase().replace(/\s+/g, '_')}` : null;
        }
    }, [site, selectedJadwalId, poseJudulAbsen]);

    // Initial Auth
    useEffect(() => {
        const init = async () => {
            try {
                const currentAdmin = await getCurrentAdmin();
                if (!currentAdmin || !hasAccess(currentAdmin.role, '/panitia/sekretaris/absensi_peserta')) {
                    router.push('/panitia/login');
                    return;
                }

                setAdmin(currentAdmin);
                const isSuper = currentAdmin.role === 'super_admin';
                setIsSuperAdmin(isSuper);

                const detectedSite = getSiteFromRole(currentAdmin.role);
                const initialSite = isSuper ? 'pkkmb' : detectedSite;
                setSite(initialSite);
            } catch (err) {
                console.error('Init error:', err);
                router.push('/panitia/login');
            }
        };

        init();
    }, [router]);

    // Fetch initial sessions & members
    const fetchMasterData = useCallback(async (currentSite) => {
        setLoading(true);
        try {
            if (currentSite === 'pkkmb') {
                const [jadwalRes, membersRes] = await Promise.all([
                    getJadwalAcaraPkkmbList(),
                    getKelompokMembersForKabim()
                ]);

                if (jadwalRes.success) {
                    setJadwalList(jadwalRes.data || []);
                    if (jadwalRes.data?.length > 0 && !selectedJadwalId) {
                        setSelectedJadwalId(jadwalRes.data[0].id);
                    }
                }
                if (membersRes.success) {
                    setPesertaList(membersRes.data || []);
                }
            } else {
                // POSE site
                const poseRes = await getPesertaListForPose();
                if (poseRes.success) {
                    setPesertaList(poseRes.data || []);
                }
                if (!poseJudulAbsen) {
                    setPoseJudulAbsen('Absensi Hari 1');
                }
            }
        } catch (err) {
            console.error('Error fetching master data:', err);
            showToast('Gagal memuat data peserta/sesi.', 'error');
        } finally {
            setLoading(false);
        }
    }, [selectedJadwalId, poseJudulAbsen]);

    useEffect(() => {
        if (admin) {
            fetchMasterData(site);
        }
    }, [admin, site, fetchMasterData]);

    // Load Attendance data for selected session (DB + LocalStorage Draft)
    const loadSessionAttendance = useCallback(async () => {
        if (site === 'pkkmb' && !selectedJadwalId) return;
        if (site === 'pose' && !poseJudulAbsen.trim()) return;

        setLoading(true);
        const draftKey = getStorageDraftKey();
        let savedDraft = null;
        if (draftKey && typeof window !== 'undefined') {
            try {
                const raw = localStorage.getItem(draftKey);
                if (raw) savedDraft = JSON.parse(raw);
            } catch (e) {
                console.error('Failed reading draft from localStorage:', e);
            }
        }

        const newMap = {};

        // 1. Inisialisasi default 'Hadir' untuk seluruh peserta
        pesertaList.forEach(p => {
            newMap[p.id] = {
                jenis_absensi: 'Hadir',
                keterangan: ''
            };
        });

        // 2. Fetch existing from DB
        try {
            if (site === 'pkkmb' && selectedJadwalId) {
                const res = await getAbsensiPesertaByJadwal(selectedJadwalId);
                if (res.success && Array.isArray(res.data)) {
                    res.data.forEach(item => {
                        if (item.kelompok_members_id) {
                            newMap[item.kelompok_members_id] = {
                                jenis_absensi: item.jenis_absensi || 'Hadir',
                                keterangan: item.keterangan || ''
                            };
                        }
                    });
                }
            } else if (site === 'pose' && poseJudulAbsen.trim()) {
                const res = await getAbsensiPesertaPoseByJudul(poseJudulAbsen.trim());
                if (res.success && Array.isArray(res.data)) {
                    // Match by NIM atau Nama
                    const byNim = {};
                    res.data.forEach(item => {
                        if (item.nim_peserta) byNim[item.nim_peserta] = item;
                    });
                    pesertaList.forEach(p => {
                        if (p.nim && byNim[p.nim]) {
                            newMap[p.id] = {
                                jenis_absensi: byNim[p.nim].jenis_absensi || 'Hadir',
                                keterangan: byNim[p.nim].keterangan || ''
                            };
                        }
                    });
                }
            }
        } catch (dbErr) {
            console.error('Error fetching DB attendance:', dbErr);
        }

        // 3. Override dengan draft localStorage jika ada
        if (savedDraft && typeof savedDraft === 'object') {
            Object.keys(savedDraft).forEach(id => {
                if (newMap[id]) {
                    newMap[id] = savedDraft[id];
                }
            });
            setHasUnsavedChanges(true);
        } else {
            setHasUnsavedChanges(false);
        }

        setAbsensiMap(newMap);
        setLoading(false);
    }, [site, selectedJadwalId, poseJudulAbsen, pesertaList, getStorageDraftKey]);

    useEffect(() => {
        if (pesertaList.length > 0) {
            loadSessionAttendance();
        }
    }, [pesertaList, selectedJadwalId, poseJudulAbsen, loadSessionAttendance]);

    // Handle Status Change
    const handleStatusChange = (pesertaId, newStatus) => {
        setAbsensiMap(prev => {
            const next = {
                ...prev,
                [pesertaId]: {
                    ...prev[pesertaId],
                    jenis_absensi: newStatus
                }
            };

            // Save to localStorage draft
            const draftKey = getStorageDraftKey();
            if (draftKey && typeof window !== 'undefined') {
                localStorage.setItem(draftKey, JSON.stringify(next));
            }

            return next;
        });
        setHasUnsavedChanges(true);
    };

    // Handle Keterangan Change
    const handleKeteranganChange = (pesertaId, newKet) => {
        setAbsensiMap(prev => {
            const next = {
                ...prev,
                [pesertaId]: {
                    ...prev[pesertaId],
                    keterangan: newKet
                }
            };

            // Save to localStorage draft
            const draftKey = getStorageDraftKey();
            if (draftKey && typeof window !== 'undefined') {
                localStorage.setItem(draftKey, JSON.stringify(next));
            }

            return next;
        });
        setHasUnsavedChanges(true);
    };

    // Reset draft
    const handleResetDraft = () => {
        const draftKey = getStorageDraftKey();
        if (draftKey && typeof window !== 'undefined') {
            localStorage.removeItem(draftKey);
        }
        loadSessionAttendance();
        showToast('Draft lokal berhasil direset.');
    };

    // Save Attendance to DB
    const handleSaveToDatabase = async () => {
        setSaving(true);
        try {
            if (site === 'pkkmb') {
                if (!selectedJadwalId) {
                    showToast('Pilih jadwal acara PKKMB terlebih dahulu.', 'error');
                    return;
                }

                const payloadList = pesertaList.map(p => ({
                    kelompok_members_id: p.id,
                    jenis_absensi: absensiMap[p.id]?.jenis_absensi || 'Hadir',
                    keterangan: absensiMap[p.id]?.keterangan || ''
                }));

                const res = await saveBatchAbsensiPesertaPkkmb({
                    jadwal_acara_pkkmb_id: selectedJadwalId,
                    absensi_list: payloadList
                });

                if (res.success) {
                    const draftKey = getStorageDraftKey();
                    if (draftKey && typeof window !== 'undefined') {
                        localStorage.removeItem(draftKey);
                    }
                    setHasUnsavedChanges(false);
                    showToast(`Absensi PKKMB berhasil disimpan (${res.count} peserta).`);
                } else {
                    showToast(res.error || 'Gagal menyimpan absensi.', 'error');
                }
            } else {
                // POSE
                if (!poseJudulAbsen.trim()) {
                    showToast('Judul sesi absensi POSE wajib diisi.', 'error');
                    return;
                }

                const payloadList = pesertaList.map(p => ({
                    nama_peserta: p.nama,
                    nim_peserta: p.nim || '-',
                    jenis_absensi: absensiMap[p.id]?.jenis_absensi || 'Hadir',
                    keterangan: absensiMap[p.id]?.keterangan || ''
                }));

                const res = await saveBatchAbsensiPesertaPose({
                    judul_absensi: poseJudulAbsen.trim(),
                    absensi_list: payloadList
                });

                if (res.success) {
                    const draftKey = getStorageDraftKey();
                    if (draftKey && typeof window !== 'undefined') {
                        localStorage.removeItem(draftKey);
                    }
                    setHasUnsavedChanges(false);
                    showToast(`Absensi POSE berhasil disimpan (${res.count} peserta).`);
                } else {
                    showToast(res.error || 'Gagal menyimpan absensi.', 'error');
                }
            }
        } catch (err) {
            console.error('Error saving to database:', err);
            showToast('Terjadi kesalahan saat menyimpan ke database.', 'error');
        } finally {
            setSaving(false);
        }
    };

    // Filtered data
    const filteredPesertaList = useMemo(() => {
        return pesertaList.filter(p => {
            const q = searchQuery.toLowerCase().trim();
            const currentStatus = absensiMap[p.id]?.jenis_absensi || 'Hadir';

            if (statusFilter !== 'all' && currentStatus !== statusFilter) {
                return false;
            }

            if (!q) return true;

            const nama = (p.nama_anggota || p.nama || '').toLowerCase();
            const nim = (p.nim_anggota || p.nim || '').toLowerCase();
            const kel = (p.nama_kelompok || p.kampus || '').toLowerCase();
            const kabim = (p.nama_kabim || p.prodi || '').toLowerCase();

            return nama.includes(q) || nim.includes(q) || kel.includes(q) || kabim.includes(q);
        });
    }, [pesertaList, absensiMap, searchQuery, statusFilter]);

    const totalPages = Math.ceil(filteredPesertaList.length / ITEMS_PER_PAGE) || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedData = filteredPesertaList.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilter, site]);

    // Summary Count
    const stats = useMemo(() => {
        let hadir = 0, izin = 0, sakit = 0, alpha = 0;
        pesertaList.forEach(p => {
            const st = absensiMap[p.id]?.jenis_absensi || 'Hadir';
            if (st === 'Hadir') hadir++;
            else if (st === 'Izin') izin++;
            else if (st === 'Sakit') sakit++;
            else if (st === 'Alpha') alpha++;
        });
        return { total: pesertaList.length, hadir, izin, sakit, alpha };
    }, [pesertaList, absensiMap]);

    // Print Data preparation
    const printColumns = [
        { key: 'no', label: 'No' },
        { key: 'nama_peserta', label: 'Nama Peserta' },
        { key: 'nim', label: 'NIM' },
        { key: 'kelompok_kampus', label: site === 'pkkmb' ? 'Kelompok' : 'Kampus / Prodi' },
        { key: 'status_absensi', label: 'Status' },
        { key: 'keterangan', label: 'Keterangan' }
    ];

    const printData = useMemo(() => {
        return filteredPesertaList.map((p, idx) => ({
            no: idx + 1,
            nama_peserta: p.nama_anggota || p.nama || '-',
            nim: p.nim_anggota || p.nim || '-',
            kelompok_kampus: site === 'pkkmb' ? (p.nama_kelompok || '-') : `${p.kampus || '-'} / ${p.prodi || '-'}`,
            status_absensi: absensiMap[p.id]?.jenis_absensi || 'Hadir',
            keterangan: absensiMap[p.id]?.keterangan || '-'
        }));
    }, [filteredPesertaList, absensiMap, site]);

    return (
        <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
            {/* Toast Notification */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-sm font-medium animate-in slide-in-from-bottom-5 duration-200 ${
                    toast.type === 'error'
                        ? 'bg-rose-500 text-white border-rose-600'
                        : 'bg-emerald-600 text-white border-emerald-700'
                }`}>
                    {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                    <span>{toast.message}</span>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="p-2.5 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-2xl">
                            <UserCheck size={24} />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                            Absensi Peserta ({site.toUpperCase()})
                        </h1>
                    </div>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Input absensi kehadiran mahasiswa peserta kegiatan per sesi secara massal dengan dukungan draft otomatis
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    {/* Super Admin Switcher */}
                    {isSuperAdmin && (
                        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700">
                            <button
                                onClick={() => setSite('pkkmb')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    site === 'pkkmb'
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                }`}
                            >
                                PKKMB
                            </button>
                            <button
                                onClick={() => setSite('pose')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    site === 'pose'
                                        ? 'bg-amber-600 text-white shadow-xs'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                }`}
                            >
                                POSE
                            </button>
                        </div>
                    )}

                    <TombolCetak
                        pdfTitle={`Laporan Absensi Peserta ${site.toUpperCase()} 2026`}
                        pdfSite={site}
                        pdfData={printData}
                        pdfColumns={printColumns}
                        excelData={printData}
                        excelColumns={printColumns}
                        excelFilename={`absensi-peserta-${site}`}
                    />

                    {hasUnsavedChanges && (
                        <button
                            type="button"
                            onClick={handleResetDraft}
                            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
                            title="Reset Draft Lokal"
                        >
                            <RotateCcw size={15} />
                            <span>Reset Draft</span>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={handleSaveToDatabase}
                        disabled={saving || loading || pesertaList.length === 0}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
                    >
                        <Save size={16} />
                        <span>{saving ? 'Menyimpan...' : 'Simpan Absensi'}</span>
                    </button>
                </div>
            </div>

            {/* Sesi Selector Panel */}
            <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <Calendar size={18} className="text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                            Pilih Sesi Absensi
                        </span>
                    </div>

                    {hasUnsavedChanges && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 rounded-xl text-[11px] font-bold animate-pulse">
                            <Clock size={12} />
                            Draft tersimpan di browser (Belum disimpan ke database)
                        </span>
                    )}
                </div>

                {site === 'pkkmb' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-[11px] font-bold text-slate-400 block mb-1">Jadwal Acara PKKMB</label>
                            <select
                                value={selectedJadwalId}
                                onChange={(e) => setSelectedJadwalId(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {jadwalList.length === 0 ? (
                                    <option value="">-- Belum Ada Jadwal Acara --</option>
                                ) : (
                                    jadwalList.map((j) => (
                                        <option key={j.id} value={j.id}>
                                            {j.judul}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-[11px] font-bold text-slate-400 block mb-1">Nama / Judul Sesi POSE</label>
                            <input
                                type="text"
                                placeholder="Contoh: Day 1 - Pembukaan, Final Futsal, dll..."
                                value={poseJudulAbsen}
                                onChange={(e) => setPoseJudulAbsen(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Stats Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm col-span-2 sm:col-span-1">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Peserta</span>
                    <p className="mt-1 text-2xl font-black text-slate-800 dark:text-white">
                        {loading ? '...' : stats.total}
                    </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Hadir</span>
                    <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">
                        {loading ? '...' : stats.hadir}
                    </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Izin</span>
                    <p className="mt-1 text-2xl font-black text-blue-600 dark:text-blue-400">
                        {loading ? '...' : stats.izin}
                    </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Sakit</span>
                    <p className="mt-1 text-2xl font-black text-amber-600 dark:text-amber-400">
                        {loading ? '...' : stats.sakit}
                    </p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Alpha</span>
                    <p className="mt-1 text-2xl font-black text-rose-600 dark:text-rose-400">
                        {loading ? '...' : stats.alpha}
                    </p>
                </div>
            </div>

            {/* Filter Tabs & Search */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                    {[
                        { id: 'all', label: 'Semua Peserta' },
                        { id: 'Hadir', label: `Hadir (${stats.hadir})` },
                        { id: 'Izin', label: `Izin (${stats.izin})` },
                        { id: 'Sakit', label: `Sakit (${stats.sakit})` },
                        { id: 'Alpha', label: `Alpha (${stats.alpha})` }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setStatusFilter(tab.id)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                statusFilter === tab.id
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <Search size={18} className="text-slate-400 shrink-0" />
                    <input
                        type="text"
                        placeholder="Cari nama peserta, NIM, atau kelompok..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-transparent text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>

            {/* Table Absensi */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-base">
                            Daftar Mahasiswa Peserta ({site.toUpperCase()})
                        </h3>
                        <p className="text-xs text-slate-400">
                            Pilih status kehadiran untuk setiap peserta
                        </p>
                    </div>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                        {filteredPesertaList.length} Peserta
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="bg-slate-50/75 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                                <th className="py-3.5 px-4 w-14 text-center">No</th>
                                <th className="py-3.5 px-4">Nama Lengkap</th>
                                <th className="py-3.5 px-4 w-36">NIM</th>
                                <th className="py-3.5 px-4 min-w-[160px]">{site === 'pkkmb' ? 'Kelompok' : 'Kampus / Prodi'}</th>
                                <th className="py-3.5 px-4 min-w-[280px]">Status Kehadiran</th>
                                <th className="py-3.5 px-4 min-w-[200px]">Keterangan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, idx) => (
                                    <tr key={idx} className="animate-pulse">
                                        <td className="py-4 px-4 text-center"><div className="h-4 w-4 bg-slate-200 dark:bg-slate-800 rounded mx-auto" /></td>
                                        <td className="py-4 px-4"><div className="h-4 w-36 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                                        <td className="py-4 px-4"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                                        <td className="py-4 px-4"><div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                                        <td className="py-4 px-4"><div className="h-8 w-56 bg-slate-200 dark:bg-slate-800 rounded-xl" /></td>
                                        <td className="py-4 px-4"><div className="h-8 w-44 bg-slate-200 dark:bg-slate-800 rounded-xl" /></td>
                                    </tr>
                                ))
                            ) : paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-14 text-center">
                                        <div className="inline-flex p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 mb-2">
                                            <Users size={28} />
                                        </div>
                                        <p className="font-bold text-slate-800 dark:text-slate-200 text-base">
                                            Tidak Ada Peserta
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            {searchQuery ? `Tidak ada peserta yang cocok dengan "${searchQuery}"` : 'Belum ada data peserta terdaftar.'}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map((p, index) => {
                                    const nama = p.nama_anggota || p.nama || '-';
                                    const nim = p.nim_anggota || p.nim || '-';
                                    const infoKelompok = site === 'pkkmb'
                                        ? (p.nama_kelompok || `Kel. ${p.urutan_kelompok || '-'}`)
                                        : `${p.kampus || '-'} • ${p.prodi || '-'}`;

                                    const currentStatus = absensiMap[p.id]?.jenis_absensi || 'Hadir';
                                    const currentKet = absensiMap[p.id]?.keterangan || '';

                                    return (
                                        <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="py-4 px-4 text-center text-xs font-semibold text-slate-400">
                                                {startIndex + index + 1}
                                            </td>

                                            <td className="py-4 px-4">
                                                <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                                                    {nama}
                                                </p>
                                            </td>

                                            <td className="py-4 px-4 text-xs font-mono text-slate-600 dark:text-slate-400">
                                                {nim}
                                            </td>

                                            <td className="py-4 px-4 text-xs text-slate-600 dark:text-slate-400">
                                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                    {infoKelompok}
                                                </span>
                                                {site === 'pkkmb' && p.nama_kabim && (
                                                    <p className="text-[10px] text-slate-400">PJ: {p.nama_kabim}</p>
                                                )}
                                            </td>

                                            {/* Status Button Group */}
                                            <td className="py-4 px-4">
                                                <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800/70 rounded-xl gap-1">
                                                    {STATUS_OPTIONS.map(opt => {
                                                        const isSelected = currentStatus === opt.value;
                                                        return (
                                                            <button
                                                                key={opt.value}
                                                                type="button"
                                                                onClick={() => handleStatusChange(p.id, opt.value)}
                                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                                    isSelected ? opt.activeClass : opt.inactiveClass
                                                                }`}
                                                            >
                                                                {opt.label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </td>

                                            {/* Input Keterangan */}
                                            <td className="py-4 px-4">
                                                <input
                                                    type="text"
                                                    placeholder="Keterangan (opsional)..."
                                                    value={currentKet}
                                                    onChange={(e) => handleKeteranganChange(p.id, e.target.value)}
                                                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                />
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                        <TablePagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
