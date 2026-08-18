'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { checkAdminAuth, insertAuditLog } from './audit';
import { autoCreateTransactionFromPeserta, autoDeleteTransactionFromPeserta } from './finance';

// Fetch all pembayaran_pkkmb and match with peserta records
export const getPembayaranPkkmbKeuangan = async () => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        const { data: pembayaranData, error: pembError } = await supabaseAdmin
            .from('pembayaran_pkkmb')
            .select('id, nim_user, jenis_bayar, tahapan, nominal, status_pembayaran, created_at')
            .order('created_at', { ascending: false });

        if (pembError) throw pembError;
        if (!pembayaranData || pembayaranData.length === 0) return [];

        const nims = pembayaranData.map(p => p.nim_user);
        const { data: pesertaData, error: pesErr } = await supabaseAdmin
            .from('peserta')
            .select('id, nama, nim, email_wa, prodi, angkatan, semester, kelas, kampus, bukti_bayar, metode_pembayaran, kode_form, created_at')
            .eq('site_type', 'pkkmb')
            .eq('jenis_form', 'wajib')
            .in('nim', nims)
            .order('created_at', { ascending: true });

        if (pesErr) throw pesErr;

        return pembayaranData.map(p => {
            const matchingPesertas = (pesertaData || []).filter(pRecord => pRecord.nim === p.nim_user);
            let matchingPeserta = null;
            if (p.tahapan === 'tahap 2' && matchingPesertas.length > 1) {
                matchingPeserta = matchingPesertas[1];
            } else {
                matchingPeserta = matchingPesertas[0];
            }

            return {
                id: p.id,
                nim_user: p.nim_user,
                nim: p.nim_user,
                jenis_bayar: p.jenis_bayar,
                tahapan: p.tahapan,
                nominal: p.nominal,
                nominal_pembayaran: p.nominal,
                status_pembayaran: p.status_pembayaran,
                created_at: p.created_at,
                peserta_id: matchingPeserta?.id || null,
                nama: matchingPeserta?.nama || 'Tidak Dikenal',
                email_wa: matchingPeserta?.email_wa || '',
                prodi: matchingPeserta?.prodi || '',
                angkatan: matchingPeserta?.angkatan || '',
                semester: matchingPeserta?.semester || '',
                kelas: matchingPeserta?.kelas || '',
                kampus: matchingPeserta?.kampus || '',
                bukti_bayar: matchingPeserta?.bukti_bayar || '',
                metode_pembayaran: matchingPeserta?.metode_pembayaran || '',
                kode_form: matchingPeserta?.kode_form || '',
                peserta: matchingPeserta || null
            };
        });
    } catch (error) {
        console.error("Internal Log - Error fetching pembayaran pkkmb keuangan:", error);
        return [];
    }
};

// Fetch lunas pembayaran_pkkmb for dashboard calculations
export const getPembayaranPkkmbLunas = async () => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        const { data: pembayaranData, error: pembError } = await supabaseAdmin
            .from('pembayaran_pkkmb')
            .select('id, nim_user, jenis_bayar, tahapan, nominal, status_pembayaran, created_at')
            .in('status_pembayaran', ['Lunas', 'lunas'])
            .order('created_at', { ascending: false });

        if (pembError) throw pembError;
        if (!pembayaranData || pembayaranData.length === 0) return [];

        const nims = pembayaranData.map(p => p.nim_user);
        const { data: pesertaData, error: pesErr } = await supabaseAdmin
            .from('peserta')
            .select('id, nama, nim, email_wa, prodi, angkatan, semester, kelas, kampus, bukti_bayar, metode_pembayaran, kode_form, created_at')
            .eq('site_type', 'pkkmb')
            .eq('jenis_form', 'wajib')
            .in('nim', nims)
            .order('created_at', { ascending: true });

        if (pesErr) throw pesErr;

        return pembayaranData.map(p => {
            const matchingPesertas = (pesertaData || []).filter(pRecord => pRecord.nim === p.nim_user);
            let matchingPeserta = null;
            if (p.tahapan === 'tahap 2' && matchingPesertas.length > 1) {
                matchingPeserta = matchingPesertas[1];
            } else {
                matchingPeserta = matchingPesertas[0];
            }

            return {
                id: p.id,
                nim_user: p.nim_user,
                nim: p.nim_user,
                jenis_bayar: p.jenis_bayar,
                tahapan: p.tahapan,
                nominal: p.nominal,
                nominal_pembayaran: p.nominal,
                status_pembayaran: p.status_pembayaran,
                created_at: p.created_at,
                jenis_form: 'wajib',
                site_type: 'pkkmb',
                peserta_id: matchingPeserta?.id || null,
                nama: matchingPeserta?.nama || 'Tidak Dikenal',
                email_wa: matchingPeserta?.email_wa || '',
                prodi: matchingPeserta?.prodi || '',
                angkatan: matchingPeserta?.angkatan || '',
                semester: matchingPeserta?.semester || '',
                kelas: matchingPeserta?.kelas || '',
                kampus: matchingPeserta?.kampus || '',
                bukti_bayar: matchingPeserta?.bukti_bayar || '',
                metode_pembayaran: matchingPeserta?.metode_pembayaran || '',
                kode_form: matchingPeserta?.kode_form || '',
                peserta: matchingPeserta || null
            };
        });
    } catch (error) {
        console.error("Internal Log - Error fetching lunas pembayaran pkkmb:", error);
        return [];
    }
};


// Fetch grouped per-NIM recap for data peserta page
export const getDataPesertaRekapPkkmb = async () => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        // Fetch all pembayaran_pkkmb records
        const { data: allPayments, error: pErr } = await supabaseAdmin
            .from('pembayaran_pkkmb')
            .select('*')
            .order('created_at', { ascending: true });

        if (pErr) throw pErr;
        if (!allPayments || allPayments.length === 0) return [];

        const nims = [...new Set(allPayments.map(p => p.nim_user))];

        // Fetch first peserta record per NIM
        const { data: pesertaData, error: pesErr } = await supabaseAdmin
            .from('peserta')
            .select('id, nama, nim, email_wa, prodi, angkatan, kelas, kampus, kode_form, status_pembayaran, created_at')
            .eq('site_type', 'pkkmb')
            .eq('jenis_form', 'wajib')
            .in('nim', nims)
            .order('created_at', { ascending: true });

        if (pesErr) throw pesErr;

        // Fetch pricing to compute total tagihan per kelas
        const { data: pricingData } = await supabaseAdmin
            .from('form_wajib_pricing')
            .select('form_id, kelas, jenis_tahapan, nominal');

        // Group by NIM
        const byNim = {};
        for (const nim of nims) {
            const payments = allPayments.filter(p => p.nim_user === nim);
            const pesertas = (pesertaData || []).filter(p => p.nim === nim);
            const firstPeserta = pesertas[0] || null;
            const kelas = firstPeserta?.kelas || null;

            // Total tagihan = pricing full for kelas
            let totalTagihan = 0;
            if (kelas && pricingData) {
                const fullPrice = pricingData.find(pr => pr.kelas === kelas && pr.jenis_tahapan === 'full');
                if (fullPrice) totalTagihan = fullPrice.nominal;
            }

            const totalDibayar = payments
                .filter(p => p.status_pembayaran === 'lunas')
                .reduce((sum, p) => sum + (p.nominal || 0), 0);

            const isDitolak = (firstPeserta?.status_pembayaran || '').toLowerCase() === 'ditolak';

            byNim[nim] = {
                nim,
                nama: firstPeserta?.nama || 'Tidak Dikenal',
                kampus: firstPeserta?.kampus || '',
                email_wa: firstPeserta?.email_wa || '',
                kelas: kelas || '',
                prodi: firstPeserta?.prodi || '',
                status_pembayaran: firstPeserta?.status_pembayaran || 'pending',
                total_tagihan: isDitolak ? 0 : totalTagihan,
                total_dibayar: isDitolak ? 0 : totalDibayar,
                sisa_tunggakan: isDitolak ? 0 : Math.max(0, totalTagihan - totalDibayar),
                tahapan_detail: payments.map(p => ({
                    id: p.id,
                    tahapan: p.tahapan,
                    jenis_bayar: p.jenis_bayar,
                    nominal: p.nominal,
                    status_pembayaran: p.status_pembayaran,
                    created_at: p.created_at
                }))
            };
        }

        return Object.values(byNim);
    } catch (error) {
        console.error("Internal Log - Error fetching rekap data peserta pkkmb:", error);
        return [];
    }
};

// Update status of payment and trigger accounting/participant updates
export const updateStatusPembayaranPkkmb = async (id, status) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id || !status) throw new Error('ID and Status are required');

        // Get the pembayaran record
        const { data: currentPayment, error: fetchErr } = await supabaseAdmin
            .from('pembayaran_pkkmb')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchErr || !currentPayment) throw new Error('Payment record not found');

        // Update status of the payment
        const { error: updateErr } = await supabaseAdmin
            .from('pembayaran_pkkmb')
            .update({ status_pembayaran: status })
            .eq('id', id);

        if (updateErr) throw updateErr;

        await insertAuditLog(user.email, 'UPDATE_STATUS_PEMBAYARAN_PKKMB', id, `Status updated to ${status} for NIM ${currentPayment.nim_user}`, adminNama);

        // Fetch matching peserta (first pendaftaran)
        const { data: firstPeserta, error: pesErr } = await supabaseAdmin
            .from('peserta')
            .select('*')
            .eq('nim', currentPayment.nim_user)
            .eq('site_type', 'pkkmb')
            .eq('jenis_form', 'wajib')
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();

        if (!pesErr && firstPeserta) {
            // Find all pembayaran records for this user that are 'lunas'
            const { data: allPayments } = await supabaseAdmin
                .from('pembayaran_pkkmb')
                .select('*')
                .eq('nim_user', currentPayment.nim_user);

            const activePayments = allPayments || [];
            // Calculate total verified payments
            const verifiedPayments = activePayments.filter(p => p.id === id ? status === 'lunas' : p.status_pembayaran === 'lunas');
            const totalNominalPaid = verifiedPayments.reduce((sum, p) => sum + p.nominal, 0);

            // Fetch pricing for Wajib form
            const rawKodeForm = firstPeserta.kode_form;
            const searchKode = rawKodeForm ? (rawKodeForm.length > 4 ? rawKodeForm.slice(0, -4) : rawKodeForm) : null;

            let requiredFullNominal = 500000; // default fallback
            let hasPricing = false;

            if (searchKode) {
                const { data: fw } = await supabaseAdmin
                    .from('form_wajib')
                    .select('id')
                    .or(`kode_form.eq.${searchKode},kode_form.eq.${rawKodeForm}`)
                    .limit(1)
                    .single();

                if (fw) {
                    const { data: pricing } = await supabaseAdmin
                        .from('form_wajib_pricing')
                        .select('nominal')
                        .eq('form_id', fw.id)
                        .eq('kelas', firstPeserta.kelas || 'Reguler')
                        .eq('jenis_tahapan', 'full')
                        .maybeSingle();

                    if (pricing) {
                        requiredFullNominal = pricing.nominal;
                        hasPricing = true;
                    }
                }
            }

            // Check if both tahap 1 and tahap 2 are paid, or if total meets requirements
            const hasTahap1 = verifiedPayments.some(p => p.tahapan === 'tahap 1');
            const hasTahap2 = verifiedPayments.some(p => p.tahapan === 'tahap 2');
            const hasFull = verifiedPayments.some(p => p.tahapan === 'full');

            let shouldBeLunas = false;
            if (hasFull) {
                shouldBeLunas = true;
            } else if (hasTahap1 && hasTahap2) {
                shouldBeLunas = true;
            } else if (totalNominalPaid >= requiredFullNominal) {
                shouldBeLunas = true;
            }

            // Update status of the peserta record
            if (status === 'ditolak') {
                await supabaseAdmin
                    .from('peserta')
                    .update({ status_pembayaran: 'ditolak' })
                    .eq('nim', currentPayment.nim_user)
                    .eq('site_type', 'pkkmb');

                await supabaseAdmin
                    .from('pembayaran_pkkmb')
                    .update({ status_pembayaran: 'ditolak' })
                    .eq('nim_user', currentPayment.nim_user);
            } else if (shouldBeLunas) {
                await supabaseAdmin
                    .from('peserta')
                    .update({ status_pembayaran: 'lunas' })
                    .eq('id', firstPeserta.id);
            } else {
                await supabaseAdmin
                    .from('peserta')
                    .update({ status_pembayaran: 'pending' })
                    .eq('id', firstPeserta.id);
            }

            // Accounting integration trigger
            // Note: autoCreateTransactionFromPeserta will handle generating transaction & double-entry journal entries
            // Let's pass the specific payment info so it can create journal entries for this payment stage.
            if (status === 'lunas') {
                const dummyPesertaForAccounting = {
                    ...firstPeserta,
                    // pass payment specific values
                    metode_pembayaran: firstPeserta.metode_pembayaran, // fallback
                    bukti_bayar: firstPeserta.bukti_bayar,
                    // we can pass pembayaran details through custom fields
                    _pembayaran_id: currentPayment.id,
                    _pembayaran_tahapan: currentPayment.tahapan,
                    _pembayaran_nominal: currentPayment.nominal,
                    _pembayaran_jenis_bayar: currentPayment.jenis_bayar
                };

                // If it is Tahap 2, we should fetch the specific second peserta's payment method and proof if available
                if (currentPayment.tahapan === 'tahap 2') {
                    const { data: secondPeserta } = await supabaseAdmin
                        .from('peserta')
                        .select('metode_pembayaran, bukti_bayar')
                        .eq('nim', currentPayment.nim_user)
                        .eq('site_type', 'pkkmb')
                        .eq('jenis_form', 'wajib')
                        .order('created_at', { ascending: true })
                        .range(1, 1)
                        .maybeSingle();

                    if (secondPeserta) {
                        dummyPesertaForAccounting.metode_pembayaran = secondPeserta.metode_pembayaran;
                        dummyPesertaForAccounting.bukti_bayar = secondPeserta.bukti_bayar;
                    }
                }

                await autoCreateTransactionFromPeserta(dummyPesertaForAccounting, user.email);
            } else {
                // If rolled back/ditolak, clean up the specific transaction
                await autoDeleteTransactionFromPeserta({
                    ...firstPeserta,
                    nim: `${firstPeserta.nim}-${currentPayment.tahapan}` // match the unique nim structure we'll use in finance
                });
            }
        }

        return { success: true };
    } catch (error) {
        console.error("Internal Log - Error updating pembayaran pkkmb status:", error);
        return { success: false, error: 'Terjadi kesalahan internal pada server' };
    }
};

/**
 * Hapus satu record pembayaran_pkkmb beserta record peserta terkait (jika ada).
 * @param {string} pembayaranId - UUID di tabel pembayaran_pkkmb
 * @param {string|null} pesertaId - UUID di tabel peserta (boleh null)
 * @param {string} nimUser - NIM peserta, dipakai untuk cleanup finance
 */
export const deletePembayaranPkkmb = async (pembayaranId, pesertaId, nimUser) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!pembayaranId) throw new Error('ID pembayaran diperlukan');

        // 1. Cleanup finance records (by NIM sebagai kode_payer)
        if (nimUser) {
            const fakeStubPeserta = { nim: nimUser, site_type: 'pkkmb', nama: '' };
            await autoDeleteTransactionFromPeserta(fakeStubPeserta);
        }

        // 2. Hapus record peserta jika peserta_id tersedia
        if (pesertaId) {
            await supabaseAdmin.from('peserta').delete().eq('id', pesertaId);
        }

        // 3. Hapus record pembayaran_pkkmb
        const { error: delErr } = await supabaseAdmin
            .from('pembayaran_pkkmb')
            .delete()
            .eq('id', pembayaranId);

        if (delErr) throw delErr;

        await insertAuditLog(
            user.email,
            'DELETE_PEMBAYARAN_PKKMB',
            pembayaranId,
            `Deleted pembayaran_pkkmb${pesertaId ? ' + peserta' : ''} for NIM ${nimUser}`,
            adminNama
        );

        return { success: true };
    } catch (error) {
        console.error('Internal Log - Error deleting pembayaran pkkmb:', error);
        return { success: false, error: 'Terjadi kesalahan internal pada server' };
    }
};

