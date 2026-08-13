'use client';

import { useEffect, useState } from 'react';
import { getFormWajibByLinkId } from '@/api/supabase/public/peserta';
import { useParams } from 'next/navigation';
import { Trophy, ArrowLeft, FileText } from 'lucide-react';
import Link from 'next/link';
// import FormRegistration from '@/components/public/FormRegistration';
import FormWajib from '@/components/public/FormWajib';
import SiteBackground from '@/components/public/SiteBackground';

export default function PoseFormWajibPage() {
    const { link_id } = useParams();
    const [formConfig, setFormConfig] = useState(null);
    const [loadingConfig, setLoadingConfig] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        const fetchFormConfig = async () => {
            const data = await getFormWajibByLinkId(link_id);

            if (!data) {
                setNotFound(true);
            } else {
                setFormConfig(data);
            }
            setLoadingConfig(false);
        };

        if (link_id) fetchFormConfig();
    }, [link_id]);

    if (loadingConfig) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
                <div className="text-gray-400 mb-4"><Trophy size={64} /></div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Form Tidak Ditemukan</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Link form pendaftaran ini tidak valid atau sudah dihapus.</p>
                <Link href="/pose" className="text-emerald-600 hover:underline inline-flex items-center gap-2">
                    <ArrowLeft size={16} /> Kembali ke Beranda POSE
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-12 sm:pb-20 bg-gray-50 dark:bg-gray-950 relative">
            <SiteBackground site="pose" subtle={false} />
            <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 sm:pt-32 relative z-10">
                <Link href="/pose" className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors drop-shadow-sm font-medium">
                    <ArrowLeft size={16} /> Kembali ke Beranda POSE
                </Link>
                {/* Judul Form */}
                <div className="mb-8 text-center sm:text-left">
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-2">{formConfig.judul}</h1>
                    <p className="text-gray-600 dark:text-gray-400">Isi formulir di bawah ini dengan lengkap dan benar</p>
                </div>
                {/* <FormRegistration formConfig={formConfig} isWajib={true} /> */}
                <FormWajib formConfig={formConfig} />
            </div>
        </div>
    );
}
