'use client';

import { useEffect, useState } from 'react';
import { getFormRegisterByLinkId } from '@/api/supabase/public/peserta';
import { getJadwalAcara } from '@/api/supabase/public/jadwal';
import { useParams } from 'next/navigation';
import { Trophy, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import FormRegistration from '@/components/public/FormRegistration';

import SiteBackground from '@/components/public/SiteBackground';

export default function DynamicFormRegisterPage() {
    const { id } = useParams();
    const [formConfig, setFormConfig] = useState(null);
    const [loadingConfig, setLoadingConfig] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [jadwalStatus, setJadwalStatus] = useState('open'); // 'open', 'early', 'late'
    const [jadwalInfo, setJadwalInfo] = useState(null);

    useEffect(() => {
        const fetchFormConfigAndJadwal = async () => {
            const [data, jadwalData] = await Promise.all([
                getFormRegisterByLinkId(id),
                getJadwalAcara('pose')
            ]);

            if (!data) {
                setNotFound(true);
            } else {
                setFormConfig(data);
                
                // Check jadwal pendaftaran
                const pendaftaranJadwal = (jadwalData || []).find(j => j.jenis_jadwal === 'pendaftaran');
                if (pendaftaranJadwal) {
                    const now = new Date();
                    const mulai = new Date(pendaftaranJadwal.waktu_mulai);
                    const selesai = new Date(pendaftaranJadwal.waktu_selesai);
                    setJadwalInfo({ mulai, selesai });
                    
                    if (now < mulai) {
                        setJadwalStatus('early');
                    } else if (now > selesai) {
                        setJadwalStatus('late');
                    }
                }
            }
            setLoadingConfig(false);
        };

        if (id) fetchFormConfigAndJadwal();
    }, [id]);

    if (loadingConfig) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 relative">
                <SiteBackground />
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 relative z-10"></div>
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-4 relative overflow-hidden">
                <SiteBackground />
                <div className="relative z-10 flex flex-col items-center">
                    <div className="text-gray-400 mb-4"><Trophy size={64} /></div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Form Tidak Ditemukan</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">Link form pendaftaran ini tidak valid atau sudah dihapus.</p>
                    <Link href="/pose/register" className="text-blue-600 hover:underline inline-flex items-center gap-2">
                        <ArrowLeft size={16} /> Kembali ke Daftar Lomba
                    </Link>
                </div>
            </div>
        );
    }

    if (jadwalStatus === 'early' && jadwalInfo) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-4 text-center relative overflow-hidden">
                <SiteBackground />
                <div className="relative z-10 flex flex-col items-center">
                    <div className="text-blue-500 mb-4"><Trophy size={64} /></div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Pendaftaran Belum Dimulai</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                        Pendaftaran lomba baru akan dibuka pada <br />
                        <span className="font-bold">{jadwalInfo.mulai.toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}</span>
                    </p>
                    <Link href="/pose/register" className="text-blue-600 hover:underline inline-flex items-center gap-2">
                        <ArrowLeft size={16} /> Kembali ke Daftar Lomba
                    </Link>
                </div>
            </div>
        );
    }

    if (jadwalStatus === 'late' && jadwalInfo) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-4 text-center relative overflow-hidden">
                <SiteBackground />
                <div className="relative z-10 flex flex-col items-center">
                    <div className="text-red-500 mb-4"><Trophy size={64} /></div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Pendaftaran Sudah Ditutup</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                        Pendaftaran lomba telah ditutup pada <br />
                        <span className="font-bold">{jadwalInfo.selesai.toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}</span>
                    </p>
                    <Link href="/pose/register" className="text-blue-600 hover:underline inline-flex items-center gap-2">
                        <ArrowLeft size={16} /> Kembali ke Daftar Lomba
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-12 sm:pt-32 sm:pb-20 relative bg-gray-50 dark:bg-gray-950 overflow-hidden">
            <SiteBackground />
            <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
                <Link href="/pose/register" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 mb-6 transition-colors">
                    <ArrowLeft size={16} /> Kembali
                </Link>
                <FormRegistration formConfig={formConfig} isWajib={false} />
            </div>
        </div>
    );
}
