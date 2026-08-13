fokus ke halaman form wajib dengan sitenya pkkmb, yang filenya ada di src/components/public/FormWajib.js dan pembuatan formnya yang berada di src/app/panitia/form/form/page.js.
pada pembuatan form wajib dengan site pkkmb saya ingin untuk nominalnya dipecah lagi perkelas yang dimana kelasnya itu terdiri dari Reguler,NonReguler, Dan KIP. nah disetiap kelas itu mempunyai nominalnya berbeda dan juga ada tahapannya yang tediri dari tahap 1, tahap 2, dan full tapi untuk yang kelasnya kip tidak bisa tahap 1 atau tahap 2 karna untuk yang kelas kip langsung full (jadi untuk tabel form_wajib didatabase tidak menyimpan nominalnya tapi di tabel ini)
terus di halaman public form wajib denga site pkkmb itu nominalnya juga dinamis tergantung kelas yang aktif, dan nominal akan muncul jika kelasnya sudah dipilih, tapi untuk kelas KIP nominalnya jangan ditampilkan (karena rahasia). terus saya juga ingin ada inputan baru yaitu antara pembayaran bertahap atau pembayaran langsung (full) tapi alurnya user masukan dulu kelas setelah kelas baru masukan jenis bayarnya dan posisi inputan kelas dan jenis bayar itu menjadi diatas dan inputannya tetap berupa pilihan option. terus ketika mengirim data ini akan terkirim juga ke tabel baru yaitu tabel pembayaran_pkkmb yang terdiri dari id,nim_user,jenis_bayar,tahapan,nominal,status_pembayaran. terus jika yang aktif itu jenis bayarnya tahap 2 maka user cuman memasukan nim aja untuk pengiriman data ini karna sisanya akan dimapping atau diambil dari data pertama dan saya juga ingin ada validasi tambahan untuk tahap 2 ini yaitu mengecek apakah benar nim tersebut sudah pernah melakukan pembayaran tahap 1 atau belum jika belum maka form akan menolak dan tidak akan mengirim datanya yang pengecekan ini ke tabel pembayaran_pkkmb dengan mencocokan nimnya.
terus dihalaman keuangannya saya masih bingung karnakan nominal ini dinamis bukan dari form_wajib lagi dan secara tidak langsungkan user pasti maks masukin formnya 2 kali dan itu berakibat ke tabel peserta dan tabel akuntansi ini, tapi saya inginnya gini aja untuk waktu verifikasi akan masuk ke tabel baru aja dan ditabel peserta tetap statusnya pending dan ketika nominal ditabel pembayaran_pkkmb sudah sesuai dengan jumlah nominal di form_wajib_pricing maka status_pembayaran ditabel pesertanya menjadi lunas dan diupdate lunas ini hanya data peserta yang pertamanya, jadi misal peserta itu sudah isi form 2 kali karna ingin bertahap dan ketika tahap kedua yaitu pada pelunasan maka yang diupdate lunasnya cuman data peserta yang pertama aja dan juga update lunas ini berlaku jika nominalnya seperti tadi (yang sesuai jumlah tadi) ditambah jika status_pembayaran ditabel pembayaran_pkkmbnya keduanya lunas (tahap 1 dan tahap 2), dan dihalaman verifikasi pembayaran yang dihalaman src/panitia/keuangan/verifikasi/page.js itu verifikasinya ke tabel pembayaran_pkkmb ini (dan ini juga jika adminnya pkkmb) bukan ke tabel peserta lagi. terus jika yang bayarnya tahap 1 kan secara tidak langsung akan ada kolom atau row untuk piutang diakuntansi/jurnal entrynya tapi jika jenis bayarnya langsung (full, selain tahap 1 dan tahap 2) maka cukup double entry aja. terus ada perbaikan sedikit pada akuntansi yang site pose yaitu pada saat transaksi yang ada komisi itukan dijurnal entry sudah masuk akun Utang Komisi Sales dan Beban Komisi Sales tapi pada perhitungan expense yang didashboard atau diriwayat transaksi itu gak masuk, padahalkan itu termasuknya sudah ada pengeluaran.
kembali lag ke akuntansi site pkkmb, saya ingin ada halaman baru lagi yaitu halaman data peserta yang sudah aku siapkan di src/app/panitia/keuangan/data_peserta/page.js yang isinya berupa mapping yang memperlihatkan mana yang sudah bayar dan mana yang masih ada tunggakan/tagihan yang dari logikanya dari pertahap itu dan untuk desain atau layoutnya saya ingin seperti verifikasi. tapi tabel dihalaman itu terdiri dari No,Nama,NIM,Email/WA,Jumlah Nominal, Total Tagihan, lihat detail. dan ketika tombol lihat detail akan memperlihatkan modal detailnya beserta tiap tahapnya.
dan aku sudah menjalankan sql ini didatabase ;
```sql

CREATE TABLE public.form_wajib_pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES public.form_wajib(id) ON DELETE CASCADE,
    kelas VARCHAR(50) NOT NULL,
    nominal INT4 NOT NULL DEFAULT 0,
    jenis_tahapan VARCHAR (20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE public.form_wajib_pricing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read pricing" ON public.form_wajib_pricing FOR SELECT TO public USING (true);
CREATE POLICY "auth all pricing" ON public.form_wajib_pricing FOR ALL TO authenticated USING (true) WITH CHECK (true);


CREATE TABLE public.pembayaran_pkkmb (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nim_user VARCHAR(50) NOT NULL,
    jenis_bayar VARCHAR(50) NOT NULL,
    tahapan VARCHAR(50) NOT NULL,
    nominal INT4 NOT NULL DEFAULT 0,
    status_pembayaran VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE public.pembayaran_pkkmb ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read pricing" ON public.pembayaran_pkkmb FOR SELECT TO public USING (true);
CREATE POLICY "auth all pricing" ON public.pembayaran_pkkmb FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO master_account (kode_id, kode_akun, nama_akun, akun_type, site)
VALUES
  ('MA015', '1005', 'Piutang','Asset','pkkmb')
  ON CONFLICT (kode_akun) DO NOTHING;
```
semua ini saya ingin menggunakan api serve action yang di src/api/supabase/public/ atau src/api/supabase/admin/ dan juga saya ingin pakai components yang ada di src/components/public/ atau src/components/panitia/ dan saya ingin untuk api atau penggunakan select itu secukupnya aja, ambil yang perlunya dan sangat hindari select semua (select *). dan pakai caching juga untuk halaman admin atau halaman panitianya ini. dan bacalah file yang saling berkaitan atau yang relevan, jangan sampai membaca seluruh file dan jangan sampai juga sampai asumsi aja. untuk struktur project atau schema database ada difile AGENTS.md, jadi lihat dulu file AGENTS.md setelah itu baca yang relevan