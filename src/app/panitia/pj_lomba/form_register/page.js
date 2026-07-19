'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Users, Search, Eye, CheckCircle2, XCircle, Clock, Filter } from 'lucide-react';
import { getTeams } from '@/api/supabase/public/team';
import { upsertTeam } from '@/api/supabase/admin/team';
import { getPeserta } from '@/api/supabase/admin/peserta';
import { getCurrentAdmin } from '@/api/supabase/admin/auth';
import DashboardHeaderFilters from '@/components/panitia/DashboardHeaderFilters';
import DashboardSelect from '@/components/panitia/DashboardSelect';
import DetailModal from '@/components/panitia/DetailModal';
import TablePagination from '@/components/panitia/TablePagination';
import { formatDateTime } from '@/lib/dashboardUtils';
import { JENIS_LOMBA, NAMA_LOMBA } from '@/lib/lombaData';
import { getLombaFilter } from '@/lib/adminRoleData';

const ITEMS_PER_PAGE = 10;
const CACHE_KEY = 'pj_lomba_register_cache';

export default function PJLombaFormRegister() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [jenisLomba, setJenisLomba] = useState('all');
    const [namaLomba, setNamaLomba] = useState('all');
    const [kategoriFilter, setKategoriFilter] = useState('all');
    const [lastSyncedAt, setLastSyncedAt] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [detailItem, setDetailItem] = useState(null);
    const [verifikasiItem, setVerifikasiItem] = useState(null);
    const [verifikasiLoading, setVerifikasiLoading] = useState(false);
    const [adminRole, setAdminRole] = useState(null);
    const [lockedLomba, setLockedLomba] = useState(null);

    const fetchData = useCallback(async (forceRefresh = false) => {
        setLoading(true);

        // Get admin role to determine filter
        const admin = await getCurrentAdmin();
        if (admin) {
            setAdminRole(admin.role);
            const filter = getLombaFilter(admin.role);
            setLockedLomba(filter);

            // If admin has a locked lomba filter, preset the namaLomba
            if (filter) {
                setNamaLomba(filter);
                // Find the jenis for this nama_lomba
                for (const [jenis, namaList] of Object.entries(NAMA_LOMBA)) {
                    if (namaList.includes(filter)) {
                        setJenisLomba(jenis);
                        break;
                    }
                }
            }
        }

        const cacheKey = CACHE_KEY;
        const timeKey = `${CACHE_KEY}_time`;

        if (!forceRefresh) {
            const cachedData = localStorage.getItem(cacheKey);
            const cachedAt = localStorage.getItem(timeKey);
            if (cachedData) {
                try {
                    setData(JSON.parse(cachedData));
                    if (cachedAt) setLastSyncedAt(Number(cachedAt));
                    setLoading(false);
                    return;
                } catch (e) {
                    console.error('Failed to parse cache', e);
                }
            }
        }

        // Fetch team + team_members
        const teamData = await getTeams('pose');
        // Fetch peserta register
        const pesertaData = await getPeserta('pose');

        // Filter peserta to only 'register' type
        const registerPeserta = (pesertaData || []).filter(p => p.jenis_form === 'register');

        // Map peserta into teams by matching names
        const enrichedTeams = (teamData || []).map(team => {
            // Find peserta that belong to this team's members
            const memberNames = (team.team_members || []).map(m => m.nama?.toLowerCase().trim());
            const memberCodes = (team.team_members || []).map(m => m.kode?.toLowerCase().trim());
            
            const matchedPeserta = registerPeserta.filter(p => 
                memberNames.includes(p.nama?.toLowerCase().trim()) || 
                (p.nim && memberCodes.includes(p.nim?.toLowerCase().trim()))
            );

            return {
                ...team,
                peserta: matchedPeserta
            };
        });

        if (enrichedTeams) {
            setData(enrichedTeams);
            const now = Date.now();
            localStorage.setItem(cacheKey, JSON.stringify(enrichedTeams));
            localStorage.setItem(timeKey, now.toString());
            setLastSyncedAt(now);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Reset nama lomba ketika jenis lomba berubah (only if not locked)
    useEffect(() => {
        if (!lockedLomba) {
            setNamaLomba('all');
        }
    }, [jenisLomba, lockedLomba]);

    const filteredData = useMemo(() => {
        let result = data;

        if (jenisLomba !== 'all') {
            result = result.filter(item => item.jenis_lomba === jenisLomba);
        }
        if (namaLomba !== 'all') {
            result = result.filter(item => item.nama_lomba === namaLomba);
        }
        if (kategoriFilter !== 'all') {
            result = result.filter(item => item.peserta && item.peserta.length > 0 && item.peserta[0].kategori === kategoriFilter);
        }

        const searchLower = searchQuery.toLowerCase();
        if (searchQuery) {
            result = result.filter(item =>
                (item.title && item.title.toLowerCase().includes(searchLower)) ||
                (item.team_members && item.team_members.some(m => m.nama?.toLowerCase().includes(searchLower)))
            );
        }
        return result;
    }, [data, jenisLomba, namaLomba, kategoriFilter, searchQuery]);

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE) || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedData = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    useEffect(() => {
        setCurrentPage(1);
    }, [jenisLomba, namaLomba, searchQuery]);

    const handleVerifikasi = async (status) => {
        if (!verifikasiItem) return;
        setVerifikasiLoading(true);

        const res = await upsertTeam({ verivikasi: status }, null, verifikasiItem.id);

        if (!res.success) {
            window.alert('Gagal memverifikasi tim: ' + res.error);
        } else {
            const updated = data.map(d =>
                d.id === verifikasiItem.id ? { ...d, verivikasi: status } : d
            );
            setData(updated);
            localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
            setVerifikasiItem(null);
        }
        setVerifikasiLoading(false);
    };

    const renderDetailFields = (item) => {
        if (!item) return [];
        return [
            { label: 'Nama Tim', value: item.title },
            { label: 'Jenis Lomba', value: item.jenis_lomba || '-' },
            { label: 'Nama Lomba', value: item.nama_lomba || '-' },
            { label: 'Tanggal Daftar', value: formatDateTime(item.created_at) },
            { label: 'Status Verifikasi', value: item.verivikasi === true ? 'Disetujui' : item.verivikasi === false ? 'Ditolak' : 'Pending' },
            {
                label: 'Bukti Pembayaran',
                value: item.bukti_bayar ? (
                    <a href={item.bukti_bayar} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold">Lihat Gambar</span>
                    </a>
                ) : '-',
                isCustom: true
            },
            {
                label: 'Daftar Anggota (Team Members)',
                value: (
                    <div className="mt-2 space-y-3">
                        {item.team_members?.map((m, idx) => (
                            <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm border border-gray-100 dark:border-gray-700">
                                <p className="font-semibold">{m.nama} <span className="text-gray-500 font-normal">({m.jabatan || 'Anggota'})</span></p>
                                <p className="text-gray-600 dark:text-gray-400">Kode: {m.kode || '-'}</p>
                            </div>
                        ))}
                    </div>
                ),
                isCustom: true
            },
            {
                label: 'Data Peserta (Tabel Peserta)',
                value: (
                    <div className="mt-2 space-y-3">
                        {(item.peserta && item.peserta.length > 0) ? item.peserta.map((p, idx) => (
                            <div key={idx} className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-sm border border-indigo-100 dark:border-indigo-800/50">
                                <p className="font-semibold">{p.nama} <span className="text-gray-500 font-normal">({p.kategori})</span></p>
                                <p className="text-gray-600 dark:text-gray-400">NIM: {p.nim || '-'} • Prodi: {p.prodi || '-'} • Angkatan: {p.angkatan || '-'}</p>
                                <p className="text-gray-600 dark:text-gray-400">Kampus: {p.kampus || '-'} • Kontak: {p.email_wa || '-'}</p>
                                <p className="text-gray-600 dark:text-gray-400">Metode Bayar: {p.metode_pembayaran || '-'} • Status: {p.status_pembayaran || '-'}</p>
                            </div>
                        )) : (
                            <p className="text-gray-500 text-sm italic">Belum ada data peserta terhubung.</p>
                        )}
                    </div>
                ),
                isCustom: true
            },
        ];
    };

    const extraFilters = (
        <>
            {!lockedLomba && (
                <DashboardSelect
                    icon={Filter}
                    value={jenisLomba}
                    onChange={(e) => setJenisLomba(e.target.value)}
                    options={[
                        { value: 'all', label: 'Semua Jenis Lomba' },
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
                <div className="flex items-center gap-2 px-3 py-2 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/50 rounded-xl text-sm">
                    <Filter size={14} className="text-violet-500" />
                    <span className="text-violet-700 dark:text-violet-300 font-semibold">{lockedLomba}</span>
                </div>
            )}
            <DashboardSelect
                icon={Filter}
                value={kategoriFilter}
                onChange={(e) => setKategoriFilter(e.target.value)}
                options={[
                    { value: 'all', label: 'Semua Kategori' },
                    { value: 'Mahasiswa LP3I', label: 'Mahasiswa LP3I' },
                    { value: 'Dosen', label: 'Dosen' },
                    { value: 'Umum', label: 'Umum' }
                ]}
            />
        </>
    );

    return (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
            <DashboardHeaderFilters
                title="Manajemen Registrasi"
                subtitle={lockedLomba ? `Data registrasi untuk ${lockedLomba}` : 'Kelola tim yang mendaftar lomba POSE'}
                icon={Users}
                showSiteFilter={false}
                extraFilters={extraFilters}
                onRefresh={() => fetchData(true)}
                loading={loading}
                lastSyncedAt={lastSyncedAt}
            />

            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <h3 className="font-bold text-base sm:text-lg text-gray-800 dark:text-gray-200">Daftar Pendaftar</h3>
                    <div className="relative flex-1 sm:flex-none sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Cari nama tim atau anggota..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500/30"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                            <tr>
                                <th className="px-4 py-3 font-medium w-12 text-center">No</th>
                                <th className="px-4 py-3 font-medium">Nama Team</th>
                                <th className="px-4 py-3 font-medium text-center">Jml Anggota</th>
                                <th className="px-4 py-3 font-medium">Nama Lomba</th>
                                <th className="px-4 py-3 font-medium">Jenis Lomba</th>
                                <th className="px-4 py-3 font-medium text-center">Peserta</th>
                                <th className="px-4 py-3 font-medium w-44">Tanggal</th>
                                <th className="px-4 py-3 font-medium w-24 text-center">Lihat</th>
                                <th className="px-4 py-3 font-medium w-32 text-center">Verifikasi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {loading && data.length === 0 ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={`skel-${i}`} className="animate-pulse bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                                        <td colSpan={9} className="px-4 py-4"><div className="h-8 bg-gray-100 dark:bg-gray-800 rounded-lg w-full"></div></td>
                                    </tr>
                                ))
                            ) : paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-16 text-center text-gray-500">Tidak ada pendaftar ditemukan.</td>
                                </tr>
                            ) : paginatedData.map((item, index) => (
                                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="px-4 py-3 text-center text-gray-500 font-medium">{startIndex + index + 1}</td>
                                    <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-200">{item.title}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="inline-flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full h-6 w-6 text-xs font-bold">
                                            {item.team_members?.length || 0}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 font-medium">{item.nama_lomba || '-'}</td>
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">{item.jenis_lomba || '-'}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="inline-flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full h-6 w-6 text-xs font-bold">
                                            {item.peserta?.length || 0}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{formatDateTime(item.created_at)}</td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            type="button"
                                            onClick={() => setDetailItem(item)}
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors"
                                        >
                                            <Eye size={14} />
                                            Lihat
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {item.verivikasi === true ? (
                                            <button
                                                type="button"
                                                onClick={() => setVerifikasiItem(item)}
                                                className="inline-flex items-center justify-center gap-1 w-full px-2 py-1.5 text-xs font-semibold rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/50 hover:bg-green-100 transition-colors"
                                            >
                                                <CheckCircle2 size={14} /> Disetujui
                                            </button>
                                        ) : item.verivikasi === false ? (
                                            <button
                                                type="button"
                                                onClick={() => setVerifikasiItem(item)}
                                                className="inline-flex items-center justify-center gap-1 w-full px-2 py-1.5 text-xs font-semibold rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50 hover:bg-red-100 transition-colors"
                                            >
                                                <XCircle size={14} /> Ditolak
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => setVerifikasiItem(item)}
                                                className="inline-flex items-center justify-center gap-1 w-full px-2 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 hover:bg-amber-100 transition-colors"
                                            >
                                                <Clock size={14} /> Pending
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <TablePagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={filteredData.length}
                            itemsPerPage={ITEMS_PER_PAGE}
                            onPageChange={setCurrentPage}
                            colSpan={9}
                        />
                    </table>
                </div>
            </div>

            <DetailModal
                open={Boolean(detailItem)}
                onClose={() => setDetailItem(null)}
                title="Detail Registrasi Tim"
                fields={renderDetailFields(detailItem)}
            />

            {verifikasiItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 dark:border-gray-800">
                        <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Verifikasi Tim</h3>
                            <button onClick={() => setVerifikasiItem(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                &times;
                            </button>
                        </div>
                        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-sm flex-1">
                            {renderDetailFields(verifikasiItem).map((field, i) => (
                                <div key={i} className="flex flex-col sm:flex-row sm:gap-4 pb-3 border-b border-gray-50 dark:border-gray-800/50 last:border-0 last:pb-0">
                                    <span className="text-gray-500 dark:text-gray-400 w-32 shrink-0">{field.label}</span>
                                    {field.isCustom ? (
                                        <div className="flex-1 mt-1 sm:mt-0 text-gray-900 dark:text-gray-100">{field.value}</div>
                                    ) : (
                                        <span className="flex-1 font-medium text-gray-900 dark:text-gray-100 mt-1 sm:mt-0">{field.value}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="p-4 sm:p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex justify-end gap-3">
                            <button
                                onClick={() => handleVerifikasi(false)}
                                disabled={verifikasiLoading}
                                className="px-4 py-2 rounded-xl text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                                Tolak
                            </button>
                            <button
                                onClick={() => handleVerifikasi(true)}
                                disabled={verifikasiLoading}
                                className="px-4 py-2 rounded-xl text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                            >
                                Setujui
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
