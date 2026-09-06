'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { checkAdminAuth, insertAuditLog } from './audit';

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
            .select('id, nama, nim, prodi, angkatan, kelas, email_wa, status_pembayaran')
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
                angkatan: p.angkatan || '-',
                kelas: p.kelas || '-',
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

/**
 * Ambil data medis & kontak ortu/wali untuk daftar NIM tertentu (Batch).
 * @param {string[]} nims - Array of NIMs
 * @returns {Promise<Object>} Map { [nim]: { riwayat_penyakit, penanganan, alergi, nama_ortu_wali, no_wa_ortu_wali } }
 */
export const getDataMedisByNims = async (nims) => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!Array.isArray(nims) || nims.length === 0) return {};

        // 1. Ambil id peserta berdasarkan NIM
        const { data: pesertaList, error: pesertaError } = await supabaseAdmin
            .from('peserta')
            .select('id, nim')
            .in('nim', nims);

        if (pesertaError) throw pesertaError;
        if (!pesertaList || pesertaList.length === 0) return {};

        const pesertaIds = pesertaList.map(p => p.id);

        // 2. Ambil data medis
        const { data: medisList, error: medisError } = await supabaseAdmin
            .from('data_medis_pkkmb')
            .select('users, riwayat_penyakit, penanganan, alergi')
            .in('users', pesertaIds);

        if (medisError) throw medisError;

        // 3. Ambil data tambahan (kontak wali/ortu)
        const { data: tambahanList, error: tambahanError } = await supabaseAdmin
            .from('data_tambahan_pkkmb')
            .select('users, nama_ortu_wali, no_wa_ortu_wali')
            .in('users', pesertaIds);

        if (tambahanError) throw tambahanError;

        const medisMap = {};
        (medisList || []).forEach(m => {
            medisMap[m.users] = m;
        });

        const tambahanMap = {};
        (tambahanList || []).forEach(t => {
            tambahanMap[t.users] = t;
        });

        // Format return Map: { [nim]: data }
        const resultMap = {};
        pesertaList.forEach(p => {
            const m = medisMap[p.id] || {};
            const t = tambahanMap[p.id] || {};
            resultMap[p.nim] = {
                riwayat_penyakit: m.riwayat_penyakit || '-',
                penanganan: m.penanganan || '-',
                alergi: m.alergi || '-',
                nama_ortu_wali: t.nama_ortu_wali || '-',
                no_wa_ortu_wali: t.no_wa_ortu_wali || '-'
            };
        });

        return resultMap;
    } catch (error) {
        console.error('Internal Log - Error fetching data medis by NIMs:', error);
        return {};
    }
};

/**
 * Ambil semua data medis panitia PKKMB beserta nama panitia (join ke admins).
 */
export const getDataMedisPanitiaAll = async () => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        // Fetch data medis panitia
        const { data: medisPanitiaList, error: medisError } = await supabaseAdmin
            .from('data_medis_pkkmb_panitia')
            .select('*')
            .order('created_at', { ascending: false });

        if (medisError) throw medisError;
        if (!medisPanitiaList || medisPanitiaList.length === 0) return [];

        // Ambil semua admins untuk mapping
        const panitiaIds = [...new Set(medisPanitiaList.map(p => p.panitia_id).filter(Boolean))];
        let adminMap = {};
        if (panitiaIds.length > 0) {
            const { data: adminList, error: adminErr } = await supabaseAdmin
                .from('admins')
                .select('id, nama, wa, role')
                .eq('type', 'pkkmb')
                .in('id', panitiaIds);

            if (!adminErr && adminList) {
                adminList.forEach(a => {
                    adminMap[a.id] = a;
                });
            }
        }

        return medisPanitiaList.map(item => {
            const admin = adminMap[item.panitia_id] || {};
            return {
                id: item.id,
                panitia_id: item.panitia_id,
                nama: admin.nama || 'Tidak Diketahui',
                wa: admin.wa || '-',
                role: admin.role || '-',
                divisi: item.divisi || '-',
                riwayat_penyakit: item.riwayat_penyakit || '-',
                penanganan: item.penanganan || '-',
                alergi: item.alergi || '-',
                created_at: item.created_at
            };
        });
    } catch (error) {
        console.error('Internal Log - Error fetching all data medis panitia:', error);
        return [];
    }
};

/**
 * Insert data medis panitia baru (Hanya super_admin yang berwenang).
 */
export const insertDataMedisPanitia = async (payload) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!payload?.panitia_id) {
            return { success: false, error: 'Nama Panitia wajib dipilih.' };
        }

        const insertPayload = {
            panitia_id: payload.panitia_id,
            divisi: payload.divisi?.trim() || '-',
            riwayat_penyakit: payload.riwayat_penyakit?.trim() || '-',
            penanganan: payload.penanganan?.trim() || '-',
            alergi: payload.alergi?.trim() || '-'
        };

        const { data, error } = await supabaseAdmin
            .from('data_medis_pkkmb_panitia')
            .insert([insertPayload])
            .select()
            .single();

        if (error) throw error;

        // Audit Log
        if (user) {
            await insertAuditLog(
                user.email,
                'INSERT_MEDIS_PANITIA',
                data.id,
                `Menambahkan data medis panitia: ${payload.nama || payload.panitia_id}`,
                adminNama
            );
        }

        return { success: true, data };
    } catch (error) {
        console.error('Internal Log - Error inserting data medis panitia:', error);
        return { success: false, error: error.message || 'Gagal menyimpan data medis panitia' };
    }
};

/**
 * Update data medis panitia.
 */
export const updateDataMedisPanitia = async (id, payload) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id) {
            return { success: false, error: 'ID data medis panitia tidak valid.' };
        }

        const updatePayload = {
            divisi: payload.divisi?.trim() || '-',
            riwayat_penyakit: payload.riwayat_penyakit?.trim() || '-',
            penanganan: payload.penanganan?.trim() || '-',
            alergi: payload.alergi?.trim() || '-'
        };

        if (payload.panitia_id) {
            updatePayload.panitia_id = payload.panitia_id;
        }

        const { data, error } = await supabaseAdmin
            .from('data_medis_pkkmb_panitia')
            .update(updatePayload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (user) {
            await insertAuditLog(
                user.email,
                'UPDATE_MEDIS_PANITIA',
                id,
                `Mengupdate data medis panitia: ${id}`,
                adminNama
            );
        }

        return { success: true, data };
    } catch (error) {
        console.error('Internal Log - Error updating data medis panitia:', error);
        return { success: false, error: error.message || 'Gagal mengupdate data medis panitia' };
    }
};

/**
 * Delete data medis panitia.
 */
export const deleteDataMedisPanitia = async (id) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id) return { success: false, error: 'ID tidak valid' };

        const { error } = await supabaseAdmin
            .from('data_medis_pkkmb_panitia')
            .delete()
            .eq('id', id);

        if (error) throw error;

        if (user) {
            await insertAuditLog(
                user.email,
                'DELETE_MEDIS_PANITIA',
                id,
                `Menghapus data medis panitia ID: ${id}`,
                adminNama
            );
        }

        return { success: true };
    } catch (error) {
        console.error('Internal Log - Error deleting data medis panitia:', error);
        return { success: false, error: error.message || 'Gagal menghapus data' };
    }
};

/**
 * Ambil daftar admin aktif untuk dropdown form input medis panitia.
 */
export const getAdminsForMedisDropdown = async () => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        const { data, error } = await supabaseAdmin
            .from('admins')
            .select('id, nama, wa, role')
            .eq('type', 'pkkmb')
            .order('nama', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Internal Log - Error fetching admins for dropdown:', error);
        return [];
    }
};


