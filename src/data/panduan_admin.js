export const panduanAdminData = {
    pkkmb: {
        sections: [
            {
                id: 'admin-pkkmb-overview',
                title: 'Panduan Umum Admin PKKMB',
                content: 'Sebagai Panitia PKKMB 2026, Anda memiliki kewenangan untuk memantau data peserta, mengelola absensi, mengunggah materi & tugas, serta memverifikasi transaksi pembayaran.',
                imageKey: 'overview',
                youtubeId: 'kosong',
                subsections: [
                    {
                        id: 'admin-pkkmb-akses',
                        title: 'Akses & Hak Akses Fitur',
                        content: 'Setiap peran (Super Admin, Sekretaris, Bendahara/Keuangan, PJ Kabim, PJ Medis, Tatib, Mulmed) memiliki batas wilayah kerja sesuai dengan modul yang ditetapkan.'
                    },
                    {
                        id: 'admin-pkkmb-navigasi',
                        title: 'Navigasi Sidebar Admin',
                        content: 'Gunakan menu sebelah kiri untuk berpindah antarmodul. Apabila modul tidak muncul, pastikan peran admin Anda sudah terdaftar sesuai kebijakan role.'
                    }
                ]
            },
            {
                id: 'admin-pkkmb-absensi',
                title: 'Panduan Absensi Panitia (QR Scanner)',
                content: 'Modul presensi kehadiran seluruh panitia PKKMB menggunakan pemindai kamera QR Code atau input manual kode unik panitia.',
                imageKey: 'absensi',
                youtubeId: 'kosong',
                subsections: [
                    {
                        id: 'admin-pkkmb-scan-absensi',
                        title: 'Prosedur Scan QR Code Presensi',
                        content: 'Arahkan kamera scanner panitia ke QR Code ID Card masing-masing panitia. Sistem otomatis memvalidasi waktu kedatangan, status on-time/terlambat, dan mencatatnya ke log database.'
                    },
                    {
                        id: 'admin-pkkmb-rekap-absensi',
                        title: 'Rekapitulasi & Riwayat Kehadiran',
                        content: 'Sekretaris dan Super Admin dapat mengunduh lembar rekap presensi panitia per hari serta memantau persentase kehadiran divisi.'
                    }
                ]
            },
            {
                id: 'admin-pkkmb-kabim',
                title: 'Panduan PJ Kabim (Kakak Pembimbing)',
                content: 'Modul pengelolaan kelompok PKKMB, pemantauan keaktifan anggota, dan koordinasi presensi peserta.',
                imageKey: 'kabim',
                youtubeId: 'kosong',
                subsections: [
                    {
                        id: 'admin-pkkmb-kabim-kelompok',
                        title: 'Melihat & Memfilter Kelompok',
                        content: 'PJ Kabim 1 hingga 8 dapat secara otomatis memfilter daftar peserta berdasarkan kelompok binaan masing-masing.'
                    },
                    {
                        id: 'admin-pkkmb-kabim-penilaian',
                        title: 'Evaluasi & Pendampingan Maba',
                        content: 'Pantau kelengkapan atribut, kedisiplinan, serta progres pemahaman materi peserta binaan secara real-time.'
                    }
                ]
            },
            {
                id: 'admin-pkkmb-peserta',
                title: 'Panduan Peserta Wajib & Kelompok',
                content: 'Manajemen basis data seluruh mahasiswa baru peserta wajib PKKMB 2026, status verifikasi berkas, dan pembagian regu kelompok.',
                imageKey: 'peserta',
                youtubeId: 'kosong',
                subsections: [
                    {
                        id: 'admin-pkkmb-verifikasi-peserta',
                        title: 'Verifikasi Data & Status Peserta',
                        content: 'Periksa kesesuaian NIM, Program Studi, Kampus Cabang, dan kelengkapan kontak peserta. Lakukan validasi status aktif peserta.'
                    },
                    {
                        id: 'admin-pkkmb-ekspor-peserta',
                        title: 'Ekspor Data Peserta ke Spreadsheet',
                        content: 'Gunakan fitur ekspor Excel (.xlsx) untuk mencetak daftar absensi fisik atau membagikan rekapitulasi data kepada tim divisi terkait.'
                    }
                ]
            },
            {
                id: 'admin-pkkmb-materi-tugas',
                title: 'Panduan Manajemen Materi & Tugas',
                content: 'Prosedur mengunggah berkas presentasi pemateri serta memeriksa pengumpulan tugas mahasiswa baru.',
                imageKey: 'materi',
                youtubeId: 'kosong',
                subsections: [
                    {
                        id: 'admin-pkkmb-upload-materi',
                        title: 'Mengunggah Berkas PDF Materi',
                        content: 'Unggah foto header dan file PDF materi pada form materi PKKMB agar mahasiswa dapat langsung mengunduhnya di portal publik.'
                    },
                    {
                        id: 'admin-pkkmb-cek-tugas',
                        title: 'Memeriksa Pengumpulan Tugas',
                        content: 'Buka menu Tugas untuk memeriksa daftar tugas yang telah diunggah oleh peserta per sesi materi beserta tautan file tugas.'
                    }
                ]
            },
            {
                id: 'admin-pkkmb-berita-jadwal',
                title: 'Panduan Berita & Rundown Acara',
                content: 'Pusat publikasi siaran pers, pengumuman tata tertib, dan penyusunan jadwal timeline kegiatan PKKMB 2026.',
                imageKey: 'berita',
                youtubeId: 'kosong',
                subsections: [
                    {
                        id: 'admin-pkkmb-publish-berita',
                        title: 'Menerbitkan Pengumuman Resmi',
                        content: 'Tulis judul, isi berita (mendukung format Markdown), serta tanggal publikasi untuk ditampilkan di halaman Berita portal mahasiswa.'
                    },
                    {
                        id: 'admin-pkkmb-atur-jadwal',
                        title: 'Mengatur Rundown Kegiatan Acara',
                        content: 'Atur waktu mulai, waktu selesai, nama agenda, dan lokasi pelaksanaan per hari acara PKKMB.'
                    }
                ]
            },
            {
                id: 'admin-pkkmb-keuangan',
                title: 'Panduan Keuangan & Verifikasi PKKMB',
                content: 'Verifikasi pembayaran registrasi wajib PKKMB, pencatatan kas masuk/keluar, dan laporan buku besar.',
                imageKey: 'bendahara',
                youtubeId: 'kosong',
                subsections: [
                    {
                        id: 'admin-pkkmb-verifikasi-bayar',
                        title: 'Verifikasi Pembayaran Peserta',
                        content: 'Periksa kesesuaian nominal dan foto bukti transfer pada menu Verifikasi Pembayaran. Berikan persetujuan jika valid.'
                    },
                    {
                        id: 'admin-pkkmb-jurnal-keuangan',
                        title: 'Pencatatan Transaksi & Jurnal Akuntansi',
                        content: 'Catat setiap pos pengeluaran operasional panitia, pengadaan logistik, konsumsi, dan cetak sertifikat sesuai standar akuntansi berpasangan.'
                    }
                ]
            }
        ],
        updateVersi: [
            {
                versi: 'versi 2026.3.1',
                tanggal: '06 September 2026',
                judul: 'Rilis Admin Versi 3.1 — Video Tutorial & Peningkatan Modul Panduan',
                isi: 'Integrasi pemutar video panduan interaktif per section, pop-up update version khusus panel admin, modal sambutan panitia, serta peremajaan tata letak panduan divisi.',
                imageKey: 'versi1.2'
            },
            {
                versi: 'versi 2026.1.2',
                tanggal: '10 Juli 2026',
                judul: 'Rilis Admin Versi 1.2 — Modul Panduan Panitia & Keamanan Role',
                isi: 'Menambahkan modul Panduan Admin terintegrasi per site (PKKMB/POSE), penyempurnaan manajemen token login admin, dan laporan audit log.',
                imageKey: 'versi1.2'
            },
            {
                versi: 'versi 2026.1.1',
                tanggal: '28 Juni 2026',
                judul: 'Rilis Admin Versi 1.1 — Fitur Absensi Panitia & Manajemen Kelompok',
                isi: 'Integrasi sistem QR Code scanner absensi panitia, filter otomatis PJ Kabim per urutan kelompok, dan ekspor data peserta ke Excel.',
                imageKey: 'versi1.1'
            }
        ]
    },
    pose: {
        sections: [
            {
                id: 'admin-pose-overview',
                title: 'Panduan Umum Admin POSE',
                content: 'Selamat datang di Panel Admin POSE 2026. Anda bertugas mengelola pendaftaran tim kompetisi, pengisian skor pertandingan, verifikasi pembayaran lomba, serta pengumpulan karya digital.',
                imageKey: 'overview',
                youtubeId: 'kosong',
                subsections: [
                    {
                        id: 'admin-pose-akses',
                        title: 'Hak Akses Peran Panitia POSE',
                        content: 'Modul terpisah untuk Sekretaris POSE, Admin Keuangan, Admin Form, Admin Jadwal, serta PJ Lomba spesifik (Badminton, ML, Software Dev, Poster, dll).'
                    },
                    {
                        id: 'admin-pose-navigasi',
                        title: 'Navigasi Panel Kontrol POSE',
                        content: 'Akses menu navigasi di sisi kiri untuk berpindah antardivisi pertandingan, manajemen formulir, data tim, dan finance kas lomba.'
                    }
                ]
            },
            {
                id: 'admin-pose-absensi',
                title: 'Panduan Absensi Panitia POSE',
                content: 'Sistem presensi kehadiran panitia dan volunteer POSE 2026 selama masa persiapan hingga hari pelaksanaan pertandingan.',
                imageKey: 'absensi',
                youtubeId: 'kosong',
                subsections: [
                    {
                        id: 'admin-pose-scan-presensi',
                        title: 'Pemindaian QR Kehadiran Panitia',
                        content: 'Lakukan scan QR Code pada ID Card panitia saat datang ke lokasi kegiatan perlombaan untuk mencatat jam kehadiran akurat.'
                    }
                ]
            },
            {
                id: 'admin-pose-form-pendaftaran',
                title: 'Panduan Form Register & Verifikasi Tim',
                content: 'Pengelolaan formulir pendaftaran cabang lomba POSE, pengaturan nominal biaya registrasi, dan verifikasi anggota tim peserta.',
                imageKey: 'form_register',
                youtubeId: 'kosong',
                subsections: [
                    {
                        id: 'admin-pose-buat-form',
                        title: 'Pengaturan Kategori & Kuota Lomba',
                        content: 'Admin dapat membuat form lomba baru, menentukan biaya pendaftaran, status butuh bukti bayar, dan batasan kategori pendaftar.'
                    },
                    {
                        id: 'admin-pose-verifikasi-tim',
                        title: 'Validasi & Verifikasi Pendaftaran Tim',
                        content: 'Cek susunan nama anggota tim, asal kampus, berkas identitas, dan bukti pembayaran. Ubah status verifikasi menjadi terdaftar resmi.'
                    }
                ]
            },
            {
                id: 'admin-pose-pj-lomba',
                title: 'Panduan PJ Lomba (Koordinator Cabang)',
                content: 'Khusus PJ Lomba untuk mengelola pendaftaran peserta, menginput bagan pertandingan, serta memberikan penilaian lomba karya.',
                imageKey: 'pj_lomba',
                youtubeId: 'kosong',
                subsections: [
                    {
                        id: 'admin-pose-jadwal-tanding',
                        title: 'Mengatur Jadwal & Hasil Pertandingan',
                        content: 'Pilih cabang lomba Anda, tentukan waktu tanding, atur tim yang bertanding, lalu input skor akhir setelah pertandingan selesai.'
                    },
                    {
                        id: 'admin-pose-penilaian-kreativitas',
                        title: 'Penilaian Lomba Karya Digital',
                        content: 'Buka menu Penilaian untuk memberikan akumulasi skor juri pada cabang lomba kreativitas, seni, dan karya digital.'
                    }
                ]
            },
            {
                id: 'admin-pose-pengumpulan-karya',
                title: 'Panduan Form Pengumpulan & Submission',
                content: 'Pengelolaan tautan pengumpulan karya peserta untuk cabang lomba non-tanding (Poster, UI/UX, Video Kreatif, Essay, Karya Tulis).',
                imageKey: 'pengumpulan',
                youtubeId: 'kosong',
                subsections: [
                    {
                        id: 'admin-pose-buka-tutup-submission',
                        title: 'Aktivasi Status Pengumpulan',
                        content: 'Aktifkan atau nonaktifkan status formulir pengumpulan sesuai batas waktu (deadline) yang telah ditentukan.'
                    },
                    {
                        id: 'admin-pose-unduh-karya',
                        title: 'Pemeriksaan Berkas Karya Peserta',
                        content: 'Akses tautan file / Google Drive pengumpulan karya peserta untuk diverifikasi dan diserahkan kepada dewan juri.'
                    }
                ]
            },
            {
                id: 'admin-pose-jadwal-pertandingan',
                title: 'Panduan Jadwal Pertandingan & Live Timer',
                content: 'Manajemen turnamen live match, update skor langsung di lapangan, serta penentuan pemenang bagan turnamen.',
                imageKey: 'jadwal',
                youtubeId: 'kosong',
                subsections: [
                    {
                        id: 'admin-pose-live-match',
                        title: 'Memulai & Menyelesaikan Pertandingan',
                        content: 'Ubah status pertandingan dari Belum Mulai menjadi Sedang Berlangsung (Live) untuk menyalakan live timer di portal publik, lalu tandai Selesai setelah skor akhir diisi.'
                    }
                ]
            },
            {
                id: 'admin-pose-berita-jadwal',
                title: 'Panduan Berita & Agenda POSE',
                content: 'Penerbitan warta terkini pertandingan, jadwal technical meeting, dan rundown acara closing ceremony.',
                imageKey: 'berita',
                youtubeId: 'kosong',
                subsections: [
                    {
                        id: 'admin-pose-rilis-warta',
                        title: 'Publikasi Update Informasi',
                        content: 'Unggah pemberitahuan darurat seperti perubahan lapangan tanding atau pengundian ulang bagan pertandingan.'
                    }
                ]
            },
            {
                id: 'admin-pose-keuangan',
                title: 'Panduan Keuangan & Kas POSE',
                content: 'Manajemen pemasukan registrasi lomba, akuntansi jurnal berpasangan, buku besar, dan neraca lajur POSE.',
                imageKey: 'bendahara',
                youtubeId: 'kosong',
                subsections: [
                    {
                        id: 'admin-pose-kas-lomba',
                        title: 'Verifikasi Transfer Lomba',
                        content: 'Periksa bukti bayar peserta tim lomba berbayar sebelum menyetujui verifikasi pendaftaran tim.'
                    },
                    {
                        id: 'admin-pose-laporan-keuangan',
                        title: 'Laporan Keuangan & Hadiah Juara',
                        content: 'Rekap dana kas masuk dari pendaftaran dan pengeluaran untuk sewa venue, wasit, medali, serta total hadiah pemenang lomba.'
                    }
                ]
            }
        ],
        updateVersi: [
            {
                versi: 'versi 2026.3.1',
                tanggal: '06 September 2026',
                judul: 'Rilis Admin Versi 3.1 — Video Tutorial & Sistem Panduan Lomba',
                isi: 'Integrasi pemutar video per modul panduan admin POSE, pop-up update modul admin, sambutan alur kerja koordinator lomba, dan pembaruan struktur dokumentasi divisi.',
                imageKey: 'versi1.2'
            },
            {
                versi: 'versi 2026.1.2',
                tanggal: '10 Juli 2026',
                judul: 'Rilis Admin Versi 1.2 — Modul Panduan Panitia & Sistem Skor Terpadu',
                isi: 'Peluncuran modul Panduan Admin POSE, integrasi kalkulasi otomatis klasemen perolehan medali, dan penyempurnaan form submit karya.',
                imageKey: 'versi1.2'
            },
            {
                versi: 'versi 2026.1.1',
                tanggal: '28 Juni 2026',
                judul: 'Rilis Admin Versi 1.1 — Pendaftaran Tim & Manajemen PJ Lomba',
                isi: 'Integrasi peran dinamis PJ Lomba per cabang olahraga/kreativitas, fitur verifikasi pendaftaran tim berbayar, dan pencatatan transaksi finance.',
                imageKey: 'versi1.1'
            }
        ]
    }
};
