'use server';

import { supabaseAdmin } from '@/lib/supabase';

/**
 * Mendapatkan status pengembangan (kunci: boolean)
 * @returns {Promise<{ kunci: boolean }>}
 */

// Mode Production 
export const getStatusPengembangan = async (site, route) => {
    try {
        if (!site || !route) {
            return { kunci: false };
        }

        let query = supabaseAdmin
            .from('pengembangan')
            .select('kunci')
            .eq('site', site)
            .eq('route', route)
            .maybeSingle();

        const { data, error } = await query;

        if (error) throw error;
        if (!data) {
            return { kunci: false };
        }
        return { kunci: Boolean(data.kunci) };
    } catch (error) {
        console.error("Internal Log - Error fetching status pengembangan:", error);
        return { kunci: false };
    }
};

// Mode Deploy / Bypass (Development)
// export const getStatusPengembangan = async (site, route) => {
//     try {
//         if (!site || !route) {
//             return { kunci: false };
//         }

//         console.log(`[Bypass API] Cek status pengembangan -> site: "${site}", route: "${route}"`);

//         return { kunci: false };

//     } catch (error) {
//         console.error("Internal Log - Error pada bypass status pengembangan:", error);
//         return { kunci: false };
//     }
// };
