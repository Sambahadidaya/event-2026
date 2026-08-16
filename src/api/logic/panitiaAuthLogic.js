'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { logoutAdmin } from '@/api/supabase/admin/auth';

/**
 * Server Action untuk mengupdate status admin menjadi offline di database
 * @param {string} userId - User ID admin dari auth.users
 */
export async function setAdminOffline(userId) {
    try {
        if (!userId) return { success: false, error: 'User ID tidak ditemukan.' };

        const { error } = await supabaseAdmin
            .from('admins')
            .update({ 
                is_online: false,
                last_active: new Date().toISOString()
            })
            .eq('user_id', userId);

        if (error) {
            console.error("Internal Log - Gagal update status offline:", error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        console.error("Internal Log - setAdminOffline error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action untuk logout panitia secara penuh
 * @param {string} userId - User ID admin dari auth.users
 */
export async function logoutPanitiaAction(userId) {
    try {
        const result = await logoutAdmin(userId);
        return result;
    } catch (error) {
        console.error("Internal Log - logoutPanitiaAction error:", error);
        return { success: false, error: error.message };
    }
}
