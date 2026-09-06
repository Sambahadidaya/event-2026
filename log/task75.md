fokus ke halaman panitia tepatnya dibagian admin/status. dihalaman itu saya ingin ada kolom baru yang posisinya diantara kolom Terakhir login dan aksi yaitu kolom cetak qr yang datanya diambil dari tabel admins kolom nama, email, dan qrcode dan ketika menekan tombol cetak qr itu otomatis akan terdownload gambar png dengan nama filenya dari kolom nama dan isi qrnya dari kolom qrcode terus untuk icon atau logo didalam qrnya seperti file lib/qr/qrcode.js terus didalam gambar ini dibawah qrnya ada nama panitianya dan diatas qrnya ada email panitianya yang diambil dari kolom email di tabel admins . untuk style qrnya saya sudah experimen diproject atau folder terpisah, yang  codingannya seperti ini
```js
import QR from "qr-code-styling/lib/qr-code-styling.common.js";
import {
    writeFileSync,
    readFileSync,
    mkdirSync,
    existsSync,
} from "fs";

import { JSDOM } from "jsdom";
import {
    createCanvas,
    loadImage,
} from "canvas";

const { QRCodeStyling } = QR;

// ===============================
// Fungsi Rounded Rectangle
// ===============================
function roundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(
        x + width,
        y + height,
        x + width - radius,
        y + height
    );
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(
        x,
        y + height,
        x,
        y + height - radius
    );
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}



// ===============================
// Membaca data peserta
// ===============================
const peserta = JSON.parse(
    readFileSync("./data/pkkmb/token.json", "utf8")
);

// ===============================
// Membuat folder output
// ===============================
if (!existsSync("./qr/pkkmb3")) {
    mkdirSync("./qr/pkkmb3", { recursive: true });
}


// Tambahkan URL website panitia kamu di atas
const BASE_URL = "https://event.plb.ac.id/panitia/login"; // Sesuaikan dengan URL aslinya

// ===============================
// Generate QR
// ===============================
for (const [index, item] of peserta.entries()) {
    const qrCode = new QRCodeStyling({
        jsdom: JSDOM,
        nodeCanvas: {
            createCanvas,
            loadImage,
        },
        width: 300,
        height: 300,

        // UBAH BAGIAN INI: Gabungkan URL dengan token
        data: `${BASE_URL}?token=${item.token}`,

        image: "./image/pkkmb.png",
        qrOptions: {
            errorCorrectionLevel: "H",
        },

        dotsOptions: {
            color: "#000000",
            type: "rounded",
        },

        cornersSquareOptions: {
            color: "#000000",
            type: "extra-rounded",
        },

        backgroundOptions: {
            color: "#FFFFFF",
        },

        imageOptions: {
            imageSize: 0.20,
            margin: 5,
        },
    });

    // ===============================
    // Generate QR
    // ===============================
    const rawData = await qrCode.getRawData("png");
    const qrImage = await loadImage(Buffer.from(rawData));

    // ===============================
    // Canvas
    // ===============================
    const canvas = createCanvas(340, 390);
    const ctx = canvas.getContext("2d");

    const radius = 20;

    // Background dengan sudut melengkung
    roundedRect(ctx, 0, 0, canvas.width, canvas.height, radius);

    ctx.fillStyle = "#FFFFFF";
    ctx.fill();

    // Border tipis
    ctx.strokeStyle = "#E5E5E5";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Clip agar isi mengikuti radius
    ctx.save();
    roundedRect(ctx, 0, 0, canvas.width, canvas.height, radius);
    ctx.clip();

    // ===============================
    // Nomor
    // ===============================
    ctx.fillStyle = "#000000";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(
        `${String(index + 1).padStart(2, "0")}`,
        canvas.width / 2,
        20
    );

    // Garis bawah nomor
    ctx.beginPath();
    ctx.moveTo(95, 35);
    ctx.lineTo(245, 35);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(0,0,0,0.15)";
    ctx.stroke();

    // ===============================
    // QR
    // ===============================
    ctx.drawImage(
        qrImage,
        20,
        35,
        300,
        300
    );

    // ===============================
    // Nama
    // ===============================
    ctx.fillStyle = "#000000";
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const nama = item.nama.replace(/ /g, "_");

    ctx.fillText(
        nama,
        canvas.width / 2,
        360
    );

    // Selesai clip
    ctx.restore();

    // ===============================
    // Simpan
    // ===============================
    writeFileSync(
        `./qr/pkkmb3/${nama}.png`,
        canvas.toBuffer("image/png")
    );

    console.log(
        `✔ Berhasil membuat QR NO.${String(index + 1).padStart(2, "0")} - ${item.nama}`
    );
}

console.log("\nSemua QR berhasil dibuat.");
```