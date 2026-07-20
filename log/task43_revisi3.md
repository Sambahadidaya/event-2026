saya sudah menambah kolom baru didatabase yaitu seperti ini ;
```sql
ALTER TABLE peserta
ADD COLUMN IF NOT EXISTS kode_form varchar(10);
ALTER TABLE form_register
ADD COLUMN IF NOT EXISTS kode_form varchar(10) Unique;
ALTER TABLE form_wajib
ADD COLUMN IF NOT EXISTS kode_form varchar(10) Unique;
ALTER TABLE team
ADD COLUMN IF NOT EXISTS kode_form varchar(10) Unique;
```
nah sekarang saya ingin ketika membuat form register atau form wajib otomatis kode_form itu terisi dengan formatnya gini
1. jika diform wajib maka formatnya (2 huruf site aktif, jika pkkmb maka Pk, jika pose maka Ps)+(2 angka random)+(2huruf random).
2. Jika diform register maka formatnya 2 huruf site aktif(yaitu Ps karna tidak ada pkkmb)+2 huruf jenis_lomba(Olahraga maka Ol, kreatfitas maka Kr, games maka Ga)+2 huruf nama_lomba(sesuaikan) +2 angka random +2 huruf random.

nah sekarang untuk tabel peserta ini tidak akan diisi manual oleh admin, tapi akan otomatis terisi ketika peserta mengisi form register atau form wajib. jadi ketika peserta mengisi form register atau form wajib maka otomatis terisi juga di tabel peserta. dengan formatnya ambil dari kode_form di form mau itu diwajib atau register +2 angka random +2 huruf random. tapi saya ingin jika saat mengisinya diform register itukan bisa langsung banyak peserta atau anggota nah maka kode_formnya samakan saja untuk semua peserta/anggota dalam 1x register itu dan kode_form saat register ini juga akan terkirim ke kode_form diteam, jadi kode form dipeserta dan diteam itu samakan.
kode_form ini bersifat rahasia (tidak boleh diketahui public) dan kode form dipeserta atau diteam ini akan menjadi kunci penghubung untuk nantinya diform pengumpulan file.
terus sekalian bikin form baru yaitu untuk pengumpulan lomba dan saya sudah menyiapkan folder dan filenya yaitu di src/app/pose/submission/[id]/page.js , page.js ini hanya untuk halaman form submission sedangkan untuk aksi submitnya ada di src/api/supabase/public/submission.js jangan lupa pakai scurity yang ketat. dan aku sudah menjalankan sql ini ;
```sql
CREATE TABLE form_pengumpulan(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES form_register(id) ON DELETE CASCADE,
    link_id VARCHAR(64) NOT NULL UNIQUE,
    status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE pengumpulan_lomba(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES form_pengumpulan(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES team(id) ON DELETE CASCADE,
    keterangan TEXT DEFAULT null,
    file_link VARCHAR(255) NOT NULL,
    status_pengumpulan BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
dan saya sudah mempunyai bucket disupabase untuk file pengumpulan ini, yang nama bucketnya "pengumpulan".
dan didalam halaman form pengumpulan itu terdiri dari keterangan form yang berada diheader terus baru masuk ke inputan yang terdiri dari keterangan atau deskripsi karya, terus tombol swich antara upload file atau input link, jika upload file maka hanya bisa upload 1 file maksimal 10mb, jika input link maka hanya bisa input 1 link, bisa link google drive atau link youtube, terus inputan kode_form, yang dimana ini kunci penghubung antara team dan peserta karna kode_form ini diteam dan dipeserta sama, jadi inputan kode_form ini cek apakah kode_form tersebut ada di tabel team.
dan untuk manajemen formnya saya ingin samakan difolder panitia/form/form, jadi didalam itu mempunyai 3 form sekaligus yaitu form wajib from register dan form pengumpulan.
dan buatkan file komponennya juga yaitu /panitia/AdminFormPengumpulan.js terus /panitia/AdminPesertaPengumpulan.js dan /public/FormPengumpulan.js, jadi dipanitia cukup memanggil komponen ini seperti pada form lainnya.
berikan aku planning terbarunya dulu.
