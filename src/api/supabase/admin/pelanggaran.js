'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { checkAdminAuth, insertAuditLog } from './audit';

const VALID_JENIS_PELANGGARAN = ['Ringan', 'Sedang', 'Berat'];

// ============================================================
// MASTER PELANGGARAN
// ============================================================

/**
 * Mengambil semua master pelanggaran
 */
export const getMasterPelanggaran = async () => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        const { data, error } = await supabaseAdmin
            .from('master_pelanggaran')
            .select('id, nama_pelanggaran, jenis_pelanggaran, created_at')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data: data || [] };
    } catch (error) {
        console.error('Error in getMasterPelanggaran:', error);
        return { success: false, error: error.message || 'Gagal mengambil data master pelanggaran.' };
    }
};

/**
 * Menambahkan master pelanggaran baru
 */
export const createMasterPelanggaran = async ({ nama_pelanggaran, jenis_pelanggaran }) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        const nama = (nama_pelanggaran || '').trim();
        const jenis = (jenis_pelanggaran || '').trim();

        if (!nama) throw new Error('Nama pelanggaran wajib diisi');
        if (!jenis || !VALID_JENIS_PELANGGARAN.includes(jenis)) {
            throw new Error('Jenis pelanggaran harus Ringan, Sedang, atau Berat');
        }

        const { data, error } = await supabaseAdmin
            .from('master_pelanggaran')
            .insert([{ nama_pelanggaran: nama, jenis_pelanggaran: jenis }])
            .select('id, nama_pelanggaran, jenis_pelanggaran, created_at')
            .single();

        if (error) throw error;

        await insertAuditLog(
            user.email,
            'CREATE_MASTER_PELANGGARAN',
            data.id,
            `Master pelanggaran "${nama}" (${jenis}) ditambahkan`,
            adminNama
        );

        return { success: true, data };
    } catch (error) {
        console.error('Error in createMasterPelanggaran:', error);
        return { success: false, error: error.message || 'Gagal menambahkan master pelanggaran.' };
    }
};

/**
 * Mengupdate master pelanggaran
 */
export const updateMasterPelanggaran = async (id, { nama_pelanggaran, jenis_pelanggaran }) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id) throw new Error('ID master pelanggaran wajib disediakan');

        const nama = (nama_pelanggaran || '').trim();
        const jenis = (jenis_pelanggaran || '').trim();

        if (!nama) throw new Error('Nama pelanggaran wajib diisi');
        if (!jenis || !VALID_JENIS_PELANGGARAN.includes(jenis)) {
            throw new Error('Jenis pelanggaran harus Ringan, Sedang, atau Berat');
        }

        const { data, error } = await supabaseAdmin
            .from('master_pelanggaran')
            .update({ nama_pelanggaran: nama, jenis_pelanggaran: jenis })
            .eq('id', id)
            .select('id, nama_pelanggaran, jenis_pelanggaran, created_at')
            .single();

        if (error) throw error;

        await insertAuditLog(
            user.email,
            'UPDATE_MASTER_PELANGGARAN',
            id,
            `Master pelanggaran diupdate menjadi "${nama}" (${jenis})`,
            adminNama
        );

        return { success: true, data };
    } catch (error) {
        console.error('Error in updateMasterPelanggaran:', error);
        return { success: false, error: error.message || 'Gagal memperbarui master pelanggaran.' };
    }
};

/**
 * Menghapus master pelanggaran
 */
export const deleteMasterPelanggaran = async (id) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id) throw new Error('ID master pelanggaran wajib disediakan');

        const { error } = await supabaseAdmin
            .from('master_pelanggaran')
            .delete()
            .eq('id', id);

        if (error) throw error;

        await insertAuditLog(
            user.email,
            'DELETE_MASTER_PELANGGARAN',
            id,
            `Master pelanggaran dihapus`,
            adminNama
        );

        return { success: true };
    } catch (error) {
        console.error('Error in deleteMasterPelanggaran:', error);
        return { success: false, error: error.message || 'Gagal menghapus master pelanggaran.' };
    }
};

// ============================================================
// SEARCH KELOMPOK MEMBERS
// ============================================================

/**
 * Mencari anggota kelompok berdasarkan nama atau NIM
 */
export const searchKelompokMembers = async (searchQuery) => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        const query = (searchQuery || '').trim();
        if (!query) {
            return { success: true, data: [] };
        }

        const { data, error } = await supabaseAdmin
            .from('kelompok_members')
            .select(`
                id,
                nama_anggota,
                nim_anggota,
                kelompok_id,
                kelompok:kelompok (
                    id,
                    urutan,
                    nama_kelompok,
                    nama_kabim
                )
            `)
            .or(`nama_anggota.ilike.%${query}%,nim_anggota.ilike.%${query}%`)
            .order('nama_anggota', { ascending: true })
            .limit(20);

        if (error) throw error;
        return { success: true, data: data || [] };
    } catch (error) {
        console.error('Error in searchKelompokMembers:', error);
        return { success: false, error: error.message || 'Gagal mencari nama peserta.' };
    }
};

// ============================================================
// RIWAYAT PELANGGARAN
// ============================================================

/**
 * Mengambil riwayat pelanggaran untuk satu peserta tertentu
 */
export const getRiwayatPelanggaranByPeserta = async (pesertaId) => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!pesertaId) throw new Error('ID peserta wajib disediakan');

        const { data, error } = await supabaseAdmin
            .from('riwayat_pelanggaran')
            .select(`
                id,
                peserta_id,
                pelanggaran_id,
                created_at,
                master_pelanggaran:master_pelanggaran (
                    id,
                    nama_pelanggaran,
                    jenis_pelanggaran
                )
            `)
            .eq('peserta_id', pesertaId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data: data || [] };
    } catch (error) {
        console.error('Error in getRiwayatPelanggaranByPeserta:', error);
        return { success: false, error: error.message || 'Gagal mengambil riwayat pelanggaran peserta.' };
    }
};

/**
 * Menambahkan catatan pelanggaran baru untuk peserta
 */
export const createRiwayatPelanggaran = async ({ peserta_id, pelanggaran_id }) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!peserta_id || !pelanggaran_id) {
            throw new Error('Peserta dan Pelanggaran wajib dipilih.');
        }

        const { data, error } = await supabaseAdmin
            .from('riwayat_pelanggaran')
            .insert([{ peserta_id, pelanggaran_id }])
            .select(`
                id,
                peserta_id,
                pelanggaran_id,
                created_at,
                master_pelanggaran:master_pelanggaran (
                    id,
                    nama_pelanggaran,
                    jenis_pelanggaran
                )
            `)
            .single();

        if (error) throw error;

        await insertAuditLog(
            user.email,
            'CREATE_RIWAYAT_PELANGGARAN',
            data.id,
            `Pelanggaran dicatat untuk peserta ID ${peserta_id}`,
            adminNama
        );

        return { success: true, data };
    } catch (error) {
        console.error('Error in createRiwayatPelanggaran:', error);
        return { success: false, error: error.message || 'Gagal mencatat pelanggaran.' };
    }
};

/**
 * Menghapus riwayat pelanggaran
 */
export const deleteRiwayatPelanggaran = async (id) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id) throw new Error('ID riwayat pelanggaran wajib disediakan');

        const { error } = await supabaseAdmin
            .from('riwayat_pelanggaran')
            .delete()
            .eq('id', id);

        if (error) throw error;

        await insertAuditLog(
            user.email,
            'DELETE_RIWAYAT_PELANGGARAN',
            id,
            `Riwayat pelanggaran dihapus`,
            adminNama
        );

        return { success: true };
    } catch (error) {
        console.error('Error in deleteRiwayatPelanggaran:', error);
        return { success: false, error: error.message || 'Gagal menghapus riwayat pelanggaran.' };
    }
};

/**
 * Mengambil riwayat pelanggaran untuk kelompok tertentu (PJ Kabim)
 * @param {number[] | null} urutanArray - Array urutan kelompok yang diizinkan (null/empty = semua)
 */
export const getRiwayatPelanggaranForKabim = async (urutanArray = null) => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        const { data, error } = await supabaseAdmin
            .from('riwayat_pelanggaran')
            .select(`
                id,
                peserta_id,
                pelanggaran_id,
                created_at,
                master_pelanggaran:master_pelanggaran (
                    id,
                    nama_pelanggaran,
                    jenis_pelanggaran
                ),
                kelompok_members:kelompok_members (
                    id,
                    nama_anggota,
                    nim_anggota,
                    kelompok_id,
                    kelompok:kelompok (
                        id,
                        urutan,
                        nama_kelompok,
                        nama_kabim
                    )
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        let filtered = data || [];

        if (Array.isArray(urutanArray) && urutanArray.length > 0) {
            const validUrutan = urutanArray.map(Number);
            filtered = filtered.filter(item => {
                const urutan = item.kelompok_members?.kelompok?.urutan;
                return urutan !== undefined && validUrutan.includes(Number(urutan));
            });
        }

        return { success: true, data: filtered };
    } catch (error) {
        console.error('Error in getRiwayatPelanggaranForKabim:', error);
        return { success: false, error: error.message || 'Gagal mengambil data pelanggaran kabim.' };
    }
};
