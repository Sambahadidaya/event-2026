export const rolePermissions = {
  super_admin: ['*'],
  admin_pkkmb: [
    '/panitia/dashboard/trafik',
    '/panitia/dashboard/faq',
    '/panitia/dashboard/kontak',
    '/panitia/pkkmb/berita',
    '/panitia/pkkmb/team',
    '/panitia/pkkmb/form_wajib',
    '/panitia/pkkmb/peserta_wajib',
    '/panitia/pkkmb/jadwal_acara',
    '/panitia/pkkmb/materi',
    '/panitia/pkkmb/tugas',
  ],
  admin_pose: [
    '/panitia/dashboard/trafik',
    '/panitia/dashboard/faq',
    '/panitia/dashboard/kontak',
    '/panitia/pose/jadwal_acara',
    '/panitia/pose/berita',
    '/panitia/pose/peserta',
    '/panitia/pose/team',
    '/panitia/pose/form_register',
    '/panitia/pose/register',
    '/panitia/pose/jadwal_pertandingan',
    '/panitia/pose/keuangan',
    '/panitia/pose/form_wajib',
    '/panitia/pose/peserta_wajib'
  ],
  admin_pose_form: [
    '/panitia/dashboard/trafik',
    '/panitia/dashboard/faq',
    '/panitia/dashboard/kontak',
    '/panitia/pose/form_register'
  ],
  admin_pose_jadwal: [
    '/panitia/dashboard/trafik',
    '/panitia/dashboard/faq',
    '/panitia/dashboard/kontak',
    '/panitia/pose/jadwal_acara',
    '/panitia/pose/jadwal_pertandingan'
  ],
  admin_pose_keuangan: [
    '/panitia/dashboard/trafik',
    '/panitia/dashboard/faq',
    '/panitia/dashboard/kontak',
    '/panitia/pose/keuangan'
  ]
};

export const hasAccess = (role, path) => {
  if (!role || !rolePermissions[role]) return false;
  if (rolePermissions[role].includes('*')) return true;
  return rolePermissions[role].some(allowedPath => path === allowedPath || path.startsWith(allowedPath + '/'));
};
