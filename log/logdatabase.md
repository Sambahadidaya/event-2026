
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

-- Menambahkan kolom is_faq_matched ke tabel riwayat_pertanyaan
-- Untuk menandai apakah pertanyaan user berkaitan dengan data FAQ atau tidak
ALTER TABLE riwayat_pertanyaan
ADD COLUMN is_faq_matched BOOLEAN DEFAULT false;

-- Mengubah tipe data role menjadi VARCHAR dan menghapus enum
ALTER TABLE admins ALTER COLUMN role TYPE VARCHAR(50) USING role::text;
ALTER TABLE 

ALTER COLUMN role DROP DEFAULT;
-- (Opsional) Menghapus tipe data enum jika sudah tidak dipakai di tempat lain
DROP TYPE IF EXISTS admin_role;

ALTER POLICY "Enable read access for all users"
ON public.admins
TO authenticated;

ALTER POLICY "Enable insert for all users"
ON public.admins
TO authenticated;

ALTER POLICY "Enable update for all users"
ON public.admins
TO authenticated;

ALTER POLICY "Enable delete for all users"
ON public.admins
TO authenticated;

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
ADD COLUMN nominal INT ;
ALTER TABLE form_wajib
ADD COLUMN nominal INT ;


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

```