'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { checkAdminAuth, insertAuditLog } from './audit';

// ============================================================
// MASTER OBAT
// ============================================================

/**
 * Mengambil semua master obat berdasarkan site (optional filter)
 */
export const getMasterObat = async (site = null) => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        let query = supabaseAdmin
            .from('master_obat')
            .select('id, nama_obat, stok_obat, sisa_obat, is_non_depleting, site, created_at')
            .order('created_at', { ascending: false });

        if (site && site !== 'all') {
            query = query.eq('site', site);
        }

        const { data, error } = await query;
        if (error) throw error;
        return { success: true, data: data || [] };
    } catch (error) {
        console.error('Error in getMasterObat:', error);
        return { success: false, error: error.message || 'Gagal mengambil data master obat.' };
    }
};

/**
 * Menambahkan master obat baru
 */
export const createMasterObat = async ({
    nama_obat,
    stok_obat,
    sisa_obat,
    is_non_depleting = false,
    site = 'pkkmb'
}) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        const nama = (nama_obat || '').trim();
        const stok = parseInt(stok_obat, 10);
        const sisa = sisa_obat !== undefined && sisa_obat !== '' && sisa_obat !== null 
            ? parseInt(sisa_obat, 10) 
            : stok;
        const nonDepleting = Boolean(is_non_depleting);
        const targetSite = site === 'pose' ? 'pose' : 'pkkmb';

        if (!nama) throw new Error('Nama obat wajib diisi');
        if (isNaN(stok) || stok < 0) throw new Error('Stok obat harus berupa angka valid >= 0');
        if (isNaN(sisa) || sisa < 0) throw new Error('Sisa obat harus berupa angka valid >= 0');
        if (sisa > stok) throw new Error('Sisa obat tidak boleh melebihi stok obat');

        const { data, error } = await supabaseAdmin
            .from('master_obat')
            .insert([{
                nama_obat: nama,
                stok_obat: stok,
                sisa_obat: sisa,
                is_non_depleting: nonDepleting,
                site: targetSite
            }])
            .select('id, nama_obat, stok_obat, sisa_obat, is_non_depleting, site, created_at')
            .single();

        if (error) throw error;

        await insertAuditLog(
            user.email,
            'CREATE_MASTER_OBAT',
            data.id,
            `Master obat "${nama}" (Site: ${targetSite}, Stok: ${stok}, Sisa: ${sisa}, Non-Depleting: ${nonDepleting}) ditambahkan`,
            adminNama
        );

        return { success: true, data };
    } catch (error) {
        console.error('Error in createMasterObat:', error);
        return { success: false, error: error.message || 'Gagal menambahkan master obat.' };
    }
};

/**
 * Mengupdate master obat
 */
export const updateMasterObat = async (id, {
    nama_obat,
    stok_obat,
    sisa_obat,
    is_non_depleting = false,
    site
}) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id) throw new Error('ID master obat wajib disediakan');

        const nama = (nama_obat || '').trim();
        const stok = parseInt(stok_obat, 10);
        const sisa = parseInt(sisa_obat, 10);
        const nonDepleting = Boolean(is_non_depleting);

        if (!nama) throw new Error('Nama obat wajib diisi');
        if (isNaN(stok) || stok < 0) throw new Error('Stok obat harus berupa angka valid >= 0');
        if (isNaN(sisa) || sisa < 0) throw new Error('Sisa obat harus berupa angka valid >= 0');
        if (sisa > stok) throw new Error('Sisa obat tidak boleh melebihi stok obat');

        const updatePayload = {
            nama_obat: nama,
            stok_obat: stok,
            sisa_obat: sisa,
            is_non_depleting: nonDepleting
        };
        if (site) {
            updatePayload.site = site === 'pose' ? 'pose' : 'pkkmb';
        }

        const { data, error } = await supabaseAdmin
            .from('master_obat')
            .update(updatePayload)
            .eq('id', id)
            .select('id, nama_obat, stok_obat, sisa_obat, is_non_depleting, site, created_at')
            .single();

        if (error) throw error;

        await insertAuditLog(
            user.email,
            'UPDATE_MASTER_OBAT',
            id,
            `Master obat diupdate menjadi "${nama}" (Stok: ${stok}, Sisa: ${sisa}, Non-Depleting: ${nonDepleting})`,
            adminNama
        );

        return { success: true, data };
    } catch (error) {
        console.error('Error in updateMasterObat:', error);
        return { success: false, error: error.message || 'Gagal memperbarui master obat.' };
    }
};

/**
 * Menghapus master obat
 */
export const deleteMasterObat = async (id) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id) throw new Error('ID master obat wajib disediakan');

        const { error } = await supabaseAdmin
            .from('master_obat')
            .delete()
            .eq('id', id);

        if (error) throw error;

        await insertAuditLog(
            user.email,
            'DELETE_MASTER_OBAT',
            id,
            `Master obat dihapus`,
            adminNama
        );

        return { success: true };
    } catch (error) {
        console.error('Error in deleteMasterObat:', error);
        return { success: false, error: error.message || 'Gagal menghapus master obat.' };
    }
};

// ============================================================
// LOG OBAT (PEMAKAIAN OBAT)
// ============================================================

/**
 * Mengambil semua riwayat pemakaian obat (dengan filter site optional)
 */
export const getLogObat = async (site = null) => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        let query = supabaseAdmin
            .from('pemakaian_obat')
            .select(`
                id,
                obat_id,
                pemakaian_obat,
                site,
                created_at,
                master_obat:obat_id (
                    id,
                    nama_obat,
                    stok_obat,
                    sisa_obat,
                    is_non_depleting,
                    site
                )
            `)
            .order('created_at', { ascending: false });

        if (site && site !== 'all') {
            query = query.eq('site', site);
        }

        const { data, error } = await query;
        if (error) throw error;
        return { success: true, data: data || [] };
    } catch (error) {
        console.error('Error in getLogObat:', error);
        return { success: false, error: error.message || 'Gagal mengambil log pemakaian obat.' };
    }
};

/**
 * Menambahkan catatan pemakaian obat baru
 * Mengurangi sisa_obat di master_obat hanya jika is_non_depleting = false
 */
export const createLogObat = async ({ obat_id, pemakaian_obat, site = 'pkkmb' }) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!obat_id) throw new Error('Obat wajib dipilih');
        const pemakaian = parseInt(pemakaian_obat, 10);
        if (isNaN(pemakaian) || pemakaian <= 0) {
            throw new Error('Jumlah pemakaian obat harus berupa angka lebih dari 0');
        }

        // Cek master_obat & sisa saat ini
        const { data: obat, error: obatErr } = await supabaseAdmin
            .from('master_obat')
            .select('id, nama_obat, stok_obat, sisa_obat, is_non_depleting, site')
            .eq('id', obat_id)
            .single();

        if (obatErr || !obat) {
            throw new Error('Obat tidak ditemukan di database');
        }

        const isNonDepleting = Boolean(obat.is_non_depleting);
        const sisaSaatIni = obat.sisa_obat !== null ? obat.sisa_obat : obat.stok_obat;
        const targetSite = site || obat.site || 'pkkmb';

        // Hanya kurangi stok jika obat bukan non-depleting
        let sisaBaru = sisaSaatIni;
        if (!isNonDepleting) {
            if (pemakaian > sisaSaatIni) {
                throw new Error(`Sisa obat "${obat.nama_obat}" tidak mencukupi (Sisa tersedia: ${sisaSaatIni})`);
            }
            sisaBaru = sisaSaatIni - pemakaian;

            const { error: updateObatErr } = await supabaseAdmin
                .from('master_obat')
                .update({ sisa_obat: sisaBaru })
                .eq('id', obat_id);

            if (updateObatErr) throw updateObatErr;
        }

        // Insert log ke pemakaian_obat
        const { data, error } = await supabaseAdmin
            .from('pemakaian_obat')
            .insert([{
                obat_id,
                pemakaian_obat: pemakaian,
                site: targetSite
            }])
            .select(`
                id,
                obat_id,
                pemakaian_obat,
                site,
                created_at,
                master_obat:obat_id (
                    id,
                    nama_obat,
                    stok_obat,
                    sisa_obat,
                    is_non_depleting,
                    site
                )
            `)
            .single();

        if (error) {
            // Rollback sisa obat jika insert gagal dan stok sempat dikurangi
            if (!isNonDepleting) {
                await supabaseAdmin
                    .from('master_obat')
                    .update({ sisa_obat: sisaSaatIni })
                    .eq('id', obat_id);
            }
            throw error;
        }

        await insertAuditLog(
            user.email,
            'CREATE_LOG_OBAT',
            data.id,
            `Pemakaian obat "${obat.nama_obat}" sebanyak ${pemakaian} (Site: ${targetSite}) dicatat.${isNonDepleting ? ' (Non-depleting)' : ` Sisa obat kini: ${sisaBaru}`}`,
            adminNama
        );

        return { success: true, data };
    } catch (error) {
        console.error('Error in createLogObat:', error);
        return { success: false, error: error.message || 'Gagal mencatat pemakaian obat.' };
    }
};

/**
 * Mengupdate log pemakaian obat
 * Menghitung selisih dan menyesuaikan sisa_obat di master_obat jika bukan non-depleting
 */
export const updateLogObat = async (id, { obat_id, pemakaian_obat }) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id) throw new Error('ID log pemakaian obat wajib disediakan');
        const pemakaianBaru = parseInt(pemakaian_obat, 10);
        if (isNaN(pemakaianBaru) || pemakaianBaru <= 0) {
            throw new Error('Jumlah pemakaian obat harus lebih dari 0');
        }

        // Ambil log pemakaian saat ini
        const { data: logLama, error: logLamaErr } = await supabaseAdmin
            .from('pemakaian_obat')
            .select('id, obat_id, pemakaian_obat, site')
            .eq('id', id)
            .single();

        if (logLamaErr || !logLama) throw new Error('Data log pemakaian tidak ditemukan');

        const obatIdLama = logLama.obat_id;
        const pemakaianLama = logLama.pemakaian_obat || 0;
        const targetObatId = obat_id || obatIdLama;

        // Ambil info target obat
        const { data: obatTarget, error: targetErr } = await supabaseAdmin
            .from('master_obat')
            .select('id, nama_obat, stok_obat, sisa_obat, is_non_depleting, site')
            .eq('id', targetObatId)
            .single();

        if (targetErr || !obatTarget) throw new Error('Data obat tidak ditemukan');

        if (targetObatId === obatIdLama) {
            // Obat yang sama
            if (!obatTarget.is_non_depleting) {
                const selisih = pemakaianBaru - pemakaianLama;
                const sisaTersedia = obatTarget.sisa_obat !== null ? obatTarget.sisa_obat : obatTarget.stok_obat;
                if (selisih > 0 && selisih > sisaTersedia) {
                    throw new Error(`Sisa obat tidak mencukupi untuk penambahan pemakaian (Sisa tersedia: ${sisaTersedia})`);
                }

                const sisaBaru = sisaTersedia - selisih;
                await supabaseAdmin
                    .from('master_obat')
                    .update({ sisa_obat: sisaBaru })
                    .eq('id', targetObatId);
            }
        } else {
            // Berubah jenis obat: kembalikan stok lama jika bukan non-depleting
            const { data: obatLama } = await supabaseAdmin
                .from('master_obat')
                .select('id, stok_obat, sisa_obat, is_non_depleting')
                .eq('id', obatIdLama)
                .single();

            if (obatLama && !obatLama.is_non_depleting) {
                const sisaLama = Math.min(obatLama.stok_obat, (obatLama.sisa_obat || 0) + pemakaianLama);
                await supabaseAdmin
                    .from('master_obat')
                    .update({ sisa_obat: sisaLama })
                    .eq('id', obatIdLama);
            }

            // Kurangi stok baru jika bukan non-depleting
            if (!obatTarget.is_non_depleting) {
                if (pemakaianBaru > obatTarget.sisa_obat) {
                    throw new Error(`Sisa obat "${obatTarget.nama_obat}" tidak mencukupi (Sisa: ${obatTarget.sisa_obat})`);
                }
                await supabaseAdmin
                    .from('master_obat')
                    .update({ sisa_obat: obatTarget.sisa_obat - pemakaianBaru })
                    .eq('id', targetObatId);
            }
        }

        // Update pemakaian_obat
        const { data, error } = await supabaseAdmin
            .from('pemakaian_obat')
            .update({ obat_id: targetObatId, pemakaian_obat: pemakaianBaru })
            .eq('id', id)
            .select(`
                id,
                obat_id,
                pemakaian_obat,
                site,
                created_at,
                master_obat:obat_id (
                    id,
                    nama_obat,
                    stok_obat,
                    sisa_obat,
                    is_non_depleting,
                    site
                )
            `)
            .single();

        if (error) throw error;

        await insertAuditLog(
            user.email,
            'UPDATE_LOG_OBAT',
            id,
            `Log pemakaian obat diupdate menjadi ${pemakaianBaru}`,
            adminNama
        );

        return { success: true, data };
    } catch (error) {
        console.error('Error in updateLogObat:', error);
        return { success: false, error: error.message || 'Gagal memperbarui log pemakaian obat.' };
    }
};

/**
 * Menghapus log pemakaian obat
 * Mengembalikan sisa_obat di master_obat jika bukan non-depleting
 */
export const deleteLogObat = async (id) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id) throw new Error('ID log pemakaian obat wajib disediakan');

        // Ambil data pemakaian sebelum dihapus untuk rollback stok
        const { data: log, error: fetchErr } = await supabaseAdmin
            .from('pemakaian_obat')
            .select('id, obat_id, pemakaian_obat')
            .eq('id', id)
            .single();

        if (!fetchErr && log && log.obat_id) {
            const { data: obat } = await supabaseAdmin
                .from('master_obat')
                .select('id, stok_obat, sisa_obat, is_non_depleting')
                .eq('id', log.obat_id)
                .single();

            if (obat && !obat.is_non_depleting) {
                const sisaBaru = Math.min(obat.stok_obat, (obat.sisa_obat || 0) + (log.pemakaian_obat || 0));
                await supabaseAdmin
                    .from('master_obat')
                    .update({ sisa_obat: sisaBaru })
                    .eq('id', log.obat_id);
            }
        }

        const { error } = await supabaseAdmin
            .from('pemakaian_obat')
            .delete()
            .eq('id', id);

        if (error) throw error;

        await insertAuditLog(
            user.email,
            'DELETE_LOG_OBAT',
            id,
            `Log pemakaian obat dihapus`,
            adminNama
        );

        return { success: true };
    } catch (error) {
        console.error('Error in deleteLogObat:', error);
        return { success: false, error: error.message || 'Gagal menghapus log pemakaian obat.' };
    }
};

// ============================================================
// RIWAYAT PENANGANAN MEDIS (MULTI-OBAT)
// ============================================================

/**
 * Mengambil semua data riwayat penanganan medis beserta detail multi-obat
 */
export const getRiwayatPenangananMedis = async (site = null) => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        let query = supabaseAdmin
            .from('riwayat_penanganan_medis')
            .select(`
                id,
                peserta_id,
                panitia_id,
                pemakaian_obat_id,
                keterangan,
                site,
                created_at,
                peserta:kelompok_members (
                    id,
                    nama_anggota,
                    nim_anggota,
                    kelompok_id,
                    kelompok:kelompok (
                        id,
                        urutan,
                        nama_kelompok,
                        nama_kabim
                    )
                ),
                panitia:admins (
                    id,
                    nama,
                    email,
                    role,
                    type
                ),
                riwayat_penanganan_obat (
                    id,
                    obat_id,
                    jumlah,
                    site,
                    created_at,
                    master_obat:obat_id (
                        id,
                        nama_obat,
                        stok_obat,
                        sisa_obat,
                        is_non_depleting
                    )
                ),
                pemakaian_obat:pemakaian_obat (
                    id,
                    pemakaian_obat,
                    created_at,
                    master_obat:obat_id (
                        id,
                        nama_obat,
                        stok_obat,
                        sisa_obat,
                        is_non_depleting
                    )
                )
            `)
            .order('created_at', { ascending: false });

        if (site && site !== 'all') {
            query = query.eq('site', site);
        }

        const { data, error } = await query;
        if (error) throw error;
        return { success: true, data: data || [] };
    } catch (error) {
        console.error('Error in getRiwayatPenangananMedis:', error);
        return { success: false, error: error.message || 'Gagal mengambil riwayat penanganan medis.' };
    }
};

/**
 * Menambahkan riwayat penanganan medis baru (Mendukung Multi-Obat)
 * @param {Object} payload
 * - target_type: 'peserta' | 'panitia'
 * - target_id: UUID target
 * - keterangan: string
 * - site: 'pkkmb' | 'pose'
 * - obat_list: Array of { obat_id: UUID, jumlah: number }
 */
export const createRiwayatPenangananMedis = async ({
    target_type = 'peserta',
    target_id,
    keterangan = '',
    site = 'pkkmb',
    obat_list = []
}) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!target_id) {
            throw new Error(`Pilih ${target_type === 'peserta' ? 'Peserta' : 'Panitia'} yang ditangani.`);
        }

        const ket = (keterangan || '').trim();
        if (!ket) {
            throw new Error('Keterangan penanganan medis wajib diisi.');
        }

        const targetSite = site === 'pose' ? 'pose' : 'pkkmb';

        // 1. Insert ke riwayat_penanganan_medis
        const insertPayload = {
            peserta_id: target_type === 'peserta' ? target_id : null,
            panitia_id: target_type === 'panitia' ? target_id : null,
            keterangan: ket,
            site: targetSite
        };

        const { data: penanganan, error: penangananErr } = await supabaseAdmin
            .from('riwayat_penanganan_medis')
            .insert([insertPayload])
            .select('id, peserta_id, panitia_id, keterangan, site, created_at')
            .single();

        if (penangananErr) throw penangananErr;

        // 2. Loop obat_list jika ada
        const insertedLogIds = [];
        const insertedRelasiIds = [];

        try {
            if (Array.isArray(obat_list) && obat_list.length > 0) {
                for (const item of obat_list) {
                    if (!item.obat_id) continue;
                    const jumlah = parseInt(item.jumlah || 1, 10);
                    if (isNaN(jumlah) || jumlah <= 0) continue;

                    // Catat ke pemakaian_obat (log)
                    const logRes = await createLogObat({
                        obat_id: item.obat_id,
                        pemakaian_obat: jumlah,
                        site: targetSite
                    });

                    if (!logRes.success) {
                        throw new Error(logRes.error || 'Gagal mencatat pemakaian obat.');
                    }
                    insertedLogIds.push(logRes.data.id);

                    // Insert ke riwayat_penanganan_obat
                    const { data: relasi, error: relErr } = await supabaseAdmin
                        .from('riwayat_penanganan_obat')
                        .insert([{
                            penanganan_id: penanganan.id,
                            obat_id: item.obat_id,
                            jumlah: jumlah,
                            site: targetSite
                        }])
                        .select('id')
                        .single();

                    if (relErr) throw relErr;
                    insertedRelasiIds.push(relasi.id);
                }
            }
        } catch (multiErr) {
            // Rollback jika ada error saat loop obat
            for (const logId of insertedLogIds) {
                await deleteLogObat(logId);
            }
            await supabaseAdmin
                .from('riwayat_penanganan_medis')
                .delete()
                .eq('id', penanganan.id);

            throw multiErr;
        }

        await insertAuditLog(
            user.email,
            'CREATE_RIWAYAT_PENANGANAN_MEDIS',
            penanganan.id,
            `Riwayat penanganan medis (Site: ${targetSite}) dicatat untuk ${target_type} ID: ${target_id} dengan ${obat_list.length} jenis obat`,
            adminNama
        );

        return { success: true, data: penanganan };
    } catch (error) {
        console.error('Error in createRiwayatPenangananMedis:', error);
        return { success: false, error: error.message || 'Gagal mencatat riwayat penanganan medis.' };
    }
};

/**
 * Menghapus riwayat penanganan medis beserta relasi obat dan mengembalikan stok
 */
export const deleteRiwayatPenangananMedis = async (id) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id) throw new Error('ID riwayat penanganan wajib disediakan');

        // 1. Ambil relasi obat dari riwayat_penanganan_obat
        const { data: relasiObatList } = await supabaseAdmin
            .from('riwayat_penanganan_obat')
            .select(`
                id,
                obat_id,
                jumlah,
                master_obat:obat_id (
                    id,
                    stok_obat,
                    sisa_obat,
                    is_non_depleting
                )
            `)
            .eq('penanganan_id', id);

        // Kembalikan sisa obat jika bukan non-depleting
        if (relasiObatList && relasiObatList.length > 0) {
            for (const item of relasiObatList) {
                const obat = item.master_obat;
                if (obat && !obat.is_non_depleting) {
                    const sisaBaru = Math.min(obat.stok_obat, (obat.sisa_obat || 0) + (item.jumlah || 0));
                    await supabaseAdmin
                        .from('master_obat')
                        .update({ sisa_obat: sisaBaru })
                        .eq('id', item.obat_id);
                }
            }
        }

        // 2. Jika ada pemakaian_obat_id single (legacy), hapus lognya
        const { data: riwayat } = await supabaseAdmin
            .from('riwayat_penanganan_medis')
            .select('id, pemakaian_obat_id')
            .eq('id', id)
            .single();

        if (riwayat && riwayat.pemakaian_obat_id) {
            await deleteLogObat(riwayat.pemakaian_obat_id);
        }

        // 3. Hapus riwayat penanganan (cascade akan hapus riwayat_penanganan_obat)
        const { error } = await supabaseAdmin
            .from('riwayat_penanganan_medis')
            .delete()
            .eq('id', id);

        if (error) throw error;

        await insertAuditLog(
            user.email,
            'DELETE_RIWAYAT_PENANGANAN_MEDIS',
            id,
            `Riwayat penanganan medis dihapus`,
            adminNama
        );

        return { success: true };
    } catch (error) {
        console.error('Error in deleteRiwayatPenangananMedis:', error);
        return { success: false, error: error.message || 'Gagal menghapus riwayat penanganan medis.' };
    }
};

// ============================================================
// HELPER LOOKUPS
// ============================================================

/**
 * Mengambil daftar admin/panitia untuk target penanganan (dengan filter site optional)
 */
export const getAdminsForMedis = async (site = null) => {
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
        return { success: true, data: data || [] };
    } catch (error) {
        console.error('Error in getAdminsForMedis:', error);
        return { success: false, error: error.message || 'Gagal mengambil daftar panitia.' };
    }
};

/**
 * Mencari anggota peserta untuk target penanganan berdasarkan site
 */
export const searchPesertaForMedis = async (searchQuery, site = 'pkkmb') => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        const query = (searchQuery || '').trim();
        if (!query) {
            return { success: true, data: [] };
        }

        if (site === 'pose') {
            // Search peserta POSE
            const { data, error } = await supabaseAdmin
                .from('peserta')
                .select('id, nama, nim, prodi, kampus, site_type')
                .eq('site_type', 'pose')
                .or(`nama.ilike.%${query}%,nim.ilike.%${query}%`)
                .order('nama', { ascending: true })
                .limit(20);

            if (error) throw error;

            // Normalize structure agar mirip dengan kelompok_members
            const formatted = (data || []).map(p => ({
                id: p.id,
                nama_anggota: p.nama,
                nim_anggota: p.nim || '-',
                kelompok_id: null,
                kelompok: {
                    id: null,
                    urutan: '-',
                    nama_kelompok: p.kampus || 'Peserta POSE',
                    nama_kabim: '-'
                }
            }));

            return { success: true, data: formatted };
        }

        // PKKMB default: search kelompok_members
        const { data, error } = await supabaseAdmin
            .from('kelompok_members')
            .select(`
                id,
                nama_anggota,
                nim_anggota,
                kelompok_id,
                kelompok:kelompok (
                    id,
                    urutan,
                    nama_kelompok,
                    nama_kabim
                )
            `)
            .or(`nama_anggota.ilike.%${query}%,nim_anggota.ilike.%${query}%`)
            .order('nama_anggota', { ascending: true })
            .limit(20);

        if (error) throw error;
        return { success: true, data: data || [] };
    } catch (error) {
        console.error('Error in searchPesertaForMedis:', error);
        return { success: false, error: error.message || 'Gagal mencari nama peserta.' };
    }
};
