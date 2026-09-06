fokus ke halaman panitia, saya ingin ada halaman baru yaitu halaman panitia/pj_tatib yang isinya halaman master_pelanggaran, yang halaman ini terdiri dari tambah,edit,hapus master pelanggaran. yang ketika menambah pelanggaran itu akan muncul modal seperti modal halaman panitia lain. dan buatkan juga role baru untuk tatib ini diadminRoleData.js
dan saya sudah menjalankan sql ini ;
```sql 
create table master_pelanggaran(
  id UUID primary key default uuid_generate_v4(),
  nama_pelanggaran varchar(255),
  jenis_pelanggaran varchar(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.master_pelanggaran ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all master_pelanggaran" ON master_pelanggaran FOR ALL TO authenticated USING (true) WITH CHECK (true);
```
terus dihalaman pj_tatib ini juga ada halaman riwayat_pelanggaran yang isinya berisi menambah pelanggaran yang yang dihalaman riwayat_pelanggaran ini ada tombol untuk tambah pelanggaran yang ketika diklik akan muncul modal yang terdiri dari nama peserta,nama pelanggaran,jenis_pelanggaran. dan nama peserta ini dicari dari tabel kelompok_members kolom nama dan modal ini sama seperti absensi peserta atau panitia. cuman untuk halaman tatib ini datanya dirender atau ditampilkan ketika sudah mengisi nama pesertanya dan ketika mengisi nama peserta itu ada jeda 1.5 detik untuk mengecek nama pesertanya. untuk data riwayat pelanggarannya ada di tabel riwayat_pelanggaran didatabase, dan saya sudah menjalankan sql ini juga ;
```sql
create table riwayat_pelanggaran(
  id UUID primary key default uuid_generate_v4(),
  peserta_id UUID REFERENCES public.kelompok_members(id) ON DELETE CASCADE,
  pelanggaran_id UUID REFERENCES public.master_pelanggaran(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.riwayat_pelanggaran ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all riwayat_pelanggaran" ON riwayat_pelanggaran FOR ALL TO authenticated USING (true) WITH CHECK (true);
```
dan dihalaman pj_kabim juga ada halaman baru untuk riwayat pelanggaran ini dan datanya diambil dari tabel riwayat_pelanggaran dengan mengambil data sesuai kelompok seperti pada halaman panitia/pj_kabim/kelompok.