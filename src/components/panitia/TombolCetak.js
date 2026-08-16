'use client';

import { useState, useRef, useEffect } from 'react';
import { Printer, FileSpreadsheet, Loader2, ChevronDown } from 'lucide-react';
import { generatePdfAction } from '@/api/pdf/route';
import { exportToExcel, exportToExcelMultiSheet } from '@/lib/excel/xlsx';

/**
 * TombolCetak — Komponen dropdown tombol cetak reusable (PDF + Excel)
 * Dapat dipakai di berbagai halaman panitia (verifikasi, absensi, keuangan, dll).
 *
 * @param {string}   [label="Cetak"]         - Label teks tombol utama
 * @param {string}   [className=""]          - Class CSS tambahan untuk container tombol
 *
 * --- Konfigurasi PDF ---
 * @param {string}   [pdfTitle="Laporan"]    - Judul dokumen PDF
 * @param {string}   [pdfSite="pkkmb"]       - Site: 'pkkmb' | 'pose' | 'portal'
 * @param {Array}    [pdfData=[]]            - Data array (single table) atau array of {title, data} (multi-table)
 * @param {Array}    [pdfColumns=[]]         - List kolom PDF [{key, label}]
 * @param {string}   [pdfDocumentType="report"] - Tipe dokumen PDF
 * @param {string}   [pdfTabType="laba_rugi"] - Subtipe dokumen (opsional)
 * @param {object}   [pdfMetrics={}]         - Data metrics tambahan (opsional)
 * @param {boolean}  [disablePdf=false]      - Nonaktifkan / sembunyikan opsi PDF
 *
 * --- Konfigurasi Excel ---
 * @param {Array}    [excelData=[]]          - Data single sheet: Array of objects
 * @param {Array}    [excelColumns=[]]       - Kolom Excel [{key, label}]
 * @param {Array}    [excelSheets=null]      - Multi-sheet [{sheetName, data, columns}]
 * @param {string}   [excelFilename="laporan-export"] - Nama file output Excel (tanpa .xlsx)
 * @param {boolean}  [disableExcel=false]    - Nonaktifkan / sembunyikan opsi Excel
 */
export default function TombolCetak({
    label = 'Cetak',
    className = '',
    
    // PDF Config
    pdfTitle = 'Laporan',
    pdfSite = 'pkkmb',
    pdfData = [],
    pdfColumns = [],
    pdfDocumentType = 'report',
    pdfTabType = 'laba_rugi',
    pdfMetrics = {},
    pdfExtraProps = {},
    disablePdf = false,

    // Excel Config
    excelData = [],
    excelColumns = [],
    excelSheets = null,
    excelFilename = 'laporan-export',
    disableExcel = false
}) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingType, setLoadingType] = useState(''); // 'pdf' | 'excel'
    const [progress, setProgress] = useState(0); // 0 - 100

    const dropdownRef = useRef(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handler Cetak PDF
    const handleCetakPDF = async () => {
        if (!pdfData || (Array.isArray(pdfData) && pdfData.length === 0)) {
            alert('Tidak ada data untuk dicetak ke PDF.');
            return;
        }

        setDropdownOpen(false);
        setLoading(true);
        setLoadingType('pdf');
        setProgress(15);

        try {
            // Simulated progress intervals for server action feedback
            const p1 = setTimeout(() => setProgress(45), 300);
            const p2 = setTimeout(() => setProgress(75), 800);

            const res = await generatePdfAction({
                type: pdfDocumentType,
                title: pdfTitle,
                site: pdfSite,
                columns: pdfColumns,
                data: pdfData,
                tabType: pdfTabType,
                metrics: pdfMetrics,
                ...pdfExtraProps
            });

            clearTimeout(p1);
            clearTimeout(p2);

            if (!res || !res.success) {
                throw new Error(res?.error || 'Gagal membuat PDF');
            }

            setProgress(90);

            // Convert base64 to Blob & download
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
            a.download = `${pdfTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}_${pdfSite}_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

            setProgress(100);
        } catch (err) {
            console.error('Print PDF Error:', err);
            alert(`Terjadi kesalahan saat mencetak PDF: ${err.message}`);
        } finally {
            setTimeout(() => {
                setLoading(false);
                setLoadingType('');
                setProgress(0);
            }, 400);
        }
    };

    // Handler Export Excel
    const handleExportExcel = async () => {
        const hasData = (excelSheets && excelSheets.length > 0) || (excelData && excelData.length > 0);
        if (!hasData) {
            alert('Tidak ada data untuk diexport ke Excel.');
            return;
        }

        setDropdownOpen(false);
        setLoading(true);
        setLoadingType('excel');
        setProgress(30);

        try {
            setTimeout(() => setProgress(70), 100);

            if (excelSheets && excelSheets.length > 0) {
                exportToExcelMultiSheet(excelSheets, excelFilename);
            } else {
                exportToExcel(excelData, excelColumns, excelFilename);
            }

            setProgress(100);
        } catch (err) {
            console.error('Export Excel Error:', err);
            alert(`Terjadi kesalahan saat export Excel: ${err.message}`);
        } finally {
            setTimeout(() => {
                setLoading(false);
                setLoadingType('');
                setProgress(0);
            }, 300);
        }
    };

    return (
        <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
            {/* Main Trigger Button */}
            <button
                type="button"
                onClick={() => !loading && setDropdownOpen(prev => !prev)}
                disabled={loading}
                className={`relative overflow-hidden px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-between gap-2 transition-all shadow-xs border ${
                    loading
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700 cursor-not-allowed min-w-[140px]'
                        : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700 active:scale-[0.98]'
                }`}
                title="Pilihan Cetak PDF atau Export Excel"
            >
                {loading ? (
                    <div className="flex items-center gap-2 z-10 w-full justify-between">
                        <span className="flex items-center gap-1.5 truncate">
                            <Loader2 size={15} className="animate-spin text-blue-500 shrink-0" />
                            <span>{loadingType === 'pdf' ? 'Memuat PDF...' : 'Mengekspor...'}</span>
                        </span>
                        <span className="font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400 shrink-0 ml-1">
                            {progress}%
                        </span>
                    </div>
                ) : (
                    <>
                        <span className="flex items-center gap-1.5">
                            <Printer size={16} className="text-gray-600 dark:text-gray-300" />
                            <span>{label}</span>
                        </span>
                        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                    </>
                )}

                {/* Progress Bar (From Left to Right) */}
                {loading && (
                    <div
                        className="absolute bottom-0 left-0 top-0 bg-blue-500/15 dark:bg-blue-400/20 sm:transition-all sm:duration-300 sm:ease-in-out pointer-events-none"
                        style={{ width: `${progress}%` }}
                    />
                )}
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && !loading && (
                <div className="absolute right-0 mt-1.5 w-44 rounded-xl bg-white dark:bg-gray-900 shadow-lg border border-gray-100 dark:border-gray-800 z-50 py-1 animate-in fade-in zoom-in-95 duration-150">
                    {!disablePdf && (
                        <button
                            type="button"
                            onClick={handleCetakPDF}
                            className="w-full text-left px-3.5 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2.5 transition-colors"
                        >
                            <Printer size={15} className="text-blue-500 shrink-0" />
                            <span>Cetak PDF</span>
                        </button>
                    )}
                    {!disableExcel && (
                        <button
                            type="button"
                            onClick={handleExportExcel}
                            className="w-full text-left px-3.5 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-2.5 transition-colors"
                        >
                            <FileSpreadsheet size={15} className="text-emerald-500 shrink-0" />
                            <span>Export Excel</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
