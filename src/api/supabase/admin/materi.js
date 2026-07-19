'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { checkAdminAuth, insertAuditLog } from './audit';

export const upsertMateri = async (payload, id = null) => {
    try {
        const { user, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!payload) throw new Error('Payload is required');

        if (id) {
            const { data, error } = await supabaseAdmin
                .from('materi_pkkmb')
                .update(payload)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            await insertAuditLog(user.email, 'UPDATE_MATERI', id, `Materi updated`);
            return { success: true, data };
        } else {
            const { data, error } = await supabaseAdmin
                .from('materi_pkkmb')
                .insert([payload])
                .select()
                .single();
            if (error) throw error;
            await insertAuditLog(user.email, 'CREATE_MATERI', data.id, `Materi created`);
            return { success: true, data };
        }
    } catch (error) {
        console.error("Internal Log - Error upserting materi:", error);
        return { success: false, error: 'Terjadi kesalahan internal pada server.' };
    }
};

export const deleteMateri = async (id) => {
    try {
        const { user, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id) throw new Error('ID is required');

        const { error } = await supabaseAdmin
            .from('materi_pkkmb')
            .delete()
            .eq('id', id);

        if (error) throw error;
        await insertAuditLog(user.email, 'DELETE_MATERI', id, `Materi deleted`);
        return { success: true };
    } catch (error) {
        console.error("Internal Log - Error deleting materi:", error);
        return { success: false, error: 'Terjadi kesalahan internal pada server.' };
    }
};

export const deleteTugas = async (id) => {
    try {
        const { user, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id) throw new Error('ID is required');

        const { error } = await supabaseAdmin
            .from('tugas_materi')
            .delete()
            .eq('id', id);

        if (error) throw error;
        await insertAuditLog(user.email, 'DELETE_TUGAS', id, `Tugas deleted`);
        return { success: true };
    } catch (error) {
        console.error("Internal Log - Error deleting tugas:", error);
        return { success: false, error: 'Terjadi kesalahan internal pada server.' };
    }
};
