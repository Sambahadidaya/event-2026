import ThemeToggle from '@/components/ThemeToggle';
import SiteBackground from '@/components/public/SiteBackground';

export default function PortalLayout({ children }) {
    const year = new Date().getFullYear();
    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-500 selection:bg-teal-200 dark:selection:bg-teal-900">
            <header className="absolute top-0 right-0 p-6 z-50">
                <ThemeToggle />
            </header>
            <SiteBackground site="portal" subtle />
            <main className="flex-1 flex flex-col relative z-10">
                {children}
            </main>
            <footer className="relative z-10 py-6 border-t border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
                <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <p>© {year} Portal Kampus Politeknik LP3I. All rights reserved.</p>
                    <p>
                        Developed by{' '}
                        <a 
                            href="https://samba.my.id" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                        >
                            Samba
                        </a>
                    </p>
                </div>
            </footer>
        </div>
    );
}
