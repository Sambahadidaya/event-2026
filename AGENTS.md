
# INSTRUKSI UTAMA UNTUK AI AGENT (CODING ASSISTANT)

Kamu adalah AI Web Developer Expert yang bertugas memprogram proyek "Portal Kampus 2026 (PKKMB & PORAK)".

---

## 1. KONDISI PROJECT SAAT INI (CONTEXT)

### A. Environment & Library Terinstal

Proyek ini menggunakan Next.js (App Router) berbasis JavaScript murni (bukan TypeScript). Dependencies berikut sudah diinstal sempurna:

```json
{
      "dependencies": {
        "@sparticuz/chromium-min": "^149.0.0",
        "@supabase/ssr": "^0.12.3",
        "@supabase/supabase-js": "^2.108.2",
        "canvas": "^3.2.3",
        "chart.js": "^4.5.1",
        "file-type": "^22.0.1",
        "fuse.js": "^7.4.2",
        "html5-qrcode": "^2.3.8",
        "jsqr": "^1.4.0",
        "lucide-react": "^1.21.0",
        "nanoid": "^5.1.16",
        "next": "^16.2.11",
        "next-themes": "^0.4.6",
        "openai": "^6.45.0",
        "pdf-lib": "^1.17.1",
        "puppeteer-core": "^25.4.0",
        "qrcode": "^1.5.4",
        "react": "19.2.4",
        "react-chartjs-2": "^5.3.1",
        "react-dom": "19.2.4",
        "react-image-crop": "^11.1.2",
        "react-markdown": "^10.1.0",
        "react-pdf": "^10.4.1",
        "remark-gfm": "^4.0.1",
        "sharp": "^0.35.3",
        "tree-node-cli": "^3.0.0",
        "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "babel-plugin-react-compiler": "1.0.0",
    "puppeteer": "^25.4.0",
    "tailwindcss": "^4"
  }
}
```

---

### B. Konfigurasi Database Supabase yang Sudah Aktif

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

alter table admins
add column type site_type default 'pkkmb';

UPDATE admins
SET type = 'pose'
WHERE role = 'admin_pose';

CREATE TABLE form_absen_panitia (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site site_type NOT NULL,
    judul_absen VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE data_absen_panitia(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID REFERENCES form_absen_panitia(id) ON DELETE CASCADE,
    nama_panitia VARCHAR(200) NOT NULL,
    type_absen VARCHAR(10) NOT NULL CHECK (type_absen IN ('Alpha', 'Sakit','Izin','Hadir')),
    keterangan_absen VARCHAR(200),
    create_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE form_absen_panitia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all form_absen_panitia" ON form_absen_panitia FOR ALL TO authenticated USING (true) WITH CHECK (true);
ALTER TABLE data_absen_panitia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all data_absen_panitia" ON data_absen_panitia FOR ALL TO authenticated USING (true) WITH CHECK (true);


create table total_absen_panitia(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    panitia_id UUID REFERENCES admins(id) ON DELETE CASCADE,
    data_absen_id UUID REFERENCES data_absen_panitia(id) ON DELETE CASCADE
);

ALTER TABLE total_absen_panitia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all total_absen_panitia" ON total_absen_panitia FOR ALL TO authenticated USING (true) WITH CHECK (true);

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

ALTER TABLE team
ADD COLUMN jenis_kategori VARCHAR(15);
ALTER TABLE form_register
ADD COLUMN jenis_kategori VARCHAR(15),
ADD COLUMN is_public BOOLEAN default true;

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


CREATE TABLE public.form_wajib_pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES public.form_wajib(id) ON DELETE CASCADE,
    kelas VARCHAR(50) NOT NULL,
    nominal INT4 NOT NULL DEFAULT 0,
    jenis_tahapan VARCHAR (20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE public.form_wajib_pricing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read pricing" ON public.form_wajib_pricing FOR SELECT TO public USING (true);
CREATE POLICY "auth all pricing" ON public.form_wajib_pricing FOR ALL TO authenticated USING (true) WITH CHECK (true);


CREATE TABLE public.pembayaran_pkkmb (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nim_user VARCHAR(50) NOT NULL,
    jenis_bayar VARCHAR(50) NOT NULL,
    tahapan VARCHAR(50) NOT NULL,
    nominal INT4 NOT NULL DEFAULT 0,
    status_pembayaran VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE public.pembayaran_pkkmb ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read pricing" ON public.pembayaran_pkkmb FOR SELECT TO public USING (true);
CREATE POLICY "auth all pricing" ON public.pembayaran_pkkmb FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO master_account (kode_id, kode_akun, nama_akun, akun_type, site)
VALUES
  ('MA015', '1005', 'Piutang','Asset','pkkmb')
  ON CONFLICT (kode_akun) DO NOTHING;

CREATE TABLE pengembangan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kunci BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE public.pengembangan ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read pengembangan" ON public.pengembangan FOR SELECT TO public USING (true);
CREATE POLICY "auth all pengembangan" ON public.pengembangan FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.form_pengumpulan 
ADD COLUMN gambar VARCHAR DEFAULT NULL;

-- Hapus row global lama
DELETE FROM public.pengembangan;

-- Tambah kolom baru
ALTER TABLE public.pengembangan 
    ADD COLUMN site site_type,
    ADD COLUMN route VARCHAR(255),
    ADD COLUMN label VARCHAR(255);

-- Tambah unique constraint
ALTER TABLE public.pengembangan 
    ADD CONSTRAINT pengembangan_site_route_unique UNIQUE(site, route);

-- Insert per-halaman per-site
INSERT INTO public.pengembangan (site, route, label, kunci) VALUES
    ('pkkmb', '/kelompok',  'Kelompok',              false),
    ('pkkmb', '/jadwal',    'Jadwal',                 false),
    ('pkkmb', '/materi',    'Materi',                 false),
    ('pkkmb', '/ketentuan', 'Ketentuan',              false),
    ('pkkmb', '/panduan',   'Panduan',                false),
    ('pose',  '/team',      'Team / Pendaftaran',     false),
    ('pose',  '/jadwal',    'Jadwal Pertandingan',    false),
    ('pose',  '/nilai',     'Nilai / Penilaian',      false),
    ('pose',  '/ketentuan', 'Ketentuan',              false);


--ngurut dari 0
SELECT
    id,
    kode_id AS kode_lama,
    'JE' || LPAD(
        ROW_NUMBER() OVER (
            ORDER BY journal_date ASC, transaction_id ASC, created_at ASC, id ASC
        )::text,
        3,
        '0'
    ) AS kode_baru,
    journal_date,
    transaction_id,
    debit,
    credit
FROM journal_entry
ORDER BY
    journal_date ASC,
    transaction_id ASC,
    created_at ASC,
    id ASC;


-- done lah rubah kode_id
WITH numbered AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            ORDER BY journal_date ASC, transaction_id ASC, created_at ASC, id ASC
        ) AS nomor
    FROM journal_entry
)
UPDATE journal_entry je
SET kode_id = 'JE' || LPAD(numbered.nomor::text, 3, '0')
FROM numbered
WHERE je.id = numbered.id;

--ngurut dari 0
SELECT
    id,
    kode_id AS kode_lama,
    'TF' || LPAD(
        ROW_NUMBER() OVER (
            ORDER BY tanggal_transaksi ASC, created_at ASC, id ASC
        )::text,
        3,
        '0'
    ) AS kode_baru,
    tanggal_transaksi,
    created_at,
    nama_payer,
    nominal
FROM transaction_finance
ORDER BY tanggal_transaksi ASC, created_at ASC, id ASC;

--done
WITH numbered AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            ORDER BY tanggal_transaksi ASC, created_at ASC, id ASC
        ) AS nomor
    FROM transaction_finance
)
UPDATE transaction_finance tf
SET kode_id = 'TF' || LPAD(numbered.nomor::text, 3, '0')
FROM numbered
WHERE tf.id = numbered.id;

-- Sequence untuk Transaction Finance (TF)
CREATE SEQUENCE IF NOT EXISTS tf_kode_seq START WITH 1 INCREMENT BY 1;
-- Sequence untuk Journal Entry (JE)
CREATE SEQUENCE IF NOT EXISTS je_kode_seq START WITH 1 INCREMENT BY 1;
ALTER SEQUENCE tf_kode_seq RESTART WITH 74;
ALTER SEQUENCE je_kode_seq RESTART WITH 133;

CREATE OR REPLACE FUNCTION get_next_kode(seq_name TEXT)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN nextval(seq_name);
END;
$$;

```

---

### C. Struktur Folder Project Eksisting
```C:\Users\samba\OneDrive\Documents\PKKMB-POSE\portal-kampus-2026
├── AGENTS.md
├── .env.local
├── src/
│   ├── proxy.js
│   ├── api/
│   │   ├── excel/
│   │   │   └── sales.js
│   │   ├── logic/
│   │   │   ├── homeLandingLogic.js
│   │   │   ├── ketentuanLogic.js
│   │   │   ├── panduan_admin.js
│   │   │   ├── panduanLogic.js
│   │   │   ├── panduanPdfAction.js
│   │   │   ├── panitiaAuthLogic.js
│   │   │   └── updateVersionLogic.js
│   │   ├── pdf/
│   │   │   └── route.js
│   │   ├── supabase/
│   │   │   ├── admin/
│   │   │   │   ├── absensi.js
│   │   │   │   ├── admin.js
│   │   │   │   ├── audit.js
│   │   │   │   ├── auth.js
│   │   │   │   ├── berita.js
│   │   │   │   ├── finance.js
│   │   │   │   ├── jadwal.js
│   │   │   │   ├── kelompok.js
│   │   │   │   ├── materi.js
│   │   │   │   ├── medis.jsjs
│   │   │   │   ├── pdf.js
│   │   │   │   ├── pembayaran_pkkmb.js
│   │   │   │   ├── pengembang.jsjs
│   │   │   │   ├── penilaian.js
│   │   │   │   ├── peserta.js
│   │   │   │   ├── sales.jsjs
│   │   │   │   ├── submission.js
│   │   │   │   └── team.js
│   │   │   ├── public/
│   │   │   │   ├── admin.js
│   │   │   │   ├── berita.js
│   │   │   │   ├── jadwal.js
│   │   │   │   ├── kelompok.jsjs
│   │   │   │   ├── materi.js
│   │   │   │   ├── medis.jsjs
│   │   │   │   ├── pdf.js
│   │   │   │   ├── pembayaran_pkkmb.js
│   │   │   │   ├── pengembang.js
│   │   │   │   ├── penilaian.js
│   │   │   │   ├── peserta.js
│   │   │   │   ├── register_lanjut.js
│   │   │   │   ├── sales.js
│   │   │   │   ├── submission.js
│   │   │   │   └── team.js
│   │   │   ├── storage.js
│   │   │   └── time.js
│   │   └── openai/
│   │       ├── chat.js
│   │       ├── chatAdmin.js
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
│   │   │   ├── absensi_panitia/
│   │   │   │   ├── absensi/
│   │   │   │   │   └── page.js
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── page.js
│   │   │   │   └── form/
│   │   │   │       └── page.js
│   │   │   ├── admin/
│   │   │   │   ├── pengembang/
│   │   │   │   │   └── page.js
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
│   │   │   ├── keuangan/
│   │   │   │   ├── buku-besar/
│   │   │   │   │   └── page.js
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── page.js
│   │   │   │   ├── data_peserta/
│   │   │   │   │   └── page.js
│   │   │   │   ├── jurnal-entry/
│   │   │   │   │   └── page.js
│   │   │   │   ├── kas-keluar/
│   │   │   │   │   └── page.js
│   │   │   │   ├── kas-masuk/
│   │   │   │   │   └── page.js
│   │   │   │   ├── laporan/
│   │   │   │   │   └── page.js
│   │   │   │   ├── master-akuntansi/
│   │   │   │   │   └── page.js
│   │   │   │   ├── master-transaksi/
│   │   │   │   │   └── page.js
│   │   │   │   ├── metode-pembayaran/
│   │   │   │   │   └── page.js
│   │   │   │   ├── neraca-saldo/
│   │   │   │   │   └── page.js
│   │   │   │   ├── transaksi/
│   │   │   │   │   └── page.js
│   │   │   │   └── verifikasi/
│   │   │   │       └── page.js
│   │   │   ├── login/
│   │   │   │   └── page.js
│   │   │   ├── panduan/
│   │   │   │   └── page.js
│   │   │   ├── pj_kabim/
│   │   │   │   └── kelompok/
│   │   │   │       └── page.js
│   │   │   ├── pj_lomba/
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── page.js
│   │   │   │   ├── form_register/
│   │   │   │   │   └── page.js
│   │   │   │   ├── form_submit/
│   │   │   │   │   └── page.js 
│   │   │   │   ├── jadwal_pertandingan/
│   │   │   │   │   └── page.js 
│   │   │   │   ├── penilaian/
│   │   │   │   │   └── page.js 
│   │   │   │   └── peserta_wajib/
│   │   │   │       └── page.js
│   │   │   ├── pj_medis/
│   │   │   │   └── peserta/
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
│   │   │   ├── pose/
│   │   │   │   ├── berita/
│   │   │   │   │   └── page.js
│   │   │   │   ├── form_register/
│   │   │   │   │   └── page.js
│   │   │   │   ├── form_wajib/
│   │   │   │   │   └── page.js
│   │   │   │   ├── jadwal_acara/
│   │   │   │   │   └── page.js
│   │   │   │   ├── jadwal_pertandingan/
│   │   │   │   │   └── page.js
│   │   │   │   ├── peserta/
│   │   │   │   │   └── page.js
│   │   │   │   ├── peserta_wajib/
│   │   │   │   │   └── page.js
│   │   │   │   ├── register/
│   │   │   │   │   └── page.js
│   │   │   │   └── team/
│   │   │   │       └── page.js
│   │   │   └── sales/
│   │   │       ├── dashboard/
│   │   │       │   └── page.js
│   │   │       └── riwayat/
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
│   │   │   ├── ketentuan/
│   │   │   │   └── page.js
│   │   │   ├── materi/
│   │   │   │   └── [id]
│   │   │   │       └── page.js
│   │   │   ├── pdf/
│   │   │   │   └── [id]
│   │   │   │       └── page.js
│   │   │   ├── panduan/
│   │   │   │   └── page.js
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
│   │       ├── ketentuan/
│   │       │   └── page.js
│   │       ├── nilai/
│   │       │   ├── [link]
│   │       │   │   └── page.js
│   │       │   └── page.js
│   │       ├── panduan/
│   │       │   └── page.js
│   │       ├── pdf/
│   │       │   └── [id]
│   │       │       └── page.js
│   │       ├── pemberitahuan/
│   │       │   └── page.js
│   │       ├── register/
│   │       │   ├── [id]
│   │       │   │   └── page.js
│   │       │   ├── dashboard
│   │       │   │   └── page.js
│   │       │   ├── lanjut
│   │       │   │   ├── [id]
│   │       │   │   │   └── page.js
│   │       │   │   └── page.js
│   │       │   └── page.js
│   │       ├── submission/
│   │       │   ├── [id]
│   │       │   │   └── page.js
│   │       │   └── page.js
│   │       └── team/
│   │           └── page.js
│   ├── assets/
│   │   ├── logo_pkkmb/
│   │   │   ├── gagal/
│   │   │   │   ├── icon-logo.png
│   │   │   │   ├── logo.png
│   │   │   │   ├── pecah-gelombang handap lagu.png
│   │   │   │   ├── pecah-lagu.png
│   │   │   │   ├── pecah-matahari.png
│   │   │   │   ├── pecah-motif.png
│   │   │   │   └── pecah-titik+gelombang.png
│   │   │   ├── ikon-logo.png
│   │   │   ├── logo.png
│   │   │   ├── logo2.png
│   │   │   ├── pecah-gelombang.png
│   │   │   ├── pecah-matahari.png
│   │   │   └── pecah-orang.png
│   │   ├── logo_pose/
│   │   │   ├── icon-logo.png
│   │   │   ├── icon-logo2.png
│   │   │   ├── logo.png
│   │   │   └── maskot.png
│   │   ├── panduan_admin_pose/
│   │   │   ├── bendahara/
│   │   │   │   └── 
│   │   │   ├── pj_lomba/
│   │   │   │   └── 
│   │   │   └── sekretaris/
│   │   │       └── 
│   │   ├── panduan_admin_pkkmb/
│   │   │   ├── bendahara/
│   │   │   │   └── 
│   │   │   ├── kabim/
│   │   │   │   └── 
│   │   │   ├── medis/
│   │   │   │   └── 
│   │   │   ├── mulmed/
│   │   │   │   └── 
│   │   │   ├── sekretaris/
│   │   │   │   └── 
│   │   │   └── tatib/
│   │   │       └── 
│   │   ├── update/
│   │   │   ├── admin_pkkmb/
│   │   │   │   └── 
│   │   │   ├── admin_pose/
│   │   │   │   └── 
│   │   │   ├── pkkmb/
│   │   │   │   └── 
│   │   │   └── pose/
│   │   │       └── 
│   │   ├── panduan_pkkmb/
│   │   │   ├── lendingpage.png
│   │   │   ├── 
│   │   │   └── pemberitahuan.png
│   │   ├── panduan_pose/
│   │   │   ├── lendingpage.png
│   │   │   ├── 
│   │   │   └── pemberitahuan.png
│   │   ├── poster_pose/
│   │   │   ├── badminton.webp
│   │   │   ├── business-model-canvas.webp
│   │   │   ├── dance.webp
│   │   │   ├── desain-poster.webp
│   │   │   ├── digital-umkm-promotion.webp
│   │   │   ├── mobile-legends.webp
│   │   │   ├── release-writing.webp
│   │   │   ├── software-developer.webp
│   │   │   ├── tarik-tambang.webp
│   │   │   └── tenis-meja.webp
│   │   ├── icon-poltek.png
│   │   ├── logopkkmb.png
│   │   ├── logopoltek.png
│   │   ├── logopose.jpg
│   │   ├── maskotpkkmb.png
│   │   └── maskotpose.png
│   ├── components/
│   │   ├── ContactForm.js
│   │   ├── ClientTracker.js
│   │   ├── DynamicFavicon.js
│   │   ├── PublicHeader.js
│   │   ├── SamsAsisten.js
│   │   ├── SamsChatbot.js
│   │   ├── SamsMateriBot.js
│   │   ├── ThemeToggle.js
│   │   ├── public/
│   │   │   ├── AnnouncementTimeline.js
│   │   │   ├── Carousel.js
│   │   │   ├── FormPengumpulan.js
│   │   │   ├── FormRegister.js
│   │   │   ├── FormRegisterLanjut.js
│   │   │   ├── FormRegisterLanjutStandalone.js
│   │   │   ├── FormRegistration.js
│   │   │   ├── FormWajib.js
│   │   │   ├── HomeLanding.js
│   │   │   ├── KetentuanPage.js
│   │   │   ├── PageHero.js
│   │   │   ├── PanduanPage.js
│   │   │   ├── PengembangBarrier.js
│   │   │   ├── PjLombaContactSection.js
│   │   │   ├── PublicFooter.js
│   │   │   ├── ScheduleBarrier.js
│   │   │   ├── SiteBackground.js
│   │   │   ├── UpdateVersionModal.js
│   │   │   └── WaveDivider.js
│   │   └── panitia/
│   │       ├── absensi/
│   │       │   ├── AbsensiDashboardCharts.js
│   │       │   ├── AbsensiFormModal.js
│   │       │   ├── AbsensiRekapTable.js
│   │       │   ├── FormAbsenModal.jsjs
│   │       │   └── SearchableDropdown.js
│   │       ├── finance/
│   │       │   ├── BuktiPreviewModal.js
│   │       │   ├── BukuBesarTable.js
│   │       │   ├── ExportExcelButton.js
│   │       │   ├── InvoicePrintButton.js
│   │       │   ├── JurnalEntryTable.js
│   │       │   ├── KasKeluarTable.js
│   │       │   ├── KasMasukTable.js
│   │       │   ├── KwitansiPrintButton.js
│   │       │   ├── LaporanKeuangan.js
│   │       │   ├── MasterAkunFormModal.js
│   │       │   ├── MasterAkunTable.js
│   │       │   ├── MasterKategoriFormModal.js
│   │       │   ├── MasterKategoriTable.js
│   │       │   ├── NeracaLajurTable.js
│   │       │   ├── NeracaSaldoTable.js
│   │       │   ├── PemasukanFormModal.js
│   │       │   ├── PengeluaranFormModal.js
│   │       │   ├── PrintPDFButton.js
│   │       │   ├── TransaksiDetailModal.js
│   │       │   └── TransaksiTable.js
│   │       ├── AdminFormPengumpulan.js
│   │       ├── AdminFormRegister.js
│   │       ├── AdminFormWajib.js
│   │       ├── AdminJadwalPertandinganPJ.js
│   │       ├── AdminKelompokManager.js
│   │       ├── AdminKeuanganDashboard.js
│   │       ├── AdminPenilaianPJ.js
│   │       ├── AdminPesertaMedis.jsjs
│   │       ├── AdminPesertaPengumpulan.js
│   │       ├── AdminPesertaRegister.js
│   │       ├── AdminPesertaWajib.js
│   │       ├── AdminVerifikasiKeuangan.js
│   │       ├── TablePagination.js
│   │       ├── DetailModal.js
│   │       ├── KeuanganAreaChart.js
│   │       ├── KeuanganDashboardHeader.js
│   │       ├── KeuanganDonutChart.js
│   │       ├── KeuanganTabelVerifikasi.js
│   │       ├── DateRangeFilter.js
│   │       ├── DashboardSelect.js
│   │       ├── DashboardOverviewCards.js
│   │       ├── DashboardHeaderFilters.js
│   │       ├── DashboardDonutChart.js
│   │       ├── LoginContent.js
│   │       ├── PanduanAdminPage.js
│   │       ├── SalesChart.js
│   │       ├── SalesRiwayatTable.js
│   │       ├── DashboardCalendarLegend.js
│   │       ├── TombolCetak.js
│   │       └── ConfirmModal.js
│   ├── data/
│   │   ├── ketentuanData.js
│   │   ├── lombaPose.js
│   │   ├── panduan_admin.js
│   │   ├── panduanData.js
│   │   └── updateVersionData.js
│   ├── docs/
│   │   ├── supabase/
│   │   └── openai/
│   │
│   └── lib/
│       ├── excel/
│       │   ├── medis.js
│       │   └── xlsx.js
│       ├── pdf/
│       │   ├── absensi.js
│       │   ├── browser.js
│       │   ├── certificate.js
│       │   ├── invoice.js
│       │   ├── medis.js
│       │   ├── panduanKetentuan.js
│       │   ├── penilaian.js
│       │   ├── report.js
│       │   ├── sales.js
│       │   ├── teamReport.js
│       │   └── template.jsjs
│       ├── qr/
│       │   └── qrcode.js
│       ├── security/
│       │   ├── inputGuard.js
│       │   └── rateLimiter.jsjs
│       ├── adminRoleData.js
│       ├── dashboardUtils.js
│       ├── dateUtils.js
│       ├── faqData.js
│       ├── faqDataAdmin.js
│       ├── kodeFormUtils.js
│       ├── lombaData.js
│       ├── openai.js
│       ├── supabase.js
│       └── siteThemes.js
```

## 2. ATURAN KODE

### 1. No TypeScript: Gunakan ES6 JavaScript murni (.js).
