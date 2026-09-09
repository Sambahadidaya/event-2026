'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { checkAdminAuth, insertAuditLog } from './audit';

/**
 * Mengambil kriteria & bobot penilaian master PKKMB
 * @param {Object} params
 * @param {string} params.kategori - 'reguler' | 'nonreg' | 'all'
 */
export const getMasterPenilaian = async ({ kategori = 'reguler' } = {}) => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        let query = supabaseAdmin
            .from('master_penilaian_pkkmb')
            .select('id, kategori_peserta, kode_kriteria, nama_kriteria, bobot_persen, keterangan, urutan, aktif, created_at, updated_at')
            .order('urutan', { ascending: true });

        if (kategori && kategori !== 'all') {
            query = query.eq('kategori_peserta', kategori);
        }

        const { data, error } = await query;
        if (error) throw error;

        return { success: true, data: data || [] };
    } catch (error) {
        console.error('Error in getMasterPenilaian:', error);
        return { success: false, error: error.message || 'Gagal memuat master penilaian.' };
    }
};

/**
 * Update kriteria master penilaian PKKMB (satuan)
 */
export const updateMasterPenilaian = async ({ id, bobot_persen, aktif, keterangan }) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id) throw new Error('ID kriteria penilaian wajib diisi.');

        const updateData = {
            updated_at: new Date().toISOString()
        };

        if (bobot_persen !== undefined) {
            const num = parseFloat(bobot_persen);
            if (isNaN(num) || num < 0 || num > 100) {
                throw new Error('Bobot harus berupa angka antara 0 dan 100.');
            }
            updateData.bobot_persen = num;
        }

        if (aktif !== undefined) {
            updateData.aktif = Boolean(aktif);
        }

        if (keterangan !== undefined) {
            updateData.keterangan = keterangan;
        }

        const { data, error } = await supabaseAdmin
            .from('master_penilaian_pkkmb')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        await insertAuditLog(
            user.email,
            'UPDATE_MASTER_PENILAIAN',
            id,
            `Bobot kriteria ${data.nama_kriteria} (${data.kategori_peserta}) diubah menjadi ${data.bobot_persen}%`,
            adminNama
        );

        return { success: true, data };
    } catch (error) {
        console.error('Error in updateMasterPenilaian:', error);
        return { success: false, error: error.message || 'Gagal memperbarui master penilaian.' };
    }
};

/**
 * Update batch seluruh bobot kriteria untuk kategori tertentu
 * Memvalidasi agar total bobot kriteria aktif tepat 100%
 */
export const updateBatchMasterPenilaian = async ({ kategori, items = [] }) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!kategori) throw new Error('Kategori (reguler/nonreg) wajib disertakan.');
        if (!Array.isArray(items) || items.length === 0) {
            throw new Error('Daftar kriteria tidak boleh kosong.');
        }

        // Hitung total bobot aktif
        let totalBobot = 0;
        items.forEach(item => {
            if (item.aktif !== false) {
                totalBobot += parseFloat(item.bobot_persen || 0);
            }
        });

        // Toleransi floating point
        if (Math.abs(totalBobot - 100) > 0.01) {
            throw new Error(`Total bobot kriteria aktif harus tepat 100%. Saat ini: ${totalBobot.toFixed(2)}%`);
        }

        // Lakukan update masing-masing item
        for (const item of items) {
            const { error: updErr } = await supabaseAdmin
                .from('master_penilaian_pkkmb')
                .update({
                    bobot_persen: parseFloat(item.bobot_persen || 0),
                    aktif: item.aktif !== undefined ? Boolean(item.aktif) : true,
                    keterangan: item.keterangan || null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', item.id);

            if (updErr) throw updErr;
        }

        await insertAuditLog(
            user.email,
            'UPDATE_BATCH_MASTER_PENILAIAN',
            null,
            `Bobot penilaian ${kategori} diperbarui secara batch (Total 100%)`,
            adminNama
        );

        return { success: true, message: 'Bobot penilaian berhasil disimpan.' };
    } catch (error) {
        console.error('Error in updateBatchMasterPenilaian:', error);
        return { success: false, error: error.message || 'Gagal menyimpan perubahan bobot.' };
    }
};

/**
 * Reset bobot penilaian ke default (masing-masing 20%)
 */
export const resetMasterPenilaian = async ({ kategori }) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!kategori) throw new Error('Kategori wajib disertakan.');

        const { error } = await supabaseAdmin
            .from('master_penilaian_pkkmb')
            .update({
                bobot_persen: 20.00,
                aktif: true,
                updated_at: new Date().toISOString()
            })
            .eq('kategori_peserta', kategori);

        if (error) throw error;

        await insertAuditLog(
            user.email,
            'RESET_MASTER_PENILAIAN',
            null,
            `Bobot kriteria penilaian kategori ${kategori} di-reset ke default (20% per kriteria)`,
            adminNama
        );

        return { success: true, message: `Bobot kategori ${kategori} berhasil di-reset ke default (20%).` };
    } catch (error) {
        console.error('Error in resetMasterPenilaian:', error);
        return { success: false, error: error.message || 'Gagal me-reset bobot penilaian.' };
    }
};
