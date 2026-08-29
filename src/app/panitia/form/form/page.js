'use client';

import { useEffect, useState } from 'react';
import { FileText, Plus, Search, Link as LinkIcon, Filter, Info, Trash2, X } from 'lucide-react';
import AdminFormWajib from '@/components/panitia/AdminFormWajib';
import AdminFormRegister from '@/components/panitia/AdminFormRegister';
import AdminFormPengumpulan from '@/components/panitia/AdminFormPengumpulan';
import DashboardHeaderFilters from '@/components/panitia/DashboardHeaderFilters';
import DashboardSelect from '@/components/panitia/DashboardSelect';
import { getCurrentAdmin } from '@/api/supabase/admin/auth';
import { JENIS_LOMBA, NAMA_LOMBA, KODE_JENIS_LOMBA, KODE_NAMA_LOMBA, KAMPUS_DATA } from '@/lib/lombaData';
import { generateKodeFormWajib, generateKodeFormRegister } from '@/lib/kodeFormUtils';
import { upsertFormWajib, upsertFormRegister } from '@/api/supabase/admin/peserta';
import { upsertFormPengumpulan } from '@/api/supabase/admin/submission';
import { upsertFormRegisterPricing, upsertFormRegisterKampusQuota, upsertFormRegisterAngkatanQuota, getFormRegisterKampusQuota, upsertFormWajibPricing } from '@/api/supabase/admin/finance';
import { uploadFile } from '@/api/supabase/storage';
import { nanoid } from 'nanoid';

export default function UnifiedFormDashboard() {
    const [activeTab, setActiveTab] = useState('wajib');
    const [siteFilter, setSiteFilter] = useState('all');
    const [adminRole, setAdminRole] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Form Modal States
    const [formType, setFormType] = useState('wajib'); // 'wajib', 'register', or 'pengumpulan'
    const [formSite, setFormSite] = useState('pose');
    const [judul, setJudul] = useState('');
    const [keterangan, setKeterangan] = useState('');
    const [gambarFile, setGambarFile] = useState(null);
    const [butuhBukti, setButuhBukti] = useState(true);

    // Dynamic Pricing per Category
    const [nominal, setNominal] = useState('');
    const [kategoriPendaftar, setKategoriPendaftar] = useState(['Mahasiswa LP3I', 'Siswa', 'Dosen', 'Umum', 'Alumni LP3I']);
    const [pricingKategoriMap, setPricingKategoriMap] = useState({});
    const [individusKategoriMap, setIndividusKategoriMap] = useState({});
    const [maksAnggotaKategoriMap, setMaksAnggotaKategoriMap] = useState({});
    const [maksTeamKategoriMap, setMaksTeamKategoriMap] = useState({});
    const [kampusQuotaEnabled, setKampusQuotaEnabled] = useState(false);
    const [kampusQuotaMap, setKampusQuotaMap] = useState({});
    const [selectedKampusList, setSelectedKampusList] = useState([]);
    const [angkatanQuotaMap, setAngkatanQuotaMap] = useState({});
    const [umumTypeMap, setUmumTypeMap] = useState({});
    const [komisiLvl1KategoriMap, setKomisiLvl1KategoriMap] = useState({});
    const [komisiLvl2KategoriMap, setKomisiLvl2KategoriMap] = useState({});
    const [komisiLvl3KategoriMap, setKomisiLvl3KategoriMap] = useState({});

    // PKKMB Wajib Staged pricing states
    const [regulerTahap1, setRegulerTahap1] = useState('');
    const [regulerTahap2, setRegulerTahap2] = useState('');
    const [regulerFull, setRegulerFull] = useState('');
    const [nonRegulerTahap1, setNonRegulerTahap1] = useState('');
    const [nonRegulerTahap2, setNonRegulerTahap2] = useState('');
    const [nonRegulerFull, setNonRegulerFull] = useState('');
    const [kipFull, setKipFull] = useState('');

    const [jenisLomba, setJenisLomba] = useState('');
    const [namaLomba, setNamaLomba] = useState('');

    const [createLoading, setCreateLoading] = useState(false);

    // Jenis Kategori & is_public States
    const [pakaiGrupKategori, setPakaiGrupKategori] = useState(false);
    const [jenisKategoriList, setJenisKategoriList] = useState([]);
    const [isPublic, setIsPublic] = useState(true);

    useEffect(() => {
        const checkRole = async () => {
            const admin = await getCurrentAdmin();
            if (admin) {
                setAdminRole(admin.role);
                if (admin.role === 'admin_pkkmb') {
                    setSiteFilter('pkkmb');
                    setFormSite('pkkmb');
                } else if (admin.role === 'super_admin') {
                    setSiteFilter('all');
                    setFormSite('pkkmb'); // Default for super_admin
                } else {
                    // admin_pose or specific lomba
                    setSiteFilter('pose');
                    setFormSite('pose');
                }
            }
        };
        checkRole();
    }, []);

    const resetForm = () => {
        setJudul('');
        setKeterangan('');
        setNominal('');
        setGambarFile(null);
        setButuhBukti(true);
        setJenisLomba('');
        setNamaLomba('');
        setKategoriPendaftar(['Mahasiswa LP3I', 'Siswa', 'Dosen', 'Umum', 'Alumni LP3I']);
        setPricingKategoriMap({});
        setIndividusKategoriMap({});
        setMaksAnggotaKategoriMap({});
        setMaksTeamKategoriMap({});
        setKampusQuotaEnabled(false);
        setKampusQuotaMap({});
        setSelectedKampusList([]);
        setUmumTypeMap({});
        setKomisiLvl1KategoriMap({});
        setKomisiLvl2KategoriMap({});
        setKomisiLvl3KategoriMap({});
        setPakaiGrupKategori(false);
        setJenisKategoriList([]);
        setIsPublic(true);
        setRegulerTahap1('');
        setRegulerTahap2('');
        setRegulerFull('');
        setNonRegulerTahap1('');
        setNonRegulerTahap2('');
        setNonRegulerFull('');
        setKipFull('');
    };

    const handleOpenModal = () => {
        resetForm();
        setFormType(activeTab); // default to current tab
        setShowCreateModal(true);
    };

    const handleCreateForm = async (e) => {
        e.preventDefault();

        if (formType === 'register' && formSite === 'pose') {
            if (!jenisLomba || !namaLomba) {
                window.alert('Mohon lengkapi jenis dan nama lomba.');
                return;
            }
        }
        if (formType === 'wajib' && !judul) {
            window.alert('Mohon lengkapi judul form.');
            return;
        }

        if (formType === 'register' && kategoriPendaftar.length === 0) {
            window.alert('Mohon pilih minimal 1 kategori pendaftar.');
            return;
        }

        setCreateLoading(true);

        let gambarUrl = null;
        if (gambarFile) {
            const formDataForUpload = new FormData();
            formDataForUpload.append('file', gambarFile);

            let bucket = formType === 'wajib' ? 'team-images' : 'images';
            let uploadRes;

            if (formType === 'wajib') {
                uploadRes = await uploadFile(formDataForUpload, 'team-images', 'form-headers/');
            } else {
                formDataForUpload.append('bucket', 'images');
                const fileExt = gambarFile.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                formDataForUpload.append('path', `form-headers/${fileName}`);
                uploadRes = await uploadFile(formDataForUpload);
            }

            if (!uploadRes.success) {
                console.error('Upload Error:', uploadRes.error);
                window.alert('Gagal mengupload gambar.');
                setCreateLoading(false);
                return;
            }
            gambarUrl = uploadRes.url || uploadRes.publicUrl;
        }

        const finalNominal = nominal ? parseInt(nominal, 10) : 0;

        let res;
        if (formType === 'wajib') {
            const linkId = nanoid(32);
            const kodeForm = generateKodeFormWajib(formSite);
            res = await upsertFormWajib({
                judul,
                keterangan,
                nominal: finalNominal,
                link_id: linkId,
                site: formSite,
                gambar: gambarUrl,
                kode_form: kodeForm
            });

            if (res.success && res.data?.id && formSite === 'pkkmb') {
                const pricingList = [
                    { kelas: 'Reguler', nominal: regulerTahap1 || 0, jenis_tahapan: 'tahap 1' },
                    { kelas: 'Reguler', nominal: regulerTahap2 || 0, jenis_tahapan: 'tahap 2' },
                    { kelas: 'Reguler', nominal: regulerFull || 0, jenis_tahapan: 'full' },
                    { kelas: 'NonReguler', nominal: nonRegulerTahap1 || 0, jenis_tahapan: 'tahap 1' },
                    { kelas: 'NonReguler', nominal: nonRegulerTahap2 || 0, jenis_tahapan: 'tahap 2' },
                    { kelas: 'NonReguler', nominal: nonRegulerFull || 0, jenis_tahapan: 'full' },
                    { kelas: 'KIP', nominal: kipFull || 0, jenis_tahapan: 'full' }
                ];
                await upsertFormWajibPricing(res.data.id, pricingList);
            }
        } else if (formType === 'register') {
            const linkId = nanoid(64);
            const jenisKode = KODE_JENIS_LOMBA[jenisLomba] || 'XX';
            const namaKode = KODE_NAMA_LOMBA[namaLomba] || 'XX';
            const kodeForm = generateKodeFormRegister(jenisKode, namaKode);

            res = await upsertFormRegister({
                jenis_lomba: formSite === 'pose' ? jenisLomba : null,
                nama_lomba: formSite === 'pose' ? namaLomba : null,
                keterangan,
                butuh_bukti: butuhBukti,
                nominal: finalNominal,
                kategori_pendaftar: kategoriPendaftar.join(','),
                link_id: linkId,
                gambar: gambarUrl,
                site: formSite,
                kode_form: kodeForm,
                jenis_kategori: pakaiGrupKategori ? jenisKategoriList.join(',') : null,
                is_public: isPublic
            });

            if (res.success && res.data?.id) {
                // Save pricing per category
                const pricingList = kategoriPendaftar.map(kat => {
                    const isIndividu = individusKategoriMap[kat] !== undefined ? individusKategoriMap[kat] : true;
                    
                    let finalMaksTeam = maksTeamKategoriMap[kat] !== undefined && maksTeamKategoriMap[kat] !== '' ? parseInt(maksTeamKategoriMap[kat], 10) : 1;
                    
                    // Auto-sum untuk Mahasiswa LP3I jika kampusQuotaEnabled
                    if (kat === 'Mahasiswa LP3I' && kampusQuotaEnabled) {
                        let totalSum = 0;
                        selectedKampusList.forEach(kampusName => {
                            const val = kampusQuotaMap[kampusName];
                            if (val && !isNaN(parseInt(val, 10))) {
                                totalSum += parseInt(val, 10);
                            }
                        });
                        if (totalSum > 0) finalMaksTeam = totalSum;
                    }

                    return {
                        kategori: kat,
                        nominal: pricingKategoriMap[kat] !== undefined && pricingKategoriMap[kat] !== ''
                            ? parseInt(pricingKategoriMap[kat], 10)
                            : finalNominal,
                        individu: isIndividu,
                        maks_anggota: isIndividu ? 1 : (maksAnggotaKategoriMap[kat] !== undefined && maksAnggotaKategoriMap[kat] !== '' ? parseInt(maksAnggotaKategoriMap[kat], 10) : 1),
                        maks_team: finalMaksTeam,
                        komisi_sales_lvl1: komisiLvl1KategoriMap[kat] !== undefined && komisiLvl1KategoriMap[kat] !== '' ? parseInt(komisiLvl1KategoriMap[kat], 10) : 0,
                        komisi_sales_lvl2: komisiLvl2KategoriMap[kat] !== undefined && komisiLvl2KategoriMap[kat] !== '' ? parseInt(komisiLvl2KategoriMap[kat], 10) : 0,
                        komisi_sales_lvl3: komisiLvl3KategoriMap[kat] !== undefined && komisiLvl3KategoriMap[kat] !== '' ? parseInt(komisiLvl3KategoriMap[kat], 10) : 0,
                        umum_type: kat === 'Umum' ? (umumTypeMap['Umum'] || 'keduanya') : null
                    };
                });
                const resPricing = await upsertFormRegisterPricing(res.data.id, pricingList);

                if (resPricing.success && kampusQuotaEnabled && formSite === 'pose') {
                    // Temukan pricingId untuk Mahasiswa LP3I
                    const pricingLP3I = (resPricing.data || []).find(p => p.kategori === 'Mahasiswa LP3I');
                    if (pricingLP3I) {
                        const kampusQuotaList = selectedKampusList.map(kampus => ({
                            nama_kampus: kampus,
                            maks_team: kampusQuotaMap[kampus] !== undefined && kampusQuotaMap[kampus] !== '' ? parseInt(kampusQuotaMap[kampus], 10) : 1
                        })).filter(k => k.maks_team > 0);

                        if (kampusQuotaList.length > 0) {
                            const quotaRes = await upsertFormRegisterKampusQuota(pricingLP3I.id, kampusQuotaList);
                            if (quotaRes.success) {
                                const createdQuotas = await getFormRegisterKampusQuota(pricingLP3I.id);
                                for (const q of (createdQuotas || [])) {
                                    const listForKampus = angkatanQuotaMap[q.nama_kampus] || [];
                                    if (listForKampus.length > 0) {
                                        await upsertFormRegisterAngkatanQuota(q.id, listForKampus);
                                    }
                                }
                            }
                        }
                    }
                }

                // Create pengumpulan otomatis
                const linkIdPengumpulan = nanoid(64);
                const resPengumpulan = await upsertFormPengumpulan({
                    form_id: res.data.id,
                    link_id: linkIdPengumpulan
                });

                if (!resPengumpulan.success) {
                    console.error('Gagal membuat form pengumpulan otomatis:', resPengumpulan.error);
                }
            }
        }

        if (!res.success) {
            console.error(res.error);
            window.alert(`Gagal membuat form ${formType}.`);
        } else {
            setShowCreateModal(false);
            setRefreshTrigger(prev => prev + 1);
            window.alert(`Berhasil membuat form ${formType} baru!`);
            // Automatically switch tab to see the newly created form
            setActiveTab(formType);
        }

        setCreateLoading(false);
    };

    const isSuperAdmin = adminRole === 'super_admin';

    const extraFilters = (
        <div className="flex gap-2">
            {isSuperAdmin && (
                <DashboardSelect
                    icon={Filter}
                    value={siteFilter}
                    onChange={(e) => setSiteFilter(e.target.value)}
                    options={[
                        { value: 'all', label: 'Semua Site' },
                        { value: 'pkkmb', label: 'PKKMB' },
                        { value: 'pose', label: 'POSE' }
                    ]}
                />
            )}
            <button
                onClick={handleOpenModal}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center shadow-sm"
            >
                <Plus size={16} />
                <span>Buat Form Baru</span>
            </button>
        </div>
    );

    return (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
            <DashboardHeaderFilters
                title="Manajemen Form Terpadu"
                subtitle="Buat dan kelola link pendaftaran Form Wajib dan Form Register"
                icon={FileText}
                showSiteFilter={false}
                extraFilters={extraFilters}
                onRefresh={() => setRefreshTrigger(prev => prev + 1)}
            />

            {/* TABS */}
            <div className="flex space-x-1 bg-gray-100/50 dark:bg-gray-800/50 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('wajib')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'wajib'
                        ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
                        }`}
                >
                    Form Wajib
                </button>
                <button
                    onClick={() => setActiveTab('register')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'register'
                        ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
                        }`}
                >
                    Form Register Lomba
                </button>
                <button
                    onClick={() => setActiveTab('pengumpulan')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'pengumpulan'
                        ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
                        }`}
                >
                    Form Pengumpulan Karya
                </button>
            </div>

            {/* TAB CONTENT */}
            {activeTab === 'wajib' && (
                <AdminFormWajib siteType={siteFilter} hideCreateButton={true} refreshTrigger={refreshTrigger} />
            )}
            {activeTab === 'register' && (
                <AdminFormRegister siteType={siteFilter} hideCreateButton={true} refreshTrigger={refreshTrigger} />
            )}
            {activeTab === 'pengumpulan' && (
                <AdminFormPengumpulan siteType={siteFilter} hideCreateButton={true} refreshTrigger={refreshTrigger} />
            )}

            {/* UNIFIED CREATE MODAL */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <form onSubmit={handleCreateForm} className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg flex flex-col border border-gray-100 dark:border-gray-800 max-h-[90vh] overflow-hidden">
                        <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                                <Plus size={20} className="text-blue-500" /> Buat Form Baru
                            </h3>
                            <button type="button" onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar">

                            {/* JENIS FORM & SITE SELECTOR */}
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jenis Form</label>
                                    <select
                                        value={formType}
                                        onChange={(e) => setFormType(e.target.value)}
                                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    >
                                        <option value="wajib">Form Wajib (Umum)</option>
                                        <option value="register">Form Register (Lomba)</option>
                                        <option value="pengumpulan">Form Pengumpulan Karya</option>
                                    </select>
                                </div>

                                {isSuperAdmin && (
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Site</label>
                                        <select
                                            value={formSite}
                                            onChange={(e) => {
                                                setFormSite(e.target.value);
                                                // reset lomba fields if changing to pkkmb
                                                if (e.target.value === 'pkkmb') {
                                                    setJenisLomba('');
                                                    setNamaLomba('');
                                                }
                                            }}
                                            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="pkkmb">PKKMB</option>
                                            <option value="pose">POSE</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* JUDUL FORM (For Form Wajib) */}
                            {formType === 'wajib' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Judul Form</label>
                                    <input
                                        type="text"
                                        value={judul}
                                        onChange={(e) => setJudul(e.target.value)}
                                        placeholder="Contoh: Iuran Wajib PKKMB 2026"
                                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            )}

                            {/* LOMBA SELECTOR (For Form Register & Site POSE) */}
                            {formType === 'register' && formSite === 'pose' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jenis Lomba</label>
                                        <select
                                            value={jenisLomba}
                                            onChange={(e) => {
                                                setJenisLomba(e.target.value);
                                                setNamaLomba('');
                                            }}
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
                                                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                                            >
                                                <option value="" disabled>Pilih Nama Lomba</option>
                                                {NAMA_LOMBA[jenisLomba]?.map(n => <option key={n} value={n}>{n}</option>)}
                                            </select>
                                        </div>
                                    )}
                                </>
                            )}

                            {formType === 'register' && formSite === 'pkkmb' && (
                                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 rounded-xl text-sm flex items-start gap-2">
                                    <Info size={16} className="mt-0.5 shrink-0" />
                                    <p>Form Register untuk PKKMB tidak memerlukan Jenis & Nama Lomba.</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Keterangan Tambahan</label>
                                <textarea
                                    value={keterangan}
                                    onChange={(e) => setKeterangan(e.target.value)}
                                    placeholder="Opsional. Syarat, juknis, atau info pembayaran."
                                    rows="3"
                                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                />
                            </div>

                             {formType === 'wajib' && formSite === 'pkkmb' ? (
                                <div className="space-y-4 p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <span className="w-1.5 h-4 bg-blue-500 rounded-full"></span>
                                        Konfigurasi Nominal per Kelas & Tahapan
                                    </h4>
                                    
                                    {/* Reguler */}
                                    <div className="space-y-2 border-b border-gray-200 dark:border-gray-800 pb-3">
                                        <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300">Kelas Reguler</h5>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div>
                                                <label className="block text-[10px] text-gray-500">Tahap 1</label>
                                                <input type="number" value={regulerTahap1} onChange={(e) => setRegulerTahap1(e.target.value)} className="w-full px-2 py-1 bg-white dark:bg-gray-800 border rounded-lg text-xs" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-gray-500">Tahap 2</label>
                                                <input type="number" value={regulerTahap2} onChange={(e) => setRegulerTahap2(e.target.value)} className="w-full px-2 py-1 bg-white dark:bg-gray-800 border rounded-lg text-xs" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-gray-500">Full</label>
                                                <input type="number" value={regulerFull} onChange={(e) => setRegulerFull(e.target.value)} className="w-full px-2 py-1 bg-white dark:bg-gray-800 border rounded-lg text-xs" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* NonReguler */}
                                    <div className="space-y-2 border-b border-gray-200 dark:border-gray-800 pb-3">
                                        <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300">Kelas Non Reguler</h5>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div>
                                                <label className="block text-[10px] text-gray-500">Tahap 1</label>
                                                <input type="number" value={nonRegulerTahap1} onChange={(e) => setNonRegulerTahap1(e.target.value)} className="w-full px-2 py-1 bg-white dark:bg-gray-800 border rounded-lg text-xs" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-gray-500">Tahap 2</label>
                                                <input type="number" value={nonRegulerTahap2} onChange={(e) => setNonRegulerTahap2(e.target.value)} className="w-full px-2 py-1 bg-white dark:bg-gray-800 border rounded-lg text-xs" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-gray-500">Full</label>
                                                <input type="number" value={nonRegulerFull} onChange={(e) => setNonRegulerFull(e.target.value)} className="w-full px-2 py-1 bg-white dark:bg-gray-800 border rounded-lg text-xs" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* KIP */}
                                    <div className="space-y-2">
                                        <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300">Kelas KIP (Langsung Full)</h5>
                                        <div className="w-1/2">
                                            <label className="block text-[10px] text-gray-500">Full Only</label>
                                            <input type="number" value={kipFull} onChange={(e) => setKipFull(e.target.value)} className="w-full px-2 py-1 bg-white dark:bg-gray-800 border rounded-lg text-xs" />
                                        </div>
                                    </div>
                                </div>
                            ) : (
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
                            )}

                            {formType === 'register' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Kategori Pendaftar</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['Mahasiswa LP3I', 'Siswa', 'Dosen', 'Umum', 'Alumni LP3I'].map(kat => (
                                            <label key={kat} className="flex items-center gap-3 p-2 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={kategoriPendaftar.includes(kat)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setKategoriPendaftar([...kategoriPendaftar, kat]);
                                                        else setKategoriPendaftar(kategoriPendaftar.filter(k => k !== kat));
                                                    }}
                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <span className="text-sm text-gray-700 dark:text-gray-300">{kat}</span>
                                            </label>
                                        ))}
                                    </div>

                                    {kategoriPendaftar.length > 0 && (
                                        <div className="mt-3 space-y-3">
                                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Pengaturan Kategori Pendaftar</label>
                                            <p className="text-[11px] text-gray-500">Atur detail pendaftaran (nominal, tipe pendaftaran, batas anggota, kuota tim) per kategori.</p>
                                            {kategoriPendaftar.map(kat => {
                                                const isIndividu = individusKategoriMap[kat] !== undefined ? individusKategoriMap[kat] : true;
                                                return (
                                                    <div key={kat} className="p-3 bg-gray-50/70 dark:bg-gray-800/40 rounded-2xl border border-gray-200/80 dark:border-gray-800 space-y-3 shadow-inner">
                                                        <div className="flex items-center justify-between border-b border-gray-200/50 dark:border-gray-800 pb-2">
                                                            <span className="text-xs font-bold text-blue-700 dark:text-blue-400 truncate">{kat}</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] text-gray-500 font-medium">Individu?</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setIndividusKategoriMap({ ...individusKategoriMap, [kat]: !isIndividu })}
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
                                                                <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-1 font-semibold">Nominal</label>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    placeholder={`(${nominal || 0})`}
                                                                    value={pricingKategoriMap[kat] !== undefined ? pricingKategoriMap[kat] : ''}
                                                                    onChange={(e) => setPricingKategoriMap({ ...pricingKategoriMap, [kat]: e.target.value })}
                                                                    className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-xs outline-none focus:ring-1 focus:ring-blue-500"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-1 font-semibold">Maks Anggota</label>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    disabled={isIndividu}
                                                                    value={isIndividu ? 1 : (maksAnggotaKategoriMap[kat] !== undefined ? maksAnggotaKategoriMap[kat] : '')}
                                                                    onChange={(e) => setMaksAnggotaKategoriMap({ ...maksAnggotaKategoriMap, [kat]: e.target.value })}
                                                                    placeholder="Maks"
                                                                    className={`w-full px-2.5 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-xs outline-none focus:ring-1 focus:ring-blue-500 ${isIndividu ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-1 font-semibold">Maks Team</label>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    value={kat === 'Mahasiswa LP3I' && kampusQuotaEnabled ? '' : (maksTeamKategoriMap[kat] !== undefined ? maksTeamKategoriMap[kat] : '')}
                                                                    onChange={(e) => setMaksTeamKategoriMap({ ...maksTeamKategoriMap, [kat]: e.target.value })}
                                                                    placeholder={kat === 'Mahasiswa LP3I' && kampusQuotaEnabled ? 'Auto Sum' : 'Maks'}
                                                                    disabled={kat === 'Mahasiswa LP3I' && kampusQuotaEnabled}
                                                                    className={`w-full px-2.5 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-xs outline-none focus:ring-1 focus:ring-blue-500 ${kat === 'Mahasiswa LP3I' && kampusQuotaEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Tambahan UI Kuota Kampus Khusus Mahasiswa LP3I */}
                                                        {kat === 'Mahasiswa LP3I' && (
                                                             <div className="border-t border-gray-200/30 dark:border-gray-800/30 pt-3 mt-2">
                                                                 <div className="flex items-center justify-between mb-2">
                                                                     <div>
                                                                         <span className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Kuota Per Kampus</span>
                                                                         <span className="block text-[9px] text-gray-500">Maks team otomatis dihitung dari total semua kampus</span>
                                                                     </div>
                                                                     <button
                                                                         type="button"
                                                                         onClick={() => setKampusQuotaEnabled(!kampusQuotaEnabled)}
                                                                         className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                                             kampusQuotaEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'
                                                                         }`}
                                                                     >
                                                                         <span
                                                                             className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                                                 kampusQuotaEnabled ? 'translate-x-4' : 'translate-x-0'
                                                                             }`}
                                                                         />
                                                                     </button>
                                                                 </div>
                                                                 
                                                                 {kampusQuotaEnabled && (
                                                                     <div className="space-y-3 mt-2">
                                                                         <div>
                                                                             <label className="block text-[10px] text-gray-500 font-semibold mb-1">Pilih Kampus yang Diaktifkan Limit:</label>
                                                                             <div className="flex flex-wrap gap-1.5 p-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl max-h-24 overflow-y-auto">
                                                                                 {KAMPUS_DATA.filter(k => k !== 'Lainnya').map(kampus => {
                                                                                    const isSelected = selectedKampusList.includes(kampus);
                                                                                    return (
                                                                                        <label key={`check-kampus-${kat}-${kampus}`} className={`flex items-center justify-center px-3 py-1.5 border rounded-lg text-[10px] font-semibold cursor-pointer transition-all ${isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                                                                                            <input
                                                                                                type="checkbox"
                                                                                                checked={isSelected}
                                                                                                onChange={(e) => {
                                                                                                    if (e.target.checked) {
                                                                                                        setSelectedKampusList([...selectedKampusList, kampus]);
                                                                                                    } else {
                                                                                                        setSelectedKampusList(selectedKampusList.filter(k => k !== kampus));
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

                                                                         {selectedKampusList.length > 0 && (
                                                                             <div className="space-y-2.5 p-2.5 bg-blue-50/20 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-800/30 rounded-xl">
                                                                                 {selectedKampusList.map(kampusName => {
                                                                                     const currentAngkatanList = angkatanQuotaMap[kampusName] || [];
                                                                                     return (
                                                                                         <div key={`input-quota-${kat}-${kampusName}`} className="p-2 bg-white dark:bg-gray-900/80 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2">
                                                                                             <div className="flex items-center justify-between">
                                                                                                 <label className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate" title={kampusName}>
                                                                                                     {kampusName}
                                                                                                 </label>
                                                                                                 <div className="flex items-center gap-1.5">
                                                                                                     <span className="text-[10px] text-gray-500 font-medium">Maks Total:</span>
                                                                                                     <input
                                                                                                         type="number"
                                                                                                         min="1"
                                                                                                         placeholder="Maks"
                                                                                                         value={kampusQuotaMap[kampusName] !== undefined ? kampusQuotaMap[kampusName] : ''}
                                                                                                         onChange={(e) => setKampusQuotaMap({ ...kampusQuotaMap, [kampusName]: e.target.value })}
                                                                                                         className="w-16 px-2 py-0.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500"
                                                                                                     />
                                                                                                 </div>
                                                                                             </div>

                                                                                             {/* Angkatan Quota Section */}
                                                                                             <div className="pt-1.5 border-t border-gray-100 dark:border-gray-800">
                                                                                                 <div className="flex items-center justify-between mb-1">
                                                                                                     <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-400">Limit Khusus Angkatan (Opsional)</span>
                                                                                                     <button
                                                                                                         type="button"
                                                                                                         onClick={() => {
                                                                                                             const newList = [...currentAngkatanList, { angkatan: '2026', maks_team: 1 }];
                                                                                                             setAngkatanQuotaMap({ ...angkatanQuotaMap, [kampusName]: newList });
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
                                                                                                                         setAngkatanQuotaMap({ ...angkatanQuotaMap, [kampusName]: updated });
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
                                                                                                                     min="1"
                                                                                                                     placeholder="Maks Tim"
                                                                                                                     value={item.maks_team}
                                                                                                                     onChange={(e) => {
                                                                                                                         const updated = [...currentAngkatanList];
                                                                                                                         updated[aIdx].maks_team = e.target.value;
                                                                                                                         setAngkatanQuotaMap({ ...angkatanQuotaMap, [kampusName]: updated });
                                                                                                                     }}
                                                                                                                     className="w-16 px-2 py-0.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md text-[11px]"
                                                                                                                 />
                                                                                                                 <button
                                                                                                                     type="button"
                                                                                                                     onClick={() => {
                                                                                                                         const updated = currentAngkatanList.filter((_, i) => i !== aIdx);
                                                                                                                         setAngkatanQuotaMap({ ...angkatanQuotaMap, [kampusName]: updated });
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

                                                        {/* Tambahan Dropdown Tipe Umum */}
                                                        {kat === 'Umum' && (
                                                             <div className="border-t border-gray-200/30 dark:border-gray-800/30 pt-3 mt-2">
                                                                 <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-1 font-semibold">Tipe Kategori Umum</label>
                                                                 <select
                                                                     value={umumTypeMap['Umum'] || 'keduanya'}
                                                                     onChange={(e) => setUmumTypeMap({ ...umumTypeMap, ['Umum']: e.target.value })}
                                                                     className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-xs outline-none focus:ring-1 focus:ring-blue-500"
                                                                 >
                                                                     <option value="keduanya">Umum (Mahasiswa & Non-Mahasiswa)</option>
                                                                     <option value="mahasiswa_saja">Khusus Mahasiswa</option>
                                                                     <option value="non_mahasiswa_saja">Khusus Non-Mahasiswa</option>
                                                                 </select>
                                                             </div>
                                                        )}

                                                        <div className="grid grid-cols-3 gap-2 border-t border-gray-200/30 dark:border-gray-800/30 pt-2">
                                                            <div>
                                                                <label className="block text-[9px] text-gray-500 dark:text-gray-400 mb-1 font-semibold">Komisi Lvl 1 (%)</label>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max="100"
                                                                    placeholder="0"
                                                                    value={komisiLvl1KategoriMap[kat] !== undefined ? komisiLvl1KategoriMap[kat] : ''}
                                                                    onChange={(e) => setKomisiLvl1KategoriMap({ ...komisiLvl1KategoriMap, [kat]: e.target.value })}
                                                                    className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-xs outline-none focus:ring-1 focus:ring-blue-500"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[9px] text-gray-500 dark:text-gray-400 mb-1 font-semibold">Komisi Lvl 2 (%)</label>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max="100"
                                                                    placeholder="0"
                                                                    value={komisiLvl2KategoriMap[kat] !== undefined ? komisiLvl2KategoriMap[kat] : ''}
                                                                    onChange={(e) => setKomisiLvl2KategoriMap({ ...komisiLvl2KategoriMap, [kat]: e.target.value })}
                                                                    className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-xs outline-none focus:ring-1 focus:ring-blue-500"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-[9px] text-gray-500 dark:text-gray-400 mb-1 font-semibold">Komisi Lvl 3 (%)</label>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max="100"
                                                                    placeholder="0"
                                                                    value={komisiLvl3KategoriMap[kat] !== undefined ? komisiLvl3KategoriMap[kat] : ''}
                                                                    onChange={(e) => setKomisiLvl3KategoriMap({ ...komisiLvl3KategoriMap, [kat]: e.target.value })}
                                                                    className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-xs outline-none focus:ring-1 focus:ring-blue-500"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {formType === 'register' && (
                                <div className="space-y-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={pakaiGrupKategori}
                                            onChange={(e) => {
                                                setPakaiGrupKategori(e.target.checked);
                                                if (!e.target.checked) setJenisKategoriList([]);
                                            }}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Pakai Grup Kategori Putra / Putri?</span>
                                    </label>
                                    {pakaiGrupKategori && (
                                        <div className="flex gap-4 pl-7">
                                            {['putra', 'putri'].map(opt => (
                                                <label key={opt} className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-600 dark:text-gray-400">
                                                    <input
                                                        type="checkbox"
                                                        checked={jenisKategoriList.includes(opt)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setJenisKategoriList([...jenisKategoriList, opt]);
                                                            } else {
                                                                setJenisKategoriList(jenisKategoriList.filter(x => x !== opt));
                                                            }
                                                        }}
                                                        className="w-3.5 h-3.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                    />
                                                    <span>{opt.charAt(0).toUpperCase() + opt.slice(1)}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={isPublic}
                                        onChange={(e) => setIsPublic(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tampilkan di Halaman Publik (is_public)</span>
                                </label>
                            </div>

                            <div>
                                <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={butuhBukti}
                                        onChange={(e) => setButuhBukti(e.target.checked)}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Wajib Upload Bukti Pembayaran</span>
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gambar Header (Opsional)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setGambarFile(e.target.files[0])}
                                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                            </div>

                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-xl text-sm flex items-start gap-2">
                                <LinkIcon size={16} className="mt-0.5 shrink-0" />
                                <p>Link akses unik akan dibuat secara otomatis saat Anda menyimpan.</p>
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
