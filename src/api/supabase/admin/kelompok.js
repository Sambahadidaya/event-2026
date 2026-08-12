'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { checkAdminAuth, insertAuditLog } from './audit';
import { invalidateKelompokPublicCache } from '@/api/supabase/public/kelompok';

// ============================================================
// Cache admin (in-memory, TTL 30 detik)
// ============================================================
let _adminCache = null;
let _adminCacheAt = 0;
const CACHE_TTL = 30 * 1000;

function isCacheValid() {
    return _adminCache !== null && Date.now() - _adminCacheAt < CACHE_TTL;
}

async function invalidateAdminCache() {
    _adminCache = null;
    _adminCacheAt = 0;
    // Tambahkan await di sini:
    await invalidateKelompokPublicCache();
}

// ============================================================
// Sanitizer: hanya izinkan key yang diizinkan
// ============================================================
const ALLOWED_KELOMPOK_KEYS = [
    'urutan', 'nama_kelompok', 'nama_kabim',
    'link_instagram', 'foto_kelompok', 'keterangan',
];
const ALLOWED_MEMBER_KEYS = ['kelompok_id', 'nama_anggota', 'nim_anggota'];

function sanitizeKelompok(payload) {
    if (!payload || typeof payload !== 'object') return {};
    const out = {};
    for (const key of ALLOWED_KELOMPOK_KEYS) {
        if (payload[key] !== undefined) {
            // Trim string values
            out[key] = typeof payload[key] === 'string'
                ? payload[key].trim().slice(0, 500)
                : payload[key];
        }
    }
    return out;
}

function sanitizeMember(m) {
    const out = {};
    for (const key of ALLOWED_MEMBER_KEYS) {
        if (m[key] !== undefined) {
            out[key] = typeof m[key] === 'string' ? m[key].trim().slice(0, 200) : m[key];
        }
    }
    return out;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isValidUUID = (val) => typeof val === 'string' && UUID_REGEX.test(val);

// ============================================================
// READ
// ============================================================

/**
 * Ambil semua kelompok + anggota (dengan nim_anggota) untuk admin.
 * Termasuk in-memory cache 30 detik.
 */
export const getKelompokAdmin = async () => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (isCacheValid()) return _adminCache;

        const { data, error } = await supabaseAdmin
            .from('kelompok')
            .select(
                'id, urutan, nama_kelompok, nama_kabim, link_instagram, foto_kelompok, keterangan, created_at, ' +
                'kelompok_members(id, nama_anggota, nim_anggota)'
            )
            .order('urutan', { ascending: true });

        if (error) throw error;

        // Fetch detail peserta untuk no_wa, prodi, angkatan, kelas
        const allNims = [];
        (data ?? []).forEach(k => {
            (k.kelompok_members ?? []).forEach(m => {
                if (m.nim_anggota) allNims.push(m.nim_anggota);
            });
        });

        if (allNims.length > 0) {
            const { data: pesertaData, error: pesertaError } = await supabaseAdmin
                .from('peserta')
                .select('nim, email_wa, prodi, angkatan, kelas')
                .in('nim', allNims);

            if (!pesertaError && pesertaData) {
                const pesertaMap = {};
                pesertaData.forEach(p => {
                    pesertaMap[p.nim] = p;
                });

                data.forEach(k => {
                    (k.kelompok_members ?? []).forEach(m => {
                        const p = pesertaMap[m.nim_anggota];
                        if (p) {
                            m.no_wa = p.email_wa;
                            m.prodi = p.prodi;
                            m.angkatan = p.angkatan;
                            m.kelas = p.kelas;
                        }
                    });
                });
            }
        }

        _adminCache = data ?? [];
        _adminCacheAt = Date.now();
        return _adminCache;
    } catch (error) {
        console.error('Internal Log - Error fetching kelompok admin:', error);
        return [];
    }
};

/**
 * Ambil satu kelompok berdasarkan urutan (untuk filter pj_kabim_N).
 */
export const getKelompokByUrutan = async (urutan) => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        const urutanNum = Number(urutan);
        if (!Number.isInteger(urutanNum) || urutanNum < 1 || urutanNum > 8) {
            throw new Error('Invalid urutan value');
        }

        const { data, error } = await supabaseAdmin
            .from('kelompok')
            .select(
                'id, urutan, nama_kelompok, nama_kabim, link_instagram, foto_kelompok, keterangan, created_at, ' +
                'kelompok_members(id, nama_anggota, nim_anggota)'
            )
            .eq('urutan', urutanNum)
            .maybeSingle();

        if (error) throw error;

        if (data && data.kelompok_members && data.kelompok_members.length > 0) {
            const allNims = data.kelompok_members.map(m => m.nim_anggota).filter(Boolean);
            if (allNims.length > 0) {
                const { data: pesertaData, error: pesertaError } = await supabaseAdmin
                    .from('peserta')
                    .select('nim, email_wa, prodi, angkatan, kelas')
                    .in('nim', allNims);

                if (!pesertaError && pesertaData) {
                    const pesertaMap = {};
                    pesertaData.forEach(p => {
                        pesertaMap[p.nim] = p;
                    });

                    data.kelompok_members.forEach(m => {
                        const p = pesertaMap[m.nim_anggota];
                        if (p) {
                            m.no_wa = p.email_wa;
                            m.prodi = p.prodi;
                            m.angkatan = p.angkatan;
                            m.kelas = p.kelas;
                        }
                    });
                }
            }
        }

        return data ?? null;
    } catch (error) {
        console.error('Internal Log - Error fetching kelompok by urutan:', error);
        return null;
    }
};

/**
 * Ambil daftar peserta PKKMB form wajib (hanya nama & nim) untuk dropdown anggota.
 */
export const getPesertaPkkmbWajib = async () => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        const { data: pesertaData, error } = await supabaseAdmin
            .from('peserta')
            .select('id, nama, nim')
            .eq('site_type', 'pkkmb')
            .eq('jenis_form', 'wajib')
            .eq('status_pembayaran', 'lunas')
            .order('nama', { ascending: true });

        if (error) throw error;
        
        const { data: members, error: memError } = await supabaseAdmin
            .from('kelompok_members')
            .select('nim_anggota, kelompok_id');
            
        const memberMap = {};
        if (members) {
            members.forEach(m => {
                if (m.nim_anggota) memberMap[m.nim_anggota] = m.kelompok_id;
            });
        }
        
        const result = (pesertaData || []).map(p => ({
            ...p,
            sudah_berkelompok: !!memberMap[p.nim],
            kelompok_id: memberMap[p.nim] || null
        }));

        return result;
    } catch (error) {
        console.error('Internal Log - Error fetching peserta pkkmb wajib:', error);
        return [];
    }
};

// ============================================================
// CREATE
// ============================================================

/**
 * Buat kelompok baru + anggota sekaligus.
 * @param {Object} kelompokPayload
 * @param {Array<{nama_anggota: string, nim_anggota: string}>} membersPayload
 */
export const createKelompok = async (kelompokPayload, membersPayload = []) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!kelompokPayload) throw new Error('Kelompok payload is required');

        const sanitized = sanitizeKelompok(kelompokPayload);
        if (!sanitized.nama_kelompok || !sanitized.nama_kabim) {
            throw new Error('nama_kelompok dan nama_kabim wajib diisi');
        }

        const { data: newKelompok, error: insertError } = await supabaseAdmin
            .from('kelompok')
            .insert([sanitized])
            .select('id, nama_kelompok')
            .single();

        if (insertError) throw insertError;

        // Insert anggota jika ada
        if (Array.isArray(membersPayload) && membersPayload.length > 0) {
            const sanitizedMembers = membersPayload
                .map(m => sanitizeMember({ ...m, kelompok_id: newKelompok.id }))
                .filter(m => m.nama_anggota && m.nim_anggota);

            if (sanitizedMembers.length > 0) {
                const { error: memberError } = await supabaseAdmin
                    .from('kelompok_members')
                    .insert(sanitizedMembers);
                if (memberError) throw memberError;
            }
        }

        invalidateAdminCache();

        await insertAuditLog(
            user.email, 'CREATE_KELOMPOK', newKelompok.id,
            `Kelompok "${newKelompok.nama_kelompok}" dibuat`, adminNama
        );

        return { success: true, data: newKelompok };
    } catch (error) {
        console.error('Internal Log - Error creating kelompok:', error);
        return { success: false, error: 'Terjadi kesalahan internal pada server.' };
    }
};

// ============================================================
// UPDATE
// ============================================================

/**
 * Update data kelompok + replace anggota.
 * @param {string} id - UUID kelompok
 * @param {Object} kelompokPayload
 * @param {Array<{nama_anggota: string, nim_anggota: string}>} membersPayload
 */
export const updateKelompok = async (id, kelompokPayload, membersPayload = null) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!isValidUUID(id)) throw new Error('Invalid kelompok ID');
        if (!kelompokPayload) throw new Error('Kelompok payload is required');

        const sanitized = sanitizeKelompok(kelompokPayload);

        const { error: updateError } = await supabaseAdmin
            .from('kelompok')
            .update(sanitized)
            .eq('id', id);

        if (updateError) throw updateError;

        // Jika ada payload anggota, replace semua anggota
        if (Array.isArray(membersPayload)) {
            await supabaseAdmin
                .from('kelompok_members')
                .delete()
                .eq('kelompok_id', id);

            if (membersPayload.length > 0) {
                const sanitizedMembers = membersPayload
                    .map(m => sanitizeMember({ ...m, kelompok_id: id }))
                    .filter(m => m.nama_anggota && m.nim_anggota);

                if (sanitizedMembers.length > 0) {
                    const { error: memberError } = await supabaseAdmin
                        .from('kelompok_members')
                        .insert(sanitizedMembers);
                    if (memberError) throw memberError;
                }
            }
        }

        invalidateAdminCache();

        await insertAuditLog(
            user.email, 'UPDATE_KELOMPOK', id,
            `Kelompok ID ${id} diperbarui`, adminNama
        );

        return { success: true };
    } catch (error) {
        console.error('Internal Log - Error updating kelompok:', error);
        return { success: false, error: 'Terjadi kesalahan internal pada server.' };
    }
};

// ============================================================
// DELETE
// ============================================================

/**
 * Hapus kelompok (CASCADE ke kelompok_members).
 */
export const deleteKelompok = async (id) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!isValidUUID(id)) throw new Error('Invalid kelompok ID');

        const { error } = await supabaseAdmin
            .from('kelompok')
            .delete()
            .eq('id', id);

        if (error) throw error;

        invalidateAdminCache();

        await insertAuditLog(
            user.email, 'DELETE_KELOMPOK', id,
            `Kelompok ID ${id} dihapus`, adminNama
        );

        return { success: true };
    } catch (error) {
        console.error('Internal Log - Error deleting kelompok:', error);
        return { success: false, error: 'Terjadi kesalahan internal pada server.' };
    }
};
