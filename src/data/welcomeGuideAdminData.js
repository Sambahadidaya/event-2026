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
        }
    }
};
