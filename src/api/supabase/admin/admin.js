'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { checkAdminAuth, insertAuditLog } from './audit';

// ================= ADMINS =================

export const getAdmins = async () => {
    try {
        const { user, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        const { data, error } = await supabaseAdmin
            .from('admins')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Internal Log - Error fetching admins:", error);
        return [];
    }
};

export const addAdmin = async (payload) => {
    try {
        const { user, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!payload) throw new Error('Payload is required');
        
        const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
            email: payload.email,
            password: payload.password,
            email_confirm: true
        });

        if (authErr) throw authErr;

        const { error } = await supabaseAdmin
            .from('admins')
            .insert([{
                user_id: authData.user.id,
                nama: payload.nama,
                email: payload.email,
                role: payload.role
            }]);

        if (error) {
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            throw error;
        }

        await insertAuditLog(user.email, 'ADD_ADMIN', null, `Added admin: ${payload.email}`);
        return { success: true };
    } catch (error) {
        console.error("Internal Log - Error adding admin:", error);
        return { success: false, error: 'Terjadi kesalahan internal pada server.' };
    }
};

export const deleteAdmin = async (id) => {
    try {
        const { user, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id) throw new Error('ID is required');

        const { error } = await supabaseAdmin
            .from('admins')
            .delete()
            .eq('id', id);

        if (error) throw error;
        await insertAuditLog(user.email, 'DELETE_ADMIN', id, `Admin deleted`);
        return { success: true };
    } catch (error) {
        console.error("Internal Log - Error deleting admin:", error);
        return { success: false, error: 'Terjadi kesalahan internal pada server.' };
    }
};

export const updateAdminStatus = async (userId, updatePayload) => {
    try {
        if (!userId) throw new Error('User ID is required');

        const { error } = await supabaseAdmin
            .from('admins')
            .update(updatePayload)
            .eq('user_id', userId);

        if (error) throw error;
        return { success: true };
    } catch (error) {
         console.error("Internal Log - Error updating admin status:", error);
         return { success: false, error: 'Terjadi kesalahan internal pada server.' };
    }
};

export const updateAdminStatusById = async (id, updatePayload) => {
    try {
        if (!id) throw new Error('ID is required');

        const { error } = await supabaseAdmin
            .from('admins')
            .update(updatePayload)
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (error) {
         console.error("Internal Log - Error updating admin status by id:", error);
         return { success: false, error: 'Terjadi kesalahan internal pada server.' };
    }
};

// ================= KONTAK (ADMIN) =================

export const getKontak = async () => {
    try {
        const { user, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        const { data, error } = await supabaseAdmin
            .from('kontak')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Internal Log - Error fetching kontak:", error);
        return [];
    }
};

export const updateKontakJawab = async (id, jawabStatus) => {
    try {
        const { user, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

         if (!id) throw new Error('ID is required');
         const { error } = await supabaseAdmin
            .from('kontak')
            .update({ jawab: jawabStatus })
            .eq('id', id);
            
         if (error) throw error;
         await insertAuditLog(user.email, 'UPDATE_KONTAK_JAWAB', id, `Kontak jawab updated to ${jawabStatus}`);
         return { success: true };
    } catch (error) {
         console.error("Internal Log - Error updating kontak:", error);
         return { success: false, error: 'Terjadi kesalahan internal pada server.' };
    }
};

export const deleteMultipleKontak = async (ids) => {
    try {
        const { user, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!ids || !Array.isArray(ids)) throw new Error('IDs array is required');

        const { error } = await supabaseAdmin
            .from('kontak')
            .delete()
            .in('id', ids);

        if (error) throw error;
        await insertAuditLog(user.email, 'DELETE_MULTIPLE_KONTAK', null, `Deleted ${ids.length} kontak`);
        return { success: true };
    } catch (error) {
        console.error("Internal Log - Error deleting multiple kontak:", error);
        return { success: false, error: 'Terjadi kesalahan internal pada server.' };
    }
};

// ================= TRAFIK (ADMIN) =================

export const getTrafik = async (isoDateStart) => {
    try {
        const { user, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        let query = supabaseAdmin.from('trafik_kunjungan').select('*');
        if (isoDateStart) {
            query = query.gte('visited_at', isoDateStart);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Internal Log - Error fetching trafik:", error);
        return [];
    }
};

export const deleteMultipleTrafik = async (ids) => {
    try {
        const { user, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!ids || !Array.isArray(ids)) throw new Error('IDs array is required');

        const { error } = await supabaseAdmin
            .from('trafik_kunjungan')
            .delete()
            .in('id', ids);

        if (error) throw error;
        await insertAuditLog(user.email, 'DELETE_MULTIPLE_TRAFIK', null, `Deleted ${ids.length} trafik`);
        return { success: true };
    } catch (error) {
        console.error("Internal Log - Error deleting multiple trafik:", error);
        return { success: false, error: 'Terjadi kesalahan internal pada server.' };
    }
};

// ================= FAQ / RIWAYAT PERTANYAAN =================

export const getRiwayatPertanyaan = async () => {
    try {
        const { user, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        const { data, error } = await supabaseAdmin
            .from('riwayat_pertanyaan')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Internal Log - Error fetching riwayat pertanyaan:", error);
        return [];
    }
};

export const deleteMultipleRiwayat = async (ids) => {
    try {
        const { user, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!ids || !Array.isArray(ids)) throw new Error('IDs array is required');

        const { error } = await supabaseAdmin
            .from('riwayat_pertanyaan')
            .delete()
            .in('id', ids);

        if (error) throw error;
        await insertAuditLog(user.email, 'DELETE_MULTIPLE_RIWAYAT', null, `Deleted ${ids.length} riwayat`);
        return { success: true };
    } catch (error) {
        console.error("Internal Log - Error deleting multiple riwayat:", error);
        return { success: false, error: 'Terjadi kesalahan internal pada server.' };
    }
};
