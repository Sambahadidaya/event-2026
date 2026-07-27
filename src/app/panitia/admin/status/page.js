'use client';

import { useState, useEffect, useRef } from 'react';
import { getAdmins, addAdmin, deleteAdmin, updateAdmin } from '@/api/supabase/admin/admin';
import { ALL_ROLES } from '@/lib/adminRoleData';
import { Shield, Plus, Trash2, Edit, RefreshCw, UserPlus, CheckCircle2, AlertCircle, Search, ChevronDown, Lock, Filter, Users } from 'lucide-react';

export default function AdminStatusPage() {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);

    // Tab Switch State ('pkkmb' | 'pose')
    const [activeTab, setActiveTab] = useState('pkkmb');

    // Search Bar State (Nama, Email, Role)
    const [searchQuery, setSearchQuery] = useState('');

    // Status Filter State
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'aktif' | 'diblokir'
    const [onlineFilter, setOnlineFilter] = useState('all'); // 'all' | 'online' | 'offline'

    // Modal Tambah Admin State
    const [showAddModal, setShowAddModal] = useState(false);
    const [formData, setFormData] = useState({ nama: '', email: '', password: '', role: 'admin_pkkmb' });

    // Modal Edit Admin State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editAdminId, setEditAdminId] = useState(null);
    const [editForm, setEditForm] = useState({ nama: '', email: '', role: '', limit_login: false });

    // Role Dropdown Searchable State (Di dalam Modal Edit/Tambah)
    const [roleSearch, setRoleSearch] = useState('');
    const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
    const roleDropdownRef = useRef(null);

    // Action & Refresh State
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [lastRefreshed, setLastRefreshed] = useState(null);

    const fetchAdmins = async () => {
        setLoading(true);
        const data = await getAdmins();

        if (data) {
            setAdmins(data);
        }
        setLastRefreshed(new Date());
        setLoading(false);
    };

    useEffect(() => {
        fetchAdmins();
    }, []);

    // Close searchable dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target)) {
                setRoleDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
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

    const openEditModal = (admin) => {
        setEditAdminId(admin.id);
        setEditForm({
            nama: admin.nama,
            email: admin.email,
            role: admin.role,
            limit_login: Boolean(admin.limit_login)
        });
        setRoleSearch('');
        setRoleDropdownOpen(false);
        setShowEditModal(true);
    };

    const handleUpdateAdmin = async (e) => {
        e.preventDefault();
        setActionLoading(true);

        try {
            const res = await updateAdmin(editAdminId, {
                nama: editForm.nama,
                role: editForm.role,
                limit_login: editForm.limit_login
            });

            if (!res.success) throw new Error(res.error);

            showMessage('Admin berhasil diperbarui!');
            setShowEditModal(false);
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

    // Filter roles for modal edit dropdown
    const filteredRoles = ALL_ROLES.filter(r =>
        r.label.toLowerCase().includes(roleSearch.toLowerCase()) ||
        r.value.toLowerCase().includes(roleSearch.toLowerCase())
    );

    const selectedRoleLabel = ALL_ROLES.find(r => r.value === editForm.role)?.label || editForm.role;

    // Helper untuk klasifikasi role
    const isPkkmbRole = (role) => {
        if (!role) return false;
        if (role === 'super_admin') return true;
        return role.startsWith('admin_pkkmb');
    };

    const isPoseRole = (role) => {
        if (!role) return false;
        if (role === 'super_admin') return true;
        return role.startsWith('admin_pose');
    };

    // Total hitungan per tab (client-side)
    const pkkmbCount = admins.filter(a => isPkkmbRole(a.role)).length;
    const poseCount = admins.filter(a => isPoseRole(a.role)).length;

    // CLIENT-SIDE FILTERING & SEARCHING (Tanpa re-fetch database)
    const displayedAdmins = admins.filter((admin) => {
        // 1. Tab Filtering (PKKMB vs POSE)
        if (activeTab === 'pkkmb' && !isPkkmbRole(admin.role)) return false;
        if (activeTab === 'pose' && !isPoseRole(admin.role)) return false;

        // 2. Search Query Filtering (Nama, Email, Role Key, Role Label)
        if (searchQuery.trim() !== '') {
            const q = searchQuery.toLowerCase();
            const roleLabel = (ALL_ROLES.find(r => r.value === admin.role)?.label || '').toLowerCase();
            const nameMatch = admin.nama ? admin.nama.toLowerCase().includes(q) : false;
            const emailMatch = admin.email ? admin.email.toLowerCase().includes(q) : false;
            const roleMatch = admin.role ? admin.role.toLowerCase().includes(q) : false;
            const roleLabelMatch = roleLabel.includes(q);

            if (!nameMatch && !emailMatch && !roleMatch && !roleLabelMatch) {
                return false;
            }
        }

        // 3. Status Blokir Filter (limit_login)
        if (statusFilter === 'aktif' && admin.limit_login) return false;
        if (statusFilter === 'diblokir' && !admin.limit_login) return false;

        // 4. Online/Offline Filter
        if (onlineFilter === 'online' && !admin.is_online) return false;
        if (onlineFilter === 'offline' && admin.is_online) return false;

        return true;
    });

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            {/* Header Title & Top Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Shield className="text-violet-500" /> Manajemen Status Admin
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Kelola akun dan role admin sistem.</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button onClick={fetchAdmins} className="flex-1 md:flex-none flex flex-col items-center justify-center gap-0.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium transition-colors text-sm">
                        <div className="flex items-center gap-2">
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                            <span>Refresh</span>
                        </div>
                        {lastRefreshed && (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                                Terakhir: {lastRefreshed.toLocaleTimeString('id-ID')}
                            </span>
                        )}
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

            {/* TAB SWITCH, SEARCH BAR, AND FILTERS BAR */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                {/* Tab Switch Buttons (PKKMB vs POSE) */}
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
                    <button
                        onClick={() => setActiveTab('pkkmb')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'pkkmb'
                                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                    >
                        <span>Admin PKKMB</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'pkkmb' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                            }`}>
                            {pkkmbCount}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('pose')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'pose'
                                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                    >
                        <span>Admin POSE</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === 'pose' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                            }`}>
                            {poseCount}
                        </span>
                    </button>
                </div>

                {/* Right Side: Search Bar & Status Filters */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 lg:max-w-2xl">
                    {/* Search Bar */}
                    <div className="relative flex-1">
                        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari nama, email, atau role..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:ring-2 focus:ring-violet-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all"
                        />
                    </div>

                    {/* Filter Status Blokir */}
                    <div className="flex items-center gap-2">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 text-sm font-medium focus:ring-2 focus:ring-violet-500 outline-none cursor-pointer"
                        >
                            <option value="all">Semua Status Blokir</option>
                            <option value="aktif">Aktif (Bisa Login)</option>
                            <option value="diblokir">Diblokir (limit_login)</option>
                        </select>
                    </div>

                    {/* Filter Online */}
                    <div className="flex items-center gap-2">
                        <select
                            value={onlineFilter}
                            onChange={(e) => setOnlineFilter(e.target.value)}
                            className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 text-sm font-medium focus:ring-2 focus:ring-violet-500 outline-none cursor-pointer"
                        >
                            <option value="all">Semua Presensi</option>
                            <option value="online">Online Saja</option>
                            <option value="offline">Offline Saja</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* MAIN ADMIN TABLE */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="px-6 py-4">Nama Lengkap</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Diblokir</th>
                                <th className="px-6 py-4">Gagal Login</th>
                                <th className="px-6 py-4">Terakhir Login</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-8 text-center text-slate-500">Memuat data admin...</td>
                                </tr>
                            ) : displayedAdmins.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-8 text-center text-slate-500">
                                        Tidak ada data admin yang sesuai dengan kriteria pencarian / filter.
                                    </td>
                                </tr>
                            ) : (
                                displayedAdmins.map((admin) => {
                                    // Status online murni sinkron dari DB (dikendalikan oleh layout.js saat auto-logout)
                                    const isActuallyOnline = Boolean(admin.is_online);
                                    const isBlocked = Boolean(admin.limit_login);
                                    const failedAttempts = admin.failed_attempts || 0;

                                    return (
                                        <tr key={admin.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">{admin.nama}</td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{admin.email}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${admin.role === 'super_admin' ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400' :
                                                        admin.role === 'admin_pkkmb' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' :
                                                            admin.role === 'admin_pose' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
                                                                'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                                                    }`}>
                                                    {ALL_ROLES.find(r => r.value === admin.role)?.label || admin.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-2.5 h-2.5 rounded-full ${isActuallyOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-400 dark:bg-slate-600'}`}></span>
                                                    <span className={`text-xs font-medium ${isActuallyOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                                        {isActuallyOnline ? 'Online' : 'Offline'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${isBlocked ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                                                    {isBlocked ? 'Diblokir' : 'Aktif'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`font-mono text-xs px-2 py-0.5 rounded-md ${failedAttempts > 0 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 font-bold' : 'text-slate-500'}`}>
                                                    {failedAttempts} kali
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                                                {admin.last_active ? new Date(admin.last_active).toLocaleString('id-ID', {
                                                    dateStyle: 'medium',
                                                    timeStyle: 'short'
                                                }) : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-1">
                                                <button
                                                    onClick={() => openEditModal(admin)}
                                                    disabled={actionLoading}
                                                    className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors disabled:opacity-50"
                                                    title="Edit Admin"
                                                >
                                                    <Edit size={18} />
                                                </button>
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
                                <input type="text" required value={formData.nama} onChange={e => setFormData({ ...formData, nama: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                                <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                                <input type="password" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role</label>
                                <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all">
                                    {ALL_ROLES.map(r => (
                                        <option key={r.value} value={r.value}>{r.label}</option>
                                    ))}
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

            {/* Edit Admin Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Edit Admin</h3>
                            <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><Plus className="rotate-45" /></button>
                        </div>
                        <form onSubmit={handleUpdateAdmin} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap</label>
                                <input
                                    type="text"
                                    required
                                    value={editForm.nama}
                                    onChange={e => setEditForm({ ...editForm, nama: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                                    Email <Lock size={13} className="text-slate-400" />
                                </label>
                                <input
                                    type="email"
                                    disabled
                                    value={editForm.email}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 text-slate-500 cursor-not-allowed outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                                    Password <Lock size={13} className="text-slate-400" />
                                </label>
                                <input
                                    type="password"
                                    disabled
                                    value="••••••••••••"
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 text-slate-500 cursor-not-allowed outline-none font-mono"
                                />
                            </div>

                            {/* Searchable Role Dropdown */}
                            <div className="relative" ref={roleDropdownRef}>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role</label>
                                <div
                                    onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white cursor-pointer flex items-center justify-between focus:ring-2 focus:ring-violet-500 transition-all"
                                >
                                    <span className="truncate">{selectedRoleLabel}</span>
                                    <ChevronDown size={18} className={`text-slate-400 transition-transform ${roleDropdownOpen ? 'rotate-180' : ''}`} />
                                </div>

                                {roleDropdownOpen && (
                                    <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden max-h-60 flex flex-col animate-in fade-in zoom-in-95 duration-150">
                                        <div className="p-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50">
                                            <Search size={16} className="text-slate-400 ml-1" />
                                            <input
                                                type="text"
                                                placeholder="Cari role..."
                                                value={roleSearch}
                                                onChange={e => setRoleSearch(e.target.value)}
                                                onClick={e => e.stopPropagation()}
                                                className="w-full bg-transparent text-sm text-slate-900 dark:text-white outline-none"
                                                autoFocus
                                            />
                                        </div>
                                        <div className="overflow-y-auto py-1 divide-y divide-slate-100 dark:divide-slate-800/50">
                                            {filteredRoles.length === 0 ? (
                                                <div className="p-3 text-xs text-center text-slate-400">Tidak ada role yang cocok</div>
                                            ) : (
                                                filteredRoles.map(role => (
                                                    <div
                                                        key={role.value}
                                                        onClick={() => {
                                                            setEditForm({ ...editForm, role: role.value });
                                                            setRoleDropdownOpen(false);
                                                        }}
                                                        className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors flex items-center justify-between ${editForm.role === role.value ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 font-semibold' : 'text-slate-700 dark:text-slate-300'}`}
                                                    >
                                                        <span>{role.label}</span>
                                                        <span className="text-[10px] text-slate-400 font-mono">{role.value}</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Limit Login / Diblokir Toggle */}
                            <div className="pt-2">
                                <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer transition-colors">
                                    <div>
                                        <span className="block text-sm font-medium text-slate-800 dark:text-slate-200">Blokir Akun Admin</span>
                                        <span className="block text-xs text-slate-500 dark:text-slate-400">Jika di-uncheck (false), percobaan gagal akan di-reset ke 0</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={editForm.limit_login}
                                        onChange={e => setEditForm({ ...editForm, limit_login: e.target.checked })}
                                        className="w-5 h-5 accent-violet-600 rounded cursor-pointer"
                                    />
                                </label>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-2.5 rounded-xl font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors">Batal</button>
                                <button type="submit" disabled={actionLoading} className="flex-1 py-2.5 rounded-xl font-medium bg-violet-600 hover:bg-violet-700 text-white transition-colors disabled:opacity-50">
                                    {actionLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
