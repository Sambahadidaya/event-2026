'use client';

import { X } from 'lucide-react';

export default function ConfirmModal({
    open,
    onClose,
    onConfirm,
    title = 'Konfirmasi',
    message,
    confirmLabel = 'Ya, Konfirmasi',
    cancelLabel = 'Batal',
    loading = false,
}) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={loading ? undefined : onClose} />
            <div className="relative bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 w-full sm:max-w-md animate-in slide-in-from-bottom sm:fade-in duration-200">
                <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">{title}</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="p-4 sm:p-5">
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{message}</p>
                    <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                        >
                            {cancelLabel}
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={loading}
                            className="px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Menyimpan...' : confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
