# Task 54 Revisi 1 — Bug Fixes & Revisions

Perbaikan 5 bug dan 5 revisi fitur pada Portal Kampus 2026 yang mencakup: sistem komisi sales, upload bukti pembayaran, form register publik, validasi API, dan fitur cetak PDF/Excel halaman sales.

---

## Open Questions

> [!IMPORTANT]
> **Revisi 1 — Header di halaman Sales Riwayat:** Apakah header yang dimaksud persis sama dengan dashboard sales (stat cards + chart) atau hanya header info ringkas saja (total komisi, jumlah sales)?

---

## Proposed Changes

### 🐛 BUG 1 — Nominal Income Transaksi Selalu Stuck di Rp 150.000

**Root Cause:** Pada saat form register publik dikonfirmasi, sistem finance otomatis membuat `transaction_finance` dengan nominal yang di-hardcode atau berasal dari field yang salah (kemungkinan `formConfig.nominal` selalu 150.000 terlepas dari kategori). Perlu ditelusuri di mana auto-insert transaksi income dipanggil saat peserta mendaftar.

---

#### [MODIFY] [peserta.js (public API)](file:///c:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/src/api/supabase/public/peserta.js)

Cari fungsi `insertPeserta` / `insertPesertaBatch`. Pastikan nominal yang diteruskan ke transaction_finance berasal dari `form_register_pricing[kategori].nominal`, bukan dari `form_register.nominal`.

**Perubahan:**
- Tambahkan fetch `form_register_pricing` berdasarkan `form_id` + `kategori` saat insert peserta  
- Gunakan `pricing.nominal` sebagai nominal transaksi income, bukan `formConfig.nominal`

---

### 🐛 BUG 2 — Gambar Bukti Pembayaran Crash / Tidak Muncul di Storage

**Root Cause:** Setelah kompresi dengan `sharp`, file `.gif` tetap menjadi GIF, namun ekstensi file dari `file-type` bisa mengembalikan `gif` tapi MIME-type setelah kompresi tidak diperbarui. Kemungkinan ada mismatch antara MIME-type dan buffer setelah kompresi.

#### [MODIFY] [storage.js](file:///c:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/src/api/supabase/storage.js)

**Perubahan:**
- Setelah `compressImage`, gunakan `fileTypeFromBuffer(buffer)` ulang untuk mendapatkan MIME-type yang akurat dari buffer hasil kompresi
- Jika kompresi mengubah format (contoh PNG → JPEG karena fallback), update `fileExt` dan `contentType` dari hasil re-detection
- Tambahkan guard: jika `fileTypeResult` setelah kompresi null, fallback ke MIME-type asli
- Khusus untuk `image/gif`: skip kompresi resize agar tidak merusak frame animasi, atau konversi ke PNG statis secara eksplisit

---

### 🐛 BUG 3 — Halaman Sales: Persen Komisi Masih 0

**Root Cause:** Pada `getSalesRiwayatDetail` di `admin/sales.js`, `pricingMap` diindex dengan `form_id` tanpa mempertimbangkan kategori. Selain itu, pengambilan `form_register_pricing` tidak menyertakan kolom `kategori` sehingga ketika ada beberapa harga per form (untuk berbagai kategori), sistem hanya mengambil satu record saja (tanpa filter kategori). Juga index berbasis urutan insert (`index < 3`) adalah estimasi yang tidak akurat karena transaksi bisa dari berbagai kategori.

#### [MODIFY] [admin/sales.js](file:///c:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/src/api/supabase/admin/sales.js)

**Perubahan di `getSalesRiwayatDetail`:**
- Ubah select `form_register_pricing` agar mengambil kolom `kategori` juga
- Buat index pricingMap menjadi `form_id + '_' + kategori` (composite key)
- Join ke `peserta` atau `team` untuk mendapatkan kategori payer per transaksi
- Atau: cukup ambil `nominal` dari `sales_pose.nominal` yang sudah tersimpan (sudah benar), dan hitung persen dari `nominal / pricing.nominal * 100` — ini lebih akurat karena sudah dihitung saat insert

**Solusi sederhana (lebih robust):**
```js
// persen_komisi = (item.nominal / pricing.nominal) * 100
// catatan: nominal per item sudah benar, pricing.nominal adalah harga pokok form
```

---

### 🐛 BUG 4 — Kolom Nama Tim / Tagline Hilang saat `isIndividu = true`

**Root Cause:** Di `FormRegistration.js` baris 696, blok identitas tim hanya ditampilkan ketika `!isWajib && !isIndividu`. Namun saat `isIndividu = true`, blok ini sepenuhnya disembunyikan. Padahal user tetap harus mengisi minimal nama tim, sementara tagline dan logo opsional.

**Logika saat ini:**
```js
// line 696
{!isWajib && !isIndividu && (
  // ... Nama Tim, Tagline, Logo
)}
```

#### [MODIFY] [FormRegistration.js](file:///c:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/src/components/public/FormRegistration.js)

**Perubahan:**
- Ubah kondisi render blok Identitas Tim dari `!isWajib && !isIndividu` → `!isWajib`
- Saat `isIndividu === true`: field Nama Tim tetap muncul dan wajib, namun Tagline dan Logo ditandai sebagai opsional
- Ubah `finalTeamName` di `handleSubmit`: jika `isIndividu`, gunakan nama yang diinput user (bukan auto-generate dari nama anggota)
- Ubah `finalTeamContent` jika `isIndividu`: gunakan tagline yang diinput, atau fallback ke auto-generate jika kosong

---

### 🐛 BUG 5 — `SalesRiwayatTable`: Missing `key` prop

**Root Cause:** Di `SalesRiwayatTable.js` baris 65, list item dibungkus `<>...</>` (React Fragment) tanpa `key`. Key diletakkan di `<tr>` di dalamnya, padahal seharusnya pada elemen teratas dari `filteredData.map()`.

#### [MODIFY] [SalesRiwayatTable.js](file:///c:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/src/components/panitia/SalesRiwayatTable.js)

**Perubahan:**
```diff
- return (
-   <>
-     <tr key={row.raw_key} ...>
-     {isExpanded && (<tr>...)}
-   </>
- );
+ return (
+   <React.Fragment key={row.raw_key}>
+     <tr ...>
+     {isExpanded && (<tr>...)}
+   </React.Fragment>
+ );
```
Import `React` dari `react`.

---

### ✏️ REVISI 1 — Halaman Sales Riwayat: Tambah Header Info + Tombol Print PDF/Excel

#### [MODIFY] [sales/riwayat/page.js](file:///c:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/src/app/panitia/sales/riwayat/page.js)

**Perubahan:**
- Tambah stat summary header (ringkasan: total komisi, jumlah sales) mirip dashboard
- Tambah dropdown button "Cetak Dokumen" dengan 2 opsi:
  - 📄 **Cetak PDF** → memanggil `lib/pdf/sales.js`
  - 📊 **Cetak Excel** → memanggil fungsi export Excel yang sudah ada atau buat baru

#### [NEW] [lib/pdf/sales.js](file:///c:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/src/lib/pdf/sales.js)

File baru untuk generate PDF laporan sales, dengan referensi dari `lib/pdf/absensi.js`.

**Struktur PDF (2 tabel):**
1. **Tabel Utama Sales** — kolom: No, Sumber, Nama/NIM, Total Nominal Komisi
2. **Tabel Detail Sales** — berurutan sesuai tabel utama, kolom: No, Sumber, Nama/NIM, NIM Target, Nominal, % Komisi, Nama Lomba, Tanggal

```js
export async function generateSalesPDF({
    title, site, summaryData, detailsMap, printedBy
}) { ... }
```

Catatan: `detailsMap` adalah object `{ raw_key: detailArray }` yang diambil sebelum mencetak dengan memanggil `getSalesRiwayatDetail` per baris.

---

### ✏️ REVISI 2 — Validasi Format WhatsApp

#### [MODIFY] [FormRegistration.js](file:///c:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/src/components/public/FormRegistration.js)

**Perubahan pada blok validasi (sekitar baris 287-292):**
```js
// Sebelum:
const waRegex = /^[0-9]+$/;
if (!waRegex.test(m.email_wa)) { ... }

// Sesudah:
const waRegex = /^(08|628|\+628)[0-9]{8,11}$/;
// Format: 08xxxx (min 11 digit) atau +628xxxx atau 628xxxx
if (!waRegex.test(m.email_wa)) {
  return window.alert(`Format WhatsApp tidak valid untuk ${m.nama}. Harus diawali 08 atau +628, minimal 11 digit.`);
}
```

---

### ✏️ REVISI 3 — Prodi Alumni LP3I Jadi Dropdown

#### [MODIFY] [FormRegistration.js](file:///c:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/src/components/public/FormRegistration.js)

**Perubahan (sekitar baris 853-872):**
- Ubah field Prodi untuk `isAlumniLP3I` dari `<input type="text">` menjadi `<select>` yang mengambil data dari `PRODI_DATA`
- Sama seperti pola yang sudah ada untuk `isMhsLP3I` (baris 920-941): gunakan dropdown dengan opsi "Lainnya" sebagai fallback input teks
- Tambahkan state `isProdiLainnya` handling untuk alumni juga (bisa menggunakan field `isProdiAlumniLainnya` pada member state)

**Tambah ke member state default:**
```js
{ ..., isProdiAlumniLainnya: false }
```

---

### ✏️ REVISI 4 — Kolom `id_ml` untuk Mobile Legends

#### [MODIFY] [FormRegistration.js](file:///c:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/src/components/public/FormRegistration.js)

**Kondisi tampil:** `formConfig.nama_lomba === 'Mobile Legends'`

**Perubahan:**
- Tambah state `idMl` (string) di level form (bukan per-member, karena 1 ID per team)
- Tambah input field "ID Mobile Legends" saat `nama_lomba === 'Mobile Legends'`
- Validasi: panjang `idMl` antara 4–12 karakter
- Sertakan `id_ml` ke payload `insertTeamMembers` (atau simpan ke `team` jika berlaku untuk 1 orang)

**Catatan:** Karena sudah ada SQL `alter table team_members add column id_ml varchar(20)`, maka `id_ml` disimpan per-member.
Jadi: tambah `id_ml` di state per-member, bukan di level form.

```js
// state member
{ nama: '', nim: '', ..., id_ml: '' }
```

**Validasi:**
```js
if (formConfig.nama_lomba === 'Mobile Legends') {
  for (const m of members) {
    if (!m.id_ml || m.id_ml.length < 4 || m.id_ml.length > 12) {
      return window.alert(`ID Mobile Legends ${m.nama} harus antara 4-12 karakter.`);
    }
  }
}
```

#### [MODIFY] [public/team.js](file:///c:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/src/api/supabase/public/team.js)

- Tambah `id_ml` ke `allowedKeys` di `insertTeamMembers`

#### [MODIFY] Halaman PJ Lomba (form_register atau dashboard pj_lomba)

- Jika nama_lomba === 'Mobile Legends', tampilkan kolom `id_ml` pada tabel anggota tim

---

### ✏️ REVISI 5 — Validasi Ketat API Sales (Seperti team.js)

#### [MODIFY] [public/sales.js](file:///c:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/src/api/supabase/public/sales.js)

**Perubahan (referensi pola dari `public/team.js`):**
- Tambah whitelist `allowedKeys` pada `insertSalesPose`
- Validasi tipe dan panjang field: `sumber` max 100 char, `nama_nim` max 200 char, `form_register_id` harus UUID valid
- Sanitize string (trim, tolak karakter berbahaya `<>"'/\`)
- Validasi bahwa `form_register_id` ada di database sebelum insert
- Gunakan `isValidInput` helper yang sudah ada di FormRegistration untuk konsistensi

```js
// Validasi tambahan:
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (!UUID_REGEX.test(form_register_id)) throw new Error('form_register_id tidak valid');

// Cek existensi form
const { data: formExists } = await supabaseAdmin
  .from('form_register')
  .select('id')
  .eq('id', form_register_id)
  .single();
if (!formExists) throw new Error('Form tidak ditemukan');
```

---

## Urutan Eksekusi

| # | Pekerjaan | File Utama |
|---|-----------|------------|
| 1 | **BUG 5** — Fix `key` prop SalesRiwayatTable | `SalesRiwayatTable.js` |
| 2 | **BUG 3** — Fix persen komisi | `admin/sales.js` |
| 3 | **BUG 2** — Fix upload gambar / storage | `storage.js` |
| 4 | **BUG 4** — Fix isIndividu hilangkan nama tim | `FormRegistration.js` |
| 5 | **REVISI 2** — Validasi WA format | `FormRegistration.js` |
| 6 | **REVISI 3** — Alumni LP3I prodi dropdown | `FormRegistration.js` |
| 7 | **REVISI 4** — Kolom id_ml Mobile Legends | `FormRegistration.js`, `public/team.js`, PJ halaman |
| 8 | **REVISI 5** — Validasi ketat API sales | `public/sales.js` |
| 9 | **REVISI 1** — PDF/Excel + header riwayat sales | `riwayat/page.js`, `lib/pdf/sales.js` |
| 10 | **BUG 1** — Fix nominal income transaksi | `public/peserta.js` |

## Verification Plan

### Manual Verification
- Uji coba pendaftaran dengan kategori berbeda dan cek nominal transaksi di finance
- Upload gambar (jpg, png, gif, webp) ke bukti bayar dan pastikan muncul di admin
- Pastikan % komisi muncul di halaman riwayat sales
- Tes form Mobile Legends: pastikan kolom id_ml muncul dan tersimpan
- Tes form individu: pastikan Nama Tim tetap bisa diisi
- Tes validasi WA format (08, +628)
- Tes cetak PDF sales (2 tabel) dan Excel
- Pastikan tidak ada console error "Each child should have unique key"
