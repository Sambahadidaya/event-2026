'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import { User, LayoutDashboard, FileText, ChevronDown, ChevronRight, LogOut, ShieldAlert, Menu, BarChart3, MessageCircle, Mail, Newspaper, Users, Monitor, Lock, Calendar, Settings, BookOpen, FileCheck, ClipboardList, Trophy, Wallet, Receipt, Tags, BookMarked, ArrowLeftRight, BookOpenCheck, TrendingUp, TrendingDown, Scale, Table2, PieChart, CreditCard, UserCheck, Award } from 'lucide-react';
import { logoutAdmin, getCurrentAdmin } from '@/api/supabase/admin/auth';
import { setAdminOffline, logoutPanitiaAction } from '@/api/logic/panitiaAuthLogic';
import { updateAdminStatus } from '@/api/supabase/admin/admin';
import { hasAccess, rolePermissions, canAccessSection } from '@/lib/adminRoleData';
import SamsAsisten from '@/components/SamsAsisten';

export default function PanitiaLayout({ children }) {
    const [isDesktop, setIsDesktop] = useState(true);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState({ dashboard: true, pkkmb: false, pose: false, form: false, absensi_panitia: false, pj_lomba: false, keuangan: false, admin: false, sales: false, kabim: false, Medis: false, Mulmed: false, Tatib: false });
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [showDesktopWarning, setShowDesktopWarning] = useState(false);
    const [hasSeenDesktopWarning, setHasSeenDesktopWarning] = useState(false);
    const [adminData, setAdminData] = useState(null);
    const [loading, setLoading] = useState(true);
    const pathname = usePathname();
    const router = useRouter();

    const activityTimer = useRef(null);
    const heartbeatInterval = useRef(null);
    const handleLogoutRef = useRef(null);
    const userIdRef = useRef(null);

    // Activity tracking for auto logout (1 hour = 3,600,000 ms)
    const INACTIVITY_LIMIT = 3600000;

    const resetActivityTimer = () => {
        if (activityTimer.current) clearTimeout(activityTimer.current);
        activityTimer.current = setTimeout(() => {
            if (handleLogoutRef.current) handleLogoutRef.current();
        }, INACTIVITY_LIMIT);
    };

    const updateHeartbeat = async (userId) => {
        if (userId) {
            await updateAdminStatus(userId, { is_online: true, last_active: new Date().toISOString() });
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

        // Reset loading on each navigation so the guard waits for fresh admin data
        setLoading(true);

        const fetchAdminData = async () => {
            const adminUser = await getCurrentAdmin();
            if (adminUser) {
                setAdminData(adminUser);
                if (adminUser.user_id) {
                    userIdRef.current = adminUser.user_id;
                    updateHeartbeat(adminUser.user_id);
                }
            } else {
                setLoading(false);
                router.push('/panitia/login');
                return;
            }

            setLoading(false);
        };

        fetchAdminData();

        // Listener saat browser/tab ditutup atau tab hidden
        const handleUnloadOrClose = () => {
            const userId = userIdRef.current;
            if (userId) {
                setAdminOffline(userId);
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                const userId = userIdRef.current;
                if (userId) {
                    setAdminOffline(userId);
                }
            } else if (document.visibilityState === 'visible') {
                resetActivityTimer();
                if (userIdRef.current) {
                    updateHeartbeat(userIdRef.current);
                }
            }
        };

        window.addEventListener('beforeunload', handleUnloadOrClose);
        window.addEventListener('pagehide', handleUnloadOrClose);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Periodic heartbeat every 30 seconds to keep online status active
        heartbeatInterval.current = setInterval(() => {
            if (document.visibilityState === 'visible' && userIdRef.current) {
                updateHeartbeat(userIdRef.current);
            }
        }, 30000);

        // Setup activity listeners
        window.addEventListener('mousemove', resetActivityTimer);
        window.addEventListener('keydown', resetActivityTimer);
        window.addEventListener('scroll', resetActivityTimer);
        window.addEventListener('click', resetActivityTimer);
        window.addEventListener('touchstart', resetActivityTimer);

        resetActivityTimer();

        return () => {
            if (activityTimer.current) clearTimeout(activityTimer.current);
            if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
            window.removeEventListener('beforeunload', handleUnloadOrClose);
            window.removeEventListener('pagehide', handleUnloadOrClose);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('mousemove', resetActivityTimer);
            window.removeEventListener('keydown', resetActivityTimer);
            window.removeEventListener('scroll', resetActivityTimer);
            window.removeEventListener('click', resetActivityTimer);
            window.removeEventListener('touchstart', resetActivityTimer);
        };
    }, [pathname]);

    const handleLogout = async () => {
        const userId = adminData?.user_id || userIdRef.current;
        if (userId) {
            await logoutPanitiaAction(userId);
        } else {
            await logoutPanitiaAction();
        }
        document.cookie = "sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        setAdminData(null);
        userIdRef.current = null;
        router.push('/panitia/login');
    };

    // Keep ref in sync for auto-logout timer
    handleLogoutRef.current = handleLogout;

    if (pathname === '/panitia/login') {
        return <>{children}</>;
    }

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;
    }

    if (!adminData && pathname !== '/panitia/login') {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;
    }

    // Route guards — redirect to first accessible route for the role
    if (adminData && !hasAccess(adminData.role, pathname)) {
        const role = adminData.role;
        const perms = rolePermissions[role];
        let fallback = '/panitia/login';
        if (perms && perms.length > 0) {
            if (perms.includes('*')) {
                // super_admin can access everything, but if somehow here, send to trafik
                fallback = '/panitia/dashboard/trafik';
            } else {
                // Find the first allowed route that is NOT the current pathname (avoid loops)
                fallback = perms[0];
            }
        }
        // Only redirect if fallback differs from current path to avoid infinite loops
        if (fallback !== pathname) {
            router.replace(fallback);
        }
        return null;
    }

    const toggleMenu = (key) => setMenuOpen(prev => ({ ...prev, [key]: !prev[key] }));
    const isActive = (path) => pathname === path;
    const collapsed = sidebarCollapsed && isDesktop;
    const closeMobile = () => setMobileSidebarOpen(false);

    const NavLink = ({ href, icon: Icon, label, colorTheme = 'blue' }) => {
        const access = adminData ? hasAccess(adminData.role, href) : false;
        const active = isActive(href);

        let activeClasses = '';
        let hoverClasses = 'hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200 text-slate-500 dark:text-slate-400';

        if (colorTheme === 'blue') {
            activeClasses = 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold';
        } else if (colorTheme === 'emerald') {
            activeClasses = 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-semibold';
        } else if (colorTheme === 'violet') {
            activeClasses = 'bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 font-semibold';
        }

        if (!access) {
            return null;
        }

        return (
            <li>
                <Link href={href} onClick={closeMobile} title={label} className={`flex items-center ${collapsed ? 'justify-center px-2 py-2.5' : 'block px-3 py-2'} rounded-lg transition-colors ${active ? activeClasses : hoverClasses}`}>
                    {collapsed ? <Icon size={16} /> : <span className="flex items-center"><Icon size={16} className="inline mr-3" /> {label}</span>}
                </Link>
            </li>
        );
    };

    return (
        <div className="h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex overflow-hidden transition-colors duration-500">
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

                    {canAccessSection(adminData?.role, 'dashboard') && (
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
                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${menuOpen.dashboard ? 'max-h-64 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                                <ul className={`${collapsed ? 'pl-0 space-y-1' : 'pl-4 pr-3'} py-1 space-y-1.5 text-sm`}>
                                    <NavLink href="/panitia/dashboard/trafik" icon={BarChart3} label="Trafik Kunjungan" />
                                    <NavLink href="/panitia/dashboard/faq" icon={MessageCircle} label="FAQ Chatbot" />
                                    <NavLink href="/panitia/dashboard/kontak" icon={Mail} label="Kontak" />
                                    <NavLink href="/panitia/panduan" icon={BookOpen} label="Panduan Admin" />
                                </ul>
                            </div>
                        </div>
                    )}

                    {canAccessSection(adminData?.role, 'konten') && (
                        <div className="mb-6">
                            {!collapsed && (
                                <p className="px-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Manajemen Konten</p>
                            )}

                            {canAccessSection(adminData?.role, 'pkkmb') && (
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
                                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${menuOpen.pkkmb ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                                        <ul className={`${collapsed ? 'pl-0 space-y-1' : 'pl-4 pr-3'} py-1 space-y-1.5 text-sm`}>
                                            <NavLink href="/panitia/pkkmb/berita" icon={Newspaper} label="Manajemen Berita" />
                                            <NavLink href="/panitia/pkkmb/team" icon={Users} label="Manajemen Team" />
                                            <NavLink href="/panitia/pkkmb/form_wajib" icon={FileText} label="Manajemen Form Wajib" />
                                            <NavLink href="/panitia/pkkmb/peserta_wajib" icon={Users} label="Data Peserta Wajib" />
                                            <NavLink href="/panitia/pkkmb/jadwal_acara" icon={Calendar} label="Manajemen Jadwal Acara" />
                                            <NavLink href="/panitia/pkkmb/materi" icon={BookOpen} label="Manajemen Materi" />
                                            <NavLink href="/panitia/pkkmb/tugas" icon={FileCheck} label="Review Tugas" />
                                        </ul>
                                    </div>
                                </>
                            )}

                            {canAccessSection(adminData?.role, 'pose') && (
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
                                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${menuOpen.pose ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                                        <ul className={`${collapsed ? 'pl-0 space-y-1' : 'pl-4 pr-3'} py-1 space-y-1.5 text-sm`}>
                                            <NavLink href="/panitia/pose/jadwal_acara" icon={Calendar} label="Manajemen Jadwal Acara" colorTheme="emerald" />
                                            <NavLink href="/panitia/pose/berita" icon={Newspaper} label="Manajemen Berita" colorTheme="emerald" />
                                            <NavLink href="/panitia/pose/peserta" icon={Users} label="Data Seluruh Peserta" colorTheme="emerald" />
                                            <NavLink href="/panitia/pose/team" icon={Users} label="Manajemen Team" colorTheme="emerald" />
                                            <NavLink href="/panitia/pose/form_register" icon={FileText} label="Manajemen Form Register" colorTheme="emerald" />
                                            <NavLink href="/panitia/pose/jadwal_pertandingan" icon={Calendar} label="Manajemen Jadwal Pertandingan" colorTheme="emerald" />
                                            <NavLink href="/panitia/pose/form_wajib" icon={FileText} label="Manajemen Form Wajib" colorTheme="emerald" />
                                            <NavLink href="/panitia/pose/peserta_wajib" icon={Users} label="Data Peserta Wajib" colorTheme="emerald" />
                                        </ul>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {canAccessSection(adminData?.role, 'form') && (
                        <div className="mb-6">
                            {!collapsed && (
                                <p className="px-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Manajemen Form</p>
                            )}
                            <button
                                onClick={() => toggleMenu('form')}
                                title="Form Terpadu"
                                className={`w-full flex ${collapsed ? 'justify-center px-2' : 'justify-between px-4'} py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 font-medium text-sm transition-all group mt-1`}
                            >
                                <span className={`flex items-center gap-3 text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors ${collapsed ? 'gap-0' : ''}`}>
                                    <ClipboardList size={18} className="text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
                                    {!collapsed && 'Form Terpadu'}
                                </span>
                                {!collapsed && (menuOpen.form ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />)}
                            </button>
                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${menuOpen.form ? 'max-h-40 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                                <ul className={`${collapsed ? 'pl-0 space-y-1' : 'pl-4 pr-3'} py-1 space-y-1.5 text-sm`}>
                                    <NavLink href="/panitia/form/dashboard" icon={FileText} label="Dashboard Form" colorTheme="blue" />
                                    <NavLink href="/panitia/form/form" icon={FileText} label="Kelola Form" colorTheme="blue" />
                                </ul>
                            </div>
                        </div>
                    )}

                    {canAccessSection(adminData?.role, 'kabim') && (
                        <div className="mb-6">
                            {!collapsed && (
                                <p className="px-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Manajemen PJ Kabim</p>
                            )}
                            <button
                                onClick={() => toggleMenu('kabim')}
                                title="Kabim"
                                className={`w-full flex ${collapsed ? 'justify-center px-2' : 'justify-between px-4'} py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 font-medium text-sm transition-all group mt-1`}
                            >
                                <span className={`flex items-center gap-3 text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors ${collapsed ? 'gap-0' : ''}`}>
                                    <ClipboardList size={18} className="text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
                                    {!collapsed && 'Kabim'}
                                </span>
                                {!collapsed && (menuOpen.kabim ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />)}
                            </button>
                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${menuOpen.kabim ? 'max-h-64 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                                <ul className={`${collapsed ? 'pl-0 space-y-1' : 'pl-4 pr-3'} py-1 space-y-1.5 text-sm`}>
                                    <NavLink href="/panitia/pj_kabim/kelompok" icon={Users} label="Manajemen Kelompok" colorTheme="blue" />
                                </ul>
                            </div>
                        </div>
                    )}

                    {canAccessSection(adminData?.role, 'medis') && (
                        <div className="mb-6">
                            {!collapsed && (
                                <p className="px-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Manajemen PJ Medis</p>
                            )}
                            <button
                                onClick={() => toggleMenu('Medis')}
                                title="Medis"
                                className={`w-full flex ${collapsed ? 'justify-center px-2' : 'justify-between px-4'} py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 font-medium text-sm transition-all group mt-1`}
                            >
                                <span className={`flex items-center gap-3 text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors ${collapsed ? 'gap-0' : ''}`}>
                                    <ClipboardList size={18} className="text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
                                    {!collapsed && 'Medis'}
                                </span>
                                {!collapsed && (menuOpen.Medis ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />)}
                            </button>
                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${menuOpen.Medis ? 'max-h-40 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                                <ul className={`${collapsed ? 'pl-0 space-y-1' : 'pl-4 pr-3'} py-1 space-y-1.5 text-sm`}>
                                    <NavLink href="/panitia/pj_medis/peserta" icon={Users} label="Data Peserta" colorTheme="blue" />
                                </ul>
                            </div>
                        </div>
                    )}

                    {canAccessSection(adminData?.role, 'absensiPanitia') && (
                        <div className="mb-6">
                            {!collapsed && (
                                <p className="px-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Absensi Panitia</p>
                            )}
                            <button
                                onClick={() => toggleMenu('absensi_panitia')}
                                title="Absensi Panitia"
                                className={`w-full flex ${collapsed ? 'justify-center px-2' : 'justify-between px-4'} py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 font-medium text-sm transition-all group mt-1`}
                            >
                                <span className={`flex items-center gap-3 text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors ${collapsed ? 'gap-0' : ''}`}>
                                    <UserCheck size={18} className="text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
                                    {!collapsed && 'Absensi Panitia'}
                                </span>
                                {!collapsed && (menuOpen.absensi_panitia ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />)}
                            </button>
                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${menuOpen.absensi_panitia ? 'max-h-48 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                                <ul className={`${collapsed ? 'pl-0 space-y-1' : 'pl-4 pr-3'} py-1 space-y-1.5 text-sm`}>
                                    <NavLink href="/panitia/absensi_panitia/dashboard" icon={LayoutDashboard} label="Dashboard Absensi" colorTheme="blue" />
                                    <NavLink href="/panitia/absensi_panitia/form" icon={FileText} label="Form Absensi" colorTheme="blue" />
                                    <NavLink href="/panitia/absensi_panitia/absensi" icon={UserCheck} label="Absensi Panitia" colorTheme="blue" />
                                </ul>
                            </div>
                        </div>
                    )}

                    {canAccessSection(adminData?.role, 'pjLomba') && (
                        <div className="mb-6">
                            {!collapsed && (
                                <p className="px-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">PJ Lomba</p>
                            )}
                            <button
                                onClick={() => toggleMenu('pj_lomba')}
                                title="PJ Lomba"
                                className={`w-full flex ${collapsed ? 'justify-center px-2' : 'justify-between px-4'} py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 font-medium text-sm transition-all group mt-1`}
                            >
                                <span className={`flex items-center gap-3 text-slate-700 dark:text-slate-300 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors ${collapsed ? 'gap-0' : ''}`}>
                                    <Trophy size={18} className="text-slate-400 group-hover:text-violet-500 transition-colors shrink-0" />
                                    {!collapsed && 'PJ Lomba'}
                                </span>
                                {!collapsed && (menuOpen.pj_lomba ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />)}
                            </button>
                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${menuOpen.pj_lomba ? 'max-h-80 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                                <ul className={`${collapsed ? 'pl-0 space-y-1' : 'pl-4 pr-3'} py-1 space-y-1.5 text-sm`}>
                                    <NavLink href="/panitia/pj_lomba/dashboard" icon={LayoutDashboard} label="Dashboard" colorTheme="violet" />
                                    <NavLink href="/panitia/pj_lomba/form_register" icon={Users} label="Manajemen Team" colorTheme="violet" />
                                    <NavLink href="/panitia/pj_lomba/jadwal_pertandingan" icon={Calendar} label="Jadwal Pertandingan" colorTheme="violet" />
                                    <NavLink href="/panitia/pj_lomba/juara" icon={Award} label="Juara Lomba" colorTheme="violet" />
                                    <NavLink href="/panitia/pj_lomba/penilaian" icon={Trophy} label="Penilaian Lomba" colorTheme="violet" />
                                    <NavLink href="/panitia/pj_lomba/form_submit" icon={FileText} label="Manajemen Submit" colorTheme="violet" />
                                    <NavLink href="/panitia/pj_lomba/peserta_wajib" icon={UserCheck} label="Peserta Wajib & Lomba" colorTheme="violet" />
                                </ul>
                            </div>
                        </div>
                    )}

                    {canAccessSection(adminData?.role, 'sales') && (
                        <div className="mb-6">
                            {!collapsed && (
                                <p className="px-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Sales & Referral</p>
                            )}
                            <button
                                onClick={() => toggleMenu('sales')}
                                title="Sales & Referral"
                                className={`w-full flex ${collapsed ? 'justify-center px-2' : 'justify-between px-4'} py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 font-medium text-sm transition-all group mt-1`}
                            >
                                <span className={`flex items-center gap-3 text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors ${collapsed ? 'gap-0' : ''}`}>
                                    <TrendingUp size={18} className="text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
                                    {!collapsed && 'Sales & Referral'}
                                </span>
                                {!collapsed && (menuOpen.sales ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />)}
                            </button>
                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${menuOpen.sales ? 'max-h-40 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                                <ul className={`${collapsed ? 'pl-0 space-y-1' : 'pl-4 pr-3'} py-1 space-y-1.5 text-sm`}>
                                    <NavLink href="/panitia/sales/dashboard" icon={LayoutDashboard} label="Dashboard Sales" colorTheme="blue" />
                                    <NavLink href="/panitia/sales/riwayat" icon={ClipboardList} label="Riwayat Sales" colorTheme="blue" />
                                </ul>
                            </div>
                        </div>
                    )}

                    {canAccessSection(adminData?.role, 'keuangan') && (
                        <div className="mb-6">
                            {!collapsed && (
                                <p className="px-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Keuangan</p>
                            )}
                            <button
                                onClick={() => toggleMenu('keuangan')}
                                title="Keuangan"
                                className={`w-full flex ${collapsed ? 'justify-center px-2' : 'justify-between px-4'} py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 font-medium text-sm transition-all group mt-1`}
                            >
                                <span className={`flex items-center gap-3 text-slate-700 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors ${collapsed ? 'gap-0' : ''}`}>
                                    <Wallet size={18} className="text-slate-400 group-hover:text-emerald-500 transition-colors shrink-0" />
                                    {!collapsed && 'Keuangan'}
                                </span>
                                {!collapsed && (menuOpen.keuangan ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />)}
                            </button>
                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${menuOpen.keuangan ? 'max-h-[600px] opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
                                <ul className={`${collapsed ? 'pl-0 space-y-1' : 'pl-4 pr-3'} py-1 space-y-1.5 text-sm`}>
                                    <NavLink href="/panitia/keuangan/dashboard" icon={LayoutDashboard} label="Dashboard Keuangan" colorTheme="emerald" />
                                    <NavLink href="/panitia/keuangan/data_peserta" icon={User} label="Data Peserta" colorTheme="emerald" />
                                    <NavLink href="/panitia/keuangan/verifikasi" icon={FileCheck} label="Verifikasi Pembayaran" colorTheme="emerald" />
                                    <NavLink href="/panitia/keuangan/transaksi" icon={ArrowLeftRight} label="Riwayat Transaksi" colorTheme="emerald" />
                                    <NavLink href="/panitia/keuangan/master-transaksi" icon={Tags} label="Master Kategori" colorTheme="emerald" />
                                    <NavLink href="/panitia/keuangan/master-akuntansi" icon={Receipt} label="Master Akun (COA)" colorTheme="emerald" />
                                    <NavLink href="/panitia/keuangan/metode-pembayaran" icon={CreditCard} label="Metode Pembayaran" colorTheme="emerald" />
                                    <NavLink href="/panitia/keuangan/jurnal-entry" icon={BookMarked} label="Jurnal Entry" colorTheme="emerald" />
                                    <NavLink href="/panitia/keuangan/buku-besar" icon={BookOpenCheck} label="Buku Besar" colorTheme="emerald" />
                                    <NavLink href="/panitia/keuangan/kas-masuk" icon={TrendingUp} label="Kas Masuk" colorTheme="emerald" />
                                    <NavLink href="/panitia/keuangan/kas-keluar" icon={TrendingDown} label="Kas Keluar" colorTheme="emerald" />
                                    <NavLink href="/panitia/keuangan/neraca-saldo" icon={Scale} label="Neraca Saldo" colorTheme="emerald" />
                                    <NavLink href="/panitia/keuangan/neraca-lajur" icon={Table2} label="Neraca Lajur" colorTheme="emerald" />
                                    <NavLink href="/panitia/keuangan/laporan" icon={PieChart} label="Laporan Keuangan" colorTheme="emerald" />
                                </ul>
                            </div>
                        </div>
                    )}

                    {canAccessSection(adminData?.role, 'admin') && (
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
                                <ul className={`${collapsed ? 'pl-0 space-y-1' : 'pl-4 pr-3'} py-1 space-y-1.5 text-sm`}>
                                    <NavLink href="/panitia/admin/status" icon={ShieldAlert} label="Status Admin" colorTheme="violet" />
                                    <NavLink href="/panitia/admin/pengembang" icon={Settings} label="Mode Pengembangan" colorTheme="violet" />
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

                <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar relative">
                    <div className="max-w-7xl mx-auto min-h-full flex flex-col">
                        <div className="flex-1">
                            {children}
                        </div>
                        {/* Footer */}
                        <footer className="mt-8 py-6 border-t border-slate-200 dark:border-slate-800 text-center">
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                &copy; {new Date().getFullYear()} Portal Kampus. Hak Cipta Dilindungi.
                            </p>
                        </footer>
                    </div>
                </div>
            </main>
            <SamsAsisten adminRole={adminData?.role} />

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
