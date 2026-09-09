'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { formatWibDateTime } from '@/lib/dashboardUtils';

/**
 * Format string tanggal YYYY-MM-DD menjadi WIB (Indonesia)
 * @param {string} dateStr 
 * @returns {string}
 */
const formatTanggalWib = (dateStr) => {
    if (!dateStr) return '';
    try {
        // Date format YYYY-MM-DD -> buat Date objek pada jam 07:00:00 WIB
        const [year, month, day] = dateStr.split('-');
        if (year && month && day) {
            const date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0));
            return new Intl.DateTimeFormat('id-ID', {
                timeZone: 'Asia/Jakarta',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }).format(date);
        }
        return formatWibDateTime(dateStr);
    } catch {
        return dateStr;
    }
};

/**
 * Ambil daftar dokumentasi beserta cuplikannya berdasarkan site
 * @param {string} site 'pkkmb' | 'pose'
 * @returns {Promise<Array>}
 */
export const getDokumentasi = async (site) => {
    try {
        let query = supabaseAdmin
            .from('dokumentasi')
            .select(`
                id,
                site,
                judul,
                header_foto,
                tanggal,
                link_gdrive,
                created_at,
                dokumentasi_cuplikan (
                    id,
                    judul_cuplikan,
                    link_gdrive_video,
                    tipe_cuplikan,
                    urutan,
                    created_at
                )
            `)
            .order('tanggal', { ascending: false, nullsFirst: false })
            .order('created_at', { ascending: false });

        if (site && site !== 'all') {
            query = query.eq('site', site);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Map and format with WIB dates and sort cuplikan
        const formatted = (data || []).map(item => {
            const cuplikanList = (item.dokumentasi_cuplikan || []).sort((a, b) => (a.urutan || 0) - (b.urutan || 0));
            return {
                ...item,
                tanggal_wib: item.tanggal ? formatTanggalWib(item.tanggal) : (item.created_at ? formatWibDateTime(item.created_at) : ''),
                created_at_wib: item.created_at ? formatWibDateTime(item.created_at) : '',
                dokumentasi_cuplikan: cuplikanList
            };
        });

        return formatted;
    } catch (error) {
        console.error('Internal Log - Error fetching public dokumentasi:', error);
        return [];
    }
};

/**
 * Ambil daftar konten multimedia berdasarkan site
 * @param {string} site 'pkkmb' | 'pose'
 * @returns {Promise<Array>}
 */
export const getKontenMultimedia = async (site) => {
    try {
        let query = supabaseAdmin
            .from('konten_multimedia')
            .select('*')
            .order('tanggal', { ascending: false, nullsFirst: false })
            .order('created_at', { ascending: false });

        if (site && site !== 'all') {
            query = query.eq('site', site);
        }

        const { data, error } = await query;
        if (error) throw error;

        const formatted = (data || []).map(item => ({
            ...item,
            tanggal_wib: item.tanggal ? formatTanggalWib(item.tanggal) : (item.created_at ? formatWibDateTime(item.created_at) : ''),
            created_at_wib: item.created_at ? formatWibDateTime(item.created_at) : ''
        }));

        return formatted;
    } catch (error) {
        console.error('Internal Log - Error fetching public konten multimedia:', error);
        return [];
    }
};
