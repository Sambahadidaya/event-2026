import { getBrowser } from '@/lib/pdf/browser';
import path from 'path';
import fs from 'fs';
import { generateQRCodeBase64, generateVerifyUrl } from '@/lib/qr/qrcode';
import { PDF_STYLES } from './template';
import { formatWibDateTime } from '@/lib/dashboardUtils';

function getLogoBase64(site = 'pose') {
    try {
        const logoFileName = site === 'pkkmb' ? 'logo_pkkmb/icon-logo.png' : 'logo_pose/icon-logo2.png';
        const logoPath = path.join(process.cwd(), 'src', 'assets', logoFileName);
        if (fs.existsSync(logoPath)) {
            const buffer = fs.readFileSync(logoPath);
            return `data:image/png;base64,${buffer.toString('base64')}`;
        }
    } catch (e) {
        console.error('Error loading logo base64:', e);
    }
    return '';
}

const roleMappings = {
    'ketua_pelaksana_pkkmb': 'Nindya Dwi Lestari',
    'ketua_pelaksana_pose': 'Nadia Nita',
};

/**
 * Generate PDF Buffer for a tabular financial report using Puppeteer
 * @param {Object} params
 * @param {string} params.title - Report title
 * @param {string} params.site - Site code ('pose' | 'pkkmb' | 'all')
 * @param {Array<{key: string, label: string, align?: string, format?: string}>} params.columns
 * @param {Array<Object>} params.data - Table rows
 * @param {string} params.documentId - Document UUID from DB
 * @param {string} params.documentCode - Document code (e.g., RPT-2026-000001)
 * @param {string} params.printedBy - Name of the admin printing
 * @returns {Promise<Buffer>} PDF Buffer
 */
export async function generateReportPDF({
    title = 'Laporan Keuangan',
    site = 'pose',
    columns = [],
    data = [],
    documentId = '',
    documentCode = '',
    printedBy = 'Panitia Keuangan'
}) {
    let browser = null;
    try {
        const verifyUrl = generateVerifyUrl(site, documentId);
        const qrBase64 = documentId ? await generateQRCodeBase64(verifyUrl, site) : '';
        const logoBase64 = getLogoBase64(site);

        const isNeracaLajur = title.toLowerCase().includes('neraca lajur') || columns.some(c => c.key === 'ns_debit');
        const hasCustomSummary = data.some(item => item.isSummaryRow);

        let dataRowCounter = 0;
        const rowsHtml = data.map((item) => {
            if (item.isSummaryRow) {
                const label = item.nama_akun || item.title || 'TOTAL';
                // Columns before numeric columns: No, Kode Akun, Nama Akun, Tipe (4 columns)
                const firstNumericIdx = columns.findIndex(c => c.format === 'currency' || ['nominal', 'debit', 'credit', 'totalDebit', 'totalCredit', 'ns_debit', 'ns_credit', 'lr_debit', 'lr_credit', 'sheet_debit', 'sheet_credit'].includes(c.key));
                const colSpan = firstNumericIdx > 0 ? firstNumericIdx + 1 : 4;

                const numericCellsHtml = columns.slice(firstNumericIdx > 0 ? firstNumericIdx : 3).map(col => {
                    let val = item[col.key];
                    let displayVal = '-';
                    if (typeof val === 'number' && val !== 0) {
                        displayVal = col.format === 'currency' ? `Rp ${val.toLocaleString('id-ID')}` : val;
                    } else if (val && val !== 0 && val !== '-') {
                        displayVal = val;
                    }
                    const alignClass = col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : '';
                    return `<td class="${alignClass} font-bold">${displayVal}</td>`;
                }).join('');

                const bgStyle = item.summaryType === 'final'
                    ? 'background: #e2e8f0; font-weight: bold; border-top: 2px solid #64748b; border-bottom: 2px solid #64748b;'
                    : item.summaryType === 'adjustment'
                    ? 'background: #eff6ff; font-weight: bold; color: #1e40af;'
                    : 'background: #f8fafc; font-weight: bold; border-top: 2px solid #cbd5e1;';

                return `<tr style="${bgStyle}">
                    <td colSpan="${colSpan}" class="text-right font-bold uppercase" style="padding-right: 12px;">${label}:</td>
                    ${numericCellsHtml}
                </tr>`;
            }

            dataRowCounter++;
            const cellsHtml = columns.map(col => {
                let val = item[col.key];
                if (col.format === 'currency') {
                    val = typeof val === 'number' && val > 0 ? `Rp ${val.toLocaleString('id-ID')}` : (val && val !== 0 && val !== '-' ? val : '-');
                } else if (col.format === 'date') {
                    val = val ? new Date(val).toLocaleDateString('id-ID') : '-';
                }
                const alignClass = col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : '';
                return `<td class="${alignClass}">${val !== undefined && val !== null ? val : '-'}</td>`;
            }).join('');

            return `<tr><td class="text-center">${dataRowCounter}</td>${cellsHtml}</tr>`;
        }).join('');

        let tableHeaderHtml = '';
        if (isNeracaLajur) {
            tableHeaderHtml = `
                <thead>
                    <tr>
                        <th rowspan="2" class="text-center" style="width: 30px;">NO</th>
                        <th rowspan="2">KODE AKUN</th>
                        <th rowspan="2">NAMA AKUN</th>
                        <th rowspan="2">TIPE</th>
                        <th colspan="2" class="text-center" style="background: #eff6ff; border-bottom: 1px solid #cbd5e1;">NERACA SALDO</th>
                        <th colspan="2" class="text-center" style="background: #fffbe6; border-bottom: 1px solid #cbd5e1;">LABA RUGI</th>
                        <th colspan="2" class="text-center" style="background: #f3e8ff; border-bottom: 1px solid #cbd5e1;">NERACA SHEET</th>
                    </tr>
                    <tr>
                        <th class="text-right" style="background: #eff6ff; font-size: 10px;">DEBIT</th>
                        <th class="text-right" style="background: #eff6ff; font-size: 10px;">KREDIT</th>
                        <th class="text-right" style="background: #fffbe6; font-size: 10px;">DEBIT</th>
                        <th class="text-right" style="background: #fffbe6; font-size: 10px;">KREDIT</th>
                        <th class="text-right" style="background: #f3e8ff; font-size: 10px;">DEBIT</th>
                        <th class="text-right" style="background: #f3e8ff; font-size: 10px;">KREDIT</th>
                    </tr>
                </thead>
            `;
        } else {
            const headersHtml = columns.map(col => {
                const alignClass = col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : '';
                return `<th class="${alignClass}">${col.label}</th>`;
            }).join('');
            tableHeaderHtml = `
                <thead>
                    <tr>
                        <th class="text-center" style="width: 35px;">No</th>
                        ${headersHtml}
                    </tr>
                </thead>
            `;
        }

        let footerHtml = '';
        if (columns && columns.length > 0 && !hasCustomSummary) {
            const hasNumeric = columns.some(col => ['nominal', 'debit', 'credit', 'totalDebit', 'totalCredit'].includes(col.key));
            if (hasNumeric) {
                const footerCells = columns.map(col => {
                    if (['nominal', 'debit', 'credit', 'totalDebit', 'totalCredit'].includes(col.key)) {
                        const totalVal = data.reduce((sum, item) => sum + Number(item[col.key] || 0), 0);
                        const isCredit = ['credit', 'totalCredit'].includes(col.key);
                        const colorClass = isCredit ? 'text-rose-600' : 'text-emerald-600';
                        return `<td class="text-right font-bold ${colorClass}">Rp ${totalVal.toLocaleString('id-ID')}</td>`;
                    }
                    return `<td></td>`;
                }).join('');
                footerHtml = `
                    <tfoot>
                        <tr style="background: #f8fafc; font-weight: bold; border-top: 2px solid #e2e8f0;">
                            <td class="text-center font-bold">TOTAL</td>
                            ${footerCells}
                        </tr>
                    </tfoot>
                `;
            }
        }

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8" />
                <title>${title}</title>
                <style>${PDF_STYLES}</style>
            </head>
            <body>
                <div class="header-container">
                    <div style="display: flex; align-items: center; gap: 14px;">
                        ${logoBase64 ? `<img src="${logoBase64}" style="width: 55px; height: 55px; object-fit: contain; flex-shrink: 0;" alt="Logo" />` : ''}
                        <div>
                            <h1 class="brand-title">PORTAL KAMPUS 2026</h1>
                            <h2 class="brand-subtitle">EVENT ${site.toUpperCase()}</h2>
                            <div class="doc-info">Dokumen Resmi Laporan Keuangan</div>
                        </div>
                    </div>
                    ${qrBase64 ? `
                    <div class="qr-container">
                        <img src="${qrBase64}" class="qr-img" alt="QR Scan" />
                        <div class="qr-caption">Scan Verifikasi</div>
                        <div style="font-size: 8px; font-weight: bold; color: #0284c7;">${documentCode}</div>
                    </div>
                    ` : ''}
                </div>

                <h3 class="report-title">${title}</h3>

                <div class="meta-bar">
                    <div><strong>Dicetak Oleh:</strong> ${printedBy}</div>
                    <div><strong>Tanggal Cetak:</strong> ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                    <div><strong>Total Record:</strong> ${dataRowCounter} Akun / Transaksi</div>
                </div>

                <table class="table-pdf">
                    ${tableHeaderHtml}
                    <tbody>
                        ${rowsHtml.length > 0 ? rowsHtml : '<tr><td colSpan="100" class="text-center" style="padding: 20px; color: #94a3b8;">Tidak ada data.</td></tr>'}
                    </tbody>
                    ${footerHtml}
                </table>

                <div class="footer-stamp">
                    <div class="stamp-box">
                        <div>Mengetahui,</div>
                        <div style="font-weight: 700;">Ketua Pelaksana</div>
                        <div class="stamp-space"></div>
                        <div style="border-top: 1px solid #94a3b8; font-weight: 700;">${site === 'pkkmb' ? roleMappings.ketua_pelaksana_pkkmb : roleMappings.ketua_pelaksana_pose}</div>
                    </div>
                    <div class="stamp-box">
                        <div>Penanggung Jawab,</div>
                        <div style="font-weight: 700;">Bendahara Panitia</div>
                        <div class="stamp-space"></div>
                        <div style="border-top: 1px solid #94a3b8; font-weight: 700;">${printedBy}</div>
                    </div>
                </div>
            </body>
            </html>
        `;

        browser = await getBrowser();

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            landscape: isNeracaLajur || columns.length > 6,
            printBackground: true,
            margin: { top: '12mm', right: '12mm', bottom: '15mm', left: '12mm' }
        });

        await browser.close();
        return pdfBuffer;
    } catch (err) {
        if (browser) await browser.close();
        console.error('Error generating report PDF with Puppeteer:', err);
        throw err;
    }
}

/**
 * Generate PDF Buffer for General Ledger (Buku Besar) per Account using Puppeteer
 * @param {Object} params
 * @param {string} params.title - Report title
 * @param {string} params.site - Site code ('pose' | 'pkkmb' | 'all')
 * @param {Array<Object>} params.data - List of ledger accounts with entries
 * @param {string} params.documentId - Document UUID from DB
 * @param {string} params.documentCode - Document code
 * @param {string} params.printedBy - Name of the admin printing
 * @returns {Promise<Buffer>} PDF Buffer
 */
export async function generateLedgerPDF({
    title = 'Laporan Buku Besar',
    site = 'pose',
    data = [],
    documentId = '',
    documentCode = '',
    printedBy = 'Panitia Keuangan'
}) {
    let browser = null;
    try {
        const verifyUrl = generateVerifyUrl(site, documentId);
        const qrBase64 = documentId ? await generateQRCodeBase64(verifyUrl, site) : '';
        const logoBase64 = getLogoBase64(site);

        const tablesHtml = data.map((ledgerItem, idx) => {
            const acc = ledgerItem.account || {};
            const entries = ledgerItem.entries || [];

            const rowsHtml = entries.map((e, eIdx) => {
                const dateStr = e.journal_date ? new Date(e.journal_date).toLocaleDateString('id-ID') : '-';
                const debitStr = Number(e.debit || 0) > 0 ? `Rp ${Number(e.debit).toLocaleString('id-ID')}` : '-';
                const creditStr = Number(e.credit || 0) > 0 ? `Rp ${Number(e.credit).toLocaleString('id-ID')}` : '-';
                const balanceStr = `Rp ${Number(e.runningBalance || 0).toLocaleString('id-ID')}`;

                return `
                    <tr>
                        <td class="text-center">${eIdx + 1}</td>
                        <td class="font-mono text-center">${e.kode_id || '-'}</td>
                        <td class="text-center">${dateStr}</td>
                        <td>${e.description || '-'}</td>
                        <td class="text-right font-bold text-emerald-600">${debitStr}</td>
                        <td class="text-right font-bold text-rose-600">${creditStr}</td>
                        <td class="text-right font-bold">${balanceStr}</td>
                    </tr>
                `;
            }).join('');

            return `
                <div style="margin-bottom: 24px; page-break-inside: avoid;">
                    <div style="background: #f1f5f9; padding: 8px 12px; border-radius: 6px; border-left: 4px solid ${site === 'pkkmb' ? '#059669' : '#2563eb'}; margin-bottom: 8px;">
                        <h4 style="margin: 0; font-size: 13px; font-weight: 800; color: #0f172a;">
                            AKUN: ${acc.kode_akun || '-'} - ${acc.nama_akun || 'Akun'} (${acc.akun_type || 'Asset'})
                        </h4>
                    </div>
                    <table class="table-pdf">
                        <thead>
                            <tr>
                                <th class="text-center" style="width: 30px;">No</th>
                                <th class="text-center" style="width: 90px;">Kode Jurnal</th>
                                <th class="text-center" style="width: 80px;">Tanggal</th>
                                <th>Deskripsi Transaksi</th>
                                <th class="text-right" style="width: 90px;">Debit</th>
                                <th class="text-right" style="width: 90px;">Kredit</th>
                                <th class="text-right" style="width: 100px;">Saldo Akhir</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml.length > 0 ? rowsHtml : '<tr><td colSpan="7" class="text-center" style="padding: 10px; color: #94a3b8;">Belum ada mutasi jurnal.</td></tr>'}
                        </tbody>
                        <tfoot>
                            <tr style="background: #f8fafc; font-weight: bold;">
                                <td colSpan="4" class="text-right">TOTAL MUTASI AKUN:</td>
                                <td class="text-right font-bold text-emerald-600">Rp ${Number(ledgerItem.totalDebit || 0).toLocaleString('id-ID')}</td>
                                <td class="text-right font-bold text-rose-600">Rp ${Number(ledgerItem.totalCredit || 0).toLocaleString('id-ID')}</td>
                                <td class="text-right font-bold" style="color: #0284c7;">Rp ${Number(ledgerItem.finalBalance || 0).toLocaleString('id-ID')}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            `;
        }).join('');

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8" />
                <title>${title}</title>
                <style>${PDF_STYLES}</style>
            </head>
            <body>
                <div class="header-container">
                    <div style="display: flex; align-items: center; gap: 14px;">
                        ${logoBase64 ? `<img src="${logoBase64}" style="width: 55px; height: 55px; object-fit: contain; flex-shrink: 0;" alt="Logo" />` : ''}
                        <div>
                            <h1 class="brand-title">PORTAL KAMPUS 2026</h1>
                            <h2 class="brand-subtitle">LAPORAN BUKU BESAR (${site.toUpperCase()})</h2>
                            <div class="doc-info">Rincian Saldo dan Mutasi Transaksi per Akun</div>
                        </div>
                    </div>
                    ${qrBase64 ? `
                    <div class="qr-container">
                        <img src="${qrBase64}" class="qr-img" alt="QR Scan" />
                        <div class="qr-caption">Scan Verifikasi</div>
                        <div style="font-size: 8px; font-weight: bold; color: #0284c7;">${documentCode}</div>
                    </div>
                    ` : ''}
                </div>

                <div class="meta-bar">
                    <div><strong>Dicetak Oleh:</strong> ${printedBy}</div>
                    <div><strong>Tanggal Cetak:</strong> ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                    <div><strong>Total Akun Ditampilkan:</strong> ${data.length} Akun</div>
                </div>

                ${tablesHtml.length > 0 ? tablesHtml : '<div style="text-align: center; padding: 40px; color: #94a3b8;">Tidak ada data akun untuk ditampilkan.</div>'}

                <div class="footer-stamp">
                    <div class="stamp-box">
                        <div>Mengetahui,</div>
                        <div style="font-weight: 700;">Ketua Pelaksana</div>
                        <div class="stamp-space"></div>
                        <div style="border-top: 1px solid #94a3b8; font-weight: 700;">${site === 'pkkmb' ? roleMappings.ketua_pelaksana_pkkmb : roleMappings.ketua_pelaksana_pose}</div>
                    </div>
                    <div class="stamp-box">
                        <div>Penanggung Jawab,</div>
                        <div style="font-weight: 700;">Bendahara Panitia</div>
                        <div class="stamp-space"></div>
                        <div style="border-top: 1px solid #94a3b8; font-weight: 700;">${printedBy}</div>
                    </div>
                </div>
            </body>
            </html>
        `;

        browser = await getBrowser();

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '15mm', right: '15mm', bottom: '20mm', left: '15mm' }
        });

        await browser.close();
        return pdfBuffer;
    } catch (err) {
        if (browser) await browser.close();
        console.error('Error generating ledger PDF with Puppeteer:', err);
        throw err;
    }
}

export async function generateFinancialReportPDF({
    title = 'Laporan Keuangan Resmi',
    site = 'pose',
    tabType = 'laba_rugi',
    metrics = {},
    data = [],
    documentId = '',
    documentCode = '',
    printedBy = 'Panitia Keuangan'
}) {
    let browser = null;
    try {
        const verifyUrl = generateVerifyUrl(site, documentId);
        const qrBase64 = documentId ? await generateQRCodeBase64(verifyUrl, site) : '';
        const logoBase64 = getLogoBase64(site);

        const totalIncome = metrics.totalIncome || 0;
        const totalExpense = metrics.totalExpense || 0;
        const netIncome = metrics.netIncome || 0;

        let contentHtml = '';

        if (tabType === 'laba_rugi') {
            contentHtml = `
                <div style="margin-bottom: 20px;">
                    <h3 style="font-size: 14px; font-weight: 800; border-bottom: 2px solid #0284c7; padding-bottom: 6px; margin-bottom: 12px;">1. PENDAPATAN (INCOME)</h3>
                    <table class="table-pdf">
                        <thead>
                            <tr><th>Kategori Pendapatan</th><th class="text-right">Nominal</th></tr>
                        </thead>
                        <tbody>
                            ${Object.entries(metrics.incomeCategories || {}).map(([cat, val]) => `
                                <tr><td>${cat}</td><td class="text-right font-bold text-emerald-600">Rp ${Number(val).toLocaleString('id-ID')}</td></tr>
                            `).join('') || '<tr><td>Total Pendapatan Peserta & Operasional</td><td class="text-right font-bold text-emerald-600">Rp ' + totalIncome.toLocaleString('id-ID') + '</td></tr>'}
                        </tbody>
                        <tfoot>
                            <tr style="background: #ecfdf5; font-weight: bold;">
                                <td>TOTAL PENDAPATAN</td>
                                <td class="text-right text-emerald-700 font-bold" style="font-size: 12px;">Rp ${totalIncome.toLocaleString('id-ID')}</td>
                            </tr>
                        </tfoot>
                    </table>

                    <h3 style="font-size: 14px; font-weight: 800; border-bottom: 2px solid #e11d48; padding-bottom: 6px; margin-top: 24px; margin-bottom: 12px;">2. BEBAN & PENGELUARAN (EXPENSES)</h3>
                    <table class="table-pdf">
                        <thead>
                            <tr><th>Kategori Pengeluaran</th><th class="text-right">Nominal</th></tr>
                        </thead>
                        <tbody>
                            ${Object.entries(metrics.expenseCategories || {}).map(([cat, val]) => `
                                <tr><td>${cat}</td><td class="text-right font-bold text-rose-600">Rp ${Number(val).toLocaleString('id-ID')}</td></tr>
                            `).join('') || '<tr><td>Total Beban Operasional Panitia</td><td class="text-right font-bold text-rose-600">Rp ' + totalExpense.toLocaleString('id-ID') + '</td></tr>'}
                        </tbody>
                        <tfoot>
                            <tr style="background: #ffe4e6; font-weight: bold;">
                                <td>TOTAL BEBAN & PENGELUARAN</td>
                                <td class="text-right text-rose-700 font-bold" style="font-size: 12px;">Rp ${totalExpense.toLocaleString('id-ID')}</td>
                            </tr>
                        </tfoot>
                    </table>

                    <div style="background: ${netIncome >= 0 ? '#ecfdf5' : '#ffe4e6'}; border: 2px solid ${netIncome >= 0 ? '#10b981' : '#f43f5e'}; padding: 14px; border-radius: 8px; margin-top: 20px; display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-size: 14px; font-weight: 800; color: ${netIncome >= 0 ? '#065f46' : '#9f1239'};">LABA / (RUGI) BERSIH TAHUN BERJALAN:</span>
                        <span style="font-size: 18px; font-weight: 900; color: ${netIncome >= 0 ? '#047857' : '#e11d48'};">Rp ${netIncome.toLocaleString('id-ID')}</span>
                    </div>
                </div>
            `;
        } else if (tabType === 'kas_besar') {
            const last10 = (data || []).slice(0, 10);
            const rowsHtml = last10.map(t => {
                const isExpense = t.kategori?.type_transaksi === 'expense' || t.kode_payer?.startsWith('EXP');
                return `
                    <tr>
                        <td class="font-mono text-center">${t.kode_id || '-'}</td>
                        <td class="text-center">${t.tanggal_transaksi || '-'}</td>
                        <td>${t.keterangan || '-'}</td>
                        <td class="font-semibold">${t.nama_payer || '-'}</td>
                        <td class="text-right font-bold ${isExpense ? 'text-rose-600' : 'text-emerald-600'}">
                            ${isExpense ? '-' : '+'} Rp ${Number(t.nominal || 0).toLocaleString('id-ID')}
                        </td>
                    </tr>
                `;
            }).join('');

            contentHtml = `
                <div style="margin-bottom: 20px;">
                    <div style="display: flex; gap: 16px; margin-bottom: 24px;">
                        <div style="flex: 1; background: #ecfdf5; border: 1px solid #10b981; padding: 12px; border-radius: 8px;">
                            <div style="font-size: 10px; font-weight: bold; color: #047857; text-transform: uppercase; margin-bottom: 4px;">Pemasukan Kas Besar</div>
                            <div style="font-size: 18px; font-weight: 800; color: #065f46;">Rp ${totalIncome.toLocaleString('id-ID')}</div>
                        </div>
                        <div style="flex: 1; background: #ffe4e6; border: 1px solid #f43f5e; padding: 12px; border-radius: 8px;">
                            <div style="font-size: 10px; font-weight: bold; color: #b91c1c; text-transform: uppercase; margin-bottom: 4px;">Pengeluaran Kas Besar</div>
                            <div style="font-size: 18px; font-weight: 800; color: #991b1b;">Rp ${totalExpense.toLocaleString('id-ID')}</div>
                        </div>
                    </div>

                    <h3 style="font-size: 13px; font-weight: 800; color: #1e293b; margin-bottom: 8px;">Mutasi Kas Terakhir</h3>
                    <table class="table-pdf">
                        <thead>
                            <tr>
                                <th style="width: 80px;" class="text-center">Kode</th>
                                <th style="width: 80px;" class="text-center">Tanggal</th>
                                <th>Uraian</th>
                                <th style="width: 150px;">Pembayar/Vendor</th>
                                <th style="width: 120px;" class="text-right">Nominal</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml.length > 0 ? rowsHtml : '<tr><td colSpan="5" class="text-center" style="padding: 12px; color: #94a3b8;">Belum ada mutasi transaksi.</td></tr>'}
                        </tbody>
                    </table>
                </div>
            `;
        } else if (tabType === 'perubahan_modal') {
            contentHtml = `
                <div style="margin-bottom: 20px; max-width: 500px; margin-left: auto; margin-right: auto;">
                    <table class="table-pdf">
                        <thead>
                            <tr>
                                <th>Keterangan</th>
                                <th class="text-right" style="width: 150px;">Nominal</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Modal Awal Kegiatan</td>
                                <td class="text-right font-bold">Rp 0</td>
                            </tr>
                            <tr>
                                <td class="text-emerald-600 font-semibold">+ Laba Bersih Periode Ini</td>
                                <td class="text-right font-bold text-emerald-600">Rp ${netIncome.toLocaleString('id-ID')}</td>
                            </tr>
                            <tr>
                                <td class="text-rose-600 font-semibold">- Prive / Penarikan Modal</td>
                                <td class="text-right font-bold text-rose-600">Rp 0</td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr style="background: #ecfdf5; font-weight: bold;">
                                <td style="font-size: 11px;">MODAL AKHIR PANITIA</td>
                                <td class="text-right text-emerald-700 font-bold" style="font-size: 12px;">Rp ${netIncome.toLocaleString('id-ID')}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            `;
        } else if (tabType === 'posisi_keuangan') {
            contentHtml = `
                <div style="margin-bottom: 20px;">
                    <div style="display: flex; gap: 20px;">
                        <div style="flex: 1;">
                            <h3 style="font-size: 12px; font-weight: 800; color: #2563eb; border-bottom: 2px solid #3b82f6; padding-bottom: 4px; margin-bottom: 10px;">ASET (ASSETS)</h3>
                            <table class="table-pdf">
                                <thead>
                                    <tr>
                                        <th>Keterangan</th>
                                        <th class="text-right" style="width: 110px;">Nominal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Kas & Bank / QRIS</td>
                                        <td class="text-right font-semibold">Rp ${totalIncome.toLocaleString('id-ID')}</td>
                                    </tr>
                                </tbody>
                                <tfoot>
                                    <tr style="background: #eff6ff; font-weight: bold;">
                                        <td>TOTAL ASET</td>
                                        <td class="text-right text-blue-700">Rp ${totalIncome.toLocaleString('id-ID')}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        <div style="flex: 1;">
                            <h3 style="font-size: 12px; font-weight: 800; color: #7c3aed; border-bottom: 2px solid #8b5cf6; padding-bottom: 4px; margin-bottom: 10px;">KEWAJIBAN & EKUITAS</h3>
                            <table class="table-pdf">
                                <thead>
                                    <tr>
                                        <th>Keterangan</th>
                                        <th class="text-right" style="width: 110px;">Nominal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Kewajiban (Utang)</td>
                                        <td class="text-right font-semibold">Rp ${totalExpense.toLocaleString('id-ID')}</td>
                                    </tr>
                                    <tr>
                                        <td>Ekuitas (Modal Akhir)</td>
                                        <td class="text-right font-semibold">Rp ${netIncome.toLocaleString('id-ID')}</td>
                                    </tr>
                                </tbody>
                                <tfoot>
                                    <tr style="background: #f5f3ff; font-weight: bold;">
                                        <td>TOTAL KEWAJIBAN & EKUITAS</td>
                                        <td class="text-right text-purple-700">Rp ${totalIncome.toLocaleString('id-ID')}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            `;
        } else if (tabType === 'arus_kas') {
            contentHtml = `
                <div style="margin-bottom: 20px; max-width: 600px; margin-left: auto; margin-right: auto;">
                    <table class="table-pdf">
                        <thead>
                            <tr>
                                <th>Aktivitas Arus Kas</th>
                                <th class="text-right" style="width: 150px;">Nominal</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style="background: #f8fafc; font-weight: bold;">
                                <td colspan="2">1. Arus Kas dari Aktivitas Operasional</td>
                            </tr>
                            <tr>
                                <td style="padding-left: 20px;">Penerimaan Kas dari Peserta (Iuran/Lomba)</td>
                                <td class="text-right text-emerald-600 font-semibold">+ Rp ${totalIncome.toLocaleString('id-ID')}</td>
                            </tr>
                            <tr>
                                <td style="padding-left: 20px;">Pembayaran Kas untuk Beban Operasional</td>
                                <td class="text-right text-rose-600 font-semibold">- Rp ${totalExpense.toLocaleString('id-ID')}</td>
                            </tr>
                            <tr style="font-weight: bold;">
                                <td style="padding-left: 20px;">Kas Bersih dari Aktivitas Operasional</td>
                                <td class="text-right">Rp ${netIncome.toLocaleString('id-ID')}</td>
                            </tr>

                            <tr style="background: #f8fafc; font-weight: bold;">
                                <td colspan="2">2. Arus Kas dari Aktivitas Investasi</td>
                            </tr>
                            <tr>
                                <td style="padding-left: 20px;">Pembelian Peralatan / Aset Tetap</td>
                                <td class="text-right text-gray-400">Rp 0</td>
                            </tr>

                            <tr style="background: #f8fafc; font-weight: bold;">
                                <td colspan="2">3. Arus Kas dari Aktivitas Pendanaan</td>
                            </tr>
                            <tr>
                                <td style="padding-left: 20px;">Sponsor / Hibah / Injeksi Modal</td>
                                <td class="text-right text-gray-400">Rp 0</td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr style="background: #ecfdf5; font-weight: bold;">
                                <td>KENAIKAN BERSIH KAS & SETARA KAS</td>
                                <td class="text-right text-emerald-700 font-bold" style="font-size: 12px;">Rp ${netIncome.toLocaleString('id-ID')}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            `;
        } else if (tabType === 'perubahan_ekuitas') {
            contentHtml = `
                <div style="margin-bottom: 20px;">
                    <table class="table-pdf">
                        <thead>
                            <tr>
                                <th>Keterangan Ekuitas</th>
                                <th class="text-right" style="width: 120px;">Modal Disetor</th>
                                <th class="text-right" style="width: 120px;">Saldo Laba</th>
                                <th class="text-right" style="width: 130px;">Total Ekuitas</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="font-semibold">Saldo Awal Periode</td>
                                <td class="text-right text-gray-500">Rp 0</td>
                                <td class="text-right text-gray-500">Rp 0</td>
                                <td class="text-right font-bold text-gray-700">Rp 0</td>
                            </tr>
                            <tr>
                                <td class="font-semibold text-emerald-600">+ Laba Tahun Berjalan</td>
                                <td class="text-right text-gray-500">Rp 0</td>
                                <td class="text-right text-emerald-600 font-semibold">Rp ${netIncome.toLocaleString('id-ID')}</td>
                                <td class="text-right font-bold text-emerald-600">Rp ${netIncome.toLocaleString('id-ID')}</td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr style="background: #ecfdf5; font-weight: bold;">
                                <td>SALDO AKHIR EKUITAS</td>
                                <td class="text-right">Rp 0</td>
                                <td class="text-right">Rp ${netIncome.toLocaleString('id-ID')}</td>
                                <td class="text-right text-emerald-700 font-bold" style="font-size: 11px;">Rp ${netIncome.toLocaleString('id-ID')}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            `;
        } else {
            contentHtml = `
                <div style="margin-bottom: 20px;">
                    <table class="table-pdf">
                        <thead>
                            <tr><th>Uraian / Ringkasan Pos Keuangan</th><th class="text-right">Jumlah</th></tr>
                        </thead>
                        <tbody>
                            <tr><td>Total Penerimaan Kas (Pemasukan)</td><td class="text-right font-bold text-emerald-600">Rp ${totalIncome.toLocaleString('id-ID')}</td></tr>
                            <tr><td>Total Pengeluaran Kas (Beban)</td><td class="text-right font-bold text-rose-600">Rp ${totalExpense.toLocaleString('id-ID')}</td></tr>
                        </tbody>
                        <tfoot>
                            <tr style="background: #f1f5f9; font-weight: bold;">
                                <td>SALDO LABA / EKUITAS AKHIR</td>
                                <td class="text-right text-emerald-700 font-bold" style="font-size: 13px;">Rp ${netIncome.toLocaleString('id-ID')}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            `;
        }

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8" />
                <title>${title}</title>
                <style>${PDF_STYLES}</style>
            </head>
            <body>
                <div class="header-container">
                    <div style="display: flex; align-items: center; gap: 14px;">
                        ${logoBase64 ? `<img src="${logoBase64}" style="width: 55px; height: 55px; object-fit: contain; flex-shrink: 0;" alt="Logo" />` : ''}
                        <div>
                            <h1 class="brand-title">PORTAL KAMPUS 2026</h1>
                            <h2 class="brand-subtitle">${title.toUpperCase()} (${site.toUpperCase()})</h2>
                            <div class="doc-info">Laporan Keuangan Resmi Panitia</div>
                        </div>
                    </div>
                    ${qrBase64 ? `
                    <div class="qr-container">
                        <img src="${qrBase64}" class="qr-img" alt="QR Scan" />
                        <div class="qr-caption">Scan Verifikasi</div>
                        <div style="font-size: 8px; font-weight: bold; color: #0284c7;">${documentCode}</div>
                    </div>
                    ` : ''}
                </div>

                <div class="meta-bar">
                    <div><strong>Dicetak Oleh:</strong> ${printedBy}</div>
                    <div><strong>Tanggal Cetak:</strong> ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                    <div><strong>Status:</strong> Terverifikasi Resi</div>
                </div>

                ${contentHtml}

                <div class="footer-stamp">
                    <div class="stamp-box">
                        <div>Mengetahui,</div>
                        <div style="font-weight: 700;">Ketua Pelaksana</div>
                        <div class="stamp-space"></div>
                        <div style="border-top: 1px solid #94a3b8; font-weight: 700;">${site === 'pkkmb' ? roleMappings.ketua_pelaksana_pkkmb : roleMappings.ketua_pelaksana_pose}</div>
                    </div>
                    <div class="stamp-box">
                        <div>Penanggung Jawab,</div>
                        <div style="font-weight: 700;">Bendahara Panitia</div>
                        <div class="stamp-space"></div>
                        <div style="border-top: 1px solid #94a3b8; font-weight: 700;">${printedBy}</div>
                    </div>
                </div>
            </body>
            </html>
        `;

        browser = await getBrowser();

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '15mm', right: '15mm', bottom: '20mm', left: '15mm' }
        });

        await browser.close();
        return pdfBuffer;
    } catch (err) {
        if (browser) await browser.close();
        console.error('Error generating financial report PDF with Puppeteer:', err);
        throw err;
    }
}

/**
 * Generate PDF for verification with multiple tables (e.g. Form Wajib and Form Register)
 */
export async function generateVerifikasiPDF({
    title = 'Laporan Verifikasi Pendaftaran',
    site = 'pose',
    columns = [],
    dataSets = [], // Array of { title: string, data: Array<Object> }
    documentId = '',
    documentCode = '',
    printedBy = 'Panitia Keuangan'
}) {
    let browser = null;
    try {
        const verifyUrl = generateVerifyUrl(site, documentId);
        const qrBase64 = documentId ? await generateQRCodeBase64(verifyUrl, site) : '';
        const logoBase64 = getLogoBase64(site);

        let tablesHtml = '';
        let totalRecords = 0;

        // Defensive normalization: if dataSets is passed as flat array of items or single dataSet
        let actualDataSets = dataSets;
        if (!Array.isArray(dataSets)) {
            actualDataSets = [];
        } else if (dataSets.length > 0 && !dataSets[0].data) {
            actualDataSets = [{ title, data: dataSets }];
        }

        for (const dataSet of actualDataSets) {
            if (!dataSet || !Array.isArray(dataSet.data)) continue;
            let dataRowCounter = 0;
            const rowsHtml = dataSet.data.map((item) => {
                dataRowCounter++;
                totalRecords++;
                const cellsHtml = columns.map(col => {
                    let val = item[col.key];
                    if (col.format === 'currency') {
                        val = typeof val === 'number' && val > 0 ? `Rp ${val.toLocaleString('id-ID')}` : (val && val !== 0 && val !== '-' ? val : '-');
                    } else if (col.format === 'date' || col.format === 'datetime' || ['created_at', 'tanggal_transaksi', 'journal_date', 'tanggal', 'visited_at'].includes(col.key)) {
                        val = formatWibDateTime(val);
                    }
                    const alignClass = col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : '';
                    return `<td class="${alignClass}">${val !== undefined && val !== null ? val : '-'}</td>`;
                }).join('');

                return `<tr><td class="text-center">${dataRowCounter}</td>${cellsHtml}</tr>`;
            }).join('');

            const headersHtml = columns.map(col => {
                const alignClass = col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : '';
                return `<th class="${alignClass}">${col.label}</th>`;
            }).join('');

            tablesHtml += `
                <h4 style="margin-top: 24px; margin-bottom: 8px; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px;">
                    ${dataSet.title}
                </h4>
                <table class="table-pdf">
                    <thead>
                        <tr>
                            <th class="text-center" style="width: 35px;">No</th>
                            ${headersHtml}
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml.length > 0 ? rowsHtml : '<tr><td colSpan="100" class="text-center" style="padding: 20px; color: #94a3b8;">Tidak ada data.</td></tr>'}
                    </tbody>
                </table>
            `;
        }

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8" />
                <title>${title}</title>
                <style>${PDF_STYLES}</style>
            </head>
            <body>
                <div class="header-container">
                    <div style="display: flex; align-items: center; gap: 14px;">
                        ${logoBase64 ? `<img src="${logoBase64}" style="width: 55px; height: 55px; object-fit: contain; flex-shrink: 0;" alt="Logo" />` : ''}
                        <div>
                            <h1 class="brand-title">PORTAL KAMPUS 2026</h1>
                            <h2 class="brand-subtitle">EVENT ${site.toUpperCase()}</h2>
                            <div class="doc-info">Dokumen Resmi Laporan Keuangan</div>
                        </div>
                    </div>
                    ${qrBase64 ? `
                    <div class="qr-container">
                        <img src="${qrBase64}" class="qr-img" alt="QR Scan" />
                        <div class="qr-caption">Scan Verifikasi</div>
                        <div style="font-size: 8px; font-weight: bold; color: #0284c7;">${documentCode}</div>
                    </div>
                    ` : ''}
                </div>

                <h3 class="report-title">${title}</h3>

                <div class="meta-bar">
                    <div><strong>Dicetak Oleh:</strong> ${printedBy}</div>
                    <div><strong>Tanggal Cetak:</strong> ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                    <div><strong>Total Record:</strong> ${totalRecords} Peserta</div>
                </div>

                ${tablesHtml}

                <div class="footer-stamp">
                    <div class="stamp-box">
                        <div>Mengetahui,</div>
                        <div style="font-weight: 700;">Ketua Pelaksana</div>
                        <div class="stamp-space"></div>
                        <div style="border-top: 1px solid #94a3b8; font-weight: 700;">${site === 'pkkmb' ? roleMappings.ketua_pelaksana_pkkmb : roleMappings.ketua_pelaksana_pose}</div>
                    </div>
                    <div class="stamp-box">
                        <div>Penanggung Jawab,</div>
                        <div style="font-weight: 700;">Bendahara Panitia</div>
                        <div class="stamp-space"></div>
                        <div style="border-top: 1px solid #94a3b8; font-weight: 700;">${printedBy}</div>
                    </div>
                </div>
            </body>
            </html>
        `;

        browser = await getBrowser();

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            landscape: columns.length > 6,
            printBackground: true,
            margin: { top: '12mm', right: '12mm', bottom: '15mm', left: '12mm' }
        });

        await browser.close();
        return pdfBuffer;
    } catch (err) {
        if (browser) await browser.close();
        console.error('Error generating verifikasi PDF with Puppeteer:', err);
        throw err;
    }
}


