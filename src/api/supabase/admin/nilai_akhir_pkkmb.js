'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { checkAdminAuth } from './audit';
import { getKabimFilter } from '@/lib/adminRoleData';

/**
 * Mengambil rekap kalkulasi nilai akhir PKKMB 2026 secara komprehensif
 * Berdasarkan 5 kriteria: Kehadiran, Keaktifan, Kedisiplinan, Penugasan, Kreativitas
 */
export const getRekapNilaiAkhirPkkmb = async ({
    kategori = 'semua', // 'semua' | 'reguler' | 'nonreg'
    kelompok_id = null,
    search = ''
} = {}) => {
    try {
        const { user, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        // 1. Cek hak akses role Kabim
        const { data: adminRecord, error: adminErr } = await supabaseAdmin
            .from('admins')
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle();

        if (adminErr) throw adminErr;
        const currentRole = adminRecord?.role || '';
        const lockedUrutan = getKabimFilter(currentRole);

        // 2. Fetch Master Bobot Penilaian (Reguler & Non-Reguler)
        const { data: masterBobotList, error: bobotErr } = await supabaseAdmin
            .from('master_penilaian_pkkmb')
            .select('kategori_peserta, kode_kriteria, bobot_persen, aktif')
            .eq('aktif', true);

        if (bobotErr) throw bobotErr;

        const bobotMap = { reguler: {}, nonreg: {} };
        (masterBobotList || []).forEach(b => {
            const kat = b.kategori_peserta || 'reguler';
            if (!bobotMap[kat]) bobotMap[kat] = {};
            bobotMap[kat][b.kode_kriteria] = (parseFloat(b.bobot_persen) || 20) / 100;
        });

        // Pastikan fallback default 20% jika kosong
        const defaultBobot = {
            kehadiran: 0.20,
            keaktifan: 0.20,
            kedisiplinan: 0.20,
            penugasan: 0.20,
            kreativitas: 0.20
        };
        const bobotReguler = { ...defaultBobot, ...bobotMap.reguler };
        const bobotNonreg = { ...defaultBobot, ...bobotMap.nonreg };

        // 3. Fetch Sesi Jadwal Acara PKKMB (semua sesi absensi)
        const { data: jadwalAcaraList, error: jadwalErr } = await supabaseAdmin
            .from('jadwal_acara_pkkmb')
            .select('id, judul')
            .order('created_at', { ascending: true });

        if (jadwalErr) throw jadwalErr;
        const totalSesiAcara = (jadwalAcaraList || []).length;

        // Ekstraksi total hari unik PKKMB untuk target upload harian sosmed kelompok
        const hariSet = new Set();
        (jadwalAcaraList || []).forEach(item => {
            const m = (item.judul || '').match(/^(Hari\s*\d+|Day\s*\d+|Technical\s*Meeting|Outbound)/i);
            if (m) hariSet.add(m[1].toLowerCase());
            else if (item.judul) hariSet.add(item.judul.toLowerCase());
        });
        const totalHariAcara = Math.max(1, hariSet.size || 5);

        // 4. Fetch Kelompok & Anggota Kelompok
        let kelQuery = supabaseAdmin
            .from('kelompok')
            .select(`
                id,
                urutan,
                nama_kelompok,
                nama_kabim,
                jenis_kelompok,
                kelompok_members (
                    id,
                    nama_anggota,
                    nim_anggota,
                    kelompok_id
                )
            `)
            .order('urutan', { ascending: true });

        if (Array.isArray(lockedUrutan) && lockedUrutan.length > 0) {
            kelQuery = kelQuery.in('urutan', lockedUrutan);
        }

        if (kelompok_id) {
            kelQuery = kelQuery.eq('id', kelompok_id);
        }

        const { data: kelompokList, error: kelErr } = await kelQuery;
        if (kelErr) throw kelErr;

        // Flatten semua anggota kelompok
        let allMembers = [];
        const kelompokLookup = {};
        (kelompokList || []).forEach(k => {
            kelompokLookup[k.id] = k;
            (k.kelompok_members || []).forEach(m => {
                allMembers.push({
                    ...m,
                    kelompok: k
                });
            });
        });

        if (allMembers.length === 0) {
            return {
                success: true,
                data: [],
                stats: {
                    total_peserta: 0,
                    rata_rata_nilai: 0,
                    nilai_tertinggi: 0,
                    nilai_terendah: 0,
                    total_lulus: 0,
                    total_tidak_lulus: 0,
                    persen_kelulusan: 0
                }
            };
        }

        const memberIds = allMembers.map(m => m.id);
        const allNims = allMembers.map(m => m.nim_anggota).filter(Boolean);
        const kelompokIds = Object.keys(kelompokLookup);

        // 5. Fetch Data Pendukung secara Paralel
        const [
            pesertaRes,
            absensiRes,
            keaktifanRes,
            pelanggaranRes,
            materiRes,
            tugasMateriRes,
            tugasSosmedRes,
            tugasBarangRes,
            kreativitasRes
        ] = await Promise.all([
            // Info kelas peserta (reguler / nonreg)
            allNims.length > 0
                ? supabaseAdmin.from('peserta').select('nim, kelas, prodi, kampus').in('nim', allNims)
                : Promise.resolve({ data: [] }),

            // Absensi peserta
            memberIds.length > 0
                ? supabaseAdmin.from('absensi_peserta_pkkmb').select('kelompok_members_id, jenis_absensi').in('kelompok_members_id', memberIds)
                : Promise.resolve({ data: [] }),

            // Keaktifan harian
            memberIds.length > 0
                ? supabaseAdmin.from('penilaian_keaktifan_pkkmb').select('kelompok_members_id, label_hari, skor_keaktifan').in('kelompok_members_id', memberIds)
                : Promise.resolve({ data: [] }),

            // Riwayat pelanggaran
            memberIds.length > 0
                ? supabaseAdmin.from('riwayat_pelanggaran').select('peserta_id, master_pelanggaran(poin_pengurangan, jenis_pelanggaran)').in('peserta_id', memberIds)
                : Promise.resolve({ data: [] }),

            // Daftar materi
            supabaseAdmin.from('materi_pkkmb').select('id, judul'),

            // Tugas resume materi
            allNims.length > 0
                ? supabaseAdmin.from('tugas_materi').select('nim, materi_id, nilai').in('nim', allNims)
                : Promise.resolve({ data: [] }),

            // Tugas sosmed
            kelompokIds.length > 0
                ? supabaseAdmin.from('tugas_sosmed_pkkmb').select('id, tipe_tugas, kelompok_id, kelompok_members_id, nilai')
                : Promise.resolve({ data: [] }),

            // Tugas barang bawaan
            kelompokIds.length > 0
                ? supabaseAdmin.from('tugas_barang_pkkmb').select('id, tipe_barang, kelompok_id, kelompok_members_id, total_barang_wajib, barang_dibawa')
                : Promise.resolve({ data: [] }),

            // Nilai kreativitas kelompok
            kelompokIds.length > 0
                ? supabaseAdmin.from('penilaian_kreativitas_pkkmb').select('kelompok_id, skor_yelyel, skor_kreasi_seni, skor_vlog, nilai_akhir').in('kelompok_id', kelompokIds)
                : Promise.resolve({ data: [] })
        ]);

        // Map data pendukung
        const pesertaMap = {};
        (pesertaRes.data || []).forEach(p => { pesertaMap[p.nim] = p; });

        const absensiMap = {};
        (absensiRes.data || []).forEach(a => {
            if (!absensiMap[a.kelompok_members_id]) absensiMap[a.kelompok_members_id] = [];
            absensiMap[a.kelompok_members_id].push(a);
        });

        const keaktifanMap = {};
        (keaktifanRes.data || []).forEach(k => {
            if (!keaktifanMap[k.kelompok_members_id]) keaktifanMap[k.kelompok_members_id] = [];
            keaktifanMap[k.kelompok_members_id].push(k);
        });

        const pelanggaranMap = {};
        (pelanggaranRes.data || []).forEach(p => {
            if (!pelanggaranMap[p.peserta_id]) pelanggaranMap[p.peserta_id] = [];
            pelanggaranMap[p.peserta_id].push(p);
        });

        const totalMateri = (materiRes.data || []).length;
        const tugasMateriMap = {};
        (tugasMateriRes.data || []).forEach(t => {
            if (!tugasMateriMap[t.nim]) tugasMateriMap[t.nim] = [];
            tugasMateriMap[t.nim].push(t);
        });

        const tugasSosmedKlpMap = {};
        const tugasSosmedIndMap = {};
        (tugasSosmedRes.data || []).forEach(s => {
            if (s.tipe_tugas === 'kelompok' && s.kelompok_id) {
                if (!tugasSosmedKlpMap[s.kelompok_id]) tugasSosmedKlpMap[s.kelompok_id] = [];
                tugasSosmedKlpMap[s.kelompok_id].push(s);
            } else if (s.kelompok_members_id) {
                if (!tugasSosmedIndMap[s.kelompok_members_id]) tugasSosmedIndMap[s.kelompok_members_id] = [];
                tugasSosmedIndMap[s.kelompok_members_id].push(s);
            }
        });

        const tugasBarangKlpMap = {};
        const tugasBarangIndMap = {};
        (tugasBarangRes.data || []).forEach(b => {
            if (b.tipe_barang === 'kelompok' && b.kelompok_id) {
                if (!tugasBarangKlpMap[b.kelompok_id]) tugasBarangKlpMap[b.kelompok_id] = [];
                tugasBarangKlpMap[b.kelompok_id].push(b);
            } else if (b.kelompok_members_id) {
                if (!tugasBarangIndMap[b.kelompok_members_id]) tugasBarangIndMap[b.kelompok_members_id] = [];
                tugasBarangIndMap[b.kelompok_members_id].push(b);
            }
        });

        const kreativitasMap = {};
        (kreativitasRes.data || []).forEach(k => {
            const avg = k.nilai_akhir !== null && k.nilai_akhir !== undefined
                ? Number(k.nilai_akhir)
                : ((Number(k.skor_yelyel || 0) + Number(k.skor_kreasi_seni || 0) + Number(k.skor_vlog || 0)) / 3);
            kreativitasMap[k.kelompok_id] = Number(avg.toFixed(2));
        });

        // 6. Hitung Nilai Akhir Tiap Peserta
        const calculatedList = allMembers.map(member => {
            const pInfo = pesertaMap[member.nim_anggota] || {};
            const kel = member.kelompok || {};

            // Deteksi kategori reguler vs nonreg
            const isNonreg = (kel.jenis_kelompok === 'nonreg') ||
                (pInfo.kelas && pInfo.kelas.toLowerCase().includes('non'));
            const kategoriPeserta = isNonreg ? 'nonreg' : 'reguler';
            const activeWeights = isNonreg ? bobotNonreg : bobotReguler;

            // --- A. Nilai Kehadiran ---
            // Rumus: ((Hadir * 100) + (Sakit/Izin * 40) + (Alpha * 0)) / totalSesi
            const absensiList = absensiMap[member.id] || [];
            let totalHadir = 0;
            let totalSakitIzin = 0;
            let totalAlpha = 0;

            absensiList.forEach(a => {
                const jenis = (a.jenis_absensi || '').toLowerCase();
                if (jenis === 'hadir') totalHadir++;
                else if (jenis === 'sakit' || jenis === 'izin') totalSakitIzin++;
                else if (jenis === 'alpha') totalAlpha++;
            });

            // Sisa sesi yang belum diabsen dianggap alpha
            const sesiTercatat = totalHadir + totalSakitIzin + totalAlpha;
            const sisaSesi = Math.max(0, totalSesiAcara - sesiTercatat);
            totalAlpha += sisaSesi;

            const pembagiSesi = totalSesiAcara > 0 ? totalSesiAcara : 1;
            const nilaiKehadiran = totalSesiAcara > 0
                ? Number((((totalHadir * 100) + (totalSakitIzin * 40) + (totalAlpha * 0)) / pembagiSesi).toFixed(2))
                : 100.0;

            // --- B. Nilai Keaktifan ---
            // Rata-rata dari hari yang dinilai, default 60 (KKM) jika belum diinput
            const keaktifanList = keaktifanMap[member.id] || [];
            let nilaiKeaktifan = 60.0;
            if (keaktifanList.length > 0) {
                const sumAktif = keaktifanList.reduce((acc, curr) => acc + (Number(curr.skor_keaktifan) || 60), 0);
                nilaiKeaktifan = Number((sumAktif / keaktifanList.length).toFixed(2));
            }

            // --- C. Nilai Kedisiplinan ---
            // 100 - total poin pengurangan
            const pelList = pelanggaranMap[member.id] || [];
            let totalPoinPengurangan = 0;
            pelList.forEach(p => {
                const mp = p.master_pelanggaran;
                if (mp) {
                    const poin = mp.poin_pengurangan !== undefined && mp.poin_pengurangan !== null
                        ? Number(mp.poin_pengurangan)
                        : (mp.jenis_pelanggaran === 'Berat' ? 10 : (mp.jenis_pelanggaran === 'Ringan' ? 2 : 5));
                    totalPoinPengurangan += poin;
                }
            });
            const nilaiKedisiplinan = Number(Math.max(0, 100 - totalPoinPengurangan).toFixed(2));

            // --- D. Nilai Penugasan ---
            // Sub 1: Resume Materi (0 atau 5)
            const listTugasMateri = tugasMateriMap[member.nim_anggota] || [];
            let sumNilaiResume = 0;
            listTugasMateri.forEach(tm => {
                const val = tm.nilai !== null && tm.nilai !== undefined ? Number(tm.nilai) : 5;
                sumNilaiResume += val;
            });
            const targetSkorResume = Math.max(1, totalMateri * 5);
            const skorResume = totalMateri > 0
                ? Number(Math.min(100, (sumNilaiResume / targetSkorResume) * 100).toFixed(2))
                : 100.0;

            // Sub 2: Sosmed Kelompok
            const listSosmedKlp = tugasSosmedKlpMap[kel.id] || [];
            let sumNilaiSosmedKlp = 0;
            listSosmedKlp.forEach(sk => {
                const val = sk.nilai !== null && sk.nilai !== undefined ? Number(sk.nilai) : 5;
                sumNilaiSosmedKlp += val;
            });
            const targetSosmedKlp = Math.max(1, totalHariAcara * 5);
            const skorSosmedKlp = Number(Math.min(100, (sumNilaiSosmedKlp / targetSosmedKlp) * 100).toFixed(2));

            // Sub 3: Sosmed Individu
            const listSosmedInd = tugasSosmedIndMap[member.id] || [];
            let skorSosmedInd = 0;
            if (listSosmedInd.length > 0) {
                const val = listSosmedInd[0].nilai !== null && listSosmedInd[0].nilai !== undefined
                    ? Number(listSosmedInd[0].nilai)
                    : 5;
                skorSosmedInd = Number(Math.min(100, (val / 5) * 100).toFixed(2));
            }

            // Sub 4: Barang Bawaan (kelompok & individu)
            const listBarang = [...(tugasBarangKlpMap[kel.id] || []), ...(tugasBarangIndMap[member.id] || [])];
            let skorBarang = 100.0;
            if (listBarang.length > 0) {
                const percentages = listBarang.map(b => {
                    const wajib = Math.max(1, b.total_barang_wajib || 1);
                    const bawa = Math.min(wajib, Math.max(0, b.barang_dibawa || 0));
                    return (bawa / wajib) * 100;
                });
                skorBarang = Number((percentages.reduce((a, b) => a + b, 0) / percentages.length).toFixed(2));
            }

            // Gabungan Penugasan Sesuai Panduan
            const skorKonten = (skorResume + skorSosmedKlp + skorSosmedInd) / 3;
            const nilaiPenugasan = Number(((skorKonten + skorBarang) / 2).toFixed(2));

            // --- E. Nilai Kreativitas ---
            const nilaiKreativitas = kreativitasMap[kel.id] || 0.0;

            // --- F. Nilai Akhir Terbobot ---
            const nilaiAkhir = Number((
                (nilaiKehadiran * activeWeights.kehadiran) +
                (nilaiKeaktifan * activeWeights.keaktifan) +
                (nilaiKedisiplinan * activeWeights.kedisiplinan) +
                (nilaiPenugasan * activeWeights.penugasan) +
                (nilaiKreativitas * activeWeights.kreativitas)
            ).toFixed(2));

            const statusKelulusan = nilaiAkhir >= 60.0 ? 'LULUS' : 'TIDAK LULUS';

            return {
                member_id: member.id,
                nama: member.nama_anggota,
                nim: member.nim_anggota,
                kampus: pInfo.kampus || '-',
                prodi: pInfo.prodi || '-',
                kelas: pInfo.kelas || (isNonreg ? 'Non-Reguler' : 'Reguler'),
                kategori: kategoriPeserta,
                kelompok_id: kel.id,
                kelompok_urutan: kel.urutan,
                kelompok_nama: kel.nama_kelompok,
                nama_kabim: kel.nama_kabim,
                detail_bobot: activeWeights,
                nilai_kehadiran: nilaiKehadiran,
                nilai_keaktifan: nilaiKeaktifan,
                nilai_kedisiplinan: nilaiKedisiplinan,
                nilai_penugasan: nilaiPenugasan,
                nilai_kreativitas: nilaiKreativitas,
                nilai_akhir: nilaiAkhir,
                status_kelulusan: statusKelulusan,
                // Rincian sub untuk keperluan tooltip / modal
                breakdown: {
                    kehadiran: { hadir: totalHadir, sakit_izin: totalSakitIzin, alpha: totalAlpha, total_sesi: totalSesiAcara },
                    penugasan: { resume: skorResume, sosmed_klp: skorSosmedKlp, sosmed_ind: skorSosmedInd, barang: skorBarang },
                    pelanggaran_poin: totalPoinPengurangan,
                    total_hari_aktif: keaktifanList.length
                }
            };
        });

        // 7. Filter Kategori dan Search jika ada
        let filtered = calculatedList;
        if (kategori && kategori !== 'semua') {
            filtered = filtered.filter(item => item.kategori === kategori);
        }

        if (search && search.trim()) {
            const q = search.trim().toLowerCase();
            filtered = filtered.filter(item =>
                (item.nama && item.nama.toLowerCase().includes(q)) ||
                (item.nim && item.nim.toLowerCase().includes(q)) ||
                (item.kelompok_nama && item.kelompok_nama.toLowerCase().includes(q))
            );
        }

        // 8. Hitung Statistik
        const totalPeserta = filtered.length;
        const totalLulus = filtered.filter(f => f.status_kelulusan === 'LULUS').length;
        const totalTidakLulus = totalPeserta - totalLulus;
        const sumNilai = filtered.reduce((acc, curr) => acc + curr.nilai_akhir, 0);
        const rataRata = totalPeserta > 0 ? Number((sumNilai / totalPeserta).toFixed(2)) : 0;
        const nilaiTertinggi = totalPeserta > 0 ? Math.max(...filtered.map(f => f.nilai_akhir)) : 0;
        const nilaiTerendah = totalPeserta > 0 ? Math.min(...filtered.map(f => f.nilai_akhir)) : 0;
        const persenKelulusan = totalPeserta > 0 ? Number(((totalLulus / totalPeserta) * 100).toFixed(1)) : 0;

        return {
            success: true,
            data: filtered,
            stats: {
                total_peserta: totalPeserta,
                rata_rata_nilai: rataRata,
                nilai_tertinggi: nilaiTertinggi,
                nilai_terendah: nilaiTerendah,
                total_lulus: totalLulus,
                total_tidak_lulus: totalTidakLulus,
                persen_kelulusan: persenKelulusan
            },
            master_bobot: {
                reguler: bobotReguler,
                nonreg: bobotNonreg
            }
        };
    } catch (error) {
        console.error('Error in getRekapNilaiAkhirPkkmb:', error);
        return {
            success: false,
            error: error.message || 'Gagal menghitung rekap nilai akhir.',
            data: [],
            stats: {
                total_peserta: 0,
                rata_rata_nilai: 0,
                nilai_tertinggi: 0,
                nilai_terendah: 0,
                total_lulus: 0,
                total_tidak_lulus: 0,
                persen_kelulusan: 0
            }
        };
    }
};
