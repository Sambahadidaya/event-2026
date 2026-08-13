'use server';

import { supabaseAdmin } from '@/lib/supabase';

// Check if NIM has a verified Tahap 1 payment
export const checkTahap1Pembayaran = async (nim) => {
    try {
        if (!nim) return { success: false, error: 'NIM wajib diisi' };

        const { data, error } = await supabaseAdmin
            .from('pembayaran_pkkmb')
            .select('status_pembayaran, nominal')
            .eq('nim_user', nim)
            .eq('tahapan', 'tahap 1')
            .neq('status_pembayaran', 'ditolak')
            .maybeSingle();

        if (error) throw error;
        if (!data) return { success: false, error: 'NIM belum melakukan pembayaran Tahap 1' };
        
        return { success: true, data };
    } catch (error) {
        console.error("Internal Log - Error checking Tahap 1 payment:", error);
        return { success: false, error: 'Terjadi kesalahan saat memeriksa database' };
    }
};

// Fetch participant details for mapping
export const getPesertaWajibPkkmbByNim = async (nim) => {
    try {
        if (!nim) return null;

        const { data, error } = await supabaseAdmin
            .from('peserta')
            .select('nama, email_wa, prodi, angkatan, semester, kelas, kategori, kampus, kode_form')
            .eq('nim', nim)
            .eq('site_type', 'pkkmb')
            .eq('jenis_form', 'wajib')
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Internal Log - Error fetching peserta by nim for mapping:", error);
        return null;
    }
};

// Insert a record into pembayaran_pkkmb
export const insertPembayaranPkkmb = async (payload) => {
    try {
        if (!payload) throw new Error('Payload is required');
        
        const { data, error } = await supabaseAdmin
            .from('pembayaran_pkkmb')
            .insert([{
                nim_user: payload.nim_user,
                jenis_bayar: payload.jenis_bayar,
                tahapan: payload.tahapan,
                nominal: parseInt(payload.nominal, 10) || 0,
                status_pembayaran: payload.status_pembayaran || 'pending'
            }])
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error("Internal Log - Error inserting pembayaran_pkkmb:", error);
        return { success: false, error: 'Gagal menyimpan data pembayaran' };
    }
};
