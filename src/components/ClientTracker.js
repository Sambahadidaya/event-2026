'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

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

                // Insert to database
                const { error } = await supabase
                    .from('trafik_kunjungan')
                    .insert([{ site }]);

                if (error) {
                    console.error('Error tracking visit:', error);
                    // Revert localStorage if failed so it tries again next time
                    localStorage.removeItem(storageKey);
                }
            }
        };

        trackVisit();
    }, [pathname]);

    return null;
}
