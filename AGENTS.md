
# INSTRUKSI UTAMA UNTUK AI AGENT (CODING ASSISTANT)

Kamu adalah AI Web Developer Expert yang bertugas memprogram proyek "Portal Kampus 2026 (PKKMB & PORAK)".

---

## 1. KONDISI PROJECT SAAT INI (CONTEXT)

### A. Environment & Library Terinstal

Proyek ini menggunakan Next.js (App Router) berbasis JavaScript murni (bukan TypeScript). Dependencies berikut sudah diinstal sempurna:

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.108.2",
    "chart.js": "^4.5.1",
    "fuse.js": "^7.4.2",
    "lucide-react": "^1.21.0",
    "nanoid": "^5.1.16",
    "next": "16.2.9",
    "next-themes": "^0.4.6",
    "openai": "^6.45.0",
    "react": "19.2.4",
    "react-chartjs-2": "^5.3.1",
    "react-dom": "19.2.4"
  }
}
```

---

### B. Konfigurasi Database Supabase yang Sudah Aktif

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE site_type AS ENUM ('pkkmb', 'pose', 'portal');

-- Tabel Berita / Pemberitahuan
CREATE TABLE berita (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type site_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    custom_date DATE
);

-- Tabel Kelompok/Team
CREATE TABLE Team (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type site_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TABEL TRAFIK KUNJUNGAN
CREATE TABLE trafik_kunjungan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site site_type NOT NULL, -- website mana yang dikunjungi
    visited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TABEL RIWAYAT PERTANYAAN USER (Untuk Tabel FAQ di Admin)
CREATE TABLE riwayat_pertanyaan (
    id BIGSERIAL PRIMARY KEY, -- Menggunakan ID angka berurutan untuk tabel admin
    pertanyaan TEXT NOT NULL,
    jawaban TEXT NOT NULL,
    site site_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- TABEL KONTAK 
CREATE TABLE kontak (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    whatsapp VARCHAR(20),
    pesan TEXT NOT NULL,
    site site_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    jawab BOOLEAN DEFAULT false,
);

-- 1. Buat Enum untuk Role Admin
CREATE TYPE admin_role AS ENUM ('super_admin', 'admin_pkkmb', 'admin_pose');
ALTER TYPE admin_role
ADD VALUE 'admin_pose_jadwal';

ALTER TYPE admin_role
ADD VALUE 'admin_pose_form';

ALTER TYPE admin_role
ADD VALUE 'admin_pose_keuangan';

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

-- 1. Menambahkan kolom baru ke tabel team
ALTER TABLE team
ADD COLUMN instagram_link VARCHAR(255),
ADD COLUMN gambar VARCHAR(255),
ADD COLUMN jenis_lomba VARCHAR(255),
ADD COLUMN nama_lomba VARCHAR(255),
ADD COLUMN poin1 BOOLEAN DEFAULT false,
ADD COLUMN poin2 BOOLEAN DEFAULT false,
ADD COLUMN poin3 BOOLEAN DEFAULT false,
ADD COLUMN poin4 BOOLEAN DEFAULT false,
ADD COLUMN poin5 BOOLEAN DEFAULT false;
ADD COLUMN verivikasi BOOLEAN DEFAULT false;

-- 2. Membuat tabel team_members (Anggota Tim)
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES team(id) ON DELETE CASCADE,
    nama VARCHAR(255) NOT NULL,
    jabatan VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Membuat tabel jadwal_pertandingan (untuk lomba olahraga)
CREATE TABLE jadwal_pertandingan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team1_id UUID REFERENCES team(id) ON DELETE CASCADE,
    team2_id UUID REFERENCES team(id) ON DELETE CASCADE,
    waktu TIMESTAMP WITH TIME ZONE,
    nama_lomba VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Belum Mulai', -- 'Belum Mulai', 'Berlangsung', 'Selesai'
    skor_team1 INT DEFAULT 0,
    skor_team2 INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Membuat kebijakan RLS (Row Level Security) untuk tabel baru
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE jadwal_pertandingan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users on team_members" 
ON "public"."team_members" AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Enable all access for authenticated users on team_members" 
ON "public"."team_members" AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable read access for all users on jadwal_pertandingan" 
ON "public"."jadwal_pertandingan" AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Enable all access for authenticated users on jadwal_pertandingan" 
ON "public"."jadwal_pertandingan" AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- update untuk prodi,angkatan, angkatan
ALTER TABLE team_members
ADD COLUMN prodi VARCHAR(255)
ADD COLUMN angkatan VARCHAR(255)
ADD COLUMN nim VARCHAR(255)
ADD COLUMN email_wa VARCHAR(255)
ADD COLUMN kampus VARCHAR(255)
ADD COLUMN status_bayar BOOLEAN;

-- mengubah data point menjadi nul;
ALTER TABLE team
ALTER COLUMN poin1 DROP DEFAULT,
ALTER COLUMN poin2 DROP DEFAULT,
ALTER COLUMN poin3 DROP DEFAULT,
ALTER COLUMN poin4 DROP DEFAULT,
ALTER COLUMN poin5 DROP DEFAULT;
ALTER COLUMN verivikasi DROP DEFAULT;

-- Update status jadwal pertandingan
ALTER TABLE jadwal_pertandingan
ADD COLUMN started_at TIMESTAMP WITH TIME ZONE;
ADD COLUMN ended_at TIMESTAMP WITH TIME ZONE;

-- 1. Kolom keterangan untuk form pendaftaran
ALTER TABLE form_register ADD COLUMN keterangan TEXT;

-- 2. Kolom untuk menyimpan link bukti bayar & token user
ALTER TABLE team
ADD COLUMN bukti_bayar VARCHAR(255),
ADD COLUMN user_token VARCHAR(255);


-- ==========================
-- BAGIAN 2: STORAGE BUCKET
-- ==========================

-- Buat bucket untuk Logo / Ikon Tim (jika belum ada)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'team-images',
    'team-images',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Buat bucket untuk Bukti Pembayaran
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'bukti-bayar',
    'bukti-bayar',
    true,
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;


-- =============================================
-- BAGIAN 3: RLS POLICY UNTUK BUCKET STORAGE
-- =============================================

-- ---- Bucket: team-images ----

-- Izinkan SIAPA SAJA melihat/membaca file (Public Read)
CREATE POLICY "Public Read team-images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'team-images');

-- Izinkan SIAPA SAJA (termasuk user yang tidak login) upload file
CREATE POLICY "Public Upload team-images"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'team-images');


-- ---- Bucket: bukti-bayar ----

-- Izinkan SIAPA SAJA melihat/membaca file (Public Read)
CREATE POLICY "Public Read bukti-bayar"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'bukti-bayar');

-- Izinkan SIAPA SAJA (termasuk user yang tidak login) upload file bukti
CREATE POLICY "Public Upload bukti-bayar"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'bukti-bayar');

-- Izinkan user TERAUTENTIKASI (panitia) untuk menghapus file jika perlu
CREATE POLICY "Authenticated Delete bukti-bayar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'bukti-bayar');

CREATE TYPE jadwal AS ENUM ('pendaftaran', 'seleksi', 'acara');

CREATE TABLE jadwal (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site site_type NOT NULL,
    jenis_jadwal jadwal NOT NULL,
    waktu_mulai TIMESTAMP WITH TIME ZONE NOT NULL,
    waktu_selesai TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

```

---

### C. Struktur Folder Project Eksisting
```C:\Users\samba\OneDrive\Documents\PKKMB-POSE\portal-kampus-2026
├── .env.local
├── src/
│   ├── proxy.js
│   ├── api/
│   │   └── chatbot.js
│   ├── app/
│   │   ├── layout.js
│   │   ├── globals.css
│   │   ├── (portal)/
│   │   │   ├── layout.js
│   │   │   └── page.js
│   │   ├── panitia/
│   │   │   ├── layout.js
│   │   │   ├── page.js
│   │   │   ├── admin/
│   │   │   │   └── status/
│   │   │   │       └── page.js
│   │   │   ├── dashboard/
│   │   │   │   ├── faq/
│   │   │   │   │   └── page.js
│   │   │   │   ├── kontak/
│   │   │   │   │   └── page.js
│   │   │   │   └── trafik/
│   │   │   │       └── page.js
│   │   │   ├── login/
│   │   │   │   └── page.js
│   │   │   ├── pkkmb/
│   │   │   │   ├── berita/
│   │   │   │   │   └── page.js
│   │   │   │   └── team/
│   │   │   │       └── page.js
│   │   │   └── pose/
│   │   │       ├── peserta/
│   │   │       │   └── page.js
│   │   │       ├── berita/
│   │   │       │   └── page.js
│   │   │       ├── team/
│   │   │       │   └── page.js
│   │   │       ├── form_register/
│   │   │       │   └── page.js
│   │   │       ├── register/
│   │   │       │   └── page.js
│   │   │       └── jadwal/
│   │   │           └── page.js
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
│   │       ├── jadwal/
│   │       │   └── page.js
│   │       ├── register/
│   │       │   └── page.js
│   │       ├── pemberitahuan/
│   │       │   └── page.js
│   │       └── team/
│   │           └── page.js
│   ├── components/
│   │   ├── ContactForm.js
│   │   ├── PublicHeader.js
│   │   ├── ClientTracker.js
│   │   ├── SamsChatbot.js
│   │   ├── ThemeToggle.js
│   │   ├── public/
│   │   │   └── AnnouncementTimeline.js
│   │   │   └── SiteBackground.js
│   │   │   └── WaveDivider.js
│   │   │   └── HomeLanding.js
│   │   │   └── PageHero.js
│   │   │   └── PublicFooter.js
│   │   └── panitia/
│   │       └── TablePagination.js
│   │       └── DetailModal.js
│   │       └── DateRangeFilter.js
│   │       └── DashboardSelect.js
│   │       └── DashboardOverviewCards.js
│   │       └── DashboardHeaderFilters.js
│   │       └── DashboardDonutChart.js
│   │       └── DashboardCalendarLegend.js
│   │       └── ConfirmModal.js
│   └── lib/
│       └── dashboardUtils.js
│       └── jadwalData.js
│       └── faqData.js
│       └── openai.js
│       └── lombaData.js
│       └── supabase.js
│       └── siteThemes.js
```

## 2. ATURAN KODE

### 1. No TypeScript: Gunakan ES6 JavaScript murni (.js).
