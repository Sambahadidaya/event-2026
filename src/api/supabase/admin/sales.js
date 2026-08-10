'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { checkAdminAuth, insertAuditLog } from './audit';

/**
 * Fetch grouped sales summary with filters.
 * Returns unique identities (nama_nim) and their aggregated commissions.
 */
export const getSalesSummary = async (namaLombaFilter = 'all') => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        let query = supabaseAdmin
            .from('sales_pose')
            .select(`
                id,
                sumber,
                nama_nim,
                nominal,
                target_nim,
                created_at,
                form_register:form_register_id (
                    id,
                    nama_lomba,
                    jenis_lomba
                )
            `);

        const { data, error } = await query;
        if (error) throw error;

        // Group by identity (nama_nim) or source (if identity is empty)
        const summaryMap = {};

        data.forEach(item => {
            const namaLomba = item.form_register?.nama_lomba || '';
            if (namaLombaFilter && namaLombaFilter !== 'all' && namaLomba !== namaLombaFilter) {
                return; // Filter by competition name
            }

            // If identity is empty, group by source to prevent collision
            const key = item.nama_nim && item.nama_nim.trim() !== '' 
                ? item.nama_nim.trim().toLowerCase() 
                : `_sumber_${item.sumber}`;

            if (!summaryMap[key]) {
                summaryMap[key] = {
                    sumber: item.sumber,
                    nama_nim: item.nama_nim || '',
                    total_nominal: 0,
                    raw_key: key
                };
            }
            summaryMap[key].total_nominal += item.nominal || 0;
        });

        return Object.values(summaryMap).sort((a, b) => b.total_nominal - a.total_nominal);
    } catch (error) {
        console.error("Internal Log - Error fetching sales summary:", error);
        return [];
    }
};

/**
 * Fetch detail records for a specific salesperson identity (nama_nim) or source.
 */
export const getSalesRiwayatDetail = async (nama_nim, sumber) => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        let query = supabaseAdmin
            .from('sales_pose')
            .select(`
                id,
                sumber,
                nama_nim,
                nominal,
                target_nim,
                created_at,
                form_register:form_register_id (
                    nama_lomba
                )
            `);

        if (nama_nim && nama_nim.trim() !== '') {
            query = query.eq('nama_nim', nama_nim.trim());
        } else {
            query = query.eq('sumber', sumber).is('nama_nim', null);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Match with transaction_finance to get the payment method and correct commission info
        // We will fetch matching transaction_finance records in batch
        const salesIds = data.map(d => d.id);
        let transactionMap = {};

        if (salesIds.length > 0) {
            const { data: tfData } = await supabaseAdmin
                .from('transaction_finance')
                .select('id, nama_nim_sales_id, tanggal_transaksi, metode_pembayaran')
                .in('nama_nim_sales_id', salesIds);

            if (tfData) {
                tfData.forEach(tf => {
                    transactionMap[tf.nama_nim_sales_id] = tf;
                });
            }
        }

        // We will also fetch the categories of the target participants to match pricing correctly
        const targetNims = data.map(d => d.target_nim).filter(Boolean);
        const pesertaMap = {};
        if (targetNims.length > 0) {
            const { data: pesertas } = await supabaseAdmin
                .from('peserta')
                .select('nim, kategori')
                .in('nim', targetNims);
            if (pesertas) {
                pesertas.forEach(p => {
                    pesertaMap[p.nim] = p.kategori;
                });
            }
        }

        // We will also fetch form_register_pricing to find the commission percentage
        // (komisi_sales_lvl1/2/3) depending on which level this transaction was
        const { data: pricingData } = await supabaseAdmin
            .from('form_register_pricing')
            .select('form_id, kategori, nominal, komisi_sales_lvl1, komisi_sales_lvl2, komisi_sales_lvl3');

        const pricingMap = {};
        if (pricingData) {
            pricingData.forEach(p => {
                const key = `${p.form_id}_${p.kategori}`;
                pricingMap[key] = p;
            });
        }

        // Sort data chronologically to align index with existingCount sequence
        const sortedData = [...data].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        // To calculate percentage and map detail columns:
        // no, sumber, nama/nim, nim target sales, nominal, persen komisi, nama lomba, tanggal transaksi
        const details = sortedData.map((item, index) => {
            const tf = transactionMap[item.id];
            const itemKategori = pesertaMap[item.target_nim] || 'Umum';
            const pricingKey = `${item.form_register_id}_${itemKategori}`;
            const pricing = pricingMap[pricingKey];

            // Reconstruct percentage by comparing with existingCount at that time
            // Since we know the index, index + 1 is the sequence
            let persenKomisi = 0;
            if (pricing) {
                if (index < 3) {
                    persenKomisi = pricing.komisi_sales_lvl1 || 0;
                } else if (index < 6) {
                    persenKomisi = pricing.komisi_sales_lvl2 || 0;
                } else {
                    persenKomisi = pricing.komisi_sales_lvl3 || 0;
                }

                // Fallback using the ratio if nominal matches
                if (pricing.nominal && item.nominal) {
                    const calculatedPersen = Math.round((item.nominal / pricing.nominal) * 100);
                    if (calculatedPersen > 0) {
                        persenKomisi = calculatedPersen;
                    }
                }
            }

            return {
                id: item.id,
                sumber: item.sumber,
                nama_nim: item.nama_nim || '',
                target_nim: item.target_nim || '',
                nominal: item.nominal || 0,
                persen_komisi: persenKomisi,
                nama_lomba: item.form_register?.nama_lomba || 'Lomba',
                tanggal_transaksi: tf?.tanggal_transaksi || item.created_at.split('T')[0]
            };
        });

        return details;
    } catch (error) {
        console.error("Internal Log - Error fetching sales detail:", error);
        return [];
    }
};

/**
 * Fetch ALL detail records for export (PDF/Excel).
 * Optionally filtered by namaLomba.
 */
export const getSalesAllDetail = async (namaLombaFilter = 'all') => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        const { data, error } = await supabaseAdmin
            .from('sales_pose')
            .select(`
                id,
                sumber,
                nama_nim,
                nominal,
                target_nim,
                created_at,
                form_register:form_register_id (
                    id,
                    nama_lomba,
                    jenis_lomba
                )
            `)
            .order('created_at', { ascending: true });

        if (error) throw error;

        // Filter by lomba if needed
        const filtered = namaLombaFilter && namaLombaFilter !== 'all'
            ? data.filter(d => (d.form_register?.nama_lomba || '') === namaLombaFilter)
            : data;

        // Fetch pricing for commission percentage calculation
        const { data: pricingData } = await supabaseAdmin
            .from('form_register_pricing')
            .select('form_id, kategori, nominal, komisi_sales_lvl1, komisi_sales_lvl2, komisi_sales_lvl3');

        const pricingMap = {};
        if (pricingData) {
            pricingData.forEach(p => {
                pricingMap[`${p.form_id}_${p.kategori}`] = p;
            });
        }

        // Fetch peserta for kategori mapping
        const targetNims = filtered.map(d => d.target_nim).filter(Boolean);
        const pesertaMap = {};
        if (targetNims.length > 0) {
            const { data: pesertas } = await supabaseAdmin
                .from('peserta')
                .select('nim, kategori')
                .in('nim', targetNims);
            if (pesertas) {
                pesertas.forEach(p => { pesertaMap[p.nim] = p.kategori; });
            }
        }

        // Build index per nama_nim for commission level tracking
        const nimCountMap = {};
        const details = filtered.map((item) => {
            const nimKey = item.nama_nim ? item.nama_nim.trim().toLowerCase() : null;
            if (nimKey) {
                nimCountMap[nimKey] = (nimCountMap[nimKey] || 0);
            }

            const itemKategori = pesertaMap[item.target_nim] || 'Umum';
            const pricingKey = `${item.form_register?.id}_${itemKategori}`;
            const pricing = pricingMap[pricingKey];

            let persenKomisi = 0;
            if (pricing && nimKey) {
                const idx = nimCountMap[nimKey];
                if (idx < 3) persenKomisi = pricing.komisi_sales_lvl1 || 0;
                else if (idx < 6) persenKomisi = pricing.komisi_sales_lvl2 || 0;
                else persenKomisi = pricing.komisi_sales_lvl3 || 0;

                // Fallback from ratio
                if (pricing.nominal && item.nominal) {
                    const calc = Math.round((item.nominal / pricing.nominal) * 100);
                    if (calc > 0) persenKomisi = calc;
                }
            }

            if (nimKey) nimCountMap[nimKey]++;

            return {
                id: item.id,
                sumber: item.sumber || '',
                nama_nim: item.nama_nim || '',
                target_nim: item.target_nim || '',
                nominal: item.nominal || 0,
                persen_komisi: persenKomisi,
                nama_lomba: item.form_register?.nama_lomba || 'Lomba',
                tanggal_transaksi: item.created_at ? item.created_at.split('T')[0] : '-'
            };
        });

        return details;
    } catch (error) {
        console.error("Internal Log - Error fetching all sales detail:", error);
        return [];
    }
};



/**
 * Delete a specific sales pose entry.
 */
export const deleteSalesEntry = async (id) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id) throw new Error('ID is required');

        const { error } = await supabaseAdmin
            .from('sales_pose')
            .delete()
            .eq('id', id);

        if (error) throw error;
        await insertAuditLog(user.email, 'DELETE_SALES_POSE', id, `Deleted sales referral entry`, adminNama);
        return { success: true };
    } catch (error) {
        console.error("Internal Log - Error deleting sales entry:", error);
        return { success: false, error: error.message || 'Terjadi kesalahan internal pada server' };
    }
};

/**
 * Fetch aggregated data for dashboard charts.
 */
export const getSalesGrafik = async () => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        const { data, error } = await supabaseAdmin
            .from('sales_pose')
            .select(`
                id,
                sumber,
                nominal,
                created_at,
                form_register:form_register_id (
                    nama_lomba
                )
            `);

        if (error) throw error;

        // 1. Chart Lomba (Commissions per Lomba)
        const lombaMap = {};
        // 2. Chart Sumber (Distribution of Sumber)
        const sumberMap = {};
        // 3. Chart Bulanan (Trend of sales per month)
        const bulananMap = {};

        data.forEach(item => {
            const name = item.form_register?.nama_lomba || 'Lainnya';
            lombaMap[name] = (lombaMap[name] || 0) + (item.nominal || 0);

            const src = item.sumber || 'Lainnya';
            sumberMap[src] = (sumberMap[src] || 0) + 1;

            if (item.created_at) {
                const date = new Date(item.created_at);
                const monthName = date.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
                bulananMap[monthName] = (bulananMap[monthName] || 0) + 1;
            }
        });

        return {
            lombaData: Object.entries(lombaMap).map(([label, value]) => ({ label, value })),
            sumberData: Object.entries(sumberMap).map(([label, value]) => ({ label, value })),
            bulananData: Object.entries(bulananMap).map(([label, value]) => ({ label, value }))
        };
    } catch (error) {
        console.error("Internal Log - Error generating sales chart data:", error);
        return { lombaData: [], sumberData: [], bulananData: [] };
    }
};
