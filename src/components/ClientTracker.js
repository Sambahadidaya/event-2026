'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { recordTrafik } from '@/api/supabase/public/admin';

export default function ClientTracker() {
    const pathname = usePathname();

    useEffect(() => {
        const trackVisit = async () => {
            // Determine site
            let site = 'portal';
            if (pathname.startsWith('/pkkmb')) {
                site = 'pkkmb';
            } else if (pathname.startsWith('/pose')) {
                site = 'pose';
            } else if (pathname.startsWith('/panitia')) {
                // Don't track panitia visits
                return;
            }

            const storageKey = `last_visit_${site}`;
            const lastVisit = localStorage.getItem(storageKey);
            const now = Date.now();
            const ONE_HOUR = 3600000;

            if (!lastVisit || (now - parseInt(lastVisit)) > ONE_HOUR) {
                // Save to localStorage immediately to prevent double counting during async request
                localStorage.setItem(storageKey, now.toString());

                // Insert to database using server action
                await recordTrafik(site);
            }
        };

        trackVisit();
    }, [pathname]);

    return null;
}
