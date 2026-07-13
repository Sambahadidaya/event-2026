'use server';

import { supabaseAdmin } from '@/lib/supabase';

// ================= PESERTA =================

export const getPeserta = async (siteType) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('peserta')
            .select('*')
            .eq('site_type', siteType)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Filter by siteType if form_wajib has site property (optional logic based on structure)
        if (siteType) {
            // Note: Since site is inside form_wajib, filtering after fetch might be needed, 
            // or we just return all and let the client filter if RLS is complex.
            // Assuming this is for admin, returning all or filtering in JS.
        }

        return data;
    } catch (error) {
        console.error("Error fetching peserta:", error);
        return [];
    }
};

export const updateStatusPembayaranPeserta = async (id, status) => {
    try {
        if (!id || !status) throw new Error('ID and Status are required');

        const { error } = await supabaseAdmin
            .from('peserta')
            .update({ status_pembayaran: status })
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error("Error updating peserta:", error);
        return { success: false, error: error.message };
    }
};

export const deletePeserta = async (id) => {
    try {
        if (!id) throw new Error('ID is required');

        const { error } = await supabaseAdmin
            .from('peserta')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error("Error deleting peserta:", error);
        return { success: false, error: error.message };
    }
};

export const deleteMultiplePeserta = async (ids) => {
    try {
        if (!ids || !Array.isArray(ids)) throw new Error('IDs array is required');

        const { error } = await supabaseAdmin
            .from('peserta')
            .delete()
            .in('id', ids);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error("Error deleting multiple peserta:", error);
        return { success: false, error: error.message };
    }
};

// ================= FORM WAJIB =================

export const getFormWajib = async (siteType) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('form_wajib')
            .select('*')
            .eq('site', siteType)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Error fetching form wajib:", error);
        return [];
    }
};

export const upsertFormWajib = async (payload, id = null) => {
    try {
        if (!payload) throw new Error('Payload is required');

        if (id) {
            const { data, error } = await supabaseAdmin
                .from('form_wajib')
                .update(payload)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return { success: true, data };
        } else {
            const { data, error } = await supabaseAdmin
                .from('form_wajib')
                .insert([payload])
                .select()
                .single();
            if (error) throw error;
            return { success: true, data };
        }
    } catch (error) {
        console.error("Error upserting form wajib:", error);
        return { success: false, error: error.message };
    }
};

export const deleteFormWajib = async (id) => {
    try {
        if (!id) throw new Error('ID is required');

        const { error } = await supabaseAdmin
            .from('form_wajib')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error("Error deleting form wajib:", error);
        return { success: false, error: error.message };
    }
};

export const getFormWajibByLinkId = async (linkId) => {
    try {
        if (!linkId) throw new Error('Link ID is required');

        const { data, error } = await supabaseAdmin
            .from('form_wajib')
            .select('*')
            .eq('link_id', linkId)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Error fetching form wajib by link id:", error);
        return null;
    }
};

// ================= PUBLIC INSERT (untuk form publik) =================

export const insertPeserta = async (payload) => {
    try {
        if (!payload) throw new Error('Payload is required');

        const { error } = await supabaseAdmin
            .from('peserta')
            .insert([payload]);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error("Error inserting peserta:", error);
        return { success: false, error: error.message };
    }
};

export const insertPesertaBatch = async (pesertaArray) => {
    try {
        if (!pesertaArray || !Array.isArray(pesertaArray)) throw new Error('Array is required');

        const { error } = await supabaseAdmin
            .from('peserta')
            .insert(pesertaArray);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error("Error inserting peserta batch:", error);
        return { success: false, error: error.message };
    }
};

// ================= FORM REGISTER =================

export const getFormRegister = async () => {
    try {
        const { data, error } = await supabaseAdmin
            .from('form_register')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Error fetching form register:", error);
        return [];
    }
};

export const getFormRegisterByLinkId = async (linkId) => {
    try {
        if (!linkId) throw new Error('Link ID is required');

        const { data, error } = await supabaseAdmin
            .from('form_register')
            .select('*')
            .eq('link_id', linkId)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Error fetching form register by link id:", error);
        return null;
    }
};

export const upsertFormRegister = async (payload, id = null) => {
    try {
        if (!payload) throw new Error('Payload is required');

        if (id) {
            const { data, error } = await supabaseAdmin
                .from('form_register')
                .update(payload)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return { success: true, data };
        } else {
            const { data, error } = await supabaseAdmin
                .from('form_register')
                .insert([payload])
                .select()
                .single();
            if (error) throw error;
            return { success: true, data };
        }
    } catch (error) {
        console.error("Error upserting form register:", error);
        return { success: false, error: error.message };
    }
};

export const deleteFormRegister = async (id) => {
    try {
        if (!id) throw new Error('ID is required');

        const { error } = await supabaseAdmin
            .from('form_register')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error("Error deleting form register:", error);
        return { success: false, error: error.message };
    }
};

export const checkPesertaPkkmbByNim = async (nim) => {
    try {
        if (!nim) throw new Error('NIM is required');

        const { data, error } = await supabaseAdmin
            .from('peserta')
            .select('id, nama, nim')
            .eq('site_type', 'pkkmb')
            .eq('nim', nim)
            .single();

        if (error) {
            // Return null if not found
            if (error.code === 'PGRST116') return null;
            throw error;
        }

        return data;
    } catch (error) {
        console.error("Error checking peserta pkkmb by nim:", error);
        return null;
    }
};
