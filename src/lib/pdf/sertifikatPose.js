import path from 'path';
import fs from 'fs';
import { getBrowser } from '@/lib/pdf/browser';
import { generateQRCodeBase64 } from '@/lib/qr/qrcode';

/**
 * Load template image as base64 data URL
 */
function getTemplateBase64(filename) {
    try {
        const filePath = path.join(process.cwd(), 'src', 'assets', 'sertifikat_pose', 'template', filename);
        if (fs.existsSync(filePath)) {
            const buffer = fs.readFileSync(filePath);
            return `data:image/png;base64,${buffer.toString('base64')}`;
        }
    } catch (err) {
        console.error(`Error reading template image ${filename}:`, err);
    }
    return '';
}

/**
 * Convert month (0-11) to Roman numeral
 */
export function getRomanMonth(monthIndex) {
    const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    return romanMonths[monthIndex] || 'IX';
}

/**
 * Generate formatted certificate number
 * Format: 001/SERT-PST/POSE/POLITEKNIK-LP3I/IX/2026
 */
export function formatNomorSertifikat(seqNo, kodeSert = 'PST', date = new Date()) {
    const padded = String(seqNo).padStart(3, '0');
    const month = getRomanMonth(date.getMonth());
    const year = date.getFullYear();
    return `${padded}/SERT-${kodeSert.toUpperCase()}/POSE/POLITEKNIK-LP3I/${month}/${year}`;
}

export {
    buildQRTextPartisipasi,
    buildQRTextPeserta,
    buildQRTextJuara
} from '@/lib/pdf/sertifikatLayout';

import {
    buildPartisipasiHTML,
    buildPesertaHTML,
    buildJuaraHTML,
    buildNilaiHTML,
    getSertifikatCSS
} from '@/lib/pdf/sertifikatLayout';

/**
 * Generate Full Certificate PDF Buffer using Puppeteer
 * @param {Object} params
 * @param {'partisipasi' | 'peserta' | 'juara'} params.jenis - 'partisipasi' | 'peserta' | 'juara'
 * @param {string} params.nomorSert - e.g. 001/SERT-PST/POSE/POLITEKNIK-LP3I/IX/2026
 * @param {string} [params.nama] - Participant name (for partisipasi)
 * @param {string} [params.namaTeam] - Team name (for peserta / juara)
 * @param {string} [params.namaLomba] - Name of competition
 * @param {string|number} [params.peringkat] - Rank e.g. 1, 2, 3
 * @param {Array} [params.anggota] - Team members array
 * @param {string} params.qrText - Full structured verification text for QR
 * @param {boolean} [params.isKreativitas] - Whether to include detail score pages
 * @param {Array} [params.nilaiList] - List of scores from judges
 * @returns {Promise<Buffer>}
 */
export async function generateSertifikatPosePDF({
    jenis = 'peserta',
    nomorSert = '',
    nama = '',
    namaTeam = '',
    namaLomba = '',
    peringkat = 1,
    anggota = [],
    qrText = '',
    isKreativitas = false,
    nilaiList = []
}) {
    let browser = null;
    try {
        // Generate centered logo QR Code base64
        const qrBase64 = qrText ? await generateQRCodeBase64(qrText, 'pose') : '';

        // Load background templates
        const bgPartisipasi = getTemplateBase64('template-partisipasi.png');
        const bgPeserta = getTemplateBase64('template-peserta.png');
        const bgJuara = getTemplateBase64('template-juara.png');
        const bgNilai = getTemplateBase64('template-nilai.png');

        // Build main certificate page HTML
        let mainPageHTML = '';
        if (jenis === 'partisipasi') {
            mainPageHTML = buildPartisipasiHTML({
                nomorSert,
                nama: nama || 'PESERTA',
                qrBase64,
                bgBase64: bgPartisipasi
            });
        } else if (jenis === 'juara') {
            mainPageHTML = buildJuaraHTML({
                nomorSert,
                namaTeam: namaTeam || 'TIM PESERTA',
                namaLomba,
                peringkat,
                qrBase64,
                bgBase64: bgJuara
            });
        } else {
            mainPageHTML = buildPesertaHTML({
                nomorSert,
                namaTeam: namaTeam || 'TIM PESERTA',
                namaLomba,
                qrBase64,
                bgBase64: bgPeserta
            });
        }

        // Build additional score pages if it's a creativity competition with judges
        let scorePagesHTML = '';
        if (isKreativitas && nilaiList && nilaiList.length > 0) {
            scorePagesHTML = nilaiList.map(item => {
                const namaJuri = item.form_nilai_lomba?.nama_juri || 'Juri Penilai';
                const nilaiAkhir = item.nilai_akhir;
                const detailKriteria = item.detail_nilai_lomba || [];
                const kritik = item.kritik;
                const saran = item.saran;

                return buildNilaiHTML({
                    namaJuri,
                    nilaiAkhir,
                    detailKriteria,
                    kritik,
                    saran,
                    bgBase64: bgNilai
                });
            }).join('\n');
        }

        const fullHTML = `
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="UTF-8">
            <title>Sertifikat POSE 2026 - ${nomorSert}</title>
            <style>
                ${getSertifikatCSS()}
            </style>
        </head>
        <body>
            ${mainPageHTML}
            ${scorePagesHTML}
        </body>
        </html>
        `;

        browser = await getBrowser();
        const page = await browser.newPage();

        // Set viewport to landscape A4 (approx 1122x793 px at 96 DPI)
        await page.setViewport({ width: 1123, height: 794, deviceScaleFactor: 2 });
        await page.setContent(fullHTML, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            landscape: true,
            printBackground: true,
            margin: { top: 0, right: 0, bottom: 0, left: 0 }
        });

        await browser.close();
        browser = null;

        return pdfBuffer;
    } catch (err) {
        console.error('Error generating Sertifikat POSE PDF:', err);
        if (browser) {
            try {
                await browser.close();
            } catch (closeErr) {
                console.error('Error closing browser instance:', closeErr);
            }
        }
        throw err;
    }
}
