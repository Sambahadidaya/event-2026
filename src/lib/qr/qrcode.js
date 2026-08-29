import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';

/**
 * Generate QR Code as Base64 Data URL (PNG) with centered logo
 * @param {string} text - URL or text to encode
 * @param {string} site - 'pkkmb' | 'pose'
 * @returns {Promise<string>} Base64 Data URL
 */
export async function generateQRCodeBase64(text, site = 'pose') {
    try {
        if (!text) return '';

        const size = 300;
        let canvasModule;
        try {
            canvasModule = await import('canvas');
        } catch (e) {
            console.warn('Canvas native module unavailable, falling back to pure JS QR generation:', e.message);
        }

        if (canvasModule && canvasModule.createCanvas) {
            const { createCanvas, loadImage } = canvasModule;
            const qrCanvas = createCanvas(size, size);
            await QRCode.toCanvas(qrCanvas, text, {
                errorCorrectionLevel: 'H',
                margin: 2,
                width: size,
                color: {
                    dark: '#0f172a',
                    light: '#ffffff'
                }
            });

            const ctx = qrCanvas.getContext('2d');

            // Path to logo
            const logoFileName = site === 'pkkmb' ? 'logo_pkkmb/icon-logo.png' : 'logo_pose/icon-logo2.png';
            const logoPath = path.join(process.cwd(), 'src', 'assets', logoFileName);

            if (fs.existsSync(logoPath)) {
                const logo = await loadImage(logoPath);
                const logoSize = Math.floor(size * 0.22); // 22% of QR size
                const center = Math.floor((size - logoSize) / 2);

                // Draw white background for logo
                const padding = 6;
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                if (typeof ctx.roundRect === 'function') {
                    ctx.roundRect(center - padding, center - padding, logoSize + padding * 2, logoSize + padding * 2, 8);
                } else {
                    ctx.rect(center - padding, center - padding, logoSize + padding * 2, logoSize + padding * 2);
                }
                ctx.fill();

                // Draw logo
                ctx.drawImage(logo, center, center, logoSize, logoSize);
            }

            return qrCanvas.toDataURL('image/png');
        }

        // Pure JS QR fallback when canvas native module cannot be loaded
        return await QRCode.toDataURL(text, {
            errorCorrectionLevel: 'H',
            margin: 2,
            width: size,
            color: { dark: '#0f172a', light: '#ffffff' }
        });
    } catch (err) {
        console.error('Error generating QR Code Base64:', err);
        try {
            return await QRCode.toDataURL(text, {
                errorCorrectionLevel: 'H',
                margin: 2,
                width: 300,
                color: { dark: '#0f172a', light: '#ffffff' }
            });
        } catch {
            return '';
        }
    }
}

/**
 * Generate verification URL for a given site and document ID
 * @param {string} site - 'pose' | 'pkkmb' | 'portal'
 * @param {string} documentId - UUID of document
 * @returns {string} Public verification URL
 */
export function generateVerifyUrl(site = 'pose', documentId = '') {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://event.plb.ac.id/';
    const sitePath = site === 'pkkmb' ? 'pkkmb' : 'pose';
    return `${baseUrl}/${sitePath}/pdf/${documentId}`;
}
