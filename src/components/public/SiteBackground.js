'use client';

import { getTheme } from '@/lib/siteThemes';

export default function SiteBackground({ site, subtle = false }) {
    const theme = getTheme(site);

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
            {!subtle && (
                <div className={`absolute inset-0 ${theme.sectionBase}`} />
            )}

            {/* Grid Pattern Layer */}
            <div className="absolute inset-0 opacity-[0.06] dark:opacity-[0.04]"
                style={{
                    backgroundImage: `linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)`,
                    backgroundSize: '3rem 3rem',
                    maskImage: 'radial-gradient(circle at 50% 50%, black 20%, transparent 100%)',
                    WebkitMaskImage: 'radial-gradient(circle at 50% 50%, black 20%, transparent 100%)'
                }}
            />
            
            <div className="absolute inset-0 opacity-[0.06] dark:opacity-[0.04] hidden dark:block"
                style={{
                    backgroundImage: `linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)`,
                    backgroundSize: '3rem 3rem',
                    maskImage: 'radial-gradient(circle at 50% 50%, black 20%, transparent 100%)',
                    WebkitMaskImage: 'radial-gradient(circle at 50% 50%, black 20%, transparent 100%)'
                }}
            />

            {/* Dots Pattern Layer */}
            <div className="absolute inset-0 opacity-[0.2] dark:opacity-[0.1]"
                 style={{
                     backgroundImage: `radial-gradient(circle, #000 1.5px, transparent 1.5px)`,
                     backgroundSize: '1.5rem 1.5rem',
                     maskImage: 'radial-gradient(ellipse at 50% 50%, transparent 40%, black 100%)',
                     WebkitMaskImage: 'radial-gradient(ellipse at 50% 50%, transparent 40%, black 100%)'
                 }}
            />

            <div className="absolute inset-0 opacity-[0.2] dark:opacity-[0.1] hidden dark:block"
                 style={{
                     backgroundImage: `radial-gradient(circle, #fff 1.5px, transparent 1.5px)`,
                     backgroundSize: '1.5rem 1.5rem',
                     maskImage: 'radial-gradient(ellipse at 50% 50%, transparent 40%, black 100%)',
                     WebkitMaskImage: 'radial-gradient(ellipse at 50% 50%, transparent 40%, black 100%)'
                 }}
            />

            {/* Decorative Blobs */}
            <div className={`absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full blur-[100px] ${theme.blob1} animate-float opacity-60`} />
            <div className={`absolute top-1/2 -left-48 w-[400px] h-[400px] rounded-full blur-[90px] ${theme.blob2} animate-float opacity-50`} style={{ animationDelay: '2s' }} />
            <div className={`absolute bottom-32 right-1/4 w-[350px] h-[350px] rounded-full blur-[80px] ${theme.blob3} animate-float opacity-40`} style={{ animationDelay: '4s' }} />
        </div>
    );
}
