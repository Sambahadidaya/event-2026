'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Trophy, Plus, Edit2, Trash2, Link as LinkIcon, Copy, Check, Eye, Filter, RefreshCw, FileText, UserCheck, Star, Sparkles, FileDown, Sheet, MessageSquare } from 'lucide-react';
import { generatePdfAction } from '@/api/pdf/route';
import TombolCetak from '@/components/panitia/TombolCetak';
import { getTeams } from '@/api/supabase/public/team';
import { getCurrentAdmin } from '@/api/supabase/admin/auth';
import { getFormNilaiLomba, upsertFormNilaiLomba, deleteFormNilaiLomba, getNilaiLomba, upsertNilaiLomba, deleteNilaiLomba } from '@/api/supabase/admin/penilaian';
import { getSubmissionByTeamAndLomba } from '@/api/supabase/public/penilaian';
import DashboardHeaderFilters from '@/components/panitia/DashboardHeaderFilters';
import DashboardSelect from '@/components/panitia/DashboardSelect';
import ConfirmModal from '@/components/panitia/ConfirmModal';
import { NAMA_LOMBA } from '@/lib/lombaData';
import { getLombaFilter } from '@/lib/adminRoleData';
import { nanoid } from 'nanoid';

const KREATIVITAS_LOMBA = NAMA_LOMBA['Kreativitas'] || [];

export default function AdminPenilaianPJ() {
    const [teams, setTeams] = useState([]);
    const [formList, setFormList] = useState([]);
    const [nilaiList, setNilaiList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastSyncedAt, setLastSyncedAt] = useState(null);
    const [adminRole, setAdminRole] = useState(null);
    const [lockedLomba, setLockedLomba] = useState(null);

    // Filters
    const [namaLombaFilter, setNamaLombaFilter] = useState('all');
    const [selectedFormId, setSelectedFormId] = useState('all');

    // Detail Penilaian Juri Modal State
    const [detailModalItem, setDetailModalItem] = useState(null);

    // Form Modal State (Form Nilai Lomba)
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingFormItem, setEditingFormItem] = useState(null);
    const [formNamaJuri, setFormNamaJuri] = useState('');
    const [formLinkId, setFormLinkId] = useState('');
    const [formNamaLomba, setFormNamaLomba] = useState('');
    const [formJudulNilai, setFormJudulNilai] = useState('');
    const [formBobotNilai, setFormBobotNilai] = useState('');
    const [submittingForm, setSubmittingForm] = useState(false);

    // Form Input Nilai State (Nilai Lomba per Team)
    const [showNilaiModal, setShowNilaiModal] = useState(false);
    const [editingNilaiItem, setEditingNilaiItem] = useState(null);
    const [activeFormForInput, setActiveFormForInput] = useState(null);
    const [inputTeamId, setInputTeamId] = useState('');
    const [inputScores, setInputScores] = useState({}); // { index: scoreValue }
    const [inputKritik, setInputKritik] = useState('');
    const [inputSaran, setInputSaran] = useState('');
    const [submittingNilai, setSubmittingNilai] = useState(false);

    // Submission Fetching for Modal Input
    const [selectedTeamSubmission, setSelectedTeamSubmission] = useState(null);
    const [loadingSubmission, setLoadingSubmission] = useState(false);

    // Pivot Table Team Submission Detail
    const [selectedTeamForSubmissionDetail, setSelectedTeamForSubmissionDetail] = useState(null);
    const [subDetailLoading, setSubDetailLoading] = useState(false);
    const [teamSubmissionData, setTeamSubmissionData] = useState(null);

    // Delete Modals
    const [deleteFormItem, setDeleteFormItem] = useState(null);
    const [deletingForm, setDeletingForm] = useState(false);
    const [deleteNilaiItem, setDeleteNilaiItem] = useState(null);
    const [deletingNilai, setDeletingNilai] = useState(false);

    // Copy Toast State
    const [copiedLinkId, setCopiedLinkId] = useState(null);

    // Print/Export State
    const [printingPdf, setPrintingPdf] = useState(false);
    const [exportingExcel, setExportingExcel] = useState(false);

    const fetchData = useCallback(async (forceRefresh = false) => {
        setLoading(true);

        const admin = await getCurrentAdmin();
        if (admin) {
            setAdminRole(admin.role);
            const filter = getLombaFilter(admin.role);
            setLockedLomba(filter);

            if (filter) {
                setNamaLombaFilter(filter);
            }
        }

        const [teamData, forms, nilais] = await Promise.all([
            getTeams('pose'),
            getFormNilaiLomba(),
            getNilaiLomba()
        ]);

        if (teamData) {
            setTeams(teamData.filter(t => t.verivikasi === true && t.jenis_lomba === 'Kreativitas'));
        }
        if (forms) setFormList(forms);
        if (nilais) setNilaiList(nilais);

        setLastSyncedAt(Date.now());
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Fetch team submission for input modal
    useEffect(() => {
        if (!inputTeamId || !activeFormForInput) {
            setSelectedTeamSubmission(null);
            return;
        }

        const fetchSubmission = async () => {
            setLoadingSubmission(true);
            const sub = await getSubmissionByTeamAndLomba(inputTeamId, activeFormForInput.nama_lomba);
            setSelectedTeamSubmission(sub);
            setLoadingSubmission(false);
        };

        fetchSubmission();
    }, [inputTeamId, activeFormForInput]);

    // Fetch team submission for detail preview
    useEffect(() => {
        if (!selectedTeamForSubmissionDetail) {
            setTeamSubmissionData(null);
            return;
        }

        const fetchSubDetail = async () => {
            setSubDetailLoading(true);
            const sub = await getSubmissionByTeamAndLomba(selectedTeamForSubmissionDetail.id, selectedTeamForSubmissionDetail.nama_lomba);
            setTeamSubmissionData(sub);
            setSubDetailLoading(false);
        };

        fetchSubDetail();
    }, [selectedTeamForSubmissionDetail]);

    const isNonKreativitasRole = useMemo(() => {
        if (!lockedLomba) return false;
        return !KREATIVITAS_LOMBA.includes(lockedLomba);
    }, [lockedLomba]);

    // Filtered Forms
    const filteredForms = useMemo(() => {
        return formList.filter(f => {
            return namaLombaFilter === 'all' || f.nama_lomba?.toLowerCase() === namaLombaFilter.toLowerCase();
        });
    }, [formList, namaLombaFilter]);

    // Filtered Nilai
    const filteredNilai = useMemo(() => {
        return nilaiList.filter(n => {
            const matchForm = selectedFormId === 'all' || n.form_nilai_lomba_id === selectedFormId;
            const matchLomba = namaLombaFilter === 'all' || n.team?.nama_lomba?.toLowerCase() === namaLombaFilter.toLowerCase();
            return matchForm && matchLomba;
        });
    }, [nilaiList, selectedFormId, namaLombaFilter]);

    // Check which team IDs have already been graded for the active form
    const evaluatedTeamIds = useMemo(() => {
        if (!activeFormForInput) return [];
        return nilaiList
            .filter(n => n.form_nilai_lomba_id === activeFormForInput.id && (!editingNilaiItem || n.id !== editingNilaiItem.id))
            .map(n => n.team_id);
    }, [nilaiList, activeFormForInput, editingNilaiItem]);

    // Check if the current admin has permission to edit scores
    const canEdit = useMemo(() => {
        return adminRole === 'super_admin' || adminRole === 'admin_pose';
    }, [adminRole]);

    // Active Form for Pivot Table view
    const activeFormDetail = useMemo(() => {
        if (selectedFormId !== 'all') {
            return formList.find(f => f.id === selectedFormId);
        }
        if (filteredForms.length > 0) return filteredForms[0];
        return null;
    }, [formList, selectedFormId, filteredForms]);

    // Parse titles and weights for active form
    const parsedCriteria = useMemo(() => {
        if (!activeFormDetail) return [];
        const judulArr = (activeFormDetail.judul_nilai || '').split(',').map(s => s.trim()).filter(Boolean);
        const bobotArr = (activeFormDetail.bobot_nilai || '').split(',').map(s => s.trim()).filter(Boolean);

        return judulArr.map((judul, idx) => ({
            judul,
            bobot: parseFloat(bobotArr[idx]) || 0
        }));
    }, [activeFormDetail]);

    // Format Form Modal Handlers
    const handleOpenCreateForm = () => {
        setEditingFormItem(null);
        setFormNamaJuri('');
        setFormLinkId(nanoid(8));
        setFormNamaLomba(lockedLomba || (namaLombaFilter !== 'all' ? namaLombaFilter : KREATIVITAS_LOMBA[0] || ''));
        setFormJudulNilai('Kesesuaian Tema, Kreativitas, Estetika');
        setFormBobotNilai('30, 40, 30');
        setShowFormModal(true);
    };

    const handleOpenEditForm = (item) => {
        setEditingFormItem(item);
        setFormNamaJuri(item.nama_juri || '');
        setFormLinkId(item.link_id || '');
        setFormNamaLomba(item.nama_lomba || '');
        setFormJudulNilai(item.judul_nilai || '');
        setFormBobotNilai(item.bobot_nilai || '');
        setShowFormModal(true);
    };

    const handleSubmitForm = async (e) => {
        e.preventDefault();
        if (!formNamaJuri.trim()) { alert('Nama Juri harus diisi.'); return; }
        if (!formNamaLomba) { alert('Nama Lomba harus dipilih.'); return; }
        if (!formJudulNilai.trim() || !formBobotNilai.trim()) {
            alert('Judul Nilai dan Bobot Nilai harus diisi.');
            return;
        }

        const jArr = formJudulNilai.split(',').map(s => s.trim()).filter(Boolean);
        const bArr = formBobotNilai.split(',').map(s => s.trim()).filter(Boolean);
        if (jArr.length !== bArr.length) {
            alert(`Jumlah Judul Nilai (${jArr.length}) harus sama dengan jumlah Bobot Nilai (${bArr.length}).`);
            return;
        }

        // Limit: Only 1 form per nama_lomba
        if (!editingFormItem) {
            const alreadyExists = formList.some(f => f.nama_lomba?.toLowerCase() === formNamaLomba?.toLowerCase());
            if (alreadyExists) {
                alert(`Gagal: Form penilaian untuk lomba "${formNamaLomba}" sudah ada. Hanya diperbolehkan membuat 1 form per nama lomba.`);
                return;
            }
        }

        setSubmittingForm(true);

        const payload = {
            nama_juri: formNamaJuri.trim(),
            link_id: formLinkId.trim() || nanoid(8),
            jenis_lomba: 'Kreativitas',
            nama_lomba: formNamaLomba,
            judul_nilai: jArr.join(','),
            bobot_nilai: bArr.join(',')
        };

        const res = await upsertFormNilaiLomba(payload, editingFormItem?.id);
        setSubmittingForm(false);

        if (res.success) {
            setShowFormModal(false);
            fetchData(true);
        } else {
            alert(res.error || 'Gagal menyimpan Form Nilai Lomba.');
        }
    };

    const handleDeleteForm = async () => {
        if (!deleteFormItem) return;
        setDeletingForm(true);
        const res = await deleteFormNilaiLomba(deleteFormItem.id);
        setDeletingForm(false);
        setDeleteFormItem(null);

        if (res.success) {
            fetchData(true);
        } else {
            alert(res.error || 'Gagal menghapus Form Nilai Lomba.');
        }
    };

    // Format Input Nilai Modal Handlers
    const handleOpenInputNilai = (formItem, editingNilai = null) => {
        setActiveFormForInput(formItem);
        setEditingNilaiItem(editingNilai);

        const judulArr = (formItem.judul_nilai || '').split(',').map(s => s.trim()).filter(Boolean);

        if (editingNilai) {
            setInputTeamId(editingNilai.team_id);
            setInputKritik(editingNilai.kritik || '');
            setInputSaran(editingNilai.saran || '');

            const scoresObj = {};
            (editingNilai.detail_nilai_lomba || []).forEach(d => {
                const idx = judulArr.indexOf(d.judul_nilai);
                if (idx !== -1) {
                    scoresObj[idx] = d.nilai;
                }
            });
            setInputScores(scoresObj);
        } else {
            setInputTeamId('');
            setInputKritik('');
            setInputSaran('');
            setInputScores({});
        }

        setShowNilaiModal(true);
    };

    const handleSubmitNilai = async (e) => {
        e.preventDefault();
        if (!inputTeamId) { alert('Pilih Tim terlebih dahulu.'); return; }
        if (!activeFormForInput) return;

        const judulArr = (activeFormForInput.judul_nilai || '').split(',').map(s => s.trim()).filter(Boolean);
        const bobotArr = (activeFormForInput.bobot_nilai || '').split(',').map(s => s.trim()).filter(Boolean);

        const detailPayloads = [];
        for (let i = 0; i < judulArr.length; i++) {
            const scoreVal = inputScores[i];
            if (scoreVal === undefined || scoreVal === '' || isNaN(scoreVal)) {
                alert(`Nilai untuk "${judulArr[i]}" belum diisi.`);
                return;
            }
            detailPayloads.push({
                judul_nilai: judulArr[i],
                bobot_nilai: bobotArr[i] || '0',
                nilai: parseInt(scoreVal, 10) || 0
            });
        }

        setSubmittingNilai(true);

        const nilaiPayload = {
            team_id: inputTeamId,
            form_nilai_lomba_id: activeFormForInput.id,
            kritik: inputKritik,
            saran: inputSaran,
            status_public: true
        };

        const res = await upsertNilaiLomba(nilaiPayload, detailPayloads, editingNilaiItem?.id);
        setSubmittingNilai(false);

        if (res.success) {
            setShowNilaiModal(false);
            fetchData(true);
        } else {
            alert(res.error || 'Gagal menyimpan Penilaian.');
        }
    };

    const handleDeleteNilai = async () => {
        if (!deleteNilaiItem) return;
        setDeletingNilai(true);
        const res = await deleteNilaiLomba(deleteNilaiItem.id);
        setDeletingNilai(false);
        setDeleteNilaiItem(null);

        if (res.success) {
            fetchData(true);
        } else {
            alert(res.error || 'Gagal menghapus Penilaian.');
        }
    };

    const copyPublicLink = (linkId) => {
        const fullUrl = `${window.location.origin}/pose/nilai/${linkId}`;
        navigator.clipboard.writeText(fullUrl);
        setCopiedLinkId(linkId);
        setTimeout(() => setCopiedLinkId(null), 2500);
    };

    const handlePrintPdf = async () => {
        if (filteredNilai.length === 0) {
            alert('Tidak ada data nilai untuk dicetak.');
            return;
        }
        setPrintingPdf(true);
        try {
            const juriName = activeFormDetail ? activeFormDetail.nama_juri : 'Semua Juri';
            const lombaLabel = namaLombaFilter === 'all' ? 'Semua Lomba Kreativitas' : namaLombaFilter;
            const res = await generatePdfAction({
                type: 'penilaian_report',
                site: 'pose',
                title: `Rekapitulasi Penilaian - ${lombaLabel}`,
                lombaName: lombaLabel,
                juriName,
                criteria: parsedCriteria,
                data: filteredNilai
            });

            if (res.success && res.base64Pdf) {
                const byteChars = atob(res.base64Pdf);
                const byteNums = Array.from(byteChars, c => c.charCodeAt(0));
                const blob = new Blob([new Uint8Array(byteNums)], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `rekapitulasi_penilaian_${lombaLabel.toLowerCase().replace(/[^a-z0-9]/g, '_')}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
            } else {
                alert(res.error || 'Gagal membuat PDF.');
            }
        } catch (err) {
            alert('Terjadi kesalahan saat mencetak PDF.');
        }
        setPrintingPdf(false);
    };

    const handleExportExcel = () => {
        if (filteredNilai.length === 0) {
            alert('Tidak ada data nilai untuk diexport.');
            return;
        }
        setExportingExcel(true);
        try {
            import('@/lib/excel/xlsx').then(({ exportToExcelMultiSheet }) => {
                const lombaLabel = namaLombaFilter === 'all' ? 'Semua Lomba' : namaLombaFilter;

                // Sheet 1: Ringkasan Nilai Akhir
                const sheetRingkasan = filteredNilai.map((item, idx) => {
                    const row = {
                        No: idx + 1,
                        'Nama Tim': item.team?.title || '-',
                        'Juri': item.form_nilai_lomba?.nama_juri || '-',
                        'Lomba': item.team?.nama_lomba || '-',
                    };
                    // Tambahkan kolom kriteria
                    parsedCriteria.forEach(c => {
                        const detail = (item.detail_nilai_lomba || []).find(d => d.judul_nilai?.trim() === c.judul.trim());
                        row[`${c.judul} (${c.bobot}%)`] = detail ? detail.nilai : '-';
                    });
                    row['Nilai Akhir'] = item.nilai_akhir !== null ? Number(item.nilai_akhir).toFixed(2) : '-';
                    row['Kritik'] = item.kritik || '-';
                    row['Saran'] = item.saran || '-';
                    row['Waktu Input'] = item.created_at ? new Date(item.created_at).toLocaleString('id-ID') : '-';
                    return row;
                });

                exportToExcelMultiSheet(
                    [{ sheetName: 'Rekap Penilaian', data: sheetRingkasan, columns: [] }],
                    `rekapitulasi_penilaian_${lombaLabel.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
                );
                setExportingExcel(false);
            });
        } catch (err) {
            alert('Gagal mengexport ke Excel.');
            setExportingExcel(false);
        }
    };

    const extraFilters = (
        <>
            {!lockedLomba && (
                <DashboardSelect
                    icon={Filter}
                    value={namaLombaFilter}
                    onChange={(e) => {
                        setNamaLombaFilter(e.target.value);
                        setSelectedFormId('all');
                    }}
                    options={[
                        { value: 'all', label: 'Semua Lomba Kreativitas' },
                        ...KREATIVITAS_LOMBA.map(n => ({ value: n, label: n }))
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

    if (isNonKreativitasRole) {
        return (
            <div className="space-y-6">
                <DashboardHeaderFilters
                    title="Akses Ditolak"
                    subtitle="Halaman khusus untuk panitia lomba bidang Kreativitas"
                    icon={Trophy}
                    showSiteFilter={false}
                    extraFilters={extraFilters}
                    onRefresh={() => fetchData(true)}
                    loading={loading}
                    lastSyncedAt={lastSyncedAt}
                />
                <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-100 dark:border-gray-800 text-center shadow-sm">
                    <Trophy size={48} className="mx-auto text-red-500 mb-3" />
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Akses Ditolak</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
                        Anda tidak memiliki wewenang untuk membuka halaman ini. Penilaian kuantitatif berbobot hanya berlaku untuk cabang Perlombaan Kreativitas.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <DashboardHeaderFilters
                title="Penilaian Lomba Kreativitas"
                subtitle={lockedLomba ? `Kelola form & detail penilaian untuk ${lockedLomba}` : 'Kelola form juri & hasil penilaian lomba Kreativitas'}
                icon={Trophy}
                showSiteFilter={false}
                extraFilters={extraFilters}
                onRefresh={() => fetchData(true)}
                loading={loading}
                lastSyncedAt={lastSyncedAt}
            />

            {/* SECTION 1: MANAJEMEN FORM NILAI LOMBA */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                            <FileText size={20} className="text-violet-500" />
                            Form Penilaian Juri
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                            Form nilai menentukan kriteria dan bobot penilaian yang diakses oleh Juri
                        </p>
                    </div>

                    <button
                        onClick={handleOpenCreateForm}
                        className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-violet-500/20 transition-all self-start sm:self-auto"
                    >
                        <Plus size={16} />
                        <span>Buat Form Nilai Baru</span>
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 font-semibold">
                            <tr>
                                <th className="px-4 py-3.5 w-12 text-center">No</th>
                                <th className="px-4 py-3.5">Nama Juri</th>
                                <th className="px-4 py-3.5">Lomba</th>
                                <th className="px-4 py-3.5">Kriteria & Bobot</th>
                                <th className="px-4 py-3.5">Link Public Juri</th>
                                <th className="px-4 py-3.5 text-center w-36">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <tr key={`skel-f-${i}`} className="animate-pulse">
                                        <td colSpan={6} className="px-4 py-4">
                                            <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded-lg w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredForms.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">
                                        Belum ada form penilaian yang dibuat. Klik "Buat Form Nilai Baru" di atas.
                                    </td>
                                </tr>
                            ) : (
                                filteredForms.map((item, idx) => {
                                    const judulArr = (item.judul_nilai || '').split(',');
                                    const bobotArr = (item.bobot_nilai || '').split(',');
                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors">
                                            <td className="px-4 py-4 text-center font-bold text-gray-400">{idx + 1}</td>
                                            <td className="px-4 py-4">
                                                <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                                                    <UserCheck size={16} className="text-violet-500 shrink-0" />
                                                    {item.nama_juri}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 font-semibold text-gray-700 dark:text-gray-300">
                                                {item.nama_lomba}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {judulArr.map((j, i) => (
                                                        <span key={i} className="text-xs bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 px-2 py-0.5 rounded-md font-medium">
                                                            {j.trim()} ({bobotArr[i]?.trim() || '0'}%)
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <button
                                                    onClick={() => copyPublicLink(item.link_id)}
                                                    className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 font-mono transition-colors"
                                                    title="Salin Link Juri"
                                                >
                                                    {copiedLinkId === item.link_id ? (
                                                        <>
                                                            <Check size={14} className="text-green-600" />
                                                            <span className="text-green-600 font-bold">Tersalin!</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy size={14} />
                                                            <span>/pose/nilai/{item.link_id}</span>
                                                        </>
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() => handleOpenInputNilai(item)}
                                                        className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                                                        title="Input Nilai Admin"
                                                    >
                                                        <Plus size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleOpenEditForm(item)}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                        title="Edit Form"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteFormItem(item)}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                        title="Hapus Form"
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

            {/* SECTION 2: TABEL DETAIL PENILAIAN JURI */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                            <Sparkles size={20} className="text-amber-500" />
                            Detail Penilaian Juri
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                            Kolom mewakili nilai dari tiap kriteria penilaian dan baris mewakili Nama Tim beserta nilai akhir
                        </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        {filteredForms.length > 0 && (
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-gray-500">Pilih Form Juri:</span>
                                <select
                                    value={selectedFormId}
                                    onChange={(e) => setSelectedFormId(e.target.value)}
                                    className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs font-semibold outline-none focus:ring-2 focus:ring-violet-500"
                                >
                                    <option value="all">Semua Form Juri</option>
                                    {filteredForms.map(f => (
                                        <option key={f.id} value={f.id}>{f.nama_juri} ({f.nama_lomba})</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="flex items-center gap-1.5">
                            <TombolCetak
                                label="Cetak / Export"
                                pdfTitle={`Rekapitulasi Penilaian - ${namaLombaFilter === 'all' ? 'Semua Lomba Kreativitas' : namaLombaFilter}`}
                                pdfSite="pose"
                                pdfData={filteredNilai}
                                pdfDocumentType="penilaian_report"
                                pdfExtraProps={{
                                    lombaName: namaLombaFilter === 'all' ? 'Semua Lomba Kreativitas' : namaLombaFilter,
                                    juriName: activeFormDetail ? activeFormDetail.nama_juri : 'Semua Juri',
                                    criteria: parsedCriteria
                                }}
                                excelSheets={filteredNilai && filteredNilai.length > 0 ? [{
                                    sheetName: 'Rekap Penilaian',
                                    data: filteredNilai.map((item, idx) => {
                                        const row = {
                                            No: idx + 1,
                                            'Nama Tim': item.team?.title || '-',
                                            'Juri': item.form_nilai_lomba?.nama_juri || '-',
                                            'Lomba': item.team?.nama_lomba || '-',
                                        };
                                        parsedCriteria.forEach(c => {
                                            const detail = (item.detail_nilai_lomba || []).find(d => d.judul_nilai?.trim() === c.judul.trim());
                                            row[`${c.judul} (${c.bobot}%)`] = detail ? detail.nilai : '-';
                                        });
                                        row['Nilai Akhir'] = item.nilai_akhir !== null ? Number(item.nilai_akhir).toFixed(2) : '-';
                                        row['Kritik'] = item.kritik || '-';
                                        row['Saran'] = item.saran || '-';
                                        row['created_at'] = item.created_at;
                                        return row;
                                    }),
                                    columns: []
                                }] : null}
                                excelFilename={`rekapitulasi_penilaian_${(namaLombaFilter === 'all' ? 'semua_lomba' : namaLombaFilter).toLowerCase().replace(/[^a-z0-9]/g, '_')}`}
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 font-bold">
                            <tr>
                                <th className="px-4 py-3.5 w-12 text-center">#</th>
                                <th className="px-4 py-3.5">Nama Tim</th>
                                <th className="px-4 py-3.5">Juri</th>
                                {parsedCriteria.map((c, idx) => (
                                    <th key={idx} className="px-4 py-3.5 text-center bg-violet-50/50 dark:bg-violet-900/20 text-violet-800 dark:text-violet-300">
                                        <div>{c.judul}</div>
                                        <div className="text-[10px] font-normal text-violet-500">({c.bobot}%)</div>
                                    </th>
                                ))}
                                <th className="px-4 py-3.5 text-center bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300">
                                    Nilai Akhir
                                </th>
                                <th className="px-4 py-3.5">Kritik & Saran</th>
                                <th className="px-4 py-3.5 text-center w-24">Detail</th>
                                <th className="px-4 py-3.5 text-center w-24">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <tr key={`skel-n-${i}`} className="animate-pulse">
                                        <td colSpan={7 + parsedCriteria.length} className="px-4 py-4">
                                            <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded-lg w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredNilai.length === 0 ? (
                                <tr>
                                    <td colSpan={7 + parsedCriteria.length} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        Belum ada data nilai masuk. Gunakan link public juri atau klik tombol "+" pada master form untuk menginput nilai.
                                    </td>
                                </tr>
                            ) : (
                                filteredNilai.map((item, idx) => {
                                    const details = item.detail_nilai_lomba || [];
                                    const detailMap = {};
                                    details.forEach(d => {
                                        detailMap[d.judul_nilai?.trim()] = d.nilai;
                                    });

                                    return (
                                        <tr key={item.id} onClick={() => setSelectedTeamForSubmissionDetail(item.team)} className="cursor-pointer hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors">
                                            <td className="px-4 py-4 text-center font-bold text-gray-400">{idx + 1}</td>
                                            <td className="px-4 py-4">
                                                <div
                                                    className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-left"
                                                >
                                                    {item.team?.gambar ? (
                                                        <img src={item.team.gambar} alt="" className="w-6 h-6 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
                                                    ) : (
                                                        <div className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 font-bold text-xs flex items-center justify-center">
                                                            {item.team?.title?.charAt(0) || 'T'}
                                                        </div>
                                                    )}
                                                    <span>{item.team?.title || 'Tim Tidak Ditemukan'}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-xs font-medium text-gray-600 dark:text-gray-300">
                                                {item.form_nilai_lomba?.nama_juri || '-'}
                                            </td>
                                            {/* Dynamic Criteria Score Columns */}
                                            {parsedCriteria.map((c, i) => {
                                                const scoreVal = detailMap[c.judul.trim()];
                                                return (
                                                    <td key={i} className="px-4 py-4 text-center font-semibold text-gray-800 dark:text-gray-200">
                                                        {scoreVal !== undefined ? (
                                                            <span className="px-2.5 py-1 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-lg text-xs font-bold">
                                                                {scoreVal}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400 text-xs">-</span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                            {/* Nilai Akhir */}
                                            <td className="px-4 py-4 text-center bg-amber-50/50 dark:bg-amber-900/10">
                                                <span className="px-3 py-1.5 bg-amber-500 text-white font-extrabold rounded-xl text-sm shadow-sm">
                                                    {item.nilai_akhir !== null ? Number(item.nilai_akhir).toFixed(2) : '-'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-xs text-gray-600 dark:text-gray-400 max-w-xs">
                                                {item.kritik && <div><strong>Kritik:</strong> {item.kritik}</div>}
                                                {item.saran && <div><strong>Saran:</strong> {item.saran}</div>}
                                                {!item.kritik && !item.saran && <span className="text-gray-400 italic">Tidak ada catatan</span>}
                                            </td>
                                            {/* Tombol Lihat Detail Penilaian */}
                                            <td className="px-4 py-4 text-center">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDetailModalItem(item);
                                                    }}
                                                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-bold rounded-lg border border-gray-200 dark:border-gray-700 transition-colors shadow-xs"
                                                    title="Lihat Detail Penilaian"
                                                >
                                                    Lihat
                                                </button>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <>
                                                        {canEdit && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const formObj = formList.find(f => f.id === item.form_nilai_lomba_id);
                                                                    if (formObj) handleOpenInputNilai(formObj, item);
                                                                }}
                                                                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                                title="Edit Nilai"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setDeleteNilaiItem(item);
                                                            }}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                            title="Hapus Nilai"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </>
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

            {/* SUB-SECTION: DETAIL PENGUMPULAN TIM YANG DIPILIH */}
            {selectedTeamForSubmissionDetail && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden p-6 mt-6 animate-in slide-in-from-top-4 duration-300">
                    <div className="flex justify-between items-center mb-4 border-b pb-3 border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 p-3 rounded-t-xl">
                        <div>
                            <h4 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                                <LinkIcon size={18} className="text-blue-500" />
                                Detail Pengumpulan Karya: <span className="text-violet-600 dark:text-violet-400">{selectedTeamForSubmissionDetail.title}</span>
                            </h4>
                            <p className="text-xs text-gray-500">Cabang Lomba: {selectedTeamForSubmissionDetail.nama_lomba}</p>
                        </div>
                        <button
                            onClick={() => setSelectedTeamForSubmissionDetail(null)}
                            className="text-xs font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg border"
                        >
                            Tutup Detail
                        </button>
                    </div>

                    {subDetailLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto border rounded-xl border-gray-100 dark:border-gray-800">
                            <table className="w-full text-left text-sm border-collapse">
                                <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold border-b border-gray-200 dark:border-gray-700">
                                    <tr>
                                        <th className="px-4 py-3">Nama Tim</th>
                                        <th className="px-4 py-3">Kode Form</th>
                                        <th className="px-4 py-3">Link / File Hasil Pengumpulan</th>
                                        <th className="px-4 py-3">Keterangan</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-gray-100 dark:border-gray-800">
                                        <td className="px-4 py-4 font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            {selectedTeamForSubmissionDetail.gambar ? (
                                                <img src={selectedTeamForSubmissionDetail.gambar} alt="" className="w-8 h-8 rounded-full object-cover border" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 font-bold text-sm flex items-center justify-center">
                                                    {selectedTeamForSubmissionDetail.title?.charAt(0) || 'T'}
                                                </div>
                                            )}
                                            <span>{selectedTeamForSubmissionDetail.title}</span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                                                {selectedTeamForSubmissionDetail.kode_form || '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            {teamSubmissionData?.file_link ? (
                                                <a
                                                    href={teamSubmissionData.file_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                                                >
                                                    <LinkIcon size={14} />
                                                    <span>Buka Hasil Pengumpulan</span>
                                                </a>
                                            ) : (
                                                <span className="text-amber-600 dark:text-amber-400 italic font-medium">Belum mengumpulkan karya</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-xs text-gray-600 dark:text-gray-400 max-w-sm">
                                            {teamSubmissionData?.keterangan || <span className="text-gray-400 italic">Tidak ada keterangan</span>}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* MODAL 1: FORM NILAI LOMBA (MASTER CREATION) */}
            {showFormModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                                <FileText size={20} className="text-violet-500" />
                                {editingFormItem ? 'Edit Form Nilai Juri' : 'Buat Form Nilai Juri Baru'}
                            </h3>
                            <button onClick={() => setShowFormModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">✕</button>
                        </div>

                        <form onSubmit={handleSubmitForm} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                                    Nama Juri / Penilai
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formNamaJuri}
                                    onChange={(e) => setFormNamaJuri(e.target.value)}
                                    placeholder="Contoh: Dr. Supriadi, M.Kom"
                                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-violet-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                                    Nama Lomba Kreativitas
                                </label>
                                <select
                                    value={formNamaLomba}
                                    onChange={(e) => setFormNamaLomba(e.target.value)}
                                    disabled={!!lockedLomba || !!editingFormItem}
                                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-violet-500"
                                >
                                    {KREATIVITAS_LOMBA.map(n => {
                                        const alreadyExists = formList.some(f => f.nama_lomba?.toLowerCase() === n.toLowerCase() && f.id !== editingFormItem?.id);
                                        return (
                                            <option key={n} value={n} disabled={alreadyExists}>
                                                {n} {alreadyExists ? ' (Form Sudah Ada)' : ''}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                                    Link Unique ID (Public)
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        required
                                        value={formLinkId}
                                        onChange={(e) => setFormLinkId(e.target.value)}
                                        className="flex-1 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-mono outline-none focus:ring-2 focus:ring-violet-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setFormLinkId(nanoid(8))}
                                        className="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold border border-gray-200 dark:border-gray-700 hover:bg-gray-200"
                                    >
                                        Acak
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                                    Judul Nilai (Kriteria, pisahkan koma)
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formJudulNilai}
                                    onChange={(e) => setFormJudulNilai(e.target.value)}
                                    placeholder="Kesesuaian Tema, Kreativitas, Estetika"
                                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-violet-500"
                                />
                                <p className="text-[11px] text-gray-500 mt-1">Sistem akan otomatis membuat field input sesuai jumlah kriteria ini.</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                                    Bobot Nilai (Pisahkan koma, contoh: 30, 40, 30)
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formBobotNilai}
                                    onChange={(e) => setFormBobotNilai(e.target.value)}
                                    placeholder="30, 40, 30"
                                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-violet-500"
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
                                <button
                                    type="button"
                                    onClick={() => setShowFormModal(false)}
                                    className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingForm}
                                    className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm shadow-md transition-all disabled:opacity-60"
                                >
                                    {submittingForm ? 'Menyimpan...' : (editingFormItem ? 'Simpan Perubahan' : 'Buat Form')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: INPUT NILAI PER TIM (DYNAMIC FIELDS BASED ON FORM) */}
            {showNilaiModal && activeFormForInput && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                            <div>
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                                    <Star size={20} className="text-amber-500" />
                                    Input Penilaian ({activeFormForInput.nama_juri})
                                </h3>
                                <p className="text-xs text-gray-500">Lomba: {activeFormForInput.nama_lomba}</p>
                            </div>
                            <button onClick={() => setShowNilaiModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">✕</button>
                        </div>

                        <form onSubmit={handleSubmitNilai} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                            {/* Select Team */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                                    Pilih Tim Peserta
                                </label>
                                <select
                                    value={inputTeamId}
                                    onChange={(e) => setInputTeamId(e.target.value)}
                                    required
                                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-violet-500 font-semibold"
                                >
                                    <option value="">-- Pilih Tim --</option>
                                    {teams
                                        .filter(t => t.nama_lomba?.toLowerCase() === activeFormForInput.nama_lomba?.toLowerCase())
                                        .map(t => {
                                            const isEvaluated = evaluatedTeamIds.includes(t.id);
                                            return (
                                                <option key={t.id} value={t.id} disabled={isEvaluated}>
                                                    {t.title} {isEvaluated ? ' (Sudah Dinilai)' : ''}
                                                </option>
                                            );
                                        })
                                    }
                                </select>

                                {/* Display Selected Team's Submission info (selectively fetched) */}
                                {inputTeamId && (
                                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700">
                                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                                            <LinkIcon size={12} className="text-violet-500" />
                                            <span>Link / File Hasil Pengumpulan Tim</span>
                                        </div>
                                        {loadingSubmission ? (
                                            <div className="text-xs text-gray-400 animate-pulse py-1">Memuat data pengumpulan...</div>
                                        ) : selectedTeamSubmission?.file_link ? (
                                            <div className="space-y-1">
                                                <a
                                                    href={selectedTeamSubmission.file_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline break-all"
                                                >
                                                    <LinkIcon size={12} />
                                                    <span>Buka Hasil Pengumpulan</span>
                                                </a>
                                                {selectedTeamSubmission.keterangan && (
                                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 italic">
                                                        Keterangan: "{selectedTeamSubmission.keterangan}"
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-xs text-amber-600 dark:text-amber-400 italic py-1">Belum mengumpulkan karya.</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Dynamic Score Inputs */}
                            <div className="space-y-3 pt-2">
                                <h4 className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                                    Kriteria Penilaian ({activeFormForInput.judul_nilai?.split(',').length} Item)
                                </h4>
                                {activeFormForInput.judul_nilai?.split(',').map((judul, idx) => {
                                    const bobot = activeFormForInput.bobot_nilai?.split(',')[idx] || '0';
                                    return (
                                        <div key={idx} className="bg-gray-50 dark:bg-gray-800/60 p-3 rounded-xl border border-gray-200/80 dark:border-gray-700 flex justify-between items-center gap-3">
                                            <div>
                                                <div className="text-sm font-bold text-gray-800 dark:text-gray-200">{judul.trim()}</div>
                                                <div className="text-[11px] text-gray-500">Bobot: {bobot.trim()}%</div>
                                            </div>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                required
                                                placeholder="0 - 100"
                                                value={inputScores[idx] !== undefined ? inputScores[idx] : ''}
                                                onChange={(e) => setInputScores({ ...inputScores, [idx]: e.target.value })}
                                                className="w-24 p-2.5 text-center font-bold rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-violet-500"
                                            />
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Kritik */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                                    Kritik (Opsional)
                                </label>
                                <textarea
                                    rows="2"
                                    value={inputKritik}
                                    onChange={(e) => setInputKritik(e.target.value)}
                                    placeholder="Catatan kritik untuk karya tim..."
                                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-violet-500"
                                ></textarea>
                            </div>

                            {/* Saran */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                                    Saran (Opsional)
                                </label>
                                <textarea
                                    rows="2"
                                    value={inputSaran}
                                    onChange={(e) => setInputSaran(e.target.value)}
                                    placeholder="Saran masukan untuk pengembangan tim..."
                                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-violet-500"
                                ></textarea>
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
                                <button
                                    type="button"
                                    onClick={() => setShowNilaiModal(false)}
                                    className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingNilai}
                                    className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm shadow-md transition-all disabled:opacity-60"
                                >
                                    {submittingNilai ? 'Menyimpan...' : 'Simpan Penilaian'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL DETAIL PENILAIAN JURI */}
            {detailModalItem && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl max-w-lg w-full overflow-hidden border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-gray-150 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                            <div className="flex items-center gap-3">
                                {detailModalItem.team?.gambar ? (
                                    <img src={detailModalItem.team.gambar} alt="" className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300 font-bold text-base flex items-center justify-center">
                                        {detailModalItem.team?.title?.charAt(0) || 'T'}
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-extrabold text-base text-gray-900 dark:text-white">
                                        {detailModalItem.team?.title || 'Detail Penilaian Tim'}
                                    </h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Juri: <span className="font-semibold text-gray-800 dark:text-gray-200">{detailModalItem.form_nilai_lomba?.nama_juri || '-'}</span> | {detailModalItem.team?.nama_lomba || '-'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setDetailModalItem(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-bold text-lg p-1">✕</button>
                        </div>

                        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                            {/* Nilai Akhir Highlight */}
                            <div className="bg-gray-50 dark:bg-gray-950 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 flex items-center justify-between">
                                <div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Nilai Akhir Tertimbang</span>
                                    <div className="text-xs text-gray-400 mt-0.5">
                                        Tanggal: {detailModalItem.created_at ? new Date(detailModalItem.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                                    </div>
                                </div>
                                <div className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black font-black text-2xl rounded-2xl shadow-xs">
                                    {detailModalItem.nilai_akhir !== null ? Number(detailModalItem.nilai_akhir).toFixed(2) : '-'}
                                </div>
                            </div>

                            {/* Breakdown Kriteria */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                                    <FileText size={14} className="text-orange-500" />
                                    Rincian Nilai per Kriteria
                                </h4>
                                <div className="grid grid-cols-1 gap-2.5">
                                    {(detailModalItem.detail_nilai_lomba || []).map((crit) => (
                                        <div key={crit.id || crit.judul_nilai} className="p-3 bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center justify-between gap-3">
                                            <div>
                                                <div className="text-sm font-bold text-gray-900 dark:text-white">{crit.judul_nilai}</div>
                                                <div className="text-[11px] text-gray-500 font-semibold mt-0.5">Bobot Kriteria: {crit.bobot_nilai}%</div>
                                            </div>
                                            <div className="text-base font-extrabold text-gray-900 dark:text-white bg-white dark:bg-gray-900 px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-800">
                                                {crit.nilai} <span className="text-xs text-gray-400 font-semibold">/100</span>
                                            </div>
                                        </div>
                                    ))}
                                    {(!detailModalItem.detail_nilai_lomba || detailModalItem.detail_nilai_lomba.length === 0) && (
                                        <p className="text-xs text-gray-400 italic">Tidak ada rincian kriteria.</p>
                                    )}
                                </div>
                            </div>

                            {/* Kritik & Saran */}
                            {(detailModalItem.kritik || detailModalItem.saran) && (
                                <div className="space-y-3 pt-2 border-t border-gray-150 dark:border-gray-800">
                                    {detailModalItem.kritik && (
                                        <div className="bg-gray-50 dark:bg-gray-950 p-4 rounded-2xl border border-gray-200 dark:border-gray-800">
                                            <div className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                                <MessageSquare size={12} />
                                                <span>Catatan Kritik Juri</span>
                                            </div>
                                            <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{detailModalItem.kritik}"</p>
                                        </div>
                                    )}
                                    {detailModalItem.saran && (
                                        <div className="bg-gray-50 dark:bg-gray-950 p-4 rounded-2xl border border-gray-200 dark:border-gray-800">
                                            <div className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                                <MessageSquare size={12} />
                                                <span>Saran Masukan Juri</span>
                                            </div>
                                            <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{detailModalItem.saran}"</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-150 dark:border-gray-800 flex justify-end">
                            <button
                                onClick={() => setDetailModalItem(null)}
                                className="px-5 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CONFIRM DELETE MODALS */}
            {deleteFormItem && (
                <ConfirmModal
                    open={!!deleteFormItem}
                    onClose={() => setDeleteFormItem(null)}
                    onConfirm={handleDeleteForm}
                    loading={deletingForm}
                    title="Hapus Form Nilai Juri?"
                    message={`Apakah Anda yakin ingin menghapus form nilai juri "${deleteFormItem.nama_juri}"? Seluruh detail nilai terkait juga akan terhapus.`}
                />
            )}

            {deleteNilaiItem && (
                <ConfirmModal
                    open={!!deleteNilaiItem}
                    onClose={() => setDeleteNilaiItem(null)}
                    onConfirm={handleDeleteNilai}
                    loading={deletingNilai}
                    title="Hapus Penilaian Tim?"
                    message={`Apakah Anda yakin ingin menghapus penilaian untuk tim "${deleteNilaiItem.team?.title}"?`}
                />
            )}
        </div>
    );
}
