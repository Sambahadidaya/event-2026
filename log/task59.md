saya ingin membuat barir lagi seperti pada ScheduleBarrier.js dan barir ini ingin components baru lagi dan api baru lagi yaitu di components/public/pengembang.js dengan apinya di src/api/supabase/public/pengembang.js 
dan src/api/supabase/admin/pengembang.js dan dihalaman panitia ada halaman baru lagi di admin yaitu di src/app/panitia/admin/pengembang/page.js yang isinya untuk mengatur apakah nilainya true atau false, jika true maka halaman public yang diberi barir akan dikunci dan ada notif seperti maaf website sedang dalam masa pengembangan dan jika false maka halaman public akan terbuka terus ada pemberitahuan juga jika true maka diharapkan besok pagi atau apalah untuk mengunjui websitenya lagi. buatlah halaman barir atau halaman panitianya semodern mungkin, untuk warna barirnya cukup formal saja yang hitam putih sesuai dengan mode yang aktif. dan saya sudah menjalankan sql ini disupabase ; 
```sql
CREATE TABLE pengembangan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kunci BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE public.pengembangan ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read pengembangan" ON public.pengembangan FOR SELECT TO public USING (true);
CREATE POLICY "auth all pengembangan" ON public.pengembangan FOR ALL TO authenticated USING (true) WITH CHECK (true);
```
untuk halaman panitia ini cuman bisa diakses oleh super_admin seperti pada halaman status. terus untuk menyimpan barirnya biar aku saja jadi kamu cukup fokus ke programnya untuk pengimplementasiannya dan uji coba seperti npm runnya biar aku saja. untuk kali ini silahkan beri barir di halaman app/ppkmb/ketentuan dan dihalaman app/pose/ketentuan saja.