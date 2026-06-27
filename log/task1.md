# promt :
lihat dan pahamilah file AGENTS.md, revisilah codingan yang ada didalam folder pkkmb-kelompok dan pose-team, nah saya ingin datanya itu berdasarkan database yaang ada disupabase tepatnya pada tabel Team yang jika pkkmb maka data yang diambilnya dengan type pkkmb dan jika pose maka data yang diambilnya bertype pose, dan jika datanya belum ada maka berisi pemberitahuan bahwa sedang dalam penyusaian (sama seperti awal), terus buatkan juga halaman baru untuk folder panitia tepatnya pada pkkmb dan pose yaitu untuk manajemen Team, yang ada form seperti pada berita, terus untuk navigasi/navnya menjadi dashboard yang terdiri 2 folder yaitu kalau pkkmb foldernya menjadi berita dan team (aku sudah membuat folder dan filenya, tinggal kodenya disesuaikan)

# keterangan AGENTS.md sebelum direvisi ;
## INSTRUKSI UTAMA UNTUK AI AGENT (CODING ASSISTANT)

Kamu adalah AI Web Developer Expert yang bertugas memprogram proyek "Portal Kampus 2026 (PKKMB & PORAK)".

---

## 1. KONDISI PROJECT SAAT INI (CONTEXT)

### A. Environment & Library Terinstal

Proyek ini menggunakan Next.js (App Router) berbasis JavaScript murni (bukan TypeScript). Dependencies berikut sudah diinstal sempurna:

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.x.x",
    "fuse.js": "^7.x.x",
    "lucide-react": "^0.x.x",
    "next-themes": "^0.x.x",
    "chart.js": "^4.x.x",
    "react-chartjs-2": "^5.x.x"
  }
}
```

---

### B. Konfigurasi Database Supabase yang Sudah Aktif

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE site_type AS ENUM ('pkkmb', 'pose');

-- Tabel Berita / Pemberitahuan
CREATE TABLE berita (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type site_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

### C. Struktur Folder Project Eksisting
```C:\Users\samba\OneDrive\Documents\PKKMB-POSE\portal-kampus-2026
├── .env.local
├── src/
│   ├── proxy.js
│   ├── app/
│   │   ├── (portal)/
│   │   │   ├── layout.js
│   │   │   └── page.js
│   │   ├── panitia/
│   │   │   ├── layout.js
│   │   │   ├── page.js
│   │   │   ├── dashboard/
│   │   │   │   ├── faq/
│   │   │   │   │   └── page.js
│   │   │   │   └── trafik/
│   │   │   │       └── page.js
│   │   │   ├── login/
│   │   │   │   └── page.js
│   │   │   ├── pkkmb/
│   │   │   │   └── page.js
│   │   │   └── pose/
│   │   │       └── page.js
│   │   ├── pkkmb/
│   │   │   ├── layout.js
│   │   │   ├── page.js
│   │   │   ├── contact/
│   │   │   │   └── page.js
│   │   │   ├── kelompok/
│   │   │   │   └── page.js
│   │   │   └── pemberitahuan/
│   │   │       └── page.js
│   │   └── pose/
│   │       ├── layout.js
│   │       ├── page.js
│   │       ├── contact/
│   │       │   └── page.js
│   │       ├── pemberitahuan/
│   │       │   └── page.js
│   │       └── team/
│   │           └── page.js
│   ├── components/
│   │   ├── SamsChatbot.js
│   │   └── ThemeToggle.js
│   └── lib/
│       └── supabase.js
```

## 2. ATURAN GAYA KODE & SPESIFIKASI FITUR

### 1. No TypeScript: Gunakan ES6 JavaScript murni (.js).

### 2. Responsive Core: - Sisi Publik (/(portal), /pkkmb, /pose): 
Wajib Mobile-First menggunakan Tailwind CSS breakpoint (md:, lg:).

  Sisi Admin (/panitia): Wajib Desktop-Only (Jika layar < 1024px, sembunyikan layout admin utama dan tampilkan layar penuh bertuliskan: "Halaman Admin Hanya Dapat Diakses Melalui Perangkat Desktop").

### 3. Theming (Dark/Light): Kelola menggunakan next-themes (Default:
 Light Mode). Pasang komponen <ThemeToggle /> yang berisi ikon matahari/bulan sabit (lucide-react) di header sisi kanan semua halaman publik maupun admin.

### 4. Strategi Caching LocalStorage:
Sisi Publik mengambil data berita/pemberitahuan dan data FAQ untuk chatbot murni satu kali saat pertama dibuka, lalu disimpan ke localStorage. Akses berikutnya membaca dari localStorage untuk menghemat query kuota Supabase.

Halaman Panitia/Admin memiliki tombol "Refresh Data" untuk memaksa penghapusan cache localStorage dan menarik data terbaru langsung dari Cloud Supabase.

### 5. Logika Otomatis Kolom type Berita:

Form CRUD berita di halaman /panitia/pkkmb dan /panitia/pose memiliki inputan form yang sama persis (Tanpa input manual untuk type).

Namun secara logika dibalik layar, penambahan berita di rute /panitia/pkkmb otomatis menyisipkan string 'pkkmb' pada kolom type di database, begitupun untuk rute /panitia/pose otomatis menyisipkan string 'pose'.

## 3. PANDUAN TAHAPAN IMPLEMENTASI (URUTAN KERJA)

### Fase 1: Utilitas Dasar & Tema Global
src/lib/supabase.js: Inisialisasi client menggunakan process.env.NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY.

src/app/layout.js: Bungkus aplikasi dengan ThemeProvider dari next-themes (default light).

### Fase 2: Komponen Interaktif Global
`src/components/ThemeToggle.js:` Komponen switch mode dengan ikon Matahari dan Bulan Sabit.

src/components/SamsChatbot.js: Widget chatbot di kanan bawah (fixed z-50). Menggunakan fuse.js untuk rule-based fuzzy matching berbasis data FAQ di localStorage.

### Fase 3: Portal & Sisi Publik
src/app/(portal)/page.js: Landing page utama pemisah link dengan 2 tombol besar menuju /pkkmb dan /pose.

Bangun layout dan halaman untuk /pkkmb/* dan /pose/* sesuai rute di atas dengan arsitektur Mobile-First.

### Fase 4: Proteksi Keamanan & Autentikasi Admin
src/middleware.js: Menjaga seluruh rute /panitia/* (kecuali /panitia/login) agar me-redirect user anonim ke form login menggunakan session check Supabase Auth.

src/app/panitia/login/page.js: Form login admin.

### Fase 5: Layout Admin & Navigasi Kiri (Desktop Only)
src/app/panitia/layout.js: Struktur Grid/Flex.

Kiri (Sidebar Fixed): Header Profil (Nama & Ikon Admin saja tanpa link) + 3 Menu Utama Collapsible (ul li dropdown): Dashboard (Trafik, FAQ), PKKMB (Manajemen Berita), Pose (Manajemen Berita).

Kanan (Konten): Header atas berisi judul halaman aktif + Tombol <ThemeToggle />.

### Fase 6: Halaman Dashboard Admin
/panitia/dashboard/trafik/page.js: Menampilkan 3 Donut Chart (Total, PKKMB, Pose) + 1 Line Chart (Kunjungan per Jam WIB).

/panitia/dashboard/faq/page.js: Menampilkan 3 Donut Chart penggunaan chatbot + Tabel riwayat pertanyaan (3 kolom: No/ID, Jam WIB, Pertanyaan).

### Fase 7: CRUD Berita Admin
/panitia/pkkmb/page.js & /panitia/pose/page.js: Form CRUD berita, input filter di atas tabel, tabel data, dan Tombol Refresh Cache.

Pesan untuk AI Agent: Jika user memberikan perintah untuk mulai bekerja, bacalah file ini, pahami fasenya, jalankan instruksi secara bertahap, dan langsung berikan kode siap pakai yang bersih dan lengkap sesuai aturan di atas tanpa banyak penjelasan teori.

***

# Jawaban ai :

Saya telah menyesuaikan semua file yang Anda minta sesuai dengan aturan database dan desain yang ada. Berikut adalah rincian perubahannya:

Memperbarui Navigasi Layout Admin: File src/app/panitia/layout.js telah diperbarui sehingga menu PKKMB dan POSE masing-masing memiliki submenu "Manajemen Berita" dan "Manajemen Team".
Membuat Halaman Manajemen Team Panitia:


src/app/panitia/pkkmb/team/page.js
: Halaman CRUD untuk data kelompok PKKMB.


src/app/panitia/pose/team/page.js
: Halaman CRUD untuk data tim POSE.
Keduanya menggunakan kolom title (untuk nama tim/kelompok) dan content (untuk anggota/deskripsi) pada tabel team (sesuai struktur tabel berita sebelumnya).
Mengubah Halaman Publik Menjadi Dinamis & Menyimpan ke Cache:


src/app/pkkmb/kelompok/page.js
: Telah diubah menjadi client component yang menarik data tipe pkkmb dari tabel team. Jika datanya kosong, ia menampilkan pesan pemberitahuan "sedang dalam penyusunan" (persis seperti awal). Jika ada datanya, halaman akan me-render daftar kelompoknya dengan rapi.


src/app/pose/team/page.js
: Telah diubah agar menarik data tipe pose dari tabel team dan bereaksi sama seperti kelompok PKKMB (menampilkan layout awal jika kosong dan menampilkan list data jika terisi).
Catatan: Pastikan Anda sudah membuat tabel team di Supabase Anda dengan struktur kolom yang mirip seperti tabel berita (mencakup kolom title, content, dan type dengan enum site_type). Jika strukturnya berbeda, tolong beritahu saya agar bisa disesuaikan ya!

23/06/2026 4:57 PM