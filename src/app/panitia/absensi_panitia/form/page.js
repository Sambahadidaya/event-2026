'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Plus, Edit, Trash2, Calendar, ShieldAlert } from 'lucide-react';
import { getCurrentAdmin } from '@/api/supabase/admin/auth';
import { getFormAbsen, createFormAbsen, updateFormAbsen, deleteFormAbsen } from '@/api/supabase/admin/absensi';
import { hasAccess } from '@/lib/adminRoleData';
import FormAbsenModal from '@/components/panitia/absensi/FormAbsenModal';
import ConfirmModal from '@/components/panitia/ConfirmModal';

export default function FormAbsensiPage() {
    const router = useRouter();
    const [admin, setAdmin] = useState(null);
    const [site, setSite] = useState('pkkmb');
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editData, setEditData] = useState(null);
    
    // Delete confirmation state
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [deletingLoading, setDeletingLoading] = useState(false);

    // Check user role permission
    useEffect(() => {
        const checkUser = async () => {
            const currentAdmin = await getCurrentAdmin();
            if (!currentAdmin || !hasAccess(currentAdmin.role, '/panitia/absensi_panitia/form')) {
                router.replace('/panitia/login');
                return;
            }
            setAdmin(currentAdmin);

            const isSuper = currentAdmin.role === 'super_admin';
            setIsSuperAdmin(isSuper);

            if (isSuper) {
                setSite('pkkmb');
            } else {
                const inferredSite = currentAdmin.role.includes('pose') || currentAdmin.type === 'pose' ? 'pose' : 'pkkmb';
                setSite(inferredSite);
            }
        };
        checkUser();
    }, [router]);

    // Fetch form absensi
    const fetchForms = useCallback(async (currentSite) => {
        if (!currentSite) return;
        setLoading(true);
        try {
            const res = await getFormAbsen(currentSite);
            if (res.success && res.data) {
                setForms(res.data || []);
            } else {
                setForms([]);
            }
        } catch (err) {
            console.error('Error fetching form absensi:', err);
            setForms([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (admin) {
            fetchForms(site);
        }
    }, [admin, site, fetchForms]);

    const handleSave = async (data) => {
        try {
            if (editData) {
                const res = await updateFormAbsen(editData.id, data);
                if (res.success) {
                    await fetchForms(site);
                    return true;
                }
            } else {
                const res = await createFormAbsen(data);
                if (res.success) {
                    await fetchForms(site);
                    return true;
                }
            }
        } catch (err) {
            console.error('Error saving form:', err);
        }
        return false;
    };

    const triggerEdit = (formItem) => {
        setEditData(formItem);
        setIsFormOpen(true);
    };

    const triggerDelete = (id) => {
        setDeletingId(id);
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deletingId) return;
        setDeletingLoading(true);
        try {
            const res = await deleteFormAbsen(deletingId);
            if (res.success) {
                await fetchForms(site);
                setIsConfirmOpen(false);
            } else {
                alert(res.error || 'Gagal menghapus form.');
            }
        } catch (err) {
            console.error('Error deleting form:', err);
            alert('Terjadi kesalahan saat menghapus form.');
        } finally {
            setDeletingLoading(false);
            setDeletingId(null);
        }
    };

    if (!admin) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-9 h-9 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-2xl shadow-sm">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white leading-tight">
                            Manajemen Form Absensi
                        </h2>
                        <p className="text-xs text-slate-450 dark:text-slate-500 mt-1 font-medium">
                            Kelola judul sesi absensi panitia untuk event {site.toUpperCase()}.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {isSuperAdmin && (
                        <div className="flex items-center gap-2 mr-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Site:</span>
                            <select
                                value={site}
                                onChange={(e) => setSite(e.target.value)}
                                className="px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-xs font-semibold focus:outline-none"
                            >
                                <option value="pkkmb">PKKMB</option>
                                <option value="pose">POSE</option>
                            </select>
                        </div>
                    )}
                    <button
                        onClick={() => {
                            setEditData(null);
                            setIsFormOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                    >
                        <Plus size={16} />
                        <span>Tambah Form</span>
                    </button>
                </div>
            </div>

            {/* List / Table of Forms */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/50 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60">
                                <th className="px-6 py-4 w-16 text-center">No</th>
                                <th className="px-6 py-4 w-28 text-center">Site</th>
                                <th className="px-6 py-4">Judul Absen</th>
                                <th className="px-6 py-4 w-52 text-center">Tanggal Dibuat</th>
                                <th className="px-6 py-4 w-28 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm">
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <tr key={`skel-${i}`} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-5">
                                            <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded-lg w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : forms.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-450 dark:text-slate-500">
                                        Belum ada form absensi yang dibuat. Silakan tambahkan form baru.
                                    </td>
                                </tr>
                            ) : (
                                forms.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4 text-center font-medium text-slate-450">{index + 1}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase rounded ${
                                                item.site === 'pkkmb' 
                                                    ? 'text-emerald-700 bg-emerald-55/15 dark:text-emerald-400 dark:bg-emerald-950/30' 
                                                    : 'text-indigo-700 bg-indigo-55/15 dark:text-indigo-400 dark:bg-indigo-950/30'
                                            }`}>
                                                {item.site}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-100">
                                            {item.judul_absen}
                                        </td>
                                        <td className="px-6 py-4 text-center text-slate-500 text-xs">
                                            {new Date(item.created_at).toLocaleString('id-ID', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => triggerEdit(item)}
                                                    className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-all"
                                                    title="Edit Form"
                                                >
                                                    <Edit size={15} />
                                                </button>
                                                <button
                                                    onClick={() => triggerDelete(item.id)}
                                                    className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all"
                                                    title="Hapus Form"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal for Add / Edit */}
            <FormAbsenModal
                isOpen={isFormOpen}
                onClose={() => {
                    setIsFormOpen(false);
                    setEditData(null);
                }}
                onSave={handleSave}
                site={site}
                isSuperAdmin={isSuperAdmin}
                editData={editData}
            />

            {/* Confirm modal for delete */}
            <ConfirmModal
                open={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Hapus Form Absensi"
                message="Apakah Anda yakin ingin menghapus form absensi ini? Menghapus form ini akan menghapus semua riwayat kehadiran panitia yang terkait dengannya secara permanen."
                confirmLabel="Ya, Hapus"
                cancelLabel="Batal"
                loading={deletingLoading}
            />
        </div>
    );
}
