'use server';

import { getBrowser } from '@/lib/pdf/browser';
import path from 'path';
import fs from 'fs';
import { generateQRCodeBase64, generateVerifyUrl } from '@/lib/qr/qrcode';
import { PDF_STYLES } from './template';

function getLogoBase64(site = 'pkkmb') {
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
 * Generate PDF Buffer khusus untuk modul PJ Kabim (Divisi Pembimbing PKKMB)
 * @param {Object} params
 * @param {string} params.title - Judul laporan dokumen
 * @param {string} params.site - 'pkkmb' (default)
 * @param {Array<{key: string, label: string, align?: string}>} params.columns - Konfigurasi kolom tabel
 * @param {Array<Object>} params.data - Data baris tabel
 * @param {string} params.documentId - Document UUID untuk QR verifikasi
 * @param {string} params.documentCode - Kode dokumen resmi (contoh: KBM-2026-000123)
 * @param {string} params.printedBy - Nama admin / PJ Kabim yang mencetak
 * @param {string} params.sessionName - Informasi tambahan (misal Sesi Acara atau Kelompok)
 * @param {Array<{label: string, value: any, color?: string}>} params.summaryCards - Ringkasan statistik (opsional)
 * @param {boolean} params.landscape - Paksa landscape / portrait (default auto deteksi jika kolom > 6)
 * @returns {Promise<Buffer>} PDF Buffer
 */
export async function generateKabimPDF({
    title = 'Laporan Bimbingan Mahasiswa PKKMB',
    site = 'pkkmb',
    columns = [],
    data = [],
    documentId = '',
    documentCode = '',
    printedBy = 'PJ Kabim',
    sessionName = '',
    summaryCards = [],
    landscape = null
}) {
    let browser = null;
    try {
        const verifyUrl = generateVerifyUrl(site, documentId);
        const qrBase64 = documentId ? await generateQRCodeBase64(verifyUrl, site) : '';
        const logoBase64 = getLogoBase64(site);

        // Auto-orientasi: Jika jumlah kolom >= 7, buat landscape agar data tidak terpotong
        const isLandscape = landscape !== null ? landscape : columns.length >= 7;

        let dataRowCounter = 0;
        const rowsHtml = (data || []).map((item, idx) => {
            dataRowCounter++;
            const cellsHtml = columns.map((col) => {
                let val = item[col.key];

                // Formatting tampilan khusus badge / nilai
                let cellContent = val !== undefined && val !== null && val !== '' ? String(val) : '-';

                // Styling badge untuk status absensi / kelulusan
                if (col.key === 'jenis_absensi' || col.key === 'kehadiran') {
                    const lower = String(cellContent).toLowerCase();
                    let badgeClass = 'color: #334155;';
                    if (lower === 'hadir') badgeClass = 'color: #059669; font-weight: bold;';
                    else if (lower === 'izin') badgeClass = 'color: #0284c7; font-weight: bold;';
                    else if (lower === 'sakit') badgeClass = 'color: #d97706; font-weight: bold;';
                    else if (lower === 'alpha') badgeClass = 'color: #dc2626; font-weight: bold;';
                    cellContent = `<span style="${badgeClass}">${cellContent}</span>`;
                } else if (col.key === 'status_kelulusan' || col.key === 'status') {
                    const lower = String(cellContent).toLowerCase();
                    let badgeClass = 'color: #334155;';
                    if (lower.includes('lulus') && !lower.includes('tidak')) badgeClass = 'color: #059669; font-weight: bold;';
                    else if (lower.includes('tidak') || lower.includes('gagal')) badgeClass = 'color: #dc2626; font-weight: bold;';
                    cellContent = `<span style="${badgeClass}">${cellContent}</span>`;
                } else if (col.key === 'nilai_akhir' || col.key === 'skor_akhir' || col.key === 'total_nilai') {
                    cellContent = `<strong style="color: #1e3a8a;">${cellContent}</strong>`;
                }

                const alignClass = col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : '';
                return `<td class="${alignClass}">${cellContent}</td>`;
            }).join('');

            return `
                <tr>
                    <td class="text-center" style="width: 35px; color: #64748b; font-weight: 600;">${idx + 1}</td>
                    ${cellsHtml}
                </tr>
            `;
        });

        // Generate Table Header
        const tableHeaderHtml = `
            <thead>
                <tr>
                    <th class="text-center" style="width: 35px;">No</th>
                    ${columns.map(col => {
                        const alignClass = col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : '';
                        return `<th class="${alignClass}">${col.label}</th>`;
                    }).join('')}
                </tr>
            </thead>
        `;

        // Render Summary Cards jika tersedia
        let summaryHtml = '';
        if (summaryCards && summaryCards.length > 0) {
            const cardsContent = summaryCards.map(c => `
                <div style="flex: 1; min-width: 110px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; text-align: center;">
                    <div style="font-size: 8px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">${c.label}</div>
                    <div style="font-size: 14px; font-weight: 800; color: ${c.color || '#1e3a8a'}; margin-top: 2px;">${c.value}</div>
                </div>
            `).join('');

            summaryHtml = `
                <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px;">
                    ${cardsContent}
                </div>
            `;
        }

        const ketuaPelaksanaName = roleMappings.ketua_pelaksana_pkkmb || 'Ketua Pelaksana PKKMB';
        const displayPrintedBy = printedBy || 'PJ Kabim';

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8" />
                <title>${title} - ${documentCode}</title>
                <style>
                    ${PDF_STYLES}
                    @page {
                        size: A4 ${isLandscape ? 'landscape' : 'portrait'};
                        margin: 10mm;
                    }
                    body {
                        font-family: 'Segoe UI', Arial, sans-serif;
                        color: #0f172a;
                        background: #fff;
                        font-size: 9px;
                        line-height: 1.35;
                        margin: 0;
                        padding: 0;
                    }
                    .kabim-card {
                        border: 1.5px solid #cbd5e1;
                        border-radius: 12px;
                        padding: 16px;
                        background: #ffffff;
                    }
                    .brand-title {
                        font-size: 17px;
                        font-weight: 900;
                        color: #0f172a;
                        letter-spacing: -0.3px;
                        margin: 0;
                    }
                    .brand-subtitle {
                        font-size: 10px;
                        font-weight: 800;
                        color: #2563eb;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        margin-top: 1px;
                    }
                    .doc-info {
                        font-size: 8.5px;
                        color: #64748b;
                        font-weight: 500;
                        margin-top: 1px;
                    }
                    .report-title-box {
                        margin-top: 12px;
                        margin-bottom: 10px;
                        padding-bottom: 6px;
                        border-bottom: 2px solid #2563eb;
                    }
                    .report-title {
                        font-size: 13px;
                        font-weight: 800;
                        color: #1e3a8a;
                        text-transform: uppercase;
                        letter-spacing: 0.3px;
                        margin: 0;
                    }
                    .report-subtitle {
                        font-size: 9px;
                        color: #64748b;
                        font-weight: 600;
                        margin-top: 2px;
                    }
                    .meta-grid {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 10px;
                        background: #f8fafc;
                        border: 1px solid #e2e8f0;
                        border-radius: 8px;
                        padding: 8px 12px;
                        margin-bottom: 12px;
                    }
                    .meta-item label {
                        font-size: 7.5px;
                        font-weight: 700;
                        color: #64748b;
                        text-transform: uppercase;
                        letter-spacing: 0.4px;
                        display: block;
                    }
                    .meta-item span {
                        font-size: 9.5px;
                        font-weight: 700;
                        color: #0f172a;
                        display: block;
                        margin-top: 1px;
                    }
                    .table-pdf {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 8.5px;
                        margin-bottom: 16px;
                    }
                    .table-pdf th {
                        background: #f1f5f9;
                        color: #1e293b;
                        font-size: 8px;
                        font-weight: 800;
                        text-transform: uppercase;
                        letter-spacing: 0.3px;
                        padding: 6px 8px;
                        border: 1px solid #cbd5e1;
                    }
                    .table-pdf td {
                        padding: 5px 8px;
                        border: 1px solid #e2e8f0;
                        color: #334155;
                    }
                    .table-pdf tr:nth-child(even) {
                        background: #fcfdfe;
                    }
                    .footer-stamp {
                        display: flex;
                        justify-content: space-between;
                        margin-top: 24px;
                        page-break-inside: avoid;
                    }
                    .stamp-box {
                        text-align: center;
                        width: 190px;
                        font-size: 8.5px;
                    }
                    .stamp-space {
                        height: 48px;
                    }
                    .stamp-name {
                        border-top: 1px solid #94a3b8;
                        font-weight: 800;
                        color: #0f172a;
                        padding-top: 4px;
                    }
                    .verify-note {
                        text-align: center;
                        font-size: 7.5px;
                        color: #94a3b8;
                        margin-top: 16px;
                        border-top: 1px dashed #e2e8f0;
                        padding-top: 6px;
                        page-break-inside: avoid;
                    }
                </style>
            </head>
            <body>
                <div class="kabim-card">
                    {/* Header Bagian Atas */}
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            ${logoBase64 ? `<img src="${logoBase64}" style="width: 48px; height: 48px; object-fit: contain; flex-shrink: 0;" alt="Logo PKKMB" />` : ''}
                            <div>
                                <h1 class="brand-title">PORTAL KAMPUS 2026</h1>
                                <div class="brand-subtitle">DIVISI PEMBIMBING (PJ KABIM) - PKKMB 2026</div>
                                <div class="doc-info">Dokumen Resmi Rekapitulasi & Evaluasi Bimbingan Mahasiswa</div>
                            </div>
                        </div>

                        <div style="text-align: right;">
                            <div style="font-size: 11px; font-weight: 800; color: #0f172a; letter-spacing: 0.3px;">DOKUMEN RESMI</div>
                            <div style="font-family: monospace; font-size: 9px; font-weight: bold; color: #2563eb;">${documentCode}</div>
                            ${qrBase64 ? `
                            <div style="margin-top: 4px; text-align: center;">
                                <img src="${qrBase64}" style="width: 55px; height: 55px; border: 1px solid #cbd5e1; border-radius: 4px; padding: 2px;" alt="QR Scan" />
                                <div style="font-size: 6.5px; color: #64748b; margin-top: 1px;">Scan Verifikasi Digital</div>
                            </div>
                            ` : ''}
                        </div>
                    </div>

                    {/* Judul Laporan */}
                    <div class="report-title-box">
                        <h2 class="report-title">${title}</h2>
                        ${sessionName ? `<div class="report-subtitle">Keterangan: ${sessionName}</div>` : ''}
                    </div>

                    {/* Metadata Box */}
                    <div class="meta-grid">
                        <div class="meta-item">
                            <label>Dicetak Oleh</label>
                            <span>${displayPrintedBy}</span>
                        </div>
                        <div class="meta-item">
                            <label>Divisi / Peran</label>
                            <span>PJ Pembimbing (Kabim)</span>
                        </div>
                        <div class="meta-item">
                            <label>Tanggal Cetak</label>
                            <span>${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB</span>
                        </div>
                        <div class="meta-item">
                            <label>Total Data</label>
                            <span>${dataRowCounter} Record Peserta</span>
                        </div>
                    </div>

                    {/* Ringkasan Metrics (jika ada) */}
                    ${summaryHtml}

                    {/* Tabel Data Utama */}
                    <table class="table-pdf">
                        ${tableHeaderHtml}
                        <tbody>
                            ${rowsHtml.length > 0 ? rowsHtml.join('') : `<tr><td colSpan="${columns.length + 1}" class="text-center" style="padding: 16px; color: #94a3b8;">Tidak ada data peserta ditemukan.</td></tr>`}
                        </tbody>
                    </table>

                    {/* Tanda Tangan Pengesahan (Stamp) */}
                    <div class="footer-stamp">
                        <div class="stamp-box">
                            <div>Penanggung Jawab,</div>
                            <div style="font-weight: 700; color: #1e3a8a; margin-top: 1px;">PJ Pembimbing (PJ Kabim)</div>
                            <div class="stamp-space"></div>
                            <div class="stamp-name">${displayPrintedBy}</div>
                        </div>

                        <div class="stamp-box">
                            <div>Mengetahui,</div>
                            <div style="font-weight: 700; color: #1e3a8a; margin-top: 1px;">Ketua Pelaksana PKKMB</div>
                            <div class="stamp-space"></div>
                            <div class="stamp-name">${ketuaPelaksanaName}</div>
                        </div>
                    </div>

                    {/* Catatan Verifikasi Bawah */}
                    <div class="verify-note">
                        Dokumen ini diterbitkan secara elektronik dan sah sebagai bukti bimbingan kegiatan PKKMB 2026.<br/>
                        Scan QR Code di bagian atas untuk memverifikasi keaslian dokumen ini pada portal resmi.
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
            landscape: isLandscape,
            printBackground: true,
            margin: { top: '8mm', right: '8mm', bottom: '8mm', left: '8mm' }
        });

        await browser.close();
        return pdfBuffer;
    } catch (err) {
        if (browser) await browser.close();
        console.error('Error generating PJ Kabim PDF with Puppeteer:', err);
        throw err;
    }
}
