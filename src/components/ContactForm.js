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
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 relative z-10 transition-colors duration-300 group-hover:text-white">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
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
