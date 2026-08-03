saya ingin menambah halaman baru dan database baru yaitu untuk kelompok disite pkkmb, nah saya ingin untuk kelompok itu berasal dari tabel baru didabase bukan pakai tabel team. dan saya sudah menjalankan sql ini ;
```sql
CREATE TABLE kelompok (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    urutan INT4 DEFAULT 0,
    nama VARCHAR(100) NOT NULL,
    Kabim VARCHAR(100) NOT NULL,
    link_instagram VARCHAR(255),
    gambar VARCHAR(255),
    keterangan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
);
CREATE TABLE kelompok_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kelompok_id UUID NOT NULL REFERENCES kelompok(id) ON DELETE CASCADE,
    peserta_id UUID NOT NULL REFERENCES peserta(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
);
ALTER TABLE public.kelompok ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read kelompok" ON public.kelompok FOR SELECT TO public USING (true);
CREATE POLICY "auth all kelompok" ON public.kelompok FOR ALL TO authenticated USING (true) WITH CHECK (true);
ALTER TABLE public.kelompok_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read kelompok_members" ON public.kelompok_members FOR SELECT TO public USING (true);
CREATE POLICY "auth all kelompok_members" ON public.kelompok_members FOR ALL TO authenticated USING (true) WITH CHECK (true);
```
dan saya sudah menyiapkan folder dan file baru diproject ini yaitu di src/app/panitia/pj_kelompok/kelompok/page.js, yang dihalaman itu saya ingin seperti biasa ada header dan footer seperti halaman pj_lomba, dan logikanya juga saya ingin seperti pj lomba yang datanya dibuat sesuai dengan admin rolenya yang secara tidak langsung saja juga ingin membuat role baru untuk pj_kelompok ini yang diatur atau dimaintenance difile adminRoleData.js. terus dihalaman pj_kelompok ini juga bisa menambah kelompok hanya jika role admin yang loginnya admin_pkkmb selain itu tidak bisa menambah kelompok (kecuali super_admin karna super_admin itu full akses), terus saya ingin saat pembuatan kelompok ini data kelompok_membersnya dari tabel peserta yang difilter dari site_type nya pkkmb dan jenis_form nya wajib, dan yang diambilnya itu cuman nama,nim,dan kampus saja, tapi ditabel dihalamannya itu saya ingin tetap detail peserta seperti nama