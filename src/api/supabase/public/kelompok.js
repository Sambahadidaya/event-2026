'use server';

import { supabaseAdmin } from '@/lib/supabase';

// ============================================================
// Cache sederhana (in-memory, reset on server restart)
// ============================================================
let _cache = null;
let _cacheAt = 0;
const CACHE_TTL = 60 * 1000; // 60 detik

function isCacheValid() {
    return _cache !== null && Date.now() - _cacheAt < CACHE_TTL;
}

export async function invalidateKelompokPublicCache() {
    _cache = null;
    _cacheAt = 0;
}

// ============================================================
// Validasi UUID sederhana (mencegah injection via path param)
// ============================================================
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isValidUUID = (val) => typeof val === 'string' && UUID_REGEX.test(val);

// ============================================================
// PUBLIC READ
// ============================================================

/**
 * Ambil semua kelompok PKKMB beserta anggota, urut by urutan ASC.
 * TIDAK mengambil nim_anggota (untuk keamanan data publik).
 * Menggunakan in-memory cache 60 detik.
 */
export const getKelompokPublic = async () => {
    try {
        if (isCacheValid()) return _cache;

        const { data, error } = await supabaseAdmin
            .from('kelompok')
            .select(
                'id, urutan, nama_kelompok, nama_kabim, link_instagram, foto_kelompok, keterangan, created_at, ' +
                'kelompok_members(id, nama_anggota)'
            )
            .order('urutan', { ascending: true });

        if (error) throw error;

        _cache = data ?? [];
        _cacheAt = Date.now();
        return _cache;
    } catch (error) {
        console.error('Internal Log - Error fetching kelompok public:', error);
        return [];
    }
};

/**
 * Ambil satu kelompok berdasarkan id (validasi UUID).
 * TIDAK mengambil nim_anggota.
 */
export const getKelompokByIdPublic = async (id) => {
    try {
        if (!isValidUUID(id)) throw new Error('Invalid ID format');

        const { data, error } = await supabaseAdmin
            .from('kelompok')
            .select(
                'id, urutan, nama_kelompok, nama_kabim, link_instagram, foto_kelompok, keterangan, created_at, ' +
                'kelompok_members(id, nama_anggota)'
            )
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Internal Log - Error fetching kelompok by id (public):', error);
        return null;
    }
};
