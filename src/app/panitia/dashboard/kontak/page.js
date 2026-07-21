'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Mail, Inbox, Eye, Eraser, CheckSquare, Square, Search, CheckCircle2, CircleDashed, Trash2 } from 'lucide-react';
import { getKontak, updateKontakJawab, deleteMultipleKontak } from '@/api/supabase/admin/admin';
import { useRouter } from 'next/navigation';
import DashboardHeaderFilters from '@/components/panitia/DashboardHeaderFilters';
import DashboardOverviewCards from '@/components/panitia/DashboardOverviewCards';
import DashboardCalendarLegend from '@/components/panitia/DashboardCalendarLegend';
import DashboardDonutChart from '@/components/panitia/DashboardDonutChart';
import DetailModal from '@/components/panitia/DetailModal';
import ConfirmModal from '@/components/panitia/ConfirmModal';
import TablePagination from '@/components/panitia/TablePagination';
import {
    MONTH_NAMES, startOfDay, getDaysBetween,
    buildDailyCounts, filterByDateRange, formatDateTime
} from '@/lib/dashboardUtils';

const ITEMS_PER_PAGE = 10;
const CACHE_KEY = 'kontak_data_cache';

export default function KontakDashboard() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formatting, setFormatting] = useState(false);
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [adminRole, setAdminRole] = useState(null);
    const [lastSyncedAt, setLastSyncedAt] = useState(null);
    const [draftStartDate, setDraftStartDate] = useState('');
    const [draftEndDate, setDraftEndDate] = useState('');
    const [appliedDateRange, setAppliedDateRange] = useState(null);
    const [calendarMonth, setCalendarMonth] = useState(() => {
        const now = new Date();
        return { year: now.getFullYear(), month: now.getMonth() };
    });
    const [selectedIds, setSelectedIds] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [detailItem, setDetailItem] = useState(null);
    const [confirmJawabItem, setConfirmJawabItem] = useState(null);
    const [jawabLoading, setJawabLoading] = useState(false);
    const router = useRouter();

    const fetchData = useCallback(async (forceRefresh = false) => {
        setLoading(true);

        const currentRole = 'super_admin'; 
        setAdminRole(currentRole);

        const cacheRoleKey = `${CACHE_KEY}_${currentRole}`;
        const timeKey = `${CACHE_KEY}_time_${currentRole}`;

        if (!forceRefresh) {
            const cachedData = localStorage.getItem(cacheRoleKey);
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

        const kontakData = await getKontak();
        
        if (kontakData) {
            let filteredData = kontakData;
            if (currentRole === 'admin_pkkmb') filteredData = kontakData.filter(d => d.site === 'pkkmb');
            else if (currentRole === 'admin_pose') filteredData = kontakData.filter(d => d.site === 'pose');

            setData(filteredData);
            const now = Date.now();
            localStorage.setItem(cacheRoleKey, JSON.stringify(filteredData));
            localStorage.setItem(timeKey, now.toString());
            setLastSyncedAt(now);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const siteFiltered = useMemo(() => {
        return data.filter(item => {
            if (adminRole === 'super_admin' && activeTab !== 'all') return item.site === activeTab;
            return true;
        });
    }, [data, adminRole, activeTab]);

    const filteredData = useMemo(() => {
        let result = filterByDateRange(siteFiltered, appliedDateRange, 'created_at');
        const searchLower = searchQuery.toLowerCase();
        if (searchQuery) {
            result = result.filter(item =>
                (item.nama && item.nama.toLowerCase().includes(searchLower)) ||
                (item.email && item.email.toLowerCase().includes(searchLower)) ||
                (item.whatsapp && item.whatsapp.toLowerCase().includes(searchLower)) ||
                (item.pesan && item.pesan.toLowerCase().includes(searchLower))
            );
        }
        return result;
    }, [siteFiltered, appliedDateRange, searchQuery]);

    const dailyCounts = useMemo(() => buildDailyCounts(siteFiltered, 'created_at'), [siteFiltered]);

    const pkkmbCount = data.filter(item => item.site === 'pkkmb').length;
    const poseCount = data.filter(item => item.site === 'pose').length;

    const sudahDijawabCount = filteredData.filter(item => item.jawab).length;
    const belumDijawabCount = filteredData.length - sudahDijawabCount;

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE) || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedData = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    useEffect(() => {
        setCurrentPage(1);
        setSelectedIds([]);
    }, [activeTab, searchQuery, appliedDateRange]);

    const toggleSelect = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        const pageIds = paginatedData.map(item => item.id);
        const allSelected = pageIds.every(id => selectedIds.includes(id));
        if (allSelected) {
            setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
        } else {
            setSelectedIds(prev => [...new Set([...prev, ...pageIds])]);
        }
    };

    const deleteItems = async (ids) => {
        if (adminRole !== 'super_admin' || ids.length === 0) return;
        if (!window.confirm(`Hapus ${ids.length} data kontak? Tindakan ini tidak dapat dibatalkan.`)) return;

        setFormatting(true);
        const res = await deleteMultipleKontak(ids);
        if (!res.success) {
            window.alert('Gagal menghapus data.');
            setFormatting(false);
            return;
        }

        const remaining = data.filter(item => !ids.includes(item.id));
        setData(remaining);
        setSelectedIds(prev => prev.filter(id => !ids.includes(id)));

        const now = Date.now();
        localStorage.setItem(`${CACHE_KEY}_${adminRole}`, JSON.stringify(remaining));
        localStorage.setItem(`${CACHE_KEY}_time_${adminRole}`, now.toString());
        setLastSyncedAt(now);
        setFormatting(false);
    };

    const handleJawabClick = (item) => {
        if (item.jawab) return;
        setConfirmJawabItem(item);
    };

    const confirmJawab = async () => {
        if (!confirmJawabItem || !adminRole) return;

        setJawabLoading(true);
        const res = await updateKontakJawab(confirmJawabItem.id, true);

        if (!res.success) {
            window.alert('Gagal memperbarui status jawab. Silakan coba lagi.');
            setJawabLoading(false);
            return;
        }

        const updated = data.map(d =>
            d.id === confirmJawabItem.id ? { ...d, jawab: true } : d
        );
        setData(updated);
        localStorage.setItem(`${CACHE_KEY}_${adminRole}`, JSON.stringify(updated));

        if (detailItem?.id === confirmJawabItem.id) {
            setDetailItem({ ...detailItem, jawab: true });
        }

        setJawabLoading(false);
        setConfirmJawabItem(null);
    };

    const formatMonthData = async () => {
        if (adminRole !== 'super_admin') return;
        const { year, month } = calendarMonth;
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

        const targets = data.filter(item => {
            const d = new Date(item.created_at);
            if (d < monthStart || d > monthEnd) return false;
            if (adminRole === 'super_admin' && item.site !== activeTab) return false;
            return true;
        });

        if (targets.length === 0) {
            window.alert(`Tidak ada data kontak untuk ${MONTH_NAMES[month]} ${year}.`);
            return;
        }
        await deleteItems(targets.map(t => t.id));
    };

    const applyDateRange = () => {
        const diff = getDaysBetween(draftStartDate, draftEndDate);
        if (!draftStartDate || !draftEndDate || diff < 0 || diff > 30) return;
        setAppliedDateRange({ start: draftStartDate, end: draftEndDate });
        const start = startOfDay(new Date(draftStartDate));
        setCalendarMonth({ year: start.getFullYear(), month: start.getMonth() });
    };

    const clearDateRange = () => {
        setDraftStartDate('');
        setDraftEndDate('');
        setAppliedDateRange(null);
    };

    const isSuperAdmin = adminRole === 'super_admin';
    const colSpan = isSuperAdmin ? 9 : 8;
    const pageIds = paginatedData.map(item => item.id);
    const allPageSelected = pageIds.length > 0 && pageIds.every(id => selectedIds.includes(id));

    const siteFilterValue = isSuperAdmin ? activeTab : (adminRole === 'admin_pkkmb' ? 'pkkmb' : 'pose');

    return (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
            <DashboardHeaderFilters
                title="Kontak"
                subtitle="Kelola pesan masuk dari pengunjung"
                icon={Mail}
                adminRole={adminRole}
                siteFilter={siteFilterValue}
                onSiteFilterChange={(v) => setActiveTab(v)}
                siteOptions={[
                    { value: 'all', label: 'Semua Situs' },
                    { value: 'pkkmb', label: 'PKKMB' },
                    { value: 'pose', label: 'POSE' },
                ]}
                onRefresh={() => fetchData(true)}
                loading={loading}
                lastSyncedAt={lastSyncedAt}
            />

            <DashboardOverviewCards
                cards={[
                    ...(isSuperAdmin ? [
                        { key: 'pkkmb', label: 'Total PKKMB', value: pkkmbCount, subtext: 'Semua pesan PKKMB', icon: Inbox },
                        { key: 'pose', label: 'Total POSE', value: poseCount, subtext: 'Semua pesan POSE', icon: Mail, iconClass: 'text-purple-500', iconBg: 'bg-purple-50 dark:bg-purple-900/20' },
                    ] : [
                        { key: 'total', label: 'Total Pesan', value: siteFiltered.length, subtext: `Data ${activeTab.toUpperCase()}`, icon: Inbox },
                    ]),
                    { key: 'filtered', label: 'Pesan Filter Aktif', value: filteredData.length, subtext: appliedDateRange ? 'Rentang tanggal diterapkan' : 'Semua periode' },
                ]}
                dateRangeProps={{
                    startDate: draftStartDate,
                    endDate: draftEndDate,
                    onStartChange: setDraftStartDate,
                    onEndChange: setDraftEndDate,
                    onApply: applyDateRange,
                    onClear: clearDateRange,
                    appliedRange: appliedDateRange,
                }}
            />

            <DashboardCalendarLegend
                calendarMonth={calendarMonth}
                onNavigateMonth={(dir) => setCalendarMonth(prev => {
                    let month = prev.month + (dir === 'next' ? 1 : -1);
                    let year = prev.year;
                    if (month > 11) { month = 0; year++; }
                    if (month < 0) { month = 11; year--; }
                    return { year, month };
                })}
                dailyCounts={dailyCounts}
                appliedDateRange={appliedDateRange}
                onDayClick={(day, dateKey) => {
                    setDraftStartDate(dateKey);
                    setDraftEndDate(dateKey);
                    setAppliedDateRange({ start: dateKey, end: dateKey });
                }}
                onFormatMonth={formatMonthData}
                formatting={formatting}
                loading={loading}
                showFormatButton={isSuperAdmin}
                countLabel="pesan"
                legendDescription="Skala biru sequential — semakin gelap, semakin banyak pesan masuk harian."
                donutChart={
                    <DashboardDonutChart
                        title="Status Balasan Pesan"
                        labels={['Sudah Dijawab', 'Belum Dijawab']}
                        values={[sudahDijawabCount, belumDijawabCount]}
                        colors={['#10b981', '#f59e0b']}
                    />
                }
            />

            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <h3 className="font-bold text-base sm:text-lg text-gray-800 dark:text-gray-200">Daftar Pesan Kontak</h3>
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-none sm:w-56">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Cari nama, email, pesan..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500/30"
                            />
                        </div>
                        {isSuperAdmin && (
                            <button
                                type="button"
                                onClick={() => deleteItems(selectedIds)}
                                disabled={formatting || selectedIds.length === 0}
                                className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Trash2 size={14} />
                                Hapus {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
                            </button>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                            <tr>
                                {isSuperAdmin && (
                                    <th className="px-4 py-3 w-10">
                                        <button type="button" onClick={toggleSelectAll} className="text-gray-400 hover:text-blue-500">
                                            {allPageSelected ? <CheckSquare size={18} className="text-blue-500" /> : <Square size={18} />}
                                        </button>
                                    </th>
                                )}
                                <th className="px-4 py-3 font-medium w-12 text-center">No</th>
                                <th className="px-4 py-3 font-medium">Nama</th>
                                <th className="px-4 py-3 font-medium">Email/WA</th>
                                <th className="px-4 py-3 font-medium min-w-[160px]">Pesan</th>
                                <th className="px-4 py-3 font-medium w-44">Tanggal</th>
                                <th className="px-4 py-3 font-medium text-center">Site</th>
                                <th className="px-4 py-3 font-medium w-24 text-center">Lihat</th>
                                <th className="px-4 py-3 font-medium w-28 text-center">Jawab</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {loading && data.length === 0 ? (
                                <tr>
                                    <td colSpan={colSpan} className="px-6 py-12 text-center text-gray-500">Memuat data kontak...</td>
                                </tr>
                            ) : paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={colSpan} className="px-6 py-16 text-center text-gray-500">Tidak ada pesan ditemukan.</td>
                                </tr>
                            ) : paginatedData.map((item, index) => (
                                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    {isSuperAdmin && (
                                        <td className="px-4 py-3">
                                            <button type="button" onClick={() => toggleSelect(item.id)} className="text-gray-400 hover:text-blue-500">
                                                {selectedIds.includes(item.id) ? <CheckSquare size={18} className="text-blue-500" /> : <Square size={18} />}
                                            </button>
                                        </td>
                                    )}
                                    <td className="px-4 py-3 text-center text-gray-500 font-medium">{startIndex + index + 1}</td>
                                    <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-200">{item.nama}</td>
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">
                                        {item.email || item.whatsapp || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 truncate max-w-[200px]" title={item.pesan}>{item.pesan}</td>
                                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{formatDateTime(item.created_at)}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold uppercase ${item.site === 'pkkmb' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' : 'bg-purple-50 text-purple-600 dark:bg-purple-900/20'}`}>
                                            {item.site}
                                        </span>
                                    </td>
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
                                        {item.jawab ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-green-200 dark:border-green-800/50 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                                                <CheckCircle2 size={14} />
                                                Sudah
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => handleJawabClick(item)}
                                                title="Tandai sudah dijawab"
                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                                            >
                                                <CircleDashed size={14} />
                                                Belum
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <TablePagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredData.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={setCurrentPage}
                    colSpan={colSpan}
                />
            </div>

            <DetailModal
                open={Boolean(detailItem)}
                onClose={() => setDetailItem(null)}
                title="Detail Kontak"
                fields={detailItem ? [
                    { label: 'ID', value: detailItem.id },
                    { label: 'Nama', value: detailItem.nama },
                    { label: 'Email', value: detailItem.email || detailItem.whatsapp || '-' },
                    { label: 'Pesan', value: detailItem.pesan, multiline: true },
                    { label: 'Status Jawab', value: detailItem.jawab ? 'Sudah dijawab' : 'Belum dijawab' },
                    { label: 'Tanggal', value: formatDateTime(detailItem.created_at) },
                ] : []}
            />

            <ConfirmModal
                open={Boolean(confirmJawabItem)}
                onClose={() => !jawabLoading && setConfirmJawabItem(null)}
                onConfirm={confirmJawab}
                title="Konfirmasi Jawab"
                message={
                    confirmJawabItem
                        ? `Apakah pesan dari "${confirmJawabItem.nama}" benar sudah dijawab? Status akan disimpan ke database.`
                        : ''
                }
                confirmLabel="Ya, Sudah Dijawab"
                loading={jawabLoading}
            />
        </div>
    );
}
