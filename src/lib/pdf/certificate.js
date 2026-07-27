import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { generateQRCodeBase64, generateVerifyUrl } from '@/lib/qr/qrcode';

/**
 * Generate Certificate PDF using pdf-lib
 * @param {Object} params
 * @param {Object} params.peserta - Peserta object
 * @param {string} params.site - 'pose' | 'pkkmb'
 * @param {string} params.documentId - Document UUID
 * @param {string} params.documentCode - e.g. CERT-2026-000001
 * @returns {Promise<Uint8Array>} PDF bytes
 */
export async function generateCertificatePDF({
    peserta = {},
    site = 'pose',
    documentId = '',
    documentCode = ''
}) {
    try {
        // Create a new PDF document
        const pdfDoc = await PDFDocument.create();
        
        // Add A4 landscape page (841.89 x 595.28 points)
        const page = pdfDoc.addPage([841.89, 595.28]);
        const { width, height } = page.getSize();

        // Fonts
        const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const timesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

        // Colors
        const primaryColor = site === 'pkkmb' ? rgb(0.02, 0.59, 0.41) : rgb(0.15, 0.39, 0.92);
        const textColor = rgb(0.06, 0.09, 0.16);
        const grayColor = rgb(0.39, 0.45, 0.55);

        // Border background decoration
        page.drawRectangle({
            x: 20,
            y: 20,
            width: width - 40,
            height: height - 40,
            borderColor: primaryColor,
            borderWidth: 3,
        });

        page.drawRectangle({
            x: 26,
            y: 26,
            width: width - 52,
            height: height - 52,
            borderColor: rgb(0.88, 0.91, 0.94),
            borderWidth: 1,
        });

        // Title
        const mainTitle = 'SERTIFIKAT PENGHARGAAN';
        const titleWidth = helveticaBold.widthOfTextAtSize(mainTitle, 28);
        page.drawText(mainTitle, {
            x: (width - titleWidth) / 2,
            y: height - 100,
            size: 28,
            font: helveticaBold,
            color: primaryColor,
        });

        // Subtitle
        const subTitle = `PORTAL KAMPUS 2026 - EVENT ${site.toUpperCase()}`;
        const subWidth = helveticaBold.widthOfTextAtSize(subTitle, 14);
        page.drawText(subTitle, {
            x: (width - subWidth) / 2,
            y: height - 130,
            size: 14,
            font: helveticaBold,
            color: textColor,
        });

        // Given to text
        const givenText = 'Diberikan Kepada :';
        const givenWidth = timesItalic.widthOfTextAtSize(givenText, 16);
        page.drawText(givenText, {
            x: (width - givenWidth) / 2,
            y: height - 180,
            size: 16,
            font: timesItalic,
            color: grayColor,
        });

        // Participant Name
        const namaPeserta = (peserta.nama || 'NAMA PESERTA').toUpperCase();
        const namaWidth = helveticaBold.widthOfTextAtSize(namaPeserta, 32);
        page.drawText(namaPeserta, {
            x: (width - namaWidth) / 2,
            y: height - 230,
            size: 32,
            font: helveticaBold,
            color: primaryColor,
        });

        // Line under name
        page.drawLine({
            start: { x: (width - namaWidth) / 2 - 20, y: height - 242 },
            end: { x: (width + namaWidth) / 2 + 20, y: height - 242 },
            thickness: 2,
            color: primaryColor,
        });

        // Description
        const descText = `Atas partisipasi dan keikutsertaannya sebagai peserta dalam kegiatan ${site.toUpperCase()} 2026`;
        const descWidth = helvetica.widthOfTextAtSize(descText, 14);
        page.drawText(descText, {
            x: (width - descWidth) / 2,
            y: height - 290,
            size: 14,
            font: helvetica,
            color: textColor,
        });

        // Embed QR Code
        if (documentId) {
            const verifyUrl = generateVerifyUrl(site, documentId);
            const qrBase64 = await generateQRCodeBase64(verifyUrl, site);
            if (qrBase64) {
                const qrImage = await pdfDoc.embedPng(qrBase64);
                page.drawImage(qrImage, {
                    x: 60,
                    y: 50,
                    width: 70,
                    height: 70,
                });

                page.drawText(`No. Cert: ${documentCode || documentId.slice(0, 8)}`, {
                    x: 60,
                    y: 36,
                    size: 8,
                    font: helvetica,
                    color: grayColor,
                });
            }
        }

        // Signature placeholders
        page.drawText('Ketua Panitia', {
            x: width - 200,
            y: 120,
            size: 12,
            font: helveticaBold,
            color: textColor,
        });

        page.drawLine({
            start: { x: width - 220, y: 55 },
            end: { x: width - 80, y: 55 },
            thickness: 1,
            color: textColor,
        });

        page.drawText('Panitia Kampus 2026', {
            x: width - 200,
            y: 40,
            size: 10,
            font: helvetica,
            color: grayColor,
        });

        const pdfBytes = await pdfDoc.save();
        return pdfBytes;
    } catch (err) {
        console.error('Error generating certificate PDF with pdf-lib:', err);
        throw err;
    }
}
