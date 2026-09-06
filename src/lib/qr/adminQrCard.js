import QRCode from 'qrcode';
import logoPkkmb from '@/assets/logo_pkkmb/icon-logo.png';
import logoPose from '@/assets/logo_pose/icon-logo2.png';
import logoPoltek from '@/assets/icon-poltek.png';

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
 * Download Kartu QR Panitia sebagai PNG
 * @param {Object} params
 * @param {string} params.nama - Nama Admin
 * @param {string} params.email - Email Admin
 * @param {string} params.qrcode - Isi data QR Code
 * @param {string} params.role - Role Admin untuk menentukan logo ('admin_pkkmb' / 'admin_pose' / 'super_admin')
 */
export async function downloadAdminQRCard({ nama = '', email = '', qrcode = '', role = '' }) {
    if (!qrcode) {
        throw new Error('QR Code data tidak tersedia untuk admin ini.');
    }

    // Tentukan URL data QR (URL website panitia + token qrcode)
    let qrData = qrcode;
    if (!qrcode.startsWith('http://') && !qrcode.startsWith('https://')) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://event.plb.ac.id';
        const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
        qrData = `${cleanBaseUrl}/panitia/login?token=${qrcode}`;
    }

    // 1. Tentukan Logo sesuai Role
    let logoSource = logoPoltek;
    if (role === 'super_admin' || role?.startsWith('admin_pkkmb')) {
        logoSource = logoPkkmb;
    } else if (role?.startsWith('admin_pose')) {
        logoSource = logoPose;
    }

    const logoImg = await loadImageAsync(logoSource);

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

    // 3. Tambahkan Logo di Tengah QR Code (seperti lib/qr/qrcode.js)
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

    // 5. Bagian Atas: Email Panitia
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const cleanEmail = email || '-';
    if (cleanEmail.length > 36) {
        ctx.font = '10px Arial';
    } else if (cleanEmail.length > 28) {
        ctx.font = '11px Arial';
    } else {
        ctx.font = 'bold 12px Arial';
    }
    ctx.fillText(cleanEmail, cardWidth / 2, 20);

    // Garis pemisah bawah email
    ctx.beginPath();
    ctx.moveTo(45, 33);
    ctx.lineTo(cardWidth - 45, 33);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.stroke();

    // 6. Bagian Tengah: QR Code
    ctx.drawImage(qrCanvas, 20, 40, 300, 300);

    // 7. Bagian Bawah: Nama Panitia
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const cleanNama = (nama || 'Panitia').trim();
    if (cleanNama.length > 28) {
        ctx.font = 'bold 14px Arial';
    } else if (cleanNama.length > 20) {
        ctx.font = 'bold 16px Arial';
    } else {
        ctx.font = 'bold 18px Arial';
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
            
            // Nama file: dari kolom nama
            const filename = (nama || 'admin_qr').replace(/[/\\?%*:|"<>]/g, '').replace(/ /g, '_');
            a.download = `${filename}.png`;

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);
            resolve(true);
        }, 'image/png');
    });
}
