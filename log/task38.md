fokus ke halaman login, saya ingin ketika admin login itu akan otomatis masuk ke halaman yang pertama yang ada di adminRoleData.js, bukan statis ke halaman /panitia/dashboard/trafik, misal yang login itu adalah admin_pose_form maka otomatis masuk ke halaman /panitia/pose/form_register (sesuai baris pertama di data adminRoleData.js), dan begitu semuanya.
terus dihalaman login ini saya ingin menambah tombol baru yaitu tombol untuk scan qrcode yang tombol ini posisinya diatas tombol masuk sistem.
saat panitia menekan tombol scan qrcode maka akan tampil halaman baru dengan interface halaman scan qrcode, dan ketika discan itu sistem akan mencocokkan qrcode tersebut dengan qrcode admin yang terdaftar, jika ada maka akan masuk ke halaman dashboard sesuai role admin tersebut, jika tidak ada maka akan tampil notifikasi bahwa qrcode tidak ditemukan.
dan saya sudah menambah kolom didatabase admins yaitu qrcode yang isinya random string dan akan di set ketika panitia mendaftar.
```sql
ALTER TABLE admins ADD COLUMN qrcode VARCHAR(64) UNIQUE DEFAULT null;
```
dan saya sudah menambah library baru ;
```bash
npm install html5-qrcode
```