'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getJadwalAcara } from '@/api/supabase/public/jadwal';
import { getServerTime } from '@/api/supabase/time';
import { Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function ScheduleBarrier({ children, pageType }) {
    const [loading, setLoading] = useState(true);
    const [barrierState, setBarrierState] = useState({
        show: false,
        message: '',
        targetDate: null,
        primaryBtnText: '',
        primaryBtnLink: ''
    });
    const [timeLeft, setTimeLeft] = useState('');
    const [portalRoot, setPortalRoot] = useState(null);
    const [dismissed, setDismissed] = useState(false);
    const timeOffsetRef = useRef(0);

    // Siapkan portal root saat client-side
    useEffect(() => {
        setPortalRoot(document.body);
    }, []);

    useEffect(() => {
        const fetchAndCheck = async () => {
            try {
                const [data, serverTimeStr] = await Promise.all([
                    getJadwalAcara('pose'),
                    getServerTime()
                ]);

                if (serverTimeStr) {
                    const serverNow = new Date(serverTimeStr);
                    const clientNow = new Date();
                    timeOffsetRef.current = serverNow.getTime() - clientNow.getTime();
                }

                if (!data || data.length === 0) {
                    setLoading(false);
                    return;
                }

                evaluateAccess(data);
            } catch (e) {
                console.error("Error in ScheduleBarrier fetchAndCheck:", e);
            } finally {
                setLoading(false);
            }
        };

        fetchAndCheck();
    }, [pageType]);

    const formatDate = (date) => {
        if (!date) return '';
        return date.toLocaleString('id-ID', {
            day: '2-digit', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const evaluateAccess = (data) => {
        const now = new Date(Date.now() + timeOffsetRef.current);

        const pendaftaran = data.find(d => d.jenis_jadwal === 'pendaftaran');
        const seleksi = data.find(d => d.jenis_jadwal === 'seleksi');
        const acara = data.find(d => d.jenis_jadwal === 'acara');

        const parseLocal = (dateString) => dateString ? new Date(dateString.substring(0, 19).replace('T', ' ')) : null;

        const pStart = parseLocal(pendaftaran?.waktu_mulai);
        const pEnd = parseLocal(pendaftaran?.waktu_selesai);
        const sStart = parseLocal(seleksi?.waktu_mulai);
        const sEnd = parseLocal(seleksi?.waktu_selesai);
        const aStart = parseLocal(acara?.waktu_mulai);
        const aEnd = parseLocal(acara?.waktu_selesai);

        const block = (message, targetDate, primaryBtnText, primaryBtnLink) => {
            setBarrierState({ show: true, message, targetDate, primaryBtnText, primaryBtnLink });
        };

        // 1. Setelah acara selesai
        if (aEnd && now > aEnd) {
            return block(
                'Acara telah selesai',
                null,
                'Kembali ke Halaman Pemberitahuan',
                '/pose/pemberitahuan'
            );
        }

        // 2. Sebelum pendaftaran dimulai
        if (pStart && now <= pStart) {
            return block(
                `Pendaftaran akan dibuka pada tanggal ${formatDate(pStart)}`,
                pStart,
                'Kembali ke Halaman Pemberitahuan',
                '/pose/pemberitahuan'
            );
        }

        // 3. Pendaftaran berlangsung
        if (pEnd && now <= pEnd) {
            if (pageType === 'register') return; // ALLOW

            return block(
                `Pendaftaran tahap 2 sedang berlangsung dan akan berakhir pada ${formatDate(pEnd)}`,
                pEnd,
                'Lanjut ke Halaman Pendaftaran',
                '/pose/register'
            );
        }

        // 4. Seleksi berlangsung (setelah pendaftaran, sebelum acara)
        if (aStart && now <= aStart) {
            // Asumsi: Saat seleksi, halaman Tim boleh dilihat, tapi Jadwal dan Register tidak
            if (pageType === 'team') return; // ALLOW

            return block(
                `Pendaftaran tahap 2 telah selesai dan sedang tahap seleksi, acara akan dimulai pada ${formatDate(aStart)}`,
                aStart,
                'Kembali ke Halaman Pemberitahuan',
                '/pose/pemberitahuan'
            );
        }

        // 5. Acara berlangsung
        if (aEnd && now <= aEnd) {
            if (pageType === 'team' || pageType === 'jadwal') return; // ALLOW

            return block(
                `Acara sudah dimulai dan akan berakhir pada ${formatDate(aEnd)}`,
                aEnd,
                'Kembali ke Halaman Pemberitahuan',
                '/pose/pemberitahuan'
            );
        }
    };

    // Countdown Timer
    useEffect(() => {
        if (!barrierState.show || !barrierState.targetDate) return;

        const interval = setInterval(() => {
            const now = Date.now() + timeOffsetRef.current;
            const distance = barrierState.targetDate.getTime() - now;

            if (distance < 0) {
                clearInterval(interval);
                setTimeLeft('00:00:00');
                window.location.reload();
            } else {
                const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);

                let str = '';
                if (days > 0) str += `${days} Hari `;
                str += `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                setTimeLeft(str);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [barrierState]);

    // Loading State
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-transparent">
                <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-700 border-t-gray-900 dark:border-t-white rounded-full animate-spin"></div>
            </div>
        );
    }

    if (barrierState.show) {
        if (dismissed) {
            // Ketika menekan tombol mengerti, overlay hilang tapi halaman kosong (isi halaman tidak ditampilkan)
            return <div className="min-h-screen"></div>;
        }

        // Overlay penuh layar — di-render via Portal ke document.body agar di atas navbar/footer
        if (portalRoot) {
            // Parse countdown ke digit terpisah untuk tampilan rapi
            let daysLabel = '';
            let hh = '00', mm = '00', ss = '00';
            if (timeLeft) {
                const hariMatch = timeLeft.match(/^(\d+)\s*Hari\s+(.*)/);
                if (hariMatch) {
                    daysLabel = hariMatch[1];
                    const rest = hariMatch[2].split(':');
                    hh = rest[0] || '00';
                    mm = rest[1] || '00';
                    ss = rest[2] || '00';
                } else {
                    const parts = timeLeft.split(':');
                    hh = parts[0] || '00';
                    mm = parts[1] || '00';
                    ss = parts[2] || '00';
                }
            }

            const overlayContent = (
                <div
                    className="fixed inset-0 flex items-center justify-center p-4 sm:p-6 select-none"
                    style={{ zIndex: 99999 }}
                >
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-md transition-opacity duration-300"
                        onClick={() => setDismissed(true)}
                    />

                    {/* Modal Card Formal Hitam-Putih */}
                    <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/90 dark:border-gray-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 sm:p-8 space-y-6 text-center">
                            {/* Icon */}
                            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white flex items-center justify-center border border-gray-200/80 dark:border-gray-700/80 shadow-2xs">
                                <Clock size={28} className="text-gray-900 dark:text-white" strokeWidth={2} />
                            </div>

                            {/* Message / Status */}
                            <div className="space-y-2">
                                <span className="inline-block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                                    Informasi Jadwal
                                </span>
                                <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-snug">
                                    {barrierState.message}
                                </h2>
                            </div>

                            {/* Countdown Display */}
                            {barrierState.targetDate && (
                                <div className="pt-1">
                                    <p className="text-[10px] sm:text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
                                        Waktu Tersisa
                                    </p>
                                    <div className="flex items-center justify-center gap-1.5 sm:gap-2.5">
                                        {daysLabel ? (
                                            <>
                                                <div className="flex flex-col items-center">
                                                    <div className="w-12 sm:w-14 h-12 sm:h-14 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/80 rounded-xl flex items-center justify-center">
                                                        <span className="text-lg sm:text-xl font-black font-mono text-gray-900 dark:text-white tabular-nums">{daysLabel}</span>
                                                    </div>
                                                    <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mt-1">Hari</span>
                                                </div>
                                                <span className="text-lg sm:text-xl font-bold text-gray-300 dark:text-gray-600 mb-4">:</span>
                                            </>
                                        ) : null}
                                        <div className="flex flex-col items-center">
                                            <div className="w-12 sm:w-14 h-12 sm:h-14 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/80 rounded-xl flex items-center justify-center">
                                                <span className="text-lg sm:text-xl font-black font-mono text-gray-900 dark:text-white tabular-nums">{hh}</span>
                                            </div>
                                            <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mt-1">Jam</span>
                                        </div>
                                        <span className="text-lg sm:text-xl font-bold text-gray-300 dark:text-gray-600 mb-4">:</span>
                                        <div className="flex flex-col items-center">
                                            <div className="w-12 sm:w-14 h-12 sm:h-14 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/80 rounded-xl flex items-center justify-center">
                                                <span className="text-lg sm:text-xl font-black font-mono text-gray-900 dark:text-white tabular-nums">{mm}</span>
                                            </div>
                                            <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mt-1">Menit</span>
                                        </div>
                                        <span className="text-lg sm:text-xl font-bold text-gray-300 dark:text-gray-600 mb-4">:</span>
                                        <div className="flex flex-col items-center">
                                            <div className="w-12 sm:w-14 h-12 sm:h-14 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/80 rounded-xl flex items-center justify-center">
                                                <span className="text-lg sm:text-xl font-black font-mono text-gray-900 dark:text-white tabular-nums">{ss}</span>
                                            </div>
                                            <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase mt-1">Detik</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Buttons */}
                            <div className="space-y-2.5 pt-2">
                                <Link
                                    href={barrierState.primaryBtnLink}
                                    className="group w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-gray-950 hover:bg-gray-850 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-950 rounded-xl font-bold text-sm transition-all duration-200 shadow-xs active:scale-[0.99]"
                                >
                                    <span>{barrierState.primaryBtnText}</span>
                                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                                </Link>

                                <button
                                    type="button"
                                    onClick={() => setDismissed(true)}
                                    className="w-full inline-flex items-center justify-center px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-sm transition-all duration-200 border border-transparent dark:border-gray-700/50"
                                >
                                    Mengerti
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );

            return createPortal(overlayContent, portalRoot);
        }
    }

    return <>{children}</>;
}
