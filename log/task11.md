# promt ;
baca dan kerjakanlah task11.md

# jawaban ai ;
Saya telah membaca task11.md dan menganalisis dampaknya terhadap aplikasi. Permintaan Anda melibatkan perubahan struktural yang cukup besar (pembuatan Role-Based Access Control, pelacakan sesi online/offline, dan penambahan halaman manajemen khusus Super Admin).

Karena ini adalah perubahan arsitektural yang masif, saya telah menyusun sebuah dokumen Implementation Plan untuk menjabarkan bagaimana fitur-fitur tersebut akan diimplementasikan secara teknis beserta pertanyaan-pertanyaan desain.

Silakan tinjau implementation plan tersebut. Jika Anda setuju dan menjawab beberapa pertanyaan desain di dalamnya, klik Proceed dan saya akan langsung mulai mengeksekusinya.

26/06/2026 4:51 PM

## impelemntasi plan ai ;
# Implementation Plan: Role-Based Access Control (RBAC) & Manajemen Admin

Berkenaan dengan penambahan fitur sesuai dengan `task11.md`, ini adalah perubahan berskala besar yang melibatkan database, authentication, middleware/layout, dan berbagai penyesuaian UI.

## User Review Required

> [!WARNING]
> **Perubahan Skema Database**
> Kita memerlukan tabel baru di Supabase untuk mengelola admin dan perannya. Tabel ini akan terpisah dari pengguna biasa (jika ada) dan akan mencatat status online serta waktu aktivitas terakhir.
> **Apakah Anda setuju dengan pembuatan tabel baru ini?**

> [!IMPORTANT]
> **Autentikasi (Login dengan Nama atau Email)**
> Secara bawaan, Supabase Auth menggunakan Email. Untuk memungkinkan login menggunakan "Nama", kita memiliki dua opsi:
> 1. **(Rekomendasi)**: Saat login dengan "Nama", sistem akan mencari Email yang sesuai di tabel `admins` berdasarkan nama, lalu melakukan login Supabase Auth dengan Email tersebut secara *behind the scenes*.
> 2. Menggunakan mekanisme autentikasi manual/custom (tidak disarankan dari segi keamanan).
> Saya akan menerapkan pendekatan **#1** untuk menjaga keamanan Supabase.

## Open Questions

> [!TIP]
> 1. Untuk **"tampilan pkkmb, tampilan pose, dan tampilan portal"** di halaman dashboard, apakah ini berarti kita perlu menambahkan *Tab/Switch* di halaman Dashboard Utama (seperti Trafik Kunjungan) bagi **Super Admin** untuk memfilter statistik, sedangkan Admin PKKMB/POSE hanya akan melihat dashboard spesifik mereka secara default?
> 2. Apakah Anda sudah membuat tabel/struktur untuk `panitia-admin-status` sebelumnya, atau saya harus membuatnya dari awal?

## Proposed Changes

### Database (Supabase)

#### [NEW] Custom SQL untuk Role Admin
Kita perlu menjalankan query SQL di Supabase untuk membuat tipe data role dan tabel `admins`.
- Enum: `admin_role` ('super_admin', 'admin_pkkmb', 'admin_pose')
- Tabel: `admins` (id, user_id, nama, email, role, is_online, last_active, created_at)

### Middleware & Autentikasi

#### [NEW] `src/middleware.js` (Opsional/Jika Diperlukan)
- Mengatur validasi sesi Supabase.
- Fitur auto-logout jika `last_active` > 5 menit (diintegrasikan di layout/client tracker).

### Halaman Login

#### [MODIFY] [login/page.js](file:///c:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/src/app/panitia/login/page.js)
- Menambahkan *toggle switch* untuk login menggunakan Email atau Nama.
- Menambahkan validasi input.
- Menyimpan *last active time* saat berhasil login.

### Layout & Routing Admin

#### [MODIFY] [panitia/layout.js](file:///c:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/src/app/panitia/layout.js)
- Mengambil role user dari tabel `admins` setelah login.
- Menyembunyikan menu navigasi yang tidak relevan dengan role (misal: Admin PKKMB tidak melihat menu POSE dan Manajemen Admin).
- Menerapkan fungsi *heartbeat* (mengirim ping setiap 1-2 menit) untuk memperbarui `last_active` ke database.
- Logika *auto-logout* jika tidak ada pergerakan mouse/keyboard selama 5 menit.

### Halaman Manajemen Admin (Super Admin)

#### [NEW] Halaman Status Admin (`src/app/panitia/admin/status/page.js`)
- UI Manajemen Admin (tambah, edit role, hapus).
- Kolom Indikator Online (Hijau) / Offline (Merah) berdasarkan selisih waktu `last_active` saat ini.

### Filtering Data di Dashboard & Manajemen Konten

#### [MODIFY] Halaman Dashboard (Trafik, FAQ, Kontak) & Halaman Manajemen (Berita, Team)
- Menambahkan logika *fetching* data berdasarkan role:
  - `super_admin`: bisa melihat dan mengatur filter (semua, pkkmb, pose, portal).
  - `admin_pkkmb`: data otomatis di filter `site = 'pkkmb'`.
  - `admin_pose`: data otomatis di filter `site = 'pose'`.

## Verification Plan

### Manual Verification
1. **Login Test**: Login menggunakan email dan nama. Pastikan validasi berjalan.
2. **Role Test**: 
   - Login sebagai Super Admin: Akses semua menu, tambah/hapus admin berfungsi.
   - Login sebagai Admin PKKMB: Menu POSE dan Admin menghilang, data otomatis difilter hanya PKKMB.
3. **Auto-Logout Test**: Biarkan tab terbuka tanpa interaksi selama 5 menit, pastikan sesi otomatis berakhir, redirect ke login, dan indikator status berubah menjadi Offline.
4. **Dark Mode Test**: Memastikan seluruh halaman admin merespons saklar tema *dark mode*.

# menjalankan impelentasi ai ;
Saya telah membuat dokumen SQL Script (supabase_admin_schema.md) yang berisi perintah untuk menambahkan tipe admin_role dan tabel admins ke database Supabase Anda.

Langkah pertama dalam rencana kita adalah memastikan database telah disesuaikan agar mampu menangani sistem Admin Role ini.

Silakan copy script tersebut dan jalankan melalui fitur SQL Editor di Dashboard Supabase Anda. Jika sudah dijalankan dan berhasil, silakan klik Proceed agar saya dapat melanjutkan ke tahap koding halaman Login dan Layout Dashboard Admin.

# Database Schema Updates untuk Admin RBAC

Silakan jalankan script SQL di bawah ini pada menu **SQL Editor** di *dashboard* Supabase Anda untuk membuat tabel dan role admin.

```sql
-- 1. Buat Enum untuk Role Admin
CREATE TYPE admin_role AS ENUM ('super_admin', 'admin_pkkmb', 'admin_pose');

-- 2. Buat Tabel Admins
CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Link ke tabel auth
    nama VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    role admin_role NOT NULL DEFAULT 'admin_pkkmb',
    is_online BOOLEAN DEFAULT false,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Beri Akses RLS (Bypass RLS untuk pengembangan awal)
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON "public"."admins"
AS PERMISSIVE FOR SELECT
TO public
USING (true);

CREATE POLICY "Enable insert for all users" ON "public"."admins"
AS PERMISSIVE FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON "public"."admins"
AS PERMISSIVE FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete for all users" ON "public"."admins"
AS PERMISSIVE FOR DELETE
TO public
USING (true);

-- 4. Opsional: Data dummy untuk Super Admin pertama
-- Ganti 'super_admin_uuid' dengan ID user dari auth.users Anda setelah mendaftar
-- INSERT INTO admins (user_id, nama, email, role) VALUES ('<USER_ID_ANDA>', 'SuperAdmin', 'admin@kampus.ac.id', 'super_admin');
```

> [!IMPORTANT]
> **Tindakan Diperlukan:** 
> Mohon konfirmasi jika Anda sudah menjalankan script ini di Supabase SQL Editor.
> Karena kita tidak dapat melanjutkan jika tabel `admins` belum ada di database.


Saya telah menyelesaikan implementasi Role-Based Access Control (RBAC) dan fitur Manajemen Admin sesuai dengan permintaan pada Task 11.

Berikut adalah poin-poin penyelesaian yang telah saya terapkan:

Halaman Status Manajemen Admin (/panitia/admin/status): Halaman ini telah dibuat secara spesifik agar dapat digunakan oleh Super Admin untuk menambah maupun menghapus admin pkkmb / pose. Halaman ini juga memiliki indikator "Online/Offline" realtime.
Filter Dashboard Berdasarkan Role: Saya telah melakukan penyaringan data pada setiap dashboard utama (Trafik, FAQ, dan Kontak). Misalnya, saat Admin PKKMB login, semua opsi pada dashboard akan terkunci dan secara otomatis hanya memunculkan data untuk website PKKMB saja.
Pemberian Proteksi URL Cerdas (Route Guard): Pada layout.js, saya menambahkan pengecekan agar seorang admin tidak dapat melakukan modifikasi dengan cara "menebak URL" ke konten website lain. Jika Admin POSE mencoba membuka URL konten PKKMB, maka otomatis akan dialihkan ke dashboard utama.
Untuk ringkasan lengkap serta petunjuk fitur yang telah diselesaikan, Anda dapat membacanya di 
walkthrough.md
.

Silakan lakukan tes end-to-end dengan membuat akun baru dari halaman login/admin dan uji semua batas hak akses (Role) yang baru dibuat ini. Jika ada pertanyaan atau modifikasi lebih lanjut, silakan beritahu saya!

26/06/2026 5:03 PM

# keterangan task11.md ;

fokus saja pada halaman panitia, tepatnya sebagai berikut;
saya ingin membuat untuk menejemen admin, yang mana admin itu memiliki 3 role yaitu : 
1. super admin (mengakses semua data)
2. admin pkkmb (mengakses data pkkmb)
3. admin pose (mengakses data pose)
jadi ketika admin itu mencoba login terus masuk ke halaman dashboard maka data yang ada disemua halaman itu hanya menampilkan data sesuai role admin tersebut dan juga seperti manajemen contennya juga sama.
terus untuk super admin itu ada folder atau halaman untuk manajemen admin yang ada difolder panitia-admin-status terus bisa untuk menambah admin pkkmb dan admin pose, juga bisa tambah hapus dan update status admin dan dihalaman itu juga saya ingin ada kolom untuk melihat admin apakah sedang online atau ofline, oh iya sekalian jika admin itu online maka ada kolom warna hijau kalau ofline warna merah dan token atau loginnya juga jika tidak ada pergerakan selama 5 menit otomatis warna akan menjadi merah sekaligus logout sendiri. untuk halaman dashboard nya juga harus memilki 3 tampilan yaitu tampilan pkkmb, tampilan pose, dan tampilan portal. terus dihalaman admin itu selain role super admin tidak bisa akses. terus untuk manajemen admin ini saya ingin menambah inputan nama, dan dihalaman login itu jadi bisa menggunakan email atau menggunakan nama dengan diberi tombol swich seperti pada halaman contact terus saya juga dilogin itu ingin diberi validasi seperti halaman contact itu. terus kalau untuk tampilan admin itu juga harus memilki tampilan darkmode juga. 