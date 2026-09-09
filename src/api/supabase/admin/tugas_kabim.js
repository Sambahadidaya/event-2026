'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { checkAdminAuth, insertAuditLog } from './audit';
import { getKabimFilter } from '@/lib/adminRoleData';

/**
 * Mengambil daftar materi PKKMB untuk dropdown selector PJ Kabim
 */
export const getMateriListForKabim = async () => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        const { data, error } = await supabaseAdmin
            .from('materi_pkkmb')
            .select('id, judul, pemateri, tanggal, status, foto_header, tutup')
            .order('tanggal', { ascending: true });

        if (error) throw error;
        return { success: true, data: data || [] };
    } catch (error) {
        console.error('Internal Log - Error fetching materi list for kabim:', error);
        return { success: false, error: 'Terjadi kesalahan saat memuat daftar materi.', data: [] };
    }
};

/**
 * Mengambil daftar anggota kelompok & status tugas berdasarkan materiId dan hak akses PJ Kabim
 * @param {string} materiId UUID dari materi_pkkmb
 */
export const getTugasKabimByMateri = async (materiId) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!materiId) {
            return { success: true, data: [] };
        }

        // 1. Dapatkan role admin & filter urutan kelompok
        const { data: adminRecord, error: adminQueryError } = await supabaseAdmin
            .from('admins')
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle();

        if (adminQueryError) throw adminQueryError;
        const currentRole = adminRecord?.role || '';
        const lockedUrutan = getKabimFilter(currentRole);

        // 2. Fetch data materi yang dipilih untuk judul materi
        const { data: materiData, error: materiErr } = await supabaseAdmin
            .from('materi_pkkmb')
            .select('id, judul')
            .eq('id', materiId)
            .maybeSingle();

        if (materiErr) throw materiErr;
        const materiJudul = materiData?.judul || 'Materi';

        // 3. Query kelompok & kelompok_members sesuai filter hak akses
        let kelompokQuery = supabaseAdmin
            .from('kelompok')
            .select('id, urutan, nama_kelompok, nama_kabim, kelompok_members(id, nama_anggota, nim_anggota)')
            .order('urutan', { ascending: true });

        if (lockedUrutan !== null && Array.isArray(lockedUrutan) && lockedUrutan.length > 0) {
            kelompokQuery = kelompokQuery.in('urutan', lockedUrutan);
        }

        const { data: kelompokList, error: kelompokError } = await kelompokQuery;
        if (kelompokError) throw kelompokError;

        // Kumpulkan semua NIM anggota
        const allNims = [];
        (kelompokList || []).forEach(k => {
            (k.kelompok_members || []).forEach(m => {
                if (m.nim_anggota) {
                    allNims.push(m.nim_anggota);
                }
            });
        });

        if (allNims.length === 0) {
            return { success: true, data: [] };
        }

        // 4. Query detail data peserta (kampus, prodi, kelas, angkatan)
        const { data: pesertaList, error: pesertaError } = await supabaseAdmin
            .from('peserta')
            .select('nim, nama, kampus, prodi, kelas, angkatan')
            .in('nim', allNims);

        if (pesertaError) throw pesertaError;

        const pesertaMap = {};
        (pesertaList || []).forEach(p => {
            if (p.nim) {
                pesertaMap[p.nim] = p;
            }
        });

        // 5. Query data tugas_materi untuk materi_id & nims yang relevan
        const { data: tugasList, error: tugasError } = await supabaseAdmin
            .from('tugas_materi')
            .select('id, materi_id, nama, nim, kampus, file_tugas, created_at, keterangan, nilai')
            .eq('materi_id', materiId)
            .in('nim', allNims);

        if (tugasError) throw tugasError;

        const tugasMap = {};
        (tugasList || []).forEach(t => {
            if (t.nim) {
                tugasMap[t.nim] = t;
            }
        });

        // 6. Cross-reference daftar anggota dengan tugas_materi
        const combinedData = [];
        (kelompokList || []).forEach(kel => {
            const members = Array.isArray(kel.kelompok_members) ? kel.kelompok_members : [];
            // Sort nama anggota alfabetis
            members.sort((a, b) => (a.nama_anggota || '').localeCompare(b.nama_anggota || ''));

            members.forEach(m => {
                const pInfo = pesertaMap[m.nim_anggota] || {};
                const tInfo = tugasMap[m.nim_anggota];

                if (tInfo) {
                    combinedData.push({
                        id: tInfo.id,
                        tugas_id: tInfo.id,
                        materi_id: materiId,
                        materi_judul: materiJudul,
                        kelompok_id: kel.id,
                        kelompok_urutan: kel.urutan,
                        kelompok_nama: kel.nama_kelompok,
                        nama: tInfo.nama || m.nama_anggota,
                        nim: m.nim_anggota,
                        kampus: tInfo.kampus || pInfo.kampus || '-',
                        prodi: pInfo.prodi || '-',
                        kelas: pInfo.kelas || '-',
                        angkatan: pInfo.angkatan || '-',
                        status_tugas: true, // Sudah
                        bukti_tugas: tInfo.file_tugas || null,
                        nilai: tInfo.nilai !== undefined && tInfo.nilai !== null ? Number(tInfo.nilai) : null,
                        created_at: tInfo.created_at || null,
                        keterangan: tInfo.keterangan || null
                    });
                } else {
                    combinedData.push({
                        id: `no_tugas_${kel.id}_${m.nim_anggota}`,
                        tugas_id: null,
                        materi_id: materiId,
                        materi_judul: materiJudul,
                        kelompok_id: kel.id,
                        kelompok_urutan: kel.urutan,
                        kelompok_nama: kel.nama_kelompok,
                        nama: m.nama_anggota,
                        nim: m.nim_anggota,
                        kampus: pInfo.kampus || '-',
                        prodi: pInfo.prodi || '-',
                        kelas: pInfo.kelas || '-',
                        angkatan: pInfo.angkatan || '-',
                        status_tugas: false, // Belum
                        bukti_tugas: null,
                        nilai: null,
                        created_at: null,
                        keterangan: null
                    });
                }
            });
        });

        return { success: true, data: combinedData };
    } catch (error) {
        console.error('Internal Log - Error fetching tugas kabim by materi:', error);
        return { success: false, error: 'Terjadi kesalahan saat memuat data tugas kabim.', data: [] };
    }
};

/**
 * Menghapus tugas materi tertentu
 * @param {string} id UUID tugas_materi
 */
export const deleteTugasKabim = async (id) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id) throw new Error('ID tugas wajib disertakan');

        const { error } = await supabaseAdmin
            .from('tugas_materi')
            .delete()
            .eq('id', id);

        if (error) throw error;

        await insertAuditLog(user.email, 'DELETE_TUGAS_KABIM', id, 'Tugas materi peserta dihapus oleh PJ Kabim', adminNama);
        return { success: true };
    } catch (error) {
        console.error('Internal Log - Error deleting tugas kabim:', error);
        return { success: false, error: 'Terjadi kesalahan saat menghapus tugas.' };
    }
};

/**
 * Mengupdate nilai tugas materi (0 = tidak mengerjakan, 5 = mengerjakan)
 * @param {Object} params
 * @param {string} params.id - UUID tugas_materi
 * @param {number} params.nilai - nilai (0 atau 5)
 */
export const updateNilaiTugasMateri = async ({ id, nilai }) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id) throw new Error('ID tugas materi wajib diisi.');

        const numNilai = parseFloat(nilai);
        if (isNaN(numNilai) || numNilai < 0) {
            throw new Error('Nilai harus berupa angka valid (0 atau 5).');
        }

        const { data, error } = await supabaseAdmin
            .from('tugas_materi')
            .update({ nilai: numNilai })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        await insertAuditLog(
            user.email,
            'UPDATE_NILAI_TUGAS_MATERI',
            id,
            `Nilai tugas resume materi peserta diubah menjadi ${numNilai}`,
            adminNama
        );

        return { success: true, data };
    } catch (error) {
        console.error('Error in updateNilaiTugasMateri:', error);
        return { success: false, error: error.message || 'Gagal memperbarui nilai tugas resume materi.' };
    }
};
