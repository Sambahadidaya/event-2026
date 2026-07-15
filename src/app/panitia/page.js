'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentAdmin } from '@/api/supabase/auth';
import { rolePermissions } from '@/lib/adminRoleData';

export default function PanitiaHome() {
    const router = useRouter();

    useEffect(() => {
        const redirectByRole = async () => {
            const admin = await getCurrentAdmin();

            if (!admin) {
                router.replace('/panitia/login');
                return;
            }

            const role = admin.role;
            const perms = rolePermissions[role];

            if (!perms || perms.length === 0) {
                router.replace('/panitia/login');
                return;
            }

            if (perms.includes('*')) {
                // super_admin → default dashboard
                router.replace('/panitia/dashboard/trafik');
            } else {
                // Non-super_admin → first allowed route
                router.replace(perms[0]);
            }
        };

        redirectByRole();
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
}
