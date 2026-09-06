fokus ke halaman panitia tepatnya bagian pj_kabim, nah saya ingin ada halaman baru yaitu untuk absensi anggota atau peserta yang desainnya seperti pada /panitia/absensi_panitia/absensi cuman yang membedakannya dari databasenya aja, seperti pada judul absensinya itu diambil dari tabel jadwal_acara_pkkmb didatabase terus nama pesertanya dari kelompok_members dan yang pasti peserta atau anggotanya sesuai dengan kelompok pj_kabim masing-masing yang seperti panitia/pj_kabim/tugas dengan defaultnya harus memilih dulu dan ditabel halamannya ada kolom statusnya juga apakah sudah diabsen atau belum.
dan aku sudah menjalankan sql ini ;
```sql
create table absensi_peserta_pkkmb (
  id UUID primary key DEFAULT uuid_generate_v4(),
  kelompok_members_id UUID REFERENCES public.kelompok_members(id) ON DELETE CASCADE,
  jadwal_acara_pkkmb_id UUID REFERENCES public.jadwal_acara_pkkmb(id) ON DELETE CASCADE,
  jenis_absensi VARCHAR(50),
  keterangan VARCHAR(255),
  created_by VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.absensi_peserta_pkkmb ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all absensi_peserta_pkkmb" ON absensi_peserta_pkkmb FOR ALL TO authenticated USING (true) WITH CHECK (true);

```