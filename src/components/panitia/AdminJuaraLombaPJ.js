'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Trophy, Plus, Edit2, Trash2, Filter, Award, Medal, Users } from 'lucide-react';
import { getTeams } from '@/api/supabase/public/team';
import { getJuaraLomba } from '@/api/supabase/public/juara';
import { upsertJuaraLomba, deleteJuaraLomba } from '@/api/supabase/admin/juara';
import { getCurrentAdmin } from '@/api/supabase/admin/auth';
import DashboardHeaderFilters from '@/components/panitia/DashboardHeaderFilters';
import TombolCetak from '@/components/panitia/TombolCetak';
import DashboardSelect from '@/components/panitia/DashboardSelect';
import ConfirmModal from '@/components/panitia/ConfirmModal';
import { formatWibDateTime } from '@/lib/dashboardUtils';
import { JENIS_LOMBA, NAMA_LOMBA } from '@/lib/lombaData';
import { getLombaFilter } from '@/lib/adminRoleData';

export default function AdminJuaraLombaPJ() {
    const [teams, setTeams] = useState([]);
    const [juaraList, setJuaraList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastSyncedAt, setLastSyncedAt] = useState(null);
    const [adminRole, setAdminRole] = useState(null);
    const [lockedLomba, setLockedLomba] = useState(null);

    // Filters
    const [jenisLomba, setJenisLomba] = useState('all');
    const [namaLomba, setNamaLomba] = useState('all');

    // Form Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [formJenisLomba, setFormJenisLomba] = useState('Olahraga');
    const [formNamaLomba, setFormNamaLomba] = useState('');
    const [teamId, setTeamId] = useState('');
    const [peringkat, setPeringkat] = useState(1);
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

        const [teamData, juaraData] = await Promise.all([
            getTeams('pose'),
            getJuaraLomba()
        ]);

        if (teamData) setTeams(teamData.filter(t => t.verivikasi === true));
        if (juaraData) setJuaraList(juaraData);

        setLastSyncedAt(Date.now());
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredJuara = useMemo(() => {
        return juaraList.filter(j => {
            const matchJenis = jenisLomba === 'all' || (j.jenis_lomba && j.jenis_lomba.toLowerCase() === jenisLomba.toLowerCase());
            const matchNama = namaLomba === 'all' || (j.nama_lomba && j.nama_lomba.toLowerCase() === namaLomba.toLowerCase());
            return matchJenis && matchNama;
        });
    }, [juaraList, jenisLomba, namaLomba]);

    // Available team list based on formNamaLomba
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
        setTeamId('');
        setPeringkat(1);
        setShowModal(true);
    };

    const handleOpenEditModal = (item) => {
        setEditingItem(item);
        setFormJenisLomba(item.jenis_lomba || 'Olahraga');
        setFormNamaLomba(item.nama_lomba || '');
        setTeamId(item.team_id || '');
        setPeringkat(item.peringkat || 1);
        setShowModal(true);
    };

    const handleFormJenisChange = (newJenis) => {
        setFormJenisLomba(newJenis);
        const defaultNama = NAMA_LOMBA[newJenis]?.[0] || '';
        setFormNamaLomba(defaultNama);
        setTeamId('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formNamaLomba) {
            alert('Pilih nama lomba terlebih dahulu.');
            return;
        }

        if (!teamId) {
            alert('Pilih Tim pemenang terlebih dahulu.');
            return;
        }

        setSubmitting(true);

        const payload = {
            jenis_lomba: formJenisLomba,
            nama_lomba: formNamaLomba,
            team_id: teamId,
            peringkat: parseInt(peringkat, 10) || 1
        };

        const res = await upsertJuaraLomba(payload, editingItem?.id);
        setSubmitting(false);

        if (res.success) {
            setShowModal(false);
            fetchData(true);
        } else {
            alert(res.error || 'Gagal menyimpan data juara.');
        }
    };

    const handleDelete = async () => {
        if (!deleteItem) return;
        setDeleting(true);
        const res = await deleteJuaraLomba(deleteItem.id);
        setDeleting(false);
        setDeleteItem(null);

        if (res.success) {
            fetchData(true);
        } else {
            alert(res.error || 'Gagal menghapus data juara.');
        }
    };

    const getBadgePeringkat = (p) => {
        switch (parseInt(p, 10)) {
            case 1:
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-bold rounded-full text-xs border border-amber-300 dark:border-amber-700">
                        <Trophy size={14} className="text-amber-500 fill-amber-400" />
                        Juara 1 (Emas)
                    </span>
                );
            case 2:
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-full text-xs border border-slate-300 dark:border-slate-700">
                        <Medal size={14} className="text-slate-400 fill-slate-300" />
                        Juara 2 (Perak)
                    </span>
                );
            case 3:
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300 font-bold rounded-full text-xs border border-orange-300 dark:border-orange-700">
                        <Award size={14} className="text-orange-500 fill-orange-400" />
                        Juara 3 (Perunggu)
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 font-bold rounded-full text-xs">
                        Juara {p}
                    </span>
                );
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
                title="Manajemen Juara Lomba"
                subtitle={lockedLomba ? `Kelola daftar juara untuk ${lockedLomba}` : 'Kelola daftar pemenang / juara perlombaan POSE'}
                icon={Trophy}
                showSiteFilter={false}
                extraFilters={extraFilters}
                onRefresh={() => fetchData(true)}
                loading={loading}
                lastSyncedAt={lastSyncedAt}
            />

            {/* Action Bar */}
            <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Trophy size={18} className="text-amber-500" />
                    <span>Total Juara Dicatat: <strong className="text-violet-600 dark:text-violet-400">{filteredJuara.length}</strong></span>
                </div>

                <div className="flex items-center gap-2">
                    <TombolCetak
                        label="Cetak / Export"
                        pdfTitle="Daftar Juara Perlombaan POSE 2026"
                        pdfSite="pose"
                        pdfData={filteredJuara.map(item => ({
                            peringkat: `Juara ${item.peringkat}`,
                            nama_lomba: item.nama_lomba || '-',
                            team: item.team?.title || '-',
                            waktu: item.created_at
                        }))}
                        pdfColumns={[
                            { key: 'peringkat', label: 'Peringkat', align: 'center' },
                            { key: 'nama_lomba', label: 'Lomba' },
                            { key: 'team', label: 'Tim Pemenang' },
                            { key: 'waktu', label: 'Tanggal Input', format: 'datetime' }
                        ]}
                        excelData={filteredJuara.map(item => ({
                            'Peringkat': `Juara ${item.peringkat}`,
                            'Nama Lomba': item.nama_lomba || '-',
                            'Jenis Lomba': item.jenis_lomba || '-',
                            'Tim Pemenang': item.team?.title || '-',
                            'Tanggal Input': item.created_at
                        }))}
                        excelColumns={[
                            { key: 'Peringkat', label: 'Peringkat' },
                            { key: 'Nama Lomba', label: 'Nama Lomba' },
                            { key: 'Jenis Lomba', label: 'Jenis Lomba' },
                            { key: 'Tim Pemenang', label: 'Tim Pemenang' },
                            { key: 'Tanggal Input', label: 'Tanggal Input', format: 'datetime' }
                        ]}
                        excelFilename="Daftar_Juara_POSE2026"
                    />

                    <button
                        onClick={handleOpenCreateModal}
                        className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-violet-500/20 transition-all active:scale-95"
                    >
                        <Plus size={18} />
                        <span>Tambah Juara</span>
                    </button>
                </div>
            </div>

            {/* Table Juara */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 font-semibold">
                            <tr>
                                <th className="px-4 py-3.5 text-center w-16">No</th>
                                <th className="px-4 py-3.5">Lomba</th>
                                <th className="px-4 py-3.5">Tim Pemenang</th>
                                <th className="px-4 py-3.5 text-center">Peringkat Juara</th>
                                <th className="px-4 py-3.5">Tanggal Dicatat</th>
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
                            ) : filteredJuara.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        Belum ada data juara yang dicatat.
                                    </td>
                                </tr>
                            ) : (
                                filteredJuara.map((item, idx) => (
                                    <tr key={item.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors">
                                        <td className="px-4 py-4 text-center font-semibold text-gray-500">
                                            {idx + 1}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="font-bold text-gray-900 dark:text-white">{item.nama_lomba}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">{item.jenis_lomba}</div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                {item.team?.gambar ? (
                                                    <img src={item.team.gambar} alt="" className="w-8 h-8 rounded-full object-cover border" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300 font-bold text-xs flex items-center justify-center">
                                                        {item.team?.title?.charAt(0) || 'T'}
                                                    </div>
                                                )}
                                                <div>
                                                    <span className="font-bold text-gray-900 dark:text-white block">{item.team?.title || 'Team Tidak Ditemukan'}</span>
                                                    {item.team?.team_members && item.team.team_members.length > 0 && (
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                            {item.team.team_members.map(m => m.nama).join(', ')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            {getBadgePeringkat(item.peringkat)}
                                        </td>
                                        <td className="px-4 py-4 text-gray-600 dark:text-gray-300 text-xs">
                                            {formatWibDateTime(item.created_at)}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => handleOpenEditModal(item)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                    title="Edit Juara"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteItem(item)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                    title="Hapus Juara"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
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
                                <Trophy size={20} className="text-amber-500" />
                                {editingItem ? 'Edit Data Juara' : 'Tambah Data Juara'}
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
                                        setTeamId('');
                                    }}
                                    disabled={!!lockedLomba}
                                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-violet-500"
                                >
                                    {(NAMA_LOMBA[formJenisLomba] || []).map(n => (
                                        <option key={n} value={n}>{n}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Team */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                                    Pilih Tim Pemenang
                                </label>
                                <select
                                    value={teamId}
                                    onChange={(e) => setTeamId(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-violet-500"
                                >
                                    <option value="">-- Pilih Tim --</option>
                                    {availableTeams.map(t => (
                                        <option key={t.id} value={t.id}>
                                            {t.title} ({t.nama_lomba})
                                        </option>
                                    ))}
                                </select>
                                {availableTeams.length === 0 && (
                                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                        Belum ada tim terverifikasi untuk lomba ini.
                                    </p>
                                )}
                            </div>

                            {/* Peringkat */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                                    Peringkat Juara
                                </label>
                                <select
                                    value={peringkat}
                                    onChange={(e) => setPeringkat(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-violet-500 font-bold"
                                >
                                    <option value={1}>🥇 Juara 1 (Emas)</option>
                                    <option value={2}>🥈 Juara 2 (Perak)</option>
                                    <option value={3}>🥉 Juara 3 (Perunggu)</option>
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
                                    {submitting ? 'Menyimpan...' : (editingItem ? 'Simpan Perubahan' : 'Tambah Juara')}
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
                    title="Hapus Data Juara?"
                    message={`Apakah Anda yakin ingin menghapus data Juara ${deleteItem.peringkat} (${deleteItem.team?.title || 'Tim'}) untuk lomba ${deleteItem.nama_lomba}? Data yang dihapus tidak dapat dikembalikan.`}
                />
            )}
        </div>
    );
}
