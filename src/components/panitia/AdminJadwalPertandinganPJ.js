'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Calendar, Plus, Edit2, Trash2, Clock, Activity, CheckCircle2, RefreshCw, Filter, Trophy, Users } from 'lucide-react';
import { getTeams } from '@/api/supabase/public/team';
import { getJadwalPertandingan } from '@/api/supabase/public/jadwal';
import { upsertJadwalPertandingan, deleteJadwalPertandingan } from '@/api/supabase/admin/jadwal';
import { getCurrentAdmin } from '@/api/supabase/admin/auth';
import DashboardHeaderFilters from '@/components/panitia/DashboardHeaderFilters';
import TombolCetak from '@/components/panitia/TombolCetak';
import DashboardSelect from '@/components/panitia/DashboardSelect';
import { formatWibDateTime } from '@/lib/dashboardUtils';
import { JENIS_LOMBA, NAMA_LOMBA } from '@/lib/lombaData';
import { getLombaFilter } from '@/lib/adminRoleData';

export default function AdminJadwalPertandinganPJ() {
    const [teams, setTeams] = useState([]);
    const [jadwalList, setJadwalList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastSyncedAt, setLastSyncedAt] = useState(null);
    const [adminRole, setAdminRole] = useState(null);
    const [lockedLomba, setLockedLomba] = useState(null);

    // Filters
    const [jenisLomba, setJenisLomba] = useState('all');
    const [namaLomba, setNamaLomba] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    // Form Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formJenisLomba, setFormJenisLomba] = useState('Olahraga');
    const [formNamaLomba, setFormNamaLomba] = useState('');
    const [team1Id, setTeam1Id] = useState('');
    const [team2Id, setTeam2Id] = useState('');
    const [waktu, setWaktu] = useState('');
    const [urutan, setUrutan] = useState(0);
    const [statusJadwal, setStatusJadwal] = useState('Belum Mulai');
    const [submitting, setSubmitting] = useState(false);

    // Confirm Delete Modal State
    const [deleteItem, setDeleteItem] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const fetchData = useCallback(async (forceRefresh = false) => {
        setLoading(true);

        const admin = await getCurrentAdmin();
        if (admin) {
            setAdminRole(admin.role);
            const filter = getLombaFilter(admin.role);
            setLockedLomba(filter);

            if (filter) {
                setNamaLomba(filter);
                for (const [jenis, namaList] of Object.entries(NAMA_LOMBA)) {
                    if (namaList.includes(filter)) {
                        setJenisLomba(jenis);
                        break;
                    }
                }
            }
        }

        const [teamData, jadwalData] = await Promise.all([
            getTeams('pose'),
            getJadwalPertandingan()
        ]);

        if (teamData) setTeams(teamData.filter(t => t.verivikasi === true));
        if (jadwalData) setJadwalList(jadwalData);

        setLastSyncedAt(Date.now());
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredJadwal = useMemo(() => {
        return jadwalList.filter(j => {
            const matchJenis = jenisLomba === 'all' || (j.jenis_lomba && j.jenis_lomba.toLowerCase() === jenisLomba.toLowerCase());
            const matchNama = namaLomba === 'all' || (j.nama_lomba && j.nama_lomba.toLowerCase() === namaLomba.toLowerCase());
            const matchStatus = statusFilter === 'all' || j.status === statusFilter;
            return matchJenis && matchNama && matchStatus;
        });
    }, [jadwalList, jenisLomba, namaLomba, statusFilter]);

    // Available team list for selection based on selected formNamaLomba
    const availableTeams = useMemo(() => {
        if (!formNamaLomba) return teams;
        return teams.filter(t => t.nama_lomba?.toLowerCase().trim() === formNamaLomba.toLowerCase().trim());
    }, [teams, formNamaLomba]);

    const handleOpenCreateModal = () => {
        setEditingItem(null);
        const initialJenis = lockedLomba ? jenisLomba : (jenisLomba !== 'all' ? jenisLomba : 'Olahraga');
        const initialNama = lockedLomba || (namaLomba !== 'all' ? namaLomba : (NAMA_LOMBA[initialJenis]?.[0] || ''));
        
        setFormJenisLomba(initialJenis);
        setFormNamaLomba(initialNama);
        setTeam1Id('');
        setTeam2Id('');
        setWaktu('');
        setUrutan(0);
        setStatusJadwal('Belum Mulai');
        setShowModal(true);
    };

    const handleOpenEditModal = (item) => {
        setEditingItem(item);
        setFormJenisLomba(item.jenis_lomba || 'Olahraga');
        setFormNamaLomba(item.nama_lomba || '');
        setTeam1Id(item.team1_id || '');
        setTeam2Id(item.team2_id || '');
        setWaktu(item.waktu ? new Date(item.waktu).toISOString().slice(0, 16) : '');
        setUrutan(item.urutan || 0);
        setStatusJadwal(item.status || 'Belum Mulai');
        setShowModal(true);
    };

    const handleFormJenisChange = (newJenis) => {
        setFormJenisLomba(newJenis);
        const defaultNama = NAMA_LOMBA[newJenis]?.[0] || '';
        setFormNamaLomba(defaultNama);
        setTeam1Id('');
        setTeam2Id('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formNamaLomba) {
            alert('Pilih nama lomba terlebih dahulu.');
            return;
        }

        if (!team1Id) {
            alert('Pilih Tim 1 terlebih dahulu.');
            return;
        }

        const isKreativitas = formJenisLomba === 'Kreativitas';
        if (!isKreativitas && !team2Id) {
            alert('Pilih Tim 2 untuk lomba kategori Olahraga/Games.');
            return;
        }

        if (!waktu) {
            alert('Waktu pertandingan harus diisi.');
            return;
        }

        setSubmitting(true);

        const payload = {
            jenis_lomba: formJenisLomba,
            nama_lomba: formNamaLomba,
            team1_id: team1Id,
            team2_id: isKreativitas ? null : team2Id,
            waktu: new Date(waktu).toISOString(),
            urutan: parseInt(urutan, 10) || 0,
            status: statusJadwal
        };

        if (statusJadwal === 'Berlangsung' && (!editingItem || editingItem.status !== 'Berlangsung')) {
            payload.started_at = new Date().toISOString();
        } else if (statusJadwal === 'Selesai' && (!editingItem || editingItem.status !== 'Selesai')) {
            payload.ended_at = new Date().toISOString();
        }

        const res = await upsertJadwalPertandingan(payload, editingItem?.id);
        setSubmitting(false);

        if (res.success) {
            setShowModal(false);
            fetchData(true);
        } else {
            alert(res.error || 'Gagal menyimpan jadwal pertandingan.');
        }
    };

    const handleDelete = async () => {
        if (!deleteItem) return;
        setDeleting(true);
        const res = await deleteJadwalPertandingan(deleteItem.id);
        setDeleting(false);
        setDeleteItem(null);

        if (res.success) {
            fetchData(true);
        } else {
            alert(res.error || 'Gagal menghapus jadwal pertandingan.');
        }
    };

    const extraFilters = (
        <>
            {!lockedLomba && (
                <DashboardSelect
                    icon={Filter}
                    value={jenisLomba}
                    onChange={(e) => {
                        setJenisLomba(e.target.value);
                        setNamaLomba('all');
                    }}
                    options={[
                        { value: 'all', label: 'Semua Jenis' },
                        ...JENIS_LOMBA.map(j => ({ value: j, label: j }))
                    ]}
                />
            )}
            {!lockedLomba && jenisLomba !== 'all' && NAMA_LOMBA[jenisLomba] && (
                <DashboardSelect
                    icon={Filter}
                    value={namaLomba}
                    onChange={(e) => setNamaLomba(e.target.value)}
                    options={[
                        { value: 'all', label: 'Semua Lomba' },
                        ...NAMA_LOMBA[jenisLomba].map(n => ({ value: n, label: n }))
                    ]}
                />
            )}
            <DashboardSelect
                icon={Filter}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                    { value: 'all', label: 'Semua Status' },
                    { value: 'Belum Mulai', label: 'Belum Mulai' },
                    { value: 'Berlangsung', label: '🔴 Live / Berlangsung' },
                    { value: 'Selesai', label: 'Selesai' }
                ]}
            />
            {lockedLomba && (
                <div className="flex items-center gap-2 px-3 py-2 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/50 rounded-xl text-sm font-semibold text-violet-700 dark:text-violet-300">
                    <Filter size={14} />
                    <span>{lockedLomba}</span>
                </div>
            )}
        </>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <DashboardHeaderFilters
                title="Manajemen Jadwal Pertandingan"
                subtitle={lockedLomba ? `Kelola jadwal pertandingan untuk ${lockedLomba}` : 'Kelola jadwal pertandingan POSE'}
                icon={Calendar}
                showSiteFilter={false}
                extraFilters={extraFilters}
                onRefresh={() => fetchData(true)}
                loading={loading}
                lastSyncedAt={lastSyncedAt}
            />

            {/* Action Bar */}
            <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Trophy size={18} className="text-violet-500" />
                    <span>Total Jadwal: <strong className="text-violet-600 dark:text-violet-400">{filteredJadwal.length}</strong></span>
                </div>

                <div className="flex items-center gap-2">
                    <TombolCetak
                        label="Cetak / Export"
                        pdfTitle="Laporan Jadwal Pertandingan Lomba POSE 2026"
                        pdfSite="pose"
                        pdfData={filteredJadwal.map(item => ({
                            urutan: item.urutan || '-',
                            nama_lomba: item.nama_lomba || '-',
                            pertandingan: item.jenis_lomba === 'Kreativitas'
                                ? (item.team1?.title || '-')
                                : `${item.team1?.title || 'TBD'} VS ${item.team2?.title || 'TBD'}`,
                            waktu: item.waktu,
                            status: item.status || 'Belum Mulai'
                        }))}
                        pdfColumns={[
                            { key: 'urutan', label: 'Urutan', align: 'center' },
                            { key: 'nama_lomba', label: 'Lomba' },
                            { key: 'pertandingan', label: 'Tim / Pertandingan' },
                            { key: 'waktu', label: 'Waktu Pertandingan', format: 'datetime' },
                            { key: 'status', label: 'Status', align: 'center' }
                        ]}
                        excelData={filteredJadwal.map(item => ({
                            'Urutan': item.urutan || '-',
                            'Nama Lomba': item.nama_lomba || '-',
                            'Jenis Lomba': item.jenis_lomba || '-',
                            'Pertandingan': item.jenis_lomba === 'Kreativitas'
                                ? (item.team1?.title || '-')
                                : `${item.team1?.title || 'TBD'} VS ${item.team2?.title || 'TBD'}`,
                            'Waktu': item.waktu,
                            'Status': item.status || 'Belum Mulai'
                        }))}
                        excelColumns={[
                            { key: 'Urutan', label: 'Urutan' },
                            { key: 'Nama Lomba', label: 'Nama Lomba' },
                            { key: 'Jenis Lomba', label: 'Jenis Lomba' },
                            { key: 'Pertandingan', label: 'Pertandingan' },
                            { key: 'Waktu', label: 'Waktu', format: 'datetime' },
                            { key: 'Status', label: 'Status' }
                        ]}
                        excelFilename="Jadwal_Pertandingan_POSE2026"
                    />

                    <button
                        onClick={handleOpenCreateModal}
                        className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-violet-500/20 transition-all active:scale-95"
                    >
                        <Plus size={18} />
                        <span>Tambah Jadwal</span>
                    </button>
                </div>
            </div>

            {/* Table Jadwal */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 font-semibold">
                            <tr>
                                <th className="px-4 py-3.5 text-center w-16">Urutan</th>
                                <th className="px-4 py-3.5">Lomba</th>
                                <th className="px-4 py-3.5">Pertandingan / Tim</th>
                                <th className="px-4 py-3.5">Waktu</th>
                                <th className="px-4 py-3.5 text-center">Status</th>
                                <th className="px-4 py-3.5 text-center w-28">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <tr key={`skel-${i}`} className="animate-pulse">
                                        <td colSpan={6} className="px-4 py-4">
                                            <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded-lg w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredJadwal.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        Belum ada jadwal pertandingan terdaftar.
                                    </td>
                                </tr>
                            ) : (
                                filteredJadwal.map((item) => {
                                    const isKreativitas = item.jenis_lomba === 'Kreativitas';
                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors">
                                            <td className="px-4 py-4 text-center font-bold text-violet-600 dark:text-violet-400">
                                                #{item.urutan ?? 0}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="font-bold text-gray-900 dark:text-white">{item.nama_lomba}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{item.jenis_lomba}</div>
                                            </td>
                                            <td className="px-4 py-4">
                                                {isKreativitas ? (
                                                    <div className="flex items-center gap-2">
                                                        {item.team1?.gambar ? (
                                                            <img src={item.team1.gambar} alt="" className="w-7 h-7 rounded-full object-cover border" />
                                                        ) : (
                                                            <div className="w-7 h-7 rounded-full bg-violet-100 text-violet-600 font-bold text-xs flex items-center justify-center">
                                                                {item.team1?.title?.charAt(0) || 'T'}
                                                            </div>
                                                        )}
                                                        <span className="font-semibold text-gray-800 dark:text-gray-200">{item.team1?.title || 'Team Tidak Ditemukan'}</span>
                                                        <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium ml-1">Kreativitas</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 font-semibold text-gray-800 dark:text-gray-200">
                                                        <span>{item.team1?.title || 'TBD'}</span>
                                                        <span className="text-xs text-violet-500 font-bold px-1.5 py-0.5 bg-violet-50 dark:bg-violet-900/30 rounded">VS</span>
                                                        <span>{item.team2?.title || 'TBD'}</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-gray-600 dark:text-gray-300 text-xs">
                                                {formatWibDateTime(item.waktu)}
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                                    item.status === 'Berlangsung'
                                                        ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 animate-pulse'
                                                        : item.status === 'Selesai'
                                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                                            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                                }`}>
                                                    {item.status === 'Berlangsung' && <Activity size={12} />}
                                                    {item.status === 'Selesai' && <CheckCircle2 size={12} />}
                                                    {item.status === 'Belum Mulai' && <Clock size={12} />}
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() => handleOpenEditModal(item)}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                        title="Edit Jadwal"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteItem(item)}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                        title="Hapus Jadwal"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                                <Calendar size={20} className="text-violet-500" />
                                {editingItem ? 'Edit Jadwal Pertandingan' : 'Tambah Jadwal Pertandingan'}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                            {/* Jenis Lomba */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                                    Jenis Lomba
                                </label>
                                <select
                                    value={formJenisLomba}
                                    onChange={(e) => handleFormJenisChange(e.target.value)}
                                    disabled={!!lockedLomba}
                                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-violet-500"
                                >
                                    {JENIS_LOMBA.map(j => (
                                        <option key={j} value={j}>{j}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Nama Lomba */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                                    Nama Lomba
                                </label>
                                <select
                                    value={formNamaLomba}
                                    onChange={(e) => {
                                        setFormNamaLomba(e.target.value);
                                        setTeam1Id('');
                                        setTeam2Id('');
                                    }}
                                    disabled={!!lockedLomba}
                                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-violet-500"
                                >
                                    {(NAMA_LOMBA[formJenisLomba] || []).map(n => (
                                        <option key={n} value={n}>{n}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Urutan */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                                    Urutan Pertandingan (Manual)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={urutan}
                                    onChange={(e) => setUrutan(e.target.value)}
                                    placeholder="Contoh: 1, 2, 3"
                                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-violet-500"
                                />
                            </div>

                            {/* Team 1 */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                                    {formJenisLomba === 'Kreativitas' ? 'Pilih Tim Peserta' : 'Tim 1'}
                                </label>
                                <select
                                    value={team1Id}
                                    onChange={(e) => setTeam1Id(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-violet-500"
                                >
                                    <option value="">-- Pilih Tim --</option>
                                    {availableTeams.map(t => (
                                        <option key={t.id} value={t.id} disabled={t.id === team2Id}>
                                            {t.title} ({t.nama_lomba})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Team 2 (Only if NOT Kreativitas) */}
                            {formJenisLomba !== 'Kreativitas' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                                        Tim 2 (Lawan)
                                    </label>
                                    <select
                                        value={team2Id}
                                        onChange={(e) => setTeam2Id(e.target.value)}
                                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-violet-500"
                                    >
                                        <option value="">-- Pilih Tim 2 --</option>
                                        {availableTeams.map(t => (
                                            <option key={t.id} value={t.id} disabled={t.id === team1Id}>
                                                {t.title} ({t.nama_lomba})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Waktu */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                                    Waktu Pertandingan
                                </label>
                                <input
                                    type="datetime-local"
                                    value={waktu}
                                    onChange={(e) => setWaktu(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-violet-500"
                                />
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                                    Status Pertandingan
                                </label>
                                <select
                                    value={statusJadwal}
                                    onChange={(e) => setStatusJadwal(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-violet-500 font-semibold"
                                >
                                    <option value="Belum Mulai">Belum Mulai</option>
                                    <option value="Berlangsung">🔴 Live / Berlangsung</option>
                                    <option value="Selesai">Selesai</option>
                                </select>
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm shadow-md transition-all disabled:opacity-60"
                                >
                                    {submitting ? 'Menyimpan...' : (editingItem ? 'Simpan Perubahan' : 'Tambah Jadwal')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirm Delete Modal */}
            {deleteItem && (
                <ConfirmModal
                    open={!!deleteItem}
                    onClose={() => setDeleteItem(null)}
                    onConfirm={handleDelete}
                    loading={deleting}
                    title="Hapus Jadwal Pertandingan?"
                    message={`Apakah Anda yakin ingin menghapus jadwal pertandingan ${deleteItem.nama_lomba}? Data yang dihapus tidak dapat dikembalikan.`}
                />
            )}
        </div>
    );
}
