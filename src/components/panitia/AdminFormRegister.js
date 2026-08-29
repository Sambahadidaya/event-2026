'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { FileText, Search, Plus, Link as LinkIcon, Image as ImageIcon, Trash2, Copy, Edit, X, Info } from 'lucide-react';
import { uploadFile } from '@/api/supabase/storage';
import { getFormRegisterAll, upsertFormRegister, deleteFormRegister } from '@/api/supabase/admin/peserta';
import { 
    getFormRegisterDetailForEdit, 
    upsertFormRegisterPricing, 
    upsertFormRegisterKampusQuota, 
    upsertFormRegisterAngkatanQuota, 
    getFormRegisterKampusQuota 
} from '@/api/supabase/admin/finance';
import DashboardHeaderFilters from '@/components/panitia/DashboardHeaderFilters';
import TablePagination from '@/components/panitia/TablePagination';
import { formatDateTime } from '@/lib/dashboardUtils';
import { JENIS_LOMBA, NAMA_LOMBA, KAMPUS_DATA } from '@/lib/lombaData';
import { nanoid } from 'nanoid';

const ITEMS_PER_PAGE = 10;

export default function AdminFormRegister({ siteType, hideCreateButton = false, refreshTrigger = 0 }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [lastSyncedAt, setLastSyncedAt] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [showCreateModal, setShowCreateModal] = useState(false);
    
    // Create form states
    const [jenisLomba, setJenisLomba] = useState('');
    const [namaLomba, setNamaLomba] = useState('');
    const [keterangan, setKeterangan] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [butuhBukti, setButuhBukti] = useState(true);
    const [nominal, setNominal] = useState('');
    const [kategoriPendaftar, setKategoriPendaftar] = useState(['Mahasiswa LP3I', 'Siswa', 'Dosen', 'Umum']);
    const [createLoading, setCreateLoading] = useState(false);

    // Edit modal states
    const [showEditModal, setShowEditModal] = useState(false);
    const [editFormId, setEditFormId] = useState(null);
    const [editLoading, setEditLoading] = useState(false);
    const [editSaving, setEditSaving] = useState(false);

    const [editJenisLomba, setEditJenisLomba] = useState('');
    const [editNamaLomba, setEditNamaLomba] = useState('');
    const [editKeterangan, setEditKeterangan] = useState('');
    const [editNominal, setEditNominal] = useState('');
    const [editButuhBukti, setEditButuhBukti] = useState(true);
    const [editIsPublic, setEditIsPublic] = useState(true);
    const [editPakaiGrupKategori, setEditPakaiGrupKategori] = useState(false);
    const [editJenisKategoriList, setEditJenisKategoriList] = useState([]);
    const [editGambarFile, setEditGambarFile] = useState(null);
    const [editGambarUrl, setEditGambarUrl] = useState('');
    const [editKategoriPendaftar, setEditKategoriPendaftar] = useState([]);

    const [editPricingKategoriMap, setEditPricingKategoriMap] = useState({});
    const [editIndividusKategoriMap, setEditIndividusKategoriMap] = useState({});
    const [editMaksAnggotaKategoriMap, setEditMaksAnggotaKategoriMap] = useState({});
    const [editMaksTeamKategoriMap, setEditMaksTeamKategoriMap] = useState({});
    const [editKomisiLvl1KategoriMap, setEditKomisiLvl1KategoriMap] = useState({});
    const [editKomisiLvl2KategoriMap, setEditKomisiLvl2KategoriMap] = useState({});
    const [editKomisiLvl3KategoriMap, setEditKomisiLvl3KategoriMap] = useState({});
    const [editUmumTypeMap, setEditUmumTypeMap] = useState({});

    const [editKampusQuotaEnabled, setEditKampusQuotaEnabled] = useState(false);
    const [editSelectedKampusList, setEditSelectedKampusList] = useState([]);
    const [editKampusQuotaMap, setEditKampusQuotaMap] = useState({});
    const [editAngkatanQuotaMap, setEditAngkatanQuotaMap] = useState({});

    const fetchData = useCallback(async () => {
        setLoading(true);
        const formsData = await getFormRegisterAll(siteType);
        if (formsData) {
            setData(formsData);
            setLastSyncedAt(Date.now());
        }
        setLoading(false);
    }, [siteType]);

    useEffect(() => {
        fetchData();
    }, [fetchData, refreshTrigger]);

    const filteredData = useMemo(() => {
        const searchLower = searchQuery.toLowerCase();
        if (searchQuery) {
            return data.filter(item =>
                (item.nama_lomba && item.nama_lomba.toLowerCase().includes(searchLower)) ||
                (item.jenis_lomba && item.jenis_lomba.toLowerCase().includes(searchLower))
            );
        }
        return data;
    }, [data, searchQuery]);

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE) || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedData = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const handleCreateForm = async (e) => {
        e.preventDefault();
        if (!jenisLomba || !namaLomba) {
            window.alert('Mohon lengkapi jenis dan nama lomba.');
            return;
        }
        if (kategoriPendaftar.length === 0) {
            window.alert('Mohon pilih minimal 1 kategori pendaftar.');
            return;
        }

        setCreateLoading(true);

        let gambarUrl = null;
        if (imageFile) {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `form-headers/${fileName}`;
            const formDataForUpload = new FormData();
            formDataForUpload.append('file', imageFile);
            formDataForUpload.append('bucket', 'images');
            formDataForUpload.append('path', filePath);

            const uploadRes = await uploadFile(formDataForUpload);

            if (!uploadRes.success) {
                console.error('Upload Error:', uploadRes.error);
                window.alert('Gagal mengupload gambar. Pastikan bucket "images" tersedia.');
                setCreateLoading(false);
                return;
            }

            gambarUrl = uploadRes.publicUrl;
        }

        const linkId = nanoid(64);
        const finalNominal = nominal ? parseInt(nominal, 10) : 0;

        const res = await upsertFormRegister({
            jenis_lomba: jenisLomba,
            nama_lomba: namaLomba,
            keterangan: keterangan,
            butuh_bukti: butuhBukti,
            nominal: finalNominal,
            kategori_pendaftar: kategoriPendaftar.join(','),
            link_id: linkId,
            gambar: gambarUrl
        });

        if (!res.success) {
            console.error(res.error);
            window.alert('Gagal membuat form registrasi.');
        } else {
            setData([res.data, ...data]);
            setShowCreateModal(false);
            setJenisLomba('');
            setNamaLomba('');
            setKeterangan('');
            setButuhBukti(true);
            setNominal('');
            setKategoriPendaftar(['Mahasiswa LP3I', 'Siswa', 'Dosen', 'Umum']);
            setImageFile(null);
            window.alert('Berhasil membuat form pendaftaran baru!');
        }

        setCreateLoading(false);
    };

    const handleOpenEditModal = async (item) => {
        setEditFormId(item.id);
        setEditJenisLomba(item.jenis_lomba || '');
        setEditNamaLomba(item.nama_lomba || '');
        setEditKeterangan(item.keterangan || '');
        setEditNominal(item.nominal !== undefined && item.nominal !== null ? item.nominal.toString() : '');
        setEditButuhBukti(item.butuh_bukti !== undefined ? item.butuh_bukti : true);
        setEditIsPublic(item.is_public !== undefined ? item.is_public : true);
        setEditGambarUrl(item.gambar || '');
        setEditGambarFile(null);

        const jenisKatArr = item.jenis_kategori ? item.jenis_kategori.split(',').map(s => s.trim()).filter(Boolean) : [];
        setEditPakaiGrupKategori(jenisKatArr.length > 0);
        setEditJenisKategoriList(jenisKatArr);

        const katList = item.kategori_pendaftar ? item.kategori_pendaftar.split(',').map(s => s.trim()).filter(Boolean) : [];
        setEditKategoriPendaftar(katList);

        setShowEditModal(true);
        setEditLoading(true);

        try {
            const res = await getFormRegisterDetailForEdit(item.id);
            if (res.success && res.data) {
                const pricingList = res.data.pricing || [];
                const kampusQuotas = res.data.kampusQuotas || [];

                const pMap = {};
                const indMap = {};
                const maMap = {};
                const mtMap = {};
                const k1Map = {};
                const k2Map = {};
                const k3Map = {};
                const uTypeMap = {};

                pricingList.forEach(p => {
                    pMap[p.kategori] = p.nominal !== undefined && p.nominal !== null ? p.nominal.toString() : '';
                    indMap[p.kategori] = p.individu !== undefined ? p.individu : true;
                    maMap[p.kategori] = p.maks_anggota !== undefined && p.maks_anggota !== null ? p.maks_anggota.toString() : '1';
                    mtMap[p.kategori] = p.maks_team !== undefined && p.maks_team !== null ? p.maks_team.toString() : '1';
                    k1Map[p.kategori] = p.komisi_sales_lvl1 !== undefined && p.komisi_sales_lvl1 !== null ? p.komisi_sales_lvl1.toString() : '0';
                    k2Map[p.kategori] = p.komisi_sales_lvl2 !== undefined && p.komisi_sales_lvl2 !== null ? p.komisi_sales_lvl2.toString() : '0';
                    k3Map[p.kategori] = p.komisi_sales_lvl3 !== undefined && p.komisi_sales_lvl3 !== null ? p.komisi_sales_lvl3.toString() : '0';
                    if (p.umum_type) {
                        uTypeMap[p.kategori] = p.umum_type;
                    }
                });

                setEditPricingKategoriMap(pMap);
                setEditIndividusKategoriMap(indMap);
                setEditMaksAnggotaKategoriMap(maMap);
                setEditMaksTeamKategoriMap(mtMap);
                setEditKomisiLvl1KategoriMap(k1Map);
                setEditKomisiLvl2KategoriMap(k2Map);
                setEditKomisiLvl3KategoriMap(k3Map);
                setEditUmumTypeMap(uTypeMap);

                if (kampusQuotas.length > 0) {
                    setEditKampusQuotaEnabled(true);
                    const selectedK = [];
                    const kqMap = {};
                    const aqMap = {};

                    kampusQuotas.forEach(kq => {
                        selectedK.push(kq.nama_kampus);
                        kqMap[kq.nama_kampus] = kq.maks_team !== undefined && kq.maks_team !== null ? kq.maks_team.toString() : '1';
                        const angkatans = kq.form_register_kampus_quota_angkatan || [];
                        aqMap[kq.nama_kampus] = angkatans.map(a => ({
                            angkatan: a.angkatan,
                            maks_team: a.maks_team !== undefined && a.maks_team !== null ? a.maks_team : 1
                        }));
                    });

                    setEditSelectedKampusList(selectedK);
                    setEditKampusQuotaMap(kqMap);
                    setEditAngkatanQuotaMap(aqMap);
                } else {
                    setEditKampusQuotaEnabled(false);
                    setEditSelectedKampusList([]);
                    setEditKampusQuotaMap({});
                    setEditAngkatanQuotaMap({});
                }
            }
        } catch (err) {
            console.error('Error fetching edit detail:', err);
            window.alert('Gagal mengambil data pricing form.');
        } finally {
            setEditLoading(false);
        }
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        if (editKategoriPendaftar.length === 0) {
            window.alert('Mohon pilih minimal 1 kategori pendaftar.');
            return;
        }

        setEditSaving(true);

        try {
            let uploadedUrl = editGambarUrl;
            if (editGambarFile) {
                const formDataForUpload = new FormData();
                formDataForUpload.append('file', editGambarFile);
                formDataForUpload.append('bucket', 'images');
                const fileExt = editGambarFile.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                formDataForUpload.append('path', `form-headers/${fileName}`);

                const uploadRes = await uploadFile(formDataForUpload);
                if (!uploadRes.success) {
                    window.alert('Gagal mengupload gambar header baru.');
                    setEditSaving(false);
                    return;
                }
                uploadedUrl = uploadRes.publicUrl;
            }

            const finalNominal = editNominal ? parseInt(editNominal, 10) : 0;

            // 1. Update form_register
            const res = await upsertFormRegister({
                jenis_lomba: editJenisLomba || null,
                nama_lomba: editNamaLomba || null,
                keterangan: editKeterangan,
                butuh_bukti: editButuhBukti,
                nominal: finalNominal,
                kategori_pendaftar: editKategoriPendaftar.join(','),
                gambar: uploadedUrl || null,
                jenis_kategori: editPakaiGrupKategori ? editJenisKategoriList.join(',') : null,
                is_public: editIsPublic
            }, editFormId);

            if (!res.success) {
                window.alert('Gagal memperbarui form registrasi.');
                setEditSaving(false);
                return;
            }

            // 2. Save pricing per category
            const pricingList = editKategoriPendaftar.map(kat => {
                const isIndividu = editIndividusKategoriMap[kat] !== undefined ? editIndividusKategoriMap[kat] : true;
                let finalMaksTeam = editMaksTeamKategoriMap[kat] !== undefined && editMaksTeamKategoriMap[kat] !== '' ? parseInt(editMaksTeamKategoriMap[kat], 10) : 1;

                if (kat === 'Mahasiswa LP3I' && editKampusQuotaEnabled) {
                    let totalSum = 0;
                    editSelectedKampusList.forEach(kampusName => {
                        const val = editKampusQuotaMap[kampusName];
                        if (val && !isNaN(parseInt(val, 10))) {
                            totalSum += parseInt(val, 10);
                        }
                    });
                    if (totalSum > 0) finalMaksTeam = totalSum;
                }

                return {
                    kategori: kat,
                    nominal: editPricingKategoriMap[kat] !== undefined && editPricingKategoriMap[kat] !== ''
                        ? parseInt(editPricingKategoriMap[kat], 10)
                        : finalNominal,
                    individu: isIndividu,
                    maks_anggota: isIndividu ? 1 : (editMaksAnggotaKategoriMap[kat] !== undefined && editMaksAnggotaKategoriMap[kat] !== '' ? parseInt(editMaksAnggotaKategoriMap[kat], 10) : 1),
                    maks_team: finalMaksTeam,
                    komisi_sales_lvl1: editKomisiLvl1KategoriMap[kat] !== undefined && editKomisiLvl1KategoriMap[kat] !== '' ? parseInt(editKomisiLvl1KategoriMap[kat], 10) : 0,
                    komisi_sales_lvl2: editKomisiLvl2KategoriMap[kat] !== undefined && editKomisiLvl2KategoriMap[kat] !== '' ? parseInt(editKomisiLvl2KategoriMap[kat], 10) : 0,
                    komisi_sales_lvl3: editKomisiLvl3KategoriMap[kat] !== undefined && editKomisiLvl3KategoriMap[kat] !== '' ? parseInt(editKomisiLvl3KategoriMap[kat], 10) : 0,
                    umum_type: kat === 'Umum' ? (editUmumTypeMap['Umum'] || 'keduanya') : null
                };
            });

            const resPricing = await upsertFormRegisterPricing(editFormId, pricingList);

            // 3. Save kampus & angkatan quota if enabled
            if (resPricing.success && editKampusQuotaEnabled) {
                const pricingLP3I = (resPricing.data || []).find(p => p.kategori === 'Mahasiswa LP3I');
                if (pricingLP3I) {
                    const kampusQuotaList = editSelectedKampusList.map(kampus => ({
                        nama_kampus: kampus,
                        maks_team: editKampusQuotaMap[kampus] !== undefined && editKampusQuotaMap[kampus] !== '' ? parseInt(editKampusQuotaMap[kampus], 10) : 1
                    })).filter(k => k.maks_team > 0);

                    if (kampusQuotaList.length > 0) {
                        const quotaRes = await upsertFormRegisterKampusQuota(pricingLP3I.id, kampusQuotaList);
                        if (quotaRes.success) {
                            const createdQuotas = await getFormRegisterKampusQuota(pricingLP3I.id);
                            for (const q of (createdQuotas || [])) {
                                const listForKampus = editAngkatanQuotaMap[q.nama_kampus] || [];
                                if (listForKampus.length > 0) {
                                    await upsertFormRegisterAngkatanQuota(q.id, listForKampus);
                                }
                            }
                        }
                    }
                }
            }

            window.alert('Berhasil memperbarui form dan pengaturan kuota!');
            setShowEditModal(false);
            fetchData();
        } catch (error) {
            console.error('Error saving edit:', error);
            window.alert('Terjadi kesalahan saat menyimpan form.');
        } finally {
            setEditSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Hapus form ini? Pendaftar menggunakan link ini tidak akan bisa mengakses form lagi.')) return;
        
        const res = await deleteFormRegister(id);
        if (res.success) {
            setData(data.filter(d => d.id !== id));
        } else {
            window.alert('Gagal menghapus form.');
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        window.alert('Link tersalin!');
    };

    const extraFilters = hideCreateButton ? null : (
        <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center shadow-sm"
        >
            <Plus size={16} />
            <span>Buat Form Baru</span>
        </button>
    );

    return (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
            <DashboardHeaderFilters
                title="Manajemen Form Register"
                subtitle="Buat dan kelola link pendaftaran dinamis per lomba"
                icon={FileText}
                showSiteFilter={false}
                extraFilters={extraFilters}
                onRefresh={fetchData}
                loading={loading}
                lastSyncedAt={lastSyncedAt}
            />

            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <h3 className="font-bold text-base sm:text-lg text-gray-800 dark:text-gray-200">Daftar Form</h3>
                    <div className="relative flex-1 sm:flex-none sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Cari form lomba..."
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
                                <th className="px-4 py-3 font-medium">Gambar</th>
                                <th className="px-4 py-3 font-medium">Nama Lomba</th>
                                <th className="px-4 py-3 font-medium">Jenis Lomba</th>
                                <th className="px-4 py-3 font-medium">Link Akses</th>
                                <th className="px-4 py-3 font-medium w-44">Dibuat Pada</th>
                                <th className="px-4 py-3 font-medium w-28 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {loading && data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">Memuat data form...</td>
                                </tr>
                            ) : paginatedData.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center text-gray-500">Tidak ada form ditemukan.</td>
                                </tr>
                            ) : paginatedData.map((item, index) => (
                                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="px-4 py-3 text-center text-gray-500 font-medium">{startIndex + index + 1}</td>
                                    <td className="px-4 py-3">
                                        {item.gambar ? (
                                            <img src={item.gambar} alt="Header" className="w-12 h-12 rounded-lg object-cover border border-gray-200 dark:border-gray-700" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                                                <ImageIcon size={20} />
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-200">{item.nama_lomba}</td>
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">{item.jenis_lomba}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="text" 
                                                readOnly 
                                                value={`/pose/register/${item.link_id}`}
                                                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-xs w-48 text-gray-500"
                                            />
                                            <button 
                                                onClick={() => copyToClipboard(`${window.location.origin}/pose/register/${item.link_id}`)}
                                                className="text-gray-500 hover:text-blue-500 p-1"
                                                title="Copy full link"
                                            >
                                                <Copy size={14} />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{formatDateTime(item.created_at)}</td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => handleOpenEditModal(item)}
                                                className="inline-flex items-center justify-center p-1.5 text-xs font-medium rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-colors"
                                                title="Edit Form & Kuota"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(item.id)}
                                                className="inline-flex items-center justify-center p-1.5 text-xs font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 transition-colors"
                                                title="Hapus Form"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
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
                    colSpan={7}
                />
            </div>

            {/* EDIT MODAL */}
            {showEditModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <form onSubmit={handleSaveEdit} className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-2xl flex flex-col border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-hidden">
                        <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                            <div>
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                                    <Edit size={20} className="text-blue-500" /> Edit Form & Pengaturan Kuota
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{editNamaLomba || 'Form Register'}</p>
                            </div>
                            <button type="button" onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <X size={20} />
                            </button>
                        </div>

                        {editLoading ? (
                            <div className="p-12 text-center text-gray-500">Memuat detail form & kuota...</div>
                        ) : (
                            <div className="p-4 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar">
                                {/* LOMBA INFO */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Jenis Lomba</label>
                                        <select
                                            value={editJenisLomba}
                                            onChange={(e) => {
                                                setEditJenisLomba(e.target.value);
                                                setEditNamaLomba('');
                                            }}
                                            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="" disabled>Pilih Jenis Lomba</option>
                                            {JENIS_LOMBA.map(j => <option key={j} value={j}>{j}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Nama Lomba</label>
                                        <select
                                            value={editNamaLomba}
                                            onChange={(e) => setEditNamaLomba(e.target.value)}
                                            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="" disabled>Pilih Nama Lomba</option>
                                            {NAMA_LOMBA[editJenisLomba]?.map(n => <option key={n} value={n}>{n}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Keterangan / Juknis</label>
                                    <textarea
                                        value={editKeterangan}
                                        onChange={(e) => setEditKeterangan(e.target.value)}
                                        placeholder="Syarat, juknis, atau instruksi pembayaran..."
                                        rows="2"
                                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Nominal Dasar Default (Opsional)</label>
                                    <input
                                        type="number"
                                        value={editNominal}
                                        onChange={(e) => setEditNominal(e.target.value)}
                                        placeholder="Contoh: 50000"
                                        min="0"
                                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>

                                {/* KATEGORI PENDAFTAR */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Kategori Pendaftar</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {['Mahasiswa LP3I', 'Siswa', 'Dosen', 'Umum', 'Alumni LP3I'].map(kat => (
                                            <label key={kat} className="flex items-center gap-2 p-2 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={editKategoriPendaftar.includes(kat)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setEditKategoriPendaftar([...editKategoriPendaftar, kat]);
                                                        else setEditKategoriPendaftar(editKategoriPendaftar.filter(k => k !== kat));
                                                    }}
                                                    className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">{kat}</span>
                                            </label>
                                        ))}
                                    </div>

                                    {/* DETAIL PENGATURAN PER KATEGORI */}
                                    {editKategoriPendaftar.length > 0 && (
                                        <div className="mt-4 space-y-3">
                                            <div className="border-b border-gray-200 dark:border-gray-700 pb-1">
                                                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">Pengaturan Detail per Kategori</span>
                                            </div>

                                            {editKategoriPendaftar.map(kat => {
                                                const isIndividu = editIndividusKategoriMap[kat] !== undefined ? editIndividusKategoriMap[kat] : true;
                                                return (
                                                    <div key={`edit-kat-${kat}`} className="p-3 bg-gray-50/80 dark:bg-gray-800/40 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-3">
                                                        <div className="flex items-center justify-between border-b border-gray-200/60 dark:border-gray-700 pb-2">
                                                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{kat}</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] text-gray-500 font-medium">Individu?</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setEditIndividusKategoriMap({ ...editIndividusKategoriMap, [kat]: !isIndividu })}
                                                                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                                        isIndividu ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'
                                                                    }`}
                                                                >
                                                                    <span
                                                                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                                            isIndividu ? 'translate-x-4' : 'translate-x-0'
                                                                        }`}
                                                                    />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-3 gap-2">
                                                            <div>
                                                                <label className="block text-[10px] text-gray-500 font-semibold mb-1">Nominal (Rp)</label>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    placeholder={`(${editNominal || 0})`}
                                                                    value={editPricingKategoriMap[kat] !== undefined ? editPricingKategoriMap[kat] : ''}
                                                                    onChange={(e) => setEditPricingKategoriMap({ ...editPricingKategoriMap, [kat]: e.target.value })}
                                                                    className="w-full px-2.5 py-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] text-gray-500 font-semibold mb-1">Maks Anggota</label>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    disabled={isIndividu}
                                                                    value={isIndividu ? 1 : (editMaksAnggotaKategoriMap[kat] !== undefined ? editMaksAnggotaKategoriMap[kat] : '')}
                                                                    onChange={(e) => setEditMaksAnggotaKategoriMap({ ...editMaksAnggotaKategoriMap, [kat]: e.target.value })}
                                                                    className={`w-full px-2.5 py-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 ${isIndividu ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] text-gray-500 font-semibold mb-1">Maks Team</label>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    value={kat === 'Mahasiswa LP3I' && editKampusQuotaEnabled ? '' : (editMaksTeamKategoriMap[kat] !== undefined ? editMaksTeamKategoriMap[kat] : '')}
                                                                    onChange={(e) => setEditMaksTeamKategoriMap({ ...editMaksTeamKategoriMap, [kat]: e.target.value })}
                                                                    placeholder={kat === 'Mahasiswa LP3I' && editKampusQuotaEnabled ? 'Auto Sum' : 'Maks'}
                                                                    disabled={kat === 'Mahasiswa LP3I' && editKampusQuotaEnabled}
                                                                    className={`w-full px-2.5 py-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 ${kat === 'Mahasiswa LP3I' && editKampusQuotaEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* KUOTA KAMPUS & ANGKATAN KHUSUS MAHASISWA LP3I */}
                                                        {kat === 'Mahasiswa LP3I' && (
                                                            <div className="border-t border-gray-200 dark:border-gray-700/60 pt-3 mt-2">
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <div>
                                                                        <span className="block text-xs font-bold text-gray-800 dark:text-gray-200">Kuota Per Kampus & Angkatan</span>
                                                                        <span className="block text-[10px] text-gray-500">Maks team dihitung otomatis dari total per kampus</span>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setEditKampusQuotaEnabled(!editKampusQuotaEnabled)}
                                                                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                                            editKampusQuotaEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'
                                                                        }`}
                                                                    >
                                                                        <span
                                                                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                                                editKampusQuotaEnabled ? 'translate-x-4' : 'translate-x-0'
                                                                            }`}
                                                                        />
                                                                    </button>
                                                                </div>

                                                                {editKampusQuotaEnabled && (
                                                                    <div className="space-y-3 mt-3">
                                                                        <div>
                                                                            <label className="block text-[10px] text-gray-500 font-semibold mb-1.5">Pilih Kampus yang Diaktifkan Limit:</label>
                                                                            <div className="flex flex-wrap gap-1.5 p-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl">
                                                                                {KAMPUS_DATA.filter(k => k !== 'Lainnya').map(kampus => {
                                                                                    const isSelected = editSelectedKampusList.includes(kampus);
                                                                                    return (
                                                                                        <label key={`edit-check-kampus-${kampus}`} className={`flex items-center justify-center px-2.5 py-1 border rounded-lg text-[10px] font-semibold cursor-pointer transition-all ${isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50'}`}>
                                                                                            <input
                                                                                                type="checkbox"
                                                                                                checked={isSelected}
                                                                                                onChange={(e) => {
                                                                                                    if (e.target.checked) {
                                                                                                        setEditSelectedKampusList([...editSelectedKampusList, kampus]);
                                                                                                    } else {
                                                                                                        setEditSelectedKampusList(editSelectedKampusList.filter(k => k !== kampus));
                                                                                                    }
                                                                                                }}
                                                                                                className="hidden"
                                                                                            />
                                                                                            {kampus}
                                                                                        </label>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        </div>

                                                                        {editSelectedKampusList.length > 0 && (
                                                                            <div className="space-y-2.5 p-2.5 bg-blue-50/30 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/40 rounded-xl">
                                                                                {editSelectedKampusList.map(kampusName => {
                                                                                    const currentAngkatanList = editAngkatanQuotaMap[kampusName] || [];
                                                                                    return (
                                                                                        <div key={`edit-quota-kampus-${kampusName}`} className="p-2.5 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2">
                                                                                            <div className="flex items-center justify-between">
                                                                                                <label className="text-xs font-bold text-gray-800 dark:text-gray-200">
                                                                                                    {kampusName}
                                                                                                </label>
                                                                                                <div className="flex items-center gap-1.5">
                                                                                                    <span className="text-[10px] text-gray-500 font-medium">Maks Total:</span>
                                                                                                    <input
                                                                                                        type="number"
                                                                                                        min="1"
                                                                                                        placeholder="Maks"
                                                                                                        value={editKampusQuotaMap[kampusName] !== undefined ? editKampusQuotaMap[kampusName] : ''}
                                                                                                        onChange={(e) => setEditKampusQuotaMap({ ...editKampusQuotaMap, [kampusName]: e.target.value })}
                                                                                                        className="w-16 px-2 py-0.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500"
                                                                                                    />
                                                                                                </div>
                                                                                            </div>

                                                                                            {/* Angkatan Quota Section */}
                                                                                            <div className="pt-1.5 border-t border-gray-100 dark:border-gray-800">
                                                                                                <div className="flex items-center justify-between mb-1.5">
                                                                                                    <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-400">Limit Khusus Angkatan (Opsional)</span>
                                                                                                    <button
                                                                                                        type="button"
                                                                                                        onClick={() => {
                                                                                                            const newList = [...currentAngkatanList, { angkatan: '2025', maks_team: 1 }];
                                                                                                            setEditAngkatanQuotaMap({ ...editAngkatanQuotaMap, [kampusName]: newList });
                                                                                                        }}
                                                                                                        className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                                                                                                    >
                                                                                                        + Tambah Angkatan
                                                                                                    </button>
                                                                                                </div>

                                                                                                {currentAngkatanList.length > 0 && (
                                                                                                    <div className="space-y-1.5">
                                                                                                        {currentAngkatanList.map((item, aIdx) => (
                                                                                                            <div key={aIdx} className="flex items-center gap-2">
                                                                                                                <select
                                                                                                                    value={item.angkatan}
                                                                                                                    onChange={(e) => {
                                                                                                                        const updated = [...currentAngkatanList];
                                                                                                                        updated[aIdx].angkatan = e.target.value;
                                                                                                                        setEditAngkatanQuotaMap({ ...editAngkatanQuotaMap, [kampusName]: updated });
                                                                                                                    }}
                                                                                                                    className="px-2 py-0.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-[11px]"
                                                                                                                >
                                                                                                                    <option value="2026">2026</option>
                                                                                                                    <option value="2025">2025</option>
                                                                                                                    <option value="2024">2024</option>
                                                                                                                    <option value="2023">2023</option>
                                                                                                                </select>
                                                                                                                <input
                                                                                                                    type="number"
                                                                                                                    min="0"
                                                                                                                    placeholder="Maks Tim"
                                                                                                                    value={item.maks_team}
                                                                                                                    onChange={(e) => {
                                                                                                                        const updated = [...currentAngkatanList];
                                                                                                                        updated[aIdx].maks_team = e.target.value;
                                                                                                                        setEditAngkatanQuotaMap({ ...editAngkatanQuotaMap, [kampusName]: updated });
                                                                                                                    }}
                                                                                                                    className="w-16 px-2 py-0.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-[11px]"
                                                                                                                />
                                                                                                                <button
                                                                                                                    type="button"
                                                                                                                    onClick={() => {
                                                                                                                        const updated = currentAngkatanList.filter((_, i) => i !== aIdx);
                                                                                                                        setEditAngkatanQuotaMap({ ...editAngkatanQuotaMap, [kampusName]: updated });
                                                                                                                    }}
                                                                                                                    className="text-red-500 hover:text-red-700 text-xs px-1"
                                                                                                                >
                                                                                                                    ✕
                                                                                                                </button>
                                                                                                            </div>
                                                                                                        ))}
                                                                                                    </div>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* UMUM TYPE */}
                                                        {kat === 'Umum' && (
                                                            <div className="border-t border-gray-200 dark:border-gray-700/60 pt-2">
                                                                <label className="block text-[10px] text-gray-500 font-semibold mb-1">Tipe Kategori Umum</label>
                                                                <select
                                                                    value={editUmumTypeMap['Umum'] || 'keduanya'}
                                                                    onChange={(e) => setEditUmumTypeMap({ ...editUmumTypeMap, ['Umum']: e.target.value })}
                                                                    className="w-full px-2.5 py-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-xs outline-none"
                                                                >
                                                                    <option value="keduanya">Umum (Mahasiswa & Non-Mahasiswa)</option>
                                                                    <option value="mahasiswa_saja">Khusus Mahasiswa</option>
                                                                    <option value="non_mahasiswa_saja">Khusus Non-Mahasiswa</option>
                                                                </select>
                                                            </div>
                                                        )}

                                                        {/* KOMISI SALES */}
                                                        <div className="grid grid-cols-3 gap-2 border-t border-gray-200 dark:border-gray-700/60 pt-2">
                                                            <div>
                                                                <label className="block text-[9px] text-gray-500 font-semibold mb-1">Komisi Lvl 1 (%)</label>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max="100"
                                                                    placeholder="0"
                                                                    value={editKomisiLvl1KategoriMap[kat] !== undefined ? editKomisiLvl1KategoriMap[kat] : ''}
                                                                    onChange={(e) => setEditKomisiLvl1KategoriMap({ ...editKomisiLvl1KategoriMap, [kat]: e.target.value })}
                                                                    className="w-full px-2 py-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-xs outline-none"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[9px] text-gray-500 font-semibold mb-1">Komisi Lvl 2 (%)</label>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max="100"
                                                                    placeholder="0"
                                                                    value={editKomisiLvl2KategoriMap[kat] !== undefined ? editKomisiLvl2KategoriMap[kat] : ''}
                                                                    onChange={(e) => setEditKomisiLvl2KategoriMap({ ...editKomisiLvl2KategoriMap, [kat]: e.target.value })}
                                                                    className="w-full px-2 py-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-xs outline-none"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[9px] text-gray-500 font-semibold mb-1">Komisi Lvl 3 (%)</label>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max="100"
                                                                    placeholder="0"
                                                                    value={editKomisiLvl3KategoriMap[kat] !== undefined ? editKomisiLvl3KategoriMap[kat] : ''}
                                                                    onChange={(e) => setEditKomisiLvl3KategoriMap({ ...editKomisiLvl3KategoriMap, [kat]: e.target.value })}
                                                                    className="w-full px-2 py-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-xs outline-none"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* GRUP PUTRA / PUTRI */}
                                <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={editPakaiGrupKategori}
                                            onChange={(e) => {
                                                setEditPakaiGrupKategori(e.target.checked);
                                                if (!e.target.checked) setEditJenisKategoriList([]);
                                            }}
                                            className="w-4 h-4 text-blue-600 rounded"
                                        />
                                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Grup Kategori Putra / Putri</span>
                                    </label>
                                    {editPakaiGrupKategori && (
                                        <div className="flex gap-4 pl-6">
                                            {['putra', 'putri'].map(opt => (
                                                <label key={opt} className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-gray-600 dark:text-gray-400">
                                                    <input
                                                        type="checkbox"
                                                        checked={editJenisKategoriList.includes(opt)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) setEditJenisKategoriList([...editJenisKategoriList, opt]);
                                                            else setEditJenisKategoriList(editJenisKategoriList.filter(x => x !== opt));
                                                        }}
                                                        className="w-3.5 h-3.5 text-blue-600 rounded"
                                                    />
                                                    <span>{opt.charAt(0).toUpperCase() + opt.slice(1)}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* IS PUBLIC & BUKTI BAYAR */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <label className="flex items-center gap-2 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <input
                                            type="checkbox"
                                            checked={editIsPublic}
                                            onChange={(e) => setEditIsPublic(e.target.checked)}
                                            className="w-4 h-4 text-blue-600 rounded"
                                        />
                                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Tampilkan di Publik (is_public)</span>
                                    </label>
                                    <label className="flex items-center gap-2 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <input
                                            type="checkbox"
                                            checked={editButuhBukti}
                                            onChange={(e) => setEditButuhBukti(e.target.checked)}
                                            className="w-4 h-4 text-blue-600 rounded"
                                        />
                                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Wajib Upload Bukti Bayar</span>
                                    </label>
                                </div>

                                {/* GAMBAR HEADER */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Ganti Gambar Header (Opsional)</label>
                                    {editGambarUrl && (
                                        <div className="mb-2 flex items-center gap-2">
                                            <img src={editGambarUrl} alt="Header" className="w-16 h-10 object-cover rounded-lg border" />
                                            <span className="text-[10px] text-gray-500">Gambar saat ini</span>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setEditGambarFile(e.target.files[0])}
                                        className="w-full text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="p-4 sm:p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowEditModal(false)}
                                disabled={editSaving}
                                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={editSaving || editLoading}
                                className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                {editSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* CREATE MODAL */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <form onSubmit={handleCreateForm} className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg flex flex-col border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-hidden">
                        <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                                <Plus size={20} className="text-blue-500" /> Buat Form Baru
                            </h3>
                            <button type="button" onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                &times;
                            </button>
                        </div>
                        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jenis Lomba</label>
                                <select 
                                    value={jenisLomba} 
                                    onChange={(e) => {
                                        setJenisLomba(e.target.value);
                                        setNamaLomba('');
                                    }}
                                    required
                                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="" disabled>Pilih Jenis Lomba</option>
                                    {JENIS_LOMBA.map(j => <option key={j} value={j}>{j}</option>)}
                                </select>
                            </div>
                            
                            {jenisLomba && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Lomba</label>
                                    <select 
                                        value={namaLomba} 
                                        onChange={(e) => setNamaLomba(e.target.value)}
                                        required
                                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="" disabled>Pilih Nama Lomba</option>
                                        {NAMA_LOMBA[jenisLomba]?.map(n => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Keterangan Tambahan / Syarat & Ketentuan</label>
                                <textarea
                                    value={keterangan}
                                    onChange={(e) => setKeterangan(e.target.value)}
                                    placeholder="Opsional. Masukkan info syarat lomba, tautan juknis, atau instruksi pembayaran."
                                    rows="3"
                                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Kategori Pendaftar (Minimal 1)</label>
                                <div className="space-y-2">
                                    {['Mahasiswa LP3I', 'Siswa', 'Dosen', 'Umum'].map(kat => (
                                        <label key={kat} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <div className="relative flex items-center justify-center">
                                                <input
                                                    type="checkbox"
                                                    checked={kategoriPendaftar.includes(kat)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setKategoriPendaftar([...kategoriPendaftar, kat]);
                                                        } else {
                                                            setKategoriPendaftar(kategoriPendaftar.filter(k => k !== kat));
                                                        }
                                                    }}
                                                    className="peer sr-only"
                                                />
                                                <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all flex items-center justify-center">
                                                    <svg className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{kat}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nominal Pembayaran (Opsional)</label>
                                <input
                                    type="number"
                                    value={nominal}
                                    onChange={(e) => setNominal(e.target.value)}
                                    placeholder="Contoh: 50000"
                                    min="0"
                                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <div className="relative flex items-center justify-center">
                                        <input 
                                            type="checkbox" 
                                            checked={butuhBukti}
                                            onChange={(e) => setButuhBukti(e.target.checked)}
                                            className="peer sr-only"
                                        />
                                        <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all flex items-center justify-center">
                                            <svg className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Wajib Upload Bukti Pembayaran</span>
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gambar Header (Opsional)</label>
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={(e) => setImageFile(e.target.files[0])}
                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                            </div>
                            
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-xl text-sm flex items-start gap-2">
                                <LinkIcon size={16} className="mt-0.5 shrink-0" />
                                <p>Link akses unik sepanjang 64 karakter (nanoid) akan dibuat secara otomatis saat Anda menyimpan.</p>
                            </div>
                        </div>
                        <div className="p-4 sm:p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowCreateModal(false)}
                                disabled={createLoading}
                                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 disabled:opacity-50"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={createLoading}
                                className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                {createLoading ? 'Menyimpan...' : 'Simpan Form'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
