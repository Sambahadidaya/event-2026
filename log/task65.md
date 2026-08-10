saya ingin ada halaman baru yang sudah aku persiapkan semua file dan foldernya yaitu 
1. untuk api ada di src/api/supabase/public/KritikSaran.js dan src/api/supabase/admin/KritikSaran.js
2. untuk halaman menampilkan data kritik/sarannya ada di src/app/panitia/KritikSaran/page.js
3. untuk halaman input kritik/sarannya ada di src/app/pkkmb/KritikSaran/page.js dan di src/app/pose/KritikSaran/page.js
4. untuk componensnya ada di src/components/panitia/KritikSaran.js dan src/components/public/KritikSaran.js
yang mana saya sudah membuat database baru di supabase, yang sqlnya seperti ini ;
```sql
create table kritik_saran (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nim VARCHAR(20) NOT NULL,
    nama VARCHAR(255) NOT NULL,
    kampus VARCHAR(255) NOT NULL,
    jenis_kritik VARCHAR(20) NOT NULL,
    kritik TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE public.kritik_saran ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read kritik_saran" ON public.kritik_saran FOR SELECT TO public insert (true);
CREATE POLICY "auth all kritik_saran" ON public.kritik_saran FOR ALL TO authenticated USING (true) WITH CHECK (true);