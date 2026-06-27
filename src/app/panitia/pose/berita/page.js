'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { RefreshCw, Plus, Trash2, Search, FileText, Edit2, CheckSquare, X } from 'lucide-react';

export default function AdminPoseBerita() {
    const [berita, setBerita] = useState([]);
    const [filter, setFilter] = useState('');
    
    // Form States
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [customDate, setCustomDate] = useState('');
    const [editingId, setEditingId] = useState(null);
    
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Bulk action state
    const [selectedIds, setSelectedIds] = useState([]);

    const fetchBerita = async () => {
        setLoading(true);
        const cached = localStorage.getItem('pose_berita');
        const cacheTime = localStorage.getItem('pose_berita_time');
        const ONE_DAY = 86400000;

        if (cached && cacheTime && (Date.now() - parseInt(cacheTime)) < ONE_DAY) {
            setBerita(JSON.parse(cached));
            setLoading(false);
            return;
        }

        const { data } = await supabase.from('berita').select('*').eq('type', 'pose').order('created_at', { ascending: false });
        if (data) {
            setBerita(data);
            localStorage.setItem('pose_berita', JSON.stringify(data));
            localStorage.setItem('pose_berita_time', Date.now().toString());
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchBerita();
    }, []);

    const handleRefresh = () => {
        localStorage.removeItem('pose_berita');
        localStorage.removeItem('pose_berita_time');
        fetchBerita();
        setSelectedIds([]);
        cancelEdit();
    };

    const handleAddOrUpdate = async (e) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) return;

        setIsSubmitting(true);
        
        const payload = { 
            title, 
            content, 
            type: 'pose',
            custom_date: customDate || null 
        };

        if (editingId) {
            const { error } = await supabase.from('berita').update(payload).eq('id', editingId);
            if (!error) {
                cancelEdit();
                handleRefresh();
            } else {
                alert('Gagal mengupdate: ' + error.message);
            }
        } else {
            const { error } = await supabase.from('berita').insert([payload]);
            if (!error) {
                cancelEdit();
                handleRefresh();
            } else {
                alert('Gagal menyimpan: ' + error.message);
            }
        }
        setIsSubmitting(false);
    };

    const handleEditClick = (item) => {
        setEditingId(item.id);
        setTitle(item.title);
        setContent(item.content);
        setCustomDate(item.custom_date || '');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setTitle('');
        setContent('');
        setCustomDate('');
    };

    const handleDelete = async (id) => {
        if (!confirm('Apakah Anda yakin ingin menghapus berita ini secara permanen?')) return;
        await supabase.from('berita').delete().eq('id', id);
        handleRefresh();
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Hapus ${selectedIds.length} data terpilih secara permanen?`)) return;
        await supabase.from('berita').delete().in('id', selectedIds);
        handleRefresh();
    };

    const toggleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(filteredBerita.map(b => b.id));
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

    const filteredBerita = berita.filter(b => b.title.toLowerCase().includes(filter.toLowerCase()));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                        {editingId ? <Edit2 size={20} className="text-orange-500" /> : <FileText size={20} className="text-blue-500" />} 
                        {editingId ? 'Edit Pemberitahuan POSE' : 'Buat Pemberitahuan POSE'}
                    </h3>
                    {editingId && (
                        <button onClick={cancelEdit} className="text-sm flex items-center gap-1 text-gray-500 hover:text-red-500 transition-colors">
                            <X size={16} /> Batal Edit
                        </button>
                    )}
                </div>

                <form onSubmit={handleAddOrUpdate} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Judul Informasi</label>
                            <input
                                required type="text" placeholder="Masukkan judul..." value={title} onChange={e => setTitle(e.target.value)}
                                className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tanggal Kegiatan (Opsional)</label>
                            <input
                                type="date" value={customDate} onChange={e => setCustomDate(e.target.value)}
                                className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Isi Konten Lengkap</label>
                        <textarea
                            required placeholder="Tuliskan detail informasi di sini..." rows="4" value={content} onChange={e => setContent(e.target.value)}
                            className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 focus:bg-white dark:focus:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                        />
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" disabled={isSubmitting} className={`px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 text-white shadow-sm transition-colors ${editingId ? 'bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300' : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400'}`}>
                            {isSubmitting ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> : (editingId ? <CheckSquare size={18} /> : <Plus size={18} />)}
                            {isSubmitting ? 'Menyimpan...' : (editingId ? 'Update Berita' : 'Publikasi Berita')}
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-80 flex-shrink-0">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"><Search size={16} /></div>
                        <input
                            type="text" placeholder="Cari berdasarkan judul..." value={filter} onChange={e => setFilter(e.target.value)}
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
                                        checked={filteredBerita.length > 0 && selectedIds.length === filteredBerita.length}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th className="px-6 py-4 font-medium w-1/3">Judul Berita</th>
                                <th className="px-6 py-4 font-medium w-1/2">Cuplikan Konten</th>
                                <th className="px-6 py-4 font-medium w-1/6 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {filteredBerita.map(item => (
                                <tr key={item.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${selectedIds.includes(item.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                                    <td className="px-6 py-4">
                                        <input 
                                            type="checkbox" 
                                            className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-gray-50 dark:bg-gray-800"
                                            checked={selectedIds.includes(item.id)}
                                            onChange={() => toggleSelect(item.id)}
                                        />
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">
                                        <div className="line-clamp-2">{item.title}</div>
                                        <div className="flex gap-2 items-center mt-1">
                                            <span className="text-xs text-gray-400 font-normal">Buat: {new Date(item.created_at).toLocaleDateString('id-ID')}</span>
                                            {item.custom_date && (
                                                <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded font-medium">Kegiatan: {new Date(item.custom_date).toLocaleDateString('id-ID')}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                        <div className="line-clamp-2">{item.content}</div>
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
                            {filteredBerita.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <FileText size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
                                            <p className="text-lg font-medium text-gray-900 dark:text-gray-200">Tidak ada data ditemukan</p>
                                            <p className="text-sm mt-1">Data tabel berita kosong atau kata kunci tidak cocok.</p>
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
