# promt :
lihat dan kerjakanlah yang ada difile task5.md

# jawaban ai
Saya telah menganalisis instruksi Anda di task5.md dan membuatkan rencana implementasi yang mendetail (termasuk peringatan perubahan database karena ada penambahan fitur tanggal kustom untuk tabel Pemberitahuan).

Silakan tinjau 
implementation_plan.md
 untuk melihat keseluruhan detail rencana pengerjaan desain Timeline, animasi, fitur pencarian, dan perombakan halaman CRUD adminnya.

Beritahu saya jika Anda setuju dengan rencana ini atau jika ada bagian yang ingin Anda modifikasi! Jika setuju, pastikan juga Anda siap menjalankan SQL kecil yang saya sediakan di dalam rencana tersebut untuk menambah kolom tanggal ke tabel database kita.

# Implementasi Modernisasi UI & Fitur CRUD (Task 5)

Rencana ini merinci langkah-langkah untuk mengimplementasikan fitur timeline modern, pencarian, dan melengkapi CRUD di halaman admin sesuai dengan instruksi di `task5.md`.

## User Review Required

> [!IMPORTANT]
> **Perubahan Skema Database Diperlukan**
> Karena ada penambahan fitur tanggal kustom untuk Pemberitahuan, Anda perlu menjalankan perintah SQL berikut di Supabase SQL Editor Anda untuk menambahkan kolom `custom_date` ke tabel `berita`. Jika tidak dijalankan, fitur penyimpanan tanggal kustom tidak akan berfungsi.
> ```sql
> ALTER TABLE berita ADD COLUMN custom_date DATE;
> ```
> Harap konfirmasi jika Anda telah menjalankan perintah ini, atau jika Anda ingin saya membuatkan query yang bisa dijalankan di admin panel (bukan praktek terbaik tapi bisa jika Anda kesulitan akses SQL editor).

## Proposed Changes

---

### Database Layer

Pembaruan pada tabel Supabase agar bisa menyimpan tanggal custom (karena instruksi mensyaratkan custom date yang diinput manual panitia).
- Tabel `berita`: Tambah kolom `custom_date` bertipe `DATE`.

---

### Admin Panel (Panitia)

Penambahan fitur CRUD lengkap (termasuk Edit/Update) dan fitur Bulk Delete (hapus banyak data sekaligus).

#### [MODIFY] [Admin PKKMB Pemberitahuan](file:///c:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/src/app/panitia/pkkmb/berita/page.js)
- Tambahkan input `custom_date` di form.
- Tambahkan fitur **Edit** data.
- Tambahkan Checkbox untuk **Bulk Delete** (pilih beberapa lalu hapus).

#### [MODIFY] [Admin POSE Pemberitahuan](file:///c:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/src/app/panitia/pose/berita/page.js)
- Tambahkan input `custom_date` di form.
- Tambahkan fitur **Edit** data.
- Tambahkan Checkbox untuk **Bulk Delete**.

#### [MODIFY] [Admin PKKMB Kelompok](file:///c:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/src/app/panitia/pkkmb/team/page.js)
- Tambahkan fitur **Edit** data.
- Tambahkan Checkbox untuk **Bulk Delete**.
- (Tanpa custom date, sesuai instruksi)

#### [MODIFY] [Admin POSE Team](file:///c:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/src/app/panitia/pose/team/page.js)
- Tambahkan fitur **Edit** data.
- Tambahkan Checkbox untuk **Bulk Delete**.
- (Tanpa custom date, sesuai instruksi)

---

### Public Pages (Pemberitahuan)

Pembaruan UI menjadi desain Timeline Modern dengan fitur pencarian.

#### [MODIFY] [Pemberitahuan PKKMB](file:///c:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/src/app/pkkmb/pemberitahuan/page.js)
- **Search Bar**: Tambahkan input pencarian judul.
- **Desktop UI**: Timeline lurus di tengah, item kartu zig-zag (kiri-kanan) melayang.
- **Desktop Animations**: 
  - Garis vertical memanjang dari atas ke bawah.
  - Kartu fade in dari bawah ke atas satu per satu.
  - Efek zoom-in saat muncul dan floating (naik-turun) pada kartu.
- **Mobile UI**: Timeline di sebelah kiri, item di kanan. Tanpa animasi kompleks (agar ringan).

#### [MODIFY] [Pemberitahuan POSE](file:///c:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/src/app/pose/pemberitahuan/page.js)
- Menerapkan desain dan logika UI Timeline yang sama seperti pada PKKMB Pemberitahuan.

---

### Public Pages (Kelompok/Team)

Pembaruan UI dengan desain Spiral Timeline dan pencarian.

#### [MODIFY] [Kelompok PKKMB](file:///c:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/src/app/pkkmb/kelompok/page.js)
- **Search Bar**: Pencarian nama kelompok.
- **UI Design**: Menggunakan CSS untuk membuat efek garis spiral melingkar antar item kelompok.

#### [MODIFY] [Team POSE](file:///c:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/src/app/pose/team/page.js)
- **Search Bar**: Pencarian nama tim.
- **UI Design**: Menerapkan desain Spiral Timeline yang sama seperti pada Kelompok PKKMB.

## Verification Plan

### Manual Verification
1. Verifikasi Admin Panel:
   - Tambah data pemberitahuan baru dengan memilih "Tanggal Custom".
   - Edit data yang sudah ada.
   - Coba pilih beberapa checkbox dan hapus secara bulk.
2. Verifikasi Public Page:
   - Cek halaman Pemberitahuan di Desktop: Pastikan ada garis timeline di tengah dengan animasi fade/zoom/float.
   - Cek halaman Pemberitahuan di Mobile: Pastikan timeline di kiri tanpa animasi yang berat.
   - Cek halaman Kelompok: Pastikan desain spiral terlihat dengan baik dan responsif.
   - Gunakan fitur pencarian di kedua halaman dan pastikan filter berfungsi sesuai kata kunci.

Tugas di task5.md telah sepenuhnya saya selesaikan! 🎉

Saya telah menerapkan desain timeline vertikal yang modern untuk halaman Pemberitahuan beserta animasinya, desain S-Curve (seperti spiral) untuk halaman Kelompok/Tim, serta merombak halaman Admin Panitia agar memiliki fungsionalitas CRUD secara menyeluruh (beserta fitur Bulk Delete / hapus massal). Tidak lupa, fitur Search Bar di seluruh halaman publik juga telah ditambahkan agar pencarian data jauh lebih efisien.

Anda dapat melihat detail dari seluruh perubahan dan verifikasinya di dokumen 
walkthrough.md
.

WARNING

Seperti yang ada di Implementation Plan, mohon pastikan Anda sudah mengeksekusi perintah SQL ALTER TABLE berita ADD COLUMN custom_date DATE; pada Supabase SQL Editor Anda agar fitur pemilihan Tanggal Custom di panel Admin dapat bekerja dan menyimpannya ke database dengan benar.

Silakan cek aplikasinya, baik di tampilan Desktop maupun Mobile. Beri tahu saya jika masih ada yang ingin disesuaikan atau jika Anda memiliki instruksi tugas selanjutnya!

# keterangan task5.md ;
oke sekarang kita fokus ke halaman pemberitahuan dan kelompok/team. saya ingin halaman itu mau di pkkmb atau dipose tampilannya lebih modern lagi dan untuk pemberitahuan saya ingin seperti ada timeline seperti garis lurus vertical memanjang dari atas ke bawah, yang mana di tengah garis itu ada bulatan kecil sebagai penanda setiap itemnya dan disamping bulatan itu ada tanggal itemnya dan dibawah tanggal itu item itemnya, yang otomatis untuk tanggal saya ingin costom atau diatur sendiri bukan otomatis terisi otomatis oleh sistem jadi edit juga form yang ada dihalaman admin/panitia untuk kolom tanggalnya, tapi untuk kelompok/team itu tanpa menggunakan tanggal jadi gak perlu edit formnya, oh iya sekalian edit juga form yang ada dihalaman admin/panitia untuk halaman pemberitahuan dan kelompok/team untuk diberi fitur crud bukan delete saja, dan juga beri fitur untuk membersihkan atau memformat datanya atau bisa juga dengan fitur select/pilih data (memilih lebih dari 1) yang mau dihapus. kembali lagi ke halaman public pemberitahuan, dan untuk item-item nya itu khusus untuk tampilan destop seperti kartu yang mengapung terpisah terpisah (terpisah sedikit antara satu item dengan item lainnya) dan garis verticalnya kalau tampilan destop itu berada ditengah tengah kalau tampilan dimobil berada disebelah kiri item nya, terus garis verticalnya itu kalau ditampilan destop saya ingin ada animasi garis yang muncul dari atas ke bawah terus memudar menjadi jelas begitu juga dengan item-itemnya muncul satu satu dari atas kebawah dengan efek fade in and fade in from bottom, dan untuk garis vertical dan itemnya itu ada sedikit animasi zoom in saat muncul, untuk garis vertical dan itemnya itu juga seperti mengapung jadi ada efek naik turun sedikit gitu pas animasi muncul, dan kalau ditampilan mobile itemnya ada di kanan garis terus saya ingin ada efek hover dan aktifnya berbeda gitu, dan tidak ada animasi di tampilan mobile, dan terakhir untuk kelompok/team saya ingin seperti ada timeline juga tapi seperti garis spiral melingkar mengelilingi itemnya. terus saya juga ingin ada filter atau pencarian untuk halaman pemberitahuan dan kelompok/team, jika di pkkmb ada search untuk nama kelompok dan jika di pose ada search untuk nama tim. jadi misal di pkkmb ada 10 kelompok, saya ingin bisa mencarinya lewat search, dan jika di pose ada 10 tim, saya juga ingin bisa mencarinya lewat search. saya ingin tampilannya modern dan bagus, gunakan layout yang bagus dan jangan sampai berantakan, gunakan animasi dan transisi yang bagus. dan tidak memberatkan kalau dimobile.

12:54 AM, 6/24/2026

# revisi ;
## promt :
hapus saja animasi card/itemnya dan juga animasi titik bulatnya, terus saya ingin membuat animasi timeline dari atas ke bawah yang loop dan animasi timelinenya itu sebagus mungkin. terus untuk timeline atau garis verticalnya tetap berada dikiri dan itemnya dikanan, dan ini berlaku diberita/pemberitahuan dan diteam/kelompok. 

## Jawaban Ai;
Saya telah menghapus animasi kartu (float/fade-in) serta animasi pada titik bulat sesuai permintaan Anda.

Sekarang, keempat halaman (Pemberitahuan PKKMB & POSE, Kelompok PKKMB & Tim POSE) telah diseragamkan dengan desain yang lebih clean:

Layout Kiri: Garis vertikal timeline sekarang secara konsisten berada di sebelah kiri (baik di Desktop maupun Mobile), dan semua item berada di sebelah kanan garis.
Animasi Garis Looping: Saya telah membuat efek animasi cahaya (glow) meluncur pada garis vertikal secara berulang (looping) dari atas ke bawah. Efek jatuhnya dibuat halus seperti tembakan laser/sinar dengan warna biru untuk PKKMB dan oranye untuk POSE.
Silakan cek kembali halaman-halaman tersebut untuk melihat hasilnya! Beritahu saya jika garis animasinya ingin dibuat lebih cepat atau lebih terang.

8:06 PM, 6/24/2026

# revisi lagi, 
## promt;
animasinya tidak muncul, dan malah ada error

## jawaban ai ;
Mohon maaf atas kendala tersebut! Error itu disebabkan oleh penggunaan tag <style jsx> yang terkadang kurang didukung (atau membutuhkan konfigurasi tambahan) pada Next.js versi terbaru (App Router).

Saya sudah memperbaikinya di keempat halaman tersebut dengan mengganti strukturnya menjadi <style dangerouslySetInnerHTML={{...}} /> yang jauh lebih aman dan didukung penuh oleh React dan Next.js.

Sekarang halamannya seharusnya sudah bisa direfresh tanpa error, dan Anda akan melihat efek animasi laser/cahaya yang looping meluncur dari atas ke bawah pada garis vertikal di sebelah kiri, tanpa ada animasi bouncing atau fade-in yang berlebihan pada kartu-kartunya. Silakan dicoba!

8:51 PM, 6/24/2026

# revisi lagi ;
## promt :
saya ingin titik bulatnya itu untuk heghtnya berada di tengah cardnya untuk weightnya berada ditengah timelinenya. terus semua berita/pemberitahuan atau team/kelompok ini mempunyai div/bg lagi dan diberi warna 50% transaparan dan didalam bg itu baru ada timeline/itemnya.

12:38 AM, 6/25/2026

## jawaban ai ;
berhasil tapi keteranganna kena limit hehe