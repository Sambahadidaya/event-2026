ada beberapa tambahan, yaitu untuk tabel master akun dan tabel jurnal entry itu saya ingin menambah kolom site sama seperri yang lain, dan memberi filter juga ketika halamannya dibuka, jadi data yang dimuat sesuai dengan site admin atau role admin. terus saya ingin halaman jurnal entry,master akun,master kategori,transaksi keuangan itu saya ingin diberi caching jadi tidak terus terus diload atau diambil tapi dengan menekan tombol refresh dan direfreshnya juga ada keterangan kapan terakhir diambil seperti halaman lain. terus untuk halaman transaksi keuangan tepatnya pada headernya yang tulisan "Buku Besar Transaksi Keuangan" itu saya ingin diganti menjadi riwayat transaksi. terus untuk halaman dashboard keuangan saya ingin data div headernya yang income,expense,laba bersih itu diambilnya sama seperti pada halaman transaksi keuangan. terus dihalaman diheader dari halaman keaungan ini (dashboard keuangan, verifikasi keuangan,transaksi keuangan,master kategori,master akun, jurnal entry) itu tepatnya disamping tombol resfresh saya ingin memberi tombol dropdown untuk memilih site seperti pada dashbaord keuangan namun jika role adminnya selain * (super_admin) maka dropdown itu tidak bisa dipilih dan menjadi fix sesuai dengan role sitenya admin. terus  dihalaman jurnal entry saya ingin didalam tabel atau dibawah div header itu data yang dimuatnya menjadi 10 row saja bukan 15 row.
terus saya ingin ada halaman baru yaitu halaman buku besar yang setiap akun itu mempunyai tabelnya masing masing yang datanya diambil dari tabel jurnal entry yang tombol navigasinnya itu dibawah jurnal entry. buatkan halamannya semodern mungkin seperti yang lain
terus saya juga  ingin menambah halaman baru yaitu untuk kas masuk, halaman ini mirip dengan halaman transaksi keuangan, hanya saja ini untuk kas masuk. yang tombol navigasinya itu dibawah buku besar
terus saya juga ingin menambah halaman baru yaitu untuk kas keluar, halaman ini mirip dengan halaman transaksi keuangan, hanya saja ini untuk kas keluar. yang tombol navigasinya itu dibawah kas masuk
terus saya juga ingin menambah halaman baru yaitu untuk neraca saldo, buatkan juga semodern mungkin seperti yang lain. yang tombol navigasinya itu dibawah kas keluar
terus saya  juga ingin menambah halaman baru yaitu untuk laporan keuangan yang didalamnya ada beberapa laporan yang pertama laporan laba rugi, laporan kas besar, laporan perubahan modal, laporan posisi keuangan, laporan arus kas, laporan perubahan ekuitas, dan laporan arus kas. buatkan juga semodern mungkin seperti yang lain. yang tombol navigasinya itu dibawah neraca saldo

dan oh iya kenapa ada error ini ;
```log
Console Error



`value` prop on `input` should not be null. Consider using an empty string to clear the component or `undefined` for uncontrolled components.
Call Stack
19

Show 15 ignore-listed frame(s)
input
<anonymous>
DateRangeFilter
file:///C:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/.next/dev/static/chunks/src_1z47p12._.js (787:216)
TransaksiTable
file:///C:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/.next/dev/static/chunks/src_1y3-y0i._.js (3554:239)
KeuanganTransaksiPage
file:///C:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/.next/dev/static/chunks/src_1y3-y0i._.js (4054:216)
```