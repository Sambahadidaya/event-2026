'use client';

import { useState, useEffect } from 'react';
import { uploadFile as serverUploadFile } from '@/api/supabase/storage';
import { insertPeserta, insertPesertaBatch, checkPesertaPoseWajibByNimAndKampus, getMetodePembayaran, getFormRegisterPricing, getTeamCountsByForm, getFormRegisterKampusQuotaPublic, getTeamCountsByFormAndKampus, checkWajibPesertaLombaCount, checkPesertaRegisteredForLomba } from '@/api/supabase/public/peserta';
import { insertTeamPublic, insertTeamMembers } from '@/api/supabase/public/team';
import { insertSalesPose } from '@/api/supabase/public/sales';
import { insertDataMedis, insertDataTambahan } from '@/api/supabase/public/medis';
import { Trophy, Plus, Trash2, Users, Send, Info, Image as ImageIcon, ArrowLeft, CheckCircle2, ShieldCheck, Download, Copy, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { KAMPUS_DATA, METODE_BAYAR_DATA, parseNIM, semesterToAngkatan, PRODI_DATA, SUMBER_LOMBA } from '@/lib/lombaData';
import { generateKodePeserta } from '@/lib/kodeFormUtils';
import { nanoid } from 'nanoid';

function generateNim(kategori, nama, emailWa) {
    const firstWord = (nama || '').trim().split(' ')[0] || '';
    let suffix = '';
    if (emailWa) {
        if (emailWa.includes('@')) {
            const beforeAt = emailWa.split('@')[0];
            suffix = beforeAt.slice(-4);
        } else {
            suffix = emailWa.slice(-4);
        }
    }
    return `${kategori}${firstWord}${suffix}`.replace(/[^a-zA-Z0-9]/g, '');
}

const isValidInput = (str) => {
    if (!str) return true;
    const regex = /[<>'\"\\\/]/;
    return !regex.test(str);
};

export default function FormRegistration({ formConfig, isWajib = false }) {
    // isWajib=true -> Pendaftaran Wajib (single participant, table: peserta_wajib)
    // isWajib=false -> Pendaftaran Lomba (team, table: team & team_members)

    const availableKategori = formConfig?.kategori_pendaftar
        ? formConfig.kategori_pendaftar.split(',')
        : ['Mahasiswa LP3I', 'Siswa', 'Dosen', 'Umum', 'Alumni LP3I'];

    const [kategori, setKategori] = useState(availableKategori[0]); // Default to first available

    const [sumberLomba, setSumberLomba] = useState('');
    const [namaReferal, setNamaReferal] = useState('');

    // Team Fields (Only for Lomba)
    const [teamName, setTeamName] = useState('');
    const [teamContent, setTeamContent] = useState('');
    const [logoFile, setLogoFile] = useState(null);

    // Common
    const [buktiBayarFile, setBuktiBayarFile] = useState(null);

    // Members (For Wajib, it's just 1 member always)
    const [members, setMembers] = useState([
        { nama: '', nim: '', kampus: '', kampusLainnya: '', email_wa: '', kontakType: 'whatsapp', jabatan: '', isStudent: false, prodi: '', semester: '', kelas: '', isProdiLainnya: false }
    ]);

    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [metodePembayaran, setMetodePembayaran] = useState('');
    const [setujuSK, setSetujuSK] = useState(false);
    const [copied, setCopied] = useState(false);

    // States khusus data medis PKKMB
    const [riwayatPenyakit, setRiwayatPenyakit] = useState('');
    const [penanganan, setPenanganan] = useState('');
    const [alergi, setAlergi] = useState('');
    const [namaOrtuWali, setNamaOrtuWali] = useState('');
    const [noWaOrtuWali, setNoWaOrtuWali] = useState('');

    const [pricingMap, setPricingMap] = useState({});
    const [metodeList, setMetodeList] = useState([]);
    const [teamCounts, setTeamCounts] = useState({});

    // Jenis Kategori state
    const [selectedJenisKategori, setSelectedJenisKategori] = useState('');

    useEffect(() => {
        if (!isWajib && formConfig?.jenis_kategori) {
            const list = formConfig.jenis_kategori.split(',').filter(Boolean);
            if (list.length === 1) {
                setSelectedJenisKategori(list[0]);
            } else {
                setSelectedJenisKategori('');
            }
        } else {
            setSelectedJenisKategori('');
        }
    }, [formConfig?.jenis_kategori, isWajib]);

    // Tahap 3 states
    const [kampusQuotaInfo, setKampusQuotaInfo] = useState(null);
    const [kampusTeamCount, setKampusTeamCount] = useState(0);
    const [wajibLombaCount, setWajibLombaCount] = useState(0);
    const [isCheckingKuota, setIsCheckingKuota] = useState(false);

    const currentCategoryPricing = !isWajib ? pricingMap[kategori] : null;
    const umumType = currentCategoryPricing?.umum_type || 'keduanya';

    useEffect(() => {
        let isStudentDefault = false;
        if (kategori === 'Umum') {
            if (umumType === 'mahasiswa_saja') isStudentDefault = true;
            else if (umumType === 'non_mahasiswa') isStudentDefault = false;
            // keduanya: default false, user bisa pilih sendiri
        }
        const defaultKampus = (isWajib && formConfig?.site === 'pkkmb') ? 'Kampus Bandung' : '';
        setMembers([{ nama: '', nim: '', kampus: defaultKampus, kampusLainnya: '', email_wa: '', kontakType: 'whatsapp', jabatan: '', isStudent: isStudentDefault, prodi: '', semester: '', kelas: '', isProdiLainnya: false }]);
        setSumberLomba('');
        setNamaReferal('');
    }, [kategori, umumType, isWajib, formConfig?.site]);

    // Helper to check if current user flow is a student (either LP3I or Umum with isStudent)
    const isMhsLP3I = kategori === 'Mahasiswa LP3I';
    const isAlumniLP3I = kategori === 'Alumni LP3I';

    useEffect(() => {
        if (!isWajib && formConfig?.id) {
            getFormRegisterPricing(formConfig.id).then(data => {
                const map = {};
                if (Array.isArray(data)) {
                    data.forEach(item => {
                        map[item.kategori] = item; // Simpan seluruh objek item
                    });
                }
                setPricingMap(map);
            });
        }
    }, [formConfig?.id, isWajib]);

    useEffect(() => {
        if (!isWajib && formConfig?.kode_form) {
            getTeamCountsByForm(formConfig.kode_form).then(counts => {
                setTeamCounts(counts || {});
            });
        }
    }, [formConfig?.kode_form, isWajib]);

    useEffect(() => {
        const site = formConfig?.site || 'pose';
        getMetodePembayaran(site).then(data => {
            setMetodeList(data || []);
        });
    }, [formConfig?.site]);

    // Tahap 3: Effect for Kampus Quota
    useEffect(() => {
        if (!isWajib && formConfig?.id && formConfig?.kode_form && kategori === 'Mahasiswa LP3I' && members[0]?.kampus) {
            setIsCheckingKuota(true);
            Promise.all([
                getFormRegisterKampusQuotaPublic(formConfig.id, members[0].kampus),
                getTeamCountsByFormAndKampus(formConfig.kode_form, members[0].kampus)
            ]).then(([quotaData, teamCount]) => {
                setKampusQuotaInfo(quotaData);
                setKampusTeamCount(teamCount || 0);
            }).finally(() => {
                setIsCheckingKuota(false);
            });
        } else {
            setKampusQuotaInfo(null);
            setKampusTeamCount(0);
        }
    }, [isWajib, formConfig?.id, formConfig?.kode_form, kategori, members[0]?.kampus]);

    // Data pricing dan limit pendaftar per kategori
    // currentCategoryPricing and umumType are defined above
    const isIndividu = !isWajib && currentCategoryPricing ? !!currentCategoryPricing.individu : false;
    const maksAnggota = !isWajib && currentCategoryPricing ? (isIndividu ? 1 : (currentCategoryPricing.maks_anggota || 1)) : 1;
    const maksTeam = !isWajib && currentCategoryPricing ? (currentCategoryPricing.maks_team || 1) : 1;
    const registeredTeamCount = !isWajib ? (teamCounts[kategori] || 0) : 0;
    const isQuotaFull = !isWajib && registeredTeamCount >= maksTeam;

    const nominalAktif = !isWajib && currentCategoryPricing !== undefined && currentCategoryPricing !== null
        ? (currentCategoryPricing.nominal !== undefined ? currentCategoryPricing.nominal : 0)
        : (formConfig?.nominal != null ? formConfig.nominal : 0);

    const requiresBukti = isWajib || formConfig?.butuh_bukti !== false || kategori !== 'Mahasiswa LP3I';
    // Tahap 3: Effect for Wajib Lomba Count
    useEffect(() => {
        if (!isWajib && kategori === 'Mahasiswa LP3I' && !requiresBukti && members[0]?.nim && members[0]?.kampus) {
            if (members[0].nim.length >= 8) {
                checkWajibPesertaLombaCount(members[0].nim, members[0].kampus).then(res => {
                    setWajibLombaCount(res.count || 0);
                });
            }
        }
    }, [isWajib, kategori, requiresBukti, members[0]?.nim, members[0]?.kampus]);

    const handleAddMember = () => {
        if (members.length >= maksAnggota) {
            window.alert(`Jumlah anggota maksimal untuk kategori ini adalah ${maksAnggota} orang.`);
            return;
        }
        let isStudentDefault = false;
        if (kategori === 'Umum') {
            if (umumType === 'mahasiswa_saja') isStudentDefault = true;
            else if (umumType === 'non_mahasiswa') isStudentDefault = false;
        }
        setMembers([...members, { nama: '', nim: '', kampus: '', kampusLainnya: '', email_wa: '', kontakType: 'whatsapp', jabatan: '', isStudent: isStudentDefault, prodi: '', semester: '', kelas: '', isProdiLainnya: false }]);
    };

    const handleRemoveMember = (index) => {
        const newMembers = [...members];
        newMembers.splice(index, 1);
        setMembers(newMembers);
    };

    const handleMemberChange = (index, field, value) => {
        const newMembers = [...members];
        newMembers[index][field] = value;

        // Auto parse NIM if field is NIM and kategori is Mahasiswa LP3I
        if (field === 'nim' && value.length >= 9 && isMhsLP3I) {
            const parsed = parseNIM(value, newMembers[index].kampus);
            if (parsed) {
                // We don't store it in state, we compute it on submit
            }
        }

        setMembers(newMembers);
    };

    const uploadFileHelper = async (file, bucketName) => {
        const formData = new FormData();
        formData.append('file', file);

        const result = await serverUploadFile(formData, bucketName, 'uploads/');
        if (!result.success) throw new Error(result.error || 'Upload gagal');
        return result.url;
    };

    const handleCopyRekening = (noRek) => {
        navigator.clipboard.writeText(noRek);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownloadQRIS = async (url, filename) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename || 'qris.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Failed to download QRIS image:', error);
            window.open(url, '_blank');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const finalTeamName = !isWajib ? teamName : '';
        const finalTeamContent = !isWajib ? (teamContent || `Pendaftaran Individu Lomba ${formConfig.nama_lomba}`) : '';

        // VALIDATION
        if (!isWajib) {
            // Validasi kuota kampus (termasuk jika maks_team = 0 berarti tidak ada kuota sama sekali)
            if (isMhsLP3I && kampusQuotaInfo) {
                const maksKampus = kampusQuotaInfo.maks_team ?? 0;
                if (maksKampus === 0) {
                    return window.alert(`Maaf, kampus ${members[0]?.kampus} tidak memiliki kuota untuk lomba ini.`);
                }
                if (kampusTeamCount >= maksKampus) {
                    return window.alert(`Maaf, pendaftaran lomba untuk kategori Mahasiswa LP3I dari kampus ${members[0]?.kampus} sudah penuh (Maks: ${maksKampus} Tim).`);
                }
            }

            if (isMhsLP3I && !requiresBukti) {
                if (wajibLombaCount >= 2) {
                    return window.alert(`Anda sudah mendaftar maksimal 2 lomba. Kuota lomba Anda sudah habis.`);
                }
            }

            // Validasi duplikat: setiap NIM+Kampus hanya bisa 1x per lomba (khusus Mahasiswa LP3I)
            if (isMhsLP3I && formConfig?.nama_lomba) {
                for (const m of members) {
                    const finalKampusCek = m.kampus === 'Lainnya' ? m.kampusLainnya : m.kampus;
                    if (m.nim && finalKampusCek) {
                        const alreadyRegistered = await checkPesertaRegisteredForLomba(m.nim, finalKampusCek, formConfig.nama_lomba);
                        if (alreadyRegistered) {
                            return window.alert(`Pendaftaran ditolak: NIM ${m.nim} dari kampus ${finalKampusCek} sudah terdaftar di lomba ${formConfig.nama_lomba} ini.`);
                        }
                    }
                }
            }

            if (isQuotaFull) {
                return window.alert(`Maaf, pendaftaran lomba untuk kategori ${kategori} sudah ditutup.`);
            }
            if (!isValidInput(finalTeamName) || !isValidInput(finalTeamContent)) {
                return window.alert("Karakter tidak diperbolehkan pada input Nama/Deskripsi.");
            }
            if (formConfig?.jenis_kategori) {
                const list = formConfig.jenis_kategori.split(',').filter(Boolean);
                if (list.length > 1 && !selectedJenisKategori) {
                    return window.alert("Mohon pilih kategori lomba (Putra / Putri).");
                }
            }
        }

        for (let i = 0; i < members.length; i++) {
            const m = members[i];
            const currentJabatan = !isWajib && isIndividu ? 'Individu' : m.jabatan;
            if (!isValidInput(m.nama) || !isValidInput(currentJabatan) || (!requiresBukti ? false : !isValidInput(m.email_wa))) {
                return window.alert("Karakter tidak diperbolehkan pada input anggota.");
            }
            if (isMhsLP3I) {
                if (!isValidInput(m.nim)) return window.alert("Karakter tidak valid pada NIM.");
                if (m.nim.length !== 9) return window.alert("NIM harus berisi persis 9 karakter.");
                if (!m.kampus) return window.alert("Mohon pilih kampus.");
                if (m.kampus === 'Lainnya' && !m.kampusLainnya) {
                    return window.alert("Mohon sebutkan nama kampus jika memilih 'Lainnya'.");
                }

                // Selain Kampus Bandung, Prodi dan Semester wajib diisi (jika butuh bukti atau form wajib)
                // Pengecualian: PKKMB wajib tidak perlu prodi/semester (kampus Bandung dikunci, prodi dari NIM)
                if (m.kampus !== 'Kampus Bandung' && !(isWajib && formConfig?.site === 'pkkmb')) {
                    const needProdiSemester = isWajib || formConfig?.butuh_bukti !== false;
                    if (needProdiSemester && !m.prodi) {
                        return window.alert(`Mohon pilih/isi Program Studi untuk ${m.nama || `anggota ${i + 1}`}.`);
                    }
                    if (needProdiSemester && !m.semester) {
                        return window.alert(`Mohon isi Semester untuk ${m.nama || `anggota ${i + 1}`}.`);
                    }
                }

                const needKelasInput = (isWajib || formConfig?.butuh_bukti !== false) && !(isWajib && formConfig?.site === 'pkkmb');
                if (needKelasInput && !m.kelas) {
                    return window.alert(`Mohon pilih Kelas (Reguler / NonReguler) untuk ${m.nama || `anggota ${i + 1}`}.`);
                }

                // Validasi Semester (maksimal 4) — tidak berlaku untuk PKKMB wajib (Kampus Bandung, prodi dari NIM)
                const semVal = parseInt(m.semester, 10);
                if ((isWajib || m.kampus !== 'Kampus Bandung') && !(isWajib && formConfig?.site === 'pkkmb') && !isNaN(semVal) && semVal > 4) {
                    return window.alert("Pendaftaran ditolak: Anda tidak diizinkan mengikuti kegiatan ini.");
                }

                // Validasi NIM (angkatan 2024 kebawah tidak diperbolehkan)
                const nimYear = parseInt(m.nim.substring(0, 4), 10);
                if (!isNaN(nimYear) && nimYear <= 2024) {
                    return window.alert("Pendaftaran ditolak: Anda tidak diizinkan mengikuti kegiatan ini.");
                }
            }
            if (kategori === 'Dosen') {
                if (!m.kampus) return window.alert("Mohon pilih kampus.");
            }
            if (kategori === 'Alumni LP3I') {
                if (!m.kampus) return window.alert("Mohon pilih kampus.");
                if (!m.prodi) return window.alert("Mohon isi Program Studi.");
                if (!m.angkatan) return window.alert("Mohon isi Angkatan.");
            }
            if (kategori === 'Umum' && m.isStudent) {
                if (!m.kampus || !m.prodi || !m.semester) return window.alert("Mohon lengkapi Kampus, Prodi, dan Semester.");

                const semVal = parseInt(m.semester, 10);
                if (isNaN(semVal) || semVal > 4) {
                    return window.alert("Pendaftaran ditolak: Anda tidak diizinkan mengikuti kegiatan ini.");
                }

                const angkatan = semesterToAngkatan(m.semester);
                const angkatanYear = parseInt(angkatan, 10);
                if (isNaN(angkatanYear) || angkatanYear <= 2024) {
                    return window.alert("Pendaftaran ditolak: Anda tidak diizinkan mengikuti kegiatan ini.");
                }
            }
            if (kategori === 'Siswa') {
                if (!m.kampus || !m.prodi || !m.semester) return window.alert("Mohon lengkapi Nama Sekolah, Jurusan, dan Semester.");

                const semVal = parseInt(m.semester, 10);
                if (isNaN(semVal) || semVal > 6) {
                    return window.alert("Pendaftaran ditolak: Anda tidak diizinkan mengikuti kegiatan ini.");
                }

                const angkatan = semesterToAngkatan(m.semester);
                const angkatanYear = parseInt(angkatan, 10);
                if (isNaN(angkatanYear) || angkatanYear < 2024) {
                    return window.alert("Pendaftaran ditolak: Anda tidak diizinkan mengikuti kegiatan ini.");
                }
            }
            if (requiresBukti) {
                if (m.kontakType === 'email') {
                    const emailRegex = /^[a-zA-Z0-9@.]+$/;
                    if (!emailRegex.test(m.email_wa)) {
                        return window.alert(`Format email tidak valid untuk anggota ${m.nama}. Hanya huruf, angka, @, dan . yang diizinkan.`);
                    }
                } else {
                    const cleanNum = m.email_wa.trim();
                    const startsWith08 = cleanNum.startsWith('08');
                    const startsWith628 = cleanNum.startsWith('+628');
                    const digitsOnly = startsWith628 ? cleanNum.slice(1) : cleanNum;
                    const isAllDigits = /^[0-9]+$/.test(digitsOnly);

                    if (!(startsWith08 || startsWith628) || !isAllDigits || digitsOnly.length < 11) {
                        return window.alert(`Format WhatsApp tidak valid untuk anggota ${m.nama}. Harus diawali 08 atau +628, dan minimal 11 digit.`);
                    }
                }
            }
            if (!isWajib && (formConfig?.nama_lomba === 'Mobile Legend' || formConfig?.nama_lomba === 'Mobile Legends')) {
                if (!m.id_ml || m.id_ml.trim().length < 4 || m.id_ml.trim().length > 12) {
                    return window.alert(`ID Mobile Legends tidak valid untuk anggota ${m.nama || (i + 1)}. Panjang ID harus minimal 4 dan maksimal 12 karakter.`);
                }
            }
            if (isWajib && formConfig?.site === 'pkkmb') {
                const regexMedis = /^[a-zA-Z\s-,]*$/;
                if (!regexMedis.test(riwayatPenyakit) || !regexMedis.test(alergi) || !regexMedis.test(penanganan)) {
                    return window.alert("Input Data Medis hanya boleh diisi huruf, spasi, dan tanda hubung (-).");
                }
                if (!namaOrtuWali.trim()) {
                    return window.alert("Nama Orang Tua / Wali wajib diisi.");
                }
                if (!regexMedis.test(namaOrtuWali)) {
                    return window.alert("Nama Orang Tua / Wali hanya boleh diisi huruf, spasi, dan tanda hubung (-).");
                }
                const cleanWaOrtu = noWaOrtuWali.trim();
                const waStartsWith08 = cleanWaOrtu.startsWith('08');
                const waStartsWith628 = cleanWaOrtu.startsWith('+628');
                const waDigitsOnly = waStartsWith628 ? cleanWaOrtu.slice(1) : cleanWaOrtu;
                const waIsAllDigits = /^[0-9]+$/.test(waDigitsOnly);

                if (!(waStartsWith08 || waStartsWith628) || !waIsAllDigits || waDigitsOnly.length < 11) {
                    return window.alert("Format WhatsApp Orang Tua / Wali tidak valid. Harus diawali 08 atau +628, dan minimal 11 digit.");
                }
            }

            if (requiresBukti && !buktiBayarFile) {
                return window.alert("Mohon unggah bukti pembayaran.");
            }

            if (!isWajib && ['Alumni LP3I', 'Siswa', 'Umum'].includes(kategori) && sumberLomba) {
                if (['Dari Dosen/Manajemen LP3I', 'Dari Panitia', 'Dari Mahasiswa LP3I'].includes(sumberLomba) && !namaReferal) {
                    return window.alert("Mohon lengkapi Nama/NIM pemberi referal.");
                }
            }
        }

        setSubmitting(true);

        const fetchedWajibData = [];

        if (!isWajib && !requiresBukti && isMhsLP3I) {
            try {
                for (const m of members) {
                    const finalKampusReg = m.kampus === 'Lainnya' ? m.kampusLainnya : m.kampus;
                    const exists = await checkPesertaPoseWajibByNimAndKampus(m.nim, finalKampusReg);
                    if (!exists) {
                        setSubmitting(false);
                        return window.alert(`Pendaftaran gagal: NIM ${m.nim} dan Kampus ${finalKampusReg} atas nama ${m.nama} belum terdaftar pada Form Wajib POSE.`);
                    }
                    if (exists.status_pembayaran?.toLowerCase() !== 'lunas') {
                        setSubmitting(false);
                        return window.alert(`Pendaftaran gagal: Pembayaran Form Wajib untuk NIM ${m.nim} belum Lunas (Status: ${exists.status_pembayaran || 'pending'}).`);
                    }
                    fetchedWajibData.push(exists);
                }
            } catch (error) {
                setSubmitting(false);
                return window.alert("Terjadi kesalahan saat memverifikasi NIM dan Kampus.");
            }
        } else if (!isWajib && formConfig?.jenis_lomba === 'Kreativitas' && isMhsLP3I) {
            try {
                for (const m of members) {
                    const finalKampusReg = m.kampus === 'Lainnya' ? m.kampusLainnya : m.kampus;
                    const exists = await checkPesertaPoseWajibByNimAndKampus(m.nim, finalKampusReg);
                    if (!exists) {
                        setSubmitting(false);
                        return window.alert(`Pendaftaran gagal: NIM ${m.nim} dan Kampus ${finalKampusReg} atas nama ${m.nama} belum terdaftar pada Form Wajib POSE.`);
                    }
                }
            } catch (error) {
                setSubmitting(false);
                return window.alert("Terjadi kesalahan saat memverifikasi NIM dan Kampus.");
            }
        }

        try {
            // Upload images
            let buktiUrl = null;
            if (buktiBayarFile) {
                buktiUrl = await uploadFileHelper(buktiBayarFile, 'bukti-bayar');
            }
            let logoUrl = null;

            if (!isWajib && logoFile) {
                logoUrl = await uploadFileHelper(logoFile, 'team-images');
            }

            if (isWajib) {
                // INSERT KE peserta
                const m = members[0];
                let finalKampusWajib = kategori;
                let finalNimWajib = kategori;
                let finalProdiWajib = kategori;
                let finalAngkatanWajib = kategori;

                if (isMhsLP3I) {
                    finalKampusWajib = m.kampus === 'Lainnya' ? m.kampusLainnya : m.kampus;
                    finalNimWajib = m.nim;
                    if (finalKampusWajib === 'Kampus Bandung') {
                        const parsedNIM = parseNIM(m.nim, finalKampusWajib);
                        if (parsedNIM) {
                            finalProdiWajib = parsedNIM.prodiName;
                            finalAngkatanWajib = parsedNIM.angkatan;
                        }
                    } else {
                        finalProdiWajib = m.prodi;
                        finalAngkatanWajib = semesterToAngkatan(m.semester);
                    }
                } else if (kategori === 'Dosen') {
                    finalKampusWajib = m.kampus;
                    finalNimWajib = generateNim('Dosen', m.nama, m.email_wa);
                } else if (kategori === 'Alumni LP3I') {
                    finalKampusWajib = m.kampus;
                    finalProdiWajib = m.prodi;
                    finalAngkatanWajib = m.angkatan;
                    finalNimWajib = generateNim('Alumni', m.nama, m.email_wa);
                } else if (kategori === 'Umum') {
                    if (m.isStudent) {
                        finalKampusWajib = m.kampus;
                        finalProdiWajib = m.prodi;
                        finalAngkatanWajib = semesterToAngkatan(m.semester);
                        finalNimWajib = generateNim('MahasiswaUmum', m.nama, m.email_wa);
                    } else {
                        finalNimWajib = generateNim('Umum', m.nama, m.email_wa);
                    }
                } else if (kategori === 'Siswa') {
                    finalKampusWajib = m.kampus;
                    finalProdiWajib = m.prodi;
                    finalAngkatanWajib = semesterToAngkatan(m.semester);
                    finalNimWajib = generateNim('Siswa', m.nama, m.email_wa);
                }

                let finalKelasWajib = m.kelas;
                if (isMhsLP3I) {
                    finalKelasWajib = m.kelas || 'Reguler';
                } else {
                    finalKelasWajib = kategori; // Dosen, Umum, Siswa
                }

                const kodePesertaWajib = formConfig?.kode_form ? generateKodePeserta(formConfig.kode_form) : null;

                const pesertaPayload = {
                    kategori: kategori,
                    nama: m.nama,
                    kampus: finalKampusWajib,
                    nim: finalNimWajib,
                    prodi: finalProdiWajib,
                    angkatan: finalAngkatanWajib,
                    semester: m.semester ? parseInt(m.semester, 10) : null,
                    email_wa: m.email_wa,
                    bukti_bayar: buktiUrl,
                    status_pembayaran: 'pending',
                    site_type: formConfig?.site || 'pose',
                    jenis_form: 'wajib',
                    kode_form: kodePesertaWajib,
                    kelas: finalKelasWajib
                };

                pesertaPayload.metode_pembayaran = metodePembayaran || null;

                const res = await insertPeserta(pesertaPayload);
                if (!res.success) throw new Error(res.error);

                // SIMPAN DATA MEDIS (hanya site pkkmb)
                if (formConfig?.site === 'pkkmb') {
                    const insertedId = res.data?.id;
                    if (insertedId) {
                        if (riwayatPenyakit.trim() || penanganan.trim() || alergi.trim()) {
                            await insertDataMedis(insertedId, {
                                riwayat_penyakit: riwayatPenyakit.trim(),
                                penanganan: penanganan.trim(),
                                alergi: alergi.trim()
                            });
                        }
                        if (namaOrtuWali.trim() || noWaOrtuWali.trim()) {
                            await insertDataTambahan(insertedId, {
                                nama_ortu_wali: namaOrtuWali.trim(),
                                no_wa_ortu_wali: noWaOrtuWali.trim()
                            });
                        }
                    }
                }
            } else {
                // INSERT KE team, team_members, & peserta
                let token = localStorage.getItem('pose_user_token');

                // Cek apakah token dari cache adalah UUID yang valid (panjang 36 karakter dengan format spesifik)
                const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token);

                if (!token || !isValidUUID) {
                    token = crypto.randomUUID();
                    localStorage.setItem('pose_user_token', token);
                }

                const kodePesertaReg = formConfig?.kode_form ? generateKodePeserta(formConfig.kode_form) : null;

                const teamRes = await insertTeamPublic({
                    title: finalTeamName,
                    content: finalTeamContent,
                    type: 'pose',
                    jenis_lomba: formConfig.jenis_lomba,
                    nama_lomba: formConfig.nama_lomba,
                    bukti_bayar: buktiUrl,
                    gambar: logoUrl,
                    user_token: token,
                    kode_form: kodePesertaReg,
                    jenis_kategori: selectedJenisKategori || null
                });

                if (!teamRes.success) {
                    if (teamRes.error && (teamRes.error.includes('unique_title_team') || teamRes.error.includes('duplicate key') || teamRes.error.includes('duplicate'))) {
                        throw new Error("Nama tim/peserta sudah dipakai");
                    }
                    throw new Error(teamRes.error);
                }
                const teamData = teamRes.data;
                if (!teamData || !teamData.id) throw new Error('Gagal mendapatkan data tim setelah insert.');

                const teamMembersToInsert = [];
                const pesertaToInsert = [];

                for (let i = 0; i < members.length; i++) {
                    const m = members[i];
                    const duaAngka = String(i + 1).padStart(2, '0');

                    const mDataWajib = !requiresBukti && isMhsLP3I ? fetchedWajibData[i] : null;

                    let finalKampusReg = kategori;
                    let finalNimReg = kategori;
                    let finalProdiReg = kategori;
                    let finalAngkatanReg = kategori;

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
                    } else if (kategori === 'Dosen') {
                        finalKampusReg = m.kampus;
                        finalNimReg = generateNim(`Dosen${duaAngka}`, m.nama, m.email_wa);
                    } else if (kategori === 'Alumni LP3I') {
                        finalKampusReg = m.kampus;
                        finalProdiReg = m.prodi;
                        finalAngkatanReg = m.angkatan;
                        finalNimReg = generateNim(`Alumni${duaAngka}`, m.nama, m.email_wa);
                    } else if (kategori === 'Umum') {
                        if (m.isStudent) {
                            finalKampusReg = m.kampus;
                            finalProdiReg = m.prodi;
                            finalAngkatanReg = semesterToAngkatan(m.semester);
                            finalNimReg = generateNim(`MahasiswaUmum${duaAngka}`, m.nama, m.email_wa);
                        } else {
                            finalNimReg = generateNim(`Umum${duaAngka}`, m.nama, m.email_wa);
                        }
                    } else if (kategori === 'Siswa') {
                        finalKampusReg = m.kampus;
                        finalProdiReg = m.prodi;
                        finalAngkatanReg = semesterToAngkatan(m.semester);
                        finalNimReg = generateNim(`Siswa${duaAngka}`, m.nama, m.email_wa);
                    }

                    teamMembersToInsert.push({
                        team_id: teamData.id,
                        nama: m.nama,
                        jabatan: isIndividu ? 'Individu' : m.jabatan,
                        kode: finalNimReg,
                        id_ml: (!isWajib && (formConfig?.nama_lomba === 'Mobile Legend' || formConfig?.nama_lomba === 'Mobile Legends')) ? m.id_ml || null : null
                    });

                    let finalKelasReg = m.kelas;
                    if (isMhsLP3I) {
                        if (mDataWajib && mDataWajib.kelas) {
                            finalKelasReg = mDataWajib.kelas;
                        } else {
                            finalKelasReg = m.kelas || 'Reguler';
                        }
                    } else {
                        finalKelasReg = kategori; // Dosen, Umum, Siswa
                    }

                    pesertaToInsert.push({
                        kategori: kategori,
                        nama: m.nama,
                        kampus: finalKampusReg,
                        nim: finalNimReg,
                        prodi: finalProdiReg,
                        angkatan: finalAngkatanReg,
                        semester: mDataWajib && mDataWajib.semester ? parseInt(mDataWajib.semester, 10) : (m.semester ? parseInt(m.semester, 10) : null),
                        email_wa: mDataWajib ? mDataWajib.email_wa : m.email_wa,
                        bukti_bayar: mDataWajib ? mDataWajib.bukti_bayar : buktiUrl,
                        status_pembayaran: mDataWajib ? mDataWajib.status_pembayaran : 'pending',
                        site_type: formConfig?.site || 'pose',
                        jenis_form: 'register',
                        metode_pembayaran: mDataWajib ? mDataWajib.metode_pembayaran : (metodePembayaran || null),
                        kode_form: kodePesertaReg,
                        kelas: finalKelasReg
                    });
                }

                const membersRes = await insertTeamMembers(teamMembersToInsert);
                if (!membersRes.success) throw new Error(membersRes.error);

                const pesertaRes = await insertPesertaBatch(pesertaToInsert);
                if (!pesertaRes.success) {
                    if (pesertaRes.error && pesertaRes.error.includes('unique_email_wa_peserta')) {
                        throw new Error("Email atau WhatsApp yang digunakan sudah terdaftar. Mohon gunakan kontak yang berbeda.");
                    }
                    throw new Error(pesertaRes.error);
                }

                if (!isWajib && ['Alumni LP3I', 'Siswa', 'Umum'].includes(kategori) && sumberLomba) {
                    try {
                        const targetNim = pesertaToInsert[0]?.nim;
                        await insertSalesPose({
                            sumber: sumberLomba,
                            nama_nim: namaReferal || null,
                            form_register_id: formConfig.id,
                            kategori: kategori,
                            target_nim: targetNim
                        });
                    } catch (salesErr) {
                        console.error("Sales Referral Insertion Error:", salesErr);
                    }
                }
            }

            setSuccess(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            console.error('Submission error:', error);
            window.alert(`Pendaftaran gagal: ${error.message || 'Pastikan data sudah benar atau coba lagi nanti.'}`);
        } finally {
            setSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl max-w-lg mx-auto w-full text-center border border-gray-100 dark:border-gray-800">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Trophy size={40} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Pendaftaran Berhasil!</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                    Pendaftaran berhasil dan sedang dalam verifikasi. Jika valid maka akan dikirim pemberitahuan ke email atau whatsapp yang sudah dimasukan tadi.
                </p>
                <div className="space-y-3">
                    <Link href="/" className="inline-flex items-center justify-center w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors">
                        Kembali ke Beranda
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
            {/* Form Header */}
            {formConfig.gambar ? (
                <div className="w-full h-48 sm:h-64 relative">
                    <img src={formConfig.gambar} alt="Header" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-6 left-6 right-6">
                        {formConfig.jenis_lomba && (
                            <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider rounded-full mb-3 inline-block">
                                {formConfig.jenis_lomba}
                            </span>
                        )}
                        <h1 className="text-3xl font-bold text-white">{formConfig.nama_lomba || formConfig.judul}</h1>
                    </div>
                </div>
            ) : (
                <div className="p-8 sm:p-10 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                    {formConfig.jenis_lomba && (
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider rounded-full mb-3 inline-block">
                            {formConfig.jenis_lomba}
                        </span>
                    )}
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{formConfig.nama_lomba || formConfig.judul}</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">Formulir pendaftaran resmi {formConfig.site?.toUpperCase() || 'POSE'} 2026</p>
                </div>
            )}

            {/* Keterangan */}
            {formConfig.keterangan && (
                <div className="p-6 sm:px-10 sm:pt-10 border-b border-gray-100 dark:border-gray-800">
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border border-indigo-100/50 dark:border-indigo-800/30 shadow-inner">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-800/50 flex items-center justify-center">
                                <Info className="text-indigo-600 dark:text-indigo-400" size={20} />
                            </div>
                            <h4 className="text-lg font-bold text-indigo-900 dark:text-indigo-300">Informasi & Ketentuan</h4>
                        </div>
                        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:text-indigo-800/80 dark:prose-p:text-indigo-200/80 prose-p:leading-relaxed">
                            <p className="whitespace-pre-wrap">{formConfig.keterangan}</p>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-8">

                {/* UI Feedback Tahap 3: Maks Lomba */}
                {!isWajib && isMhsLP3I && !requiresBukti && wajibLombaCount > 0 && (
                    <div className={`p-4 rounded-2xl border flex gap-3 ${wajibLombaCount >= 2
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
                        : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300'
                        }`}>
                        <div className="flex-shrink-0 mt-0.5">
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm">
                                {wajibLombaCount >= 2 ? 'Kuota Lomba Penuh' : 'Informasi Kuota Lomba'}
                            </h4>
                            <p className="text-xs mt-1">
                                {wajibLombaCount >= 2
                                    ? 'Anda sudah mendaftar 2 lomba (maksimal). Anda tidak dapat mendaftar lomba ini.'
                                    : `Anda sudah mendaftar ${wajibLombaCount} lomba. Sisa kuota Anda: ${2 - wajibLombaCount} lomba lagi.`}
                            </p>
                        </div>
                    </div>
                )}

                {/* Switch Kategori (Hanya untuk Lomba) */}
                {!isWajib && (
                    <div className="p-6 rounded-3xl bg-gray-50/50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800">
                        <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <span className="w-1.5 h-5 bg-blue-500 rounded-full"></span>
                            Kategori Pendaftar
                        </h4>
                        <div className="relative flex p-1.5 bg-gray-200/50 dark:bg-gray-900/50 rounded-2xl">
                            {availableKategori.map((cat, idx) => {
                                const isActive = kategori === cat;
                                return (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setKategori(cat)}
                                        className={`relative flex-1 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${isActive ? 'text-blue-700 dark:text-blue-300 shadow-sm bg-white dark:bg-gray-800' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                                    >
                                        {cat}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {isQuotaFull ? (
                    <div className="p-8 rounded-3xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-center space-y-4 animate-in fade-in duration-300">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle size={32} />
                        </div>
                        <h4 className="text-lg font-bold text-red-900 dark:text-red-300 font-black">Pendaftaran Ditutup</h4>
                        <p className="text-sm text-red-700 dark:text-red-400 max-w-md mx-auto">
                            Maaf pendaftaran lomba untuk kategori <strong className="underline font-black">{kategori}</strong> sudah ditutup karna sudah mencapai kuota maksimal.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Identitas Tim (Hanya untuk Lomba) */}
                        {!isWajib && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 pb-2">
                                    <Users className="text-blue-500" size={20} />
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Identitas Tim / Perwakilan</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Tim / Nama Perwakilan *</label>
                                        <input
                                            type="text" required value={teamName} onChange={(e) => setTeamName(e.target.value)}
                                            placeholder="Masukkan nama tim..."
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tagline / Deskripsi Tim (Opsional)</label>
                                        <input
                                            type="text" value={teamContent} onChange={(e) => setTeamContent(e.target.value)}
                                            placeholder="Deskripsi singkat..."
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Logo Tim / Ikon (Opsional)</label>
                                        <input
                                            type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files[0])}
                                            className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gray-100 dark:file:bg-gray-800 file:text-gray-700 dark:file:text-gray-300 hover:file:bg-gray-200"
                                        />
                                    </div>
                                    {formConfig?.jenis_kategori && formConfig.jenis_kategori.split(',').filter(Boolean).length > 1 && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kategori Lomba *</label>
                                            <select
                                                required
                                                value={selectedJenisKategori}
                                                onChange={(e) => setSelectedJenisKategori(e.target.value)}
                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 dark:text-white"
                                            >
                                                <option value="">Pilih Kategori (Putra / Putri)</option>
                                                {formConfig.jenis_kategori.split(',').filter(Boolean).map(opt => (
                                                    <option key={opt} value={opt}>
                                                        {opt.charAt(0).toUpperCase() + opt.slice(1)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Anggota Tim / Individu */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                                <div className="flex items-center gap-3">
                                    <Users className="text-purple-500" size={20} />
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                        {isWajib ? 'Data Pendaftar' : 'Data Anggota'}
                                    </h3>
                                </div>
                                {!isWajib && (
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-gray-500 font-semibold">{members.length} Anggota</span>
                                        {members.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => setMembers([{ nama: '', nim: '', kampus: '', kampusLainnya: '', email_wa: '', kontakType: 'whatsapp', jabatan: '', isStudent: false, prodi: '', semester: '', kelas: '' }])}
                                                className="text-xs font-semibold text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1 transition-colors"
                                            >
                                                <Trash2 size={12} /> Reset Anggota
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {members.map((member, index) => (
                                <div key={index} className="p-5 sm:p-6 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-2xl relative group transition-all">
                                    {!isWajib && index > 0 && (
                                        <button
                                            type="button" onClick={() => handleRemoveMember(index)}
                                            className="absolute -top-3 -right-3 bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 p-2 rounded-full shadow hover:bg-red-200"
                                            title="Hapus Anggota"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}

                                    {!isWajib && !isIndividu && (
                                        <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 text-xs flex items-center justify-center">{index + 1}</span>
                                            {`Data Anggota ${index + 1}`}
                                        </h4>
                                    )}

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 font-semibold">Nama Lengkap *</label>
                                            <input
                                                type="text" required value={member.nama} onChange={(e) => handleMemberChange(index, 'nama', e.target.value)}
                                                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        {(!isWajib && (formConfig?.nama_lomba === 'Mobile Legend' || formConfig?.nama_lomba === 'Mobile Legends')) && (
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 font-semibold">ID Mobile Legends *</label>
                                                <input
                                                    type="text" required value={member.id_ml || ''} onChange={(e) => handleMemberChange(index, 'id_ml', e.target.value)}
                                                    placeholder="Contoh: 12345678"
                                                    minLength={4}
                                                    maxLength={12}
                                                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        )}
                                        {!isWajib && !isIndividu && (
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Jabatan di team *</label>
                                                <input
                                                    type="text" required={!isIndividu} value={member.jabatan} onChange={(e) => handleMemberChange(index, 'jabatan', e.target.value)}
                                                    placeholder="Contoh: Kapten, Striker, EXP Lane, Anggota, Lainnya"
                                                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        )}
                                        {requiresBukti && (
                                            <div>
                                                <div className="flex items-center justify-between mb-1">
                                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">WhatsApp / Email *</label>
                                                    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleMemberChange(index, 'kontakType', 'whatsapp')}
                                                            className={`px-2 py-1 text-[10px] font-semibold rounded-md transition-all ${member.kontakType === 'whatsapp' ? 'bg-white dark:bg-gray-700 text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                                        >
                                                            WhatsApp
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleMemberChange(index, 'kontakType', 'email')}
                                                            className={`px-2 py-1 text-[10px] font-semibold rounded-md transition-all ${member.kontakType === 'email' ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                                        >
                                                            Email
                                                        </button>
                                                    </div>
                                                </div>
                                                <input
                                                    type="text" required value={member.email_wa} onChange={(e) => handleMemberChange(index, 'email_wa', e.target.value)}
                                                    placeholder={member.kontakType === 'whatsapp' ? "Contoh: 08123456789" : "Contoh: nama@email.com"}
                                                    maxLength={member.kontakType === 'whatsapp' ? 15 : 30}
                                                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-all"
                                                />
                                            </div>
                                        )}

                                        {kategori === 'Umum' && (
                                            <div className="col-span-1 sm:col-span-2 pt-2 border-t border-gray-100 dark:border-gray-800 mt-2 flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30">
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Apakah Anda Mahasiswa?</span>
                                                {umumType === 'keduanya' ? (
                                                    // Bebas dipilih
                                                    <div className="flex bg-gray-200 dark:bg-gray-700 p-1 rounded-lg gap-1">
                                                        <button type="button" onClick={() => handleMemberChange(index, 'isStudent', false)} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${!member.isStudent ? 'bg-white dark:bg-gray-600 shadow text-gray-800 dark:text-white' : 'text-gray-500 hover:text-gray-700'}`}>Tidak</button>
                                                        <button type="button" onClick={() => handleMemberChange(index, 'isStudent', true)} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${member.isStudent ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700'}`}>Ya</button>
                                                    </div>
                                                ) : (
                                                    // Terkunci: Disabled switch
                                                    <div className="flex bg-gray-200 dark:bg-gray-700 p-1 rounded-lg gap-1 opacity-70 cursor-not-allowed">
                                                        <button type="button" disabled className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${!member.isStudent ? 'bg-white dark:bg-gray-600 shadow text-gray-800 dark:text-white' : 'text-gray-500'}`}>Tidak</button>
                                                        <button type="button" disabled className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${member.isStudent ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-blue-400' : 'text-gray-500'}`}>Ya</button>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {(isMhsLP3I || isAlumniLP3I || kategori === 'Dosen') && (
                                            <>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">Kampus *</label>
                                                        {/* UI Feedback Tahap 3: Kampus Quota */}
                                                        {!isWajib && index === 0 && isMhsLP3I && members[0].kampus && (
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isCheckingKuota ? 'bg-gray-100 text-gray-500' :
                                                                !kampusQuotaInfo ? 'bg-green-100 text-green-600' :
                                                                    (kampusQuotaInfo.maks_team ?? 0) === 0 ? 'bg-red-100 text-red-600' :
                                                                        kampusTeamCount >= kampusQuotaInfo.maks_team ? 'bg-red-100 text-red-600' :
                                                                            kampusTeamCount >= kampusQuotaInfo.maks_team - 2 ? 'bg-yellow-100 text-yellow-600' :
                                                                                'bg-green-100 text-green-600'
                                                                }`}>
                                                                {isCheckingKuota ? 'Memeriksa...' :
                                                                    !kampusQuotaInfo ? 'Tersedia' :
                                                                        (kampusQuotaInfo.maks_team ?? 0) === 0 ? 'Tidak Ada Kuota' :
                                                                            kampusTeamCount >= kampusQuotaInfo.maks_team ? 'Penuh' : `Tersedia`}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {isWajib && formConfig?.site === 'pkkmb' ? (
                                                        <input
                                                            type="text"
                                                            value="Kampus Bandung"
                                                            readOnly
                                                            disabled
                                                            className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                                        />
                                                    ) : (
                                                        <>
                                                            <select
                                                                required value={member.kampus} onChange={(e) => handleMemberChange(index, 'kampus', e.target.value)}
                                                                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                                            >
                                                                <option value="" disabled>Pilih Kampus</option>
                                                                {KAMPUS_DATA.filter(k => (isMhsLP3I || isAlumniLP3I) ? true : k !== 'Lainnya').map(k => <option key={k} value={k}>{k}</option>)}
                                                            </select>
                                                            {(isMhsLP3I || isAlumniLP3I) && member.kampus === 'Lainnya' && (
                                                                <input
                                                                    type="text" required value={member.kampusLainnya || ''} onChange={(e) => handleMemberChange(index, 'kampusLainnya', e.target.value)}
                                                                    placeholder="Sebutkan nama kampus"
                                                                    className="w-full px-3 py-2 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                                                />
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                        {isAlumniLP3I && (
                                            <>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 font-semibold">Program Studi *</label>
                                                    {member.isProdiLainnya ? (
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                required
                                                                value={member.prodi || ''}
                                                                onChange={(e) => handleMemberChange(index, 'prodi', e.target.value)}
                                                                placeholder="Sebutkan Program Studi"
                                                                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                                            />
                                                            <button type="button" onClick={() => { handleMemberChange(index, 'prodi', ''); handleMemberChange(index, 'isProdiLainnya', false); }} className="text-gray-500 hover:text-red-500 font-bold px-2">X</button>
                                                        </div>
                                                    ) : (
                                                        <select
                                                            required
                                                            value={member.prodi || ''}
                                                            onChange={(e) => {
                                                                if (e.target.value === 'Lainnya') {
                                                                    handleMemberChange(index, 'isProdiLainnya', true);
                                                                    handleMemberChange(index, 'prodi', '');
                                                                } else {
                                                                    handleMemberChange(index, 'prodi', e.target.value);
                                                                }
                                                            }}
                                                            className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                                        >
                                                            <option value="" disabled>Pilih Prodi</option>
                                                            {((member.kampus === 'Kampus Bandung' ? ['Administrasi Bisnis', 'Manajemen Informatika', 'Akuntansi', 'Hubungan Masyarakat', 'Bisnis Digital'] : (PRODI_DATA[member.kampus] || []))).map(p => (
                                                                <option key={p} value={p}>{p}</option>
                                                            ))}
                                                            <option value="Lainnya">Lainnya</option>
                                                        </select>
                                                    )}
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Angkatan *</label>
                                                    <input
                                                        type="text" required value={member.angkatan || ''} onChange={(e) => handleMemberChange(index, 'angkatan', e.target.value)}
                                                        placeholder="Contoh: 2022"
                                                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                            </>
                                        )}
                                        {((kategori === 'Umum' && member.isStudent) || kategori === 'Siswa') && (
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                                    {kategori === 'Siswa' ? 'Nama Sekolah *' : 'Kampus *'}
                                                </label>
                                                <input
                                                    type="text" required value={member.kampus} onChange={(e) => handleMemberChange(index, 'kampus', e.target.value)}
                                                    placeholder={kategori === 'Siswa' ? "Contoh: SMAN 1 Bandung" : "Contoh: Universitas Indonesia"}
                                                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        )}

                                        {isMhsLP3I && (
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">NIM *</label>
                                                <input
                                                    type="text" required value={member.nim} onChange={(e) => handleMemberChange(index, 'nim', e.target.value)}
                                                    placeholder="Contoh: 202502014"
                                                    minLength={9}
                                                    maxLength={9}
                                                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                                />
                                                {member.nim.length >= 9 && member.kampus === 'Kampus Bandung' && parseNIM(member.nim, member.kampus) && (
                                                    <p className="text-xs text-green-600 mt-1">
                                                        Terdeteksi: {parseNIM(member.nim, member.kampus).prodiName} ({parseNIM(member.nim, member.kampus).angkatan})
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {isMhsLP3I && member.kampus && member.kampus !== 'Kampus Bandung' && member.kampus !== 'Lainnya' && (isWajib || formConfig?.butuh_bukti !== false) && !(isWajib && formConfig?.site === 'pkkmb') && (
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Prodi *</label>
                                                {member.isProdiLainnya ? (
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            required
                                                            value={member.prodi || ''}
                                                            onChange={(e) => handleMemberChange(index, 'prodi', e.target.value)}
                                                            placeholder="Sebutkan Program Studi"
                                                            className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                                        />
                                                        <button type="button" onClick={() => { handleMemberChange(index, 'prodi', ''); handleMemberChange(index, 'isProdiLainnya', false); }} className="text-gray-500 hover:text-red-500 font-bold px-2">X</button>
                                                    </div>
                                                ) : (
                                                    <select
                                                        required
                                                        value={member.prodi || ''}
                                                        onChange={(e) => {
                                                            if (e.target.value === 'Lainnya') {
                                                                handleMemberChange(index, 'isProdiLainnya', true);
                                                                handleMemberChange(index, 'prodi', '');
                                                            } else {
                                                                handleMemberChange(index, 'prodi', e.target.value);
                                                            }
                                                        }}
                                                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        <option value="" disabled>Pilih Prodi</option>
                                                        {(PRODI_DATA[member.kampus] || []).map(p => (
                                                            <option key={p} value={p}>{p}</option>
                                                        ))}
                                                        <option value="Lainnya">Lainnya</option>
                                                    </select>
                                                )}
                                            </div>
                                        )}

                                        {isMhsLP3I && member.kampus === 'Lainnya' && (isWajib || formConfig?.butuh_bukti !== false) && !(isWajib && formConfig?.site === 'pkkmb') && (
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Prodi *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={member.prodi || ''}
                                                    onChange={(e) => handleMemberChange(index, 'prodi', e.target.value)}
                                                    placeholder="Sebutkan Program Studi"
                                                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        )}

                                        {isMhsLP3I && (isWajib || formConfig?.butuh_bukti !== false) && (isWajib && formConfig?.site === 'pkkmb') && (
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Kelas *</label>
                                                <select
                                                    required
                                                    value={member.kelas || ''}
                                                    onChange={(e) => handleMemberChange(index, 'kelas', e.target.value)}
                                                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="" disabled>Pilih Kelas</option>
                                                    <option value="Reguler">Reguler</option>
                                                    <option value="NonReguler">NonReguler</option>
                                                </select>
                                            </div>
                                        )}

                                        {((kategori === 'Umum' && member.isStudent) || kategori === 'Siswa') && (
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                                    {kategori === 'Siswa' ? 'Jurusan *' : 'Prodi *'}
                                                </label>
                                                <input
                                                    type="text" required value={member.prodi} onChange={(e) => handleMemberChange(index, 'prodi', e.target.value)}
                                                    placeholder={kategori === 'Siswa' ? "Contoh: IPA / IPS" : "Contoh: Sistem Informasi"}
                                                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        )}
                                        {((isMhsLP3I && (isWajib || (member.kampus !== 'Kampus Bandung' && formConfig?.butuh_bukti !== false)) && !(isWajib && formConfig?.site === 'pkkmb')) || kategori === 'Siswa' || (kategori === 'Umum' && member.isStudent)) && (
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Semester *</label>
                                                <input
                                                    type="number" min="1" required value={member.semester} onChange={(e) => handleMemberChange(index, 'semester', e.target.value)}
                                                    placeholder="Contoh: 3"
                                                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Form Tambahan Medis PKKMB (Hanya untuk pendaftaran wajib PKKMB) */}
                            {isWajib && formConfig?.site === 'pkkmb' && (
                                <div className="p-5 sm:p-6 bg-red-50/20 dark:bg-red-950/10 border border-red-100/50 dark:border-red-900/30 rounded-2xl space-y-4">
                                    <h4 className="text-md font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                        <span className="w-1.5 h-5 bg-red-500 rounded-full"></span>
                                        Data Medis & Kontak Darurat (Wajib Diisi)
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Riwayat Penyakit (Jika ada)</label>
                                            <input
                                                type="text"
                                                value={riwayatPenyakit}
                                                onChange={(e) => setRiwayatPenyakit(e.target.value.replace(/[^a-zA-Z\s-,]/g, ''))}
                                                placeholder="Contoh: Asma, Jantung, atau tulis '-'"
                                                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Alergi (Jika ada)</label>
                                            <input
                                                type="text"
                                                value={alergi}
                                                onChange={(e) => setAlergi(e.target.value.replace(/[^a-zA-Z\s-,]/g, ''))}
                                                placeholder="Contoh: Alergi Makanan Laut, atau tulis '-'"
                                                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Penanganan Medis Khusus</label>
                                            <textarea
                                                value={penanganan}
                                                onChange={(e) => setPenanganan(e.target.value.replace(/[^a-zA-Z\s-,]/g, ''))}
                                                placeholder="Tulis instruksi khusus jika penyakit kambuh, obat pribadi, dsb."
                                                rows={2}
                                                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Nama Orang Tua / Wali *</label>
                                            <input
                                                type="text"
                                                required
                                                value={namaOrtuWali}
                                                onChange={(e) => setNamaOrtuWali(e.target.value.replace(/[^a-zA-Z\s-,]/g, ''))}
                                                placeholder="Nama lengkap orang tua/wali"
                                                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">No. WA Orang Tua / Wali *</label>
                                            <input
                                                type="text"
                                                required
                                                value={noWaOrtuWali}
                                                onChange={(e) => setNoWaOrtuWali(e.target.value.replace(/[^0-9+]/g, ''))}
                                                placeholder="Contoh: 08123456789"
                                                maxLength={15}
                                                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {!isWajib && (
                                <button
                                    type="button"
                                    onClick={handleAddMember}
                                    className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl text-gray-500 hover:text-blue-600 hover:border-blue-300 dark:hover:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/10 flex items-center justify-center gap-2 font-medium transition-all"
                                >
                                    <Plus size={18} /> Tambah Anggota (Jika Ada)
                                </button>
                            )}
                        </div>

                        {/* Sumber Informasi Lomba */}
                        {!isWajib && ['Alumni LP3I', 'Siswa', 'Umum'].includes(kategori) && (
                            <div className="p-6 rounded-3xl bg-gray-50/50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800 space-y-4">
                                <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <span className="w-1.5 h-5 bg-purple-500 rounded-full"></span>
                                    Informasi Tambahan
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Dari mana kamu mendapatkan informasi lomba ini? *</label>
                                        <select
                                            required
                                            value={sumberLomba}
                                            onChange={(e) => {
                                                setSumberLomba(e.target.value);
                                                setNamaReferal('');
                                            }}
                                            className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
                                        >
                                            <option value="" disabled>Pilih Sumber Informasi</option>
                                            {SUMBER_LOMBA.map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {sumberLomba === 'Dari Dosen/Manajemen LP3I' && (
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nama Dosen / Manajemen LP3I *</label>
                                            <input
                                                type="text"
                                                required
                                                value={namaReferal}
                                                onChange={(e) => setNamaReferal(e.target.value)}
                                                placeholder="Contoh: Pak Budi"
                                                className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            />
                                        </div>
                                    )}

                                    {['Dari Panitia', 'Dari Mahasiswa LP3I'].includes(sumberLomba) && (
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">NIM Panitia / Mahasiswa LP3I *</label>
                                            <input
                                                type="text"
                                                required
                                                value={namaReferal}
                                                onChange={(e) => setNamaReferal(e.target.value)}
                                                placeholder="Contoh: 202502014"
                                                minLength={9}
                                                maxLength={9}
                                                className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Bukti Pembayaran */}
                        {requiresBukti && (
                            <div className="p-6 rounded-3xl bg-gray-50/50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800 space-y-6">
                                <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <span className="w-1.5 h-5 bg-amber-500 rounded-full"></span>
                                    Pembayaran & Berkas
                                </h4>

                                <div className="flex flex-col md:flex-row items-start md:items-end gap-4 w-full">
                                    <div className="w-full md:w-1/2">
                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 truncate">Upload Bukti Pembayaran *</label>
                                        <div className="relative">
                                            <input
                                                type="file" required accept="image/*,application/pdf" onChange={(e) => setBuktiBayarFile(e.target.files[0])}
                                                className="w-full text-[10px] sm:text-sm text-gray-500 file:mr-2 sm:file:mr-4 file:py-2 sm:file:py-3 file:px-2 sm:file:px-4 file:rounded-xl file:border-0 file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 transition-all cursor-pointer"
                                            />
                                        </div>
                                    </div>

                                    <div className="w-full md:w-1/2">
                                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 truncate">Metode Pembayaran *</label>
                                        {(() => {
                                            const siteKey = (formConfig?.site || 'pose').toLowerCase();
                                            const staticMetodeOptions = Array.isArray(METODE_BAYAR_DATA)
                                                ? METODE_BAYAR_DATA
                                                : (METODE_BAYAR_DATA[siteKey] || METODE_BAYAR_DATA.pose || []);

                                            return (
                                                <select
                                                    required
                                                    value={metodePembayaran}
                                                    onChange={(e) => setMetodePembayaran(e.target.value)}
                                                    className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
                                                >
                                                    <option value="" disabled>Pilih Metode Pembayaran</option>
                                                    {metodeList.length > 0 ? (
                                                        metodeList.map(m => (
                                                            <option key={m.id} value={m.nama}>{m.nama}</option>
                                                        ))
                                                    ) : (
                                                        staticMetodeOptions.map(m => <option key={m} value={m}>{m}</option>)
                                                    )}
                                                </select>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* Detail Info Rekening / QRIS yang dipilih */}
                                {(() => {
                                    const selectedMetode = metodeList.find(m => m.nama === metodePembayaran);
                                    if (!selectedMetode) return null;

                                    return (
                                        <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-900/20 border border-blue-200/70 dark:border-blue-800/40 text-blue-900 dark:text-blue-200 space-y-3 animate-fadeIn">
                                            <div className="flex items-center gap-2 font-bold text-sm">
                                                <Info size={18} className="text-blue-600 dark:text-blue-400" />
                                                Detail Pembayaran: {selectedMetode.nama}
                                            </div>

                                            {selectedMetode.nomor_rekening && (
                                                <div className="bg-white dark:bg-gray-900 p-3 rounded-xl border border-blue-100 dark:border-gray-800 flex justify-between items-center">
                                                    <div>
                                                        <p className="text-xs text-gray-500">Nomor Rekening / No HP</p>
                                                        <p className="font-mono text-base font-bold text-gray-900 dark:text-white">{selectedMetode.nomor_rekening}</p>
                                                        {selectedMetode.nama_pemilik && (
                                                            <p className="text-xs text-gray-600 dark:text-gray-400">Atas Nama: <strong>{selectedMetode.nama_pemilik}</strong></p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {selectedMetode.qris_image && (
                                                <div className="text-center bg-white dark:bg-gray-900 p-4 rounded-xl border border-blue-100 dark:border-gray-800">
                                                    <p className="text-xs text-gray-500 mb-2 font-semibold">Scan QRIS di bawah ini untuk membayar:</p>
                                                    <img src={selectedMetode.qris_image} alt="QRIS Code" className="max-w-[200px] h-auto mx-auto rounded-lg shadow-sm border" />
                                                </div>
                                            )}

                                            {selectedMetode.keterangan && (
                                                <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed bg-blue-100/50 dark:bg-blue-900/40 p-2.5 rounded-lg">
                                                    {selectedMetode.keterangan}
                                                </p>
                                            )}

                                            {/* Action Buttons */}
                                            {selectedMetode.qris_image ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDownloadQRIS(selectedMetode.qris_image, `QRIS_${selectedMetode.nama.replace(/\s+/g, '_')}.png`)}
                                                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm text-sm"
                                                >
                                                    <Download size={16} />
                                                    Unduh QRIS
                                                </button>
                                            ) : selectedMetode.nomor_rekening ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleCopyRekening(selectedMetode.nomor_rekening)}
                                                    className={`w-full py-2.5 px-4 font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm text-sm ${copied ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                                                >
                                                    {copied ? (
                                                        <>
                                                            <CheckCircle2 size={16} />
                                                            Tersalin!
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy size={16} />
                                                            Salin Nomor Rekening
                                                        </>
                                                    )}
                                                </button>
                                            ) : null}
                                        </div>
                                    );
                                })()}

                                {/* Nominal Tagihan */}
                                {nominalAktif > 0 && (
                                    <div className="mt-2 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Tagihan ({kategori})</span>
                                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                                            Rp {nominalAktif.toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Checkbox Persetujuan Syarat & Ketentuan */}
                        <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-900/10 border border-amber-200/80 dark:border-amber-800/30 flex items-start gap-3">
                            <input
                                type="checkbox"
                                id="syarat-ketentuan-check"
                                checked={setujuSK}
                                onChange={(e) => setSetujuSK(e.target.checked)}
                                className="mt-1 w-5 h-5 accent-blue-600 rounded cursor-pointer shrink-0"
                            />
                            <label htmlFor="syarat-ketentuan-check" className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed cursor-pointer select-none">
                                Saya menyatakan bahwa seluruh data yang diisi adalah benar dan akurat. <strong className="text-blue-600 dark:text-blue-400">Saya Setuju Dengan Syarat & Ketentuan yang berlaku</strong>.
                            </label>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={submitting || !setujuSK}
                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {submitting ? (
                                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                                ) : (
                                    <>
                                        <Send size={20} /> Kirim Pendaftaran
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                )}
            </form>
        </div>
    );
}
