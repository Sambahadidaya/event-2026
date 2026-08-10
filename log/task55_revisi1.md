# ada beberapa revisi, yaitu 
1. saya ingin apinya itu bukan di src/app/api tapi difoder yang sudah ada yaitu di src/api/supabase/ 
2. terus pada saat pembuatan form yang ada di halaman app/panitia/form/form/page.js, saya ingin pada saat pengisian limit kuata perkampus itu bisa berbeda beda tiap kampusnya (jadi tiap kampusnya diinput manual) dan pada saat input kuata perkampus ini kok tidak ada nama kampusnya malah disuruh input kuatanya aja tanpa ada nama kampusnya, padahal di KAMPUS_DATA ada nama kampusnya dan saya ingin bisa diatur kampus mana saja yang ada, dan kampus yang ada ini otomatis akan masuk ke tabel form_register_kampus_quota seperti pada tabel form_register_pricing dalam arti bisa langsung banyak row, yang otomatis pada halaman pjnya tepatnya dihalaman components/panitia/AdminPesertaRegister.jsnya itu yang di div Status Kuota Per Kampus (Mahasiswa LP3I) isiannya menjadi cuman div undefined saja. terus saya juga pada kategori umum saya ingin memecah lagi karna untuk umum itu bisa untuk mahasiswa atau biasa atau bisa keduanya, jadi pada saat registrasi itu yang di file FormRegistration.js itu tepatnya pada kategori umum bisa diatur apakah umumnya hanaya untuk mahasiswa atau umum biasa atau bahkan keduanya.
3. terus difile lyaout.js atau adminRoleData.js itu saya ingin mengatur routenya langsung difile adminRoleData seperti pada role lain.
4. pada halaman pj lomba form register atau difile components/panitia/AdminPesertaRegister.js, saya ingin yang div Status Seluruh Lomba yang menampilkan kuata limit yang ada disemua lomba yg bisa diakses semua pj itu saya ingin bukan semua kategori tapi hanya kategori Mahasiswa LP3I, terus saya juga pada div total team itu didalamnya saya ingin ada total team (seperti saat ini) dan dibawah total team itu ada total berapa sisa kuota lagi. terus pada tabel Daftar Pendaftar itu saya ingin ada kolom baru yaitu kolom jenis htm, yang didalamnya jika kolom butuh_bukti di form_registernya true maka isi kolom jenis htmnya menjadi 'dari htm lanjutan', jika butuh_bukti false maka menjadi 'dari htm wajib'. terus pada tabel Daftar Pengumpulan tepatnya pada kolom Kode Team itu malah kosong (-) padahal pada saat diklik row itukan ada tabel baru muncul yaitu Hasil Pengumpulan Tim nah padahal didalam tabel Hasil Pengumpulan Tim itu sudah muncul kode teamnya yang di kolom Tim & Kode. terus pada sat mencetak juga kode teamnya itu malah pada kosong padahal diwebsitenya sudah pada muncul.
# ada bug ini dilog ;
```log
Console Error

Each child in a list should have a unique "key" prop.

Check the render method of `UnifiedFormDashboard`. See https://react.dev/link/warning-keys for more information.
Call Stack
28

Show 22 ignore-listed frame(s)
div
<anonymous>
UnifiedFormDashboard[kategoriPendaftar.map() > KAMPUS_DATA.map()]
file:///C:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/.next/dev/static/chunks/src_0qo_1ep._.js (5824:360)
Array.map
<anonymous>
UnifiedFormDashboard[kategoriPendaftar.map()]
file:///C:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/.next/dev/static/chunks/src_0qo_1ep._.js (5823:221)
Array.map
<anonymous>
UnifiedFormDashboard
file:///C:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/.next/dev/static/chunks/src_0qo_1ep._.js (5596:63)
```