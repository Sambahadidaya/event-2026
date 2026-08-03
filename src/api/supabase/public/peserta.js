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
            'prodi', 'angkatan', 'semester', 'kode_form', 'kelas'
        ];

        const sanitizedPayload = {};
        for (const key of allowedKeys) {
            if (payload[key] !== undefined) {
                sanitizedPayload[key] = payload[key];
            }
        }

        // Force status_pembayaran to default (pending) or exclude it
        // Do not allow client to set status_pembayaran to 'lunas' unless verified against wajib form in database
        let finalStatus = 'pending';
        if (payload.status_pembayaran && payload.status_pembayaran.toLowerCase() === 'lunas') {
            if (payload.kategori === 'Mahasiswa LP3I' && payload.jenis_form === 'register') {
                const { data: wajibPeserta, error: checkError } = await supabaseAdmin
                    .from('peserta')
                    .select('status_pembayaran')
                    .eq('site_type', payload.site_type || 'pose')
                    .eq('jenis_form', 'wajib')
                    .eq('nim', payload.nim)
                    .eq('kampus', payload.kampus)
                    .single();

                if (!checkError && wajibPeserta && wajibPeserta.status_pembayaran?.toLowerCase() === 'lunas') {
                    finalStatus = wajibPeserta.status_pembayaran;
                }
            }
        }
        sanitizedPayload.status_pembayaran = finalStatus;

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
            'prodi', 'angkatan', 'semester', 'kode_form', 'kelas'
        ];

        const sanitizedArray = [];

        for (const payload of pesertaArray) {
            const sanitizedPayload = {};
            for (const key of allowedKeys) {
                if (payload[key] !== undefined) {
                    sanitizedPayload[key] = payload[key];
                }
            }

            let finalStatus = 'pending';
            if (payload.status_pembayaran && payload.status_pembayaran.toLowerCase() === 'lunas') {
                if (payload.kategori === 'Mahasiswa LP3I' && payload.jenis_form === 'register') {
                    const { data: wajibPeserta, error: checkError } = await supabaseAdmin
                        .from('peserta')
                        .select('status_pembayaran')
                        .eq('site_type', payload.site_type || 'pose')
                        .eq('jenis_form', 'wajib')
                        .eq('nim', payload.nim)
                        .eq('kampus', payload.kampus)
                        .single();

                    if (!checkError && wajibPeserta && wajibPeserta.status_pembayaran?.toLowerCase() === 'lunas') {
                        finalStatus = wajibPeserta.status_pembayaran;
                    }
                }
            }
            sanitizedPayload.status_pembayaran = finalStatus;

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

export const getMetodePembayaran = async (site) => {
    try {
        let query = supabaseAdmin
            .from('metode_pembayaran')
            .select(`
                id, site, nama, nomor_rekening, nama_pemilik, qris_image, keterangan, urutan
            `)
            .eq('aktif', true)
            .order('urutan', { ascending: true });

        if (site) {
            query = query.eq('site', site);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Internal Log - Error fetching public metode pembayaran:", error);
        return [];
    }
};

export const getFormRegisterPricing = async (formId) => {
    try {
        if (!formId) return [];

        const { data, error } = await supabaseAdmin
            .from('form_register_pricing')
            .select('kategori, nominal, maks_anggota, maks_team, individu')
            .eq('form_id', formId);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Internal Log - Error fetching public form register pricing:", error);
        return [];
    }
};

export const getTeamCountsByForm = async (baseKodeForm) => {
    try {
        if (!baseKodeForm) return {};
        
        // 1. Dapatkan semua peserta yang mendaftar form ini
        const { data: pesertaData, error: pesertaError } = await supabaseAdmin
            .from('peserta')
            .select('kategori, kode_form')
            .eq('jenis_form', 'register')
            .like('kode_form', `${baseKodeForm}%`);

        if (pesertaError) throw pesertaError;

        // 2. Kumpulkan kode_form unik dan petakan ke kategori
        const categoryKodes = {};
        const allKodeForms = new Set();
        
        (pesertaData || []).forEach(p => {
            const kat = p.kategori;
            const kode = p.kode_form;
            if (kat && kode) {
                if (!categoryKodes[kat]) {
                    categoryKodes[kat] = new Set();
                }
                categoryKodes[kat].add(kode);
                allKodeForms.add(kode);
            }
        });

        // Jika tidak ada data peserta, kembalikan kosong
        if (allKodeForms.size === 0) return {};

        // 3. Cek status verivikasi dari tabel team untuk kode_form yang ditemukan
        const kodeFormArray = Array.from(allKodeForms);
        const { data: teamData, error: teamError } = await supabaseAdmin
            .from('team')
            .select('kode_form, verivikasi')
            .in('kode_form', kodeFormArray);
            
        if (teamError) throw teamError;

        // 4. Buat set kode_form yang ditolak (verivikasi === false)
        const rejectedKodeForms = new Set();
        (teamData || []).forEach(t => {
            // Hanya abaikan jika secara eksplisit false (ditolak). Jika null atau true, tetap dihitung.
            if (t.verivikasi === false) {
                rejectedKodeForms.add(t.kode_form);
            }
        });

        // 5. Hitung jumlah tim per kategori, abaikan yang rejected
        const counts = {};
        for (const [kat, set] of Object.entries(categoryKodes)) {
            let validCount = 0;
            for (const kode of set) {
                if (!rejectedKodeForms.has(kode)) {
                    validCount++;
                }
            }
            counts[kat] = validCount;
        }

        return counts;
    } catch (error) {
        console.error("Internal Log - Error counting teams:", error);
        return {};
    }
};
