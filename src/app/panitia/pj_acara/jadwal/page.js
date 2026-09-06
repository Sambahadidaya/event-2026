'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Plus, Edit, Trash2 } from 'lucide-react';
import { getCurrentAdmin } from '@/api/supabase/admin/auth';
import { getJadwalPkkmb, createJadwalPkkmb, updateJadwalPkkmb, deleteJadwalPkkmb } from '@/api/supabase/admin/jadwal_pkkmb';
import { hasAccess } from '@/lib/adminRoleData';
import FormJadwalModal from '@/components/panitia/pj_acara/FormJadwalModal';
import ConfirmModal from '@/components/panitia/ConfirmModal';

export default function ManajemenJadwalPkkmbPage() {
    const router = useRouter();
    const [admin, setAdmin] = useState(null);
    const [jadwalList, setJadwalList] = useState([]);
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
            if (!currentAdmin || !hasAccess(currentAdmin.role, '/panitia/pj_acara/jadwal')) {
                router.replace('/panitia/login');
                return;
            }
            setAdmin(currentAdmin);
        };
        checkUser();
    }, [router]);

    // Fetch jadwal list
    const fetchJadwal = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getJadwalPkkmb();
            if (res.success && res.data) {
                setJadwalList(res.data || []);
            } else {
                setJadwalList([]);
            }
        } catch (err) {
            console.error('Error fetching jadwal pkkmb:', err);
            setJadwalList([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (admin) {
            fetchJadwal();
        }
    }, [admin, fetchJadwal]);

    const handleSave = async (data) => {
        try {
            if (editData) {
                const res = await updateJadwalPkkmb(editData.id, data);
                if (res.success) {
                    await fetchJadwal();
                    return true;
                }
            } else {
                const res = await createJadwalPkkmb(data);
                if (res.success) {
                    await fetchJadwal();
                    return true;
                }
            }
        } catch (err) {
            console.error('Error saving jadwal:', err);
        }
        return false;
    };

    const triggerEdit = (item) => {
        setEditData(item);
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
            const res = await deleteJadwalPkkmb(deletingId);
            if (res.success) {
                await fetchJadwal();
                setIsConfirmOpen(false);
            } else {
                alert(res.error || 'Gagal menghapus jadwal.');
            }
        } catch (err) {
            console.error('Error deleting jadwal:', err);
            alert('Terjadi kesalahan saat menghapus jadwal.');
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
                        <Calendar size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white leading-tight">
                            Manajemen Jadwal Acara
                        </h2>
                        <p className="text-xs text-slate-450 dark:text-slate-500 mt-1 font-medium">
                            Kelola jadwal sesi dan rundown acara kegiatan PKKMB.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            setEditData(null);
                            setIsFormOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                    >
                        <Plus size={16} />
                        <span>Tambah Jadwal</span>
                    </button>
                </div>
            </div>

            {/* List / Table of Jadwal */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/50 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60">
                                <th className="px-6 py-4 w-16 text-center">No</th>
                                <th className="px-6 py-4">Judul Jadwal</th>
                                <th className="px-6 py-4 w-52 text-center">Tanggal Dibuat</th>
                                <th className="px-6 py-4 w-28 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-sm">
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <tr key={`skel-${i}`} className="animate-pulse">
                                        <td colSpan={4} className="px-6 py-5">
                                            <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded-lg w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : jadwalList.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-450 dark:text-slate-500">
                                        Belum ada jadwal yang dibuat. Silakan tambahkan jadwal baru.
                                    </td>
                                </tr>
                            ) : (
                                jadwalList.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4 text-center font-medium text-slate-450">{index + 1}</td>
                                        <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-100">
                                            {item.judul}
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
                                                    title="Edit Jadwal"
                                                >
                                                    <Edit size={15} />
                                                </button>
                                                <button
                                                    onClick={() => triggerDelete(item.id)}
                                                    className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all"
                                                    title="Hapus Jadwal"
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
            <FormJadwalModal
                isOpen={isFormOpen}
                onClose={() => {
                    setIsFormOpen(false);
                    setEditData(null);
                }}
                onSave={handleSave}
                editData={editData}
            />

            {/* Confirm modal for delete */}
            <ConfirmModal
                open={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Hapus Jadwal Acara"
                message="Apakah Anda yakin ingin menghapus jadwal acara ini? Tindakan ini tidak dapat dibatalkan."
                confirmLabel="Ya, Hapus"
                cancelLabel="Batal"
                loading={deletingLoading}
            />
        </div>
    );
}
