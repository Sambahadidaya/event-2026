'use client';

import { useState, useEffect } from 'react';
import { getJadwalAcara } from '@/api/supabase/public/jadwal';
import { upsertJadwalAcara, deleteJadwalAcara } from '@/api/supabase/admin/jadwal';
import { Calendar, Plus, Edit2, Trash2, CheckSquare, X, RefreshCw } from 'lucide-react';

export default function AdminPoseJadwalAcara() {
    const [jadwalList, setJadwalList] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [jenisJadwal, setJenisJadwal] = useState('pendaftaran');
    const [waktuMulai, setWaktuMulai] = useState('');
    const [waktuSelesai, setWaktuSelesai] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        const data = await getJadwalAcara();
        if (data) {
            setJadwalList(data.filter(d => d.site === 'pose'));
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const resetForm = () => {
        setEditingId(null);
        setJenisJadwal('pendaftaran');
        setWaktuMulai('');
        setWaktuSelesai('');
        setShowForm(false);
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        setJenisJadwal(item.jenis_jadwal);
        // Load exactly the UTC string and adapt for datetime-local input (stripping the Z and correcting offset)
        // Actually, if we just want to load the literal time inputted ignoring the timezone shifts, 
        // we extract the YYYY-MM-DDTHH:mm string. 
        // We will store it exactly as string UTC: e.g. "2026-06-04T00:00:00.000Z".
        // When we edit, we want the input to show "2026-06-04T00:00".
        setWaktuMulai(item.waktu_mulai ? item.waktu_mulai.substring(0, 16) : '');
        setWaktuSelesai(item.waktu_selesai ? item.waktu_selesai.substring(0, 16) : '');
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const payload = {
            site: 'pose',
            jenis_jadwal: jenisJadwal,
            // Appending 'Z' treats the local input directly as UTC to preserve the exact date/time in the database without offset shifts.
            waktu_mulai: new Date(waktuMulai + 'Z').toISOString(),
            waktu_selesai: new Date(waktuSelesai + 'Z').toISOString(),
        };

        const res = await upsertJadwalAcara(payload, editingId);

        if (!res.success) {
            alert('Gagal menyimpan jadwal: ' + res.error);
        } else {
            resetForm();
            fetchData();
        }
        setIsSubmitting(false);
    };

    const handleDelete = async (id) => {
        if (!confirm('Hapus jadwal ini?')) return;
        const res = await deleteJadwalAcara(id);
        if (!res.success) {
            alert('Gagal menghapus: ' + res.error);
        } else {
            fetchData();
        }
    };

    const JENIS_OPTIONS = ['pendaftaran', 'seleksi', 'acara'];

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Manajemen Jadwal Akses</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Atur jadwal kapan pendaftaran, seleksi, dan acara POSE berlangsung.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchData}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl transition-colors shadow-sm"
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                    <button
                        onClick={() => { resetForm(); setShowForm(true); }}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors"
                    >
                        <Plus size={16} /> Tambah Jadwal
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-blue-100 dark:border-blue-900/50 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 flex items-center justify-between">
                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            {editingId ? <><Edit2 size={18} className="text-orange-500" /> Edit Jadwal</> : <><Calendar size={18} className="text-blue-500" /> Buat Jadwal Baru</>}
                        </h3>
                        <button type="button" onClick={resetForm} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Tahapan *</label>
                                <select required value={jenisJadwal} onChange={e => setJenisJadwal(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800">
                                    {JENIS_OPTIONS.map(j => <option key={j} value={j}>{j.charAt(0).toUpperCase() + j.slice(1)}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Waktu Mulai *</label>
                                <input required type="datetime-local" value={waktuMulai} onChange={e => setWaktuMulai(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Waktu Selesai *</label>
                                <input required type="datetime-local" value={waktuSelesai} onChange={e => setWaktuSelesai(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={resetForm} className="px-5 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-colors">Batal</button>
                            <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 text-white shadow-sm transition-all bg-blue-600 hover:bg-blue-700">
                                {isSubmitting ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckSquare size={16} />}
                                Simpan
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-700 text-xs uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400">
                            <tr>
                                <th className="px-5 py-3 text-left">Tahapan</th>
                                <th className="px-5 py-3 text-left">Waktu Mulai</th>
                                <th className="px-5 py-3 text-left">Waktu Selesai</th>
                                <th className="px-5 py-3 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {loading ? (
                                <tr><td colSpan={4} className="px-5 py-8 text-center text-gray-400 animate-pulse">Memuat data...</td></tr>
                            ) : jadwalList.length === 0 ? (
                                <tr><td colSpan={4} className="px-5 py-8 text-center text-gray-400">Belum ada jadwal yang diatur</td></tr>
                            ) : jadwalList.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/30 transition-colors">
                                    <td className="px-5 py-4 font-bold text-gray-900 dark:text-white capitalize">{item.jenis_jadwal}</td>
                                    <td className="px-5 py-4 text-gray-600 dark:text-gray-300">
                                        {/* Display exact time without local conversion shifts */}
                                        {item.waktu_mulai.substring(0, 16).replace('T', ' ')}
                                    </td>
                                    <td className="px-5 py-4 text-gray-600 dark:text-gray-300">
                                        {item.waktu_selesai.substring(0, 16).replace('T', ' ')}
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <div className="flex justify-center gap-1.5">
                                            <button onClick={() => handleEdit(item)} className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-500 hover:bg-orange-100 dark:hover:bg-orange-900/40 flex items-center justify-center transition-colors"><Edit2 size={14} /></button>
                                            <button onClick={() => handleDelete(item.id)} className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 flex items-center justify-center transition-colors"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
