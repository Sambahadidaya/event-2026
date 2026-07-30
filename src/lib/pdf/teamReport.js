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
 * Generate PDF Buffer for Team Lomba report using Puppeteer
 * @param {Object} params
 * @param {string} params.title - Laporan Title
 * @param {string} params.site - 'pose' | 'pkkmb'
 * @param {string} params.lombaName - Nama Lomba
 * @param {string} params.activeTab - 'pendaftar' | 'pengumpulan'
 * @param {Array<Object>} params.data - The data to print
 * @param {string} params.documentId - Document UUID from DB
 * @param {string} params.documentCode - Document code (e.g., RPT-2026-XXXXXX)
 * @param {string} params.printedBy - Name of the admin printing
 * @returns {Promise<Buffer>} PDF Buffer
 */
export async function generateTeamReportPDF({
    title = 'Laporan Registrasi Tim Lomba',
    site = 'pose',
    lombaName = 'Semua Lomba',
    activeTab = 'pendaftar',
    data = [],
    pengumpulanData = [],
    documentId = '',
    documentCode = '',
    printedBy = 'PJ Lomba'
}) {
    let browser = null;
    try {
        const verifyUrl = generateVerifyUrl(site, documentId);
        const qrBase64 = documentId ? await generateQRCodeBase64(verifyUrl, site) : '';
        const logoBase64 = getLogoBase64(site);

        const totalTeam = data.length;
        const totalPeserta = data.reduce((sum, item) => sum + (item.peserta?.length || 0), 0);

        let contentHtml = '';

        if (activeTab === 'pendaftar') {
            // TABEL 1: Tabel Team
            const teamColumns = ['No', 'Nama Team', 'Jumlah Anggota', 'Status Verifikasi', 'Kode Team', 'Tanggal Daftar'];
            const teamRowsHtml = data.map((item, idx) => {
                const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
                const statusStr = item.verivikasi === true ? 'Valid' : item.verivikasi === false ? 'Ditolak' : 'Pending';
                const statusClass = item.verivikasi === true ? 'status-valid' : item.verivikasi === false ? 'status-rejected' : 'status-pending';

                return `
                    <tr>
                        <td style="text-align: center;">${idx + 1}</td>
                        <td><strong>${item.title || '-'}</strong></td>
                        <td style="text-align: center;">${item.team_members?.length || 0} Orang</td>
                        <td style="text-align: center;"><span class="badge ${statusClass}">${statusStr}</span></td>
                        <td style="font-family: monospace; text-align: center;">${item.kode_form || '-'}</td>
                        <td style="text-align: center;">${dateStr}</td>
                    </tr>
                `;
            }).join('');

            const teamHeadersHtml = teamColumns.map(col => `<th>${col}</th>`).join('');

            const tableTeamHtml = `
                <div style="page-break-inside: avoid;">
                    <h3 style="font-size: 14px; font-weight: 800; color: #2563eb; text-transform: uppercase; margin-bottom: 8px; border-bottom: 2px solid #cbd5e1; padding-bottom: 4px;">
                        Tabel Utama - Daftar Team
                    </h3>
                    <table class="table-details">
                        <thead>
                            <tr>
                                ${teamHeadersHtml}
                            </tr>
                        </thead>
                        <tbody>
                            ${teamRowsHtml ? teamRowsHtml : `<tr><td colSpan="${teamColumns.length}" style="text-align: center; color: #64748b;">Tidak ada data tim ditemukan.</td></tr>`}
                        </tbody>
                    </table>
                </div>
            `;

            // TABEL 2: Tabel Peserta perkategori
            const categories = ['Mahasiswa LP3I', 'Siswa', 'Dosen', 'Umum'];
            const kategoriTablesHtml = categories.map(cat => {
                const teamWithCatPeserta = data.map(team => {
                    const catPeserta = (team.peserta || []).filter(p => {
                        const pk = (p.kategori || '').toLowerCase().trim();
                        const ck = cat.toLowerCase().trim();
                        if (ck === 'mahasiswa lp3i') {
                            return pk === 'mahasiswa lp3i';
                        }
                        return pk === ck;
                    });
                    return {
                        ...team,
                        catPeserta
                    };
                }).filter(t => t.catPeserta.length > 0);

                if (teamWithCatPeserta.length === 0) return '';

                let headers = [];
                if (cat === 'Mahasiswa LP3I') {
                    headers = ['No', 'Nama Team', 'Kode Team', 'Nama', 'Kategori', 'NIM', 'Kampus', 'Semester', 'Prodi', 'Email/WA', 'Bukti Bayar', 'Status Bayar', 'Metode Bayar'];
                } else if (cat === 'Siswa') {
                    headers = ['No', 'Nama Team', 'Kode Team', 'Nama', 'Kategori', 'Sekolah', 'Jurusan', 'Kode', 'Email/WA', 'Bukti Bayar', 'Status Bayar', 'Metode Bayar'];
                } else if (cat === 'Dosen') {
                    headers = ['No', 'Nama Team', 'Kode Team', 'Nama', 'Kampus', 'Email/WA', 'Bukti Bayar', 'Status Bayar', 'Metode Bayar'];
                } else { // Umum
                    headers = ['No', 'Nama Team', 'Kode Team', 'Nama', 'Kampus', 'Prodi', 'Email/WA', 'Bukti Bayar', 'Status Bayar', 'Metode Bayar'];
                }

                const headerCols = headers.map(h => `<th>${h}</th>`).join('');
                let rowIdx = 1;
                const rows = [];

                teamWithCatPeserta.forEach(team => {
                    const pesertas = team.catPeserta;
                    const n = pesertas.length;

                    pesertas.forEach((p, pIdx) => {
                        const isFirst = pIdx === 0;
                        const rowspanHtml = isFirst ? ` rowspan="${n}"` : '';

                        const teamTitleCell = isFirst ? `<td${rowspanHtml} style="font-weight: bold; background: #fff;">${team.title || '-'}</td>` : '';
                        const teamCodeCell = isFirst ? `<td${rowspanHtml} style="font-family: monospace; text-align: center; background: #fff;">${team.kode_form || '-'}</td>` : '';

                        const linkBayarHtml = p.bukti_bayar 
                            ? `<a href="${p.bukti_bayar}" target="_blank" style="color: #2563eb; text-decoration: underline; font-weight: bold;">Lihat Link</a>`
                            : '-';

                        const statusClass = (p.status_pembayaran || '').toLowerCase() === 'pending'
                            ? 'status-pending'
                            : (p.status_pembayaran || '').toLowerCase() === 'ditolak'
                            ? 'status-rejected'
                            : 'status-valid';

                        const statusStr = p.status_pembayaran || 'Pending';

                        let cells = '';
                        if (cat === 'Mahasiswa LP3I') {
                            cells = `
                                ${teamTitleCell}
                                ${teamCodeCell}
                                <td>${p.nama || '-'}</td>
                                <td style="text-align: center;">${p.kategori || '-'}</td>
                                <td style="font-family: monospace;">${p.nim || '-'}</td>
                                <td>${p.kampus || '-'}</td>
                                <td style="text-align: center;">Sem. ${p.semester || '-'}</td>
                                <td>${p.prodi || '-'}</td>
                                <td>${p.email_wa || '-'}</td>
                                <td style="text-align: center;">${linkBayarHtml}</td>
                                <td style="text-align: center;"><span class="badge ${statusClass}">${statusStr}</span></td>
                                <td style="text-align: center;">${p.metode_pembayaran || '-'}</td>
                            `;
                        } else if (cat === 'Siswa') {
                            cells = `
                                ${teamTitleCell}
                                ${teamCodeCell}
                                <td>${p.nama || '-'}</td>
                                <td style="text-align: center;">${p.kategori || '-'}</td>
                                <td>${p.kampus || '-'}</td>
                                <td>${p.prodi || '-'}</td>
                                <td style="font-family: monospace;">${p.nim || '-'}</td>
                                <td>${p.email_wa || '-'}</td>
                                <td style="text-align: center;">${linkBayarHtml}</td>
                                <td style="text-align: center;"><span class="badge ${statusClass}">${statusStr}</span></td>
                                <td style="text-align: center;">${p.metode_pembayaran || '-'}</td>
                            `;
                        } else if (cat === 'Dosen') {
                            cells = `
                                ${teamTitleCell}
                                ${teamCodeCell}
                                <td>${p.nama || '-'}</td>
                                <td>${p.kampus || '-'}</td>
                                <td>${p.email_wa || '-'}</td>
                                <td style="text-align: center;">${linkBayarHtml}</td>
                                <td style="text-align: center;"><span class="badge ${statusClass}">${statusStr}</span></td>
                                <td style="text-align: center;">${p.metode_pembayaran || '-'}</td>
                            `;
                        } else { // Umum
                            cells = `
                                ${teamTitleCell}
                                ${teamCodeCell}
                                <td>${p.nama || '-'}</td>
                                <td>${p.kampus || '-'}</td>
                                <td>${p.prodi || '-'}</td>
                                <td>${p.email_wa || '-'}</td>
                                <td style="text-align: center;">${linkBayarHtml}</td>
                                <td style="text-align: center;"><span class="badge ${statusClass}">${statusStr}</span></td>
                                <td style="text-align: center;">${p.metode_pembayaran || '-'}</td>
                            `;
                        }

                        rows.push(`
                            <tr>
                                <td style="text-align: center; background: #fff;">${rowIdx++}</td>
                                ${cells}
                            </tr>
                        `);
                    });
                });

                return `
                    <div style="margin-top: 30px; page-break-inside: avoid;">
                        <h3 style="font-size: 14px; font-weight: 800; color: #2563eb; text-transform: uppercase; margin-bottom: 8px; border-bottom: 2px solid #cbd5e1; padding-bottom: 4px;">
                            Tabel Detail Peserta - Kategori ${cat}
                        </h3>
                        <table class="table-details">
                            <thead>
                                <tr>
                                    ${headerCols}
                                </tr>
                            </thead>
                            <tbody>
                                ${rows.join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }).join('');

            contentHtml = tableTeamHtml + kategoriTablesHtml;

        } else {
            // TABEL 1: Tabel Ringkasan
            const summaryColumns = ['No', 'Nama Team', 'Lomba', 'Status Pengumpulan', 'Kode Team', 'Tanggal Submit'];
            const summaryRowsHtml = data.map((item, idx) => {
                const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
                const isSubmitted = !!item.hasSubmitted;
                const statusStr = isSubmitted ? 'Sudah Mengumpulkan' : 'Belum Mengumpulkan';
                const statusClass = isSubmitted ? 'status-valid' : 'status-pending';

                return `
                    <tr>
                        <td style="text-align: center;">${idx + 1}</td>
                        <td><strong>${item.title || '-'}</strong></td>
                        <td>${item.nama_lomba || lombaName || '-'}</td>
                        <td style="text-align: center;"><span class="badge ${statusClass}">${statusStr}</span></td>
                        <td style="font-family: monospace; text-align: center;">${item.kode_form || '-'}</td>
                        <td style="text-align: center;">${dateStr}</td>
                    </tr>
                `;
            }).join('');

            const summaryHeadersHtml = summaryColumns.map(col => `<th>${col}</th>`).join('');

            const tableSummaryHtml = `
                <div style="page-break-inside: avoid;">
                    <h3 style="font-size: 14px; font-weight: 800; color: #2563eb; text-transform: uppercase; margin-bottom: 8px; border-bottom: 2px solid #cbd5e1; padding-bottom: 4px;">
                        Tabel Ringkasan Pengumpulan
                    </h3>
                    <table class="table-details">
                        <thead>
                            <tr>
                                ${summaryHeadersHtml}
                            </tr>
                        </thead>
                        <tbody>
                            ${summaryRowsHtml ? summaryRowsHtml : `<tr><td colSpan="${summaryColumns.length}" style="text-align: center; color: #64748b;">Tidak ada data tim ditemukan.</td></tr>`}
                        </tbody>
                    </table>
                </div>
            `;

            // TABEL 2: Tabel Detail Pengumpulan
            const allowedTeamIds = new Set(data.map(t => t.id));
            const filteredSubmissions = (pengumpulanData || []).filter(sub => allowedTeamIds.has(sub.team_id));

            const submissionsRowsHtml = filteredSubmissions.map((sub, idx) => {
                const dateStr = sub.created_at ? new Date(sub.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
                const fileLinkHtml = sub.file_link
                    ? `<a href="${sub.file_link}" target="_blank" style="color: #2563eb; text-decoration: underline; font-weight: bold;">Lihat Link</a>`
                    : '-';

                return `
                    <tr>
                        <td style="text-align: center;">${idx + 1}</td>
                        <td><strong>${sub.team?.title || '-'}</strong></td>
                        <td>${sub.form_pengumpulan?.form_register?.nama_lomba || '-'}</td>
                        <td style="font-family: monospace; text-align: center;">${sub.team?.kode_form || '-'}</td>
                        <td style="text-align: center;">${fileLinkHtml}</td>
                        <td style="text-align: center;">${dateStr}</td>
                    </tr>
                `;
            }).join('');

            const submissionsColumns = ['No', 'Nama Team', 'Lomba', 'Kode Team', 'File/Link Pengumpulan', 'Tanggal Submit'];
            const submissionsHeadersHtml = submissionsColumns.map(col => `<th>${col}</th>`).join('');

            const tableSubmissionsHtml = `
                <div style="margin-top: 30px; page-break-inside: avoid;">
                    <h3 style="font-size: 14px; font-weight: 800; color: #2563eb; text-transform: uppercase; margin-bottom: 8px; border-bottom: 2px solid #cbd5e1; padding-bottom: 4px;">
                        Tabel Detail Tugas/Karya Pengumpulan
                    </h3>
                    <table class="table-details">
                        <thead>
                            <tr>
                                ${submissionsHeadersHtml}
                            </tr>
                        </thead>
                        <tbody>
                            ${submissionsRowsHtml ? submissionsRowsHtml : `<tr><td colSpan="${submissionsColumns.length}" style="text-align: center; color: #64748b;">Belum ada pengumpulan tugas/karya ditemukan.</td></tr>`}
                        </tbody>
                    </table>
                </div>
            `;

            contentHtml = tableSummaryHtml + tableSubmissionsHtml;
        }

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
                    .badge {
                        display: inline-block;
                        padding: 2px 6px;
                        border-radius: 4px;
                        font-size: 8px;
                        font-weight: 700;
                        text-transform: uppercase;
                    }
                    .status-valid { background-color: #dcfce7; color: #166534; }
                    .status-rejected { background-color: #ffe4e6; color: #9f1239; }
                    .status-pending { background-color: #fef3c7; color: #92400e; }
                    
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
                                <div class="subbrand">LAPORAN TIM LOMBA - ${site.toUpperCase()}</div>
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
                            <label>Kategori Laporan</label>
                            <span>${activeTab === 'pendaftar' ? 'Daftar Pendaftar (Registrasi)' : 'Daftar Pengumpulan (Karya/Tugas)'}</span>
                        </div>
                        <div class="meta-item">
                            <label>Dicetak Oleh</label>
                            <span>${printedBy}</span>
                            <div style="font-size: 9px; color: #64748b; margin-top: 4px;">Jumlah Team: <strong>${totalTeam}</strong></div>
                        </div>
                        <div class="meta-item">
                            <label>Tanggal Cetak</label>
                            <span>${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            <div style="font-size: 9px; color: #64748b; margin-top: 4px;">Jumlah Peserta: <strong>${totalPeserta}</strong></div>
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
        console.error('Error generating team report PDF with Puppeteer:', err);
        throw err;
    }
}
