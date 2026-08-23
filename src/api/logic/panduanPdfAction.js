'use server';

import { headers } from 'next/headers';
import { getPanduanBySite } from '@/api/logic/panduanLogic';
import { getKetentuanBySite } from '@/api/logic/ketentuanLogic';
import { generatePanduanPDF, generateKetentuanPDF } from '@/lib/pdf/panduanKetentuan';
import {
    checkRateLimit,
    getCachedPdf,
    setCachedPdf,
    acquirePdfWorkerLock,
    releasePdfWorkerLock
} from '@/lib/security/rateLimiter';
import {
    sanitizeSite,
    sanitizeYoutubeId,
    isRegisteredVideo
} from '@/lib/security/inputGuard';

/**
 * Helper to get client IP from request headers
 */
async function getClientIp() {
    try {
        const headerList = await headers();
        const forwarded = headerList.get('x-forwarded-for');
        if (forwarded) {
            return forwarded.split(',')[0].trim();
        }
        return headerList.get('x-real-ip') || '127.0.0.1';
    } catch {
        return '127.0.0.1';
    }
}

/**
 * Server action to generate Panduan PDF with multi-tiered security
 * @param {string} site - 'pkkmb' | 'pose'
 * @returns {Promise<{success: boolean, base64Pdf?: string, error?: string}>}
 */
export async function downloadPanduanPdfAction(site = 'pkkmb') {
    let lockAcquired = false;
    try {
        // Tier 1: Input Validation & Sanitization
        const cleanSite = sanitizeSite(site);

        // Tier 2: IP Rate Limiting (Anti-DoS / Anti-Spam)
        const clientIp = await getClientIp();
        const rateCheck = checkRateLimit(clientIp, 'pdf_panduan', 8, 120000);
        if (!rateCheck.allowed) {
            return {
                success: false,
                error: `Terlalu banyak permintaan cetak. Silakan tunggu ${rateCheck.retryAfterSec} detik lagi.`
            };
        }

        // Tier 3: In-Memory Cache (Sub-second response, 0 Puppeteer load)
        const cacheKey = `panduan:${cleanSite}`;
        const cached = getCachedPdf(cacheKey);
        if (cached) {
            return { success: true, base64Pdf: cached, cached: true };
        }

        // Tier 4: Concurrency Lock (Prevents server RAM exhaustion)
        lockAcquired = acquirePdfWorkerLock();
        if (!lockAcquired) {
            return {
                success: false,
                error: 'Server sedang memproses antrean dokumen. Silakan coba beberapa detik lagi.'
            };
        }

        // Fetch data
        const data = await getPanduanBySite(cleanSite);
        if (!data || !data.sections || data.sections.length === 0) {
            throw new Error('Data panduan tidak ditemukan');
        }

        // Tier 5: Safe Generation with Hard Timeout (25s)
        const pdfPromise = generatePanduanPDF({ site: cleanSite, data });
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Waktu pembuatan PDF habis (timeout)')), 25000)
        );

        const pdfBuffer = await Promise.race([pdfPromise, timeoutPromise]);
        const base64Pdf = Buffer.from(pdfBuffer).toString('base64');

        // Save to cache (5 minutes TTL)
        setCachedPdf(cacheKey, base64Pdf, 300000);

        return { success: true, base64Pdf };
    } catch (err) {
        console.error('[Security] Error in downloadPanduanPdfAction:', err.message);
        return {
            success: false,
            error: err.message || 'Gagal memproses dokumen PDF secara aman'
        };
    } finally {
        if (lockAcquired) {
            releasePdfWorkerLock();
        }
    }
}

/**
 * Server action to generate Ketentuan PDF with multi-tiered security
 * @param {string} site - 'pkkmb' | 'pose'
 * @returns {Promise<{success: boolean, base64Pdf?: string, error?: string}>}
 */
export async function downloadKetentuanPdfAction(site = 'pkkmb') {
    let lockAcquired = false;
    try {
        // Tier 1: Input Validation & Sanitization
        const cleanSite = sanitizeSite(site);

        // Tier 2: IP Rate Limiting (Anti-DoS / Anti-Spam)
        const clientIp = await getClientIp();
        const rateCheck = checkRateLimit(clientIp, 'pdf_ketentuan', 8, 120000);
        if (!rateCheck.allowed) {
            return {
                success: false,
                error: `Terlalu banyak permintaan cetak. Silakan tunggu ${rateCheck.retryAfterSec} detik lagi.`
            };
        }

        // Tier 3: In-Memory Cache
        const cacheKey = `ketentuan:${cleanSite}`;
        const cached = getCachedPdf(cacheKey);
        if (cached) {
            return { success: true, base64Pdf: cached, cached: true };
        }

        // Tier 4: Concurrency Lock
        lockAcquired = acquirePdfWorkerLock();
        if (!lockAcquired) {
            return {
                success: false,
                error: 'Server sedang memproses antrean dokumen. Silakan coba beberapa detik lagi.'
            };
        }

        // Fetch data
        const data = await getKetentuanBySite(cleanSite);
        if (!data || !data.sections || data.sections.length === 0) {
            throw new Error('Data ketentuan tidak ditemukan');
        }

        // Tier 5: Safe Generation with Hard Timeout (25s)
        const pdfPromise = generateKetentuanPDF({ site: cleanSite, data });
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Waktu pembuatan PDF habis (timeout)')), 25000)
        );

        const pdfBuffer = await Promise.race([pdfPromise, timeoutPromise]);
        const base64Pdf = Buffer.from(pdfBuffer).toString('base64');

        // Save to cache (5 minutes TTL)
        setCachedPdf(cacheKey, base64Pdf, 300000);

        return { success: true, base64Pdf };
    } catch (err) {
        console.error('[Security] Error in downloadKetentuanPdfAction:', err.message);
        return {
            success: false,
            error: err.message || 'Gagal memproses dokumen PDF secara aman'
        };
    } finally {
        if (lockAcquired) {
            releasePdfWorkerLock();
        }
    }
}

/**
 * Server action to securely validate and authorize video download via Y2Mate
 * @param {string} site - 'pkkmb' | 'pose'
 * @param {string} youtubeId - Valid YouTube 11-char ID
 * @returns {Promise<{success: boolean, videoUrl?: string, targetUrl?: string, error?: string}>}
 */
export async function getSecureVideoDownloadAction(site, youtubeId) {
    try {
        // Tier 1: Input Validation
        const cleanSite = sanitizeSite(site);
        const cleanId = sanitizeYoutubeId(youtubeId);

        // Tier 2: Whitelist check against official database/data
        const isValid = isRegisteredVideo(cleanSite, cleanId);
        if (!isValid) {
            return {
                success: false,
                error: 'Video tidak terdaftar dalam basis data resmi'
            };
        }

        // Tier 3: IP Rate Limiting (max 30 requests / min per IP)
        const clientIp = await getClientIp();
        const rateCheck = checkRateLimit(clientIp, 'video_download', 30, 60000);
        if (!rateCheck.allowed) {
            return {
                success: false,
                error: `Terlalu banyak permintaan unduh video. Silakan tunggu ${rateCheck.retryAfterSec} detik.`
            };
        }

        const videoUrl = `https://www.youtube.com/watch?v=${cleanId}`;
        const targetUrl = 'https://y2mate.gs/';

        return {
            success: true,
            videoUrl,
            targetUrl
        };
    } catch (err) {
        console.error('[Security] Error in getSecureVideoDownloadAction:', err.message);
        return {
            success: false,
            error: err.message || 'Gagal memvalidasi permintaan video'
        };
    }
}
