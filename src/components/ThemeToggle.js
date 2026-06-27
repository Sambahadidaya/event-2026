'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    return (
        <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="relative p-2.5 rounded-full glass hover:bg-white dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-500 shadow-sm hover:shadow-md hover:scale-110 active:scale-95"
            aria-label="Toggle Theme"
        >
            <div className={`transition-transform duration-700 flex items-center justify-center ${theme === 'dark' ? 'rotate-[360deg] scale-100' : 'rotate-0 scale-100'}`}>
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </div>
        </button>
    );
}
