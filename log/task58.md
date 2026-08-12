saya ingin menambah database baru yaitu untuk kelompok disite pkkmb, nah saya ingin untuk halaman kelompok disite pkkmb itu berasal dari tabel baru didabase bukan pakai tabel team. dan saya sudah menjalankan sql ini ;
```sql
CREATE TABLE kelompok (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    urutan INT4 DEFAULT 0,
    nama_kelompok VARCHAR(100) NOT NULL,
    nama_kabim VARCHAR(100) NOT NULL,
    link_instagram VARCHAR(255),
    foto_kelompok VARCHAR(255),
    keterangan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
);
CREATE TABLE kelompok_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kelompok_id UUID NOT NULL REFERENCES kelompok(id) ON DELETE CASCADE,
    nama_anggota VARCHAR(100) NOT NULL,
    nim_anggota VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
);
ALTER TABLE public.kelompok ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read kelompok" ON public.kelompok FOR SELECT TO public USING (true);
CREATE POLICY "auth all kelompok" ON public.kelompok FOR ALL TO authenticated USING (true) WITH CHECK (true);
ALTER TABLE public.kelompok_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read kelompok_members" ON public.kelompok_members FOR SELECT TO public USING (true);
CREATE POLICY "auth all kelompok_members" ON public.kelompok_members FOR ALL TO authenticated USING (true) WITH CHECK (true);
```
dan saya sudah menyiapkan folder dan file baru diproject ini yaitu di src/app/panitia/pj_kabim/kelompok/page.js, yang dihalaman itu saya ingin seperti biasa ada header dan footer seperti halaman pj_lomba, dan logikanya juga saya ingin seperti pj lomba yang datanya dimuat sesuai dengan admin rolenya yang secara tidak langsung saya juga ingin membuat role baru untuk pj_kabim ini yang diatur atau dimaintenance difile adminRoleData.js. terus dihalaman pj_kabim/kelompok ini juga bisa menambah kelompok hanya jika role admin yang loginnya admin_pkkmb selain itu tidak bisa menambah kelompok (kecuali super_admin karna super_admin itu full akses), terus saya ingin saat pembuatan kelompok ini data kelompok_membersnya dari tabel peserta yang difilter dari site_type nya pkkmb dan jenis_form nya wajib, dan yang diambilnya itu cuman nama,nim,dan kampus saja, tapi ditabel dihalamannya itu saya ingin tetap detail peserta.
terus saya juga ingin semua api ini baru lagi yang sudah aku siapkan di src/api/supabase/admin/kelompok.js dan di src/api/supabase/public/kelompok.js terus aku juga ingin components baru lagi agar mudah dimaintenance atau dirawat.
terus dihalaman public kelompok yang ada di src/app/pkkmb/kelompok/page.js itu datanya saya ingin dibuat berdasarkan urutan kelompok terus datanya diambil dari tabel kelompok dan kelompok_members tapi tidak diambil kolom nim_anggotanya. dan untuk desain atau layoutnya seperti pada team disite pose yaitu di src/app/pose/team/page.js.
terus pada form wajib yang site pkkmb saya ingin ada inputan baru yaitu untuk data medis yang terdiri dari inputan riwayat penyakit,penanganan,alergi,nama orang tua/wali dan nomor wa/telepon orang tua/wali , yang form wajib ini berada difile src/app/pkkmb/form/[link_id]/page.js , yang data medis ini akan disimpan ke tabel baru juga, yang aku sudah menjalankan sql ini ;
```sql
CREATE TABLE data_medis_pkkmb (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    users UUID NOT NULL REFERENCES peserta(id) ON DELETE CASCADE,
    riwayat_penyakit VARCHAR(255),
    penanganan VARCHAR(255),
    alergi VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
);
CREATE TABLE data_tambahan_pkkmb (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    users UUID NOT NULL REFERENCES peserta(id) ON DELETE CASCADE,
    nama_ortu_wali VARCHAR(100),
    no_wa_ortu_wali VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
);
ALTER TABLE public.data_medis_pkkmb ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read data_medis_pkkmb" ON public.data_medis_pkkmb FOR SELECT TO public USING (true);
CREATE POLICY "auth all data_medis_pkkmb" ON public.data_medis_pkkmb FOR ALL TO authenticated USING (true) WITH CHECK (true);
ALTER TABLE public.data_tambahan_pkkmb ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read data_tambahan_pkkmb" ON public.data_tambahan_pkkmb FOR SELECT TO public USING (true);
CREATE POLICY "auth all data_tambahan_pkkmb" ON public.data_tambahan_pkkmb FOR ALL TO authenticated USING (true) WITH CHECK (true);
```
yang apinya juga ingin baru, yaitu di src/api/supabase/admin/medis.js dan src/api/supabase/public/medis.js dan components baru agar mudah dimaintenance atau dirawat. terus untuk data medis ini hanya bisa diakses oleh panitia atau role admin_pkkmb_pj_medis dan halamannya berada di bawah pj_kabim yaitu di src/app/panitia/pj_medis/peserta/page.js

dan saya sudah menambah code atau halaman baru di panitia/layout.js yaitu ;
```js
<div className="mb-6">
    {!collapsed && (
        <p className="px-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Manajemen PJ Kabim</p>
    )}
    <button
        onClick={() => toggleMenu('kabim')}
        title="Kabim"
        className={`w-full flex ${collapsed ? 'justify-center px-2' : 'justify-between px-4'} py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 font-medium text-sm transition-all group mt-1`}
    >
        <span className={`flex items-center gap-3 text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors ${collapsed ? 'gap-0' : ''}`}>
            <ClipboardList size={18} className="text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
            {!collapsed && 'Kabim'}
        </span>
        {!collapsed && (menuOpen.kabim ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />)}
    </button>
    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${menuOpen.kabim ? 'max-h-64 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
        <ul className={`${collapsed ? 'pl-0 space-y-1' : 'pl-4 pr-3'} py-1 space-y-1.5 text-sm`}>
            <NavLink href="/panitia/pj_kabim/kelompok" icon={Users} label="Manajemen Kelompok" colorTheme="blue" />
        </ul>
    </div>
</div> 

<div className="mb-6">
    {!collapsed && (
        <p className="px-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Manajemen PJ Medis</p>
    )}
    <button
        onClick={() => toggleMenu('Medis')}
        title="Medis"
        className={`w-full flex ${collapsed ? 'justify-center px-2' : 'justify-between px-4'} py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 font-medium text-sm transition-all group mt-1`}
    >
        <span className={`flex items-center gap-3 text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors ${collapsed ? 'gap-0' : ''}`}>
            <ClipboardList size={18} className="text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
            {!collapsed && 'Medis'}
        </span>
        {!collapsed && (menuOpen.Medis ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />)}
    </button>
    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${menuOpen.Medis ? 'max-h-40 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
        <ul className={`${collapsed ? 'pl-0 space-y-1' : 'pl-4 pr-3'} py-1 space-y-1.5 text-sm`}>
            <NavLink href="/panitia/pj_medis/peserta" icon={Users} label="Data Peserta" colorTheme="blue" />
        </ul>
    </div>
</div>
```
tapi untuk role admin belum aku tambahkan jadi tambahkanlah role adminnya yang di file src/lib/adminRoleData.js.