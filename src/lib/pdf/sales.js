'use server';

import { getBrowser } from '@/lib/pdf/browser';
import path from 'path';
import fs from 'fs';
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
    ketua_pelaksana_pose: 'Nadia Nita',
    bendahara_pose: 'Bendahara Panitia',
};

/**
 * Generate PDF laporan riwayat sales dengan 2 tabel.
 * @param {Object} params
 * @param {string} params.site - 'pose' | 'pkkmb'
 * @param {Array} params.summaryData - Array ringkasan per identitas sales (dari getSalesSummary)
 * @param {Array} params.detailData - Array detail semua entri (dari getSalesAllDetail)
 * @param {string} params.printedBy - Nama admin yang mencetak
 * @param {string} params.namaLombaFilter - Filter nama lomba ('all' atau nama spesifik)
 * @returns {Promise<Buffer>} PDF Buffer
 */
export async function generateSalesPDF({
    site = 'pose',
    summaryData = [],
    detailData = [],
    printedBy = 'Admin',
    namaLombaFilter = 'all'
}) {
    let browser = null;
    try {
        const logoBase64 = getLogoBase64(site);

        const filterLabel = namaLombaFilter === 'all' ? 'Semua Lomba' : namaLombaFilter;
        const totalKomisi = summaryData.reduce((s, r) => s + (r.total_nominal || 0), 0);
        const totalEntri = detailData.length;

        // ======================== TABEL UTAMA (RINGKASAN) ========================
        const summaryRowsHtml = summaryData.map((row, idx) => `
            <tr>
                <td class="text-center">${idx + 1}</td>
                <td>${row.sumber || '-'}</td>
                <td><strong>${row.nama_nim || '-'}</strong></td>
                <td class="text-right" style="color:#0284c7; font-weight:700;">Rp ${(row.total_nominal || 0).toLocaleString('id-ID')}</td>
            </tr>
        `).join('');

        const summaryFooterHtml = `
            <tr style="background:#f1f5f9; font-weight:800; border-top:2px solid #cbd5e1;">
                <td colspan="3" class="text-right" style="padding-right:12px;">Total Akumulasi:</td>
                <td class="text-right" style="color:#0284c7;">Rp ${totalKomisi.toLocaleString('id-ID')}</td>
            </tr>
        `;

        // ======================== TABEL DETAIL ========================
        const detailRowsHtml = detailData.map((det, idx) => `
            <tr>
                <td class="text-center">${idx + 1}</td>
                <td>${det.sumber || '-'}</td>
                <td>${det.nama_nim || '-'}</td>
                <td>${det.target_nim || '-'}</td>
                <td class="text-right">Rp ${(det.nominal || 0).toLocaleString('id-ID')}</td>
                <td class="text-center">${det.persen_komisi || 0}%</td>
                <td>${det.nama_lomba || '-'}</td>
                <td>${formatIndoDate(det.tanggal_transaksi)}</td>
            </tr>
        `).join('');

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8" />
                <title>Laporan Riwayat Sales POSE 2026</title>
                <style>
                    ${PDF_STYLES}
                    .section-title {
                        font-size: 13px;
                        font-weight: 700;
                        color: #0f172a;
                        margin: 20px 0 8px 0;
                        padding-left: 8px;
                        border-left: 3px solid #0284c7;
                    }
                    .summary-cards {
                        display: flex;
                        gap: 12px;
                        margin-bottom: 16px;
                    }
                    .summary-card {
                        flex: 1;
                        background: #f8fafc;
                        border: 1px solid #e2e8f0;
                        border-radius: 8px;
                        padding: 10px 14px;
                    }
                    .summary-card .card-label {
                        font-size: 9px;
                        color: #64748b;
                        font-weight: 600;
                        text-transform: uppercase;
                    }
                    .summary-card .card-value {
                        font-size: 14px;
                        font-weight: 800;
                        color: #0f172a;
                        margin-top: 2px;
                    }
                    .summary-card.highlight .card-value { color: #0284c7; }
                </style>
            </head>
            <body>
                <!-- HEADER -->
                <div class="header-container">
                    <div style="display: flex; align-items: center; gap: 14px;">
                        ${logoBase64 ? `<img src="${logoBase64}" style="width: 55px; height: 55px; object-fit: contain; flex-shrink: 0;" alt="Logo" />` : ''}
                        <div>
                            <h1 class="brand-title">PORTAL KAMPUS 2026</h1>
                            <h2 class="brand-subtitle">EVENT ${site.toUpperCase()}</h2>
                            <div class="doc-info">Laporan Resmi Riwayat Sales &amp; Referral</div>
                        </div>
                    </div>
                </div>

                <h3 class="report-title">Laporan Riwayat Sales &amp; Referral</h3>

                <div class="meta-bar">
                    <div><strong>Dicetak Oleh:</strong> ${printedBy}</div>
                    <div><strong>Tanggal Cetak:</strong> ${formatIndoDate(new Date())}</div>
                    <div><strong>Filter Lomba:</strong> ${filterLabel}</div>
                </div>

                <!-- SUMMARY CARDS -->
                <div class="summary-cards">
                    <div class="summary-card highlight">
                        <div class="card-label">Total Akumulasi Komisi</div>
                        <div class="card-value">Rp ${totalKomisi.toLocaleString('id-ID')}</div>
                    </div>
                    <div class="summary-card">
                        <div class="card-label">Identitas Sales</div>
                        <div class="card-value">${summaryData.length} Orang</div>
                    </div>
                    <div class="summary-card">
                        <div class="card-label">Total Transaksi</div>
                        <div class="card-value">${totalEntri} Entri</div>
                    </div>
                </div>

                <!-- TABEL UTAMA: RINGKASAN -->
                <div class="section-title">Tabel Utama — Ringkasan Per Identitas Sales</div>
                <table class="table-pdf">
                    <thead>
                        <tr>
                            <th class="text-center" style="width:35px;">No</th>
                            <th>Sumber</th>
                            <th>Nama / NIM</th>
                            <th class="text-right">Total Nominal Komisi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${summaryRowsHtml || '<tr><td colspan="4" class="text-center" style="padding:16px;color:#94a3b8;">Tidak ada data.</td></tr>'}
                        ${summaryFooterHtml}
                    </tbody>
                </table>

                <!-- TABEL DETAIL: PER TRANSAKSI -->
                <div class="section-title">Tabel Detail — Riwayat Setiap Transaksi Referral</div>
                <table class="table-pdf">
                    <thead>
                        <tr>
                            <th class="text-center" style="width:35px;">No</th>
                            <th>Sumber</th>
                            <th>Nama / NIM</th>
                            <th>NIM Target</th>
                            <th class="text-right">Nominal</th>
                            <th class="text-center">% Komisi</th>
                            <th>Nama Lomba</th>
                            <th>Tgl Transaksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${detailRowsHtml || '<tr><td colspan="8" class="text-center" style="padding:16px;color:#94a3b8;">Tidak ada data.</td></tr>'}
                    </tbody>
                </table>

                <!-- FOOTER TANDA TANGAN -->
                <div class="footer-stamp">
                    <div class="stamp-box">
                        <div>Mengetahui,</div>
                        <div style="font-weight: 700;">Ketua Pelaksana</div>
                        <div class="stamp-space"></div>
                        <div style="border-top: 1px solid #94a3b8; font-weight: 700;">${roleMappings.ketua_pelaksana_pose}</div>
                    </div>
                    <div class="stamp-box">
                        <div>Penanggung Jawab,</div>
                        <div style="font-weight: 700;">Bendahara Panitia</div>
                        <div class="stamp-space"></div>
                        <div style="border-top: 1px solid #94a3b8; font-weight: 700;">${roleMappings.bendahara_pose}</div>
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
            landscape: true,
            printBackground: true,
            margin: { top: '12mm', right: '12mm', bottom: '15mm', left: '12mm' }
        });

        await browser.close();
        return pdfBuffer;
    } catch (err) {
        if (browser) await browser.close();
        console.error('Error generating sales PDF with Puppeteer:', err);
        throw err;
    }
}
