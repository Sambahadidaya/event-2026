fokus ke halaman panitia tepatnya dibagian pj_acara, nah disitu saya ingin ada halaman baru yaitu untuk manajemen jadwal. yang isinya itu cuman tambah,edit,hapus jadwal saja. yang desain halamannya sama persis seperti halaman panitia/absensi_panitia/form cuman databasenya beda. dan saya sudah menjalankan sql ini ;
```sql
create table jadwal_acara_pkkmb(
  id UUID primary key default uuid_generate_v4(),
  judul varchar(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE public.jadwal_acara_pkkmb ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all jadwal_acara_pkkmb" ON jadwal_acara_pkkmb FOR ALL TO authenticated USING (true) WITH CHECK (true);
```