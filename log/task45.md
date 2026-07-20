fokus ke halaman panitia dulu tepatnya pada bagian pose.
saya ingin menambah halaman baru yaitu untuk manajemen keuangan yang sudah dibikin folder dan filenya yaitu berada di src-app-panitia-pose-keuangan-page.js
nah dihalaman itu saya ingin halamannya seperti pada halaman dashboard- 

| Kode || Pengeluaran                | Kategori Akun                                           | Jenis              |
|------|| -------------------------- | ------------------------------------------------------- | ------------------ |
| F000 || Print Out                  | ATK (Alat Tulis Kantor)                                 | Operasional        |
| F001 || Map Plastik                | ATK                                                     | Operasional        |
| F002 || Kertas HVS (500 lembar)    | ATK                                                     | Operasional        |
| F003 || Kwitansi                   | ATK                                                     | Operasional        |
| F004 || Nota                       | ATK                                                     | Operasional        |
| F005 || Spidol                     | ATK                                                     | Operasional        |
| F006 || Print sticker Vinyl        | Publikasi & Percetakan                                  | Operasional        |
| F007 || Print poster iklan 1       | Publikasi & Percetakan                                  | Operasional        |
| F008 || Print poster iklan 2       | Publikasi & Percetakan                                  | Operasional        |
| F009 || Banner GO                  | Publikasi & Percetakan                                  | Operasional        |
| F010 || Transport sponsorship      | Transportasi                                            | Operasional        |
| F011 || Transport Logistik         | Transportasi                                            | Operasional        |
| F012 || Snack Doorprize            | Konsumsi                                                | Operasional        |
| F013 || Makanan Panitia            | Konsumsi                                                | Operasional        |
| F014 || Galon                      | Konsumsi                                                | Operasional        |
| F015 || Snack MC                   | Konsumsi                                                | Operasional        |
| F016 || Snack Medis                | Konsumsi                                                | Operasional        |
| F017 || Snack Juri                 | Konsumsi                                                | Operasional        |
| F018 || Cup Plastik                | Konsumsi                                                | Operasional        |
| F019 || Lanyard & ID Card Tambahan | Identitas Panitia/Peserta                               | Operasional        |
| F020 || Kartu ID Tambahan          | Identitas Panitia/Peserta                               | Operasional        |
| F021 || ID Card + Lanyard          | Identitas Panitia/Peserta                               | Operasional        |
| F022 || Kayu Putih                 | Medis / Kesehatan                                       | Operasional        |
| F023 || Cairan NaCl                | Medis / Kesehatan                                       | Operasional        |
| F024 || P3K                        | Medis / Kesehatan                                       | Operasional        |
| F025 || Pita Tarik Jumbo           | Dekorasi & Perlengkapan Acara                           | Operasional        |
| F026 || Pita Hadiah                | Dekorasi & Perlengkapan Acara                           | Operasional        |
| F027 || Balon Metalik              | Dekorasi & Perlengkapan Acara                           | Operasional        |
| F028 || Balon Chrome               | Dekorasi & Perlengkapan Acara                           | Operasional        |
| F029 || Balon Latex Metalik        | Dekorasi & Perlengkapan Acara                           | Operasional        |
| F030 || Kawat Sedang               | Dekorasi & Perlengkapan Acara                           | Operasional        |
| F031 || Benang Kasur               | Dekorasi & Perlengkapan Acara                           | Operasional        |
| F032 || Kabel Tie                  | Dekorasi & Perlengkapan Acara                           | Operasional        |
| F033 || Kertas Kado Jumbo          | Dekorasi & Perlengkapan Acara                           | Operasional        |
| F034 || Benang Wol                 | Dekorasi & Perlengkapan Acara                           | Operasional        |
| F035 || Cat Putih                  | Dekorasi & Perlengkapan Acara                           | Operasional        |
| F036 || Paku 4 cm                  | Dekorasi & Perlengkapan Acara                           | Operasional        |
| F037 || Double Foam Busa           | Dekorasi & Perlengkapan Acara                           | Operasional        |
| F038 || Double Tape Nano           | Dekorasi & Perlengkapan Acara                           | Operasional        |
| F039 || Double Tape Joyko          | Dekorasi & Perlengkapan Acara                           | Operasional        |
| F040 || Double Tape kecil          | Dekorasi & Perlengkapan Acara                           | Operasional        |
| F041 || Double Tape                | Dekorasi & Perlengkapan Acara                           | Operasional        |
| F042 || Isi Lem Tembak             | Dekorasi & Perlengkapan Acara                           | Operasional        |
| F043 || Tirai Metallic             | Dekorasi & Perlengkapan Acara                           | Operasional        |
| F044 || Foil Tirai Glitter         | Dekorasi & Perlengkapan Acara                           | Operasional        |
| F045 || Pita Piala                 | Dekorasi & Perlengkapan Acara                           | Operasional        |
| F046 || Confetti                   | Dekorasi & Perlengkapan Acara                           | Operasional        |
| F047 || Kuas Cat                   | Dekorasi & Perlengkapan Acara                           | Operasional        |
| F048 || Bubble Wrap                | Perlengkapan Logistik                                   | Operasional        |
| F049 || Trash Bag                  | Kebersihan                                              | Operasional        |
| F050 || Baterai ABC                | Perlengkapan Elektronik                                 | Operasional        |
| F051 || Akai Stereo                | Sewa                                                    | Operasional        |


| Kode | Kategori                      | Jenis_Akun_accounting |
|------| ----------------------------- | ----------------------|
|  01  | Alat Tulis Kantor             | Operasional           |
|  02  | Konsumsi                      | Operasional           |
|  03  | Transportasi                  | Operasional           |
|  04  | Publikasi & Percetakan        | Operasional           |
|  05  | Dekorasi & Perlengkapan Acara | Operasional           |
|  06  | Medis & Kesehatan             | Operasional           |
|  07  | ID Card & Lanyard             | Operasional           |
|  08  | Logistik                      | Operasional           |
|  09  | Kebersihan                    | Operasional           |
|  10  | Peralatan Acara               | Operasional           |
