'use server';

import { supabaseAdmin } from '@/lib/supabase';

// ================= KONTAK (PUBLIC SUBMIT) =================

export const submitKontak = async (payload) => {
    try {
        if (!payload) throw new Error('Payload is required');

        // Sanitize payload
        const allowedKeys = ['nama', 'email', 'whatsapp', 'pesan', 'site'];
        const sanitized = {};
        for (const key of allowedKeys) {
            if (payload[key] !== undefined) {
                sanitized[key] = payload[key];
            }
        }

        const { error } = await supabaseAdmin
            .from('kontak')
            .insert([sanitized]);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error("Internal Log - Error submit kontak:", error);
        return { success: false, error: 'Terjadi kesalahan internal pada server.' };
    }
};

// ================= TRAFIK (PUBLIC RECORD) =================

export const recordTrafik = async (siteType) => {
    try {
        if (!siteType) return;
        await supabaseAdmin
            .from('trafik_kunjungan')
            .insert([{ site: siteType }]);
    } catch (error) {
        console.error("Internal Log - Error record trafik:", error);
    }
};

// ================= RIWAYAT PERTANYAAN (PUBLIC SUBMIT) =================

export const saveChatHistory = async (pertanyaan, jawaban, site, isFaqMatched = false, token = 0) => {
    try {
        if (!pertanyaan || !jawaban || !site) {
            throw new Error('Parameter pertanyaan, jawaban, dan site wajib diisi');
        }

        const { data, error } = await supabaseAdmin.from('riwayat_pertanyaan').insert([{
            pertanyaan,
            jawaban,
            site,
            is_faq_matched: isFaqMatched,
            token: token
        }]);

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Internal Log - Supabase Error (History):", error);
    }
};
