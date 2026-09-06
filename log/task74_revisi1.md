fokus dihalaman panita tepatnya dibagian pj_medis, difolder pj_medis itu saya ingin ada halaman baru lagi yaitu untuk data panitia, yang desainnya sama persis dengan halaman pj_medis/peserta cuman dihalaman tabelnya terdiri dari No,Nama Lengkap,Divisi,Penyakit,Penanganan,Alergi. untuk nama itu fk ke tabel admins kolom nama. terus datanya bisa ditambahkan oleh super_admin dan ketika menambah data itu ada tombol tambah dan ketika menekan tombol tambah maka akan muncul pop up berisi inputan nama, divisi, penyakit, penanganan, alergi.dan untuk nama itu berupa dropdown yang fk ke nama admins yang desain modalnya sama seperti AbsensiFormModal. dan saya sudah menjalankan sql ini didatabase supabase ; 
```sql

create table data_medis_pkkmb_panitia (
  id UUID primary key DEFAULT uuid_generate_v4(),
  panitia_id UUID REFERENCES public.admins(id) ON DELETE CASCADE,
  divisi VARCHAR(50),
  riwayat_penyakit VARCHAR(255),
  penanganan VARCHAR(255),
  alergi VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.data_medis_pkkmb_panitia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all data_medis_pkkmb_panitia" ON data_medis_pkkmb_panitia FOR ALL TO authenticated USING (true) WITH CHECK (true);
```