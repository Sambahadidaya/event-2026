'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { MessageSquare, HelpCircle, Eye, Eraser, CheckSquare, Square, Trash2, KeyRound } from 'lucide-react';
import { getRiwayatPertanyaan, deleteMultipleRiwayat } from '@/api/supabase/admin/admin';
import { useRouter } from 'next/navigation';
import DashboardHeaderFilters from '@/components/panitia/DashboardHeaderFilters';
import DashboardOverviewCards from '@/components/panitia/DashboardOverviewCards';
import DashboardCalendarLegend from '@/components/panitia/DashboardCalendarLegend';
import DashboardDonutChart from '@/components/panitia/DashboardDonutChart';
import DetailModal from '@/components/panitia/DetailModal';
import TablePagination from '@/components/panitia/TablePagination';
import {
    MONTH_NAMES, startOfDay, toDateKey, getDaysBetween,
    buildDailyCounts, filterByDateRange, formatDateTime
} from '@/lib/dashboardUtils';

const ITEMS_PER_PAGE = 10;

export default function FaqDashboard() {
    const [history, setHistory] = useState([]);
    const [mounted, setMounted] = useState(false);
    const [adminRole, setAdminRole] = useState(null);
    const [siteFilter, setSiteFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [formatting, setFormatting] = useState(false);
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
    const router = useRouter();

    const fetchData = useCallback(async (forceRefresh = false) => {
        setLoading(true);
        // Temporary role assumption since client-side auth is disabled
        // In a real scenario, this would come from a server-side session
        const currentRole = 'super_admin'; 
        setAdminRole(currentRole);

        const cacheKey = `admin_faq_data_${currentRole}`;
        const timeKey = `admin_faq_time_${currentRole}`;

        if (!forceRefresh) {
            const cached = localStorage.getItem(cacheKey);
            const cachedAt = localStorage.getItem(timeKey);
            if (cached && cachedAt) {
                setHistory(JSON.parse(cached));
                setLastSyncedAt(Number(cachedAt));
                setLoading(false);
                return;
            }
        }

        const data = await getRiwayatPertanyaan();
        
        if (data) {
            let filteredData = data;
            if (currentRole === 'admin_pkkmb') filteredData = data.filter(d => d.site === 'pkkmb');
            else if (currentRole === 'admin_pose') filteredData = data.filter(d => d.site === 'pose');

            setHistory(filteredData);
            const now = Date.now();
            localStorage.setItem(cacheKey, JSON.stringify(filteredData));
            localStorage.setItem(timeKey, now.toString());
            setLastSyncedAt(now);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        setMounted(true);
        fetchData();
    }, [fetchData]);

    const siteFiltered = useMemo(() => {
        if (adminRole === 'super_admin' && siteFilter !== 'all') {
            return history.filter(h => h.site === siteFilter);
        }
        return history;
    }, [history, adminRole, siteFilter]);

    const filteredHistory = useMemo(() => {
        return filterByDateRange(siteFiltered, appliedDateRange, 'created_at');
    }, [siteFiltered, appliedDateRange]);

    const dailyCounts = useMemo(() => buildDailyCounts(siteFiltered, 'created_at'), [siteFiltered]);

    const terjawabCount = filteredHistory.filter(h => h.is_faq_matched === true).length;
    const diluarFaqCount = filteredHistory.length - terjawabCount;

    const totalToken = useMemo(() => {
        return filteredHistory.reduce((acc, item) => acc + (Number(item.token) || 0), 0);
    }, [filteredHistory]);

    const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE) || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedData = filteredHistory.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    useEffect(() => {
        setCurrentPage(1);
        setSelectedIds([]);
    }, [siteFilter, appliedDateRange]);

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
        if (!window.confirm(`Hapus ${ids.length} data FAQ? Tindakan ini tidak dapat dibatalkan.`)) return;

        setFormatting(true);
        const res = await deleteMultipleRiwayat(ids);
        if (!res.success) {
            window.alert('Gagal menghapus data.');
            setFormatting(false);
            return;
        }

        const remaining = history.filter(item => !ids.includes(item.id));
        setHistory(remaining);
        setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
        const now = Date.now();
        localStorage.setItem(`admin_faq_data_${adminRole}`, JSON.stringify(remaining));
        localStorage.setItem(`admin_faq_time_${adminRole}`, now.toString());
        setLastSyncedAt(now);
        setFormatting(false);
    };

    const formatMonthData = async () => {
        if (adminRole !== 'super_admin') return;

        let targets = [];
        if (appliedDateRange && appliedDateRange.start && appliedDateRange.end) {
            targets = history.filter(item => {
                const itemKey = toDateKey(item.created_at);
                if (itemKey < appliedDateRange.start || itemKey > appliedDateRange.end) return false;
                if (siteFilter !== 'all' && item.site !== siteFilter) return false;
                return true;
            });

            if (targets.length === 0) {
                window.alert(`Tidak ada data FAQ untuk rentang tanggal ${appliedDateRange.start} s/d ${appliedDateRange.end}.`);
                return;
            }

            if (!window.confirm(`Format ${targets.length} data FAQ pada rentang ${appliedDateRange.start} s/d ${appliedDateRange.end}?`)) return;
        } else {
            const { year, month } = calendarMonth;
            const monthStart = new Date(year, month, 1);
            const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

            targets = history.filter(item => {
                const d = new Date(item.created_at);
                if (d < monthStart || d > monthEnd) return false;
                if (siteFilter !== 'all' && item.site !== siteFilter) return false;
                return true;
            });

            if (targets.length === 0) {
                window.alert(`Tidak ada data FAQ untuk ${MONTH_NAMES[month]} ${year}.`);
                return;
            }

            if (!window.confirm(`Format ${targets.length} data FAQ bulan ${MONTH_NAMES[month]} ${year}?`)) return;
        }

        await deleteItems(targets.map(t => t.id));
    };

    const handleCalendarDayClick = (day, dateKey, e) => {
        if (!dateKey) return;
        if (e?.shiftKey && draftStartDate) {
            const start = dateKey < draftStartDate ? dateKey : draftStartDate;
            const end = dateKey < draftStartDate ? draftStartDate : dateKey;
            setDraftStartDate(start);
            setDraftEndDate(end);
            setAppliedDateRange({ start, end });
        } else {
            setDraftStartDate(dateKey);
            setDraftEndDate(dateKey);
            setAppliedDateRange({ start: dateKey, end: dateKey });
        }
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
    const colSpan = isSuperAdmin ? 8 : 7;
    const pageIds = paginatedData.map(item => item.id);
    const allPageSelected = pageIds.length > 0 && pageIds.every(id => selectedIds.includes(id));

    if (!mounted) return null;

    return (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
            <DashboardHeaderFilters
                title="FAQ Chatbot"
                subtitle="Pantau interaksi dan riwayat pertanyaan pengguna"
                icon={MessageSquare}
                adminRole={adminRole}
                siteFilter={siteFilter}
                onSiteFilterChange={setSiteFilter}
                onRefresh={() => fetchData(true)}
                loading={loading}
                lastSyncedAt={lastSyncedAt}
            />

            <DashboardOverviewCards
                cards={[
                    { key: 'total', label: 'Total Interaksi', value: filteredHistory.length, subtext: 'Berdasarkan filter aktif', icon: MessageSquare },
                    { key: 'faq', label: 'Sesuai FAQ', value: terjawabCount, subtext: `${filteredHistory.length > 0 ? Math.round((terjawabCount / filteredHistory.length) * 100) : 0}% dari total`, icon: HelpCircle, iconClass: 'text-emerald-500', iconBg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                    { key: 'non_faq', label: 'Di Luar FAQ', value: diluarFaqCount, subtext: 'Pertanyaan umum / random', subtextClass: 'text-amber-500' },
                    { key: 'total_token', label: 'Total Token', value: totalToken.toLocaleString('id-ID'), subtext: 'Penggunaan token AI (ms)', icon: KeyRound, iconClass: 'text-purple-500', iconBg: 'bg-purple-50 dark:bg-purple-900/20' },
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
                onDayClick={handleCalendarDayClick}
                onFormatMonth={formatMonthData}
                formatting={formatting}
                loading={loading}
                showFormatButton={isSuperAdmin}
                countLabel="interaksi"
                legendDescription="Skala biru sequential — semakin gelap, semakin banyak interaksi FAQ harian."
                donutChart={
                    <DashboardDonutChart
                        title="Kategori Pertanyaan"
                        labels={['Sesuai FAQ', 'Di Luar FAQ']}
                        values={[terjawabCount, diluarFaqCount]}
                        colors={['#3b82f6', '#f59e0b']}
                    />
                }
            />

            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-gray-50/50 dark:bg-gray-800/50">
                    <h3 className="font-bold text-base sm:text-lg text-gray-800 dark:text-gray-200">Riwayat Pertanyaan</h3>
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
                                <th className="px-4 py-3 font-medium w-44">Waktu</th>
                                <th className="px-4 py-3 font-medium">Site</th>
                                <th className="px-4 py-3 font-medium min-w-[140px]">Pertanyaan</th>
                                <th className="px-4 py-3 font-medium min-w-[140px]">Respons</th>
                                <th className="px-4 py-3 font-medium w-28 text-center">Token</th>
                                <th className="px-4 py-3 font-medium w-20 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {loading && history.length === 0 ? (
                                <tr>
                                    <td colSpan={colSpan} className="px-6 py-12 text-center text-gray-500">Memuat data...</td>
                                </tr>
                            ) : paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={colSpan} className="px-6 py-12 text-center text-gray-500">
                                        <MessageSquare size={32} className="mx-auto mb-3 text-gray-400 opacity-50" />
                                        Belum ada riwayat percakapan.
                                    </td>
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
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs whitespace-nowrap">{formatDateTime(item.created_at)}</td>
                                    <td className="px-4 py-3 text-xs font-bold uppercase text-gray-500">{item.site}</td>
                                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200 truncate max-w-[180px]" title={item.pertanyaan}>{item.pertanyaan}</td>
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 truncate max-w-[180px]" title={item.jawaban}>
                                        <div className="flex items-center gap-1.5">
                                            <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${item.is_faq_matched ? 'bg-blue-500' : 'bg-amber-400'}`}></span>
                                            <span className="truncate">{item.jawaban}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center text-xs font-semibold text-purple-600 dark:text-purple-400 whitespace-nowrap">
                                        {item.token ? `${item.token.toLocaleString('id-ID')} ms` : '0 ms'}
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
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <TablePagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredHistory.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={setCurrentPage}
                    colSpan={colSpan}
                />
            </div>

            <DetailModal
                open={Boolean(detailItem)}
                onClose={() => setDetailItem(null)}
                title="Detail FAQ"
                fields={detailItem ? [
                    { label: 'ID', value: `#${detailItem.id}` },
                    { label: 'Pertanyaan', value: detailItem.pertanyaan, multiline: true },
                    { label: 'Jawaban', value: detailItem.jawaban, multiline: true },
                    { label: 'Site', value: detailItem.site?.toUpperCase() },
                    { label: 'Jumlah Token', value: detailItem.token ? `${detailItem.token.toLocaleString('id-ID')} ms` : '0 ms' },
                    { label: 'Tanggal', value: formatDateTime(detailItem.created_at) },
                ] : []}
            />
        </div>
    );
}
