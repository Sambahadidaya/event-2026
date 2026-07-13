'use server';

import { supabaseAdmin } from '@/lib/supabase';

// Helper for type
const isValidSiteType = (type) => ['pose', 'pkkmb', 'portal'].includes(type);

export const getBerita = async (siteType) => {
    try {
        if (!isValidSiteType(siteType)) throw new Error('Invalid site type');

        const { data, error } = await supabaseAdmin
            .from('berita')
            .select('*')
            .eq('type', siteType)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Error fetching berita:", error);
        return [];
    }
};

export const getBeritaAll = async () => {
    try {
        const { data, error } = await supabaseAdmin
            .from('berita')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Error fetching all berita:", error);
        return [];
    }
};

export const upsertBerita = async (payload, id = null) => {
    try {
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
        return { success: true };
    } catch (error) {
        console.error("Error upserting berita:", error);
        return { success: false, error: error.message };
    }
};

export const deleteBerita = async (id) => {
    try {
        if (!id) throw new Error('ID is required');

        const { error } = await supabaseAdmin
            .from('berita')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error("Error deleting berita:", error);
        return { success: false, error: error.message };
    }
};

export const deleteMultipleBerita = async (ids) => {
    try {
        if (!ids || !Array.isArray(ids)) throw new Error('IDs array is required');

        const { error } = await supabaseAdmin
            .from('berita')
            .delete()
            .in('id', ids);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error("Error deleting multiple berita:", error);
        return { success: false, error: error.message };
    }
};
