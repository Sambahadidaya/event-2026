'use client';

import { useState, useEffect } from 'react';
import { getAdmins, addAdmin, deleteAdmin } from '@/api/supabase/admin';
import { Shield, Plus, Trash2, Edit, RefreshCw, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AdminStatusPage() {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({ nama: '', email: '', password: '', role: 'admin_pkkmb' });
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const fetchAdmins = async () => {
        setLoading(true);
        const data = await getAdmins();
        
        if (data) {
            setAdmins(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchAdmins();
    }, []);

    const showMessage = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 5000);
    };

    const handleAddAdmin = async (e) => {
        e.preventDefault();
        setActionLoading(true);

        try {
            const res = await addAdmin({
                nama: formData.nama,
                email: formData.email,
                password: formData.password,
                role: formData.role
            });

            if (!res.success) throw new Error(res.error);

            showMessage('Admin berhasil ditambahkan!');
            setShowAddModal(false);
            setFormData({ nama: '', email: '', password: '', role: 'admin_pkkmb' });
            fetchAdmins();

        } catch (error) {
            showMessage(error.message, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Apakah Anda yakin ingin menghapus admin ini?')) return;
        setActionLoading(true);
        
        const res = await deleteAdmin(id);
        
        if (!res.success) {
            showMessage('Gagal menghapus admin: ' + res.error, 'error');
        } else {
            showMessage('Admin berhasil dihapus');
            fetchAdmins();
        }
        setActionLoading(false);
    };

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Shield className="text-violet-500" /> Manajemen Status Admin
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Kelola akun dan role admin sistem.</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button onClick={fetchAdmins} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-colors text-sm">
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> <span className="hidden sm:inline">Refresh</span>
                    </button>
                    <button onClick={() => setShowAddModal(true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition-colors text-sm shadow-lg shadow-violet-500/20">
                        <UserPlus size={18} /> Tambah Admin
                    </button>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium animate-in fade-in slide-in-from-top-2 ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/20 dark:border-red-800/30' : 'bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/30'}`}>
                    {message.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                    {message.text}
                </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="px-6 py-4">Nama Lengkap</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Terakhir Login</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-slate-500">Memuat data admin...</td>
                                </tr>
                            ) : admins.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-slate-500">Belum ada data admin.</td>
                                </tr>
                            ) : (
                                admins.map((admin) => {
                                    // Hitung selisih waktu dari last_active
                                    const lastActiveDate = new Date(admin.last_active);
                                    const now = new Date();
                                    const diffMinutes = Math.abs(now - lastActiveDate) / 60000;
                                    const isActuallyOnline = admin.is_online && diffMinutes < 5;

                                    return (
                                        <tr key={admin.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">{admin.nama}</td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{admin.email}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-md text-xs font-bold capitalize ${
                                                    admin.role === 'super_admin' ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400' :
                                                    admin.role === 'admin_pkkmb' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' :
                                                    'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                                                }`}>
                                                    {admin.role.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-2.5 h-2.5 rounded-full ${isActuallyOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`}></span>
                                                    <span className={`text-xs font-medium ${isActuallyOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                                        {isActuallyOnline ? 'Online' : 'Offline'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                                                {admin.last_active ? new Date(admin.last_active).toLocaleString('id-ID', {
                                                    dateStyle: 'medium',
                                                    timeStyle: 'short'
                                                }) : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => handleDelete(admin.id)}
                                                    disabled={admin.role === 'super_admin' || actionLoading}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title="Hapus Admin"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Admin Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Tambah Admin Baru</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><Plus className="rotate-45" /></button>
                        </div>
                        <form onSubmit={handleAddAdmin} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap</label>
                                <input type="text" required value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                                <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                                <input type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role</label>
                                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all">
                                    <option value="admin_pkkmb">Admin PKKMB</option>
                                    <option value="admin_pose">Admin POSE</option>
                                </select>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 rounded-xl font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors">Batal</button>
                                <button type="submit" disabled={actionLoading} className="flex-1 py-2.5 rounded-xl font-medium bg-violet-600 hover:bg-violet-700 text-white transition-colors disabled:opacity-50">
                                    {actionLoading ? 'Menyimpan...' : 'Simpan Admin'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
