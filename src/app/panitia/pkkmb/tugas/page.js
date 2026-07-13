'use client';

import { useState, useEffect } from 'react';
import { getMateri, getTugas, deleteTugas } from '@/api/supabase/materi';
import { BookOpen, RefreshCw, Trash2, Image as ImageIcon, Search } from 'lucide-react';

export default function AdminPkkmbTugas() {
    const [materiList, setMateriList] = useState([]);
    const [tugasList, setTugasList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMateri, setSelectedMateri] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [previewImage, setPreviewImage] = useState(null);

    const fetchMateri = async () => {
        const data = await getMateri();
        setMateriList(data || []);
    };

    const fetchTugas = async () => {
        setLoading(true);
        const data = await getTugas(selectedMateri || null);
        setTugasList(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchMateri();
    }, []);

    useEffect(() => {
        fetchTugas();
    }, [selectedMateri]);

    const handleDelete = async (id) => {
        if (!confirm('Hapus tugas ini?')) return;
        const res = await deleteTugas(id);
        if (!res.success) {
            alert('Gagal menghapus: ' + res.error);
        } else {
            fetchTugas();
        }
    };

    const filteredTugas = tugasList.filter(t => 
        t.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.nim.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.kampus.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Review Tugas Materi</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Pantau dan kelola tugas yang dikumpulkan peserta PKKMB per materi.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchTugas}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl transition-colors shadow-sm"
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Filter Berdasarkan Materi</label>
                    <select 
                        value={selectedMateri} 
                        onChange={e => setSelectedMateri(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                        <option value="">Semua Materi</option>
                        {materiList.map(m => (
                            <option key={m.id} value={m.id}>{m.judul}</option>
                        ))}
                    </select>
                </div>
                <div className="flex-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Cari Peserta</label>
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Cari nama, NIM, atau kampus..." 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-700 text-xs uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400">
                            <tr>
                                <th className="px-5 py-3 text-left">Materi</th>
                                <th className="px-5 py-3 text-left">Nama / NIM</th>
                                <th className="px-5 py-3 text-left">Kampus</th>
                                <th className="px-5 py-3 text-center">Bukti Tugas</th>
                                <th className="px-5 py-3 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {loading ? (
                                <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400 animate-pulse">Memuat data...</td></tr>
                            ) : filteredTugas.length === 0 ? (
                                <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400">Belum ada tugas yang dikumpulkan</td></tr>
                            ) : filteredTugas.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/30 transition-colors">
                                    <td className="px-5 py-4 text-gray-700 dark:text-gray-300">
                                        <div className="flex items-center gap-2">
                                            <BookOpen size={16} className="text-blue-500" />
                                            <span className="font-medium line-clamp-1">{item.materi_pkkmb?.judul}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="font-bold text-gray-900 dark:text-white">{item.nama}</div>
                                        <div className="text-xs text-gray-500 mt-0.5">{item.nim}</div>
                                    </td>
                                    <td className="px-5 py-4 text-gray-600 dark:text-gray-400">{item.kampus}</td>
                                    <td className="px-5 py-4 text-center">
                                        <button 
                                            onClick={() => setPreviewImage(item.file_tugas)}
                                            className="mx-auto w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center hover:bg-blue-100 transition-colors"
                                            title="Lihat Foto"
                                        >
                                            <ImageIcon size={18} />
                                        </button>
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <button onClick={() => handleDelete(item.id)} className="w-8 h-8 mx-auto rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 flex items-center justify-center transition-colors"><Trash2 size={14} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Image Preview */}
            {previewImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in" onClick={() => setPreviewImage(null)}>
                    <div className="max-w-4xl max-h-[90vh] relative">
                        <img src={previewImage} alt="Preview Tugas" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" />
                        <button 
                            className="absolute -top-4 -right-4 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                            onClick={(e) => { e.stopPropagation(); setPreviewImage(null); }}
                        >
                            &times;
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
