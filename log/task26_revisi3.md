fokus ke file ScheduleBarrier.js.
saya ingin alur logika pengambilan tanggal nya begini ;
```js
if hari ini <= waktu mulai pendaftaran maka ambil tanggal mulai dan selesai di jenis pendaftaran
if hari ini sudah lewat pendaftaran maka ambil tanggal mulai dan selesai di jenis seleksi
if hari ini sudah lewat seleksi maka ambil tanggal mulai dan selesai di jenis acara
if hari ini sudah lewat acara maka ambil tanggal selesainya saja di jenis acara
```
terus logika untuk tampilannya begini ; 
```js
if waktu hari ini lebih <= dari waktu mulai pendaftaran maka informasinya menjadi "Pendaftaran akan dibuka pada tanggal (tambahkan waktu mulai pendaftaran) dan hitung mundur dan tombol untuk kembali ke halaman pemberitahuan dan tambahkan tombol mengerti (ketika menekan tombol mengerti maka pop up atau overlay hilang tapi halaman kosong tidak menampilkan isi halaman tersebut)", 
if waktu hari ini sudah masuk diantara waktu mulai dan waktu selesai pendaftaran maka informasinya menjadi "Pendaftaran sedang berlangsung dan akan berakhir pada (tambahkan waktu ditutup pendaftaran) dan hitung mundur dan ada tombol untuk lanjut ke halaman pendaftaran dan tambahkan tombol mengerti (ketika menekan tombol mengerti maka pop up atau overlay hilang tapi halaman kosong tidak menampilkan isi halaman tersebut)", 
if waktu hari ini sudah lewat dari waktu selesai pendaftaran maka informasinya menjadi "Pendaftaran telah selesai dan lagi tahap seleksi (tambahkan waktu dimulai acara dan hitung mundur)  dan ada tombol untuk kembali ke halaman pemberitahuan dan tambahkan tombol mengerti (ketika menekan tombol mengerti maka pop up atau overlay hilang tapi halaman kosong tidak menampilkan isi halaman tersebut)", 
if waktu hari ini sudah lewat dari waktu selesai seleksi atau sudah masuk waktu mulai acara maka informasinya menjadi "Acara sudah dimulai dan akan berakhir pada (tambahkan waktu ditutup acara) dan hitung mundur dan ada tombol untuk kembali ke halaman pemberitahuan dan tambahkan tombol mengerti (ketika menekan tombol mengerti maka pop up atau overlay hilang tapi halaman kosong tidak menampilkan isi halaman tersebut)", 
if waktu hari ini sudah lewat dari waktu selesai acara maka informasinya menjadi "Acara telah selesai dan ada tombol untuk kembali ke halaman pemberitahuan dan tambahkan tombol mengerti (ketika menekan tombol mengerti maka pop up atau overlay hilang tapi halaman kosong tidak menampilkan isi halaman tersebut)", 

```