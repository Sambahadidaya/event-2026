'use server';

import { supabaseAdmin } from '@/lib/supabase';

// ================= MATERI (PUBLIC READ) =================

export const getServerTime = async () => {
    try {
        const { data, error } = await supabaseAdmin.rpc('get_server_time');
        if (error || !data) {
            return new Date().toISOString();
        }
        return new Date(data).toISOString();
    } catch (error) {
        console.error("Internal Log - Error fetching server time:", error);
        return new Date().toISOString();
    }
};

export const getMateri = async () => {
    try {
        const { data, error } = await supabaseAdmin
            .from('materi_pkkmb')
            .select('id, judul, pemateri, tanggal, status, foto_header, tutup')
            .order('tanggal', { ascending: true });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Internal Log - Error fetching materi:", error);
        return [];
    }
};

export const getMateriById = async (id) => {
    try {
        if (!id) throw new Error('ID is required');

        const { data, error } = await supabaseAdmin
            .from('materi_pkkmb')
            .select('id, judul, pemateri, tanggal, status, foto_header, file_pdf, link_tugas, tutup')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Internal Log - Error fetching materi by id:", error);
        return null;
    }
};

// ================= TUGAS (PUBLIC) =================

export const getTugas = async (materiId = null) => {
    try {
        let query = supabaseAdmin
            .from('tugas_materi')
            .select('id, materi_id, nama, nim, kampus, file_tugas, created_at, materi_pkkmb(judul)')
            .order('created_at', { ascending: false });

        if (materiId) {
            query = query.eq('materi_id', materiId);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Internal Log - Error fetching tugas:", error);
        return [];
    }
};

export const getTugasByNimAndMateri = async (nim, materiId) => {
    try {
        if (!nim || !materiId) return null;

        const { data, error } = await supabaseAdmin
            .from('tugas_materi')
            .select('id, materi_id, nama, nim, kampus, file_tugas, created_at')
            .eq('nim', nim)
            .eq('materi_id', materiId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Internal Log - Error fetching tugas by nim and materi:", error);
        return null;
    }
};

export const getTugasByNim = async (nim) => {
    try {
        if (!nim) return [];

        const { data, error } = await supabaseAdmin
            .from('tugas_materi')
            .select('id, materi_id, nama, nim, kampus, file_tugas, created_at, materi_pkkmb(id, judul, pemateri, tanggal, link_tugas)')
            .eq('nim', nim)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Internal Log - Error fetching tugas by nim:", error);
        return [];
    }
};


const normalizeFileTugas = (fileTugas) => {
    if (!fileTugas) return '';
    return fileTugas
        .split(',')
        .map(item => {
            const trimmed = item.trim();
            if (trimmed.includes('/materi-tugas/')) {
                return trimmed.split('/materi-tugas/').pop();
            }
            return trimmed;
        })
        .filter(Boolean)
        .join(',');
};

export const saveTugas = async (payload) => {
    try {
        if (!payload || !payload.nim || !payload.materi_id) throw new Error('Data tugas tidak lengkap.');

        const normalizedFileTugas = normalizeFileTugas(payload.file_tugas);

        // Cek apakah sudah pernah mengumpulkan tugas untuk materi ini
        const { data: existing } = await supabaseAdmin
            .from('tugas_materi')
            .select('id')
            .eq('nim', payload.nim)
            .eq('materi_id', payload.materi_id)
            .maybeSingle();

        if (existing) {
            return {
                success: false,
                error: 'Anda sudah pernah mengumpulkan tugas untuk materi ini dan tidak dapat mengumpulkan ulang.'
            };
        }

        const { error: insertErr } = await supabaseAdmin
            .from('tugas_materi')
            .insert([{
                materi_id: payload.materi_id,
                nama: payload.nama,
                kampus: payload.kampus,
                nim: payload.nim,
                file_tugas: normalizedFileTugas
            }]);

        if (insertErr) throw insertErr;
        return { success: true, isUpdate: false };
    } catch (error) {
        console.error("Internal Log - Error saving tugas:", error);
        return { success: false, error: error.message || 'Terjadi kesalahan internal pada server saat menyimpan tugas.' };
    }
};

export const insertTugas = async (payload) => {
    return saveTugas(payload);
};
