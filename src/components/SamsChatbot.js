'use client';

import { useState, useEffect, useRef } from 'react';
import Fuse from 'fuse.js';
import { Bot, Headset, X, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Menyisipkan custom keyframes untuk animasi melayang acak dan titik berpikir
const customStyles = `
  @keyframes floatRandom {
    0% { transform: translate(0, 0); }
    20% { transform: translate(5px, -10px); }
    40% { transform: translate(-6px, 4px); }
    60% { transform: translate(8px, 8px); }
    80% { transform: translate(-4px, -6px); }
    100% { transform: translate(0, 0); }
  }
  .animate-float-random {
    animation: floatRandom 5s ease-in-out infinite;
  }
  
  @keyframes typingDots {
    0% { content: "."; }
    25% { content: ".."; }
    50% { content: "..."; }
    75% { content: "...."; }
    100% { content: "....."; }
  }
  .typing-dots::after {
    content: "";
    animation: typingDots 1.5s infinite steps(1);
  }
`;

export default function SamsChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([{ sender: 'bot', text: 'Halo! Ada yang bisa saya bantu?' }]);
    const [input, setInput] = useState('');
    const [faqData, setFaqData] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const fetchFaq = async () => {
            const cached = localStorage.getItem('sams_faq');
            if (cached) {
                setFaqData(JSON.parse(cached));
            } else {
                const defaultFaq = [
                    { question: 'halo', keywords: ['hallo', 'pagi', 'siang'], answer: 'Hallo. Ada yang bisa saya bantu?' },
                    { question: 'hi', keywords: ['hii', 'pagi', 'siang'], answer: 'Hallo. Ada yang bisa saya bantu?' },
                    { question: 'hai', keywords: ['haii', 'pagi', 'siang'], answer: 'Hallo. Ada yang bisa saya bantu?' },
                    { question: 'Kapan pkkmb dimulai?', keywords: ['jadwal', 'kapan', 'mulai', 'waktu', 'pkkmb'], answer: 'PKKMB dimulai sesuai jadwal di halaman pemberitahuan.' },
                    { question: 'Apa itu pose?', keywords: ['pose', 'pengertian pose', 'arti pose'], answer: 'POSE adalah Pekan Olahraga dan Seni tingkat universitas.' },
                    { question: 'Apa itu PKKMB?', keywords: ['pkkmb', 'pengertian pkkmb', 'arti pkkmb'], answer: 'PKKMB merupakan kegiatan orientasi dan adaptasi bagi Mahasiswa baru.' },
                    { question: 'Dimana saya bisa melihat jadwal pose?', keywords: ['jadwal', 'dimana', 'lokasi', 'pose'], answer: 'Jadwal dapat dilihat di menu Tim & Jadwal.' }
                ];
                localStorage.setItem('sams_faq', JSON.stringify(defaultFaq));
                setFaqData(defaultFaq);
            }
        };
        fetchFaq();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const handleSend = () => {
        if (!input.trim()) return;

        const RATE_LIMIT_KEY = 'chatbot_limit';
        const limitDataStr = localStorage.getItem(RATE_LIMIT_KEY);
        let limitData = limitDataStr ? JSON.parse(limitDataStr) : { count: 0, firstSubmit: Date.now() };

        if (Date.now() - limitData.firstSubmit > 3600000) {
            limitData = { count: 0, firstSubmit: Date.now() };
        }

        if (limitData.count >= 5) {
            setMessages(prev => [...prev, { sender: 'bot', text: 'Maaf, Anda telah mencapai batas pertanyaan (5 kali/jam). Silakan coba lagi nanti.' }]);
            setInput('');
            return;
        }

        limitData.count += 1;
        localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(limitData));

        const userInput = input; // Simpan input sebelum di-clear
        const newMessages = [...messages, { sender: 'user', text: userInput }];

        setMessages(newMessages);
        setInput('');
        setIsTyping(true); // Aktifkan animasi berpikir

        const fuse = new Fuse(faqData, {
            keys: [
                { name: 'keywords', weight: 0.7 },
                { name: 'question', weight: 0.3 }
            ],
            threshold: 0.2,
            ignoreLocation: true,
            includeScore: true
        });

        const result = fuse.search(userInput);

        // Simulasi delay berfikir selama 1.5 detik
        setTimeout(async () => {
            let botAnswer = '';

            if (result.length > 0 && result[0].score <= 0.5) {
                botAnswer = result[0].item.answer;
            } else {
                botAnswer = 'Maaf, saya tidak menemukan jawaban yang tepat. Silakan hubungi panitia melalui menu Kontak.';
            }

            setIsTyping(false); // Matikan animasi berpikir
            setMessages([...newMessages, { sender: 'bot', text: botAnswer }]);

            const siteType = window.location.pathname.includes('/pose') ? 'pose' : 'pkkmb';
            await supabase.from('riwayat_pertanyaan').insert([{
                pertanyaan: userInput,
                jawaban: botAnswer,
                site: siteType
            }]);
        }, 1500);
    };

    return (
        <>
            <style>{customStyles}</style>
            <div className="fixed bottom-4 right-4 z-50">
                {isOpen ? (
                    <div className="w-80 h-96 rounded-xl shadow-2xl flex flex-col border border-gray-200 dark:border-gray-700 overflow-hidden backdrop-blur-md bg-white/85 dark:bg-gray-900/85">
                        <div className="p-4 bg-blue-600 text-white flex justify-between items-center opacity-95">
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Bot size={20} />
                                    <Headset size={12} className="absolute -top-1 -right-2 text-blue-200" />
                                </div>
                                <h3 className="font-bold text-sm">Sams Asisten</h3>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="hover:text-blue-200 transition-colors"><X size={20} /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`p-3 rounded-lg max-w-[85%] text-sm ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-100/90 dark:bg-gray-800/90 text-gray-800 dark:text-gray-100 rounded-bl-none shadow-sm'}`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}

                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="p-3 rounded-lg max-w-[85%] text-sm bg-gray-100/90 dark:bg-gray-800/90 text-gray-800 dark:text-gray-100 rounded-bl-none shadow-sm flex items-center">
                                        <span className="italic opacity-70">Berpikir<span className="typing-dots"></span></span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-3 border-t border-gray-200/50 dark:border-gray-800/50 bg-gray-50/50 dark:bg-gray-900/50 flex gap-2">
                            <input
                                type="text"
                                maxLength={50}
                                className="flex-1 p-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white/80 dark:bg-gray-800/80 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                value={input}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (/^[a-zA-Z\s]*$/.test(val)) {
                                        setInput(val);
                                    }
                                }}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Ketik pesan..."
                                disabled={isTyping}
                            />
                            <button
                                onClick={handleSend}
                                disabled={isTyping || !input.trim()}
                                className={`p-2 rounded-lg transition-colors flex items-center justify-center ${isTyping || !input.trim() ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'}`}
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => setIsOpen(true)}
                        className="animate-float-random bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors relative flex items-center justify-center"
                    >
                        <Bot size={28} />
                        <Headset size={16} className="absolute -top-1 -right-1 text-blue-200" />
                    </button>
                )}
            </div>
        </>
    );
}