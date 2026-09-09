'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { checkAdminAuth, insertAuditLog } from './audit';

/**
 * Ambil data medis lengkap peserta (PKKMB / POSE Wajib).
 * Join: peserta + data_medis_pkkmb + data_tambahan_pkkmb
 * + LEFT JOIN kelompok_members ON kelompok_members.nim_anggota = peserta.nim
 * + LEFT JOIN kelompok ON kelompok.id = kelompok_members.kelompok_id
 * Kolom yang diambil hanya yang diperlukan.
 */
export const getDataMedisAll = async (site = 'pkkmb') => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        const targetSite = site === 'pose' ? 'pose' : 'pkkmb';

        // Ambil data dasar peserta Wajib yang sudah lunas berdasarkan site
        let query = supabaseAdmin
            .from('peserta')
            .select('id, nama, nim, prodi, kampus, angkatan, semester, email_wa, status_pembayaran, site_type')
            .eq('jenis_form', 'wajib')
            .eq('status_pembayaran', 'lunas')
            .order('created_at', { ascending: false });

        if (targetSite) {
            query = query.eq('site_type', targetSite);
        }

        const { data: pesertaList, error: pesertaError } = await query;

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

        // Ambil data tambahan
        const { data: tambahanList, error: tambahanError } = await supabaseAdmin
            .from('data_tambahan_pkkmb')
            .select('users, nama_ortu_wali, no_wa_ortu_wali')
            .in('users', pesertaIds);

        if (tambahanError) throw tambahanError;

        // Ambil data kelompok & members untuk pencarian relasi nama kelompok/kabim (jika PKKMB)
        let kelompokMembersMap = {};
        if (targetSite === 'pkkmb' && pesertaNims.length > 0) {
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
                nim: p.nim || '-',
                prodi: p.prodi || '-',
                kampus: p.kampus || '-',
                angkatan: p.angkatan || '-',
                semester: p.semester || '-',
                email_wa: p.email_wa,
                status_pembayaran: p.status_pembayaran,
                riwayat_penyakit: m.riwayat_penyakit || '-',
                penanganan: m.penanganan || '-',
                alergi: m.alergi || '-',
                nama_ortu_wali: t.nama_ortu_wali || '-',
                no_wa_ortu_wali: t.no_wa_ortu_wali || '-',
                nama_kelompok: targetSite === 'pose' ? (p.kampus || 'Peserta POSE') : (k.nama_kelompok || '-'),
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
 * Ambil semua data medis panitia beserta nama panitia dari tabel data_medis_panitia.
 */
export const getDataMedisPanitiaAll = async (site = null) => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        // Fetch data medis panitia dari data_medis_panitia
        const { data: medisPanitiaList, error: medisError } = await supabaseAdmin
            .from('data_medis_panitia')
            .select('id, panitia_id, divisi, riwayat_penyakit, penanganan, alergi, created_at')
            .order('created_at', { ascending: false });

        if (medisError) throw medisError;
        if (!medisPanitiaList || medisPanitiaList.length === 0) return [];

        // Ambil semua admins untuk mapping
        const panitiaIds = [...new Set(medisPanitiaList.map(p => p.panitia_id).filter(Boolean))];
        let adminMap = {};
        if (panitiaIds.length > 0) {
            let adminQuery = supabaseAdmin
                .from('admins')
                .select('id, nama, email, role, type')
                .in('id', panitiaIds);

            if (site && site !== 'all') {
                if (site === 'pose') {
                    adminQuery = adminQuery.or('type.eq.pose,role.ilike.%pose%');
                } else if (site === 'pkkmb') {
                    adminQuery = adminQuery.or('type.eq.pkkmb,role.ilike.%pkkmb%');
                }
            }

            const { data: adminList, error: adminErr } = await adminQuery;

            if (!adminErr && adminList) {
                adminList.forEach(a => {
                    adminMap[a.id] = a;
                });
            }
        }

        // Filter hasil jika site aktif (hanya tampilkan panitia yang match site filter)
        const results = [];
        for (const item of medisPanitiaList) {
            const admin = adminMap[item.panitia_id];
            if (site && site !== 'all' && !admin) {
                continue; // Skip jika tidak sesuai filter site
            }
            results.push({
                id: item.id,
                panitia_id: item.panitia_id,
                nama: admin?.nama || 'Tidak Diketahui',
                wa: admin?.email || '-',
                role: admin?.role || '-',
                type: admin?.type || '-',
                divisi: item.divisi || '-',
                riwayat_penyakit: item.riwayat_penyakit || '-',
                penanganan: item.penanganan || '-',
                alergi: item.alergi || '-',
                created_at: item.created_at
            });
        }

        return results;
    } catch (error) {
        console.error('Internal Log - Error fetching all data medis panitia:', error);
        return [];
    }
};

/**
 * Insert data medis panitia baru ke data_medis_panitia.
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
            .from('data_medis_panitia')
            .insert([insertPayload])
            .select('id, panitia_id, divisi, riwayat_penyakit, penanganan, alergi, created_at')
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
 * Update data medis panitia di data_medis_panitia.
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
            .from('data_medis_panitia')
            .update(updatePayload)
            .eq('id', id)
            .select('id, panitia_id, divisi, riwayat_penyakit, penanganan, alergi, created_at')
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
 * Delete data medis panitia dari data_medis_panitia.
 */
export const deleteDataMedisPanitia = async (id) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id) return { success: false, error: 'ID tidak valid' };

        const { error } = await supabaseAdmin
            .from('data_medis_panitia')
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
export const getAdminsForMedisDropdown = async (site = null) => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        let query = supabaseAdmin
            .from('admins')
            .select('id, nama, email, role, type')
            .order('nama', { ascending: true });

        if (site && site !== 'all') {
            if (site === 'pose') {
                query = query.or('type.eq.pose,role.ilike.%pose%');
            } else if (site === 'pkkmb') {
                query = query.or('type.eq.pkkmb,role.ilike.%pkkmb%');
            }
        }

        const { data, error } = await query;

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Internal Log - Error fetching admins for dropdown:', error);
        return [];
    }
};
