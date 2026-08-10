# Walkthrough — Task 54 (Sistem Sales POSE)

Seluruh pengerjaan coding untuk Task 54 telah selesai diimplementasikan sesuai rencana.

---

> [!IMPORTANT]
> **PERINTAH SQL WAJIB DIJALANKAN:**
> Karena sistem sales ini membutuhkan link antara data referal (`sales_pose`) dan target pendaftar (peserta), mohon jalankan SQL ALTER TABLE berikut di Supabase SQL Editor Anda agar tabel `sales_pose` memiliki kolom `target_nim`:
> ```sql
> ALTER TABLE sales_pose ADD COLUMN target_nim VARCHAR(100);
> ```

---

## 🛠️ Ringkasan Perubahan File

Berikut adalah 11 file yang telah dibuat dan dimodifikasi:

### 1. API Layer (Public & Admin)
- **[NEW]** [`src/api/supabase/public/sales.js`](file:///c:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/src/api/supabase/public/sales.js) — Mengatur entry sales baru saat public register dengan kalkulasi nominal komisi otomatis berdasarkan level (lvl 1, lvl 2, lvl 3).
- **[NEW]** [`src/api/supabase/admin/sales.js`](file:///c:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/src/api/supabase/admin/sales.js) — Mengatur action admin untuk mengambil summary (grouped per identitas), detail riwayat (expandable), hapus entri, dan grafik dashboard.
- **[MODIFY]** [`src/api/supabase/admin/finance.js`](file:///c:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/src/api/supabase/admin/finance.js) — Update `upsertFormRegisterPricing` untuk menyimpan persentase komisi lvl 1-3. Update `autoCreateTransactionFromPeserta` agar jika ada potongan sales, sistem otomatis membuat **4 entry jurnal** (Asset, Revenue, Beban Komisi, Utang Komisi) alih-alih 2 entry.

### 2. Panel Admin & Pembuatan Form
- **[MODIFY]** [`src/app/panitia/form/form/page.js`](file:///c:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/src/app/panitia/form/form/page.js) — Menambahkan opsi "Alumni LP3I" pada form builder pendaftaran, serta input persentase komisi Level 1, 2, dan 3 per kategori pendaftar.
- **[MODIFY]** [`src/lib/adminRoleData.js`](file:///c:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/src/lib/adminRoleData.js) — Menambahkan route `/panitia/sales/dashboard` dan `/panitia/sales/riwayat` ke permissions `admin_pose`.
- **[MODIFY]** [`src/app/panitia/layout.js`](file:///c:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/src/app/panitia/layout.js) — Menambahkan menu navigasi "Sales & Referral" pada sidebar layout panitia.

### 3. Form Pendaftaran Publik
- **[MODIFY]** [`src/components/public/FormRegistration.js`](file:///c:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/src/components/public/FormRegistration.js) — 
  - Mendukung kategori baru **Alumni LP3I** (input prodi dan angkatan, tanpa limitasi tahun angkatan minimal).
  - Menambahkan section dropdown **Sumber Informasi Lomba** (`SUMBER_LOMBA`) untuk kategori Alumni, Siswa, dan Umum.
  - Sub-input dinamis & kondisional (Nama Dosen/Manajemen, atau NIM Panitia/Mahasiswa).
  - Integrasi insert data ke tabel `sales_pose` secara background saat pendaftaran berhasil disubmit.

### 4. Halaman & Komponen Sales (Panitia)
- **[NEW]** [`src/components/panitia/SalesChart.js`](file:///c:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/src/components/panitia/SalesChart.js) — Komponen visualisasi grafik (Bar, Doughnut, Line) berbasis Chart.js.
- **[NEW]** [`src/components/panitia/SalesRiwayatTable.js`](file:///c:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/src/components/panitia/SalesRiwayatTable.js) — Komponen tabel riwayat yang bersih dengan baris expandable untuk menampilkan detail transaksi referral.
- **[NEW]** [`src/app/panitia/sales/dashboard/page.js`](file:///c:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/src/app/panitia/sales/dashboard/page.js) — Halaman dashboard sales modern lengkap dengan 4 stat cards dan 3 grafik representatif.
- **[NEW]** [`src/app/panitia/sales/riwayat/page.js`](file:///c:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/src/app/panitia/sales/riwayat/page.js) — Halaman panel riwayat sales panitia yang mendukung pencarian, filter per cabang lomba, dan aksi hapus data.
