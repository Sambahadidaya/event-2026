import { getDocumentById } from '@/api/supabase/admin/finance';
import { ShieldCheck, FileText, CheckCircle2, AlertTriangle, Building2, Calendar, User, CreditCard } from 'lucide-react';
import Link from 'next/link';

export async function generateMetadata({ params }) {
    const { id } = await params;
    return {
        title: `Verifikasi Dokumen #${id?.slice(0, 8) || ''} - PKKMB 2026`,
        description: 'Halaman resmi verifikasi keaslian dokumen digital Portal Kampus PKKMB 2026',
    };
}

export default async function PublicPkkmbPdfPage({ params }) {
    const { id } = await params;
    const doc = await getDocumentById(id);

    const isNotFound = !doc;
    const site = 'pkkmb';
    const primaryColorClass = 'from-emerald-600 to-teal-700';
    const badgeColorClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10 px-4 flex flex-col items-center justify-center font-sans">
            <div className="max-w-xl w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
                {/* Header Banner */}
                <div className={`bg-gradient-to-r ${primaryColorClass} p-6 sm:p-8 text-white text-center relative overflow-hidden`}>
                    <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-md mb-3 border border-white/20">
                        <ShieldCheck size={36} className="text-white" />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight">PORTAL KAMPUS 2026</h1>
                    <p className="text-xs uppercase tracking-widest text-emerald-100 font-bold mt-1">VERIFIKASI DOKUMEN DIGITAL PKKMB</p>
                </div>

                <div className="p-6 sm:p-8 space-y-6">
                    {isNotFound ? (
                        <div className="text-center py-8 space-y-4">
                            <div className="inline-flex p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
                                <AlertTriangle size={48} />
                            </div>
                            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Dokumen Tidak Ditemukan</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                                Dokumen dengan ID <code className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs">{id}</code> tidak terdaftar atau telah dihapus dari sistem kami.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Verification Status Badge */}
                            <div className={`p-4 rounded-2xl border flex items-center justify-between ${badgeColorClass}`}>
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 size={24} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                                    <div>
                                        <h3 className="text-sm font-extrabold tracking-wide uppercase">DOKUMEN TERVERIFIKASI RESMI</h3>
                                        <p className="text-xs opacity-90">Dokumen asli dan tercatat pada database Portal Kampus 2026.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Main Document Details Grid */}
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4 text-sm">
                                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-3">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Kode Dokumen</span>
                                    <span className="font-mono font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                                        {doc.document_code || doc.id?.slice(0, 8)}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                        <FileText size={15} /> Jenis Dokumen
                                    </span>
                                    <span className="font-semibold text-slate-900 dark:text-white uppercase">
                                        {doc.document_type || 'Laporan / Invoice'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                        <Building2 size={15} /> Event / Site
                                    </span>
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                                        {doc.site || 'PKKMB'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                        <User size={15} /> Dicetak Oleh
                                    </span>
                                    <span className="font-semibold text-slate-900 dark:text-white">
                                        {doc.printed_by || 'Panitia Keuangan'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                        <Calendar size={15} /> Tanggal Diterbitkan
                                    </span>
                                    <span className="font-semibold text-slate-900 dark:text-white">
                                        {doc.created_at ? new Date(doc.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                                    </span>
                                </div>
                            </div>

                            {/* Referenced Data if available */}
                            {doc.reference_data && (
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Rincian Transaksi / Referensi</h4>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                                        {doc.reference_data.nama_payer && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Nama Pembayar:</span>
                                                <span className="font-bold text-slate-900 dark:text-white">{doc.reference_data.nama_payer}</span>
                                            </div>
                                        )}
                                        {doc.reference_data.nominal !== undefined && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Nominal:</span>
                                                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                                                    Rp {Number(doc.reference_data.nominal).toLocaleString('id-ID')}
                                                </span>
                                            </div>
                                        )}
                                        {doc.reference_data.keterangan && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Keterangan:</span>
                                                <span className="font-medium text-slate-700 dark:text-slate-300">{doc.reference_data.keterangan}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Footer Info */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-400 space-y-2">
                        <p>© 2026 Portal Kampus PKKMB - LP3I. Hak Cipta Dilindungi.</p>
                        <div>
                            <Link href="/pkkmb" className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold">
                                Kembali ke Website Utama PKKMB →
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
