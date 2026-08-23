'use server';

import { supabaseAdmin } from '@/lib/supabase';

// Helper for basic sanitization
const sanitizeInput = (str) => {
    if (!str) return '';
    return str.replace(/[<>'\"\\\/]/g, '');
};

const isValidUrl = (urlString) => {
    try {
        const url = new URL(urlString);
        const host = url.hostname.toLowerCase();
        return host.includes('drive.google.com') || host.includes('youtube.com') || host.includes('youtu.be');
    } catch (e) {
        return false;
    }
};

export const getFormPengumpulanByLink = async (linkId) => {
    try {
        if (!linkId) throw new Error('Link ID is required');

        const { data, error } = await supabaseAdmin
            .from('form_pengumpulan')
            .select(`
                *,
                form_register ( id, nama_lomba, jenis_lomba, keterangan, gambar, site )
            `)
            .eq('link_id', linkId)
            .eq('status', true)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null; // Not found
            }
            throw error;
        }

        return {
            ...data,
            gambar: data.gambar || data.form_register?.gambar || null
        };
    } catch (error) {
        console.error("Internal Log - Error fetching form pengumpulan public:", error);
        return null;
    }
};

export const getFormPengumpulanFields = async (eventCode) => {
    try {
        // 2. UBAH 'supabase' MENJADI 'supabaseAdmin'
        const { data, error } = await supabaseAdmin
            .from('form_pengumpulan')
            .select(`
                id,
                link_id,
                status,
                form_id,
                gambar,
                created_at,
                form_register!inner (
                    id,
                    nama_lomba,
                    jenis_lomba,
                    kategori_pendaftar,
                    keterangan,
                    gambar,
                    site
                )
            `)
            .eq('form_register.is_public', true)
            .eq('form_register.site', eventCode)
            .eq('status', true);

        if (error) {
            console.error("Internal Log - Error fetching form pengumpulan fields:", error);
            return null;
        }

        const formattedData = data.map((item) => ({
            id: item.id,
            link_id: item.link_id,
            status: item.status,
            form_id: item.form_id,
            created_at: item.created_at,
            ...item.form_register,
            gambar: item.gambar || item.form_register?.gambar || null
        }));

        return formattedData;

    } catch (error) {
        console.error("Internal Log - Catch Error:", error);
        return null;
    }
};

export const verifyKodeFormTeam = async (kode_form) => {
    try {
        if (!kode_form) return { success: false, error: 'Kode form diperlukan.' };

        const cleanKode = sanitizeInput(kode_form);

        const { data, error } = await supabaseAdmin
            .from('team')
            .select('id, title, nama_lomba, jenis_lomba')
            .eq('kode_form', cleanKode)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return { success: false, error: 'Kode Form tidak ditemukan. Pastikan Anda telah terdaftar.' };
            }
            throw error;
        }

        return { success: true, data };
    } catch (error) {
        console.error("Internal Log - Error verifying kode form:", error);
        return { success: false, error: 'Terjadi kesalahan saat memverifikasi kode.' };
    }
};

export const submitPengumpulan = async (payload) => {
    try {
        const { form_id, kode_form, keterangan, file_link, isUrl } = payload;

        if (!form_id || !kode_form || !file_link) {
            return { success: false, error: 'Semua field wajib diisi.' };
        }

        // Validate URL if it's a link
        if (isUrl) {
            if (!isValidUrl(file_link)) {
                return { success: false, error: 'Hanya URL dari Google Drive atau YouTube yang diperbolehkan.' };
            }
        }

        // Verify Kode Form
        const verifyRes = await verifyKodeFormTeam(kode_form);
        if (!verifyRes.success) {
            return verifyRes;
        }

        const team_id = verifyRes.data.id;

        // Check if already submitted for this form and team
        const { data: existing, error: checkError } = await supabaseAdmin
            .from('pengumpulan_lomba')
            .select('id')
            .eq('form_id', form_id)
            .eq('team_id', team_id)
            .maybeSingle();

        if (checkError) throw checkError;
        if (existing) {
            return { success: false, error: 'Tim ini sudah mengumpulkan karya untuk lomba ini.' };
        }

        const cleanKeterangan = sanitizeInput(keterangan);

        const { data, error } = await supabaseAdmin
            .from('pengumpulan_lomba')
            .insert([{
                form_id,
                team_id,
                keterangan: cleanKeterangan,
                file_link,
                status_pengumpulan: false
            }])
            .select()
            .single();

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        console.error("Internal Log - Error submitting pengumpulan:", error);
        return { success: false, error: 'Terjadi kesalahan internal pada server' };
    }
};
