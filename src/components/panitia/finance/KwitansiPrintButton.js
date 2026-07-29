'use client';

import { useState } from 'react';
import { FileCheck2, Loader2 } from 'lucide-react';
import { generatePdfAction } from '@/api/pdf/route';

export default function KwitansiPrintButton({
    transaction = null,
    site = 'pose',
    className = ''
}) {
    const [loading, setLoading] = useState(false);

    const handlePrintKwitansi = async () => {
        if (!transaction) return;

        setLoading(true);

        try {
            const res = await generatePdfAction({
                type: 'receipt',
                site,
                transaction
            });

            if (!res || !res.success) {
                throw new Error(res?.error || 'Gagal membuat Kwitansi');
            }

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
            a.download = `Kwitansi_${transaction.kode_id || 'KWT'}_${site}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Print Kwitansi Error:', err);
            alert(`Gagal mencetak Kwitansi: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handlePrintKwitansi}
            disabled={loading || !transaction}
            className={`p-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 ${className}`}
            title="Cetak Kwitansi Resi Pembayaran"
        >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <FileCheck2 size={14} />}
        </button>
    );
}
