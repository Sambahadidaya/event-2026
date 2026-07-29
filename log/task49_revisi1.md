oke aku sudah menjalankan sql ini;
```sql
CREATE TABLE public.form_register_pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES public.form_register(id) ON DELETE CASCADE,
    kategori VARCHAR(100) NOT NULL,
    nominal INT4 NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT form_register_pricing_unique UNIQUE (form_id, kategori)
);
ALTER TABLE public.form_register_pricing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read pricing" ON public.form_register_pricing FOR SELECT TO public USING (true);
CREATE POLICY "auth all pricing" ON public.form_register_pricing FOR ALL TO authenticated USING (true) WITH CHECK (true);
```
dan saya juga sudah menjalankan sql ini ;
```sql
CREATE TABLE metode_pembayaran (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site site_type NOT NULL,
    nama VARCHAR(100) NOT NULL,
    tipe UUID NOT NULL REFERENCES master_account(id),
    nomor_rekening VARCHAR(255),
    nama_pemilik VARCHAR(255),
    qris_image VARCHAR(255),
    keterangan TEXT,
    aktif BOOLEAN DEFAULT true,
    urutan INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT metode_pembayaran_unique UNIQUE (site, nama)
);
ALTER TABLE public.metode_pembayaran ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read metode" ON public.metode_pembayaran FOR SELECT TO public USING (true);
CREATE POLICY "auth all metode" ON public.metode_pembayaran FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Membuat bucket
INSERT INTO storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
)
VALUES (
    'qris_image',
    'qris_image',
    true,
    5242880, -- Maksimal 5 MB
    ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
);
-- Public dapat melihat file
CREATE POLICY "Public read qris_image"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'qris_image');

-- User login dapat upload
CREATE POLICY "Authenticated upload qris_image"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'qris_image');

-- User login dapat update
CREATE POLICY "Authenticated update qris_image"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'qris_image')
WITH CHECK (bucket_id = 'qris_image');

-- User login dapat menghapus
CREATE POLICY "Authenticated delete qris_image"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'qris_image');
```
nah untuk tabel metode_pembayaran itu tepatnya dikolom tipe itu berasal dari tabel master_account yang difilter dari nama_akun dengan type_akunnya asset, agar nama metodenya itu sinkron dengan akuntansi. terus untuk qris di kolom qris_image itu adalah link gambar qris yang diupload ke bucket qris_image.
dan saya ingin api metode_pembayaran ini bukan cuman difolder supabase/public tapi juga difolder supabase/admin agar lebih mudah dimaintenance.
terus edit juga dihalaman src/app/panitia/form/form/page.js karna dihalaman itulah pembuatan formnya dan seperti yang tadi dibahas yaitu untuk form register nominal atau metode pembayarannya bisa berbeda dan dikelola diform itu, dan juga dalam 1 form inikan ada beberapa kategori yang setiap kateforinya bisa berbeda juga nominalnya dan diatur disana.
terus untuk mengatur metode pembayaran ini saya ingin berada dihalaman keuangan saja yang halaman ini dinavbarnya berada dibawah tombol Master Akun (COA) yang diatur dilayout.js
dan oh iya saat mengupload gambar mau itu diform register atau form wajib atau form pengumpulan atau form apapun itu yang dikelola difile storage.js itu saya ingin ada kompress dulu gambar setelah dikompres baru dikirim atau disimpan distorage, jadi bukan ukuran asli, tapi ini berlaku hanya untuk gambar saja kalau seperti pdf atau file zip,dll itu tidak usah.