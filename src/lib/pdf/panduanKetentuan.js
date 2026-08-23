import { getBrowser } from '@/lib/pdf/browser';
import { generateQRCodeBase64 } from '@/lib/qr/qrcode';
import path from 'path';
import fs from 'fs';

function getFileBase64(relativeAssetPath) {
    try {
        const fullPath = path.join(process.cwd(), 'src', 'assets', relativeAssetPath);
        if (fs.existsSync(fullPath)) {
            const ext = path.extname(fullPath).toLowerCase();
            const mime = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
            const buffer = fs.readFileSync(fullPath);
            return `data:${mime};base64,${buffer.toString('base64')}`;
        }
    } catch (e) {
        console.error('Error loading image base64:', relativeAssetPath, e);
    }
    return '';
}

function getSiteLogo(site) {
    if (site === 'pkkmb') {
        return getFileBase64('logo_pkkmb/icon-logo.png') || getFileBase64('icon-poltek.png');
    }
    return getFileBase64('logo_pose/icon-logo2.png') || getFileBase64('icon-poltek.png');
}

const DOCUMENT_STYLES = `
    @page {
        size: A4 portrait;
        margin: 12mm 14mm 15mm 14mm;
    }
    * {
        box-sizing: border-box;
    }
    body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        color: #1e293b;
        background-color: #ffffff;
        font-size: 10.5px;
        line-height: 1.5;
        margin: 0;
        padding: 0;
    }
    .header-box {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 2px solid var(--primary-color, #0284c7);
        padding-bottom: 12px;
        margin-bottom: 18px;
    }
    .brand-left {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    .brand-logo {
        width: 48px;
        height: 48px;
        object-fit: contain;
    }
    .brand-title {
        font-size: 17px;
        font-weight: 800;
        color: #0f172a;
        margin: 0;
        letter-spacing: -0.3px;
    }
    .brand-sub {
        font-size: 11px;
        font-weight: 700;
        color: var(--primary-color, #0284c7);
        text-transform: uppercase;
        margin: 2px 0 0 0;
        letter-spacing: 0.5px;
    }
    .brand-right-wrapper {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    .brand-right {
        text-align: right;
        font-size: 9px;
        color: #64748b;
        line-height: 1.4;
    }
    .qr-container {
        text-align: center;
    }
    .qr-img {
        width: 60px;
        height: 60px;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 2px;
        background: #ffffff;
        display: block;
    }
    .qr-caption {
        font-size: 7px;
        color: #94a3b8;
        margin-top: 2px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.3px;
        font-family: monospace;
    }
    .badge-pill {
        display: inline-block;
        padding: 3px 8px;
        border-radius: 9999px;
        font-size: 8.5px;
        font-weight: 800;
        text-transform: uppercase;
        background: #f1f5f9;
        color: #334155;
        border: 1px solid #e2e8f0;
        margin-bottom: 4px;
    }
    .doc-headline {
        background: linear-gradient(135deg, var(--bg-soft, #f8fafc), #ffffff);
        border: 1px solid #e2e8f0;
        border-left: 4px solid var(--primary-color, #0284c7);
        border-radius: 8px;
        padding: 12px 14px;
        margin-bottom: 20px;
    }
    .doc-headline h1 {
        font-size: 16px;
        font-weight: 800;
        color: #0f172a;
        margin: 0 0 4px 0;
    }
    .doc-headline p {
        font-size: 10px;
        color: #64748b;
        margin: 0;
    }
    .toc-box {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 10px 14px;
        margin-bottom: 22px;
        page-break-inside: avoid;
    }
    .toc-title {
        font-size: 10px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        color: #475569;
        margin-bottom: 6px;
    }
    .toc-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 4px 14px;
    }
    .toc-item {
        font-size: 9.5px;
        color: #334155;
        display: flex;
        align-items: center;
        gap: 6px;
    }
    .toc-dot {
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: var(--primary-color, #0284c7);
        flex-shrink: 0;
    }
    .section-card {
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 14px 16px;
        margin-bottom: 18px;
        background: #ffffff;
        page-break-inside: avoid;
    }
    .section-header {
        display: flex;
        align-items: center;
        gap: 8px;
        border-bottom: 1px solid #f1f5f9;
        padding-bottom: 8px;
        margin-bottom: 10px;
    }
    .section-number {
        width: 22px;
        height: 22px;
        border-radius: 6px;
        background: var(--primary-color, #0284c7);
        color: #ffffff;
        font-size: 10px;
        font-weight: 800;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }
    .section-title {
        font-size: 13px;
        font-weight: 800;
        color: #0f172a;
        margin: 0;
    }
    .section-content {
        font-size: 10.5px;
        color: #334155;
        white-space: pre-line;
        margin-bottom: 12px;
        line-height: 1.55;
    }
    .section-image-box {
        margin: 12px 0;
        text-align: center;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 8px;
        background: #f8fafc;
    }
    .section-image {
        max-width: 100%;
        max-height: 260px;
        object-fit: contain;
        border-radius: 6px;
    }
    .image-caption {
        font-size: 8.5px;
        color: #64748b;
        margin-top: 4px;
        font-style: italic;
    }
    .subsections-container {
        margin-top: 12px;
        padding-top: 10px;
        border-top: 1px dashed #e2e8f0;
    }
    .subsection-item {
        margin-bottom: 10px;
        padding-left: 10px;
        border-left: 2px solid var(--accent-color, #f97316);
    }
    .subsection-title {
        font-size: 11px;
        font-weight: 700;
        color: #0f172a;
        margin: 0 0 3px 0;
    }
    .subsection-content {
        font-size: 10px;
        color: #475569;
        margin: 0;
        white-space: pre-line;
        line-height: 1.5;
    }
    .video-info-box {
        display: flex;
        align-items: center;
        gap: 10px;
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 6px;
        padding: 8px 12px;
        margin-top: 10px;
        font-size: 9.5px;
        color: #991b1b;
    }
    .video-tag {
        background: #dc2626;
        color: white;
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 800;
        font-size: 8px;
        text-transform: uppercase;
        flex-shrink: 0;
    }
    .video-link {
        color: #b91c1c;
        text-decoration: underline;
        font-weight: bold;
        word-break: break-all;
    }
    .privacy-box {
        background: #eff6ff;
        border: 1px solid #bfdbfe;
        border-radius: 8px;
        padding: 12px 14px;
        margin-bottom: 18px;
        page-break-inside: avoid;
    }
    .privacy-title {
        font-size: 12px;
        font-weight: 800;
        color: #1e40af;
        margin: 0 0 6px 0;
    }
    .privacy-content {
        font-size: 9.5px;
        color: #1e3a8a;
        white-space: pre-line;
        line-height: 1.5;
    }
    .update-box {
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        border-radius: 8px;
        padding: 12px 14px;
        margin-bottom: 18px;
        page-break-inside: avoid;
    }
    .update-header {
        font-size: 12px;
        font-weight: 800;
        color: #166534;
        margin: 0 0 10px 0;
    }
    .update-item {
        background: #ffffff;
        border: 1px solid #dcfce7;
        border-radius: 6px;
        padding: 8px 10px;
        margin-bottom: 8px;
    }
    .update-item-top {
        display: flex;
        justify-content: space-between;
        font-size: 9.5px;
        font-weight: 700;
        color: #15803d;
        margin-bottom: 4px;
    }
    .update-item-body {
        font-size: 9px;
        color: #334155;
        line-height: 1.4;
    }
    .footer-doc {
        border-top: 1px solid #e2e8f0;
        padding-top: 10px;
        margin-top: 24px;
        display: flex;
        justify-content: space-between;
        font-size: 8.5px;
        color: #94a3b8;
    }
`;

/**
 * Generate PDF buffer for Panduan page
 */
export async function generatePanduanPDF({ site = 'pkkmb', data = {} }) {
    let browser = null;
    try {
        const isPkkmb = site === 'pkkmb';
        const primaryColor = isPkkmb ? '#059669' : '#2563eb';
        const accentColor = '#f97316';
        const bgSoft = isPkkmb ? '#ecfdf5' : '#eff6ff';
        const siteTitle = isPkkmb ? 'PKKMB 2026' : 'POSE 2026';
        const logoBase64 = getSiteLogo(site);

        const sections = data.sections || [];
        const privacyPolicy = data.privacyPolicy || null;
        const updateVersi = data.updateVersi || [];

        // Generate QR Code with site logo
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://event.plb.ac.id/';
        const qrUrl = `${baseUrl.replace(/\/$/, '')}/${site}/panduan`;
        const qrBase64 = await generateQRCodeBase64(qrUrl, site);

        // Build Sections HTML
        const sectionsHtml = sections.map((sec, index) => {
            // Find base64 image if exists
            let imageBase64 = '';
            if (sec.imageKey) {
                const subFolder = isPkkmb ? 'panduan_pkkmb' : 'panduan_pose';
                imageBase64 = getFileBase64(`${subFolder}/${sec.imageKey}.png`);
                if (!imageBase64 && isPkkmb && sec.imageKey === 'daftar') {
                    imageBase64 = getFileBase64(`panduan_pose/daftar.png`);
                }
            }

            const subsectionsHtml = (sec.subsections || []).map((sub) => `
                <div class="subsection-item">
                    <h4 class="subsection-title">• ${sub.title}</h4>
                    <p class="subsection-content">${sub.content || ''}</p>
                </div>
            `).join('');

            const hasValidVideo = sec.youtubeId && sec.youtubeId !== 'kosong';
            const videoHtml = hasValidVideo ? `
                <div class="video-info-box">
                    <span class="video-tag">Video Panduan</span>
                    <div>
                        <strong>Tonton Panduan Video:</strong>
                        <a href="https://www.youtube.com/watch?v=${sec.youtubeId}" class="video-link" target="_blank">
                            https://www.youtube.com/watch?v=${sec.youtubeId}
                        </a>
                    </div>
                </div>
            ` : '';

            const imageHtml = imageBase64 ? `
                <div class="section-image-box">
                    <img src="${imageBase64}" class="section-image" alt="${sec.title}" />
                    <div class="image-caption">Tampilan antarmuka: ${sec.title}</div>
                </div>
            ` : '';

            return `
                <div class="section-card" id="sec-${index}">
                    <div class="section-header">
                        <div class="section-number">${index + 1}</div>
                        <h2 class="section-title">${sec.title}</h2>
                    </div>
                    <div class="section-content">${sec.content || ''}</div>
                    ${imageHtml}
                    ${videoHtml}
                    ${subsectionsHtml ? `<div class="subsections-container">${subsectionsHtml}</div>` : ''}
                </div>
            `;
        }).join('');

        // Privacy Policy HTML
        let privacyContentHtml = '';
        if (privacyPolicy) {
            if (privacyPolicy.points && privacyPolicy.points.length > 0) {
                privacyContentHtml = `
                    ${privacyPolicy.description ? `<div style="font-size: 9.5px; color: #1e3a8a; margin-bottom: 8px;">${privacyPolicy.description}</div>` : ''}
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 8px;">
                        ${privacyPolicy.points.map((pt, i) => `
                            <div style="background: #ffffff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 8px; font-size: 8.5px;">
                                <div style="font-weight: bold; color: #1e40af; margin-bottom: 3px;">✓ ${pt.title}</div>
                                <div style="color: #475569; line-height: 1.35;">${pt.desc}</div>
                            </div>
                        `).join('')}
                    </div>
                `;
            } else {
                privacyContentHtml = `<div class="privacy-content">${privacyPolicy.content}</div>`;
            }
        }

        const privacyHtml = privacyPolicy ? `
            <div class="privacy-box">
                <h3 class="privacy-title">🔒 ${privacyPolicy.title}</h3>
                ${privacyContentHtml}
            </div>
        ` : '';

        // Update Versi HTML
        const updateHtml = updateVersi && updateVersi.length > 0 ? `
            <div class="update-box">
                <h3 class="update-header">⚡ Catatan Pembaruan Sistem (Update Versi)</h3>
                ${updateVersi.map(u => {
                    const updateImg = u.imageKey ? getFileBase64(`update/${site}/${u.imageKey}.png`) : '';
                    return `
                        <div class="update-item">
                            <div class="update-item-top">
                                <span>${u.versi} — ${u.judul}</span>
                                <span>${u.tanggal}</span>
                            </div>
                            <div class="update-item-body">${u.isi}</div>
                            ${updateImg ? `
                                <div style="margin-top: 6px; text-align: center;">
                                    <img src="${updateImg}" style="max-width: 100%; max-height: 160px; border-radius: 4px; border: 1px solid #bbf7d0;" />
                                </div>
                            ` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        ` : '';

        const nowFormatted = new Date().toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        const html = `
            <!DOCTYPE html>
            <html lang="id">
            <head>
                <meta charset="utf-8" />
                <title>Panduan Penggunaan Portal ${siteTitle}</title>
                <style>
                    :root {
                        --primary-color: ${primaryColor};
                        --accent-color: ${accentColor};
                        --bg-soft: ${bgSoft};
                    }
                    ${DOCUMENT_STYLES}
                </style>
            </head>
            <body>
                <div class="header-box">
                    <div class="brand-left">
                        ${logoBase64 ? `<img src="${logoBase64}" class="brand-logo" alt="Logo" />` : ''}
                        <div>
                            <h1 class="brand-title">PORTAL KAMPUS 2026</h1>
                            <div class="brand-sub">BUKU PANDUAN PENGGUNA ${siteTitle}</div>
                        </div>
                    </div>
                    <div class="brand-right-wrapper">
                        <div class="brand-right">
                            <div class="badge-pill">Dokumen Resmi</div>
                            <div>Diterbitkan: ${nowFormatted}</div>
                            <div>Politeknik LP3I</div>
                        </div>
                        ${qrBase64 ? `
                        <div class="qr-container">
                            <img src="${qrBase64}" class="qr-img" alt="QR Scan" />
                            <div class="qr-caption">Scan Verifikasi</div>
                        </div>
                        ` : ''}
                    </div>
                </div>

                <div class="doc-headline">
                    <h1>Panduan Lengkap Penggunaan Portal ${siteTitle}</h1>
                    <p>Dokumentasi resmi alur registrasi, panduan fitur, tata cara pengumpulan berkas/tugas, serta navigasi sistem portal.</p>
                </div>

                <div class="toc-box">
                    <div class="toc-title">Daftar Isi Panduan:</div>
                    <div class="toc-grid">
                        ${sections.map((s, i) => `
                            <div class="toc-item">
                                <span class="toc-dot"></span>
                                <span>${i + 1}. ${s.title}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                ${sectionsHtml}
                ${privacyHtml}
                ${updateHtml}

                <div class="footer-doc">
                    <div>© 2026 Politeknik LP3I — Portal Kampus 2026 (${site.toUpperCase()})</div>
                    <div>Dokumen Panduan Pengguna Resmi</div>
                </div>
            </body>
            </html>
        `;

        browser = await getBrowser();
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 20000 });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '12mm', right: '12mm', bottom: '15mm', left: '12mm' }
        });

        await browser.close();
        return pdfBuffer;
    } catch (err) {
        if (browser) {
            try { await browser.close(); } catch (_) {}
        }
        console.error('Error generating Panduan PDF:', err);
        throw err;
    }
}

/**
 * Generate PDF buffer for Ketentuan page
 */
export async function generateKetentuanPDF({ site = 'pkkmb', data = {} }) {
    let browser = null;
    try {
        const isPkkmb = site === 'pkkmb';
        const primaryColor = isPkkmb ? '#059669' : '#2563eb';
        const accentColor = '#f97316';
        const bgSoft = isPkkmb ? '#ecfdf5' : '#eff6ff';
        const siteTitle = isPkkmb ? 'PKKMB 2026' : 'POSE 2026';
        const logoBase64 = getSiteLogo(site);

        const sections = data.sections || [];

        // Generate QR Code with site logo
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://event.plb.ac.id/';
        const qrUrl = `${baseUrl.replace(/\/$/, '')}/${site}/ketentuan`;
        const qrBase64 = await generateQRCodeBase64(qrUrl, site);

        // Build Sections HTML
        const sectionsHtml = sections.map((sec, index) => {
            const subsectionsHtml = (sec.subsections || []).map((sub) => `
                <div class="subsection-item">
                    <h4 class="subsection-title">• ${sub.title}</h4>
                    <p class="subsection-content">${sub.content || ''}</p>
                </div>
            `).join('');

            const videosHtml = (sec.videos || []).map(vid => `
                <div class="video-info-box">
                    <span class="video-tag">Video Penjelasan</span>
                    <div>
                        <strong>${vid.title || 'Video Ketentuan'}:</strong>
                        <a href="https://www.youtube.com/watch?v=${vid.youtubeId}" class="video-link" target="_blank">
                            https://www.youtube.com/watch?v=${vid.youtubeId}
                        </a>
                    </div>
                </div>
            `).join('');

            return `
                <div class="section-card" id="sec-${index}">
                    <div class="section-header">
                        <div class="section-number">${index + 1}</div>
                        <h2 class="section-title">${sec.title}</h2>
                    </div>
                    <div class="section-content">${sec.content || ''}</div>
                    ${videosHtml}
                    ${subsectionsHtml ? `<div class="subsections-container">${subsectionsHtml}</div>` : ''}
                </div>
            `;
        }).join('');

        const nowFormatted = new Date().toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        const html = `
            <!DOCTYPE html>
            <html lang="id">
            <head>
                <meta charset="utf-8" />
                <title>Syarat & Ketentuan Resmi ${siteTitle}</title>
                <style>
                    :root {
                        --primary-color: ${primaryColor};
                        --accent-color: ${accentColor};
                        --bg-soft: ${bgSoft};
                    }
                    ${DOCUMENT_STYLES}
                </style>
            </head>
            <body>
                <div class="header-box">
                    <div class="brand-left">
                        ${logoBase64 ? `<img src="${logoBase64}" class="brand-logo" alt="Logo" />` : ''}
                        <div>
                            <h1 class="brand-title">PORTAL KAMPUS 2026</h1>
                            <div class="brand-sub">SYARAT & KETENTUAN RESMI ${siteTitle}</div>
                        </div>
                    </div>
                    <div class="brand-right-wrapper">
                        <div class="brand-right">
                            <div class="badge-pill">Dokumen Regulasi</div>
                            <div>Diterbitkan: ${nowFormatted}</div>
                            <div>Politeknik LP3I</div>
                        </div>
                        ${qrBase64 ? `
                        <div class="qr-container">
                            <img src="${qrBase64}" class="qr-img" alt="QR Scan" />
                            <div class="qr-caption">Scan Verifikasi</div>
                        </div>
                        ` : ''}
                    </div>
                </div>

                <div class="doc-headline">
                    <h1>Syarat, Regulasi, dan Ketentuan ${siteTitle}</h1>
                    <p>Bacalah dengan seksama aturan resmi, tata tertib kegiatan, prosedur registrasi, standar disiplin, serta petunjuk teknis perlombaan.</p>
                </div>

                <div class="toc-box">
                    <div class="toc-title">Daftar Bab Ketentuan & Regulasi:</div>
                    <div class="toc-grid">
                        ${sections.map((s, i) => `
                            <div class="toc-item">
                                <span class="toc-dot"></span>
                                <span>${i + 1}. ${s.title}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                ${sectionsHtml}

                <div class="footer-doc">
                    <div>© 2026 Politeknik LP3I — Portal Kampus 2026 (${site.toUpperCase()})</div>
                    <div>Dokumen Regulasi & Ketentuan Resmi</div>
                </div>
            </body>
            </html>
        `;

        browser = await getBrowser();
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 20000 });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '12mm', right: '12mm', bottom: '15mm', left: '12mm' }
        });

        await browser.close();
        return pdfBuffer;
    } catch (err) {
        if (browser) {
            try { await browser.close(); } catch (_) {}
        }
        console.error('Error generating Ketentuan PDF:', err);
        throw err;
    }
}
