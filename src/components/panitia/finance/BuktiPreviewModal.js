'use client';

import { X, Download, FileText, Image as ImageIcon } from 'lucide-react';

export default function BuktiPreviewModal({ isOpen, onClose, url, title = 'Bukti Pembayaran' }) {
    if (!isOpen || !url) return null;

    const isPdf = url.toLowerCase().includes('.pdf') || url.toLowerCase().includes('application/pdf');

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col h-[85vh] overflow-hidden border border-gray-100 dark:border-gray-800">
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                        {isPdf ? <FileText size={20} /> : <ImageIcon size={20} />}
                        <h3 className="font-extrabold text-base sm:text-lg text-gray-900 dark:text-white truncate">
                            {title}
                        </h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-1.5"
                        >
                            <Download size={14} /> Download
                        </a>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Body Preview */}
                <div className="flex-1 bg-gray-900 p-2 overflow-hidden flex items-center justify-center">
                    {isPdf ? (
                        <iframe
                            src={`${url}#toolbar=0`}
                            className="w-full h-full rounded-lg border-0"
                            title="Preview PDF"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
                            <img
                                src={url}
                                alt="Preview Bukti"
                                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
