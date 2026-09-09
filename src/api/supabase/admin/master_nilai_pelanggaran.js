'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { checkAdminAuth, insertAuditLog } from './audit';

/**
 * Mengambil default poin pengurangan per kategori (Ringan, Sedang, Berat)
 */
export const getDefaultPoinPelanggaran = async () => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        const { data, error } = await supabaseAdmin
            .from('master_poin_kategori_pelanggaran')
            .select('id, jenis_pelanggaran, default_poin, updated_at')
            .order('default_poin', { ascending: true });

        if (error) throw error;
        return { success: true, data: data || [] };
    } catch (error) {
        console.error('Error in getDefaultPoinPelanggaran:', error);
        return { success: false, error: error.message || 'Gagal memuat default poin kategori.' };
    }
};

/**
 * Update default poin pengurangan per kategori
 * @param {Object} params
 * @param {string} params.jenis_pelanggaran - 'Ringan' | 'Sedang' | 'Berat'
 * @param {number} params.default_poin - nilai poin
 * @param {boolean} [params.apply_to_all_existing=false] - apakah memperbarui item yang sudah ada
 */
export const updateDefaultPoinPelanggaran = async ({ jenis_pelanggaran, default_poin, apply_to_all_existing = false }) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        const poin = parseFloat(default_poin);
        if (isNaN(poin) || poin < 0) {
            throw new Error('Poin harus berupa angka positif.');
        }

        const { data, error } = await supabaseAdmin
            .from('master_poin_kategori_pelanggaran')
            .upsert(
                { jenis_pelanggaran, default_poin: poin, updated_at: new Date().toISOString() },
                { onConflict: 'jenis_pelanggaran' }
            )
            .select()
            .single();

        if (error) throw error;

        // Jika dicentang update semua yang sejenis
        if (apply_to_all_existing) {
            await supabaseAdmin
                .from('master_pelanggaran')
                .update({ poin_pengurangan: poin })
                .eq('jenis_pelanggaran', jenis_pelanggaran);
        }

        await insertAuditLog(
            user.email,
            'UPDATE_DEFAULT_POIN_PELANGGARAN',
            data.id,
            `Poin default kategori ${jenis_pelanggaran} diubah menjadi ${poin}${apply_to_all_existing ? ' (diterapkan ke semua item)' : ''}`,
            adminNama
        );

        return { success: true, data };
    } catch (error) {
        console.error('Error in updateDefaultPoinPelanggaran:', error);
        return { success: false, error: error.message || 'Gagal memperbarui default poin kategori.' };
    }
};

/**
 * Mengambil semua master pelanggaran lengkap beserta poin pengurangan
 */
export const getMasterPelanggaranWithPoin = async () => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        const { data, error } = await supabaseAdmin
            .from('master_pelanggaran')
            .select('id, nama_pelanggaran, jenis_pelanggaran, poin_pengurangan, created_at')
            .order('jenis_pelanggaran', { ascending: true })
            .order('nama_pelanggaran', { ascending: true });

        if (error) throw error;
        return { success: true, data: data || [] };
    } catch (error) {
        console.error('Error in getMasterPelanggaranWithPoin:', error);
        return { success: false, error: error.message || 'Gagal mengambil data master pelanggaran.' };
    }
};

/**
 * Update poin pengurangan untuk satu item master pelanggaran
 */
export const updatePoinPelanggaranItem = async ({ id, poin_pengurangan }) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id) throw new Error('ID pelanggaran wajib diisi.');
        const poin = parseFloat(poin_pengurangan);
        if (isNaN(poin) || poin < 0) {
            throw new Error('Poin harus berupa angka positif.');
        }

        const { data, error } = await supabaseAdmin
            .from('master_pelanggaran')
            .update({ poin_pengurangan: poin })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        await insertAuditLog(
            user.email,
            'UPDATE_POIN_PELANGGARAN_ITEM',
            id,
            `Poin pelanggaran "${data.nama_pelanggaran}" diubah menjadi ${poin}`,
            adminNama
        );

        return { success: true, data };
    } catch (error) {
        console.error('Error in updatePoinPelanggaranItem:', error);
        return { success: false, error: error.message || 'Gagal memperbarui poin pelanggaran.' };
    }
};
