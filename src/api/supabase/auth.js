'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

export const loginAdmin = async (identifier, password, loginMethod) => {
    try {
        let loginEmail = identifier;
        let loginAdminId = null;

        if (loginMethod === 'nama') {
            const { data: adminData, error: adminError } = await supabaseAdmin
                .from('admins')
                .select('id, email')
                .ilike('nama', identifier)
                .single();

            if (adminError || !adminData) {
                return { success: false, error: 'Nama tidak ditemukan dalam sistem.' };
            }
            loginEmail = adminData.email;
            loginAdminId = adminData.id;
        } else {
            // Jika login pakai email, ambil admin id pertama yang cocok
            const { data: adminData } = await supabaseAdmin
                .from('admins')
                .select('id')
                .eq('email', identifier)
                .limit(1)
                .single();
            if (adminData) loginAdminId = adminData.id;
        }

        const { data, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
            email: loginEmail,
            password,
        });

        if (signInError) {
             return { success: false, error: 'Kredensial tidak valid. Silakan coba lagi.' };
        }

        // Update status online
        await supabaseAdmin
            .from('admins')
            .update({ is_online: true, last_active: new Date().toISOString() })
            .eq('user_id', data.user.id);

        const cookieStore = await cookies();
        cookieStore.set('sb-access-token', data.session.access_token, { path: '/', maxAge: 3600 });
        if (loginAdminId) {
            cookieStore.set('sb-admin-id', loginAdminId, { path: '/', maxAge: 3600 });
        }

        return { success: true, data };
    } catch (error) {
        console.error("Login error:", error);
        return { success: false, error: error.message };
    }
};

export const logoutAdmin = async (userId) => {
    try {
        if (userId) {
             await supabaseAdmin
                .from('admins')
                .update({ is_online: false })
                .eq('user_id', userId);
        }
        await supabaseAdmin.auth.signOut();
        const cookieStore = await cookies();
        cookieStore.delete('sb-access-token');
        cookieStore.delete('sb-admin-id');
        return { success: true };
    } catch (error) {
         console.error("Logout error:", error);
         return { success: false, error: error.message };
    }
};

export const getCurrentAdmin = async () => {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('sb-access-token')?.value;
        const adminId = cookieStore.get('sb-admin-id')?.value;

        if (!token) return null;

        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

        if (userError || !user) return null;

        let query = supabaseAdmin
            .from('admins')
            .select('*')
            .eq('user_id', user.id);

        if (adminId) {
            query = query.eq('id', adminId);
        }

        const { data: adminData, error: adminError } = await query.limit(1).single();

        if (adminError || !adminData) return null;

        return adminData;
    } catch (error) {
        console.error("Error getting current admin:", error);
        return null;
    }
};
