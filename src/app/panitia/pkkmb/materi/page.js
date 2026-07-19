'use client';

import { useState, useEffect } from 'react';
import { getMateri } from '@/api/supabase/public/materi';
import { upsertMateri, deleteMateri } from '@/api/supabase/admin/materi';
import { uploadFile, deleteFile } from '@/api/supabase/storage';
import { BookOpen, Plus, Edit2, Trash2, CheckSquare, X, RefreshCw, Upload, FileText, Image as ImageIcon, Link as LinkIcon } from 'lucide-react';
import { nanoid } from 'nanoid';

export default function AdminPkkmbMateri() {
    const [materiList, setMateriList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [editingId, setEditingId] = useState(null);
    const [judul, setJudul] = useState('');
    const [pemateri, setPemateri] = useState('');
    const [tanggal, setTanggal] = useState('');
    const [statusMateri, setStatusMateri] = useState(false);
    const [fotoHeaderUrl, setFotoHeaderUrl] = useState('');
    const [filePdfUrl, setFilePdfUrl] = useState('');
    
    // File upload state
    const [fotoHeaderFile, setFotoHeaderFile] = useState(null);
    const [filePdf, setFilePdf] = useState(null);
    
    const fetchData = async () => {
        setLoading(true);
        const data = await getMateri();
        setMateriList(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const resetForm = () => {
        setEditingId(null);
        setJudul('');
        setPemateri('');
        setTanggal('');
        setStatusMateri(false);
        setFotoHeaderUrl('');
        setFilePdfUrl('');
        setFotoHeaderFile(null);
        setFilePdf(null);
        setShowForm(false);
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        setJudul(item.judul);
        setPemateri(item.pemateri);
        // Local formatting trick for datetime-local
        setTanggal(item.tanggal ? item.tanggal.substring(0, 16) : '');
        setStatusMateri(item.status);
        setFotoHeaderUrl(item.foto_header);
        setFilePdfUrl(item.file_pdf);
        setFotoHeaderFile(null);
        setFilePdf(null);
        setShowForm(true);
    };

    const handleUpload = async (file, bucket) => {
        const formData = new FormData();
        formData.append('file', file);
        return await uploadFile(formData, bucket);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            let finalFotoUrl = fotoHeaderUrl;
            let finalPdfUrl = filePdfUrl;

            // Upload Foto
            if (fotoHeaderFile) {
                const uploadRes = await handleUpload(fotoHeaderFile, 'materi-header');
                if (!uploadRes.success) throw new Error('Gagal upload foto: ' + uploadRes.error);
                finalFotoUrl = uploadRes.url;
            }

            // Upload PDF
            if (filePdf) {
                const uploadRes = await handleUpload(filePdf, 'materi-pkkmb');
                if (!uploadRes.success) throw new Error('Gagal upload PDF: ' + uploadRes.error);
                finalPdfUrl = uploadRes.url;
            }

            if (!finalFotoUrl || !finalPdfUrl) {
                throw new Error('Harap lengkapi Foto Header dan File PDF');
            }

            const payload = {
                judul,
                pemateri,
                tanggal: new Date(tanggal + 'Z').toISOString(),
                status: statusMateri,
                foto_header: finalFotoUrl,
                file_pdf: finalPdfUrl,
                // generate link_tugas only for new entry, retain existing if edit
                link_tugas: editingId ? materiList.find(m => m.id === editingId)?.link_tugas : nanoid(10)
            };

            const res = await upsertMateri(payload, editingId);
            if (!res.success) throw new Error(res.error);

            resetForm();
            fetchData();
        } catch (error) {
            alert(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (item) => {
        if (!confirm(`Hapus materi: ${item.judul}?`)) return;
        
        setIsSubmitting(true);
        // Attempt to delete files from storage (extract path from URL in production, but simplified here)
        // Since getPublicUrl gives full URL, to delete we need the exact path. Assuming it will just delete the DB row for now due to complexity.
        
        const res = await deleteMateri(item.id);
        if (!res.success) {
            alert('Gagal menghapus: ' + res.error);
        } else {
            fetchData();
        }
        setIsSubmitting(false);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Manajemen Materi PKKMB</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Kelola file presentasi, FAQ AI, dan tugas terkait materi PKKMB.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchData}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl transition-colors shadow-sm"
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                    <button
                        onClick={() => { resetForm(); setShowForm(true); }}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors"
                    >
                        <Plus size={16} /> Tambah Materi
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md border border-blue-100 dark:border-blue-900/50 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 flex items-center justify-between">
                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            {editingId ? <><Edit2 size={18} className="text-orange-500" /> Edit Materi</> : <><BookOpen size={18} className="text-blue-500" /> Tambah Materi Baru</>}
                        </h3>
                        <button type="button" onClick={resetForm} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Judul Materi *</label>
                                    <input required type="text" value={judul} onChange={e => setJudul(e.target.value)} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="Cth: Kebangsaan dan Bela Negara" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Nama Pemateri *</label>
                                    <input required type="text" value={pemateri} onChange={e => setPemateri(e.target.value)} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="Cth: Prof. Dr. Ir. Fulan, M.T." />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Tanggal & Waktu Materi *</label>
                                    <input required type="datetime-local" value={tanggal} onChange={e => setTanggal(e.target.value)} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                                </div>
                                <div className="flex items-center gap-3 pt-2">
                                    <input type="checkbox" id="status" checked={statusMateri} onChange={e => setStatusMateri(e.target.checked)} className="w-4 h-4 text-blue-600 rounded border-gray-300" />
                                    <label htmlFor="status" className="text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">Sembunyikan Materi (Draft)</label>
                                </div>
                            </div>

                            <div className="space-y-4 border-l border-gray-100 dark:border-gray-800 pl-0 md:pl-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Foto Header (Banner) {editingId && !fotoHeaderFile && <span className="text-green-500 font-normal text-xs ml-2">(Tersimpan)</span>}</label>
                                    <div className="relative border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <input type="file" accept="image/*" onChange={e => setFotoHeaderFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required={!editingId && !fotoHeaderUrl} />
                                        <div className="flex flex-col items-center gap-2">
                                            <ImageIcon size={24} className="text-blue-500" />
                                            <span className="text-sm text-gray-500">
                                                {fotoHeaderFile ? fotoHeaderFile.name : 'Klik atau seret gambar ke sini'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">File PDF Materi {editingId && !filePdf && <span className="text-green-500 font-normal text-xs ml-2">(Tersimpan)</span>}</label>
                                    <div className="relative border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4 text-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <input type="file" accept="application/pdf" onChange={e => setFilePdf(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required={!editingId && !filePdfUrl} />
                                        <div className="flex flex-col items-center gap-2">
                                            <FileText size={24} className="text-red-500" />
                                            <span className="text-sm text-gray-500">
                                                {filePdf ? filePdf.name : 'Klik atau seret PDF ke sini'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <button type="button" onClick={resetForm} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Batal</button>
                            <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 text-white shadow-sm transition-all bg-blue-600 hover:bg-blue-700">
                                {isSubmitting ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Upload size={16} />}
                                Simpan Materi
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-12 text-center text-gray-400 animate-pulse">Memuat data...</div>
                ) : materiList.length === 0 ? (
                    <div className="col-span-full py-12 text-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 text-gray-500">Belum ada materi yang ditambahkan</div>
                ) : materiList.map(item => (
                    <div key={item.id} className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col group relative">
                        <div className="h-32 bg-gray-200 dark:bg-gray-800 overflow-hidden relative">
                            <img src={item.foto_header} alt={item.judul} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            {item.status && <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-md">DRAFT</div>}
                        </div>
                        <div className="p-4 flex-1 flex flex-col">
                            <h3 className="font-bold text-gray-900 dark:text-white line-clamp-2" title={item.judul}>{item.judul}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex-1">{item.pemateri}</p>
                            
                            <div className="mt-4 flex items-center gap-2 text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 py-1.5 px-3 rounded-lg w-max mb-3">
                                <LinkIcon size={12} /> Link Tugas: {item.link_tugas}
                            </div>
                            
                            <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-3">
                                <span className="text-xs text-gray-500">
                                    {new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' })}
                                </span>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEdit(item)} className="p-1.5 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg"><Edit2 size={16} /></button>
                                    <button onClick={() => handleDelete(item)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
