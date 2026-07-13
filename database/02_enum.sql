CREATE TYPE site_type AS ENUM (
    'pkkmb',
    'pose',
    'portal'
);

CREATE TYPE admin_role AS ENUM (
    'super_admin',
    'admin_pkkmb',
    'admin_pose',
    'admin_pose_jadwal',
    'admin_pose_form',
    'admin_pose_keuangan'
);

CREATE TYPE jadwal AS ENUM (
    'pendaftaran',
    'seleksi',
    'acara'
);