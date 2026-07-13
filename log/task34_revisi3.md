fokus ke halaman materi pkkmb, 
1. saya ingin dinavbarnya itu tepatnya disebelah kanan tombol swich materi/tugas saya ingin diberi tombol swich darmode/lighmode seperti pada navbar biasa,
2. terus untuk halaman materi saya ingin memberi caching agar ketika dibuka lagi user tidak merender pdf lagi, jadi cukup load sekali lalu bisa dibuka berkali-kali.
3. terus saya ingin didiv pdf itu tepatnya dipojok kanan atas dalam div itu saya ingin memberi tombol unduh pdfnya, dan disebalh pojok kiri div itu saya ingin memberi tombol untuk mencari halaman pdf itu karna kan dalam pdf bisa banyak halaman, dan ketika discrol pdf itu angka halamannya ikut berubah juga jadi seperti ada kontrol untuk pdfnya. 
4. saya ingin untuk header gambar pada bagian materi itu diberi animasi zoom sedikit ketika di hover.
5. terus saya ingin keterangan seperti judul,nama pemateri, tanggal itu bukan didalam div header gambar tapi dibawah header gambar, dan pastikan tampilannya tetap elegan dan responsif.
6. terus untuk chatbot baru (SamsMateriBot.js) saya ingin disimpan lognya dan juga tokennya seperti pada chatbot biasa (SamsChatbot.js).
7. terus untuk background halaman materi ini saya ingin menggunakan backgound seperti yang lain yang dari SiteBackground.js

sekarang fokus ke halaman contact, ada bug ini pada log jadi perbaiki ;
```log
 GET /pkkmb/contact 200 in 236ms (next.js: 42ms, application-code: 194ms)
[browser] Uncaught ReferenceError: Mail is not defined
    at ContactForm (file://C:/Users/samba/OneDrive/Documents/PKKMB-POSE/portal-kampus-2026/.next/dev/static/chunks/_1rsze4z._.js:683:218)
    at PkkmbContact (src\app\pkkmb\contact\page.js:14:13)
  12 |                 subtitle="Punya pertanyaan? Kirim pesan atau hubungi kami melalui media ...
  13 |             />
> 14 |             <ContactForm site="pkkmb" />
     |             ^
  15 |         </div>
  16 |     );
  17 | }
```