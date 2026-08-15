'use server';

// Static assets imports
import logoPkkmb from '@/assets/logopkkmb.png';
import logoPose from '@/assets/logopose.jpg';
// import maskotPkkmb from '@/assets/maskotpkkmb.png';
import maskotPose from '@/assets/maskotpose.png';

// Logo Parts for Slider
// import logoPkkmbUtama from '@/assets/logo_pkkmb/logo.png';
// import logoPart1 from '@/assets/logo_pkkmb/pecah-gelombang handap lagu.png';
// import logoPart2 from '@/assets/logo_pkkmb/pecah-lagu.png';
// import logoPart3 from '@/assets/logo_pkkmb/pecah-matahari.png';
// import logoPart4 from '@/assets/logo_pkkmb/pecah-motif.png';
// import logoPart5 from '@/assets/logo_pkkmb/pecah-titik+gelombang.png';
// import logoPoseUtama from '@/assets/logo_pose/logo.png';
import logoPkkmbUtama from '@/assets/logo_pkkmb/logo.png';
import logoPart1 from '@/assets/logo_pkkmb/pecah-matahari.png';
import logoPart2 from '@/assets/logo_pkkmb/pecah-orang.png';
import logoPart3 from '@/assets/logo_pkkmb/pecah-gelombang.png';
import logoPoseUtama from '@/assets/logo_pose/logo.png';

// Poster assets for POSE competitions
import posterBadminton from '@/assets/poster_pose/badminton.webp';
import posterTarikTambang from '@/assets/poster_pose/tarik-tambang.webp';
import posterTenisMeja from '@/assets/poster_pose/tenis-meja.webp';
import posterMobileLegends from '@/assets/poster_pose/mobile-legends.webp';
import posterBmc from '@/assets/poster_pose/business-model-canvas.webp';
import posterDesainPoster from '@/assets/poster_pose/desain-poster.webp';
import posterSoftwareDev from '@/assets/poster_pose/software-developer.webp';
import posterDance from '@/assets/poster_pose/dance.webp';
import posterReleaseWriting from '@/assets/poster_pose/release-writing.webp';
import posterDigitalUmkm from '@/assets/poster_pose/digital-umkm-promotion.webp';

const posterMap = {
    'badminton': posterBadminton,
    'tarik-tambang': posterTarikTambang,
    'tenis-meja': posterTenisMeja,
    'mobile-legends': posterMobileLegends,
    'business-model-canvas': posterBmc,
    'desain-poster': posterDesainPoster,
    'software-developer': posterSoftwareDev,
    'dance': posterDance,
    'release-writing': posterReleaseWriting,
    'digital-umkm-promotion': posterDigitalUmkm,
};

import { Calendar, Users, Building2, Bell, MessageCircle, Trophy, BookOpen, Upload, Palette, Flame } from 'lucide-react';
import { lombaPoseList } from '@/data/lombaPose';
import { supabaseAdmin } from '@/lib/supabase';

// Serializable stats configuration
const getStatsConfig = (site) => {
    if (site === 'pkkmb') {
        return [
            { iconName: 'Calendar', label: 'Tanggal Registrasi', value: '01 - 31 Agustus' },
            { iconName: 'Calendar', label: 'Tanggal Acara', value: '21 - 26 September' },
            { iconName: 'Users', label: 'Mahasiswa Baru', value: '300+' },
            { iconName: 'Building2', label: 'Program Studi', value: '11 Prodi' },
            { iconName: 'Building2', label: 'Cabang Kampus', value: '6 Cabang' },
        ];
    } else {
        return [
            { iconName: 'Calendar', label: 'Tanggal Pendaftaran', value: '10 Agustus - 7 September' },
            { iconName: 'Calendar', label: 'Tanggal Acara', value: '15 - 17 September' },
            { iconName: 'Trophy', label: 'Cabang lomba', value: '10 Cabang' },
            { iconName: 'Palette', label: 'Jenis Lomba', value: '3 Jenis' },
        ];
    }
};

// Serializable features configuration
const getFeaturesConfig = (site) => {
    if (site === 'pkkmb') {
        return [
            { iconName: 'Bell', title: 'Pemberitahuan', desc: 'Pengumuman resmi dan info terbaru seputar kegiatan PKKMB.', href: '/pkkmb/pemberitahuan' },
            { iconName: 'Users', title: 'Kelompok', desc: 'Cek pembagian kelompok dan daftar anggota kelompokmu.', href: '/pkkmb/kelompok' },
            { iconName: 'BookOpen', title: 'Materi', desc: 'Cek jadwal Materi PKKMB.', href: '/pkkmb/jadwal' },
            { iconName: 'MessageCircle', title: 'Kontak', desc: 'Hubungi panitia jika ada pertanyaan seputar PKKMB.', href: '/pkkmb/contact' },
        ];
    } else {
        return [
            { iconName: 'Bell', title: 'Pemberitahuan', desc: 'Jadwal pertandingan, hasil lomba, dan pengumuman resmi POSE.', href: '/pose/pemberitahuan' },
            { iconName: 'Users', title: 'Tim', desc: 'Cek susunan tim pertandingan setiap cabang.', href: '/pose/team' },
            { iconName: 'Trophy', title: 'Jadwal & Klasemen', desc: 'Cek Jadwal dan klasemen pertandingan setiap cabang.', href: '/pose/jadwal' },
            { iconName: 'Users', title: 'Daftar Lomba', desc: 'Daftar Lomba.', href: '/pose/register' },
            { iconName: 'Upload', title: 'Submit Karya', desc: 'Kirim karya lomba.', href: '/pose/submit' },
            { iconName: 'Users', title: 'Nilai', desc: 'Cek Nilai Lomba.', href: '/pose/nilai' },
            { iconName: 'Users', title: 'Sertifikat', desc: 'Cek sertifikat juara lomba.', href: '/pose/sertifikat' },
            { iconName: 'Users', title: 'Syarat & Ketentuan', desc: 'Informasi Syarat & Ketentuan Lomba.', href: '/pose/ketentuan' },
            { iconName: 'BookOpen', title: 'Buku Panduan', desc: 'Informasi Buku Panduan.', href: '/pose/panduan' },
            { iconName: 'MessageCircle', title: 'Kontak', desc: 'Hubungi panitia POSE untuk pendaftaran dan informasi.', href: '/pose/contact' },
        ];
    }
};

const getTimelineConfig = (site) => {
    if (site === 'pkkmb') {
        return [
            { day: "Technical Meeting", title: "Persiapan Sebelum PKKMB", desc: "Kenali jadwal, tata tertib, perlengkapan, dan seluruh informasi penting agar siap mengikuti rangkaian PKKMB." },
            { day: "Opening", title: "Pembukaan PKKMB 2026", desc: "Mengawali perjalanan sebagai mahasiswa baru melalui pembukaan resmi dan pengenalan panitia PKKMB." },
            { day: "Hari 1", title: "Mengenal Kampus & Budaya Akademik", desc: "Mulai beradaptasi dengan lingkungan kampus, budaya akademik, serta nilai-nilai yang menjadi dasar kehidupan perkuliahan." },
            { day: "Hari 2", title: "Pendidikan Karakter", desc: "Membangun karakter, etika, tanggung jawab, dan semangat belajar sebagai mahasiswa Politeknik LP3I." },
            { day: "Hari 3", title: "Kehidupan Mahasiswa", desc: "Mengenal organisasi kemahasiswaan, Unit Kegiatan Mahasiswa, serta berbagai kesempatan untuk mengembangkan diri." },
            { day: "Hari 4", title: "Literasi Digital & Karier", desc: "Memahami pemanfaatan teknologi, sistem akademik, serta bekal awal menghadapi dunia perkuliahan dan karier." },
            { day: "Hari 5", title: "Penutupan PKKMB", desc: "Menutup seluruh rangkaian PKKMB dengan semangat baru untuk memulai perjalanan sebagai mahasiswa." },
            { day: "Dies Natalis", title: "Dies Natalis LP3I", desc: "Merayakan hari jadi Politeknik LP3I melalui berbagai kegiatan yang mempererat kebersamaan seluruh civitas akademika." }
        ];
    } else {
        return [
            { day: 'Fase 1', title: 'Pendaftaran & Seleksi', desc: 'Pendaftaran atlet dan audisi cabang seni dari setiap prodi.' },
            { day: 'Fase 2', title: 'Pertandingan', desc: 'Babak penyisihan dan semifinal seluruh cabang olahraga & seni.' },
            { day: 'Fase 3', title: 'Grand Final', desc: 'Final cabang unggulan, penyerahan piala, dan closing ceremony.' }
        ];
    }
};

export async function getSiteContent(site) {
    const isPkkmb = site === 'pkkmb';

    // Map icons / image info
    const data = {
        title: isPkkmb ? 'PKKMB 2026' : 'POSE 2026',
        subtitle: isPkkmb ? 'Pengenalan Kehidupan Kampus bagi Mahasiswa Baru' : 'Pekan Olahraga dan Seni',
        description: isPkkmb
            ? 'Selamat datang, generasi baru Politeknik LP3I! PKKMB adalah gerbang awal perjalanan akademismu — temukan pengumuman, kelompok, dan informasi penting di sini.'
            : 'Raih prestasi, tunjukkan bakat! POSE adalah ajang bergengsi antarprodi — olahraga, seni, dan semangat juara dalam satu panggung.',
        logo: isPkkmb ? logoPkkmb : logoPose,
        stats: getStatsConfig(site),
        features: getFeaturesConfig(site),
        timeline: getTimelineConfig(site)
    };

    return data;
}

export async function getLogoSlides(site) {
    if (site === 'pkkmb') {
        return [
            { image: logoPkkmbUtama, title: 'Kesatuan Logo', desc: 'Logo ini mencerminkan semangat juang dan kebersamaan seluruh elemen mahasiswa baru Politeknik LP3I.' },
            {
                image: logoPkkmbUtama, title: 'Makna Typography', desc: `• Poppins: Sangat geometris dengan lengkungan padat dan membulat, memberikan kesan ramah (friendly) namun tetap presisi. makna nya kesederhanaan, keterbukaan, keberlanjutan, dan keramahan teknologi.\n
• Lato: Khas dengan struktur semi-rounded yang hangat, terstruktur, dan sangat nyaman dibaca (high legibility). maknanya keseimbangan, transparansi, ketenangan, dan kejujuran.\n
• Montserrat: Berkarakter geometric, lebar, tegas, dan berkesan modern-urban.` },
            { image: logoPart1, title: 'Matahari', desc: 'Matahari yang terbit di bagian atas logo menjadi simbol Arunika, yaitu awal dari sebuah perjalanan baru. Cahaya matahari melambangkan semangat, energi positif, inspirasi, dan harapan yang mengiringi langkah mahasiswa baru dalam memasuki dunia perkuliahan. \n\n Sinar-sinarnya yang menyebar ke berbagai arah juga menggambarkan potensi setiap individu untuk berkembang dan memberikan dampak positif di lingkungan kampus.' },
            { image: logoPart2, title: 'Icon Orang', desc: 'Elemen ini melambangkan individu-individu mahasiswa baru yang berkumpul dalam satu komunitas. saling berpegangan menandakan keselarasan atau keharmonian bersama, selain itu  menggambarkan bahwa setiap mahasiswa memiliki kesempatan untuk tumbuh, \n saling mendukung, dan berkembang bersama dalam perjalanan akademik maupun organisasi.' },
            { image: logoPart3, title: 'Gelombang Biru', desc: 'Lengkungan berwarna biru yang mengalir menyerupai alunan pita atau gelombang menjadi representasi dari Harmonia. Bentuk yang mengalir dengan lembut mencerminkan proses perjalanan yang dinamis namun tetap selaras. \n\n Gelombang ini juga menggambarkan kolaborasi antar mahasiswa yang saling melengkapi, bekerja sama, dan bergerak menuju tujuan yang sama meskipun berasal dari latar belakang, pengalaman, dan karakter yang berbeda.' },
        ];
    } else {
        return [
            { image: logoPoseUtama, title: 'Kesatuan Logo', desc: 'Logo ini mencerminkan semangat sportivitas dan kreativitas mahasiswa Politeknik LP3I dalam ajang POSE.' },
        ];
    }
}

export async function getMascotInfo(site) {
    if (site === 'pkkmb') {
        // return {
        //     image: maskotPkkmb,
        //     title: 'Maskot PKKMB 2026',
        //     desc: 'Maskot ini mencerminkan karakter mahasiswa yang cerdas, tangguh, adaptif, dan selalu bersemangat dalam meraih prestasi, baik secara akademik maupun non-akademik di lingkungan Politeknik LP3I.'
        // };
    } else {
        return {
            image: maskotPose,
            title: 'Maskot POSE 2026',
            desc: 'Maskot ini melambangkan jiwa kompetitif, kreativitas tanpa batas, dan energi muda yang membara dalam bidang olahraga dan seni di lingkungan Politeknik LP3I.'
        };
    }
}

export async function getLombaList() {
    return lombaPoseList.map(item => ({
        ...item,
        poster: posterMap[item.id] || null
    }));
}

export async function getLombaKategori() {
    try {
        const { data, error } = await supabaseAdmin
            .from('form_register')
            .select('nama_lomba, kategori_pendaftar')
            .eq('site', 'pose')
            .eq('is_public', true);

        if (error) throw error;

        const map = {};
        if (data) {
            data.forEach(item => {
                if (item.nama_lomba) {
                    map[item.nama_lomba] = item.kategori_pendaftar ? item.kategori_pendaftar.split(',') : [];
                }
            });
        }
        return map;
    } catch (err) {
        console.error("Internal Log - Error fetching categories map:", err);
        return {};
    }
}

