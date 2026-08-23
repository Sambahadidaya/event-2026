/**
 * In-Memory Rate Limiter, Cache Manager, & Concurrency Lock
 * Multi-tiered defense for heavy server-side tasks (PDF rendering & media actions)
 */

// In-memory rate limiting store: key -> { count, resetAt }
const rateLimitMap = new Map();

// In-memory PDF cache: key -> { base64Pdf, expiresAt }
const pdfCacheMap = new Map();

// Concurrency tracker for Puppeteer
let activePdfWorkers = 0;
const MAX_CONCURRENT_PDF_WORKERS = 2;

/**
 * Check if a client IP exceeds rate limit
 * @param {string} ip - Client IP
 * @param {string} action - 'pdf' | 'video'
 * @param {number} maxRequests - Max requests allowed in window
 * @param {number} windowMs - Window duration in ms
 * @returns {{ allowed: boolean, remaining: number, retryAfterSec: number }}
 */
export function checkRateLimit(ip, action = 'pdf', maxRequests = 6, windowMs = 120000) {
    const key = `${action}:${ip}`;
    const now = Date.now();
    const entry = rateLimitMap.get(key);

    // Clean up old entry if expired
    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true, remaining: maxRequests - 1, retryAfterSec: 0 };
    }

    if (entry.count >= maxRequests) {
        const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
        return { allowed: false, remaining: 0, retryAfterSec };
    }

    entry.count += 1;
    return { allowed: true, remaining: maxRequests - entry.count, retryAfterSec: 0 };
}

/**
 * Get cached PDF if valid
 * @param {string} cacheKey - e.g. 'panduan:pkkmb'
 * @returns {string | null} base64Pdf
 */
export function getCachedPdf(cacheKey) {
    const entry = pdfCacheMap.get(cacheKey);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        pdfCacheMap.delete(cacheKey);
        return null;
    }
    return entry.base64Pdf;
}

/**
 * Set cached PDF with TTL (default 5 minutes)
 * @param {string} cacheKey - e.g. 'panduan:pkkmb'
 * @param {string} base64Pdf
 * @param {number} ttlMs - TTL in milliseconds (default 5 min)
 */
export function setCachedPdf(cacheKey, base64Pdf, ttlMs = 300000) {
    pdfCacheMap.set(cacheKey, {
        base64Pdf,
        expiresAt: Date.now() + ttlMs
    });
}

/**
 * Acquire concurrency lock for PDF generation
 * @returns {boolean} true if acquired, false if server is busy
 */
export function acquirePdfWorkerLock() {
    if (activePdfWorkers >= MAX_CONCURRENT_PDF_WORKERS) {
        return false;
    }
    activePdfWorkers += 1;
    return true;
}

/**
 * Release concurrency lock
 */
export function releasePdfWorkerLock() {
    if (activePdfWorkers > 0) {
        activePdfWorkers -= 1;
    }
}
