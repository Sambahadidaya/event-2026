fokus ke halaman form register dipublic yaitu tepatnya dihalaman FormRegistration.js terus halaman pembuatan formnya yang berada difile src/app/panitia/form/form/page.js
saya ingin menambah validasi lagi yaitu saya ingin untuk maks anggota tiap lomba dan tiap kategorinya bisa diatur dan untuk jenis antara individu atau bukannya juga ingin diatur, jika jenis individunya true maka maks anggota akan difikskan menjadi 1, tapi jika individunya false maka bisa disetting maks anggotanya berapa secara manual, terus saya juga ingin mensetting maks team yang sudah daftar itu berapa dan jumlah maks team ini tiap kategorinya bisa berbeda, dan ketika sudah mencapai maks team yang daftar maka form dikategori itu tidak bisa dibuka atau tidak ditampilkan sebagai gantinya ada informasi seperti bahwa "Maaf pendaftaran lomba untuk kategori ... sudah ditutup karna sudah mencapai kuota maksimal" dan untuk halaman admin tepatnya di panitia/pj_lomba/form_register/page.js saya ingin menampilkan jumlah team yang sudah terdaftar di masing-masing kategori dan menampilkan juga sisa kuota yang ada terus ditabel daftar pendaftar juga ada kolom baru yaitu untuk apakah individu atau team, terus ditabel daftar pengumpulan juga saya ingin ada kolom baru yaitu kolom Status Diterima yang seperti pada tabel Hasil Pengumpulan Lomba, terus tabel Hasil Pengumpulan Lomba itu akan muncul jika diklik teamnya (Seperti pada tabel daftar pendaftar) tapi kolom Status Diterima itu ketika diklik berupa dropdown bukan langsung mengganti, terus ditabel hasil pengumpulan lomba yang kolom Status Diterima itu dihapus saja dan gantikan dengan kolom keterangan , terus dihalaman public yang form submit ini saya ingin inputan atau swich antara metode pengumpulan dan upload file/link dan input keterangannya disable seperti pada tombol kumpulkan itu karna saya ingin semua aktif itu ketika sudah diverifikasi kode formnya. 
saya sudah menambah kolom baru didatabase yaitu dengan sql ini ;
```sql
alter TABLE form_register_pricing
ADD COLUMN maks_anggota INT4 NOT NULL DEFAULT 1,
ADD COLUMN maks_team INT4 NOT NULL DEFAULT 1,
ADD COLUMN individu BOOLEAN NOT NULL DEFAULT TRUE;

alter TABLE form_register_pricing
DROP COLUMN maks_anggota,
DROP COLUMN maks_team,
DROP COLUMN individu;
```
yang otomatis ada api atau function baru lagi untuk admin dan untuk publicnya.
bacalah seluruh kode yang relevan, jangan sampai cuman asumsi doang.