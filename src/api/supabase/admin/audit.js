'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

/**
 * Validates the current session to ensure the user is an admin.
 * @returns {Promise<{ user: object | null, error: string | null }>}
 */
export const checkAdminAuth = async () => {
    try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_ANON_KEY,
            {
                cookies: {
                    get(name) {
                        return cookieStore.get(name)?.value;
                    },
                    // Tambahkan fungsi set untuk memperbarui token otomatis
                    set(name, value, options) {
                        try {
                            cookieStore.set({ name, value, ...options });
                        } catch (error) {
                            // Di Server Components kadang tidak boleh set cookie, 
                            // tapi di Server Actions ('use server') ini aman dijalankan.
                        }
                    },
                    // Tambahkan fungsi remove untuk menghapus token saat logout/invalid
                    remove(name, options) {
                        try {
                            cookieStore.set({ name, value: '', ...options });
                        } catch (error) {
                            // Handle error aman
                        }
                    }
                },
            }
        );

        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
            return { user: null, error: 'Unauthorized access' };
        }

        // Check jika user ada di tabel admins
        const { data: adminData, error: adminError } = await supabaseAdmin
            .from('admins')
            .select('id, role, nama')
            .eq('user_id', user.id)
            .single();

        if (adminError || !adminData) {
            return { user: null, adminNama: null, error: 'Unauthorized access: Not an admin' };
        }

        return { user, adminNama: adminData.nama, error: null };
    } catch (error) {
        console.error("Auth Check Error:", error);
        return { user: null, adminNama: null, error: 'Internal server error during auth check' };
    }
};

/**
 * Inserts an audit log into the audit_logs table.
 * @param {string} adminEmail - Email of the admin performing the action.
 * @param {string} action - Describe the action (e.g., 'UPDATE_STATUS_PEMBAYARAN').
 * @param {string} targetId - ID of the affected row.
 * @param {string} details - Additional details (e.g., 'Status changed from Pending to Lunas').
 * @param {string} [adminNama] - Nama of the admin performing the action.
 */
export const insertAuditLog = async (adminEmail, action, targetId, details, adminNama = null) => {
    try {
        await supabaseAdmin.from('audit_logs').insert([
            {
                admin_email: adminEmail,
                admin_nama: adminNama,
                action,
                target_id: targetId,
                details
            }
        ]);
    } catch (error) {
        console.error("Failed to insert audit log:", error);
    }
};
