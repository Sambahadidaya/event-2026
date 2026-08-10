'use server';

import { checkAdminAuth } from '@/api/supabase/admin/audit';
import * as XLSX from 'xlsx';

/**
 * Server action untuk generate Excel laporan sales.
 * Menghasilkan 2 sheet: Ringkasan dan Detail Transaksi.
 * @param {Object} payload
 * @param {Array} payload.summaryData - Data ringkasan per identitas
 * @param {Array} payload.detailData - Data detail setiap transaksi
 * @returns {Promise<{success: boolean, base64Excel?: string, error?: string}>}
 */
export async function generateSalesExcelAction(payload = {}) {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(`Akses tidak diizinkan: ${authError}`);

        const { summaryData = [], detailData = [] } = payload;

        const wb = XLSX.utils.book_new();

        // === Sheet 1: Ringkasan Per Identitas Sales ===
        const summaryRows = summaryData.map((row, idx) => ({
            'No': idx + 1,
            'Sumber': row.sumber || '-',
            'Nama / NIM': row.nama_nim || '-',
            'Total Nominal Komisi (Rp)': row.total_nominal || 0,
        }));

        summaryRows.push({
            'No': '',
            'Sumber': '',
            'Nama / NIM': 'TOTAL',
            'Total Nominal Komisi (Rp)': summaryData.reduce((s, r) => s + (r.total_nominal || 0), 0),
        });

        const ws1 = XLSX.utils.json_to_sheet(summaryRows);
        ws1['!cols'] = [{ wch: 5 }, { wch: 30 }, { wch: 30 }, { wch: 25 }];
        XLSX.utils.book_append_sheet(wb, ws1, 'Ringkasan Sales');

        // === Sheet 2: Detail Setiap Transaksi ===
        const detailRows = detailData.map((det, idx) => ({
            'No': idx + 1,
            'Sumber': det.sumber || '-',
            'Nama / NIM': det.nama_nim || '-',
            'NIM Target': det.target_nim || '-',
            'Nominal (Rp)': det.nominal || 0,
            '% Komisi': det.persen_komisi || 0,
            'Nama Lomba': det.nama_lomba || '-',
            'Tanggal Transaksi': det.tanggal_transaksi || '-',
        }));

        const ws2 = XLSX.utils.json_to_sheet(detailRows);
        ws2['!cols'] = [
            { wch: 5 }, { wch: 28 }, { wch: 28 }, { wch: 22 },
            { wch: 20 }, { wch: 12 }, { wch: 25 }, { wch: 20 }
        ];
        XLSX.utils.book_append_sheet(wb, ws2, 'Detail Transaksi');

        const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        const base64Excel = Buffer.from(excelBuffer).toString('base64');

        return { success: true, base64Excel };
    } catch (err) {
        console.error('Error in generateSalesExcelAction:', err);
        return { success: false, error: err.message || 'Gagal generate Excel' };
    }
}
