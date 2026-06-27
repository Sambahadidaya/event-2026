import ThemeToggle from '@/components/ThemeToggle';

export default function PortalLayout({ children }) {
    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-500 selection:bg-blue-200 dark:selection:bg-blue-900">
            <header className="absolute top-0 right-0 p-6 z-50">
                <ThemeToggle />
            </header>
            <main className="flex-1 flex flex-col relative z-10">
                {/* Decorative Background Elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 dark:bg-blue-600/10 blur-[100px] mix-blend-multiply dark:mix-blend-lighten animate-float"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-400/20 dark:bg-emerald-600/10 blur-[100px] mix-blend-multiply dark:mix-blend-lighten animate-float" style={{ animationDelay: '2s' }}></div>
                </div>
                {children}
            </main>
        </div>
    );
}
