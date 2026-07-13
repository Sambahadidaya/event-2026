'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import logoPoltek from '@/assets/logopoltek.png';
import logoPkkmb from '@/assets/logopkkmb.png';
import logoPose from '@/assets/logopose.jpg';

export default function DynamicFavicon() {
    const pathname = usePathname();

    useEffect(() => {
        let iconUrl = logoPoltek.src;
        
        if (pathname?.startsWith('/pkkmb')) {
            iconUrl = logoPkkmb.src;
        } else if (pathname?.startsWith('/pose')) {
            iconUrl = logoPose.src;
        } else if (pathname?.startsWith('/panitia') || pathname?.startsWith('/portal')) {
            iconUrl = logoPoltek.src;
        }

        // Cari elemen link dengan rel="icon"
        let link = document.querySelector("link[rel~='icon']");
        
        // Jika belum ada, buat elemen baru
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
        }
        
        // Set href dengan logo yang sesuai
        link.href = iconUrl;
    }, [pathname]);

    return null;
}
