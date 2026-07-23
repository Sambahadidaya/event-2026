'use client';

import { useEffect, useState } from 'react';
import { getCurrentAdmin } from '@/api/supabase/admin/auth';
import AdminKeuanganDashboard from '@/components/panitia/AdminKeuanganDashboard';

export default function KeuanganDashboardPage() {
    const [siteType, setSiteType] = useState('all');
    const [adminRole, setAdminRole] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAdminRole = async () => {
            const admin = await getCurrentAdmin();
            if (admin && admin.role) {
                setAdminRole(admin.role);
                const role = admin.role;
                if (role === 'super_admin') {
                    setSiteType('all');
                } else if (role.includes('pkkmb')) {
                    setSiteType('pkkmb');
                } else if (role.includes('pose')) {
                    setSiteType('pose');
                } else {
                    setSiteType('all');
                }
            }
            setLoading(false);
        };
        fetchAdminRole();
    }, []);

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return <AdminKeuanganDashboard siteType={siteType} adminRole={adminRole} />;
}
