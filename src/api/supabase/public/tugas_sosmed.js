'use server';

import { supabaseAdmin } from '@/lib/supabase';

/**
 * Validasi peserta PKKMB berdasarkan NIM
 */
export const checkPesertaPkkmbByNim = async (nim) => {
    try {
        if (!nim || !nim.trim()) {
            return { success: false, error: 'NIM wajib diisi.' };
        }

        const cleanNim = nim.trim();

        // Cari di kelompok_members beserta data kelompoknya
        const { data: member, error: memErr } = await supabaseAdmin
            .from('kelompok_members')
            .select(`
                id,
                nama_anggota,
                nim_anggota,
                kelompok_id,
                kelompok (
                    id,
                    urutan,
                    nama_kelompok,
                    nama_kabim,
                    jenis_kelompok
                )
            `)
            .ilike('nim_anggota', cleanNim)
            .maybeSingle();

        if (memErr) throw memErr;

        if (!member) {
            return {
                success: false,
                error: `NIM "${cleanNim}" tidak ditemukan dalam data peserta kelompok PKKMB 2026.`
            };
        }

        return {
            success: true,
            data: {
                member_id: member.id,
                nama: member.nama_anggota,
                nim: member.nim_anggota,
                kelompok_id: member.kelompok_id,
                kelompok_nama: member.kelompok?.nama_kelompok || `Kelompok #${member.kelompok?.urutan}`,
                kelompok_urutan: member.kelompok?.urutan,
                nama_kabim: member.kelompok?.nama_kabim,
                jenis_kelompok: member.kelompok?.jenis_kelompok || 'reguler'
            }
        };
    } catch (error) {
        console.error('Error in checkPesertaPkkmbByNim:', error);
        return { success: false, error: error.message || 'Gagal memverifikasi identitas peserta.' };
    }
};

/**
 * Mengambil riwayat submission tugas sosmed milik peserta / kelompoknya
 */
export const getRiwayatTugasSosmedPublic = async (nim) => {
    try {
        const verify = await checkPesertaPkkmbByNim(nim);
        if (!verify.success) return verify;

        const { member_id, kelompok_id } = verify.data;

        // Ambil submission kelompok dan individu
        const { data: sosmedList, error } = await supabaseAdmin
            .from('tugas_sosmed_pkkmb')
            .select('id, tipe_tugas, label_hari, platform, link_konten, keterangan, nilai, created_at')
            .or(`kelompok_id.eq.${kelompok_id},kelompok_members_id.eq.${member_id}`)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return {
            success: true,
            peserta: verify.data,
            data: sosmedList || []
        };
    } catch (error) {
        console.error('Error in getRiwayatTugasSosmedPublic:', error);
        return { success: false, error: error.message || 'Gagal memuat riwayat submission.' };
    }
};

/**
 * Submit tugas sosial media PKKMB (Kelompok atau Individu)
 */
export const submitTugasSosmedPublic = async ({
    nim,
    tipe_tugas = 'kelompok', // 'kelompok' | 'individu'
    platform,
    link_konten,
    label_hari = 'Hari 1',
    keterangan = ''
}) => {
    try {
        if (!nim) throw new Error('NIM peserta wajib diisi.');
        if (!platform) throw new Error('Platform (TikTok / Instagram / YouTube) wajib dipilih.');
        if (!link_konten || !link_konten.trim()) throw new Error('Link URL konten wajib diisi.');

        const cleanLink = link_konten.trim();
        if (!cleanLink.startsWith('http://') && !cleanLink.startsWith('https://')) {
            throw new Error('Link harus berupa URL valid yang diawali https:// atau http://');
        }

        // 1. Verifikasi NIM peserta
        const verify = await checkPesertaPkkmbByNim(nim);
        if (!verify.success) throw new Error(verify.error);

        const { member_id, kelompok_id, nama } = verify.data;

        // 2. Payload
        const payload = {
            tipe_tugas,
            platform,
            link_konten: cleanLink,
            label_hari: label_hari || null,
            keterangan: keterangan ? keterangan.trim() : null,
            created_by: `${nama} (${nim})`,
            updated_at: new Date().toISOString()
        };

        if (tipe_tugas === 'kelompok') {
            payload.kelompok_id = kelompok_id;
            payload.kelompok_members_id = null;
        } else {
            payload.kelompok_id = kelompok_id; // Simpan juga referensi kelompok
            payload.kelompok_members_id = member_id;
        }

        const { data, error } = await supabaseAdmin
            .from('tugas_sosmed_pkkmb')
            .insert([payload])
            .select()
            .single();

        if (error) throw error;

        return {
            success: true,
            message: `Tugas sosial media (${tipe_tugas === 'kelompok' ? 'Kelompok' : 'Individu'}) berhasil dikirim!`,
            data
        };
    } catch (error) {
        console.error('Error in submitTugasSosmedPublic:', error);
        return { success: false, error: error.message || 'Gagal mengirimkan tugas sosial media.' };
    }
};
