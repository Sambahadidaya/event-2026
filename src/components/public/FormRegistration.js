'use client';

import { useState } from 'react';
import { uploadFile as serverUploadFile } from '@/api/supabase/storage';
import { insertPeserta, insertPesertaBatch } from '@/api/supabase/peserta';
import { insertTeamPublic, insertTeamMembers } from '@/api/supabase/team';
import { Trophy, Plus, Trash2, Users, Send, Info, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { KAMPUS_DATA, parseNIM } from '@/lib/lombaData';
import { nanoid } from 'nanoid';

const isValidInput = (str) => {
    if (!str) return true;
    const regex = /[<>'\"\\\/]/;
    return !regex.test(str);
};

export default function FormRegistration({ formConfig, isWajib = false }) {
    // isWajib=true -> Pendaftaran Wajib (single participant, table: peserta_wajib)
    // isWajib=false -> Pendaftaran Lomba (team, table: team & team_members)

    const [kategori, setKategori] = useState('Mahasiswa'); // Mahasiswa, Dosen, Umum
    
    // Team Fields (Only for Lomba)
    const [teamName, setTeamName] = useState('');
    const [teamContent, setTeamContent] = useState('');
    const [logoFile, setLogoFile] = useState(null);

    // Common
    const [buktiBayarFile, setBuktiBayarFile] = useState(null);

    // Members (For Wajib, it's just 1 member always)
    const [members, setMembers] = useState([
        { nama: '', nim: '', kampus: '', email_wa: '', jabatan: 'Pendaftar' }
    ]);
    
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const requiresBukti = isWajib || formConfig?.butuh_bukti !== false;

    const handleAddMember = () => {
        setMembers([...members, { nama: '', nim: '', kampus: '', email_wa: '', jabatan: '' }]);
    };

    const handleRemoveMember = (index) => {
        const newMembers = [...members];
        newMembers.splice(index, 1);
        setMembers(newMembers);
    };

    const handleMemberChange = (index, field, value) => {
        const newMembers = [...members];
        newMembers[index][field] = value;
        
        // Auto parse NIM if field is NIM and kategori is Mahasiswa
        if (field === 'nim' && value.length >= 9) {
            const parsed = parseNIM(value, newMembers[index].kampus);
            if (parsed) {
                // We don't store it in state, we compute it on submit, 
                // but we could store it if we wanted to show it.
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        // VALIDATION
        if (!isWajib) {
            if (!isValidInput(teamName) || !isValidInput(teamContent)) {
                return window.alert("Karakter tidak diperbolehkan pada input Nama/Deskripsi.");
            }
        }
        
        for (const m of members) {
            if (!isValidInput(m.nama) || !isValidInput(m.jabatan) || !isValidInput(m.email_wa)) {
                return window.alert("Karakter tidak diperbolehkan pada input anggota.");
            }
            if (kategori === 'Mahasiswa') {
                if (!isValidInput(m.nim)) return window.alert("Karakter tidak valid pada NIM.");
                if (m.nim.length !== 9) return window.alert("NIM harus berisi persis 9 karakter.");
            }
        }
        
        if (requiresBukti && !buktiBayarFile) {
            return window.alert("Mohon unggah bukti pembayaran.");
        }

        setSubmitting(true);

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
                const isMhs = kategori === 'Mahasiswa';
                let parsedNIM = null;
                if (isMhs && m.nim && m.kampus) {
                    parsedNIM = parseNIM(m.nim, m.kampus);
                }

                const pesertaPayload = {
                    kategori: kategori,
                    nama: m.nama,
                    kampus: isMhs ? m.kampus : kategori,
                    nim: isMhs ? m.nim : kategori,
                    prodi: isMhs && parsedNIM ? parsedNIM.prodiName : kategori,
                    angkatan: isMhs && parsedNIM ? parsedNIM.angkatan : kategori,
                    email_wa: m.email_wa,
                    bukti_bayar: buktiUrl,
                    status_pembayaran: 'Pending',
                    site_type: formConfig?.site || null
                };

                const res = await insertPeserta(pesertaPayload);
                if (!res.success) throw new Error(res.error);

            } else {
                // INSERT KE team, team_members, & peserta
                let token = localStorage.getItem('pose_user_token');
                
                // Cek apakah token dari cache adalah UUID yang valid (panjang 36 karakter dengan format spesifik)
                const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token);
                
                if (!token || !isValidUUID) {
                    token = crypto.randomUUID();
                    localStorage.setItem('pose_user_token', token);
                }

                const teamRes = await insertTeamPublic({
                    title: teamName,
                    content: teamContent || `Pendaftaran Lomba ${formConfig.nama_lomba}`,
                    type: 'pose',
                    jenis_lomba: formConfig.jenis_lomba,
                    nama_lomba: formConfig.nama_lomba,
                    bukti_bayar: buktiUrl,
                    gambar: logoUrl,
                    user_token: token
                });

                if (!teamRes.success) throw new Error(teamRes.error);
                const teamData = teamRes.data;
                if (!teamData || !teamData.id) throw new Error('Gagal mendapatkan data tim setelah insert.');

                const teamMembersToInsert = [];
                const pesertaToInsert = [];

                for (const m of members) {
                    const isMhs = kategori === 'Mahasiswa';
                    let parsedNIM = null;
                    if (isMhs && m.nim && m.kampus) {
                        parsedNIM = parseNIM(m.nim, m.kampus);
                    }
                    
                    const finalKampus = isMhs ? m.kampus : kategori;
                    const finalNim = isMhs ? m.nim : kategori;
                    const finalProdi = isMhs && parsedNIM ? parsedNIM.prodiName : kategori;
                    const finalAngkatan = isMhs && parsedNIM ? parsedNIM.angkatan : kategori;

                    teamMembersToInsert.push({
                        team_id: teamData.id,
                        nama: m.nama,
                        jabatan: m.jabatan,
                        kode: finalNim
                    });

                    pesertaToInsert.push({
                        kategori: kategori,
                        nama: m.nama,
                        kampus: finalKampus,
                        nim: finalNim,
                        prodi: finalProdi,
                        angkatan: finalAngkatan,
                        email_wa: m.email_wa,
                        bukti_bayar: buktiUrl,
                        status_pembayaran: 'Pending',
                        site_type: formConfig?.site || null
                    });
                }

                const membersRes = await insertTeamMembers(teamMembersToInsert);
                if (!membersRes.success) throw new Error(membersRes.error);

                const pesertaRes = await insertPesertaBatch(pesertaToInsert);
                if (!pesertaRes.success) throw new Error(pesertaRes.error);
            }

            setSuccess(true);
        } catch (error) {
            console.error('Submission error:', error);
            window.alert('Gagal mengirim pendaftaran. Pastikan data sudah benar atau coba lagi nanti.');
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
                    Data berhasil didaftarkan untuk {formConfig.nama_lomba || formConfig.judul}.
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
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
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
                    <div className="flex gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50">
                        <Info className="text-blue-500 shrink-0 mt-0.5" size={20} />
                        <div>
                            <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-1">Informasi & Ketentuan</h4>
                            <p className="text-sm text-blue-700 dark:text-blue-400 whitespace-pre-wrap leading-relaxed">
                                {formConfig.keterangan}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-8">
                
                {/* Switch Kategori (Hanya untuk Lomba) */}
                {!isWajib && (
                    <div className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                        <h4 className="font-bold text-gray-900 dark:text-white mb-3">Kategori Pendaftar</h4>
                        <div className="flex gap-4">
                            {['Mahasiswa', 'Dosen', 'Umum'].map(cat => (
                                <label key={cat} className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="kategori" 
                                        value={cat} 
                                        checked={kategori === cat}
                                        onChange={(e) => setKategori(e.target.value)}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{cat}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

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
                        {!isWajib && <span className="text-sm text-gray-500 font-semibold">{members.length} Anggota</span>}
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
                            
                            {!isWajib && (
                                <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 text-xs flex items-center justify-center">{index + 1}</span>
                                    {index === 0 ? 'Data Anggota Utama / Pendaftar' : `Data Anggota ${index}`}
                                </h4>
                            )}
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nama Lengkap *</label>
                                    <input 
                                        type="text" required value={member.nama} onChange={(e) => handleMemberChange(index, 'nama', e.target.value)}
                                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                {!isWajib && (
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Jabatan *</label>
                                        <input 
                                            type="text" required value={member.jabatan} onChange={(e) => handleMemberChange(index, 'jabatan', e.target.value)}
                                            placeholder="Contoh: Ketua, Striker, Anggota"
                                            className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">WhatsApp / Email *</label>
                                    <input 
                                        type="text" required value={member.email_wa} onChange={(e) => handleMemberChange(index, 'email_wa', e.target.value)}
                                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {kategori === 'Mahasiswa' && (
                                    <>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Kampus *</label>
                                            <select 
                                                required value={member.kampus} onChange={(e) => handleMemberChange(index, 'kampus', e.target.value)}
                                                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="" disabled>Pilih Kampus</option>
                                                {KAMPUS_DATA.map(k => <option key={k} value={k}>{k}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">NIM *</label>
                                            <input 
                                                type="text" required value={member.nim} onChange={(e) => handleMemberChange(index, 'nim', e.target.value)}
                                                placeholder="Contoh: 202502014"
                                                minLength={9}
                                                maxLength={9}
                                                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                            />
                                            {member.nim.length >= 9 && member.kampus && parseNIM(member.nim, member.kampus) && (
                                                <p className="text-xs text-green-600 mt-1">
                                                    Terdeteksi: {parseNIM(member.nim, member.kampus).prodiName} ({parseNIM(member.nim, member.kampus).angkatan})
                                                </p>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}

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
                
                {/* Bukti Pembayaran */}
                {requiresBukti && (
                    <div className="space-y-4 pt-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bukti Pembayaran (Wajib) *</label>
                            <input 
                                type="file" required accept="image/*" onChange={(e) => setBuktiBayarFile(e.target.files[0])}
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                        </div>
                    </div>
                )}

                <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                    <button 
                        type="submit" 
                        disabled={submitting}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
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
            </form>
        </div>
    );
}
