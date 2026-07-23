fokus ke halaman manajemen register tepatnya difolder src/app/panitia/pj_lomba/form_register atau yang ada di file AdminPesertaRegister.js.
saya ingin ketika meneken tombol lihat saya ingin data yang diambil dari tabel peserta itu mencocokan dengan kolom kode ditabel team_members dengan kolom nim ditabel peserta, jadi pencocokkanya bukan dari nama. terus yang diambil dari tabel peserta itu cukup 1 row yang sama, jika yang samanya lebih dari 1 maka jangan diambil lagi. terus ambil juga kolom semester yang ada ditabel peserta, terus perbaiki div saat pengambilan data pesertanya agar menyusun ke bawah bukan seperti ini ;
sam (Siswa)
NIM: Siswa01sam081 • Prodi: ipa • Angkatan: 2025
Kampus: sma • Kontak: 081
Metode Bayar: Kas • Status: Pending
tapi seperti ini ;
Nama             : sam
Kategori         : Siswa
NIM              : Siswa01sam081
Prodi            : ipa 
Angkatan         : 2025
Semester         : 1
Kampus           : sma 
Kontak           : 081
Metode Bayar     : Kas
Status Pembayaran: Pending
terus saya ingin tombol verifikasinya tepatnya pada tombol setuju itu tidak bisa diklik jika semua peserta yang ada diteamnya yang diambil dari tabel peserta itu statusnya masih pending, tapi jika sudah ada yang ditolak
pembayaran maka tombol setuju dan tolak tidak bisa diklik
terus kalau semua sudah diverifikasi maka bisa diklik tombol setuju dan tolaknya, dan ada notifikasi juga.