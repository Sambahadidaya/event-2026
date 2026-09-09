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
 * Hanya mengambil kelompok dengan is_public = true.
 * TIDAK mengambil nim_anggota (untuk keamanan data publik).
 * Menggunakan in-memory cache 60 detik.
 */
export const getKelompokPublic = async () => {
    try {
        if (isCacheValid()) return _cache;

        const { data, error } = await supabaseAdmin
            .from('kelompok')
            .select(
                'id, urutan, nama_kelompok, nama_kabim, link_instagram, foto_kelompok, keterangan, jenis_kelompok, is_public, created_at, ' +
                'kelompok_members(id, nama_anggota)'
            )
            .eq('is_public', true)
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
                'id, urutan, nama_kelompok, nama_kabim, link_instagram, foto_kelompok, keterangan, jenis_kelompok, is_public, created_at, ' +
                'kelompok_members(id, nama_anggota)'
            )
            .eq('id', id)
            .eq('is_public', true)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Internal Log - Error fetching kelompok by id (public):', error);
        return null;
    }
};

/**
 * Ambil data member kelompok berdasarkan member ID (UUID) beserta info kelompoknya.
 */
export const getKelompokMemberByIdPublic = async (memberId) => {
    try {
        if (!isValidUUID(memberId)) throw new Error('Format ID unik tidak valid');

        const { data, error } = await supabaseAdmin
            .from('kelompok_members')
            .select(
                'id, kelompok_id, nama_anggota, nim_anggota, ' +
                'kelompok(id, urutan, nama_kelompok, nama_kabim, foto_kelompok, link_instagram, keterangan, jenis_kelompok, is_public)'
            )
            .eq('id', memberId)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Internal Log - Error fetching kelompok member by id (public):', error);
        return null;
    }
};

/**
 * Ambil rekap absensi peserta PKKMB berdasarkan kelompok_members_id (memberId)
 */
export const getAbsensiByMemberIdPublic = async (memberId) => {
    try {
        if (!isValidUUID(memberId)) throw new Error('Format ID unik tidak valid');

        const { data, error } = await supabaseAdmin
            .from('absensi_peserta_pkkmb')
            .select(`
                id,
                kelompok_members_id,
                jadwal_acara_pkkmb_id,
                jenis_absensi,
                keterangan,
                created_at,
                jadwal_acara_pkkmb (
                    id,
                    judul,
                    created_at
                )
            `)
            .eq('kelompok_members_id', memberId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Internal Log - Error fetching member absensi public:', error);
        return [];
    }
};

/**
 * Ambil rekap pelanggaran peserta PKKMB berdasarkan kelompok_members_id (memberId)
 */
export const getPelanggaranByMemberIdPublic = async (memberId) => {
    try {
        if (!isValidUUID(memberId)) throw new Error('Format ID unik tidak valid');

        const { data, error } = await supabaseAdmin
            .from('riwayat_pelanggaran')
            .select(`
                id,
                peserta_id,
                pelanggaran_id,
                created_at,
                master_pelanggaran (
                    id,
                    nama_pelanggaran,
                    jenis_pelanggaran
                )
            `)
            .eq('peserta_id', memberId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Internal Log - Error fetching member pelanggaran public:', error);
        return [];
    }
};

