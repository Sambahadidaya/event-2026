saya ingin membuat halaman baru dipanitia pkkmb yaitu untuk manajemen jadwal acara seperti pada pose, kan ditabel jadwal_acara itu ada kolom site_type, dan itu baru dipakai pada pose saja, dan sekarang saya ingin memakai untuk pkkmbnya.
terus saya ingin dihalaman public pkkmb saya ingin menambah halaman baru yaitu untuk jadwal, dan didalam halaman jadwal itu saya ingin berupa div yang isinya adalah jadwal materi/kegiatan pkkmb, dan saya ingin dalam divsitiap jadwal nya itu ada 
- header foto materi
- judul materi
- nama pemateri
- hari, tanggal, waktu
- hitung mundur dari waktu mulai kegiatan tersebut.
dan tombol untuk pindah ke materi/kegiatan, dan tombol ini aktif atau bisa diklik pada saat materi itu berlangsung (dihitung dari harinya, jika harinya sudah terlewat maka otoamtis tombolnya menjadi disable/tidak aktif). 
dan ketika diklik itu akan pindah ke halaman materinya yang saya ingin dihalaman materinya  itu ada 
- tombol untuk kembali ke halaman jadwal. 
- header foto materi
- judul materi
- nama pemateri
- hari, tanggal, waktu
- tombol materi (Default halaman materi)
- tombol tugas (pindah ke halaman tugas tapi masih satu halaman)
- div file materi pdf yang langsung dibuka/dirender dalam halaman itu (jika halamannya materi, tapi jika tugas maka tidak dirender atau tidak diambil)
- jika tampilan usernya menggunakan mobile maka ada div dibawah div file materi yang fungsinya untuk bertanya langsung ke ai seputar materi tersebut, jika tampilan usernya menggunakan destop/laptop maka div tersebut ada disamping kanan div file materi yang fungsinya sama. untuk data ai diambil dari file faqData.js.jadi tambahkanlah data contohnya, yang mana tiap materi itu bisa berbeda beda karna satu hari satu materi. dan saya ingin ai dalam materi itu hanya diproses pertanyaan tentang materi yang sedang dibuka, jadi misal yang dibukanya materi 1 maka ai hanya memproses materi 1, dan untuk chatbot tetap seperti biasa tanpa dirubah, jadi tambahkanlah file api openai juga, dan tentunya supabase juga. berikut planning sql yang sudah aku siapkan
```sql
CREATE TABLE materi_pkkmb (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    judul VARCHAR(255) NOT NULL,
    pemateri VARCHAR(255) NOT NULL,
    tanggal TIMESTAMP WITH TIME ZONE NOT NULL,
    status BOOLEAN NOT NULL DEFAULT false,
    foto_header VARCHAR(255) NOT NULL,
    file_pdf VARCHAR(255) NOT NULL,
    link_tugas VARCHAR(64) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
);
CREATE TABLE tugas_materi (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    materi_id UUID NOT NULL REFERENCES materi_pkkmb(id) ON DELETE CASCADE,
    keterangan TEXT,
    nama VARCHAR(50) NOT NULL,
    kampus VARCHAR(50) NOT NULL,
    nim VARCHAR(50) NOT NULL,
    file_tugas VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'materi-pkkmb',
    'materi-pkkmb',
    true,
    10485760, -- 10MB
    ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'materi-tugas',
    'materi-tugas',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'materi-header',
    'materi-header',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

dan saya ingin menambah kolom baru yaitu untuk tabel peserta yaitu kolom site_type karna saya ingin membedakan peserta pkkmb dan peserta pose. jadi ketika user menginput form wajib pada pkkmb maka otomatis kolom sitenya berupa pkkmb dan begitu sebaliknya. terus saya ingin pada tabel tugas_materi inikan ada kolom nim nah saya ingin mencocokkan dengan tabel peserta dengan site_typenya pkkmb, jika tidak cocok atau tidak ada nim yang ada ditabel peserta maka akan menolak inputannya. terus saya ingin didihalaman tugas materi ini awalnya cumman ada header yang seperti pada halaman materi cuman tidak ada kolom ai dan div atau file materi pdfnya tapi dihalaman tugas ini ada tombol untuk isi tugas dan ketika diklik maka akan muncul pop up form dengan terdiri dari nama,kampus, nim dan upload gambar, dan diatas inputan ada keterangannya dan karna tugas ini berupa resume materi yang sudah ditulis dibuku dan maba disuruh untuk mengupload hasil tulisa yang ada dibukunya.