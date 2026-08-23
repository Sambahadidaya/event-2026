'use client';

import { useState } from 'react';
import { Send, UploadCloud, Link as LinkIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { submitPengumpulan, verifyKodeFormTeam } from '@/api/supabase/public/submission';
import { uploadFile } from '@/api/supabase/storage';

export default function FormPengumpulan({ formData }) {
    const [kodeForm, setKodeForm] = useState('');
    const [keterangan, setKeterangan] = useState('');
    const [isUrl, setIsUrl] = useState(false);
    const [fileLink, setFileLink] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);

    const [kodeValid, setKodeValid] = useState(null);
    const [kodeError, setKodeError] = useState('');
    const [kodeLoading, setKodeLoading] = useState(false);
    const [teamData, setTeamData] = useState(null);

    const [submitLoading, setSubmitLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const handleVerifyKode = async () => {
        if (!kodeForm || kodeForm.trim().length < 5) return;

        setKodeLoading(true);
        setKodeError('');
        setKodeValid(null);
        setTeamData(null);

        const res = await verifyKodeFormTeam(kodeForm.trim());
        if (res.success) {
            if (res.data?.nama_lomba !== formData.form_register?.nama_lomba) {
                setKodeValid(false);
                setKodeError(`Kode ini tidak terdaftar untuk lomba ${formData.form_register?.nama_lomba}`);
            } else {
                setKodeValid(true);
                setTeamData(res.data);
            }
        } else {
            setKodeValid(false);
            setKodeError(res.error || 'Kode tidak valid');
        }
        setKodeLoading(false);
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 10 * 1024 * 1024) {
                alert('Ukuran file maksimal adalah 10MB.');
                e.target.value = null;
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!kodeValid) {
            alert('Mohon verifikasi Kode Form Anda terlebih dahulu.');
            return;
        }

        if (!isUrl && !selectedFile) {
            alert('Pilih file untuk diupload.');
            return;
        }

        if (isUrl && !fileLink) {
            alert('Masukkan link URL yang valid.');
            return;
        }

        setSubmitLoading(true);

        let finalLink = fileLink;

        if (!isUrl && selectedFile) {
            const uploadFormData = new FormData();
            uploadFormData.append('file', selectedFile);

            const uploadRes = await uploadFile(uploadFormData, 'team-images', 'pengumpulan/');
            if (!uploadRes.success) {
                alert('Gagal mengupload file: ' + uploadRes.error);
                setSubmitLoading(false);
                return;
            }
            finalLink = uploadRes.url || uploadRes.publicUrl;
        }

        const payload = {
            form_id: formData.id,
            kode_form: kodeForm.trim(),
            keterangan,
            file_link: finalLink,
            isUrl
        };

        const submitRes = await submitPengumpulan(payload);

        if (submitRes.success) {
            setSuccessMessage('Karya Anda berhasil dikumpulkan! Panitia akan segera memeriksanya.');
        } else {
            alert('Gagal mengumpulkan: ' + submitRes.error);
        }

        setSubmitLoading(false);
    };

    if (successMessage) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 sm:p-12 shadow-xl border border-gray-100 dark:border-gray-800 text-center animate-in zoom-in duration-500 max-w-2xl mx-auto mt-8">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={40} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Pengumpulan Berhasil!</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-8">{successMessage}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
                >
                    Kumpulkan Karya Lain
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto mt-8">
            <div className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-xl border border-gray-100 dark:border-gray-800">
                {/* Header */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 sm:p-12 text-center relative overflow-hidden">
                    {(formData?.gambar || formData?.form_register?.gambar) && (
                        <img
                            src={formData.gambar || formData.form_register.gambar}
                            alt={formData.form_register?.nama_lomba}
                            className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
                        />
                    )}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>

                    <div className="relative z-10">
                        <span className="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-medium mb-4">
                            Pengumpulan Karya
                        </span>
                        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                            {formData.form_register?.nama_lomba}
                        </h1>
                        <p className="text-blue-100 text-lg max-w-2xl mx-auto">
                            {formData.form_register?.keterangan || 'Silakan unggah karya tim Anda melalui form ini.'}
                        </p>
                    </div>
                </div>

                {/* Form Body */}
                <div className="p-6 sm:p-10">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Verifikasi Tim */}
                        <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
                            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                Kode Form/Tim <span className="text-red-500">*</span>
                            </label>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                                Masukkan kode form yang didapat saat pendaftaran tim untuk memverifikasi identitas Anda. (Contoh: PsKrBmc28MF54xL)
                            </p>
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    required
                                    value={kodeForm}
                                    onChange={(e) => setKodeForm(e.target.value)}
                                    placeholder="Contoh: PsKrBmc28MF54xL"
                                    className="flex-1 px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                                />
                                <button
                                    type="button"
                                    onClick={handleVerifyKode}
                                    disabled={kodeLoading || !kodeForm}
                                    className="px-6 py-3 bg-gray-900 hover:bg-black dark:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
                                >
                                    {kodeLoading ? 'Cek...' : 'Verifikasi'}
                                </button>
                            </div>

                            {kodeValid === true && teamData && (
                                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-start gap-3 animate-in fade-in">
                                    <CheckCircle2 className="text-green-500 shrink-0 mt-0.5" size={18} />
                                    <div>
                                        <p className="text-sm font-medium text-green-800 dark:text-green-300">Tim Terverifikasi!</p>
                                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                            Nama Tim: <strong>{teamData.title}</strong>
                                        </p>
                                    </div>
                                </div>
                            )}

                            {kodeValid === false && (
                                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3 animate-in fade-in">
                                    <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                                    <p className="text-sm text-red-600 dark:text-red-400">{kodeError}</p>
                                </div>
                            )}
                        </div>

                        {/* Tipe Upload */}
                        <div className="space-y-4">
                            <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                                Metode Pengumpulan <span className="text-red-500">*</span>
                            </label>

                            <div className="flex gap-4">
                                <label className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${!kodeValid
                                        ? 'border-gray-200 dark:border-gray-700 bg-gray-55/30 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50'
                                        : !isUrl
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 cursor-pointer'
                                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer'
                                    }`}>
                                    <input type="radio" name="uploadType" checked={!isUrl} onChange={() => setIsUrl(false)} disabled={!kodeValid} className="hidden" />
                                    <UploadCloud size={20} />
                                    <span className="font-medium">Upload File</span>
                                </label>
                                <label className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${!kodeValid
                                        ? 'border-gray-200 dark:border-gray-700 bg-gray-55/30 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50'
                                        : isUrl
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 cursor-pointer'
                                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer'
                                    }`}>
                                    <input type="radio" name="uploadType" checked={isUrl} onChange={() => setIsUrl(true)} disabled={!kodeValid} className="hidden" />
                                    <LinkIcon size={20} />
                                    <span className="font-medium">Input Link</span>
                                </label>
                            </div>

                            <div className="mt-4 p-5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 animate-in fade-in">
                                {!isUrl ? (
                                    <div key="file-input" className="space-y-2">
                                        <label className="block text-sm text-gray-700 dark:text-gray-300">Pilih File (Max 10MB)</label>
                                        <input
                                            type="file"
                                            onChange={handleFileChange}
                                            required={!isUrl}
                                            disabled={!kodeValid}
                                            accept=".pdf,.zip,.rar,.png,.jpg,.jpeg"
                                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                        <p className="text-xs text-gray-500 mt-2">Mendukung: PDF, ZIP, RAR, Image</p>
                                    </div>
                                ) : (
                                    <div key="url-input" className="space-y-2">
                                        <label className="block text-sm text-gray-700 dark:text-gray-300">URL Google Drive / YouTube</label>
                                        <input
                                            type="url"
                                            required={isUrl}
                                            disabled={!kodeValid}
                                            value={fileLink}
                                            onChange={(e) => setFileLink(e.target.value)}
                                            placeholder="https://drive.google.com/..."
                                            className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                        <p className="text-xs text-gray-500 mt-2">Pastikan link memiliki akses publik (Siapa saja yang memiliki link dapat melihat).</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Keterangan */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                Keterangan / Deskripsi Karya
                            </label>
                            <textarea
                                rows={4}
                                value={keterangan}
                                onChange={(e) => setKeterangan(e.target.value)}
                                disabled={!kodeValid}
                                placeholder="Jelaskan secara singkat mengenai karya tim Anda..."
                                className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                            ></textarea>
                        </div>

                        {/* Submit */}
                        <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                            <button
                                type="submit"
                                disabled={submitLoading || !kodeValid}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-blue-500/30"
                            >
                                {submitLoading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Mengirim...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send size={20} />
                                        <span>Kumpulkan Karya</span>
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
