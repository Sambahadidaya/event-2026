'use server';

import { getBrowser } from '@/lib/pdf/browser';
import path from 'path';
import fs from 'fs';
import { generateQRCodeBase64, generateVerifyUrl } from '@/lib/qr/qrcode';
import { PDF_STYLES } from './template';
import { formatIndoDate } from '@/lib/dateUtils';

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


const roleAbsensiMappings = {
    'sekretaris_pkkmb': 'Arini Salsabila',
    'sekretaris_pose': 'Devi Ramadanti',
};

/**
 * Generate PDF Buffer for attendance report using Puppeteer
 * @param {Object} params
 * @param {string} params.title - Report title
 * @param {string} params.site - Site code ('pose' | 'pkkmb')
 * @param {Array<{key: string, label: string, align?: string}>} params.columns
 * @param {Array<Object>} params.data - Table rows
 * @param {string} params.documentId - Document UUID from DB
 * @param {string} params.documentCode - Document code (e.g., RPT-2026-000001)
 * @param {string} params.printedBy - Name of the admin printing
 * @param {boolean} params.includeSummary - Whether to append Hadir/Izin/Sakit/Alpha counts at the end
 * @returns {Promise<Buffer>} PDF Buffer
 */
export async function generateAbsensiPDF({
    title = 'Laporan Kehadiran Panitia',
    site = 'pose',
    columns = [],
    data = [],
    documentId = '',
    documentCode = '',
    printedBy = 'Sekretaris Panitia',
    includeSummary = false
}) {
    let browser = null;
    try {
        const verifyUrl = generateVerifyUrl(site, documentId);
        const qrBase64 = documentId ? await generateQRCodeBase64(verifyUrl, site) : '';
        const logoBase64 = getLogoBase64(site);

        let dataRowCounter = 0;
        const rowsHtml = data.map((item) => {
            dataRowCounter++;
            const cellsHtml = columns.map(col => {
                let val = item[col.key];
                if (col.key === 'created_at' || col.key === 'updated_at' || col.key === 'tanggal_input') {
                    // Check if updated vs created to show updated date
                    const displayDate = item.updated_at && new Date(item.updated_at).getTime() - new Date(item.created_at).getTime() > 1000
                        ? item.updated_at
                        : item.created_at;
                    val = formatIndoDate(displayDate);
                }
                const alignClass = col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : '';

                // Add specific badge style for type_absen
                if (col.key === 'type_absen') {
                    let badgeColor = '';
                    if (val === 'Hadir') badgeColor = 'color: #10b981; font-weight: bold;';
                    else if (val === 'Izin') badgeColor = 'color: #3b82f6; font-weight: bold;';
                    else if (val === 'Sakit') badgeColor = 'color: #f59e0b; font-weight: bold;';
                    else if (val === 'Alpha') badgeColor = 'color: #ef4444; font-weight: bold;';
                    return `<td class="${alignClass}" style="${badgeColor}">${val}</td>`;
                }

                return `<td class="${alignClass}">${val !== undefined && val !== null ? val : '-'}</td>`;
            }).join('');

            return `<tr><td class="text-center">${dataRowCounter}</td>${cellsHtml}</tr>`;
        }).join('');

        // Header Html
        const headersHtml = columns.map(col => {
            const alignClass = col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : '';
            return `<th class="${alignClass}">${col.label}</th>`;
        }).join('');

        const tableHeaderHtml = `
            <thead>
                <tr>
                    <th class="text-center" style="width: 35px;">No</th>
                    ${headersHtml}
                </tr>
            </thead>
        `;

        // Calculate summary rows if needed (for Absensi page history)
        let summaryHtml = '';
        if (includeSummary) {
            let totalHadir = 0;
            let totalIzin = 0;
            let totalSakit = 0;
            let totalAlpha = 0;

            data.forEach(item => {
                const type = (item.type_absen || '').toLowerCase();
                if (type === 'hadir') totalHadir++;
                else if (type === 'izin') totalIzin++;
                else if (type === 'sakit') totalSakit++;
                else if (type === 'alpha') totalAlpha++;
            });

            const colSpan = columns.length + 1; // +1 for "No" column

            summaryHtml = `
                <tr style="font-weight: bold; border-top: 2px solid #cbd5e1;">
                    <td colSpan="${colSpan - 4}" class="text-left" style="padding-left: 15px;">Jumlah Hadir</td>
                    <td colSpan="${colSpan - 5}class="text-center" style="padding-center: 15px;">:</td>
                    <td colSpan="${colSpan - 3}class="text-left" style="color: #10b981; font-weight: 800;">${totalHadir}</td>
                </tr>
                <tr style="font-weight: bold;">
                    <td colSpan="${colSpan - 4}" class="text-left" style="padding-left: 15px;">Jumlah Izin</td>
                    <td colSpan="${colSpan - 5}class="text-center" style="padding-center: 15px;">:</td>
                    <td colSpan="${colSpan - 3}class="text-left" style="color: #3b82f6; font-weight: 800;">${totalIzin}</td>
                </tr>
                <tr style="font-weight: bold;">
                    <td colSpan="${colSpan - 4}" class="text-left" style="padding-left: 15px;">Jumlah Sakit</td>
                    <td colSpan="${colSpan - 5}class="text-center" style="padding-center: 15px;">:</td>
                    <td colSpan="${colSpan - 3}class="text-left" style="color: #f59e0b; font-weight: 800;">${totalSakit}</td>
                </tr>
                <tr style="font-weight: bold;">
                    <td colSpan="${colSpan - 4}" class="text-left" style="padding-left: 15px;">Jumlah Alpha</td>
                    <td colSpan="${colSpan - 5}class="text-center" style="padding-center: 15px;">:</td>
                    <td colSpan="${colSpan - 3}class="text-left" style="color: #ef4444; font-weight: 800;">${totalAlpha}</td>
                </tr>
            `;
        }

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8" />
                <title>${title}</title>
                <style>
                    ${PDF_STYLES}
                    /* Override border bottom for tables */
                    .table-pdf tfoot tr td {
                        padding: 7px 10px;
                        border-bottom: 1px solid #e2e8f0;
                        font-size: 10px;
                    }
                </style>
            </head>
            <body>
                <div class="header-container">
                    <div style="display: flex; align-items: center; gap: 14px;">
                        ${logoBase64 ? `<img src="${logoBase64}" style="width: 55px; height: 55px; object-fit: contain; flex-shrink: 0;" alt="Logo" />` : ''}
                        <div>
                            <h1 class="brand-title">PORTAL KAMPUS 2026</h1>
                            <h2 class="brand-subtitle">EVENT ${site.toUpperCase()}</h2>
                            <div class="doc-info">Dokumen Resmi Absensi Panitia</div>
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
                    <div><strong>Tanggal Cetak:</strong> ${formatIndoDate(new Date())}</div>
                    <div><strong>Total Record:</strong> ${dataRowCounter} Panitia</div>
                </div>

                <table class="table-pdf">
                    ${tableHeaderHtml}
                    <tbody>
                        ${rowsHtml.length > 0 ? rowsHtml : '<tr><td colSpan="100" class="text-center" style="padding: 20px; color: #94a3b8;">Tidak ada data.</td></tr>'}
                        ${summaryHtml}
                    </tbody>
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
                        <div style="font-weight: 700;">Sekretaris Panitia</div>
                        <div class="stamp-space"></div>
                        <div style="border-top: 1px solid #94a3b8; font-weight: 700;">${site === 'pkkmb' ? roleAbsensiMappings.sekretaris_pkkmb : roleAbsensiMappings.sekretaris_pose}</div>
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
            landscape: columns.length > 5,
            printBackground: true,
            margin: { top: '12mm', right: '12mm', bottom: '15mm', left: '12mm' }
        });

        await browser.close();
        return pdfBuffer;
    } catch (err) {
        if (browser) await browser.close();
        console.error('Error generating absensi PDF with Puppeteer:', err);
        throw err;
    }
}
