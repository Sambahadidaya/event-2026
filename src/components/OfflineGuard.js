'use client';

import { useState, useEffect, useCallback } from 'react';
import { WifiOff, RotateCcw, AlertTriangle, RefreshCw, ShieldAlert, Sparkles } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

export default function OfflineGuard({ children, site = 'portal' }) {
    const [isOffline, setIsOffline] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [hasCheckedInitial, setHasCheckedInitial] = useState(false);

    // Site-specific theme configurations
    const siteConfig = {
        panitia: {
            title: 'Admin Portal',
            badge: 'Panitia Portal Offline',
            accent: 'from-blue-600 to-indigo-600',
            border: 'border-blue-500/20',
            glow: 'bg-blue-500/10',
            btnColor: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20',
            bgOverlay: 'from-slate-900 via-slate-950 to-slate-900',
        },
        pkkmb: {
            title: 'PKKMB 2026',
            badge: 'PKKMB 2026 Offline',
            accent: 'from-blue-500 to-cyan-500',
            border: 'border-blue-500/20',
            glow: 'bg-blue-500/10',
            btnColor: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20',
            bgOverlay: 'from-slate-900 via-blue-950 to-slate-900',
        },
        pose: {
            title: 'POSE 2026',
            badge: 'POSE 2026 Offline',
            accent: 'from-emerald-500 to-teal-500',
            border: 'border-emerald-500/20',
            glow: 'bg-emerald-500/10',
            btnColor: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20',
            bgOverlay: 'from-slate-900 via-emerald-950 to-slate-900',
        },
        portal: {
            title: 'Portal Kampus',
            badge: 'Portal 2026 Offline',
            accent: 'from-indigo-500 to-blue-500',
            border: 'border-indigo-500/20',
            glow: 'bg-indigo-500/10',
            btnColor: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20',
            bgOverlay: 'from-slate-900 via-slate-950 to-slate-900',
        }
    };

    const currentSite = siteConfig[site] || siteConfig.portal;

    const checkServerConnectivity = useCallback(async () => {
        if (typeof window === 'undefined') return true;

        if (!navigator.onLine) {
            setIsOffline(true);
            setErrorMessage('Tidak ada koneksi internet pada perangkat Anda.');
            return false;
        }

        setIsChecking(true);
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);

            const res = await fetch(`/api/health?t=${Date.now()}`, {
                method: 'GET',
                cache: 'no-store',
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (res.ok) {
                setIsOffline(false);
                setErrorMessage('');
                setIsChecking(false);
                return true;
            } else {
                setIsOffline(true);
                setErrorMessage('Server sedang tidak merespon (HTTP ' + res.status + ').');
                setIsChecking(false);
                return false;
            }
        } catch (err) {
            setIsOffline(true);
            if (err.name === 'AbortError') {
                setErrorMessage('Koneksi ke server terputus (waktu habis / timeout).');
            } else {
                setErrorMessage('Tidak dapat terhubung ke server atau jaringan internet.');
            }
            setIsChecking(false);
            return false;
        }
    }, []);

    useEffect(() => {
        // Initial online check
        if (typeof window !== 'undefined') {
            if (!navigator.onLine) {
                setIsOffline(true);
                setErrorMessage('Tidak ada koneksi internet pada perangkat Anda.');
                setHasCheckedInitial(true);
            } else {
                checkServerConnectivity().then(() => {
                    setHasCheckedInitial(true);
                });
            }
        }

        const handleOnlineEvent = () => {
            checkServerConnectivity();
        };

        const handleOfflineEvent = () => {
            setIsOffline(true);
            setErrorMessage('Koneksi internet perangkat Anda terputus.');
        };

        window.addEventListener('online', handleOnlineEvent);
        window.addEventListener('offline', handleOfflineEvent);

        return () => {
            window.removeEventListener('online', handleOnlineEvent);
            window.removeEventListener('offline', handleOfflineEvent);
        };
    }, [checkServerConnectivity]);

    const handleRetry = async () => {
        await checkServerConnectivity();
    };

    const handleReload = () => {
        if (typeof window !== 'undefined') {
            window.location.reload();
        }
    };

    // If offline or server is unreachable, render offline screen without mounting children
    if (isOffline) {
        return (
            <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300 relative overflow-hidden select-none">
                {/* Background decorative glow */}
                <div className={`absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none ${currentSite.glow} animate-pulse`} />
                <div className={`absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none ${currentSite.glow} animate-pulse`} />

                {/* Top bar with theme toggle */}
                <header className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
                    <ThemeToggle />
                </header>

                {/* Main Card */}
                <div className="relative z-10 w-full max-w-lg mx-auto bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-slate-900/10 text-center animate-in fade-in zoom-in-95 duration-300">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 mb-6">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                        <span>Mode Offline / Server Tidak Terjangkau</span>
                    </div>

                    {/* Icon Container */}
                    <div className="relative mx-auto w-24 h-24 mb-6 flex items-center justify-center">
                        <div className="absolute inset-0 bg-red-500/10 dark:bg-red-500/20 rounded-3xl blur-xl" />
                        <div className="relative w-20 h-20 bg-gradient-to-tr from-red-500/20 to-orange-500/20 dark:from-red-500/30 dark:to-orange-500/30 border border-red-500/30 rounded-2xl flex items-center justify-center text-red-600 dark:text-red-400 shadow-inner">
                            <WifiOff size={38} className="animate-pulse" />
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white mb-3">
                        Koneksi Terputus
                    </h1>

                    {/* Description */}
                    <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                        Halaman dinonaktifkan sementara dan sistem tidak mengambil data dari server untuk mencegah error.
                    </p>

                    {/* Error detail banner */}
                    {errorMessage && (
                        <div className="mb-6 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs sm:text-sm text-amber-800 dark:text-amber-300 flex items-center justify-center gap-2">
                            <AlertTriangle size={16} className="shrink-0 text-amber-600 dark:text-amber-400" />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                        <button
                            onClick={handleRetry}
                            disabled={isChecking}
                            className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-lg ${currentSite.btnColor} disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            <RefreshCw size={16} className={isChecking ? 'animate-spin' : ''} />
                            <span>{isChecking ? 'Memeriksa Jaringan...' : 'Coba Hubungkan Kembali'}</span>
                        </button>

                        <button
                            onClick={handleReload}
                            className="w-full sm:w-auto px-5 py-3 rounded-xl font-semibold text-sm border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all flex items-center justify-center gap-2"
                        >
                            <RotateCcw size={15} />
                            <span>Muat Ulang Halaman</span>
                        </button>
                    </div>

                    {/* Status Info Footer */}
                    <div className="mt-8 pt-6 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                        <span className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            Status: Offline
                        </span>
                        <span>{currentSite.title}</span>
                    </div>
                </div>
            </div>
        );
    }

    return children;
}
