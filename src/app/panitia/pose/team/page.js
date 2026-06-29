'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { RefreshCw, Plus, Trash2, Search, Users, Edit2, CheckSquare, X, Link as LinkIcon, Image as ImageIcon, UserPlus, Trophy, Calendar } from 'lucide-react';

const JENIS_LOMBA = ['Kreativitas', 'Olahraga'];
const NAMA_LOMBA = {
    'Olahraga': ['Badminton', 'Tenis Meja', 'Tarik Tambang', 'Pidato Bahasa Inggris', 'Puisi', 'Mobile Legend'],
    'Kreativitas': ['Desain Poster', 'Laporan Keuangan', 'Bisnis Model Kanvas', 'Desain Kemasan', 'Film Pendek', 'Konten Promosi Digital']
};

export default function AdminPoseTeam() {
    // --- STATE TIM ---
    const [team, setTeam] = useState([]);
    const [filter, setFilter] = useState('');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [instagramLink, setInstagramLink] = useState('');
    const [gambar, setGambar] = useState('');
    const [gambarFile, setGambarFile] = useState(null);
    const [jenisLomba, setJenisLomba] = useState('');
    const [namaLomba, setNamaLomba] = useState('');
    const [poin, setPoin] = useState([false, false, false, false, false]); // poin1 to poin5
    const [members, setMembers] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);

    // --- STATE JADWAL ---
    const [jadwal, setJadwal] = useState([]);
    const [editingJadwalId, setEditingJadwalId] = useState(null);
    const [team1Id, setTeam1Id] = useState('');
    const [team2Id, setTeam2Id] = useState('');
    const [waktu, setWaktu] = useState('');
    const [jadwalNamaLomba, setJadwalNamaLomba] = useState('');
    const [statusJadwal, setStatusJadwal] = useState('Belum Mulai');
    const [skor1, setSkor1] = useState(0);
    const [skor2, setSkor2] = useState(0);

    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmittingJadwal, setIsSubmittingJadwal] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        // Fetch Teams
        const { data: teamData } = await supabase.from('team').select('*, team_members(*)').eq('type', 'pose').order('created_at', { ascending: false });
        if (teamData) setTeam(teamData);
        
        // Fetch Jadwal
        const { data: jadwalData } = await supabase.from('jadwal_pertandingan').select('*, team1:team1_id(*), team2:team2_id(*)').order('waktu', { ascending: true });
        if (jadwalData) setJadwal(jadwalData);
        
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRefresh = () => {
        fetchData();
        setSelectedIds([]);
        cancelEdit();
        cancelEditJadwal();
    };

    // --- HANDLERS TIM ---
    const handleAddMember = () => setMembers([...members, { nama: '', jabatan: '' }]);
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
    const handlePoinChange = (index) => {
        const newPoin = [...poin];
        newPoin[index] = !newPoin[index];
        setPoin(newPoin);
    };

    const handleAddOrUpdate = async (e) => {
        e.preventDefault();
        if (!title.trim()) return;

        setIsSubmitting(true);
        let finalGambarUrl = gambar;

        if (gambarFile) {
            setUploadingImage(true);
            const fileExt = gambarFile.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `pose/${fileName}`;

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
            type: 'pose',
            instagram_link: instagramLink,
            gambar: finalGambarUrl,
            jenis_lomba: jenisLomba,
            nama_lomba: namaLomba,
            poin1: poin[0], poin2: poin[1], poin3: poin[2], poin4: poin[3], poin5: poin[4]
        };

        let currentTeamId = editingId;

        if (editingId) {
            const { error } = await supabase.from('team').update(payload).eq('id', editingId);
            if (error) alert('Gagal mengupdate tim: ' + error.message);
        } else {
            const { data, error } = await supabase.from('team').insert([payload]).select().single();
            if (error) alert('Gagal menyimpan tim: ' + error.message);
            else currentTeamId = data.id;
        }

        if (currentTeamId) {
            await supabase.from('team_members').delete().eq('team_id', currentTeamId);
            const validMembers = members.filter(m => m.nama.trim() !== '').map(m => ({ team_id: currentTeamId, nama: m.nama, jabatan: m.jabatan }));
            if (validMembers.length > 0) {
                await supabase.from('team_members').insert(validMembers);
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
        setJenisLomba(item.jenis_lomba || '');
        setNamaLomba(item.nama_lomba || '');
        setPoin([item.poin1, item.poin2, item.poin3, item.poin4, item.poin5]);
        
        if (item.team_members && item.team_members.length > 0) {
            setMembers(item.team_members.map(m => ({ nama: m.nama, jabatan: m.jabatan || '' })));
        } else {
            setMembers([]);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingId(null); setTitle(''); setContent(''); setInstagramLink(''); setGambar('');
        setGambarFile(null);
        setJenisLomba(''); setNamaLomba(''); setPoin([false, false, false, false, false]); setMembers([]);
    };

    const handleDelete = async (id) => {
        if (!confirm('Hapus tim secara permanen?')) return;
        await supabase.from('team').delete().eq('id', id);
        handleRefresh();
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Hapus ${selectedIds.length} tim terpilih?`)) return;
        await supabase.from('team').delete().in('id', selectedIds);
        handleRefresh();
    };

    const toggleSelectAll = (e) => setSelectedIds(e.target.checked ? filteredTeam.map(t => t.id) : []);
    const toggleSelect = (id) => setSelectedIds(selectedIds.includes(id) ? selectedIds.filter(itemId => itemId !== id) : [...selectedIds, id]);
    const filteredTeam = team.filter(t => t.title.toLowerCase().includes(filter.toLowerCase()));

    // --- HANDLERS JADWAL ---
    const handleAddOrUpdateJadwal = async (e) => {
        e.preventDefault();
        if (!team1Id || !team2Id || !waktu || !jadwalNamaLomba) return;

        setIsSubmittingJadwal(true);
        const payload = {
            team1_id: team1Id,
            team2_id: team2Id,
            waktu: new Date(waktu).toISOString(),
            nama_lomba: jadwalNamaLomba,
            status: statusJadwal,
            skor_team1: skor1,
            skor_team2: skor2
        };

        if (editingJadwalId) {
            const { error } = await supabase.from('jadwal_pertandingan').update(payload).eq('id', editingJadwalId);
            if (error) alert('Gagal update jadwal: ' + error.message);
        } else {
            const { error } = await supabase.from('jadwal_pertandingan').insert([payload]);
            if (error) alert('Gagal simpan jadwal: ' + error.message);
        }

        cancelEditJadwal();
        handleRefresh();
        setIsSubmittingJadwal(false);
    };

    const handleEditJadwal = (item) => {
        setEditingJadwalId(item.id);
        setTeam1Id(item.team1_id);
        setTeam2Id(item.team2_id);
        // format datetime-local input requires YYYY-MM-DDThh:mm
        const dateObj = new Date(item.waktu);
        dateObj.setMinutes(dateObj.getMinutes() - dateObj.getTimezoneOffset());
        setWaktu(dateObj.toISOString().slice(0, 16));
        setJadwalNamaLomba(item.nama_lomba || '');
        setStatusJadwal(item.status || 'Belum Mulai');
        setSkor1(item.skor_team1 || 0);
        setSkor2(item.skor_team2 || 0);
        document.getElementById('jadwal-section').scrollIntoView({ behavior: 'smooth' });
    };

    const cancelEditJadwal = () => {
        setEditingJadwalId(null); setTeam1Id(''); setTeam2Id(''); setWaktu('');
        setJadwalNamaLomba(''); setStatusJadwal('Belum Mulai'); setSkor1(0); setSkor2(0);
    };

    const handleDeleteJadwal = async (id) => {
        if (!confirm('Hapus jadwal ini?')) return;
        await supabase.from('jadwal_pertandingan').delete().eq('id', id);
        handleRefresh();
    };

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
                                        {jenisLomba && NAMA_LOMBA[jenisLomba].map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status Poin / Kemenangan (Bagan)</label>
                                <div className="flex flex-wrap gap-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                    {[1, 2, 3, 4, 5].map((num, i) => (
                                        <label key={num} className="flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={poin[i]} 
                                                onChange={() => handlePoinChange(i)}
                                                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
                                            />
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Poin {num}</span>
                                        </label>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Gunakan poin ini untuk menentukan jumlah kemenangan atau progres bagan.</p>
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
                                    <div key={idx} className="flex items-center gap-2">
                                        <input
                                            type="text" placeholder="Nama Anggota" value={member.nama} onChange={e => handleMemberChange(idx, 'nama', e.target.value)}
                                            className="flex-1 p-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                        <input
                                            type="text" placeholder="Jabatan (Opsional)" value={member.jabatan} onChange={e => handleMemberChange(idx, 'jabatan', e.target.value)}
                                            className="flex-1 p-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                        <button type="button" onClick={() => handleRemoveMember(idx)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
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
                                    <th className="px-6 py-4 font-medium">Win Poin</th>
                                    <th className="px-6 py-4 font-medium w-1/6 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {filteredTeam.map(item => {
                                    const winCount = [item.poin1, item.poin2, item.poin3, item.poin4, item.poin5].filter(Boolean).length;
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
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-lg text-gray-900 dark:text-white">{winCount}</span>
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
                                        <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                            Tidak ada data tim.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* --- BAGIAN MANAJEMEN JADWAL --- */}
            <div id="jadwal-section" className="space-y-6 pt-8 border-t-2 border-dashed border-gray-200 dark:border-gray-800">
                <div className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                            {editingJadwalId ? <Edit2 size={20} className="text-orange-500" /> : <Calendar size={20} className="text-blue-500" />} 
                            {editingJadwalId ? 'Edit Jadwal Pertandingan' : 'Buat Jadwal Baru'}
                        </h3>
                        {editingJadwalId && (
                            <button onClick={cancelEditJadwal} className="text-sm flex items-center gap-1 text-gray-500 hover:text-red-500 transition-colors">
                                <X size={16} /> Batal Edit
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleAddOrUpdateJadwal} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Cabang Lomba</label>
                                <select 
                                    required value={jadwalNamaLomba} onChange={e => setJadwalNamaLomba(e.target.value)}
                                    className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Pilih...</option>
                                    {NAMA_LOMBA['Olahraga'].map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Waktu Pertandingan</label>
                                <input
                                    required type="datetime-local" value={waktu} onChange={e => setWaktu(e.target.value)}
                                    className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/50 space-y-4 md:col-span-2">
                                <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-4 items-end">
                                    {/* Tim 1 */}
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Tim 1</label>
                                            <select 
                                                required value={team1Id} onChange={e => setTeam1Id(e.target.value)}
                                                className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Pilih Tim...</option>
                                                {team.filter(t => t.jenis_lomba === 'Olahraga').map(t => <option key={t.id} value={t.id}>{t.title} ({t.nama_lomba})</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Skor Tim 1</label>
                                            <input
                                                type="number" min="0" value={skor1} onChange={e => setSkor1(parseInt(e.target.value) || 0)}
                                                className="w-full p-2 text-center text-lg font-bold border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                    
                                    {/* VS */}
                                    <div className="hidden md:flex flex-col items-center justify-center pb-4 px-2">
                                        <span className="font-black italic text-gray-400 text-xl">VS</span>
                                    </div>
                                    
                                    {/* Tim 2 */}
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Tim 2</label>
                                            <select 
                                                required value={team2Id} onChange={e => setTeam2Id(e.target.value)}
                                                className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">Pilih Tim...</option>
                                                {team.filter(t => t.jenis_lomba === 'Olahraga').map(t => <option key={t.id} value={t.id}>{t.title} ({t.nama_lomba})</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Skor Tim 2</label>
                                            <input
                                                type="number" min="0" value={skor2} onChange={e => setSkor2(parseInt(e.target.value) || 0)}
                                                className="w-full p-2 text-center text-lg font-bold border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status Pertandingan</label>
                                <select 
                                    value={statusJadwal} onChange={e => setStatusJadwal(e.target.value)}
                                    className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                                >
                                    <option value="Belum Mulai">⏳ Belum Mulai</option>
                                    <option value="Berlangsung">🔴 Berlangsung (Live)</option>
                                    <option value="Selesai">✅ Selesai</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button type="submit" disabled={isSubmittingJadwal} className={`px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 text-white shadow-sm transition-colors ${editingJadwalId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
                                {isSubmittingJadwal ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : (editingJadwalId ? <CheckSquare size={18} /> : <Plus size={18} />)}
                                {editingJadwalId ? 'Update Jadwal' : 'Simpan Jadwal'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Table Jadwal */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <div className="p-5 border-b border-gray-100 bg-gray-50/50 font-bold flex items-center gap-2">
                        <Trophy size={18} className="text-yellow-500" /> Daftar Jadwal & Hasil Pertandingan
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Lomba</th>
                                    <th className="px-6 py-3 font-medium">Waktu</th>
                                    <th className="px-6 py-3 font-medium text-center">Match (Tim 1 vs Tim 2)</th>
                                    <th className="px-6 py-3 font-medium text-center">Status</th>
                                    <th className="px-6 py-3 font-medium text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {jadwal.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-semibold text-gray-900">{item.nama_lomba}</td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {new Date(item.waktu).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-4">
                                                <div className="text-right font-bold w-1/3">{item.team1?.title || 'TBD'}</div>
                                                <div className="bg-gray-100 px-3 py-1 rounded font-black text-lg">
                                                    {item.skor_team1} - {item.skor_team2}
                                                </div>
                                                <div className="font-bold w-1/3">{item.team2?.title || 'TBD'}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${item.status === 'Berlangsung' ? 'bg-red-100 text-red-600' : item.status === 'Selesai' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleEditJadwal(item)} className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 flex items-center justify-center">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDeleteJadwal(item.id)} className="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {jadwal.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-gray-500">Tidak ada jadwal.</td>
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
