'use client';

import { FileSpreadsheet } from 'lucide-react';
import { exportToExcel, exportToExcelMultiSheet } from '@/lib/excel/xlsx';

export default function ExportExcelButton({
    data = [],
    columns = [],
    filename = 'export-keuangan',
    sheets = null, // If provided, uses multi-sheet export
    className = ''
}) {
    const handleExport = () => {
        if (sheets && sheets.length > 0) {
            exportToExcelMultiSheet(sheets, filename);
        } else {
            exportToExcel(data, columns, filename);
        }
    };

    return (
        <button
            type="button"
            onClick={handleExport}
            className={`px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors ${className}`}
            title="Export Data ke Format Excel (.xlsx)"
        >
            <FileSpreadsheet size={16} />
            <span>Export Excel</span>
        </button>
    );
}
