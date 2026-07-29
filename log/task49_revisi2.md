ada beberapa revisi, berikut revisinya
1. waktu saya menginput gambar diform wajib atau register itu kenapa ada error limit ini ;
```log
⨯ Error: Body exceeded 1 MB limit.
To configure the body size limit for Server Actions, see: https://nextjs.org/docs/app/api-reference/next-config-js/serverActions#bodysizelimit
    at ignore-listed frames {
  statusCode: 413,
  digest: '2042690711@E394'
}
 POST /pkkmb/form/rR-MfjwjnhJ72ZAhZEroYba3jwPZRDVX 500 in 1071ms (next.js: 34ms, application-code: 1036ms)
[browser] Submission error: TypeError: Failed to fetch (file://C:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/.next/dev/static/chunks/src_1sbzimo._.js:864:21)
```
padahalkan saya sudah membuat kompress foto distorage.js??
2. terus untuk halaman metode-pembayaran itu saya ingin difilter sesuai admin yang login, jika yang login pkkmb maka hanya site pkkmb yang aktif, dan jika yang loginnya pose maka site pose yang aktif, jadi cuman 1 site saja yang aktif tergantung yang login tapi jika yang loginnya super_admin maka bisa memilih. padahal dihalaman itu dicodingannya sudah ada variabel adminRole tapi belum dipakai.
3. terus dihalaman public form tepatnya dihalaman FormRegistration.js saya ingin dibawah div /* Detail Info Rekening / QRIS yang dipilih */ itu ada tombol, jika selain qris yang dipilih maka tombolnya salin nomor rekening, tapi jika qris yang dipilih maka tombolnya unduh qris.