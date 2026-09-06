import QRCode from 'qrcode';
import logoPkkmb from '@/assets/logo_pkkmb/icon-logo.png';

/**
 * Fungsi helper untuk menggambar Rounded Rectangle pada Canvas 2D
 */
function roundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

/**
 * Helper untuk load image src secara async di browser
 */
function loadImageAsync(src) {
    return new Promise((resolve) => {
        if (!src) return resolve(null);
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = typeof src === 'object' && src.src ? src.src : src;
    });
}

/**
 * Download Kartu QR Peserta Anggota Kelompok PKKMB sebagai PNG
 * @param {Object} params
 * @param {string} params.memberId - ID Unik Anggota (kelompok_members.id)
 * @param {string} params.namaAnggota - Nama Peserta Anggota
 * @param {string} params.namaKelompok - Nama Kelompok
 */
export async function downloadPesertaQRCard({ memberId = '', namaAnggota = '', namaKelompok = '' }) {
    if (!memberId) {
        throw new Error('ID Anggota tidak tersedia untuk cetak QR.');
    }

    // Tentukan URL data QR (URL website bypass verifikasi langsung ke dashboard peserta)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://event.plb.ac.id';
    const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
    const qrData = `${cleanBaseUrl}/pkkmb/dashboard/${memberId}`;

    // 1. Logo PKKMB di tengah QR Code
    const logoImg = await loadImageAsync(logoPkkmb);

    // 2. Generate QR Code ke Canvas Sementara
    const qrSize = 300;
    const qrCanvas = document.createElement('canvas');
    qrCanvas.width = qrSize;
    qrCanvas.height = qrSize;

    await QRCode.toCanvas(qrCanvas, qrData, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: qrSize,
        color: {
            dark: '#000000',
            light: '#FFFFFF'
        }
    });

    const qrCtx = qrCanvas.getContext('2d');

    // 3. Tambahkan Logo di Tengah QR Code
    if (logoImg) {
        const logoSize = Math.floor(qrSize * 0.22); // 22% dari ukuran QR
        const center = Math.floor((qrSize - logoSize) / 2);
        const padding = 5;

        // Background putih untuk logo
        qrCtx.fillStyle = '#FFFFFF';
        roundedRect(qrCtx, center - padding, center - padding, logoSize + padding * 2, logoSize + padding * 2, 6);
        qrCtx.fill();

        // Gambar Logo
        qrCtx.drawImage(logoImg, center, center, logoSize, logoSize);
    }

    // 4. Buat Canvas Utama untuk Kartu QR
    const cardWidth = 340;
    const cardHeight = 395;
    const radius = 20;

    const mainCanvas = document.createElement('canvas');
    mainCanvas.width = cardWidth;
    mainCanvas.height = cardHeight;
    const ctx = mainCanvas.getContext('2d');

    // Background kartu dengan sudut melengkung
    roundedRect(ctx, 0, 0, cardWidth, cardHeight, radius);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    // Border tipis kartu
    ctx.strokeStyle = '#E5E5E5';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Clip agar konten tetap di dalam sudut melengkung
    ctx.save();
    roundedRect(ctx, 0, 0, cardWidth, cardHeight, radius);
    ctx.clip();

    // 5. Bagian Atas: Nama Kelompok
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const cleanKelompok = (namaKelompok || 'Kelompok PKKMB').trim();
    if (cleanKelompok.length > 32) {
        ctx.font = 'bold 11px Arial';
    } else if (cleanKelompok.length > 24) {
        ctx.font = 'bold 12px Arial';
    } else {
        ctx.font = 'bold 13px Arial';
    }
    ctx.fillText(cleanKelompok.toUpperCase(), cardWidth / 2, 20);

    // Garis pemisah bawah nama kelompok
    ctx.beginPath();
    ctx.moveTo(45, 33);
    ctx.lineTo(cardWidth - 45, 33);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.stroke();

    // 6. Bagian Tengah: QR Code
    ctx.drawImage(qrCanvas, 20, 40, 300, 300);

    // 7. Bagian Bawah: Nama Anggota
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const cleanNama = (namaAnggota || 'Peserta').trim();
    if (cleanNama.length > 28) {
        ctx.font = 'bold 13px Arial';
    } else if (cleanNama.length > 20) {
        ctx.font = 'bold 15px Arial';
    } else {
        ctx.font = 'bold 17px Arial';
    }

    ctx.fillText(cleanNama, cardWidth / 2, 365);

    // Restore clip state
    ctx.restore();

    // 8. Trigger Download Otomatis PNG
    return new Promise((resolve, reject) => {
        mainCanvas.toBlob((blob) => {
            if (!blob) {
                return reject(new Error('Gagal mengekspor gambar QR code'));
            }

            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;

            // Nama file: dari kolom nama_anggota
            const filename = (namaAnggota || 'peserta_qr').replace(/[/\\?%*:|"<>]/g, '').replace(/ /g, '_');
            a.download = `${filename}.png`;

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);
            resolve(true);
        }, 'image/png');
    });
}
