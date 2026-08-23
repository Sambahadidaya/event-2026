'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { checkAdminAuth, insertAuditLog } from './audit';

/**
 * Mendapatkan daftar status pengembangan untuk halaman admin.
 * @returns {Promise<{ success: boolean, data?: Array<object>, error?: string }>}
 */
export const getAdminStatusPengembangan = async () => {
    try {
        const { user, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        let { data, error } = await supabaseAdmin
            .from('pengembangan')
            .select('*')
            .order('site', { ascending: true })
            .order('created_at', { ascending: true });

        if (error) throw error;

        return { success: true, data: data || [] };
    } catch (error) {
        console.error("Internal Log - Error fetching admin status pengembangan:", error);
        return { success: false, error: error.message || 'Terjadi kesalahan internal.' };
    }
};

/**
 * Mengubah status kunci pengembangan per ID.
 * @param {string} id - ID row dari tabel pengembangan
 * @param {boolean} kunci - Nilai kunci baru (true/false)
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export const updateStatusPengembangan = async (id, kunci) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id) throw new Error('ID pengembangan diperlukan.');

        const { data: existing, error: selectError } = await supabaseAdmin
            .from('pengembangan')
            .select('site, route, label')
            .eq('id', id)
            .single();

        if (selectError) throw selectError;

        const { error } = await supabaseAdmin
            .from('pengembangan')
            .update({ kunci })
            .eq('id', id);

        if (error) throw error;

        await insertAuditLog(
            user.email,
            'UPDATE_STATUS_PENGEMBANGAN',
            id,
            `Mengubah status kunci [${existing?.site?.toUpperCase()}] ${existing?.label || existing?.route} menjadi: ${kunci ? 'AKTIF (Terkunci)' : 'NONAKTIF (Terbuka)'}`,
            adminNama
        );

        return { success: true };
    } catch (error) {
        console.error("Internal Log - Error updating status pengembangan:", error);
        return { success: false, error: error.message || 'Terjadi kesalahan internal.' };
    }
};

/**
 * Menambahkan kuncian route baru.
 * @param {string} site - 'pkkmb' atau 'pose'
 * @param {string} route - Rute halaman, misal '/kelompok'
 * @param {string} label - Label tampilan
 * @param {boolean} kunci - Status awal kunci
 * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
 */
export const addPengembanganRoute = async (site, route, label, kunci = false) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!site || !route || !label) {
            throw new Error('Site, route, dan label wajib diisi.');
        }

        const formattedRoute = route.startsWith('/') ? route : `/${route}`;

        const { data, error } = await supabaseAdmin
            .from('pengembangan')
            .insert([{ site, route: formattedRoute, label, kunci: Boolean(kunci) }])
            .select();

        if (error) throw error;

        await insertAuditLog(
            user.email,
            'ADD_PENGEMBANGAN_ROUTE',
            data[0]?.id,
            `Menambahkan route pengembangan baru [${site.toUpperCase()}] ${label} (${formattedRoute})`,
            adminNama
        );

        return { success: true, data: data[0] };
    } catch (error) {
        console.error("Internal Log - Error adding pengembangan route:", error);
        return { success: false, error: error.message || 'Terjadi kesalahan internal.' };
    }
};

/**
 * Menghapus kuncian route berdasarkan ID.
 * @param {string} id - ID row dari tabel pengembangan
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export const deletePengembanganRoute = async (id) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id) throw new Error('ID pengembangan diperlukan.');

        const { data: existing } = await supabaseAdmin
            .from('pengembangan')
            .select('site, route, label')
            .eq('id', id)
            .single();

        const { error } = await supabaseAdmin
            .from('pengembangan')
            .delete()
            .eq('id', id);

        if (error) throw error;

        await insertAuditLog(
            user.email,
            'DELETE_PENGEMBANGAN_ROUTE',
            id,
            `Menghapus route pengembangan [${existing?.site?.toUpperCase()}] ${existing?.label || existing?.route}`,
            adminNama
        );

        return { success: true };
    } catch (error) {
        console.error("Internal Log - Error deleting pengembangan route:", error);
        return { success: false, error: error.message || 'Terjadi kesalahan internal.' };
    }
};

/**
 * Mengubah status kunci semua route pada site tertentu (bulk toggle).
 * @param {string} site - 'pkkmb' atau 'pose'
 * @param {boolean} kunci - Nilai kunci baru
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export const toggleAllBySite = async (site, kunci) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!site) throw new Error('Site diperlukan.');

        const { error } = await supabaseAdmin
            .from('pengembangan')
            .update({ kunci: Boolean(kunci) })
            .eq('site', site);

        if (error) throw error;

        await insertAuditLog(
            user.email,
            'TOGGLE_ALL_PENGEMBANGAN',
            null,
            `Mengubah seluruh status kunci site [${site.toUpperCase()}] menjadi: ${kunci ? 'Terkunci' : 'Terbuka'}`,
            adminNama
        );

        return { success: true };
    } catch (error) {
        console.error("Internal Log - Error toggling all pengembangan by site:", error);
        return { success: false, error: error.message || 'Terjadi kesalahan internal.' };
    }
};
