'use server';

import { ketentuanData } from '@/data/ketentuanData';

export async function getKetentuanBySite(site) {
    if (!site || !ketentuanData[site]) {
        return { sections: [] };
    }
    return ketentuanData[site];
}
