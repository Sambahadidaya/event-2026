'use client';

import { useState, useEffect } from 'react';
import { getCurrentAdmin } from '@/api/supabase/admin/auth';
import { getPanduanAdminBySite } from '@/api/logic/panduan_admin';
import PanduanAdminPage from '@/components/panitia/PanduanAdminPage';

export default function AdminPanduanPage() {
    const [admin, setAdmin] = useState(null);
    const [site, setSite] = useState('pkkmb');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            const currentAdmin = await getCurrentAdmin();
            setAdmin(currentAdmin);

            let initialSite = 'pkkmb';
            if (currentAdmin?.role?.includes('pose')) {
                initialSite = 'pose';
            }
            setSite(initialSite);

            const result = await getPanduanAdminBySite(initialSite);
            setData(result);
            setLoading(false);
        };

        init();
    }, []);

    const handleSiteChange = async (newSite) => {
        setSite(newSite);
        setLoading(true);
        const result = await getPanduanAdminBySite(newSite);
        setData(result);
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const isSuperAdmin = admin?.role === 'super_admin';

    return (
        <div className="space-y-4">
            {/* Site Switcher for Super Admin */}
            {isSuperAdmin && (
                <div className="flex items-center justify-end gap-2 bg-slate-900 border border-slate-800 p-2 rounded-2xl">
                    <span className="text-xs font-bold text-slate-400 px-2">Pilih Portal:</span>
                    <button
                        onClick={() => handleSiteChange('pkkmb')}
                        className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${site === 'pkkmb'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        PKKMB 2026
                    </button>
                    <button
                        onClick={() => handleSiteChange('pose')}
                        className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${site === 'pose'
                            ? 'bg-orange-600 text-white shadow-md'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        POSE 2026
                    </button>
                </div>
            )}

            {data && <PanduanAdminPage site={site} data={data} />}
        </div>
    );
}
