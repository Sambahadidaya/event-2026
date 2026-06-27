'use client';

import { getTheme } from '@/lib/siteThemes';

export default function SiteBackground({ site, subtle = false }) {
    const theme = getTheme(site);

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
            {!subtle && (
                <div className={`absolute inset-0 ${theme.sectionBase}`} />
            )}

            <div className={`absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full blur-[100px] ${theme.blob1} animate-float opacity-60`} />
            <div className={`absolute top-1/2 -left-48 w-[400px] h-[400px] rounded-full blur-[90px] ${theme.blob2} animate-float opacity-50`} style={{ animationDelay: '2s' }} />
            <div className={`absolute bottom-32 right-1/4 w-[350px] h-[350px] rounded-full blur-[80px] ${theme.blob3} animate-float opacity-40`} style={{ animationDelay: '4s' }} />
        </div>
    );
}
