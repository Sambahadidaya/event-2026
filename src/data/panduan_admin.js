export const panduanAdminData = {
    pkkmb: {
        sections: [
            {
                id: 'admin-pkkmb-overview',
                title: 'Panduan Umum Admin PKKMB',
                content: 'Sebagai Panitia PKKMB 2026, Anda memiliki kewenangan untuk memantau data peserta, mengelola absensi, mengunggah materi & tugas, serta memverifikasi transaksi pembayaran.',
                imageKey: 'overview',
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
                id: 'admin-pkkmb-kabim',
                title: 'Panduan PJ Kabim (Kakak Pembimbing)',
                content: 'Modul pengelolaan kelompok PKKMB, pemantauan keaktifan anggota, dan koordinasi presensi peserta.',
                imageKey: 'kabim',
                subsections: [
                    {
                        id: 'admin-pkkmb-kabim-kelompok',
                        title: 'Melihat & Memfilter Kelompok',
                        content: 'PJ Kabim 1 hingga 8 dapat secara otomatis memfilter daftar peserta berdasarkan kelompok binaan masing-masing.'
                    }
                ]
            },
            {
                id: 'admin-pkkmb-materi-tugas',
                title: 'Panduan Manajemen Materi & Tugas',
                content: 'Prosedur mengunggah berkas presentasi pemateri serta memeriksa pengumpulan tugas mahasiswa baru.',
                imageKey: 'materi',
                subsections: [
                    {
                        id: 'admin-pkkmb-upload-materi',
                        title: 'Mengunggah Berkas PDF Materi',
                        content: 'Unggah foto header dan file PDF materi pada form materi PKKMB agar mahasiswa dapat langsung mengunduhnya.'
                    },
                    {
                        id: 'admin-pkkmb-cek-tugas',
                        title: 'Memeriksa Pengumpulan Tugas',
                        content: 'Buka menu Tugas untuk memeriksa daftar tugas yang telah diunggah oleh peserta per sesi materi.'
                    }
                ]
            },
            {
                id: 'admin-pkkmb-keuangan',
                title: 'Panduan Keuangan & Verifikasi PKKMB',
                content: 'Verifikasi pembayaran registrasi wajib PKKMB, pencatatan kas masuk/keluar, dan laporan buku besar.',
                imageKey: 'bendahara',
                subsections: [
                    {
                        id: 'admin-pkkmb-verifikasi-bayar',
                        title: 'Verifikasi Pembayaran Peserta',
                        content: 'Periksa kesesuaian nominal dan foto bukti transfer pada menu Verifikasi Pembayaran. Berikan persetujuan jika valid.'
                    }
                ]
            }
        ],
        updateVersi: [
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
                content: 'Selamat datang di Panel Admin POSE 2026. Anda bertugas mengelola pendaftaran tim kompetisi, pengisatan skor pertandingan, verifikasi pembayaran lomba, serta pengumpulan karya digital.',
                imageKey: 'overview',
                subsections: [
                    {
                        id: 'admin-pose-akses',
                        title: 'Hak Akses Peran Panitia POSE',
                        content: 'Modul terpisah untuk Sekretaris POSE, Admin Keuangan, Admin Form, Admin Jadwal, serta PJ Lomba spesifik (Badminton, ML, Software Dev, Poster, dll).'
                    }
                ]
            },
            {
                id: 'admin-pose-pj-lomba',
                title: 'Panduan PJ Lomba (Koordinator Cabang)',
                content: 'Khusus PJ Lomba untuk mengelola pendaftaran peserta, menginput bagan pertandingan, serta memberikan penilaian lomba karya.',
                imageKey: 'pj_lomba',
                subsections: [
                    {
                        id: 'admin-pose-jadwal-tanding',
                        title: 'Mengatur Jadwal & Hasil Pertandingan',
                        content: 'Pilih cabang lomba Anda, tentukan waktu tanding, lalu input skor akhir setelah pertandingan selesai.'
                    },
                    {
                        id: 'admin-pose-penilaian-kreativitas',
                        title: 'Penilaian Lomba Karya Digital',
                        content: 'Buka menu Penilaian untuk memberikan akumulasi skor juri pada cabang lomba kreativitas.'
                    }
                ]
            },
            {
                id: 'admin-pose-keuangan',
                title: 'Panduan Keuangan & Kas POSE',
                content: 'Manajemen pemasukan registrasi lomba, akuntansi jurnal berpasangan, buku besar, dan neraca lajur POSE.',
                imageKey: 'bendahara',
                subsections: [
                    {
                        id: 'admin-pose-kas-lomba',
                        title: 'Verifikasi Transfer Lomba',
                        content: 'Periksa bukti bayar peserta tim lomba berbayar sebelum menyetujui verifikasi pendaftaran tim.'
                    }
                ]
            }
        ],
        updateVersi: [
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
