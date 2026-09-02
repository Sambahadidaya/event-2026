'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { checkAdminAuth, insertAuditLog } from './audit';

export const upsertJuaraLomba = async (payload, id = null) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!payload) throw new Error('Payload is required');

        if (id) {
            const { error } = await supabaseAdmin
                .from('juara_lomba')
                .update(payload)
                .eq('id', id);
            if (error) throw error;
        } else {
            const { error } = await supabaseAdmin
                .from('juara_lomba')
                .insert([payload]);
            if (error) throw error;
        }
        await insertAuditLog(
            user.email,
            id ? 'UPDATE_JUARA_LOMBA' : 'CREATE_JUARA_LOMBA',
            id,
            `Juara lomba ${id ? 'updated' : 'created'}`,
            adminNama
        );
        return { success: true };
    } catch (error) {
        console.error("Internal Log - Error upserting juara lomba:", error);
        return { success: false, error: 'Terjadi kesalahan internal pada server.' };
    }
};

export const deleteJuaraLomba = async (id) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id) throw new Error('ID is required');

        const { error } = await supabaseAdmin
            .from('juara_lomba')
            .delete()
            .eq('id', id);

        if (error) throw error;
        await insertAuditLog(user.email, 'DELETE_JUARA_LOMBA', id, `Juara lomba deleted`, adminNama);
        return { success: true };
    } catch (error) {
        console.error("Internal Log - Error deleting juara lomba:", error);
        return { success: false, error: 'Terjadi kesalahan internal pada server.' };
    }
};
