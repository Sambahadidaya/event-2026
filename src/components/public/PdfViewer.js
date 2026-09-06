'use client';

import { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { ChevronLeft, ChevronRight, ExternalLink, Loader2 } from 'lucide-react';

// Konfigurasi Worker PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PdfViewer({ fileUrl }) {
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [containerWidth, setContainerWidth] = useState(0);
    const pdfContainerRef = useRef(null);

    useEffect(() => {
        if (!pdfContainerRef.current) return;
        const resizeObserver = new ResizeObserver((entries) => {
            if (entries[0]) {
                setContainerWidth(entries[0].contentRect.width);
            }
        });
        resizeObserver.observe(pdfContainerRef.current);
        return () => resizeObserver.disconnect();
    }, [fileUrl]);

    function onDocumentLoadSuccess({ numPages }) {
        setNumPages(numPages);
        setPageNumber(1);
    }

    return (
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl p-3 sm:p-4 shadow-sm border border-gray-200/50 dark:border-gray-800/50 flex flex-col min-h-[600px] sm:min-h-[800px]">
            {/* Toolbar Top (Navigasi Halaman + Opsi Buka/Unduh) */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 mb-3 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-200/60 dark:border-gray-700/60">
                {/* Navigasi Halaman */}
                <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
                    <button
                        disabled={pageNumber <= 1}
                        onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
                        className="p-1.5 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-40 transition shadow-sm"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <span>
                        Halaman {pageNumber} dari {numPages || '--'}
                    </span>
                    <button
                        disabled={pageNumber >= (numPages || 1)}
                        onClick={() => setPageNumber(prev => Math.min(prev + 1, numPages || 1))}
                        className="p-1.5 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-40 transition shadow-sm"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>

                {/* Tombol Buka di Tab Baru / Unduh */}
                <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all active:scale-95"
                >
                    <ExternalLink size={16} />
                    <span>Buka Tab Baru / Unduh</span>
                </a>
            </div>

            {/* React PDF Viewer Canvas */}
            <div
                ref={pdfContainerRef}
                className="flex-1 w-full bg-gray-100 dark:bg-gray-950 rounded-2xl overflow-auto p-2 sm:p-4 flex justify-center items-start border border-gray-200 dark:border-gray-800"
            >
                <Document
                    file={fileUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={
                        <div className="flex items-center gap-2 py-20 text-sm text-gray-500 font-medium">
                            <Loader2 size={20} className="animate-spin text-blue-500" /> Memuat PDF...
                        </div>
                    }
                    error={
                        <div className="text-center p-6 text-red-500 text-sm flex flex-col items-center gap-2">
                            <p>Gagal memuat dokumen langsung di dalam aplikasi.</p>
                            <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline text-blue-600 font-semibold"
                            >
                                Klik di sini untuk membuka PDF secara langsung
                            </a>
                        </div>
                    }
                >
                    {containerWidth > 0 && (
                        <Page
                            pageNumber={pageNumber}
                            width={containerWidth ? Math.min(containerWidth - 24, 800) : undefined}
                            renderAnnotationLayer={false}
                            renderTextLayer={false}
                            className="shadow-lg rounded-xl overflow-hidden"
                        />
                    )}
                </Document>
            </div>
        </div>
    );
}
