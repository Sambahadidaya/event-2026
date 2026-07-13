-- Migration Task 34: PKKMB Materi and Tugas

-- 1. Create materi_pkkmb table
CREATE TABLE materi_pkkmb (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    judul VARCHAR(255) NOT NULL,
    pemateri VARCHAR(255) NOT NULL,
    tanggal TIMESTAMP WITH TIME ZONE NOT NULL,
    status BOOLEAN NOT NULL DEFAULT false,
    foto_header VARCHAR(255) NOT NULL,
    file_pdf VARCHAR(255) NOT NULL,
    link_tugas VARCHAR(64) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS for materi_pkkmb
ALTER TABLE materi_pkkmb ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for all on materi_pkkmb" ON materi_pkkmb AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Enable all for authenticated on materi_pkkmb" ON materi_pkkmb AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- 2. Create tugas_materi table
CREATE TABLE tugas_materi (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    materi_id UUID NOT NULL REFERENCES materi_pkkmb(id) ON DELETE CASCADE,
    keterangan TEXT,
    nama VARCHAR(255) NOT NULL,
    kampus VARCHAR(255) NOT NULL,
    nim VARCHAR(50) NOT NULL,
    file_tugas VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RLS for tugas_materi
ALTER TABLE tugas_materi ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable insert for public on tugas_materi" ON tugas_materi AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Enable read for public on tugas_materi" ON tugas_materi AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Enable all for authenticated on tugas_materi" ON tugas_materi AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- 3. Add site_type to peserta table (default null as requested)
ALTER TABLE peserta ADD COLUMN site_type site_type DEFAULT NULL;


-- 4. Create Storage Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'materi-pkkmb',
    'materi-pkkmb',
    true,
    10485760, -- 10MB
    ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'materi-tugas',
    'materi-tugas',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'materi-header',
    'materi-header',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;


-- 5. Set Storage Policies for the new buckets

-- materi-pkkmb policies
CREATE POLICY "Public Read materi-pkkmb" ON storage.objects FOR SELECT TO public USING (bucket_id = 'materi-pkkmb');
CREATE POLICY "Public Upload materi-pkkmb" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'materi-pkkmb');
CREATE POLICY "Authenticated Update materi-pkkmb" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'materi-pkkmb');
CREATE POLICY "Authenticated Delete materi-pkkmb" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'materi-pkkmb');

-- materi-header policies
CREATE POLICY "Public Read materi-header" ON storage.objects FOR SELECT TO public USING (bucket_id = 'materi-header');
CREATE POLICY "Public Upload materi-header" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'materi-header');
CREATE POLICY "Authenticated Update materi-header" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'materi-header');
CREATE POLICY "Authenticated Delete materi-header" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'materi-header');

-- materi-tugas policies
CREATE POLICY "Public Read materi-tugas" ON storage.objects FOR SELECT TO public USING (bucket_id = 'materi-tugas');
CREATE POLICY "Public Upload materi-tugas" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'materi-tugas');
CREATE POLICY "Authenticated Update materi-tugas" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'materi-tugas');
CREATE POLICY "Authenticated Delete materi-tugas" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'materi-tugas');
