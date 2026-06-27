# pakai ai agent di cursor
# promt ;
baca dan kerjakanlah pada file @log/task9.md 

# jawaban ai ;
Saya akan baca struktur halaman public PKKMB/POSE dan komponen UI yang ada, lalu perbaiki desainnya sesuai task9.

Saya mulai membangun komponen UI bersama (background, wave divider, tema) dan memperbarui halaman public PKKMB/POSE.

Task 9 selesai dikerjakan. Ringkasan perubahan UI/UX pada halaman public PKKMB & POSE:

Yang diperbarui
Beranda (Home)
Desain multi-section dengan hero full viewport, statistik dummy, kartu navigasi, dan timeline kegiatan
Wave divider bergelombang antar section agar transisi scroll terasa menyambung, tidak terpotong
Logo resmi: logopkkmb.png & logopose.jpg
Warna mengikuti palet logo (PKKMB: biru #0068BB + emas #FFC872; POSE: ungu/oranye/hijau dari logo api)
Background & layout
SiteBackground — orbs animasi, dot grid, ring dekoratif di semua halaman public
PublicFooter — footer konsisten per site
Layout full-width untuk beranda; halaman lain tetap max-w-6xl
Header
Logo asli menggantikan ikon generik
Glassmorphism + indikator halaman aktif
Warna navigasi menyesuaikan tema masing-masing site
Halaman lain (Pemberitahuan, Kelompok/Tim, Kontak)
PageHero — banner glass di atas setiap halaman
Kartu konten & empty state memakai glass
ContactForm — tema dinamis per site (warna tombol, focus ring, dll.)
File baru
File	Fungsi
src/lib/siteThemes.js
Palet warna & token desain
src/components/public/SiteBackground.js
Background dekoratif
src/components/public/WaveDivider.js
Transisi bergelombang
src/components/public/HomeLanding.js
Beranda lengkap
src/components/public/PageHero.js
Hero halaman dalam
src/components/public/PublicFooter.js
Footer
Jalankan npm run dev lalu buka /pkkmb dan /pose untuk melihat hasilnya. Coba juga toggle dark/light mode di header.



# keterangan ;
fokus saja pada ui/uxnya. pada semua halaman public ppkmb dan pose seperti beranda,dll (selain halaman admin/panitia). yaitu saya ingin memperbagus desainnya seperti menambah elemen dibackground untuk memperbagus biar tidak kelihatan flet banget terus sekalian bikin dummy desain pada beranda biar tidak teks "menunggu data...", terus saya ingin halaman beranda itu mempunyai desain bagus seperti ada penyambung antara halaman scroll itu seperti penyambungnya yang elemen bergelumbang atau gimana ke terserah asalnya menyambung antara 100vh itu biar tidak terpotong antara 1 halaman ke halaman berikutnya , saya ingin semua halaman itu mempunyai desain yang bagus dan terlihat elegant dan modern mau itu didarkmode atau lighmode , pokoknya bagus. yang mana logonya pkkmb itu diambil diassets/logopkkmb.png dan pose diambil di assets/logopose.jpg, dan desainnya menyesuaikan dengan logo itu. 

# revisi, promt ;
fokus pada revisi berikut, kerjakanlah codingannya tanpa merunning apapun ;
dihalaman beranda mau itu dipose atau dipkkmb masih berantakan dan belum menyambung backgroundnya, jadi perbaikilah desain berandanya itu, terus untuk footer juga masih kurang enak dilihat.

# jawaban ai ;
Saya akan baca komponen beranda, wave divider, dan footer yang ada, lalu perbaiki penyambungan background dan tampilan footer tanpa menjalankan apa pun.

Masalah utamanya: SiteBackground fixed bentrok dengan background section, dan wave divider belum menyambung warna antar section dengan benar. Saya perbaiki struktur beranda dan desain footer.

Revisi selesai. Berikut perbaikan yang dilakukan:

Beranda — background menyambung
Masalah sebelumnya: SiteBackground fixed bentrok dengan warna section, wave pakai useTheme (hydration mismatch), dan section tidak full-bleed sehingga transisi terlihat putus.

Perbaikan:

Setiap section punya background solid/gradient sendiri (heroGradient, sectionAlt, sectionBase)
Wave divider dipindah jadi elemen penghubung antar section — bagian atas transparan (warna section sebelumnya), bagian bawah diisi warna section berikutnya (via Tailwind fill-*, tanpa JS theme)
SiteBackground disederhanakan jadi orbs dekoratif saja (subtle), tidak lagi menimpa background section
Layout hero dirapikan: grid 2 kolom lebih seimbang, ukuran teks proporsional, logo tidak loncat di mobile
Alur section beranda sekarang:

Hero (gradient) → wave → Stats (alt) → wave → Features (base) → wave → Timeline (alt) → wave → Footer
Footer — desain baru
Gradient gelap sesuai tema (PKKMB biru, POSE ungu)
Logo + tagline di kolom kiri
Navigasi terstruktur di tengah
CTA "Hubungi Panitia" + link kembali ke portal
Bottom bar copyright rapi dengan border halus
Wave terakhir di timeline menyambung langsung ke warna footer
Silakan refresh /pkkmb dan /pose untuk melihat hasilnya. Kalau masih ada bagian yang terasa kurang pas (misalnya tinggi wave atau warna gradient footer), sebutkan saja.