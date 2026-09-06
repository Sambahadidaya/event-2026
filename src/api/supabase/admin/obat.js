'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { checkAdminAuth, insertAuditLog } from './audit';

// ============================================================
// MASTER OBAT
// ============================================================

/**
 * Mengambil semua master obat
 */
export const getMasterObat = async () => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        const { data, error } = await supabaseAdmin
            .from('master_obat')
            .select('id, nama_obat, stok_obat, sisa_obat, created_at')
            .order('created_at', { ascending: false });

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
export const createMasterObat = async ({ nama_obat, stok_obat, sisa_obat }) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        const nama = (nama_obat || '').trim();
        const stok = parseInt(stok_obat, 10);
        const sisa = sisa_obat !== undefined && sisa_obat !== '' && sisa_obat !== null 
            ? parseInt(sisa_obat, 10) 
            : stok;

        if (!nama) throw new Error('Nama obat wajib diisi');
        if (isNaN(stok) || stok < 0) throw new Error('Stok obat harus berupa angka valid >= 0');
        if (isNaN(sisa) || sisa < 0) throw new Error('Sisa obat harus berupa angka valid >= 0');
        if (sisa > stok) throw new Error('Sisa obat tidak boleh melebihi stok obat');

        const { data, error } = await supabaseAdmin
            .from('master_obat')
            .insert([{ nama_obat: nama, stok_obat: stok, sisa_obat: sisa }])
            .select('id, nama_obat, stok_obat, sisa_obat, created_at')
            .single();

        if (error) throw error;

        await insertAuditLog(
            user.email,
            'CREATE_MASTER_OBAT',
            data.id,
            `Master obat "${nama}" (Stok: ${stok}, Sisa: ${sisa}) ditambahkan`,
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
export const updateMasterObat = async (id, { nama_obat, stok_obat, sisa_obat }) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id) throw new Error('ID master obat wajib disediakan');

        const nama = (nama_obat || '').trim();
        const stok = parseInt(stok_obat, 10);
        const sisa = parseInt(sisa_obat, 10);

        if (!nama) throw new Error('Nama obat wajib diisi');
        if (isNaN(stok) || stok < 0) throw new Error('Stok obat harus berupa angka valid >= 0');
        if (isNaN(sisa) || sisa < 0) throw new Error('Sisa obat harus berupa angka valid >= 0');
        if (sisa > stok) throw new Error('Sisa obat tidak boleh melebihi stok obat');

        const { data, error } = await supabaseAdmin
            .from('master_obat')
            .update({ nama_obat: nama, stok_obat: stok, sisa_obat: sisa })
            .eq('id', id)
            .select('id, nama_obat, stok_obat, sisa_obat, created_at')
            .single();

        if (error) throw error;

        await insertAuditLog(
            user.email,
            'UPDATE_MASTER_OBAT',
            id,
            `Master obat diupdate menjadi "${nama}" (Stok: ${stok}, Sisa: ${sisa})`,
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
 * Mengambil semua riwayat pemakaian obat
 */
export const getLogObat = async () => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        const { data, error } = await supabaseAdmin
            .from('pemakaian_obat')
            .select(`
                id,
                obat_id,
                pemakaian_obat,
                created_at,
                master_obat:obat_id (
                    id,
                    nama_obat,
                    stok_obat,
                    sisa_obat
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data: data || [] };
    } catch (error) {
        console.error('Error in getLogObat:', error);
        return { success: false, error: error.message || 'Gagal mengambil log pemakaian obat.' };
    }
};

/**
 * Menambahkan catatan pemakaian obat baru
 * Otomatis mengurangi sisa_obat di master_obat
 */
export const createLogObat = async ({ obat_id, pemakaian_obat }) => {
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
            .select('id, nama_obat, stok_obat, sisa_obat')
            .eq('id', obat_id)
            .single();

        if (obatErr || !obat) {
            throw new Error('Obat tidak ditemukan di database');
        }

        const sisaSaatIni = obat.sisa_obat !== null ? obat.sisa_obat : obat.stok_obat;
        if (pemakaian > sisaSaatIni) {
            throw new Error(`Sisa obat "${obat.nama_obat}" tidak mencukupi (Sisa tersedia: ${sisaSaatIni})`);
        }

        const sisaBaru = sisaSaatIni - pemakaian;

        // Kurangi sisa_obat di master_obat
        const { error: updateObatErr } = await supabaseAdmin
            .from('master_obat')
            .update({ sisa_obat: sisaBaru })
            .eq('id', obat_id);

        if (updateObatErr) throw updateObatErr;

        // Insert log ke pemakaian_obat
        const { data, error } = await supabaseAdmin
            .from('pemakaian_obat')
            .insert([{ obat_id, pemakaian_obat: pemakaian }])
            .select(`
                id,
                obat_id,
                pemakaian_obat,
                created_at,
                master_obat:obat_id (
                    id,
                    nama_obat,
                    stok_obat,
                    sisa_obat
                )
            `)
            .single();

        if (error) {
            // Rollback sisa obat jika insert gagal
            await supabaseAdmin
                .from('master_obat')
                .update({ sisa_obat: sisaSaatIni })
                .eq('id', obat_id);
            throw error;
        }

        await insertAuditLog(
            user.email,
            'CREATE_LOG_OBAT',
            data.id,
            `Pemakaian obat "${obat.nama_obat}" sebanyak ${pemakaian} dicatat. Sisa obat kini: ${sisaBaru}`,
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
 * Menghitung selisih dan menyesuaikan sisa_obat di master_obat
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
            .select('id, obat_id, pemakaian_obat')
            .eq('id', id)
            .single();

        if (logLamaErr || !logLama) throw new Error('Data log pemakaian tidak ditemukan');

        const obatIdLama = logLama.obat_id;
        const pemakaianLama = logLama.pemakaian_obat || 0;
        const targetObatId = obat_id || obatIdLama;

        if (targetObatId === obatIdLama) {
            // Obat yang sama, hitung selisih pemakaian
            const selisih = pemakaianBaru - pemakaianLama;

            const { data: currentObat, error: obatErr } = await supabaseAdmin
                .from('master_obat')
                .select('id, nama_obat, stok_obat, sisa_obat')
                .eq('id', targetObatId)
                .single();

            if (obatErr || !currentObat) throw new Error('Data obat tidak ditemukan');

            const sisaTersedia = currentObat.sisa_obat !== null ? currentObat.sisa_obat : currentObat.stok_obat;
            if (selisih > 0 && selisih > sisaTersedia) {
                throw new Error(`Sisa obat tidak mencukupi untuk penambahan pemakaian (Sisa tersedia: ${sisaTersedia})`);
            }

            const sisaBaru = sisaTersedia - selisih;
            await supabaseAdmin
                .from('master_obat')
                .update({ sisa_obat: sisaBaru })
                .eq('id', targetObatId);
        } else {
            // Berubah jenis obat: Kembalikan stok obat lama, kurangi stok obat baru
            const { data: obatLama } = await supabaseAdmin
                .from('master_obat')
                .select('id, sisa_obat')
                .eq('id', obatIdLama)
                .single();

            if (obatLama) {
                await supabaseAdmin
                    .from('master_obat')
                    .update({ sisa_obat: (obatLama.sisa_obat || 0) + pemakaianLama })
                    .eq('id', obatIdLama);
            }

            const { data: obatTarget, error: targetErr } = await supabaseAdmin
                .from('master_obat')
                .select('id, nama_obat, sisa_obat')
                .eq('id', targetObatId)
                .single();

            if (targetErr || !obatTarget) throw new Error('Data obat baru tidak ditemukan');
            if (pemakaianBaru > obatTarget.sisa_obat) {
                throw new Error(`Sisa obat "${obatTarget.nama_obat}" tidak mencukupi (Sisa: ${obatTarget.sisa_obat})`);
            }

            await supabaseAdmin
                .from('master_obat')
                .update({ sisa_obat: obatTarget.sisa_obat - pemakaianBaru })
                .eq('id', targetObatId);
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
                created_at,
                master_obat:obat_id (
                    id,
                    nama_obat,
                    stok_obat,
                    sisa_obat
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
 * Mengembalikan sisa_obat di master_obat
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
                .select('id, stok_obat, sisa_obat')
                .eq('id', log.obat_id)
                .single();

            if (obat) {
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
            `Log pemakaian obat dihapus, sisa obat dikembalikan`,
            adminNama
        );

        return { success: true };
    } catch (error) {
        console.error('Error in deleteLogObat:', error);
        return { success: false, error: error.message || 'Gagal menghapus log pemakaian obat.' };
    }
};

// ============================================================
// RIWAYAT PENANGANAN MEDIS
// ============================================================

/**
 * Mengambil semua data riwayat penanganan medis
 */
export const getRiwayatPenangananMedis = async () => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        const { data, error } = await supabaseAdmin
            .from('riwayat_penanganan_medis')
            .select(`
                id,
                peserta_id,
                panitia_id,
                pemakaian_obat_id,
                keterangan,
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
                    role
                ),
                pemakaian_obat:pemakaian_obat (
                    id,
                    pemakaian_obat,
                    created_at,
                    master_obat:obat_id (
                        id,
                        nama_obat,
                        stok_obat,
                        sisa_obat
                    )
                )
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data: data || [] };
    } catch (error) {
        console.error('Error in getRiwayatPenangananMedis:', error);
        return { success: false, error: error.message || 'Gagal mengambil riwayat penanganan medis.' };
    }
};

/**
 * Menambahkan riwayat penanganan medis baru
 * @param {Object} payload
 * - target_type: 'peserta' | 'panitia'
 * - target_id: UUID kelompok_members atau admins
 * - pakai_obat: boolean
 * - obat_id: UUID master_obat (jika pakai_obat = true)
 * - jumlah_obat: number (jika pakai_obat = true)
 * - keterangan: string
 */
export const createRiwayatPenangananMedis = async ({
    target_type = 'peserta',
    target_id,
    pakai_obat = false,
    obat_id = null,
    jumlah_obat = 1,
    keterangan = ''
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

        let pemakaianObatId = null;

        // Jika menggunakan obat, catat ke pemakaian_obat
        if (pakai_obat && obat_id) {
            const pemakaianRes = await createLogObat({
                obat_id,
                pemakaian_obat: jumlah_obat
            });
            if (!pemakaianRes.success) {
                throw new Error(pemakaianRes.error || 'Gagal memproses pemakaian obat.');
            }
            pemakaianObatId = pemakaianRes.data.id;
        }

        const insertPayload = {
            peserta_id: target_type === 'peserta' ? target_id : null,
            panitia_id: target_type === 'panitia' ? target_id : null,
            pemakaian_obat_id: pemakaianObatId,
            keterangan: ket
        };

        const { data, error } = await supabaseAdmin
            .from('riwayat_penanganan_medis')
            .insert([insertPayload])
            .select(`
                id,
                peserta_id,
                panitia_id,
                pemakaian_obat_id,
                keterangan,
                created_at,
                peserta:kelompok_members (
                    id,
                    nama_anggota,
                    nim_anggota,
                    kelompok:kelompok (
                        id,
                        urutan,
                        nama_kelompok
                    )
                ),
                panitia:admins (
                    id,
                    nama,
                    email,
                    role
                ),
                pemakaian_obat:pemakaian_obat (
                    id,
                    pemakaian_obat,
                    master_obat:obat_id (
                        id,
                        nama_obat,
                        stok_obat,
                        sisa_obat
                    )
                )
            `)
            .single();

        if (error) {
            // Rollback pemakaian obat jika insert riwayat gagal
            if (pemakaianObatId) {
                await deleteLogObat(pemakaianObatId);
            }
            throw error;
        }

        await insertAuditLog(
            user.email,
            'CREATE_RIWAYAT_PENANGANAN_MEDIS',
            data.id,
            `Riwayat penanganan medis dicatat untuk ${target_type} ID: ${target_id} (${pakai_obat ? 'dengan obat' : 'tanpa obat'})`,
            adminNama
        );

        return { success: true, data };
    } catch (error) {
        console.error('Error in createRiwayatPenangananMedis:', error);
        return { success: false, error: error.message || 'Gagal mencatat riwayat penanganan medis.' };
    }
};

/**
 * Mengupdate riwayat penanganan medis
 */
export const updateRiwayatPenangananMedis = async (id, {
    target_type = 'peserta',
    target_id,
    pakai_obat = false,
    obat_id = null,
    jumlah_obat = 1,
    keterangan = ''
}) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id) throw new Error('ID riwayat penanganan medis wajib disediakan');
        if (!target_id) throw new Error(`Pilih ${target_type === 'peserta' ? 'Peserta' : 'Panitia'} yang ditangani.`);
        const ket = (keterangan || '').trim();
        if (!ket) throw new Error('Keterangan penanganan medis wajib diisi.');

        // Ambil data riwayat saat ini
        const { data: riwayatLama, error: rErr } = await supabaseAdmin
            .from('riwayat_penanganan_medis')
            .select('id, pemakaian_obat_id')
            .eq('id', id)
            .single();

        if (rErr || !riwayatLama) throw new Error('Data riwayat penanganan tidak ditemukan.');

        let newPemakaianObatId = riwayatLama.pemakaian_obat_id;

        if (pakai_obat && obat_id) {
            if (newPemakaianObatId) {
                // Update log pemakaian obat yang sudah ada
                const upLog = await updateLogObat(newPemakaianObatId, {
                    obat_id,
                    pemakaian_obat: jumlah_obat
                });
                if (!upLog.success) throw new Error(upLog.error || 'Gagal memperbarui pemakaian obat.');
            } else {
                // Buat pemakaian obat baru jika sebelumnya tanpa obat
                const crLog = await createLogObat({
                    obat_id,
                    pemakaian_obat: jumlah_obat
                });
                if (!crLog.success) throw new Error(crLog.error || 'Gagal mencatat pemakaian obat.');
                newPemakaianObatId = crLog.data.id;
            }
        } else {
            // Jika sekarang tanpa obat namun sebelumnya pakai obat, hapus log obatnya & kembalikan stok
            if (newPemakaianObatId) {
                await deleteLogObat(newPemakaianObatId);
                newPemakaianObatId = null;
            }
        }

        const updatePayload = {
            peserta_id: target_type === 'peserta' ? target_id : null,
            panitia_id: target_type === 'panitia' ? target_id : null,
            pemakaian_obat_id: newPemakaianObatId,
            keterangan: ket
        };

        const { data, error } = await supabaseAdmin
            .from('riwayat_penanganan_medis')
            .update(updatePayload)
            .eq('id', id)
            .select(`
                id,
                peserta_id,
                panitia_id,
                pemakaian_obat_id,
                keterangan,
                created_at,
                peserta:kelompok_members (
                    id,
                    nama_anggota,
                    nim_anggota,
                    kelompok:kelompok (
                        id,
                        urutan,
                        nama_kelompok
                    )
                ),
                panitia:admins (
                    id,
                    nama,
                    email,
                    role
                ),
                pemakaian_obat:pemakaian_obat (
                    id,
                    pemakaian_obat,
                    master_obat:obat_id (
                        id,
                        nama_obat,
                        stok_obat,
                        sisa_obat
                    )
                )
            `)
            .single();

        if (error) throw error;

        await insertAuditLog(
            user.email,
            'UPDATE_RIWAYAT_PENANGANAN_MEDIS',
            id,
            `Riwayat penanganan medis diupdate untuk ${target_type} ID: ${target_id}`,
            adminNama
        );

        return { success: true, data };
    } catch (error) {
        console.error('Error in updateRiwayatPenangananMedis:', error);
        return { success: false, error: error.message || 'Gagal memperbarui riwayat penanganan medis.' };
    }
};

/**
 * Menghapus riwayat penanganan medis
 * Otomatis mengembalikan sisa obat jika menggunakan obat
 */
export const deleteRiwayatPenangananMedis = async (id) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id) throw new Error('ID riwayat penanganan wajib disediakan');

        const { data: riwayat } = await supabaseAdmin
            .from('riwayat_penanganan_medis')
            .select('id, pemakaian_obat_id')
            .eq('id', id)
            .single();

        // Jika ada pemakaian obat, hapus log obat & kembalikan stoknya
        if (riwayat && riwayat.pemakaian_obat_id) {
            await deleteLogObat(riwayat.pemakaian_obat_id);
        }

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
 * Mengambil daftar seluruh admin/panitia untuk pilihan target penanganan
 */
export const getAdminsForMedis = async () => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        const { data, error } = await supabaseAdmin
            .from('admins')
            .select('id, nama, email, role')
            .order('nama', { ascending: true });

        if (error) throw error;
        return { success: true, data: data || [] };
    } catch (error) {
        console.error('Error in getAdminsForMedis:', error);
        return { success: false, error: error.message || 'Gagal mengambil daftar panitia.' };
    }
};

/**
 * Mencari anggota peserta (kelompok_members) untuk pilihan target penanganan
 */
export const searchPesertaForMedis = async (searchQuery) => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        const query = (searchQuery || '').trim();
        if (!query) {
            return { success: true, data: [] };
        }

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
