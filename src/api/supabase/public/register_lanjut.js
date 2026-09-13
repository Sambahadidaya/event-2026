'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { checkPesertaRegisteredForLomba, checkPesertaPoseWajibByNimAndKampus, insertPesertaBatch } from './peserta';
import { insertTeamPublic, insertTeamMembers } from './team';
import { generateKodePeserta, generateNim } from '@/lib/kodeFormUtils';
import { parseNIM, semesterToAngkatan } from '@/lib/lombaData';

export const submitRegisterLanjut = async ({
    formConfig,
    statusWajib, // 'belum' | 'sudah'
    kategori,
    teamName,
    teamContent,
    members,
    buktiUrl,
    logoUrl,
    metodePembayaran,
    selectedJenisKategori,
    token
}) => {
    try {
        if (!formConfig || !formConfig.id) {
            throw new Error('Form configuration tidak valid.');
        }
        if (!members || !Array.isArray(members) || members.length === 0) {
            throw new Error('Data anggota pendaftar wajib diisi.');
        }

        const isMhsLP3I = kategori === 'Mahasiswa LP3I';
        const isCampur = kategori === 'Campur';

        // 1. Cek pendaftaran ganda pada lomba yang sama
        if ((isMhsLP3I || isCampur) && formConfig.nama_lomba) {
            for (const m of members) {
                if (isMhsLP3I || m.memberType === 'lp3i') {
                    const finalKampusCek = m.kampus === 'Lainnya' ? m.kampusLainnya : m.kampus;
                    if (m.nim && finalKampusCek) {
                        const alreadyRegistered = await checkPesertaRegisteredForLomba(m.nim, finalKampusCek, formConfig.nama_lomba);
                        if (alreadyRegistered) {
                            return {
                                success: false,
                                error: `Pendaftaran ditolak: Anggota ${m.nama || ''} (NIM ${m.nim}) dari kampus ${finalKampusCek} sudah terdaftar di lomba ${formConfig.nama_lomba}.`
                            };
                        }
                    }
                }
            }
        }

        // 2. Jika user memilih "Sudah Mengisi Form Wajib POSE" atau tim Campur, verifikasi keberadaan data form wajib
        const fetchedWajibData = [];
        if (statusWajib === 'sudah' && isMhsLP3I) {
            for (const m of members) {
                const finalKampusReg = m.kampus === 'Lainnya' ? m.kampusLainnya : m.kampus;
                const exists = await checkPesertaPoseWajibByNimAndKampus(m.nim, finalKampusReg);
                if (!exists) {
                    return {
                        success: false,
                        error: `Pendaftaran gagal: NIM ${m.nim} dan Kampus ${finalKampusReg} atas nama ${m.nama} belum terdaftar pada Form Wajib POSE.`
                    };
                }
                fetchedWajibData.push(exists);
            }
        } else if (isCampur) {
            for (const m of members) {
                if (m.memberType === 'lp3i') {
                    const finalKampusReg = m.kampus === 'Lainnya' ? m.kampusLainnya : m.kampus;
                    const exists = await checkPesertaPoseWajibByNimAndKampus(m.nim, finalKampusReg);
                    if (!exists) {
                        return {
                            success: false,
                            error: `Pendaftaran gagal: Anggota LP3I atas nama ${m.nama} (NIM ${m.nim}, Kampus ${finalKampusReg}) belum terdaftar pada Form Wajib POSE.`
                        };
                    }
                    if (exists.status_pembayaran?.toLowerCase() !== 'lunas') {
                        return {
                            success: false,
                            error: `Pendaftaran gagal: Pembayaran Form Wajib untuk anggota LP3I ${m.nama} (NIM ${m.nim}) belum diverifikasi oleh panitia (Status: ${exists.status_pembayaran || 'pending'}).`
                        };
                    }
                    fetchedWajibData.push(exists);
                } else {
                    fetchedWajibData.push(null);
                }
            }
        }

        // 3. Generate Token Pendaftar jika belum ada
        const userToken = token || crypto.randomUUID();

        // 4. Generate Kode Peserta
        const kodePesertaReg = formConfig.kode_form ? generateKodePeserta(formConfig.kode_form) : null;

        // 5. Insert Team
        const finalTeamName = teamName || members[0].nama;
        const finalTeamContent = teamContent || `Pendaftaran Form Register Lanjut Lomba ${formConfig.nama_lomba}`;

        const teamRes = await insertTeamPublic({
            title: finalTeamName,
            content: finalTeamContent,
            type: 'pose',
            jenis_lomba: formConfig.jenis_lomba,
            nama_lomba: formConfig.nama_lomba,
            bukti_bayar: buktiUrl,
            gambar: logoUrl,
            user_token: userToken,
            kode_form: kodePesertaReg,
            jenis_kategori: selectedJenisKategori || null
        });

        if (!teamRes.success) {
            if (teamRes.error && (teamRes.error.includes('unique_title_team') || teamRes.error.includes('duplicate key') || teamRes.error.includes('duplicate') || teamRes.error.includes('sudah digunakan') || teamRes.error.includes('sudah dipakai') || teamRes.error.includes('Nama Team/Perwakilan'))) {
                throw new Error("Nama Team/Perwakilan sudah digunakan");
            }
            throw new Error(teamRes.error || 'Gagal menyimpan data tim.');
        }

        const teamData = teamRes.data;
        if (!teamData || !teamData.id) {
            throw new Error('Gagal mendapatkan ID tim setelah insert.');
        }

        // 6. Prepare Team Members & Peserta
        const teamMembersToInsert = [];
        const pesertaToInsert = [];

        for (let i = 0; i < members.length; i++) {
            const m = members[i];
            const duaAngka = String(i + 1).padStart(2, '0');
            const mDataWajib = fetchedWajibData[i] || null;

            let finalKampusReg = kategori;
            let finalNimReg = kategori;
            let finalProdiReg = kategori;
            let finalAngkatanReg = kategori;
            let finalKelasReg = 'Reguler';

            if (isMhsLP3I) {
                finalKampusReg = m.kampus === 'Lainnya' ? m.kampusLainnya : m.kampus;
                finalNimReg = m.nim;
                if (finalKampusReg === 'Kampus Bandung') {
                    const parsedNIM = parseNIM(m.nim, finalKampusReg);
                    if (parsedNIM) {
                        finalProdiReg = parsedNIM.prodiName;
                        finalAngkatanReg = parsedNIM.angkatan;
                    }
                } else {
                    if (mDataWajib) {
                        finalProdiReg = mDataWajib.prodi || m.prodi;
                        finalAngkatanReg = mDataWajib.angkatan || semesterToAngkatan(mDataWajib.semester || m.semester);
                    } else {
                        finalProdiReg = m.prodi;
                        finalAngkatanReg = semesterToAngkatan(m.semester);
                    }
                }
                finalKelasReg = mDataWajib && mDataWajib.kelas ? mDataWajib.kelas : (m.kelas || 'Reguler');
            } else if (isCampur) {
                if (m.memberType === 'lp3i') {
                    finalKampusReg = m.kampus === 'Lainnya' ? m.kampusLainnya : m.kampus;
                    finalNimReg = m.nim;
                    if (finalKampusReg === 'Kampus Bandung') {
                        const parsedNIM = parseNIM(m.nim, finalKampusReg);
                        if (parsedNIM) {
                            finalProdiReg = parsedNIM.prodiName;
                            finalAngkatanReg = parsedNIM.angkatan;
                        }
                    } else {
                        finalProdiReg = m.prodi || (mDataWajib ? mDataWajib.prodi : 'Mahasiswa LP3I');
                        finalAngkatanReg = m.angkatan || (mDataWajib ? mDataWajib.angkatan : (m.semester ? semesterToAngkatan(m.semester) : null));
                    }
                    finalKelasReg = m.kelas || (mDataWajib ? mDataWajib.kelas : 'Reguler');
                } else {
                    finalKampusReg = 'Luar Kampus';
                    finalNimReg = generateNim(`Campur${duaAngka}`, m.nama, m.email_wa);
                    finalProdiReg = 'Campur';
                    finalAngkatanReg = 'Campur';
                    finalKelasReg = 'Campur';
                }
            } else if (kategori === 'Dosen') {
                finalKampusReg = m.kampus;
                finalNimReg = generateNim(`Dosen${duaAngka}`, m.nama, m.email_wa);
                finalKelasReg = kategori;
            } else if (kategori === 'Alumni LP3I') {
                finalKampusReg = m.kampus;
                finalProdiReg = m.prodi;
                finalAngkatanReg = m.angkatan;
                finalNimReg = generateNim(`Alumni${duaAngka}`, m.nama, m.email_wa);
                finalKelasReg = kategori;
            } else if (kategori === 'Umum') {
                if (m.isStudent) {
                    finalKampusReg = m.kampus;
                    finalProdiReg = m.prodi;
                    finalAngkatanReg = semesterToAngkatan(m.semester);
                    finalNimReg = generateNim(`MahasiswaUmum${duaAngka}`, m.nama, m.email_wa);
                } else {
                    finalNimReg = generateNim(`Umum${duaAngka}`, m.nama, m.email_wa);
                }
                finalKelasReg = kategori;
            } else if (kategori === 'Siswa') {
                finalKampusReg = m.kampus;
                finalProdiReg = m.prodi;
                finalAngkatanReg = semesterToAngkatan(m.semester);
                finalNimReg = generateNim(`Siswa${duaAngka}`, m.nama, m.email_wa);
                finalKelasReg = kategori;
            }

            teamMembersToInsert.push({
                team_id: teamData.id,
                nama: m.nama,
                jabatan: m.jabatan || 'Peserta',
                kode: finalNimReg,
                id_ml: (formConfig.nama_lomba === 'Mobile Legend' || formConfig.nama_lomba === 'Mobile Legends') ? m.id_ml || null : null
            });

            pesertaToInsert.push({
                kategori: kategori,
                nama: m.nama,
                kampus: finalKampusReg,
                nim: finalNimReg,
                prodi: finalProdiReg,
                angkatan: finalAngkatanReg,
                semester: mDataWajib && mDataWajib.semester ? parseInt(mDataWajib.semester, 10) : (m.semester ? parseInt(m.semester, 10) : null),
                email_wa: mDataWajib ? mDataWajib.email_wa : m.email_wa,
                bukti_bayar: buktiUrl,
                status_pembayaran: 'pending',
                site_type: formConfig.site || 'pose',
                jenis_form: 'register',
                metode_pembayaran: metodePembayaran || null,
                kode_form: kodePesertaReg,
                kelas: finalKelasReg
            });
        }

        // 7. Insert Team Members
        const membersRes = await insertTeamMembers(teamMembersToInsert);
        if (!membersRes.success) throw new Error(membersRes.error || 'Gagal menyimpan anggota tim.');

        // 8. Insert Peserta Batch
        const pesertaRes = await insertPesertaBatch(pesertaToInsert);
        if (!pesertaRes.success) {
            if (pesertaRes.error && pesertaRes.error.includes('unique_email_wa_peserta')) {
                throw new Error("Email atau WhatsApp yang digunakan sudah terdaftar. Mohon gunakan kontak yang berbeda.");
            }
            throw new Error(pesertaRes.error || 'Gagal menyimpan peserta.');
        }

        return {
            success: true,
            userToken: userToken
        };
    } catch (error) {
        console.error("Internal Log - Error submitRegisterLanjut:", error);
        return {
            success: false,
            error: error.message || 'Terjadi kesalahan internal pada server saat mendaftar.'
        };
    }
};
