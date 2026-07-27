'use client';

import { useState } from 'react';
import { Printer, Loader2 } from 'lucide-react';
import { generatePdfAction } from '@/api/finance/pdf/route';

export default function PrintPDFButton({
    title = 'Laporan Keuangan',
    site = 'pose',
    columns = [],
    data = [],
    documentType = 'report',
    tabType = 'laba_rugi',
    metrics = {},
    className = ''
}) {
    const [loading, setLoading] = useState(false);

    const handlePrint = async () => {
        if (!data || (Array.isArray(data) && data.length === 0)) {
            alert('Tidak ada data untuk dicetak.');
            return;
        }

        setLoading(true);

        try {
            const res = await generatePdfAction({
                type: documentType,
                title,
                site,
                columns,
                data,
                tabType,
                metrics
            });

            if (!res || !res.success) {
                throw new Error(res?.error || 'Gagal membuat PDF');
            }

            // Convert base64 back to Blob for download
            const byteCharacters = atob(res.base64Pdf);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/pdf' });

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}_${site}_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Print PDF Error:', err);
            alert(`Terjadi kesalahan saat mencetak PDF: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handlePrint}
            disabled={loading}
            className={`px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-50 ${className}`}
            title="Cetak PDF Resmi dengan QR Code Verifikasi"
        >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
            <span>{loading ? 'Memuat PDF...' : 'Cetak PDF'}</span>
        </button>
    );
}
