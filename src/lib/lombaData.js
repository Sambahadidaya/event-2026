export const JENIS_LOMBA = ['Kreativitas', 'Olahraga', 'Games'];

export const NAMA_LOMBA = {
    'Olahraga': [
        'Badminton',
        'Pidato Bahasa Inggris',
        'Puisi',
        'Tarik Tambang',
        'Tenis Meja'
    ],
    'Games': [
        'Catur',
        'Mobile Legend',
        'Magic Chess GoGo',
        'PUBG Mobile',
    ],
    'Kreativitas': [
        'Bisnis Model Kanvas',
        'Desain Poster',
        'Desain Kemasan',
        'Film Pendek',
        'Konten Promosi Digital',
        'Laporan Keuangan'
    ]
};

export const PRODI_DATA = [
    'Akuntansi',
    'Administrasi Bisnis',
    'Bisnis Digital',
    'Hubungan Masyarakat',
    'Komputerisasi Akuntansi',
    'Manajemen Informatika',
    'Manajemen Keuangan Perbankan',
    'Manajemen Keuangan',
    'Manajemen Pemasaran',
    'Manajemen Perusahaan',
    'Teknik Komputer',
];

export const Angkatan_DATA = [
    '2026',
    '2025',
];

export const KAMPUS_DATA = [
    'Kampus Bandung',
    'Kampus Tasikmalaya',
    'Kampus Cirebon',
    'Kampus Pekanbaru',
    'Kampus Padang',
    'Kampus Langsa',
    'Lainnya'
];

export const STATUS_BAYAR_DATA = [
    'Sudah Bayar',
    'Belum Bayar',
    'Pending'
];

export const METODE_BAYAR_DATA = [
    'QRIS',
    'Kas'
];
export const STATUS_VERIFIKASI_DATA = [
    'Disetujui',
    'Ditolak',
    'Pending'
];

export const KAMPUS_PRODI_CODES = {
    'Kampus Bandung': {
        '01': 'Administrasi Bisnis',
        '02': 'Manajemen Informatika',
        '03': 'Akuntansi',
        '04': 'Hubungan Masyarakat',
        '41': 'Bisnis Digital'
    },
    'Kampus Tasikmalaya': {
        '01': 'Manajemen Informatika',
        '02': 'Akuntansi',
        '03': 'Hubungan Masyarakat',
        '04': 'Administrasi Bisnis',
        '05': 'Teknik Komputer'
    },
    'Kampus Cirebon': {
        '01': 'Manajemen Informatika',
        '02': 'Akuntansi',
        '03': 'Hubungan Masyarakat',
        '04': 'Administrasi Bisnis',
        '05': 'Teknik Komputer'
    },
    'Kampus Pekanbaru': {
        '01': 'Manajemen Informatika',
        '02': 'Akuntansi',
        '03': 'Hubungan Masyarakat',
        '04': 'Administrasi Bisnis',
        '05': 'Teknik Komputer'
    },
    'Kampus Padang': {
        '01': 'Manajemen Informatika',
        '02': 'Akuntansi',
        '03': 'Hubungan Masyarakat',
        '04': 'Administrasi Bisnis',
        '05': 'Teknik Komputer'
    },
    'Kampus Langsa': {
        '01': 'Manajemen Informatika',
        '02': 'Akuntansi',
        '03': 'Hubungan Masyarakat',
        '04': 'Administrasi Bisnis',
        '05': 'Teknik Komputer'
    }
};

export function parseNIM(nim, kampus) {
    if (!nim || nim.length !== 9) return null;
    const angkatan = nim.substring(0, 4);
    const prodiCode = nim.substring(4, 6);
    const urut = nim.substring(6, 9);

    let prodiName = "Tidak Diketahui";
    if (KAMPUS_PRODI_CODES[kampus] && KAMPUS_PRODI_CODES[kampus][prodiCode]) {
        prodiName = KAMPUS_PRODI_CODES[kampus][prodiCode];
    }

    return {
        angkatan,
        prodiCode,
        prodiName,
        urut
    };
}
