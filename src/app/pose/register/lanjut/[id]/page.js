'use client';

import { useEffect, useState } from 'react';
import { getFormRegisterByLinkId } from '@/api/supabase/public/peserta';
// import { getJadwalAcara } from '@/api/supabase/public/jadwal';
import { useParams } from 'next/navigation';
import { Trophy, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import FormRegisterLanjut from '@/components/public/FormRegisterLanjut';
import SiteBackground from '@/components/public/SiteBackground';

export default function DynamicFormRegisterLanjutPage() {
    const { id } = useParams();
    const [formConfig, setFormConfig] = useState(null);
    const [loadingConfig, setLoadingConfig] = useState(true);
    const [notFound, setNotFound] = useState(false);
    // const [jadwalStatus, setJadwalStatus] = useState('open'); // 'open', 'early', 'late'
    // const [jadwalInfo, setJadwalInfo] = useState(null);

    useEffect(() => {
        const fetchFormConfig = async () => {
            const data = await getFormRegisterByLinkId(id);
            // Jadwal barrier dinonaktifkan sementara
            // const jadwalData = await getJadwalAcara('pose');

            if (!data) {
                setNotFound(true);
            } else {
                setFormConfig(data);

                // // Check jadwal pendaftaran
                // const pendaftaranJadwal = (jadwalData || []).find(j => j.jenis_jadwal === 'pendaftaran');
                // if (pendaftaranJadwal) {
                //     const now = new Date();
                //     const mulai = new Date(pendaftaranJadwal.waktu_mulai);
                //     const selesai = new Date(pendaftaranJadwal.waktu_selesai);
                //     setJadwalInfo({ mulai, selesai });
                //     if (now < mulai) {
                //         setJadwalStatus('early');
                //     } else if (now > selesai) {
                //         setJadwalStatus('late');
                //     }
                // }
            }
            setLoadingConfig(false);
        };

        if (id) fetchFormConfig();
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
                    <Link href="/pose/register/lanjut" className="text-blue-600 hover:underline inline-flex items-center gap-2">
                        <ArrowLeft size={16} /> Kembali ke Register Lanjut
                    </Link>
                </div>
            </div>
        );
    }

    // Schedule barrier dinonaktifkan sementara
    // if (jadwalStatus === 'early' && jadwalInfo) { ... }
    // if (jadwalStatus === 'late' && jadwalInfo) { ... }

    return (
        <div className="min-h-screen pt-24 pb-12 sm:pt-32 sm:pb-20 relative bg-gray-50 dark:bg-gray-950 overflow-hidden">
            <SiteBackground />
            <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
                <Link href="/pose/register/lanjut" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 mb-6 transition-colors font-semibold text-sm">
                    <ArrowLeft size={16} /> Kembali ke Register Lanjut
                </Link>
                <FormRegisterLanjut formConfig={formConfig} />
            </div>
        </div>
    );
}
