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
 * Generate Invoice/Kwitansi PDF using Puppeteer
 * @param {Object} params
 * @param {Object} params.transaction - Transaction object
 * @param {string} params.site - 'pose' | 'pkkmb'
 * @param {string} params.documentId - Document UUID
 * @param {string} params.documentCode - e.g., INV-2026-000001 or KWT-2026-000001
 * @param {string} params.printedBy - Name of admin printing
 * @param {string} params.documentType - 'invoice' | 'receipt'
 * @returns {Promise<Buffer>} PDF Buffer
 */
export async function generateInvoicePDF({
    transaction = {},
    site = 'pose',
    documentId = '',
    documentCode = '',
    printedBy = 'Panitia Keuangan',
    documentType = 'invoice'
}) {
    let browser = null;
    try {
        const verifyUrl = generateVerifyUrl(site, documentId);
        const qrBase64 = documentId ? await generateQRCodeBase64(verifyUrl, site) : '';
        const logoBase64 = getLogoBase64(site);

        const isInvoice = documentType === 'invoice';
        const docTitle = isInvoice ? 'INVOICE PEMBAYARAN' : 'KWITANSI PEMBAYARAN';
        const nominalStr = `Rp ${Number(transaction.nominal || 0).toLocaleString('id-ID')}`;

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8" />
                <title>${docTitle} - ${documentCode}</title>
                <style>
                    @page { size: A4 portrait; margin: 15mm; }
                    body {
                        font-family: 'Segoe UI', Arial, sans-serif;
                        color: #0f172a;
                        background: #fff;
                        font-size: 12px;
                        line-height: 1.5;
                        margin: 0; padding: 0;
                    }
                    .invoice-card {
                        border: 2px solid #e2e8f0;
                        border-radius: 12px;
                        padding: 30px;
                        background: #ffffff;
                    }
                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        border-bottom: 2px solid ${site === 'pkkmb' ? '#059669' : '#2563eb'};
                        padding-bottom: 16px;
                        margin-bottom: 24px;
                    }
                    .brand {
                        font-size: 22px;
                        font-weight: 900;
                        color: #0f172a;
                        margin: 0;
                    }
                    .subbrand {
                        font-size: 13px;
                        font-weight: 800;
                        color: ${site === 'pkkmb' ? '#059669' : '#2563eb'};
                        text-transform: uppercase;
                    }
                    .doc-number {
                        font-size: 16px;
                        font-weight: 800;
                        color: #0f172a;
                        text-align: right;
                    }
                    .qr-section {
                        text-align: center;
                        margin-top: 6px;
                    }
                    .qr-img {
                        width: 85px;
                        height: 85px;
                        border: 1px solid #cbd5e1;
                        border-radius: 6px;
                        padding: 3px;
                    }
                    .meta-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 20px;
                        margin-bottom: 24px;
                        background: #f8fafc;
                        padding: 16px;
                        border-radius: 8px;
                    }
                    .meta-item label {
                        font-size: 10px;
                        font-weight: 700;
                        color: #64748b;
                        text-transform: uppercase;
                        display: block;
                    }
                    .meta-item span {
                        font-size: 13px;
                        font-weight: 700;
                        color: #0f172a;
                    }
                    .table-details {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 24px;
                    }
                    .table-details th {
                        background: #f1f5f9;
                        padding: 10px;
                        text-align: left;
                        font-size: 11px;
                        text-transform: uppercase;
                        border-bottom: 2px solid #cbd5e1;
                    }
                    .table-details td {
                        padding: 12px 10px;
                        border-bottom: 1px solid #e2e8f0;
                    }
                    .total-box {
                        background: ${site === 'pkkmb' ? '#ecfdf5' : '#eff6ff'};
                        border: 1px solid ${site === 'pkkmb' ? '#a7f3d0' : '#bfdbfe'};
                        border-radius: 8px;
                        padding: 16px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 30px;
                    }
                    .total-label {
                        font-size: 14px;
                        font-weight: 800;
                        color: ${site === 'pkkmb' ? '#065f46' : '#1e40af'};
                    }
                    .total-amount {
                        font-size: 22px;
                        font-weight: 900;
                        color: ${site === 'pkkmb' ? '#047857' : '#1d4ed8'};
                    }
                    .stamp-grid {
                        display: flex;
                        justify-content: space-between;
                        margin-top: 40px;
                    }
                    .stamp-box {
                        text-align: center;
                        width: 200px;
                    }
                    .stamp-line {
                        border-top: 1px solid #94a3b8;
                        margin-top: 60px;
                        font-weight: 700;
                    }
                    .verify-note {
                        text-align: center;
                        font-size: 9px;
                        color: #94a3b8;
                        margin-top: 30px;
                        border-top: 1px dashed #e2e8f0;
                        padding-top: 10px;
                    }
                </style>
            </head>
            <body>
                <div class="invoice-card">
                    <div class="header">
                        <div style="display: flex; align-items: center; gap: 14px;">
                            ${logoBase64 ? `<img src="${logoBase64}" style="width: 55px; height: 55px; object-fit: contain; flex-shrink: 0;" alt="Logo" />` : ''}
                            <div>
                                <h1 class="brand">PORTAL KAMPUS 2026</h1>
                                <div class="subbrand">KEUANGAN ${site.toUpperCase()}</div>
                                <div style="color: #64748b; font-size: 11px;">LP3I Kampus Utama</div>
                            </div>
                        </div>
                        <div>
                            <div class="doc-number">${docTitle}</div>
                            <div style="font-family: monospace; font-size: 12px; color: #64748b; text-align: right;">${documentCode}</div>
                            ${qrBase64 ? `
                            <div class="qr-section">
                                <img src="${qrBase64}" class="qr-img" />
                                <div style="font-size: 8px; color: #64748b;">Scan Verifikasi Document</div>
                            </div>
                            ` : ''}
                        </div>
                    </div>

                    <div class="meta-grid">
                        <div class="meta-item">
                            <label>Diterima Dari / Pembayar</label>
                            <span>${transaction.nama_payer || transaction.penanggung_jawab || 'Peserta / Pembayar'}</span>
                        </div>
                        <div class="meta-item">
                            <label>Tanggal Transaksi</label>
                            <span>${transaction.created_at ? new Date(transaction.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('id-ID')}</span>
                        </div>
                        <div class="meta-item">
                            <label>Kode Transaksi / Referensi</label>
                            <span style="font-family: monospace;">${transaction.kode_id || transaction.id || '-'}</span>
                        </div>
                        <div class="meta-item">
                            <label>Metode Pembayaran</label>
                            <span>${transaction.metode_pembayaran || 'Tunai'}</span>
                        </div>
                    </div>

                    <table class="table-details">
                        <thead>
                            <tr>
                                <th>Deskripsi Keperluan / Transaksi</th>
                                <th style="text-align: right;">Nominal</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <strong style="font-size: 13px;">${transaction.keterangan || transaction.judul || 'Pembayaran Kegiatan ' + site.toUpperCase()}</strong>
                                    <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Category: ${transaction.kategori_payer || 'Pendaftaran / Iuran'}</div>
                                </td>
                                <td style="text-align: right; font-weight: 800; font-size: 14px;">${nominalStr}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="total-box">
                        <div class="total-label">TOTAL DIBAYARKAN</div>
                        <div class="total-amount">${nominalStr}</div>
                    </div>

                    <div class="stamp-grid">
                        <div class="stamp-box">
                            <div>Pembayar / Yang Menyerahkan</div>
                            <div class="stamp-line">${transaction.nama_payer || 'Peserta'}</div>
                        </div>
                        <div class="stamp-box">
                            <div>Penerima / Admin Keuangan</div>
                            <div class="stamp-line">${printedBy}</div>
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
            printBackground: true,
            margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' }
        });

        await browser.close();
        return pdfBuffer;
    } catch (err) {
        if (browser) await browser.close();
        console.error('Error generating invoice PDF with Puppeteer:', err);
        throw err;
    }
}
