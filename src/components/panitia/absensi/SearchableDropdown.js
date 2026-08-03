'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

export default function SearchableDropdown({
    options = [],
    value = '',
    onChange,
    placeholder = 'Pilih salah satu...',
    disabled = false
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    const filteredOptions = options.filter(opt =>
        (opt.label || '').toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (val) => {
        onChange(val);
        setIsOpen(false);
        setSearch('');
    };

    return (
        <div className="relative w-full text-left" ref={containerRef}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`flex items-center justify-between w-full px-4 py-2.5 bg-white dark:bg-slate-900 border ${
                    isOpen ? 'border-blue-500 ring-2 ring-blue-100 dark:ring-blue-900/30' : 'border-slate-200 dark:border-slate-800'
                } rounded-lg text-slate-800 dark:text-slate-100 text-sm focus:outline-none transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed`}
            >
                <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl overflow-hidden transition-all duration-200 ease-out">
                    <div className="flex items-center px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
                        <Search size={16} className="text-slate-400 mr-2 shrink-0" />
                        <input
                            type="text"
                            placeholder="Cari..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-transparent border-none text-slate-800 dark:text-slate-100 text-sm focus:outline-none placeholder-slate-400 py-0.5"
                            autoFocus
                        />
                    </div>
                    <ul className="max-h-56 overflow-y-auto py-1">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => (
                                <li key={opt.value}>
                                    <button
                                        type="button"
                                        onClick={() => handleSelect(opt.value)}
                                        className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                                            opt.value === value
                                                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-medium'
                                                : 'text-slate-700 dark:text-slate-300'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                </li>
                            ))
                        ) : (
                            <li className="px-4 py-3 text-xs text-center text-slate-400 dark:text-slate-500">
                                Tidak ada data yang cocok.
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}
