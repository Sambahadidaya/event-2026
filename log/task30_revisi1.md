tapi untuk form register wajib ini saya ingin cuman untuk mahasiswa saja terus untuk selain form wajib ini baru bisa swich antara mahasiswa,dosen,umum yang ada difile app-panitia-pose-form_register atau app-pose-register-[id].
dan saya juga diform selain itu formatnya sama sepreti form wajib ini.
oh iya saya juga diform wajib ini ingin ada input email_wa seperti pada form yang lain. dan juga form ini (mau form wajib atau form yang lain) jadikan komponen saja biar gampang di pelihara atau maintenance.
terus diform lain juga saya ingin memecah nim seperti form wajib ini, dan diform lain jika menekan tombol swich mahasiswa,dosen,umum saya ingin input nimnya tidak ada dan kolom seperti kampus,nim,prodi,angkatan menjadi sesuai dengan swich jadi jika swich yang aktif itu dosen maka kolom kampus,nim,prodi,angkatan semua isinya menjadi dosen, begitu juga ketika umum.
saya sudah menjalankan sql ini ;
```sql
-- Tabel form_wajib
CREATE TABLE form_wajib (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    judul VARCHAR(255) NOT NULL,
    keterangan TEXT,
    site site_type NOT NULL,
    link_id VARCHAR(64) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabel peserta_wajib
CREATE TABLE peserta_wajib (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID REFERENCES form_wajib(id) ON DELETE CASCADE,
    kategori VARCHAR(50) NOT NULL,
    nama VARCHAR(255) NOT NULL,
    kampus VARCHAR(255),
    nim VARCHAR(50),
    prodi VARCHAR(255),
    angkatan VARCHAR(50),
    email_wa VARCHAR(255),
    bukti_bayar VARCHAR(255),
    status_pembayaran VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS form_wajib
ALTER TABLE public.form_wajib ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users on form_wajib" 
ON public.form_wajib AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Enable all access for authenticated users on form_wajib" 
ON public.form_wajib AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RLS peserta_wajib
ALTER TABLE public.peserta_wajib ENABLE ROW LEVEL SECURITY;
-- Semua orang bisa menginsert (karena form publik)
CREATE POLICY "Enable insert access for all users on peserta_wajib" 
ON public.peserta_wajib AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
-- Hanya admin/authenticated yang bisa read/update/delete
CREATE POLICY "Enable all access for authenticated users on peserta_wajib" 
ON public.peserta_wajib AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);
```
