'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getStatusPengembangan } from '@/api/supabase/public/pengembang';
import { Wrench } from 'lucide-react';

export default function PengembangBarrier({ children, site, route }) {
    const [loading, setLoading] = useState(true);
    const [locked, setLocked] = useState(false);
    const [portalRoot, setPortalRoot] = useState(null);

    useEffect(() => {
        setPortalRoot(document.body);
    }, []);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await getStatusPengembangan(site, route);
                if (res && res.kunci) {
                    setLocked(true);
                }
            } catch (e) {
                console.error("Error in PengembangBarrier checkStatus:", e);
            } finally {
                setLoading(false);
            }
        };

        checkStatus();
    }, [site, route]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="w-10 h-10 border-4 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (locked) {
        if (portalRoot) {
            const overlayContent = (
                <div
                    className="fixed inset-0 flex items-center justify-center p-4 bg-slate-100/98 dark:bg-slate-950/98 backdrop-blur-md transition-colors duration-500"
                    style={{ zIndex: 99999 }}
                >
                    {/* Subtle monochrome mesh background */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute -top-40 -left-40 w-96 h-96 bg-slate-300/20 dark:bg-slate-800/15 rounded-full blur-[120px]" />
                        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-slate-300/20 dark:bg-slate-800/15 rounded-full blur-[120px]" />
                    </div>

                    {/* Card */}
                    <div className="relative w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
                        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-[28px] border border-slate-200 dark:border-slate-800/80 shadow-2xl p-8 sm:p-10 space-y-6 text-center">
                            
                            {/* Icon Wrapper */}
                            <div className="relative mx-auto w-20 h-20">
                                <div className="absolute inset-0 bg-slate-200/50 dark:bg-slate-800/50 rounded-full blur-xl" />
                                <div className="relative w-20 h-20 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-full flex items-center justify-center shadow-md">
                                    <Wrench size={36} className="text-slate-700 dark:text-slate-300 animate-bounce" strokeWidth={1.5} />
                                </div>
                            </div>

                            {/* Message */}
                            <div className="space-y-3">
                                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                    Website Dalam Pengembangan
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                    Maaf, halaman ini sedang dalam masa pemeliharaan dan pengembangan sistem untuk meningkatkan layanan kami.
                                </p>
                            </div>

                            {/* Notice / Info */}
                            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-center">
                                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                                    Pemberitahuan
                                </p>
                                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-normal">
                                    Diharapkan untuk mengunjungi kembali esok pagi atau beberapa saat lagi setelah pemeliharaan selesai. Terima kasih atas pengertian Anda.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            );

            return createPortal(overlayContent, portalRoot);
        }
        return <div className="min-h-screen"></div>;
    }

    return <>{children}</>;
}
