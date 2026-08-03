saya ingin membuat halaman baru yaitu untuk absen panitia yang nama foldernya absensi_panitia terus didalamnya ada 3 halaman yaitu folder dashboard,form, dan absensi. yang posisi layoutnya itu berada diatas pj_lomba. terus saya ingin data yang dimuat itu sesuai dengan role admin yang login, dan role admin ini juga saya ingin membuat lagi yaitu admin_pkkmb_sekretaris dan admin_pose_sekretaris, dan halaman ini hanya bisa diakses oleh kedua itu dan juga oleh ketua (admin_pkkmb/admin_pose), dan juga oleh super_admin. terus untuk tampilan halaman buatkan semodern mungkin.
yang detailnya seperti ini, untuk halaman dashboard saya ingin ada recap banyak grafiknya, dan dibawahnya ada tabel yaitu untuk melihat panitia yang terdiri dari kolom no,nama,total hadir,total izin,total sakit, dan total alpha. terus ketika menekan atau mengklik salah satu row panitianya maka akan muncul tabel lagi dibawahnya yaitu untuk menampilkan detail absen panitianya. terus untuk halaman form ini adalah form untuk membuat form absensinya yang hanya berupa memasukan nama form absennya tapi untuk site itu difikskan sesuai dengan admin yang login kecuali kalau super_admin bisa memilih. dan membuat form ini berupa modal yang ketika menekan tambah form terus dibawahnya ada tabel hasil form yang sudah dibuat berupa kolom no, site, judul absen, dan tanggal dibuat, dan ada tombol edit dan delete. 
terus untuk halaman absensi itu adalah halaman yang untuk mengabsen panitianya yang untuk mengabsen ini juga berupa modal yang terdiri dari kolom judul absensi (yang dibuat diform), nama panitia, jenis absen, keterangan absen, untuk nama panitia itu berupa dropdown tapi bisa disearch dan ketika mengetik namanya langsung terfilter, dan begitu juga untuk jenis absennya sama seperti saat mau input nama panitia, dan kalau untuk input keterangan itu berupa text area yang maksimal input karakternya 150saja. dan ketika menekan tombol save itu akan langsung tersimpan ke database dan dihalaman absensi ini juga ada tabel yang menampilkan riwayat absen yang terdiri dari kolom no, nama panitia, jenis absen, keterangan absen, dan ada tombol edit dan delete, dan tombol edit dan delete itu berfungsi untuk mengedit dan menghapus data absen panitianya. dan diheadernya ada filter yang berupa dropdown untuk memilih judul absensi yang dari form dengan defaultnya "pilih absensi" yang secara tidak langsung tidak ada data yang dibuat, jadi data yang dimuat akan otomatis tidak ada, jadi defaultnya kosong.
oh iya dihalaman absensi dan halaman dashboard ini ada tombol untuk cetak pdf atau exsel, dan juga ada inputan serch nama panitianya.
dan semua halaman yang akan dibuat ini pastikan memakai caching dan juga hindari select * (semua diambil) jadi ambillah data yang seperlunya aja dan joinnya juga seperlunya aja. dan semuanya harus buat components atau atau api baru lagi.

dan aku sudah menjalankan sql ini ;
```sql

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
```