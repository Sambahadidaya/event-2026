'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { checkAdminAuth } from './audit';

/**
 * Ambil data medis lengkap peserta PKKMB (Wajib).
 * Join: peserta + data_medis_pkkmb + data_tambahan_pkkmb
 * + LEFT JOIN kelompok_members ON kelompok_members.nim_anggota = peserta.nim
 * + LEFT JOIN kelompok ON kelompok.id = kelompok_members.kelompok_id
 * Kolom yang diambil hanya yang diperlukan.
 */
export const getDataMedisAll = async () => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        // Ambal data dasar peserta PKKMB Wajib yang sudah lunas
        const { data: pesertaList, error: pesertaError } = await supabaseAdmin
            .from('peserta')
            .select('id, nama, nim, prodi, email_wa, status_pembayaran')
            .eq('site_type', 'pkkmb')
            .eq('jenis_form', 'wajib')
            .eq('status_pembayaran', 'lunas')
            .order('created_at', { ascending: false });

        if (pesertaError) throw pesertaError;
        if (!pesertaList || pesertaList.length === 0) return [];

        const pesertaIds = pesertaList.map(p => p.id);
        const pesertaNims = pesertaList.map(p => p.nim).filter(Boolean);

        // Ambil data medis pkkmb
        const { data: medisList, error: medisError } = await supabaseAdmin
            .from('data_medis_pkkmb')
            .select('users, riwayat_penyakit, penanganan, alergi')
            .in('users', pesertaIds);

        if (medisError) throw medisError;

        // Ambil data tambahan pkkmb
        const { data: tambahanList, error: tambahanError } = await supabaseAdmin
            .from('data_tambahan_pkkmb')
            .select('users, nama_ortu_wali, no_wa_ortu_wali')
            .in('users', pesertaIds);

        if (tambahanError) throw tambahanError;

        // Ambil data kelompok & members untuk pencarian relasi nama kelompok/kabim
        let kelompokMembersMap = {};
        if (pesertaNims.length > 0) {
            const { data: membersList, error: membersError } = await supabaseAdmin
                .from('kelompok_members')
                .select('nim_anggota, kelompok:kelompok_id(nama_kelompok, nama_kabim)')
                .in('nim_anggota', pesertaNims);

            if (membersError) throw membersError;

            if (membersList) {
                membersList.forEach(m => {
                    if (m.nim_anggota && m.kelompok) {
                        kelompokMembersMap[m.nim_anggota.toLowerCase()] = {
                            nama_kelompok: m.kelompok.nama_kelompok,
                            nama_kabim: m.kelompok.nama_kabim
                        };
                    }
                });
            }
        }

        // Mapping array ke data detail
        const medisMap = {};
        (medisList || []).forEach(m => {
            medisMap[m.users] = m;
        });

        const tambahanMap = {};
        (tambahanList || []).forEach(t => {
            tambahanMap[t.users] = t;
        });

        const mergedData = pesertaList.map(p => {
            const m = medisMap[p.id] || {};
            const t = tambahanMap[p.id] || {};
            const k = p.nim ? (kelompokMembersMap[p.nim.toLowerCase()] || {}) : {};

            return {
                id: p.id,
                nama: p.nama,
                nim: p.nim,
                prodi: p.prodi,
                email_wa: p.email_wa,
                status_pembayaran: p.status_pembayaran,
                riwayat_penyakit: m.riwayat_penyakit || '-',
                penanganan: m.penanganan || '-',
                alergi: m.alergi || '-',
                nama_ortu_wali: t.nama_ortu_wali || '-',
                no_wa_ortu_wali: t.no_wa_ortu_wali || '-',
                nama_kelompok: k.nama_kelompok || '-',
                nama_kabim: k.nama_kabim || '-'
            };
        });

        return mergedData;
    } catch (error) {
        console.error('Internal Log - Error fetching all data medis:', error);
        return [];
    }
};

/**
 * Ambil detail data medis spesifik untuk satu peserta ID.
 */
export const getDataMedisByPesertaId = async (pesertaId) => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        const { data: medisData, error: medisError } = await supabaseAdmin
            .from('data_medis_pkkmb')
            .select('riwayat_penyakit, penanganan, alergi')
            .eq('users', pesertaId)
            .maybeSingle();

        if (medisError) throw medisError;

        const { data: tambahanData, error: tambahanError } = await supabaseAdmin
            .from('data_tambahan_pkkmb')
            .select('nama_ortu_wali, no_wa_ortu_wali')
            .eq('users', pesertaId)
            .maybeSingle();

        if (tambahanError) throw tambahanError;

        return {
            riwayat_penyakit: medisData?.riwayat_penyakit || '-',
            penanganan: medisData?.penanganan || '-',
            alergi: medisData?.alergi || '-',
            nama_ortu_wali: tambahanData?.nama_ortu_wali || '-',
            no_wa_ortu_wali: tambahanData?.no_wa_ortu_wali || '-'
        };
    } catch (error) {
        console.error('Internal Log - Error fetching data medis by id:', error);
        return null;
    }
};
