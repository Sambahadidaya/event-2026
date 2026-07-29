'use client';

import { useEffect, useState } from 'react';
import { CreditCard, Plus, Search, Edit3, Trash2, CheckCircle, XCircle, Image as ImageIcon, Upload, Filter } from 'lucide-react';
import { getCurrentAdmin } from '@/api/supabase/admin/auth';
import { getMetodePembayaranAdmin, upsertMetodePembayaran, deleteMetodePembayaran, getMasterAccountAsset } from '@/api/supabase/admin/finance';
import { uploadFile } from '@/api/supabase/storage';

export default function KeuanganMetodePembayaranPage() {
    const [siteFilter, setSiteFilter] = useState('all');
    const [adminRole, setAdminRole] = useState('');
    const [loading, setLoading] = useState(true);
    const [metodeList, setMetodeList] = useState([]);
    const [masterAccounts, setMasterAccounts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Form inputs
    const [formSite, setFormSite] = useState('pose');
    const [nama, setNama] = useState('');
    const [tipe, setTipe] = useState('');
    const [nomorRekening, setNomorRekening] = useState('');
    const [namaPemilik, setNamaPemilik] = useState('');
    const [qrisFile, setQrisFile] = useState(null);
    const [existingQrisUrl, setExistingQrisUrl] = useState('');
    const [keterangan, setKeterangan] = useState('');
    const [aktif, setAktif] = useState(true);
    const [urutan, setUrutan] = useState(0);

    const loadData = async () => {
        setLoading(true);
        const [metodeRes, accountRes] = await Promise.all([
            getMetodePembayaranAdmin(siteFilter),
            getMasterAccountAsset()
        ]);
        setMetodeList(metodeRes || []);
        setMasterAccounts(accountRes || []);
        setLoading(false);
    };

    useEffect(() => {
        const init = async () => {
            const admin = await getCurrentAdmin();
            if (admin && admin.role) {
                setAdminRole(admin.role);
                if (admin.role.includes('pkkmb')) {
                    setSiteFilter('pkkmb');
                    setFormSite('pkkmb');
                } else if (admin.role.includes('pose')) {
                    setSiteFilter('pose');
                    setFormSite('pose');
                }
            }
        };
        init();
    }, []);

    useEffect(() => {
        loadData();
    }, [siteFilter]);

    const handleOpenModal = (item = null) => {
        if (item) {
            setEditingItem(item);
            setFormSite(item.site || 'pose');
            setNama(item.nama || '');
            setTipe(item.tipe || '');
            setNomorRekening(item.nomor_rekening || '');
            setNamaPemilik(item.nama_pemilik || '');
            setExistingQrisUrl(item.qris_image || '');
            setQrisFile(null);
            setKeterangan(item.keterangan || '');
            setAktif(item.aktif !== undefined ? item.aktif : true);
            setUrutan(item.urutan || 0);
        } else {
            setEditingItem(null);
            setFormSite(siteFilter !== 'all' ? siteFilter : 'pose');
            setNama('');
            setTipe(masterAccounts[0]?.id || '');
            setNomorRekening('');
            setNamaPemilik('');
            setExistingQrisUrl('');
            setQrisFile(null);
            setKeterangan('');
            setAktif(true);
            setUrutan(metodeList.length + 1);
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!nama || !tipe || !formSite) {
            return window.alert('Mohon isi nama, site, dan tipe akun (COA).');
        }

        setSubmitting(true);
        try {
            let qrisUrl = existingQrisUrl;
            if (qrisFile) {
                const formData = new FormData();
                formData.append('file', qrisFile);
                const uploadRes = await uploadFile(formData, 'qris_image', 'qris/');
                if (!uploadRes.success) {
                    throw new Error(uploadRes.error || 'Gagal mengunggah QRIS');
                }
                qrisUrl = uploadRes.url;
            }

            const payload = {
                site: formSite,
                nama,
                tipe,
                nomor_rekening: nomorRekening,
                nama_pemilik: namaPemilik,
                qris_image: qrisUrl,
                keterangan,
                aktif,
                urutan
            };

            const res = await upsertMetodePembayaran(payload, editingItem?.id);
            if (!res.success) throw new Error(res.error);

            setShowModal(false);
            loadData();
        } catch (error) {
            console.error('Error saving metode pembayaran:', error);
            window.alert(`Gagal menyimpan: ${error.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id, namaMetode) => {
        if (!window.confirm(`Apakah Anda yakin ingin menghapus metode pembayaran "${namaMetode}"?`)) return;
        const res = await deleteMetodePembayaran(id);
        if (res.success) {
            loadData();
        } else {
            window.alert(`Gagal menghapus: ${res.error}`);
        }
    };

    const filteredList = metodeList.filter(item => {
        const matchesSearch = item.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.master_account?.nama_akun?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.nomor_rekening?.includes(searchTerm);
        return matchesSearch;
    });

    return (
        <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <CreditCard className="text-emerald-500" size={28} />
                        Kelola Metode Pembayaran
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Atur rekening bank, E-Wallet, QRIS, dan Tunai yang terintegrasi dengan Akuntansi Asset
                    </p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold flex items-center gap-2 shadow-sm transition-all text-sm"
                >
                    <Plus size={18} /> Tambah Metode
                </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Cari metode, nama akun, no rek..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Filter size={16} className="text-slate-400" />
                    <span className="text-xs text-slate-500 font-medium">Site:</span>
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        {['all', 'pkkmb', 'pose']
                            .filter(st => adminRole === 'super_admin' || (adminRole && adminRole.includes(st)))
                            .map((st) => (
                            <button
                                key={st}
                                onClick={() => setSiteFilter(st)}
                                className={`px-3 py-1 text-xs font-semibold rounded-lg uppercase transition-all ${siteFilter === st ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {st}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table List */}
            {loading ? (
                <div className="min-h-[300px] flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : filteredList.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800">
                    <CreditCard size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Belum ada metode pembayaran</h3>
                    <p className="text-sm text-slate-500 mt-1">Klik tombol "+ Tambah Metode" untuk membuat metode pembayaran pertama.</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium uppercase text-xs border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="px-6 py-4">Urutan</th>
                                    <th className="px-6 py-4">Site</th>
                                    <th className="px-6 py-4">Nama Metode</th>
                                    <th className="px-6 py-4">Akun COA (Asset)</th>
                                    <th className="px-6 py-4">Detail Rekening / QRIS</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                                {filteredList.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4 font-semibold text-slate-500">#{item.urutan}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md ${item.site === 'pose' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'}`}>
                                                {item.site}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                                            {item.nama}
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.master_account ? (
                                                <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded font-mono text-slate-700 dark:text-slate-300">
                                                    {item.master_account.kode_akun} - {item.master_account.nama_akun}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-red-500 font-semibold">Tidak terhubung</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.nomor_rekening ? (
                                                <div>
                                                    <p className="font-semibold text-slate-900 dark:text-white">{item.nomor_rekening}</p>
                                                    {item.nama_pemilik && <p className="text-xs text-slate-500">a.n {item.nama_pemilik}</p>}
                                                </div>
                                            ) : item.qris_image ? (
                                                <a href={item.qris_image} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-semibold hover:underline">
                                                    <ImageIcon size={14} /> Lihat QRIS
                                                </a>
                                            ) : (
                                                <span className="text-xs text-slate-400">{item.keterangan || '-'}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.aktif ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                                                    <CheckCircle size={12} /> Aktif
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-full">
                                                    <XCircle size={12} /> Nonaktif
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(item)}
                                                    className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-all"
                                                    title="Edit"
                                                >
                                                    <Edit3 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id, item.nama)}
                                                    className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                                                    title="Hapus"
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
                </div>
            )}

            {/* Modal Tambah / Edit */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                            {editingItem ? 'Edit Metode Pembayaran' : 'Tambah Metode Pembayaran Baru'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Site *</label>
                                    <select
                                        value={formSite}
                                        onChange={(e) => setFormSite(e.target.value)}
                                        disabled={adminRole !== 'super_admin'}
                                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                                    >
                                        <option value="pose">POSE</option>
                                        <option value="pkkmb">PKKMB</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Urutan Tampil</label>
                                    <input
                                        type="number"
                                        value={urutan}
                                        onChange={(e) => setUrutan(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Metode *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Bank SeaBank / QRIS Utama / Tunai"
                                    value={nama}
                                    onChange={(e) => setNama(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tipe Akun COA (Asset / Kas-Bank) *</label>
                                <select
                                    required
                                    value={tipe}
                                    onChange={(e) => setTipe(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="" disabled>-- Pilih Master Akun Asset --</option>
                                    {masterAccounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>
                                            {acc.kode_akun} - {acc.nama_akun}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nomor Rekening / No HP</label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: 90128391823"
                                        value={nomorRekening}
                                        onChange={(e) => setNomorRekening(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Pemilik (a.n)</label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Panitia POSE 2026"
                                        value={namaPemilik}
                                        onChange={(e) => setNamaPemilik(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Gambar QRIS (Opsional)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setQrisFile(e.target.files[0])}
                                    className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 dark:file:bg-emerald-900/30 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800"
                                />
                                {existingQrisUrl && !qrisFile && (
                                    <p className="text-xs text-emerald-600 mt-1 font-semibold">Sudah ada gambar QRIS terpasang.</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Keterangan Tambahan / Penanggung Jawab</label>
                                <textarea
                                    rows={2}
                                    placeholder="Contoh: Hubungi Panitia A di sekretariat untuk pembayaran tunai..."
                                    value={keterangan}
                                    onChange={(e) => setKeterangan(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="aktif-toggle"
                                    checked={aktif}
                                    onChange={(e) => setAktif(e.target.checked)}
                                    className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                                />
                                <label htmlFor="aktif-toggle" className="text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                                    Metode Pembayaran Aktif (Ditampilkan di Form Publik)
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-semibold transition-all"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                                >
                                    {submitting ? 'Menyimpan...' : 'Simpan Metode'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
