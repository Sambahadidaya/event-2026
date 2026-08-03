fokus ke halaman form dipublic tepatnya difile /components/public/FormRegister.js.
saya ingin jika untuk form register tepatnya pada saat kategori mahasiswa lp3i dengan kolom butuh_bukti ditabel form_registernya false maka saat mengirim datanya itukan diambil dari form_wajib kolom status_pembayarannya juga saya ingin diambil dari data form_wajib. jadi tidak perlu verifikasi lagi karna sudah diverifikasi diform wajib karna metode pembayaran dan bukti bayarnya kan sudah ada.
terus jika untuk form wajib tepatnya pada kategori mahasiswa lp3i yang kampusnya selain dari kampus bandung (yang datanya dikelola di  lombaData.js) saya tidak ingin pakai parseNIM dan sebagai gantinya harus memasukan prodi secara manual tapi tetap berupa dropdown, dan prodi ini saya juga ingin dipecah lagi seperti ini
```js
export const PRODI_DATA = {
    'Kampus Tasikmalaya' : [
        'Akuntansi',
        'Administrasi Bisnis',
        'Bisnis Digital',
        'Hubungan Masyarakat',
        'Komputerisasi Akuntansi',
        'Manajemen Informatika',
        'Manajemen Keuangan Perbankan',
        'Manajemen Keuangan',
        'Manajemen Pemasaran',
        'Manajemen Perusahaan',
        'Teknik Komputer'
    ],
    'Kampus Cirebon' : [
        'Akuntansi',
        'Administrasi Bisnis',
        'Bisnis Digital',
        'Hubungan Masyarakat',
        'Komputerisasi Akuntansi',
        'Manajemen Informatika',
        'Manajemen Keuangan Perbankan',
        'Manajemen Keuangan',
        'Manajemen Pemasaran',
        'Manajemen Perusahaan',
        'Teknik Komputer'
    ],
    'Kampus Pekanbaru' : [
        'Akuntansi',
        'Administrasi Bisnis',
        'Bisnis Digital',
        'Hubungan Masyarakat',
        'Komputerisasi Akuntansi',
        'Manajemen Informatika',
        'Manajemen Keuangan Perbankan',
        'Manajemen Keuangan',
        'Manajemen Pemasaran',
        'Manajemen Perusahaan',
        'Teknik Komputer'
    ],
    'Kampus Padang' : [
        'Akuntansi',
        'Administrasi Bisnis',
        'Bisnis Digital',
        'Hubungan Masyarakat',
        'Komputerisasi Akuntansi',
        'Manajemen Informatika',
        'Manajemen Keuangan Perbankan',
        'Manajemen Keuangan',
        'Manajemen Pemasaran',
        'Manajemen Perusahaan',
        'Teknik Komputer'
    ],
    'Kampus Langsa' : [
        'Akuntansi',
        'Administrasi Bisnis',
        'Bisnis Digital',
        'Hubungan Masyarakat',
        'Komputerisasi Akuntansi',
        'Manajemen Informatika',
        'Manajemen Keuangan Perbankan',
        'Manajemen Keuangan',
        'Manajemen Pemasaran',
        'Manajemen Perusahaan',
        'Teknik Komputer'
    ]
};
```
yang otomatis PRODI_DATA itu editlah dan yang secara tidak langsung KAMPUS_PRODI_CODES bagian selain kampus bandung berarti dihapus saja.
untuk angkatannya pakai semesterToAngkatan (yang difilter atau diparsing dari semester) dan oh iya saya ingin semester ini maksimal semester 4, kalau lebih dari 4 maka akan ditolak (ketika mencoba mengirim maka datanya tidak akan terkirim dan muncul peringatan tidak diizinkan mengikuti kegiatan) dan begitu juga untuk nim jika awalannya 2024 kebawah (angkatan 2024 kebawah juga tidak boleh mengikuti kegiatan) jadi cuman untuk angkatan 2025/2026 dan semester 1-4 yang diizinkan. tapi khusus untuk kategori siswa maksimalnya sampai semester 6 (diperbolehkan untuk angkatan 2024 atau semester 1-6).
terus untuk saat memasukan nomber whasapp itu saya ingin inputannya dibatas sampai 13digit saja, kalau yang aktifnya email maka batasnya sampai 30 digit.
terus untuk index anggotanya jangan Data Anggota Utama Data Anggota 1 tapi langsung saja berurutan Data Anggota 1, Data Anggota 2, Data Anggota 3 dan seterusnya.
terus disamping 2(jumlah yg ada) Anggota saya ingin ada tombol untuk reset anggota yaitu untuk langsung menghapus seluruh anggota yang sudah ditambahkan jadi gak perlu satu satu dihapus tapi tombol satu satu itu tetap adakan saja.
terus untuk title atau judul Jabatan itu saya ingin diganti menjadi Jabatan di team yang contohnya seperti Kapten, Striker, EXP Lane, ,Anggota, Lainnya.
