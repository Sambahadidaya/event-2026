'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// Helper untuk membuat auth client standar yang akan otomatis mengatur cookie browser
const createAuthClient = async () => {
    const cookieStore = await cookies();
    return createServerClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_ANON_KEY,
        {
            cookies: {
                get(name) { return cookieStore.get(name)?.value; },
                set(name, value, options) { cookieStore.set({ name, value, ...options }); },
                remove(name, options) { cookieStore.set({ name, value: '', ...options }); }
            }
        }
    );
};

export const loginAdmin = async (identifier, password, loginMethod) => {
    try {
        let loginEmail = identifier;
        let loginAdminId = null;
        let adminRole = null;
        let adminDbData = null;

        // 1. Cek User di Database menggunakan Admin Client (Bypass RLS)
        if (loginMethod === 'nama') {
            const { data: adminData, error: adminError } = await supabaseAdmin
                .from('admins')
                .select('id, email, role, limit_login, failed_attempts, lockout_until, first_failed_at')
                .ilike('nama', identifier)
                .single();

            if (adminError || !adminData) {
                return { success: false, error: 'Nama tidak ditemukan dalam sistem.' };
            }
            adminDbData = adminData;
            loginEmail = adminData.email;
            loginAdminId = adminData.id;
            adminRole = adminData.role;
        } else {
            const { data: adminData } = await supabaseAdmin
                .from('admins')
                .select('id, email, role, limit_login, failed_attempts, lockout_until, first_failed_at')
                .eq('email', identifier)
                .limit(1)
                .single();

            if (adminData) {
                adminDbData = adminData;
                loginAdminId = adminData.id;
                adminRole = adminData.role;
                loginEmail = adminData.email;
            } else {
                return { success: false, error: 'Email tidak ditemukan.' };
            }
        }

        // 2. Cek Rate Limiting / Blokir
        if (adminDbData.limit_login) {
            return { success: false, error: 'Akun Anda telah diblokir permanen karena terlalu banyak percobaan gagal.' };
        }

        if (adminDbData.lockout_until) {
            const lockoutTime = new Date(adminDbData.lockout_until).getTime();
            const now = new Date().getTime();

            if (now < lockoutTime) {
                const remaining = Math.ceil((lockoutTime - now) / 1000);
                return { success: false, error: 'Terlalu banyak percobaan gagal.', cooldown: remaining };
            }
        }

        // 3. Authenticate menggunakan Auth Client biasa agar Cookie SSR standar otomatis tersetting!
        const supabaseAuth = await createAuthClient();
        const { data, error: signInError } = await supabaseAuth.auth.signInWithPassword({
            email: loginEmail,
            password,
        });

        // 4. Handle Gagal Login
        if (signInError) {
            let newFailedAttempts = (adminDbData.failed_attempts || 0) + 1;
            let newLockoutUntil = null;
            let newFirstFailedAt = adminDbData.first_failed_at;
            let isBlocked = false;

            const now = new Date();

            if (newFirstFailedAt) {
                const firstFailedTime = new Date(newFirstFailedAt).getTime();
                if (now.getTime() - firstFailedTime > 3600000) {
                    newFailedAttempts = 1;
                    newFirstFailedAt = now.toISOString();
                }
            } else {
                newFirstFailedAt = now.toISOString();
            }

            if (newFailedAttempts === 3) {
                newLockoutUntil = new Date(now.getTime() + 5 * 60000).toISOString();
            } else if (newFailedAttempts >= 8) {
                isBlocked = true;
            }

            await supabaseAdmin
                .from('admins')
                .update({
                    failed_attempts: newFailedAttempts,
                    lockout_until: newLockoutUntil,
                    first_failed_at: newFirstFailedAt,
                    limit_login: isBlocked
                })
                .eq('id', loginAdminId);

            if (newLockoutUntil) {
                return { success: false, error: 'Terlalu banyak percobaan gagal.', cooldown: 300 };
            } else if (isBlocked) {
                return { success: false, error: 'Akun Anda telah diblokir permanen karena terlalu banyak percobaan gagal.' };
            }

            return { success: false, error: 'Kredensial tidak valid. Silakan coba lagi.' };
        }

        // 5. Berhasil Login - Reset rate limit
        await supabaseAdmin
            .from('admins')
            .update({
                is_online: true,
                last_active: new Date().toISOString(),
                failed_attempts: 0,
                lockout_until: null,
                first_failed_at: null,
                user_id: data.user.id
            })
            .eq('id', loginAdminId);

        // Tambahan custom cookie untuk ID admin jika dibutuhkan oleh aplikasi kamu
        const cookieStore = await cookies();
        if (loginAdminId) {
            cookieStore.set('sb-admin-id', loginAdminId, { path: '/', maxAge: 3600 });
        }

        return { success: true, adminRole };
    } catch (error) {
        console.error("Internal Log - Login error:", error);
        return { success: false, error: 'Terjadi kesalahan internal pada server.' };
    }
};

export const checkQR = async (qrString) => {
    try {
        const { data: adminData, error: adminError } = await supabaseAdmin
            .from('admins')
            .select('id, email, limit_login, lockout_until')
            .eq('qrcode', qrString)
            .single();

        if (adminError || !adminData) {
            return { success: false, error: 'QR Code tidak valid atau tidak ditemukan dalam sistem.' };
        }

        if (adminData.limit_login) {
            return { success: false, error: 'Akun Anda telah diblokir permanen.' };
        }

        if (adminData.lockout_until) {
            const lockoutTime = new Date(adminData.lockout_until).getTime();
            const now = new Date().getTime();
            if (now < lockoutTime) {
                const remaining = Math.ceil((lockoutTime - now) / 1000);
                return { success: false, error: 'Terlalu banyak percobaan gagal.', cooldown: remaining };
            }
        }

        return { success: true, email: adminData.email };
    } catch (error) {
        console.error("Internal Log - QR Check error:", error);
        return { success: false, error: 'Terjadi kesalahan internal pada server.' };
    }
};

export const loginAdminWithQR = async (qrString) => {
    try {
        const { data: adminData, error: adminError } = await supabaseAdmin
            .from('admins')
            .select('id, email, role, user_id')
            .eq('qrcode', qrString)
            .single();

        if (adminError || !adminData) {
            return { success: false, error: 'QR Code tidak valid atau tidak ditemukan dalam sistem.' };
        }

        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: adminData.email
        });

        if (linkError || !linkData?.properties?.action_link) {
            return { success: false, error: 'Gagal membuat sesi login.' };
        }

        const url = new URL(linkData.properties.action_link);
        const token_hash = url.searchParams.get('token_hash');

        if (!token_hash) {
            return { success: false, error: 'Token hash tidak ditemukan.' };
        }

        // Verifikasi OTP menggunakan Auth Client standar untuk men-set cookie browser
        const supabaseAuth = await createAuthClient();
        const { data: authData, error: authError } = await supabaseAuth.auth.verifyOtp({
            token_hash,
            type: 'magiclink'
        });

        if (authError || !authData?.session) {
            return { success: false, error: 'Gagal memverifikasi sesi login QR.' };
        }

        await supabaseAdmin
            .from('admins')
            .update({ is_online: true, last_active: new Date().toISOString(), user_id: authData.user.id })
            .eq('id', adminData.id);

        const cookieStore = await cookies();
        cookieStore.set('sb-admin-id', adminData.id, { path: '/', maxAge: 3600 });
        cookieStore.delete('sb-qr-token');

        return { success: true, adminRole: adminData.role };
    } catch (error) {
        console.error("Internal Log - QR Login error:", error);
        return { success: false, error: 'Terjadi kesalahan internal pada server.' };
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

        // Gunakan Auth Client untuk menghapus cookie bawaan Supabase
        const supabaseAuth = await createAuthClient();
        await supabaseAuth.auth.signOut();

        const cookieStore = await cookies();
        cookieStore.delete('sb-admin-id');
        cookieStore.delete('sb-qr-token');
        return { success: true };
    } catch (error) {
        console.error("Internal Log - Logout error:", error);
        return { success: false, error: 'Terjadi kesalahan internal pada server.' };
    }
};

export const getCurrentAdmin = async () => {
    try {
        const cookieStore = await cookies();
        const adminId = cookieStore.get('sb-admin-id')?.value;
        const qrToken = cookieStore.get('sb-qr-token')?.value;

        // Cek fallback QR token jika belum fully login
        if (qrToken) {
            const { data: adminData, error: adminError } = await supabaseAdmin
                .from('admins')
                .select('*')
                .eq('qrcode', qrToken)
                .single();
            if (adminData && !adminError) {
                if (adminId && adminData.id !== adminId) return null;
                return adminData;
            }
        }

        // Ambil data user menggunakan Auth Client agar membaca cookie dengan benar
        const supabaseAuth = await createAuthClient();
        const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();

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
        console.error("Internal Log - Error getting current admin:", error);
        return null;
    }
};