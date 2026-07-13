import SamsChatbot from '@/components/SamsChatbot';

import PublicHeader from '@/components/PublicHeader';

import SiteBackground from '@/components/public/SiteBackground';

import PublicFooter from '@/components/public/PublicFooter';



export default function PkkmbLayout({ children }) {

    const pkkmbLinks = [

        { href: '/pkkmb', label: 'Beranda' },

        { href: '/pkkmb/pemberitahuan', label: 'Pemberitahuan' },

        { href: '/pkkmb/kelompok', label: 'Kelompok' },

        { href: '/pkkmb/jadwal', label: 'Jadwal' },

        { href: '/pkkmb/contact', label: 'Kontak' }

    ];



    return (

        <div className="min-h-screen text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-500 relative">

            <SiteBackground site="pkkmb" subtle />

            <PublicHeader site="pkkmb" links={pkkmbLinks} />

            <main className="flex-1 relative z-10">

                {children}

            </main>

            <PublicFooter site="pkkmb" links={pkkmbLinks} />

            <SamsChatbot />

        </div>

    );

}

