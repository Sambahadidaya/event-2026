sekarang fokus ke halaman panitia, ada bug kecil yaitu pada saat login dan masuk itukan ada waktunya dan ketika waktunya habis (tidak aktif) saya ingin otomatis keluar sendiri.
terus untuk halaman panitia pose tepatnya pada halaman manejemen register itu datanya belum dimapping ke tabel peserta dan itu baru cuman 2 tabel yaitu tabel team dan team_members, jadi saya ingin langsung memapping 3 tabel yaitu tabel team+team_members+peserta. terus saya juga dihalaman tabelnya itu saya ingin memberi komponen select seperti tabel lain yaitu dari komponen DashboardSelect.js.
terus saya juga ingin menambahkan kolom atau baru saat membuat form yaitu untuk menentukan jumlah nomimal yang harus dibayar baik dari form wajib atau form register, dan khusus untuk register jika kolom butuh_buktinya false maka nominal itu menjadi 0, dan pada halaman form registernya saya ingin disamping inputan file bukti saya ingin memberi keterangan jumlah nominal yang harus dibayar, dan jika tidak ada inputan file bukti pembayaran maka kolom keterangan nominal tidak ada dan begitu juga untuk kolom metode_pembayaran, dan untuk metode pembayaran ini saya ingin berupa dropdown seperti pada inputan kampus dan data metodenya ada di file lombaData.js.
terus saya ingin halaman manajemen register ini saya ingin dipindahkan ke halaman baru yaitu yang sudah saya siapkan yaitu di folder pj_lomba/form_register. dan buatkan dashbaordnya juga yang ada di pj_lomba/dashboard.
terus saya ingin pj lomba ini data yang dirender/difilternya sesuai dengan admin yang login, misal yang login itu adalah admin_pose_lomba_ML maka data yang ditampilkan otomatis memfilter data yang nama lombanya Mobile legens (sesuai dengan yang ada di lombaData.js dan adminData.js) dan untuk adminData.jsnya perbarui karna saya ingin tiap admin mempunyai filternya seperti yang sudah dicontohkan tadi.
saya sudah menambah kolom, berikut sqlnya ;
```sql
ALTER TABLE form_register
ADD COLUMN nominal INT;
ALTER TABLE form_wajib
ADD COLUMN nominal INT;

ALTER TABLE peserta
ADD COLUMN IF NOT EXISTS metode_pembayaran VARCHAR(10);
ALTER TABLE peserta
ADD COLUMN IF NOT EXISTS metode_pembayaran VARCHAR(10);
```