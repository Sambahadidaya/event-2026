'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loginAdmin, checkQR } from '@/api/supabase/auth';
import { rolePermissions } from '@/lib/adminRoleData';
import ThemeToggle from '@/components/ThemeToggle';
import { Shield, Mail, Lock, ArrowRight, User, ScanLine, Camera, Upload, X, Crop, Check } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

export default function PanitiaLogin() {
    const [loginMethod, setLoginMethod] = useState('email');
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showScanner, setShowScanner] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);
    const [qrEmail, setQrEmail] = useState('');
    const [qrPin, setQrPin] = useState('');
    const [cooldown, setCooldown] = useState(0);
    const router = useRouter();

    const [cameraActive, setCameraActive] = useState(false);
    const [imageToCrop, setImageToCrop] = useState(null);
    const [crop, setCrop] = useState({ unit: '%', width: 50, height: 50, x: 25, y: 25 });
    const [completedCrop, setCompletedCrop] = useState(null);
    const imgRef = useRef(null);
    const html5QrCodeRef = useRef(null);

    useEffect(() => {
        let timer;
        if (cooldown > 0) {
            timer = setInterval(() => {
                setCooldown(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [cooldown]);

    const formatCooldown = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleQRCapture = async (result) => {
        if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
            await html5QrCodeRef.current.stop().catch(console.error);
        }
        setCameraActive(false);
        setShowScanner(false);
        setLoading(true);
        setError(null);

        const res = await checkQR(result);
        if (res.success) {
            setQrEmail(res.email);
            setShowPinModal(true);
            setLoading(false);
        } else {
            setError(res.error);
            if (res.cooldown) setCooldown(res.cooldown);
            setLoading(false);
        }
    };

    const startCamera = async () => {
        try {
            if (!html5QrCodeRef.current) {
                html5QrCodeRef.current = new Html5Qrcode('reader');
            }

            setCameraActive(true);
            await html5QrCodeRef.current.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 350, height: 350 } },
                (decodedText) => handleQRCapture(decodedText),
                (errorMessage) => { /* ignore */ }
            );
        } catch (err) {
            console.error("Camera start failed:", err);
            setError("Gagal mengakses kamera belakang.");
            setCameraActive(false);
        }
    };

    const stopCamera = async () => {
        if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
            await html5QrCodeRef.current.stop().catch(console.error);
        }
        setCameraActive(false);
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            setImageToCrop(event.target.result);
            if (cameraActive) stopCamera();
        };
        reader.readAsDataURL(file);
    };

    const captureCameraFrame = () => {
        const video = document.querySelector('#reader video');
        if (video) {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0);
            setImageToCrop(canvas.toDataURL('image/jpeg'));
            stopCamera();
        }
    };

    const handleScanCrop = () => {
        if (!imgRef.current || !completedCrop || !completedCrop.width || !completedCrop.height) {
            setError("Area crop tidak valid.");
            return;
        }

        const canvas = document.createElement('canvas');
        const image = imgRef.current;
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;

        canvas.width = completedCrop.width * scaleX;
        canvas.height = completedCrop.height * scaleY;
        const ctx = canvas.getContext('2d');

        ctx.drawImage(
            image,
            completedCrop.x * scaleX,
            completedCrop.y * scaleY,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY,
            0,
            0,
            canvas.width,
            canvas.height
        );

        canvas.toBlob(async (blob) => {
            if (!blob) return;
            const file = new File([blob], "crop.jpg", { type: "image/jpeg" });
            try {
                if (!html5QrCodeRef.current) html5QrCodeRef.current = new Html5Qrcode('reader');
                setLoading(true);
                setError(null);
                const decodedText = await html5QrCodeRef.current.scanFile(file, true);
                handleQRCapture(decodedText);
            } catch (err) {
                console.error("Scan crop failed:", err);
                setLoading(false);
                setError("QR Code tidak terdeteksi pada area crop. Silakan coba atur kembali atau pastikan gambar jelas.");
            }
        }, 'image/jpeg');
    };

    useEffect(() => {
        return () => {
            if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
                html5QrCodeRef.current.stop().catch(e => console.error("Failed to clear scanner", e));
            }
        };
    }, []);

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
        if (cooldown > 0) return;

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

    const handleQrLogin = async (e) => {
        e.preventDefault();
        if (cooldown > 0) return;

        setLoading(true);
        setError(null);

        const res = await loginAdmin(qrEmail, qrPin, 'email');

        if (!res.success) {
            setError(res.error);
            if (res.cooldown) setCooldown(res.cooldown);
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
                    <div className="mb-6 p-4 glass !border-red-200 dark:!border-red-900/50 !bg-red-50/80 dark:!bg-red-900/20 text-red-700 dark:text-red-400 rounded-2xl text-sm text-center font-medium animate-in slide-in-from-top-2 flex flex-col items-center">
                        <span>{error}</span>
                        {cooldown > 0 && (
                            <span className="mt-2 text-lg font-bold">Tunggu: {formatCooldown(cooldown)}</span>
                        )}
                    </div>
                )}

                {showPinModal ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center mb-6">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Masukkan PIN</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">QR Code dikenali. Silakan masukkan PIN keamanan Anda.</p>
                        </div>
                        <form onSubmit={handleQrLogin} className="space-y-6">
                            <div className="space-y-2">
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                        <Lock size={24} />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        disabled={cooldown > 0 || loading}
                                        value={qrPin}
                                        onChange={(e) => setQrPin(e.target.value.replace(/[^0-9]/g, ''))}
                                        placeholder="••••••"
                                        className="w-full pl-12 p-4 text-center text-2xl tracking-[0.5em] border border-slate-200 dark:border-slate-700/50 rounded-2xl bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        style={{ fontFamily: 'monospace' }}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    disabled={loading}
                                    onClick={() => {
                                        setShowPinModal(false);
                                        setQrPin('');
                                        setShowScanner(true);
                                    }}
                                    className="w-1/3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 p-4 rounded-2xl font-bold transition-all disabled:opacity-50 flex justify-center items-center"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={cooldown > 0 || loading}
                                    className="w-2/3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-400 disabled:to-slate-500 text-white p-4 rounded-2xl font-bold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 transition-all flex justify-center items-center active:scale-[0.98]"
                                >
                                    {loading ? (
                                        <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    ) : (
                                        <>
                                            <span>Masuk</span>
                                            <ArrowRight size={20} className="ml-2" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <>
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-6 w-full max-w-[240px] mx-auto">
                            <button
                                type="button"
                                disabled={cooldown > 0}
                                onClick={() => { setLoginMethod('email'); setIdentifier(''); setError(null); }}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${loginMethod === 'email' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'} disabled:opacity-50`}
                            >
                                Email
                            </button>
                            <button
                                type="button"
                                disabled={cooldown > 0}
                                onClick={() => { setLoginMethod('nama'); setIdentifier(''); setError(null); }}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${loginMethod === 'nama' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'} disabled:opacity-50`}
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
                                        disabled={cooldown > 0}
                                        value={identifier}
                                        onChange={handleIdentifierChange}
                                        placeholder={loginMethod === 'email' ? 'admin@kampus.ac.id' : 'Masukkan nama Anda...'}
                                        className="w-full pl-12 p-4 border border-slate-200 dark:border-slate-700/50 rounded-2xl bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all placeholder:text-slate-400 shadow-sm disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-800"
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
                                        disabled={cooldown > 0}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-12 p-4 border border-slate-200 dark:border-slate-700/50 rounded-2xl bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all placeholder:text-slate-400 shadow-sm disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-800"
                                    />
                                </div>
                            </div>
                            {showScanner ? (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className={`relative w-full bg-slate-900 rounded-3xl overflow-hidden shadow-inner flex-col items-center justify-center border-4 border-slate-100 dark:border-slate-800 group ${imageToCrop ? 'hidden' : 'flex aspect-square'}`}>
                                        <div id="reader" className="w-full h-full [&>video]:object-cover [&>video]:w-full [&>video]:h-full"></div>
                                        {!cameraActive && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-900/80 p-6 text-center">
                                                <Camera size={48} className="mb-4 opacity-50" />
                                                <p className="text-sm font-medium">Kamera Belakang belum aktif atau tidak tersedia.</p>
                                            </div>
                                        )}
                                        {cameraActive && (
                                            <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none">
                                                <div className="absolute inset-0 border-2 border-blue-500 animate-pulse"></div>
                                            </div>
                                        )}

                                        {cameraActive && (
                                            <div className="absolute bottom-6 left-0 right-0 flex justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    type="button"
                                                    onClick={captureCameraFrame}
                                                    className="bg-white/90 backdrop-blur text-slate-900 py-2 px-4 rounded-full font-bold flex items-center shadow-lg hover:bg-white hover:scale-105 transition-all"
                                                >
                                                    <Crop size={16} className="mr-2" />
                                                    Ambil & Crop
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {imageToCrop && (
                                        <div className="flex flex-col items-center space-y-4">
                                            <div className="relative w-full bg-slate-900 rounded-3xl overflow-hidden shadow-inner flex items-center justify-center border-4 border-slate-100 dark:border-slate-800 p-2">
                                                <ReactCrop
                                                    crop={crop}
                                                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                                                    onComplete={(c) => setCompletedCrop(c)}
                                                    className="max-h-[50vh] w-auto mx-auto rounded-xl overflow-hidden"
                                                >
                                                    <img ref={imgRef} src={imageToCrop} alt="Crop" className="max-h-[50vh] w-auto object-contain" />
                                                </ReactCrop>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 text-center font-medium">Geser dan atur kotak agar QR Code pas berada di tengah area.</p>

                                            <div className="grid grid-cols-2 gap-3 w-full">
                                                <button
                                                    type="button"
                                                    onClick={() => setImageToCrop(null)}
                                                    className="py-3 px-4 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-xl font-bold flex items-center justify-center transition-all"
                                                >
                                                    <X size={18} className="mr-2" />
                                                    Batal
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleScanCrop}
                                                    className="py-3 px-4 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-bold flex items-center justify-center transition-all shadow-md shadow-blue-500/20"
                                                >
                                                    <Check size={18} className="mr-2" />
                                                    Scan Crop
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {!imageToCrop && (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    type="button"
                                                    onClick={cameraActive ? stopCamera : startCamera}
                                                    className={`py-3 px-4 rounded-xl font-bold flex items-center justify-center transition-all ${cameraActive
                                                        ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
                                                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20'
                                                        }`}
                                                >
                                                    <Camera size={18} className="mr-2" />
                                                    {cameraActive ? 'Stop Kamera' : 'Buka Kamera'}
                                                </button>

                                                <label className="cursor-pointer py-3 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold flex items-center justify-center transition-all">
                                                    <Upload size={18} className="mr-2" />
                                                    <span>Upload File</span>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={handleFileUpload}
                                                    />
                                                </label>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    stopCamera();
                                                    setShowScanner(false);
                                                    setImageToCrop(null);
                                                }}
                                                className="w-full py-3 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-all hover:bg-slate-300 dark:hover:bg-slate-700 flex justify-center items-center"
                                            >
                                                <X size={18} className="mr-2" />
                                                Batal Scan
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        disabled={cooldown > 0}
                                        onClick={() => setShowScanner(true)}
                                        className="group w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 p-4 rounded-2xl font-bold transition-all flex justify-center items-center disabled:opacity-50"
                                    >
                                        <ScanLine size={20} className="mr-2" />
                                        <span>Scan QR Code</span>
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={cooldown > 0 || loading}
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
                    </>
                )}
            </div>
        </div>
    );
}