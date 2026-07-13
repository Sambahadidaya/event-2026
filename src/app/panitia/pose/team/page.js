'use client';

import { useState, useEffect } from 'react';
import { getTeams, upsertTeam, deleteTeam, deleteMultipleTeams } from '@/api/supabase/team';
import { uploadFile } from '@/api/supabase/storage';
import { RefreshCw, Trash2, Search, Users, Edit2, CheckSquare, X, Link as LinkIcon, Image as ImageIcon, UserPlus } from 'lucide-react';
import { JENIS_LOMBA, NAMA_LOMBA, PRODI_DATA, Angkatan_DATA, KAMPUS_DATA } from '@/lib/lombaData';

export default function AdminPoseTeam() {
    const [team, setTeam] = useState([]);
    const [filter, setFilter] = useState('');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [instagramLink, setInstagramLink] = useState('');
    const [gambar, setGambar] = useState('');
    const [gambarFile, setGambarFile] = useState(null);
    const [jenisLomba, setJenisLomba] = useState('');
    const [namaLomba, setNamaLomba] = useState('');
    const [members, setMembers] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);

    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        const teamData = await getTeams('pose');
        if (teamData) setTeam(teamData);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRefresh = () => {
        fetchData();
        setSelectedIds([]);
        cancelEdit();
    };

    const handleAddMember = () => setMembers([...members, { nama: '', jabatan: '', prodi: '', angkatan: '', kampus: '', email_wa: '' }]);
    const handleRemoveMember = (index) => {
        const newMembers = [...members];
        newMembers.splice(index, 1);
        setMembers(newMembers);
    };
    const handleMemberChange = (index, field, value) => {
        const newMembers = [...members];
        newMembers[index][field] = value;
        setMembers(newMembers);
    };

    const handleAddOrUpdate = async (e) => {
        e.preventDefault();
        if (!title.trim()) return;

        setIsSubmitting(true);
        let finalGambarUrl = gambar;

        if (gambarFile) {
            setUploadingImage(true);
            const formData = new FormData();
            formData.append('file', gambarFile);
            
            const uploadRes = await uploadFile(formData, 'team-images', 'pose/');

            setUploadingImage(false);

            if (!uploadRes.success) {
                alert('Gagal mengupload gambar: ' + uploadRes.error);
                setIsSubmitting(false);
                return;
            }

            finalGambarUrl = uploadRes.url;
        }

        const payload = {
            title,
            content,
            type: 'pose',
            instagram_link: instagramLink,
            gambar: finalGambarUrl,
            jenis_lomba: jenisLomba,
            nama_lomba: namaLomba,
        };

        const validMembers = members
            .filter(m => m.nama.trim() !== '')
            .map(m => ({
                nama: m.nama,
                jabatan: m.jabatan,
                prodi: m.prodi,
                angkatan: m.angkatan,
                kampus: m.kampus,
                email_wa: m.email_wa
            }));
            
        const res = await upsertTeam(payload, validMembers, editingId);
        if (!res.success) alert('Gagal menyimpan tim: ' + res.error);

        cancelEdit();
        handleRefresh();
        setIsSubmitting(false);
    };

    const handleEditClick = (item) => {
        setEditingId(item.id);
        setTitle(item.title);
        setContent(item.content || '');
        setInstagramLink(item.instagram_link || '');
        setGambar(item.gambar || '');
        setGambarFile(null);
        setJenisLomba(item.jenis_lomba || '');
        setNamaLomba(item.nama_lomba || '');

        if (item.team_members && item.team_members.length > 0) {
            setMembers(item.team_members.map(m => ({
                nama: m.nama,
                jabatan: m.jabatan || '',
                prodi: m.prodi || '',
                angkatan: m.angkatan || '',
                kampus: m.kampus || '',
                email_wa: m.email_wa || ''
            })));
        } else {
            setMembers([]);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingId(null); setTitle(''); setContent(''); setInstagramLink(''); setGambar('');
        setGambarFile(null);
        setJenisLomba(''); setNamaLomba(''); setMembers([]);
    };

    const handleDelete = async (id) => {
        if (!confirm('Hapus tim secara permanen?')) return;
        const res = await deleteTeam(id);
        if (res.success) handleRefresh();
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Hapus ${selectedIds.length} tim terpilih?`)) return;
        const res = await deleteMultipleTeams(selectedIds);
        if (res.success) handleRefresh();
    };

    const toggleSelectAll = (e) => setSelectedIds(e.target.checked ? filteredTeam.map(t => t.id) : []);
    const toggleSelect = (id) => setSelectedIds(selectedIds.includes(id) ? selectedIds.filter(itemId => itemId !== id) : [...selectedIds, id]);
    const filteredTeam = team.filter(t => t.title.toLowerCase().includes(filter.toLowerCase()));

    return (
        <div className="space-y-12 animate-in fade-in duration-500 pb-20">
            {/* --- BAGIAN MANAJEMEN TIM --- */}
            <div className="space-y-6">
                <div className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                            {editingId ? <Edit2 size={20} className="text-orange-500" /> : <Users size={20} className="text-emerald-500" />}
                            {editingId ? 'Edit Tim POSE' : 'Buat Tim POSE'}
                        </h3>
                        {editingId && (
                            <button onClick={cancelEdit} className="text-sm flex items-center gap-1 text-gray-500 hover:text-red-500 transition-colors">
                                <X size={16} /> Batal Edit
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleAddOrUpdate} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nama Tim</label>
                                <input
                                    required type="text" placeholder="Masukkan nama tim..." value={title} onChange={e => setTitle(e.target.value)}
                                    className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-800 outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
                                    <LinkIcon size={14} /> Link Instagram
                                </label>
                                <input
                                    type="url" placeholder="https://instagram.com/..." value={instagramLink} onChange={e => setInstagramLink(e.target.value)}
                                    className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 focus:bg-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
                                    <ImageIcon size={14} /> Logo / Gambar Tim (Opsional)
                                </label>
                                <input
                                    type="file" accept="image/png, image/jpeg, image/jpg"
                                    onChange={e => setGambarFile(e.target.files[0])}
                                    className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-900/30 dark:file:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all cursor-pointer"
                                />
                                {(gambarFile || gambar) && (
                                    <div className="mt-3 relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                                        <img
                                            src={gambarFile ? URL.createObjectURL(gambarFile) : gambar}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Kategori</label>
                                    <select
                                        value={jenisLomba} onChange={e => { setJenisLomba(e.target.value); setNamaLomba(''); }}
                                        className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 focus:bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="">Pilih...</option>
                                        {JENIS_LOMBA.map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Cabang Lomba</label>
                                    <select
                                        value={namaLomba} onChange={e => setNamaLomba(e.target.value)} disabled={!jenisLomba}
                                        className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 focus:bg-white outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                                    >
                                        <option value="">Pilih...</option>
                                        {jenisLomba && NAMA_LOMBA[jenisLomba]?.map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Deskripsi Singkat</label>
                                <textarea
                                    placeholder="Deskripsi..." rows="2" value={content} onChange={e => setContent(e.target.value)}
                                    className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 focus:bg-white outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                                />
                            </div>
                        </div>

                        {/* Anggota Section */}
                        <div className="border-t border-gray-200 dark:border-gray-800 pt-5 mt-5">
                            <div className="flex items-center justify-between mb-3">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data Anggota Tim</label>
                                <button type="button" onClick={handleAddMember} className="text-xs bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 px-3 py-1.5 rounded flex items-center gap-1 transition-colors">
                                    <UserPlus size={14} /> Tambah Anggota
                                </button>
                            </div>

                            <div className="space-y-3">
                                {members.map((member, idx) => (
                                    <div key={idx} className="flex flex-wrap md:flex-nowrap items-center gap-2 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg border border-gray-100 dark:border-gray-800">
                                        <input
                                            type="text" placeholder="Nama Anggota" value={member.nama} onChange={e => handleMemberChange(idx, 'nama', e.target.value)}
                                            className="flex-1 min-w-[150px] p-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                        <input
                                            type="text" placeholder="Jabatan" value={member.jabatan} onChange={e => handleMemberChange(idx, 'jabatan', e.target.value)}
                                            className="w-full md:w-32 p-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                        <select
                                            value={member.prodi} onChange={e => handleMemberChange(idx, 'prodi', e.target.value)}
                                            className="w-full md:w-40 p-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 outline-none focus:ring-2 focus:ring-emerald-500"
                                        >
                                            <option value="">Prodi...</option>
                                            {PRODI_DATA.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                        <select
                                            value={member.angkatan} onChange={e => handleMemberChange(idx, 'angkatan', e.target.value)}
                                            className="w-full md:w-28 p-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 outline-none focus:ring-2 focus:ring-emerald-500"
                                        >
                                            <option value="">Angkatan...</option>
                                            {Angkatan_DATA.map(a => <option key={a} value={a}>{a}</option>)}
                                        </select>
                                        <select
                                            value={member.kampus || ''} onChange={e => handleMemberChange(idx, 'kampus', e.target.value)}
                                            className="w-full md:w-32 p-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 outline-none focus:ring-2 focus:ring-emerald-500"
                                        >
                                            <option value="">Kampus...</option>
                                            {KAMPUS_DATA.map(k => <option key={k} value={k}>{k}</option>)}
                                        </select>
                                        <input
                                            type="text" placeholder="Email/WA" value={member.email_wa || ''} onChange={e => handleMemberChange(idx, 'email_wa', e.target.value)}
                                            className="flex-1 min-w-[120px] p-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 outline-none focus:ring-2 focus:ring-emerald-500"
                                        />

                                        <button type="button" onClick={() => handleRemoveMember(idx)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors ml-auto md:ml-0">
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}
                                {members.length === 0 && <p className="text-sm text-gray-500 italic">Belum ada data anggota.</p>}
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end mt-4">
                            <button
                                type="submit"
                                disabled={isSubmitting || uploadingImage}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 font-medium"
                            >
                                {isSubmitting || uploadingImage ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : <CheckSquare size={18} />}
                                {isSubmitting ? 'Menyimpan...' : uploadingImage ? 'Upload...' : (editingId ? 'Update Tim' : 'Simpan Tim')}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Table Tim POSE */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="relative w-full md:w-80 flex-shrink-0">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><Search size={16} /></div>
                            <input
                                type="text" placeholder="Cari berdasarkan nama..." value={filter} onChange={e => setFilter(e.target.value)}
                                className="w-full pl-10 p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 outline-none focus:ring-2 focus:ring-emerald-500 transition-shadow"
                            />
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                            {selectedIds.length > 0 && (
                                <button onClick={handleBulkDelete} className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/30 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors shadow-sm whitespace-nowrap">
                                    <Trash2 size={16} /> Hapus ({selectedIds.length})
                                </button>
                            )}
                            <button onClick={handleRefresh} className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm whitespace-nowrap">
                                <RefreshCw size={16} className={loading ? 'animate-spin text-emerald-500' : 'text-gray-500'} />
                                Refresh Data
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                                <tr>
                                    <th className="px-6 py-4 w-12">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500 bg-gray-50"
                                            checked={filteredTeam.length > 0 && selectedIds.length === filteredTeam.length}
                                            onChange={toggleSelectAll}
                                        />
                                    </th>
                                    <th className="px-6 py-4 font-medium w-1/4">Tim</th>
                                    <th className="px-6 py-4 font-medium">Lomba</th>
                                    <th className="px-6 py-4 font-medium w-1/6 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {filteredTeam.map(item => {
                                    return (
                                        <tr key={item.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${selectedIds.includes(item.id) ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}`}>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500 bg-gray-50"
                                                    checked={selectedIds.includes(item.id)}
                                                    onChange={() => toggleSelect(item.id)}
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {item.gambar ? (
                                                        <img src={item.gambar} alt="Logo" className="w-8 h-8 rounded object-cover border border-gray-200" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-400">
                                                            <ImageIcon size={14} />
                                                        </div>
                                                    )}
                                                    <div className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">{item.title}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs text-emerald-600 font-semibold">{item.jenis_lomba}</div>
                                                <div className="text-sm text-gray-700 dark:text-gray-300">{item.nama_lomba}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleEditClick(item)} className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 flex items-center justify-center transition-colors">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => handleDelete(item.id)} className="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-colors">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredTeam.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                                            Tidak ada data tim.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
