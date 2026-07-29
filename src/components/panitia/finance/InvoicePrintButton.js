'use client';

import { useState } from 'react';
import { Receipt, Loader2 } from 'lucide-react';
import { generatePdfAction } from '@/api/pdf/route';

export default function InvoicePrintButton({
    transaction = null,
    site = 'pose',
    className = ''
}) {
    const [loading, setLoading] = useState(false);

    const handlePrintInvoice = async () => {
        if (!transaction) return;

        setLoading(true);

        try {
            const res = await generatePdfAction({
                type: 'invoice',
                site,
                transaction
            });

            if (!res || !res.success) {
                throw new Error(res?.error || 'Gagal membuat Invoice');
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
            a.download = `Invoice_${transaction.kode_id || 'TX'}_${site}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Print Invoice Error:', err);
            alert(`Gagal mencetak Invoice: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handlePrintInvoice}
            disabled={loading || !transaction}
            className={`px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 ${className}`}
            title="Cetak Invoice Pembayaran"
        >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Receipt size={14} />}
            <span>Cetak Invoice</span>
        </button>
    );
}
