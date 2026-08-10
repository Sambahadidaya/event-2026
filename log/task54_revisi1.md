ada beberapa bug dan revisi, yaitu ;
# bug ;
1. kenapa ketika user mengisi form itukan nominalnya sudah benar dan ketika perhitungan komisi ini sudah benar tapi pas masuk ke riwayat transaksi income atau pendapatannya malah stack di 150rb dan ini terjadi bukan dari 1 kategori saja, padahal untuk beban komisi sales dan utang komisi salesnya sudah benar
2. kenapa waktu upload bukti pembayaran itu waktu dilihat oleh admin malah crash (tidak muncul fotonya) padahal sudah ada distorage dan sudah tercatat di database juga tapi waktu aku cek distroge juga tidak muncul gambarnya (Seperti crash yang kemungkinan penyebabnya gara gara kompress gambar atau formatnya atau ukuran filenya yang difile storage.js)
3. dihalaman sales kenapa persen komisinya masih 0 padahal nominalnya sudah benar (kemungkinan terjadi miskon, yaitukan harusnya persen komisi itu berasal dari tabel form_register_pricing bukan form_register) 
4. dihalaman form register public tepatnya pada saat kolom individunya true inputan nama team,tagline,dll malah hilang, harusnya meskipun individunya true tetap harus memasukan nama team,tagline,dll namun tagline dan logo teamnya opsional, karna ini berakibat ditabel team kolom title,content,tagline,dllnya jadi aneh.
5. terus kenapa ada error ini 
```log
Console Error

Each child in a list should have a unique "key" prop.

Check the render method of `SalesRiwayatTable`. See https://react.dev/link/warning-keys for more information.
Call Stack
24

Show 20 ignore-listed frame(s)
<unknown>
file:///C:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/.next/dev/static/chunks/_1mgi3gk._.js (837:238)
Array.map
<anonymous>
SalesRiwayatTable
file:///C:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/.next/dev/static/chunks/_1mgi3gk._.js (835:49)
SalesRiwayatPage
file:///C:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/.next/dev/static/chunks/_1mgi3gk._.js (1416:226)
```

# Revisi ;
1. pada halaman sales saya ingin ada div atau header baru yang seperti pada halaman dashboard salesnya. terus saya juga ingin ada tombol dropdown antara cetak pdf dan cetak exsel, yang saya ingin filennya baru lagi yaitu di lib/pdf/sales.js, terus untuk saat mencetaknya saya ingin seperti cetak yang lain yang ambil saja refernsinya di lib/pdf/absensi.js namun saat mencetak sales ini saya ingin ada 2 tabel yaitu terdiri dari tabel utama yaitu tabel salesnya dan tabel detail yang menampung kolom nominal dan persen komisi,dll(yang seperti pada saat diklik) tapi berurutan sesuai dengan tabel utama karnakan tabel detail itu berisi detail dari tabel utama.
2. dihalaman form register public saya ingin menambah validasi baru yaitu untuk whatsapp, dimana formatnya harus diawali angka 08 atau +628 dan panjangnya harus minimal 11 digit.
3. dihalaman form register public tepatnya pada kategori Alumni LP3I saya ingin saat memilih prodinya juga berupa dropdown seperti yg mahasiswa lp3i.
4. dihalamn form register tepatnya jika nama lomba register ini adalah Mobile Legends maka saya ingin ada inputan baru yaitu kolom id_ml, dan kolom id_ml ini juga harus ada validasi panjang karakternya (minimal 4 karakter dan maksimal 12 karakter) dan saya sudah menjalankan sql ini `alter table team_members add column id_ml varchar(20);` dan jika dihalaman pj_lombanya mobile legends maka pj_lombanya juga harus menampilkan kolom id_ml juga.
5. diapi sales ini saya ingin ada validasi yang cukup ketat seperti pada api team.js yang dipublic maupun diadmin