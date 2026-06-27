import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Users, Building2, Bell, MessageCircle, Trophy, Palette, Flame, ArrowRight, Sparkles } from 'lucide-react';
import { getTheme } from '@/lib/siteThemes';
import WaveDivider from '@/components/public/WaveDivider';
import logoPkkmb from '@/assets/logopkkmb.png';
import logoPose from '@/assets/logopose.jpg';

const siteContent = {
    pkkmb: {
        logo: logoPkkmb,
        title: 'PKKMB 2026',
        subtitle: 'Pengenalan Kehidupan Kampus bagi Mahasiswa Baru',
        description: 'Selamat datang, generasi baru Politeknik LP3I! PKKMB adalah gerbang awal perjalanan akademismu — temukan pengumuman, kelompok, dan informasi penting di sini.',
        stats: [
            { icon: Calendar, label: 'Tanggal Acara', value: '15–17 Agustus' },
            { icon: Users, label: 'Mahasiswa Baru', value: '500+' },
            { icon: Building2, label: 'Program Studi', value: '8 Prodi' },
        ],
        features: [
            { icon: Bell, title: 'Pemberitahuan', desc: 'Pengumuman resmi dan info terbaru seputar kegiatan PKKMB.', href: '/pkkmb/pemberitahuan' },
            { icon: Users, title: 'Kelompok', desc: 'Cek pembagian kelompok dan daftar anggota kelompokmu.', href: '/pkkmb/kelompok' },
            { icon: MessageCircle, title: 'Kontak', desc: 'Hubungi panitia jika ada pertanyaan seputar PKKMB.', href: '/pkkmb/contact' },
        ],
        timeline: [
            { day: 'Hari 1', title: 'Opening & Perkenalan', desc: 'Upacara pembukaan, sambutan pimpinan, dan pengenalan kampus.' },
            { day: 'Hari 2', title: 'Kegiatan Inti', desc: 'Workshop, team building, dan pengenalan organisasi kemahasiswaan.' },
            { day: 'Hari 3', title: 'Penutupan', desc: 'Presentasi kelompok, penyerahan sertifikat, dan closing ceremony.' },
        ],
    },
    pose: {
        logo: logoPose,
        title: 'POSE 2026',
        subtitle: 'Pekan Olahraga dan Seni',
        description: 'Raih prestasi, tunjukkan bakat! POSE adalah ajang bergengsi antarprodi — olahraga, seni, dan semangat juara dalam satu panggung.',
        stats: [
            { icon: Calendar, label: 'Tanggal Acara', value: '20–25 Oktober' },
            { icon: Trophy, label: 'Cabang Olahraga', value: '12 Cabang' },
            { icon: Palette, label: 'Cabang Seni', value: '8 Cabang' },
        ],
        features: [
            { icon: Bell, title: 'Pemberitahuan', desc: 'Jadwal pertandingan, hasil lomba, dan pengumuman resmi POSE.', href: '/pose/pemberitahuan' },
            { icon: Users, title: 'Tim & Jadwal', desc: 'Lihat susunan tim dan jadwal pertandingan setiap cabang.', href: '/pose/team' },
            { icon: MessageCircle, title: 'Kontak', desc: 'Hubungi panitia POSE untuk pendaftaran dan informasi.', href: '/pose/contact' },
        ],
        timeline: [
            { day: 'Fase 1', title: 'Pendaftaran & Seleksi', desc: 'Pendaftaran atlet dan audisi cabang seni dari setiap prodi.' },
            { day: 'Fase 2', title: 'Pertandingan', desc: 'Babak penyisihan dan semifinal seluruh cabang olahraga & seni.' },
            { day: 'Fase 3', title: 'Grand Final', desc: 'Final cabang unggulan, penyerahan piala, dan closing ceremony.' },
        ],
    },
};

export default function HomeLanding({ site }) {
    const theme = getTheme(site);
    const content = siteContent[site];

    return (
        <div className="animate-in fade-in duration-700 overflow-x-hidden">
            {/* ── HERO ── */}
            <section className={`relative min-h-[calc(100vh-5rem)] flex flex-col ${theme.heroGradient}`}>
                <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
                    <div className={`absolute top-20 right-[10%] w-72 h-72 rounded-full blur-[80px] ${theme.blob1}`} />
                    <div className={`absolute bottom-32 left-[5%] w-56 h-56 rounded-full blur-[70px] ${theme.blob2}`} />
                </div>

                <div className="relative flex-1 flex items-center w-full max-w-6xl mx-auto px-4 md:px-8 py-16 md:py-20">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center w-full">
                        <div className="space-y-6 text-center lg:text-left">
                            <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold border ${theme.badge}`}>
                                <Sparkles size={14} />
                                {theme.tagline}
                            </span>
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.12] text-gray-900 dark:text-white">
                                Selamat Datang di{' '}
                                <span className={`block mt-1 text-transparent bg-clip-text bg-gradient-to-r ${theme.gradientText}`}>
                                    {content.title}
                                </span>
                            </h1>
                            <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-lg mx-auto lg:mx-0">
                                {content.description}
                            </p>
                            <div className="flex flex-wrap gap-3 justify-center lg:justify-start pt-2">
                                <Link
                                    href={`/${site}/pemberitahuan`}
                                    className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-semibold transition-all hover:-translate-y-0.5 shadow-lg ${theme.btnPrimary}`}
                                >
                                    <Bell size={17} />
                                    Lihat Pengumuman
                                </Link>
                                <Link
                                    href={`/${site}/contact`}
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold glass hover:-translate-y-0.5 transition-all text-gray-800 dark:text-white"
                                >
                                    <MessageCircle size={17} />
                                    Hubungi Panitia
                                </Link>
                            </div>
                        </div>

                        <div className="flex justify-center lg:justify-end">
                            <div className="relative">
                                <div className={`absolute -inset-6 rounded-full blur-3xl opacity-60 ${theme.blob1}`} />
                                <div className={`relative glass p-8 md:p-10 rounded-[2rem] ring-1 shadow-2xl ${theme.ring}`}>
                                    <Image
                                        src={content.logo}
                                        alt={`Logo ${content.title}`}
                                        width={280}
                                        height={280}
                                        className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 object-contain"
                                        priority
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <WaveDivider fillClass={theme.waveToAlt} />
            </section>

            {/* ── STATS ── */}
            <section className={`relative ${theme.sectionAlt}`}>
                <div className="w-full max-w-6xl mx-auto px-4 md:px-8 pt-16 md:pt-20 pb-16 md:pb-20">
                    <div className="text-center mb-10 md:mb-14">
                        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
                            Informasi Singkat
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base">{content.subtitle}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 md:gap-6">
                        {content.stats.map((stat) => (
                            <div
                                key={stat.label}
                                className="glass rounded-2xl p-7 md:p-8 text-center hover:-translate-y-1 transition-transform duration-300 group"
                            >
                                <div className={`w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center ${theme.iconBg} group-hover:scale-110 transition-transform`}>
                                    <stat.icon size={22} />
                                </div>
                                <p className={`text-2xl md:text-3xl font-extrabold mb-1 bg-clip-text text-transparent bg-gradient-to-r ${theme.gradientText}`}>
                                    {stat.value}
                                </p>
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    {stat.label}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
                <WaveDivider fillClass={theme.waveToBase} />
            </section>

            {/* ── FEATURES ── */}
            <section className={`relative ${theme.sectionBase}`}>
                <div className="w-full max-w-6xl mx-auto px-4 md:px-8 pt-16 md:pt-20 pb-16 md:pb-20">
                    <div className="text-center mb-10 md:mb-14">
                        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
                            Jelajahi Portal
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base">Akses cepat ke halaman penting</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
                        {content.features.map((feat) => (
                            <Link
                                key={feat.href}
                                href={feat.href}
                                className="glass rounded-2xl p-7 md:p-8 group hover:-translate-y-1 transition-all duration-300 hover:shadow-xl flex flex-col"
                            >
                                <div className={`w-11 h-11 rounded-xl mb-4 flex items-center justify-center ${theme.iconBg} group-hover:scale-110 transition-transform`}>
                                    <feat.icon size={20} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                    {feat.title}
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed flex-1">{feat.desc}</p>
                                <span className={`inline-flex items-center gap-1 mt-4 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity bg-clip-text text-transparent bg-gradient-to-r ${theme.gradientText}`}>
                                    Buka halaman <ArrowRight size={14} />
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
                <WaveDivider fillClass={theme.waveToAlt} />
            </section>

            {/* ── TIMELINE ── */}
            <section className={`relative ${theme.sectionAlt}`}>
                <div className="w-full max-w-6xl mx-auto px-4 md:px-8 pt-16 md:pt-20 pb-16 md:pb-20">
                    <div className="text-center mb-10 md:mb-14">
                        <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-3 border ${theme.badge}`}>
                            <Flame size={14} />
                            Rangkaian Acara
                        </span>
                        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white">
                            Jadwal Kegiatan
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
                        {content.timeline.map((item, i) => (
                            <div key={item.day} className="relative glass rounded-2xl p-7 md:p-8 overflow-hidden">
                                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${theme.gradient}`} />
                                <span className={`inline-block text-xs font-bold uppercase tracking-widest mb-2 bg-clip-text text-transparent bg-gradient-to-r ${theme.gradientText}`}>
                                    {item.day}
                                </span>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed relative z-10">{item.desc}</p>
                                <span className="absolute bottom-3 right-5 text-5xl font-black text-gray-100 dark:text-white/[0.04] select-none leading-none">
                                    {i + 1}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
                <WaveDivider fillClass={theme.waveToFooter} />
            </section>
        </div>
    );
}
