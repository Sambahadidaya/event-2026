'use server';

import { supabaseAdmin } from '@/lib/supabase';

export const getJadwalPertandingan = async () => {
    try {
        const { data, error } = await supabaseAdmin
            .from('jadwal_pertandingan')
            .select('*, team1:team1_id(*), team2:team2_id(*)')
            .order('waktu', { ascending: true });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Error fetching jadwal pertandingan:", error);
        return [];
    }
};

export const getHasilPertandingan = async () => {
    try {
        const { data, error } = await supabaseAdmin
            .from('hasil_pertandingan')
            .select('*');

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Error fetching hasil pertandingan:", error);
        return [];
    }
};

export const upsertJadwalPertandingan = async (payload, id = null) => {
    try {
        if (!payload) throw new Error('Payload is required');

        if (id) {
            const { error } = await supabaseAdmin
                .from('jadwal_pertandingan')
                .update(payload)
                .eq('id', id);
            if (error) throw error;
        } else {
            const { error } = await supabaseAdmin
                .from('jadwal_pertandingan')
                .insert([payload]);
            if (error) throw error;
        }
        return { success: true };
    } catch (error) {
        console.error("Error upserting jadwal pertandingan:", error);
        return { success: false, error: error.message };
    }
};

export const upsertHasilPertandingan = async (hasilArray) => {
    try {
        if (!hasilArray || !Array.isArray(hasilArray)) {
            throw new Error('hasilArray must be an array');
        }

        const { error } = await supabaseAdmin
            .from('hasil_pertandingan')
            .upsert(hasilArray);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error("Error upserting hasil pertandingan:", error);
        return { success: false, error: error.message };
    }
};

export const deleteJadwalPertandingan = async (id) => {
    try {
        if (!id) throw new Error('ID is required');

        const { error } = await supabaseAdmin
            .from('jadwal_pertandingan')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error("Error deleting jadwal pertandingan:", error);
        return { success: false, error: error.message };
    }
};

// ==================== JADWAL ACARA ====================

export const getJadwalAcara = async (siteType = null) => {
    try {
        let query = supabaseAdmin
            .from('jadwal_acara')
            .select('*')
            .order('waktu_mulai', { ascending: true });
        
        if (siteType) {
            query = query.eq('site', siteType);
        }
            
        const { data, error } = await query;
            
        // Catatan: Jika tabel jadwal umum dipakai, ganti ke 'jadwal'
        if (error) {
            // Coba dari tabel 'jadwal' jika jadwal_acara tidak ada
            let fallbackQuery = supabaseAdmin
                .from('jadwal')
                .select('*')
                .order('waktu_mulai', { ascending: true });
            if (siteType) {
                fallbackQuery = fallbackQuery.eq('site', siteType);
            }
            const res = await fallbackQuery;
            if (res.error) throw res.error;
            return res.data;
        }
        return data;
    } catch (error) {
        console.error("Error fetching jadwal acara:", error);
        return [];
    }
};

export const upsertJadwalAcara = async (payload, id = null) => {
     try {
        if (!payload) throw new Error('Payload is required');
        // Gunakan tabel 'jadwal_acara' atau 'jadwal' (kita asumsikan 'jadwal_acara' dulu, 
        // lalu fallback ke 'jadwal' jika error dari UI panitia)
        let tableName = 'jadwal_acara';

        if (id) {
            const { error } = await supabaseAdmin
                .from(tableName)
                .update(payload)
                .eq('id', id);
            if (error) {
                const res = await supabaseAdmin.from('jadwal').update(payload).eq('id', id);
                if (res.error) throw res.error;
            }
        } else {
            const { error } = await supabaseAdmin
                .from(tableName)
                .insert([payload]);
            if (error) {
                 const res = await supabaseAdmin.from('jadwal').insert([payload]);
                 if (res.error) throw res.error;
            }
        }
        return { success: true };
    } catch (error) {
        console.error("Error upserting jadwal acara:", error);
        return { success: false, error: error.message };
    }
};

export const deleteJadwalAcara = async (id) => {
    try {
        if (!id) throw new Error('ID is required');

        const { error } = await supabaseAdmin
            .from('jadwal_acara')
            .delete()
            .eq('id', id);

        if (error) {
             const res = await supabaseAdmin.from('jadwal').delete().eq('id', id);
             if (res.error) throw res.error;
        }
        return { success: true };
    } catch (error) {
        console.error("Error deleting jadwal acara:", error);
        return { success: false, error: error.message };
    }
};
