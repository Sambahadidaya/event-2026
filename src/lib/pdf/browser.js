/**
 * Browser launcher helper untuk PDF generation.
 * - Development (lokal): menggunakan full `puppeteer` (sudah bundled Chromium).
 * - Production / Vercel serverless: menggunakan `puppeteer-core` + `@sparticuz/chromium-min`.
 *
 * Pastikan sudah install:
 *   npm install puppeteer-core @sparticuz/chromium-min
 *   npm install --save-dev puppeteer
 */

const isDev = process.env.NODE_ENV === 'development';

/**
 * Launch a Puppeteer browser instance (environment-aware).
 * @returns {Promise<import('puppeteer-core').Browser>}
 */
export async function getBrowser() {
    if (isDev) {
        // Lokal: pakai puppeteer biasa (ada bundled Chromium)
        const puppeteer = await import('puppeteer');
        return puppeteer.default.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
    }

    // Production / Vercel: pakai puppeteer-core + @sparticuz/chromium-min
    const chromium = (await import('@sparticuz/chromium-min')).default;
    const puppeteerCore = (await import('puppeteer-core')).default;

    return puppeteerCore.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(
            // URL binary chromium untuk serverless (pilih versi sesuai puppeteer-core)
            'https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar'
        ),
        headless: chromium.headless,
    });
}
