'use server';

import { createDocument } from '@/api/supabase/admin/pdf';
import { checkAdminAuth } from '@/api/supabase/admin/audit';
import { generateReportPDF, generateLedgerPDF, generateFinancialReportPDF, generateVerifikasiPDF } from '@/lib/pdf/report';
import { generateInvoicePDF } from '@/lib/pdf/invoice';
import { generateCertificatePDF } from '@/lib/pdf/certificate';
import { generateTeamReportPDF } from '@/lib/pdf/teamReport';
import { generatePenilaianPDF } from '@/lib/pdf/penilaian';
import { generateAbsensiPDF } from '@/lib/pdf/absensi';
import { generateSalesPDF } from '@/lib/pdf/sales';
import { generateMedisPDF, generateMedisPanitiaPDF } from '@/lib/pdf/medis';
import { generateKabimPDF } from '@/lib/pdf/kabim';

/**
 * Server action to generate PDF securely for logged in admin users
 * Returns Base64 string of the generated PDF
 * @param {Object} payload
 * @returns {Promise<{success: boolean, base64Pdf?: string, error?: string}>}
 */
export async function generatePdfAction(payload = {}) {
    try {
        // Security Check: Ensure admin is authenticated
        const { error: authError } = await checkAdminAuth();
        if (authError) {
            throw new Error(`Akses tidak diizinkan: ${authError}`);
        }

        const {
            type = 'report',
            title = 'Laporan Keuangan',
            site = 'pose',
            columns = [],
            data = [],
            transaction = null,
            peserta = null,
            tabType = 'laba_rugi',
            metrics = {},
            lombaName = 'Semua Lomba',
            juriName = 'Semua Juri',
            criteria = [],
            activeTab = 'pendaftar',
            pengumpulanData = [],
            namaLombaFilter = 'all',
            summaryData = [],
            detailData = [],
            printedBy = 'Admin',
            sessionName = '',
            summaryCards = [],
            landscape = null
        } = payload;

        let pdfBuffer = null;

        if (type === 'invoice' || type === 'receipt') {
            const docCodePrefix = type === 'invoice' ? 'INV' : 'KWT';
            const docRes = await createDocument({
                site,
                document_type: type,
                reference_id: transaction?.id || null,
                reference_table: 'transaction_finance'
            });

            const docData = docRes.data || {};
            pdfBuffer = await generateInvoicePDF({
                transaction: transaction || {},
                site,
                documentId: docData.id || '',
                documentCode: docData.document_code || `${docCodePrefix}-2026-000000`,
                printedBy: docData.printed_by || 'Panitia Keuangan',
                documentType: type
            });
        } else if (type === 'certificate') {
            const docRes = await createDocument({
                site,
                document_type: 'certificate',
                reference_id: peserta?.id || null,
                reference_table: 'peserta'
            });

            const docData = docRes.data || {};
            pdfBuffer = await generateCertificatePDF({
                peserta: peserta || {},
                site,
                documentId: docData.id || '',
                documentCode: docData.document_code || 'CERT-2026-000000'
            });
        } else if (type === 'ledger') {
            const docRes = await createDocument({
                site,
                document_type: 'report',
                reference_id: null,
                reference_table: null
            });

            const docData = docRes.data || {};
            pdfBuffer = await generateLedgerPDF({
                title,
                site,
                data,
                documentId: docData.id || '',
                documentCode: docData.document_code || 'BKB-2026-000000',
                printedBy: docData.printed_by || 'Panitia Keuangan'
            });
        } else if (type === 'financial_report') {
            const docRes = await createDocument({
                site,
                document_type: 'report',
                reference_id: null,
                reference_table: null
            });

            const docData = docRes.data || {};
            pdfBuffer = await generateFinancialReportPDF({
                title,
                site,
                tabType,
                metrics,
                data,
                documentId: docData.id || '',
                documentCode: docData.document_code || 'RPT-2026-000000',
                printedBy: docData.printed_by || 'Panitia Keuangan'
            });
        } else if (type === 'verifikasi_report') {
            const docRes = await createDocument({
                site,
                document_type: 'report',
                reference_id: null,
                reference_table: null
            });

            const docData = docRes.data || {};
            pdfBuffer = await generateVerifikasiPDF({
                title,
                site,
                columns,
                dataSets: data, // in this case data is an array of dataSets
                documentId: docData.id || '',
                documentCode: docData.document_code || 'RPT-2026-000000',
                printedBy: docData.printed_by || 'Panitia Keuangan'
            });
        } else if (type === 'team_report') {
            const docRes = await createDocument({
                site,
                document_type: 'report',
                reference_id: null,
                reference_table: null
            });

            const docData = docRes.data || {};
            pdfBuffer = await generateTeamReportPDF({
                title,
                site,
                lombaName,
                activeTab,
                data,
                pengumpulanData,
                documentId: docData.id || '',
                documentCode: docData.document_code || 'RPT-2026-000000',
                printedBy: docData.printed_by || 'PJ Lomba'
            });
        } else if (type === 'penilaian_report') {
            const docRes = await createDocument({
                site,
                document_type: 'report',
                reference_id: null,
                reference_table: null
            });

            const docData = docRes.data || {};
            pdfBuffer = await generatePenilaianPDF({
                title,
                site,
                lombaName,
                juriName,
                criteria,
                nilaiData: data,
                documentId: docData.id || '',
                documentCode: docData.document_code || 'RPT-2026-000000',
                printedBy: docData.printed_by || 'PJ Lomba'
            });
        } else if (type === 'absensi_report') {
            const docRes = await createDocument({
                site,
                document_type: 'report',
                reference_id: null,
                reference_table: null
            });

            const docData = docRes.data || {};
            pdfBuffer = await generateAbsensiPDF({
                title,
                site,
                columns,
                data,
                includeSummary: payload.includeSummary || false,
                documentId: docData.id || '',
                documentCode: docData.document_code || 'RPT-2026-000000',
                printedBy: docData.printed_by || 'Sekretaris Panitia'
            });
        } else if (type === 'sales_report') {
            pdfBuffer = await generateSalesPDF({
                site,
                summaryData,
                detailData,
                printedBy,
                namaLombaFilter
            });
        } else if (type === 'medis') {
            pdfBuffer = await generateMedisPDF({
                data,
                title,
                printedBy
            });
        } else if (type === 'medis_panitia') {
            pdfBuffer = await generateMedisPanitiaPDF({
                data,
                title,
                printedBy
            });
        } else if (
            type === 'kabim_report' ||
            type === 'absensi_peserta_report' ||
            type === 'kabim_nilai_report' ||
            type === 'kabim_pelanggaran_report' ||
            type === 'kabim_kreativitas_report' ||
            type === 'kabim_tugas_report' ||
            type === 'kabim_kelompok_report'
        ) {
            const kabimPrintedBy = printedBy !== 'Admin' ? printedBy : 'PJ Kabim';
            const docRes = await createDocument({
                site: site || 'pkkmb',
                document_type: 'kabim_report',
                reference_id: null,
                reference_table: null,
                printed_by: kabimPrintedBy
            });

            const docData = docRes.data || {};
            pdfBuffer = await generateKabimPDF({
                title,
                site: site || 'pkkmb',
                columns,
                data,
                sessionName,
                summaryCards,
                landscape,
                documentId: docData.id || '',
                documentCode: docData.document_code || 'KBM-2026-000000',
                printedBy: docData.printed_by || kabimPrintedBy
            });
        } else {
            // Default report PDF
            const docRes = await createDocument({
                site,
                document_type: 'report',
                reference_id: null,
                reference_table: null
            });

            const docData = docRes.data || {};
            pdfBuffer = await generateReportPDF({
                title,
                site,
                columns,
                data,
                documentId: docData.id || '',
                documentCode: docData.document_code || 'RPT-2026-000000',
                printedBy: docData.printed_by || 'Panitia Keuangan'
            });
        }

        // Return base64 string for clean client download
        const base64Pdf = Buffer.from(pdfBuffer).toString('base64');
        return { success: true, base64Pdf };
    } catch (err) {
        console.error('Error in generatePdfAction server action:', err);
        return { success: false, error: err.message || 'Gagal memproses dokumen PDF' };
    }
}
