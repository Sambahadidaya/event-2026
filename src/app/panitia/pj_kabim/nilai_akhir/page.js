'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Award,
    Search,
    Filter,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Edit3,
    Eye,
    Percent,
    Users,
    TrendingUp,
    TrendingDown,
    Save,
    X,
    Calendar,
    Sparkles,
    Shield
} from 'lucide-react';
import { getCurrentAdmin } from '@/api/supabase/admin/auth';
import { hasAccess } from '@/lib/adminRoleData';
import { getRekapNilaiAkhirPkkmb } from '@/api/supabase/admin/nilai_akhir_pkkmb';
import { getKelompokAdmin } from '@/api/supabase/admin/kelompok';
import {
    getDaftarHariPkkmb,
    getPenilaianKeaktifanByMember,
    savePenilaianKeaktifan
} from '@/api/supabase/admin/penilaian_keaktifan';
import TombolCetak from '@/components/panitia/TombolCetak';

export default function NilaiAkhirPkkmbPage() {
    const router = useRouter();
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);
    const [savingKeaktifan, setSavingKeaktifan] = useState(false);

    // Data
    const [pesertaList, setPesertaList] = useState([]);
    const [stats, setStats] = useState({
        total_peserta: 0,
        rata_rata_nilai: 0,
        nilai_tertinggi: 0,
        nilai_terendah: 0,
        total_lulus: 0,
        total_tidak_lulus: 0,
        persen_kelulusan: 0
    });
    const [kelompokList, setKelompokList] = useState([]);
    const [daftarHari, setDaftarHari] = useState([]);

    // Filters
    const [selectedKategori, setSelectedKategori] = useState('semua'); // 'semua' | 'reguler' | 'nonreg'
    const [selectedKelompok, setSelectedKelompok] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Modal Edit Keaktifan
    const [modalKeaktifan, setModalKeaktifan] = useState({
        open: false,
        member: null,
        loading: false,
        harian: {} // { 'Hari 1': 80, 'Hari 2': 90 }
    });

    // Toast
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const kelId = selectedKelompok !== 'all' ? selectedKelompok : null;
            const res = await getRekapNilaiAkhirPkkmb({
                kategori: selectedKategori,
                kelompok_id: kelId,
                search: searchQuery
            });

            if (res.success) {
                setPesertaList(res.data || []);
                setStats(res.stats || {});
            } else {
                showToast(res.error || 'Gagal memuat rekap nilai akhir', 'error');
            }
        } catch (err) {
            console.error('Error fetching rekap nilai:', err);
            showToast('Terjadi kesalahan memuat data nilai', 'error');
        } finally {
            setLoading(false);
        }
    }, [selectedKategori, selectedKelompok, searchQuery]);

    useEffect(() => {
        const init = async () => {
            try {
                const currentAdmin = await getCurrentAdmin();
                if (!currentAdmin) {
                    router.push('/panitia/login');
                    return;
                }
                if (!hasAccess(currentAdmin.role, '/panitia/pj_kabim/nilai_akhir')) {
                    router.push('/panitia/dashboard');
                    return;
                }
                setAdmin(currentAdmin);

                const [kelRes, hariRes] = await Promise.all([
                    getKelompokAdmin(),
                    getDaftarHariPkkmb()
                ]);
                if (kelRes?.data) setKelompokList(kelRes.data || []);
                if (hariRes?.data) setDaftarHari(hariRes.data || []);

                await fetchData();
            } catch (err) {
                console.error(err);
            }
        };
        init();
    }, [router, fetchData]);

    // Handle Buka Modal Edit Keaktifan
    const handleOpenKeaktifanModal = async (member) => {
        setModalKeaktifan({
            open: true,
            member,
            loading: true,
            harian: {}
        });

        try {
            const res = await getPenilaianKeaktifanByMember({ kelompok_members_id: member.member_id });
            const harianData = {};
            // Inisialisasi daftar hari dengan default 60 jika belum diinput
            daftarHari.forEach(h => {
                harianData[h] = 60;
            });
            if (res.success && Array.isArray(res.data)) {
                res.data.forEach(item => {
                    harianData[item.label_hari] = Number(item.skor_keaktifan);
                });
            }

            setModalKeaktifan(prev => ({
                ...prev,
                loading: false,
                harian: harianData
            }));
        } catch (err) {
            console.error(err);
            setModalKeaktifan(prev => ({ ...prev, loading: false }));
        }
    };

    // Simpan Keaktifan Harian
    const handleSaveKeaktifanModal = async () => {
        if (!modalKeaktifan.member) return;
        setSavingKeaktifan(true);
        try {
            const memberId = modalKeaktifan.member.member_id;
            for (const [hari, skor] of Object.entries(modalKeaktifan.harian)) {
                await savePenilaianKeaktifan({
                    kelompok_members_id: memberId,
                    label_hari: hari,
                    skor_keaktifan: skor
                });
            }

            showToast(`Nilai keaktifan ${modalKeaktifan.member.nama} berhasil disimpan`);
            setModalKeaktifan({ open: false, member: null, loading: false, harian: {} });
            await fetchData();
        } catch (err) {
            console.error(err);
            showToast('Gagal menyimpan nilai keaktifan', 'error');
        } finally {
            setSavingKeaktifan(false);
        }
    };


    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
            {/* Toast */}
            {toast && (
                <div
                    className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium transition-all print:hidden ${
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-blue-600/10 via-emerald-600/10 to-transparent p-6 rounded-2xl border border-blue-500/20 print:border-none print:p-0">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20 print:hidden">
                        <Award size={26} />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                            Rekap Nilai Akhir & Kelulusan PKKMB 2026
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Akumulasi otomatis 5 pilar penilaian (Kehadiran, Keaktifan, Kedisiplinan, Penugasan, Kreativitas)
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 print:hidden">
                    <TombolCetak
                        label="Cetak / Export"
                        pdfTitle={`Rekapitulasi Nilai Akhir & Kelulusan PKKMB 2026`}
                        pdfSite="pkkmb"
                        pdfDocumentType="kabim_nilai_report"
                        pdfData={pesertaList.map(p => ({
                            nama: p.nama,
                            nim: p.nim || '-',
                            kelompok: `#${p.kelompok_urutan} ${p.kelompok_nama}`,
                            kategori: p.kategori?.toUpperCase(),
                            nilai_kehadiran: p.nilai_kehadiran ?? 0,
                            nilai_keaktifan: p.nilai_keaktifan ?? 0,
                            nilai_kedisiplinan: p.nilai_kedisiplinan ?? 0,
                            nilai_penugasan: p.nilai_penugasan ?? 0,
                            nilai_kreativitas: p.nilai_kreativitas ?? 0,
                            nilai_akhir: p.nilai_akhir ?? 0,
                            status_kelulusan: p.status_kelulusan || 'Pending'
                        }))}
                        pdfColumns={[
                            { key: 'nama', label: 'Nama Peserta' },
                            { key: 'nim', label: 'NIM', align: 'center' },
                            { key: 'kelompok', label: 'Kelompok' },
                            { key: 'nilai_kehadiran', label: 'Kehadiran (20%)', align: 'center' },
                            { key: 'nilai_keaktifan', label: 'Keaktifan (20%)', align: 'center' },
                            { key: 'nilai_kedisiplinan', label: 'Kedisiplinan (20%)', align: 'center' },
                            { key: 'nilai_penugasan', label: 'Penugasan (20%)', align: 'center' },
                            { key: 'nilai_kreativitas', label: 'Kreativitas (20%)', align: 'center' },
                            { key: 'nilai_akhir', label: 'Nilai Akhir', align: 'center' },
                            { key: 'status_kelulusan', label: 'Kelulusan', align: 'center' }
                        ]}
                        pdfExtraProps={{
                            printedBy: admin?.nama || admin?.email || 'PJ Kabim',
                            sessionName: `Kategori: ${selectedKategori.toUpperCase()}${selectedKelompok !== 'all' ? ` | Kelompok Terpilih` : ' | Semua Kelompok Binaan'}`,
                            landscape: true,
                            summaryCards: [
                                { label: 'Total Mahasiswa', value: stats.total || pesertaList.length, color: '#1e3a8a' },
                                { label: 'Lulus', value: stats.lulus || 0, color: '#059669' },
                                { label: 'Tidak Lulus', value: stats.tidak_lulus || 0, color: '#dc2626' },
                                { label: 'Rata-rata Nilai', value: stats.rata_rata || '0.00', color: '#7c3aed' }
                            ]
                        }}
                        excelData={pesertaList.map(p => ({
                            nama: p.nama,
                            nim: p.nim || '-',
                            kelompok: `#${p.kelompok_urutan} ${p.kelompok_nama}`,
                            kategori: p.kategori?.toUpperCase(),
                            nilai_kehadiran: p.nilai_kehadiran ?? 0,
                            nilai_keaktifan: p.nilai_keaktifan ?? 0,
                            nilai_kedisiplinan: p.nilai_kedisiplinan ?? 0,
                            nilai_penugasan: p.nilai_penugasan ?? 0,
                            nilai_kreativitas: p.nilai_kreativitas ?? 0,
                            nilai_akhir: p.nilai_akhir ?? 0,
                            status_kelulusan: p.status_kelulusan || 'Pending'
                        }))}
                        excelColumns={[
                            { key: 'nama', label: 'Nama Peserta' },
                            { key: 'nim', label: 'NIM' },
                            { key: 'kelompok', label: 'Kelompok' },
                            { key: 'kategori', label: 'Kategori' },
                            { key: 'nilai_kehadiran', label: 'Kehadiran (20%)' },
                            { key: 'nilai_keaktifan', label: 'Keaktifan (20%)' },
                            { key: 'nilai_kedisiplinan', label: 'Kedisiplinan (20%)' },
                            { key: 'nilai_penugasan', label: 'Penugasan (20%)' },
                            { key: 'nilai_kreativitas', label: 'Kreativitas (20%)' },
                            { key: 'nilai_akhir', label: 'Nilai Akhir' },
                            { key: 'status_kelulusan', label: 'Status Kelulusan' }
                        ]}
                        excelFilename={`Rekap_Nilai_Akhir_PKKMB_2026_${selectedKategori}`}
                    />
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
                <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                        Rata-rata Nilai
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl md:text-3xl font-black text-blue-600 dark:text-blue-400">
                            {stats.rata_rata_nilai}
                        </span>
                        <span className="text-xs text-slate-400">/ 100</span>
                    </div>
                    <span className="text-xs text-slate-500 mt-1 block">Dari {stats.total_peserta} peserta</span>
                </div>

                <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                        Nilai Tertinggi / Terendah
                    </span>
                    <div className="flex items-center gap-3 mt-1.5">
                        <span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            <TrendingUp size={16} /> {stats.nilai_tertinggi}
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">|</span>
                        <span className="inline-flex items-center gap-1 text-sm font-bold text-rose-500">
                            <TrendingDown size={16} /> {stats.nilai_terendah}
                        </span>
                    </div>
                    <span className="text-xs text-slate-500 mt-1 block">Rentang nilai peserta</span>
                </div>

                <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                        Peserta Lulus
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl md:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                            {stats.total_lulus}
                        </span>
                        <span className="text-xs text-slate-400">peserta</span>
                    </div>
                    <span className="text-xs text-rose-500 mt-1 block">{stats.total_tidak_lulus} belum lulus (&lt;60)</span>
                </div>

                <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                        Persentase Kelulusan
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl md:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                            {stats.persen_kelulusan}%
                        </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
                        <div
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${Math.min(100, stats.persen_kelulusan)}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between print:hidden">
                {/* Search */}
                <div className="relative w-full md:w-72">
                    <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari nama, NIM, kelompok..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    {/* Filter Kelompok */}
                    <select
                        value={selectedKelompok}
                        onChange={(e) => setSelectedKelompok(e.target.value)}
                        className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none"
                    >
                        <option value="all">Semua Kelompok</option>
                        {kelompokList.map(k => (
                            <option key={k.id} value={k.id}>
                                #{k.urutan} {k.nama_kelompok}
                            </option>
                        ))}
                    </select>

                    {/* Kategori Toggle */}
                    <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        {[
                            { id: 'semua', label: 'Semua' },
                            { id: 'reguler', label: 'Reguler' },
                            { id: 'nonreg', label: 'Non-Reg' }
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => setSelectedKategori(t.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                    selectedKategori === t.id
                                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                                        : 'text-slate-600 dark:text-slate-400'
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table Nilai Akhir */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                {loading ? (
                    <div className="p-16 text-center text-slate-400">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        Menghitung akumulasi nilai akhir...
                    </div>
                ) : pesertaList.length === 0 ? (
                    <div className="p-16 text-center text-slate-400">
                        <Users size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="font-semibold text-sm">Tidak ada peserta yang sesuai dengan filter.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="py-3.5 px-3 w-10 text-center">#</th>
                                    <th className="py-3.5 px-4 min-w-[160px]">Peserta</th>
                                    <th className="py-3.5 px-3 min-w-[110px]">Kelompok</th>
                                    <th className="py-3.5 px-3 text-center">Kategori</th>
                                    <th className="py-3.5 px-3 text-center">
                                        Kehadiran
                                        <span className="block text-[10px] font-normal lowercase opacity-70">
                                            ({(pesertaList[0]?.detail_bobot?.kehadiran * 100 || 20)}%)
                                        </span>
                                    </th>
                                    <th className="py-3.5 px-3 text-center">
                                        Keaktifan
                                        <span className="block text-[10px] font-normal lowercase opacity-70">
                                            ({(pesertaList[0]?.detail_bobot?.keaktifan * 100 || 20)}%)
                                        </span>
                                    </th>
                                    <th className="py-3.5 px-3 text-center">
                                        Kedisiplinan
                                        <span className="block text-[10px] font-normal lowercase opacity-70">
                                            ({(pesertaList[0]?.detail_bobot?.kedisiplinan * 100 || 20)}%)
                                        </span>
                                    </th>
                                    <th className="py-3.5 px-3 text-center">
                                        Penugasan
                                        <span className="block text-[10px] font-normal lowercase opacity-70">
                                            ({(pesertaList[0]?.detail_bobot?.penugasan * 100 || 20)}%)
                                        </span>
                                    </th>
                                    <th className="py-3.5 px-3 text-center">
                                        Kreativitas
                                        <span className="block text-[10px] font-normal lowercase opacity-70">
                                            ({(pesertaList[0]?.detail_bobot?.kreativitas * 100 || 20)}%)
                                        </span>
                                    </th>
                                    <th className="py-3.5 px-3 text-center font-bold text-slate-900 dark:text-white bg-blue-50/50 dark:bg-blue-950/20">
                                        Nilai Akhir
                                    </th>
                                    <th className="py-3.5 px-3 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {pesertaList.map((p, idx) => (
                                    <tr key={p.member_id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="py-3 px-3 text-center font-medium text-slate-400 text-xs">
                                            {idx + 1}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="font-bold text-slate-900 dark:text-white">
                                                {p.nama}
                                            </div>
                                            <div className="text-xs text-slate-500 font-mono">
                                                {p.nim}
                                            </div>
                                        </td>
                                        <td className="py-3 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            #{p.kelompok_urutan} {p.kelompok_nama}
                                        </td>
                                        <td className="py-3 px-3 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                                                p.kategori === 'nonreg'
                                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                            }`}>
                                                {p.kategori}
                                            </span>
                                        </td>

                                        {/* 1. Kehadiran */}
                                        <td className="py-3 px-3 text-center font-mono font-medium">
                                            <div title={`Hadir: ${p.breakdown.kehadiran.hadir}, Sakit/Izin: ${p.breakdown.kehadiran.sakit_izin}, Alpha: ${p.breakdown.kehadiran.alpha} dari ${p.breakdown.kehadiran.total_sesi} sesi`}>
                                                {p.nilai_kehadiran}
                                            </div>
                                        </td>

                                        {/* 2. Keaktifan */}
                                        <td className="py-3 px-3 text-center font-mono font-medium">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <span>{p.nilai_keaktifan}</span>
                                                <button
                                                    onClick={() => handleOpenKeaktifanModal(p)}
                                                    className="p-1 text-slate-400 hover:text-blue-600 rounded print:hidden"
                                                    title="Edit Keaktifan Harian"
                                                >
                                                    <Edit3 size={13} />
                                                </button>
                                            </div>
                                        </td>

                                        {/* 3. Kedisiplinan */}
                                        <td className="py-3 px-3 text-center font-mono font-medium">
                                            <div title={`Total Pengurangan: -${p.breakdown.pelanggaran_poin} poin`}>
                                                {p.nilai_kedisiplinan}
                                            </div>
                                        </td>

                                        {/* 4. Penugasan */}
                                        <td className="py-3 px-3 text-center font-mono font-medium">
                                            <div title={`Resume: ${p.breakdown.penugasan.resume}, Sosmed Klp: ${p.breakdown.penugasan.sosmed_klp}, Sosmed Ind: ${p.breakdown.penugasan.sosmed_ind}, Barang: ${p.breakdown.penugasan.barang}`}>
                                                {p.nilai_penugasan}
                                            </div>
                                        </td>

                                        {/* 5. Kreativitas */}
                                        <td className="py-3 px-3 text-center font-mono font-medium">
                                            {p.nilai_kreativitas}
                                        </td>

                                        {/* Nilai Akhir */}
                                        <td className="py-3 px-3 text-center font-mono font-extrabold text-base text-blue-600 dark:text-blue-400 bg-blue-50/40 dark:bg-blue-950/20">
                                            {p.nilai_akhir}
                                        </td>

                                        {/* Status */}
                                        <td className="py-3 px-3 text-center">
                                            {p.status_kelulusan === 'LULUS' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                                                    <CheckCircle2 size={13} /> Lulus
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                                                    <XCircle size={13} /> Tidak Lulus
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* MODAL EDIT KEAKTIFAN HARIAN PESERTA */}
            {modalKeaktifan.open && modalKeaktifan.member && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                    Edit Keaktifan Harian
                                </h3>
                                <p className="text-xs text-slate-500">
                                    {modalKeaktifan.member.nama} ({modalKeaktifan.member.nim})
                                </p>
                            </div>
                            <button
                                onClick={() => setModalKeaktifan({ open: false, member: null, loading: false, harian: {} })}
                                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {modalKeaktifan.loading ? (
                            <div className="p-8 text-center text-slate-400">
                                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                Memuat nilai keaktifan...
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                                <p className="text-xs text-slate-400">
                                    Skala nilai 0–100. Jika peserta tidak aktif, standar KKM adalah 60.
                                </p>
                                {daftarHari.map(hari => {
                                    const val = modalKeaktifan.harian[hari] !== undefined ? modalKeaktifan.harian[hari] : 60;
                                    return (
                                        <div key={hari} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                                            <div className="flex justify-between items-center mb-1.5">
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                    {hari}
                                                </span>
                                                <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                                                    {val} Poin
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                step="1"
                                                value={val}
                                                onChange={(e) => {
                                                    const newScore = Number(e.target.value);
                                                    setModalKeaktifan(prev => ({
                                                        ...prev,
                                                        harian: {
                                                            ...prev.harian,
                                                            [hari]: newScore
                                                        }
                                                    }));
                                                }}
                                                className="w-full accent-blue-600"
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setModalKeaktifan({ open: false, member: null, loading: false, harian: {} })}
                                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveKeaktifanModal}
                                disabled={savingKeaktifan || modalKeaktifan.loading}
                                className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2"
                            >
                                <Save size={16} />
                                {savingKeaktifan ? 'Menyimpan...' : 'Simpan Keaktifan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
