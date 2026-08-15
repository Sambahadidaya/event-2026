'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Users, Search, Eye, CheckCircle2, XCircle, Clock, Filter, Copy, Link as LinkIcon, Printer, FileSpreadsheet, ChevronDown, Check, X } from 'lucide-react';
import { getTeams } from '@/api/supabase/public/team';
import { upsertTeam, deleteTeamPermanent } from '@/api/supabase/admin/team';
import { getPeserta } from '@/api/supabase/admin/peserta';
import { getCurrentAdmin } from '@/api/supabase/admin/auth';
import { getFormRegisterAll } from '@/api/supabase/admin/peserta';
import { getFormPengumpulan, getPengumpulanLomba } from '@/api/supabase/admin/submission';
import { generatePdfAction } from '@/api/pdf/route';
import { exportToExcel } from '@/lib/excel/xlsx';
import DashboardHeaderFilters from '@/components/panitia/DashboardHeaderFilters';
import DashboardSelect from '@/components/panitia/DashboardSelect';
import DetailModal from '@/components/panitia/DetailModal';
import TablePagination from '@/components/panitia/TablePagination';
import DashboardOverviewCards from '@/components/panitia/DashboardOverviewCards';
import AdminPesertaPengumpulan from '@/components/panitia/AdminPesertaPengumpulan';
import { formatDateTime } from '@/lib/dashboardUtils';
import { JENIS_LOMBA, NAMA_LOMBA } from '@/lib/lombaData';
import { getLombaFilter } from '@/lib/adminRoleData';
// import {getFormRegisterPricingAdmin} from '@/api/supabase/admin/finance';
const ITEMS_PER_PAGE = 10;
const CACHE_KEY = 'pj_lomba_register_cache';

export default function AdminPesertaRegister() {
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

    const [activeTab, setActiveTab] = useState('pendaftar');
    const [activeDetailTeam, setActiveDetailTeam] = useState(null);
    const [pengumpulanList, setPengumpulanList] = useState([]);
    const [registerForms, setRegisterForms] = useState([]);
    const [submissionForms, setSubmissionForms] = useState([]);
    const [filterVerifikasi, setFilterVerifikasi] = useState('all');
    const [filterPengumpulan, setFilterPengumpulan] = useState('all');
    const [showExportDropdown, setShowExportDropdown] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);

    const [activeFormPricing, setActiveFormPricing] = useState([]);
    const [selectedFormIndex, setSelectedFormIndex] = useState(0);

    // Tahap 4 States
    const [kampusQuotaData, setKampusQuotaData] = useState([]);
    const [allLombaStatusData, setAllLombaStatusData] = useState([]);

    const currentLombaName = useMemo(() => {
        return lockedLomba || (namaLomba !== 'all' ? namaLomba : null);
    }, [lockedLomba, namaLomba]);

    // 1. Dapatkan seluruh form yang nama lombanya cocok
    const matchingRegisterForms = useMemo(() => {
        if (!currentLombaName) return [];
        return registerForms.filter(
            f => f.nama_lomba?.toLowerCase().trim() === currentLombaName.toLowerCase().trim()
        );
    }, [registerForms, currentLombaName]);

    // 2. Ambil form berdasarkan index yang dipilih user
    const activeForm = useMemo(() => {
        if (matchingRegisterForms.length === 0) return null;
        return matchingRegisterForms[selectedFormIndex] || matchingRegisterForms[0];
    }, [matchingRegisterForms, selectedFormIndex]);

    // 3. Reset index ke 0 setiap kali nama lomba berubah
    useEffect(() => {
        setSelectedFormIndex(0);
    }, [currentLombaName]);

    useEffect(() => {
        if (activeForm?.id) {
            import('@/api/supabase/admin/finance').then(({ getFormRegisterPricingAdmin, getKuotaKampusByForm }) => {
                getFormRegisterPricingAdmin(activeForm.id).then(pricing => {
                    setActiveFormPricing(pricing || []);
                });
                getKuotaKampusByForm(activeForm.id).then(kuota => {
                    setKampusQuotaData(kuota || []);
                });
            });
        } else {
            setActiveFormPricing([]);
            setKampusQuotaData([]);
        }
    }, [activeForm?.id]);

    useEffect(() => {
        if (registerForms && registerForms.length > 0) {
            import('@/api/supabase/admin/finance').then(async ({ getFormRegisterPricingAdmin }) => {
                const statusList = [];
                for (const form of registerForms) {
                    const pricing = await getFormRegisterPricingAdmin(form.id);
                    const formTeams = data.filter(t => t.nama_lomba?.toLowerCase().trim() === form.nama_lomba?.toLowerCase().trim() && t.verivikasi !== false);
                    let isFull = true;
                    if (pricing && pricing.length > 0) {
                        let totalMaks = 0;
                        let totalRegistered = 0;
                        for (const p of pricing) {
                            totalMaks += (p.maks_team || 0);
                            const registered = formTeams.filter(t => t.peserta?.[0]?.kategori === p.kategori).length;
                            totalRegistered += registered;
                        }
                        isFull = totalRegistered >= totalMaks;
                    } else {
                        isFull = false;
                    }
                    statusList.push({ form, isFull });
                }
                setAllLombaStatusData(statusList);
                localStorage.setItem(CACHE_KEY + '_allLombaStatus', JSON.stringify(statusList));
            });
        }
    }, [registerForms, data]);

    const wajibLombaStatus = useMemo(() => {
        return allLombaStatusData.filter(item => item.form.butuh_bukti === false || !item.form.butuh_bukti);
    }, [allLombaStatusData]);

    const lanjutanLombaStatus = useMemo(() => {
        return allLombaStatusData.filter(item => item.form.butuh_bukti === true);
    }, [allLombaStatusData]);

    const countsPerCategory = useMemo(() => {
        const counts = {
            'Alumni LP3I': 0,
            'Mahasiswa LP3I': 0,
            'Siswa': 0,
            'Dosen': 0,
            'Umum': 0
        };
        if (!currentLombaName) return counts;

        const targetTeams = data.filter(t =>
            t.nama_lomba?.toLowerCase().trim() === currentLombaName.toLowerCase().trim() &&
            t.verivikasi !== false &&
            (!activeForm?.kode_form || t.kode_form === activeForm.kode_form)
        );
        targetTeams.forEach(team => {
            const kat = team.peserta?.[0]?.kategori;
            if (kat && counts[kat] !== undefined) {
                counts[kat]++;
            }
        });
        return counts;
    }, [data, currentLombaName, activeForm?.kode_form]);


    const handleSelectStatus = async (subItem, newStatusBoolean) => {
        const { updateStatusPengumpulan } = await import('@/api/supabase/admin/submission');
        const res = await updateStatusPengumpulan(subItem.id, newStatusBoolean);
        if (res.success) {
            const updatedSubmissions = pengumpulanList.map(s =>
                s.id === subItem.id ? { ...s, status_pengumpulan: newStatusBoolean } : s
            );
            setPengumpulanList(updatedSubmissions);
            localStorage.setItem(CACHE_KEY + '_sub', JSON.stringify(updatedSubmissions));
        } else {
            window.alert('Gagal mengubah status pengumpulan.');
        }
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (showExportDropdown && !e.target.closest('#export-dropdown-wrapper')) {
                setShowExportDropdown(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showExportDropdown]);

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
            const cachedSub = localStorage.getItem(cacheKey + '_sub');
            const cachedRegForms = localStorage.getItem(cacheKey + '_regf');
            const cachedSubForms = localStorage.getItem(cacheKey + '_subf');
            const cachedAllLombaStatus = localStorage.getItem(cacheKey + '_allLombaStatus');
            if (cachedData) {
                try {
                    setData(JSON.parse(cachedData));
                    if (cachedSub) setPengumpulanList(JSON.parse(cachedSub));
                    if (cachedRegForms) setRegisterForms(JSON.parse(cachedRegForms));
                    if (cachedSubForms) setSubmissionForms(JSON.parse(cachedSubForms));
                    if (cachedAllLombaStatus) setAllLombaStatusData(JSON.parse(cachedAllLombaStatus));
                    if (cachedAt) setLastSyncedAt(Number(cachedAt));
                    setLoading(false);
                    return;
                } catch (e) {
                    console.error('Failed to parse cache', e);
                }
            }
        }

        // Fetch team + team_members, submissions and form lists
        const [teamData, pesertaData, submissions, regForms, subForms] = await Promise.all([
            getTeams('pose'),
            getPeserta('pose'),
            getPengumpulanLomba(),
            getFormRegisterAll('pose'),
            getFormPengumpulan()
        ]);

        // Filter peserta to only 'register' type
        const registerPeserta = (pesertaData || []).filter(p => p.jenis_form === 'register');

        // Map peserta into teams by matching names
        const enrichedTeams = (teamData || []).map(team => {
            // Find peserta that belong to this team's members (match by kode == nim)
            const memberCodes = (team.team_members || []).map(m => m.kode?.toLowerCase().trim()).filter(Boolean);

            const matchedPeserta = [];
            const seenNims = new Set();
            for (const p of registerPeserta) {
                const pNim = p.nim?.toLowerCase().trim();
                if (pNim && memberCodes.includes(pNim) && !seenNims.has(pNim)) {
                    matchedPeserta.push(p);
                    seenNims.add(pNim);
                }
            }

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

            if (submissions) {
                setPengumpulanList(submissions);
                localStorage.setItem(cacheKey + '_sub', JSON.stringify(submissions));
            }
            if (regForms) {
                setRegisterForms(regForms);
                localStorage.setItem(cacheKey + '_regf', JSON.stringify(regForms));
            }
            if (subForms) {
                setSubmissionForms(subForms);
                localStorage.setItem(cacheKey + '_subf', JSON.stringify(subForms));
            }

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

        // Apply tab specific filters
        if (activeTab === 'pendaftar') {
            if (filterVerifikasi === 'verified') {
                result = result.filter(item => item.verivikasi === true);
            } else if (filterVerifikasi === 'pending') {
                result = result.filter(item => item.verivikasi !== true && item.verivikasi !== false);
            } else if (filterVerifikasi === 'rejected') {
                result = result.filter(item => item.verivikasi === false);
            }
        } else {
            if (filterPengumpulan === 'submitted') {
                result = result.filter(item =>
                    (pengumpulanList || []).some(sub => sub.team_id === item.id)
                );
            } else if (filterPengumpulan === 'unsubmitted') {
                result = result.filter(item =>
                    !(pengumpulanList || []).some(sub => sub.team_id === item.id)
                );
            }
        }

        return result;
    }, [data, jenisLomba, namaLomba, kategoriFilter, searchQuery, activeTab, filterVerifikasi, filterPengumpulan, pengumpulanList]);

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE) || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedData = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    useEffect(() => {
        setCurrentPage(1);
    }, [jenisLomba, namaLomba, searchQuery, activeTab, filterVerifikasi, filterPengumpulan]);

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

    const handleDeletePermanent = async () => {
        if (!verifikasiItem) return;
        if (!window.confirm('Apakah Anda yakin ingin menghapus data pendaftar ini secara PERMANEN? Data tim dan seluruh pesertanya akan dihapus!')) return;

        setVerifikasiLoading(true);
        const res = await deleteTeamPermanent(verifikasiItem.id, verifikasiItem.kode_form);
        if (!res.success) {
            window.alert('Gagal menghapus tim: ' + res.error);
        } else {
            const updated = data.filter(d => d.id !== verifikasiItem.id);
            setData(updated);
            localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
            setVerifikasiItem(null);
            window.alert('Data tim berhasil dihapus secara permanen.');
        }
        setVerifikasiLoading(false);
    };

    const renderDetailFields = (item) => {
        if (!item) return [];

        // Fallback pencarian bukti bayar dari objek team atau array peserta
        const buktiBayarUrl = item.bukti_bayar || item.peserta?.find(p => p.bukti_bayar)?.bukti_bayar;

        // Fallback pencarian kode team dari berbagai kemungkinan field
        const kodeTeam = item.kode_form || item.kode || item.peserta?.find(p => p.kode_form)?.kode_form || '-';

        return [
            { label: 'Nama Tim', value: item.title },
            { label: 'Jenis Lomba', value: item.jenis_lomba || '-' },
            { label: 'Nama Lomba', value: item.nama_lomba || '-' },
            { label: 'Tanggal Daftar', value: formatDateTime(item.created_at) },
            { label: 'Status Verifikasi', value: item.verivikasi === true ? 'Valid' : item.verivikasi === false ? 'Ditolak' : 'Pending' },
            { label: 'Kode Team', value: kodeTeam },
            {
                label: 'Bukti Pembayaran',
                value: buktiBayarUrl ? (
                    <a href={buktiBayarUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold">Lihat Gambar</span>
                    </a>
                ) : '-',
                isCustom: true
            },
            {
                label: 'Daftar Anggota (Team Members)',
                value: (() => {
                    const isML = item.nama_lomba?.toLowerCase().includes('mobile legend') || item.nama_lomba?.toLowerCase().includes('mobile legends');
                    return (
                        <div className="mt-2 space-y-3">
                            {item.team_members?.map((m, idx) => (
                                <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm border border-gray-100 dark:border-gray-700">
                                    <p className="font-semibold">{m.nama} <span className="text-gray-500 font-normal">({m.jabatan || 'Anggota'})</span></p>
                                    <p className="text-gray-600 dark:text-gray-400">NIM/Kode: {m.kode || '-'}</p>
                                    {isML && m.id_ml && <p className="text-gray-600 dark:text-gray-400">ID ML: <span className="font-semibold font-mono text-blue-600 dark:text-blue-400">{m.id_ml}</span></p>}
                                </div>
                            ))}
                        </div>
                    );
                })(),
                isCustom: true
            },
            {
                label: 'Data Peserta (Tabel Peserta)',
                value: (
                    <div className="mt-2 space-y-3">
                        {(item.peserta && item.peserta.length > 0) ? item.peserta.map((p, idx) => (
                            <div key={idx} className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-sm border border-indigo-100 dark:border-indigo-800/50">
                                <div className="grid grid-cols-[140px_10px_1fr] gap-y-1 text-sm text-gray-700 dark:text-gray-300">
                                    <div className="font-semibold">Nama</div><div>:</div><div>{p.nama || '-'}</div>
                                    <div className="font-semibold">Kategori</div><div>:</div><div>{p.kategori || '-'}</div>
                                    <div className="font-semibold">NIM/Kode</div><div>:</div><div>{p.nim || '-'}</div>
                                    <div className="font-semibold">Prodi</div><div>:</div><div>{p.prodi || '-'}</div>
                                    <div className="font-semibold">Angkatan</div><div>:</div><div>{p.angkatan || '-'}</div>
                                    <div className="font-semibold">Semester</div><div>:</div><div>{p.semester || '-'}</div>
                                    <div className="font-semibold">Kampus</div><div>:</div><div>{p.kampus || '-'}</div>
                                    <div className="font-semibold">Kontak</div><div>:</div><div>{p.email_wa || '-'}</div>
                                    <div className="font-semibold">Metode Bayar</div><div>:</div><div>{p.metode_pembayaran || '-'}</div>
                                    <div className="font-semibold">Status Pembayaran</div><div>:</div><div>
                                        <span className={p.status_pembayaran?.toLowerCase() === 'pending' ? 'text-amber-600 font-semibold' : p.status_pembayaran?.toLowerCase() === 'ditolak' ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                                            {p.status_pembayaran || '-'}
                                        </span>
                                    </div>
                                </div>
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

    const overviewCards = useMemo(() => {
        const totalTeam = currentLombaName
            ? data.filter(t => t.nama_lomba?.toLowerCase().trim() === currentLombaName.toLowerCase().trim()).length
            : filteredData.length;
        const totalPeserta = filteredData.reduce((sum, item) => sum + (item.peserta?.length || 0), 0);

        let sisaKuotaSemua = null;
        if (activeFormPricing.length > 0) {
            let totalMaks = 0;
            let totalRegistered = 0;
            activeFormPricing.forEach(p => {
                totalMaks += (p.maks_team || 0);
                const registered = data.filter(t =>
                    t.nama_lomba?.toLowerCase().trim() === currentLombaName?.toLowerCase().trim() &&
                    t.verivikasi !== false &&
                    t.peserta?.[0]?.kategori === p.kategori &&
                    (!activeForm?.kode_form || t.kode_form === activeForm.kode_form)
                ).length;
                totalRegistered += registered;
            });
            sisaKuotaSemua = Math.max(0, totalMaks - totalRegistered);
        }
        const subtextSisa = sisaKuotaSemua !== null ? `Sisa Kuota: ${sisaKuotaSemua}` : undefined;

        if (activeTab === 'pendaftar') {
            const totalVerif = filteredData.filter(item => item.verivikasi === true).length;
            return [
                { label: 'Total Team', value: totalTeam, icon: Users, iconBg: 'bg-blue-50 dark:bg-blue-900/20', iconClass: 'text-blue-500', subtext: subtextSisa, subtextClass: 'text-purple-600 font-semibold text-xs' },
                { label: 'Total Peserta', value: totalPeserta, icon: Users, iconBg: 'bg-indigo-50 dark:bg-indigo-900/20', iconClass: 'text-indigo-500' },
                { label: 'Total Sudah Verifikasi', value: totalVerif, icon: CheckCircle2, iconBg: 'bg-green-50 dark:bg-green-900/20', iconClass: 'text-green-500', subtext: `${totalTeam - totalVerif} Pending/Ditolak`, subtextClass: 'text-amber-500' }
            ];
        } else {
            const totalSubmitted = filteredData.filter(item =>
                (pengumpulanList || []).some(sub => sub.team_id === item.id)
            ).length;
            return [
                { label: 'Total Team', value: totalTeam, icon: Users, iconBg: 'bg-blue-50 dark:bg-blue-900/20', iconClass: 'text-blue-500', subtext: subtextSisa, subtextClass: 'text-purple-600 font-semibold text-xs' },
                { label: 'Total Peserta', value: totalPeserta, icon: Users, iconBg: 'bg-indigo-50 dark:bg-indigo-900/20', iconClass: 'text-indigo-500' },
                { label: 'Total Sudah Pengumpulan', value: totalSubmitted, icon: CheckCircle2, iconBg: 'bg-green-50 dark:bg-green-900/20', iconClass: 'text-green-500', subtext: `${totalTeam - totalSubmitted} Belum Mengumpulkan`, subtextClass: 'text-amber-500' }
            ];
        }
    }, [filteredData, activeTab, pengumpulanList, activeFormPricing, data, currentLombaName, activeForm?.kode_form]);

    const activeFormLink = useMemo(() => {
        // 1. Ambil nama lomba aktif (lengkap dengan fallback lama kamu)
        let effectiveLombaName = lockedLomba || (namaLomba !== 'all' ? namaLomba : null);

        if (!effectiveLombaName && data && data.length > 0) {
            const uniqueLombas = [...new Set(data.map(d => d.nama_lomba).filter(Boolean))];
            if (uniqueLombas.length === 1) {
                effectiveLombaName = uniqueLombas[0];
            }
        }

        if (!effectiveLombaName || !activeForm) return '';

        // 2. Buat Link berdasarkan Form yang sedang terpilih (activeForm)
        if (activeTab === 'pendaftar') {
            return activeForm.link_id ? `${window.location.origin}/pose/register/${activeForm.link_id}` : '';
        } else {
            // Cari form pengumpulan yang sesuai dengan ID form register terpilih
            const found = (submissionForms || []).find(
                f => f.form_register_id === activeForm.id || f.form_register?.nama_lomba?.toLowerCase().trim() === effectiveLombaName.toLowerCase().trim()
            );
            return found ? `${window.location.origin}/pose/submission/${found.link_id}` : '';
        }
    }, [activeTab, activeForm, submissionForms, lockedLomba, namaLomba, data]);

    const handlePrintPDF = async () => {
        if (filteredData.length === 0) {
            window.alert('Tidak ada data untuk dicetak.');
            return;
        }
        setPdfLoading(true);
        try {
            const currentLombaName = lockedLomba || (namaLomba !== 'all' ? namaLomba : 'Semua Lomba');

            const printData = filteredData.map(item => {
                const hasSubmitted = (pengumpulanList || []).some(sub => sub.team_id === item.id);
                return {
                    ...item,
                    kode_form: item.kode_form || item.kode || item.peserta?.[0]?.kode_form,
                    hasSubmitted,
                    jenis_kategori: item.jenis_kategori || '-'
                };
            });

            const res = await generatePdfAction({
                type: 'team_report',
                title: activeTab === 'pendaftar' ? 'Laporan Registrasi Tim Lomba' : 'Laporan Pengumpulan Tim Lomba',
                site: 'pose',
                lombaName: currentLombaName,
                activeTab,
                data: printData,
                pengumpulanData: pengumpulanList
            });

            if (!res || !res.success) {
                throw new Error(res?.error || 'Gagal membuat PDF');
            }

            const byteCharacters = atob(res.base64Pdf);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/pdf' });

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const tabLabel = activeTab === 'pendaftar' ? 'pendaftar' : 'pengumpulan';
            a.download = `laporan_tim_${tabLabel}_${currentLombaName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Print PDF Error:', err);
            window.alert(`Gagal mencetak PDF: ${err.message}`);
        } finally {
            setPdfLoading(false);
        }
    };

    const handleExportExcel = () => {
        if (filteredData.length === 0) {
            window.alert('Tidak ada data untuk diexport.');
            return;
        }

        const currentLombaName = lockedLomba || (namaLomba !== 'all' ? namaLomba : 'Semua Lomba');
        const sheets = [];

        if (activeTab === 'pendaftar') {
            // Sheet 1: Daftar Team
            const teamColumns = [
                { key: 'title', label: 'Nama Team' },
                { key: 'jenis_kategori', label: 'Kategori (Putra/Putri)' },
                { key: 'jml_anggota', label: 'Jumlah Anggota' },
                { key: 'status_verifikasi', label: 'Status Verifikasi' },
                { key: 'kode_form', label: 'Kode Team' },
                { key: 'tanggal', label: 'Tanggal Daftar' }
            ];

            const teamSheetData = filteredData.map(item => ({
                title: item.title,
                jenis_kategori: item.jenis_kategori || '-',
                jml_anggota: `${item.team_members?.length || 0} Orang`,
                status_verifikasi: item.verivikasi === true ? 'Valid' : item.verivikasi === false ? 'Ditolak' : 'Pending',
                kode_form: item.kode_form || item.kode || item.peserta?.[0]?.kode_form || '-',
                tanggal: item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : '-'
            }));

            sheets.push({
                sheetName: 'Daftar Team',
                data: teamSheetData,
                columns: teamColumns
            });

            // Sheet 2-N: Peserta perkategori
            const categories = ['Mahasiswa LP3I', 'Siswa', 'Dosen', 'Umum'];
            categories.forEach(cat => {
                const catPesertaRows = [];
                filteredData.forEach(team => {
                    const matchedPesertas = (team.peserta || []).filter(p => {
                        const pk = (p.kategori || '').toLowerCase().trim();
                        const ck = cat.toLowerCase().trim();
                        if (ck === 'mahasiswa lp3i') {
                            return pk === 'mahasiswa lp3i';
                        }
                        return pk === ck;
                    });

                    matchedPesertas.forEach((p, pIdx) => {
                        const isFirst = pIdx === 0;
                        const row = {
                            nama_team: isFirst ? (team.title || '-') : '',
                            kode_form: isFirst ? (team.kode_form || team.kode || team.peserta?.[0]?.kode_form || '-') : '',
                            nama: p.nama || '-',
                            kategori: p.kategori || '-',
                            nim: p.nim || '-',
                            kampus: p.kampus || '-',
                            semester: p.semester ? `Sem. ${p.semester}` : '-',
                            prodi: p.prodi || '-',
                            email_wa: p.email_wa || '-',
                            bukti_bayar: p.bukti_bayar || '-',
                            status_pembayaran: p.status_pembayaran || 'Pending',
                            metode_pembayaran: p.metode_pembayaran || '-'
                        };
                        catPesertaRows.push(row);
                    });
                });

                if (catPesertaRows.length > 0) {
                    let columns = [];
                    if (cat === 'Mahasiswa LP3I') {
                        columns = [
                            { key: 'nama_team', label: 'Nama Team' },
                            { key: 'kode_form', label: 'Kode Team' },
                            { key: 'nama', label: 'Nama' },
                            { key: 'kategori', label: 'Kategori' },
                            { key: 'nim', label: 'NIM' },
                            { key: 'kampus', label: 'Kampus' },
                            { key: 'semester', label: 'Semester' },
                            { key: 'prodi', label: 'Prodi' },
                            { key: 'email_wa', label: 'Email/WA' },
                            { key: 'bukti_bayar', label: 'Link Bukti Pembayaran' },
                            { key: 'status_pembayaran', label: 'Status Pembayaran' },
                            { key: 'metode_pembayaran', label: 'Metode Pembayaran' }
                        ];
                    } else if (cat === 'Siswa') {
                        columns = [
                            { key: 'nama_team', label: 'Nama Team' },
                            { key: 'kode_form', label: 'Kode Team' },
                            { key: 'nama', label: 'Nama' },
                            { key: 'kategori', label: 'Kategori' },
                            { key: 'kampus', label: 'Sekolah' },
                            { key: 'prodi', label: 'Jurusan' },
                            { key: 'nim', label: 'Kode' },
                            { key: 'email_wa', label: 'Email/WA' },
                            { key: 'bukti_bayar', label: 'Link Bukti Pembayaran' },
                            { key: 'status_pembayaran', label: 'Status Pembayaran' },
                            { key: 'metode_pembayaran', label: 'Metode Pembayaran' }
                        ];
                    } else if (cat === 'Dosen') {
                        columns = [
                            { key: 'nama_team', label: 'Nama Team' },
                            { key: 'kode_form', label: 'Kode Team' },
                            { key: 'nama', label: 'Nama' },
                            { key: 'kampus', label: 'Kampus' },
                            { key: 'email_wa', label: 'Email/WA' },
                            { key: 'bukti_bayar', label: 'Link Bukti Pembayaran' },
                            { key: 'status_pembayaran', label: 'Status Pembayaran' },
                            { key: 'metode_pembayaran', label: 'Metode Pembayaran' }
                        ];
                    } else if (cat === 'Alumni LP3I') {
                        columns = [
                            { key: 'nama_team', label: 'Nama Team' },
                            { key: 'kode_form', label: 'Kode Team' },
                            { key: 'nama', label: 'Nama' },
                            { key: 'kampus', label: 'Kampus' },
                            { key: 'prodi', label: 'Jurusan' },
                            { key: 'nim', label: 'NIM' },
                            { key: 'email_wa', label: 'Email/WA' },
                            { key: 'bukti_bayar', label: 'Link Bukti Pembayaran' },
                            { key: 'status_pembayaran', label: 'Status Pembayaran' },
                            { key: 'metode_pembayaran', label: 'Metode Pembayaran' }
                        ];
                    } else { // Umum
                        columns = [
                            { key: 'nama_team', label: 'Nama Team' },
                            { key: 'kode_form', label: 'Kode Team' },
                            { key: 'nama', label: 'Nama' },
                            { key: 'kampus', label: 'Kampus' },
                            { key: 'prodi', label: 'Prodi' },
                            { key: 'email_wa', label: 'Email/WA' },
                            { key: 'bukti_bayar', label: 'Link Bukti Pembayaran' },
                            { key: 'status_pembayaran', label: 'Status Pembayaran' },
                            { key: 'metode_pembayaran', label: 'Metode Pembayaran' }
                        ];
                    }

                    sheets.push({
                        sheetName: `Peserta - ${cat.substring(0, 20)}`, // excel limits sheetName to 31 chars
                        data: catPesertaRows,
                        columns: columns
                    });
                }
            });

            import('@/lib/excel/xlsx').then(({ exportToExcelMultiSheet }) => {
                exportToExcelMultiSheet(sheets, `daftar_pendaftar_${currentLombaName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`);
            });
        } else {
            // Sheet 1: Ringkasan Pengumpulan
            const summaryColumns = [
                { key: 'title', label: 'Nama Team' },
                { key: 'nama_lomba', label: 'Lomba' },
                { key: 'status_pengumpulan', label: 'Status Pengumpulan' },
                { key: 'kode_form', label: 'Kode Team' },
                { key: 'tanggal', label: 'Tanggal Submit' }
            ];

            const summarySheetData = filteredData.map(item => {
                const hasSubmitted = (pengumpulanList || []).some(sub => sub.team_id === item.id);
                return {
                    title: item.title,
                    nama_lomba: item.nama_lomba || currentLombaName || '-',
                    status_pengumpulan: hasSubmitted ? 'Sudah Mengumpulkan' : 'Belum Mengumpulkan',
                    kode_form: item.kode_form || item.kode || item.peserta?.[0]?.kode_form || '-',
                    tanggal: item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : '-'
                };
            });

            sheets.push({
                sheetName: 'Ringkasan Pengumpulan',
                data: summarySheetData,
                columns: summaryColumns
            });

            // Sheet 2: Detail Pengumpulan
            const detailColumns = [
                { key: 'title', label: 'Nama Team' },
                { key: 'lomba', label: 'Lomba' },
                { key: 'kode_form', label: 'Kode Team' },
                { key: 'file_link', label: 'File/Link Pengumpulan' },
                { key: 'tanggal', label: 'Tanggal Submit' }
            ];

            const allowedTeamIds = new Set(filteredData.map(t => t.id));
            const filteredSubmissions = (pengumpulanList || []).filter(sub => allowedTeamIds.has(sub.team_id));

            const detailSheetData = filteredSubmissions.map(sub => ({
                title: sub.team?.title || '-',
                lomba: sub.form_pengumpulan?.form_register?.nama_lomba || '-',
                kode_form: sub.team?.kode_form || sub.team?.kode || sub.team?.peserta?.[0]?.kode_form || '-',
                file_link: sub.file_link || '-',
                tanggal: sub.created_at ? new Date(sub.created_at).toLocaleDateString('id-ID') : '-'
            }));

            sheets.push({
                sheetName: 'Detail Pengumpulan',
                data: detailSheetData,
                columns: detailColumns
            });

            import('@/lib/excel/xlsx').then(({ exportToExcelMultiSheet }) => {
                exportToExcelMultiSheet(sheets, `daftar_pengumpulan_${currentLombaName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`);
            });
        }
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
                    { value: 'Siswa', label: 'Siswa' },
                    { value: 'Umum', label: 'Umum' }
                ]}
            />

            {/* Export Dropdown */}
            <div className="relative inline-block text-left w-full sm:w-auto" id="export-dropdown-wrapper">
                <button
                    type="button"
                    onClick={() => setShowExportDropdown(!showExportDropdown)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2.5 rounded-xl text-sm font-medium transition-colors w-full sm:w-auto justify-center shadow-sm"
                >
                    <Printer size={16} />
                    <span>Cetak / Export</span>
                    <ChevronDown size={14} />
                </button>
                {showExportDropdown && (
                    <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black/5 dark:ring-white/10 z-[110] overflow-hidden">
                        <div className="py-1">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowExportDropdown(false);
                                    handlePrintPDF();
                                }}
                                disabled={pdfLoading}
                                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                            >
                                <Printer size={14} />
                                <span>{pdfLoading ? 'Memproses...' : 'Cetak PDF'}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowExportDropdown(false);
                                    handleExportExcel();
                                }}
                                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <FileSpreadsheet size={14} />
                                <span>Export Excel</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );

    const showIDML = activeDetailTeam?.nama_lomba?.toLowerCase().includes('mobile legend') || activeDetailTeam?.nama_lomba?.toLowerCase().includes('mobile legends');

    return (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
            <DashboardHeaderFilters
                title="Manajemen Team Lomba"
                subtitle={lockedLomba ? `Data Team Lomba untuk ${lockedLomba}` : 'Kelola tim yang mendaftar lomba POSE'}
                icon={Users}
                showSiteFilter={false}
                extraFilters={extraFilters}
                onRefresh={() => fetchData(true)}
                loading={loading}
                lastSyncedAt={lastSyncedAt}
            />

            {/* Overview Cards */}
            <DashboardOverviewCards cards={overviewCards} />

            {/* Status Kuota Kategori Lomba */}
            {activeForm && activeFormPricing.length > 0 && (
                <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Users size={16} className="text-blue-500" />
                        Status Kuota Kategori Lomba: {currentLombaName}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {activeFormPricing.map(p => {
                            const registered = countsPerCategory[p.kategori] || 0;
                            const max = p.maks_team || 0;
                            const remaining = Math.max(0, max - registered);
                            const percent = max > 0 ? Math.min(100, (registered / max) * 100) : 0;

                            return (
                                <div key={p.id} className="p-4 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-800 space-y-2">
                                    <div className="flex justify-between items-start">
                                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{p.kategori}</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${remaining === 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                            {remaining === 0 ? 'Penuh' : `Sisa: ${remaining}`}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <span className="text-lg font-black text-gray-850 dark:text-white">{registered} <span className="text-xs font-normal text-gray-500">/ {max} Tim</span></span>
                                        <span className="text-[10px] text-gray-500 font-semibold">{percent.toFixed(0)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full transition-all duration-500 ${remaining === 0 ? 'bg-red-500' : percent > 80 ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${percent}%` }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Tahap 4: Status Kuota Per Kampus */}
            {activeForm && kampusQuotaData.length > 0 && (
                <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Users size={16} className="text-purple-500" />
                        Status Kuota Per Kampus (Mahasiswa LP3I)
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                        {kampusQuotaData.map((k, idx) => {
                            // hitung dari 'data'
                            const registered = data.filter(t =>
                                t.nama_lomba?.toLowerCase().trim() === currentLombaName?.toLowerCase().trim() &&
                                t.verivikasi !== false &&
                                t.peserta?.[0]?.kategori === 'Mahasiswa LP3I' &&
                                t.peserta?.[0]?.kampus === k.nama_kampus &&
                                (!activeForm?.kode_form || t.kode_form === activeForm.kode_form)
                            ).length;
                            const max = k.maks_team || 0;
                            const remaining = Math.max(0, max - registered);

                            return (
                                <div key={idx} className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800/50">
                                    <div className="text-[10px] font-bold text-purple-600 dark:text-purple-400 mb-1 truncate" title={k.nama_kampus}>
                                        {k.nama_kampus}
                                    </div>
                                    <div className="flex items-end justify-between">
                                        <span className="text-sm font-black text-gray-900 dark:text-white">{registered} <span className="text-[10px] font-normal text-gray-500">/ {max}</span></span>
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded-sm font-bold ${remaining === 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                            {remaining === 0 ? 'Penuh' : `Sisa ${remaining}`}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Tahap 4: Status Semua Lomba */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* HTM Wajib */}
                <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-teal-500" />
                        Status Seluruh Lomba Dari HTM Wajib
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {wajibLombaStatus.map((lombaStatus, idx) => (
                            <span key={idx} className={`text-xs font-bold px-3 py-1.5 rounded-full border ${lombaStatus.isFull ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800' : 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800'}`}>
                                {lombaStatus.form.nama_lomba} ({lombaStatus.isFull ? 'Penuh' : 'Tersedia'})
                            </span>
                        ))}
                        {wajibLombaStatus.length === 0 && (
                            <span className="text-xs text-gray-500">Tidak ada lomba HTM Wajib.</span>
                        )}
                    </div>
                </div>

                {/* HTM Lanjutan */}
                <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-blue-500" />
                        Status Seluruh Lomba Dari HTM Lanjutan
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {lanjutanLombaStatus.map((lombaStatus, idx) => (
                            <span key={idx} className={`text-xs font-bold px-3 py-1.5 rounded-full border ${lombaStatus.isFull ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'}`}>
                                {lombaStatus.form.nama_lomba} ({lombaStatus.isFull ? 'Penuh' : 'Tersedia'})
                            </span>
                        ))}
                        {lanjutanLombaStatus.length === 0 && (
                            <span className="text-xs text-gray-500">Tidak ada lomba HTM Lanjutan.</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Switch & Search Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                {/* Switch tab button */}
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl shadow-xs">
                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab('pendaftar');
                            setCurrentPage(1);
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'pendaftar'
                            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        Daftar Pendaftar
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setActiveTab('pengumpulan');
                            setCurrentPage(1);
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'pengumpulan'
                            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        Daftar Pengumpulan
                    </button>
                </div>

                {/* Search Input beside switch */}
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Cari nama tim..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-blue-500/30"
                    />
                </div>
            </div>

            {/* Tombol Switch jika terdapat lebih dari 1 Form untuk Lomba ini */}
            {matchingRegisterForms.length > 1 && (
                <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl mb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                            Terdapat {matchingRegisterForms.length} Form untuk Lomba Ini:
                        </span>
                    </div>
                    <div className="flex bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
                        {matchingRegisterForms.map((form, idx) => (
                            <button
                                key={form.id || idx}
                                type="button"
                                onClick={() => setSelectedFormIndex(idx)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedFormIndex === idx
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                Form #{idx + 1} ({form.butuh_bukti ? 'HTM Lanjutan' : 'HTM Wajib'})
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Dynamic Form Link */}
            {activeFormLink && (
                <div className="flex flex-col sm:flex-row items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-2xl text-sm">
                    <span className="font-semibold text-blue-700 dark:text-blue-300 shrink-0">
                        Link Form {activeTab === 'pendaftar' ? 'Pendaftaran' : 'Pengumpulan'} Lomba:
                    </span>
                    <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
                        <input
                            type="text"
                            readOnly
                            value={activeFormLink}
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-1.5 text-xs w-full sm:w-96 text-gray-600 dark:text-gray-300 font-mono focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(activeFormLink);
                                window.alert('Link berhasil disalin!');
                            }}
                            className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:text-blue-500 hover:border-blue-500 dark:hover:border-blue-500 transition-colors shadow-xs"
                            title="Salin Link"
                        >
                            <Copy size={14} />
                        </button>
                        <a
                            href={activeFormLink.replace(window.location.origin, '')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:text-blue-500 hover:border-blue-500 dark:hover:border-blue-500 transition-colors shadow-xs"
                            title="Buka Link"
                        >
                            <LinkIcon size={14} />
                        </a>
                    </div>
                </div>
            )}

            {/* Main Table Box */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <h3 className="font-bold text-base sm:text-lg text-gray-800 dark:text-gray-200">
                        {activeTab === 'pendaftar' ? 'Daftar Pendaftar' : 'Daftar Pengumpulan'}
                    </h3>

                    {/* Filter Dropdown */}
                    {activeTab === 'pendaftar' ? (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 font-medium">Filter Verifikasi:</span>
                            <select
                                value={filterVerifikasi}
                                onChange={(e) => {
                                    setFilterVerifikasi(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs font-semibold focus:ring-2 focus:ring-blue-500/30"
                            >
                                <option value="all">Semua Status</option>
                                <option value="verified">Valid</option>
                                <option value="pending">Pending</option>
                                <option value="rejected">Ditolak</option>
                            </select>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 font-medium">Filter Pengumpulan:</span>
                            <select
                                value={filterPengumpulan}
                                onChange={(e) => {
                                    setFilterPengumpulan(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs font-semibold focus:ring-2 focus:ring-blue-500/30"
                            >
                                <option value="all">Semua Status</option>
                                <option value="submitted">Sudah Mengumpulkan</option>
                                <option value="unsubmitted">Belum Mengumpulkan</option>
                            </select>
                        </div>
                    )}
                </div>

                <div className="overflow-x-auto">
                    {activeTab === 'pendaftar' ? (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                                <tr>
                                    <th className="px-4 py-3 font-medium w-12 text-center">No</th>
                                    <th className="px-4 py-3 font-medium">Nama Team</th>
                                    <th className="px-4 py-3 font-medium text-center">Jml Anggota</th>
                                    <th className="px-4 py-3 font-medium text-center">Jenis</th>
                                    <th className="px-4 py-3 font-medium text-center">Kategori (P/Pi)</th>
                                    <th className="px-4 py-3 font-medium">Nama Lomba</th>
                                    <th className="px-4 py-3 font-medium">Jenis Lomba</th>
                                    <th className="px-4 py-3 font-medium text-center">Peserta</th>
                                    <th className="px-4 py-3 font-medium text-center">Jenis HTM</th>
                                    <th className="px-4 py-3 font-medium w-44">Tanggal</th>
                                    <th className="px-4 py-3 font-medium w-24 text-center">Lihat Detail</th>
                                    <th className="px-4 py-3 font-medium w-32 text-center">Verifikasi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {loading && data.length === 0 ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={`skel-${i}`} className="animate-pulse bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                                            <td colSpan={10} className="px-4 py-4"><div className="h-8 bg-gray-100 dark:bg-gray-800 rounded-lg w-full"></div></td>
                                        </tr>
                                    ))
                                ) : paginatedData.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="px-6 py-16 text-center text-gray-500">Tidak ada pendaftar ditemukan.</td>
                                    </tr>
                                ) : paginatedData.map((item, index) => {
                                    const isSelected = activeDetailTeam?.id === item.id;
                                    return (
                                        <tr
                                            key={item.id}
                                            onClick={() => setActiveDetailTeam(item)}
                                            className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${isSelected ? 'bg-blue-50/50 dark:bg-blue-900/20 border-l-4 border-blue-500' : ''
                                                }`}
                                        >
                                            <td className="px-4 py-3 text-center text-gray-500 font-medium">{startIndex + index + 1}</td>
                                            <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-200">{item.title}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="inline-flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full h-6 w-6 text-xs font-bold">
                                                    {item.team_members?.length || 0}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {(() => {
                                                    const isIndiv = item.team_members?.some(m => m.jabatan === 'Individu') || item.team_members?.length === 1;
                                                    return (
                                                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${isIndiv ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'}`}>
                                                            {isIndiv ? 'Individu' : 'Team'}
                                                        </span>
                                                    );
                                                })()}
                                            </td>
                                            <td className="px-4 py-3 text-center text-xs font-semibold capitalize text-gray-700 dark:text-gray-300">
                                                {item.jenis_kategori || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400 font-medium">{item.nama_lomba || '-'}</td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">{item.jenis_lomba || '-'}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="inline-flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full h-6 w-6 text-xs font-bold">
                                                    {item.peserta?.length || 0}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300">
                                                {item.bukti_bayar ? 'Dari HTM Lomba' : 'Dari HTM Wajib'}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{formatDateTime(item.created_at)}</td>
                                            <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    type="button"
                                                    onClick={() => setDetailItem(item)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-colors"
                                                >
                                                    <Eye size={14} />
                                                    Lihat
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                {item.verivikasi === true ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => setVerifikasiItem(item)}
                                                        className="inline-flex items-center justify-center gap-1 w-full px-2 py-1.5 text-xs font-semibold rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/50 hover:bg-green-100 transition-colors"
                                                    >
                                                        <CheckCircle2 size={14} /> Valid
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
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                                <tr>
                                    <th className="px-4 py-3 font-medium w-12 text-center">No</th>
                                    <th className="px-4 py-3 font-medium">Nama Team</th>
                                    <th className="px-4 py-3 font-medium">Lomba</th>
                                    <th className="px-4 py-3 font-medium text-center">Status Pengumpulan</th>
                                    <th className="px-4 py-3 font-medium text-center">Status Diterima</th>
                                    <th className="px-4 py-3 font-medium text-center">Kode Team</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {loading && data.length === 0 ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={`skel-sub-${i}`} className="animate-pulse bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                                            <td colSpan={6} className="px-4 py-4"><div className="h-8 bg-gray-100 dark:bg-gray-800 rounded-lg w-full"></div></td>
                                        </tr>
                                    ))
                                ) : paginatedData.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center text-gray-500">Tidak ada pendaftar ditemukan.</td>
                                    </tr>
                                ) : paginatedData.map((item, index) => {
                                    const isSelected = activeDetailTeam?.id === item.id;
                                    const hasSubmitted = (pengumpulanList || []).some(sub => sub.team_id === item.id);
                                    const subItem = (pengumpulanList || []).find(sub => sub.team_id === item.id);
                                    return (
                                        <tr
                                            key={item.id}
                                            onClick={() => setActiveDetailTeam(item)}
                                            className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${isSelected ? 'bg-blue-50/50 dark:bg-blue-900/20 border-l-4 border-blue-500' : ''
                                                }`}
                                        >
                                            <td className="px-4 py-3 text-center text-gray-500 font-medium">{startIndex + index + 1}</td>
                                            <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-200">{item.title}</td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400 font-medium">{item.nama_lomba || '-'}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${hasSubmitted
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400'
                                                    }`}>
                                                    {hasSubmitted ? 'Sudah Mengumpulkan' : 'Belum Mengumpulkan'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                                {subItem ? (
                                                    <select
                                                        value={subItem.status_pengumpulan ? 'diterima' : 'belum_dicek'}
                                                        onChange={(e) => handleSelectStatus(subItem, e.target.value === 'diterima')}
                                                        className={`text-xs font-semibold rounded-lg px-2.5 py-1.5 border outline-none cursor-pointer transition-all ${subItem.status_pengumpulan
                                                            ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800/50'
                                                            : 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400 dark:border-yellow-800/50'
                                                            }`}
                                                    >
                                                        <option value="belum_dicek" className="bg-white dark:bg-gray-800 text-yellow-700 font-semibold">Belum Dicek</option>
                                                        <option value="diterima" className="bg-white dark:bg-gray-800 text-green-700 font-semibold">Diterima</option>
                                                    </select>
                                                ) : (
                                                    <span className="text-gray-400 text-xs italic">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center font-mono text-xs">{item.kode_form || item.kode || item.peserta?.[0]?.kode_form || '-'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
                <TablePagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filteredData.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={setCurrentPage}
                    colSpan={activeTab === 'pendaftar' ? 9 : 5}
                />
            </div>

            {/* Detailed Participant Table (under the main table - tab Pendaftar only) */}
            {activeTab === 'pendaftar' && activeDetailTeam && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden mt-6 animate-in fade-in slide-in-from-bottom duration-300">
                    <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-base sm:text-lg text-gray-800 dark:text-gray-200">
                                Detail Peserta Tim: <span className="text-blue-600 dark:text-blue-400 font-black">{activeDetailTeam.title}</span>
                            </h3>
                            <p className="text-xs text-gray-500">Lomba: {activeDetailTeam.nama_lomba} ({activeDetailTeam.jenis_lomba})</p>
                        </div>
                        <button
                            onClick={() => setActiveDetailTeam(null)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-bold"
                        >
                            Tutup Detail ×
                        </button>
                    </div>
                    <div className="p-4 sm:p-6 overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="px-4 py-3 font-semibold w-12 text-center">No</th>
                                    <th className="px-4 py-3 font-semibold">Nama</th>
                                    <th className="px-4 py-3 font-semibold">Kategori</th>
                                    <th className="px-4 py-3 font-semibold">NIM/Kode</th>
                                    {showIDML && <th className="px-4 py-3 font-semibold">ID ML</th>}
                                    <th className="px-4 py-3 font-semibold">Prodi</th>
                                    <th className="px-4 py-3 font-semibold">Semester/Angkatan</th>
                                    <th className="px-4 py-3 font-semibold">Kampus</th>
                                    <th className="px-4 py-3 font-semibold">Kontak</th>
                                    <th className="px-4 py-3 font-semibold text-center">Status Bayar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {(!activeDetailTeam.peserta || activeDetailTeam.peserta.length === 0) ? (
                                    <tr>
                                        <td colSpan={showIDML ? 10 : 9} className="px-4 py-8 text-center text-gray-500 italic">Belum ada data peserta terhubung.</td>
                                    </tr>
                                ) : (
                                    activeDetailTeam.peserta.map((p, idx) => {
                                        const memberObj = (activeDetailTeam.team_members || []).find(m => m.kode?.toLowerCase().trim() === p.nim?.toLowerCase().trim());
                                        const idMl = memberObj?.id_ml;
                                        return (
                                            <tr key={p.id || idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20">
                                                <td className="px-4 py-3 text-center text-gray-500">{idx + 1}</td>
                                                <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-200">{p.nama}</td>
                                                <td className="px-4 py-3">{p.kategori || '-'}</td>
                                                <td className="px-4 py-3 font-mono text-xs">{p.nim || '-'}</td>
                                                {showIDML && <td className="px-4 py-3 font-semibold font-mono text-xs text-blue-600 dark:text-blue-400">{idMl || '-'}</td>}
                                                <td className="px-4 py-3">{p.prodi || '-'}</td>
                                                <td className="px-4 py-3">Sem. {p.semester || '-'} ({p.angkatan || '-'})</td>
                                                <td className="px-4 py-3">{p.kampus || '-'}</td>
                                                <td className="px-4 py-3 text-xs">{p.email_wa || '-'}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${p.status_pembayaran?.toLowerCase() === 'pending'
                                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400'
                                                        : p.status_pembayaran?.toLowerCase() === 'ditolak'
                                                            ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                                            : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                                        }`}>
                                                        {p.status_pembayaran || '-'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* AdminPesertaPengumpulan Component (under the main table - tab Pengumpulan only) */}
            {activeTab === 'pengumpulan' && activeDetailTeam && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden mt-6 animate-in fade-in slide-in-from-bottom duration-300">
                    <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-base sm:text-lg text-gray-800 dark:text-gray-200">
                                Hasil Pengumpulan Tim: <span className="text-blue-600 dark:text-blue-400 font-black">{activeDetailTeam.title}</span>
                            </h3>
                            <p className="text-xs text-gray-500">Lomba: {activeDetailTeam.nama_lomba} ({activeDetailTeam.jenis_lomba})</p>
                        </div>
                        <button
                            onClick={() => setActiveDetailTeam(null)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-bold"
                        >
                            Tutup Detail &times;
                        </button>
                    </div>
                    <div className="p-4 sm:p-6">
                        <AdminPesertaPengumpulan
                            teamId={activeDetailTeam.id}
                            lockedLomba={lockedLomba}
                            namaLomba={namaLomba}
                            refreshTrigger={lastSyncedAt}
                        />
                    </div>
                </div>
            )}

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
                            {(() => {
                                const pesertaStatusList = verifikasiItem?.peserta?.map(p => p.status_pembayaran?.toLowerCase()) || [];
                                const isAllPending = pesertaStatusList.length > 0 && pesertaStatusList.every(s => s === 'pending');
                                const isAnyRejected = pesertaStatusList.some(s => s === 'ditolak');

                                const setujuDisabled = verifikasiLoading || isAllPending || isAnyRejected;
                                const tolakDisabled = verifikasiLoading || isAnyRejected;

                                const handleAction = (status) => {
                                    const allLunas = pesertaStatusList.length > 0 && pesertaStatusList.every(s => s === 'lunas' || s === 'berhasil');
                                    if (allLunas) {
                                        window.alert('Semua peserta telah diverifikasi pembayarannya.');
                                    }
                                    handleVerifikasi(status);
                                };

                                return (
                                    <>
                                        <button
                                            onClick={handleDeletePermanent}
                                            disabled={verifikasiLoading}
                                            className="px-4 py-2 rounded-xl text-sm font-medium border border-red-500 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed mr-auto"
                                        >
                                            Hapus Permanen
                                        </button>
                                        <button
                                            onClick={() => handleAction(false)}
                                            disabled={tolakDisabled}
                                            className="px-4 py-2 rounded-xl text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Tolak
                                        </button>
                                        <button
                                            onClick={() => handleAction(true)}
                                            disabled={setujuDisabled}
                                            className="px-4 py-2 rounded-xl text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Setujui
                                        </button>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
