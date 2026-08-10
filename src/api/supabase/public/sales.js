'use server';

import { supabaseAdmin } from '@/lib/supabase';

// ========================= HELPERS =========================

const ALLOWED_SUMBER = [
    'Dari Sosial Media',
    'Dari Dosen/Manajemen LP3I',
    'Dari Panitia',
    'Dari Mahasiswa LP3I',
    'Lainnya'
];

const isValidString = (str, maxLen = 255) => {
    if (!str) return true;
    if (str.length > maxLen) return false;
    // Tolak karakter berbahaya (SQL injection / XSS)
    const dangerousPattern = /[<>'"\\\/;{}()\[\]]/;
    return !dangerousPattern.test(str);
};

const isValidUUID = (val) => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
};

// ========================= PUBLIC ACTION =========================

/**
 * Public action to insert into sales_pose table from registration form.
 * Automatically counts identity occurrences to calculate commission levels.
 */
export const insertSalesPose = async (payload) => {
    try {
        if (!payload || typeof payload !== 'object') throw new Error('Payload tidak valid');

        const { sumber, nama_nim, form_register_id, kategori, target_nim } = payload;

        // --- Validasi wajib ---
        if (!sumber || typeof sumber !== 'string') throw new Error('Sumber tidak valid');
        if (!ALLOWED_SUMBER.includes(sumber)) throw new Error('Sumber tidak dikenali');
        if (!form_register_id || !isValidUUID(form_register_id)) throw new Error('form_register_id tidak valid');

        // --- Validasi opsional tapi ketat ---
        if (nama_nim !== null && nama_nim !== undefined) {
            if (typeof nama_nim !== 'string') throw new Error('nama_nim harus berupa teks');
            if (!isValidString(nama_nim, 150)) throw new Error('nama_nim mengandung karakter tidak valid atau terlalu panjang');
        }

        if (target_nim !== null && target_nim !== undefined) {
            if (typeof target_nim !== 'string') throw new Error('target_nim harus berupa teks');
            if (!isValidString(target_nim, 100)) throw new Error('target_nim mengandung karakter tidak valid');
        }

        if (kategori !== null && kategori !== undefined) {
            const allowedKategori = ['Mahasiswa LP3I', 'Alumni LP3I', 'Siswa', 'Dosen', 'Umum'];
            if (!allowedKategori.includes(kategori)) throw new Error('Kategori tidak dikenali');
        }

        // --- Verifikasi form_register ada di database ---
        const { data: formExists, error: formErr } = await supabaseAdmin
            .from('form_register')
            .select('id')
            .eq('id', form_register_id)
            .single();

        if (formErr || !formExists) throw new Error('Form registrasi tidak ditemukan');

        let nominalKomisi = 0;

        const cleanedNamaNim = nama_nim && nama_nim.trim() !== '' ? nama_nim.trim() : null;

        if (cleanedNamaNim) {
            // Hitung jumlah entri yang sudah ada untuk identitas ini
            const { count, error: countError } = await supabaseAdmin
                .from('sales_pose')
                .select('*', { count: 'exact', head: true })
                .eq('nama_nim', cleanedNamaNim);

            if (countError) throw countError;
            const existingCount = count || 0;

            // Ambil pricing & persentase komisi dari tabel form_register_pricing
            const { data: pricing, error: pricingError } = await supabaseAdmin
                .from('form_register_pricing')
                .select('nominal, komisi_sales_lvl1, komisi_sales_lvl2, komisi_sales_lvl3')
                .eq('form_id', form_register_id)
                .eq('kategori', kategori || 'Umum')
                .single();

            if (pricingError) {
                console.error("Error finding pricing for commission calculation:", pricingError);
            } else if (pricing) {
                let persenKomisi = 0;

                if (existingCount < 3) {
                    persenKomisi = pricing.komisi_sales_lvl1 || 0;
                } else if (existingCount < 6) {
                    persenKomisi = pricing.komisi_sales_lvl2 || 0;
                } else {
                    persenKomisi = pricing.komisi_sales_lvl3 || 0;
                }

                const nominalForm = pricing.nominal || 0;
                nominalKomisi = Math.round(nominalForm * (persenKomisi / 100));
            }
        }

        // Build insert payload hanya dengan field yang diizinkan
        const insertPayload = {
            sumber,
            nama_nim: cleanedNamaNim,
            nominal: nominalKomisi,
            form_register_id,
            target_nim: target_nim && target_nim.trim() !== '' ? target_nim.trim() : null
        };

        const { data, error } = await supabaseAdmin
            .from('sales_pose')
            .insert([insertPayload])
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error("Internal Log - Error inserting sales pose:", error);
        return { success: false, error: 'Terjadi kesalahan internal saat memproses data referal.' };
    }
};
