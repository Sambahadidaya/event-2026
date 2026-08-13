'use client';

import { Bell, Search } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const siteStyles = {
    pkkmb: {
        glowColor: '#3b82f6',
        borderDot: 'border-blue-500',
        dotHoverBg: 'group-hover:bg-blue-500',
        dotHoverShadow: 'group-hover:shadow-[0_0_20px_rgba(59,130,246,0.8)]',
        spinner: 'border-blue-600',
        focusRing: 'focus:ring-blue-500',
        dateText: 'text-blue-700 dark:text-blue-300',
        dateBg: 'bg-blue-50/90 dark:bg-blue-900/30',
        dateBorder: 'border-blue-100 dark:border-blue-800/50',
        dateHover: 'hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:border-blue-200 dark:hover:border-blue-700/50 hover:shadow-md',
        cardHover: 'hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900/50',
        titleAccent: 'border-blue-500/30',
    },
    pose: {
        glowColor: '#E85D04',
        borderDot: 'border-[#E85D04]',
        dotHoverBg: 'group-hover:bg-[#E85D04]',
        dotHoverShadow: 'group-hover:shadow-[0_0_20px_rgba(232,93,4,0.8)]',
        spinner: 'border-[#E85D04]',
        focusRing: 'focus:ring-[#E85D04]',
        dateText: 'text-[#E85D04] dark:text-[#FCBF49]',
        dateBg: 'bg-orange-50/90 dark:bg-orange-900/30',
        dateBorder: 'border-orange-100 dark:border-orange-800/50',
        dateHover: 'hover:bg-orange-100 dark:hover:bg-orange-900/50 hover:border-orange-200 dark:hover:border-orange-700/50 hover:shadow-md',
        cardHover: 'hover:shadow-md hover:border-orange-200 dark:hover:border-orange-900/50',
        titleAccent: 'border-[#E85D04]/30',
    },
};

function formatAnnouncementDate(item) {
    const raw = item.custom_date || item.created_at;
    const formatted = new Date(raw).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
    return `📢 ${formatted}`;
}

export default function AnnouncementTimeline({ site, items, loading, filter, onFilterChange }) {
    const styles = siteStyles[site] || siteStyles.pkkmb;

    return (
        <>
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes dropFall {
                    0% { top: -200px; }
                    100% { top: 100%; }
                }
                .timeline-glow-${site} {
                    position: absolute;
                    left: 0;
                    width: 100%;
                    height: 200px;
                    background: linear-gradient(to bottom, transparent, ${styles.glowColor});
                    animation: dropFall 3s infinite linear;
                }
            `}} />

            <div className="flex flex-col md:flex-row md:items-center justify-end gap-4 mb-8">
                <div className="relative w-full md:w-72 lg:w-96 md:ml-auto">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="Cari pengumuman..."
                        value={filter}
                        onChange={(e) => onFilterChange(e.target.value)}
                        className={`w-full pl-11 p-3.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 outline-none focus:ring-2 ${styles.focusRing} shadow-sm transition-all placeholder-gray-400`}
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className={`w-10 h-10 border-4 ${styles.spinner} border-t-transparent rounded-full animate-spin`} />
                </div>
            ) : items.length === 0 ? (
                <div className="glass p-12 rounded-2xl text-center">
                    <Bell size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Belum Ada Informasi</h3>
                    <p className="text-gray-500 dark:text-gray-400">Pemberitahuan atau kata kunci yang dicari tidak ditemukan.</p>
                </div>
            ) : (
                <div className="glass p-6 sm:p-10 rounded-3xl relative max-w-4xl mx-auto mt-4">
                    <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className={`timeline-glow-${site}`} />
                    </div>

                    <div className="space-y-10 relative">
                        {items.map((item) => (
                            <article key={item.id} className="relative group">
                                <div
                                    className={`absolute left-6 top-5 w-4 h-4 bg-background ${styles.borderDot} border-2 rounded-full -translate-x-1/2 flex items-center justify-center ${styles.dotHoverBg} ${styles.dotHoverShadow} group-hover:scale-150 transition-all duration-300 z-10`}
                                />

                                <div className="pl-10 sm:pl-12">
                                    <span
                                        className={`inline-flex items-center px-3.5 py-1.5 mb-3 text-sm font-bold ${styles.dateText} ${styles.dateBg} rounded-full border ${styles.dateBorder} ${styles.dateHover} transition-all duration-300 cursor-default`}
                                    >
                                        {formatAnnouncementDate(item)}
                                    </span>

                                    <div
                                        className={`bg-white dark:bg-gray-800/90 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all duration-300 ${styles.cardHover}`}
                                    >
                                        <h3 className={`text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight pb-3 border-b ${styles.titleAccent}`}>
                                            {item.title}
                                        </h3>

                                        {/* Bagian Konten yang Mendukung Formatting & Clickable Link */}
                                        <div className="text-gray-600 dark:text-gray-300 leading-relaxed text-[15px] sm:text-base space-y-3">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    // Mengatur styling paragraf & spasi
                                                    p: ({ node, ...props }) => <p className="mb-2 whitespace-pre-wrap" {...props} />,
                                                    // Styling untuk teks tebal
                                                    strong: ({ node, ...props }) => <strong className="font-bold text-gray-900 dark:text-white" {...props} />,
                                                    // Styling untuk link otomatis
                                                    a: ({ node, ...props }) => (
                                                        <a
                                                            className="text-blue-600 dark:text-blue-400 hover:underline font-medium break-all"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            {...props}
                                                        />
                                                    ),
                                                    // Styling untuk bullet list
                                                    ul: ({ node, ...props }) => <ul className="list-disc pl-5 my-2 space-y-1" {...props} />,
                                                    ol: ({ node, ...props }) => <ol className="list-decimal pl-5 my-2 space-y-1" {...props} />,
                                                    li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                                                }}
                                            >
                                                {item.content}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}