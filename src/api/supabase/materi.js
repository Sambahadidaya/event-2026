'use server';

import { supabaseAdmin } from '@/lib/supabase';

// ================= MATERI =================

export const getMateri = async () => {
    try {
        const { data, error } = await supabaseAdmin
            .from('materi_pkkmb')
            .select('*')
            .order('tanggal', { ascending: true });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Error fetching materi:", error);
        return [];
    }
};

export const getMateriById = async (id) => {
    try {
        if (!id) throw new Error('ID is required');

        const { data, error } = await supabaseAdmin
            .from('materi_pkkmb')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Error fetching materi by id:", error);
        return null;
    }
};

export const upsertMateri = async (payload, id = null) => {
    try {
        if (!payload) throw new Error('Payload is required');

        if (id) {
            const { data, error } = await supabaseAdmin
                .from('materi_pkkmb')
                .update(payload)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return { success: true, data };
        } else {
            const { data, error } = await supabaseAdmin
                .from('materi_pkkmb')
                .insert([payload])
                .select()
                .single();
            if (error) throw error;
            return { success: true, data };
        }
    } catch (error) {
        console.error("Error upserting materi:", error);
        return { success: false, error: error.message };
    }
};

export const deleteMateri = async (id) => {
    try {
        if (!id) throw new Error('ID is required');

        const { error } = await supabaseAdmin
            .from('materi_pkkmb')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error("Error deleting materi:", error);
        return { success: false, error: error.message };
    }
};

// ================= TUGAS MATERI =================

export const getTugas = async (materiId = null) => {
    try {
        let query = supabaseAdmin
            .from('tugas_materi')
            .select('*, materi_pkkmb(judul)')
            .order('created_at', { ascending: false });

        if (materiId) {
            query = query.eq('materi_id', materiId);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Error fetching tugas:", error);
        return [];
    }
};

export const insertTugas = async (payload) => {
    try {
        if (!payload) throw new Error('Payload is required');

        const { error } = await supabaseAdmin
            .from('tugas_materi')
            .insert([payload]);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error("Error inserting tugas:", error);
        return { success: false, error: error.message };
    }
};

export const deleteTugas = async (id) => {
    try {
        if (!id) throw new Error('ID is required');

        const { error } = await supabaseAdmin
            .from('tugas_materi')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error("Error deleting tugas:", error);
        return { success: false, error: error.message };
    }
};
