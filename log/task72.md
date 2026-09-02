saya ingin membuat sertifikat otomatis yang templatenya sudah aku persiapkan difile src/assets/sertifikat_pose/template/ dan untuk contohnya ada di src/assets/sertifikat_pose/contoh/
yang mana sertifikat ini ada 3 yaitu sertifikat parstisipasi yang sertifikat ini bisa dibuat hanya dari admin keuangan saya yang bagian dashboard tepatnya diform wajib (bukan form register), jadi ditabel form wajib itu dirownya tepatnya di colom pojok kanan atas tombol cetak sertifikat. terus yang kedua sertifikat peserta dan yang ketiga sertifikat juara, yang mana sertifikat kedua dan ketiga ini bisa dibuat dihalaman src/app/pose/sertifikat/page.js yang syaratnya membuatnya harus memasukan kode_form dulu seperti pada halaman nilai tapi saya juga ingin membypas atau mempercepat sertifikat itu tanpa perlu ngisi kode_form manual yaitu membuat tombol baru dihalaman src/app/pose/dashboard/page.js seperti pada tombol submit karya dan cek nilai. terus saya ingin untuk jenis lomba kreativitas itu sertifikatnya bisa lebih dari 1 halaman yaitu halaman tambahannya untuk detail nilai yang diperoleh juri, dan setiap juri memiliki 1 halaman disertifikatnya. terus logika untuk membedakan antara yang juara dan peserta itu adalah dari tabel juara didatabase, jika ada team dari kode_form tersebut ada didatabase juara maka sertifikatnya menjadi sertifikat juara, tapi jika tidak ada maka sertifikatnya menjadi sertifikat peserta. dan oh iya sekalian tambahkan route ini nanti dihalaman sertifikatnya yaitu `PengembangBarrier site="pose" route="/sertifikat"`
dan disetiap sertifikat itukan ada qrnya nah saya ingin didalam qrnya itu ada teks lengkap dari sertifikat yang terkait seperti gini
```txt
=== VERIFIKASI SERTIFIKAT DIGITAL ===
No. Sertifikat : 
Nama Peserta   : 
Peran / Capaian: 
Kegiatan / Acara: POSE NASIONAL 2026
Bidang Lomba   : 

--- HASIL PENILAIAN ---
Juri Penilai   : 
Nilai          : 
Total Nilai    : 

--- RINCIAN KRITERIA ---
• Kesesuaian Tema (30%)       : 
• Kreativitas & Orisinalitas (25%): 
• Desain & Estetika (25%)      : 
• Kekuatan Pesan & Makna (20%) : 

Status: VALID & TERVERIFIKASI SISTEM
Penyelenggara: Politeknik LP3I Bandung
```
terus untuk kode sertifikat itu terdiri dari 
PST = peserta
PTS = partisipasi
JUR = juara
yang contohnya sesuai dengan yang dinomor sertifikat yaitu "001/SERT-PST/POSE/POLITEKNIK-LP3I/IX/2026 "
dan pada setiap sertifikat yang dibikin akan masuk ke log database yang sudah aku bikin yaitu ;
```sql
create table log_sertifikat_pose (
  id UUID primary key DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES public.team(id) ON DELETE CASCADE,
  no_sert int4,
  kode_sert VARCHAR(10),
  jenis_sert VARCHAR(50),
  keterangan_sert VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.log_sertifikat_pose ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all log_sertifikat_pose" ON log_sertifikat_pose FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

dan untuk nomber sertifikat yang 001 itu saya sudah membuat sequence pada tiap kode sertnya agar mempermudah yaitu saya sudah menjalankan sql ini ;
```sql
-- Sequence untuk SERT Partisipasi
CREATE SEQUENCE IF NOT EXISTS sert_pts_no_seq START WITH 1 INCREMENT BY 1;
ALTER SEQUENCE sert_pts_no_seq RESTART WITH 1;
-- Sequence untuk SERT Juara
CREATE SEQUENCE IF NOT EXISTS sert_jur_no_seq START WITH 1 INCREMENT BY 1;
ALTER SEQUENCE sert_jur_no_seq RESTART WITH 1;
-- Sequence untuk SERT Peserta
CREATE SEQUENCE IF NOT EXISTS sert_pst_no_seq START WITH 1 INCREMENT BY 1;
ALTER SEQUENCE sert_pst_no_seq RESTART WITH 1;
```

dan sesuaikan saja dengan database yang ada.
terus saya ingin sertifikat ini ingin dari components baru dan api baru juga yang untuk apinya saya ingin berupa server action yang di src/api/
bacalah seluruh file yang relevan agar hasilnya sesuai dengan yang diharapkan dan tidak cuman asumsi.