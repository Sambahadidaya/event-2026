'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { checkAdminAuth, insertAuditLog } from './audit';

/**
 * Mengambil daftar jadwal acara PKKMB untuk sesi dropdown absensi
 */
export const getJadwalAcaraPkkmbList = async () => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        const { data, error } = await supabaseAdmin
            .from('jadwal_acara_pkkmb')
            .select('id, judul, created_at')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data: data || [] };
    } catch (error) {
        console.error('Error in getJadwalAcaraPkkmbList:', error);
        return { success: false, error: error.message || 'Gagal mengambil data jadwal acara.' };
    }
};

/**
 * Mengambil anggota kelompok berdasarkan urutan kelompok PJ Kabim (atau semua jika urutanArray null/empty)
 * @param {number[] | null} urutanArray
 */
export const getKelompokMembersForKabim = async (urutanArray = null) => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        let query = supabaseAdmin
            .from('kelompok')
            .select(`
                id,
                urutan,
                nama_kelompok,
                nama_kabim,
                kelompok_members (
                    id,
                    nama_anggota,
                    nim_anggota
                )
            `)
            .order('urutan', { ascending: true });

        if (Array.isArray(urutanArray) && urutanArray.length > 0) {
            const validUrutan = urutanArray
                .map(u => Number(u))
                .filter(u => Number.isInteger(u) && u >= 1 && u <= 8);
            if (validUrutan.length > 0) {
                query = query.in('urutan', validUrutan);
            }
        }

        const { data, error } = await query;
        if (error) throw error;

        // Flatten data anggota dengan info kelompok
        const members = [];
        (data || []).forEach(kel => {
            (kel.kelompok_members || []).forEach(m => {
                members.push({
                    id: m.id,
                    nama_anggota: m.nama_anggota,
                    nim_anggota: m.nim_anggota,
                    kelompok_id: kel.id,
                    urutan_kelompok: kel.urutan,
                    nama_kelompok: kel.nama_kelompok,
                    nama_kabim: kel.nama_kabim
                });
            });
        });

        // Urutkan berdasarkan urutan kelompok lalu nama anggota
        members.sort((a, b) => {
            if (a.urutan_kelompok !== b.urutan_kelompok) {
                return a.urutan_kelompok - b.urutan_kelompok;
            }
            return (a.nama_anggota || '').localeCompare(b.nama_anggota || '');
        });

        return { success: true, data: members };
    } catch (error) {
        console.error('Error in getKelompokMembersForKabim:', error);
        return { success: false, error: error.message || 'Gagal mengambil data anggota kelompok.' };
    }
};

/**
 * Mengambil riwayat absensi peserta berdasarkan jadwal acara PKKMB
 * @param {string} jadwalId
 */
export const getAbsensiPesertaByJadwal = async (jadwalId) => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!jadwalId) return { success: true, data: [] };

        const { data, error } = await supabaseAdmin
            .from('absensi_peserta_pkkmb')
            .select(`
                id,
                kelompok_members_id,
                jadwal_acara_pkkmb_id,
                jenis_absensi,
                keterangan,
                created_by,
                created_at,
                kelompok_members (
                    id,
                    nama_anggota,
                    nim_anggota,
                    kelompok (
                        id,
                        urutan,
                        nama_kelompok
                    )
                )
            `)
            .eq('jadwal_acara_pkkmb_id', jadwalId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data: data || [] };
    } catch (error) {
        console.error('Error in getAbsensiPesertaByJadwal:', error);
        return { success: false, error: error.message || 'Gagal mengambil riwayat absensi peserta.' };
    }
};

/**
 * Menambahkan atau mengupdate (upsert/create) absensi peserta
 */
export const createAbsensiPeserta = async (payload) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        const { kelompok_members_id, jadwal_acara_pkkmb_id, jenis_absensi, keterangan, created_by } = payload;

        if (!kelompok_members_id || !jadwal_acara_pkkmb_id || !jenis_absensi) {
            throw new Error('Data absensi tidak lengkap (Anggota, Jadwal, dan Jenis Absensi wajib).');
        }

        // Cek apakah sudah pernah diabsen pada sesi jadwal ini
        const { data: existing } = await supabaseAdmin
            .from('absensi_peserta_pkkmb')
            .select('id')
            .eq('kelompok_members_id', kelompok_members_id)
            .eq('jadwal_acara_pkkmb_id', jadwal_acara_pkkmb_id)
            .maybeSingle();

        let resData;
        if (existing) {
            // Update record yang sudah ada
            const { data, error } = await supabaseAdmin
                .from('absensi_peserta_pkkmb')
                .update({
                    jenis_absensi,
                    keterangan: keterangan || '',
                    created_by: created_by || adminNama || user.email
                })
                .eq('id', existing.id)
                .select()
                .single();

            if (error) throw error;
            resData = data;
        } else {
            // Insert baru
            const { data, error } = await supabaseAdmin
                .from('absensi_peserta_pkkmb')
                .insert([{
                    kelompok_members_id,
                    jadwal_acara_pkkmb_id,
                    jenis_absensi,
                    keterangan: keterangan || '',
                    created_by: created_by || adminNama || user.email
                }])
                .select()
                .single();

            if (error) throw error;
            resData = data;
        }

        await insertAuditLog(
            user.email,
            'SAVE_ABSENSI_PESERTA_PKKMB',
            resData.id,
            `Absensi peserta disimpan: ${jenis_absensi}`,
            adminNama
        );

        return { success: true, data: resData };
    } catch (error) {
        console.error('Error in createAbsensiPeserta:', error);
        return { success: false, error: error.message || 'Gagal menyimpan absensi peserta.' };
    }
};

/**
 * Mengupdate absensi peserta berdasarkan ID
 */
export const updateAbsensiPeserta = async (id, payload) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id) throw new Error('ID absensi peserta wajib.');

        const { jenis_absensi, keterangan } = payload;

        const updateFields = {};
        if (jenis_absensi !== undefined) updateFields.jenis_absensi = jenis_absensi;
        if (keterangan !== undefined) updateFields.keterangan = keterangan;

        const { data, error } = await supabaseAdmin
            .from('absensi_peserta_pkkmb')
            .update(updateFields)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        await insertAuditLog(
            user.email,
            'UPDATE_ABSENSI_PESERTA_PKKMB',
            id,
            `Absensi peserta diupdate: ${jenis_absensi}`,
            adminNama
        );

        return { success: true, data };
    } catch (error) {
        console.error('Error in updateAbsensiPeserta:', error);
        return { success: false, error: error.message || 'Gagal mengupdate absensi peserta.' };
    }
};

/**
 * Menghapus absensi peserta berdasarkan ID
 */
export const deleteAbsensiPeserta = async (id) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id) throw new Error('ID absensi peserta wajib.');

        const { error } = await supabaseAdmin
            .from('absensi_peserta_pkkmb')
            .delete()
            .eq('id', id);

        if (error) throw error;

        await insertAuditLog(
            user.email,
            'DELETE_ABSENSI_PESERTA_PKKMB',
            id,
            `Absensi peserta dihapus`,
            adminNama
        );

        return { success: true };
    } catch (error) {
        console.error('Error in deleteAbsensiPeserta:', error);
        return { success: false, error: error.message || 'Gagal menghapus data absensi peserta.' };
    }
};
