/**
 * Konfigurasi Pop-up Panduan & Penyambutan (Welcome Guide Modal)
 * Versi di sini terpisah dan independen per halaman / per site.
 */

export const welcomeGuideConfig = {
    pose: {
        // 1. Halaman Beranda Utama POSE
        '/pose': {
            pageKey: 'landing',
            currentVersion: '2026.1.0',
            storageKey: 'pose_welcome_guide_home',
            title: 'Selamat Datang di Portal POSE 2026!',
            subtitle: 'Pekan Olahraga dan Seni Mahasiswa LP3I',
            greeting: 'Halo! Sebelum mulai menjelajah, yuk simak panduan singkat dan fitur-fitur utama portal POSE 2026.',
            youtubeId: 'wDvuNAgTMco',
            highlights: [
                'Jelajahi berbagai cabang lomba Olahraga, Seni, Akademik, dan Kreativitas',
                'Daftarkan tim delegasi kamu dengan mudah secara online',
                'Pantau jadwal pertandingan, live timer, dan status verifikasi tim',
                'Akses regulasi teknis ketentuan lomba dan pusat bantuan panitia'
            ],
            ctaLabel: 'Lihat Panduan Lengkap',
            ctaHref: '/pose/panduan#landing-page'
        },

        // 2. Halaman Pemberitahuan POSE
        '/pose/pemberitahuan': {
            pageKey: 'pemberitahuan',
            currentVersion: '2026.1.0',
            storageKey: 'pose_welcome_guide_pemberitahuan',
            title: 'Panduan Halaman Pemberitahuan POSE',
            subtitle: 'Pusat Pengumuman & Rilis Informasi Resmi',
            greeting: 'Pantau segala pengumuman penting, timeline teknis, perubahan jadwal, dan arahan panitia di sini.',
            youtubeId: '5nUffYDEVxU',
            highlights: [
                'Lihat berita dan pengumuman terbaru terurut berdasarkan tanggal terbit',
                'Gunakan kolom pencarian untuk menyaring pengumuman cabang lomba spesifik',
                'Dapatkan update technical meeting dan pengundian bagan pertandingan'
            ],
            ctaLabel: 'Buka Panduan Pemberitahuan',
            ctaHref: '/pose/panduan#pemberitahuan'
        },

        // 3. Halaman Dashboard POSE
        '/pose/dashboard': {
            pageKey: 'dashboard',
            currentVersion: '2026.1.0',
            storageKey: 'pose_welcome_guide_dashboard',
            title: 'Panduan Dashboard Status Tim',
            subtitle: 'Pantau Kelulusan Verifikasi & Pengumpulan Karya',
            greeting: 'Kelola tim yang Anda daftarkan, cek status verifikasi, pengumpulan karya, dan sertifikat di satu tempat.',
            youtubeId: 'UeCGtlPQ0no',
            highlights: [
                'Periksa status pendaftaran: Menunggu Verifikasi, Disetujui, atau Ditolak',
                'Akses tombol aksi cepat pengumpulan karya (submission) dan cek nilai juri',
                'Lihat token pendaftaran dan kode form unik tim Anda'
            ],
            ctaLabel: 'Buka Panduan Dashboard',
            ctaHref: '/pose/panduan#register-dashboard'
        },

        // 4. Halaman Tim POSE
        '/pose/team': {
            pageKey: 'team',
            currentVersion: '2026.1.0',
            storageKey: 'pose_welcome_guide_team',
            title: 'Panduan Halaman Tim Terverifikasi',
            subtitle: 'Daftar Kontingen & Anggota Delegasi POSE 2026',
            greeting: 'Cari dan lihat seluruh tim peserta lomba yang sudah resmi lulus verifikasi panitia.',
            youtubeId: '5_2MM28lQ0U',
            highlights: [
                'Gunakan filter kategori (Olahraga, Seni, Akademik, Kreativitas) dan cabang lomba',
                'Ketik nama tim pada kolom pencarian untuk mengecek status publikasi tim',
                'Klik kartu tim untuk melihat susunan anggota delegasi dan kampus asal'
            ],
            ctaLabel: 'Buka Panduan Tim',
            ctaHref: '/pose/panduan#team'
        },

        // 5. Halaman Jadwal POSE
        '/pose/jadwal': {
            pageKey: 'jadwal',
            currentVersion: '2026.1.0',
            storageKey: 'pose_welcome_guide_jadwal',
            title: 'Panduan Halaman Jadwal & Pertandingan',
            subtitle: 'Live Match, Urutan Tanding, dan Countdown',
            greeting: 'Pantau laga yang sedang berlangsung secara real-time serta jadwal pertandingan mendatang.',
            youtubeId: 'FzyHiJe3ysc',
            highlights: [
                'Pantau Live Match & Live Timer pertandingan yang sedang berlangsung',
                'Filter jadwal berdasarkan status: Semua, Live, Belum Mulai, atau Selesai',
                'Lihat nomor urutan tanding dan hitung mundur menuju jadwal tanding'
            ],
            ctaLabel: 'Buka Panduan Jadwal',
            ctaHref: '/pose/panduan#jadwal'
        },

        // 6. Halaman Pendaftaran Utama POSE
        '/pose/register': {
            pageKey: 'register',
            currentVersion: '2026.1.0',
            storageKey: 'pose_welcome_guide_register',
            title: 'Panduan Pendaftaran Lomba POSE',
            subtitle: 'Formulir Registrasi Tim & Pengunggahan Berkas',
            greeting: 'Pilih cabang perlombaan favoritmu dan daftarkan delegasi tim terbaik kampusmu!',
            youtubeId: 'zheG5TDBhCw',
            highlights: [
                'Filter kategori peserta (Mahasiswa LP3I, Dosen, Umum) dan jenis lomba',
                'Lengkapi data kapten, nomor WhatsApp aktif, dan susunan anggota tim',
                'Unggah logo tim serta bukti transfer pembayaran',
                'Simpan Kode Form unik untuk memantau status di dashboard'
            ],
            ctaLabel: 'Buka Panduan Pendaftaran',
            ctaHref: '/pose/panduan#pendaftaran'
        },

        // 7. Halaman Pendaftaran Lanjut POSE
        '/pose/register/lanjut': {
            pageKey: 'register_lanjut',
            currentVersion: '2026.1.0',
            storageKey: 'pose_welcome_guide_register_lanjut',
            title: 'Panduan Pendaftaran Lomba Lanjutan',
            subtitle: 'Kategori Khusus & Tahapan Tambahan',
            greeting: 'Tata cara pendaftaran untuk kategori perlombaan tahap lanjutan dengan regulasi khusus.',
            youtubeId: 'iADVdrW62Tw',
            highlights: [
                'Akses katalog cabang lomba lanjutan yang sedang dibuka',
                'Isi form registrasi khusus dan lengkapi berkas persyaratan tambahan',
                'Pastikan data delegasi telah final sebelum batas waktu registrasi ditutup'
            ],
            ctaLabel: 'Buka Panduan Lomba Lanjutan',
            ctaHref: '/pose/panduan#register-lanjut'
        },

        // 8. Halaman Ketentuan POSE
        '/pose/ketentuan': {
            pageKey: 'ketentuan',
            currentVersion: '2026.1.0',
            storageKey: 'pose_welcome_guide_ketentuan',
            title: 'Panduan Syarat & Ketentuan Lomba',
            subtitle: 'Regulasi Teknis, Sistem Kompetisi, dan Fair Play',
            greeting: 'Pelajari seluruh tata tertib dan aturan teknis tiap cabang perlombaan agar siap bertanding maksimal.',
            youtubeId: 'AbG-0ZiArjc',
            highlights: [
                'Pelajari regulasi teknis spesifik tiap cabang (durasi, format, pergantian pemain)',
                'Pahami aturan sistem gugur / round robin dan kriteria diskualifikasi',
                'Junjung tinggi kode etik, sportivitas, dan prosedur pengajuan banding'
            ],
            ctaLabel: 'Buka Panduan Ketentuan',
            ctaHref: '/pose/panduan#ketentuan'
        },

        // 9. Halaman Kontak POSE
        '/pose/contact': {
            pageKey: 'contact',
            currentVersion: '2026.1.0',
            storageKey: 'pose_welcome_guide_contact',
            title: 'Panduan Halaman Kontak Panitia',
            subtitle: 'Pusat Bantuan & Kontak Penanggung Jawab (PJ)',
            greeting: 'Hubungi sekretariat panitia atau Penanggung Jawab (PJ) cabang lomba jika ada pertanyaan atau kendala.',
            youtubeId: '2-feInUztCo',
            highlights: [
                'Kirimkan pesan kendala atau pertanyaan melalui form kontak langsung',
                'Dapatkan respons cepat dari panitia melalui nomor WhatsApp resmi',
                'Hubungi langsung PJ tiap cabang lomba untuk koordinasi teknis di lapangan'
            ],
            ctaLabel: 'Buka Panduan Kontak',
            ctaHref: '/pose/panduan#kontak'
        },

        // 10. Halaman Dokumentasi & Multimedia POSE
        '/pose/dokumentasi': {
            pageKey: 'dokumentasi',
            currentVersion: '2026.1.0',
            storageKey: 'pose_welcome_guide_dokumentasi',
            title: 'Panduan Dokumentasi & Multimedia POSE',
            subtitle: 'Galeri Momen, Cuplikan Lomba, dan Video Highlight',
            greeting: 'Saksikan keseruan aksi atlet, selebrasi juara, galeri foto kegiatan, dan video sorotan kompetisi POSE 2026.',
            youtubeId: 'kosong',
            highlights: [
                'Gunakan filter (Semua, Dokumentasi, Konten Video) dan pencarian tanggal',
                'Buka kartu album untuk melihat rekaman cuplikan pertandingan dan foto momen terbaik',
                'Akses tautan folder Google Drive untuk mengunduh foto kegiatan beresolusi penuh',
                'Tonton video aftermovie dan tayangan kreatif multimedia POSE 2026'
            ],
            ctaLabel: 'Buka Panduan Dokumentasi',
            ctaHref: '/pose/panduan#dokumentasi'
        }
    },

    pkkmb: {
        // 1. Halaman Beranda Utama PKKMB
        '/pkkmb': {
            pageKey: 'landing',
            currentVersion: '2026.1.0',
            storageKey: 'pkkmb_welcome_guide_home',
            title: 'Selamat Datang di Portal PKKMB 2026!',
            subtitle: 'Pengenalan Kehidupan Kampus Mahasiswa Baru Politeknik LP3I',
            greeting: 'Halo Mahasiswa Baru! Simak panduan singkat pengenalan portal sebelum mengikuti rangkaian kegiatan PKKMB 2026.',
            youtubeId: null,
            highlights: [
                'Isi formulir pendaftaran wajib mahasiswa baru sesuai data resmi',
                'Pantau pengumuman penting, timeline, dan tata tertib kegiatan',
                'Lihat pembagian kelompok dan profil Kakak Pembimbing (Kabim)',
                'Akses modul materi presentasi narasumber & kumpulkan tugas resume harian'
            ],
            ctaLabel: 'Lihat Panduan Lengkap',
            ctaHref: '/pkkmb/panduan#landing-page'
        },

        // 2. Halaman Pemberitahuan PKKMB
        '/pkkmb/pemberitahuan': {
            pageKey: 'pemberitahuan',
            currentVersion: '2026.1.0',
            storageKey: 'pkkmb_welcome_guide_pemberitahuan',
            title: 'Panduan Halaman Pemberitahuan PKKMB',
            subtitle: 'Pusat Berita & Arahan Panitia',
            greeting: 'Pusat informasi resmi seputar tata tertib, jadwal arahan, dan pengumuman mendesak dari panitia PKKMB.',
            youtubeId: null,
            highlights: [
                'Pantau rilis pengumuman terstruktur berdasarkan urutan tanggal',
                'Cari instruksi spesifik menggunakan kolom pencarian berita',
                'Dapatkan instruksi terbaru dari panitia dan pembimbing kelompok'
            ],
            ctaLabel: 'Buka Panduan Pemberitahuan',
            ctaHref: '/pkkmb/panduan#pemberitahuan'
        },

        // 3. Halaman Kelompok PKKMB
        '/pkkmb/kelompok': {
            pageKey: 'kelompok',
            currentVersion: '2026.1.0',
            storageKey: 'pkkmb_welcome_guide_kelompok',
            title: 'Panduan Kelompok & Pembimbing',
            subtitle: 'Daftar Kelompok & Kakak Pembimbing (Kabim)',
            greeting: 'Temukan kelompok PKKMB kamu, kenali rekan satu tim, dan hubungi Kakak Pembimbing (Kabim).',
            youtubeId: null,
            highlights: [
                'Cari kelompok berdasarkan nama kelompok atau nama Kakak Pembimbing',
                'Klik kartu kelompok untuk melihat susunan lengkap rekan satu kelompok',
                'Hubungi media sosial pembimbing untuk koordinasi awal kelompok'
            ],
            ctaLabel: 'Buka Panduan Kelompok',
            ctaHref: '/pkkmb/panduan#kelompok'
        },

        // 4. Halaman Jadwal PKKMB
        '/pkkmb/jadwal': {
            pageKey: 'jadwal',
            currentVersion: '2026.1.0',
            storageKey: 'pkkmb_welcome_guide_jadwal',
            title: 'Panduan Jadwal & Rilis Materi',
            subtitle: 'Timeline Kegiatan & Ruang Belajar Harian',
            greeting: 'Pantau rangkaian timeline kegiatan PKKMB serta akses modul presentasi narasumber.',
            youtubeId: null,
            highlights: [
                'Lihat hitung mundur (countdown) menuju dimulainya pemaparan materi',
                'Tombol "Masuk Materi" akan aktif saat sesi materi sedang berlangsung',
                'Akses dokumen PDF materi, tanya jawab AI, dan kumpulkan tugas resume'
            ],
            ctaLabel: 'Buka Panduan Jadwal',
            ctaHref: '/pkkmb/panduan#jadwal'
        },

        // 5. Halaman Ketentuan PKKMB
        '/pkkmb/ketentuan': {
            pageKey: 'ketentuan',
            currentVersion: '2026.1.0',
            storageKey: 'pkkmb_welcome_guide_ketentuan',
            title: 'Panduan Ketentuan & Tata Tertib',
            subtitle: 'Standar Pakaian, Kedisiplinan, dan Sanksi',
            greeting: 'Pelajari seluruh tata tertib dan aturan kedisiplinan selama mengikuti rangkaian PKKMB 2026.',
            youtubeId: null,
            highlights: [
                'Patuhi standar seragam harian, kerapian, hijab, dan nametag resmi',
                'Pahami aturan kehadiran tepat waktu dan etika selama kegiatan',
                'Ketahui tingkatan sanksi pelanggaran tata tertib PKKMB'
            ],
            ctaLabel: 'Buka Panduan Ketentuan',
            ctaHref: '/pkkmb/panduan#ketentuan'
        },

        // 6. Halaman Kontak PKKMB
        '/pkkmb/contact': {
            pageKey: 'contact',
            currentVersion: '2026.1.0',
            storageKey: 'pkkmb_welcome_guide_contact',
            title: 'Panduan Kontak Layanan PKKMB',
            subtitle: 'Pusat Bantuan & Konsultasi Kendala',
            greeting: 'Sampaikan pertanyaan atau kendala seputar PKKMB langsung kepada panitia pelaksana.',
            youtubeId: null,
            highlights: [
                'Isi form kontak dengan identitas lengkap dan rincian pertanyaan',
                'Panitia akan merespons langsung melalui kontak WhatsApp aktif',
                'Dapatkan panduan cepat seputar masalah teknis portal atau pendaftaran'
            ],
            ctaLabel: 'Buka Panduan Kontak',
            ctaHref: '/pkkmb/panduan#kontak'
        },

        // 7. Halaman Dokumentasi & Multimedia PKKMB
        '/pkkmb/dokumentasi': {
            pageKey: 'dokumentasi',
            currentVersion: '2026.1.0',
            storageKey: 'pkkmb_welcome_guide_dokumentasi',
            title: 'Panduan Dokumentasi & Multimedia PKKMB',
            subtitle: 'Galeri Foto Kegiatan, Cuplikan, dan Video Aftermovie',
            greeting: 'Kilas balik momen bersejarah dan keseruan masa pengenalan kampus mahasiswa baru Politeknik LP3I 2026.',
            youtubeId: null,
            highlights: [
                'Filter tampilan berdasarkan Semua, Album Dokumentasi, atau Konten Video',
                'Klik "Lihat Detail & Cuplikan" untuk memutar cuplikan video atau melihat foto kegiatan',
                'Unduh seluruh arsip foto resolusi tinggi melalui tautan Google Drive resmi',
                'Putar video sorotan, teaser, dan aftermovie persembahan Divisi Multimedia'
            ],
            ctaLabel: 'Buka Panduan Dokumentasi',
            ctaHref: '/pkkmb/panduan#dokumentasi'
        }
    }
};
