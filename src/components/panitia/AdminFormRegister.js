'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { FileText, Search, Plus, Link as LinkIcon, Image as ImageIcon, Trash2, Copy } from 'lucide-react';
import { uploadFile } from '@/api/supabase/storage';
import { getFormRegister } from '@/api/supabase/public/peserta';
import { upsertFormRegister, deleteFormRegister } from '@/api/supabase/admin/peserta';
import { useRouter } from 'next/navigation';
import DashboardHeaderFilters from '@/components/panitia/DashboardHeaderFilters';
import DashboardSelect from '@/components/panitia/DashboardSelect';
import TablePagination from '@/components/panitia/TablePagination';
import { formatDateTime } from '@/lib/dashboardUtils';
import { JENIS_LOMBA, NAMA_LOMBA } from '@/lib/lombaData';
import { nanoid } from 'nanoid';

const ITEMS_PER_PAGE = 10;

export default function AdminFormRegister({ siteType, hideCreateButton = false, refreshTrigger = 0 }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [lastSyncedAt, setLastSyncedAt] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [showCreateModal, setShowCreateModal] = useState(false);
    
    const [jenisLomba, setJenisLomba] = useState('');
    const [namaLomba, setNamaLomba] = useState('');
    const [keterangan, setKeterangan] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [butuhBukti, setButuhBukti] = useState(true);
    const [nominal, setNominal] = useState('');
    const [kategoriPendaftar, setKategoriPendaftar] = useState(['Mahasiswa LP3I', 'Siswa', 'Dosen', 'Umum']);
    const [createLoading, setCreateLoading] = useState(false);

    const router = useRouter();

    const fetchData = useCallback(async () => {
        setLoading(true);

        // Wait! We don't have getSession in server actions yet that we can just drop in. 
        // Layout already protects the page, so we don't need getSession check here anyway, 
        // or we just assume it's valid if they reach here. Let's just remove the getSession.

        const formsData = await getFormRegister(siteType);

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
                                <th className="px-4 py-3 font-medium w-24 text-center">Aksi</th>
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
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(item.id)}
                                            className="inline-flex items-center justify-center p-1.5 text-xs font-medium rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                                        >
                                            <Trash2 size={16} />
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
                    totalItems={filteredData.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onPageChange={setCurrentPage}
                    colSpan={7}
                />
            </div>

            {/* Create Modal */}
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
