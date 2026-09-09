import PublicMultimediaView from '@/components/public/PublicMultimediaView';

export const metadata = {
    title: 'Dokumentasi Acara - POSE 2026',
    description: 'Galeri foto dan cuplikan video dokumentasi rangkaian lomba dan kegiatan POSE 2026.',
};

export default function PoseDokumentasiPage() {
    return <PublicMultimediaView site="pose" initialFilterType="all" />;
}
