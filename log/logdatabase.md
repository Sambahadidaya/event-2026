<!-- 
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


CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID, -- Optional, if you track which admin did it
    admin_email VARCHAR(255),
    action VARCHAR(255) NOT NULL,
    target_id UUID,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE form_register
ADD kategori_pendaftar VARCHAR(255) DEFAULT 'Mahasiswa LP3I,Siswa,Dosen,Umum';

ALTER TABLE public.form_register ADD COLUMN site site_type;
-- Update data lama agar tidak null
UPDATE public.form_register SET site = 'pose' WHERE site IS NULL;
ALTER TABLE public.form_register ALTER COLUMN site SET NOT NULL;

ALTER TABLE peserta
ADD COLUMN IF NOT EXISTS semester int4;

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
```
); -->


# data log terbaru tanggal 23 juli 2026 ;
```sql
-- ============================================================================
-- 1. EXTENSIONS & ENUM TYPES
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom Enum Types
CREATE TYPE site_type AS ENUM ('pkkmb', 'pose', 'portal');
CREATE TYPE jenis_jadwal_type AS ENUM ('pendaftaran', 'seleksi', 'acara');

-- ============================================================================
-- 2. TABEL INDEPENDEN (TANPA FOREIGN KEY KECUALI AUTH)
-- ============================================================================

-- Tabel Admins
CREATE TABLE public.admins (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    user_id UUID,
    nama VARCHAR NOT NULL UNIQUE,
    email VARCHAR NOT NULL UNIQUE,
    role VARCHAR NOT NULL,
    is_online BOOLEAN DEFAULT false,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    qrcode VARCHAR DEFAULT NULL UNIQUE,
    limit_login BOOLEAN DEFAULT false,
    failed_attempts INTEGER DEFAULT 0,
    lockout_until TIMESTAMP WITH TIME ZONE,
    first_failed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT admins_pkey PRIMARY KEY (id),
    CONSTRAINT admins_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Tabel Audit Logs
CREATE TABLE public.audit_logs (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    admin_id UUID,
    admin_email VARCHAR,
    action VARCHAR NOT NULL,
    target_id UUID,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT audit_logs_pkey PRIMARY KEY (id)
);

-- Tabel Berita / Pemberitahuan
CREATE TABLE public.berita (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    title VARCHAR NOT NULL,
    content TEXT NOT NULL,
    type site_type NOT NULL,
    custom_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT berita_pkey PRIMARY KEY (id)
);

-- Tabel Trafik Kunjungan
CREATE TABLE public.trafik_kunjungan (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    site site_type NOT NULL,
    visited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT trafik_kunjungan_pkey PRIMARY KEY (id)
);

-- Tabel Kontak
CREATE TABLE public.kontak (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    nama VARCHAR NOT NULL,
    email VARCHAR,
    whatsapp VARCHAR,
    pesan TEXT NOT NULL,
    site site_type NOT NULL,
    jawab BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT kontak_pkey PRIMARY KEY (id)
);

-- Tabel Riwayat Pertanyaan (FAQ)
CREATE TABLE public.riwayat_pertanyaan (
    id BIGSERIAL NOT NULL,
    pertanyaan TEXT NOT NULL,
    jawaban TEXT NOT NULL,
    site site_type NOT NULL,
    is_faq_matched BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT riwayat_pertanyaan_pkey PRIMARY KEY (id)
);

-- Tabel Jadwal Acara
CREATE TABLE public.jadwal_acara (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    site site_type NOT NULL,
    jenis_jadwal jenis_jadwal_type NOT NULL,
    waktu_mulai TIMESTAMP WITH TIME ZONE NOT NULL,
    waktu_selesai TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT jadwal_acara_pkey PRIMARY KEY (id)
);

-- Tabel Form Register
CREATE TABLE public.form_register (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    jenis_lomba VARCHAR NOT NULL,
    nama_lomba VARCHAR NOT NULL,
    link_id VARCHAR NOT NULL UNIQUE,
    gambar VARCHAR,
    keterangan TEXT,
    butuh_bukti BOOLEAN DEFAULT true,
    nominal INTEGER,
    kategori_pendaftar VARCHAR DEFAULT 'Mahasiswa LP3I,Dosen,Umum',
    kode_form VARCHAR UNIQUE,
    site site_type NOT NULL DEFAULT 'pose',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT form_register_pkey PRIMARY KEY (id)
);

-- Tabel Form Wajib
CREATE TABLE public.form_wajib (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    judul VARCHAR NOT NULL,
    keterangan TEXT,
    site site_type NOT NULL,
    link_id VARCHAR NOT NULL UNIQUE,
    gambar VARCHAR,
    nominal INTEGER,
    kode_form VARCHAR UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT form_wajib_pkey PRIMARY KEY (id)
);

-- Tabel Peserta
CREATE TABLE public.peserta (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    kategori VARCHAR NOT NULL,
    nama VARCHAR NOT NULL,
    kampus VARCHAR,
    nim VARCHAR,
    prodi VARCHAR,
    angkatan VARCHAR,
    semester INTEGER,
    email_wa VARCHAR,
    bukti_bayar VARCHAR,
    metode_pembayaran VARCHAR,
    status_pembayaran VARCHAR DEFAULT 'Pending',
    site_type site_type,
    jenis_form VARCHAR,
    kode_form VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT peserta_pkey PRIMARY KEY (id)
);

-- Tabel Materi PKKMB
CREATE TABLE public.materi_pkkmb (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    judul VARCHAR NOT NULL,
    pemateri VARCHAR NOT NULL,
    tanggal TIMESTAMP WITH TIME ZONE NOT NULL,
    status BOOLEAN NOT NULL DEFAULT false,
    foto_header VARCHAR NOT NULL,
    file_pdf VARCHAR NOT NULL,
    link_tugas VARCHAR NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT materi_pkkmb_pkey PRIMARY KEY (id)
);

-- Tabel Team / Kelompok
CREATE TABLE public.team (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    title VARCHAR NOT NULL UNIQUE,
    content TEXT NOT NULL,
    type site_type NOT NULL,
    instagram_link VARCHAR,
    gambar VARCHAR,
    jenis_lomba VARCHAR,
    nama_lomba VARCHAR,
    verivikasi BOOLEAN,
    bukti_bayar VARCHAR,
    user_token UUID,
    kode_form VARCHAR UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT team_pkey PRIMARY KEY (id)
);

-- ============================================================================
-- 3. TABEL DEPENDEN (MEMILIKI FOREIGN KEY HASIL RELASI)
-- ============================================================================

-- Tabel Anggota Tim
CREATE TABLE public.team_members (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    team_id UUID,
    nama VARCHAR NOT NULL,
    jabatan VARCHAR,
    kode VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT team_members_pkey PRIMARY KEY (id),
    CONSTRAINT team_members_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.team(id) ON DELETE CASCADE
);

-- Tabel Jadwal Pertandingan
CREATE TABLE public.jadwal_pertandingan (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    team1_id UUID,
    team2_id UUID,
    waktu TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    nama_lomba VARCHAR,
    jenis_lomba VARCHAR,
    status VARCHAR DEFAULT 'Belum Mulai',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT jadwal_pertandingan_pkey PRIMARY KEY (id),
    CONSTRAINT jadwal_pertandingan_team1_id_fkey FOREIGN KEY (team1_id) REFERENCES public.team(id) ON DELETE CASCADE,
    CONSTRAINT jadwal_pertandingan_team2_id_fkey FOREIGN KEY (team2_id) REFERENCES public.team(id) ON DELETE CASCADE
);

-- Tabel Hasil Pertandingan
CREATE TABLE public.hasil_pertandingan (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    pertandingan_id UUID NOT NULL,
    team_id UUID NOT NULL,
    skor INTEGER NOT NULL DEFAULT 0,
    menang BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT hasil_pertandingan_pkey PRIMARY KEY (id),
    CONSTRAINT hasil_pertandingan_pertandingan_id_fkey FOREIGN KEY (pertandingan_id) REFERENCES public.jadwal_pertandingan(id) ON DELETE CASCADE,
    CONSTRAINT hasil_pertandingan_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.team(id) ON DELETE CASCADE,
    CONSTRAINT hasil_pertandingan_unique_match UNIQUE (pertandingan_id, team_id)
);

-- Tabel Tugas Materi PKKMB
CREATE TABLE public.tugas_materi (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    materi_id UUID NOT NULL,
    keterangan TEXT,
    nama VARCHAR NOT NULL,
    kampus VARCHAR NOT NULL,
    nim VARCHAR NOT NULL,
    file_tugas VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tugas_materi_pkey PRIMARY KEY (id),
    CONSTRAINT tugas_materi_materi_id_fkey FOREIGN KEY (materi_id) REFERENCES public.materi_pkkmb(id) ON DELETE CASCADE
);

-- Tabel Form Pengumpulan
CREATE TABLE public.form_pengumpulan (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL,
    link_id VARCHAR NOT NULL UNIQUE,
    status BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT form_pengumpulan_pkey PRIMARY KEY (id),
    CONSTRAINT form_pengumpulan_form_id_fkey FOREIGN KEY (form_id) REFERENCES public.form_register(id) ON DELETE CASCADE
);

-- Tabel Pengumpulan Lomba
CREATE TABLE public.pengumpulan_lomba (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL,
    team_id UUID NOT NULL,
    keterangan TEXT,
    file_link VARCHAR NOT NULL,
    status_pengumpulan BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pengumpulan_lomba_pkey PRIMARY KEY (id),
    CONSTRAINT pengumpulan_lomba_form_id_fkey FOREIGN KEY (form_id) REFERENCES public.form_pengumpulan(id) ON DELETE CASCADE,
    CONSTRAINT pengumpulan_lomba_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.team(id) ON DELETE CASCADE
);

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS) & POLICIES (SESUAI LAMPIRAN PDF)
-- ============================================================================

-- Aktifkan RLS pada seluruh tabel
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.berita ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_pengumpulan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_register ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_wajib ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hasil_pertandingan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jadwal_acara ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jadwal_pertandingan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kontak ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materi_pkkmb ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pengumpulan_lomba ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peserta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.riwayat_pertanyaan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trafik_kunjungan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tugas_materi ENABLE ROW LEVEL SECURITY;

-- Policy: admins
CREATE POLICY "Enable read access for public on admins" ON public.admins FOR SELECT TO public USING (true);
CREATE POLICY "Enable insert for all users" ON public.admins FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.admins FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for all users" ON public.admins FOR DELETE TO authenticated USING (true);

-- Policy: berita
CREATE POLICY "select" ON public.berita FOR SELECT TO public USING (true);
CREATE POLICY "all" ON public.berita FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Policy: form_register
CREATE POLICY "Enable read Access for all users on form_register" ON public.form_register FOR SELECT TO public USING (true);
CREATE POLICY "Enable all access for authenticated users on form_register" ON public.form_register FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Policy: form_wajib
CREATE POLICY "Enable read access for all users on form_wajib" ON public.form_wajib FOR SELECT TO public USING (true);
CREATE POLICY "Enable all access for authenticated users on form_wajib" ON public.form_wajib FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Policy: hasil_pertandingan
CREATE POLICY "Enable read for all on hasil_pertandingan" ON public.hasil_pertandingan FOR SELECT TO public USING (true);
CREATE POLICY "Enable all for authenticated on hasil_pertandingan" ON public.hasil_pertandingan FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Policy: jadwal_acara
CREATE POLICY "Enable read access for all users on jadwal_acara" ON public.jadwal_acara FOR SELECT TO public USING (true);
CREATE POLICY "Enable all access for authenticated users on jadwal_acara" ON public.jadwal_acara FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Policy: jadwal_pertandingan
CREATE POLICY "Enable read access for all users on jadwal_pertandingan" ON public.jadwal_pertandingan FOR SELECT TO public USING (true);
CREATE POLICY "Enable all access for authenticated users on jadwal_pertandingan" ON public.jadwal_pertandingan FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Policy: kontak
CREATE POLICY "insert" ON public.kontak FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "all" ON public.kontak FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Policy: peserta
CREATE POLICY "cek" ON public.peserta FOR SELECT TO public USING (true);
CREATE POLICY "Enable insert access for all users on peserta_wajib" ON public.peserta FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Enable all access for authenticated users on peserta_wajib" ON public.peserta FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Policy: riwayat_pertanyaan
CREATE POLICY "insert" ON public.riwayat_pertanyaan FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "all" ON public.riwayat_pertanyaan FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Policy: team
CREATE POLICY "Team" ON public.team FOR ALL TO public USING (true) WITH CHECK (true);

-- Policy: team_members
CREATE POLICY "Enable read access for all users on team_members" ON public.team_members FOR SELECT TO public USING (true);
CREATE POLICY "insert" ON public.team_members FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Enable all access for authenticated users on team_members" ON public.team_members FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Policy: trafik_kunjungan
CREATE POLICY "insert" ON public.trafik_kunjungan FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "all" ON public.trafik_kunjungan FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Policy: tugas_materi
CREATE POLICY "Enable read for public on tugas_materi" ON public.tugas_materi FOR SELECT TO public USING (true);
CREATE POLICY "Enable insert for public on tugas_materi" ON public.tugas_materi FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Enable all for authenticated on tugas_materi" ON public.tugas_materi FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- 5. BUCKET STORAGE & POLICIES (SESUAI LAMPIRAN STORAGE PDF)
-- ============================================================================

-- Inisialisasi Storage Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('bukti-bayar', 'bukti-bayar', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']),
    ('materi-header', 'materi-header', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
    ('materi-pkkmb', 'materi-pkkmb', true, 10485760, ARRAY['application/pdf']),
    ('materi-tugas', 'materi-tugas', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
    ('pengumpulan', 'pengumpulan', true, 10485760, NULL),
    ('team-images', 'team-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage Policies: bukti-bayar
CREATE POLICY "Public Read bukti-bayar" ON storage.objects FOR SELECT TO public USING (bucket_id = 'bukti-bayar');
CREATE POLICY "Public Upload bukti-bayar" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'bukti-bayar');
CREATE POLICY "Authenticated Delete bukti-bayar" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'bukti-bayar');

-- Storage Policies: materi-header
CREATE POLICY "Public Read materi-header" ON storage.objects FOR SELECT TO public USING (bucket_id = 'materi-header');
CREATE POLICY "Public Upload materi-header" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'materi-header');
CREATE POLICY "Authenticated Update materi-header" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'materi-header');
CREATE POLICY "Authenticated Delete materi-header" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'materi-header');

-- Storage Policies: materi-pkkmb
CREATE POLICY "Public Read materi-pkkmb" ON storage.objects FOR SELECT TO public USING (bucket_id = 'materi-pkkmb');
CREATE POLICY "Public Upload materi-pkkmb" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'materi-pkkmb');
CREATE POLICY "Authenticated Update materi-pkkmb" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'materi-pkkmb');
CREATE POLICY "Authenticated Delete materi-pkkmb" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'materi-pkkmb');

-- Storage Policies: materi-tugas
CREATE POLICY "Public Read materi-tugas" ON storage.objects FOR SELECT TO public USING (bucket_id = 'materi-tugas');
CREATE POLICY "Public Upload materi-tugas" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'materi-tugas');
CREATE POLICY "Authenticated Update materi-tugas" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'materi-tugas');
CREATE POLICY "Authenticated Delete materi-tugas" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'materi-tugas');

-- Storage Policies: pengumpulan
CREATE POLICY "uplod 1v1mai6_0" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'pengumpulan');
CREATE POLICY "all 1v1mai6_0" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'pengumpulan');
CREATE POLICY "all 1v1mai6_1" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'pengumpulan');
CREATE POLICY "all 1v1mai6_2" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'pengumpulan');
CREATE POLICY "all 1v1mai6_3" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'pengumpulan');

-- Storage Policies: team-images
CREATE POLICY "Public Access" ON storage.objects FOR SELECT TO public USING (bucket_id = 'team-images');
CREATE POLICY "Allow Uploads" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'team-images');
CREATE POLICY "Allow Updates and Deletes" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'team-images');
CREATE POLICY "Allow Deletes" ON storage.objects FOR DELETE TO public USING (bucket_id = 'team-images');
CREATE POLICY "Public Read team-images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'team-images');
CREATE POLICY "Public Upload team-images" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'team-images');

-- 1. Master Account (Chart of Accounts)
CREATE TABLE public.master_account (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kode_id VARCHAR(20) NOT NULL UNIQUE,
    kode_akun VARCHAR(10) NOT NULL UNIQUE,
    nama_akun VARCHAR(255) NOT NULL,
    akun_type VARCHAR(50) NOT NULL CHECK (akun_type IN ('Asset', 'Liability', 'Equity', 'Revenue', 'Expense')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Master Transaction Category
CREATE TABLE public.master_transaction_category (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kode_id VARCHAR(20) NOT NULL UNIQUE,
    site site_type NOT NULL,
    type_transaksi VARCHAR(10) NOT NULL CHECK (type_transaksi IN ('income', 'expense')),
    nama_kategori VARCHAR(255) NOT NULL,
    nama_sub_kategori VARCHAR(255),
    kategori_lomba VARCHAR(255),
    nama_lomba VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Transaction Finance (Buku Besar Transaksi)
CREATE TABLE public.transaction_finance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kode_id VARCHAR(20) NOT NULL UNIQUE,
    site site_type NOT NULL,
    nama_kampus VARCHAR(255),
    tanggal_transaksi DATE NOT NULL DEFAULT CURRENT_DATE,
    kategori_transaksi_id UUID REFERENCES public.master_transaction_category(id) ON DELETE SET NULL,
    akun_pembayaran_id UUID REFERENCES public.master_account(id) ON DELETE SET NULL,
    nama_payer VARCHAR(255),
    kode_payer VARCHAR(255),
    kategori_payer VARCHAR(255),
    metode_pembayaran VARCHAR(50),
    keterangan TEXT,
    nominal DECIMAL(15,2) NOT NULL DEFAULT 0,
    bukti_pembayaran VARCHAR(500),
    created_by UUID REFERENCES public.admins(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Journal Entry (Double-Entry Bookkeeping)
CREATE TABLE public.journal_entry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kode_id VARCHAR(20) NOT NULL UNIQUE,
    transaction_id UUID NOT NULL REFERENCES public.transaction_finance(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES public.master_account(id) ON DELETE RESTRICT,
    debit DECIMAL(15,2) NOT NULL DEFAULT 0,
    credit DECIMAL(15,2) NOT NULL DEFAULT 0,
    description TEXT,
    journal_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Form Transaksi Pengeluaran
CREATE TABLE public.form_transaksi_pengeluaran (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    judul VARCHAR(255) NOT NULL,
    keterangan TEXT,
    nominal DECIMAL(15,2) NOT NULL DEFAULT 0,
    metode_pembayaran VARCHAR(50),
    bukti_pembayaran VARCHAR(500),
    penanggung_jawab VARCHAR(255),
    site site_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS Policies
ALTER TABLE public.master_account ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_all_master_account" ON public.master_account FOR SELECT TO public USING (true);
CREATE POLICY "auth_all_master_account" ON public.master_account FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.master_transaction_category ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_all_mtc" ON public.master_transaction_category FOR SELECT TO public USING (true);
CREATE POLICY "auth_all_mtc" ON public.master_transaction_category FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.transaction_finance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_all_tf" ON public.transaction_finance FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all_tf" ON public.transaction_finance FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.journal_entry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_all_je" ON public.journal_entry FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all_je" ON public.journal_entry FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.form_transaksi_pengeluaran ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read_all_ftp" ON public.form_transaksi_pengeluaran FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_all_ftp" ON public.form_transaksi_pengeluaran FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE master_account ADD COLUMN IF NOT EXISTS site site_type;
ALTER TABLE journal_entry ADD COLUMN IF NOT EXISTS site site_type;
-- Tambah kolom site ke master_account (jika belum ada)
ALTER TABLE public.master_account 
ADD COLUMN IF NOT EXISTS site site_type;

-- Update data lama agar tidak null (opsional, sesuai kebutuhan)
-- UPDATE public.master_account SET site = 'pose' WHERE site IS NULL;

-- Tambah kolom site ke journal_entry (jika belum ada)
ALTER TABLE public.journal_entry 
ADD COLUMN IF NOT EXISTS site site_type;

-- Auto-populate site dari transaction.site via trigger atau update manual:
UPDATE public.journal_entry je
SET site = tf.site
FROM public.transaction_finance tf
WHERE je.transaction_id = tf.id
AND je.site IS NULL;

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site site_type NOT NULL,
    document_type VARCHAR(50) NOT NULL, -- 'invoice', 'receipt', 'certificate', 'report'
    document_code VARCHAR(50) NOT NULL UNIQUE, -- INV-2026-000001, KWT-2026-000001, dst
    reference_id UUID,                 -- FK ke tabel terkait (transaksi_id, peserta_id, dll)
    reference_table VARCHAR(100),      -- nama tabel referensi ('transaction_finance', 'peserta', dll)
    printed_by VARCHAR(255),           -- email admin yang mencetak
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for all on documents" 
    ON public.documents FOR SELECT TO public USING (true);
CREATE POLICY "Enable all for authenticated on documents" 
    ON public.documents FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE audit_logs
ADD COLUMN admin_nama VARCHAR(100);

CREATE TABLE public.form_register_pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES public.form_register(id) ON DELETE CASCADE,
    kategori VARCHAR(100) NOT NULL,
    nominal INT4 NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT form_register_pricing_unique UNIQUE (form_id, kategori)
);
ALTER TABLE public.form_register_pricing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read pricing" ON public.form_register_pricing FOR SELECT TO public USING (true);
CREATE POLICY "auth all pricing" ON public.form_register_pricing FOR ALL TO authenticated USING (true) WITH CHECK (true);
```
dan saya juga sudah menjalankan sql ini ;
```sql
CREATE TABLE metode_pembayaran (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site site_type NOT NULL,
    nama VARCHAR(100) NOT NULL,
    tipe UUID NOT NULL REFERENCES master_account(id),
    nomor_rekening VARCHAR(255),
    nama_pemilik VARCHAR(255),
    qris_image VARCHAR(255),
    keterangan TEXT,
    aktif BOOLEAN DEFAULT true,
    urutan INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT metode_pembayaran_unique UNIQUE (site, nama)
);
ALTER TABLE public.metode_pembayaran ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read metode" ON public.metode_pembayaran FOR SELECT TO public USING (true);
CREATE POLICY "auth all metode" ON public.metode_pembayaran FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Membuat bucket
INSERT INTO storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
)
VALUES (
    'qris_image',
    'qris_image',
    true,
    5242880, -- Maksimal 5 MB
    ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
);
-- Public dapat melihat file
CREATE POLICY "Public read qris_image"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'qris_image');

-- User login dapat upload
CREATE POLICY "Authenticated upload qris_image"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'qris_image');

-- User login dapat update
CREATE POLICY "Authenticated update qris_image"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'qris_image')
WITH CHECK (bucket_id = 'qris_image');

-- User login dapat menghapus
CREATE POLICY "Authenticated delete qris_image"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'qris_image');

alter TABLE form_register_pricing
ADD COLUMN maks_anggota INT4 NOT NULL DEFAULT 1,
ADD COLUMN maks_team INT4 NOT NULL DEFAULT 1,
ADD COLUMN individu BOOLEAN NOT NULL DEFAULT TRUE;


alter table jadwal_pertandingan
ADD COLUMN urutan INT4 default 0;

-- penilaian
CREATE TABLE form_nilai_lomba (
    id UUID PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),
    nama_juri VARCHAR(100) NOT NULL,
    link_id VARCHAR(100) NOT NULL UNIQUE,
    jenis_lomba VARCHAR(100) NOT NULL,
    nama_lomba VARCHAR(100) NOT NULL,
    judul_nilai VARCHAR(200),
    bobot_nilai VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE nilai_lomba (
    id UUID PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES team(id) ON DELETE CASCADE,
    form_nilai_lomba_id UUID REFERENCES form_nilai_lomba(id) ON DELETE CASCADE,
    kritik TEXT,
    saran TEXT,
    nilai_akhir DECIMAL(5,2),
    status_public boolean DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE detail_nilai_lomba (
    id UUID PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),
    nilai_lomba_id UUID REFERENCES nilai_lomba(id) ON DELETE CASCADE,
    form_nilai_lomba_id UUID REFERENCES form_nilai_lomba(id) ON DELETE CASCADE,
    judul_nilai VARCHAR(100),
    bobot_nilai VARCHAR(100),
    nilai INT4,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE form_nilai_lomba ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read form_nilai_lomba" ON form_nilai_lomba FOR SELECT TO public USING (true);
CREATE POLICY "auth all form_nilai_lomba" ON form_nilai_lomba FOR ALL TO authenticated USING (true) WITH CHECK (true);
ALTER TABLE nilai_lomba ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read nilai_lomba" ON nilai_lomba FOR SELECT TO public USING (true);
CREATE POLICY "auth all nilai_lomba" ON nilai_lomba FOR ALL TO authenticated USING (true) WITH CHECK (true);
ALTER TABLE detail_nilai_lomba ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read detail_nilai_lomba" ON detail_nilai_lomba FOR SELECT TO public USING (true);
CREATE POLICY "auth all detail_nilai_lomba" ON detail_nilai_lomba FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE sales_pose(
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sumber VARCHAR(100) NOT NULL,
  nama_nim VARCHAR(100),
  nominal INT4,
  form_register_id UUID REFERENCES form_register(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE sales_pose ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all sales_pose" ON sales_pose FOR ALL TO authenticated USING (true) WITH CHECK (true);

alter table transaction_finance
ADD COLUMN potongan_sales int4 default 0,
ADD COLUMN nama_nim_sales_id UUID REFERENCES sales_pose(id) ON DELETE CASCADE;

alter table form_register_pricing
ADD COLUMN komisi_sales_lvl1 INT4 default 0,
ADD COLUMN komisi_sales_lvl2 INT4 default 0,
ADD COLUMN komisi_sales_lvl3 INT4 default 0;


INSERT INTO master_account (kode_id, kode_akun, nama_akun, akun_type, site)
VALUES
  ('MA013', '2002', 'Utang Komisi Sales','Liability','pose'),
  ('MA014', '5005', 'Beban Komisi Sales','Expense','pose')
  ON CONFLICT (kode_akun) DO NOTHING;

ALTER TABLE sales_pose ADD COLUMN target_nim VARCHAR(100);

alter table team_members add column id_ml varchar(20);

CREATE TABLE public.form_register_kampus_quota (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pricing_id UUID NOT NULL REFERENCES public.form_register_pricing(id) ON DELETE CASCADE,
    nama_kampus VARCHAR(255) NOT NULL,
    maks_team INT4 NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT form_register_kampus_quota_unique UNIQUE (pricing_id, nama_kampus)
);
ALTER TABLE public.form_register_kampus_quota ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read kampus_quota" ON public.form_register_kampus_quota FOR SELECT TO public USING (true);
CREATE POLICY "auth all kampus_quota" ON public.form_register_kampus_quota FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.form_register_pricing 
ADD COLUMN IF NOT EXISTS umum_type VARCHAR(30) DEFAULT 'keduanya';

alter table team
ADD COLUMN form_register_id UUID NOT NULL REFERENCES form_register(id) ON DELETE CASCADE;


CREATE TABLE kelompok (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    urutan INT4 DEFAULT 0,
    nama_kelompok VARCHAR(100) NOT NULL,
    nama_kabim VARCHAR(100) NOT NULL,
    link_instagram VARCHAR(255),
    foto_kelompok VARCHAR(255),
    keterangan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE kelompok_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kelompok_id UUID NOT NULL REFERENCES kelompok(id) ON DELETE CASCADE,
    nama_anggota VARCHAR(100) NOT NULL,
    nim_anggota VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE public.kelompok ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read kelompok" ON public.kelompok FOR SELECT TO public USING (true);
CREATE POLICY "auth all kelompok" ON public.kelompok FOR ALL TO authenticated USING (true) WITH CHECK (true);
ALTER TABLE public.kelompok_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read kelompok_members" ON public.kelompok_members FOR SELECT TO public USING (true);
CREATE POLICY "auth all kelompok_members" ON public.kelompok_members FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE data_medis_pkkmb (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    users UUID NOT NULL REFERENCES peserta(id) ON DELETE CASCADE,
    riwayat_penyakit VARCHAR(255),
    penanganan VARCHAR(255),
    alergi VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE data_tambahan_pkkmb (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    users UUID NOT NULL REFERENCES peserta(id) ON DELETE CASCADE,
    nama_ortu_wali VARCHAR(100),
    no_wa_ortu_wali VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE public.data_medis_pkkmb ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read data_medis_pkkmb" ON public.data_medis_pkkmb FOR SELECT TO public USING (true);
CREATE POLICY "auth all data_medis_pkkmb" ON public.data_medis_pkkmb FOR ALL TO authenticated USING (true) WITH CHECK (true);
ALTER TABLE public.data_tambahan_pkkmb ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read data_tambahan_pkkmb" ON public.data_tambahan_pkkmb FOR SELECT TO public USING (true);
CREATE POLICY "auth all data_tambahan_pkkmb" ON public.data_tambahan_pkkmb FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE pengembangan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kunci BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE public.pengembangan ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read pengembangan" ON public.pengembangan FOR SELECT TO public USING (true);
CREATE POLICY "auth all pengembangan" ON public.pengembangan FOR ALL TO authenticated USING (true) WITH CHECK (true);
```