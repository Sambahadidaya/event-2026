'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { checkAdminAuth, insertAuditLog } from './audit';

/**
 * Mendapatkan status pengembangan untuk halaman admin.
 * Melakukan auto-insert jika tabel kosong.
 * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
 */
export const getAdminStatusPengembangan = async () => {
    try {
        const { user, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        let { data, error } = await supabaseAdmin
            .from('pengembangan')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;

        // Auto-initialize if empty
        if (!data || data.length === 0) {
            const { data: insertedData, error: insertError } = await supabaseAdmin
                .from('pengembangan')
                .insert([{ kunci: false }])
                .select();

            if (insertError) throw insertError;
            return { success: true, data: insertedData[0] };
        }

        return { success: true, data: data[0] };
    } catch (error) {
        console.error("Internal Log - Error fetching admin status pengembangan:", error);
        return { success: false, error: error.message || 'Terjadi kesalahan internal.' };
    }
};

/**
 * Mengubah status kunci pengembangan.
 * @param {string} id - ID row dari tabel pengembangan
 * @param {boolean} kunci - Nilai kunci baru (true/false)
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export const updateStatusPengembangan = async (id, kunci) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id) throw new Error('ID pengembangan diperlukan.');

        const { error } = await supabaseAdmin
            .from('pengembangan')
            .update({ kunci })
            .eq('id', id);

        if (error) throw error;

        await insertAuditLog(
            user.email,
            'UPDATE_STATUS_PENGEMBANGAN',
            id,
            `Mengubah status kunci website menjadi: ${kunci ? 'AKTIF (Terkunci)' : 'NONAKTIF (Terbuka)'}`,
            adminNama
        );

        return { success: true };
    } catch (error) {
        console.error("Internal Log - Error updating status pengembangan:", error);
        return { success: false, error: error.message || 'Terjadi kesalahan internal.' };
    }
};
