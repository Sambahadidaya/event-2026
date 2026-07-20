dihalaman form public saya ingin backgroundnya langsung diambil dari SiteBackground.js dan untuk background cardformnya saya ingin sedikit transparan. 
terus untuk div from tepatnya dibagian Pembayaran & Berkas itu saya ingin pada tampilan mobile div Upload Bukti Pembayaran dan Metode Pembayaran itu sejajar kesamping bukan kebawah(Sama seperti tampilan destop)
terus untuk warna div nominal perbaiki tampilannya karna kurang enak dilihat dan juga pada kategori dosen atau umum itu nominalnya malah hilang tepatnya pada saat butuh_buktinya dipaksa true karna memang dinominalnyakan null (kosong ) oleh sebab itu saya ingin pada saat pembuatan form meskipun butuh_buktinya false tapi tetap nominalnya diatur atau diadakan agar pada saat kategori dosen atau umum nominalnya muncul.
terus saya ingin menambah kategori_pendaftar baru yaitu untuk siswa yang inputannya menjadi nama lengkap, jabatan, email_wa, nama sekolah, jurusan,semester. yang nama sekolah itu masuk datanya itu ke kolom kampus, jurusan ke kolom prodi, semester ya semester.
dan oh iya jadi saya telah menambah kolom baru ditabel peserta yaitu ;
```sql
ALTER TABLE peserta
ADD COLUMN IF NOT EXISTS semester int4;
```
jadi saya ingin logikanya gini saya ingin menghapus inputan angkatan yang ada diform dengan diganti dengan semester, yang logikanya jika semesternya <= 2 maka angkatannya adalah 2026, jika <= 4 maka angkatannya 2025, jika <= 6 maka angkatannya 2024. dan saya ingin semester ini bisa disetting atau dimaintenace dilombaData.js tepatnya dibagian Angkatan_DATA itu rubah logikanya menjadi yang aku ceritakan ini.

terus untuk generated-otomatis pada nim yang kategori dosen atau umum itu saya ingin itu jadi ciri khas atau identitas peserta bukan terus menerus dosen01/ umum01/MahasiswaUmum01 tapi memakai kombinasi antara yang aktif (dosen/umum/mahasiswaUmum/siswa)+1kata pertama pada nama+4 karakter terakhir diemail_wa jika wa maka 4karakter angka terakhir jika yang diinputkannya email maka 4huruf terakhir sebelum @. 

terus dikategori umum saya ingin merubah div checkbox div apakah anda mahasiswa menjadi div tombol swich antara kata Ya atau Tidak dengan defaultnya tidak, jika tidak maka seperti biasa jika ya maka muncul inputan tadi(yg kampus,prodi,semester), terus jika ya untuk div kampusnya saya ingin bukan dropdown tapi diisi manual 

terus untuk inputan Nama Tim / Nama Perwakilan saya ingin menjadi unique (gak boleh sama dengan yang lain) dan begitu juga pada email_wa dan aku sudah menjalankan sql ini ;
```sql
ALTER TABLE team
ADD CONSTRAINT unique_title_team UNIQUE (title);
```