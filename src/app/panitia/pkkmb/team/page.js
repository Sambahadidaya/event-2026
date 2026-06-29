'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { RefreshCw, Plus, Trash2, Search, Users, Edit2, CheckSquare, X, Link as LinkIcon, Image as ImageIcon, UserPlus } from 'lucide-react';

export default function AdminPkkmbTeam() {
    const [team, setTeam] = useState([]);
    const [filter, setFilter] = useState('');
    
    // Form States
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [instagramLink, setInstagramLink] = useState('');
    const [gambar, setGambar] = useState('');
    const [gambarFile, setGambarFile] = useState(null);
    const [members, setMembers] = useState([]);
    const [editingId, setEditingId] = useState(null);
    
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    
    // Bulk action state
    const [selectedIds, setSelectedIds] = useState([]);

    const fetchTeam = async () => {
        setLoading(true);
        const { data } = await supabase.from('team').select('*, team_members(*)').eq('type', 'pkkmb').order('created_at', { ascending: false });
        if (data) {
            setTeam(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchTeam();
    }, []);

    const handleRefresh = () => {
        fetchTeam();
        setSelectedIds([]);
        cancelEdit();
    };

    const handleAddMember = () => {
        setMembers([...members, { nama: '', jabatan: '' }]);
    };

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
        if (!title.trim() || !content.trim()) return;

        setIsSubmitting(true);
        
        let finalGambarUrl = gambar;

        if (gambarFile) {
            setUploadingImage(true);
            const fileExt = gambarFile.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `pkkmb/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('team-images')
                .upload(filePath, gambarFile);

            setUploadingImage(false);

            if (uploadError) {
                alert('Gagal mengupload gambar: ' + uploadError.message);
                setIsSubmitting(false);
                return;
            }

            const { data: publicUrlData } = supabase.storage
                .from('team-images')
                .getPublicUrl(filePath);

            finalGambarUrl = publicUrlData.publicUrl;
        }

        const payload = { 
            title, 
            content, 
            type: 'pkkmb',
            instagram_link: instagramLink,
            gambar: finalGambarUrl
        };

        let currentTeamId = editingId;

        if (editingId) {
            const { error } = await supabase.from('team').update(payload).eq('id', editingId);
            if (error) {
                alert('Gagal mengupdate: ' + error.message);
                setIsSubmitting(false);
                return;
            }
        } else {
            const { data, error } = await supabase.from('team').insert([payload]).select().single();
            if (error) {
                alert('Gagal menyimpan: ' + error.message);
                setIsSubmitting(false);
                return;
            }
            currentTeamId = data.id;
        }

        // Save members
        if (currentTeamId) {
            // Hapus member lama
            await supabase.from('team_members').delete().eq('team_id', currentTeamId);
            
            // Insert member baru jika ada yg tidak kosong namanya
            const validMembers = members.filter(m => m.nama.trim() !== '').map(m => ({
                team_id: currentTeamId,
                nama: m.nama,
                jabatan: m.jabatan
            }));

            if (validMembers.length > 0) {
                const { error: memberError } = await supabase.from('team_members').insert(validMembers);
                if (memberError) console.error("Error saving members:", memberError);
            }
        }

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
        
        if (item.team_members && item.team_members.length > 0) {
            setMembers(item.team_members.map(m => ({ nama: m.nama, jabatan: m.jabatan || '' })));
        } else {
            setMembers([]);
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setTitle('');
        setContent('');
        setInstagramLink('');
        setGambar('');
        setGambarFile(null);
        setMembers([]);
    };

    const handleDelete = async (id) => {
        if (!confirm('Apakah Anda yakin ingin menghapus data kelompok ini secara permanen?')) return;
        await supabase.from('team').delete().eq('id', id);
        handleRefresh();
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Hapus ${selectedIds.length} data terpilih secara permanen?`)) return;
        await supabase.from('team').delete().in('id', selectedIds);
        handleRefresh();
    };

    const toggleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(filteredTeam.map(t => t.id));
        } else {
            setSelectedIds([]);
        }
    };

    const toggleSelect = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(itemId => itemId !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const filteredTeam = team.filter(t => t.title.toLowerCase().includes(filter.toLowerCase()));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                        {editingId ? <Edit2 size={20} className="text-orange-500" /> : <Users size={20} className="text-blue-500" />} 
                        {editingId ? 'Edit Kelompok PKKMB' : 'Buat Kelompok PKKMB'}
                    </h3>
                    {editingId && (
                        <button onClick={cancelEdit} className="text-sm flex items-center gap-1 text-gray-500 hover:text-red-500 transition-colors">
                            <X size={16} /> Batal Edit
                        </button>
                    )}
                </div>
                <form onSubmit={handleAddOrUpdate} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nama Kelompok</label>
                            <input
                                required type="text" placeholder="Masukkan nama kelompok..." value={title} onChange={e => setTitle(e.target.value)}
                                className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
                                <LinkIcon size={14} /> Link Instagram
                            </label>
                            <input
                                type="url" placeholder="https://instagram.com/..." value={instagramLink} onChange={e => setInstagramLink(e.target.value)}
                                className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
                                <ImageIcon size={14} /> Logo / Gambar Kelompok (Opsional)
                            </label>
                            <input
                                type="file" accept="image/png, image/jpeg, image/jpg"
                                onChange={e => setGambarFile(e.target.files[0])}
                                className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
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

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Deskripsi Singkat</label>
                            <textarea
                                required placeholder="Deskripsi pendek kelompok..." rows="2" value={content} onChange={e => setContent(e.target.value)}
                                className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                            />
                        </div>
                    </div>

                    {/* Anggota Section */}
                    <div className="border-t border-gray-200 dark:border-gray-800 pt-5 mt-5">
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data Anggota Kelompok</label>
                            <button type="button" onClick={handleAddMember} className="text-xs bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 px-3 py-1.5 rounded flex items-center gap-1 transition-colors">
                                <UserPlus size={14} /> Tambah Anggota
                            </button>
                        </div>
                        
                        <div className="space-y-3">
                            {members.map((member, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <input
                                        type="text" placeholder="Nama Anggota" value={member.nama} onChange={e => handleMemberChange(idx, 'nama', e.target.value)}
                                        className="flex-1 p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <input
                                        type="text" placeholder="Jabatan (Opsional, misal: Ketua)" value={member.jabatan} onChange={e => handleMemberChange(idx, 'jabatan', e.target.value)}
                                        className="flex-1 p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button type="button" onClick={() => handleRemoveMember(idx)} className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                        <X size={16} />
                                    </button>
                                </div>
                            ))}
                            {members.length === 0 && (
                                <p className="text-sm text-gray-500 italic">Belum ada anggota. Klik "Tambah Anggota" untuk memasukkan data.</p>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end mt-4">
                        <button 
                            type="submit" 
                            disabled={isSubmitting || uploadingImage} 
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 font-medium"
                        >
                            {isSubmitting || uploadingImage ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : <CheckSquare size={18} />} 
                            {isSubmitting ? 'Menyimpan...' : uploadingImage ? 'Upload...' : 'Simpan Data'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-80 flex-shrink-0">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><Search size={16} /></div>
                        <input
                            type="text" placeholder="Cari berdasarkan nama..." value={filter} onChange={e => setFilter(e.target.value)}
                            className="w-full pl-10 p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                        />
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                        {selectedIds.length > 0 && (
                            <button onClick={handleBulkDelete} className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/30 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors shadow-sm whitespace-nowrap">
                                <Trash2 size={16} /> Hapus ({selectedIds.length})
                            </button>
                        )}
                        <button onClick={handleRefresh} className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm whitespace-nowrap">
                            <RefreshCw size={16} className={loading ? 'animate-spin text-blue-500' : 'text-gray-500'} />
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
                                        className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-50 dark:bg-gray-800"
                                        checked={filteredTeam.length > 0 && selectedIds.length === filteredTeam.length}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th className="px-6 py-4 font-medium w-1/3">Tim</th>
                                <th className="px-6 py-4 font-medium">Anggota</th>
                                <th className="px-6 py-4 font-medium w-1/6 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {filteredTeam.map(item => (
                                <tr key={item.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${selectedIds.includes(item.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                                    <td className="px-6 py-4">
                                        <input 
                                            type="checkbox" 
                                            className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-50 dark:bg-gray-800"
                                            checked={selectedIds.includes(item.id)}
                                            onChange={() => toggleSelect(item.id)}
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {item.gambar ? (
                                                <img src={item.gambar} alt="Logo" className="w-10 h-10 rounded object-cover border border-gray-200" />
                                            ) : (
                                                <div className="w-10 h-10 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                                                    <ImageIcon size={16} />
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">{item.title}</div>
                                                {item.instagram_link && (
                                                    <a href={item.instagram_link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">Instagram</a>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                        <div className="text-xs">
                                            {item.team_members && item.team_members.length > 0 
                                                ? <span className="font-medium px-2 py-1 bg-blue-50 text-blue-600 rounded">{item.team_members.length} Orang</span> 
                                                : <span className="text-gray-400 italic">Belum ada</span>
                                            }
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleEditClick(item)} className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(item.id)} className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredTeam.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <Users size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
                                            <p className="text-lg font-medium text-gray-900 dark:text-gray-200">Tidak ada data ditemukan</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
