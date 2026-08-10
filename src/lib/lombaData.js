export const JENIS_LOMBA = ['Kreativitas', 'Olahraga', 'E-Sport'];

export const NAMA_LOMBA = {
    'Olahraga': [
        'Badminton',
        'Tarik Tambang',
        'Tenis Meja'
    ],
    'E-Sport': [
        'Mobile Legend',
    ],
    'Kreativitas': [
        'Business Model Canvas',
        'Desain Poster',
        'Software Developer',
        'Release Writing',
        'Digital UMKM Promotion',
        'Seni Tari (Dance)',
    ]
};

export const PRODI_DATA = {
    'Kampus Tasikmalaya': [
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
        'Teknik Komputer'
    ],
    'Kampus Cirebon': [
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
        'Teknik Komputer'
    ],
    'Kampus Pekanbaru': [
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
        'Teknik Komputer'
    ],
    'Kampus Padang': [
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
        'Teknik Komputer'
    ],
};

export const Angkatan_DATA = [
    '2026',
    '2025',
    '2024'
];

export function semesterToAngkatan(semester) {
    const sem = parseInt(semester, 10);
    if (isNaN(sem)) return null;
    if (sem <= 2) return '2026';
    if (sem <= 4) return '2025';
    if (sem <= 6) return '2024';
    return null;
}

export const KAMPUS_DATA = [
    'Kampus Bandung',
    'Kampus Tasikmalaya',
    'Kampus Cirebon',
    'Kampus Pekanbaru',
    'Kampus Padang',
    'Lainnya'
];

export const KATEGORI = [
    'Mahasiswa LP3I',
    'Alumni LP3I',
    'Dosen',
    'Siswa',
    'Umum'
];

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

export const METODE_BAYAR_PKKMB = [
    'Virtual Account',
    'Tunai'
];

export const METODE_BAYAR_POSE = [
    'Seabank',
    'Tunai'
];

export const METODE_BAYAR_DATA = {
    pkkmb: METODE_BAYAR_PKKMB,
    pose: METODE_BAYAR_POSE
};


export const KAMPUS_PRODI_CODES = {
    'Kampus Bandung': {
        '01': 'Administrasi Bisnis',
        '02': 'Manajemen Informatika',
        '03': 'Akuntansi',
        '04': 'Hubungan Masyarakat',
        '41': 'Bisnis Digital'
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

export const KODE_JENIS_LOMBA = {
    'Olahraga': 'Ol',
    'Kreativitas': 'Kr',
    'E-Sport': 'Es'
};

export const KODE_NAMA_LOMBA = {
    'Badminton': 'Bd',
    'Tarik Tambang': 'Tr',
    'Tenis Meja': 'Tn',
    'Mobile Legend': 'Ml',
    'Business Model Canvas': 'Bmc',
    'Desain Poster': 'Ds',
    'Software Developer': 'Sd',
    'Release Writing': 'Rw',
    'Digital UMKM Promotion': 'Dup',
    'Dance': 'Dc'

};
