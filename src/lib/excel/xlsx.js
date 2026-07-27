import * as XLSX from 'xlsx';

/**
 * Export data array to an Excel (.xlsx) file and trigger browser download
 * @param {Array<Object>} data - Raw data objects
 * @param {Array<{key: string, label: string}>} columns - Column mapping
 * @param {string} filename - Filename without extension
 */
export function exportToExcel(data = [], columns = [], filename = 'export-keuangan') {
    try {
        if (!data || data.length === 0) {
            alert('Tidak ada data untuk diexport.');
            return;
        }

        const hasCustomSummary = data.some(item => item.isSummaryRow);

        // Format data based on columns if provided, otherwise raw
        const formattedData = data.map((item, index) => {
            if (columns && columns.length > 0) {
                if (item.isSummaryRow) {
                    const row = { No: item.noLabel !== undefined ? item.noLabel : '' };
                    columns.forEach(col => {
                        const val = item[col.key];
                        if (val === undefined || val === null || val === 0 || val === '') {
                            row[col.label] = '';
                        } else {
                            row[col.label] = val;
                        }
                    });
                    return row;
                }

                const row = { No: index + 1 };
                columns.forEach(col => {
                    row[col.label] = item[col.key] !== undefined && item[col.key] !== null ? item[col.key] : '-';
                });
                return row;
            }
            return { No: index + 1, ...item };
        });

        // Add TOTAL row if any numeric column exists and no custom summary rows were provided
        if (columns && columns.length > 0 && !hasCustomSummary) {
            const hasNumeric = columns.some(col => ['nominal', 'debit', 'credit', 'totalDebit', 'totalCredit'].includes(col.key));
            if (hasNumeric) {
                const totalRow = { No: 'TOTAL' };
                columns.forEach(col => {
                    if (['nominal', 'debit', 'credit', 'totalDebit', 'totalCredit'].includes(col.key)) {
                        const totalVal = data.reduce((sum, item) => sum + Number(item[col.key] || 0), 0);
                        totalRow[col.label] = totalVal;
                    } else {
                        totalRow[col.label] = '';
                    }
                });
                formattedData.push(totalRow);
            }
        }

        const worksheet = XLSX.utils.json_to_sheet(formattedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

        // Auto column widths
        const maxLen = columns.map(col => col.label.length);
        worksheet['!cols'] = maxLen.map(len => ({ wch: Math.max(len + 5, 12) }));

        XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
        console.error('Error exporting to Excel:', err);
        alert('Gagal mengeksport data ke Excel.');
    }
}

/**
 * Export multiple sheets to a single Excel file
 * @param {Array<{sheetName: string, data: Array<Object>, columns: Array<{key: string, label: string}>}>} sheets
 * @param {string} filename
 */
export function exportToExcelMultiSheet(sheets = [], filename = 'laporan-keuangan-lengkap') {
    try {
        if (!sheets || sheets.length === 0) {
            alert('Tidak ada sheet data untuk diexport.');
            return;
        }

        const workbook = XLSX.utils.book_new();

        sheets.forEach(({ sheetName, data = [], columns = [] }) => {
            const formattedData = data.map((item, index) => {
                if (columns && columns.length > 0) {
                    const row = { No: index + 1 };
                    columns.forEach(col => {
                        row[col.label] = item[col.key] !== undefined && item[col.key] !== null ? item[col.key] : '-';
                    });
                    return row;
                }
                return { No: index + 1, ...item };
            });

            // Add TOTAL row if any numeric column exists
            if (columns && columns.length > 0) {
                const hasNumeric = columns.some(col => ['nominal', 'debit', 'credit', 'totalDebit', 'totalCredit'].includes(col.key));
                if (hasNumeric) {
                    const totalRow = { No: 'TOTAL' };
                    columns.forEach(col => {
                        if (['nominal', 'debit', 'credit', 'totalDebit', 'totalCredit'].includes(col.key)) {
                            const totalVal = data.reduce((sum, item) => sum + Number(item[col.key] || 0), 0);
                            totalRow[col.label] = totalVal;
                        } else {
                            totalRow[col.label] = '';
                        }
                    });
                    formattedData.push(totalRow);
                }
            }

            const worksheet = XLSX.utils.json_to_sheet(formattedData);
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName || 'Sheet');
        });

        XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
        console.error('Error exporting multi-sheet Excel:', err);
        alert('Gagal mengeksport laporan ke Excel.');
    }
}
