
# INSTRUKSI UTAMA UNTUK AI AGENT (CODING ASSISTANT)

Kamu adalah AI Web Developer Expert yang bertugas memprogram proyek "Portal Kampus 2026 (PKKMB & PORAK)".

---

## 1. KONDISI PROJECT SAAT INI (CONTEXT)

### A. Environment & Library Terinstal

Proyek ini menggunakan Next.js (App Router) berbasis JavaScript murni (bukan TypeScript). Dependencies berikut sudah diinstal sempurna:

```json
{
  "dependencies": {
    "@supabase/ssr": "^0.12.3",
    "@supabase/supabase-js": "^2.108.2",
    "chart.js": "^4.5.1",
    "file-type": "^22.0.1",
    "fuse.js": "^7.4.2",
    "html5-qrcode": "^2.3.8",
    "jsqr": "^1.4.0",
    "lucide-react": "^1.21.0",
    "nanoid": "^5.1.16",
    "next": "16.2.9",
    "next-themes": "^0.4.6",
    "openai": "^6.45.0",
    "react": "19.2.4",
    "react-chartjs-2": "^5.3.1",
    "react-dom": "19.2.4",
    "react-image-crop": "^11.1.2"
  },
}
```

---

### B. Konfigurasi Database Supabase yang Sudah Aktif

```sql
-- =============================================
-- 1. EXTENSIONS & ENUMS
-- =============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE site_type AS ENUM ('pkkmb', 'pose', 'portal');
CREATE TYPE jenis_jadwal_enum AS ENUM ('pendaftaran', 'seleksi', 'acara');

-- =============================================
-- 2. TABEL-TABEL UTAMA
-- =============================================

-- Tabel Berita / Pemberitahuan
CREATE TABLE berita (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type site_type NOT NULL,
    custom_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Kelompok / Team
CREATE TABLE team (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type site_type NOT NULL,
    instagram_link VARCHAR(255),
    gambar VARCHAR(255),
    jenis_lomba VARCHAR(255),
    nama_lomba VARCHAR(255),
    poin1 BOOLEAN, -- Default false dihapus sesuai log alter terakhir
    poin2 BOOLEAN,
    poin3 BOOLEAN,
    poin4 BOOLEAN,
    poin5 BOOLEAN,
    verivikasi BOOLEAN,
    bukti_bayar VARCHAR(255),
    user_token VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Anggota Tim (Team Members)
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES team(id) ON DELETE CASCADE,
    nama VARCHAR(255) NOT NULL,
    jabatan VARCHAR(255),
    prodi VARCHAR(255),
    angkatan VARCHAR(255),
    nim VARCHAR(255),
    email_wa VARCHAR(255),
    kampus VARCHAR(255),
    status_bayar BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Trafik Kunjungan
CREATE TABLE trafik_kunjungan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site site_type NOT NULL,
    visited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Riwayat Pertanyaan User (Untuk FAQ Admin)
CREATE TABLE riwayat_pertanyaan (
    id BIGSERIAL PRIMARY KEY,
    pertanyaan TEXT NOT NULL,
    jawaban TEXT NOT NULL,
    site site_type NOT NULL,
    is_faq_matched BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Kontak
CREATE TABLE kontak (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nama VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    whatsapp VARCHAR(20),
    pesan TEXT NOT NULL,
    site site_type NOT NULL,
    jawab BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Admins 
-- (Role langsung menggunakan VARCHAR(50) sesuai perubahan terakhir di log Anda)
CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nama VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50) NOT NULL,
    is_online BOOLEAN DEFAULT false,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Jadwal Pertandingan (Untuk Lomba Olahraga)
CREATE TABLE jadwal_pertandingan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team1_id UUID REFERENCES team(id) ON DELETE CASCADE,
    team2_id UUID REFERENCES team(id) ON DELETE CASCADE,
    waktu TIMESTAMP WITH TIME ZONE,
    nama_lomba VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Belum Mulai',
    skor_team1 INT DEFAULT 0,
    skor_team2 INT DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Form Register
CREATE TABLE form_register (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    keterangan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Jadwal Umum
CREATE TABLE jadwal (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site site_type NOT NULL,
    jenis_jadwal jenis_jadwal_enum NOT NULL,
    waktu_mulai TIMESTAMP WITH TIME ZONE NOT NULL,
    waktu_selesai TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- =============================================
-- 3. RLS POLICY (ROW LEVEL SECURITY)
-- =============================================

-- ==========================================
-- RLS: admins
-- ==========================================

-- Aktifkan Row Level Security
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- SELECT
CREATE POLICY "Enable read access for authenticated users"
ON public.admins
FOR SELECT
TO authenticated
USING (true);

-- INSERT
CREATE POLICY "Enable insert for authenticated users"
ON public.admins
FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE
CREATE POLICY "Enable update for authenticated users"
ON public.admins
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- DELETE
CREATE POLICY "Enable delete for authenticated users"
ON public.admins
FOR DELETE
TO authenticated
USING (true);

-- RLS Team Members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users on team_members" 
ON "public"."team_members" AS PERMISSIVE FOR SELECT TO public USING (true);

CREATE POLICY "Enable all access for authenticated users on team_members" 
ON "public"."team_members" AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS Jadwal Pertandingan
ALTER TABLE jadwal_pertandingan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users on jadwal_pertandingan" 
ON "public"."jadwal_pertandingan" AS PERMISSIVE FOR SELECT TO public USING (true);

CREATE POLICY "Enable all access for authenticated users on jadwal_pertandingan" 
ON "public"."jadwal_pertandingan" AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- =============================================
-- 4. STORAGE BUCKETS (SUPABASE STORAGE)
-- =============================================

-- Bucket: team-images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'team-images',
    'team-images',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket: bukti-bayar
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
-- 5. RLS POLICY UNTUK STORAGE BUCKETS
-- =============================================

-- Policy Bucket: team-images
CREATE POLICY "Public Read team-images"
ON storage.objects FOR SELECT TO public USING (bucket_id = 'team-images');

CREATE POLICY "Public Upload team-images"
ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'team-images');

-- Policy Bucket: bukti-bayar
CREATE POLICY "Public Read bukti-bayar"
ON storage.objects FOR SELECT TO public USING (bucket_id = 'bukti-bayar');

CREATE POLICY "Public Upload bukti-bayar"
ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'bukti-bayar');

CREATE POLICY "Authenticated Delete bukti-bayar"
ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'bukti-bayar');

-- Tabel form_wajib
CREATE TABLE form_wajib (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    judul VARCHAR(255) NOT NULL,
    keterangan TEXT,
    site site_type NOT NULL,
    link_id VARCHAR(64) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabel peserta_wajib
CREATE TABLE peserta_wajib (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID REFERENCES form_wajib(id) ON DELETE CASCADE,
    kategori VARCHAR(50) NOT NULL,
    nama VARCHAR(255) NOT NULL,
    kampus VARCHAR(255),
    nim VARCHAR(50),
    prodi VARCHAR(255),
    angkatan VARCHAR(50),
    email_wa VARCHAR(255),
    bukti_bayar VARCHAR(255),
    status_pembayaran VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS form_wajib
ALTER TABLE public.form_wajib ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users on form_wajib" 
ON public.form_wajib AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Enable all access for authenticated users on form_wajib" 
ON public.form_wajib AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS peserta_wajib
ALTER TABLE public.peserta_wajib ENABLE ROW LEVEL SECURITY;
-- Semua orang bisa menginsert (karena form publik)
CREATE POLICY "Enable insert access for all users on peserta_wajib" 
ON public.peserta_wajib AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
-- Hanya admin/authenticated yang bisa read/update/delete
CREATE POLICY "Enable all access for authenticated users on peserta_wajib" 
ON public.peserta_wajib AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Tambah Kolom Gambar ke form_wajib
ALTER TABLE public.form_wajib ADD COLUMN gambar VARCHAR(255);

-- Rename peserta_wajib to peserta
ALTER TABLE peserta_wajib RENAME TO peserta;

-- Add butuh_bukti to form_register
ALTER TABLE form_register ADD COLUMN butuh_bukti BOOLEAN DEFAULT true;

-- Update team_members table
ALTER TABLE team_members RENAME COLUMN nim TO kode;
ALTER TABLE team_members DROP COLUMN prodi;
ALTER TABLE team_members DROP COLUMN angkatan;
ALTER TABLE team_members DROP COLUMN email_wa;
ALTER TABLE team_members DROP COLUMN kampus;

ALTER TABLE team
ADD COLUMN user_token uuid;

-- ============================================
-- 1. Tambah form_register_id ke tabel peserta
-- ============================================
ALTER TABLE public.peserta
    ADD COLUMN form_register_id UUID REFERENCES form_register(id) ON DELETE SET NULL;

-- ============================================
-- 2. Hapus status_bayar dari team_members
-- ============================================
ALTER TABLE public.team_members
    DROP COLUMN IF EXISTS status_bayar;

-- ============================================
-- 3. Buat tabel hasil_pertandingan
--    (menggabungkan skor & poin dalam satu tabel)
-- ============================================
CREATE TABLE hasil_pertandingan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pertandingan_id UUID NOT NULL REFERENCES jadwal_pertandingan(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES team(id) ON DELETE CASCADE,
    skor INT NOT NULL DEFAULT 0,
    menang BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(pertandingan_id, team_id)
);

-- RLS
ALTER TABLE public.hasil_pertandingan ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for all on hasil_pertandingan"
    ON public.hasil_pertandingan FOR SELECT TO public USING (true);
CREATE POLICY "Enable all for authenticated on hasil_pertandingan"
    ON public.hasil_pertandingan FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- 4. Migrasi data skor lama → hasil_pertandingan
-- ============================================
-- Skor Tim 1
INSERT INTO hasil_pertandingan (pertandingan_id, team_id, skor, menang)
SELECT
    jp.id,
    jp.team1_id,
    COALESCE(jp.skor_team1, 0),
    COALESCE(jp.skor_team1, 0) > COALESCE(jp.skor_team2, 0)  -- menang jika skor lebih besar
FROM jadwal_pertandingan jp
WHERE jp.team1_id IS NOT NULL AND jp.status = 'Selesai'
ON CONFLICT (pertandingan_id, team_id) DO NOTHING;

-- Skor Tim 2
INSERT INTO hasil_pertandingan (pertandingan_id, team_id, skor, menang)
SELECT
    jp.id,
    jp.team2_id,
    COALESCE(jp.skor_team2, 0),
    COALESCE(jp.skor_team2, 0) > COALESCE(jp.skor_team1, 0)
FROM jadwal_pertandingan jp
WHERE jp.team2_id IS NOT NULL AND jp.status = 'Selesai'
ON CONFLICT (pertandingan_id, team_id) DO NOTHING;

-- ============================================
-- 5. Hapus kolom lama setelah migrasi berhasil
-- ============================================
ALTER TABLE public.jadwal_pertandingan
    DROP COLUMN IF EXISTS skor_team1,
    DROP COLUMN IF EXISTS skor_team2;

ALTER TABLE public.team
    DROP COLUMN IF EXISTS poin1,
    DROP COLUMN IF EXISTS poin2,
    DROP COLUMN IF EXISTS poin3,
    DROP COLUMN IF EXISTS poin4,
    DROP COLUMN IF EXISTS poin5;


-- Hapus FK constraint form_id → form_wajib
ALTER TABLE public.peserta DROP CONSTRAINT IF EXISTS peserta_form_id_fkey;
ALTER TABLE public.peserta DROP CONSTRAINT IF EXISTS peserta_wajib_form_id_fkey;

-- Hapus FK constraint form_register_id → form_register
ALTER TABLE public.peserta DROP CONSTRAINT IF EXISTS peserta_form_register_id_fkey;

ALTER TABLE peserta
DROP COLUMN IF EXISTS form_id,
DROP COLUMN IF EXISTS form_register_id;

ALTER TABLE peserta
ADD COLUMN jenis_form VARCHAR(10);

ALTER TABLE form_register
ADD COLUMN nominal INT;
ALTER TABLE form_wajib
ADD COLUMN nominal INT;

ALTER TABLE peserta
ADD COLUMN IF NOT EXISTS metode_pembayaran VARCHAR(10);
ALTER TABLE peserta
ADD COLUMN IF NOT EXISTS metode_pembayaran VARCHAR(10);

ALTER TABLE admins 
ADD COLUMN qrcode VARCHAR(64) UNIQUE DEFAULT null,
ADD COLUMN limit_login BOOLEAN DEFAULT False,
ADD COLUMN failed_attempts INT DEFAULT 0,
ADD COLUMN lockout_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN first_failed_at TIMESTAMP WITH TIME ZONE;

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID, -- Optional, if you track which admin did it
    admin_email VARCHAR(255),
    action VARCHAR(255) NOT NULL,
    target_id UUID,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE peserta
ADD COLUMN IF NOT EXISTS semester int4;
ADD kategori_pendaftar VARCHAR(255) DEFAULT 'Mahasiswa LP3I,Siswa,Dosen,Umum';

ALTER TABLE public.form_register ADD COLUMN site site_type;
-- Update data lama agar tidak null
UPDATE public.form_register SET site = 'pose' WHERE site IS NULL;
ALTER TABLE public.form_register ALTER COLUMN site SET NOT NULL;

ALTER TABLE team
ADD CONSTRAINT unique_title_team UNIQUE (title);

ALTER TABLE peserta
ADD COLUMN IF NOT EXISTS kode_form varchar(10);
ALTER TABLE form_register
ADD COLUMN IF NOT EXISTS kode_form varchar(10) Unique;
ALTER TABLE form_wajib
ADD COLUMN IF NOT EXISTS kode_form varchar(10) Unique;
ALTER TABLE team
ADD COLUMN IF NOT EXISTS kode_form varchar(10) Unique;

CREATE TABLE form_pengumpulan(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES form_register(id) ON DELETE CASCADE,
    link_id VARCHAR(64) NOT NULL UNIQUE,
    status BOOLEAN DEFAULT False,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE pengumpulan_lomba(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES form_pengumpulan(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES team(id) ON DELETE CASCADE,
    keterangan TEXT DEFAULT null,
    file_link VARCHAR(255) NOT NULL,
    status_pengumpulan BOOLEAN DEFAULT False,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

```

---

### C. Struktur Folder Project Eksisting
```C:\Users\samba\OneDrive\Documents\PKKMB-POSE\portal-kampus-2026
├── .env.local
├── src/
│   ├── proxy.js
│   ├── api/
│   │   ├── supabase/
│   │   │   ├── admin/
│   │   │   │   ├── admin.js
│   │   │   │   ├── audit.js
│   │   │   │   ├── auth.js
│   │   │   │   ├── berita.js
│   │   │   │   ├── jadwal.js
│   │   │   │   ├── materi.js
│   │   │   │   ├── peserta.js
│   │   │   │   ├── submission.js
│   │   │   │   └── team.js
│   │   │   ├── public/
│   │   │   │   ├── admin.js
│   │   │   │   ├── berita.js
│   │   │   │   ├── jadwal.js
│   │   │   │   ├── materi.js
│   │   │   │   ├── peserta.js
│   │   │   │   ├── submission.js
│   │   │   │   └── team.js
│   │   │   └── storage.js
│   │   └── openai/
│   │       ├── chat.js
│   │       └── materi.js
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
│   │   │   ├── form/
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── page.js
│   │   │   │   └── form/
│   │   │   │       └── page.js
│   │   │   ├── login/
│   │   │   │   └── page.js
│   │   │   ├── pj_lomba/
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── page.js
│   │   │   │   └── form_register/
│   │   │   │       └── page.js
│   │   │   ├── pkkmb/
│   │   │   │   ├── berita/
│   │   │   │   │   └── page.js
│   │   │   │   ├── form_wajib/
│   │   │   │   │   └── page.js
│   │   │   │   ├── jadwal_acara/
│   │   │   │   │   └── page.js
│   │   │   │   ├── materi/
│   │   │   │   │   └── page.js
│   │   │   │   ├── peserta_wajib/
│   │   │   │   │   └── page.js
│   │   │   │   ├── team/
│   │   │   │   │   └── page.js
│   │   │   │   └── tugas/
│   │   │   │       └── page.js
│   │   │   └── pose/
│   │   │       ├── berita/
│   │   │       │   └── page.js
│   │   │       ├── form_register/
│   │   │       │   └── page.js
│   │   │       ├── form_wajib/
│   │   │       │   └── page.js
│   │   │       ├── jadwal_acara/
│   │   │       │   └── page.js
│   │   │       ├── jadwal_pertandingan/
│   │   │       │   └── page.js
│   │   │       ├── peserta/
│   │   │       │   └── page.js
│   │   │       ├── peserta_wajib/
│   │   │       │   └── page.js
│   │   │       ├── register/
│   │   │       │   └── page.js
│   │   │       └── team/
│   │   │           └── page.js
│   │   ├── pkkmb/
│   │   │   ├── layout.js
│   │   │   ├── page.js
│   │   │   ├── contact/
│   │   │   │   └── page.js
│   │   │   ├── form/
│   │   │   │   └── [lynk_id]
│   │   │   │       └── page.js
│   │   │   ├── jadwal/
│   │   │   │   └── page.js
│   │   │   ├── kelompok/
│   │   │   │   └── page.js
│   │   │   ├── materi/
│   │   │   │   └── [id]
│   │   │   │       └── page.js
│   │   │   └── pemberitahuan/
│   │   │       └── page.js
│   │   └── pose/
│   │       ├── layout.js
│   │       ├── page.js
│   │       ├── contact/
│   │       │   └── page.js
│   │       ├── form/
│   │       │   └── [lynk_id]
│   │       │       └── page.js
│   │       ├── jadwal/
│   │       │   └── page.js
│   │       ├── pemberitahuan/
│   │       │   └── page.js
│   │       ├── register/
│   │       │   └── [id]
│   │       │       └── page.js
│   │       ├── submission/
│   │       │   └── [id]
│   │       │       └── page.js
│   │       └── team/
│   │           └── page.js
│   ├── components/
│   │   ├── ContactForm.js
│   │   ├── ClientTracker.js
│   │   ├── DynamicFavicon.js
│   │   ├── PublicHeader.js
│   │   ├── SamsChatbot.js
│   │   ├── SamsMateriBot.js
│   │   ├── ThemeToggle.js
│   │   ├── public/
│   │   │   ├── AnnouncementTimeline.js
│   │   │   ├── Carousel.js
│   │   │   ├── FormPengumpulan.js
│   │   │   ├── FormRegistration.js
│   │   │   ├── HomeLanding.js
│   │   │   ├── PageHero.js
│   │   │   ├── PublicFooter.js
│   │   │   ├── ScheduleBarrier.js
│   │   │   ├── SiteBackground.js
│   │   │   └── WaveDivider.js
│   │   └── panitia/
│   │       ├── AdminFormPengumpulan.js
│   │       ├── AdminFormRegister.js
│   │       ├── AdminFormWajib.js
│   │       ├── AdminPesertaPengumpulan.js
│   │       ├── AdminPesertaRegister.js
│   │       ├── AdminPesertaWajib.js
│   │       ├── TablePagination.js
│   │       ├── DetailModal.js
│   │       ├── DateRangeFilter.js
│   │       ├── DashboardSelect.js
│   │       ├── DashboardOverviewCards.js
│   │       ├── DashboardHeaderFilters.js
│   │       ├── DashboardDonutChart.js
│   │       ├── LoginContent.js
│   │       ├── DashboardCalendarLegend.js
│   │       └── ConfirmModal.js
│   ├── docs/
│   │   ├── supabase/
│   │   └── openai/
│   │
│   └── lib/
│       ├── adminRoleData.js
│       ├── dashboardUtils.js
│       ├── faqData.js
│       ├── kodeFormUtils.js
│       ├── lombaData.js
│       ├── openai.js
│       ├── supabase.js
│       └── siteThemes.js
```

## 2. ATURAN KODE

### 1. No TypeScript: Gunakan ES6 JavaScript murni (.js).
