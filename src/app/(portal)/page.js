import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function PortalPage() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-700">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-float">
                <Sparkles size={16} className="text-blue-500 dark:text-blue-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Portal Resmi Angkatan 2026</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 leading-tight">
                Selamat Datang, <br className="hidden md:block" />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-emerald-500">Mahasiswa Baru</span>
            </h1>
            
            <p className="text-gray-600 dark:text-gray-400 mb-14 max-w-xl mx-auto text-lg md:text-xl font-light leading-relaxed">
                Pilih gerbang informasi di bawah ini untuk memulai langkah pertama perjalanan akademik dan kreativitas Anda.
            </p>

            <div className="flex flex-col md:flex-row gap-8 w-full max-w-4xl px-4">
                <Link href="/pkkmb" className="group flex-1 p-10 glass rounded-3xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-2 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent dark:from-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative z-10 flex flex-col h-full text-left">
                        <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-500 shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                        </div>
                        <h2 className="text-3xl font-bold mb-3 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Portal PKKMB</h2>
                        <p className="text-gray-600 dark:text-gray-400 flex-1 leading-relaxed">Pusat informasi resmi Pengenalan Kehidupan Kampus bagi Mahasiswa Baru. Temukan jadwal dan kelompok Anda.</p>
                        <div className="mt-8 flex items-center text-blue-600 dark:text-blue-400 font-medium">
                            <span>Masuk Portal</span>
                            <ArrowRight size={18} className="ml-2 group-hover:translate-x-2 transition-transform duration-300" />
                        </div>
                    </div>
                </Link>
                
                <Link href="/pose" className="group flex-1 p-10 glass rounded-3xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-2 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent dark:from-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative z-10 flex flex-col h-full text-left">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mb-6 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-500 shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/><path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M12 2v2"/><path d="M12 22v-2"/><path d="m17 20.66-1-1.73"/><path d="M11 10.27 7 3.34"/><path d="m20.66 17-1.73-1"/><path d="m3.34 7 1.73 1"/><path d="M14 12h8"/><path d="M2 12h2"/><path d="m20.66 7-1.73 1"/><path d="m3.34 17 1.73-1"/><path d="m17 3.34-1 1.73"/><path d="m11 13.73-4 6.93"/></svg>
                        </div>
                        <h2 className="text-3xl font-bold mb-3 text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Portal POSE</h2>
                        <p className="text-gray-600 dark:text-gray-400 flex-1 leading-relaxed">Pusat informasi Pekan Olahraga dan Seni Mahasiswa. Temukan kompetisi dan asah kreativitasmu.</p>
                        <div className="mt-8 flex items-center text-emerald-600 dark:text-emerald-400 font-medium">
                            <span>Masuk Portal</span>
                            <ArrowRight size={18} className="ml-2 group-hover:translate-x-2 transition-transform duration-300" />
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
}
