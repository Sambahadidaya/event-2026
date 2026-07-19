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
        console.error("Internal Log - Error fetching berita:", error);
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
        console.error("Internal Log - Error fetching all berita:", error);
        return [];
    }
};
