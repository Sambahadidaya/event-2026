fokus ke halaman materi yang di pkkmb, itu pada saat mengupload rangkuman itu tidak muncul dan malah kosong seperti pada gambar `log/tugas.png` dan masalah ini terjadi ketika sudah upload gambar tapi memang belum disubmit, dan aku memang ingin meskipun belum disubmit gambarnya bisa dilihat sebelum dikirim atau disubmit.
terus dihalaman materinya yang pdfnya masih tidak muncul dan ada keterangan "Gagal memuat dokumen langsung di dalam aplikasi." dan ada log error ;
```log
Console Error



Warning: Error: Setting up fake worker failed: "Failed to fetch dynamically imported module: https://unpkg.com/pdfjs-dist@5.4.296/build/pdf.worker.min.js".
Call Stack
54

Show 52 ignore-listed frame(s)
PdfViewer
file:///C:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/.next/dev/static/chunks/src_components_public_PdfViewer_0q85yar.js (365:225)
PkkmbMateriDetailPage
file:///C:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/.next/dev/static/chunks/src_1nx_atd._.js (1962:253)
```
dan diconslogenya ada ;
```log
POST /pkkmb/materi/fe1f4abb-8e76-4280-8e27-9f94be683d72 200 in 192ms (next.js: 46ms, application-code: 146ms)
  └─ ƒ getStatusPengembangan("pkkmb", "/materi") in 13ms src/api/supabase/public/pengembang.js
[browser] Warning: Setting up fake worker. (file://C:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/.next/dev/static/chunks/node_modules_0hiyp22._.js:2328:17)
[browser] Warning: Error: Setting up fake worker failed: "Failed to fetch dynamically imported module: https://unpkg.com/pdfjs-dist@5.4.296/build/pdf.worker.min.js".
```