'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { checkAdminAuth, insertAuditLog } from './audit';
import { getKabimFilter } from '@/lib/adminRoleData';

// ============================================================
// TUGAS SOSIAL MEDIA (KELOMPOK & INDIVIDU)
// ============================================================

/**
 * Mengambil daftar penyerahan tugas sosial media
 * @param {Object} params
 * @param {string} [params.tipe_tugas] - 'kelompok' | 'individu' | null (semua)
 * @param {string} [params.kelompok_id]
 */
export const getTugasSosmedList = async ({ tipe_tugas = null, kelompok_id = null } = {}) => {
    try {
        const { user, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        // Filter kelompok sesuai role kabim jika ada
        const { data: adminRecord, error: adminErr } = await supabaseAdmin
            .from('admins')
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle();

        if (adminErr) throw adminErr;
        const currentRole = adminRecord?.role || '';
        const lockedUrutan = getKabimFilter(currentRole);

        let query = supabaseAdmin
            .from('tugas_sosmed_pkkmb')
            .select(`
                id,
                tipe_tugas,
                kelompok_id,
                kelompok_members_id,
                label_hari,
                platform,
                link_konten,
                keterangan,
                nilai,
                catatan_penilai,
                created_by,
                created_at,
                kelompok (
                    id,
                    urutan,
                    nama_kelompok,
                    nama_kabim
                ),
                kelompok_members (
                    id,
                    nama_anggota,
                    nim_anggota
                )
            `)
            .order('created_at', { ascending: false });

        if (tipe_tugas) {
            query = query.eq('tipe_tugas', tipe_tugas);
        }

        if (kelompok_id) {
            query = query.eq('kelompok_id', kelompok_id);
        }

        const { data, error } = await query;
        if (error) throw error;

        let filtered = data || [];

        // Terapkan filter urutan kelompok untuk kabim yang dibatasi
        if (Array.isArray(lockedUrutan) && lockedUrutan.length > 0) {
            filtered = filtered.filter(item => {
                const urutan = item.kelompok?.urutan;
                return urutan && lockedUrutan.includes(urutan);
            });
        }

        return { success: true, data: filtered };
    } catch (error) {
        console.error('Error in getTugasSosmedList:', error);
        return { success: false, error: error.message || 'Gagal memuat tugas sosial media.' };
    }
};

/**
 * Mengupdate nilai tugas sosial media (0 = tidak mengerjakan, 5 = mengerjakan)
 */
export const updateNilaiTugasSosmed = async ({ id, nilai, catatan_penilai = '' }) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id) throw new Error('ID tugas sosial media wajib diisi.');

        const numNilai = parseFloat(nilai);
        if (isNaN(numNilai) || numNilai < 0) {
            throw new Error('Nilai harus berupa angka valid (misal: 0 atau 5).');
        }

        const { data, error } = await supabaseAdmin
            .from('tugas_sosmed_pkkmb')
            .update({
                nilai: numNilai,
                catatan_penilai: catatan_penilai ? catatan_penilai.trim() : null,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        await insertAuditLog(
            user.email,
            'UPDATE_NILAI_TUGAS_SOSMED',
            id,
            `Nilai tugas sosmed diperbarui menjadi ${numNilai}`,
            adminNama
        );

        return { success: true, data };
    } catch (error) {
        console.error('Error in updateNilaiTugasSosmed:', error);
        return { success: false, error: error.message || 'Gagal memperbarui nilai tugas sosial media.' };
    }
};

/**
 * Menghapus data submission tugas sosial media
 */
export const deleteTugasSosmed = async (id) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id) throw new Error('ID tugas wajib disertakan.');

        const { error } = await supabaseAdmin
            .from('tugas_sosmed_pkkmb')
            .delete()
            .eq('id', id);

        if (error) throw error;

        await insertAuditLog(
            user.email,
            'DELETE_TUGAS_SOSMED',
            id,
            'Submission tugas sosial media dihapus',
            adminNama
        );

        return { success: true };
    } catch (error) {
        console.error('Error in deleteTugasSosmed:', error);
        return { success: false, error: error.message || 'Gagal menghapus tugas sosial media.' };
    }
};

// ============================================================
// TUGAS BARANG BAWAAN (KELOMPOK & INDIVIDU)
// ============================================================

/**
 * Mengambil daftar pengecekan tugas barang bawaan
 */
export const getTugasBarangList = async ({ tipe_barang = null, kelompok_id = null, label_hari = null } = {}) => {
    try {
        const { user, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        const { data: adminRecord, error: adminErr } = await supabaseAdmin
            .from('admins')
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle();

        if (adminErr) throw adminErr;
        const currentRole = adminRecord?.role || '';
        const lockedUrutan = getKabimFilter(currentRole);

        let query = supabaseAdmin
            .from('tugas_barang_pkkmb')
            .select(`
                id,
                tipe_barang,
                kelompok_id,
                kelompok_members_id,
                label_hari,
                total_barang_wajib,
                barang_dibawa,
                catatan,
                created_by,
                created_at,
                updated_at,
                kelompok (
                    id,
                    urutan,
                    nama_kelompok,
                    nama_kabim
                ),
                kelompok_members (
                    id,
                    nama_anggota,
                    nim_anggota
                )
            `)
            .order('created_at', { ascending: false });

        if (tipe_barang) {
            query = query.eq('tipe_barang', tipe_barang);
        }

        if (kelompok_id) {
            query = query.eq('kelompok_id', kelompok_id);
        }

        if (label_hari) {
            query = query.eq('label_hari', label_hari);
        }

        const { data, error } = await query;
        if (error) throw error;

        let filtered = data || [];
        if (Array.isArray(lockedUrutan) && lockedUrutan.length > 0) {
            filtered = filtered.filter(item => {
                const urutan = item.kelompok?.urutan;
                return urutan && lockedUrutan.includes(urutan);
            });
        }

        return { success: true, data: filtered };
    } catch (error) {
        console.error('Error in getTugasBarangList:', error);
        return { success: false, error: error.message || 'Gagal memuat tugas barang bawaan.' };
    }
};

/**
 * Menyimpan / memperbarui pengecekan barang bawaan (per kelompok atau per individu)
 */
export const saveTugasBarang = async ({
    id = null,
    tipe_barang = 'kelompok',
    kelompok_id = null,
    kelompok_members_id = null,
    label_hari,
    total_barang_wajib = 1,
    barang_dibawa = 0,
    catatan = ''
}) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!label_hari) throw new Error('Label hari wajib disertakan.');
        if (tipe_barang === 'kelompok' && !kelompok_id) {
            throw new Error('Kelompok wajib dipilih untuk tugas barang kelompok.');
        }
        if (tipe_barang === 'individu' && !kelompok_members_id) {
            throw new Error('Anggota wajib dipilih untuk tugas barang individu.');
        }

        const wajib = Math.max(1, parseInt(total_barang_wajib, 10) || 1);
        const dibawa = Math.max(0, parseInt(barang_dibawa, 10) || 0);

        const payload = {
            tipe_barang,
            kelompok_id: kelompok_id || null,
            kelompok_members_id: kelompok_members_id || null,
            label_hari: label_hari.trim(),
            total_barang_wajib: wajib,
            barang_dibawa: dibawa,
            catatan: catatan ? catatan.trim() : null,
            created_by: adminNama || user.email,
            updated_at: new Date().toISOString()
        };

        let result;
        if (id) {
            const { data, error } = await supabaseAdmin
                .from('tugas_barang_pkkmb')
                .update(payload)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            result = data;
        } else {
            const { data, error } = await supabaseAdmin
                .from('tugas_barang_pkkmb')
                .insert([payload])
                .select()
                .single();
            if (error) throw error;
            result = data;
        }

        await insertAuditLog(
            user.email,
            id ? 'UPDATE_TUGAS_BARANG' : 'CREATE_TUGAS_BARANG',
            result.id,
            `Pengecekan barang bawaan ${tipe_barang} (${label_hari}): ${dibawa}/${wajib} dibawa`,
            adminNama
        );

        return { success: true, data: result };
    } catch (error) {
        console.error('Error in saveTugasBarang:', error);
        return { success: false, error: error.message || 'Gagal menyimpan data barang bawaan.' };
    }
};

/**
 * Menghapus data pengecekan barang bawaan
 */
export const deleteTugasBarang = async (id) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id) throw new Error('ID tugas barang wajib disertakan.');

        const { error } = await supabaseAdmin
            .from('tugas_barang_pkkmb')
            .delete()
            .eq('id', id);

        if (error) throw error;

        await insertAuditLog(
            user.email,
            'DELETE_TUGAS_BARANG',
            id,
            'Data barang bawaan dihapus',
            adminNama
        );

        return { success: true };
    } catch (error) {
        console.error('Error in deleteTugasBarang:', error);
        return { success: false, error: error.message || 'Gagal menghapus data barang bawaan.' };
    }
};
