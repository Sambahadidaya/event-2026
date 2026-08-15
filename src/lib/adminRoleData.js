import { NAMA_LOMBA } from '@/lib/lombaData';

// Generate PJ Lomba role key from nama_lomba
// e.g. "Mobile Legend" -> "admin_pose_lomba_ML"
// e.g. "Catur" -> "admin_pose_lomba_Catur"
const LOMBA_ROLE_MAP = {};

// Mapping nama_lomba -> role suffix
const ROLE_SUFFIXES = {
  'Badminton': 'Badminton',
  'Tarik Tambang': 'TarikTambang',
  'Tenis Meja': 'TenisMeja',
  'Mobile Legend': 'ML',
  'Business Model Canvas': 'BMC',
  'Desain Poster': 'DesainPoster',
  'Software Developer': 'SoftwareDeveloper',
  'Release Writing': 'ReleaseWriting',
  'Digital UMKM Promotion': 'DUP',
  'Dance': 'Dance'
};

// Build map: role_key -> nama_lomba
Object.values(NAMA_LOMBA).flat().forEach(nama => {
  const suffix = ROLE_SUFFIXES[nama] || nama.replace(/\s+/g, '');
  const roleKey = `admin_pose_lomba_${suffix}`;
  LOMBA_ROLE_MAP[roleKey] = nama;
});

// ============================================================
// KABIM ROLE MAP — 8 kabim, tiap role map ke urutan kelompok
// ============================================================
export const KABIM_ROLE_MAP = {
  'admin_pkkmb_pj_kabim_1': 1,
  'admin_pkkmb_pj_kabim_2': 2,
  'admin_pkkmb_pj_kabim_3': 3,
  'admin_pkkmb_pj_kabim_4': 4,
  'admin_pkkmb_pj_kabim_5': 5,
  'admin_pkkmb_pj_kabim_6': 6,
  'admin_pkkmb_pj_kabim_7': 7,
  'admin_pkkmb_pj_kabim_8': 8,
};

// Route yang bisa diakses oleh setiap role kabim
const KABIM_ROUTE = '/panitia/pj_kabim/kelompok';
const kabimPermissions = {};
Object.keys(KABIM_ROLE_MAP).forEach(roleKey => {
  kabimPermissions[roleKey] = [KABIM_ROUTE];
});

// PJ Lomba routes
const PJ_LOMBA_ROUTES = [
  '/panitia/pj_lomba/dashboard',
  '/panitia/pj_lomba/form_register',
  '/panitia/pj_lomba/jadwal_pertandingan',
  '/panitia/pj_lomba/penilaian',
  '/panitia/pj_lomba/form_submit',
  '/panitia/pj_lomba/peserta_wajib',
];

// Generate rolePermissions for each PJ Lomba role
const pjLombaPermissions = {};
Object.keys(LOMBA_ROLE_MAP).forEach(roleKey => {
  const namaLomba = LOMBA_ROLE_MAP[roleKey];
  const isKreativitas = NAMA_LOMBA['Kreativitas']?.includes(namaLomba);
  pjLombaPermissions[roleKey] = PJ_LOMBA_ROUTES.filter(route => {
    if (route === '/panitia/pj_lomba/penilaian') {
      return isKreativitas;
    }
    return true;
  });
});

export const rolePermissions = {
  super_admin: ['*'],
  admin_pkkmb: [
    '/panitia/pkkmb/berita',
    '/panitia/pkkmb/team',
    '/panitia/pkkmb/form_wajib',
    '/panitia/pkkmb/peserta_wajib',
    '/panitia/pkkmb/jadwal_acara',
    '/panitia/pkkmb/materi',
    '/panitia/pkkmb/tugas',
    '/panitia/pj_kabim/kelompok',
    '/panitia/pj_medis/peserta',
    '/panitia/keuangan/dashboard',
    '/panitia/keuangan/data_peserta',
    '/panitia/keuangan/verifikasi',
    '/panitia/keuangan/transaksi',
    '/panitia/keuangan/master-transaksi',
    '/panitia/keuangan/master-akuntansi',
    '/panitia/keuangan/metode-pembayaran',
    '/panitia/keuangan/jurnal-entry',
    '/panitia/keuangan/buku-besar',
    '/panitia/keuangan/kas-masuk',
    '/panitia/keuangan/kas-keluar',
    '/panitia/keuangan/neraca-saldo',
    '/panitia/keuangan/neraca-lajur',
    '/panitia/keuangan/laporan',
    '/panitia/absensi_panitia/dashboard',
    '/panitia/absensi_panitia/form',
    '/panitia/absensi_panitia/absensi',
  ],
  admin_pose: [
    '/panitia/pose/jadwal_acara',
    '/panitia/pose/berita',
    '/panitia/pose/peserta',
    '/panitia/pose/team',
    '/panitia/pose/form_register',
    '/panitia/pose/register',
    '/panitia/pose/jadwal_pertandingan',
    '/panitia/pose/keuangan',
    '/panitia/pose/form_wajib',
    '/panitia/pose/peserta_wajib',
    '/panitia/pj_lomba/dashboard',
    '/panitia/pj_lomba/form_register',
    '/panitia/pj_lomba/jadwal_pertandingan',
    '/panitia/pj_lomba/penilaian',
    '/panitia/pj_lomba/peserta_wajib',
    '/panitia/keuangan/dashboard',
    '/panitia/keuangan/verifikasi',
    '/panitia/keuangan/transaksi',
    '/panitia/keuangan/master-transaksi',
    '/panitia/keuangan/master-akuntansi',
    '/panitia/keuangan/metode-pembayaran',
    '/panitia/keuangan/jurnal-entry',
    '/panitia/keuangan/buku-besar',
    '/panitia/keuangan/kas-masuk',
    '/panitia/keuangan/kas-keluar',
    '/panitia/keuangan/neraca-saldo',
    '/panitia/keuangan/neraca-lajur',
    '/panitia/keuangan/laporan',
    '/panitia/absensi_panitia/dashboard',
    '/panitia/absensi_panitia/form',
    '/panitia/absensi_panitia/absensi',
    '/panitia/sales/dashboard',
    '/panitia/sales/riwayat',
  ],
  admin_pkkmb_sekretaris: [
    '/panitia/absensi_panitia/dashboard',
    '/panitia/absensi_panitia/form',
    '/panitia/absensi_panitia/absensi',
  ],
  admin_pose_form: [
    '/panitia/pose/form_register',
    '/panitia/pose/form_wajib',
    '/panitia/form/form'
  ],
  admin_pose_jadwal: [
    '/panitia/pose/jadwal_acara',
    '/panitia/pose/jadwal_pertandingan'
  ],
  admin_pose_keuangan: [
    '/panitia/pose/keuangan',
    '/panitia/keuangan/dashboard',
    '/panitia/keuangan/verifikasi',
    '/panitia/keuangan/transaksi',
    '/panitia/keuangan/master-transaksi',
    '/panitia/keuangan/master-akuntansi',
    '/panitia/keuangan/metode-pembayaran',
    '/panitia/keuangan/jurnal-entry',
    '/panitia/keuangan/buku-besar',
    '/panitia/keuangan/kas-masuk',
    '/panitia/keuangan/kas-keluar',
    '/panitia/keuangan/neraca-saldo',
    '/panitia/keuangan/neraca-lajur',
    '/panitia/keuangan/laporan',
  ],
  admin_pkkmb_keuangan: [
    '/panitia/keuangan/dashboard',
    '/panitia/keuangan/data_peserta',
    '/panitia/keuangan/verifikasi',
    '/panitia/keuangan/transaksi',
    '/panitia/keuangan/master-transaksi',
    '/panitia/keuangan/master-akuntansi',
    '/panitia/keuangan/metode-pembayaran',
    '/panitia/keuangan/jurnal-entry',
    '/panitia/keuangan/buku-besar',
    '/panitia/keuangan/kas-masuk',
    '/panitia/keuangan/kas-keluar',
    '/panitia/keuangan/neraca-saldo',
    '/panitia/keuangan/neraca-lajur',
    '/panitia/keuangan/laporan',
  ],
  admin_pose_keuangan_lomba_Badminton: [
    '/panitia/keuangan/dashboard',
    '/panitia/keuangan/verifikasi',
    '/panitia/keuangan/transaksi',
    '/panitia/keuangan/master-transaksi',
    '/panitia/keuangan/master-akuntansi',
    '/panitia/keuangan/jurnal-entry',
    '/panitia/keuangan/buku-besar',
    '/panitia/keuangan/kas-masuk',
    '/panitia/keuangan/kas-keluar',
    '/panitia/keuangan/neraca-saldo',
    '/panitia/keuangan/neraca-lajur',
    '/panitia/keuangan/laporan',
    '/panitia/pj_lomba/dashboard',
    '/panitia/pj_lomba/form_register',
    '/panitia/pj_lomba/jadwal_pertandingan',
    '/panitia/pj_lomba/penilaian',
  ],

  admin_pose_keuangan_lomba_TarikTambang: [
    '/panitia/keuangan/dashboard',
    '/panitia/keuangan/verifikasi',
    '/panitia/keuangan/transaksi',
    '/panitia/keuangan/master-transaksi',
    '/panitia/keuangan/master-akuntansi',
    '/panitia/keuangan/jurnal-entry',
    '/panitia/keuangan/buku-besar',
    '/panitia/keuangan/kas-masuk',
    '/panitia/keuangan/kas-keluar',
    '/panitia/keuangan/neraca-saldo',
    '/panitia/keuangan/neraca-lajur',
    '/panitia/keuangan/laporan',
    '/panitia/pj_lomba/dashboard',
    '/panitia/pj_lomba/form_register',
    '/panitia/pj_lomba/jadwal_pertandingan',
    '/panitia/pj_lomba/penilaian',
  ],

  admin_pose_sekretaris_lomba_seni: [
    '/panitia/absensi_panitia/dashboard',
    '/panitia/absensi_panitia/form',
    '/panitia/absensi_panitia/absensi',
    '/panitia/pj_lomba/dashboard',
    '/panitia/pj_lomba/form_register',
    '/panitia/pj_lomba/jadwal_pertandingan',
    '/panitia/pj_lomba/penilaian',
  ],
  admin_pose_sekretaris_lomba_TarikTambang: [
    '/panitia/absensi_panitia/dashboard',
    '/panitia/absensi_panitia/form',
    '/panitia/absensi_panitia/absensi',
    '/panitia/pj_lomba/dashboard',
    '/panitia/pj_lomba/form_register',
    '/panitia/pj_lomba/jadwal_pertandingan',
    '/panitia/pj_lomba/penilaian',
  ],
  admin_pkkmb_pj_medis: [
    '/panitia/pj_medis/peserta',
  ],
  admin_pkkmb_belumdiatur: [
    '/panitia/pkkmb/berita',
  ],
  admin_pose_belumdiatur: [
    '/panitia/pose/berita',
  ],
  // Spread dynamically generated PJ Lomba roles
  ...pjLombaPermissions,
  // Spread dynamically generated PJ Kabim roles
  ...kabimPermissions,
};

// Map combined role to competition name for filtering
LOMBA_ROLE_MAP['admin_pose_keuangan_lomba_Badminton'] = 'Badminton';
LOMBA_ROLE_MAP['admin_pose_keuangan_lomba_TarikTambang'] = 'TarikTambang';
LOMBA_ROLE_MAP['admin_pose_sekretaris_lomba_TarikTambang'] = 'TarikTambang';
LOMBA_ROLE_MAP['admin_pose_sekretaris_lomba_seni'] = 'Dance';


export const getRoleLabel = (roleKey) => {
  if (!roleKey) return 'Admin';
  if (roleKey === 'super_admin') return 'Super Admin';
  if (roleKey === 'admin_pkkmb_pj_medis') return 'PJ Medis PKKMB';
  if (roleKey === 'admin_pose_keuangan_lomba_Badminton') return 'Keuangan & PJ Badminton';
  if (roleKey === 'admin_pose_keuangan_lomba_TarikTambang') return 'Keuangan & PJ Tarik Tambang';
  if (roleKey === 'admin_pose_sekretaris_lomba_TarikTambang') return 'Sekretaris & PJ Tarik Tambang';
  if (roleKey === 'admin_pose_sekretaris_lomba_seni') return 'Sekretaris & PJ Lomba Seni';
  if (KABIM_ROLE_MAP[roleKey] !== undefined) return `PJ Kabim ${KABIM_ROLE_MAP[roleKey]}`;
  if (LOMBA_ROLE_MAP[roleKey]) return `PJ ${LOMBA_ROLE_MAP[roleKey]}`;
  return roleKey
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

const ROUTE_CATEGORY_MAP = [
  { prefix: '/panitia/pkkmb', label: 'PKKMB' },
  { prefix: '/panitia/pose', label: 'POSE' },
  { prefix: '/panitia/pj_lomba', label: 'PJ Lomba' },
  { prefix: '/panitia/pj_kabim', label: 'PJ Kabim' },
  { prefix: '/panitia/pj_medis', label: 'PJ Medis' },
  { prefix: '/panitia/keuangan', label: 'Keuangan' },
  { prefix: '/panitia/absensi_panitia', label: 'Absensi Panitia' },
  { prefix: '/panitia/sales', label: 'Sales' },
  { prefix: '/panitia/admin', label: 'Admin Status' },
];

const getFriendlyModulesForRole = (role) => {
  if (!role || !rolePermissions[role]) return [];
  const modules = new Set();
  rolePermissions[role].forEach(route => {
    const match = ROUTE_CATEGORY_MAP.find(item => route.startsWith(item.prefix));
    if (match) modules.add(match.label);
  });
  return [...modules];
};

export const getRoleHelpContext = (role) => {
  const roleLabel = getRoleLabel(role);
  const modules = getFriendlyModulesForRole(role);
  const accessList = modules.length ? modules.join(', ') : 'halaman admin terkait peran Anda';

  if (role === 'super_admin') {
    return {
      roleLabel,
      description: 'Anda adalah Super Admin. Anda dapat mengakses semua halaman admin termasuk PKKMB, POSE, keuangan, absensi, sales, dan PJ Lomba.',
      modules: ['Semua modul admin'],
    };
  }

  return {
    roleLabel,
    description: `Role ${roleLabel} dapat menggunakan menu: ${accessList}. Silakan tanyakan tentang fitur perannya, seperti cara mengelola data, verifikasi, atau navigasi halaman admin.`,
    modules,
  };
};

export const hasAccess = (role, path) => {
  if (!role || !rolePermissions[role]) return false;
  if (rolePermissions[role].includes('*')) return true;
  if (path === '/panitia/panduan' || path.startsWith('/panitia/panduan/')) return true;
  return rolePermissions[role].some(allowedPath => path === allowedPath || path.startsWith(allowedPath + '/'));
};

/**
 * Get the nama_lomba filter for a PJ Lomba admin role.
 * Returns null if the role is not a PJ Lomba role (e.g. super_admin sees all).
 */
export const getLombaFilter = (role) => {
  if (!role) return null;
  return LOMBA_ROLE_MAP[role] || null;
};

/**
 * Get the urutan (number) filter for a PJ Kabim admin role.
 * Returns null if the role is not a PJ Kabim role (e.g. super_admin/admin_pkkmb sees all).
 */
export const getKabimFilter = (role) => {
  if (!role) return null;
  return KABIM_ROLE_MAP[role] ?? null;
};

/**
 * Format role key into a user-friendly label
 */
const formatRoleLabel = (roleKey) => {
  if (roleKey === 'super_admin') return 'Super Admin';
  if (roleKey === 'admin_pkkmb_pj_medis') return 'PJ Medis PKKMB';
  if (roleKey === 'admin_pose_keuangan_lomba_Badminton') return 'Keuangan & PJ Badminton';
  if (roleKey === 'admin_pose_keuangan_lomba_TarikTambang') return 'Keuangan & PJ TarikTambang';
  if (roleKey === 'admin_pose_sekretaris_lomba_TarikTambang') return 'Sekretaris & PJ Tarik Tambang';
  if (roleKey === 'admin_pkkmb_sekretaris') return 'Sekretaris PKKMB';
  if (roleKey === 'admin_pose_sekretaris_lomba_seni') return 'Sekretaris & PJ Lomba Seni';
  if (KABIM_ROLE_MAP[roleKey] !== undefined) return `PJ Kabim ${KABIM_ROLE_MAP[roleKey]}`;
  if (LOMBA_ROLE_MAP[roleKey]) return `PJ ${LOMBA_ROLE_MAP[roleKey]}`;
  return roleKey
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

export const ALL_ROLES = Object.keys(rolePermissions).map(roleKey => ({
  value: roleKey,
  label: formatRoleLabel(roleKey),
}));

/**
 * Defined routes for each menu section in sidebar for centralized access management.
 */
export const MENU_SECTION_ROUTES = {
  dashboard: [
    '/panitia/dashboard/trafik',
    '/panitia/dashboard/faq',
    '/panitia/dashboard/kontak',
    '/panitia/panduan',
  ],
  pkkmb: [
    '/panitia/pkkmb/berita',
    '/panitia/pkkmb/team',
    '/panitia/pkkmb/form_wajib',
    '/panitia/pkkmb/peserta_wajib',
    '/panitia/pkkmb/jadwal_acara',
    '/panitia/pkkmb/materi',
    '/panitia/pkkmb/tugas',
  ],
  pose: [
    '/panitia/pose/jadwal_acara',
    '/panitia/pose/berita',
    '/panitia/pose/peserta',
    '/panitia/pose/team',
    '/panitia/pose/form_register',
    '/panitia/pose/jadwal_pertandingan',
    '/panitia/pose/form_wajib',
    '/panitia/pose/peserta_wajib',
  ],
  form: [
    '/panitia/form/dashboard',
    '/panitia/form/form',
  ],
  kabim: [
    '/panitia/pj_kabim/kelompok',
  ],
  medis: [
    '/panitia/pj_medis/peserta',
  ],
  absensiPanitia: [
    '/panitia/absensi_panitia/dashboard',
    '/panitia/absensi_panitia/form',
    '/panitia/absensi_panitia/absensi',
  ],
  pjLomba: [
    '/panitia/pj_lomba/dashboard',
    '/panitia/pj_lomba/form_register',
    '/panitia/pj_lomba/jadwal_pertandingan',
    '/panitia/pj_lomba/penilaian',
    '/panitia/pj_lomba/form_submit',
    '/panitia/pj_lomba/peserta_wajib',
  ],
  sales: [
    '/panitia/sales/dashboard',
    '/panitia/sales/riwayat',
  ],
  keuangan: [
    '/panitia/keuangan/dashboard',
    '/panitia/keuangan/data_peserta',
    '/panitia/keuangan/verifikasi',
    '/panitia/keuangan/transaksi',
    '/panitia/keuangan/master-transaksi',
    '/panitia/keuangan/master-akuntansi',
    '/panitia/keuangan/metode-pembayaran',
    '/panitia/keuangan/jurnal-entry',
    '/panitia/keuangan/buku-besar',
    '/panitia/keuangan/kas-masuk',
    '/panitia/keuangan/kas-keluar',
    '/panitia/keuangan/neraca-saldo',
    '/panitia/keuangan/neraca-lajur',
    '/panitia/keuangan/laporan',
  ],
  admin: [
    '/panitia/admin/status',
    '/panitia/admin/pengembang',
  ],
};

MENU_SECTION_ROUTES.konten = [
  ...MENU_SECTION_ROUTES.pkkmb,
  ...MENU_SECTION_ROUTES.pose,
];

/**
 * Helper to check if a role can access ANY of the provided routes.
 */
export const canAccessAny = (role, routes) => {
  if (!role || !routes || routes.length === 0) return false;
  if (rolePermissions[role]?.includes('*')) return true;
  return routes.some(route => hasAccess(role, route));
};

/**
 * Helper to check if a role can access a menu section key defined in MENU_SECTION_ROUTES.
 */
export const canAccessSection = (role, sectionKey) => {
  const routes = MENU_SECTION_ROUTES[sectionKey];
  if (!routes) return false;
  return canAccessAny(role, routes);
};

/**
 * Export role map for reference
 */
export { LOMBA_ROLE_MAP };
