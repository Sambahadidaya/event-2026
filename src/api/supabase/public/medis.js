'use server';

import { supabaseAdmin } from '@/lib/supabase';

// ============================================================
// Sanitizer
// ============================================================
const ALLOWED_MEDIS_KEYS = ['users', 'riwayat_penyakit', 'penanganan', 'alergi'];
const ALLOWED_TAMBAHAN_KEYS = ['users', 'nama_ortu_wali', 'no_wa_ortu_wali'];

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isValidUUID = (val) => typeof val === 'string' && UUID_REGEX.test(val);

// Regex: hapus karakter berbahaya dari string input
const sanitizeStr = (val, maxLen = 255) => {
    if (val === undefined || val === null) return null;
    return String(val).replace(/[<>'"\\\/]/g, '').trim().slice(0, maxLen);
};

// ============================================================
// PUBLIC INSERT — Data Medis
// ============================================================

/**
 * Insert data medis peserta ke tabel data_medis_pkkmb.
 * Dipanggil setelah insert peserta berhasil (dapat peserta.id).
 * @param {string} pesertaId - UUID peserta
 * @param {{ riwayat_penyakit, penanganan, alergi }} medisData
 */
export const insertDataMedis = async (pesertaId, medisData = {}) => {
    try {
        if (!isValidUUID(pesertaId)) throw new Error('Invalid peserta ID');

        const payload = {
            users: pesertaId,
            riwayat_penyakit: sanitizeStr(medisData.riwayat_penyakit),
            penanganan: sanitizeStr(medisData.penanganan),
            alergi: sanitizeStr(medisData.alergi),
        };

        // Hanya insert jika minimal satu field medis diisi
        const hasMedisData = payload.riwayat_penyakit || payload.penanganan || payload.alergi;
        if (!hasMedisData) return { success: true, skipped: true };

        const { error } = await supabaseAdmin
            .from('data_medis_pkkmb')
            .insert([payload]);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Internal Log - Error inserting data medis:', error);
        return { success: false, error: 'Gagal menyimpan data medis.' };
    }
};

/**
 * Insert data tambahan (ortu/wali) ke tabel data_tambahan_pkkmb.
 * @param {string} pesertaId - UUID peserta
 * @param {{ nama_ortu_wali, no_wa_ortu_wali }} tambahanData
 */
export const insertDataTambahan = async (pesertaId, tambahanData = {}) => {
    try {
        if (!isValidUUID(pesertaId)) throw new Error('Invalid peserta ID');

        const payload = {
            users: pesertaId,
            nama_ortu_wali: sanitizeStr(tambahanData.nama_ortu_wali, 100),
            no_wa_ortu_wali: sanitizeStr(tambahanData.no_wa_ortu_wali, 20),
        };

        const hasTambahanData = payload.nama_ortu_wali || payload.no_wa_ortu_wali;
        if (!hasTambahanData) return { success: true, skipped: true };

        const { error } = await supabaseAdmin
            .from('data_tambahan_pkkmb')
            .insert([payload]);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Internal Log - Error inserting data tambahan:', error);
        return { success: false, error: 'Gagal menyimpan data orang tua/wali.' };
    }
};
