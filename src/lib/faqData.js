export const commonFaq = [
    { question: 'Halo', keywords: ['hallo', 'halo', 'pagi', 'siang', 'sore', 'malam'], answer: 'Hallo. Ada yang bisa saya bantu?' },
    { question: 'Hi', keywords: ['hii', 'hi', 'pagi', 'siang', 'sore', 'malam'], answer: 'Hallo. Ada yang bisa saya bantu?' },
    { question: 'Hai', keywords: ['haii', 'hai', 'pagi', 'siang', 'sore', 'malam'], answer: 'Hallo. Ada yang bisa saya bantu?' },
    { question: 'Terima kasih', keywords: ['terimakasih', 'terima', 'kasih', 'makasih', 'thanks', 'thank'], answer: 'Sama-sama! Jangan ragu untuk bertanya lagi jika ada yang dibutuhkan.' },
];

export const pkkmbFaq = [
    { question: 'Apa itu PKKMB?', keywords: ['pkkmb', 'pengertian pkkmb', 'arti pkkmb', 'maksud pkkmb'], answer: 'PKKMB (Pengenalan Kehidupan Kampus bagi Mahasiswa Baru) merupakan kegiatan orientasi dan adaptasi bagi Mahasiswa baru.' },
    { question: 'Kapan pkkmb dimulai?', keywords: ['jadwal', 'kapan', 'mulai', 'waktu', 'pkkmb'], answer: 'PKKMB dimulai sesuai jadwal di halaman pemberitahuan PKKMB.' },
    { question: 'Apa yang harus dipersiapkan?', keywords: ['persiapan', 'siapkan', 'bawa', 'perlengkapan'], answer: 'Silakan cek daftar perlengkapan di pengumuman terbaru pada portal PKKMB.' },
    { question: 'Di mana lokasi PKKMB?', keywords: ['lokasi', 'tempat', 'dimana', 'dilaksanakan'], answer: 'PKKMB biasanya dilaksanakan di Auditorium Kampus. Detail lokasi akan diumumkan di jadwal.' },
    { question: 'Bagaimana cara melihat kelompok?', keywords: ['melihat', 'kelompok', 'grup', 'gabung'], answer: 'Pembagian kelompok bisa dilihat pada halaman Kelompok di menu PKKMB.' }
];

export const poseFaq = [
    { question: 'Apa itu POSE?', keywords: ['pose', 'pengertian pose', 'arti pose'], answer: 'POSE adalah Pekan Olahraga dan Seni tingkat universitas.' },
    { question: 'Kapan POSE dimulai?', keywords: ['jadwal', 'kapan', 'mulai', 'waktu', 'pose'], answer: 'POSE dimulai sesuai jadwal yang tertera di halaman pemberitahuan POSE.' },
    { question: 'Bagaimana cara mendaftar lomba?', keywords: ['daftar', 'lomba', 'ikut', 'registrasi'], answer: 'Pendaftaran lomba dapat dilakukan dengan menghubungi panitia divisi masing-masing lomba melalui kontak.' },
    { question: 'Di mana lokasi POSE?', keywords: ['lokasi', 'tempat', 'dimana', 'pertandingan'], answer: 'Lokasi pertandingan POSE bervariasi sesuai cabang lomba. Silakan cek detail di jadwal.' },
    { question: 'Dimana saya bisa melihat jadwal pose?', keywords: ['jadwal', 'dimana', 'lokasi', 'pose', 'pertandingan'], answer: 'Jadwal dapat dilihat di menu Tim & Jadwal pada halaman POSE.' }
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
