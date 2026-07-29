'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { nanoid } from 'nanoid';

export const getDocumentById = async (id) => {
    try {
        if (!id) return null;
        const { data, error } = await supabaseAdmin
            .from('documents')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return null;

        // Fetch referenced table data if reference_id exists
        let refData = null;
        if (data.reference_id && data.reference_table) {
            const { data: rel } = await supabaseAdmin
                .from(data.reference_table)
                .select('*')
                .eq('id', data.reference_id)
                .single();
            refData = rel;
        }

        return { ...data, reference_data: refData };
    } catch (error) {
        console.error("Internal Log - Error fetching document by ID:", error);
        return null;
    }
};