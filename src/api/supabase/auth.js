'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

export const loginAdmin = async (identifier, password, loginMethod) => {
    try {
        let loginEmail = identifier;
        let loginAdminId = null;
        let adminRole = null;
        let adminDbData = null;

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
            // Jika login pakai email, ambil admin id pertama yang cocok
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

        // Cek Rate Limiting / Blokir
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

        const { data, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
            email: loginEmail,
            password,
        });

        if (signInError) {
            // Logika kegagalan login
            let newFailedAttempts = (adminDbData.failed_attempts || 0) + 1;
            let newLockoutUntil = null;
            let newFirstFailedAt = adminDbData.first_failed_at;
            let isBlocked = false;
            
            const now = new Date();
            
            // Reset hitungan jika sudah lebih dari 1 jam sejak gagal pertama
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
                // Kunci 5 menit
                newLockoutUntil = new Date(now.getTime() + 5 * 60000).toISOString();
            } else if (newFailedAttempts >= 8) {
                // Blokir permanen
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

        // Reset rate limit info saat berhasil login
        await supabaseAdmin
            .from('admins')
            .update({ 
                is_online: true, 
                last_active: new Date().toISOString(),
                failed_attempts: 0,
                lockout_until: null,
                first_failed_at: null
            })
            .eq('user_id', data.user.id);

        const cookieStore = await cookies();
        cookieStore.set('sb-access-token', data.session.access_token, { path: '/', maxAge: 3600 });
        if (loginAdminId) {
            cookieStore.set('sb-admin-id', loginAdminId, { path: '/', maxAge: 3600 });
        }

        return { success: true, data, adminRole };
    } catch (error) {
        console.error("Login error:", error);
        return { success: false, error: error.message };
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
        console.error("QR Check error:", error);
        return { success: false, error: error.message };
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

        // Buat magic link untuk mendapatkan akses token tanpa password
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: adminData.email
        });

        if (linkError || !linkData?.properties?.action_link) {
            console.error("Generate link error:", linkError);
            return { success: false, error: 'Gagal membuat sesi login.' };
        }

        // Ambil token_hash dari URL yang di-generate
        const url = new URL(linkData.properties.action_link);
        const token_hash = url.searchParams.get('token_hash');

        if (!token_hash) {
            return { success: false, error: 'Token hash tidak ditemukan.' };
        }

        // Verifikasi token untuk login dan dapatkan session
        const { data: authData, error: authError } = await supabaseAdmin.auth.verifyOtp({
            token_hash,
            type: 'magiclink'
        });

        if (authError || !authData?.session) {
            console.error("Verify OTP error:", authError);
            return { success: false, error: 'Gagal memverifikasi sesi login QR.' };
        }

        // Update status online
        await supabaseAdmin
            .from('admins')
            .update({ is_online: true, last_active: new Date().toISOString() })
            .eq('user_id', authData.user.id);

        const cookieStore = await cookies();
        cookieStore.set('sb-access-token', authData.session.access_token, { path: '/', maxAge: 3600 });
        cookieStore.set('sb-admin-id', adminData.id, { path: '/', maxAge: 3600 });
        
        // Hapus token qr sementara jika ada (sudah tidak diperlukan karena kita punya akses token sesungguhnya)
        cookieStore.delete('sb-qr-token');

        return { success: true, adminRole: adminData.role };
    } catch (error) {
        console.error("QR Login error:", error);
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
        cookieStore.delete('sb-qr-token');
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
        const qrToken = cookieStore.get('sb-qr-token')?.value;

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
