'use server';

import { getBrowser } from '@/lib/pdf/browser';
import path from 'path';
import fs from 'fs';
import { PDF_STYLES } from './template';
import { formatIndoDate } from '@/lib/dateUtils';

function getLogoBase64() {
    try {
        const logoPath = path.join(process.cwd(), 'src', 'assets', 'logo_pkkmb/icon-logo.png');
        if (fs.existsSync(logoPath)) {
            const buffer = fs.readFileSync(logoPath);
            return `data:image/png;base64,${buffer.toString('base64')}`;
        }
    } catch (e) {
        console.error('Error loading logo base64:', e);
    }
    return '';
}

/**
 * Generate PDF Buffer data medis peserta menggunakan Puppeteer
 * @param {Object} params
 * @param {Array<Object>} params.data - List data medis
 * @param {string} params.title - Judul PDF
 * @param {string} params.printedBy - Pembuat cetakan
 * @returns {Promise<Buffer>}
 */
export async function generateMedisPDF({ data = [], title = 'DATA MEDIS PESERTA PKKMB', printedBy = 'Admin' }) {
    let browser = null;
    try {
        browser = await getBrowser();
        const page = await browser.newPage();

        const logoData = getLogoBase64();
        const currentDate = formatIndoDate(new Date().toISOString());

        // Membuat isi baris tabel
        const rowsHtml = data.map((item, idx) => `
            <tr style="page-break-inside: avoid;">
                <td style="text-align: center; border: 1px solid #cbd5e1; padding: 6px; font-size: 8px;">${idx + 1}</td>
                <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8px; font-weight: bold; color: #1e293b;">${item.nama || '-'}</td>
                <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8px; color: #334155;">${item.nim || '-'}</td>
                <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8px; color: #334155;">${item.prodi || '-'}</td>
                <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8px; color: #334155;">${item.email_wa || '-'}</td>
                <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8px; color: #1e293b; font-weight: 500;">${item.nama_kelompok || '-'}</td>
                <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8px; font-weight: 500; color: #c2410c;">${item.riwayat_penyakit || '-'}</td>
                <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8px; color: #475569;">${item.penanganan || '-'}</td>
                <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8px; font-weight: 500; color: #b91c1c;">${item.alergi || '-'}</td>
                <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8px; color: #475569;">${item.nama_ortu_wali || '-'}</td>
                <td style="border: 1px solid #cbd5e1; padding: 6px; font-size: 8px; color: #475569;">${item.no_wa_ortu_wali || '-'}</td>
            </tr>
        `).join('');

        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                ${PDF_STYLES}
                body {
                    font-family: 'Inter', system-ui, sans-serif;
                    color: #1e293b;
                    margin: 0;
                    padding: 0;
                }
                .header-container {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border-bottom: 2px solid #3b82f6;
                    padding-bottom: 12px;
                    margin-bottom: 20px;
                }
                .logo {
                    height: 55px;
                }
                .title-container {
                    text-align: right;
                }
                .title {
                    font-size: 16px;
                    font-weight: 800;
                    color: #1e3a8a;
                    margin: 0;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .subtitle {
                    font-size: 9px;
                    color: #64748b;
                    margin: 2px 0 0 0;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 30px;
                }
                th {
                    background-color: #f1f5f9;
                    color: #475569;
                    font-weight: 700;
                    text-transform: uppercase;
                    font-size: 8px;
                    border: 1px solid #cbd5e1;
                    padding: 8px 6px;
                    text-align: left;
                }
                .footer {
                    margin-top: 40px;
                    display: flex;
                    justify-content: space-between;
                    font-size: 8px;
                    color: #64748b;
                    border-top: 1px dashed #e2e8f0;
                    padding-top: 10px;
                }
            </style>
        </head>
        <body>
            <div class="header-container">
                <div>
                    ${logoData ? `<img class="logo" src="${logoData}" alt="Logo" />` : ''}
                </div>
                <div class="title-container">
                    <h1 class="title">${title}</h1>
                    <p class="subtitle">Portal Kampus PKKMB 2026 | Cetakan: ${currentDate}</p>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="width: 3%; text-align: center;">No</th>
                        <th style="width: 15%;">Nama Lengkap</th>
                        <th style="width: 9%;">NIM</th>
                        <th style="width: 10%;">Prodi</th>
                        <th style="width: 10%;">Email/WA</th>
                        <th style="width: 9%;">Kelompok</th>
                        <th style="width: 12%;">Riwayat Penyakit</th>
                        <th style="width: 12%;">Penanganan</th>
                        <th style="width: 8%;">Alergi</th>
                        <th style="width: 12%;">Nama Ortu/Wali</th>
                        <th style="width: 10%;">WA Ortu/Wali</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>

            <div class="footer">
                <div>Dicetak oleh: ${printedBy}</div>
                <div>Halaman 1 dari 1</div>
            </div>
        </body>
        </html>
        `;

        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({
            format: 'A4',
            landscape: true,
            margin: { top: '30px', right: '30px', bottom: '30px', left: '30px' },
            printBackground: true
        });

        return pdfBuffer;
    } catch (e) {
        console.error('Error generating Medis PDF:', e);
        throw e;
    } finally {
        if (browser) await browser.close();
    }
}
