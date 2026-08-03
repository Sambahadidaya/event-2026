import { getBrowser } from '@/lib/pdf/browser';
import path from 'path';
import fs from 'fs';
import { generateQRCodeBase64, generateVerifyUrl } from '@/lib/qr/qrcode';

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

/**
 * Generate PDF Buffer for Matriks Penilaian
 * @param {Object} params
 * @param {string} params.title - Laporan Title
 * @param {string} params.site - 'pose' | 'pkkmb'
 * @param {string} params.lombaName - Nama Lomba
 * @param {string} params.juriName - Nama Juri (jika spesifik)
 * @param {Array<Object>} params.criteria - Kriteria Penilaian { judul, bobot }
 * @param {Array<Object>} params.nilaiData - Array filteredNilai
 * @param {string} params.documentId - Document UUID from DB
 * @param {string} params.documentCode - Document code
 * @param {string} params.printedBy - Name of the admin printing
 * @returns {Promise<Buffer>} PDF Buffer
 */
export async function generatePenilaianPDF({
    title = 'Rekapitulasi Penilaian Lomba',
    site = 'pose',
    lombaName = 'Semua Lomba',
    juriName = 'Semua Juri',
    criteria = [],
    nilaiData = [],
    documentId = '',
    documentCode = '',
    printedBy = 'PJ Lomba'
}) {
    let browser = null;
    try {
        const verifyUrl = generateVerifyUrl(site, documentId);
        const qrBase64 = documentId ? await generateQRCodeBase64(verifyUrl, site) : '';
        const logoBase64 = getLogoBase64(site);

        // Calculate dynamic columns width
        const totalCriteria = criteria.length;
        const totalNilai = nilaiData.length;

        // TABEL MATRIKS PENILAIAN
        const tableHeaders = `
            <tr>
                <th style="width: 4%;">No</th>
                <th style="width: 15%;">Nama Tim</th>
                <th style="width: 15%;">Juri</th>
                ${criteria.map(c => `
                    <th style="text-align: center;">
                        ${c.judul} <br/> <span style="font-weight:normal; font-size: 8px;">(${c.bobot}%)</span>
                    </th>
                `).join('')}
                <th style="width: 8%; text-align: center;">Total Nilai</th>
                <th style="width: 8%; text-align: center;">Nilai Akhir</th>
                <th style="width: 20%;">Catatan (Kritik & Saran)</th>
            </tr>
        `;

        const tableRowsHtml = nilaiData.map((item, idx) => {
            const details = item.detail_nilai_lomba || [];
            const detailMap = {};
            let total = 0;
            details.forEach(d => {
                detailMap[d.judul_nilai?.trim()] = d.nilai;
                total += d.nilai;
            });

            const criteriaCells = criteria.map(c => {
                const score = detailMap[c.judul.trim()];
                return `<td style="text-align: center; font-weight: 600;">${score !== undefined ? score : '-'}</td>`;
            }).join('');

            return `
                <tr>
                    <td style="text-align: center;">${idx + 1}</td>
                    <td><strong>${item.team?.title || '-'}</strong></td>
                    <td>${item.form_nilai_lomba?.nama_juri || '-'}</td>
                    ${criteriaCells}
                    <td style="text-align: center; font-weight: bold;">${total}</td>
                    <td style="text-align: center; font-weight: bold; font-size: 11px; background: #fffbeb;">
                        ${item.nilai_akhir !== null ? Number(item.nilai_akhir).toFixed(2) : '-'}
                    </td>
                    <td style="font-size: 8px;">
                        ${item.kritik ? `<strong>K:</strong> ${item.kritik}<br/>` : ''}
                        ${item.saran ? `<strong>S:</strong> ${item.saran}` : ''}
                        ${!item.kritik && !item.saran ? '-' : ''}
                    </td>
                </tr>
            `;
        }).join('');

        const contentHtml = `
            <div style="page-break-inside: avoid;">
                <h3 style="font-size: 14px; font-weight: 800; color: #2563eb; text-transform: uppercase; margin-bottom: 8px; border-bottom: 2px solid #cbd5e1; padding-bottom: 4px;">
                    Matriks Penilaian Juri
                </h3>
                <table class="table-details">
                    <thead>
                        ${tableHeaders}
                    </thead>
                    <tbody>
                        ${tableRowsHtml ? tableRowsHtml : `<tr><td colSpan="${6 + criteria.length}" style="text-align: center; color: #64748b; padding: 20px;">Belum ada data nilai masuk.</td></tr>`}
                    </tbody>
                </table>
            </div>
        `;

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8" />
                <title>${title} - ${documentCode}</title>
                <style>
                    @page { size: A4 landscape; margin: 10mm; }
                    body {
                        font-family: 'Segoe UI', Arial, sans-serif;
                        color: #0f172a;
                        background: #fff;
                        font-size: 10px;
                        line-height: 1.4;
                        margin: 0; padding: 0;
                    }
                    .invoice-card {
                        border: 2px solid #e2e8f0;
                        border-radius: 12px;
                        padding: 20px;
                        background: #ffffff;
                    }
                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        border-bottom: 2px solid #2563eb;
                        padding-bottom: 12px;
                        margin-bottom: 20px;
                    }
                    .brand {
                        font-size: 20px;
                        font-weight: 900;
                        color: #0f172a;
                        margin: 0;
                    }
                    .subbrand {
                        font-size: 12px;
                        font-weight: 800;
                        color: #2563eb;
                        text-transform: uppercase;
                    }
                    .doc-number {
                        font-size: 14px;
                        font-weight: 800;
                        color: #0f172a;
                        text-align: right;
                    }
                    .qr-section {
                        text-align: center;
                        margin-top: 6px;
                    }
                    .qr-img {
                        width: 75px;
                        height: 75px;
                        border: 1px solid #cbd5e1;
                        border-radius: 6px;
                        padding: 2px;
                    }
                    .meta-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr 1fr 1fr;
                        gap: 15px;
                        margin-bottom: 20px;
                        background: #f8fafc;
                        padding: 12px;
                        border-radius: 8px;
                    }
                    .meta-item label {
                        font-size: 9px;
                        font-weight: 700;
                        color: #64748b;
                        text-transform: uppercase;
                        display: block;
                    }
                    .meta-item span {
                        font-size: 12px;
                        font-weight: 700;
                        color: #0f172a;
                    }
                    .table-details {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                    }
                    .table-details th {
                        background: #f1f5f9;
                        padding: 6px;
                        text-align: left;
                        font-size: 9px;
                        text-transform: uppercase;
                        border: 1px solid #cbd5e1;
                    }
                    .table-details td {
                        padding: 6px;
                        border: 1px solid #e2e8f0;
                    }
                    .stamp-grid {
                        display: flex;
                        justify-content: space-between;
                        margin-top: 30px;
                        page-break-inside: avoid;
                    }
                    .stamp-box {
                        text-align: center;
                        width: 180px;
                    }
                    .stamp-line {
                        border-top: 1px solid #94a3b8;
                        margin-top: 50px;
                        font-weight: 700;
                    }
                    .verify-note {
                        text-align: center;
                        font-size: 8px;
                        color: #94a3b8;
                        margin-top: 20px;
                        border-top: 1px dashed #e2e8f0;
                        padding-top: 8px;
                        page-break-inside: avoid;
                    }
                </style>
            </head>
            <body>
                <div class="invoice-card">
                    <div class="header">
                        <div style="display: flex; align-items: center; gap: 14px;">
                            ${logoBase64 ? `<img src="${logoBase64}" style="width: 50px; height: 50px; object-fit: contain; flex-shrink: 0;" alt="Logo" />` : ''}
                            <div>
                                <h1 class="brand">PORTAL KAMPUS 2026</h1>
                                <div class="subbrand">LAPORAN PENILAIAN LOMBA - ${site.toUpperCase()}</div>
                                <div style="color: #64748b; font-size: 10px;">LP3I Kampus Utama</div>
                            </div>
                        </div>
                        <div>
                            <div class="doc-number">DOKUMEN RESMI</div>
                            <div style="font-family: monospace; font-size: 11px; color: #64748b; text-align: right;">${documentCode}</div>
                            ${qrBase64 ? `
                            <div class="qr-section">
                                <img src="${qrBase64}" class="qr-img" />
                                <div style="font-size: 7px; color: #64748b;">Scan Verifikasi Document</div>
                            </div>
                            ` : ''}
                        </div>
                    </div>

                    <div class="meta-grid">
                        <div class="meta-item">
                            <label>Nama Lomba</label>
                            <span>${lombaName}</span>
                        </div>
                        <div class="meta-item">
                            <label>Juri / Penilai</label>
                            <span>${juriName}</span>
                        </div>
                        <div class="meta-item">
                            <label>Dicetak Oleh</label>
                            <span>${printedBy}</span>
                            <div style="font-size: 9px; color: #64748b; margin-top: 4px;">Jumlah Dinilai: <strong>${totalNilai} Tim</strong></div>
                        </div>
                        <div class="meta-item">
                            <label>Tanggal Cetak</label>
                            <span>${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>

                    ${contentHtml}

                    <div class="stamp-grid">
                        <div class="stamp-box">
                            <div>Mengetahui,</div>
                            <div>PJ Lomba</div>
                            <div class="stamp-line">${printedBy}</div>
                        </div>
                        <div class="stamp-box">
                            <div>Disahkan oleh,</div>
                            <div>Juri Lomba</div>
                            <div class="stamp-line">${juriName !== 'Semua Juri' ? juriName : '( ..................... )'}</div>
                        </div>
                        <div class="stamp-box">
                            <div>Disahkan oleh,</div>
                            <div>Ketua Pelaksana POSE</div>
                            <div class="stamp-line">Nadia Nita</div>
                        </div>
                    </div>

                    <div class="verify-note">
                        Dokumen ini diterbitkan secara elektronik dan terverifikasi secara digital oleh Portal Kampus 2026.<br/>
                        Scan QR Code diatas untuk memverifikasi keaslian dokumen ini pada sistem resmi.
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
            margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
        });

        await browser.close();
        return pdfBuffer;
    } catch (err) {
        if (browser) await browser.close();
        console.error('Error generating penilaian report PDF with Puppeteer:', err);
        throw err;
    }
}
