'use server';

import { supabaseAdmin } from '@/lib/supabase';

// ================= PUBLIC INSERT (untuk form publik) =================

export const insertPeserta = async (payload) => {
    try {
        if (!payload) throw new Error('Payload is required');
        if (!payload.nim) throw new Error('NIM is required');

        // 1. Sanitize payload (Prevent Mass Assignment)
        const allowedKeys = [
            'nama', 'nim', 'kampus', 'kategori', 'email_wa', 'bukti_bayar',
            'jenis_form', 'site_type', 'form_register_id', 'metode_pembayaran',
            'prodi', 'angkatan', 'semester', 'kode_form'
        ];

        const sanitizedPayload = {};
        for (const key of allowedKeys) {
            if (payload[key] !== undefined) {
                sanitizedPayload[key] = payload[key];
            }
        }

        // Force status_pembayaran to default (Pending) or exclude it
        // Do not allow client to set status_pembayaran to 'Lunas'
        sanitizedPayload.status_pembayaran = 'Pending';

        // 2. Cek Limit Registrasi Maksimal 3 kali per NIM di jenis form yang sama
        const { count, error: countError } = await supabaseAdmin
            .from('peserta')
            .select('*', { count: 'exact', head: true })
            .eq('nim', sanitizedPayload.nim)
            .eq('site_type', sanitizedPayload.site_type)
            .eq('jenis_form', sanitizedPayload.jenis_form);

        if (countError) throw countError;

        if (count >= 3) {
            return { success: false, error: 'Batas maksimal pendaftaran (3 kali) untuk NIM ini telah tercapai.' };
        }

        // 3. Insert ke database
        const { error } = await supabaseAdmin
            .from('peserta')
            .insert([sanitizedPayload]);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        // Prevent Information Disclosure
        console.error("Internal Log - Error inserting peserta:", error);
        return { success: false, error: 'Terjadi kesalahan internal pada server saat mendaftar.' };
    }
};

export const insertPesertaBatch = async (pesertaArray) => {
    try {
        if (!pesertaArray || !Array.isArray(pesertaArray)) throw new Error('Array is required');

        const allowedKeys = [
            'nama', 'nim', 'kampus', 'kategori', 'email_wa', 'bukti_bayar',
            'jenis_form', 'site_type', 'form_register_id', 'metode_pembayaran',
            'prodi', 'angkatan', 'semester', 'kode_form'
        ];

        const sanitizedArray = [];

        for (const payload of pesertaArray) {
            const sanitizedPayload = {};
            for (const key of allowedKeys) {
                if (payload[key] !== undefined) {
                    sanitizedPayload[key] = payload[key];
                }
            }
            sanitizedPayload.status_pembayaran = 'Pending';

            // Check limit
            if (sanitizedPayload.nim) {
                const { count, error: countError } = await supabaseAdmin
                    .from('peserta')
                    .select('*', { count: 'exact', head: true })
                    .eq('nim', sanitizedPayload.nim)
                    .eq('site_type', sanitizedPayload.site_type)
                    .eq('jenis_form', sanitizedPayload.jenis_form);

                if (countError) throw countError;
                if (count >= 3) {
                    return { success: false, error: `Batas maksimal pendaftaran (3 kali) untuk NIM ${sanitizedPayload.nim} telah tercapai.` };
                }
            }
            sanitizedArray.push(sanitizedPayload);
        }

        const { error } = await supabaseAdmin
            .from('peserta')
            .insert(sanitizedArray);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error("Internal Log - Error inserting peserta batch:", error);
        return { success: false, error: 'Terjadi kesalahan internal pada server saat mendaftar.' };
    }
};

export const getFormWajib = async (siteType) => {
    try {
        let query = supabaseAdmin
            .from('form_wajib')
            .select('*')
            .order('created_at', { ascending: false });

        if (siteType && siteType !== 'all') {
            query = query.eq('site', siteType);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Internal Log - Error fetching form wajib:", error);
        return [];
    }
};

export const getFormWajibByLinkId = async (linkId) => {
    try {
        if (!linkId) throw new Error('Link ID is required');

        const { data, error } = await supabaseAdmin
            .from('form_wajib')
            .select('*')
            .eq('link_id', linkId)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Internal Log - Error fetching form wajib by link id:", error);
        return null;
    }
};

export const getFormRegister = async (siteType) => {
    try {
        let query = supabaseAdmin
            .from('form_register')
            .select('*')
            .order('created_at', { ascending: false });

        if (siteType && siteType !== 'all') {
            query = query.eq('site', siteType);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Internal Log - Error fetching form register:", error);
        return [];
    }
};

export const getFormRegisterByLinkId = async (linkId) => {
    try {
        if (!linkId) throw new Error('Link ID is required');

        const { data, error } = await supabaseAdmin
            .from('form_register')
            .select('*')
            .eq('link_id', linkId)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Internal Log - Error fetching form register by link id:", error);
        return null;
    }
};

export const checkPesertaPkkmbByNim = async (nim) => {
    try {
        if (!nim) throw new Error('NIM is required');

        const { data, error } = await supabaseAdmin
            .from('peserta')
            .select('id, nama, nim')
            .eq('site_type', 'pkkmb')
            .eq('nim', nim)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    } catch (error) {
        console.error("Internal Log - Error checking peserta pkkmb by nim:", error);
        return null;
    }
};

export const checkPesertaPoseWajibByNim = async (nim) => {
    try {
        if (!nim) throw new Error('NIM is required');

        const { data, error } = await supabaseAdmin
            .from('peserta')
            .select('id, nama, nim')
            .eq('site_type', 'pose')
            .eq('jenis_form', 'wajib')
            .eq('nim', nim)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    } catch (error) {
        console.error("Internal Log - Error checking peserta pose wajib by nim:", error);
        return null;
    }
};

export const checkPesertaPoseWajibByNimAndKampus = async (nim, kampus) => {
    try {
        if (!nim) throw new Error('NIM is required');
        if (!kampus) throw new Error('Kampus is required');

        const { data, error } = await supabaseAdmin
            .from('peserta')
            .select('*')
            .eq('site_type', 'pose')
            .eq('jenis_form', 'wajib')
            .eq('nim', nim)
            .eq('kampus', kampus)
            .single();

        if (error) {
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data;
    } catch (error) {
        console.error("Internal Log - Error checking peserta pose wajib by nim and kampus:", error);
        return null;
    }
};
