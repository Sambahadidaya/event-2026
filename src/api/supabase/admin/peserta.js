'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { checkAdminAuth, insertAuditLog } from './audit';
import { autoCreateTransactionFromPeserta, autoDeleteTransactionFromPeserta } from './finance';

export const getPeserta = async (siteType) => {
    try {
        const { user, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        const { data, error } = await supabaseAdmin
            .from('peserta')
            .select('*')
            .eq('site_type', siteType)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Internal Log - Error fetching peserta:", error);
        return [];
    }
};

export const getPesertaKeuangan = async (siteType) => {
    try {
        const { user, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        let query = supabaseAdmin
            .from('peserta')
            .select('*')
            .order('created_at', { ascending: false });

        if (siteType && siteType !== 'all') {
            query = query.eq('site_type', siteType);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Internal Log - Error fetching peserta keuangan:", error);
        return [];
    }
};



export const updateStatusPembayaranPeserta = async (id, status) => {
    try {
        const { user, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id || !status) throw new Error('ID and Status are required');

        // Fetch existing participant data first
        const { data: peserta, error: fetchErr } = await supabaseAdmin
            .from('peserta')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchErr || !peserta) throw new Error('Participant not found');

        const { error } = await supabaseAdmin
            .from('peserta')
            .update({ status_pembayaran: status })
            .eq('id', id);

        if (error) throw error;

        // Auto-Trigger Accounting Integration
        const updatedPeserta = { ...peserta, status_pembayaran: status };
        if (status.toLowerCase() === 'lunas') {
            await autoCreateTransactionFromPeserta(updatedPeserta, user.email);
        } else {
            await autoDeleteTransactionFromPeserta(updatedPeserta);
        }
        
        await insertAuditLog(user.email, 'UPDATE_STATUS_PEMBAYARAN_PESERTA', id, `Status updated to ${status}`);

        return { success: true };
    } catch (error) {
        console.error("Internal Log - Error updating peserta:", error);
        return { success: false, error: 'Terjadi kesalahan internal pada server' };
    }
};

export const deletePeserta = async (id) => {
    try {
        const { user, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id) throw new Error('ID is required');

        // Fetch peserta data before deleting to clean up finance records if any
        const { data: peserta } = await supabaseAdmin
            .from('peserta')
            .select('*')
            .eq('id', id)
            .single();

        if (peserta) {
            await autoDeleteTransactionFromPeserta(peserta);
        }

        const { error } = await supabaseAdmin
            .from('peserta')
            .delete()
            .eq('id', id);

        if (error) throw error;
        
        await insertAuditLog(user.email, 'DELETE_PESERTA', id, `Peserta deleted`);

        return { success: true };
    } catch (error) {
        console.error("Internal Log - Error deleting peserta:", error);
        return { success: false, error: 'Terjadi kesalahan internal pada server' };
    }
};

export const deleteMultiplePeserta = async (ids) => {
    try {
        const { user, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!ids || !Array.isArray(ids)) throw new Error('IDs array is required');

        // Fetch participants before deleting to clean finance
        const { data: pesertas } = await supabaseAdmin
            .from('peserta')
            .select('*')
            .in('id', ids);

        if (pesertas && pesertas.length > 0) {
            for (const p of pesertas) {
                await autoDeleteTransactionFromPeserta(p);
            }
        }

        const { error } = await supabaseAdmin
            .from('peserta')
            .delete()
            .in('id', ids);

        if (error) throw error;
        
        await insertAuditLog(user.email, 'DELETE_MULTIPLE_PESERTA', null, `Deleted IDs: ${ids.join(', ')}`);

        return { success: true };
    } catch (error) {
        console.error("Internal Log - Error deleting multiple peserta:", error);
        return { success: false, error: 'Terjadi kesalahan internal pada server' };
    }
};



export const upsertFormWajib = async (payload, id = null) => {
    try {
        const { user, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!payload) throw new Error('Payload is required');

        if (id) {
            const { data, error } = await supabaseAdmin
                .from('form_wajib')
                .update(payload)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            await insertAuditLog(user.email, 'UPSERT_FORM_WAJIB', id, `Updated form wajib`);
            return { success: true, data };
        } else {
            const { data, error } = await supabaseAdmin
                .from('form_wajib')
                .insert([payload])
                .select()
                .single();
            if (error) throw error;
            await insertAuditLog(user.email, 'UPSERT_FORM_WAJIB', data.id, `Created new form wajib`);
            return { success: true, data };
        }
    } catch (error) {
        console.error("Internal Log - Error upserting form wajib:", error);
        return { success: false, error: 'Terjadi kesalahan internal pada server' };
    }
};

export const deleteFormWajib = async (id) => {
    try {
        const { user, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id) throw new Error('ID is required');

        const { error } = await supabaseAdmin
            .from('form_wajib')
            .delete()
            .eq('id', id);

        if (error) throw error;
        await insertAuditLog(user.email, 'DELETE_FORM_WAJIB', id, `Deleted form wajib`);
        return { success: true };
    } catch (error) {
        console.error("Internal Log - Error deleting form wajib:", error);
        return { success: false, error: 'Terjadi kesalahan internal pada server' };
    }
};



export const upsertFormRegister = async (payload, id = null) => {
    try {
        const { user, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!payload) throw new Error('Payload is required');

        if (id) {
            const { data, error } = await supabaseAdmin
                .from('form_register')
                .update(payload)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            await insertAuditLog(user.email, 'UPSERT_FORM_REGISTER', id, `Updated form register`);
            return { success: true, data };
        } else {
            const { data, error } = await supabaseAdmin
                .from('form_register')
                .insert([payload])
                .select()
                .single();
            if (error) throw error;
            await insertAuditLog(user.email, 'UPSERT_FORM_REGISTER', data.id, `Created new form register`);
            return { success: true, data };
        }
    } catch (error) {
        console.error("Internal Log - Error upserting form register:", error);
        return { success: false, error: 'Terjadi kesalahan internal pada server' };
    }
};

export const deleteFormRegister = async (id) => {
    try {
        const { user, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id) throw new Error('ID is required');

        const { error } = await supabaseAdmin
            .from('form_register')
            .delete()
            .eq('id', id);

        if (error) throw error;
        await insertAuditLog(user.email, 'DELETE_FORM_REGISTER', id, `Deleted form register`);
        return { success: true };
    } catch (error) {
        console.error("Internal Log - Error deleting form register:", error);
        return { success: false, error: 'Terjadi kesalahan internal pada server' };
    }
};

// insertPesertaBatch moved to public API

export const getPesertaLunas = async (siteType) => {
    try {
        const { user, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        let query = supabaseAdmin
            .from('peserta')
            .select('*')
            .in('status_pembayaran', ['Lunas', 'lunas'])
            .order('created_at', { ascending: false });

        if (siteType && siteType !== 'all') {
            query = query.eq('site_type', siteType);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Internal Log - Error fetching peserta lunas:", error);
        return [];
    }
};

export const getFormWajibAll = async () => {
    try {
        const { user, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        const { data, error } = await supabaseAdmin
            .from('form_wajib')
            .select('*');

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Internal Log - Error fetching form wajib all:", error);
        return [];
    }
};

export const getFormRegisterAll = async () => {
    try {
        const { user, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        const { data, error } = await supabaseAdmin
            .from('form_register')
            .select('*');

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Internal Log - Error fetching form register all:", error);
        return [];
    }
};
