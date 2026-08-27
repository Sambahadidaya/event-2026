# Fix Bug Sinkronisasi Income Keuangan POSE — Planning Final

## Pemahaman Penuh Codebase (Setelah Baca Semua File)

### Arsitektur Flow Pendaftaran POSE

```
[Form Wajib] → /pose/form/[link_id] → FormWajib.js
   → insertPeserta() → peserta {jenis_form:'wajib', status:'pending'}

[Form Register Normal] → /pose/register/[id] → FormRegister.js
   → insertPeserta() → peserta {jenis_form:'register', status:'pending'}

[Form Register Lanjut] → /pose/register/lanjut/[id] → FormRegisterLanjutStandalone.js
   → submitRegisterLanjut() → insertTeamPublic() + insertTeamMembers() + insertPesertaBatch()
   → SATU peserta per anggota, semua dengan kode_form yang SAMA (generateKodePeserta)
   → SATU bukti_bayar yang sama untuk semua anggota tim (upload 1 file, URL-nya dikirim ke semua)
```

### Konfirmasi Jawaban Open Questions (dari baca kode)

**Q1: Siapa upload bukti bayar untuk peserta team?**  
→ **SATU bukti bayar** yang diupload oleh pendaftar pertama (`buktiUrl`) dan dikirim ke **semua peserta** dalam batch via `insertPesertaBatch`. Semua anggota tim punya `bukti_bayar` yang **sama persis** (URL yang sama).

**Q2: Nominal potongan tersimpan ke peserta.nominal atau dihitung ulang?**  
→ **TIDAK tersimpan** ke `peserta.nominal` — field `nominal` tidak ada dalam `allowedKeys` di `insertPeserta/insertPesertaBatch`. Nominal **selalu dihitung ulang** dari `form_register_pricing` + logika potongan kreativitas.

---

## Bug yang Dikonfirmasi + Root Cause Final

### Bug 1 & 4 — Income Peserta 2 Form Tidak Sync (WAJIB + REGISTER)

**Flow yang terjadi:**
1. Peserta (NIM=12345) isi Form Wajib → DB: `peserta {nim:'12345', jenis_form:'wajib', kode_form:'FW001-1234'}`
2. Admin verifikasi form wajib → `updateStatusPembayaranPeserta` → `autoCreateTransactionFromPeserta(peserta_wajib)` → `kode_payer = '12345'` → transaksi TF dibuat ✅
3. Peserta yang SAMA (NIM=12345) ikut form register → `peserta {nim:'12345', jenis_form:'register', kode_form:'FR001-5678'}`
4. Admin verifikasi form register → `autoCreateTransactionFromPeserta(peserta_register)` → `kode_payer = '12345'` → **Deduplication check: kode_payer '12345' sudah ada di DB!** → Return `duplicate: true` → ❌ Income form register TIDAK masuk

**Root Cause:** `kode_payer` menggunakan NIM saja, bukan kombinasi NIM + kode_form. Satu NIM hanya bisa punya 1 income.

---

### Bug 2 — Income Bertumpuk untuk Peserta Team (Non-LP3I)

**Flow yang terjadi (Lomba Team, Kategori Umum/Dosen):**
1. Tim mendaftar → `submitRegisterLanjut` → `insertPesertaBatch` dengan 3 anggota
   - Anggota A: `{nim: 'NIM_A', bukti_bayar: 'url_sama', kode_form: 'FR001-9999'}`
   - Anggota B: `{nim: 'NIM_B', bukti_bayar: 'url_sama', kode_form: 'FR001-9999'}`
   - Anggota C: `{nim: 'NIM_C', bukti_bayar: 'url_sama', kode_form: 'FR001-9999'}`

2. Admin verifikasi satu per satu:
   - Verifikasi Anggota A → `kode_payer='NIM_A'` → tidak ada di TF → ✅ Insert TF (Income +X)
   - Verifikasi Anggota B → `kode_payer='NIM_B'` → tidak ada di TF → ✅ Insert TF lagi! (Income +X lagi)
   - Verifikasi Anggota C → `kode_payer='NIM_C'` → tidak ada di TF → ✅ Insert TF lagi! (Income +X lagi!)

**Seharusnya:** Satu tim = satu pembayaran = satu income. Tapi karena NIM berbeda, deduplication tidak bekerja.

**Root Cause:** `kode_form` yang sama (satu tim = satu `kode_form`) tidak digunakan sebagai basis deduplication. Solusinya: per `kode_form` hanya boleh ada 1 transaksi income (karena satu kode_form = satu tim = satu bukti bayar).

---

### Bug 3 — Nominal 45k Terus di Dashboard

**Flow:**
1. `AdminKeuanganDashboard` → `getPesertaLunas('pose')` → server sudah hitung `calculatedNominal` dengan benar (pricing per kategori + kreativitas discount)
2. Data dikembalikan dengan `nominal: calculatedNominal` ✅
3. `KeuanganTabelVerifikasi.getNominal(peserta)` dipanggil untuk tampilkan nominal:

```js
// KODE SAAT INI (SALAH):
const getNominal = (peserta) => {
    if (peserta.nominal || peserta.nominal_pembayaran) {
        return peserta.nominal || peserta.nominal_pembayaran || 0;
    }
    // ... fallback ke formRegisterMap
}
```

**Root Cause:** `peserta.nominal` dari server adalah `calculatedNominal` yang sudah benar. Namun kondisi `if (peserta.nominal || peserta.nominal_pembayaran)` **gagal** karena JavaScript mengevaluasi `0` sebagai falsy. 

Kalau peserta Mahasiswa LP3I yang ikut Kreativitas SETELAH bayar wajib → `calculatedNominal = 0` (karena harga normal - wajib nominal = 0). Kondisi `if (0)` → false → lanjut ke fallback → ambil dari `formRegisterMap` → ambil `nominal` default form (misal 45000) → **tampil 45000 padahal seharusnya 0!**

---

## Proposed Changes (Final, Setelah Baca Penuh Codebase)

### File yang Diubah

| File | Jenis | Perubahan |
|------|-------|-----------|
| [`finance.js`](file:///c:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/src/api/supabase/admin/finance.js) | MODIFY | Fix kode_payer + deduplication logic |
| [`KeuanganTabelVerifikasi.js`](file:///c:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/src/components/panitia/KeuanganTabelVerifikasi.js) | MODIFY | Fix getNominal() |

**File yang TIDAK diubah (sudah benar, aman):**
- `src/api/supabase/public/peserta.js` — `insertPeserta`, `insertPesertaBatch` sudah benar
- `src/api/supabase/public/register_lanjut.js` — `submitRegisterLanjut` sudah benar
- `src/components/public/FormRegisterLanjutStandalone.js` — UI & submit sudah benar
- `src/components/public/FormWajib.js` — sudah benar
- `src/components/public/FormRegister.js` — sudah benar
- `src/api/supabase/admin/peserta.js` — `getPesertaKeuangan`, `getPesertaLunas`, `updateStatusPembayaranPeserta` sudah benar

---

## Detail Perubahan

### 1. `finance.js` — Fungsi `autoCreateTransactionFromPeserta`

#### 1a. Ubah Format `kode_payer` (Fix Bug 1 & 4)

**Lokasi:** [`finance.js` L446–464](file:///c:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/src/api/supabase/admin/finance.js#L446-L464)

```js
// === SEBELUM (SALAH) ===
const site = peserta.site_type || 'pkkmb';
let kodePayer = peserta.nim || peserta.email_wa || peserta.nama;

if (site === 'pkkmb' && peserta.jenis_form === 'wajib' && peserta._pembayaran_tahapan) {
    kodePayer = `${peserta.nim}-${peserta._pembayaran_tahapan}`;
}

// === SESUDAH (BENAR) ===
const site = peserta.site_type || 'pkkmb';
const rawKodeForm = peserta.kode_form;
const kodeFormBase = rawKodeForm
    ? (rawKodeForm.length > 4 ? rawKodeForm.slice(0, -4) : rawKodeForm)
    : null;

let kodePayer;
if (site === 'pkkmb' && peserta.jenis_form === 'wajib' && peserta._pembayaran_tahapan) {
    // PKKMB bertahap — format lama tetap dipertahankan
    kodePayer = `${peserta.nim}-${peserta._pembayaran_tahapan}`;
} else if (site === 'pose') {
    // POSE: unik per form (NIM + kodeFormBase) agar peserta yang ikut 2 form berbeda bisa punya 2 income
    const identifier = peserta.nim || peserta.email_wa || peserta.nama;
    kodePayer = kodeFormBase
        ? `${identifier}_${kodeFormBase}`
        : `${identifier}_${peserta.jenis_form || 'form'}`;
} else {
    // PKKMB non-bertahap
    kodePayer = peserta.nim || peserta.email_wa || peserta.nama;
}
```

#### 1b. Deduplication Check untuk POSE (Fix Bug 2 — Team Double Income)

**Lokasi:** [`finance.js` L458–484](file:///c:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/src/api/supabase/admin/finance.js#L458-L484)

Setelah format `kode_payer` baru (`NIM_A_FR001`, `NIM_B_FR001`, dll), deduplication per NIM sudah tidak menjadi masalah untuk Bug 1&4. Tapi untuk Bug 2 (team), masih perlu menambahkan **cek per `kode_form`** — karena satu `kode_form` = satu tim = satu bukti bayar = **hanya boleh 1 income**.

```js
// === TAMBAHKAN CHECK INI SETELAH kode_payer ditetapkan, untuk POSE REGISTER TEAM ===
if (site === 'pose' && peserta.jenis_form === 'register' && kodeFormBase) {
    // Cek: sudah ada transaksi untuk kode_form ini?
    // Ini mencegah income berganda untuk tim yang anggotanya diverifikasi satu per satu
    const { data: existingByKodeForm } = await supabaseAdmin
        .from('transaction_finance')
        .select('id')
        .eq('site', 'pose')
        .ilike('kode_payer', `%_${kodeFormBase}`)  // match semua anggota tim yg sama
        .limit(1);

    if (existingByKodeForm && existingByKodeForm.length > 0) {
        console.log(`[Auto-Finance] Team dedup: kode_form ${kodeFormBase} sudah punya transaksi. Skip untuk ${peserta.nama}.`);
        return { success: true, duplicate: true };
    }
}
```

> **Catatan penting:** Check `ilike kode_payer '%_${kodeFormBase}'` akan mencocokkan semua anggota tim karena format kode_payer-nya adalah `NIM_KODEFORMBASE`. Saat anggota pertama diverifikasi → transaksi dibuat. Saat anggota ke-2, 3, dst diverifikasi → ditemukan transaksi yang `kode_payer` berakhiran `_kodeFormBase` → skip!

#### 1c. Fix `autoDeleteTransactionFromPeserta` (Rollback Konsisten)

**Lokasi:** [`finance.js` L845–875](file:///c:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/src/api/supabase/admin/finance.js#L845-L875)

Fungsi rollback harus bisa menemukan transaksi dengan format `kode_payer` baru:

```js
// === SEBELUM (TIDAK LENGKAP) ===
const kodePayer = peserta.nim || peserta.email_wa || peserta.nama;
const { data: existing } = await supabaseAdmin
    .from('transaction_finance')
    .select('id')
    .eq('site', site)
    .or(`kode_payer.eq.${kodePayer},kode_payer.ilike.${kodePayer}-%`);

// === SESUDAH (LENGKAP, MENCAKUP FORMAT BARU) ===
const rawKodeForm = peserta.kode_form;
const kodeFormBase = rawKodeForm
    ? (rawKodeForm.length > 4 ? rawKodeForm.slice(0, -4) : rawKodeForm)
    : null;
const identifier = peserta.nim || peserta.email_wa || peserta.nama;
const newFormatKode = kodeFormBase
    ? `${identifier}_${kodeFormBase}`
    : `${identifier}_${peserta.jenis_form || 'form'}`;

// Build query yang mencakup format lama DAN format baru
const { data: existing } = await supabaseAdmin
    .from('transaction_finance')
    .select('id')
    .eq('site', site)
    .or(`kode_payer.eq.${newFormatKode},kode_payer.eq.${identifier},kode_payer.ilike.${identifier}-%`);
```

---

### 2. `KeuanganTabelVerifikasi.js` — Fungsi `getNominal()`

**Lokasi:** [`KeuanganTabelVerifikasi.js` L81–98](file:///c:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/src/components/panitia/KeuanganTabelVerifikasi.js#L81-L98)

```js
// === SEBELUM (SALAH — 0 dievaluasi false, lalu fallback ke nilai yang salah) ===
const getNominal = (peserta) => {
    if (peserta.nominal || peserta.nominal_pembayaran) {
        return peserta.nominal || peserta.nominal_pembayaran || 0;
    }
    // ... fallback ke formMap yang tidak akurat
};

// === SESUDAH (BENAR — cek null/undefined eksplisit, bukan falsy check) ===
const getNominal = (peserta) => {
    // Prioritize nilai nominal yang sudah dihitung server (getPesertaLunas sudah compute ini)
    // PENTING: cek !== null && !== undefined, bukan hanya truthy, karena nilai 0 adalah valid!
    if (peserta.nominal !== null && peserta.nominal !== undefined) {
        return Number(peserta.nominal);
    }
    if (peserta.nominal_pembayaran !== null && peserta.nominal_pembayaran !== undefined) {
        return Number(peserta.nominal_pembayaran);
    }
    // Fallback: hanya untuk case yang benar-benar tidak ada data nominal
    if (!peserta.kode_form) return 0;
    const kodeFormFull = peserta.kode_form;
    const kodeFormBase = peserta.kode_form.length > 4
        ? peserta.kode_form.slice(0, -4)
        : peserta.kode_form;

    if (peserta.jenis_form === 'wajib') {
        const match = formWajibMap[kodeFormFull] || formWajibMap[kodeFormBase];
        return match?.nominal || 0;
    }
    // Untuk register, TIDAK fallback ke form nominal (karena tergantung pricing per kategori)
    // Jika nominal tidak ada, kembalikan 0
    return 0;
};
```

---

## Catatan Backward Compatibility

> [!WARNING]
> Transaksi lama di `transaction_finance` yang sudah menggunakan format `kode_payer = NIM` (tanpa suffix kodeFormBase) **tidak akan terpengaruh** — tidak akan diupdate, tidak akan dihapus. Sistem baru hanya mempengaruhi transaksi yang dibuat setelah fix ini.
>
> Namun, jika ada peserta yang statusnya diubah ke "Pending" lalu diubah kembali ke "Lunas" setelah fix ini diaplikasikan → transaksi lama (format NIM) dan transaksi baru (format NIM_kodeForm) **akan duplikat di DB**. Untuk kasus ini, admin perlu membersihkan manual.

> [!IMPORTANT]
> **PKKMB tidak terpengaruh** — format kode_payer untuk PKKMB tetap menggunakan `NIM-tahapan` seperti sebelumnya, tidak ada perubahan untuk alur PKKMB.

---

## Verification Plan

### Skenario Test 1: Peserta isi 2 form (Bug 1 & 4)
1. Buat peserta `NIM=12345` yang sudah ada di form wajib POSE (status: pending)
2. Verifikasi form wajib → cek `transaction_finance` → harus ada 1 entry dengan `kode_payer = '12345_FW001'`
3. Peserta yang sama ada di form register → verifikasi → cek `transaction_finance` → harus ada **2 entry terpisah** (`12345_FW001` dan `12345_FR002`)
4. Total income = wajib nominal + register nominal ✅

### Skenario Test 2: Peserta team (Bug 2)
1. Tim dengan 3 anggota (NIM berbeda), kode_form sama `FR001-XXXX`
2. Verifikasi anggota A → cek `transaction_finance` → 1 entry (`NIMA_FR001`) ✅
3. Verifikasi anggota B → cek log → harusnya muncul log `[Auto-Finance] Team dedup: kode_form FR001 sudah punya transaksi`
4. Verifikasi anggota C → sama, skip
5. Total income = hanya 1x nominal tim ✅

### Skenario Test 3: Nominal 45k di dashboard (Bug 3)
1. Cek dashboard keuangan bagian tabel "Form Register" tab
2. Peserta Mahasiswa LP3I yang ikut Kreativitas SETELAH bayar wajib → nominal harus **0** (atau `harga_kreativitas - wajib_nominal`)
3. Peserta kategori lain → nominal sesuai pricing per kategori ✅

### Skenario Test 4: Rollback (delete/tolak lalu verifikasi ulang)
1. Verifikasi peserta → ada income di TF
2. Ubah status ke Pending → income di TF harus terhapus (rollback)
3. Verifikasi ulang → income muncul lagi ✅

### Skenario Test 5: Tidak merusak PKKMB
1. Verifikasi peserta PKKMB → format kode_payer tetap `NIM` (bukan bertahap) atau `NIM-tahapan` (bertahap)
2. Tidak ada double income / missing income untuk PKKMB ✅
