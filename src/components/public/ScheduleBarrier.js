'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getJadwalAcara } from '@/api/supabase/public/jadwal';
import { getServerTime } from '@/api/supabase/time';
import { Clock, ArrowRight, X } from 'lucide-react';
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
                `Pendaftaran sedang berlangsung dan akan berakhir pada ${formatDate(pEnd)}`,
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
                `Pendaftaran telah selesai dan sedang tahap seleksi, acara akan dimulai pada ${formatDate(aStart)}`,
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
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
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
            // Pisahkan countdown ke digit terpisah untuk tampilan lebih premium
            const countdownParts = timeLeft ? timeLeft.split(':') : [];
            // Jika ada "Hari" di timeLeft, parse khusus
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
                    className="fixed inset-0 flex items-center justify-center p-4"
                    style={{ zIndex: 99999 }}
                >
                    {/* Background — light: warm white, dark: deep slate */}
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-[#fff6ee] to-[#ffe8cc] dark:from-slate-950 dark:via-[#120c08] dark:to-[#1a0e06] opacity-[0.98]" />
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#5B4FCF]/10 dark:bg-[#5B4FCF]/15 rounded-full blur-[120px] animate-pulse" />
                        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#E85D04]/10 dark:bg-[#E85D04]/12 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FCBF49]/5 dark:bg-[#FCBF49]/5 rounded-full blur-[160px]" />
                    </div>

                    {/* Card */}
                    <div className="relative w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
                        <div className="bg-white/80 dark:bg-white/[0.08] backdrop-blur-2xl rounded-[28px] border border-gray-200/60 dark:border-white/10 shadow-2xl shadow-gray-300/30 dark:shadow-black/40 overflow-hidden">

                            {/* Top accent bar — POSE gradient */}
                            <div className="h-1.5 bg-gradient-to-r from-[#5B4FCF] via-[#E85D04] to-[#FCBF49]" />

                            <div className="p-8 sm:p-10 space-y-7">
                                {/* Icon */}
                                <div className="relative mx-auto w-20 h-20">
                                    <div className="absolute inset-0 bg-[#E85D04]/20 dark:bg-[#E85D04]/25 rounded-full blur-xl animate-pulse" />
                                    <div className="relative w-20 h-20 bg-gradient-to-br from-[#5B4FCF] to-[#E85D04] rounded-full flex items-center justify-center shadow-lg shadow-[#5B4FCF]/20 dark:shadow-[#E85D04]/30">
                                        <Clock size={36} className="text-white" strokeWidth={2.5} />
                                    </div>
                                </div>

                                {/* Message */}
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-snug tracking-tight text-center">
                                    {barrierState.message}
                                </h2>

                                {/* Countdown */}
                                {barrierState.targetDate && (
                                    <div className="space-y-4">
                                        <p className="text-xs font-semibold text-gray-400 dark:text-white/40 uppercase tracking-[0.2em] text-center">
                                            Waktu Tersisa
                                        </p>
                                        <div className="flex items-center justify-center gap-2 sm:gap-3">
                                            {daysLabel && (
                                                <>
                                                    <div className="flex flex-col items-center">
                                                        <div className="bg-[#5B4FCF]/10 dark:bg-white/10 border border-[#5B4FCF]/15 dark:border-white/10 rounded-2xl px-4 py-3 min-w-[56px]">
                                                            <span className="text-3xl sm:text-4xl font-black text-[#E85D04] dark:text-[#FCBF49] tabular-nums block text-center">{daysLabel}</span>
                                                        </div>
                                                        <span className="text-[10px] font-bold text-gray-400 dark:text-white/30 uppercase mt-1.5 tracking-wider">Hari</span>
                                                    </div>
                                                    <span className="text-2xl font-black text-gray-300 dark:text-white/20 mb-5">:</span>
                                                </>
                                            )}
                                            <div className="flex flex-col items-center">
                                                <div className="bg-[#5B4FCF]/10 dark:bg-white/10 border border-[#5B4FCF]/15 dark:border-white/10 rounded-2xl px-4 py-3 min-w-[56px]">
                                                    <span className="text-3xl sm:text-4xl font-black text-[#E85D04] dark:text-[#FCBF49] tabular-nums block text-center">{hh}</span>
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-400 dark:text-white/30 uppercase mt-1.5 tracking-wider">Jam</span>
                                            </div>
                                            <span className="text-2xl font-black text-gray-300 dark:text-white/20 mb-5">:</span>
                                            <div className="flex flex-col items-center">
                                                <div className="bg-[#5B4FCF]/10 dark:bg-white/10 border border-[#5B4FCF]/15 dark:border-white/10 rounded-2xl px-4 py-3 min-w-[56px]">
                                                    <span className="text-3xl sm:text-4xl font-black text-[#E85D04] dark:text-[#FCBF49] tabular-nums block text-center">{mm}</span>
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-400 dark:text-white/30 uppercase mt-1.5 tracking-wider">Menit</span>
                                            </div>
                                            <span className="text-2xl font-black text-gray-300 dark:text-white/20 mb-5">:</span>
                                            <div className="flex flex-col items-center">
                                                <div className="bg-[#5B4FCF]/10 dark:bg-white/10 border border-[#5B4FCF]/15 dark:border-white/10 rounded-2xl px-4 py-3 min-w-[56px]">
                                                    <span className="text-3xl sm:text-4xl font-black text-[#E85D04] dark:text-[#FCBF49] tabular-nums block text-center">{ss}</span>
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-400 dark:text-white/30 uppercase mt-1.5 tracking-wider">Detik</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Buttons */}
                                <div className="space-y-3 pt-2">
                                    <Link
                                        href={barrierState.primaryBtnLink}
                                        className="group w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-[#5B4FCF] via-[#E85D04] to-[#E85D04] hover:from-[#4a3fb8] hover:to-[#c74d03] text-white rounded-2xl font-bold text-sm transition-all duration-300 shadow-lg shadow-[#E85D04]/25 hover:shadow-[#E85D04]/40 transform hover:-translate-y-0.5"
                                    >
                                        <span>{barrierState.primaryBtnText}</span>
                                        <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                                    </Link>

                                    <button
                                        onClick={() => setDismissed(true)}
                                        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 text-gray-600 dark:text-white/60 hover:text-gray-800 dark:hover:text-white/90 rounded-2xl font-semibold text-sm transition-all duration-300"
                                    >
                                        Mengerti
                                    </button>
                                </div>
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
