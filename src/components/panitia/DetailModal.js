'use client';

import { X } from 'lucide-react';

export default function DetailModal({ open, onClose, title, fields = [] }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 w-full sm:max-w-lg max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom sm:fade-in duration-200">
                <div className="sticky top-0 flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{title}</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="p-4 sm:p-5 space-y-4">
                    {fields.map((field, idx) => (
                        <div key={field.label || idx}>
                            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">
                                {field.label}
                            </p>
                            <div className={`text-sm text-gray-800 dark:text-gray-200 ${field.multiline ? 'whitespace-pre-wrap break-words' : ''}`}>
                                {field.value ?? '-'}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
