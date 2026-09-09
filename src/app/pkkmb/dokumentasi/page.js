import PublicMultimediaView from '@/components/public/PublicMultimediaView';

export const metadata = {
    title: 'Dokumentasi Acara - PKKMB 2026',
    description: 'Galeri foto dan cuplikan video dokumentasi rangkaian kegiatan PKKMB 2026.',
};

export default function PkkmbDokumentasiPage() {
    return <PublicMultimediaView site="pkkmb" initialFilterType="all" />;
}
