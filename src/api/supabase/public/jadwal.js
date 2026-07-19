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
        console.error("Internal Log - Error fetching jadwal pertandingan:", error);
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
        console.error("Internal Log - Error fetching hasil pertandingan:", error);
        return [];
    }
};

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
            
        if (error) {
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
        console.error("Internal Log - Error fetching jadwal acara:", error);
        return [];
    }
};
