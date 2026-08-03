fokus ke halaman panitia tepatnya dipj_lomba, saya ingin menambah halaman baru yaitu untuk jadwal pertandingan, yang mana dihalaman jadwal pertandingan ini datanya dimuat sesuai role admin (logikanya sama seperti pada halaman /pj_lomba/form_register) terus saat pembuatan jadwal pertandingan ini jika yang admin atau pj lombanya berjenis kreativitas maka cuman memasukan 1 team saja dan jika untuk olahraga memasukan dua team, dan untuk games juga sama seperti olahraga, dan tidak ada atau tidak usah memasukan skor jadi ini cuman untuk jadwalnya saja, terus untuk posisi navbar atau difile panitia/layout.jsnya itu berada dibawah `<NavLink href="/panitia/pj_lomba/form_register" icon={Users} label="Manajemen Team" colorTheme="violet" />
` terus dihalaman jadwal pertandingan ini juga ada filter atau header sama seperti /pj_lomba/form_register, terus untuk tampilannya saya ingin semodern mungkin. dan saya juga sudah menambah kolom baru lagi didatabase jadwal_pertandingan yaitu ;
```sql
alter table jadwal_pertandingan
ADD COLUMN urutan INT4 default 0;
```
jadi pada saat pembuatan jadwal pertandingan ini saya ingin urutannya diisi manual dan urutan ini bisa sama dengan urutan lomba lainnya.
terus dipj_lomba ini juga saya ingin ada halaman baru yaitu untuk penilaian, logikanya sama seperti halaman tadi (jadwal pertandingan), tapi penilaian ini saya ingin hanya khusus untuk kreativitas, terus dihalaman penilaian ini mempunyai header atau filter sama seperti /pj_lomba/form_register, terus dibawahnya ada 2 tabel yaitu terdiri dari tabel untuk penilian dan ada tabel detail penilaian, dan saya juga ingin ada pembuatan form untuk tabel penilaian, terus ditabel detail penilaian ini hanya menampilkan detail penilaiannya yang diambil dari tabel detail_penilaian_lomba didatabase terus untuk pembuatan formnya dibuat atau dimuat ditabel form_nilai_lomba didatabase. jadi penilaian ini akan ditilai dari form didalam form itu nilainya bisa lebih dari satu dengan menyimpannya berupa list misal (tema,kesesuaian,dll)dan bobot nilainya juga bisa banyak sesuai dengan jumlah judul nilainya. dan ketika menginput nilai diformnya itu yang masuk ke tabel detail_nilai_lomba itu bisa banyak (tergantung dari form nilai lomba yang dibuat) terus ketika input ini hasil akhir nilainya akan masuk ke nilai_akhir ditabel nilai_lomba dengan sudah menghitung penjumlahan/pembagian dengan bobot nilai dan detail_nilai. terus ketika membuat form nilai ini akan ada link untuk akses formnya yang akan berada di app/pose/nilai/[link].
dan aku sudah membuat tabel didatabasenya dengan sql ini ;
```sql
-- penilaian
CREATE TABLE form_nilai_lomba (
    id UUID PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),
    nama_juri VARCHAR(100) NOT NULL,
    link_id VARCHAR(100) NOT NULL UNIQUE,
    jenis_lomba VARCHAR(100) NOT NULL,
    nama_lomba VARCHAR(100) NOT NULL,
    judul_nilai VARCHAR(200),
    bobot_nilai VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE nilai_lomba (
    id UUID PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES team(id) ON DELETE CASCADE,
    form_nilai_lomba_id UUID REFERENCES form_nilai_lomba(id) ON DELETE CASCADE,
    kritik TEXT,
    saran TEXT,
    nilai_akhir DECIMAL(5,2),
    status_public boolean DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE detail_nilai_lomba (
    id UUID PRIMARY KEY NOT NULL DEFAULT uuid_generate_v4(),
    nilai_lomba_id UUID REFERENCES nilai_lomba(id) ON DELETE CASCADE,
    form_nilai_lomba_id UUID REFERENCES form_nilai_lomba(id) ON DELETE CASCADE,
    judul_nilai VARCHAR(100),
    bobot_nilai VARCHAR(100),
    nilai INT4,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE form_nilai_lomba ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read form_nilai_lomba" ON form_nilai_lomba FOR SELECT TO public USING (true);
CREATE POLICY "auth all form_nilai_lomba" ON form_nilai_lomba FOR ALL TO authenticated USING (true) WITH CHECK (true);
ALTER TABLE nilai_lomba ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read nilai_lomba" ON nilai_lomba FOR SELECT TO public USING (true);
CREATE POLICY "auth all nilai_lomba" ON nilai_lomba FOR ALL TO authenticated USING (true) WITH CHECK (true);
ALTER TABLE detail_nilai_lomba ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read detail_nilai_lomba" ON detail_nilai_lomba FOR SELECT TO public USING (true);
CREATE POLICY "auth all detail_nilai_lomba" ON detail_nilai_lomba FOR ALL TO authenticated USING (true) WITH CHECK (true);
```
yang otoamtis semua halaman baru ini akan mempunyai api dan componens baru.

terus perbaiki juga dihalaman public pose tepatnya di /pose/jadwal karna saya tidak ingin ketika live (Sedang berlangsung) itu tidak menampilkan skornya. dan jangan pakai tabel hasil hasil pertandingan lagi. terus untuk klasemen/bagan itu jadi tidak menampilakan juara atau skor lagi dan dirahasiakan, terus pada saat pengambilan team didatabase itu ambil seperlunya aja jangan semuanya seperti kolom bukti_bayar atau bukti_bayar atau instagram_link atau kode_form jangan diambil(Select) dan begitu juga dihalaman public /pose/team.
silahkan baca codingan atau file yang relevan dan jangan cuman asumsi.