'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { checkAdminAuth, insertAuditLog } from './audit';

// ============================================================
// DOKUMENTASI (CRUD)
// ============================================================

/**
 * Upsert data Dokumentasi
 * @param {Object} payload { site, judul, header_foto, tanggal, link_gdrive }
 * @param {string|null} id
 */
export const upsertDokumentasi = async (payload, id = null) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!payload) throw new Error('Payload wajib diisi');

        const cleanPayload = {
            site: payload.site,
            judul: payload.judul ? payload.judul.slice(0, 100) : null,
            header_foto: payload.header_foto ? payload.header_foto.slice(0, 255) : null,
            tanggal: payload.tanggal || null,
            link_gdrive: payload.link_gdrive ? payload.link_gdrive.slice(0, 255) : null,
        };

        let resultData = null;

        if (id) {
            const { data, error } = await supabaseAdmin
                .from('dokumentasi')
                .update(cleanPayload)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            resultData = data;
            await insertAuditLog(user.email, 'UPDATE_DOKUMENTASI', id, `Dokumentasi '${cleanPayload.judul || id}' updated`, adminNama);
        } else {
            const { data, error } = await supabaseAdmin
                .from('dokumentasi')
                .insert([cleanPayload])
                .select()
                .single();

            if (error) throw error;
            resultData = data;
            await insertAuditLog(user.email, 'CREATE_DOKUMENTASI', data.id, `Dokumentasi '${cleanPayload.judul}' created`, adminNama);
        }

        return { success: true, data: resultData };
    } catch (error) {
        console.error('Internal Log - Error upserting dokumentasi:', error);
        return { success: false, error: error.message || 'Terjadi kesalahan internal server.' };
    }
};

/**
 * Hapus Dokumentasi (otomatis menghapus cuplikan via ON DELETE CASCADE)
 * @param {string} id 
 */
export const deleteDokumentasi = async (id) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id) throw new Error('ID wajib diisi');

        const { error } = await supabaseAdmin
            .from('dokumentasi')
            .delete()
            .eq('id', id);

        if (error) throw error;

        await insertAuditLog(user.email, 'DELETE_DOKUMENTASI', id, 'Dokumentasi deleted', adminNama);
        return { success: true };
    } catch (error) {
        console.error('Internal Log - Error deleting dokumentasi:', error);
        return { success: false, error: error.message || 'Terjadi kesalahan internal server.' };
    }
};

// ============================================================
// DOKUMENTASI CUPLIKAN (BATCH SAVE)
// ============================================================

/**
 * Simpan cuplikan video untuk sebuah dokumentasi (Replace All)
 * @param {string} dokumentasiId 
 * @param {Array<{judul_cuplikan: string, link_gdrive_video: string, urutan: number}>} cuplikanList 
 */
export const saveCuplikanBatch = async (dokumentasiId, cuplikanList = []) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!dokumentasiId) throw new Error('ID Dokumentasi wajib disertakan');

        // 1. Hapus cuplikan lama
        const { error: deleteError } = await supabaseAdmin
            .from('dokumentasi_cuplikan')
            .delete()
            .eq('dokumentasi_id', dokumentasiId);

        if (deleteError) throw deleteError;

        // 2. Insert cuplikan baru jika ada
        if (Array.isArray(cuplikanList) && cuplikanList.length > 0) {
            const rowsToInsert = cuplikanList
                .filter(item => (item.judul_cuplikan && item.judul_cuplikan.trim()) || (item.link_gdrive_video && item.link_gdrive_video.trim()))
                .map((item, idx) => ({
                    dokumentasi_id: dokumentasiId,
                    judul_cuplikan: item.judul_cuplikan ? item.judul_cuplikan.slice(0, 100) : '',
                    link_gdrive_video: item.link_gdrive_video ? item.link_gdrive_video.slice(0, 255) : '',
                    tipe_cuplikan: item.tipe_cuplikan === 'foto' ? 'foto' : 'video',
                    urutan: typeof item.urutan === 'number' ? item.urutan : idx + 1
                }));

            if (rowsToInsert.length > 0) {
                const { error: insertError } = await supabaseAdmin
                    .from('dokumentasi_cuplikan')
                    .insert(rowsToInsert);

                if (insertError) throw insertError;
            }
        }

        await insertAuditLog(user.email, 'UPDATE_CUPLIKAN_BATCH', dokumentasiId, `Batch cuplikan updated (${cuplikanList.length} items)`, adminNama);
        return { success: true };
    } catch (error) {
        console.error('Internal Log - Error saving cuplikan batch:', error);
        return { success: false, error: error.message || 'Terjadi kesalahan saat menyimpan cuplikan video.' };
    }
};

// ============================================================
// KONTEN MULTIMEDIA (CRUD)
// ============================================================

/**
 * Upsert Konten Multimedia
 * @param {Object} payload { site, judul, deskripsi, thumbnail, link_gdrive_video, tanggal }
 * @param {string|null} id
 */
export const upsertKontenMultimedia = async (payload, id = null) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!payload) throw new Error('Payload wajib diisi');

        const cleanPayload = {
            site: payload.site,
            judul: payload.judul ? payload.judul.slice(0, 100) : null,
            deskripsi: payload.deskripsi ? payload.deskripsi.slice(0, 255) : null,
            thumbnail: payload.thumbnail ? payload.thumbnail.slice(0, 255) : null,
            link_gdrive_video: payload.link_gdrive_video ? payload.link_gdrive_video.slice(0, 255) : null,
            tanggal: payload.tanggal || null,
        };

        let resultData = null;

        if (id) {
            const { data, error } = await supabaseAdmin
                .from('konten_multimedia')
                .update(cleanPayload)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            resultData = data;
            await insertAuditLog(user.email, 'UPDATE_KONTEN_MULTIMEDIA', id, `Konten '${cleanPayload.judul || id}' updated`, adminNama);
        } else {
            const { data, error } = await supabaseAdmin
                .from('konten_multimedia')
                .insert([cleanPayload])
                .select()
                .single();

            if (error) throw error;
            resultData = data;
            await insertAuditLog(user.email, 'CREATE_KONTEN_MULTIMEDIA', data.id, `Konten '${cleanPayload.judul}' created`, adminNama);
        }

        return { success: true, data: resultData };
    } catch (error) {
        console.error('Internal Log - Error upserting konten multimedia:', error);
        return { success: false, error: error.message || 'Terjadi kesalahan internal server.' };
    }
};

/**
 * Hapus Konten Multimedia
 * @param {string} id 
 */
export const deleteKontenMultimedia = async (id) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id) throw new Error('ID wajib diisi');

        const { error } = await supabaseAdmin
            .from('konten_multimedia')
            .delete()
            .eq('id', id);

        if (error) throw error;

        await insertAuditLog(user.email, 'DELETE_KONTEN_MULTIMEDIA', id, 'Konten multimedia deleted', adminNama);
        return { success: true };
    } catch (error) {
        console.error('Internal Log - Error deleting konten multimedia:', error);
        return { success: false, error: error.message || 'Terjadi kesalahan internal server.' };
    }
};
