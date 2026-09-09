'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    BookOpen, RefreshCw, Trash2, Image as ImageIcon, Search,
    CheckCircle2, XCircle, AlertCircle, FileCheck, Layers,
    ExternalLink, X, Eye, Users, ChevronRight, Download, Maximize2,
    Share2, User, Package, Plus, Edit3, Award, Check, Link as LinkIcon,
    Lock
} from 'lucide-react';
import {
    getMateriListForKabim,
    getTugasKabimByMateri,
    deleteTugasKabim,
    updateNilaiTugasMateri
} from '@/api/supabase/admin/tugas_kabim';
import {
    getTugasSosmedList,
    updateNilaiTugasSosmed,
    deleteTugasSosmed,
    getTugasBarangList,
    saveTugasBarang,
    deleteTugasBarang
} from '@/api/supabase/admin/tugas_penugasan';
import { getKelompokAdmin } from '@/api/supabase/admin/kelompok';
import { getDaftarHariPkkmb } from '@/api/supabase/admin/penilaian_keaktifan';
import { getCurrentAdmin } from '@/api/supabase/admin/auth';
import { getKabimFilter } from '@/lib/adminRoleData';
import TombolCetak from '@/components/panitia/TombolCetak';

export default function AdminKabimTugasManager() {
    const [admin, setAdmin] = useState(null);
    // Active Tab: 'resume' | 'sosmed_klp' | 'sosmed_ind' | 'barang'
    const [activeTab, setActiveTab] = useState('resume');

    // TAB 1: RESUME MATERI STATES
    const [materiList, setMateriList] = useState([]);
    const [selectedMateri, setSelectedMateri] = useState('');
    const [tugasList, setTugasList] = useState([]);
    const [loadingMateri, setLoadingMateri] = useState(true);
    const [loadingTugas, setLoadingTugas] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'sudah' | 'belum'

    // TAB 2 & 3: SOSMED STATES
    const [sosmedList, setSosmedList] = useState([]);
    const [loadingSosmed, setLoadingSosmed] = useState(false);

    // TAB 4: BARANG BAWAAN STATES
    const [barangList, setBarangList] = useState([]);
    const [loadingBarang, setLoadingBarang] = useState(false);
    const [kelompokDropdown, setKelompokDropdown] = useState([]);  // Semua kelompok (sesuai hak akses)
    const [allowedKelompok, setAllowedKelompok] = useState([]);   // Kelompok yang diizinkan untuk role ini
    const [lockedKelompokId, setLockedKelompokId] = useState(null); // null = bebas, string = terkunci
    const [daftarHari, setDaftarHari] = useState([]);

    // Common search & preview
    const [searchQuery, setSearchQuery] = useState('');
    const [previewImage, setPreviewImage] = useState(null);
    const [activePreviewIndex, setActivePreviewIndex] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [toastMessage, setToastMessage] = useState(null);

    // MODAL BERI NILAI RESUME / SOSMED
    const [modalNilai, setModalNilai] = useState({
        open: false,
        type: 'resume', // 'resume' | 'sosmed'
        id: null,
        nama: '',
        materi_or_platform: '',
        nilai: 5,
        catatan: ''
    });

    // MODAL INPUT BARANG BAWAAN
    const [modalBarang, setModalBarang] = useState({
        open: false,
        id: null,
        tipe_barang: 'kelompok', // 'kelompok' | 'individu'
        kelompok_id: '',
        kelompok_members_id: '',
        label_hari: 'Hari 1',
        total_barang_wajib: 1,
        barang_dibawa: 1,
        catatan: ''
    });

    const showToast = (message, type = 'success') => {
        setToastMessage({ message, type });
        setTimeout(() => setToastMessage(null), 3500);
    };

    // Format tanggal Indonesia
    const formatTanggal = (dateString) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).format(date);
        } catch {
            return dateString;
        }
    };

    // Fetch master materi
    const fetchMateriList = useCallback(async () => {
        setLoadingMateri(true);
        const res = await getMateriListForKabim();
        if (res.success) {
            setMateriList(res.data || []);
        } else {
            showToast(res.error || 'Gagal memuat materi', 'error');
        }
        setLoadingMateri(false);
    }, []);

    // Fetch tugas resume materi
    const fetchTugasResume = useCallback(async (materiId) => {
        if (!materiId) {
            setTugasList([]);
            return;
        }
        setLoadingTugas(true);
        const res = await getTugasKabimByMateri(materiId);
        if (res.success) {
            setTugasList(res.data || []);
        } else {
            showToast(res.error || 'Gagal memuat data tugas', 'error');
            setTugasList([]);
        }
        setLoadingTugas(false);
    }, []);

    // Fetch tugas sosmed
    const fetchSosmed = useCallback(async (tipe) => {
        setLoadingSosmed(true);
        const res = await getTugasSosmedList({ tipe_tugas: tipe });
        if (res.success) {
            setSosmedList(res.data || []);
        } else {
            showToast(res.error || 'Gagal memuat data sosial media', 'error');
        }
        setLoadingSosmed(false);
    }, []);

    // Fetch tugas barang bawaan
    const fetchBarang = useCallback(async () => {
        setLoadingBarang(true);
        const res = await getTugasBarangList();
        if (res.success) {
            setBarangList(res.data || []);
        } else {
            showToast(res.error || 'Gagal memuat data barang bawaan', 'error');
        }
        setLoadingBarang(false);
    }, []);

    // Fetch pendukung kelompok & hari (dengan filter role kabim)
    const fetchSupportData = useCallback(async () => {
        try {
            const [allKelRaw, hariRes, adminData] = await Promise.all([
                getKelompokAdmin(),
                getDaftarHariPkkmb(),
                getCurrentAdmin()
            ]);
            setAdmin(adminData);

            // getKelompokAdmin() mengembalikan Array langsung (bukan { data: [...] })
            const allKelompok = Array.isArray(allKelRaw) ? allKelRaw : (allKelRaw?.data || []);
            setKelompokDropdown(allKelompok);

            if (hariRes?.data) {
                setDaftarHari(hariRes.data);
            } else {
                setDaftarHari(['Hari 1', 'Hari 2', 'Hari 3', 'Hari 4', 'Hari 5']);
            }

            // Hitung kelompok yang diizinkan sesuai role admin
            const role = adminData?.role || '';
            const lockedUrutan = getKabimFilter(role); // null = super_admin/admin_pkkmb (akses semua), array = kabim

            let allowed;
            if (lockedUrutan === null) {
                // super_admin / admin_pkkmb — akses semua kelompok
                allowed = allKelompok;
                setLockedKelompokId(null);
            } else {
                // Kabim — filter hanya kelompok yang diizinkan
                allowed = allKelompok.filter(k => lockedUrutan.includes(k.urutan));
                if (allowed.length === 1) {
                    // Hanya 1 kelompok — kunci otomatis
                    setLockedKelompokId(allowed[0].id);
                } else {
                    setLockedKelompokId(null);
                }
            }

            setAllowedKelompok(allowed);
        } catch (err) {
            console.error('fetchSupportData error:', err);
        }
    }, []);

    useEffect(() => {
        fetchMateriList();
        fetchSupportData();
    }, [fetchMateriList, fetchSupportData]);

    useEffect(() => {
        if (activeTab === 'resume') {
            if (selectedMateri) fetchTugasResume(selectedMateri);
        } else if (activeTab === 'sosmed_klp') {
            fetchSosmed('kelompok');
        } else if (activeTab === 'sosmed_ind') {
            fetchSosmed('individu');
        } else if (activeTab === 'barang') {
            fetchBarang();
        }
    }, [activeTab, selectedMateri, fetchTugasResume, fetchSosmed, fetchBarang]);

    // Handle Delete Resume
    const handleDeleteResume = async (tugasId, namaPeserta) => {
        if (!tugasId) return;
        if (!window.confirm(`Hapus tugas dari "${namaPeserta}"?`)) return;

        setIsProcessing(true);
        const res = await deleteTugasKabim(tugasId);
        setIsProcessing(false);

        if (res.success) {
            showToast(`Tugas milik "${namaPeserta}" berhasil dihapus.`);
            fetchTugasResume(selectedMateri);
        } else {
            showToast(res.error || 'Gagal menghapus tugas.', 'error');
        }
    };

    // Handle Delete Sosmed
    const handleDeleteSosmed = async (id) => {
        if (!window.confirm('Hapus submission tugas sosial media ini?')) return;
        setIsProcessing(true);
        const res = await deleteTugasSosmed(id);
        setIsProcessing(false);
        if (res.success) {
            showToast('Tugas sosial media berhasil dihapus');
            fetchSosmed(activeTab === 'sosmed_klp' ? 'kelompok' : 'individu');
        } else {
            showToast(res.error || 'Gagal menghapus tugas', 'error');
        }
    };

    // Handle Delete Barang
    const handleDeleteBarang = async (id) => {
        if (!window.confirm('Hapus data barang bawaan ini?')) return;
        setIsProcessing(true);
        const res = await deleteTugasBarang(id);
        setIsProcessing(false);
        if (res.success) {
            showToast('Data barang bawaan berhasil dihapus');
            fetchBarang();
        } else {
            showToast(res.error || 'Gagal menghapus barang', 'error');
        }
    };

    // Submit Nilai Modal (Resume atau Sosmed)
    const handleSaveNilai = async () => {
        if (!modalNilai.id) return;
        setIsProcessing(true);
        try {
            if (modalNilai.type === 'resume') {
                const res = await updateNilaiTugasMateri({
                    id: modalNilai.id,
                    nilai: modalNilai.nilai
                });
                if (res.success) {
                    showToast(`Nilai (${modalNilai.nilai}) berhasil disimpan`);
                    setModalNilai({ open: false, type: 'resume', id: null, nama: '', materi_or_platform: '', nilai: 5, catatan: '' });
                    fetchTugasResume(selectedMateri);
                } else {
                    showToast(res.error || 'Gagal menyimpan nilai', 'error');
                }
            } else {
                const res = await updateNilaiTugasSosmed({
                    id: modalNilai.id,
                    nilai: modalNilai.nilai,
                    catatan_penilai: modalNilai.catatan
                });
                if (res.success) {
                    showToast(`Nilai sosmed (${modalNilai.nilai}) berhasil disimpan`);
                    setModalNilai({ open: false, type: 'sosmed', id: null, nama: '', materi_or_platform: '', nilai: 5, catatan: '' });
                    fetchSosmed(activeTab === 'sosmed_klp' ? 'kelompok' : 'individu');
                } else {
                    showToast(res.error || 'Gagal menyimpan nilai', 'error');
                }
            }
        } catch (err) {
            console.error(err);
            showToast('Terjadi kesalahan sistem', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    // Helper: buka modal barang dengan default kelompok_id sesuai lock
    const openModalBarangBaru = () => {
        const defaultKelId = lockedKelompokId || allowedKelompok[0]?.id || '';
        setModalBarang({
            open: true,
            id: null,
            tipe_barang: 'kelompok',
            kelompok_id: defaultKelId,
            kelompok_members_id: '',
            label_hari: daftarHari[0] || 'Hari 1',
            total_barang_wajib: 1,
            barang_dibawa: 1,
            catatan: ''
        });
    };

    // Submit Modal Barang Bawaan
    const handleSaveBarang = async () => {
        if (!modalBarang.label_hari) {
            showToast('Label hari wajib dipilih', 'error');
            return;
        }
        if (modalBarang.tipe_barang === 'kelompok' && !modalBarang.kelompok_id) {
            showToast('Kelompok wajib dipilih', 'error');
            return;
        }
        if (modalBarang.tipe_barang === 'individu' && !modalBarang.kelompok_members_id) {
            showToast('Anggota wajib dipilih', 'error');
            return;
        }

        setIsProcessing(true);
        try {
            const res = await saveTugasBarang(modalBarang);
            if (res.success) {
                showToast('Pengecekan barang bawaan berhasil disimpan');
                const defaultKelId = lockedKelompokId || allowedKelompok[0]?.id || '';
                setModalBarang({
                    open: false,
                    id: null,
                    tipe_barang: 'kelompok',
                    kelompok_id: defaultKelId,
                    kelompok_members_id: '',
                    label_hari: daftarHari[0] || 'Hari 1',
                    total_barang_wajib: 1,
                    barang_dibawa: 1,
                    catatan: ''
                });
                fetchBarang();
            } else {
                showToast(res.error || 'Gagal menyimpan barang bawaan', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Terjadi kesalahan sistem', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    // Anggota untuk dropdown individu modal barang
    // Gunakan allowedKelompok agar hanya tampilkan anggota dari kelompok yang diizinkan role
    const anggotaDropdownList = useMemo(() => {
        // Tentukan kelompok_id aktif: dari lock atau dari pilihan user
        const activeKelId = lockedKelompokId || modalBarang.kelompok_id;
        if (!activeKelId) {
            // Jika tidak ada yang dipilih, tampilkan semua anggota dari allowedKelompok
            return allowedKelompok.flatMap(k => k.kelompok_members || []);
        }
        // Cari kelompok dalam allowedKelompok (respects role filter)
        const found = allowedKelompok.find(k => k.id === activeKelId);
        return found ? (found.kelompok_members || []) : [];
    }, [allowedKelompok, lockedKelompokId, modalBarang.kelompok_id]);

    const selectedMateriObj = useMemo(() => {
        return materiList.find(m => String(m.id) === String(selectedMateri));
    }, [materiList, selectedMateri]);

    // Filtered Resume data
    const filteredResume = useMemo(() => {
        return tugasList.filter(item => {
            const q = searchQuery.toLowerCase();
            const matchSearch =
                (item.nama && item.nama.toLowerCase().includes(q)) ||
                (item.nim && item.nim.toLowerCase().includes(q)) ||
                (item.kampus && item.kampus.toLowerCase().includes(q));

            const matchStatus =
                statusFilter === 'all' ? true :
                statusFilter === 'sudah' ? item.status_tugas === true :
                item.status_tugas === false;

            return matchSearch && matchStatus;
        });
    }, [tugasList, searchQuery, statusFilter]);

    // Filtered Sosmed data
    const filteredSosmed = useMemo(() => {
        return sosmedList.filter(item => {
            const q = searchQuery.toLowerCase();
            const namaKlp = item.kelompok?.nama_kelompok || '';
            const namaMbr = item.kelompok_members?.nama_anggota || '';
            const nimMbr = item.kelompok_members?.nim_anggota || '';
            return namaKlp.toLowerCase().includes(q) ||
                namaMbr.toLowerCase().includes(q) ||
                nimMbr.toLowerCase().includes(q) ||
                (item.platform && item.platform.toLowerCase().includes(q));
        });
    }, [sosmedList, searchQuery]);

    // Filtered Barang data
    const filteredBarang = useMemo(() => {
        return barangList.filter(item => {
            const q = searchQuery.toLowerCase();
            const namaKlp = item.kelompok?.nama_kelompok || '';
            const namaMbr = item.kelompok_members?.nama_anggota || '';
            const nimMbr = item.kelompok_members?.nim_anggota || '';
            return namaKlp.toLowerCase().includes(q) ||
                namaMbr.toLowerCase().includes(q) ||
                nimMbr.toLowerCase().includes(q) ||
                (item.label_hari && item.label_hari.toLowerCase().includes(q));
        });
    }, [barangList, searchQuery]);

    return (
        <div className="space-y-6">
            {/* Toast */}
            {toastMessage && (
                <div
                    className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium transition-all ${
                        toastMessage.type === 'error'
                            ? 'bg-rose-600 text-white'
                            : 'bg-emerald-600 text-white'
                    }`}
                >
                    {toastMessage.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                    <span>{toastMessage.message}</span>
                </div>
            )}

            {/* TAB SYSTEM NAVIGATOR */}
            <div className="flex flex-wrap p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 gap-1">
                {[
                    { id: 'resume', label: 'Resume Materi', icon: BookOpen },
                    { id: 'sosmed_klp', label: 'Sosmed Kelompok', icon: Share2 },
                    { id: 'sosmed_ind', label: 'Sosmed Individu', icon: User },
                    { id: 'barang', label: 'Barang Bawaan', icon: Package }
                ].map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id);
                                setSearchQuery('');
                            }}
                            className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                                isActive
                                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200/50 dark:border-slate-700'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            <Icon size={16} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* TAB 1: RESUME MATERI */}
            {activeTab === 'resume' && (
                <div className="space-y-6">
                    {/* Filter Card */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                                Pilih Materi PKKMB
                            </label>
                            <select
                                value={selectedMateri}
                                onChange={(e) => setSelectedMateri(e.target.value)}
                                disabled={loadingMateri}
                                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="">— Pilih Materi Terlebih Dahulu —</option>
                                {materiList.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.judul} {m.pemateri ? `(${m.pemateri})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                                Cari Nama / NIM
                            </label>
                            <div className="relative">
                                <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Cari peserta..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    disabled={!selectedMateri}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                                Status Pengumpulan
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {['all', 'sudah', 'belum'].map(st => (
                                    <button
                                        key={st}
                                        type="button"
                                        disabled={!selectedMateri}
                                        onClick={() => setStatusFilter(st)}
                                        className={`py-2 px-2 text-xs font-semibold rounded-xl border capitalize transition-all ${
                                            statusFilter === st
                                                ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                                        }`}
                                    >
                                        {st === 'all' ? 'Semua' : st === 'sudah' ? '✅ Sudah' : '❌ Belum'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Action & Export Bar Resume */}
                    {selectedMateri && (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div>
                                <h3 className="font-bold text-sm text-slate-800 dark:text-white">
                                    Rekap Pengumpulan: {selectedMateriObj?.judul || 'Materi'}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Total Masuk: <strong className="text-blue-600 dark:text-blue-400">{filteredResume.length} tugas</strong>
                                </p>
                            </div>
                            <TombolCetak
                                label="Cetak / Export"
                                pdfTitle={`Rekap Tugas Resume - ${selectedMateriObj?.judul || 'Materi'}`}
                                pdfSite="pkkmb"
                                pdfDocumentType="kabim_tugas_report"
                                pdfData={filteredResume.map(t => ({
                                    nama: t.nama || '-',
                                    nim: t.nim || '-',
                                    kampus: t.kampus || '-',
                                    status_tugas: t.status_tugas ? 'Sudah Dinilai' : 'Belum Dinilai',
                                    nilai: t.nilai !== null && t.nilai !== undefined ? `${t.nilai} / 5` : '-'
                                }))}
                                pdfColumns={[
                                    { key: 'nama', label: 'Nama Mahasiswa' },
                                    { key: 'nim', label: 'NIM', align: 'center' },
                                    { key: 'kampus', label: 'Kampus' },
                                    { key: 'status_tugas', label: 'Status Nilai', align: 'center' },
                                    { key: 'nilai', label: 'Nilai Resume', align: 'center' }
                                ]}
                                pdfExtraProps={{
                                    printedBy: admin?.nama || admin?.email || 'PJ Kabim',
                                    sessionName: selectedMateriObj ? `Materi: ${selectedMateriObj.judul} (Pemateri: ${selectedMateriObj.pemateri || '-'})` : '',
                                    summaryCards: [
                                        { label: 'Total Tugas Masuk', value: filteredResume.length, color: '#1e3a8a' },
                                        { label: 'Sudah Dinilai', value: filteredResume.filter(t => t.status_tugas).length, color: '#059669' },
                                        { label: 'Belum Dinilai', value: filteredResume.filter(t => !t.status_tugas).length, color: '#dc2626' }
                                    ]
                                }}
                                excelData={filteredResume.map(t => ({
                                    nama: t.nama || '-',
                                    nim: t.nim || '-',
                                    kampus: t.kampus || '-',
                                    status_tugas: t.status_tugas ? 'Sudah Dinilai' : 'Belum Dinilai',
                                    nilai: t.nilai !== null && t.nilai !== undefined ? t.nilai : '-'
                                }))}
                                excelColumns={[
                                    { key: 'nama', label: 'Nama Mahasiswa' },
                                    { key: 'nim', label: 'NIM' },
                                    { key: 'kampus', label: 'Kampus' },
                                    { key: 'status_tugas', label: 'Status' },
                                    { key: 'nilai', label: 'Nilai (0-5)' }
                                ]}
                                excelFilename={`rekap-tugas-resume-${selectedMateriObj?.judul?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'materi'}`}
                            />
                        </div>
                    )}

                    {/* Table Resume */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                        {!selectedMateri ? (
                            <div className="p-16 text-center text-slate-400">
                                <BookOpen size={36} className="mx-auto mb-2 opacity-50" />
                                <p className="font-semibold text-sm">Pilih materi PKKMB pada dropdown di atas untuk mereview tugas.</p>
                            </div>
                        ) : loadingTugas ? (
                            <div className="p-16 text-center text-slate-400">
                                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                Memuat tugas resume...
                            </div>
                        ) : filteredResume.length === 0 ? (
                            <div className="p-12 text-center text-slate-400">
                                <p className="font-medium text-sm">Tidak ada data tugas yang sesuai filter.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs uppercase font-medium border-b border-slate-200 dark:border-slate-800">
                                        <tr>
                                            <th className="py-3.5 px-4 w-12 text-center">#</th>
                                            <th className="py-3.5 px-4">Nama / NIM</th>
                                            <th className="py-3.5 px-4">Kelompok</th>
                                            <th className="py-3.5 px-4 text-center">Status</th>
                                            <th className="py-3.5 px-4 text-center">Bukti</th>
                                            <th className="py-3.5 px-4 text-center">Nilai (0/5)</th>
                                            <th className="py-3.5 px-4 text-center w-36">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                        {filteredResume.map((item, idx) => (
                                            <tr key={item.id || idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="py-3.5 px-4 text-center font-medium text-slate-400 text-xs">{idx + 1}</td>
                                                <td className="py-3.5 px-4">
                                                    <div className="font-bold text-slate-900 dark:text-white">{item.nama}</div>
                                                    <div className="text-xs text-slate-500">{item.nim}</div>
                                                </td>
                                                <td className="py-3.5 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
                                                    Kelompok #{item.kelompok_urutan}
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    {item.status_tugas ? (
                                                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                                                            Sudah
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-800">
                                                            Belum
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    {item.bukti_tugas ? (
                                                        <button
                                                            onClick={() => {
                                                                setActivePreviewIndex(0);
                                                                setPreviewImage(item.bukti_tugas);
                                                            }}
                                                            className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 transition-colors"
                                                            title="Lihat Foto Bukti"
                                                        >
                                                            <ImageIcon size={16} />
                                                        </button>
                                                    ) : (
                                                        <span className="text-slate-300">-</span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    {item.nilai !== null && item.nilai !== undefined ? (
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                                                            item.nilai >= 5
                                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                                : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                                        }`}>
                                                            {item.nilai} Poin
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 italic">Belum Dinilai</span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        {item.tugas_id ? (
                                                            <>
                                                                <button
                                                                    onClick={() =>
                                                                        setModalNilai({
                                                                            open: true,
                                                                            type: 'resume',
                                                                            id: item.tugas_id,
                                                                            nama: item.nama,
                                                                            materi_or_platform: item.materi_judul,
                                                                            nilai: item.nilai !== null && item.nilai !== undefined ? item.nilai : 5,
                                                                            catatan: ''
                                                                        })
                                                                    }
                                                                    className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 shadow-sm"
                                                                    title="Beri Nilai 0 atau 5"
                                                                >
                                                                    <Award size={13} />
                                                                    Beri Nilai
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteResume(item.tugas_id, item.nama)}
                                                                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                                                                    title="Hapus Tugas"
                                                                >
                                                                    <Trash2 size={15} />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <span className="text-xs text-slate-400 italic">Belum Submit</span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 2 & 3: SOSMED (KELOMPOK / INDIVIDU) */}
            {(activeTab === 'sosmed_klp' || activeTab === 'sosmed_ind') && (
                <div className="space-y-4">
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
                        <div className="relative w-full md:w-80">
                            <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
                            <input
                                type="text"
                                placeholder={activeTab === 'sosmed_klp' ? 'Cari kelompok...' : 'Cari nama / NIM peserta...'}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                            <span className="text-xs text-slate-500">
                                Total: <strong>{filteredSosmed.length}</strong> submission
                            </span>
                            <TombolCetak
                                label="Cetak / Export"
                                pdfTitle={`Rekap Tugas ${activeTab === 'sosmed_klp' ? 'Sosial Media Kelompok' : 'Sosial Media Individu'}`}
                                pdfSite="pkkmb"
                                pdfDocumentType="kabim_tugas_report"
                                pdfData={filteredSosmed.map(item => ({
                                    subjek: activeTab === 'sosmed_klp'
                                        ? (item.kelompok?.nama_kelompok || '-')
                                        : `${item.kelompok_members?.nama_anggota || '-'} (${item.kelompok_members?.nim_anggota || '-'})`,
                                    hari: item.label_hari || '-',
                                    platform: item.platform || '-',
                                    link_konten: item.link_konten || '-',
                                    nilai: item.nilai !== null && item.nilai !== undefined ? `${item.nilai} / 5` : 'Belum Dinilai',
                                    tanggal: formatTanggal(item.created_at)
                                }))}
                                pdfColumns={[
                                    { key: 'subjek', label: activeTab === 'sosmed_klp' ? 'Kelompok' : 'Peserta (NIM)' },
                                    ...(activeTab === 'sosmed_klp' ? [{ key: 'hari', label: 'Hari', align: 'center' }] : []),
                                    { key: 'platform', label: 'Platform', align: 'center' },
                                    { key: 'link_konten', label: 'Link Konten' },
                                    { key: 'nilai', label: 'Nilai', align: 'center' },
                                    { key: 'tanggal', label: 'Waktu Kirim', align: 'center' }
                                ]}
                                pdfExtraProps={{
                                    printedBy: admin?.nama || admin?.email || 'PJ Kabim',
                                    sessionName: activeTab === 'sosmed_klp' ? 'Penugasan Sosmed Kelompok PKKMB' : 'Penugasan Sosmed Individu PKKMB',
                                    summaryCards: [
                                        { label: 'Total Submission', value: filteredSosmed.length, color: '#1e3a8a' },
                                        { label: 'Sudah Dinilai', value: filteredSosmed.filter(s => s.nilai !== null && s.nilai !== undefined).length, color: '#059669' },
                                        { label: 'Belum Dinilai', value: filteredSosmed.filter(s => s.nilai === null || s.nilai === undefined).length, color: '#dc2626' }
                                    ]
                                }}
                                excelData={filteredSosmed.map(item => ({
                                    subjek: activeTab === 'sosmed_klp'
                                        ? (item.kelompok?.nama_kelompok || '-')
                                        : `${item.kelompok_members?.nama_anggota || '-'} (${item.kelompok_members?.nim_anggota || '-'})`,
                                    hari: item.label_hari || '-',
                                    platform: item.platform || '-',
                                    link_konten: item.link_konten || '-',
                                    nilai: item.nilai !== null && item.nilai !== undefined ? item.nilai : 'Belum Dinilai',
                                    tanggal: formatTanggal(item.created_at)
                                }))}
                                excelColumns={[
                                    { key: 'subjek', label: activeTab === 'sosmed_klp' ? 'Kelompok' : 'Peserta' },
                                    ...(activeTab === 'sosmed_klp' ? [{ key: 'hari', label: 'Hari' }] : []),
                                    { key: 'platform', label: 'Platform' },
                                    { key: 'link_konten', label: 'Link Konten' },
                                    { key: 'nilai', label: 'Nilai' },
                                    { key: 'tanggal', label: 'Waktu Kirim' }
                                ]}
                                excelFilename={`rekap-tugas-sosmed-${activeTab === 'sosmed_klp' ? 'kelompok' : 'individu'}`}
                            />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                        {loadingSosmed ? (
                            <div className="p-16 text-center text-slate-400">
                                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                Memuat tugas sosial media...
                            </div>
                        ) : filteredSosmed.length === 0 ? (
                            <div className="p-12 text-center text-slate-400">
                                <Share2 size={32} className="mx-auto mb-2 opacity-50" />
                                <p className="font-medium text-sm">Belum ada submission tugas sosial media.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs uppercase font-medium border-b border-slate-200 dark:border-slate-800">
                                        <tr>
                                            <th className="py-3.5 px-4 w-12 text-center">#</th>
                                            <th className="py-3.5 px-4">
                                                {activeTab === 'sosmed_klp' ? 'Kelompok' : 'Peserta / NIM'}
                                            </th>
                                            {activeTab === 'sosmed_klp' && <th className="py-3.5 px-4">Hari</th>}
                                            <th className="py-3.5 px-4">Platform</th>
                                            <th className="py-3.5 px-4">Link Konten</th>
                                            <th className="py-3.5 px-4 text-center">Nilai (0/5)</th>
                                            <th className="py-3.5 px-4">Tanggal Kirim</th>
                                            <th className="py-3.5 px-4 text-center w-36">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                        {filteredSosmed.map((item, idx) => (
                                            <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="py-3.5 px-4 text-center font-medium text-slate-400 text-xs">{idx + 1}</td>
                                                <td className="py-3.5 px-4">
                                                    {activeTab === 'sosmed_klp' ? (
                                                        <div className="font-bold text-slate-900 dark:text-white">
                                                            #{item.kelompok?.urutan} {item.kelompok?.nama_kelompok}
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <div className="font-bold text-slate-900 dark:text-white">
                                                                {item.kelompok_members?.nama_anggota || item.created_by}
                                                            </div>
                                                            <div className="text-xs text-slate-500">
                                                                {item.kelompok_members?.nim_anggota || '-'}
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>
                                                {activeTab === 'sosmed_klp' && (
                                                    <td className="py-3.5 px-4">
                                                        <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                                            {item.label_hari || 'Hari 1'}
                                                        </span>
                                                    </td>
                                                )}
                                                <td className="py-3.5 px-4">
                                                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                                                        {item.platform}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <a
                                                        href={item.link_konten}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline max-w-[200px] truncate"
                                                    >
                                                        <ExternalLink size={13} className="shrink-0" />
                                                        <span className="truncate">{item.link_konten}</span>
                                                    </a>
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    {item.nilai !== null && item.nilai !== undefined ? (
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                                                            item.nilai >= 5
                                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                                                : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                                        }`}>
                                                            {item.nilai} Poin
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 italic">Belum Dinilai</span>
                                                    )}
                                                </td>
                                                <td className="py-3.5 px-4 text-xs text-slate-500">
                                                    {formatTanggal(item.created_at)}
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <button
                                                            onClick={() =>
                                                                setModalNilai({
                                                                    open: true,
                                                                    type: 'sosmed',
                                                                    id: item.id,
                                                                    nama: activeTab === 'sosmed_klp' ? item.kelompok?.nama_kelompok : item.kelompok_members?.nama_anggota,
                                                                    materi_or_platform: `${item.platform} (${item.label_hari || ''})`,
                                                                    nilai: item.nilai !== null && item.nilai !== undefined ? item.nilai : 5,
                                                                    catatan: item.catatan_penilai || ''
                                                                })
                                                            }
                                                            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium flex items-center gap-1 shadow-sm"
                                                        >
                                                            <Award size={13} />
                                                            Beri Nilai
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteSosmed(item.id)}
                                                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                                                            title="Hapus Submission"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 4: BARANG BAWAAN */}
            {activeTab === 'barang' && (
                <div className="space-y-4">
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
                        <div className="relative w-full md:w-80">
                            <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Cari kelompok / nama / hari..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <TombolCetak
                                label="Cetak / Export"
                                pdfTitle="Rekap Pengecekan Barang Bawaan PKKMB"
                                pdfSite="pkkmb"
                                pdfDocumentType="kabim_tugas_report"
                                pdfData={filteredBarang.map(item => ({
                                    subjek: item.tipe_barang === 'kelompok'
                                        ? (item.kelompok?.nama_kelompok || '-')
                                        : `${item.kelompok_members?.nama_anggota || '-'} (${item.kelompok_members?.nim_anggota || '-'})`,
                                    tipe: item.tipe_barang?.toUpperCase() || '-',
                                    hari: item.label_hari || '-',
                                    wajib: item.total_barang_wajib || 0,
                                    dibawa: item.barang_dibawa || 0,
                                    status: (item.barang_dibawa || 0) >= (item.total_barang_wajib || 1) ? 'Lengkap' : 'Tidak Lengkap',
                                    catatan: item.catatan || '-'
                                }))}
                                pdfColumns={[
                                    { key: 'subjek', label: 'Kelompok / Peserta' },
                                    { key: 'tipe', label: 'Tipe', align: 'center' },
                                    { key: 'hari', label: 'Hari', align: 'center' },
                                    { key: 'wajib', label: 'Wajib', align: 'center' },
                                    { key: 'dibawa', label: 'Dibawa', align: 'center' },
                                    { key: 'status', label: 'Status', align: 'center' },
                                    { key: 'catatan', label: 'Catatan' }
                                ]}
                                pdfExtraProps={{
                                    printedBy: admin?.nama || admin?.email || 'PJ Kabim',
                                    sessionName: 'Pengecekan Perlengkapan & Barang Bawaan Peserta PKKMB 2026',
                                    summaryCards: [
                                        { label: 'Total Pengecekan', value: filteredBarang.length, color: '#1e3a8a' },
                                        { label: 'Lengkap', value: filteredBarang.filter(b => (b.barang_dibawa || 0) >= (b.total_barang_wajib || 1)).length, color: '#059669' },
                                        { label: 'Tidak Lengkap', value: filteredBarang.filter(b => (b.barang_dibawa || 0) < (b.total_barang_wajib || 1)).length, color: '#dc2626' }
                                    ]
                                }}
                                excelData={filteredBarang.map(item => ({
                                    subjek: item.tipe_barang === 'kelompok'
                                        ? (item.kelompok?.nama_kelompok || '-')
                                        : `${item.kelompok_members?.nama_anggota || '-'} (${item.kelompok_members?.nim_anggota || '-'})`,
                                    tipe: item.tipe_barang || '-',
                                    hari: item.label_hari || '-',
                                    wajib: item.total_barang_wajib || 0,
                                    dibawa: item.barang_dibawa || 0,
                                    status: (item.barang_dibawa || 0) >= (item.total_barang_wajib || 1) ? 'Lengkap' : 'Kurang Lengkap',
                                    catatan: item.catatan || '-'
                                }))}
                                excelColumns={[
                                    { key: 'subjek', label: 'Kelompok / Peserta' },
                                    { key: 'tipe', label: 'Tipe Barang' },
                                    { key: 'hari', label: 'Hari Pelaksanaan' },
                                    { key: 'wajib', label: 'Total Wajib' },
                                    { key: 'dibawa', label: 'Barang Dibawa' },
                                    { key: 'status', label: 'Status Kelengkapan' },
                                    { key: 'catatan', label: 'Catatan' }
                                ]}
                                excelFilename="rekap-pengecekan-barang-pkkmb-2026"
                            />

                            <button
                                onClick={openModalBarangBaru}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 flex items-center gap-2"
                            >
                                <Plus size={16} />
                                + Input Pengecekan Barang
                            </button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                        {loadingBarang ? (
                            <div className="p-16 text-center text-slate-400">
                                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                Memuat data pengecekan barang...
                            </div>
                        ) : filteredBarang.length === 0 ? (
                            <div className="p-12 text-center text-slate-400">
                                <Package size={32} className="mx-auto mb-2 opacity-50" />
                                <p className="font-medium text-sm">Belum ada catatan pengecekan barang bawaan.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs uppercase font-medium border-b border-slate-200 dark:border-slate-800">
                                        <tr>
                                            <th className="py-3.5 px-4 w-12 text-center">#</th>
                                            <th className="py-3.5 px-4">Entitas</th>
                                            <th className="py-3.5 px-4">Tipe</th>
                                            <th className="py-3.5 px-4">Hari</th>
                                            <th className="py-3.5 px-4 text-center">Dibawa / Wajib</th>
                                            <th className="py-3.5 px-4 text-center">Persentase</th>
                                            <th className="py-3.5 px-4">Catatan</th>
                                            <th className="py-3.5 px-4 text-center w-28">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                        {filteredBarang.map((item, idx) => {
                                            const wajib = Math.max(1, item.total_barang_wajib || 1);
                                            const bawa = item.barang_dibawa || 0;
                                            const pct = ((bawa / wajib) * 100).toFixed(1);

                                            return (
                                                <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                                                    <td className="py-3.5 px-4 text-center font-medium text-slate-400 text-xs">{idx + 1}</td>
                                                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                                                        {item.tipe_barang === 'kelompok' ? (
                                                            <span>#{item.kelompok?.urutan} {item.kelompok?.nama_kelompok}</span>
                                                        ) : (
                                                            <div>
                                                                <div>{item.kelompok_members?.nama_anggota || '-'}</div>
                                                                <div className="text-xs text-slate-400">{item.kelompok_members?.nim_anggota}</div>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                                                            item.tipe_barang === 'kelompok'
                                                                ? 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                                                                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                                        }`}>
                                                            {item.tipe_barang}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                        {item.label_hari}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                                                        {bawa} / {wajib}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-center">
                                                        <span className={`font-bold text-xs px-2.5 py-1 rounded-lg ${
                                                            parseFloat(pct) >= 100
                                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                                                : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                                        }`}>
                                                            {pct}%
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-xs text-slate-500 max-w-xs truncate">
                                                        {item.catatan || '-'}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button
                                                                onClick={() =>
                                                                    setModalBarang({
                                                                        open: true,
                                                                        id: item.id,
                                                                        tipe_barang: item.tipe_barang,
                                                                        kelompok_id: item.kelompok_id || '',
                                                                        kelompok_members_id: item.kelompok_members_id || '',
                                                                        label_hari: item.label_hari,
                                                                        total_barang_wajib: wajib,
                                                                        barang_dibawa: bawa,
                                                                        catatan: item.catatan || ''
                                                                    })
                                                                }
                                                                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg"
                                                                title="Edit Pengecekan"
                                                            >
                                                                <Edit3 size={15} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteBarang(item.id)}
                                                                className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                                                                title="Hapus Catatan"
                                                            >
                                                                <Trash2 size={15} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL BERI NILAI RESUME / SOSMED */}
            {modalNilai.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                    Beri Nilai Tugas
                                </h3>
                                <p className="text-xs text-slate-500">
                                    {modalNilai.nama} — {modalNilai.materi_or_platform}
                                </p>
                            </div>
                            <button
                                onClick={() => setModalNilai({ open: false, type: 'resume', id: null, nama: '', materi_or_platform: '', nilai: 5, catatan: '' })}
                                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                    Pilih Nilai Tugas
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setModalNilai(prev => ({ ...prev, nilai: 5 }))}
                                        className={`p-3.5 rounded-xl border text-center font-bold text-sm transition-all ${
                                            modalNilai.nilai === 5
                                                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                                        }`}
                                    >
                                        <div className="text-lg mb-0.5">5 Poin</div>
                                        <div className="text-[11px] font-normal">Mengerjakan Lengkap</div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setModalNilai(prev => ({ ...prev, nilai: 0 }))}
                                        className={`p-3.5 rounded-xl border text-center font-bold text-sm transition-all ${
                                            modalNilai.nilai === 0
                                                ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20'
                                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                                        }`}
                                    >
                                        <div className="text-lg mb-0.5">0 Poin</div>
                                        <div className="text-[11px] font-normal">Tidak Mengerjakan</div>
                                    </button>
                                </div>
                            </div>

                            {modalNilai.type === 'sosmed' && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                        Catatan Penilai (Opsional)
                                    </label>
                                    <textarea
                                        rows="2"
                                        value={modalNilai.catatan}
                                        onChange={(e) => setModalNilai(prev => ({ ...prev, catatan: e.target.value }))}
                                        placeholder="Komentar atau feedback..."
                                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setModalNilai({ open: false, type: 'resume', id: null, nama: '', materi_or_platform: '', nilai: 5, catatan: '' })}
                                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveNilai}
                                disabled={isProcessing}
                                className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2"
                            >
                                <Check size={16} />
                                {isProcessing ? 'Menyimpan...' : 'Simpan Nilai'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL INPUT PENGECEKAN BARANG BAWAAN */}
            {modalBarang.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                {modalBarang.id ? 'Edit Pengecekan Barang' : 'Input Pengecekan Barang'}
                            </h3>
                            <button
                                onClick={() => setModalBarang(prev => ({ ...prev, open: false }))}
                                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            {/* Tipe Barang: Kelompok vs Individu */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                    Tipe Pengecekan
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setModalBarang(prev => ({ ...prev, tipe_barang: 'kelompok' }))}
                                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                                            modalBarang.tipe_barang === 'kelompok'
                                                ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-500'
                                                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                                        }`}
                                    >
                                        Per Kelompok
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setModalBarang(prev => ({ ...prev, tipe_barang: 'individu' }))}
                                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                                            modalBarang.tipe_barang === 'individu'
                                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-500'
                                                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                                        }`}
                                    >
                                        Per Individu
                                    </button>
                                </div>
                            </div>

                            {/* Pilih Kelompok — tergantung hak akses role */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                                    Kelompok
                                </label>
                                {lockedKelompokId && allowedKelompok.length === 1 ? (
                                    /* Kabim hanya punya 1 kelompok — tampilkan statis/terkunci */
                                    <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl">
                                        <Lock size={14} className="text-indigo-500 shrink-0" />
                                        <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                                            #{allowedKelompok[0]?.urutan} {allowedKelompok[0]?.nama_kelompok}
                                        </span>
                                        <span className="ml-auto text-[10px] text-indigo-400 font-medium uppercase tracking-wider">Terkunci</span>
                                    </div>
                                ) : (
                                    /* super_admin / admin_pkkmb / kabim multi kelompok — tampilkan dropdown */
                                    <select
                                        value={modalBarang.kelompok_id}
                                        onChange={(e) => setModalBarang(prev => ({ ...prev, kelompok_id: e.target.value, kelompok_members_id: '' }))}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
                                    >
                                        <option value="">— Pilih Kelompok —</option>
                                        {allowedKelompok.map(k => (
                                            <option key={k.id} value={k.id}>
                                                #{k.urutan} {k.nama_kelompok}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* Pilih Anggota (Jika Tipe Individu) */}
                            {modalBarang.tipe_barang === 'individu' && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                                        Pilih Peserta
                                    </label>
                                    <select
                                        value={modalBarang.kelompok_members_id}
                                        onChange={(e) => setModalBarang(prev => ({ ...prev, kelompok_members_id: e.target.value }))}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
                                    >
                                        <option value="">— Pilih Anggota —</option>
                                        {anggotaDropdownList.map(m => (
                                            <option key={m.id} value={m.id}>
                                                {m.nama_anggota} ({m.nim_anggota || 'Tanpa NIM'})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Pilih Hari */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                                    Hari Pelaksanaan
                                </label>
                                <select
                                    value={modalBarang.label_hari}
                                    onChange={(e) => setModalBarang(prev => ({ ...prev, label_hari: e.target.value }))}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
                                >
                                    {daftarHari.map(h => (
                                        <option key={h} value={h}>{h}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Jumlah Wajib & Dibawa */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                                        Total Barang Wajib
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={modalBarang.total_barang_wajib}
                                        onChange={(e) => setModalBarang(prev => ({ ...prev, total_barang_wajib: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                                        Jumlah Dibawa
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={modalBarang.barang_dibawa}
                                        onChange={(e) => setModalBarang(prev => ({ ...prev, barang_dibawa: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-emerald-600"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                                    Catatan / Keterangan
                                </label>
                                <input
                                    type="text"
                                    placeholder="Contoh: pita merah kurang 1, name tag ada"
                                    value={modalBarang.catatan}
                                    onChange={(e) => setModalBarang(prev => ({ ...prev, catatan: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setModalBarang(prev => ({ ...prev, open: false }))}
                                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveBarang}
                                disabled={isProcessing}
                                className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2"
                            >
                                <Check size={16} />
                                {isProcessing ? 'Menyimpan...' : 'Simpan Pengecekan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL IMAGE PREVIEW (Untuk Bukti Tugas Resume) */}
            {previewImage && (() => {
                let rawList = [];
                try {
                    const parsed = JSON.parse(previewImage);
                    if (Array.isArray(parsed)) {
                        rawList = parsed;
                    } else {
                        rawList = previewImage.split(',');
                    }
                } catch {
                    rawList = previewImage.split(',');
                }
                const images = rawList.map(s => s.trim()).filter(Boolean);
                const currentImg = images[activePreviewIndex] || images[0];

                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="relative max-w-4xl w-full bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ImageIcon size={18} className="text-blue-500" />
                                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                                        Bukti Tugas ({activePreviewIndex + 1} dari {images.length})
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <a
                                        href={currentImg}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg"
                                        title="Buka di Tab Baru"
                                    >
                                        <Maximize2 size={16} />
                                    </a>
                                    <button
                                        onClick={() => setPreviewImage(null)}
                                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-slate-950">
                                <img
                                    src={currentImg}
                                    alt="Bukti Tugas"
                                    className="max-h-[65vh] object-contain rounded-lg"
                                />
                            </div>

                            {images.length > 1 && (
                                <div className="p-3 border-t border-slate-800 bg-slate-900 flex items-center justify-center gap-2 overflow-x-auto">
                                    {images.map((img, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setActivePreviewIndex(i)}
                                            className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                                                activePreviewIndex === i ? 'border-blue-500 scale-105' : 'border-slate-700 opacity-60 hover:opacity-100'
                                            }`}
                                        >
                                            <img src={img} alt={`Thumb ${i + 1}`} className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
