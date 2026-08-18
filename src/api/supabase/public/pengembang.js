'use server';

import { supabaseAdmin } from '@/lib/supabase';

/**
 * Mendapatkan status pengembangan (kunci: boolean)
 * @returns {Promise<{ kunci: boolean }>}
 */

// Mode Production 
export const getStatusPengembangan = async () => {
    try {
        const { data, error } = await supabaseAdmin
            .from('pengembangan')
            .select('kunci')
            .limit(1);

        if (error) throw error;
        if (!data || data.length === 0) {
            return { kunci: false };
        }
        return { kunci: Boolean(data[0].kunci) };
    } catch (error) {
        console.error("Internal Log - Error fetching status pengembangan:", error);
        return { kunci: false };
    }
};

//Mode Development
// export const getStatusPengembangan = async () => {
//     return { kunci: false };
// };

