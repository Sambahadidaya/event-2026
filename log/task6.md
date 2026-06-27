# promt ;
fokus pada file task6.md lalu baca dan kerjakanlah yang disuruh difile itu.

# jawaban ai ;
Saya telah membuat rencana implementasi berdasarkan instruksi di task6.md dan membagikannya kepada Anda. Silakan tinjau dan klik Proceed jika Anda setuju.

Satu catatan penting: sepertinya tabel kontak belum ada di database (atau belum disebutkan pada konfigurasi awal). Saya mencantumkan struktur tabel tersebut di bagian "Open Questions" agar Anda bisa menambahkannya nanti jika memang belum ada. Jika Anda setuju, mari kita mulai implementasinya!

24/06/2026 - 12:56 AM

## Implementasi Form Kontak dan Validasi Chatbot

Rencana ini mencakup pembuatan komponen form kontak yang interaktif dengan validasi, pembatasan rate-limit, serta integrasi Supabase. Selain itu, chatbot juga akan diperbarui sesuai dengan instruksi pada `task6.md`.

## Proposed Changes

### Komponen Baru

#### [NEW] `src/components/ContactForm.js`
- Form dengan input: Nama, Email, WhatsApp, dan Pesan.
- Validasi:
  - Nama hanya boleh berisi huruf abjad dan spasi.
  - User harus mengisi Email ATAU WhatsApp (tidak boleh keduanya).
  - Format Email divalidasi.
  - Pesan wajib diisi.
- Rate-limiting: Maksimal 3 kali submit dalam 1 jam (menggunakan `localStorage`).
- Notifikasi: Toast pop-up success dan error ("Pesan anda berhasil terkirim...", "Pesan anda gagal terkirim...").
- UX: State loading saat submit, form dibersihkan setelah sukses.
- Desain modern, responsif, animasi halus.
- Integrasi Supabase untuk insert ke tabel `kontak` dengan data `nama`, `email`, `whatsapp`, `pesan`, dan `site` (berdasarkan props `site`).
- Menampilkan ikon media sosial (yang dipindahkan dari halaman kontak) berukuran lebih kecil dan berjejer rapi di bawah form.

### Modifikasi Halaman

#### [MODIFY] `src/app/pkkmb/contact/page.js`
- Menghapus card sosial media yang statis.
- Memanggil komponen `<ContactForm site="pkkmb" />`.

#### [MODIFY] `src/app/pose/contact/page.js`
- Menghapus card sosial media yang statis.
- Memanggil komponen `<ContactForm site="pose" />`.

#### [MODIFY] `src/components/SamsChatbot.js`
- Rate-limiting: Maksimal 5 pertanyaan dalam 1 jam (disimpan di `localStorage`). Peringatan bila batas tercapai.
- Validasi Input:
  - Maksimal 50 karakter.
  - Hanya huruf abjad dan spasi yang diperbolehkan.
- Pembatasan Topik: Chatbot hanya akan merespon jika input terdeteksi berhubungan dengan topik yang ada di FAQ.

## Open Questions

> [!WARNING]
> Tabel `kontak` di database Supabase sepertinya belum ada di script instalasi awal. Pastikan tabel `kontak` sudah dibuat dengan struktur minimal seperti berikut:
> ```sql
> CREATE TABLE kontak (
>     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
>     nama VARCHAR(255) NOT NULL,
>     email VARCHAR(255),
>     whatsapp VARCHAR(20),
>     pesan TEXT NOT NULL,
>     site site_type NOT NULL,
>     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
> );
> ```

Silakan klik **Proceed** jika setuju dengan rencana di atas, dan saya akan mulai membuat serta memodifikasi kodenya!

Tugas pada task6.md sudah selesai saya kerjakan! 🎉

Berikut ringkasan fitur yang telah ditambahkan:

Form Kontak Dinamis: Komponen baru <ContactForm /> dibuat dengan validasi input yang ketat (Nama abjad saja, pilih antara mengisi Email atau WhatsApp, pesan wajib, dst). Form tersebut menampilkan pop-up toast untuk memberikan feedback instan (sukses/gagal) dan dihiasi tampilan modern.
Rate Limit Form Kontak: User hanya bisa submit kontak 3 kali per jam.
Media Sosial Ringkas: Ikon media sosial dipindahkan ke dalam Form Kontak di bagian bawah dengan susunan rapi berdampingan dan otomatis diarahkan ke link masing-masing web (PKKMB atau POSE).
Validasi Chatbot: Chatbot SamsChatbot.js juga sudah diberi rate limit (5 kali chat per jam), input validasi khusus abjad dengan batasan maksimal 50 karakter, dan batas pertanyaan yang hanya bisa menjawab FAQ seputar PKKMB/POSE saja.
Anda dapat melihat rincian pekerjaan yang sudah selesai pada dokumen Walkthrough yang saya lampirkan.

(Catatan: Karena tabel kontak baru saja Anda tambahkan ke AGENTS.md, pastikan Anda juga sudah mengeksekusi script SQL tersebut di database Supabase agar data form yang disubmit bisa masuk ya!)

Ada hal lain atau penyesuaian yang ingin dilakukan?

24/06/2026 - 12:58 AM

# keterangan task6.md ;
 
buatkan aku file componen baru yaitu untuk form dihalaman kontak mau itu dipkkmb atau dipose, formnya itu terdiri dari nama, email or whatsapp, dan isi pesan. kan itu ada email or whastapp jadi user bisa mengisi email atau whatsapp tanpa mengisi keduanya. terus nantinya ketika user mengirim pesan maka pesan itu akan masuk ke database dengan nama tabel kontak, dengan kolom site sesuai dengan user mengisi form dipkkmb atau dipose. dan saya juga ingin ditambahkan validasi email dan whatsapp, ketika user mengisi email maka whatsapp tidak boleh diisi begitu juga sebaliknya. dan ketika user mengisi email maka email harus valid, begitu juga sebaliknya. terus isi pesan tidak boleh kosong, dan semua inputan ini bersifat wajib diisi, oiya satu lagi ketika user berhasil mengisi form maka tampilkan pop up toast success, dan ketika gagal maka tampilkan pop up toast error. dan tampilkan tombol submit yang nanti ketika user klik akan mengirim pesan ke database. tampilkan loading ketika user sedang mengisi form, dan ketika user berhasil mengisi form maka tampilkan pop up toast success, dan hapus semua inputan setelah berhasil mengirim. untuk tampilan form buatlah yang bagus dan modern, gunakan layout yang bagus dan jangan sampai berantakan, gunakan animasi dan transisi yang bagus. dan tidak memberatkan kalau dimobile. terus beri semua validasi seperti pencegahan karakter spesial, inputannya cuma boleh huruf abjad, dan lain sebagainya. ketika user mengisi form dan berhasil mengirim pesan maka tampilkan pesan "Pesan anda berhasil terkirim, kami akan segera menghubungi anda", dan ketika user gagal mengirim pesan maka tampilkan pesan "Pesan anda gagal terkirim, silahkan coba lagi". oiya satu lagi, ketika user mengisi form dan berhasil mengirim pesan maka hapus semua inputan dan tampilkan pop up toast success, dan ketika user gagal mengirim pesan maka tampilkan pop up toast error. dan tampilkan loading ketika user sedang mengisi form, dan ketika user berhasil mengisi form maka tampilkan pop up toast success, dan hapus semua inputan setelah berhasil mengirim. terus untuk media sosial yang ada dikontak itu juga pindahkan ke componen dan tampilannya rubah menjadi lebih kecil dan ketiga media sosial itu berada dibawah form dan div sosial media itu panjangnya sebesar form itu jadi misal itukan sosial medianya ada 3 maka ketiga itu akan berjajar kesamping dan tidak melebihi panjang form dan juga media sosial itu bisa diklik dan ketika diklik maka akan pindah ke halaman media sosial yang sesuai. terus saya ingin untuk form ini bisa diisi atau dikirim ada limit yaitu cuman 3kali dalam 1 jam, jadi tidak bisa spam. dan untuk chatbot punya limit 5 kali chat dalam 1 jam. dan ada peringatan jika sudah mencapai limit itu. dan juga dichatbot ingin diberi validasi yaitu cuman bisa ngirim huruf abjad saja dan diberi limit karakter 50 dan tidak bisa bertanya selain tentang pkkmb/pose yang sudah disiapkan.