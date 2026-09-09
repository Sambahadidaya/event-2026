'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { checkAdminAuth, insertAuditLog } from './audit';

/**
 * Mendapatkan daftar hari unik pelaksanaan PKKMB secara dinamis dari jadwal_acara_pkkmb
 */
export const getDaftarHariPkkmb = async () => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        const { data: jadwalList, error } = await supabaseAdmin
            .from('jadwal_acara_pkkmb')
            .select('id, judul, created_at')
            .order('created_at', { ascending: true });

        if (error) throw error;

        // Ekstraksi hari unik dari judul jadwal
        // Misal "Hari 1 Pagi" & "Hari 1 Sore" -> digabung menjadi "Hari 1"
        const hariSet = new Set();
        const rawList = jadwalList || [];

        rawList.forEach(item => {
            const judul = (item.judul || '').trim();
            if (!judul) return;

            // Pola: "Hari 1 Pagi" -> "Hari 1", "Technical Meeting" -> "Technical Meeting", dst.
            const match = judul.match(/^(Hari\s*\d+|Day\s*\d+|Technical\s*Meeting|Outbound)/i);
            if (match) {
                // Standarisasi kapitalisasi
                const normalized = match[1].replace(/\b\w/g, l => l.toUpperCase());
                hariSet.add(normalized);
            } else {
                hariSet.add(judul);
            }
        });

        // Jika tabel jadwal kosong, berikan default dinamis
        let hariList = Array.from(hariSet);
        if (hariList.length === 0) {
            hariList = ['Hari 1', 'Hari 2', 'Hari 3', 'Hari 4', 'Hari 5'];
        }

        return {
            success: true,
            data: hariList,
            jadwal_raw: rawList
        };
    } catch (error) {
        console.error('Error in getDaftarHariPkkmb:', error);
        return {
            success: false,
            error: error.message || 'Gagal memuat daftar hari PKKMB.',
            data: ['Hari 1', 'Hari 2', 'Hari 3', 'Hari 4', 'Hari 5']
        };
    }
};

/**
 * Mengambil data nilai keaktifan per anggota
 */
export const getPenilaianKeaktifanByMember = async ({ kelompok_members_id }) => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!kelompok_members_id) return { success: true, data: [] };

        const { data, error } = await supabaseAdmin
            .from('penilaian_keaktifan_pkkmb')
            .select('id, kelompok_members_id, label_hari, jadwal_acara_pkkmb_id, skor_keaktifan, catatan, created_by, updated_at')
            .eq('kelompok_members_id', kelompok_members_id)
            .order('label_hari', { ascending: true });

        if (error) throw error;
        return { success: true, data: data || [] };
    } catch (error) {
        console.error('Error in getPenilaianKeaktifanByMember:', error);
        return { success: false, error: error.message || 'Gagal mengambil data keaktifan peserta.' };
    }
};

/**
 * Mengambil rekap nilai keaktifan untuk seluruh anggota dalam satu kelompok
 */
export const getPenilaianKeaktifanByKelompok = async ({ kelompok_id }) => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!kelompok_id) throw new Error('ID kelompok wajib disertakan.');

        // 1. Ambil anggota kelompok
        const { data: members, error: memErr } = await supabaseAdmin
            .from('kelompok_members')
            .select('id, nama_anggota, nim_anggota')
            .eq('kelompok_id', kelompok_id)
            .order('nama_anggota', { ascending: true });

        if (memErr) throw memErr;
        const memberIds = (members || []).map(m => m.id);

        if (memberIds.length === 0) {
            return { success: true, data: [] };
        }

        // 2. Ambil semua penilaian keaktifan untuk anggota-anggota tersebut
        const { data: nilaiList, error: nilaiErr } = await supabaseAdmin
            .from('penilaian_keaktifan_pkkmb')
            .select('id, kelompok_members_id, label_hari, skor_keaktifan, catatan, updated_at')
            .in('kelompok_members_id', memberIds);

        if (nilaiErr) throw nilaiErr;

        // Petakan penilaian per member
        const nilaiMap = {};
        (nilaiList || []).forEach(n => {
            if (!nilaiMap[n.kelompok_members_id]) {
                nilaiMap[n.kelompok_members_id] = {};
            }
            nilaiMap[n.kelompok_members_id][n.label_hari] = n;
        });

        // Gabungkan
        const result = (members || []).map(m => {
            const harian = nilaiMap[m.id] || {};
            const scores = Object.values(harian).map(item => Number(item.skor_keaktifan));
            const avg = scores.length > 0
                ? scores.reduce((a, b) => a + b, 0) / scores.length
                : 60.0; // Default KKM 60 jika belum ada nilai

            return {
                member_id: m.id,
                nama: m.nama_anggota,
                nim: m.nim_anggota,
                harian,
                rata_rata: Number(avg.toFixed(2)),
                total_hari_dinilai: scores.length
            };
        });

        return { success: true, data: result };
    } catch (error) {
        console.error('Error in getPenilaianKeaktifanByKelompok:', error);
        return { success: false, error: error.message || 'Gagal memuat rekap keaktifan kelompok.' };
    }
};

/**
 * Menyimpan / memperbarui nilai keaktifan harian peserta
 */
export const savePenilaianKeaktifan = async ({
    kelompok_members_id,
    label_hari,
    jadwal_acara_pkkmb_id = null,
    skor_keaktifan = 60,
    catatan = ''
}) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!kelompok_members_id || !label_hari) {
            throw new Error('ID anggota dan label hari wajib diisi.');
        }

        const skor = Math.min(100, Math.max(0, parseFloat(skor_keaktifan) || 60));

        const payload = {
            kelompok_members_id,
            label_hari: label_hari.trim(),
            jadwal_acara_pkkmb_id: jadwal_acara_pkkmb_id || null,
            skor_keaktifan: skor,
            catatan: catatan ? catatan.trim() : null,
            created_by: adminNama || user.email,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabaseAdmin
            .from('penilaian_keaktifan_pkkmb')
            .upsert(payload, { onConflict: 'kelompok_members_id,label_hari' })
            .select()
            .single();

        if (error) throw error;

        await insertAuditLog(
            user.email,
            'SAVE_PENILAIAN_KEAKTIFAN',
            data.id,
            `Nilai keaktifan ${label_hari} disimpan: ${skor}`,
            adminNama
        );

        return { success: true, data };
    } catch (error) {
        console.error('Error in savePenilaianKeaktifan:', error);
        return { success: false, error: error.message || 'Gagal menyimpan nilai keaktifan.' };
    }
};

/**
 * Batch simpan nilai keaktifan untuk beberapa peserta pada satu hari tertentu
 */
export const saveBatchPenilaianKeaktifan = async ({ label_hari, items = [] }) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!label_hari) throw new Error('Label hari wajib ditentukan.');
        if (!Array.isArray(items) || items.length === 0) {
            throw new Error('Data penilaian tidak boleh kosong.');
        }

        const now = new Date().toISOString();
        const upsertPayloads = items.map(item => ({
            kelompok_members_id: item.kelompok_members_id,
            label_hari: label_hari.trim(),
            skor_keaktifan: Math.min(100, Math.max(0, parseFloat(item.skor_keaktifan) || 60)),
            catatan: item.catatan ? item.catatan.trim() : null,
            created_by: adminNama || user.email,
            updated_at: now
        }));

        const { data, error } = await supabaseAdmin
            .from('penilaian_keaktifan_pkkmb')
            .upsert(upsertPayloads, { onConflict: 'kelompok_members_id,label_hari' })
            .select();

        if (error) throw error;

        await insertAuditLog(
            user.email,
            'SAVE_BATCH_PENILAIAN_KEAKTIFAN',
            null,
            `Batch nilai keaktifan ${label_hari} untuk ${items.length} peserta berhasil disimpan`,
            adminNama
        );

        return { success: true, count: data?.length || 0 };
    } catch (error) {
        console.error('Error in saveBatchPenilaianKeaktifan:', error);
        return { success: false, error: error.message || 'Gagal menyimpan batch keaktifan.' };
    }
};
