'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { FileUp, ArrowLeft } from 'lucide-react';
import { getFormPengumpulanByLink } from '@/api/supabase/public/submission';
import { getJadwalAcara } from '@/api/supabase/public/jadwal';
import ScheduleBarrier from '@/components/public/ScheduleBarrier';
import PengembangBarrier from '@/components/public/PengembangBarrier';
import FormPengumpulan from '@/components/public/FormPengumpulan';

export default function SubmissionPage() {
    const { id } = useParams();
    const [form, setForm] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [jadwalStatus, setJadwalStatus] = useState('open');
    const [jadwalInfo, setJadwalInfo] = useState(null);

    useEffect(() => {
        const fetchFormAndJadwal = async () => {
            try {
                const [formData, jadwalData] = await Promise.all([
                    getFormPengumpulanByLink(id),
                    getJadwalAcara('pose')
                ]);

                if (!formData) {
                    setNotFound(true);
                } else {
                    setForm(formData);

                    const pengumpulanJadwal = (jadwalData || []).find(j => j.jenis_jadwal === 'pengumpulan');

                    if (pengumpulanJadwal) {
                        const now = new Date();
                        const mulai = new Date(pengumpulanJadwal.waktu_mulai);
                        const selesai = new Date(pengumpulanJadwal.waktu_selesai);

                        setJadwalInfo({ mulai, selesai });

                        if (now < mulai) {
                            setJadwalStatus('early');
                        } else if (now > selesai) {
                            setJadwalStatus('late');
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching submission form data:", error);
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchFormAndJadwal();
    }, [id]);

    // Tampilan Loading
    if (loading) {
        return (
            <div className="flex-grow flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Tampilan Form Tidak Ditemukan
    if (notFound) {
        return (
            <PengembangBarrier site="pose" route="/submission">
                <main className="flex-grow flex flex-col items-center justify-center p-4 min-h-[60vh] text-center">
                    <div className="text-gray-400 mb-4"><FileUp size={64} /></div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Form Tidak Ditemukan</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">Link form pengumpulan karya ini tidak valid atau sudah dihapus.</p>
                    <Link href="/pose" className="text-blue-600 hover:underline inline-flex items-center gap-2">
                        <ArrowLeft size={16} /> Kembali ke Beranda POSE
                    </Link>
                </main>
            </PengembangBarrier>
        );
    }

    // Tampilan Pengumpulan Belum Dimulai
    if (jadwalStatus === 'early' && jadwalInfo) {
        return (
            <PengembangBarrier site="pose" route="/submission">
                <main className="flex-grow flex flex-col items-center justify-center p-4 min-h-[60vh] text-center">
                    <div className="text-blue-500 mb-4"><FileUp size={64} /></div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Pengumpulan Karya Belum Dimulai</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                        Pengumpulan karya baru akan dibuka pada <br />
                        <span className="font-bold">{jadwalInfo.mulai.toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}</span>
                    </p>
                    <Link href="/pose" className="text-blue-600 hover:underline inline-flex items-center gap-2">
                        <ArrowLeft size={16} /> Kembali ke Beranda POSE
                    </Link>
                </main>
            </PengembangBarrier>
        );
    }

    // Tampilan Pengumpulan Sudah Ditutup
    if (jadwalStatus === 'late' && jadwalInfo) {
        return (
            <PengembangBarrier site="pose" route="/submission">
                <ScheduleBarrier pageType="jadwal">
                    <main className="flex-grow flex flex-col items-center justify-center p-4 min-h-[60vh] text-center">
                        <div className="text-red-500 mb-4"><FileUp size={64} /></div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Pengumpulan Karya Ditutup</h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                            Batas waktu pengumpulan karya telah berakhir pada <br />
                            <span className="font-bold">{jadwalInfo.selesai.toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}</span>
                        </p>
                        <Link href="/pose" className="text-blue-600 hover:underline inline-flex items-center gap-2">
                            <ArrowLeft size={16} /> Kembali ke Beranda POSE
                        </Link>
                    </main>
                </ScheduleBarrier>
            </PengembangBarrier>
        );
    }

    // Tampilan Form Pengumpulan Karya (Terbuka)
    return (
        <main className="flex-grow pt-24 pb-20 px-4 sm:px-6 relative z-10 min-h-screen">
            <PengembangBarrier site="pose" route="/submission">
                <ScheduleBarrier pageType="jadwal">
                    <div className="max-w-7xl mx-auto">
                        <Link href="/pose" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 mb-6 transition-colors">
                            <ArrowLeft size={16} /> Kembali
                        </Link>
                        <FormPengumpulan formData={form} />
                    </div>
                </ScheduleBarrier>
            </PengembangBarrier>
        </main >
    );
}