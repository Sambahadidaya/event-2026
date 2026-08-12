import * as XLSX from 'xlsx';

/**
 * Export data medis ke format Excel.
 * @param {Array<Object>} data - Array data medis yang dikirim dari UI
 */
export function exportMedisToExcel(data = []) {
    try {
        if (!data || data.length === 0) {
            alert('Tidak ada data medis untuk diexport.');
            return;
        }

        const columns = [
            { key: 'nama', label: 'Nama Lengkap' },
            { key: 'nim', label: 'NIM' },
            { key: 'prodi', label: 'Prodi' },
            { key: 'email_wa', label: 'Email/WA' },
            { key: 'nama_kelompok', label: 'Kelompok' },
            { key: 'nama_kabim', label: 'Kabim' },
            { key: 'status_pembayaran', label: 'Status Verifikasi' },
            { key: 'riwayat_penyakit', label: 'Riwayat Penyakit' },
            { key: 'penanganan', label: 'Penanganan Medis' },
            { key: 'alergi', label: 'Alergi' },
            { key: 'nama_ortu_wali', label: 'Nama Orang Tua/Wali' },
            { key: 'no_wa_ortu_wali', label: 'WA Orang Tua/Wali' }
        ];

        const formattedData = data.map((item, index) => {
            const row = { No: index + 1 };
            columns.forEach(col => {
                row[col.label] = item[col.key] !== undefined && item[col.key] !== null ? item[col.key] : '-';
            });
            return row;
        });

        const worksheet = XLSX.utils.json_to_sheet(formattedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Medis');

        // Atur lebar kolom otomatis
        const maxLen = columns.map(col => col.label.length);
        worksheet['!cols'] = [{ wch: 6 }, ...maxLen.map(len => ({ wch: Math.max(len + 5, 15) }))];

        XLSX.writeFile(workbook, `data-medis-pkkmb_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
        console.error('Error exporting medis to Excel:', err);
        alert('Gagal mengeksport data medis ke Excel.');
    }
}
