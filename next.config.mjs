
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,

  // Wajib untuk Vercel serverless: jangan bundle native binary modules (sharp, canvas, puppeteer)
  serverExternalPackages: [
    'sharp',
    'canvas',
    'puppeteer-core',
    '@sparticuz/chromium-min',
    'puppeteer'
  ],

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdnjs.cloudflare.com",
              "worker-src 'self' blob: https://unpkg.com https://cdnjs.cloudflare.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in",
              "connect-src 'self' https://*.supabase.co https://*.supabase.in",
              "font-src 'self' data:",
              "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://*.supabase.co https://*.supabase.in"
            ].join('; ')
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          }
        ]
      }
    ];
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '20mb'
    }
  }
};

export default nextConfig;