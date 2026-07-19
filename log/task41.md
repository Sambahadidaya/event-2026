saya ingin merombak api supabase tepatnya difolder src/api/supabase menjadi 2 bagian yaitu src/api/supabase/public dan src/api/supabase/admin. untuk membedakan public dan admin.
terus saya ingin menambah scurity bertingkat karna aku melihat masalah berikut dan ini baru hasil analisis aku dari file peserta.js belum yang lainnya, berikut hasil observasi aku;
1. Celah Broken Function Level Authorization (BFLA)
Seorang attacker yang jeli melihat DevTools bisa mengambil ID hash milik fungsi deletePeserta atau updateStatusPembayaranPeserta.
Skenario Bahaya: Tanpa validasi siapa yang memanggil fungsi tersebut, attacker bisa mengirim request mentah berisi ID peserta lain dan mengubah statusnya menjadi "Lunas", atau bahkan menghapus seluruh data di tabel peserta menggunakan deleteMultiplePeserta.
2. Celah Mass Assignment (Manipulasi Payload)
Perhatikan fungsi fungsi publik ini:
JavaScript
export const insertPeserta = async (payload) => { ... }
Fungsi ini menerima objek payload bulat-bulat dari client dan langsung memasukkannya ke database lewat supabaseAdmin.
Di form client, user mungkin hanya menginput nama dan NIM.
Namun, penyerang bisa memanipulasi request di browser dan menambahkan properti ilegal ke dalam objek payload-nya, misalnya: { nama: "samm", status_pembayaran: "Lunas", jenis_form: "wajib" }.
Karena supabaseAdmin tidak menyaring properti tersebut, data ilegal itu akan langsung lolos ke database kamu.
3. Kebocoran Informasi Detail Database (Information Disclosure)
Perhatikan cara kamu menangani error di hampir semua fungsi:

JavaScript
} catch (error) {
    console.error("Error deleting peserta:", error);
    return { success: false, error: error.message }; // ⚠️ RAW ERROR DIKIRIM KE CLIENT
}
Mengembalikan error.message mentah-mentah dari database Supabase ke sisi client adalah sebuah kerentanan. Jika terjadi eror (misal salah ketik nama kolom di server, masalah relasi tabel, atau constraint), PostgreSQL akan memberikan pesan yang sangat detail.

Risikonya: Attacker bisa sengaja memicu eror untuk memetakan struktur database kamu (mengetahui nama kolom, tipe data, hingga nama tabel internal).

Solusinya: Simpan error detail di log server kamu menggunakan console.error, tapi kembalikan pesan generik yang aman ke client.

JavaScript
} catch (error) {
    console.error("Internal Log:", error); // Tetap aman di server log
    return { success: false, error: "Terjadi kesalahan internal pada server." }; // Aman untuk publik
}
4. Pola Monolithic Actions (Kurangnya Isolasi Fungsi)
Kamu menggabungkan fungsi publik seperti insertPeserta dengan fungsi super-admin seperti deleteMultiplePeserta dan upsertFormRegister di dalam satu file 'use server' yang sama.

Risikonya: Di Next.js, jika kamu tidak sengaja meng-import satu saja fungsi dari file tersebut ke dalam komponen client publik, Next.js akan men-generate server references (ID hash) untuk semua fungsi yang ada di file tersebut ke dalam bundle JavaScript client. Meskipun fungsinya tidak dipanggil, pintunya tetap terbuat dan terekspos di browser.

Solusinya: Pisahkan file Server Actions kamu berdasarkan hak aksesnya (Separation of Concerns).

app/actions/public-actions.js ➡️ Khusus isi insertPeserta, checkPesertaByNim.

app/actions/admin-actions.js ➡️ Khusus isi deletePeserta, updateStatusPembayaranPeserta, dll.
5. Ancaman Race Condition pada Validasi NIM
Di kode client kamu (dari log.md), kamu melakukan pengecekan apakah NIM sudah terdaftar atau belum sebelum melakukan insert:

JavaScript
if (!await l(a.nim)) return window.alert("NIM belum terdaftar...")
Proses ini disebut Time-of-Check to Time-of-Use (TOCTOU). Pengecekan dilakukan di satu waktu, dan pengisian dilakukan di waktu berikutnya.

Risikonya: Jika seorang attacker menggunakan script untuk mengirim 50 request insertPeserta secara bersamaan (concurrent) dengan NIM yang sama, fungsi pengecekan mungkin akan membaca bahwa NIM tersebut "belum terdaftar" pada milidetik yang sama untuk ke-50 request tersebut. Hasilnya? Data duplikat akan jebol masuk ke database.

Solusinya: Jangan mengandalkan validasi flow code untuk mencegah duplikasi. Kamu wajib membuat Unique Constraint atau Unique Index di PostgreSQL Supabase kamu (misalnya gabungan kolom nim + site_type + jenis_form harus Unique). Jadi, jika ada data duplikat yang menembak bersamaan, database kamu yang akan otomatis menolaknya secara instan.
6. Validasi File Mendalam di Server (Deep File Inspection)
Di file log.md, kamu memiliki fungsi uploadFile. Penyerang yang cerdas tidak akan mengunggah gambar bukti bayar asli. Mereka bisa saja mengubah ekstensi file malware atau file HTML berbahaya menjadi .png atau .jpg. Jika admin membuka file tersebut di dashboard, script berbahaya di dalamnya bisa tereksekusi (serangan Stored XSS).

Solusinya: Lakukan validasi ini di dalam fungsi uploadFile di sisi server sebelum dikirim ke Supabase Storage:

Cek Ukuran Maksimal: Batasi tegas (misal maksimal 2 MB).

Cek MIME Type Asli: Jangan cuma percaya ekstensi file (.jpg). Gunakan library seperti file-type di server untuk membaca magic numbers (struktur byte asli dari file) untuk memastikan file itu benar-benar gambar.
7. Gunakan Content Security Policy (CSP)
Bagaimana jika penyerang berhasil memasukkan script berbahaya ke dalam database melalui celah tertentu, lalu script itu muncul di halaman dashboard admin kamu? Di sinilah CSP bertindak sebagai garis pertahanan terakhir di browser.

Solusinya: Konfigurasikan HTTP Header untuk CSP di Next.js kamu (melalui next.config.js atau middleware.js). Batasi dari mana saja script, gaya (CSS), dan gambar boleh dimuat.

Contohnya, pastikan koneksi dan gambar hanya boleh diunduh dari domain kamu sendiri dan domain Supabase kamu (*.supabase.co). Ini akan memblokir script asing yang mencoba mengirimkan data keluar (data exfiltration).
8. Buat Tabel Audit Logs untuk Tindakan Admin
Dalam sistem pendaftaran dan keuangan (status pembayaran), ancaman tidak hanya datang dari luar, tapi bisa juga dari dalam (misalnya ada akun admin yang bocor atau ada kecurangan).

Solusinya: Setiap kali fungsi updateStatusPembayaranPeserta atau deletePeserta berhasil dijalankan, buat fungsi otomatis untuk mencatat aktivitas tersebut ke tabel khusus bernama audit_logs.

Data yang dicatat: Siapa admin yang melakukan, kapan waktunya, ID peserta mana yang diubah, dan apa status sebelum serta sesudahnya. Ini sangat penting untuk kebutuhan analisis forensik jika suatu saat terjadi masalah.
dan aku sudah menjalankan `npm install file-type`