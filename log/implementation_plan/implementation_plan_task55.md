# Implementation Plan: Task 55 — Limit Kuota Per-Kampus & Fitur Peserta Wajib POSE

## Deskripsi

Task ini menambahkan 4 fitur besar untuk site **POSE** tanpa mengganggu site PKKMB:

1. **Limit Kuota Tim Per-Kampus** — Tabel DB baru `form_register_kampus_quota` + UI pembuatan form + tampilan di `AdminPesertaRegister`
2. **Div Kuota Per-Kampus** di `AdminPesertaRegister` — ditampilkan di bawah div kuota per-kategori
3. **Div Status Lomba Kosong/Penuh (All-PJ)** — semua PJ bisa lihat, bukan hanya per-PJ
4. **Halaman Baru: Peserta Form Wajib yang Ikut Lomba** — route baru di bawah `pj_lomba`, dengan grafik, caching, sanitasi, akses hanya `admin_pose` & `super_admin`
5. **Batas Maks 2 Lomba per peserta Mahasiswa LP3I** (pada form wajib, saat `butuh_bukti = false`)

---

## User Review Required

> [!IMPORTANT]
> **Database baru diperlukan** — Perlu menjalankan SQL berikut di Supabase sebelum deployment:
> ```sql
> CREATE TABLE public.form_register_kampus_quota (
>     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
>     pricing_id UUID NOT NULL REFERENCES public.form_register_pricing(id) ON DELETE CASCADE,
>     nama_kampus VARCHAR(255) NOT NULL,
>     maks_team INT4 NOT NULL DEFAULT 1,
>     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
>     updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
>     CONSTRAINT form_register_kampus_quota_unique UNIQUE (pricing_id, nama_kampus)
> );
> ALTER TABLE public.form_register_kampus_quota ENABLE ROW LEVEL SECURITY;
> CREATE POLICY "public read kampus_quota" ON public.form_register_kampus_quota FOR SELECT TO public USING (true);
> CREATE POLICY "auth all kampus_quota" ON public.form_register_kampus_quota FOR ALL TO authenticated USING (true) WITH CHECK (true);
> ```
> Tabel ini menyimpan kuota per-kampus untuk setiap `pricing_id` (per kategori Mahasiswa LP3I dari tabel `form_register_pricing`).
> Kolom `maks_team` di `form_register_pricing` akan tetap menjadi **total penjumlahan** dari semua `maks_team` di `form_register_kampus_quota` untuk Mahasiswa LP3I — jadi harus diupdate otomatis saat admin input kuota kampus.

> [!WARNING]
> **Perlu konfirmasi** — Apakah limit "maks 2 lomba per peserta dari form wajib" dihitung dari semua lomba POSE, atau hanya lomba-lomba tertentu? Saya asumsikan **semua lomba POSE** yang `butuh_bukti = false`.

---

## Open Questions

- Kampus mana saja yang muncul di dropdown kuota per-kampus? Apakah menggunakan `KAMPUS_DATA` yang sudah ada di `lombaData.js`?
- Apakah `maks_team` di `form_register_pricing` perlu di-sync otomatis (auto-sum) atau diisi manual terpisah?
  - **Rekomendasi**: auto-sum dari input kampus quota saat save.

---

## Proposed Changes

---

### 1. Database (SQL — jalankan manual di Supabase)

#### [NEW] Tabel `form_register_kampus_quota`
Seperti tercantum di atas di bagian User Review.

---

### 2. API Layer

#### [MODIFY] `src/api/supabase/admin/finance.js`
- Tambah fungsi `upsertFormRegisterKampusQuota(pricingId, kampusQuotaList)` — insert/update kuota per-kampus
- Tambah fungsi `getFormRegisterKampusQuota(pricingId)` — ambil semua kuota kampus per pricing
- Tambah fungsi `getKuotaKampusByForm(formId)` — ambil semua kuota kampus untuk semua pricing dalam 1 form (join pricing + kampus_quota)

#### [NEW] `src/app/api/panitia/peserta-wajib-lomba/route.js`
- API Route baru dengan sanitasi berlapis (validasi role, validasi input, rate limiting sederhana via header check)
- Akses: hanya `admin_pose` & `super_admin`
- Query: join `peserta` (jenis_form = 'wajib') dengan `team` dan `team_members` untuk menemukan mana peserta form wajib yang juga mendaftar lomba (via NIM matching)
- Response: data per peserta — nama, kampus, nim, lomba yang diikuti (array), total lomba

#### [MODIFY] `src/api/supabase/public/peserta.js`
- Tambah fungsi `checkWajibPesertaLombaCount(nim, kampus)` — cek berapa lomba yang sudah diikuti oleh NIM tertentu dari form wajib (return: array lomba & count)
- Tambah fungsi `getFormRegisterKampusQuotaPublic(formId, kampus)` — ambil kuota kampus tertentu untuk form tertentu (untuk validasi di form publik)
- Tambah fungsi `getTeamCountsByFormAndKampus(kodeForm, kampus)` — hitung tim yang sudah terdaftar untuk form + kampus tertentu

---

### 3. Form Pembuatan Form (`app/panitia/form/form/page.js`)

#### [MODIFY] `src/app/panitia/form/form/page.js`
- Pada bagian **Pengaturan Kategori Pendaftar** untuk kategori `Mahasiswa LP3I`, tambahkan sub-section **"Kuota Per Kampus"**:
  - Toggle on/off untuk mengaktifkan fitur kuota per-kampus
  - Input kuota per kampus (menggunakan daftar kampus dari `KAMPUS_DATA` di `lombaData.js`)
  - `maks_team` pada form pricing otomatis di-sum dari total semua kampus jika fitur aktif
- State baru: `kampusQuotaEnabled`, `kampusQuotaMap` (object: { kampus: maks_team })
- Saat save, setelah `upsertFormRegisterPricing`, panggil `upsertFormRegisterKampusQuota` untuk pricing Mahasiswa LP3I

---

### 4. Form Publik (`components/public/FormRegistration.js`)

#### [MODIFY] `src/components/public/FormRegistration.js`
- Tambah validasi batas **maks 2 lomba** saat `kategori === 'Mahasiswa LP3I'` dan `!requiresBukti` (form wajib, butuh_bukti = false):
  - Saat mount/submit, panggil `checkWajibPesertaLombaCount(nim, kampus)`
  - Jika count >= 2, tampilkan warning/block pendaftaran
- Tambah validasi kuota per-kampus:
  - Saat `kategori === 'Mahasiswa LP3I'` dan ada kampus dipilih, panggil `getTeamCountsByFormAndKampus(kodeForm, kampus)` untuk cek apakah kuota kampus sudah penuh
  - Tampilkan badge status per kampus (jika tersedia)

---

### 5. AdminPesertaRegister (`components/panitia/AdminPesertaRegister.js`)

#### [MODIFY] `src/components/panitia/AdminPesertaRegister.js`

**A. Div Kuota Per-Kampus (baru, di bawah div kuota per-kategori)**
- State baru: `kampusQuotaData` (array of { pricing_id, nama_kampus, maks_team, registered })
- Fetch saat `activeForm?.id` berubah via `getKuotaKampusByForm(activeForm.id)`
- Hitung `registeredPerKampus` dari `data` yang sudah difilter: group tim berdasarkan `peserta[0].kampus`
- Tampilkan grid card per kampus (nama kampus, tim terdaftar / maks, progress bar, badge Penuh/Sisa)

**B. Div Status Semua Lomba (Kosong/Penuh) — visible untuk semua PJ**
- Fetch semua `registerForms` (sudah ada di state)
- Fetch pricing semua form sekaligus (via `getFormRegisterPricingAdmin` per form atau query batch)
- Hitung `teamCountsAllLomba` dari `data` yang tidak difilter (semua data tim pose)
- Tampilkan card/table per lomba: nama lomba, total kategori, status Penuh/Tersedia
- **Tidak difilter berdasarkan lockedLomba** — semua PJ bisa lihat semua lomba
- Letakkan di bawah div kuota per-kampus (section terpisah dengan header jelas)

---

### 6. Halaman Baru: Peserta Wajib Ikut Lomba

#### [NEW] `src/app/panitia/pj_lomba/peserta_wajib/page.js`
- Page sederhana yang mount komponen `AdminPesertaWajibLomba`
- Metadata: title "Peserta Wajib & Lomba | Portal Kampus"

#### [NEW] `src/components/panitia/AdminPesertaWajibLomba.js`
- Guard akses: hanya `admin_pose` & `super_admin` (redirect/block jika role lain)
- Caching: localStorage dengan cache key `peserta_wajib_lomba_cache` + TTL
- Fetch dari API route `/api/panitia/peserta-wajib-lomba`
- Grafik-grafik (menggunakan `react-chartjs-2`):
  1. **Pie Chart** — distribusi peserta: sudah ikut lomba vs belum
  2. **Bar Chart** — jumlah peserta per kampus yang sudah/belum ikut lomba
  3. **Bar Chart** — distribusi jumlah lomba yang diikuti (0, 1, 2 lomba per peserta)
- Table peserta: NIM, Nama, Kampus, Prodi, Lomba yang Diikuti (list chips), Badge (Belum/1 Lomba/2 Lomba/Melebihi)
- Filter: kampus, status (sudah/belum ikut lomba)
- Export Excel via `exportToExcel`

#### [MODIFY] `src/lib/adminRoleData.js`
- Tambah route `/panitia/pj_lomba/peserta_wajib` ke permission `admin_pose` & `super_admin`

#### [MODIFY] `src/app/panitia/layout.js`
- Tambah NavLink baru di dalam menu `pj_lomba`:
  ```jsx
  <NavLink href="/panitia/pj_lomba/peserta_wajib" icon={Users} label="Peserta Wajib & Lomba" colorTheme="violet" />
  ```

---

## Verification Plan

### SQL (Manual)
- Jalankan SQL tabel baru di Supabase dashboard sebelum mulai coding

### Manual Verification
1. Buka form pembuatan → kategori Mahasiswa LP3I → aktifkan kuota per kampus → isi kuota → save → cek tabel `form_register_kampus_quota`
2. Buka form publik sebagai Mahasiswa LP3I → pilih kampus yang sudah penuh → harus ter-block
3. Buka form publik → daftar 2 lomba via form wajib → coba daftar ke-3 → harus ter-block
4. Buka `AdminPesertaRegister` → cek div kuota per-kampus muncul di bawah div kuota per-kategori
5. Buka `AdminPesertaRegister` sebagai PJ Lomba Badminton → div status semua lomba harus tetap muncul (tidak difilter)
6. Buka `/panitia/pj_lomba/peserta_wajib` → harus muncul untuk `admin_pose` dan `super_admin`, dan ter-block untuk `admin_pose_lomba_*`
7. Cek grafik dan tabel tampil dengan benar dan export Excel berjalan

# 4 comments
sqlCREATE TABLE public.form_register_kampus_quota (    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(...
oke aku sudah menjalankan sql ini

Perlu konfirmasi — Apakah limit "maks 2 lomba per peserta dari form wajib" dihitung dari semua lomba...
ya untuk semua lomba

Kampus mana saja yang muncul di dropdown kuota per-kampus? Apakah menggunakan KAMPUS_DATA yang sudah...
ya pakai KAMPUS_DATA

Apakah maks_team di form_register_pricing perlu di-sync otomatis (auto-sum) atau diisi manual terpis...
ya auto-sum aja 