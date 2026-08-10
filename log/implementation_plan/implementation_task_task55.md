# Task 55 — Tahapan Pengerjaan

> Konfirmasi user:
> - ✅ SQL sudah dijalankan (`form_register_kampus_quota`)
> - ✅ Limit 2 lomba dihitung dari **semua lomba POSE** dengan `butuh_bukti = false`
> - ✅ Kampus dropdown pakai `KAMPUS_DATA` dari `lombaData.js`
> - ✅ `maks_team` di `form_register_pricing` = auto-sum dari kuota per-kampus

---

## TAHAP 1 — API Layer (Backend Foundation)

- `[ ]` **1.1** Tambah 3 fungsi baru di `src/api/supabase/admin/finance.js`:
  - `upsertFormRegisterKampusQuota(pricingId, kampusQuotaList)` — insert/upsert kuota per-kampus
  - `getFormRegisterKampusQuota(pricingId)` — ambil kuota kampus untuk 1 pricing
  - `getKuotaKampusByForm(formId)` — ambil semua kuota kampus untuk semua pricing dalam 1 form (join `form_register_pricing` + `form_register_kampus_quota`)

- `[ ]` **1.2** Tambah 3 fungsi baru di `src/api/supabase/public/peserta.js`:
  - `getFormRegisterKampusQuotaPublic(formId, kampus)` — kuota kampus untuk form tertentu (public, untuk validasi form pendaftaran)
  - `getTeamCountsByFormAndKampus(kodeForm, kampus)` — hitung tim terdaftar per-kampus per-form
  - `checkWajibPesertaLombaCount(nim, kampus)` — cek berapa lomba (butuh_bukti=false) yang sudah diikuti peserta berdasarkan NIM & kampus dari data `team_members`

- `[ ]` **1.3** Buat API Route baru `src/app/api/panitia/peserta-wajib-lomba/route.js`:
  - Method: `GET`
  - Sanitasi berlapis: validasi session (Supabase SSR), cek role (`admin_pose` / `super_admin`), sanitasi query params
  - Logic: ambil semua `peserta` (jenis_form='wajib') → join dengan `team_members` by NIM → hasilkan data per peserta (nama, nim, kampus, list lomba yang diikuti, total lomba)
  - Response: JSON `{ data: [...], total, meta }`

---

## TAHAP 2 — Form Pembuatan Form (Admin)

- `[ ]` **2.1** Tambah state baru di `src/app/panitia/form/form/page.js`:
  - `kampusQuotaEnabled` (boolean, per kategori) — toggle aktif/nonaktif fitur kuota kampus
  - `kampusQuotaMap` (object: `{ [kampus]: maks_team }`) — input kuota per-kampus

- `[ ]` **2.2** Tambah UI kuota per-kampus di dalam card **Mahasiswa LP3I** (di modal buat form):
  - Toggle switch **"Aktifkan Kuota Per Kampus"**
  - Jika aktif: tampilkan input maks_team untuk setiap kampus dari `KAMPUS_DATA`
  - Info teks: `"maks_team total akan otomatis dihitung dari penjumlahan semua kampus"`
  - `maks_team` di state utama (pricing) di-override oleh total-sum kampus quota

- `[ ]` **2.3** Update `handleCreateForm` — setelah `upsertFormRegisterPricing` sukses, panggil `upsertFormRegisterKampusQuota` untuk pricing Mahasiswa LP3I jika fitur kuota kampus aktif. Auto-update `maks_team` di pricing = sum semua kampus.

---

## TAHAP 3 — Form Publik (Validasi)

- `[ ]` **3.1** Update `src/components/public/FormRegistration.js` — tambah state & fetch:
  - State: `kampusQuotaInfo` (kuota kampus untuk form aktif)
  - State: `wajibLombaCount` (jumlah lomba yang sudah diikuti peserta via NIM — di-fetch saat NIM berubah, hanya untuk Mahasiswa LP3I + butuh_bukti=false)
  - Fetch `getFormRegisterKampusQuotaPublic` jika kategori = Mahasiswa LP3I

- `[ ]` **3.2** Tambah validasi saat submit:
  - **Cek kuota kampus**: Jika kategori = Mahasiswa LP3I dan kampus sudah penuh (dari `getTeamCountsByFormAndKampus`), blok submit dengan pesan jelas
  - **Cek maks 2 lomba**: Jika `!requiresBukti` (form wajib, butuh_bukti=false) dan `wajibLombaCount >= 2`, blok submit dengan pesan "Anda sudah mendaftar maksimal 2 lomba"

- `[ ]` **3.3** Tampilkan UI feedback:
  - Badge status kuota kampus di samping dropdown pilih kampus (Tersedia / Hampir Penuh / Penuh)
  - Warning banner jika peserta sudah ikut 1 lomba: "Anda sudah mendaftar 1 lomba, sisa kuota 1 lomba lagi"
  - Error banner jika sudah 2 lomba: "Kuota lomba Anda sudah penuh (maks 2 lomba)"

---

## TAHAP 4 — AdminPesertaRegister (2 Div Baru)

- `[ ]` **4.1** Tambah state & data fetch di `src/components/panitia/AdminPesertaRegister.js`:
  - State: `kampusQuotaData` — hasil `getKuotaKampusByForm(activeForm.id)`
  - State: `allLombaStatusData` — semua form register + pricing + count tim (untuk div status semua lomba)
  - Hitung `registeredPerKampus` dari `data` (tim yang terfilter): group by `peserta[0].kampus`

- `[ ]` **4.2** Tambah **Div Kuota Per-Kampus** (tepat di bawah div kuota per-kategori):
  - Tampil hanya jika ada data `kampusQuotaData` & form aktif
  - Grid card per kampus: nama kampus, tim terdaftar / maks, progress bar, badge Penuh/Sisa
  - Style konsisten dengan div kuota per-kategori yang sudah ada

- `[ ]` **4.3** Tambah **Div Status Semua Lomba** (di bawah div kuota per-kampus):
  - **Tidak difilter oleh `lockedLomba`** — semua PJ bisa lihat semua lomba
  - Fetch pricing semua form yang ada di `registerForms` (load on-demand saat section ini di-render)
  - Tampilkan card/row per lomba: nama lomba, kategori, tim terdaftar / total kuota, status global (Tersedia / Hampir Penuh / Penuh)
  - Kelompokkan per jenis lomba (Olahraga / Kreativitas / dll)

---

## TAHAP 5 — Halaman Baru: Peserta Wajib & Lomba

- `[ ]` **5.1** Buat `src/app/panitia/pj_lomba/peserta_wajib/page.js`:
  - Import `AdminPesertaWajibLomba`
  - Metadata SEO lengkap

- `[ ]` **5.2** Buat `src/components/panitia/AdminPesertaWajibLomba.js`:
  - **Guard akses**: cek role via `getCurrentAdmin()` — hanya `admin_pose` & `super_admin`, yang lain tampilkan halaman 403
  - **Caching**: localStorage key `peserta_wajib_lomba_cache` + TTL 5 menit
  - **Fetch**: call API route `/api/panitia/peserta-wajib-lomba`
  - **3 Grafik** (Chart.js + react-chartjs-2):
    1. **Doughnut Chart** — distribusi Belum Ikut Lomba / Ikut 1 Lomba / Ikut 2 Lomba
    2. **Bar Chart (horizontal)** — jumlah peserta per kampus yang sudah ikut lomba
    3. **Bar Chart** — distribusi lomba: berapa peserta di tiap lomba yang berasal dari form wajib
  - **Tabel peserta**: NIM, Nama, Kampus, Prodi, Lomba Diikuti (chip/badge), Status
  - **Filter**: dropdown kampus, dropdown status (Semua/Belum Ikut/Ikut 1/Ikut 2)
  - **Export Excel** via `exportToExcel`
  - **Tombol Refresh** dengan invalidasi cache

- `[ ]` **5.3** Update `src/lib/adminRoleData.js`:
  - Tambah `/panitia/pj_lomba/peserta_wajib` ke permission `admin_pose` & `super_admin`
  - **Jangan tambahkan** ke permission `admin_pose_lomba_*` (PJ per-lomba tidak boleh akses)

- `[ ]` **5.4** Update `src/app/panitia/layout.js`:
  - Tambah NavLink baru di dalam collapse menu `pj_lomba`:
    ```jsx
    <NavLink href="/panitia/pj_lomba/peserta_wajib" icon={Users} label="Peserta Wajib & Lomba" colorTheme="violet" />
    ```
  - Tampil hanya untuk `admin_pose` & `super_admin` (kondisi `hasAccess`)

---

## Urutan Pengerjaan Aktual

```
Tahap 1 (API) → Tahap 2 (Form Buat) → Tahap 3 (Form Publik) → Tahap 4 (Admin Register) → Tahap 5 (Halaman Baru)
```

Setiap tahap bersifat **independen** kecuali Tahap 3, 4, 5 yang bergantung pada fungsi API dari Tahap 1.
