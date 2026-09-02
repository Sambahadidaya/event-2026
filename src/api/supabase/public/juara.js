'use server';

import { supabaseAdmin } from '@/lib/supabase';

export const getJuaraLomba = async () => {
    try {
        const { data, error } = await supabaseAdmin
            .from('juara_lomba')
            .select('id, team_id, nama_lomba, jenis_lomba, peringkat, created_at, team:team_id(id, title, content, gambar, jenis_lomba, nama_lomba, verivikasi, team_members(id, nama, jabatan))')
            .order('nama_lomba', { ascending: true })
            .order('peringkat', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Internal Log - Error fetching juara lomba:", error);
        return [];
    }
};
