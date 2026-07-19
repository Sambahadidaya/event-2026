'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { BarChart3, Users, CheckCircle2, XCircle, Clock, Trophy, Filter } from 'lucide-react';
import { getTeams } from '@/api/supabase/public/team';
import { getPeserta } from '@/api/supabase/admin/peserta';
import { getCurrentAdmin } from '@/api/supabase/admin/auth';
import DashboardHeaderFilters from '@/components/panitia/DashboardHeaderFilters';
import DashboardOverviewCards from '@/components/panitia/DashboardOverviewCards';
import DashboardSelect from '@/components/panitia/DashboardSelect';
import { JENIS_LOMBA, NAMA_LOMBA } from '@/lib/lombaData';
import { getLombaFilter } from '@/lib/adminRoleData';

export default function PJLombaDashboard() {
    const [teams, setTeams] = useState([]);
    const [peserta, setPeserta] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastSyncedAt, setLastSyncedAt] = useState(null);
    const [lockedLomba, setLockedLomba] = useState(null);
    const [jenisLomba, setJenisLomba] = useState('all');
    const [namaLomba, setNamaLomba] = useState('all');

    const fetchData = useCallback(async (forceRefresh = false) => {
        setLoading(true);

        const admin = await getCurrentAdmin();
        if (admin) {
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

        const teamData = await getTeams('pose');
        const pesertaData = await getPeserta('pose');

        setTeams(teamData || []);
        setPeserta((pesertaData || []).filter(p => p.jenis_form === 'register'));
        setLastSyncedAt(Date.now());
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (!lockedLomba) {
            setNamaLomba('all');
        }
    }, [jenisLomba, lockedLomba]);

    const filteredTeams = useMemo(() => {
        let result = teams;
        if (jenisLomba !== 'all') {
            result = result.filter(t => t.jenis_lomba === jenisLomba);
        }
        if (namaLomba !== 'all') {
            result = result.filter(t => t.nama_lomba === namaLomba);
        }
        return result;
    }, [teams, jenisLomba, namaLomba]);

    const stats = useMemo(() => {
        const total = filteredTeams.length;
        const verified = filteredTeams.filter(t => t.verivikasi === true).length;
        const rejected = filteredTeams.filter(t => t.verivikasi === false).length;
        const pending = filteredTeams.filter(t => t.verivikasi == null).length;

        // Count peserta matching filtered teams
        const filteredNamaLomba = namaLomba !== 'all' ? [namaLomba] : (jenisLomba !== 'all' ? (NAMA_LOMBA[jenisLomba] || []) : []);
        let pesertaCount = peserta.length;
        if (filteredNamaLomba.length > 0) {
            // Get member names from filtered teams
            const memberNames = new Set();
            filteredTeams.forEach(t => {
                (t.team_members || []).forEach(m => memberNames.add(m.nama));
            });
            pesertaCount = peserta.filter(p => memberNames.has(p.nama)).length;
        }

        return { total, verified, rejected, pending, pesertaCount };
    }, [filteredTeams, peserta, jenisLomba, namaLomba]);

    // Per-lomba breakdown for dashboard table
    const lombaBreakdown = useMemo(() => {
        const map = {};

        filteredTeams.forEach(t => {
            const key = t.nama_lomba || 'Tidak Diketahui';
            if (!map[key]) {
                map[key] = { nama: key, jenis: t.jenis_lomba || '-', total: 0, verified: 0, rejected: 0, pending: 0 };
            }
            map[key].total++;
            if (t.verivikasi === true) map[key].verified++;
            else if (t.verivikasi === false) map[key].rejected++;
            else map[key].pending++;
        });

        return Object.values(map).sort((a, b) => b.total - a.total);
    }, [filteredTeams]);

    const overviewCards = [
        {
            key: 'total',
            label: 'Total Tim',
            value: stats.total,
            icon: Users,
            iconBg: 'bg-blue-50 dark:bg-blue-900/20',
            iconClass: 'text-blue-500',
            subtext: `${stats.pesertaCount} peserta terdaftar`,
            subtextClass: 'text-blue-500',
        },
        {
            key: 'verified',
            label: 'Disetujui',
            value: stats.verified,
            icon: CheckCircle2,
            iconBg: 'bg-green-50 dark:bg-green-900/20',
            iconClass: 'text-green-500',
            subtext: stats.total > 0 ? `${Math.round((stats.verified / stats.total) * 100)}%` : '0%',
            subtextClass: 'text-green-500',
        },
        {
            key: 'rejected',
            label: 'Ditolak',
            value: stats.rejected,
            icon: XCircle,
            iconBg: 'bg-red-50 dark:bg-red-900/20',
            iconClass: 'text-red-500',
            subtext: stats.total > 0 ? `${Math.round((stats.rejected / stats.total) * 100)}%` : '0%',
            subtextClass: 'text-red-500',
        },
        {
            key: 'pending',
            label: 'Pending',
            value: stats.pending,
            icon: Clock,
            iconBg: 'bg-amber-50 dark:bg-amber-900/20',
            iconClass: 'text-amber-500',
            subtext: stats.total > 0 ? `${Math.round((stats.pending / stats.total) * 100)}%` : '0%',
            subtextClass: 'text-amber-500',
        },
    ];

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
        </>
    );

    return (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
            <DashboardHeaderFilters
                title="Dashboard PJ Lomba"
                subtitle={lockedLomba ? `Ringkasan data untuk ${lockedLomba}` : 'Ringkasan data registrasi lomba POSE'}
                icon={BarChart3}
                showSiteFilter={false}
                extraFilters={extraFilters}
                onRefresh={() => fetchData(true)}
                loading={loading}
                lastSyncedAt={lastSyncedAt}
            />

            <DashboardOverviewCards cards={overviewCards} />

            {/* Per-Lomba Breakdown Table */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                    <h3 className="font-bold text-base sm:text-lg text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        <Trophy size={18} className="text-violet-500" />
                        Ringkasan Per Lomba
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                            <tr>
                                <th className="px-4 py-3 font-medium w-12 text-center">No</th>
                                <th className="px-4 py-3 font-medium">Nama Lomba</th>
                                <th className="px-4 py-3 font-medium">Jenis</th>
                                <th className="px-4 py-3 font-medium text-center">Total Tim</th>
                                <th className="px-4 py-3 font-medium text-center">Disetujui</th>
                                <th className="px-4 py-3 font-medium text-center">Ditolak</th>
                                <th className="px-4 py-3 font-medium text-center">Pending</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <tr key={`skel-${i}`} className="animate-pulse">
                                        <td colSpan={7} className="px-4 py-4">
                                            <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded-lg w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : lombaBreakdown.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">Belum ada data registrasi.</td>
                                </tr>
                            ) : lombaBreakdown.map((row, idx) => (
                                <tr key={row.nama} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="px-4 py-3 text-center text-gray-500 font-medium">{idx + 1}</td>
                                    <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-200">{row.nama}</td>
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">{row.jenis}</td>
                                    <td className="px-4 py-3 text-center font-bold text-gray-800 dark:text-gray-200">{row.total}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="inline-flex items-center justify-center bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full px-2.5 py-0.5 text-xs font-bold">
                                            {row.verified}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="inline-flex items-center justify-center bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full px-2.5 py-0.5 text-xs font-bold">
                                            {row.rejected}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="inline-flex items-center justify-center bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full px-2.5 py-0.5 text-xs font-bold">
                                            {row.pending}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
