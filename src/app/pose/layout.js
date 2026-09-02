import SamsChatbot from '@/components/SamsChatbot';
import PublicHeader from '@/components/PublicHeader';
import SiteBackground from '@/components/public/SiteBackground';
import PublicFooter from '@/components/public/PublicFooter';
import UpdateVersionModal from '@/components/public/UpdateVersionModal';

export default function PoseLayout({ children }) {
    const poseLinks = [
        { href: '/pose', label: 'Beranda' },
        { href: '/pose/pemberitahuan', label: 'Pemberitahuan' },
        { href: '/pose/dashboard', label: 'Dashboard' },
        // { href: '/pose/sertifikat', label: 'Sertifikat' },
        { href: '/pose/team', label: 'Tim' },
        { href: '/pose/jadwal', label: 'Jadwal' },
        { href: '/pose/register', label: 'Daftar' },
        // { href: '/pose/submission', label: 'Submit' },
        // { href: '/pose/nilai', label: 'Nilai' },
        { href: '/pose/contact', label: 'Kontak' },
        { href: '/pose/ketentuan', label: 'S&K Lomba' },
        { href: '/pose/panduan', label: 'Panduan & Privasi' }
    ];

    return (
        <div className="min-h-screen text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-500 relative">
            <SiteBackground site="pose" subtle />
            <PublicHeader site="pose" links={poseLinks} />
            <main className="flex-1 relative z-10">
                {children}
            </main>
            <PublicFooter site="pose" links={poseLinks} />
            <SamsChatbot />
            <UpdateVersionModal site="pose" />
        </div>
    );
}


