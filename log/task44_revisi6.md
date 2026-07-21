fokus ke halaman login, ada revisi berikut ;
Modifikasi page.js untuk Menangkap URL Parameter
Karena sekarang kita melempar URL seperti .../login?token=0dfaf5..., halaman login perlu secara otomatis membaca parameter token saat website baru dimuat, lalu memprosesnya langsung ke tahap PIN.

Tambahkan useSearchParams dari next/navigation dan sebuah useEffect baru di file page.js:

```JavaScript
'use client';

// 1. Tambahkan useSearchParams pada import
import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; 
import { loginAdmin, checkQR } from '@/api/supabase/admin/auth';
// ... import lainnya ...

export default function PanitiaLogin() {
    // 2. Inisialisasi useSearchParams
    const searchParams = useSearchParams(); 
    const router = useRouter();

    // ... state bawaan kamu biarkan sama ...
    const [loginMethod, setLoginMethod] = useState('email');
    const [showPinModal, setShowPinModal] = useState(false);
    // ...

    // 3. Tambahkan useEffect untuk otomatis mendeteksi parameter token dari Google Lens
    useEffect(() => {
        const tokenFromUrl = searchParams.get('token');
        if (tokenFromUrl) {
            // Jika ada parameter token di URL, langsung proses tanpa perlu buka kamera
            handleQRCapture(tokenFromUrl);
        }
    }, [searchParams]);

    // 4. Modifikasi handleQRCapture agar bisa memfilter URL penuh atau token mentah
    const handleQRCapture = async (result) => {
        if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
            await html5QrCodeRef.current.stop().catch(console.error);
        }
        setCameraActive(false);
        setShowScanner(false);
        setLoading(true);
        setError(null);

        // EKSTRAKSI TOKEN: 
        // Berjaga-jaga jika panitia menggunakan fitur scan bawaan website
        // karena isi QR sekarang adalah URL lengkap, kita harus ambil bagian '?token=' nya saja
        let finalToken = result;
        try {
            if (result.startsWith('http')) {
                const url = new URL(result);
                const extractedToken = url.searchParams.get('token');
                if (extractedToken) {
                    finalToken = extractedToken;
                }
            }
        } catch (e) {
            // Abaikan jika ternyata isinya bukan URL
        }

        // Gunakan finalToken untuk validasi
        const res = await checkQR(finalToken);
        if (res.success) {
            setQrEmail(res.email);
            setShowPinModal(true);
            setLoading(false);
        } else {
            setError(res.error);
            if (res.cooldown) setCooldown(res.cooldown);
            setLoading(false);
        }
    };
    
    // ... sisa kode tidak perlu diubah ...
}
````