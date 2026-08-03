'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { checkAdminAuth, insertAuditLog } from './audit';

export const getFormPengumpulan = async () => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        const { data, error } = await supabaseAdmin
            .from('form_pengumpulan')
            .select(`
                *,
                form_register ( id, nama_lomba, jenis_lomba, site )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Internal Log - Error fetching form_pengumpulan:", error);
        return [];
    }
};

export const upsertFormPengumpulan = async (payload, id = null) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!payload) throw new Error('Payload is required');

        if (id) {
            const { data, error } = await supabaseAdmin
                .from('form_pengumpulan')
                .update(payload)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            await insertAuditLog(user.email, 'UPSERT_FORM_PENGUMPULAN', id, `Updated form pengumpulan`, adminNama);
            return { success: true, data };
        } else {
            const { data, error } = await supabaseAdmin
                .from('form_pengumpulan')
                .insert([payload])
                .select()
                .single();
            if (error) throw error;
            await insertAuditLog(user.email, 'UPSERT_FORM_PENGUMPULAN', data.id, `Created new form pengumpulan`, adminNama);
            return { success: true, data };
        }
    } catch (error) {
        console.error("Internal Log - Error upserting form pengumpulan:", error);
        return { success: false, error: 'Terjadi kesalahan internal pada server' };
    }
};

export const deleteFormPengumpulan = async (id) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id) throw new Error('ID is required');

        const { error } = await supabaseAdmin
            .from('form_pengumpulan')
            .delete()
            .eq('id', id);

        if (error) throw error;
        await insertAuditLog(user.email, 'DELETE_FORM_PENGUMPULAN', id, `Deleted form pengumpulan`, adminNama);
        return { success: true };
    } catch (error) {
        console.error("Internal Log - Error deleting form pengumpulan:", error);
        return { success: false, error: 'Terjadi kesalahan internal pada server' };
    }
};

export const getPengumpulanLomba = async () => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        const { data, error } = await supabaseAdmin
            .from('pengumpulan_lomba')
            .select(`
                *,
                form_pengumpulan ( id, link_id, form_register ( nama_lomba, jenis_lomba ) ),
                team ( id, title, gambar, nama_lomba, kode_form )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Internal Log - Error fetching pengumpulan_lomba:", error);
        return [];
    }
};

export const updateStatusPengumpulan = async (id, status_pengumpulan) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id) throw new Error('ID is required');

        const { error } = await supabaseAdmin
            .from('pengumpulan_lomba')
            .update({ status_pengumpulan })
            .eq('id', id);

        if (error) throw error;

        await insertAuditLog(user.email, 'UPDATE_STATUS_PENGUMPULAN', id, `Status updated to ${status_pengumpulan}`, adminNama);

        return { success: true };
    } catch (error) {
        console.error("Internal Log - Error updating pengumpulan_lomba:", error);
        return { success: false, error: 'Terjadi kesalahan internal pada server' };
    }
};

export const deletePengumpulanLomba = async (id) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id) throw new Error('ID is required');

        const { error } = await supabaseAdmin
            .from('pengumpulan_lomba')
            .delete()
            .eq('id', id);

        if (error) throw error;

        await insertAuditLog(user.email, 'DELETE_PENGUMPULAN_LOMBA', id, `Deleted pengumpulan lomba`, adminNama);

        return { success: true };
    } catch (error) {
        console.error("Internal Log - Error deleting pengumpulan_lomba:", error);
        return { success: false, error: 'Terjadi kesalahan internal pada server' };
    }
};
