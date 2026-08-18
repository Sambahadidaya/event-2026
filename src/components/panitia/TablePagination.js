'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function TablePagination({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    colSpan,
}) {
    if (totalItems === 0) return null;

    const validTotalItems = typeof totalItems === 'number' && !isNaN(totalItems) ? totalItems : null;
    const validItemsPerPage = typeof itemsPerPage === 'number' && !isNaN(itemsPerPage) ? itemsPerPage : null;

    const startIndex = validItemsPerPage && currentPage ? (currentPage - 1) * validItemsPerPage : 0;
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }
    for (let i = startPage; i <= endPage; i++) pages.push(i);

    return (
        <div className="bg-gray-50/80 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-3 rounded-b-xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500 dark:text-gray-400">
                {validTotalItems !== null && validItemsPerPage !== null ? (
                    <p className="text-xs sm:text-sm">
                        Menampilkan{' '}
                        <span className="font-medium text-gray-900 dark:text-white">{startIndex + 1}</span>
                        {' – '}
                        <span className="font-medium text-gray-900 dark:text-white">
                            {Math.min(startIndex + validItemsPerPage, validTotalItems)}
                        </span>
                        {' dari '}
                        <span className="font-medium text-gray-900 dark:text-white">{validTotalItems}</span>
                    </p>
                ) : (
                    <p className="text-xs sm:text-sm">
                        Halaman <span className="font-medium text-gray-900 dark:text-white">{currentPage}</span> dari{' '}
                        <span className="font-medium text-gray-900 dark:text-white">{totalPages}</span>
                    </p>
                )}
                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 disabled:opacity-40 transition-all"
                        aria-label="Halaman sebelumnya"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    {pages.map(page => (
                        <button
                            key={page}
                            type="button"
                            onClick={() => onPageChange(page)}
                            className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-semibold transition-all ${
                                page === currentPage
                                    ? 'bg-blue-600 text-white dark:bg-blue-500'
                                    : 'border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'
                            }`}
                        >
                            {page}
                        </button>
                    ))}
                    <button
                        type="button"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 disabled:opacity-40 transition-all"
                        aria-label="Halaman berikutnya"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
