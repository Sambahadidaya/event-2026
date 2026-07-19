'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { checkAdminAuth, insertAuditLog } from './audit';

export const upsertJadwalPertandingan = async (payload, id = null) => {
    try {
        const { user, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!payload) throw new Error('Payload is required');

        if (id) {
            const { error } = await supabaseAdmin
                .from('jadwal_pertandingan')
                .update(payload)
                .eq('id', id);
            if (error) throw error;
        } else {
            const { error } = await supabaseAdmin
                .from('jadwal_pertandingan')
                .insert([payload]);
            if (error) throw error;
        }
        await insertAuditLog(user.email, id ? 'UPDATE_JADWAL_PERTANDINGAN' : 'CREATE_JADWAL_PERTANDINGAN', id, `Jadwal pertandingan ${id ? 'updated' : 'created'}`);
        return { success: true };
    } catch (error) {
        console.error("Internal Log - Error upserting jadwal pertandingan:", error);
        return { success: false, error: 'Terjadi kesalahan internal pada server.' };
    }
};

export const upsertHasilPertandingan = async (hasilArray) => {
    try {
        const { user, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!hasilArray || !Array.isArray(hasilArray)) {
            throw new Error('hasilArray must be an array');
        }

        const { error } = await supabaseAdmin
            .from('hasil_pertandingan')
            .upsert(hasilArray);

        if (error) throw error;
        await insertAuditLog(user.email, 'UPSERT_HASIL_PERTANDINGAN', null, `Upserted ${hasilArray.length} hasil`);
        return { success: true };
    } catch (error) {
        console.error("Internal Log - Error upserting hasil pertandingan:", error);
        return { success: false, error: 'Terjadi kesalahan internal pada server.' };
    }
};

export const deleteJadwalPertandingan = async (id) => {
    try {
        const { user, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id) throw new Error('ID is required');

        const { error } = await supabaseAdmin
            .from('jadwal_pertandingan')
            .delete()
            .eq('id', id);

        if (error) throw error;
        await insertAuditLog(user.email, 'DELETE_JADWAL_PERTANDINGAN', id, `Jadwal pertandingan deleted`);
        return { success: true };
    } catch (error) {
        console.error("Internal Log - Error deleting jadwal pertandingan:", error);
        return { success: false, error: 'Terjadi kesalahan internal pada server.' };
    }
};

export const upsertJadwalAcara = async (payload, id = null) => {
     try {
        const { user, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!payload) throw new Error('Payload is required');
        let tableName = 'jadwal_acara';

        if (id) {
            const { error } = await supabaseAdmin
                .from(tableName)
                .update(payload)
                .eq('id', id);
            if (error) {
                const res = await supabaseAdmin.from('jadwal').update(payload).eq('id', id);
                if (res.error) throw res.error;
            }
        } else {
            const { error } = await supabaseAdmin
                .from(tableName)
                .insert([payload]);
            if (error) {
                 const res = await supabaseAdmin.from('jadwal').insert([payload]);
                 if (res.error) throw res.error;
            }
        }
        await insertAuditLog(user.email, id ? 'UPDATE_JADWAL_ACARA' : 'CREATE_JADWAL_ACARA', id, `Jadwal acara ${id ? 'updated' : 'created'}`);
        return { success: true };
    } catch (error) {
        console.error("Internal Log - Error upserting jadwal acara:", error);
        return { success: false, error: 'Terjadi kesalahan internal pada server.' };
    }
};

export const deleteJadwalAcara = async (id) => {
    try {
        const { user, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id) throw new Error('ID is required');

        const { error } = await supabaseAdmin
            .from('jadwal_acara')
            .delete()
            .eq('id', id);

        if (error) {
             const res = await supabaseAdmin.from('jadwal').delete().eq('id', id);
             if (res.error) throw res.error;
        }
        await insertAuditLog(user.email, 'DELETE_JADWAL_ACARA', id, `Jadwal acara deleted`);
        return { success: true };
    } catch (error) {
        console.error("Internal Log - Error deleting jadwal acara:", error);
        return { success: false, error: 'Terjadi kesalahan internal pada server.' };
    }
};
