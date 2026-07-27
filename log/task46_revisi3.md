untuk detail struktur folder atau schema database atau defedensi bisa dilihat difile AGENTS.md, jadi gak perlu explored atau menganalisis manual!.
pada halaman keuangan tepatnya dihalaman neraca saldo saya tidak bisa membuka halamannya dan ada error ini ;
```log
 POST /panitia/keuangan/neraca-saldo 200 in 232ms (next.js: 36ms, proxy.ts: 25ms, application-code: 171ms)
  └─ ƒ getCurrentAdmin() in 145ms src/api/supabase/admin/auth.js
[browser] Uncaught ReferenceError: trialBalance is not defined
    at NeracaSaldoTable (file://C:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/.next/dev/static/chunks/src_1nxx---._.js:1781:39)
    at KeuanganNeracaSaldoPage (file://C:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/.next/dev/static/chunks/src_1nxx---._.js:2207:216)
 POST /panitia/keuangan/neraca-saldo 200 in 278ms (next.js: 37ms, proxy.ts: 20ms, application-code: 222ms)
  └─ ƒ getCurrentAdmin() in 191ms src/api/supabase/admin/auth.js
```
terus disemua halaman keuangan yaitu halaman riwayat transaksi atau transaksi, master kategori,master akun,jurnal entry,buku besar,kas masuk,kas keluar,neraca saldo,laporan keuangan itu site portal kampusnya gak usah ada karna memang gak ada admin yang rolenya portal, terus untuk admin yang super_admin itu bisa memuat semua site tapi sitenya memang gabungan bukan site all karna site all itu gak ada!.
terus saat pembuatan invoice atau kwitansi (pokonya yang pembuatan documents) itu kolom printed_by yang ditabel documents itu diambilnnya dari kolom nama pada admins bukan kolom email.
terus saat pembuatan cetak exsel atau pdf itu datanya diambil dari caching saja gak usah ambil lagi dari database.
terus pada halaman buku besar saat ingin mencetak pdf atau exsel itu tiap akunnya memiliki tabel sendiri seperti pada halaman buku besar itu. dan juga pada halaman laporan keuangan juga sama saya ingin waktu mencetak pdf atau exsel itu dicetaknya sesuai dengan tampilan halaman itu. jadi format atau layout atau template ketika dicetaknya bisa bede beda tergantung yang dicetaknya halaman mana. 
terus halaman verifikasi pendaftaran juga saya ingin ada cetak pdf atau cetak exsel yang sesuai dengan form yang aktif
terus ketika pembuatan qr itu saya ingin ditengah qrnya ada logo jika sitenya pkkmb maka pakai logo yang ada difile /assets/logo_pkkmb/icon-logo.png, jika sitenya pose maka pakai logo yang ada difile /assets/logo_pose/icon-logo2.png.
terus pada saat pembuatan qr dipdf itu saya ingin datanya qrnya bisa discan seperti digoogle lens atau scan device lainnya yang saat dibaca itu akan berupa link menuju website pkkmb atau pose, dan ketika dibuka websitenya maka halaman atau tampilan dipdf itu bisa dibaca yang saya sudah menyiapkan folder dan filenya di /app/pkkmb/pdf/[id]/page.js atau di /app/pose/pdf/[id]/page.js
terus hapus dan pindahkan api yang ada di /app/api/finance/pdf/route.js ke /api/finance/pdf/route.js
