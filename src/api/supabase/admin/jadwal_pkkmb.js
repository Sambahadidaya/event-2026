'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { checkAdminAuth, insertAuditLog } from './audit';

/**
 * Mengambil daftar jadwal acara PKKMB
 */
export const getJadwalPkkmb = async () => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        const { data, error } = await supabaseAdmin
            .from('jadwal_acara_pkkmb')
            .select('id, judul, created_at')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error("Error in getJadwalPkkmb:", error);
        return { success: false, error: error.message || 'Gagal mengambil data jadwal acara.' };
    }
};

/**
 * Menambahkan jadwal acara PKKMB baru
 */
export const createJadwalPkkmb = async ({ judul }) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!judul || !judul.trim()) throw new Error('Judul jadwal wajib diisi.');

        const { data, error } = await supabaseAdmin
            .from('jadwal_acara_pkkmb')
            .insert([{ judul: judul.trim() }])
            .select('id, judul, created_at')
            .single();

        if (error) throw error;

        await insertAuditLog(
            user.email,
            'CREATE_JADWAL_PKKMB',
            data.id,
            `Jadwal acara "${judul.trim()}" dibuat`,
            adminNama
        );
        return { success: true, data };
    } catch (error) {
        console.error("Error in createJadwalPkkmb:", error);
        return { success: false, error: error.message || 'Gagal membuat jadwal acara.' };
    }
};

/**
 * Mengupdate jadwal acara PKKMB
 */
export const updateJadwalPkkmb = async (id, { judul }) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id || !judul || !judul.trim()) throw new Error('ID dan Judul jadwal wajib diisi.');

        const { data, error } = await supabaseAdmin
            .from('jadwal_acara_pkkmb')
            .update({ judul: judul.trim() })
            .eq('id', id)
            .select('id, judul, created_at')
            .single();

        if (error) throw error;

        await insertAuditLog(
            user.email,
            'UPDATE_JADWAL_PKKMB',
            id,
            `Jadwal acara diupdate menjadi "${judul.trim()}"`,
            adminNama
        );
        return { success: true, data };
    } catch (error) {
        console.error("Error in updateJadwalPkkmb:", error);
        return { success: false, error: error.message || 'Gagal mengupdate jadwal acara.' };
    }
};

/**
 * Menghapus jadwal acara PKKMB
 */
export const deleteJadwalPkkmb = async (id) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id) throw new Error('ID jadwal wajib diisi.');

        // Ambil info judul terlebih dahulu untuk keperluan audit log
        const { data: jadwalInfo } = await supabaseAdmin
            .from('jadwal_acara_pkkmb')
            .select('judul')
            .eq('id', id)
            .single();

        const { error } = await supabaseAdmin
            .from('jadwal_acara_pkkmb')
            .delete()
            .eq('id', id);

        if (error) throw error;

        await insertAuditLog(
            user.email,
            'DELETE_JADWAL_PKKMB',
            id,
            `Jadwal acara "${jadwalInfo?.judul || 'Tidak Diketahui'}" dihapus`,
            adminNama
        );
        return { success: true };
    } catch (error) {
        console.error("Error in deleteJadwalPkkmb:", error);
        return { success: false, error: error.message || 'Gagal menghapus jadwal acara.' };
    }
};
