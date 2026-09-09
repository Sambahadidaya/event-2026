
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

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.supabase.in' },
      { protocol: 'https', hostname: '**.tiktokcdn.com' },
      { protocol: 'https', hostname: '**.cdninstagram.com' },
      { protocol: 'https', hostname: '**.ytimg.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' }
    ]
  },

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
              "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in https://*.cdninstagram.com https://*.tiktokcdn.com https://*.tiktokcdn-us.com https://*.ytimg.com https://i.ytimg.com https://*.youtube.com",
              "media-src 'self' data: blob: https://*.supabase.co https://*.supabase.in https://*.tiktokcdn.com https://*.cdninstagram.com",
              "connect-src 'self' https://*.supabase.co https://*.supabase.in https://www.tiktok.com https://*.tiktok.com https://www.instagram.com https://*.instagram.com https://www.youtube.com",
              "font-src 'self' data:",
              "frame-src 'self' https://drive.google.com https://docs.google.com https://www.youtube.com https://www.youtube-nocookie.com https://youtu.be https://www.tiktok.com https://*.tiktok.com https://www.instagram.com https://*.instagram.com https://*.supabase.co https://*.supabase.in"
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