import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ExternalLink, Sparkles } from 'lucide-react';
import logoPkkmb from '@/assets/logopkkmb.png';
import logoPose from '@/assets/logopose.jpg';
import logoPoltek from '@/assets/logopoltek.png';

const accentStyles = {
    blue: {
        hover: 'group-hover:text-blue-600 dark:group-hover:text-blue-400',
        gradient: 'from-blue-500/5 dark:from-blue-500/10',
        cta: 'text-blue-600 dark:text-blue-400',
        ring: 'ring-blue-100 dark:ring-blue-900/40',
    },
    emerald: {
        hover: 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400',
        gradient: 'from-emerald-500/5 dark:from-emerald-500/10',
        cta: 'text-emerald-600 dark:text-emerald-400',
        ring: 'ring-emerald-100 dark:ring-emerald-900/40',
    },
    indigo: {
        hover: 'group-hover:text-indigo-600 dark:group-hover:text-indigo-400',
        gradient: 'from-indigo-500/5 dark:from-indigo-500/10',
        cta: 'text-indigo-600 dark:text-indigo-400',
        ring: 'ring-indigo-100 dark:ring-indigo-900/40',
    },
    violet: {
        hover: 'group-hover:text-violet-600 dark:group-hover:text-violet-400',
        gradient: 'from-violet-500/5 dark:from-violet-500/10',
        cta: 'text-violet-600 dark:text-violet-400',
        ring: 'ring-violet-100 dark:ring-violet-900/40',
    },
};

function PortalCard({ card, external = false }) {
    const styles = accentStyles[card.accent];
    const CtaIcon = external ? ExternalLink : ArrowRight;

    const content = (
        <>
            <div
                className={`absolute inset-0 bg-gradient-to-br ${styles.gradient} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
            />
            <div className="relative z-10 flex flex-col h-full text-left">
                <div
                    className={`w-16 h-16 mb-6 rounded-2xl bg-white/80 dark:bg-slate-900/60 ring-1 ${styles.ring} flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-sm overflow-hidden p-2`}
                >
                    <Image
                        src={card.logo}
                        alt={card.logoAlt}
                        width={56}
                        height={56}
                        className="w-full h-full object-contain"
                    />
                </div>
                <h2
                    className={`text-2xl md:text-3xl font-bold mb-3 text-gray-900 dark:text-white ${styles.hover} transition-colors`}
                >
                    {card.title}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 flex-1 leading-relaxed text-sm md:text-base">
                    {card.description}
                </p>
                <div className={`mt-8 flex items-center font-medium ${styles.cta}`}>
                    <span>{card.cta}</span>
                    <CtaIcon
                        size={18}
                        className={`ml-2 ${external ? '' : 'group-hover:translate-x-2'} transition-transform duration-300`}
                    />
                </div>
            </div>
        </>
    );

    const className =
        'group flex-1 p-8 md:p-10 glass rounded-3xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-2 relative overflow-hidden min-h-[280px]';

    if (external) {
        return (
            <a href={card.href} target="_blank" rel="noopener noreferrer" className={className}>
                {content}
            </a>
        );
    }

    return (
        <Link href={card.href} className={className}>
            {content}
        </Link>
    );
}

const pkkmbCard = {
    href: '/pkkmb',
    logo: logoPkkmb,
    logoAlt: 'Logo PKKMB',
    title: 'Portal PKKMB',
    description:
        'Pusat informasi resmi Pengenalan Kehidupan Kampus bagi Mahasiswa Baru. Temukan jadwal dan kelompok Anda.',
    cta: 'Masuk Portal',
    accent: 'blue',
};

const poseCard = {
    href: '/pose',
    logo: logoPose,
    logoAlt: 'Logo POSE',
    title: 'Portal POSE',
    description:
        'Pusat informasi Pekan Olahraga dan Seni Mahasiswa. Temukan kompetisi dan asah kreativitasmu.',
    cta: 'Masuk Portal',
    accent: 'emerald',
};

const lp3iCards = [
    {
        href: 'https://plb.ac.id/id/',
        logo: logoPoltek,
        logoAlt: 'Logo Politeknik LP3I',
        title: 'Website Resmi Politeknik LP3I Bandung',
        description: 'Profil kampus, program studi, dan informasi akademik Politeknik LP3I Bandung.',
        cta: 'Buka Website',
        accent: 'indigo',
    },
    {
        href: 'https://siakad.plb.ac.id/',
        logo: logoPoltek,
        logoAlt: 'Logo Politeknik LP3I ',
        title: 'Website SIAKAD Politeknik LP3I Bandung',
        description: 'KRS, jadwal kuliah, nilai, dan layanan akademik mahasiswa.',
        cta: 'Buka SIAKAD',
        accent: 'violet',
    },
];

export default function PortalPage() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-float">
                <Sparkles size={16} className="text-blue-500 dark:text-blue-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Portal Resmi Angkatan 2026
                </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 leading-tight">
                Selamat Datang, <br className="hidden md:block" />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-emerald-500">
                    Mahasiswa Baru
                </span>
            </h1>

            <p className="text-gray-600 dark:text-gray-400 mb-14 max-w-xl mx-auto text-lg md:text-xl font-light leading-relaxed">
                Pilih gerbang informasi di bawah ini untuk memulai langkah pertama perjalanan akademik dan
                kreativitas Anda.
            </p>

            <div className="flex flex-col gap-8 w-full max-w-5xl px-4">
                <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                    <PortalCard card={pkkmbCard} />
                    <PortalCard card={poseCard} />
                </div>

                <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                    {lp3iCards.map((card) => (
                        <PortalCard key={card.href} card={card} external />
                    ))}
                </div>
            </div>

            <footer className="mt-16 text-sm text-gray-500 dark:text-gray-400 pb-4">
                &copy; {new Date().getFullYear()} Portal Kampus. Developed by{' '}
                <a 
                    href="https://samba.my.id" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors hover:underline"
                >
                    Samba
                </a>
            </footer>
        </div>
    );
}
