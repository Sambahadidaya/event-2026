'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { checkAdminAuth, insertAuditLog } from './audit';

export const upsertBerita = async (payload, id = null) => {
    try {
        const { user, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!payload) throw new Error('Payload is required');

        if (id) {
            const { error } = await supabaseAdmin
                .from('berita')
                .update(payload)
                .eq('id', id);
            if (error) throw error;
        } else {
            const { error } = await supabaseAdmin
                .from('berita')
                .insert([payload]);
            if (error) throw error;
        }
        await insertAuditLog(user.email, id ? 'UPDATE_BERITA' : 'CREATE_BERITA', id, `Berita ${id ? 'updated' : 'created'}`);
        return { success: true };
    } catch (error) {
        console.error("Internal Log - Error upserting berita:", error);
        return { success: false, error: 'Terjadi kesalahan internal pada server.' };
    }
};

export const deleteBerita = async (id) => {
    try {
        const { user, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id) throw new Error('ID is required');

        const { error } = await supabaseAdmin
            .from('berita')
            .delete()
            .eq('id', id);

        if (error) throw error;
        await insertAuditLog(user.email, 'DELETE_BERITA', id, `Berita deleted`);
        return { success: true };
    } catch (error) {
        console.error("Internal Log - Error deleting berita:", error);
        return { success: false, error: 'Terjadi kesalahan internal pada server.' };
    }
};

export const deleteMultipleBerita = async (ids) => {
    try {
        const { user, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!ids || !Array.isArray(ids)) throw new Error('IDs array is required');

        const { error } = await supabaseAdmin
            .from('berita')
            .delete()
            .in('id', ids);

        if (error) throw error;
        await insertAuditLog(user.email, 'DELETE_MULTIPLE_BERITA', null, `Deleted ${ids.length} berita`);
        return { success: true };
    } catch (error) {
        console.error("Internal Log - Error deleting multiple berita:", error);
        return { success: false, error: 'Terjadi kesalahan internal pada server.' };
    }
};
