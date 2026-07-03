pada halaman chatbot yaitu tepatnya difile SamsChatbot.js. saya ingin inputan pesannya jika sudah penuh dillayar (maksimal 80%vw) atau terlalu panjang maka akan otomatis div inputannya memanjang kebawah dan teks atau karakternya akan turun kebawah juga. terus saya ingin menambah tombol baru dipojok kanan atas tepatnya disebelah kiri tombol x yaitu tombol untuk memperbesar layar chat menjadi penuh layar penuh (fullscreen) dan menekan tombol tersebut lagi akan mengembalikan ke tampilan semula. dan perbaiki layout atau desainnya untuk ditampilan fullscreen, dan ketika fullscreen itu tidak ada navbar dan footer jadi full cuman chat aja.

terus buatkan aku componen baru yaitu untuk dihalaman public pose tepatnya pada halaman team,jadwal,daftar, saya ingin ketika halaman itu bisa diakses sesuai dengan waktu yang sudah ditentukan, seperti halaman team itu kapan bisa diakses dan kapan ditutupnya, sama halnya dengan jadwal dan daftar. jadi saya ingin bisa di atur waktunya didatabase, dan saya sudah membuat sqlnya seperti ini
```sql
CREATE TYPE jadwal AS ENUM ('pendaftaran', 'seleksi', 'acara');

CREATE TABLE jadwal (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site site_type NOT NULL,
    jenis_jadwal jadwal NOT NULL,
    waktu_mulai TIMESTAMP WITH TIME ZONE NOT NULL,
    waktu_selesai TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
``` 
dan untuk tampilannya saya ingin seperti halaman team,jadwal,daftar yang sudah ada tapi ditambahkan semacam overlay yang memberitahu bahwa halaman ini belum dibuka dan akan dibuka sesuai dengan waktu yang ditentukan, dan misal user membuka website pose terus mencoba membuka halaman team/jadwal/daftar pada saat pendaftaran/seleksi/acara belum dimulai maka ada informasi dengan overlay+keterangan+tanggalnya+hitung mundurnya dan diarahkan ke halaman pemberitahuan, dan jika user mencoba membuka halaman team/jadwal saat masih tahap pendaftaran maka user diarahkan ke halaman registrasi, dan jika user mencoba membuka halaman tadi saat acara sudah selesai maka user diarahkan ke halaman pemberitahuan. dan tempate atau desain atau layout informasi dioverlaynya gini ;
|---------------------|
|informasi + tanggal  |
|   hitung mundur     |
|---------------------|
contohnya gini 
|-------------------------------------|
|pendaftaran akan dibuka pada tanggal |
|     02 juni 2026 - 11 juni 2026     |
|               00:00:00              |
|-------------------------------------|
jadi ketika user membuka website pose halaman team/jadwal/daftar itu dicek dulu waktunya apakah memenuhi kriteria waktu atau tidak, setelah dicek kesesuaian waktu baru masuk atau menampilkan isi halaman tersebut, jika tidak ya jangan ditampilkan isian halamannya melaikan overlay yang sudah dijelaskan tadi.
dan buatkan juga halaman baru yaitu untuk manajemen jadwal ini di halaman panitia yang sudah aku siapkan difolder src-app-panitia-pose-jadwal_acara-page.js 
ditabel itukan ada kolom site itu pkkmb atau pose sesuai dengan halaman manajemen yang dibuka, terus ada jenis jadwal itu pilihannya ada 'pendaftaran', 'seleksi', 'acara', terus ada waktu mulai dan waktu selesai.
terus sekalian revisi pada kehalaman panitia-pose-jadwal-page.js, saya ingin setwaktunya itu sesuai dengan waktu yg dipilih dicalender(input manual) bukan otomatis saat waktu pembuatan inputan, contoh masalahnya gini, aku sudah mengatur waktu ditanggal 4 juni tapi yg tersimpan didatabase malah tanggal 3juni(yaitu hari ini saat mengisi inputan) tapi ditabel menunjukan 4juni. jadi tidak singkron, yg aku mau yg tersimpan didatabase itu 4 juni. 