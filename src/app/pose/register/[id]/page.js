'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import { Trophy, ArrowLeft, Plus, Trash2, Users, Send, Info, Image as ImageIcon, Camera } from 'lucide-react';
import Link from 'next/link';
import { PRODI_DATA, Angkatan_DATA, KAMPUS_DATA } from '@/lib/lombaData';
import { nanoid } from 'nanoid';

// Validasi string (anti-XSS sederhana)
const isValidInput = (str) => {
    if (!str) return true;
    const regex = /[<>'\"\\\/]/;
    return !regex.test(str);
};

export default function DynamicFormRegisterPage() {
    const { id } = useParams();
    const router = useRouter();

    const [formConfig, setFormConfig] = useState(null);
    const [loadingConfig, setLoadingConfig] = useState(true);
    const [notFound, setNotFound] = useState(false);

    const [isUmum, setIsUmum] = useState(false);
    const [teamName, setTeamName] = useState('');
    const [teamContent, setTeamContent] = useState('');
    const [buktiBayarFile, setBuktiBayarFile] = useState(null);
    const [logoFile, setLogoFile] = useState(null);

    const [members, setMembers] = useState([
        { nama: '', nim: '', prodi: '', angkatan: '', kampus: '', email_wa: '', jabatan: '' }
    ]);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const fetchFormConfig = async () => {
            const { data, error } = await supabase
                .from('form_register')
                .select('*')
                .eq('link_id', id)
                .single();

            if (error || !data) {
                setNotFound(true);
            } else {
                setFormConfig(data);
            }
            setLoadingConfig(false);
        };

        if (id) fetchFormConfig();
    }, [id]);

    const handleAddMember = () => {
        setMembers([...members, { nama: '', nim: '', prodi: '', angkatan: '', kampus: '', email_wa: '', jabatan: '' }]);
    };

    const handleRemoveMember = (index) => {
        const newMembers = [...members];
        newMembers.splice(index, 1);
        setMembers(newMembers);
    };

    const handleMemberChange = (index, field, value) => {
        const newMembers = [...members];
        newMembers[index][field] = value;
        setMembers(newMembers);
    };

    const uploadFile = async (file, bucketName) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${nanoid(8)}.${fileExt}`;
        const filePath = `uploads/${fileName}`;

        const { error, data } = await supabase.storage.from(bucketName).upload(filePath, file);
        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(filePath);
        return publicUrl;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // VALIDATION
        if (!isValidInput(teamName) || !isValidInput(teamContent)) {
            return window.alert("Karakter seperti < > ' \" \\ / tidak diperbolehkan pada input Nama/Deskripsi.");
        }
        for (const m of members) {
            if (!isValidInput(m.nama) || !isValidInput(m.jabatan) || !isValidInput(m.email_wa)) {
                return window.alert("Karakter seperti < > ' \" \\ / tidak diperbolehkan pada input anggota.");
            }
            if (!isUmum) {
                if (!isValidInput(m.nim)) return window.alert("Karakter tidak valid pada NIM.");
            }
        }
        if (!buktiBayarFile) {
            return window.alert("Mohon unggah bukti pembayaran.");
        }

        setSubmitting(true);

        try {
            // Upload images
            let buktiUrl = null;
            let logoUrl = null;
            
            buktiUrl = await uploadFile(buktiBayarFile, 'bukti-bayar');
            
            if (logoFile) {
                logoUrl = await uploadFile(logoFile, 'team-images');
            }

            // Generate or Get User Token
            let token = localStorage.getItem('pose_user_token');
            if (!token) {
                token = nanoid(32);
                localStorage.setItem('pose_user_token', token);
            }

            // 1. Insert Team
            const { data: teamData, error: teamError } = await supabase
                .from('team')
                .insert([{
                    title: teamName,
                    content: teamContent || `Pendaftaran Lomba ${formConfig.nama_lomba}`,
                    type: 'pose',
                    jenis_lomba: formConfig.jenis_lomba,
                    nama_lomba: formConfig.nama_lomba,
                    bukti_bayar: buktiUrl,
                    gambar: logoUrl,
                    user_token: token
                }])
                .select()
                .single();

            if (teamError) throw teamError;

            // 2. Insert Members
            const membersToInsert = members.map(m => ({
                team_id: teamData.id,
                nama: m.nama,
                jabatan: m.jabatan,
                prodi: isUmum ? 'Umum' : m.prodi,
                angkatan: isUmum ? 'Umum' : m.angkatan,
                nim: isUmum ? 'Umum' : m.nim,
                email_wa: m.email_wa,
                kampus: isUmum ? 'Umum' : m.kampus
            }));

            const { error: membersError } = await supabase
                .from('team_members')
                .insert(membersToInsert);

            if (membersError) throw membersError;

            setSuccess(true);
        } catch (error) {
            console.error('Submission error:', error);
            window.alert('Gagal mengirim pendaftaran. Pastikan form dan foto sudah benar atau coba lagi nanti.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingConfig) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
                <div className="text-gray-400 mb-4"><Trophy size={64} /></div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Form Tidak Ditemukan</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Link form pendaftaran ini tidak valid atau sudah dihapus.</p>
                <Link href="/pose/register" className="text-blue-600 hover:underline inline-flex items-center gap-2">
                    <ArrowLeft size={16} /> Kembali ke Daftar Lomba
                </Link>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
                <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl max-w-lg w-full text-center border border-gray-100 dark:border-gray-800">
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Trophy size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Pendaftaran Berhasil!</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">
                        Tim <strong>{teamName}</strong> berhasil didaftarkan untuk lomba {formConfig.nama_lomba}.
                    </p>
                    <div className="space-y-3">
                        <Link href="/pose/register/dashboard" className="inline-flex items-center justify-center w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors">
                            Lihat Status Pendaftaran
                        </Link>
                        <Link href="/pose/register" className="inline-flex items-center justify-center w-full px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-colors">
                            Kembali ke Daftar Lomba
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-12 sm:pt-32 sm:pb-20 bg-gray-50 dark:bg-gray-950">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
                
                <Link href="/pose/register" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 mb-6 transition-colors">
                    <ArrowLeft size={16} /> Kembali
                </Link>

                <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                    {/* Form Header */}
                    {formConfig.gambar && (
                        <div className="w-full h-48 sm:h-64 relative">
                            <img src={formConfig.gambar} alt="Header" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            <div className="absolute bottom-6 left-6 right-6">
                                <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider rounded-full mb-3 inline-block">
                                    {formConfig.jenis_lomba}
                                </span>
                                <h1 className="text-3xl font-bold text-white">{formConfig.nama_lomba}</h1>
                            </div>
                        </div>
                    )}
                    {!formConfig.gambar && (
                        <div className="p-8 sm:p-10 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider rounded-full mb-3 inline-block">
                                {formConfig.jenis_lomba}
                            </span>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{formConfig.nama_lomba}</h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">Formulir pendaftaran resmi POSE 2026</p>
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
                        
                        {/* Switch Umum */}
                        <div className="flex items-center justify-between p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-white">Pendaftar Luar Kampus / Umum</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Aktifkan ini jika peserta bukan dari mahasiswa internal (NIM/Kampus tidak wajib).</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" checked={isUmum} onChange={(e) => setIsUmum(e.target.checked)} />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        {/* Identitas Tim */}
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
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bukti Pembayaran (Wajib) *</label>
                                    <input 
                                        type="file" required accept="image/*" onChange={(e) => setBuktiBayarFile(e.target.files[0])}
                                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
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

                        {/* Anggota Tim */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                                <div className="flex items-center gap-3">
                                    <Users className="text-purple-500" size={20} />
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Data Anggota</h3>
                                </div>
                                <span className="text-sm text-gray-500 font-semibold">{members.length} Anggota</span>
                            </div>

                            {members.map((member, index) => (
                                <div key={index} className="p-5 sm:p-6 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-2xl relative group transition-all">
                                    {index > 0 && (
                                        <button 
                                            type="button" onClick={() => handleRemoveMember(index)}
                                            className="absolute -top-3 -right-3 bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 p-2 rounded-full shadow hover:bg-red-200"
                                            title="Hapus Anggota"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                    <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 text-xs flex items-center justify-center">{index + 1}</span>
                                        {index === 0 ? 'Data Anggota Utama / Pendaftar' : `Data Anggota ${index}`}
                                    </h4>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nama Lengkap *</label>
                                            <input 
                                                type="text" required value={member.nama} onChange={(e) => handleMemberChange(index, 'nama', e.target.value)}
                                                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Jabatan *</label>
                                            <input 
                                                type="text" required value={member.jabatan} onChange={(e) => handleMemberChange(index, 'jabatan', e.target.value)}
                                                placeholder="Contoh: Ketua, Striker, Anggota"
                                                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">WhatsApp / Email *</label>
                                            <input 
                                                type="text" required value={member.email_wa} onChange={(e) => handleMemberChange(index, 'email_wa', e.target.value)}
                                                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        {!isUmum && (
                                            <>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">NIM *</label>
                                                    <input 
                                                        type="text" required={!isUmum} value={member.nim} onChange={(e) => handleMemberChange(index, 'nim', e.target.value)}
                                                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Kampus *</label>
                                                    <select 
                                                        required={!isUmum} value={member.kampus} onChange={(e) => handleMemberChange(index, 'kampus', e.target.value)}
                                                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        <option value="" disabled>Pilih Kampus</option>
                                                        {KAMPUS_DATA.map(k => <option key={k} value={k}>{k}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Prodi *</label>
                                                    <select 
                                                        required={!isUmum} value={member.prodi} onChange={(e) => handleMemberChange(index, 'prodi', e.target.value)}
                                                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        <option value="" disabled>Pilih Prodi</option>
                                                        {PRODI_DATA.map(p => <option key={p} value={p}>{p}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Angkatan *</label>
                                                    <select 
                                                        required={!isUmum} value={member.angkatan} onChange={(e) => handleMemberChange(index, 'angkatan', e.target.value)}
                                                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        <option value="" disabled>Pilih Angkatan</option>
                                                        {Angkatan_DATA.map(a => <option key={a} value={a}>{a}</option>)}
                                                    </select>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}

                            <button 
                                type="button" 
                                onClick={handleAddMember}
                                className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl text-gray-500 hover:text-blue-600 hover:border-blue-300 dark:hover:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/10 flex items-center justify-center gap-2 font-medium transition-all"
                            >
                                <Plus size={18} /> Tambah Anggota (Jika Ada)
                            </button>
                        </div>

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
            </div>
        </div>
    );
}
