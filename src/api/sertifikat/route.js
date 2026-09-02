'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { checkAdminAuth } from '@/api/supabase/admin/audit';
import { getNextSertifikatNo, insertLogSertifikat } from '@/api/supabase/admin/sertifikat';
import {
    generateSertifikatPosePDF,
    formatNomorSertifikat,
    buildQRTextPartisipasi,
    buildQRTextPeserta,
    buildQRTextJuara
} from '@/lib/pdf/sertifikatPose';

/**
 * Public action: Get certificate preview information by team's kode_form
 * @param {string} kode_form 
 * @returns {Promise<{success: boolean, team?: Object, isJuara?: boolean, peringkat?: number, error?: string}>}
 */
export async function getSertifikatInfoByKodeForm(kode_form) {
    try {
        if (!kode_form) {
            return { success: false, error: 'Kode form diperlukan.' };
        }

        const cleanCode = kode_form.trim();

        // 1. Fetch team along with team members
        const { data: team, error: teamError } = await supabaseAdmin
            .from('team')
            .select(`
                id,
                title,
                nama_lomba,
                jenis_lomba,
                kode_form,
                verivikasi,
                team_members (
                    id,
                    nama,
                    jabatan
                )
            `)
            .eq('kode_form', cleanCode)
            .maybeSingle();

        if (teamError) throw teamError;
        if (!team) {
            return { success: false, error: 'Tim dengan kode form tersebut tidak ditemukan.' };
        }

        // 2. Check if team is in juara_lomba table
        const { data: juara, error: juaraError } = await supabaseAdmin
            .from('juara_lomba')
            .select('id, peringkat, nama_lomba, jenis_lomba')
            .eq('team_id', team.id)
            .maybeSingle();

        if (juaraError) throw juaraError;

        const isJuara = !!juara;
        const peringkat = juara ? juara.peringkat : null;

        // 3. Fetch score records if Kreativitas
        let nilaiCount = 0;
        if (team.jenis_lomba === 'Kreativitas') {
            const { count, error: countError } = await supabaseAdmin
                .from('nilai_lomba')
                .select('*', { count: 'exact', head: true })
                .eq('team_id', team.id)
                .eq('status_public', true);

            if (!countError) {
                nilaiCount = count || 0;
            }
        }

        return {
            success: true,
            team,
            isJuara,
            peringkat,
            nilaiCount
        };
    } catch (err) {
        console.error('Error in getSertifikatInfoByKodeForm:', err);
        return { success: false, error: 'Terjadi kesalahan saat memeriksa data sertifikat.' };
    }
}

/**
 * Server action: Generate POSE Certificate
 * @param {Object} payload
 * @param {'partisipasi' | 'peserta_juara'} payload.type
 * @param {string} [payload.kode_form]
 * @param {string} [payload.pesertaId]
 * @returns {Promise<{success: boolean, base64Pdf?: string, nomorSert?: string, filename?: string, error?: string}>}
 */
export async function generateSertifikatPoseAction(payload = {}) {
    try {
        const { type = 'peserta_juara', kode_form = '', pesertaId = '' } = payload;

        // ==========================================
        // 1. SERTIFIKAT PARTISIPASI (DARI ADMIN FORM WAJIB)
        // ==========================================
        if (type === 'partisipasi') {
            // Security check: Only authenticated admins can print partisipasi certificates
            const { error: authError } = await checkAdminAuth();
            if (authError) {
                throw new Error(`Akses tidak diizinkan: ${authError}`);
            }

            if (!pesertaId) {
                throw new Error('Peserta ID diperlukan untuk mencetak sertifikat partisipasi.');
            }

            // Fetch peserta data
            const { data: peserta, error: pesertaError } = await supabaseAdmin
                .from('peserta')
                .select('nama, site_type, jenis_form, status_pembayaran')
                .eq('id', pesertaId)
                .single();

            if (pesertaError || !peserta) {
                throw new Error('Data peserta tidak ditemukan.');
            }

            if (peserta.site_type !== 'pose' || peserta.jenis_form !== 'wajib') {
                throw new Error('Sertifikat partisipasi hanya berlaku untuk peserta POSE form wajib.');
            }

            const statusPembayaran = (peserta.status_pembayaran || '').toLowerCase();
            if (statusPembayaran !== 'lunas') {
                throw new Error('Sertifikat hanya dapat dicetak untuk peserta yang berstatus Lunas.');
            }

            // Get next sequence number for PTS
            const nextSeq = await getNextSertifikatNo('pts');
            const nomorSert = formatNomorSertifikat(nextSeq, 'PTS');

            // Build QR text
            const qrText = buildQRTextPartisipasi({
                nomorSert,
                nama: peserta.nama
            });

            // Generate PDF Buffer
            const pdfBuffer = await generateSertifikatPosePDF({
                jenis: 'partisipasi',
                nomorSert,
                nama: peserta.nama,
                qrText
            });

            // Log to database
            await insertLogSertifikat({
                team_id: null,
                no_sert: nextSeq,
                kode_sert: 'PTS',
                jenis_sert: 'Partisipasi',
                keterangan_sert: `Sertifikat Partisipasi - ${peserta.nama}`
            });

            const base64Pdf = Buffer.from(pdfBuffer).toString('base64');
            const filename = `Sertifikat_Partisipasi_${peserta.nama.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

            return {
                success: true,
                base64Pdf,
                nomorSert,
                filename
            };
        }

        // ==========================================
        // 2. SERTIFIKAT PESERTA / JUARA (DARI /pose/sertifikat)
        // ==========================================
        if (!kode_form) {
            throw new Error('Kode form tim diperlukan.');
        }

        const cleanCode = kode_form.trim();

        // 1. Fetch team with members
        const { data: team, error: teamError } = await supabaseAdmin
            .from('team')
            .select(`
                id,
                title,
                nama_lomba,
                jenis_lomba,
                kode_form,
                team_members (
                    id,
                    nama,
                    jabatan
                )
            `)
            .eq('kode_form', cleanCode)
            .maybeSingle();

        if (teamError || !team) {
            throw new Error('Tim dengan kode form tersebut tidak ditemukan.');
        }

        // 2. Check if team is in juara_lomba
        const { data: juara } = await supabaseAdmin
            .from('juara_lomba')
            .select('peringkat, nama_lomba')
            .eq('team_id', team.id)
            .maybeSingle();

        const isJuara = !!juara;
        const peringkat = juara ? juara.peringkat : null;
        const kodeSeq = isJuara ? 'jur' : 'pst';
        const kodeLabel = isJuara ? 'JUR' : 'PST';
        const jenisLabel = isJuara ? 'Juara' : 'Peserta';

        // 3. Fetch score details if competition is Kreativitas
        let nilaiList = [];
        const isKreativitas = team.jenis_lomba === 'Kreativitas';
        if (isKreativitas) {
            const { data: scoresData } = await supabaseAdmin
                .from('nilai_lomba')
                .select(`
                    id,
                    kritik,
                    saran,
                    nilai_akhir,
                    created_at,
                    form_nilai_lomba:form_nilai_lomba_id (
                        nama_juri,
                        nama_lomba
                    ),
                    detail_nilai_lomba (
                        id,
                        judul_nilai,
                        bobot_nilai,
                        nilai
                    )
                `)
                .eq('team_id', team.id)
                .eq('status_public', true);

            if (scoresData) {
                nilaiList = scoresData;
            }
        }

        // 4. Get next sequence number
        const nextSeq = await getNextSertifikatNo(kodeSeq);
        const nomorSert = formatNomorSertifikat(nextSeq, kodeLabel);

        // 5. Build QR text
        let qrText = '';
        if (isJuara) {
            qrText = buildQRTextJuara({
                nomorSert,
                namaTeam: team.title,
                namaLomba: team.nama_lomba,
                peringkat,
                anggota: team.team_members || [],
                nilaiList
            });
        } else {
            qrText = buildQRTextPeserta({
                nomorSert,
                namaTeam: team.title,
                namaLomba: team.nama_lomba,
                anggota: team.team_members || []
            });
        }

        // 6. Generate PDF Buffer
        const pdfBuffer = await generateSertifikatPosePDF({
            jenis: isJuara ? 'juara' : 'peserta',
            nomorSert,
            namaTeam: team.title,
            namaLomba: team.nama_lomba,
            peringkat,
            anggota: team.team_members || [],
            qrText,
            isKreativitas,
            nilaiList
        });

        // 7. Insert log into log_sertifikat_pose
        await insertLogSertifikat({
            team_id: team.id,
            no_sert: nextSeq,
            kode_sert: kodeLabel,
            jenis_sert: jenisLabel,
            keterangan_sert: isJuara ? `Juara ${peringkat} - ${team.title}` : `Sertifikat Peserta - ${team.title}`
        });

        const base64Pdf = Buffer.from(pdfBuffer).toString('base64');
        const filename = `Sertifikat_${kodeLabel}_${team.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

        return {
            success: true,
            base64Pdf,
            nomorSert,
            filename,
            isJuara,
            peringkat
        };
    } catch (err) {
        console.error('Error in generateSertifikatPoseAction:', err);
        return {
            success: false,
            error: err.message || 'Terjadi kesalahan saat memproses sertifikat.'
        };
    }
}
