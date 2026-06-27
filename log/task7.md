# promt ;
baca dan kerjakanlah pada file task7.md

# jawaban ai
Saya telah menyelesaikan tugas sesuai instruksi pada file task7.md:

Memperbarui ContactForm.js:

Saya telah menambahkan tombol switch (Email / WhatsApp) di atas input agar pengguna dapat memilih satu metode kontak saja secara bergiliran.
Kolom input hanya akan memunculkan satu berdasarkan metode yang dipilih dan memvalidasinya secara eksklusif (tidak memunculkan keduanya dengan menonaktifkan yang lain).
Validasi saat pengiriman formulir juga telah disesuaikan agar berjalan sesuai metode yang sedang aktif.
Membuat Halaman Admin Kontak (src/app/panitia/dashboard/kontak/page.js):

Saya telah membangun halaman antarmuka yang modern, elegan, dan dilengkapi dengan animasi memudar (fade-in).
Tersedia dua kartu statistik elegan di bagian atas tabel untuk menampilkan jumlah pesan masuk pada PKKMB maupun POSE.
Terdapat tombol tab (switch) untuk menyortir data masuk dari situs PKKMB atau POSE secara instan.
Tersedia kolom pencarian di sebelah kanan untuk memudahkan mencari data berdasarkan nama, email/WA, dan isi pesan.
Caching menggunakan localStorage telah diterapkan, sehingga halaman dapat dimuat instan jika datanya sudah tersedia. Saya juga menambahkan tombol Refresh untuk menyinkronkan ulang data dan memperbarui cache tersebut.
Tabel menampilkan kolom: No, Nama Lengkap, Kontak (Email / WhatsApp), Pesan, Tanggal Masuk, dan Status Web. Desain tabel dibuat seragam dengan komponen dashboard yang sudah ada.
Silakan meninjau langsung hasilnya di antarmuka Contact Form untuk pengguna dan halaman localhost:3000/panitia/dashboard/kontak untuk panel panitia. Hubungi saya kembali apabila Anda memerlukan perbaikan lebih lanjut!

7:56 PM, 6/25/2026

# keterangan ;

lihatlah pada file ContactForm.js, nah saya ingin untuk inputan email dan whatsapp itu diberi tombol swich, jadi inputan itu akan tampil ketika user menekan tombol swich email atau whatsapp, jadi inputannya tidak muncul keduanya cuman satu yang dipilih saja, dan validasinya juga bergiliran sesuai inputan yang dipakai. terus buatkan juga halaman untuk contact dipanitia/admin yang sudah aku siapkan pada folder dashboard-kontak. untuk tampilannya saya ingin modern dan elegant. dan juga disini pakai caching seperti pada dashbpard lainnya dan caching itu bisa diperbarui dengan menekan tombol refresh. yang urutan tabelnya terdiri dari no, nama, email/whatsapp, pesan, tanggal, dan status web. dan juga diatas tabel ada div atau elemen untuk switch antara pkkmb dan pose dan juga ada berapa jumlah data yang masuk untuk pkkmb dan berapa jumlah data untuk pose. terus ada kolom pencarian juga, dan semua ini diolah dari database localstrage yang sudah disimpan dari supabase seperti tabel pada dashboard lainnya. perbaiki juga tampilan dashboard pada kontak, agar lebih modern dan elegant. 
