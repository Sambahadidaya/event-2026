'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginAdmin, loginAdminWithQR } from '@/api/supabase/auth';
import { rolePermissions } from '@/lib/adminRoleData';
import ThemeToggle from '@/components/ThemeToggle';
import { Shield, Mail, Lock, ArrowRight, User, ScanLine } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useEffect } from 'react';

export default function PanitiaLogin() {
    const [loginMethod, setLoginMethod] = useState('email');
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showScanner, setShowScanner] = useState(false);
    const router = useRouter();

    useEffect(() => {
        let scanner = null;
        if (showScanner) {
            scanner = new Html5QrcodeScanner('reader', {
                qrbox: { width: 250, height: 250 },
                fps: 5,
            });

            const success = async (result) => {
                scanner.clear();
                setShowScanner(false);
                setLoading(true);
                setError(null);

                const res = await loginAdminWithQR(result);
                if (res.success) {
                    const role = res.adminRole;
                    let redirectUrl = '/panitia/dashboard/trafik';
                    if (role && role !== 'super_admin' && rolePermissions[role] && rolePermissions[role].length > 0) {
                        redirectUrl = rolePermissions[role][0];
                    }
                    router.push(redirectUrl);
                } else {
                    setError(res.error);
                    setLoading(false);
                }
            };

            const errorFn = (err) => {
                // Ignore constant scan errors
            };

            scanner.render(success, errorFn);
        }

        return () => {
            if (scanner) {
                scanner.clear().catch(e => console.error("Failed to clear scanner", e));
            }
        };
    }, [showScanner, router]);

    const handleIdentifierChange = (e) => {
        const value = e.target.value;
        if (loginMethod === 'nama') {
            if (/^[a-zA-Z\s]*$/.test(value)) {
                setIdentifier(value);
            }
        } else {
            if (/^[a-zA-Z0-9\s\.,@_]*$/.test(value)) {
                setIdentifier(value);
            }
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const res = await loginAdmin(identifier, password, loginMethod);

        if (!res.success) {
            setError(res.error);
            setLoading(false);
            return;
        }

        const role = res.adminRole;
        let redirectUrl = '/panitia/dashboard/trafik';
        if (role && role !== 'super_admin' && rolePermissions[role] && rolePermissions[role].length > 0) {
            redirectUrl = rolePermissions[role][0];
        }

        router.push(redirectUrl);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 relative overflow-hidden transition-colors duration-500">
            {/* Animated Background Mesh */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/20 dark:bg-blue-600/20 blur-[120px] mix-blend-multiply dark:mix-blend-lighten animate-float pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/20 dark:bg-indigo-600/20 blur-[120px] mix-blend-multiply dark:mix-blend-lighten animate-float pointer-events-none" style={{ animationDelay: '2s' }}></div>
            
            <div className="absolute top-6 right-6 z-20"><ThemeToggle /></div>

            <div className="w-full max-w-md glass p-10 md:p-12 rounded-[2.5rem] relative z-10 animate-in fade-in zoom-in-95 duration-700">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-[1.5rem] bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xl shadow-blue-500/20 mb-6 group hover:scale-105 transition-transform duration-300">
                        <Shield size={40} className="group-hover:animate-pulse" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Admin Portal</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">Login Panitia PKKMB & POSE 2026</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 glass !border-red-200 dark:!border-red-900/50 !bg-red-50/80 dark:!bg-red-900/20 text-red-700 dark:text-red-400 rounded-2xl text-sm text-center font-medium animate-in slide-in-from-top-2">
                        {error}
                    </div>
                )}

                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-6 w-full max-w-[240px] mx-auto">
                    <button
                        type="button"
                        onClick={() => { setLoginMethod('email'); setIdentifier(''); setError(null); }}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${loginMethod === 'email' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                    >
                        Email
                    </button>
                    <button
                        type="button"
                        onClick={() => { setLoginMethod('nama'); setIdentifier(''); setError(null); }}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${loginMethod === 'nama' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                    >
                        Nama
                    </button>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                            {loginMethod === 'email' ? 'Email Akses' : 'Nama Lengkap'}
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                {loginMethod === 'email' ? <Mail size={20} /> : <User size={20} />}
                            </div>
                            <input
                                type={loginMethod === 'email' ? 'email' : 'text'}
                                required
                                value={identifier}
                                onChange={handleIdentifierChange}
                                placeholder={loginMethod === 'email' ? 'admin@kampus.ac.id' : 'Masukkan nama Anda...'}
                                className="w-full pl-12 p-4 border border-slate-200 dark:border-slate-700/50 rounded-2xl bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all placeholder:text-slate-400 shadow-sm"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Kata Sandi</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                <Lock size={20} />
                            </div>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-12 p-4 border border-slate-200 dark:border-slate-700/50 rounded-2xl bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all placeholder:text-slate-400 shadow-sm"
                            />
                        </div>
                    </div>
                    {showScanner ? (
                        <div className="space-y-6">
                            <div id="reader" className="w-full bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm"></div>
                            <button
                                type="button"
                                onClick={() => setShowScanner(false)}
                                className="w-full py-3 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-all hover:bg-slate-300 dark:hover:bg-slate-700"
                            >
                                Batal Scan
                            </button>
                        </div>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={() => setShowScanner(true)}
                                className="group w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 p-4 rounded-2xl font-bold transition-all flex justify-center items-center"
                            >
                                <ScanLine size={20} className="mr-2" />
                                <span>Scan QR Code</span>
                            </button>
                            
                            <button
                                type="submit"
                                disabled={loading}
                                className="group w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-400 disabled:to-slate-500 text-white p-4 rounded-2xl font-bold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 transition-all mt-4 flex justify-center items-center active:scale-[0.98]"
                            >
                                {loading ? (
                                    <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                ) : (
                                    <>
                                        <span>Masuk Sistem</span>
                                        <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </form>
            </div>
        </div>
    );
}
