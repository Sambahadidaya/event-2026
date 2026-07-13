'use server';

import { supabaseAdmin } from '@/lib/supabase';

// ================= ADMINS =================

export const getAdmins = async () => {
    try {
        const { data, error } = await supabaseAdmin
            .from('admins')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Error fetching admins:", error);
        return [];
    }
};

export const addAdmin = async (payload) => {
    try {
        if (!payload) throw new Error('Payload is required');
        
        // 1. Create user in Supabase Auth using admin API
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: payload.email,
            password: payload.password,
            email_confirm: true
        });

        if (authError) throw authError;

        // 2. Insert into admins table
        const { error } = await supabaseAdmin
            .from('admins')
            .insert([{
                user_id: authData.user.id,
                nama: payload.nama,
                email: payload.email,
                role: payload.role
            }]);

        if (error) {
            // Optional: delete auth user if insert fails
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            throw error;
        }

        return { success: true };
    } catch (error) {
        console.error("Error adding admin:", error);
        return { success: false, error: error.message };
    }
};

export const deleteAdmin = async (id) => {
    try {
        if (!id) throw new Error('ID is required');

        const { error } = await supabaseAdmin
            .from('admins')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error("Error deleting admin:", error);
        return { success: false, error: error.message };
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
         console.error("Error updating admin status:", error);
         return { success: false, error: error.message };
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
         console.error("Error updating admin status by id:", error);
         return { success: false, error: error.message };
    }
};

// ================= KONTAK =================

export const getKontak = async () => {
    try {
        const { data, error } = await supabaseAdmin
            .from('kontak')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Error fetching kontak:", error);
        return [];
    }
};

export const submitKontak = async (payload) => {
    try {
        if (!payload) throw new Error('Payload is required');
        
        const { error } = await supabaseAdmin
            .from('kontak')
            .insert([payload]);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error("Error submit kontak:", error);
        return { success: false, error: error.message };
    }
};

export const updateKontakJawab = async (id, jawabStatus) => {
    try {
         if (!id) throw new Error('ID is required');
         const { error } = await supabaseAdmin
            .from('kontak')
            .update({ jawab: jawabStatus })
            .eq('id', id);
            
         if (error) throw error;
         return { success: true };
    } catch (error) {
         console.error("Error updating kontak:", error);
         return { success: false, error: error.message };
    }
};

export const deleteMultipleKontak = async (ids) => {
    try {
        if (!ids || !Array.isArray(ids)) throw new Error('IDs array is required');

        const { error } = await supabaseAdmin
            .from('kontak')
            .delete()
            .in('id', ids);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error("Error deleting multiple kontak:", error);
        return { success: false, error: error.message };
    }
};

// ================= TRAFIK =================

export const recordTrafik = async (siteType) => {
    try {
         if (!siteType) return;
         // Kita tidak perlukan error checking yang ketat untuk tracking, agar tidak menghalangi user flow
         await supabaseAdmin
            .from('trafik_kunjungan')
            .insert([{ site: siteType }]);
    } catch (error) {
         console.error("Error record trafik:", error);
    }
};

export const getTrafik = async (isoDateStart) => {
    try {
        let query = supabaseAdmin.from('trafik_kunjungan').select('*');
        if (isoDateStart) {
            query = query.gte('visited_at', isoDateStart);
        }
        
        const { data, error } = await query;
        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Error fetching trafik:", error);
        return [];
    }
};

export const deleteMultipleTrafik = async (ids) => {
    try {
        if (!ids || !Array.isArray(ids)) throw new Error('IDs array is required');

        const { error } = await supabaseAdmin
            .from('trafik_kunjungan')
            .delete()
            .in('id', ids);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error("Error deleting multiple trafik:", error);
        return { success: false, error: error.message };
    }
};

// ================= FAQ / RIWAYAT PERTANYAAN =================

export const getRiwayatPertanyaan = async () => {
    try {
        const { data, error } = await supabaseAdmin
            .from('riwayat_pertanyaan')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Error fetching riwayat pertanyaan:", error);
        return [];
    }
};

export const deleteMultipleRiwayat = async (ids) => {
    try {
        if (!ids || !Array.isArray(ids)) throw new Error('IDs array is required');

        const { error } = await supabaseAdmin
            .from('riwayat_pertanyaan')
            .delete()
            .in('id', ids);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error("Error deleting multiple riwayat:", error);
        return { success: false, error: error.message };
    }
};
