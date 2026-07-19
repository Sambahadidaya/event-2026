'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getTeams } from '@/api/supabase/public/team';
import { getJadwalPertandingan, getHasilPertandingan } from '@/api/supabase/public/jadwal';
import { upsertJadwalPertandingan, upsertHasilPertandingan, deleteJadwalPertandingan } from '@/api/supabase/admin/jadwal';
import {
    RefreshCw, Plus, Trash2, Edit2, CheckSquare, X, Calendar,
    Trophy, Medal, Clock, Activity, CheckCircle2, Swords, ChevronDown, ToggleLeft, ToggleRight
} from 'lucide-react';
import { NAMA_LOMBA, JENIS_LOMBA } from '@/lib/lombaData';

const STATUS_CONFIG = {
    'Belum Mulai': {
        label: 'Belum Mulai',
        icon: Clock,
        badge: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600',
        select: 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
    },
    'Berlangsung': {
        label: '🔴 Live',
        icon: Activity,
        badge: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 animate-pulse',
        select: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700'
    },
    'Selesai': {
        label: 'Selesai',
        icon: CheckCircle2,
        badge: 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800',
        select: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700'
    }
};

export default function AdminPoseJadwal() {
    const [team, setTeam] = useState([]);
    const [jadwal, setJadwal] = useState([]);
    const [hasilMap, setHasilMap] = useState({}); // { pertandingan_id: { team1_id: {skor, menang}, team2_id: {skor, menang} } }
    const [winCountMap, setWinCountMap] = useState({}); // { team_id: totalWin }
    const [loading, setLoading] = useState(true);

    // Form Jadwal State
    const [showForm, setShowForm] = useState(false);
    const [editingJadwalId, setEditingJadwalId] = useState(null);
    const [team1Id, setTeam1Id] = useState('');
    const [team2Id, setTeam2Id] = useState('');
    const [waktu, setWaktu] = useState('');
    const [jadwalJenisLomba, setJadwalJenisLomba] = useState('');
    const [jadwalNamaLomba, setJadwalNamaLomba] = useState('');
    const [statusJadwal, setStatusJadwal] = useState('Belum Mulai');
    const [skor1, setSkor1] = useState(0);
    const [skor2, setSkor2] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [updatingStatusId, setUpdatingStatusId] = useState(null);

    const formRef = useRef(null);

    const buildMaps = (hasilData) => {
        // hasilMap: { pertandingan_id -> { team_id -> { skor, menang } } }
        const hMap = {};
        // winCountMap: { team_id -> total win }
        const wMap = {};

        hasilData.forEach(h => {
            if (!hMap[h.pertandingan_id]) hMap[h.pertandingan_id] = {};
            hMap[h.pertandingan_id][h.team_id] = { skor: h.skor, menang: h.menang, id: h.id };
            if (h.menang) {
                wMap[h.team_id] = (wMap[h.team_id] || 0) + 1;
            }
        });

        setHasilMap(hMap);
        setWinCountMap(wMap);
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        const [teamData, jadwalData, hasilData] = await Promise.all([
            getTeams('pose'),
            getJadwalPertandingan(),
            getHasilPertandingan()
        ]);
        if (teamData) setTeam(teamData);
        if (jadwalData) setJadwal(jadwalData);
        if (hasilData) buildMaps(hasilData);
        setLoading(false);
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const cancelEditJadwal = () => {
        setEditingJadwalId(null);
        setTeam1Id(''); setTeam2Id(''); setWaktu('');
        setJadwalNamaLomba(''); setJadwalJenisLomba(''); setStatusJadwal('Belum Mulai');
        setSkor1(0); setSkor2(0);
        setShowForm(false);
    };

    const handleEditJadwal = (item) => {
        setEditingJadwalId(item.id);
        setTeam1Id(item.team1_id);
        setTeam2Id(item.team2_id);
        setWaktu(item.waktu ? item.waktu.substring(0, 16) : '');
        setJadwalJenisLomba(item.jenis_lomba || '');
        setJadwalNamaLomba(item.nama_lomba || '');
        setStatusJadwal(item.status || 'Belum Mulai');
        // Load skor yang tersimpan di hasilMap
        const hasil = hasilMap[item.id] || {};
        setSkor1(hasil[item.team1_id]?.skor ?? 0);
        setSkor2(hasil[item.team2_id]?.skor ?? 0);
        setShowForm(true);
        setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    };

    const handleAddOrUpdateJadwal = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const payload = {
            team1_id: team1Id,
            team2_id: team2Id,
            waktu: new Date(waktu + 'Z').toISOString(),
            jenis_lomba: jadwalJenisLomba,
            nama_lomba: jadwalNamaLomba,
            status: statusJadwal,
        };

        if (statusJadwal === 'Berlangsung') {
            payload.started_at = new Date().toISOString();
        } else if (statusJadwal === 'Selesai') {
            payload.ended_at = new Date().toISOString();
        }

        let res, pertandinganId;

        if (editingJadwalId) {
            res = await upsertJadwalPertandingan(payload, editingJadwalId);
            pertandinganId = editingJadwalId;
        } else {
            // Need to create a new action or modify upsert to return the new ID, but for now we just use upsert
            // Wait, upsertJadwalPertandingan only returns { success: true }. 
            // If I just fetch it again? But we need to insert the hasil_pertandingan.
            // Let's rely on server action for that.
            res = await upsertJadwalPertandingan(payload);
            // Since we need the ID, let's refresh first
            // Wait! The user will have to add the match first, then edit it to add scores if I don't return the ID.
            // Let's just fetch the latest inserted match by this payload team1 and team2 to find the ID.
        }

        if (!res || !res.success) {
            alert('Gagal menyimpan jadwal: ' + (res?.error || 'Unknown error'));
            setIsSubmitting(false);
            return;
        }

        // If it's a new match, we find the ID by fetching again
        if (!editingJadwalId) {
            const allJadwal = await getJadwalPertandingan();
            const newMatch = allJadwal.find(j => j.team1_id === team1Id && j.team2_id === team2Id && j.waktu === payload.waktu);
            pertandinganId = newMatch?.id;
        }

        // Upsert hasil_pertandingan untuk kedua tim
        if (pertandinganId && team1Id && team2Id) {
            const resHasil = await upsertHasilPertandingan([
                {
                    pertandingan_id: pertandinganId,
                    team_id: team1Id,
                    skor: skor1,
                    menang: skor1 > skor2
                },
                {
                    pertandingan_id: pertandinganId,
                    team_id: team2Id,
                    skor: skor2,
                    menang: skor2 > skor1
                }
            ]);

            if (!resHasil.success) {
                alert('Jadwal tersimpan, tapi gagal menyimpan skor: ' + resHasil.error);
            }
        }

        cancelEditJadwal();
        await fetchData();
        setIsSubmitting(false);
    };

    const handleDeleteJadwal = async (id) => {
        if (!confirm('Hapus jadwal ini? Data hasil/skor terkait juga akan terhapus.')) return;
        await deleteJadwalPertandingan(id);
        await fetchData();
    };

    const handleStatusChange = async (id, newStatus) => {
        setUpdatingStatusId(id);

        let updateData = { status: newStatus };
        if (newStatus === 'Berlangsung') {
            updateData.started_at = new Date().toISOString();
        } else if (newStatus === 'Selesai') {
            updateData.ended_at = new Date().toISOString();
        }

        const res = await upsertJadwalPertandingan(updateData, id);

        if (!res.success) {
            alert('Gagal update status: ' + res.error);
        } else {
            setJadwal(prev => prev.map(j => j.id === id ? { ...j, ...updateData } : j));
        }
        setUpdatingStatusId(null);
    };

    // Toggle menang untuk sebuah tim di pertandingan tertentu (untuk kreativitas/manual)
    const handleToggleMenang = async (pertandinganId, teamId, currentMenang) => {
        const newMenang = !currentMenang;

        const res = await upsertHasilPertandingan([{
            pertandingan_id: pertandinganId,
            team_id: teamId,
            skor: hasilMap[pertandinganId]?.[teamId]?.skor ?? 0,
            menang: newMenang
        }]);

        if (!res.success) {
            alert('Gagal update: ' + res.error);
        } else {
            await fetchData();
        }
    };

    const filteredTeams = team.filter((t) => {
        return (
            t.jenis_lomba === jadwalJenisLomba &&
            t.nama_lomba === jadwalNamaLomba
        );
    });

    // Hitung klasemen: team + total win dari winCountMap
    const teamWithWins = team.map(t => ({
        ...t,
        totalWin: winCountMap[t.id] || 0
    })).sort((a, b) => b.totalWin - a.totalWin);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">

            {/* HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Manajemen Jadwal POSE</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Atur jadwal pertandingan, skor, dan hasil kemenangan tim</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => { cancelEditJadwal(); fetchData(); }}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl transition-colors shadow-sm"
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                    <button
                        onClick={() => { cancelEditJadwal(); setShowForm(true); }}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors"
                    >
                        <Plus size={16} /> Tambah Jadwal
                    </button>
                </div>
            </div>

            {/* FORM TAMBAH / EDIT JADWAL */}
            {showForm && (
                <div ref={formRef} className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-blue-100 dark:border-blue-900/50 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 flex items-center justify-between">
                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            {editingJadwalId
                                ? <><Edit2 size={18} className="text-orange-500" /> Edit Jadwal Pertandingan</>
                                : <><Calendar size={18} className="text-blue-500" /> Buat Jadwal Baru</>
                            }
                        </h3>
                        <button
                            onClick={cancelEditJadwal}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <form onSubmit={handleAddOrUpdateJadwal} className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Jenis Lomba */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Jenis Lomba *</label>
                                <select
                                    required
                                    value={jadwalJenisLomba}
                                    onChange={(e) => { setJadwalJenisLomba(e.target.value); setJadwalNamaLomba(''); }}
                                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800"
                                >
                                    <option value="">Pilih Jenis Lomba...</option>
                                    {JENIS_LOMBA.map((jenis) => (
                                        <option key={jenis} value={jenis}>{jenis}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Cabang Lomba *</label>
                                <select
                                    required
                                    value={jadwalNamaLomba}
                                    onChange={(e) => setJadwalNamaLomba(e.target.value)}
                                    disabled={!jadwalJenisLomba}
                                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800"
                                >
                                    <option value="">{jadwalJenisLomba ? 'Pilih Cabang Lomba...' : 'Pilih Jenis Lomba terlebih dahulu'}</option>
                                    {NAMA_LOMBA[jadwalJenisLomba]?.map((lomba) => (
                                        <option key={lomba} value={lomba}>{lomba}</option>
                                    ))}
                                </select>
                            </div>
                            {/* Waktu */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Waktu Pertandingan *</label>
                                <input
                                    required type="datetime-local" value={waktu} onChange={e => setWaktu(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                            </div>
                            {/* Status */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
                                <select
                                    value={statusJadwal} onChange={e => setStatusJadwal(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                >
                                    <option value="Belum Mulai">⏳ Belum Mulai</option>
                                    <option value="Berlangsung">🔴 Berlangsung (Live)</option>
                                    <option value="Selesai">✅ Selesai</option>
                                </select>
                            </div>
                        </div>

                        {/* Matchup + Skor */}
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-800/50 dark:to-blue-900/10 border border-gray-100 dark:border-gray-700">
                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Swords size={14} /> Susunan Pertandingan & Skor
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-4 items-start">
                                {/* Tim 1 */}
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Tim 1 *</label>
                                        <select
                                            required value={team1Id} onChange={e => setTeam1Id(e.target.value)}
                                            className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Pilih Tim 1...</option>
                                            {filteredTeams.map(t => <option key={t.id} value={t.id}>{t.title} ({t.nama_lomba})</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Skor Tim 1</label>
                                        <input
                                            type="number" min="0" value={skor1} onChange={e => setSkor1(parseInt(e.target.value) || 0)}
                                            className="w-full px-3 py-2 text-center text-2xl font-black border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div className="hidden md:flex items-center justify-center pt-8 pb-2">
                                    <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 shadow-sm flex items-center justify-center">
                                        <span className="font-black italic text-gray-400 dark:text-gray-500 text-sm">VS</span>
                                    </div>
                                </div>

                                {/* Tim 2 */}
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Tim 2 *</label>
                                        <select
                                            required value={team2Id} onChange={e => setTeam2Id(e.target.value)}
                                            className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Pilih Tim 2...</option>
                                            {filteredTeams.map(t => <option key={t.id} value={t.id}>{t.title} ({t.nama_lomba})</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Skor Tim 2</label>
                                        <input
                                            type="number" min="0" value={skor2} onChange={e => setSkor2(parseInt(e.target.value) || 0)}
                                            className="w-full px-3 py-2 text-center text-2xl font-black border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 mt-3">* Menang/kalah ditentukan otomatis dari skor. Bisa diubah manual di tabel klasemen.</p>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={cancelEditJadwal} className="px-5 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-colors">
                                Batal
                            </button>
                            <button
                                type="submit" disabled={isSubmitting}
                                className={`px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 text-white shadow-sm transition-all disabled:opacity-60 ${editingJadwalId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                            >
                                {isSubmitting
                                    ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    : (editingJadwalId ? <CheckSquare size={16} /> : <Plus size={16} />)
                                }
                                {editingJadwalId ? 'Update Jadwal' : 'Simpan Jadwal'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* TABEL DAFTAR JADWAL */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/50 flex items-center gap-2">
                    <Trophy size={18} className="text-yellow-500" />
                    <h3 className="font-bold text-gray-900 dark:text-white">Daftar Jadwal & Hasil Pertandingan</h3>
                    <span className="ml-auto text-xs text-gray-500 font-medium">{jadwal.length} pertandingan</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-700 text-xs uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400">
                            <tr>
                                <th className="px-5 py-3 text-left">Cabang</th>
                                <th className="px-5 py-3 text-left">Waktu</th>
                                <th className="px-5 py-3 text-center">Tim 1</th>
                                <th className="px-5 py-3 text-center w-24">Skor</th>
                                <th className="px-5 py-3 text-center">Tim 2</th>
                                <th className="px-5 py-3 text-center w-36">Status</th>
                                <th className="px-5 py-3 text-center w-20">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={7} className="px-5 py-4">
                                            <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded-lg" />
                                        </td>
                                    </tr>
                                ))
                            ) : jadwal.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-16 text-center text-gray-400">
                                        <Calendar size={40} className="mx-auto mb-3 opacity-30" />
                                        <p className="font-medium">Belum ada jadwal pertandingan</p>
                                    </td>
                                </tr>
                            ) : jadwal.map(item => {
                                const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG['Belum Mulai'];
                                const isUpdating = updatingStatusId === item.id;
                                const hasil = hasilMap[item.id] || {};
                                const skor1Val = hasil[item.team1_id]?.skor ?? 0;
                                const skor2Val = hasil[item.team2_id]?.skor ?? 0;

                                return (
                                    <tr key={item.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/30 transition-colors group">
                                        <td className="px-5 py-4 font-semibold text-gray-800 dark:text-gray-200 whitespace-nowrap">
                                            {item.nama_lomba}
                                        </td>
                                        <td className="px-5 py-4 text-gray-500 dark:text-gray-400 whitespace-nowrap text-xs">
                                            {item.waktu ? new Date(item.waktu.substring(0, 16)).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : ''}
                                        </td>
                                        <td className="px-5 py-4 text-center font-bold text-gray-800 dark:text-gray-200">
                                            {item.team1?.title || <span className="text-gray-400 font-normal">TBD</span>}
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span className={`inline-block px-3 py-1 rounded-lg font-black text-base tabular-nums ${item.status === 'Berlangsung' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>
                                                {skor1Val} – {skor2Val}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-center font-bold text-gray-800 dark:text-gray-200">
                                            {item.team2?.title || <span className="text-gray-400 font-normal">TBD</span>}
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            {isUpdating ? (
                                                <div className="flex justify-center">
                                                    <span className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                                </div>
                                            ) : (
                                                <div className="relative inline-block">
                                                    <select
                                                        value={item.status}
                                                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                                        className={`pl-3 pr-7 py-1.5 text-xs font-bold rounded-xl border cursor-pointer outline-none focus:ring-2 focus:ring-blue-400 transition-all appearance-none ${statusCfg.select}`}
                                                    >
                                                        <option value="Belum Mulai">⏳ Belum Mulai</option>
                                                        <option value="Berlangsung">🔴 Berlangsung</option>
                                                        <option value="Selesai">✅ Selesai</option>
                                                    </select>
                                                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <div className="flex justify-center gap-1.5">
                                                <button
                                                    onClick={() => handleEditJadwal(item)}
                                                    className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-500 hover:bg-orange-100 dark:hover:bg-orange-900/40 flex items-center justify-center transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteJadwal(item.id)}
                                                    className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 flex items-center justify-center transition-colors"
                                                    title="Hapus"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* TABEL KLASEMEN / POIN */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/50 flex items-center gap-2">
                    <Medal size={18} className="text-emerald-500" />
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">Klasemen & Manajemen Kemenangan</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Kemenangan dihitung otomatis dari skor. Gunakan toggle per pertandingan untuk koreksi manual.
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-700 text-xs uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400">
                            <tr>
                                <th className="px-5 py-3 text-left">Tim</th>
                                <th className="px-5 py-3 text-left">Lomba</th>
                                <th className="px-5 py-3 text-center">Total Menang</th>
                                <th className="px-5 py-3 text-center">Detail per Pertandingan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {teamWithWins.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-5 py-12 text-center text-gray-400">
                                        <p className="font-medium">Belum ada data tim</p>
                                    </td>
                                </tr>
                            ) : teamWithWins.map(item => {
                                // Cari semua pertandingan yang melibatkan tim ini
                                const teamJadwal = jadwal.filter(j => j.team1_id === item.id || j.team2_id === item.id);

                                return (
                                    <tr key={item.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/30 transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="font-semibold text-gray-800 dark:text-gray-200">{item.title}</div>
                                            <div className="text-xs text-gray-500 mt-0.5">{item.totalWin} kemenangan</div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="inline-block text-xs font-semibold px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg border border-emerald-100 dark:border-emerald-800">
                                                {item.jenis_lomba}
                                            </span>
                                            <div className="text-xs text-gray-500 mt-1">{item.nama_lomba}</div>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto font-black text-lg ${item.totalWin > 0 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
                                                {item.totalWin}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-center gap-2 flex-wrap">
                                                {teamJadwal.length === 0 && (
                                                    <span className="text-xs text-gray-400">Belum ada pertandingan</span>
                                                )}
                                                {teamJadwal.map((j, idx) => {
                                                    const hasilTim = hasilMap[j.id]?.[item.id];
                                                    const isMenang = hasilTim?.menang ?? false;
                                                    return (
                                                        <button
                                                            key={j.id}
                                                            type="button"
                                                            onClick={() => handleToggleMenang(j.id, item.id, isMenang)}
                                                            title={`${j.nama_lomba} — Klik untuk toggle menang/kalah`}
                                                            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl border-2 text-xs font-bold transition-all ${isMenang
                                                                ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                                                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 hover:border-emerald-300'
                                                            }`}
                                                        >
                                                            <span>{idx + 1}</span>
                                                            <span className="text-[9px] font-normal">{isMenang ? 'Menang' : 'Kalah'}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}
