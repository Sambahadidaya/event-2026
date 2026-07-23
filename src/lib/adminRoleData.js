import { NAMA_LOMBA } from '@/lib/lombaData';

// Generate PJ Lomba role key from nama_lomba
// e.g. "Mobile Legend" -> "admin_pose_lomba_ML"
// e.g. "Catur" -> "admin_pose_lomba_Catur"
const LOMBA_ROLE_MAP = {};

// Mapping nama_lomba -> role suffix
const ROLE_SUFFIXES = {
  'Badminton': 'Badminton',
  'Pidato Bahasa Inggris': 'Pidato',
  'Puisi': 'Puisi',
  'Tarik Tambang': 'TarikTambang',
  'Tenis Meja': 'TenisMeja',
  'Catur': 'Catur',
  'Mobile Legend': 'ML',
  'Magic Chess GoGo': 'MagicChess',
  'PUBG Mobile': 'PUBG',
  'Bisnis Model Kanvas': 'BMK',
  'Desain Poster': 'DesainPoster',
  'Desain Kemasan': 'DesainKemasan',
  'Film Pendek': 'FilmPendek',
  'Konten Promosi Digital': 'KPD',
  'Laporan Keuangan': 'LapKeu',
};

// Build map: role_key -> nama_lomba
Object.values(NAMA_LOMBA).flat().forEach(nama => {
  const suffix = ROLE_SUFFIXES[nama] || nama.replace(/\s+/g, '');
  const roleKey = `admin_pose_lomba_${suffix}`;
  LOMBA_ROLE_MAP[roleKey] = nama;
});

// PJ Lomba routes
const PJ_LOMBA_ROUTES = [
  '/panitia/pj_lomba/dashboard',
  '/panitia/pj_lomba/form_register',
];

// Generate rolePermissions for each PJ Lomba role
const pjLombaPermissions = {};
Object.keys(LOMBA_ROLE_MAP).forEach(roleKey => {
  pjLombaPermissions[roleKey] = [...PJ_LOMBA_ROUTES];
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
    '/panitia/form/form',
    '/panitia/keuangan/dashboard',
    '/panitia/keuangan/verifikasi',
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
    '/panitia/form/form',
    '/panitia/keuangan/dashboard',
    '/panitia/keuangan/verifikasi',
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
  ],
  admin_pkkmb_keuangan: [
    '/panitia/keuangan/dashboard',
    '/panitia/keuangan/verifikasi',
  ],
  // Spread dynamically generated PJ Lomba roles
  ...pjLombaPermissions
};

export const hasAccess = (role, path) => {
  if (!role || !rolePermissions[role]) return false;
  if (rolePermissions[role].includes('*')) return true;
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
 * Export role map for reference
 */
export { LOMBA_ROLE_MAP };
