'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import { User, LayoutDashboard, FileText, ChevronDown, ChevronRight, LogOut, ShieldAlert } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function PanitiaLayout({ children }) {
    const [isDesktop, setIsDesktop] = useState(true);
    const [menuOpen, setMenuOpen] = useState({ dashboard: true, pkkmb: false, pose: false, admin: false });
    const [adminData, setAdminData] = useState(null);
    const [loading, setLoading] = useState(true);
    const pathname = usePathname();
    const router = useRouter();

    const activityTimer = useRef(null);
    const heartbeatInterval = useRef(null);

    // Activity tracking for auto logout (5 minutes = 300,000 ms)
    const INACTIVITY_LIMIT = 300000;

    const resetActivityTimer = () => {
        if (activityTimer.current) clearTimeout(activityTimer.current);
        activityTimer.current = setTimeout(handleAutoLogout, INACTIVITY_LIMIT);
    };

    const handleAutoLogout = async () => {
        if (adminData?.user_id) {
            await supabase.from('admins').update({ is_online: false }).eq('user_id', adminData.user_id);
        }
        await handleLogout();
    };

    const updateHeartbeat = async (userId) => {
        if (userId) {
            await supabase.from('admins').update({ last_active: new Date().toISOString() }).eq('user_id', userId);
        }
    };

    useEffect(() => {
        const checkScreen = () => setIsDesktop(window.innerWidth >= 1024);
        checkScreen();
        window.addEventListener('resize', checkScreen);
        return () => window.removeEventListener('resize', checkScreen);
    }, []);

    useEffect(() => {
        if (pathname === '/panitia/login') return;

        const fetchAdminData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/panitia/login');
                return;
            }

            const { data: admin } = await supabase
                .from('admins')
                .select('*')
                .eq('user_id', session.user.id)
                .single();

            if (admin) {
                setAdminData(admin);
                
                // Set initial status online and start heartbeat
                await supabase.from('admins').update({ is_online: true, last_active: new Date().toISOString() }).eq('id', admin.id);
                
                heartbeatInterval.current = setInterval(() => {
                    updateHeartbeat(session.user.id);
                }, 60000); // every 1 minute
            }
            setLoading(false);
        };

        fetchAdminData();

        // Setup activity listeners
        window.addEventListener('mousemove', resetActivityTimer);
        window.addEventListener('keydown', resetActivityTimer);
        window.addEventListener('scroll', resetActivityTimer);
        window.addEventListener('click', resetActivityTimer);

        resetActivityTimer();

        return () => {
            if (activityTimer.current) clearTimeout(activityTimer.current);
            if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
            window.removeEventListener('mousemove', resetActivityTimer);
            window.removeEventListener('keydown', resetActivityTimer);
            window.removeEventListener('scroll', resetActivityTimer);
            window.removeEventListener('click', resetActivityTimer);
        };
    }, [pathname]);

    const handleLogout = async () => {
        if (adminData?.user_id) {
            await supabase.from('admins').update({ is_online: false }).eq('user_id', adminData.user_id);
        }
        await supabase.auth.signOut();
        document.cookie = "sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        router.push('/panitia/login');
    };

    if (pathname === '/panitia/login') {
        return <>{children}</>;
    }

    const isSuperAdmin = adminData?.role === 'super_admin';
    const canAccessPkkmb = isSuperAdmin || adminData?.role === 'admin_pkkmb';
    const canAccessPose = isSuperAdmin || adminData?.role === 'admin_pose';

    // Route guards
    if (adminData && pathname.startsWith('/panitia/pkkmb') && !canAccessPkkmb) {
        router.replace('/panitia/dashboard/trafik');
        return null;
    }
    if (adminData && pathname.startsWith('/panitia/pose') && !canAccessPose) {
        router.replace('/panitia/dashboard/trafik');
        return null;
    }
    if (adminData && pathname.startsWith('/panitia/admin') && !isSuperAdmin) {
        router.replace('/panitia/dashboard/trafik');
        return null;
    }

    if (!isDesktop) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white p-6 text-center">
                <ShieldAlert size={64} className="text-red-500 mb-4" />
                <h1 className="text-2xl font-bold text-white mb-2">Akses Dibatasi</h1>
                <p className="text-gray-400">Halaman Admin Hanya Dapat Diakses Melalui Perangkat Desktop</p>
            </div>
        );
    }

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;
    }

    const toggleMenu = (key) => setMenuOpen(prev => ({ ...prev, [key]: !prev[key] }));
    const isActive = (path) => pathname === path;

    // Role checks moved up for route guards

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex overflow-hidden transition-colors duration-500">
            {/* Sidebar */}
            <aside className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800/60 flex flex-col z-20 relative shadow-sm">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800/60 flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[14px] flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/20">
                        <User size={24} />
                    </div>
                    <div className="overflow-hidden">
                        <h2 className="font-bold text-lg truncate text-slate-800 dark:text-white capitalize">{adminData?.nama || 'Admin Portal'}</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-medium capitalize">
                            {adminData?.role ? adminData.role.replace('_', ' ') : 'Panitia'}
                        </p>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2 custom-scrollbar">

                    <div className="mb-6">
                        <p className="px-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Main Menu</p>
                        <button onClick={() => toggleMenu('dashboard')} className="w-full flex justify-between items-center px-4 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 font-medium text-sm transition-all group">
                            <span className="flex items-center gap-3 text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"><LayoutDashboard size={18} className="text-slate-400 group-hover:text-blue-500 transition-colors" /> Dashboard</span>
                            {menuOpen.dashboard ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                        </button>
                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${menuOpen.dashboard ? 'max-h-40 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                            <ul className="pl-12 pr-3 py-1 space-y-1.5 text-sm">
                                <li>
                                    <Link href="/panitia/dashboard/trafik" className={`block px-3 py-2 rounded-lg transition-colors ${isActive('/panitia/dashboard/trafik') ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'}`}>Trafik Kunjungan</Link>
                                </li>
                                <li>
                                    <Link href="/panitia/dashboard/faq" className={`block px-3 py-2 rounded-lg transition-colors ${isActive('/panitia/dashboard/faq') ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'}`}>FAQ Chatbot</Link>
                                </li>
                                <li>
                                    <Link href="/panitia/dashboard/kontak" className={`block px-3 py-2 rounded-lg transition-colors ${isActive('/panitia/dashboard/kontak') ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'}`}>Kontak</Link>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="mb-6">
                        <p className="px-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Manajemen Konten</p>
                        
                        {canAccessPkkmb && (
                            <>
                                <button onClick={() => toggleMenu('pkkmb')} className="w-full flex justify-between items-center px-4 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 font-medium text-sm transition-all group mt-1">
                                    <span className="flex items-center gap-3 text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"><FileText size={18} className="text-slate-400 group-hover:text-blue-500 transition-colors" /> PKKMB</span>
                                    {menuOpen.pkkmb ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                                </button>
                                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${menuOpen.pkkmb ? 'max-h-40 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                                    <ul className="pl-12 pr-3 py-1 space-y-1.5 text-sm">
                                        <li>
                                            <Link href="/panitia/pkkmb/berita" className={`block px-3 py-2 rounded-lg transition-colors ${isActive('/panitia/pkkmb/berita') ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'}`}>Manajemen Berita</Link>
                                        </li>
                                        <li>
                                            <Link href="/panitia/pkkmb/team" className={`block px-3 py-2 rounded-lg transition-colors ${isActive('/panitia/pkkmb/team') ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'}`}>Manajemen Team</Link>
                                        </li>
                                    </ul>
                                </div>
                            </>
                        )}

                        {canAccessPose && (
                            <>
                                <button onClick={() => toggleMenu('pose')} className="w-full flex justify-between items-center px-4 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 font-medium text-sm transition-all group mt-1">
                                    <span className="flex items-center gap-3 text-slate-700 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors"><FileText size={18} className="text-slate-400 group-hover:text-emerald-500 transition-colors" /> POSE</span>
                                    {menuOpen.pose ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                                </button>
                                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${menuOpen.pose ? 'max-h-40 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                                    <ul className="pl-12 pr-3 py-1 space-y-1.5 text-sm">
                                        <li>
                                            <Link href="/panitia/pose/berita" className={`block px-3 py-2 rounded-lg transition-colors ${isActive('/panitia/pose/berita') ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'}`}>Manajemen Berita</Link>
                                        </li>
                                        <li>
                                            <Link href="/panitia/pose/team" className={`block px-3 py-2 rounded-lg transition-colors ${isActive('/panitia/pose/team') ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'}`}>Manajemen Team</Link>
                                        </li>
                                    </ul>
                                </div>
                            </>
                        )}
                    </div>

                    {isSuperAdmin && (
                        <div className="mb-6">
                            <p className="px-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Manajemen Admin</p>
                            <button onClick={() => toggleMenu('admin')} className="w-full flex justify-between items-center px-4 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 font-medium text-sm transition-all group mt-1">
                                <span className="flex items-center gap-3 text-slate-700 dark:text-slate-300 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors"><ShieldAlert size={18} className="text-slate-400 group-hover:text-violet-500 transition-colors" /> Admin</span>
                                {menuOpen.admin ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                            </button>
                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${menuOpen.admin ? 'max-h-40 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                                <ul className="pl-12 pr-3 py-1 space-y-1.5 text-sm">
                                    <li>
                                        <Link href="/panitia/admin/status" className={`block px-3 py-2 rounded-lg transition-colors ${isActive('/panitia/admin/status') ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 font-semibold' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'}`}>Status Admin</Link>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    )}
                </nav>

                <div className="p-4 border-t border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900">
                    <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-all text-sm group">
                        <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" /> Logout Sistem
                    </button>
                </div>
            </aside>

            <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-400/5 dark:bg-blue-600/5 rounded-full blur-[100px] pointer-events-none"></div>

                <header className="h-20 glass border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between px-8 shrink-0 z-10 sticky top-0">
                    <div>
                        <h1 className="font-extrabold text-2xl text-slate-800 dark:text-white capitalize tracking-tight">
                            {pathname.split('/').pop().replace('-', ' ')}
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Pantau dan kelola data sistem</p>
                    </div>
                    <ThemeToggle />
                </header>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative z-0">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
