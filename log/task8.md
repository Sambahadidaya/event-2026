# promt ;
baca dan kerjakanlah pada file task8.md

# jawaban ai ;
Tugas yang ada di file task8.md sudah saya selesaikan. Berikut ini adalah perubahan yang telah saya lakukan pada file 

ContactForm.js
:

Validasi Input Pesan: Saya telah menambahkan fungsi validasi pada inputan teks pesan (textarea). Sekarang, inputan pesan hanya dapat menerima huruf abjad dan spasi, serupa dengan yang diterapkan pada inputan nama.
Pembaruan Judul Form: Teks "Tinggalkan Pesan" (h3) telah diganti dengan kalimat yang Anda minta. Sekarang menampilkan teks: "Barang kali ada yang mau ditanyakan bisa isi form dibawah ini atau dengan berkunjung di sosial media."
Ikon dan Animasi Sosial Media:
Ikon telepon sebelumnya telah diganti dengan ikon SVG WhatsApp.
Pembungkus (div/a) dari setiap ikon media sosial telah diperbarui gayanya agar terlihat lebih modern dan elegan, serta mendukung tampilan dengan baik di light mode maupun dark mode.
Saat di-hover, ikon media sosial (Email, WhatsApp, dan Instagram) sekarang memiliki animasi fill (mengisi warna dari bawah ke atas) persis seperti referensi kode yang Anda berikan.
Silakan periksa dan beri tahu saya jika ada penyesuaian tambahan yang Anda perlukan!

# keterangan task8.md ;

fokus ke tugas berikut ;
difile ContactForm.js tepatnya pada inputan isi pesan saya ingin menambah validasi seperti pada inputan nama yaitu cuman huruf abjad saja yang bisa, terus untuk teks jangan h3 "Tinggalkan Pesan" tapi saya ingin berupa kalimat bahwa barang kali ada yang mau ditanyakan bisa isi form dibawah ini atau dengan berkunjung di sosial media. terus untuk sosial media icon telepon saya ingin diganti menjadi icon svg whatsapp seperti pada instagram, terus div atau bungkusan sosial media itu stylenya diubah juga agar lebih modern dan elegant mau dari darkmode atau lighmode, terus div icon itu ketika dihover saya ingin ada animasi menutup dari bawah div ke atas div sampai menutup berlaku di darkmode dan lighmode, refernsi codingannya berikut ;
```html
<a href="#"
    class="group relative w-12 h-12 flex items-center justify-center border border-gray-700 rounded-full text-white overflow-hidden transition-all duration-300">
    <span
        class="absolute bottom-0 left-0 w-full h-0 bg-gray-700 transition-all duration-300 ease-out group-hover:h-full"></span>
    <i
        class="fab fa-whatsapp text-xl relative z-10 transition-colors duration-300 group-hover:text-white"></i>
</a>
```

# promt ;
fokus ke tugas berikut;
begitu juga pada inputan email dan wa berikan validasi, jika wa maka khusus number,+ saja. kalau email bebas tapi tidak bisa menyisipkan script seperti <>/;:dll

# jawaban ai ;

Pembaruan sudah saya tambahkan! Saya telah mengimplementasikan validasi untuk field input email dan whatsapp pada file 

ContactForm.js
:

Validasi WhatsApp: Inputan WhatsApp sekarang dibatasi hanya dapat menerima angka (0-9) dan tanda plus (+).
Validasi Email: Inputan email juga sudah saya filter sehingga pengguna tidak bisa mengetikkan karakter-karakter yang berpotensi menjadi script berbahaya, yaitu: <, >, /, ;, dan :. Karakter selebihnya untuk email masih diizinkan.
Silakan dites, dan beri tahu saya jika ada hal lain yang perlu ditambahkan!

4:57 AM 26/06/2026