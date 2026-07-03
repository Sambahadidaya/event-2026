'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Send, Loader2, Mail, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { getTheme } from '@/lib/siteThemes';

export default function ContactForm({ site }) {
    const theme = getTheme(site);
    const [formData, setFormData] = useState({ nama: '', email: '', whatsapp: '', pesan: '' });
    const [contactMethod, setContactMethod] = useState('email');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    const handleNameChange = (e) => {
        const value = e.target.value;
        if (/^[a-zA-Z\s]*$/.test(value)) {
            setFormData({ ...formData, nama: value });
        }
    };

    const handlePesanChange = (e) => {
        const value = e.target.value;
        if (/^[a-zA-Z\s]*$/.test(value)) {
            setFormData({ ...formData, pesan: value });
        }
    };

    const handleEmailChange = (e) => {
        const value = e.target.value;
        if (/^[a-zA-Z0-9\s\.,@_]*$/.test(value)) {
            setFormData({ ...formData, email: value });
        }
    };

    const handleWhatsappChange = (e) => {
        const value = e.target.value;
        if (/^[0-9+]*$/.test(value)) {
            setFormData({ ...formData, whatsapp: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const RATE_LIMIT_KEY = `contact_limit_${site}`;
        const limitDataStr = localStorage.getItem(RATE_LIMIT_KEY);
        let limitData = limitDataStr ? JSON.parse(limitDataStr) : { count: 0, firstSubmit: Date.now() };

        if (Date.now() - limitData.firstSubmit > 3600000) {
            limitData = { count: 0, firstSubmit: Date.now() };
        }

        if (limitData.count >= 3) {
            showToast('error', 'Anda telah mencapai batas pengiriman pesan (3 kali/jam). Silakan coba lagi nanti.');
            return;
        }

        if (contactMethod === 'email' && !formData.email) {
            showToast('error', 'Silakan isi Email Anda.');
            return;
        }
        if (contactMethod === 'whatsapp' && !formData.whatsapp) {
            showToast('error', 'Silakan isi WhatsApp Anda.');
            return;
        }

        if (contactMethod === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                showToast('error', 'Format email tidak valid.');
                return;
            }
        }

        if (!formData.pesan.trim()) {
            showToast('error', 'Pesan tidak boleh kosong.');
            return;
        }

        setLoading(true);

        const payloadEmail = contactMethod === 'email' ? formData.email : null;
        const payloadWhatsapp = contactMethod === 'whatsapp' ? formData.whatsapp : null;

        const { error } = await supabase.from('kontak').insert([{
            nama: formData.nama,
            email: payloadEmail || null,
            whatsapp: payloadWhatsapp || null,
            pesan: formData.pesan,
            site: site
        }]);

        setLoading(false);

        if (error) {
            console.error('Submit error:', error);
            showToast('error', 'Pesan anda gagal terkirim, silahkan coba lagi.');
        } else {
            showToast('success', 'Pesan anda berhasil terkirim, kami akan segera menghubungi anda');
            setFormData({ nama: '', email: '', whatsapp: '', pesan: '' });

            limitData.count += 1;
            localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(limitData));
        }
    };

    const showToast = (type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 5000);
    };

    const sosmedData = {
        pkkmb: {
            email: "mailto:pkkmb@kampus.ac.id",
            wa: "https://wa.me/6281234567890",
            ig: "https://instagram.com/pkkmb_kampus2026"
        },
        pose: {
            email: "mailto:pose@kampus.ac.id",
            wa: "https://wa.me/6289876543210",
            ig: "https://instagram.com/pose_kampus2026"
        }
    };

    const currentSosmed = sosmedData[site] || sosmedData.pkkmb;

    return (
        <div className="glass rounded-3xl shadow-xl p-6 md:p-8 relative overflow-hidden animate-in fade-in zoom-in-95 duration-500 w-full max-w-2xl mx-auto">
            <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full blur-[60px] ${theme.blob1}`} />
            <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 w-[90%] max-w-md ${toast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10 pointer-events-none'}`}>
                {toast && (
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                        {toast.type === 'success' ? <CheckCircle2 size={18} className="shrink-0" /> : <AlertCircle size={18} className="shrink-0" />}
                        <p className="flex-1">{toast.message}</p>
                        <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70 shrink-0"><X size={16} /></button>
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nama Lengkap *</label>
                    <input
                        type="text"
                        required
                        value={formData.nama}
                        onChange={handleNameChange}
                        className={`w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/80 text-gray-900 dark:text-white focus:ring-2 ${theme.focusRing} transition-all`}
                        placeholder="Masukkan nama Anda..."
                    />
                </div>

                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-2 w-fit">
                    <button
                        type="button"
                        onClick={() => setContactMethod('email')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${contactMethod === 'email' ? `bg-white dark:bg-gray-700 shadow-sm ${site === 'pkkmb' ? 'text-[#0068BB]' : 'text-[#E85D04]'}` : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                    >
                        Email
                    </button>
                    <button
                        type="button"
                        onClick={() => setContactMethod('whatsapp')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${contactMethod === 'whatsapp' ? 'bg-white dark:bg-gray-700 text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                    >
                        WhatsApp
                    </button>
                </div>

                <div className="relative">
                    {contactMethod === 'email' ? (
                        <div className="animate-in fade-in zoom-in-95 duration-300">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email *</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={handleEmailChange}
                                className={`w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/80 text-gray-900 dark:text-white focus:ring-2 ${theme.focusRing} transition-all`}
                                placeholder="nama@email.com"
                            />
                        </div>
                    ) : (
                        <div className="animate-in fade-in zoom-in-95 duration-300">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">WhatsApp *</label>
                            <input
                                type="tel"
                                value={formData.whatsapp}
                                onChange={handleWhatsappChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                                placeholder="081234567890"
                            />
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Isi Pesan *</label>
                    <textarea
                        required
                        rows="4"
                        value={formData.pesan}
                        onChange={handlePesanChange}
                        className={`w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/80 text-gray-900 dark:text-white focus:ring-2 ${theme.focusRing} transition-all resize-none`}
                        placeholder="Tuliskan pesan Anda di sini..."
                    ></textarea>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3.5 px-4 text-white font-medium rounded-xl transition-all shadow-md flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0 disabled:shadow-none ${theme.btnPrimary}`}
                >
                    {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                    {loading ? 'Mengirim...' : 'Kirim Pesan'}
                </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-4">Media Sosial Kami</p>
                <div className="flex items-center justify-center gap-4">
                    <a href={currentSosmed.email} className="group relative w-12 h-12 flex items-center justify-center border border-gray-300 dark:border-gray-700 rounded-full text-gray-700 dark:text-gray-300 overflow-hidden transition-all duration-300 bg-white dark:bg-gray-800 hover:border-transparent">
                        <span className="absolute bottom-0 left-0 w-full h-0 bg-blue-600 transition-all duration-300 ease-out group-hover:h-full"></span>
                        <Mail className="relative z-10 transition-colors duration-300 group-hover:text-white" size={20} />
                    </a>
                    <a href={currentSosmed.wa} target="_blank" rel="noopener noreferrer" className="group relative w-12 h-12 flex items-center justify-center border border-gray-300 dark:border-gray-700 rounded-full text-gray-700 dark:text-gray-300 overflow-hidden transition-all duration-300 bg-white dark:bg-gray-800 hover:border-transparent">
                        <span className="absolute bottom-0 left-0 w-full h-0 bg-green-500 transition-all duration-300 ease-out group-hover:h-full"></span>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 640 640"
                            fill="currentColor"
                            className="w-7 h-7 relative z-10 transition-colors duration-300 group-hover:text-white"
                        >
                            <path d="M476.9 161.1C435 119.1 379.2 96 319.9 96C197.5 96 97.9 195.6 97.9 318C97.9 357.1 108.1 395.3 127.5 429L96 544L213.7 513.1C246.1 530.8 282.6 540.1 319.8 540.1L319.9 540.1C442.2 540.1 544 440.5 544 318.1C544 258.8 518.8 203.1 476.9 161.1zM319.9 502.7C286.7 502.7 254.2 493.8 225.9 477L219.2 473L149.4 491.3L168 423.2L163.6 416.2C145.1 386.8 135.4 352.9 135.4 318C135.4 216.3 218.2 133.5 320 133.5C369.3 133.5 415.6 152.7 450.4 187.6C485.2 222.5 506.6 268.8 506.5 318.1C506.5 419.9 421.6 502.7 319.9 502.7zM421.1 364.5C415.6 361.7 388.3 348.3 383.2 346.5C378.1 344.6 374.4 343.7 370.7 349.3C367 354.9 356.4 367.3 353.1 371.1C349.9 374.8 346.6 375.3 341.1 372.5C308.5 356.2 287.1 343.4 265.6 306.5C259.9 296.7 271.3 297.4 281.9 276.2C283.7 272.5 282.8 269.3 281.4 266.5C280 263.7 268.9 236.4 264.3 225.3C259.8 214.5 255.2 216 251.8 215.8C248.6 215.6 244.9 215.6 241.2 215.6C237.5 215.6 231.5 217 226.4 222.5C221.3 228.1 207 241.5 207 268.8C207 296.1 226.9 322.5 229.6 326.2C232.4 329.9 268.7 385.9 324.4 410C359.6 425.2 373.4 426.5 391 423.9C401.7 422.3 423.8 410.5 428.4 397.5C433 384.5 433 373.4 431.6 371.1C430.3 368.6 426.6 367.2 421.1 364.5z" />
                        </svg>
                    </a>
                    <a href={currentSosmed.ig} target="_blank" rel="noopener noreferrer" className="group relative w-12 h-12 flex items-center justify-center border border-gray-300 dark:border-gray-700 rounded-full text-gray-700 dark:text-gray-300 overflow-hidden transition-all duration-300 bg-white dark:bg-gray-800 hover:border-transparent">
                        <span className="absolute bottom-0 left-0 w-full h-0 bg-pink-600 transition-all duration-300 ease-out group-hover:h-full"></span>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 relative z-10 transition-colors duration-300 group-hover:text-white">
                            <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                        </svg>
                    </a>
                </div>
            </div>
        </div>
    );
}
