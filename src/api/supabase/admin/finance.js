'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { checkAdminAuth, insertAuditLog } from './audit';
import { nanoid } from 'nanoid';

// ============================================================================
// 1. MASTER ACCOUNT (Chart of Accounts)
// ============================================================================

export const getMasterAccount = async (site = 'all') => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        let query = supabaseAdmin
            .from('master_account')
            .select('*')
            .order('kode_akun', { ascending: true });

        if (site && site !== 'all') {
            query = query.or(`site.eq.${site},site.is.null`);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Internal Log - Error fetching master account:", error);
        return [];
    }
};

export const upsertMasterAccount = async (payload, id = null) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!payload) throw new Error('Payload is required');

        if (id) {
            const { data, error } = await supabaseAdmin
                .from('master_account')
                .update({ ...payload, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            await insertAuditLog(user.email, 'UPDATE_MASTER_ACCOUNT', id, `Updated master account ${payload.nama_akun}`, adminNama);
            return { success: true, data };
        } else {
            const kode_id = `MA${Math.floor(100 + Math.random() * 900)}`;
            const { data, error } = await supabaseAdmin
                .from('master_account')
                .insert([{ ...payload, kode_id }])
                .select()
                .single();

            if (error) throw error;
            await insertAuditLog(user.email, 'CREATE_MASTER_ACCOUNT', data.id, `Created master account ${payload.nama_akun}`, adminNama);
            return { success: true, data };
        }
    } catch (error) {
        console.error("Internal Log - Error upserting master account:", error);
        return { success: false, error: error.message || 'Terjadi kesalahan internal pada server' };
    }
};

export const deleteMasterAccount = async (id) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id) throw new Error('ID is required');

        const { error } = await supabaseAdmin
            .from('master_account')
            .delete()
            .eq('id', id);

        if (error) throw error;
        await insertAuditLog(user.email, 'DELETE_MASTER_ACCOUNT', id, `Deleted master account`, adminNama);
        return { success: true };
    } catch (error) {
        console.error("Internal Log - Error deleting master account:", error);
        return { success: false, error: error.message || 'Terjadi kesalahan internal pada server' };
    }
};


// ============================================================================
// 2. MASTER TRANSACTION CATEGORY
// ============================================================================

export const getMasterTransactionCategory = async (site = 'all') => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        let query = supabaseAdmin
            .from('master_transaction_category')
            .select('*')
            .order('created_at', { ascending: false });

        if (site && site !== 'all') {
            query = query.eq('site', site);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Internal Log - Error fetching master category:", error);
        return [];
    }
};

export const upsertMasterTransactionCategory = async (payload, id = null) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!payload) throw new Error('Payload is required');

        if (id) {
            const { data, error } = await supabaseAdmin
                .from('master_transaction_category')
                .update({ ...payload, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            await insertAuditLog(user.email, 'UPDATE_MASTER_TRANSACTION_CATEGORY', id, `Updated category ${payload.nama_kategori}`, adminNama);
            return { success: true, data };
        } else {
            const kode_id = `MT${Math.floor(100 + Math.random() * 900)}`;
            const { data, error } = await supabaseAdmin
                .from('master_transaction_category')
                .insert([{ ...payload, kode_id }])
                .select()
                .single();

            if (error) throw error;
            await insertAuditLog(user.email, 'CREATE_MASTER_TRANSACTION_CATEGORY', data.id, `Created category ${payload.nama_kategori}`, adminNama);
            return { success: true, data };
        }
    } catch (error) {
        console.error("Internal Log - Error upserting master category:", error);
        return { success: false, error: error.message || 'Terjadi kesalahan internal pada server' };
    }
};

export const deleteMasterTransactionCategory = async (id) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id) throw new Error('ID is required');

        const { error } = await supabaseAdmin
            .from('master_transaction_category')
            .delete()
            .eq('id', id);

        if (error) throw error;
        await insertAuditLog(user.email, 'DELETE_MASTER_TRANSACTION_CATEGORY', id, `Deleted category`, adminNama);
        return { success: true };
    } catch (error) {
        console.error("Internal Log - Error deleting master category:", error);
        return { success: false, error: error.message || 'Terjadi kesalahan internal pada server' };
    }
};


// ============================================================================
// 3. TRANSACTION FINANCE (Buku Besar Transaksi)
// ============================================================================

export const getTransactionFinance = async (site = 'all', startDate = null, endDate = null) => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        let query = supabaseAdmin
            .from('transaction_finance')
            .select(`
                *,
                kategori:kategori_transaksi_id ( id, kode_id, nama_kategori, nama_sub_kategori, type_transaksi ),
                akun:akun_pembayaran_id ( id, kode_akun, nama_akun, akun_type )
            `)
            .order('created_at', { ascending: false });

        if (site && site !== 'all') {
            query = query.eq('site', site);
        }
        if (startDate) {
            query = query.gte('tanggal_transaksi', startDate);
        }
        if (endDate) {
            query = query.lte('tanggal_transaksi', endDate);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Internal Log - Error fetching transactions:", error);
        return [];
    }
};

export const createTransactionFinance = async (payload) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        const kode_id = `TF${Math.floor(100 + Math.random() * 900)}`;
        const { data, error } = await supabaseAdmin
            .from('transaction_finance')
            .insert([{ ...payload, kode_id }])
            .select()
            .single();

        if (error) throw error;
        await insertAuditLog(user.email, 'CREATE_TRANSACTION_FINANCE', data.id, `Created transaction ${data.kode_id}`, adminNama);
        return { success: true, data };
    } catch (error) {
        console.error("Internal Log - Error creating transaction:", error);
        return { success: false, error: error.message || 'Terjadi kesalahan internal pada server' };
    }
};

export const deleteTransactionFinance = async (id) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        const { error } = await supabaseAdmin
            .from('transaction_finance')
            .delete()
            .eq('id', id);

        if (error) throw error;
        await insertAuditLog(user.email, 'DELETE_TRANSACTION_FINANCE', id, `Deleted transaction`, adminNama);
        return { success: true };
    } catch (error) {
        console.error("Internal Log - Error deleting transaction:", error);
        return { success: false, error: error.message || 'Terjadi kesalahan internal pada server' };
    }
};


// ============================================================================
// 4. JOURNAL ENTRY (Double-Entry Ledger)
// ============================================================================

export const getJournalEntry = async (site = 'all', startDate = null, endDate = null) => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        let query = supabaseAdmin
            .from('journal_entry')
            .select(`
                *,
                transaction:transaction_id ( id, kode_id, site, nama_payer, nominal, keterangan ),
                account:account_id ( id, kode_akun, nama_akun, akun_type )
            `)
            .order('created_at', { ascending: false });

        if (startDate) {
            query = query.gte('journal_date', startDate);
        }
        if (endDate) {
            query = query.lte('journal_date', endDate);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Filter by site on transaction side if site !== 'all'
        let result = data || [];
        if (site && site !== 'all') {
            result = result.filter(j => j.transaction?.site === site);
        }

        return result;
    } catch (error) {
        console.error("Internal Log - Error fetching journal entries:", error);
        return [];
    }
};


// ============================================================================
// 5. FORM TRANSAKSI PENGELUARAN (Manual Expenses)
// ============================================================================

export const getFormTransaksiPengeluaran = async (site = 'all') => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        let query = supabaseAdmin
            .from('form_transaksi_pengeluaran')
            .select('*')
            .order('created_at', { ascending: false });

        if (site && site !== 'all') {
            query = query.eq('site', site);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Internal Log - Error fetching pengeluaran forms:", error);
        return [];
    }
};

export const createFormTransaksiPengeluaran = async (payload) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        const {
            judul, keterangan, nominal, metode_pembayaran,
            bukti_pembayaran, penanggung_jawab, site,
            akun_pembayaran_id, akun_beban_id, kategori_transaksi_id
        } = payload;

        if (!judul || !nominal || !site) {
            throw new Error('Judul, nominal, dan site wajib diisi');
        }

        // 1. Insert to form_transaksi_pengeluaran
        const { data: formExpense, error: formError } = await supabaseAdmin
            .from('form_transaksi_pengeluaran')
            .insert([{
                judul,
                keterangan,
                nominal,
                metode_pembayaran,
                bukti_pembayaran,
                penanggung_jawab,
                site
            }])
            .select()
            .single();

        if (formError) throw formError;

        // 2. Auto-insert to transaction_finance (Expense)
        const kode_id = `TF${Math.floor(100 + Math.random() * 900)}`;
        const { data: tf, error: tfError } = await supabaseAdmin
            .from('transaction_finance')
            .insert([{
                kode_id,
                site,
                tanggal_transaksi: new Date().toISOString().split('T')[0],
                kategori_transaksi_id: kategori_transaksi_id || null,
                akun_pembayaran_id: akun_pembayaran_id || null,
                nama_payer: penanggung_jawab || 'Panitia',
                kode_payer: `EXP-${formExpense.id.slice(0, 8)}`,
                kategori_payer: 'Pengeluaran Panitia',
                metode_pembayaran: metode_pembayaran || 'Tunai',
                keterangan: `${judul}${keterangan ? ' - ' + keterangan : ''}`,
                nominal,
                bukti_pembayaran: bukti_pembayaran || null,
                created_by: user.id
            }])
            .select()
            .single();

        if (tfError) throw tfError;

        // 3. Create 2 journal entries if accounts are selected
        if (akun_beban_id && akun_pembayaran_id) {
            const je1_kode = `JE${Math.floor(100 + Math.random() * 900)}`;
            const je2_kode = `JE${Math.floor(100 + Math.random() * 900)}`;

            await supabaseAdmin.from('journal_entry').insert([
                {
                    kode_id: je1_kode,
                    transaction_id: tf.id,
                    account_id: akun_beban_id, // DEBIT Expense
                    debit: nominal,
                    credit: 0,
                    description: `[Expense] ${judul}`,
                    journal_date: new Date().toISOString().split('T')[0],
                    site: site
                },
                {
                    kode_id: je2_kode,
                    transaction_id: tf.id,
                    account_id: akun_pembayaran_id, // CREDIT Asset/Payment Account
                    debit: 0,
                    credit: nominal,
                    description: `[Expense] ${judul} via ${metode_pembayaran || 'Kas'}`,
                    journal_date: new Date().toISOString().split('T')[0],
                    site: site
                }
            ]);
        }

        await insertAuditLog(user.email, 'CREATE_FORM_PENGELUARAN', formExpense.id, `Created expense ${judul}`, adminNama);
        return { success: true, data: formExpense };
    } catch (error) {
        console.error("Internal Log - Error creating expense form:", error);
        return { success: false, error: error.message || 'Terjadi kesalahan internal pada server' };
    }
};

export const deleteFormTransaksiPengeluaran = async (id) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        const { error } = await supabaseAdmin
            .from('form_transaksi_pengeluaran')
            .delete()
            .eq('id', id);

        if (error) throw error;
        await insertAuditLog(user.email, 'DELETE_FORM_PENGELUARAN', id, `Deleted expense form`, adminNama);
        return { success: true };
    } catch (error) {
        console.error("Internal Log - Error deleting expense form:", error);
        return { success: false, error: error.message || 'Terjadi kesalahan internal pada server' };
    }
};


// ============================================================================
// 6. AUTO-TRIGGER INTEGRATION WITH PESERTA
// ============================================================================

/**
 * Automatically creates transaction_finance & journal_entry when participant status becomes Lunas.
 * Includes POSE deduplication check (kode_payer + site).
 */
export const autoCreateTransactionFromPeserta = async (peserta, userEmail = 'system') => {
    try {
        if (!peserta || !peserta.id) return { success: false, error: 'Invalid peserta data' };

        const site = peserta.site_type || 'pkkmb';
        let kodePayer = peserta.nim || peserta.email_wa || peserta.nama;

        // For PKKMB bertahap, we make kode_payer unique by appending tahapan
        if (site === 'pkkmb' && peserta.jenis_form === 'wajib' && peserta._pembayaran_tahapan) {
            kodePayer = `${peserta.nim}-${peserta._pembayaran_tahapan}`;
        }

        // 1. Check Deduplication for POSE (if email_wa + bukti_bayar match or kode_payer match)
        if (site === 'pose') {
            const { data: existingTF } = await supabaseAdmin
                .from('transaction_finance')
                .select('id')
                .eq('site', 'pose')
                .eq('kode_payer', kodePayer)
                .limit(1);

            if (existingTF && existingTF.length > 0) {
                console.log(`[Auto-Finance] POSE Deduplication triggered for ${peserta.nama} (${kodePayer}). Transaction already exists.`);
                return { success: true, duplicate: true };
            }
        } else {
            // General check for existing transaction by kode_payer & site
            const { data: existingGeneral } = await supabaseAdmin
                .from('transaction_finance')
                .select('id')
                .eq('site', site)
                .eq('kode_payer', kodePayer)
                .limit(1);

            if (existingGeneral && existingGeneral.length > 0) {
                console.log(`[Auto-Finance] Transaction already exists for ${peserta.nama} (${kodePayer})`);
                return { success: true, duplicate: true };
            }
        }

        // 2. Find Form Nominal & Kategori
        let nominal = 0;
        let keterangan = `Pembayaran ${site.toUpperCase()} - ${peserta.nama}`;
        let formCategoryName = 'Iuran Wajib';
        let formRegisterId = null;

        const rawKodeForm = peserta.kode_form;
        const searchKode = rawKodeForm ? (rawKodeForm.length > 4 ? rawKodeForm.slice(0, -4) : rawKodeForm) : null;

        const isPkkmbWajibStaged = site === 'pkkmb' && peserta.jenis_form === 'wajib' && peserta._pembayaran_tahapan;
        let requiredFullNominal = 500000;
        const pkkmbTahapan = peserta._pembayaran_tahapan;
        const pkkmbNominal = peserta._pembayaran_nominal;

        if (isPkkmbWajibStaged) {
            if (searchKode) {
                const { data: fw } = await supabaseAdmin
                    .from('form_wajib')
                    .select('id, judul')
                    .or(`kode_form.eq.${searchKode},kode_form.eq.${rawKodeForm}`)
                    .limit(1)
                    .single();

                if (fw) {
                    keterangan = `Pembayaran Wajib PKKMB [${pkkmbTahapan}] - ${peserta.nama}`;
                    const { data: pricing } = await supabaseAdmin
                        .from('form_wajib_pricing')
                        .select('nominal')
                        .eq('form_id', fw.id)
                        .eq('kelas', peserta.kelas || 'Reguler')
                        .eq('jenis_tahapan', 'full')
                        .maybeSingle();

                    if (pricing) {
                        requiredFullNominal = pricing.nominal;
                    }
                }
            }
            if (pkkmbTahapan === 'tahap 1') {
                nominal = pkkmbNominal || requiredFullNominal;
            } else {
                nominal = pkkmbNominal;
            }
        } else if (peserta.jenis_form === 'wajib') {
            if (searchKode) {
                const { data: fw } = await supabaseAdmin
                    .from('form_wajib')
                    .select('id, judul, nominal, site')
                    .or(`kode_form.eq.${searchKode},kode_form.eq.${rawKodeForm}`)
                    .limit(1)
                    .single();

                if (fw) {
                    nominal = fw.nominal || 0;
                    keterangan = `${fw.judul} - ${peserta.nama}`;
                }
            }
        } else if (peserta.jenis_form === 'register') {
            if (searchKode) {
                const { data: fr } = await supabaseAdmin
                    .from('form_register')
                    .select('id, nama_lomba, nominal, site')
                    .or(`kode_form.eq.${searchKode},kode_form.eq.${rawKodeForm}`)
                    .limit(1)
                    .single();

                if (fr) {
                    const kategoriPeserta = peserta.kategori || 'Mahasiswa LP3I';
                    const { data: pricing } = await supabaseAdmin
                        .from('form_register_pricing')
                        .select('nominal')
                        .eq('form_id', fr.id)
                        .eq('kategori', kategoriPeserta)
                        .single();

                    nominal = (pricing && pricing.nominal != null) ? pricing.nominal : (fr.nominal || 0);
                    keterangan = `Pendaftaran ${fr.nama_lomba || 'Lomba'} - ${peserta.nama}`;
                    formCategoryName = `Lomba ${fr.nama_lomba || ''}`;
                    formRegisterId = fr.id;
                }
            }
        }

        // Fallback default nominal if still 0
        if (!nominal || nominal === 0) {
            nominal = site === 'pkkmb' ? 500000 : 150000;
        }

        // 3. Map Payment Method to Master Account
        const paymentMethod = (peserta.metode_pembayaran || 'Tunai').trim();
        const { data: accounts } = await supabaseAdmin
            .from('master_account')
            .select('id, nama_akun, akun_type, kode_akun');

        let assetAccount = null;
        let revenueAccount = null;

        if (accounts && accounts.length > 0) {
            assetAccount = accounts.find(a => a.akun_type === 'Asset' && a.nama_akun.toLowerCase().includes(paymentMethod.toLowerCase()))
                || accounts.find(a => a.akun_type === 'Asset');

            revenueAccount = accounts.find(a => a.akun_type === 'Revenue');
        }

        // 4. Find Category from master_transaction_category
        const { data: categories } = await supabaseAdmin
            .from('master_transaction_category')
            .select('id')
            .eq('site', site)
            .eq('type_transaksi', 'income')
            .limit(1);

        const categoryId = (categories && categories.length > 0) ? categories[0].id : null;

        // 4b. Check if there is an associated sales pose referral record for POSE
        let salesEntry = null;
        if (site === 'pose' && formRegisterId && peserta.nim) {
            const { data: se } = await supabaseAdmin
                .from('sales_pose')
                .select('id, nominal')
                .eq('target_nim', peserta.nim)
                .eq('form_register_id', formRegisterId)
                .limit(1)
                .maybeSingle();
            if (se) {
                salesEntry = se;
            }
        }

        // 5. Insert to transaction_finance
        const kode_id = `TF${Math.floor(100 + Math.random() * 900)}`;
        const { data: tf, error: tfError } = await supabaseAdmin
            .from('transaction_finance')
            .insert([{
                kode_id,
                site,
                nama_kampus: peserta.kampus || 'Bandung',
                tanggal_transaksi: new Date().toISOString().split('T')[0],
                kategori_transaksi_id: categoryId,
                akun_pembayaran_id: assetAccount?.id || null,
                nama_payer: peserta.nama,
                kode_payer: kodePayer,
                kategori_payer: peserta.kategori || 'Mahasiswa',
                metode_pembayaran: paymentMethod,
                keterangan,
                nominal,
                bukti_pembayaran: peserta.bukti_bayar || null,
                created_by: null,
                potongan_sales: salesEntry ? salesEntry.nominal : 0,
                nama_nim_sales_id: salesEntry ? salesEntry.id : null
            }])
            .select()
            .single();

        if (tfError) throw tfError;

        // 6. Create Journal Entries (Double-Entry)
        if (assetAccount && revenueAccount && tf) {
            const je1_kode = `JE${Math.floor(100 + Math.random() * 900)}`;
            const je2_kode = `JE${Math.floor(100 + Math.random() * 900)}`;

            const utangAccount = accounts?.find(a => a.kode_akun === '2002');
            const bebanAccount = accounts?.find(a => a.kode_akun === '5005');
            const piutangAccount = accounts?.find(a => a.kode_akun === '1005' || a.nama_akun.toLowerCase().includes('piutang'));

            if (isPkkmbWajibStaged) {
                if (pkkmbTahapan === 'tahap 1') {
                    // Tahap 1: Debit Kas, Debit Piutang, Credit Revenue
                    const piutangNominal = requiredFullNominal - pkkmbNominal;
                    await supabaseAdmin.from('journal_entry').insert([
                        {
                            kode_id: je1_kode,
                            transaction_id: tf.id,
                            account_id: assetAccount.id, // DEBIT Asset (Kas/QRIS/Seabank)
                            debit: pkkmbNominal,
                            credit: 0,
                            description: `Penerimaan ${keterangan} via ${paymentMethod}`,
                            journal_date: new Date().toISOString().split('T')[0],
                            site: site
                        },
                        {
                            kode_id: `JE${Math.floor(100 + Math.random() * 900)}`,
                            transaction_id: tf.id,
                            account_id: piutangAccount ? piutangAccount.id : assetAccount.id, // DEBIT Piutang (or asset fallback)
                            debit: piutangNominal,
                            credit: 0,
                            description: `Piutang Pembayaran ${keterangan}`,
                            journal_date: new Date().toISOString().split('T')[0],
                            site: site
                        },
                        {
                            kode_id: je2_kode,
                            transaction_id: tf.id,
                            account_id: revenueAccount.id, // CREDIT Revenue
                            debit: 0,
                            credit: requiredFullNominal,
                            description: `Pendapatan ${keterangan}`,
                            journal_date: new Date().toISOString().split('T')[0],
                            site: site
                        }
                    ]);
                } else if (pkkmbTahapan === 'tahap 2') {
                    // Tahap 2: Debit Kas, Credit Piutang
                    await supabaseAdmin.from('journal_entry').insert([
                        {
                            kode_id: je1_kode,
                            transaction_id: tf.id,
                            account_id: assetAccount.id, // DEBIT Asset (Kas/QRIS/Seabank)
                            debit: pkkmbNominal,
                            credit: 0,
                            description: `Penerimaan Pelunasan ${keterangan} via ${paymentMethod}`,
                            journal_date: new Date().toISOString().split('T')[0],
                            site: site
                        },
                        {
                            kode_id: je2_kode,
                            transaction_id: tf.id,
                            account_id: piutangAccount ? piutangAccount.id : assetAccount.id, // CREDIT Piutang (or asset fallback)
                            debit: 0,
                            credit: pkkmbNominal,
                            description: `Pelunasan Piutang ${keterangan}`,
                            journal_date: new Date().toISOString().split('T')[0],
                            site: site
                        }
                    ]);
                }
            } else if (salesEntry && salesEntry.nominal > 0 && utangAccount && bebanAccount) {
                // 4 Entries: Asset, Revenue, Beban Komisi (5005), Utang Komisi (2002)
                await supabaseAdmin.from('journal_entry').insert([
                    {
                        kode_id: je1_kode,
                        transaction_id: tf.id,
                        account_id: assetAccount.id, // DEBIT Asset (Kas/QRIS/Seabank)
                        debit: nominal,
                        credit: 0,
                        description: `Penerimaan ${keterangan} via ${paymentMethod}`,
                        journal_date: new Date().toISOString().split('T')[0],
                        site: site
                    },
                    {
                        kode_id: je2_kode,
                        transaction_id: tf.id,
                        account_id: revenueAccount.id, // CREDIT Revenue (Pendapatan Lomba)
                        debit: 0,
                        credit: nominal,
                        description: `Pendapatan ${keterangan}`,
                        journal_date: new Date().toISOString().split('T')[0],
                        site: site
                    },
                    {
                        kode_id: `JE${Math.floor(100 + Math.random() * 900)}`,
                        transaction_id: tf.id,
                        account_id: bebanAccount.id, // DEBIT Beban Komisi Sales
                        debit: salesEntry.nominal,
                        credit: 0,
                        description: `Beban Komisi Sales - ${keterangan}`,
                        journal_date: new Date().toISOString().split('T')[0],
                        site: site
                    },
                    {
                        kode_id: `JE${Math.floor(100 + Math.random() * 900)}`,
                        transaction_id: tf.id,
                        account_id: utangAccount.id, // CREDIT Utang Komisi Sales
                        debit: 0,
                        credit: salesEntry.nominal,
                        description: `Utang Komisi Sales - ${keterangan}`,
                        journal_date: new Date().toISOString().split('T')[0],
                        site: site
                    }
                ]);
            } else {
                // 2 Entries standard
                await supabaseAdmin.from('journal_entry').insert([
                    {
                        kode_id: je1_kode,
                        transaction_id: tf.id,
                        account_id: assetAccount.id, // DEBIT Asset (Kas/QRIS/Seabank)
                        debit: nominal,
                        credit: 0,
                        description: `Penerimaan ${keterangan} via ${paymentMethod}`,
                        journal_date: new Date().toISOString().split('T')[0],
                        site: site
                    },
                    {
                        kode_id: je2_kode,
                        transaction_id: tf.id,
                        account_id: revenueAccount.id, // CREDIT Revenue (Pendapatan Iuran)
                        debit: 0,
                        credit: nominal,
                        description: `Pendapatan ${keterangan}`,
                        journal_date: new Date().toISOString().split('T')[0],
                        site: site
                    }
                ]);
            }
        }

        console.log(`[Auto-Finance] Transaction & Journal Entry created successfully for ${peserta.nama}`);
        return { success: true, data: tf };
    } catch (error) {
        console.error("Internal Log - Error in autoCreateTransactionFromPeserta:", error);
        return { success: false, error: error.message };
    }
};

/**
 * Automatically deletes transaction_finance & journal_entry when participant status is rolled back from Lunas.
 */
export const autoDeleteTransactionFromPeserta = async (peserta) => {
    try {
        if (!peserta) return { success: false };

        const site = peserta.site_type || 'pkkmb';
        const kodePayer = peserta.nim || peserta.email_wa || peserta.nama;

        // Find transaction finance row
        const { data: existing } = await supabaseAdmin
            .from('transaction_finance')
            .select('id')
            .eq('site', site)
            .or(`kode_payer.eq.${kodePayer},kode_payer.ilike.${kodePayer}-%`);

        if (existing && existing.length > 0) {
            const ids = existing.map(e => e.id);
            // Delete from transaction_finance (cascade deletes journal_entry)
            await supabaseAdmin
                .from('transaction_finance')
                .delete()
                .in('id', ids);

            console.log(`[Auto-Finance] Rolled back & deleted transaction for ${peserta.nama}`);
        }

        return { success: true };
    } catch (error) {
        console.error("Internal Log - Error in autoDeleteTransactionFromPeserta:", error);
        return { success: false, error: error.message };
    }
};

export const createFormTransaksiPemasukan = async (payload) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        const {
            judul, keterangan, nominal, metode_pembayaran,
            bukti_pembayaran, penanggung_jawab, site,
            akun_pembayaran_id, akun_pendapatan_id, kategori_transaksi_id
        } = payload;

        if (!judul || !nominal || !site) {
            throw new Error('Judul, nominal, dan site wajib diisi');
        }

        // 1. Create transaction_finance (Income)
        const kode_id = `TF${Math.floor(100 + Math.random() * 900)}`;
        const { data: tf, error: tfError } = await supabaseAdmin
            .from('transaction_finance')
            .insert([{
                kode_id,
                site,
                tanggal_transaksi: new Date().toISOString().split('T')[0],
                kategori_transaksi_id: kategori_transaksi_id || null,
                akun_pembayaran_id: akun_pembayaran_id || null,
                nama_payer: penanggung_jawab || 'Pemasukan Manual',
                kode_payer: `INC-${Math.floor(1000 + Math.random() * 9000)}`,
                kategori_payer: 'Pemasukan Panitia',
                metode_pembayaran: metode_pembayaran || 'Tunai',
                keterangan: `${judul}${keterangan ? ' - ' + keterangan : ''}`,
                nominal,
                bukti_pembayaran: bukti_pembayaran || null,
                created_by: user.id
            }])
            .select()
            .single();

        if (tfError) throw tfError;

        // 2. Create journal entries (Double-Entry: Debit Asset, Credit Revenue)
        if (akun_pembayaran_id && akun_pendapatan_id) {
            const je1_kode = `JE${Math.floor(100 + Math.random() * 900)}`;
            const je2_kode = `JE${Math.floor(100 + Math.random() * 900)}`;

            await supabaseAdmin.from('journal_entry').insert([
                {
                    kode_id: je1_kode,
                    transaction_id: tf.id,
                    account_id: akun_pembayaran_id, // DEBIT Asset (Kas/Bank/QRIS)
                    debit: nominal,
                    credit: 0,
                    description: `[Income] ${judul}`,
                    journal_date: new Date().toISOString().split('T')[0],
                    site: site
                },
                {
                    kode_id: je2_kode,
                    transaction_id: tf.id,
                    account_id: akun_pendapatan_id, // CREDIT Revenue
                    debit: 0,
                    credit: nominal,
                    description: `[Income] ${judul}`,
                    journal_date: new Date().toISOString().split('T')[0],
                    site: site
                }
            ]);
        }

        await insertAuditLog(user.email, 'CREATE_FORM_PEMASUKAN', tf.id, `Created income transaction ${judul}`, adminNama);
        return { success: true, data: tf };
    } catch (error) {
        console.error("Internal Log - Error creating income transaction:", error);
        return { success: false, error: error.message || 'Terjadi kesalahan internal pada server' };
    }
};

// ============================================================================
// METODE PEMBAYARAN & FORM PRICING ADMIN
// ============================================================================

export const getMasterAccountAsset = async () => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        const { data, error } = await supabaseAdmin
            .from('master_account')
            .select('id, kode_akun, nama_akun, akun_type')
            .eq('akun_type', 'Asset')
            .order('kode_akun', { ascending: true });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Internal Log - Error fetching asset master accounts:", error);
        return [];
    }
};

export const getMetodePembayaranAdmin = async (site = 'all') => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        let query = supabaseAdmin
            .from('metode_pembayaran')
            .select(`
                *,
                master_account:tipe (
                    id,
                    kode_akun,
                    nama_akun,
                    akun_type
                )
            `)
            .order('urutan', { ascending: true })
            .order('created_at', { ascending: false });

        if (site && site !== 'all') {
            query = query.eq('site', site);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Internal Log - Error fetching admin metode pembayaran:", error);
        return [];
    }
};

export const upsertMetodePembayaran = async (payload, id = null) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!payload) throw new Error('Payload is required');
        if (!payload.nama || !payload.site || !payload.tipe) {
            throw new Error('Nama, site, dan tipe akun (COA) wajib diisi');
        }

        const dataToSave = {
            site: payload.site,
            nama: payload.nama,
            tipe: payload.tipe,
            nomor_rekening: payload.nomor_rekening || null,
            nama_pemilik: payload.nama_pemilik || null,
            qris_image: payload.qris_image || null,
            keterangan: payload.keterangan || null,
            aktif: payload.aktif !== undefined ? payload.aktif : true,
            urutan: payload.urutan ? parseInt(payload.urutan, 10) : 0
        };

        if (id) {
            const { data, error } = await supabaseAdmin
                .from('metode_pembayaran')
                .update(dataToSave)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            await insertAuditLog(user.email, 'UPDATE_METODE_PEMBAYARAN', id, `Updated metode pembayaran ${payload.nama}`, adminNama);
            return { success: true, data };
        } else {
            const { data, error } = await supabaseAdmin
                .from('metode_pembayaran')
                .insert([dataToSave])
                .select()
                .single();

            if (error) throw error;
            await insertAuditLog(user.email, 'CREATE_METODE_PEMBAYARAN', data.id, `Created metode pembayaran ${payload.nama}`, adminNama);
            return { success: true, data };
        }
    } catch (error) {
        console.error("Internal Log - Error upserting metode pembayaran:", error);
        return { success: false, error: error.message || 'Terjadi kesalahan internal pada server' };
    }
};

export const deleteMetodePembayaran = async (id) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id) throw new Error('ID is required');

        const { error } = await supabaseAdmin
            .from('metode_pembayaran')
            .delete()
            .eq('id', id);

        if (error) throw error;
        await insertAuditLog(user.email, 'DELETE_METODE_PEMBAYARAN', id, `Deleted metode pembayaran`, adminNama);
        return { success: true };
    } catch (error) {
        console.error("Internal Log - Error deleting metode pembayaran:", error);
        return { success: false, error: error.message || 'Terjadi kesalahan internal pada server' };
    }
};

export const getFormRegisterPricingAdmin = async (formId) => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!formId) return [];

        const { data, error } = await supabaseAdmin
            .from('form_register_pricing')
            .select('id, form_id, kategori, nominal, maks_team')
            .eq('form_id', formId);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Internal Log - Error fetching form register pricing admin:", error);
        return [];
    }
};

export const upsertFormRegisterPricing = async (formId, pricingList) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!formId) throw new Error('form_id is required');
        if (!Array.isArray(pricingList)) throw new Error('pricingList must be an array');

        await supabaseAdmin
            .from('form_register_pricing')
            .delete()
            .eq('form_id', formId);
        let insertedData = [];
        if (pricingList.length > 0) {
            const rowsToInsert = pricingList.map(item => ({
                form_id: formId,
                kategori: item.kategori,
                nominal: parseInt(item.nominal, 10) || 0,
                maks_anggota: item.maks_anggota !== undefined && item.maks_anggota !== null ? parseInt(item.maks_anggota, 10) : 1,
                maks_team: item.maks_team !== undefined && item.maks_team !== null ? parseInt(item.maks_team, 10) : 1,
                individu: item.individu !== undefined && item.individu !== null ? !!item.individu : true,
                komisi_sales_lvl1: item.komisi_sales_lvl1 !== undefined && item.komisi_sales_lvl1 !== null ? parseInt(item.komisi_sales_lvl1, 10) : 0,
                komisi_sales_lvl2: item.komisi_sales_lvl2 !== undefined && item.komisi_sales_lvl2 !== null ? parseInt(item.komisi_sales_lvl2, 10) : 0,
                komisi_sales_lvl3: item.komisi_sales_lvl3 !== undefined && item.komisi_sales_lvl3 !== null ? parseInt(item.komisi_sales_lvl3, 10) : 0,
                umum_type: item.umum_type || null
            }));

            const { data, error: insertError } = await supabaseAdmin
                .from('form_register_pricing')
                .insert(rowsToInsert)
                .select();

            if (insertError) throw insertError;
            insertedData = data;
        }

        await insertAuditLog(user.email, 'UPSERT_FORM_REGISTER_PRICING', formId, `Updated pricing for form ${formId}`, adminNama);
        return { success: true, data: insertedData };
    } catch (error) {
        console.error("Internal Log - Error upserting form register pricing:", error);
        return { success: false, error: error.message || 'Terjadi kesalahan internal pada server' };
    }
};

export const upsertFormRegisterKampusQuota = async (pricingId, kampusQuotaList) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!pricingId) throw new Error('pricing_id is required');
        if (!Array.isArray(kampusQuotaList)) throw new Error('kampusQuotaList must be an array');

        await supabaseAdmin
            .from('form_register_kampus_quota')
            .delete()
            .eq('pricing_id', pricingId);

        if (kampusQuotaList.length > 0) {
            const rowsToInsert = kampusQuotaList.map(item => ({
                pricing_id: pricingId,
                nama_kampus: item.nama_kampus,
                maks_team: parseInt(item.maks_team, 10) || 1
            }));

            const { error: insertError } = await supabaseAdmin
                .from('form_register_kampus_quota')
                .insert(rowsToInsert);

            if (insertError) throw insertError;
        }

        await insertAuditLog(user.email, 'UPSERT_KAMPUS_QUOTA', pricingId, `Updated kampus quota for pricing ${pricingId}`, adminNama);
        return { success: true };
    } catch (error) {
        console.error("Internal Log - Error upserting form register kampus quota:", error);
        return { success: false, error: error.message || 'Terjadi kesalahan internal pada server' };
    }
};

export const getFormRegisterKampusQuota = async (pricingId) => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!pricingId) return [];

        const { data, error } = await supabaseAdmin
            .from('form_register_kampus_quota')
            .select('*')
            .eq('pricing_id', pricingId);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Internal Log - Error fetching form register kampus quota:", error);
        return [];
    }
};

export const getKuotaKampusByForm = async (formId) => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!formId) return [];

        // Fetch pricing to get pricing_ids
        const { data: pricingData, error: pricingError } = await supabaseAdmin
            .from('form_register_pricing')
            .select('id')
            .eq('form_id', formId);

        if (pricingError) throw pricingError;

        const pricingIds = (pricingData || []).map(p => p.id);
        if (pricingIds.length === 0) return [];

        // Fetch kampus quotas
        const { data, error } = await supabaseAdmin
            .from('form_register_kampus_quota')
            .select('id, pricing_id, nama_kampus, maks_team, form_register_pricing!inner(form_id, kategori)')
            .in('pricing_id', pricingIds);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Internal Log - Error fetching kuota kampus by form:", error);
        return [];
    }
};

export const getFormWajibPricingAdmin = async (formId) => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!formId) return [];

        const { data, error } = await supabaseAdmin
            .from('form_wajib_pricing')
            .select('id, form_id, kelas, nominal, jenis_tahapan')
            .eq('form_id', formId);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Internal Log - Error fetching form wajib pricing admin:", error);
        return [];
    }
};

export const upsertFormWajibPricing = async (formId, pricingList) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!formId) throw new Error('form_id is required');
        if (!Array.isArray(pricingList)) throw new Error('pricingList must be an array');

        await supabaseAdmin
            .from('form_wajib_pricing')
            .delete()
            .eq('form_id', formId);

        let insertedData = [];
        if (pricingList.length > 0) {
            const rowsToInsert = pricingList.map(item => ({
                form_id: formId,
                kelas: item.kelas,
                nominal: parseInt(item.nominal, 10) || 0,
                jenis_tahapan: item.jenis_tahapan || 'full'
            }));

            const { data, error: insertError } = await supabaseAdmin
                .from('form_wajib_pricing')
                .insert(rowsToInsert)
                .select();

            if (insertError) throw insertError;
            insertedData = data;
        }

        await insertAuditLog(user.email, 'UPSERT_FORM_WAJIB_PRICING', formId, `Updated pricing for form wajib ${formId}`, adminNama);
        return { success: true, data: insertedData };
    } catch (error) {
        console.error("Internal Log - Error upserting form wajib pricing:", error);
        return { success: false, error: error.message || 'Terjadi kesalahan internal pada server' };
    }
};

