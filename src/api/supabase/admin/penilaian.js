'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { checkAdminAuth, insertAuditLog } from './audit';
import { nanoid } from 'nanoid';

export const getFormNilaiLomba = async (namaLombaFilter = null) => {
    try {
        let query = supabaseAdmin
            .from('form_nilai_lomba')
            .select('*')
            .order('created_at', { ascending: false });

        if (namaLombaFilter && namaLombaFilter !== 'all') {
            query = query.eq('nama_lomba', namaLombaFilter);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Internal Log - Error fetching form_nilai_lomba:", error);
        return [];
    }
};

export const upsertFormNilaiLomba = async (payload, id = null) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!payload) throw new Error('Payload is required');

        // Generate link_id using nanoid if not provided
        if (!payload.link_id) {
            payload.link_id = nanoid(8);
        }

        // Limit: Only 1 form per nama_lomba
        if (!id) {
            const { data: existingForm, error: checkError } = await supabaseAdmin
                .from('form_nilai_lomba')
                .select('id')
                .eq('nama_lomba', payload.nama_lomba)
                .maybeSingle();

            if (checkError) throw checkError;
            if (existingForm) {
                return { success: false, error: `Form penilaian untuk lomba "${payload.nama_lomba}" sudah dibuat.` };
            }
        }

        let resultId = id;
        if (id) {
            const { error } = await supabaseAdmin
                .from('form_nilai_lomba')
                .update({ ...payload, updated_at: new Date().toISOString() })
                .eq('id', id);
            if (error) throw error;
        } else {
            const { data, error } = await supabaseAdmin
                .from('form_nilai_lomba')
                .insert([payload])
                .select('id')
                .single();
            if (error) throw error;
            resultId = data.id;
        }

        await insertAuditLog(user.email, id ? 'UPDATE_FORM_NILAI_LOMBA' : 'CREATE_FORM_NILAI_LOMBA', resultId, `Form nilai lomba ${id ? 'updated' : 'created'}`, adminNama);
        return { success: true, id: resultId };
    } catch (error) {
        console.error("Internal Log - Error upserting form_nilai_lomba:", error);
        return { success: false, error: 'Terjadi kesalahan internal pada server.' };
    }
};

export const deleteFormNilaiLomba = async (id) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id) throw new Error('ID is required');

        const { error } = await supabaseAdmin
            .from('form_nilai_lomba')
            .delete()
            .eq('id', id);

        if (error) throw error;
        await insertAuditLog(user.email, 'DELETE_FORM_NILAI_LOMBA', id, `Form nilai lomba deleted`, adminNama);
        return { success: true };
    } catch (error) {
        console.error("Internal Log - Error deleting form_nilai_lomba:", error);
        return { success: false, error: 'Terjadi kesalahan internal pada server.' };
    }
};

export const getNilaiLomba = async (formNilaiLombaId = null) => {
    try {
        let query = supabaseAdmin
            .from('nilai_lomba')
            .select('*, team:team_id(id, title, gambar, jenis_lomba, nama_lomba, kode_form), form_nilai_lomba:form_nilai_lomba_id(id, nama_juri, nama_lomba), detail_nilai_lomba(*)')
            .order('created_at', { ascending: false });

        if (formNilaiLombaId && formNilaiLombaId !== 'all') {
            query = query.eq('form_nilai_lomba_id', formNilaiLombaId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Internal Log - Error fetching nilai_lomba:", error);
        return [];
    }
};

export const upsertNilaiLomba = async (nilaiPayload, detailPayloads = [], id = null) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!nilaiPayload) throw new Error('Nilai payload is required');

        // Hitung nilai_akhir: Σ(bobot * nilai) / Σ(bobot)
        let totalWeightedScore = 0;
        let totalWeight = 0;

        detailPayloads.forEach(d => {
            const bobot = parseFloat(d.bobot_nilai) || 0;
            const val = parseFloat(d.nilai) || 0;
            totalWeightedScore += (bobot * val);
            totalWeight += bobot;
        });

        const nilaiAkhir = totalWeight > 0 ? Number((totalWeightedScore / totalWeight).toFixed(2)) : 0;
        const finalNilaiPayload = {
            ...nilaiPayload,
            nilai_akhir: nilaiAkhir,
            updated_at: new Date().toISOString()
        };

        let currentNilaiId = id;

        if (id) {
            const { error: updateError } = await supabaseAdmin
                .from('nilai_lomba')
                .update(finalNilaiPayload)
                .eq('id', id);
            if (updateError) throw updateError;
        } else {
            const { data: newNilai, error: insertError } = await supabaseAdmin
                .from('nilai_lomba')
                .insert([finalNilaiPayload])
                .select('id')
                .single();
            if (insertError) throw insertError;
            currentNilaiId = newNilai.id;
        }

        // Simpan detail_nilai_lomba
        if (detailPayloads && detailPayloads.length > 0) {
            // Delete existing detail for this nilai_lomba_id
            await supabaseAdmin
                .from('detail_nilai_lomba')
                .delete()
                .eq('nilai_lomba_id', currentNilaiId);

            const detailsToInsert = detailPayloads.map(d => ({
                nilai_lomba_id: currentNilaiId,
                form_nilai_lomba_id: nilaiPayload.form_nilai_lomba_id,
                judul_nilai: d.judul_nilai,
                bobot_nilai: String(d.bobot_nilai),
                nilai: parseInt(d.nilai, 10) || 0
            }));

            const { error: detailError } = await supabaseAdmin
                .from('detail_nilai_lomba')
                .insert(detailsToInsert);
            if (detailError) throw detailError;
        }

        // Update status_pengumpulan to true in pengumpulan_lomba table
        try {
            await supabaseAdmin
                .from('pengumpulan_lomba')
                .update({ status_pengumpulan: true })
                .eq('team_id', nilaiPayload.team_id);
        } catch (subError) {
            console.error("Internal Log - Error updating submission status on evaluation:", subError);
        }

        await insertAuditLog(user.email, id ? 'UPDATE_NILAI_LOMBA' : 'CREATE_NILAI_LOMBA', currentNilaiId, `Nilai lomba ${id ? 'updated' : 'created'} with score ${nilaiAkhir}`, adminNama);
        return { success: true, id: currentNilaiId, nilai_akhir: nilaiAkhir };
    } catch (error) {
        console.error("Internal Log - Error upserting nilai_lomba:", error);
        return { success: false, error: 'Terjadi kesalahan internal pada server.' };
    }
};

export const deleteNilaiLomba = async (id) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id) throw new Error('ID is required');

        const { error } = await supabaseAdmin
            .from('nilai_lomba')
            .delete()
            .eq('id', id);

        if (error) throw error;
        await insertAuditLog(user.email, 'DELETE_NILAI_LOMBA', id, `Nilai lomba deleted`, adminNama);
        return { success: true };
    } catch (error) {
        console.error("Internal Log - Error deleting nilai_lomba:", error);
        return { success: false, error: 'Terjadi kesalahan internal pada server.' };
    }
};
