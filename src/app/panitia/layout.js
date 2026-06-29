'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import { User, LayoutDashboard, FileText, ChevronDown, ChevronRight, LogOut, ShieldAlert, Menu, BarChart3, MessageCircle, Mail, Newspaper, Users, Monitor } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function PanitiaLayout({ children }) {
    const [isDesktop, setIsDesktop] = useState(true);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState({ dashboard: true, pkkmb: false, pose: false, admin: false });
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [showDesktopWarning, setShowDesktopWarning] = useState(false);
    const [hasSeenDesktopWarning, setHasSeenDesktopWarning] = useState(false);
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
        const checkScreen = () => {
            const desktop = window.innerWidth >= 1024;
            setIsDesktop(desktop);
            if (desktop) setMobileSidebarOpen(false);
        };
        checkScreen();
        window.addEventListener('resize', checkScreen);
        return () => window.removeEventListener('resize', checkScreen);
    }, []);

    useEffect(() => {
        setMobileSidebarOpen(false);
        if (!isDesktop && !hasSeenDesktopWarning && pathname !== '/panitia/login') {
            setShowDesktopWarning(true);
        }
    }, [pathname, isDesktop, hasSeenDesktopWarning]);

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

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;
    }

    const toggleMenu = (key) => setMenuOpen(prev => ({ ...prev, [key]: !prev[key] }));
    const isActive = (path) => pathname === path;
    const collapsed = sidebarCollapsed && isDesktop;
    const closeMobile = () => setMobileSidebarOpen(false);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex overflow-hidden transition-colors duration-500">
            {!isDesktop && mobileSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 backdrop-blur-sm"
                    onClick={() => setMobileSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                ${isDesktop
                    ? `${collapsed ? 'w-[72px]' : 'w-72'} relative`
                    : `fixed inset-y-0 left-0 w-72 z-40 transform transition-transform duration-300 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
                }
                bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800/60 flex flex-col shadow-sm shrink-0
            `}>
                <div className={`border-b border-slate-200 dark:border-slate-800/60 flex items-center ${collapsed ? 'p-3 justify-center' : 'p-4 sm:p-6 gap-4'}`}>
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[14px] flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/20">
                        <User size={24} />
                    </div>
                    {!collapsed && (
                        <div className="overflow-hidden">
                            <h2 className="font-bold text-lg truncate text-slate-800 dark:text-white capitalize">{adminData?.nama || 'Admin Portal'}</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-medium capitalize">
                                {adminData?.role ? adminData.role.replace('_', ' ') : 'Panitia'}
                            </p>
                        </div>
                    )}
                </div>

                <nav className={`flex-1 overflow-y-auto py-6 space-y-2 custom-scrollbar ${collapsed ? 'px-2' : 'px-4'}`}>

                    <div className="mb-6">
                        {!collapsed && (
                            <p className="px-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Main Menu</p>
                        )}
                        <button
                            onClick={() => toggleMenu('dashboard')}
                            title="Dashboard"
                            className={`w-full flex ${collapsed ? 'justify-center px-2' : 'justify-between px-4'} py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 font-medium text-sm transition-all group`}
                        >
                            <span className={`flex items-center gap-3 text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors ${collapsed ? 'gap-0' : ''}`}>
                                <LayoutDashboard size={18} className="text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
                                {!collapsed && 'Dashboard'}
                            </span>
                            {!collapsed && (menuOpen.dashboard ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />)}
                        </button>
                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${menuOpen.dashboard ? 'max-h-48 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                            <ul className={`${collapsed ? 'pl-0 space-y-1' : 'pl-12 pr-3'} py-1 space-y-1.5 text-sm`}>
                                <li>
                                    <Link href="/panitia/dashboard/trafik" onClick={closeMobile} title="Trafik Kunjungan" className={`flex items-center ${collapsed ? 'justify-center px-2 py-2.5' : 'block px-3 py-2'} rounded-lg transition-colors ${isActive('/panitia/dashboard/trafik') ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'}`}>
                                        {collapsed ? <BarChart3 size={16} /> : 'Trafik Kunjungan'}
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/panitia/dashboard/faq" onClick={closeMobile} title="FAQ Chatbot" className={`flex items-center ${collapsed ? 'justify-center px-2 py-2.5' : 'block px-3 py-2'} rounded-lg transition-colors ${isActive('/panitia/dashboard/faq') ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'}`}>
                                        {collapsed ? <MessageCircle size={16} /> : 'FAQ Chatbot'}
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/panitia/dashboard/kontak" onClick={closeMobile} title="Kontak" className={`flex items-center ${collapsed ? 'justify-center px-2 py-2.5' : 'block px-3 py-2'} rounded-lg transition-colors ${isActive('/panitia/dashboard/kontak') ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'}`}>
                                        {collapsed ? <Mail size={16} /> : 'Kontak'}
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="mb-6">
                        {!collapsed && (
                            <p className="px-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Manajemen Konten</p>
                        )}
                        
                        {canAccessPkkmb && (
                            <>
                                <button
                                    onClick={() => toggleMenu('pkkmb')}
                                    title="PKKMB"
                                    className={`w-full flex ${collapsed ? 'justify-center px-2' : 'justify-between px-4'} py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 font-medium text-sm transition-all group mt-1`}
                                >
                                    <span className={`flex items-center gap-3 text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors ${collapsed ? 'gap-0' : ''}`}>
                                        <FileText size={18} className="text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
                                        {!collapsed && 'PKKMB'}
                                    </span>
                                    {!collapsed && (menuOpen.pkkmb ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />)}
                                </button>
                                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${menuOpen.pkkmb ? 'max-h-48 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                                    <ul className={`${collapsed ? 'pl-0 space-y-1' : 'pl-12 pr-3'} py-1 space-y-1.5 text-sm`}>
                                        <li>
                                            <Link href="/panitia/pkkmb/berita" onClick={closeMobile} title="Manajemen Berita PKKMB" className={`flex items-center ${collapsed ? 'justify-center px-2 py-2.5' : 'block px-3 py-2'} rounded-lg transition-colors ${isActive('/panitia/pkkmb/berita') ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'}`}>
                                                {sidebarCollapsed ? <Newspaper size={16} /> : 'Manajemen Berita'}
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href="/panitia/pkkmb/team" onClick={closeMobile} title="Manajemen Team PKKMB" className={`flex items-center ${collapsed ? 'justify-center px-2 py-2.5' : 'block px-3 py-2'} rounded-lg transition-colors ${isActive('/panitia/pkkmb/team') ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'}`}>
                                                {sidebarCollapsed ? <Users size={16} /> : 'Manajemen Team'}
                                            </Link>
                                        </li>
                                    </ul>
                                </div>
                            </>
                        )}

                        {canAccessPose && (
                            <>
                                <button
                                    onClick={() => toggleMenu('pose')}
                                    title="POSE"
                                    className={`w-full flex ${collapsed ? 'justify-center px-2' : 'justify-between px-4'} py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 font-medium text-sm transition-all group mt-1`}
                                >
                                    <span className={`flex items-center gap-3 text-slate-700 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors ${collapsed ? 'gap-0' : ''}`}>
                                        <FileText size={18} className="text-slate-400 group-hover:text-emerald-500 transition-colors shrink-0" />
                                        {!collapsed && 'POSE'}
                                    </span>
                                    {!collapsed && (menuOpen.pose ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />)}
                                </button>
                                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${menuOpen.pose ? 'max-h-48 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                                    <ul className={`${collapsed ? 'pl-0 space-y-1' : 'pl-12 pr-3'} py-1 space-y-1.5 text-sm`}>
                                        <li>
                                            <Link href="/panitia/pose/berita" onClick={closeMobile} title="Manajemen Berita POSE" className={`flex items-center ${collapsed ? 'justify-center px-2 py-2.5' : 'block px-3 py-2'} rounded-lg transition-colors ${isActive('/panitia/pose/berita') ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'}`}>
                                                {sidebarCollapsed ? <Newspaper size={16} /> : 'Manajemen Berita'}
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href="/panitia/pose/team" onClick={closeMobile} title="Manajemen Team POSE" className={`flex items-center ${collapsed ? 'justify-center px-2 py-2.5' : 'block px-3 py-2'} rounded-lg transition-colors ${isActive('/panitia/pose/team') ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'}`}>
                                                {sidebarCollapsed ? <Users size={16} /> : 'Manajemen Team'}
                                            </Link>
                                        </li>
                                    </ul>
                                </div>
                            </>
                        )}
                    </div>

                    {isSuperAdmin && (
                        <div className="mb-6">
                            {!collapsed && (
                                <p className="px-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Manajemen Admin</p>
                            )}
                            <button
                                onClick={() => toggleMenu('admin')}
                                title="Admin"
                                className={`w-full flex ${collapsed ? 'justify-center px-2' : 'justify-between px-4'} py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 font-medium text-sm transition-all group mt-1`}
                            >
                                <span className={`flex items-center gap-3 text-slate-700 dark:text-slate-300 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors ${collapsed ? 'gap-0' : ''}`}>
                                    <ShieldAlert size={18} className="text-slate-400 group-hover:text-violet-500 transition-colors shrink-0" />
                                    {!collapsed && 'Admin'}
                                </span>
                                {!collapsed && (menuOpen.admin ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />)}
                            </button>
                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${menuOpen.admin ? 'max-h-40 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                                <ul className={`${collapsed ? 'pl-0 space-y-1' : 'pl-12 pr-3'} py-1 space-y-1.5 text-sm`}>
                                    <li>
                                        <Link href="/panitia/admin/status" onClick={closeMobile} title="Status Admin" className={`flex items-center ${collapsed ? 'justify-center px-2 py-2.5' : 'block px-3 py-2'} rounded-lg transition-colors ${isActive('/panitia/admin/status') ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 font-semibold' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'}`}>
                                            {sidebarCollapsed ? <ShieldAlert size={16} /> : 'Status Admin'}
                                        </Link>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    )}
                </nav>

                <div className={`border-t border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-900 ${collapsed ? 'p-2' : 'p-4'}`}>
                    <button
                        onClick={handleLogout}
                        title="Logout Sistem"
                        className={`w-full flex items-center ${collapsed ? 'justify-center p-3' : 'justify-center gap-2 p-3'} bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-all text-sm group`}
                    >
                        <LogOut size={18} className="group-hover:-translate-x-1 transition-transform shrink-0" />
                        {!collapsed && 'Logout Sistem'}
                    </button>
                </div>
            </aside>

            <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-400/5 dark:bg-blue-600/5 rounded-full blur-[100px] pointer-events-none"></div>

                <header className="h-16 sm:h-20 glass border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between px-4 sm:px-8 shrink-0 z-10 sticky top-0">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <button
                            onClick={() => isDesktop ? setSidebarCollapsed(prev => !prev) : setMobileSidebarOpen(prev => !prev)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors shrink-0"
                            title={isDesktop ? (collapsed ? 'Tampilkan menu' : 'Sembunyikan menu') : 'Buka menu'}
                            aria-label="Toggle sidebar"
                        >
                            <Menu size={20} />
                        </button>
                        <div className="min-w-0">
                            <h1 className="font-extrabold text-lg sm:text-2xl text-slate-800 dark:text-white capitalize tracking-tight truncate">
                                {pathname.split('/').pop().replace('-', ' ')}
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 hidden sm:block">Pantau dan kelola data sistem</p>
                        </div>
                    </div>
                    <ThemeToggle />
                </header>

                <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar relative z-0">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </div>
            </main>

            {showDesktopWarning && pathname !== '/panitia/login' && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-sm w-full p-6 text-center animate-in fade-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Monitor size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Gunakan Perangkat Desktop</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                            Untuk pengalaman terbaik, kami menyarankan Anda untuk membuka halaman admin ini melalui perangkat Desktop atau Laptop.
                        </p>
                        <button
                            onClick={() => {
                                setShowDesktopWarning(false);
                                setHasSeenDesktopWarning(true);
                            }}
                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
                        >
                            Mengerti
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
