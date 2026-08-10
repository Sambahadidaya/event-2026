fokus ke site pose pada halaman public register dan pembuatan form registernya yang ada di /form/form/page.js, saya ingin menambah kategori baru yaitu untuk alumni lp3i.
terus pada saat pembuatan form register ini disamping memasukan nominal pada tiap kategori yang aktifnya itu saya ingin ada inputan lagi yaitu untuk memasukan persen untuk komisi, yang persen komisi ini akan disimpan ke kolom komisi_sales_lvl1,komisi_sales_lvl2,komisi_sales_lvl3 ditabel form_register_pricing.
terus pada halaman public form registernya itukan ada kategori baru yaitu "Alumni LP3I", terus saya ingin inputannya itu sama seperti dosen hanya saja ada inputan prodi dan angkatannya seperti mahasiswa lp3i, terus kategori Alumni LP3I ini sama seperti kategori yang lain yaitu harus disetting dulu saat pembuatan form karna tiap lomba bisa beda beda kategorinya.
terus diform register public ini jika kategori yang aktifnya Alumni LP3I atau Siswa atau Umum itu ada inputan baru yaitu untuk dari mana mendapatkan informasi lomba ini, dan inputan ini berupa dropdown yang sudah buat variabel barunya dilombaData.js yang bernama SUMBER_LOMBA, jika yang aktifnya Dari Dosen/Manajemen LP3I itu akan ada inputan nama dosen/manajemen lp3i nya, terus jika yang aktifnya Dari Panitia atau dari Dari Mahasiswa LP3I itu akan ada inputan nim panitia atau mahasiswa lp3i nya, dan jika yang aktifnya Dari teman, Dari Website Kampus, Dari Instagram, Dari TikTok itu tidak ada inputan tambahan lagi. yang mana sumber ini akan disimpan ke tabel baru yang ada didatabse yaitu sales_pose yang jika yang aktifnya 'Dari Dosen/Manajemen LP3I','Dari Panitia','Dari Mahasiswa LP3I', itu kan ada inputan baru yang tadi dimasukan nah inputan baru itu akan masuk ke kolom nama_nim ditabel sales_pose tersebut, dan sumber ini juga akan masuk ke kolom sumber_lomba ditabel sales_pose tersebut. terus jika nama/nim itu baru 1 identitas yang sama maka akan mendapatkan komisi dari kolom komisi_sales_lvl1 ditabel form_register_pricing dan nominalnya akan masuk ke kolom nominal ditabel sales_pose yang dihitung dari kolom nominal form_register_pricing dikalikan persen komisi_sales_lvl1 yang ada di tabel form_register_pricing, dan jika identitas di nama/nim itu sudah ada sebanyak 3kali maka ketika ke 4 kalinya akan dihitungnya menjadi dari kolom nominal form_register_pricing dikalikan persen komisi_sales_lvl2, dan jika identitas di nama/nim itu sudah ada sebanyak 6kali maka ketika ke 7 kali dan seterusnya akan dihitungnya menjadi dari kolom nominal form_register_pricing dikalikan persen komisi_sales_lvl3. terus saya ingin ada halaman baru yaitu untuk sales ini yang posisinya berada dibawah pj_lomba diatur dilayout.js dipanitia dan untuk aksesnya saya ingin hanya bisa dibuka oleh admin_pose dan super_admin saja. dan untuk tampilan halamannya buat semodern mungkin, dan ditabel riwayat salesnya saya ingin ambil hanya peridentitas saja jadi tidak duplikat identitas tapi ketika row tabel identitas itu diklik atau disentuh maka akan terlihat riwayat detailnya dan juga saya diatas tabel riwayat sales ini ada banyak grafik dan yang pastinya juga ada filter search nama/nim dan filter dropdown tiap nama lombanya, terus untuk tabel riwayat sales ini kolomnya terdiri dari no,sumber,nama/nim,total nominal komisi,delete. untuk nama/nim dan nominalnya bisa kosong karna kan kalau sumbernya Dari teman, Dari Website Kampus, Dari Instagram, Dari TikTok itu tidak ada identitas/orangnya. dan ketika row ini diklikkan akan ada tabel detailnya yang berada dibawah tabel riwayat sales yang terdiri dari no,sumber,nama/nim,nim target sales,nominal,persen komisi,nama lomba,tanggal transaksi, dan dipaling bawah rownya ada total nominalnya. yang berarti saya ingin ada file baru yaitu untuk halaman sales ini yang stukturnya sales/dashboard/page.js dan sales/riwayat/page.js dan jgua saya ingin ada api baru untuk admin dan untuk publicnya, dan saya juga ingin ada components baru. untuk api pastikan tidak mengambil semua data (select *) tapi ambillah data yang secukupnya/yang relevan saja. dan pakailah metode caching.
terus saat ada sales inikan otomatis ada potongan sales ditabel transaction_finance nah saya ingin jika memang ada sales itu akan masuk nominalnya dikolom baru yaitu potongan_sales dan untuk identitasnya masuk ke kolom nama_nim_sales_id, yang otomatiskan dijurnal entrynya akan menjadi 4 entry bukan 2 entry lagi yaitu seperti awal (aset,income) dan ada akun entry baru yaitu akun utang komisi sales dan beban komisi sales tapi jika tidak ada sales maka seperti biasa saja yaitu cukup 2 entry.  
dan berikut sql yang sudah aku jalankan disupabase ;
```sql
CREATE TABLE sales_pose(
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sumber VARCHAR(100) NOT NULL,
  nama_nim VARCHAR(100),
  nominal INT4,
  form_register_id UUID REFERENCES form_register(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE sales_pose ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth all sales_pose" ON sales_pose FOR ALL TO authenticated USING (true) WITH CHECK (true);

alter table transaction_finance
ADD COLUMN potongan_sales int4 default 0,
ADD COLUMN nama_nim_sales_id UUID REFERENCES sales_pose(id) ON DELETE CASCADE;

alter table form_register_pricing
ADD COLUMN komisi_sales_lvl1 INT4 default 0,
ADD COLUMN komisi_sales_lvl2 INT4 default 0,
ADD COLUMN komisi_sales_lvl3 INT4 default 0;


INSERT INTO master_account (kode_id, kode_akun, nama_akun, akun_type, site)
VALUES
  ('MA013', '2002', 'Utang Komisi Sales','Liability','pose'),
  ('MA014', '5005', 'Beban Komisi Sales','Expense','pose')
  ON CONFLICT (kode_akun) DO NOTHING;
```

terus aku juga sudah mengedit lombaData.js dan menambahkan variabel baru yaitu SUMBER_LOMBA :
```javascript
export const SUMBER_LOMBA = [
    'Dari Website Kampus',
    'Dari Instagram',
    'Dari TikTok',
    'Dari Teman',
    'Dari Dosen/Manajemen LP3I',
    'Dari Panitia',
    'Dari Mahasiswa LP3I',
    'Lainnya'
];
```