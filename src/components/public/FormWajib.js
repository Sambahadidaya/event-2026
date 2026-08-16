'use client';

import { useState, useEffect } from 'react';
import { uploadFile as serverUploadFile } from '@/api/supabase/storage';
import { insertPeserta, getMetodePembayaran, getFormWajibPricing } from '@/api/supabase/public/peserta';
import { checkTahap1Pembayaran, getPesertaWajibPkkmbByNim, insertPembayaranPkkmb } from '@/api/supabase/public/pembayaran_pkkmb';
import { insertDataMedis, insertDataTambahan } from '@/api/supabase/public/medis';
import { Trophy, Trash2, Users, Send, Info, Download, Copy, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { KAMPUS_DATA, METODE_BAYAR_DATA, parseNIM, semesterToAngkatan, PRODI_DATA } from '@/lib/lombaData';
import { generateKodePeserta } from '@/lib/kodeFormUtils';

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

export default function FormWajib({ formConfig }) {
    const availableKategori = formConfig?.kategori_pendaftar
        ? formConfig.kategori_pendaftar.split(',')
        : ['Mahasiswa LP3I'];

    const [kategori, setKategori] = useState(availableKategori[0]);
    const [buktiBayarFile, setBuktiBayarFile] = useState(null);
    const [members, setMembers] = useState([
        { nama: '', nim: '', kampus: '', kampusLainnya: '', email_wa: '', kontakType: 'whatsapp', jabatan: '', isStudent: false, prodi: '', semester: '', kelas: '', isProdiLainnya: false }
    ]);

    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [metodePembayaran, setMetodePembayaran] = useState('');
    const [setujuSK, setSetujuSK] = useState(false);
    const [copied, setCopied] = useState(false);

    const [riwayatPenyakit, setRiwayatPenyakit] = useState('');
    const [penanganan, setPenanganan] = useState('');
    const [alergi, setAlergi] = useState('');
    const [namaOrtuWali, setNamaOrtuWali] = useState('');
    const [noWaOrtuWali, setNoWaOrtuWali] = useState('');

    const [metodeList, setMetodeList] = useState([]);

    // PKKMB Staged Payment States
    const [selectedKelas, setSelectedKelas] = useState('');
    const [jenisBayar, setJenisBayar] = useState(''); // 'langsung' | 'bertahap'
    const [tahapan, setTahapan] = useState(''); // 'tahap 1' | 'tahap 2' | 'full'
    const [pricingList, setPricingList] = useState([]);
    const [nimTahap2, setNimTahap2] = useState('');
    const [validatingNim, setValidatingNim] = useState(false);
    const [firstSubmissionData, setFirstSubmissionData] = useState(null);

    // Fetch pricing list
    useEffect(() => {
        if (formConfig?.site === 'pkkmb' && formConfig?.id) {
            getFormWajibPricing(formConfig.id).then(data => {
                setPricingList(data || []);
            });
        }
    }, [formConfig]);

    // Force KIP to be langsung (full)
    useEffect(() => {
        if (selectedKelas === 'KIP') {
            setJenisBayar('langsung');
            setTahapan('full');
        } else {
            setJenisBayar('');
            setTahapan('');
        }
    }, [selectedKelas]);

    // Force langsung to be full
    useEffect(() => {
        if (jenisBayar === 'langsung') {
            setTahapan('full');
        } else if (jenisBayar === 'bertahap') {
            setTahapan('');
        }
    }, [jenisBayar]);

    const handleVerifyNimTahap2 = async (nim) => {
        if (nim.length !== 9) return;
        setValidatingNim(true);
        try {
            const checkRes = await checkTahap1Pembayaran(nim);
            if (!checkRes.success) {
                window.alert(checkRes.error || "NIM belum membayar Tahap 1 atau status pendaftaran Anda saat ini belum lunas.");
                setFirstSubmissionData(null);
                setValidatingNim(false);
                return;
            }

            const mapped = await getPesertaWajibPkkmbByNim(nim);
            if (!mapped) {
                window.alert("Data pendaftaran pertama tidak ditemukan untuk NIM ini.");
                setFirstSubmissionData(null);
                setValidatingNim(false);
                return;
            }

            setFirstSubmissionData(mapped);
            // Autofill the first member's details
            setMembers([{
                nama: mapped.nama || '',
                nim: mapped.nim || '',
                kampus: mapped.kampus || '',
                kampusLainnya: '',
                email_wa: mapped.email_wa || '',
                kontakType: 'whatsapp',
                jabatan: '',
                isStudent: false,
                prodi: mapped.prodi || '',
                semester: mapped.semester || '',
                kelas: mapped.kelas || '',
                isProdiLainnya: false
            }]);
        } catch (e) {
            console.error(e);
            window.alert("Gagal memvalidasi NIM.");
        } finally {
            setValidatingNim(false);
        }
    };

    // Auto trigger verification when NIM Tahap 2 is 9 digits with 2 seconds debounce
    useEffect(() => {
        if (formConfig?.site === 'pkkmb' && tahapan === 'tahap 2' && nimTahap2.length === 9) {
            const timeoutId = setTimeout(() => {
                handleVerifyNimTahap2(nimTahap2);
            }, 2000);
            return () => clearTimeout(timeoutId);
        }
    }, [nimTahap2, tahapan, formConfig?.site]);

    const isMhsLP3I = kategori === 'Mahasiswa LP3I';
    const isAlumniLP3I = kategori === 'Alumni LP3I';

    const requiresBukti = formConfig?.butuh_bukti !== false || kategori !== 'Mahasiswa LP3I';

    useEffect(() => {
        const defaultKampus = formConfig?.site === 'pkkmb' ? 'Kampus Bandung' : '';
        setMembers([{ nama: '', nim: '', kampus: defaultKampus, kampusLainnya: '', email_wa: '', kontakType: 'whatsapp', jabatan: '', isStudent: false, prodi: '', semester: '', kelas: '', isProdiLainnya: false }]);
    }, [kategori, formConfig?.site]);

    useEffect(() => {
        const site = formConfig?.site || 'pose';
        getMetodePembayaran(site).then(data => {
            setMetodeList(data || []);
        });
    }, [formConfig?.site]);

    const handleRemoveMember = (index) => {
        const newMembers = [...members];
        newMembers.splice(index, 1);
        setMembers(newMembers);
    };

    const handleMemberChange = (index, field, value) => {
        const newMembers = [...members];
        newMembers[index][field] = value;

        if (field === 'nim' && value.length >= 9 && isMhsLP3I) {
            const parsed = parseNIM(value, newMembers[index].kampus);
            if (parsed) {
                // Parsing untuk informasi
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

        // 1. PKKMB Field validation
        if (formConfig?.site === 'pkkmb') {
            if (!selectedKelas) {
                return window.alert("Mohon pilih Kelas Anda.");
            }
            if (!jenisBayar) {
                return window.alert("Mohon pilih Jenis Pembayaran.");
            }
            if (!tahapan) {
                return window.alert("Mohon pilih Tahapan Pembayaran.");
            }
        }

        const isTahap2 = formConfig?.site === 'pkkmb' && tahapan === 'tahap 2';

        if (isTahap2) {
            if (!nimTahap2 || nimTahap2.length !== 9) {
                return window.alert("NIM harus berisi persis 9 karakter.");
            }
            if (!firstSubmissionData) {
                return window.alert("Mohon masukkan NIM yang valid dan terdaftar di Tahap 1.");
            }
            if (requiresBukti && !buktiBayarFile) {
                return window.alert("Mohon unggah bukti pembayaran.");
            }
        } else {
            // VALIDATION
            for (let i = 0; i < members.length; i++) {
                const m = members[i];
                if (!isValidInput(m.nama) || !isValidInput(m.jabatan) || (!requiresBukti ? false : !isValidInput(m.email_wa))) {
                    return window.alert("Karakter tidak diperbolehkan pada input anggota.");
                }
                if (isMhsLP3I) {
                    if (!isValidInput(m.nim)) return window.alert("Karakter tidak valid pada NIM.");
                    if (m.nim.length !== 9) return window.alert("NIM harus berisi persis 9 karakter.");
                    if (!m.kampus) return window.alert("Mohon pilih kampus.");
                    if (m.kampus === 'Lainnya' && !m.kampusLainnya) {
                        return window.alert("Mohon sebutkan nama kampus jika memilih 'Lainnya'.");
                    }

                    if (m.kampus !== 'Kampus Bandung' && !(formConfig?.site === 'pkkmb')) {
                        const needProdiSemester = formConfig?.butuh_bukti !== false;
                        if (needProdiSemester && !m.prodi) {
                            return window.alert(`Mohon pilih/isi Program Studi untuk ${m.nama || `anggota ${i + 1}`}.`);
                        }
                        if (needProdiSemester && !m.semester) {
                            return window.alert(`Mohon isi Semester untuk ${m.nama || `anggota ${i + 1}`}.`);
                        }
                    }

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
                if (formConfig?.site === 'pkkmb') {
                    const regexMedis = /^[a-zA-Z\s-,]*$/;
                    if (!riwayatPenyakit.trim() || !penanganan.trim() || !alergi.trim()) {
                        return window.alert("Input Data Medis (Riwayat Penyakit, Penanganan, dan Alergi) wajib diisi. Isi '-' jika tidak ada.");
                    }
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
            }
        }

        setSubmitting(true);

        try {
            let buktiUrl = null;
            if (buktiBayarFile) {
                buktiUrl = await uploadFileHelper(buktiBayarFile, 'bukti-bayar');
            }

            // INSERT KE peserta
            let pesertaPayload;
            let finalNimWajib = isTahap2 ? nimTahap2 : members[0].nim;

            if (isTahap2) {
                pesertaPayload = {
                    kategori: firstSubmissionData.kategori,
                    nama: firstSubmissionData.nama,
                    kampus: firstSubmissionData.kampus,
                    nim: nimTahap2,
                    prodi: firstSubmissionData.prodi,
                    angkatan: firstSubmissionData.angkatan,
                    semester: firstSubmissionData.semester,
                    email_wa: firstSubmissionData.email_wa,
                    bukti_bayar: buktiUrl,
                    status_pembayaran: 'pending',
                    site_type: 'pkkmb',
                    jenis_form: 'wajib',
                    kode_form: firstSubmissionData.kode_form,
                    kelas: selectedKelas,
                    metode_pembayaran: metodePembayaran || null
                };
            } else {
                const m = members[0];
                let finalKampusWajib = kategori;
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
                    finalKelasWajib = formConfig?.site === 'pkkmb' ? selectedKelas : (m.kelas || 'Reguler');
                } else {
                    finalKelasWajib = kategori;
                }

                const kodePesertaWajib = formConfig?.kode_form ? generateKodePeserta(formConfig.kode_form) : null;

                pesertaPayload = {
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
                    kelas: finalKelasWajib,
                    metode_pembayaran: metodePembayaran || null
                };
            }

            const res = await insertPeserta(pesertaPayload);
            if (!res.success) throw new Error(res.error);

            // SIMPAN DATA MEDIS (hanya site pkkmb dan bukan tahap 2)
            if (formConfig?.site === 'pkkmb' && !isTahap2) {
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

            // SIMPAN DATA PEMBAYARAN PKKMB (hanya site pkkmb)
            if (formConfig?.site === 'pkkmb') {
                const activePricing = pricingList.find(p => p.kelas === selectedKelas && p.jenis_tahapan === tahapan);
                const nominalPembayaran = activePricing ? activePricing.nominal : 0;

                const pembPayload = {
                    nim_user: finalNimWajib,
                    jenis_bayar: jenisBayar,
                    tahapan: tahapan,
                    nominal: nominalPembayaran,
                    status_pembayaran: 'pending'
                };
                const pembRes = await insertPembayaranPkkmb(pembPayload);
                if (!pembRes.success) throw new Error(pembRes.error);
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

            <form onSubmit={handleSubmit} className="p-6 sm:p-10 relative">
                
                {/* Form Overlay pas Submit */}
                {submitting && (
                    <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-sm rounded-3xl flex items-center justify-center pointer-events-auto">
                        <div className="flex flex-col items-center gap-4 bg-white dark:bg-slate-800 px-8 py-6 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700">
                            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-base font-bold text-slate-800 dark:text-white">Memproses Pendaftaran...</span>
                        </div>
                    </div>
                )}
                
                <fieldset disabled={submitting} className="space-y-8">

                {/* Switch Kategori */}
                {/* <div className="p-6 rounded-3xl bg-gray-50/50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-5 bg-blue-500 rounded-full"></span>
                        Kategori Pendaftar
                    </h4>
                    <div className="relative flex p-1.5 bg-gray-200/50 dark:bg-gray-900/50 rounded-2xl">
                        {availableKategori.map((cat) => {
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
                </div> */}

                {/* PKKMB: Kelas & Jenis Bayar Selector */}
                {formConfig?.site === 'pkkmb' && (
                    <div className="p-6 rounded-3xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 space-y-5">
                        <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <span className="w-1.5 h-5 bg-indigo-500 rounded-full"></span>
                            Kelas &amp; Jenis Pembayaran
                        </h4>

                        {/* Kelas */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Kelas *</label>
                            <select
                                required
                                value={selectedKelas}
                                onChange={(e) => setSelectedKelas(e.target.value)}
                                className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="" disabled>Pilih Kelas</option>
                                <option value="Reguler">Reguler</option>
                                <option value="NonReguler">Non Reguler</option>
                                <option value="KIP">KIP (Kartu Indonesia Pintar)</option>
                            </select>
                        </div>

                        {/* Jenis Bayar */}
                        {selectedKelas && selectedKelas !== 'KIP' && (
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Jenis Pembayaran *</label>
                                <select
                                    required
                                    value={jenisBayar}
                                    onChange={(e) => {
                                        setJenisBayar(e.target.value);
                                        setTahapan('');
                                    }}
                                    className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="" disabled>Pilih Jenis Pembayaran</option>
                                    <option value="langsung">Langsung Full</option>
                                    <option value="bertahap">Bertahap (Cicil)</option>
                                </select>
                            </div>
                        )}

                        {/* KIP info: forced to full */}
                        {selectedKelas === 'KIP' && (
                            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 rounded-xl text-sm flex items-start gap-2">
                                <Info size={16} className="mt-0.5 shrink-0" />
                                <p>Kelas KIP hanya dapat melakukan pembayaran <strong>Full</strong> sekaligus.</p>
                            </div>
                        )}

                        {/* Tahapan Selector */}
                        {jenisBayar && selectedKelas && (() => {
                            const tahapanOptions = selectedKelas === 'KIP'
                                ? [{ label: 'Full (Lunas Sekaligus)', value: 'full' }]
                                : jenisBayar === 'langsung'
                                    ? [{ label: 'Full (Lunas Sekaligus)', value: 'full' }]
                                    : [
                                        { label: 'Tahap 1 (DP)', value: 'tahap 1' },
                                        { label: 'Tahap 2 (Pelunasan)', value: 'tahap 2' }
                                    ];

                            const activePricing = pricingList.find(p => p.kelas === selectedKelas && p.jenis_tahapan === tahapan);
                            const nominalDisplay = activePricing ? activePricing.nominal : null;

                            return (
                                <div className="space-y-3">
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Tahapan *</label>
                                    <div className="flex gap-2">
                                        {tahapanOptions.map(opt => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setTahapan(opt.value)}
                                                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${tahapan === opt.value
                                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                                                    : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-indigo-400'
                                                    }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>

                                    {nominalDisplay !== null && (
                                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-800 dark:text-indigo-300 text-sm font-semibold">
                                            Nominal: <span className="text-lg">Rp {nominalDisplay.toLocaleString('id-ID')}</span>
                                        </div>
                                    )}

                                    {/* NIM input for Tahap 2 */}
                                    {tahapan === 'tahap 2' && (
                                        <div className="space-y-2">
                                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400">NIM (dari Pendaftaran Tahap 1) *</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={nimTahap2}
                                                    onChange={(e) => setNimTahap2(e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 9))}
                                                    placeholder="Masukkan NIM 9 karakter"
                                                    maxLength={9}
                                                    className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                                />
                                                {validatingNim && (
                                                    <div className="absolute right-3 top-3.5 animate-spin h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                                                )}
                                            </div>
                                            {firstSubmissionData && (
                                                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-green-800 dark:text-green-300 text-xs">
                                                    ✅ <strong>{firstSubmissionData.nama}</strong> ditemukan. Data akan otomatis terisi.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                )}

                {/* Data Pendaftar - hide if Tahap 2 (auto-filled) */}
                {formConfig?.site !== 'pkkmb' || tahapan !== 'tahap 2' ? (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                            <div className="flex items-center gap-3">
                                <Users className="text-purple-500" size={20} />
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Data Pendaftar</h3>
                            </div>
                        </div>

                        {members.map((member, index) => (
                            <div key={index} className="p-5 sm:p-6 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-2xl relative group transition-all">

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 font-semibold">Nama Lengkap *</label>
                                        <input
                                            type="text" required value={member.nama} onChange={(e) => handleMemberChange(index, 'nama', e.target.value)}
                                            className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

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
                                            <div className="flex bg-gray-200 dark:bg-gray-700 p-1 rounded-lg gap-1">
                                                <button type="button" onClick={() => handleMemberChange(index, 'isStudent', false)} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${!member.isStudent ? 'bg-white dark:bg-gray-600 shadow text-gray-800 dark:text-white' : 'text-gray-500 hover:text-gray-700'}`}>Tidak</button>
                                                <button type="button" onClick={() => handleMemberChange(index, 'isStudent', true)} className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${member.isStudent ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700'}`}>Ya</button>
                                            </div>
                                        </div>
                                    )}

                                    {(isMhsLP3I || isAlumniLP3I || kategori === 'Dosen') && (
                                        <>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Kampus *</label>
                                                {formConfig?.site === 'pkkmb' ? (
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

                                    {isMhsLP3I && member.kampus && member.kampus !== 'Kampus Bandung' && member.kampus !== 'Lainnya' && (formConfig?.butuh_bukti !== false) && !(formConfig?.site === 'pkkmb') && (
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

                                    {isMhsLP3I && member.kampus === 'Lainnya' && (formConfig?.butuh_bukti !== false) && !(formConfig?.site === 'pkkmb') && (
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
                                    {((isMhsLP3I && (formConfig?.butuh_bukti !== false) && (member.kampus !== 'Kampus Bandung') && !(formConfig?.site === 'pkkmb')) || kategori === 'Siswa' || (kategori === 'Umum' && member.isStudent)) && (
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

                        {/* Form Tambahan Medis PKKMB */}
                        {formConfig?.site === 'pkkmb' && (
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
                    </div>
                ) : null}

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
                </fieldset>
            </form>
        </div>
    );
}