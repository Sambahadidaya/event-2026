fokus ke halaman form register pose public tepatnya dihalaman components/public/FormRegistration.js, tepatnya dikategori umum.
saya ingin untuk kategori umum ini itu ada 2 jenis yaitu untuk khusus mahasiswa_saja ada untuk non_mahasiswa dan ada juga untuk keduanya. 
untuk jenis mahasiswa_saja saya ingin formnya otomatis akan menjadi mahasiswanya true, kan ada pertanyaan apakah anda mahasiswa, nah kalau untuk jenis mahasiswa_saja inituh nilai pertanyaan itu menjadi true(aktif)dan tidak bisa diubah, sedangkan untuk jenis non_mahasiswa itu nilai pertanyaan itu menjadi false(tidak aktif) dan tidak bisa diubah. dan untuk keduanya itu nilai pertanyaan itu bebas bisa dipilih yang jenis ini saya sudah menjalankan sql didatabase ini ;
```sql
ALTER TABLE public.form_register_pricing 
ADD COLUMN IF NOT EXISTS umum_type VARCHAR(30) DEFAULT 'keduanya';
```
fokus saja ke codingan dan jangan banyak penjelasan, cukup inti dan singkat,padat,jelas. dan jangan menjalankan perintah apapun seperti npm run karna biar aku saja yang testingnya agar kamu bener bener fokus ke codingan.