import { getRoleHelpContext, getRoleLabel } from '@/lib/adminRoleData';

export const commonFaq = [
    { question: 'Halo', answer: 'Halo! Ada yang bisa dibantu seputar halaman admin?' },
    { question: 'Terima kasih', answer: 'Sama-sama! Kalau masih bingung, tanya saja lagi.' },
];

const adminGeneralFaq = [
    { question: 'Bagaimana cara menggunakan admin asisten?', answer: 'Tanya langsung apa yang ingin kamu lakukan di panel admin, saya akan jelaskan langkahnya sesuai peranmu.' },
    { question: 'Bagaimana cara mencari data peserta?', answer: 'Buka menu peserta di sidebar, lalu gunakan filter untuk melihat data berdasarkan form atau kategori.' },
    { question: 'Bagaimana cara verifikasi pembayaran?', answer: 'Masuk ke halaman verifikasi keuangan, pilih transaksi, lalu klik tombol verifikasi untuk menyetujui pembayaran.' },
    { question: 'Bagaimana cara melihat laporan keuangan?', answer: 'Keuangan > laporan adalah tempat untuk melihat ringkasan transaksi dan status kas masuk/keluar.' },
    { question: 'Bagaimana cara logout dari halaman admin?', answer: 'Klik tombol logout di pojok kanan atas lalu pastikan sesi Anda berhenti.' },
];

const adminPkkmbFaq = [
    { question: 'Bagaimana cara update berita PKKMB?', answer: 'Masuk ke menu PKKMB berita lalu klik tambah atau edit untuk mengubah informasi pengumuman.' },
    { question: 'Bagaimana cara mengelola peserta wajib PKKMB?', answer: 'Gunakan menu peserta wajib untuk melihat daftar peserta dan status pendaftaran mereka.' },
    { question: 'Bagaimana menambah jadwal acara PKKMB?', answer: 'Silakan ke menu jadwal acara PKKMB dan tambahkan waktu mulai, selesai, serta tipe acara.' },
];

const adminPoseFaq = [
    { question: 'Bagaimana cara mengelola registrasi POSE?', answer: 'Buka menu POSE register untuk memeriksa pendaftaran dan melihat detail lomba.' },
    { question: 'Bagaimana cara melihat jadwal pertandingan POSE?', answer: 'Pergi ke menu jadwal pertandingan untuk melihat dan memperbarui waktu lomba.' },
    { question: 'Bagaimana cara memverifikasi peserta POSE?', answer: 'Gunakan menu peserta POSE untuk cek status pembayaran dan validasi data peserta.' },
];

const adminKeuanganFaq = [
    { question: 'Bagaimana cara menambah transaksi kas masuk?', answer: 'Masuk ke menu kas masuk dan isi form transaksi yang diperlukan untuk menyimpan pemasukan baru.' },
    { question: 'Bagaimana cara menambahkan transaksi kas pengeluaran?', answer: 'Gunakan menu transaksi kas pengeluaran dan isi form transaksi yang diperlukan untuk menyimpan pengeluaran baru.' },
    { question: 'Bagaimana cara melihat neraca saldo?', answer: 'Buka menu neraca saldo untuk melihat ringkasan posisi akun keuangan saat ini.' },
    { question: 'Apakah benar Jurnal entry,Buku Besar,Neraca saldo,dll itu terisi otomatis?', answer: 'Ya benar, karna form-form tersebut saling terhubung.' },
];

const adminAbsensiFaq = [
    { question: 'Bagaimana cara menggunakan absensi panitia?', answer: 'Gunakan menu absensi panitia untuk mencatat hadir, sakit, izin, dan alpha panitia.' },
    { question: 'Bagaimana cara menambahkan formulir absen?', answer: 'Buka menu absensi form lalu buat form baru untuk sesi absen yang ingin dicatat.' },
];

const adminFormFaq = [
    { question: 'Bagaimana cara mengelola formulir registrasi lomba?', answer: 'Masuk ke menu form register dan gunakan tombol tambah untuk membuat link pendaftaran baru.' },
    { question: 'Bagaimana cara mengatur kode form dan kategori peserta?', answer: 'Isi kolom kode form dan kategori di form register saat membuat atau mengedit lomba.' },
];

const adminJadwalFaq = [
    { question: 'Bagaimana cara mengatur jadwal pertandingan?', answer: 'Buka menu jadwal pertandingan, pilih tim, dan atur waktu serta lokasi pertandingan.' },
    { question: 'Bagaimana cara menambah acara POSE?', answer: 'Gunakan menu jadwal acara POSE untuk menambah jenis acara dan waktu pelaksanaannya.' },
];

const getPjLombaFaq = (namaLomba) => [
    { question: `Bagaimana cara mengelola jadwal pertandingan ${namaLomba}?`, answer: `Gunakan menu PJ Lomba untuk update jadwal ${namaLomba} dan atur waktu pertandingan sesuai kebutuhan.` },
    { question: `Bagaimana cara melihat nilai lomba ${namaLomba}?`, answer: `Buka menu penilaian PJ Lomba untuk melihat hasil dan status nilai untuk ${namaLomba}.` },
    { question: `Bagaimana cara mengelola pendaftaran ${namaLomba}?`, answer: `Masuk ke menu Manajemen Team PJ Lomba untuk melihat daftar peserta dan lihat detail pendaftaran ${namaLomba}.` },
    { question: `Bagaimana cara mengelola pengumpulan karya ${namaLomba}?`, answer: `Masuk ke menu Manajemen Team PJ Lomba ada tombol swich form pengumpulan untuk melihat daftar pengumpulan peserta dan lihat karyanya di ${namaLomba}.` },
    { question: `Dihalaman Manajemen team ada fitur apa saja ${namaLomba}?`, answer: `Di halaman Manajemen Team ${namaLomba} kamu bisa melihat daftar peserta ${namaLomba}, melihat detail pendaftaran ${namaLomba}, mengelola pengumpulan karya ${namaLomba}. dan melihat sisa kuata perkategorinya.` },
    { question: `Bagaimana cara memverifikasi team di ${namaLomba}?`, answer: `Masuk ke menu Manajemen Team ${namaLomba} lalu klik tombol verifikasi team yang ingin kamu verifikasi. namun verfikasi ini akan bisa disetujui jika pesertanya sudah dinyatakan valid oleh panitia keuangan` },
    { question: `Bagaimana cara melihat sisa kuota ${namaLomba}?`, answer: `Masuk ke menu Manajemen Team ${namaLomba} lalu lihat sisa kuota perkategorinya.` },
    { question: `Apakah tim yang sudah terverifikasi bisa di hapus?`, answer: `Ya bisa.` },
    { question: `Bagaimana langkah langkah untuk mengubah tanggal pertandingan ${namaLomba}?`, answer: `Masuk ke menu jadwal pertandingan ${namaLomba} lalu klik tombol edit untuk mengubah jadwal pertandingan ${namaLomba}.` },
    { question: `Bagaimana cara memberi penilian peserta untuk di lomba ${namaLomba}?`, answer: `Masuk ke menu penilaian PJ Lomba ${namaLomba} lalu salin link form penilaian yang ada di paling bawah yang sudah disediakan oleh panitia, setelah itu buka link tersebut dan isi form penilaian.` },
    { question: `Dimana saya menemukan kode team di lomba ${namaLomba}?`, answer: `Masuk ke menu Manajemen Team ${namaLomba} lalu lihat kode team di kolom kode.` },
    { question: `Bagaimana cara mendaftar lomba ${namaLomba}?`, answer: `Masuk ke menu form register ${namaLomba} lalu salin link form pendaftarannya ${namaLomba} dan bagikan ke peserta. atau bisa juga langsung dihalaman public pose dimenu daftar` },
    { question: `Apakah tim yang sudah terdaftar di ${namaLomba} bisa di edit?`, answer: `Tidak bisa, karna tim yang sudah terdaftar di ${namaLomba} hanya bisa dilihat saja, karna tim ${namaLomba} akan terhapus dan tidak bisa dikembalikan lagi jika sudah di hapus.` },
    { question: `Dihalaman manajemen team kenapa ada 2 form?`, answer: `Pada halaman manajemen team terdapat 2 form yang memiliki fungsi yang berbeda, yaitu form pendaftaran dan form pendaftaran dan form pengumpulan karya. form pendaftaran digunakan untuk mendaftar lomba ${namaLomba}, sedangkan form pengumpulan karya digunakan untuk mengumpulkan karya peserta lomba ${namaLomba}.` },
    { question: `Dihalaman manajemen team apa yang dimaksud dengan form 1 dan form 2?`, answer: `pada halaman manajemen team form 1 untuk khusus htm lanjutan dan untuk form 2 itu khusus untuk dari htm wajib` },
];

const adminSalesFaq = [
    { question: 'Bagaimana cara melihat riwayat sales POSE?', answer: 'Masuk ke menu sales riwayat untuk melihat sumber promosi, nama peserta, dan nominal transaksi.' },
    { question: 'Bagaimana cara melihat dashboard sales?', answer: 'Gunakan dashboard sales untuk memantau performa penjualan dan target tim sales.' },
];

const roleSpecificFaq = {
    super_admin: [...adminPkkmbFaq, ...adminKeuanganFaq, ...adminAbsensiFaq, ...adminPoseFaq, ...adminKeuanganFaq, ...adminAbsensiFaq, ...adminSalesFaq, ...getPjLombaFaq('Mobile Legend'),
    { question: 'Apa fungsi utama Super Admin?', answer: 'Super Admin dapat mengakses semua halaman admin dan membantu memantau seluruh operasi sistem.' },
    ],
    admin_pkkmb: [...adminPkkmbFaq, ...adminKeuanganFaq, ...adminAbsensiFaq],
    admin_pose: [...adminPoseFaq, ...adminKeuanganFaq, ...adminAbsensiFaq, ...adminSalesFaq],
    admin_pkkmb_sekretaris: [...adminAbsensiFaq],
    admin_pose_sekretaris: [...adminAbsensiFaq],
    admin_pose_form: [...adminPoseFaq, ...adminFormFaq],
    admin_pose_jadwal: [...adminPoseFaq, ...adminJadwalFaq],
    admin_pose_keuangan: [...adminKeuanganFaq],
    admin_pkkmb_keuangan: [...adminKeuanganFaq],
    admin_pose_keuangan_lomba_ML: [...adminKeuanganFaq, ...getPjLombaFaq('Mobile Legend')],
    admin_pkkmb_belumdiatur: [
        { question: 'Bagaimana saya mulai mengelola PKKMB?', answer: 'Mulai dari menu berita PKKMB lalu tambah pengumuman, dan koordinasikan jadwal acara jika diperlukan.' }
    ],
    admin_pose_belumdiatur: [
        { question: 'Bagaimana saya mulai mengelola POSE?', answer: 'Mulai dari menu berita POSE dan cek jadwal acara untuk melihat informasi event utama.' }
    ],
};

export const getFaqByRole = (role) => {
    const adminContext = getRoleHelpContext(role);
    const roleFaq = roleSpecificFaq[role] || adminGeneralFaq;
    return [
        ...commonFaq,
        { question: 'Apa yang bisa saya lakukan dengan peran saya?', answer: adminContext.description },
        ...roleFaq,
    ];
};

export const getRandomQuestions = (role, count = 3) => {
    const faqSource = getFaqByRole(role);
    const shuffled = [...faqSource].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};
