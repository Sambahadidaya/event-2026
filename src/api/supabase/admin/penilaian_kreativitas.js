'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { checkAdminAuth, insertAuditLog } from './audit';
import { getKabimFilter } from '@/lib/adminRoleData';

/**
 * Mengambil daftar kelompok binaan beserta data penilaian kreativitasnya
 */
export const getPenilaianKreativitasList = async () => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        // Cek filter kelompok berdasarkan role kabim
        const { data: adminRecord, error: adminErr } = await supabaseAdmin
            .from('admins')
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle();

        if (adminErr) throw adminErr;
        const currentRole = adminRecord?.role || '';
        const lockedUrutan = getKabimFilter(currentRole);

        // Ambil daftar kelompok
        let kelompokQuery = supabaseAdmin
            .from('kelompok')
            .select('id, urutan, nama_kelompok, nama_kabim, jenis_kelompok')
            .order('urutan', { ascending: true });

        if (Array.isArray(lockedUrutan) && lockedUrutan.length > 0) {
            kelompokQuery = kelompokQuery.in('urutan', lockedUrutan);
        }

        const { data: kelompokList, error: kelError } = await kelompokQuery;
        if (kelError) throw kelError;

        const kelompokIds = (kelompokList || []).map(k => k.id);
        let nilaiMap = {};

        if (kelompokIds.length > 0) {
            const { data: nilaiList, error: nilaiError } = await supabaseAdmin
                .from('penilaian_kreativitas_pkkmb')
                .select('id, kelompok_id, skor_yelyel, skor_kreasi_seni, skor_vlog, nilai_akhir, catatan, created_by, updated_at')
                .in('kelompok_id', kelompokIds);

            if (nilaiError) throw nilaiError;

            (nilaiList || []).forEach(n => {
                nilaiMap[n.kelompok_id] = n;
            });
        }

        const combined = (kelompokList || []).map(k => {
            const n = nilaiMap[k.id];
            return {
                kelompok_id: k.id,
                urutan: k.urutan,
                nama_kelompok: k.nama_kelompok,
                nama_kabim: k.nama_kabim,
                jenis_kelompok: k.jenis_kelompok || 'reguler',
                penilaian_id: n?.id || null,
                skor_yelyel: n?.skor_yelyel !== undefined ? Number(n.skor_yelyel) : 0,
                skor_kreasi_seni: n?.skor_kreasi_seni !== undefined ? Number(n.skor_kreasi_seni) : 0,
                skor_vlog: n?.skor_vlog !== undefined ? Number(n.skor_vlog) : 0,
                nilai_akhir: n?.nilai_akhir !== undefined ? Number(n.nilai_akhir) : 0,
                catatan: n?.catatan || '',
                sudah_dinilai: Boolean(n && (n.skor_yelyel > 0 || n.skor_kreasi_seni > 0 || n.skor_vlog > 0)),
                updated_at: n?.updated_at || null,
                created_by: n?.created_by || null
            };
        });

        return { success: true, data: combined };
    } catch (error) {
        console.error('Error in getPenilaianKreativitasList:', error);
        return { success: false, error: error.message || 'Gagal memuat penilaian kreativitas.' };
    }
};

/**
 * Menyimpan / memperbarui penilaian kreativitas untuk satu kelompok
 */
export const savePenilaianKreativitas = async ({
    kelompok_id,
    skor_yelyel = 0,
    skor_kreasi_seni = 0,
    skor_vlog = 0,
    catatan = ''
}) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!kelompok_id) throw new Error('ID kelompok wajib disertakan.');

        const yel = Math.min(100, Math.max(0, parseFloat(skor_yelyel) || 0));
        const seni = Math.min(100, Math.max(0, parseFloat(skor_kreasi_seni) || 0));
        const vlog = Math.min(100, Math.max(0, parseFloat(skor_vlog) || 0));

        const payload = {
            kelompok_id,
            skor_yelyel: yel,
            skor_kreasi_seni: seni,
            skor_vlog: vlog,
            catatan: catatan ? catatan.trim() : null,
            created_by: adminNama || user.email,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabaseAdmin
            .from('penilaian_kreativitas_pkkmb')
            .upsert(payload, { onConflict: 'kelompok_id' })
            .select()
            .single();

        if (error) throw error;

        await insertAuditLog(
            user.email,
            'SAVE_PENILAIAN_KREATIVITAS',
            data.id,
            `Penilaian kreativitas kelompok disimpan: Yel=${yel}, Seni=${seni}, Vlog=${vlog}`,
            adminNama
        );

        return { success: true, data };
    } catch (error) {
        console.error('Error in savePenilaianKreativitas:', error);
        return { success: false, error: error.message || 'Gagal menyimpan penilaian kreativitas.' };
    }
};
