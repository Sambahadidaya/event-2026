'use server';

import { supabaseAdmin } from '@/lib/supabase';

export const getFormNilaiByLink = async (linkId) => {
    try {
        if (!linkId) throw new Error('Link ID is required');

        const { data, error } = await supabaseAdmin
            .from('form_nilai_lomba')
            .select('*')
            .eq('link_id', linkId)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Internal Log - Error fetching form_nilai_lomba by link:", error);
        return null;
    }
};

export const getPublicNilaiLombaByForm = async (formNilaiLombaId) => {
    try {
        if (!formNilaiLombaId) return [];

        const { data, error } = await supabaseAdmin
            .from('nilai_lomba')
            .select('*, team:team_id(id, title, gambar, jenis_lomba, nama_lomba), detail_nilai_lomba(*)')
            .eq('form_nilai_lomba_id', formNilaiLombaId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Internal Log - Error fetching public nilai_lomba:", error);
        return [];
    }
};

export const insertPublicNilaiLomba = async (nilaiPayload, detailPayloads = []) => {
    try {
        if (!nilaiPayload || !nilaiPayload.form_nilai_lomba_id || !nilaiPayload.team_id) {
            throw new Error('Form ID and Team ID are required');
        }

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
            team_id: nilaiPayload.team_id,
            form_nilai_lomba_id: nilaiPayload.form_nilai_lomba_id,
            kritik: nilaiPayload.kritik || '',
            saran: nilaiPayload.saran || '',
            nilai_akhir: nilaiAkhir,
            status_public: true
        };

        const { data: newNilai, error: insertError } = await supabaseAdmin
            .from('nilai_lomba')
            .insert([finalNilaiPayload])
            .select('id')
            .single();

        if (insertError) throw insertError;
        const nilaiId = newNilai.id;

        if (detailPayloads && detailPayloads.length > 0) {
            const detailsToInsert = detailPayloads.map(d => ({
                nilai_lomba_id: nilaiId,
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
            console.error("Internal Log - Error updating submission status on public evaluation:", subError);
        }

        return { success: true, id: nilaiId, nilai_akhir: nilaiAkhir };
    } catch (error) {
        console.error("Internal Log - Error inserting public nilai_lomba:", error);
        return { success: false, error: 'Terjadi kesalahan saat menyimpan penilaian.' };
    }
};

/**
 * Get final scores and detail penilaian by team's kode_form
 */
export const getNilaiByKodeForm = async (kode_form) => {
    try {
        if (!kode_form) return { success: false, error: 'Kode form diperlukan.' };

        // 1. Fetch team by kode_form (selectively)
        const { data: team, error: teamError } = await supabaseAdmin
            .from('team')
            .select('id, title, nama_lomba, jenis_lomba')
            .eq('kode_form', kode_form)
            .maybeSingle();

        if (teamError) throw teamError;
        if (!team) {
            return { success: false, error: 'Kode form tidak ditemukan. Pastikan Anda memasukkan kode dengan benar.' };
        }

        // 2. Fetch nilai_lomba and details (selectively)
        const { data: nilaiData, error: nilaiError } = await supabaseAdmin
            .from('nilai_lomba')
            .select(`
                id,
                kritik,
                saran,
                nilai_akhir,
                created_at,
                form_nilai_lomba:form_nilai_lomba_id (
                    nama_juri,
                    judul_nilai,
                    bobot_nilai
                ),
                detail_nilai_lomba (
                    id,
                    judul_nilai,
                    bobot_nilai,
                    nilai
                )
            `)
            .eq('team_id', team.id)
            .eq('status_public', true);

        if (nilaiError) throw nilaiError;

        return {
            success: true,
            team,
            nilaiList: nilaiData || []
        };
    } catch (error) {
        console.error("Internal Log - Error fetching nilai by kode form:", error);
        return { success: false, error: 'Terjadi kesalahan saat memverifikasi kode.' };
    }
};

/**
 * Get submission file and details for a team in a specific competition (selectively)
 */
export const getSubmissionByTeamAndLomba = async (teamId, namaLomba) => {
    try {
        if (!teamId || !namaLomba) return null;

        // Find register id
        const { data: registerData, error: regError } = await supabaseAdmin
            .from('form_register')
            .select('id')
            .eq('nama_lomba', namaLomba);

        if (regError || !registerData || registerData.length === 0) return null;
        const regIds = registerData.map(r => r.id);

        // Find active form_pengumpulan
        const { data: activeForms, error: activeError } = await supabaseAdmin
            .from('form_pengumpulan')
            .select('id')
            .in('form_id', regIds);

        if (activeError || !activeForms || activeForms.length === 0) return null;
        const formIds = activeForms.map(f => f.id);

        // Fetch submission selectively
        const { data: submission, error: subError } = await supabaseAdmin
            .from('pengumpulan_lomba')
            .select('file_link, keterangan, id')
            .eq('team_id', teamId)
            .in('form_id', formIds)
            .maybeSingle();

        if (subError) throw subError;
        return submission;
    } catch (error) {
        console.error("Internal Log - Error fetching submission by team/lomba:", error);
        return null;
    }
};
