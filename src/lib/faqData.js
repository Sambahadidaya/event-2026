export const commonFaq = [
    { question: 'Halo', answer: 'Hallo. Ada yang bisa saya bantu?' },
    { question: 'Terima kasih', answer: 'Sama-sama! Jangan ragu untuk bertanya lagi jika ada yang dibutuhkan.' },
];

export const pkkmbFaq = [
    { question: 'Apa itu PKKMB?', answer: 'PKKMB (Pengenalan Kehidupan Kampus bagi Mahasiswa Baru) merupakan kegiatan orientasi dan adaptasi bagi Mahasiswa baru.' },
    { question: 'Siapa Ketua Pelaksana PKKMB?', answer: 'Ketua Pelaksana PKKMB adalah Nindya Dwi Lestari.' },
    { question: 'Kapan pkkmb dimulai?', answer: 'PKKMB dimulai pada tanggal 21 September sampai 26 September.' },
    { question: 'Apa yang harus dipersiapkan?', answer: 'Silakan cek daftar perlengkapan di pengumuman terbaru pada portal PKKMB.' },
    { question: 'Di mana lokasi PKKMB?', answer: 'PKKMB akan dilaksanakan di setiap Auditorium Kampus Masing-masing.' },
    { question: 'Bagaimana cara melihat kelompok?', answer: 'Pembagian kelompok bisa dilihat pada halaman Kelompok di menu PKKMB.' }
];

export const poseFaq = [
    { question: 'Apa itu POSE?', answer: 'POSE adalah Pekan Olahraga dan Seni tingkat universitas.' },
    { question: 'Siapa Ketua Pelaksana POSE?', answer: 'Ketua Pelaksana POSE adalah Nadia Nita.' },
    { question: 'Kapan POSE dimulai?', answer: 'POSE dimulai pada tanggal 15 September sampai 26 September' },
    { question: 'Bagaimana cara mendaftar lomba?', answer: 'Pendaftaran lomba dapat dilakukan pada halaman register.' },
    { question: 'Kapan pendaftaran lomba ditutup?', answer: 'Pendaftaran lomba ditutup pada tanggal 10 September.' },
    { question: 'Di mana lokasi POSE?', answer: 'Lokasi pertandingan POSE bervariasi sesuai cabang lomba. Silakan cek detail di jadwal.' },
    { question: 'Kenapa gagal register terus?', answer: 'Gagal register bisa disebabkan beberapa faktor, khusus untuk mahasiswa lp3i bisa jadi penyebabnya karna Anda belum terdaftar/belum mengisi Form Wajib POSE, atau status pembayaran belum diverifikasi oleh panitia. Silahkan cek kembali data Anda dan pastikan sudah membayar Form Wajib.' },
    { question: 'Apakah benar Mahasiswa LP3I bisa mendaftar lebih dari 2 lomba?', answer: 'Benar, Mahasiswa LP3I bisa mendaftar lebih dari 2 lomba jika sudah mendaftarkan diri dan sudah membayar Form Wajib POSE dan mahasiswa cuman bayar 1 kali diform wajib dan bisa mengikuti maksimal 2 lomba, namun kuota untuk dari form wajib ini sangat terbatas.' },
    { question: 'Apakah kalo ikut lombanya dua harus bayar dua kali?', answer: 'Tidak, jika kamu sudah mendaftar dan sudah membayar Form Wajib POSE dan mahasiswa cuman bayar 1 kali diform wajib dan bisa mengikuti maksimal 2 lomba, namun kuota untuk dari form wajib ini sangat terbatas.' },
    { question: 'Terus bagaimana jika sudah koata habis dilomba tersebut?', answer: 'Kamu bisa mendaftar dilomba yang sama namun formnya tidak ada diwebsite, silahkan menghubungi panitia untuk untuk minta form lanjutannya namun diform lanjutan ini mahasiswa harus bayar lagi sesuai dengan htm masing masing lomba, atau bisa juga mendaftar dilomba lainnya yang masih tersedia kuotanya.' },
    { question: 'Dimana saya bisa melihat jadwal pose?', answer: 'Jadwal dapat dilihat di menu Jadwal POSE.' }
];

export const getFaqBySite = (site) => {
    if (site === 'pose') {
        return [...commonFaq, ...poseFaq];
    }
    return [...commonFaq, ...pkkmbFaq];
};

export const getRandomQuestions = (site, count = 3) => {
    const specificFaq = site === 'pose' ? poseFaq : pkkmbFaq;
    const shuffled = [...specificFaq].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};

/**
 * Kumpulan konteks FAQ per materi PKKMB.
 * Digunakan oleh SamsMateriBot untuk membatasi jawaban hanya seputar materi yang aktif.
 * Key cocok dengan judul materi (case-insensitive partial match) atau ID materi.
 * 
 * Dalam penggunaannya di halaman materi, konteks ini digabung dengan judul dan nama pemateri
 * menjadi string yang dikirim sebagai `materiContext` ke SamsMateriBot.
 * 
 * Tambahkan entry baru di sini setiap kali ada materi baru di PKKMB.
 */
export const materiPkkmbContext = {
    // Contoh Materi 1: Kebangsaan dan Bela Negara
    'kebangsaan': `
                    Materi: Kebangsaan dan Bela Negara
                    Pemateri: Prof. Dr. H. Sujatno, M.Si.
                    Ringkasan:
                    - Pengertian bela negara: sikap, perilaku, dan tindakan warga negara yang dilandasi kecintaan terhadap NKRI.
                    - Dasar hukum bela negara: UUD 1945 Pasal 27 ayat 3 dan Pasal 30 ayat 1.
                    - Nilai-nilai bela negara: Cinta Tanah Air, Kesadaran Berbangsa dan Bernegara, Yakin akan Pancasila, Rela Berkorban, dan Kemampuan Awal Bela Negara.
                    - Ancaman terhadap negara: ancaman militer (invasi, sabotase), ancaman non-militer (radikalisme, narkoba, hoaks).
                    - Peran mahasiswa dalam bela negara: berprestasi akademik, aktif dalam organisasi, menjaga persatuan bangsa, dan menolak radikalisme.
                    - Pancasila sebagai dasar negara dan pandangan hidup bangsa.
                    - Bhinneka Tunggal Ika: keberagaman bukan pemisah tetapi pemersatu bangsa.
                    Tugas: Rangkuman materi yang ditulis tangan di buku catatan, difoto dan diunggah.
                `,

    // Contoh Materi 2: Etika Kampus dan Kode Etik Mahasiswa
    'etika': `
                    Materi: Etika Kampus dan Kode Etik Mahasiswa
                    Pemateri: Dr. Rini Setiawati, M.Pd.
                    Ringkasan:
                    - Pengertian etika: ilmu tentang apa yang baik dan buruk dalam perilaku manusia berdasarkan nilai dan norma.
                    - Kode etik mahasiswa: seperangkat aturan yang mengatur perilaku mahasiswa di lingkungan kampus.
                    - Hak dan kewajiban mahasiswa: hak memperoleh pendidikan, menggunakan fasilitas, aktif berorganisasi; kewajiban mengikuti peraturan, menjaga nama baik kampus.
                    - Sikap profesional: disiplin waktu, jujur dalam akademik, berpakaian sesuai ketentuan.
                    - Anti plagiarisme: pengertian plagiat, dampak hukum, cara menghindari plagiat (parafrase, sitasi).
                    - Larangan: mencontek, intimidasi, bullying, penyalahgunaan narkoba, kekerasan seksual.
                    - Sanksi pelanggaran: teguran lisan, surat peringatan, skorsing, hingga pemecatan.
                    Tugas: Rangkuman materi yang ditulis tangan di buku catatan, difoto dan diunggah.
                `,

    // Contoh Materi 3: Sistem Akademik dan Kurikulum
    'akademik': `
                    Materi: Sistem Akademik dan Kurikulum
                    Pemateri: Wakil Rektor Bidang Akademik
                    Ringkasan:
                    - Pengertian SKS (Satuan Kredit Semester): ukuran waktu kegiatan belajar per minggu.
                    - Beban studi mahasiswa: minimal 144 SKS untuk S1.
                    - KRS (Kartu Rencana Studi): pengisian dilakukan setiap awal semester melalui sistem informasi akademik.
                    - IPK (Indeks Prestasi Kumulatif): rata-rata nilai semua mata kuliah yang telah ditempuh.
                    - Grade nilai: A (4,0), B+ (3,5), B (3,0), C+ (2,5), C (2,0), D (1,0), E (0).
                    - Yudisium dan wisuda: syarat kelulusan, batas waktu studi 7 tahun untuk S1.
                    - Prodi (Program Studi) dan Fakultas yang ada di kampus.
                    - Masa orientasi studi dan pengenalan program studi.
                    Tugas: Rangkuman materi yang ditulis tangan di buku catatan, difoto dan diunggah.
                `,

    // Default fallback untuk materi yang belum ada konteks spesifiknya
    'default': `
                    Ini adalah materi PKKMB. Saya hanya dapat menjawab pertanyaan berdasarkan konten materi yang telah diberikan oleh pemateri. Jika Anda memiliki pertanyaan spesifik mengenai topik yang dibahas, silakan ajukan pertanyaan Anda.
                `
};

/**
 * Mendapatkan konteks materi berdasarkan judul materi.
 * @param {string} judulMateri - Judul materi dari database
 * @returns {string} - String konteks untuk dikirim ke SamsMateriBot
 */
export const getMateriContext = (judulMateri) => {
    if (!judulMateri) return materiPkkmbContext['default'];
    const lowerJudul = judulMateri.toLowerCase();

    for (const [key, context] of Object.entries(materiPkkmbContext)) {
        if (key !== 'default' && lowerJudul.includes(key)) {
            return context;
        }
    }

    return materiPkkmbContext['default'];
};
