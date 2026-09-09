'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Sparkles,
    Users,
    Save,
    X,
    CheckCircle2,
    AlertTriangle,
    Edit3,
    Search,
    Award,
    Music,
    Palette,
    Video,
    FileText
} from 'lucide-react';
import { getCurrentAdmin } from '@/api/supabase/admin/auth';
import { hasAccess } from '@/lib/adminRoleData';
import {
    getPenilaianKreativitasList,
    savePenilaianKreativitas
} from '@/api/supabase/admin/penilaian_kreativitas';

export default function PenilaianKreativitasPage() {
    const router = useRouter();
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [kelompokList, setKelompokList] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedJenis, setSelectedJenis] = useState('all');

    // Modal
    const [modal, setModal] = useState({
        open: false,
        data: null,
        skor_yelyel: 0,
        skor_kreasi_seni: 0,
        skor_vlog: 0,
        catatan: ''
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
            const res = await getPenilaianKreativitasList();
            if (res.success) {
                setKelompokList(res.data || []);
            } else {
                showToast(res.error || 'Gagal memuat penilaian kreativitas', 'error');
            }
        } catch (err) {
            console.error('Error fetching kreativitas:', err);
            showToast('Terjadi kesalahan memuat data', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            try {
                const currentAdmin = await getCurrentAdmin();
                if (!currentAdmin) {
                    router.push('/panitia/login');
                    return;
                }
                if (!hasAccess(currentAdmin.role, '/panitia/pj_kabim/penilaian_kreativitas')) {
                    router.push('/panitia/dashboard');
                    return;
                }
                setAdmin(currentAdmin);
                await fetchData();
            } catch (err) {
                console.error(err);
            }
        };
        init();
    }, [router, fetchData]);

    // Filter
    const filteredList = useMemo(() => {
        return kelompokList.filter(item => {
            const matchSearch =
                (item.nama_kelompok || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (item.nama_kabim || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                `kelompok ${item.urutan}`.includes(searchQuery.toLowerCase());
            const matchJenis = selectedJenis === 'all' || item.jenis_kelompok === selectedJenis;
            return matchSearch && matchJenis;
        });
    }, [kelompokList, searchQuery, selectedJenis]);

    // Live preview average modal
    const liveAvg = useMemo(() => {
        const y = parseFloat(modal.skor_yelyel) || 0;
        const s = parseFloat(modal.skor_kreasi_seni) || 0;
        const v = parseFloat(modal.skor_vlog) || 0;
        return ((y + s + v) / 3).toFixed(2);
    }, [modal.skor_yelyel, modal.skor_kreasi_seni, modal.skor_vlog]);

    const handleOpenModal = (kel) => {
        setModal({
            open: true,
            data: kel,
            skor_yelyel: kel.skor_yelyel || 0,
            skor_kreasi_seni: kel.skor_kreasi_seni || 0,
            skor_vlog: kel.skor_vlog || 0,
            catatan: kel.catatan || ''
        });
    };

    const handleSave = async () => {
        if (!modal.data) return;
        setSaving(true);
        try {
            const res = await savePenilaianKreativitas({
                kelompok_id: modal.data.kelompok_id,
                skor_yelyel: modal.skor_yelyel,
                skor_kreasi_seni: modal.skor_kreasi_seni,
                skor_vlog: modal.skor_vlog,
                catatan: modal.catatan
            });

            if (res.success) {
                showToast(`Nilai kreativitas ${modal.data.nama_kelompok} berhasil disimpan`, 'success');
                setModal({ open: false, data: null, skor_yelyel: 0, skor_kreasi_seni: 0, skor_vlog: 0, catatan: '' });
                await fetchData();
            } else {
                showToast(res.error || 'Gagal menyimpan nilai', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Terjadi kesalahan saat menyimpan', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
            {/* Toast */}
            {toast && (
                <div
                    className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium transition-all ${
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-transparent p-6 rounded-2xl border border-purple-500/20">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-600 text-white rounded-xl shadow-lg shadow-purple-500/20">
                        <Sparkles size={26} />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                            Penilaian Kreativitas Kelompok
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Input manual nilai Yel-yel, Kreasi Seni, dan Vlog untuk kelompok binaan PKKMB 2026
                        </p>
                    </div>
                </div>
            </div>

            {/* Info Banner Rumus */}
            <div className="p-4 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 rounded-xl flex items-center gap-3 text-xs text-purple-800 dark:text-purple-300">
                <Award size={18} className="shrink-0 text-purple-600 dark:text-purple-400" />
                <span>
                    <strong>Pedoman Penilaian:</strong> Nilai Kreativitas dihitung dari rata-rata 3 komponen:{' '}
                    <code>(Skor Yel-yel + Skor Kreasi Seni + Skor Vlog) / 3</code>. Nilai kelompok ini otomatis berlaku sama untuk seluruh anggota di dalam kelompok tersebut.
                </span>
            </div>

            {/* Filter Bar */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
                <div className="relative w-full md:w-80">
                    <Search size={17} className="absolute left-3.5 top-3 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari kelompok / nama kabim..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    {['all', 'reguler', 'nonreg'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setSelectedJenis(tab)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                                selectedJenis === tab
                                    ? 'bg-purple-600 text-white shadow-sm'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                        >
                            {tab === 'all' ? 'Semua Kategori' : tab === 'reguler' ? 'Reguler' : 'Non-Reguler'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Cards Grid Kelompok */}
            {loading ? (
                <div className="p-16 text-center text-slate-400">
                    <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    Memuat kelompok binaan...
                </div>
            ) : filteredList.length === 0 ? (
                <div className="p-16 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <Users size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="font-medium text-sm">Tidak ada kelompok binaan yang ditemukan.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredList.map(kel => (
                        <div
                            key={kel.kelompok_id}
                            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 hover:border-purple-300 dark:hover:border-purple-800 transition-all flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                                                #{kel.urutan}
                                            </span>
                                            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                                {kel.jenis_kelompok}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-base text-slate-900 dark:text-white mt-1">
                                            {kel.nama_kelompok}
                                        </h3>
                                        <p className="text-xs text-slate-500">
                                            Kabim: {kel.nama_kabim || '-'}
                                        </p>
                                    </div>

                                    {/* Nilai Akhir Badge */}
                                    <div className="text-right">
                                        <span className="text-xs text-slate-400 block font-medium">Nilai Akhir</span>
                                        <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
                                            {kel.nilai_akhir ? Number(kel.nilai_akhir).toFixed(1) : '0.0'}
                                        </span>
                                    </div>
                                </div>

                                {/* 3 Kriteria Breakdown */}
                                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                                    <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center">
                                        <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500 font-medium mb-0.5">
                                            <Music size={12} className="text-amber-500" />
                                            Yel-yel
                                        </div>
                                        <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                                            {kel.skor_yelyel || 0}
                                        </span>
                                    </div>

                                    <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center">
                                        <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500 font-medium mb-0.5">
                                            <Palette size={12} className="text-blue-500" />
                                            Seni
                                        </div>
                                        <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                                            {kel.skor_kreasi_seni || 0}
                                        </span>
                                    </div>

                                    <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center">
                                        <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500 font-medium mb-0.5">
                                            <Video size={12} className="text-rose-500" />
                                            Vlog
                                        </div>
                                        <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                                            {kel.skor_vlog || 0}
                                        </span>
                                    </div>
                                </div>

                                {kel.catatan && (
                                    <p className="text-xs text-slate-500 italic mt-3 line-clamp-2 bg-slate-50 dark:bg-slate-800/30 p-2 rounded-lg">
                                        "{kel.catatan}"
                                    </p>
                                )}
                            </div>

                            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                {kel.sudah_dinilai ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                        <CheckCircle2 size={13} /> Sudah Dinilai
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-500">
                                        <AlertTriangle size={13} /> Belum Diisi
                                    </span>
                                )}

                                <button
                                    onClick={() => handleOpenModal(kel)}
                                    className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
                                >
                                    <Edit3 size={13} />
                                    {kel.sudah_dinilai ? 'Ubah Nilai' : 'Beri Nilai'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Input Nilai */}
            {modal.open && modal.data && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                    Penilaian Kreativitas Kelompok
                                </h3>
                                <p className="text-xs text-slate-500">
                                    #{modal.data.urutan} {modal.data.nama_kelompok} ({modal.data.nama_kabim || 'Kabim'})
                                </p>
                            </div>
                            <button
                                onClick={() => setModal({ open: false, data: null, skor_yelyel: 0, skor_kreasi_seni: 0, skor_vlog: 0, catatan: '' })}
                                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Live Average Preview Card */}
                        <div className="p-4 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-transparent rounded-xl border border-purple-500/20 flex items-center justify-between">
                            <div>
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Estimasi Nilai Rata-rata
                                </span>
                                <div className="text-xs text-slate-400 mt-0.5">
                                    (Yel-yel + Kreasi Seni + Vlog) / 3
                                </div>
                            </div>
                            <span className="text-3xl font-black text-purple-600 dark:text-purple-400">
                                {liveAvg}
                            </span>
                        </div>

                        {/* 3 Input Kriteria */}
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                        <Music size={14} className="text-amber-500" /> Skor Yel-yel (0 - 100)
                                    </label>
                                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                                        {modal.skor_yelyel}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="1"
                                    value={modal.skor_yelyel}
                                    onChange={(e) => setModal(prev => ({ ...prev, skor_yelyel: Number(e.target.value) }))}
                                    className="w-full accent-purple-600"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                        <Palette size={14} className="text-blue-500" /> Skor Kreasi Seni (0 - 100)
                                    </label>
                                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                                        {modal.skor_kreasi_seni}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="1"
                                    value={modal.skor_kreasi_seni}
                                    onChange={(e) => setModal(prev => ({ ...prev, skor_kreasi_seni: Number(e.target.value) }))}
                                    className="w-full accent-purple-600"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                        <Video size={14} className="text-rose-500" /> Skor Vlog Kelompok (0 - 100)
                                    </label>
                                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                                        {modal.skor_vlog}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="1"
                                    value={modal.skor_vlog}
                                    onChange={(e) => setModal(prev => ({ ...prev, skor_vlog: Number(e.target.value) }))}
                                    className="w-full accent-purple-600"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                                    Catatan Evaluasi (Opsional)
                                </label>
                                <textarea
                                    rows="2"
                                    value={modal.catatan}
                                    onChange={(e) => setModal(prev => ({ ...prev, catatan: e.target.value }))}
                                    placeholder="Kekompakan, ketepatan waktu, orisinalitas ide..."
                                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none text-xs"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setModal({ open: false, data: null, skor_yelyel: 0, skor_kreasi_seni: 0, skor_vlog: 0, catatan: '' })}
                                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving}
                                className="px-5 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md shadow-purple-500/20 flex items-center gap-2"
                            >
                                <Save size={16} />
                                {saving ? 'Menyimpan...' : 'Simpan Nilai'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
