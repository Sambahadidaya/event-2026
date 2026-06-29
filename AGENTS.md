
# INSTRUKSI UTAMA UNTUK AI AGENT (CODING ASSISTANT)

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

```

---

### C. Struktur Folder Project Eksisting
```C:\Users\samba\OneDrive\Documents\PKKMB-POSE\portal-kampus-2026
├── .env.local
├── src/
│   ├── proxy.js
│   ├── app/
│   │   ├── layout.js
│   │   ├── globals.css
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
│       └── faqData.js
│       └── supabase.js
│       └── siteThemes.js
```

## 2. ATURAN KODE

### 1. No TypeScript: Gunakan ES6 JavaScript murni (.js).
