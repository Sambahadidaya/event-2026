'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { checkAdminAuth, insertAuditLog } from './audit';

/**
 * Get next sequence number for certificate
 * @param {'pts' | 'pst' | 'jur'} kode 
 * @returns {Promise<number>}
 */
export const getNextSertifikatNo = async (kode) => {
    try {
        const seqName = `sert_${kode.toLowerCase()}_no_seq`;
        const { data, error } = await supabaseAdmin.rpc('nextval_sert', {
            seq_name: seqName
        });

        if (error) {
            console.error('Error fetching sequence nextval:', error);
            // Fallback: estimate from log_sertifikat_pose count
            const { count } = await supabaseAdmin
                .from('log_sertifikat_pose')
                .select('*', { count: 'exact', head: true })
                .eq('kode_sert', kode.toUpperCase());
            return (count || 0) + 1;
        }

        return Number(data);
    } catch (err) {
        console.error('Exception in getNextSertifikatNo:', err);
        return 1;
    }
};

/**
 * Insert record into log_sertifikat_pose
 * @param {Object} payload 
 * @param {string|null} payload.team_id
 * @param {number} payload.no_sert
 * @param {string} payload.kode_sert - 'PTS' | 'PST' | 'JUR'
 * @param {string} payload.jenis_sert - 'Partisipasi' | 'Peserta' | 'Juara'
 * @param {string} payload.keterangan_sert
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const insertLogSertifikat = async (payload) => {
    try {
        const { error } = await supabaseAdmin
            .from('log_sertifikat_pose')
            .insert([{
                team_id: payload.team_id || null,
                no_sert: payload.no_sert,
                kode_sert: payload.kode_sert,
                jenis_sert: payload.jenis_sert,
                keterangan_sert: payload.keterangan_sert || ''
            }]);

        if (error) {
            console.error('Error inserting log_sertifikat_pose:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err) {
        console.error('Exception in insertLogSertifikat:', err);
        return { success: false, error: err.message };
    }
};

/**
 * Get peserta wajib with status Lunas for POSE to print certificate
 * @param {string} [kodeForm] - optional filter by kode_form
 * @returns {Promise<Array>}
 */
export const getPesertaWajibPoseLunas = async (kodeForm = null) => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        let query = supabaseAdmin
            .from('peserta')
            .select('id, nama, nim, kampus, prodi')
            .eq('site_type', 'pose')
            .eq('jenis_form', 'wajib')
            .in('status_pembayaran', ['Lunas', 'lunas'])
            .order('nama', { ascending: true });

        if (kodeForm) {
            query = query.eq('kode_form', kodeForm);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Error in getPesertaWajibPoseLunas:', err);
        return [];
    }
};
