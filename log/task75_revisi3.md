fokus ke halaman panitia tepatnya dibagian pj_medis. saya ingin ada halaman baru yaitu halaman master_obat terus halaman log_obat terus halaman riwayat penanganan.
untuk halaman master obat itu terdiri dari nama obat, jumlah obat, sisa obat. terus ada tombol tambah,edit,hapus. untuk tambah dan edit itu muncul modal, untuk hapus akan langsung hapus data dan modal seperti halaman panitia lainnya.
untuk halaman log_obat itu terdiri dari nama obat, jumlah obat, sisa obat, dan tanggal obat dibuat. dan untuk tambah dan edit itu muncul modal. dan untuk hapus akan langsung hapus data dan modal seperti halaman panitia lainnya.
untuk halaman riwayat_penanganan_medis itu terdiri dari nama penanganan (antara pakai kelompok_members_id atau admins_id), nama obat, jumlah obat, sisa obat, keterangan, dan tanggal obat dibuat. dan untuk tambah dan edit itu muncul modal. dan untuk hapus akan langsung hapus data dan modal seperti halaman panitia lainnya tapi untuk halaman riwayat penanganan ini bisa pakai obat bisa juga tanpa obat dalam arti tidak perlu mengisi obat cukup keterangannya saja.
dan pastinya saya ingin ada tombol untuk cetak pdf atau excel seperti pada halaman medis lain
dan saya sudah menjalankan sql ini ;
```sql

create table master_obat(
  id UUID primary key default uuid_generate_v4(),
  nama_obat varchar(255),
  stok_obat int4,
  sisa_obat int4,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE public.master_obat ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all master_obat" ON master_obat FOR ALL TO authenticated USING (true) WITH CHECK (true);

create table pemakaian_obat(
  id UUID primary key default uuid_generate_v4(),
  obat_id UUID REFERENCES public.master_obat(id) ON DELETE CASCADE,
  pemakaian_obat int4,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE public.pemakaian_obat ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all pemakaian_obat" ON pemakaian_obat FOR ALL TO authenticated USING (true) WITH CHECK (true);

create table riwayat_penanganan_medis(
  id UUID primary key default uuid_generate_v4(),
  peserta_id UUID REFERENCES public.kelompok_members(id) ON DELETE CASCADE,
  panitia_id UUID REFERENCES public.admins(id) ON DELETE CASCADE,
  pemakaian_obat_id UUID REFERENCES public. pemakaian_obat(id) ON DELETE CASCADE,
  keterangan varchar(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.riwayat_penanganan_medis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all riwayat_penanganan_medis" ON riwayat_penanganan_medis FOR ALL TO authenticated USING (true) WITH CHECK (true);
```