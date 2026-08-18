'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { getServerTime } from '../time';

export const getJadwalPertandingan = async () => {
    try {
        const { data, error } = await supabaseAdmin
            .from('jadwal_pertandingan')
            .select('id, team1_id, team2_id, waktu, started_at, ended_at, nama_lomba, jenis_lomba, status, urutan, created_at, team1:team1_id(id, title, content, gambar, jenis_lomba, nama_lomba, verivikasi), team2:team2_id(id, title, content, gambar, jenis_lomba, nama_lomba, verivikasi)')
            .order('urutan', { ascending: true })
            .order('waktu', { ascending: true })

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Internal Log - Error fetching jadwal pertandingan:", error);
        return [];
    }
};

export const getHasilPertandingan = async () => {
    try {
        const { data, error } = await supabaseAdmin
            .from('hasil_pertandingan')
            .select('*');

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Internal Log - Error fetching hasil pertandingan:", error);
        return [];
    }
};

// ==========================================
// Mode Production (Query ke Database Supabase)
// ==========================================
/*
export const getJadwalAcara = async (siteType = null) => {
    try {
        let query = supabaseAdmin
            .from('jadwal_acara')
            .select('*')
            .order('waktu_mulai', { ascending: true })

        if (siteType) {
            query = query.eq('site', siteType);
        }

        const { data, error } = await query;

        if (error) {
            let fallbackQuery = supabaseAdmin
                .from('jadwal')
                .select('*')
                .order('waktu_mulai', { ascending: true })
            if (siteType) {
                fallbackQuery = fallbackQuery.eq('site', siteType);
            }
            const res = await fallbackQuery;
            if (res.error) throw res.error;
            return res.data;
        }
        return data;
    } catch (error) {
        console.error("Internal Log - Error fetching jadwal acara:", error);
        return [];
    }
};
*/

// ==========================================
// Mode Development (Bypass Database)
// ==========================================
export const getJadwalAcara = async (siteType = null) => {
    // Buat data dummy statis yang strukturnya mirip dengan tabel di database
    const mockData = [
        {
            id: 1,
            nama_acara: "pendaftaran",
            waktu_mulai: "2026-08-20T07:00:00",
            waktu_selesai: "2026-08-20T08:00:00",
            site: "pkkmb",
            deskripsi: "Registrasi ulang dan pembagian atribut peserta."
        },
        {
            id: 2,
            nama_acara: "seleksi",
            waktu_mulai: "2026-08-20T08:00:00",
            waktu_selesai: "2026-08-20T09:00:00",
            site: "pkkmb",
            deskripsi: "Pembukaan acara resmi di aula utama."
        },
        {
            id: 3,
            nama_acara: "acara",
            waktu_mulai: "2026-08-21T08:00:00",
            waktu_selesai: "2026-08-21T10:00:00",
            site: "pose",
            deskripsi: "Pengenalan unit kegiatan mahasiswa."
        }
    ];

    // Simulasikan logika filter berdasarkan siteType layaknya query '.eq('site', siteType)'
    if (siteType) {
        return mockData.filter(item => item.site === siteType);
    }

    return mockData;
};

/**
 * CONTOH/TAHAPAN PENGGUNAAN SERVER TIME:
 * Fungsi ini mencontohkan bagaimana Anda bisa menggunakan Server Time (getServerTime) 
 * untuk membandingkan waktu atau memfilter jadwal yang aktif/belum dimulai 
 * berdasarkan waktu server (aman dari manipulasi device user).
 */
export const getActiveJadwalWithServerTime = async () => {
    try {
        // 1. Dapatkan waktu server saat ini
        const serverTimeStr = await getServerTime();
        const serverNow = new Date(serverTimeStr);

        // 2. Query ke Supabase menggunakan serverNow sebagai filter waktu
        const { data, error } = await supabaseAdmin
            .from('jadwal_pertandingan')
            .select('*')
            .gte('waktu', serverNow.toISOString()); // Hanya ambil jadwal setelah/sama dengan waktu server sekarang

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Internal Log - Error getActiveJadwalWithServerTime:", error);
        return [];
    }
};
