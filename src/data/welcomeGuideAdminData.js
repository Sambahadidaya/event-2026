/**
 * Konfigurasi Pop-up Panduan Sambutan Admin (Welcome Guide Admin Modal)
 * Versi di sini terpisah dan independen khusus untuk panel operasional panitia/admin.
 */

export const welcomeGuideAdminConfig = {
    pkkmb: {
        '/panitia/panduan': {
            pageKey: 'panduan_admin_pkkmb',
            currentVersion: '2026.1.0',
            storageKey: 'admin_pkkmb_welcome_guide_panduan',
            title: 'Selamat Datang di Pusat Panduan Panitia PKKMB 2026',
            subtitle: 'Operational Guide & Dokumentasi Alur Kerja Panitia',
            greeting: 'Halo Panitia PKKMB 2026! Pelajari petunjuk operasional kerja divisi Anda untuk memastikan seluruh rangkaian kegiatan berjalan lancar.',
            youtubeId: 'kosong',
            highlights: [
                'Gunakan daftar isi di bilah navigasi kiri untuk berpindah antardivisi dengan cepat',
                'Simak alur Absensi Panitia QR Code, PJ Kabim, Pengunggahan Materi, dan Rekap Tugas',
                'Pelajari tata cara verifikasi pendaftaran peserta dan pencatatan kas di modul Keuangan',
                'Pantau log riwayat pembaruan sistem admin pada bagian Catatan Update Versi'
            ],
            ctaLabel: 'Mulai Pelajari Panduan',
            ctaHref: '/panitia/panduan'
        },
        '/panitia/multimedia/berita': {
            pageKey: 'admin_mulmed_berita_pkkmb',
            currentVersion: '2026.1.0',
            storageKey: 'admin_pkkmb_welcome_guide_mulmed_berita',
            title: 'Panduan Manajemen Berita PKKMB',
            subtitle: 'Divisi Multimedia - Publikasi Pengumuman & Siaran Pers',
            greeting: 'Halo Panitia Multimedia PKKMB! Kelola warta resmi, siaran pers, dan pengumuman kegiatan mahasiswa baru di sini.',
            youtubeId: 'kosong',
            highlights: [
                'Gunakan tombol "Tambah Berita" untuk menerbitkan berita melalui form modal',
                'Atur tanggal kegiatan dan isi konten lengkap informasi secara terstruktur',
                'Gunakan kolom pencarian judul/konten dan fitur hapus batch untuk efisiensi data'
            ],
            ctaLabel: 'Pelajari Panduan Lengkap',
            ctaHref: '/panitia/panduan'
        },
        '/panitia/multimedia/dokumentasi': {
            pageKey: 'admin_mulmed_dokumentasi_pkkmb',
            currentVersion: '2026.1.0',
            storageKey: 'admin_pkkmb_welcome_guide_mulmed_dokumentasi',
            title: 'Panduan Manajemen Dokumentasi PKKMB',
            subtitle: 'Divisi Multimedia - Album Foto & Cuplikan Kegiatan',
            greeting: 'Kelola arsip dokumentasi kegiatan PKKMB, foto header album, tautan Google Drive, serta cuplikan foto & video momen bersejarah.',
            youtubeId: 'kosong',
            highlights: [
                'Buat album dokumentasi per sesi acara dan tautkan folder Google Drive resmi',
                'Tambahkan cuplikan video Google Drive atau foto sorotan menarik',
                'Bagi Super Admin, gunakan Site Switcher untuk beralih antara PKKMB dan POSE'
            ],
            ctaLabel: 'Pelajari Panduan Lengkap',
            ctaHref: '/panitia/panduan'
        },
        '/panitia/multimedia/konten': {
            pageKey: 'admin_mulmed_konten_pkkmb',
            currentVersion: '2026.1.0',
            storageKey: 'admin_pkkmb_welcome_guide_mulmed_konten',
            title: 'Panduan Konten Multimedia PKKMB',
            subtitle: 'Divisi Multimedia - Video Sorotan & Aftermovie',
            greeting: 'Publikasikan aftermovie, video promosi, dan tayangan kreatif multimedia untuk disaksikan mahasiswa di portal PKKMB.',
            youtubeId: 'kosong',
            highlights: [
                'Tambahkan video menggunakan file ID atau link share Google Drive',
                'Unggah thumbnail menarik untuk memikat perhatian mahasiswa baru',
                'Uji coba langsung pemutaran video menggunakan tombol "Tes Video"'
            ],
            ctaLabel: 'Pelajari Panduan Lengkap',
            ctaHref: '/panitia/panduan'
        }
    },
    pose: {
        '/panitia/panduan': {
            pageKey: 'panduan_admin_pose',
            currentVersion: '2026.1.0',
            storageKey: 'admin_pose_welcome_guide_panduan',
            title: 'Selamat Datang di Pusat Panduan Admin POSE 2026',
            subtitle: 'Operational Guide & Panduan Koordinator Lomba POSE',
            greeting: 'Halo Panitia POSE 2026! Pahami seluruh mekanisme pengelolaan pendaftaran tim, pelaksanaan pertandingan, dan sistem penilaian lomba.',
            youtubeId: 'kosong',
            highlights: [
                'Jelajahi panduan operasional PJ Lomba untuk cabang olahraga, seni, dan karya digital',
                'Pelajari cara mengatur jadwal pertandingan tanding, input skor live, dan penentuan juara',
                'Pahami alur verifikasi berkas registrasi, bukti pembayaran, dan modul submission karya',
                'Periksa riwayat catatan fitur terbaru pada bagian Update Versi Panel Admin'
            ],
            ctaLabel: 'Mulai Pelajari Panduan',
            ctaHref: '/panitia/panduan'
        },
        '/panitia/multimedia/berita': {
            pageKey: 'admin_mulmed_berita_pose',
            currentVersion: '2026.1.0',
            storageKey: 'admin_pose_welcome_guide_mulmed_berita',
            title: 'Panduan Manajemen Berita POSE',
            subtitle: 'Divisi Multimedia - Warta Perlombaan & Pengumuman',
            greeting: 'Halo Panitia Multimedia POSE! Rilis update teknis perlombaan, hasil technical meeting, dan warta kegiatan POSE 2026.',
            youtubeId: 'kosong',
            highlights: [
                'Terbitkan berita seputar perkembangan pertandingan dan agenda kompetisi',
                'Kelola tanggal kegiatan dan detail instruksi dalam form modal interaktif',
                'Gunakan fitur filter dan pencarian untuk menyaring arsip warta perlombaan'
            ],
            ctaLabel: 'Pelajari Panduan Lengkap',
            ctaHref: '/panitia/panduan'
        },
        '/panitia/multimedia/dokumentasi': {
            pageKey: 'admin_mulmed_dokumentasi_pose',
            currentVersion: '2026.1.0',
            storageKey: 'admin_pose_welcome_guide_mulmed_dokumentasi',
            title: 'Panduan Dokumentasi Perlombaan POSE',
            subtitle: 'Divisi Multimedia - Album Pertandingan & Momen Juara',
            greeting: 'Kelola album foto dokumentasi turnamen olahraga & seni, tautan Google Drive, serta cuplikan aksi atlet dan selebrasi juara.',
            youtubeId: 'kosong',
            highlights: [
                'Unggah foto header kegiatan dan tautkan folder Google Drive arsip lengkap',
                'Tambahkan cuplikan video pertandingan atau foto podium juara per cabang lomba',
                'Periksa pratinjau cuplikan video langsung dengan pemutar modal'
            ],
            ctaLabel: 'Pelajari Panduan Lengkap',
            ctaHref: '/panitia/panduan'
        },
        '/panitia/multimedia/konten': {
            pageKey: 'admin_mulmed_konten_pose',
            currentVersion: '2026.1.0',
            storageKey: 'admin_pose_welcome_guide_mulmed_konten',
            title: 'Panduan Konten Multimedia POSE',
            subtitle: 'Divisi Multimedia - Video Highlight & Teaser Kompetisi',
            greeting: 'Publikasikan video highlight pertandingan, teaser cabang lomba, dan video closing ceremony POSE 2026.',
            youtubeId: 'kosong',
            highlights: [
                'Sematkan link Google Drive video sorotan kompetisi POSE',
                'Sertakan gambar thumbnail berkualitas tinggi dan deskripsi singkat video',
                'Gunakan pemutar video modal untuk memastikan tautan video dapat diputar sempurna'
            ],
            ctaLabel: 'Pelajari Panduan Lengkap',
            ctaHref: '/panitia/panduan'
        }
    }
};
