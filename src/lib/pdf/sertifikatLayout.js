export function buildQRTextPartisipasi({ nomorSert, nama }) {
    return [
        `No: ${nomorSert}`,
        `Nama: ${nama}`,
        `POSE NASIONAL 2026`,
        `Ket: Partisipan`
    ].join('\n');
}

export function buildQRTextPeserta({ nomorSert, namaTeam }) {
    return [
        `No: ${nomorSert}`,
        `Tim: ${namaTeam}`,
        `POSE NASIONAL 2026`,
        `Ket: Peserta`
    ].join('\n');
}

export function buildQRTextJuara({ nomorSert, namaTeam, peringkat }) {
    return [
        `No: ${nomorSert}`,
        `Tim: ${namaTeam}`,
        `POSE NASIONAL 2026`,
        `Ket: Juara ${peringkat}`
    ].join('\n');
}

export function buildPartisipasiHTML({ nomorSert, nama, qrBase64, bgBase64 }) {
    return `
    <div class="cert-page" style="background-image: url('${bgBase64}');">
        <!-- Nomor Sertifikat -->
        <div class="nomor-sertifikat" style="top: 280px;">
            Nomor : ${nomorSert}
        </div>

        <!-- Nama Peserta -->
        <div class="nama-holder" style="top: 420px;">
            <div class="nama-peserta">${nama}</div>
        </div>

        <!-- QR Code -->
        ${qrBase64 ? `
        <div class="qr-holder" style="bottom: 40px;">
            <img src="${qrBase64}" class="qr-img" alt="QR Verifikasi" />
        </div>
        ` : ''}
    </div>
    `;
}

export function buildPesertaHTML({ nomorSert, namaTeam, namaLomba, qrBase64, bgBase64 }) {
    const formattedLomba = namaLomba ? namaLomba.toUpperCase() : 'LOMBA POSE';
    return `
    <div class="cert-page" style="background-image: url('${bgBase64}');">
        <!-- Nomor Sertifikat -->
        <div class="nomor-sertifikat" style="top: 230px;">
            Nomor : ${nomorSert}
        </div>

        <!-- Nama Team -->
        <div class="nama-holder" style="top: 290px;">
            <div class="nama-peserta">${namaTeam}</div>
        </div>

        <!-- Nama Lomba -->
        <div class="nama-lomba" style="top: 420px;">
            ${formattedLomba}
        </div>

        <!-- Deskripsi -->
        <div class="deskripsi-text deskripsi-3baris" style="top: 460px;">
            Atas partisipasi aktif dan semangat kompetisi yang luar biasa sebagai Peserta Lomba <strong>${namaLomba}</strong> dalam kegiatan POSE NASIONAL 2026. Terima kasih atas dedikasi, kerja keras, dan sportivitas yang telah ditunjukkan.
        </div>

        <!-- QR Code -->
        ${qrBase64 ? `
        <div class="qr-holder" style="bottom: 40px;">
            <img src="${qrBase64}" class="qr-img" alt="QR Verifikasi" />
        </div>
        ` : ''}
    </div>
    `;
}

export function buildJuaraHTML({ nomorSert, namaTeam, namaLomba, peringkat, qrBase64, bgBase64 }) {
    const formattedLomba = namaLomba ? namaLomba.toUpperCase() : 'LOMBA POSE';
    return `
    <div class="cert-page" style="background-image: url('${bgBase64}');">
        <!-- Nomor Sertifikat -->
        <div class="nomor-sertifikat" style="top: 230px;">
            Nomor : ${nomorSert}
        </div>

        <!-- Nama Team -->
        <div class="nama-holder" style="top: 290px;">
            <div class="nama-peserta">${namaTeam}</div>
        </div>

        <!-- Label Juara -->
        <div class="label-juara" style="top: 385px;">
            JUARA ${peringkat}
        </div>

        <!-- Nama Lomba -->
        <div class="nama-lomba" style="top: 420px;">
            ${formattedLomba}
        </div>

        <!-- Deskripsi -->
        <div class="deskripsi-text deskripsi-3baris" style="top: 460px;">
            "Atas prestasi luar biasa sebagai <strong>Juara ${peringkat}</strong> dalam Lomba <strong>${namaLomba}</strong> pada kegiatan POSE NASIONAL 2026. Terima kasih atas dedikasi, kompetensi, dan semangat juang tinggi yang telah ditunjukkan."
        </div>

        <!-- QR Code -->
        ${qrBase64 ? `
        <div class="qr-holder" style="bottom: 40px;">
            <img src="${qrBase64}" class="qr-img" alt="QR Verifikasi" />
        </div>
        ` : ''}
    </div>
    `;
}

export function buildNilaiHTML({ namaJuri, nilaiAkhir, detailKriteria = [], kritik = '', saran = '', bgBase64 }) {
    return `
    <div class="cert-page" style="background-image: url('${bgBase64}');">
        <!-- Box Nama Juri & Nilai Akhir -->
        <div class="juri-box">
            <div class="juri-info">
                <span class="juri-label">NAMA JURI :</span>
                <span class="juri-name">${(namaJuri || 'JURI PENILAI').toUpperCase()}</span>
            </div>
            <div class="juri-score-pill">
                ${nilaiAkhir !== null && nilaiAkhir !== undefined ? Number(nilaiAkhir).toFixed(2) : '-'}
            </div>
        </div>

        <!-- Grid Rincian Kriteria Penilaian -->
        <div class="criteria-grid-container">
            <div class="criteria-grid">
                ${detailKriteria.map(k => `
                    <div class="criteria-card">
                        <div class="criteria-left">
                            <span class="criteria-title">${k.judul_nilai || '-'}</span>
                            <span class="criteria-bobot">Bobot Kriteria : ${k.bobot_nilai || 0}%</span>
                        </div>
                        <div class="criteria-score">${k.nilai || 0}/100</div>
                    </div>
                `).join('')}
            </div>
        </div>

        <!-- Kritik & Saran -->
        <div class="feedback-container">
            <div class="feedback-col">
                <div class="feedback-text">${kritik || '-'}</div>
            </div>
            <div class="feedback-col">
                <div class="feedback-text">${saran || '-'}</div>
            </div>
        </div>
    </div>
    `;
}

export function getSertifikatCSS() {
    return `
        @import url('https://fonts.googleapis.com/css2?family=Alex+Brush&family=Open+Sans:ital,wght@0,400;0,600;0,700;1,400;1,700&family=Poppins:ital,wght@0,400;0,600;0,700;1,400;1,700&family=Playfair+Display:ital,wght@0,700;1,700&display=swap');

        @page {
            size: 297mm 210mm landscape;
            margin: 0;
        }

        * {
            box-sizing: border-box;
            -webkit-font-smoothing: antialiased;
        }

        html, body {
            margin: 0;
            padding: 0;
            width: 297mm;
            height: 210mm;
            background: #f8fafc;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .cert-page {
            width: 297mm;
            height: 210mm;
            position: relative;
            page-break-after: always;
            overflow: hidden;
            background-size: 100% 100%;
            background-repeat: no-repeat;
        }

        .cert-page:last-child {
            page-break-after: avoid;
        }

        /* 1. Nomor Sertifikat */
        .nomor-sertifikat {
            position: absolute;
            left: 0;
            right: 0;
            text-align: center;
            font-family: 'Poppins', sans-serif;
            font-size: 16px;
            font-weight: 400;
            color: #000000;
            letter-spacing: 0.5px;
        }

        /* 2. Nama Peserta / Nama Tim */
        .nama-holder {
            position: absolute;
            left: 50mm;
            right: 50mm;
            text-align: center;
        }

        .nama-peserta {
            font-family: 'Alex Brush', cursive;
            font-size: 85px; /* Increased */
            color: #c79b4c;
            line-height: 1.1;
            display: inline-block;
        }

        /* 3. Label Juara */
        .label-juara {
            position: absolute;
            left: 0;
            right: 0;
            text-align: center;
            font-family: 'Poppins', sans-serif;
            font-weight: 700;
            font-size: 23.8px;
            color: #031938;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        /* 4. Nama Lomba */
        .nama-lomba {
            position: absolute;
            left: 20mm;
            right: 20mm;
            text-align: center;
            font-family: 'The Seasons', 'Playfair Display', Georgia, serif;
            font-weight: 700;
            font-size: 26px; /* Increased */
            color: #000000;
            text-transform: uppercase;
            letter-spacing: 0.8px;
        }

        /* 5. Deskripsi */
        .deskripsi-text {
            position: absolute;
            left: 42mm;
            right: 42mm;
            text-align: center;
            font-family: 'Poppins', sans-serif;
            font-style: italic;
            font-size: 16px; /* Increased */
            color: #000000;
            line-height: 1.5;
        }

        .deskripsi-3baris {
            left: 65mm;
            right: 65mm; /* More constrained horizontally to force 3 lines */
        }

        .deskripsi-text strong {
            font-weight: 700;
        }

        /* 6. QR Code */
        .qr-holder {
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            width: 110px; /* Increased */
            height: 110px; /* Increased */
        }

        .qr-img {
            width: 110px;
            height: 110px;
            display: block;
            border-radius: 4px;
        }

        /* ================= DETAIL NILAI PAGE STYLES ================= */
        .juri-box {
            position: absolute;
            left: 64px;
            right: 64px;
            top: 145px;
            height: 64px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 24px;
        }

        .juri-info {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }

        .juri-label {
            font-family: 'Open Sans', sans-serif;
            font-size: 13px;
            font-weight: 600;
            color: #031938;
            letter-spacing: 0.5px;
        }

        .juri-name {
            font-family: 'Open Sans', sans-serif;
            font-size: 15px;
            font-weight: 700;
            color: #031938;
        }

        .juri-score-pill {
            background: #ffffff;
            color: #031938;
            border: 1.5px solid #031938;
            border-radius: 12px;
            padding: 4px 28px;
            font-family: 'Open Sans', sans-serif;
            font-weight: 800;
            font-size: 26px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .criteria-grid-container {
            position: absolute;
            left: 100px;
            right: 100px;
            top: 240px;
            height: 350px;
        }

        .criteria-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px; /* Increased gap */
        }

        .criteria-card {
            background-color: #031938;
            border-radius: 15px;
            padding: 12px 20px; /* Increased padding */
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: #ffffff;
            min-height: 60px; /* Slightly taller */
        }

        .criteria-left {
            display: flex;
            flex-direction: column;
            gap: 4px; /* Space between title and bobot */
        }

        .criteria-title {
            font-family: 'Open Sans', sans-serif;
            font-size: 14px; /* Increased */
            font-weight: 700;
            color: #ffffff;
        }

        .criteria-bobot {
            font-family: 'Open Sans', sans-serif;
            font-size: 12px; /* Increased */
            font-weight: 400;
            color: #cbd5e1;
        }

        .criteria-score {
            font-family: 'Open Sans', sans-serif;
            font-size: 16px; /* Increased */
            font-weight: 700;
            color: #ffffff;
            letter-spacing: 0.5px;
        }

        .feedback-container {
            position: absolute;
            left: 130px; /* Adjusted */
            right: 130px; /* Adjusted */
            top: 615px;
            height: 110px;
            display: flex;
            gap: 30px;
            padding: 0 15px;
        }

        .feedback-col {
            flex: 1;
            overflow: hidden;
        }

        .feedback-text {
            font-family: 'Open Sans', sans-serif;
            font-size: 13px; /* Slightly larger */
            color: #1e293b;
            line-height: 1.4;
        }
    `;
}
