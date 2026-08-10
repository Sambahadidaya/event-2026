diform register public tepatnya pada file FormRegistration.js pada saat mendaftar lomba yang selain kampus bandung data prodi dan angkatannya masih null, yang setelah aku telusuri penyebab utamanya itukan pada saat form register yang butuh buktinya false itukan datanya diambil dari form wajib, nah untuk kampus selain bandung itu data prodi dan angkatannya belum keambil, padahal diform wajibnya sudah terisi. terus diform register itu saya ingin ada inputan baru yaitu untuk menentukan jenis_kategorinya yang terdiri dari Putra dan Putri dan jenis_kategori ini diatur pada saat pembuatan form registernya yang dihalaman panitia/form/form/page.js yang jenis kategori pada kolom jenis_kategori ditabel form_register itu berupa list seperti isinya putra,putri (dipisah lewat koma) dan jika untuk kolom jenis_kategori ditabel team itu baru hanya 1 data saja seperti putra yang secara tidak langsung ini juga harus direvisi atau ditambahkan dihalaman pj_lomba/form_register atau lebih tepatnya difile AdminPesertaRegister.js yang ada halaman tabel daftar pendaftar nah tambahkanlah kolom untuk jenis_kategori ini yang isinya dari kolom jenis_kategori ditabel team database dan tambahkan juga pada saat mencetak pdf atau exselnya juga, terus saya juga pada saat pembuata form register ini bisa diatur untuk apakah form ini akan dimunculkan dihalaman app/pose/register atau tidak yang diaturnya lewat kolom yang sudah aku buat yaitu is_public, jika is_public=true maka akan dimunculkan, jika is_public=false maka tidak akan dimunculkan (defaultnya true) yang otomatis saya ingin dihalaman app/pose/register/page.js data atau form yang muncul itu hanya form yang is_public=true. terus dihalaman register ini saya ingin data atau card yang muncul itu dipisahkan perkategori yang saya sudah membuat variabel baru dilombaData.js yaitu ini ;
```js
export const KATEGORI = [
    'Mahasiswa LP3I',
    'Alumni LP3I',
    'Dosen/Manajemen LP3I',
    'Siswa',
    'Umum'
];
``` 
yang saya ingin card-card formnya itu dikelompokan berdasarkan kategori ini, seperti contohnya card untuk kategori mahasiswa lp3i itu ya hanya akan memunculkan form pendaftaran lomba untuk mahasiswa lp3i saja begitu pula dengan yang lainnya yang otomatis harus menselect dulu form registernya nah saya ingin selectnya ini hanya seperlunya aja jangan select semuanya(*), dan saya juga ingin dikelompokan perjenis lombanya seperti jenis kreativitas,olahraga,e-sport yang seperti halaman team dipublic atau di app/pose/team/page.js yang sudah ada pengelompokannya itu. yang saya ingin perkelompokan ini layout atau desainnya saya ingin memanjang kesamping yang bisa di scroll horizontal seperti pada halaman beranda atau app/pose/page.js atau lebih tepatnya lagi difile /components/public/HomeLanding.js yang seperti bagian features. dan saya juga ingin ada filter perkategori jenis lomba tau nama lomba atau kategori yang ketika difilter maka card formnya hanya muncul yang itu saja. terus dihalaman register ini saya ingin ada tombol scrol seperti scroll yang dipojok kanan untuk membantu usernya karna kalau manual itu bisa terhalang oleh div cardnya itu. dan untuk halaman public teamnya saya ingin merombak layout atau desainnya seperti halaman register yang ceritakan tadi.

dan saya sudah menjalankan sql ini didatabase supabase saya ;
```sql 
ALTER TABLE team
ADD COLUMN jenis_kategori VARCHAR(10);
ALTER TABLE form_register
ADD COLUMN jenis_kategori VARCHAR(10),
ADD COLUMN is_public BOOLEAN default true;
```