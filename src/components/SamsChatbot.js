'use client';

import { useState, useEffect, useRef } from 'react';
import Fuse from 'fuse.js';
import { Bot, Headset, X, Send, HelpCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getFaqBySite, getRandomQuestions } from '@/lib/faqData';

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

  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .chat-bubble-user {
    position: relative;
    border-top-right-radius: 0;
  }
  .chat-bubble-user::after {
    content: '';
    position: absolute;
    top: 0;
    right: -8px;
    border-top: 0px solid transparent;
    border-left: 8px solid #3b82f6; /* Matches the right edge of blue-500 gradient */
    border-bottom: 10px solid transparent;
  }

  .chat-bubble-bot {
    position: relative;
    border-top-left-radius: 0;
  }
  .chat-bubble-bot::before {
    content: '';
    position: absolute;
    top: 0;
    left: -8px;
    border-top: 0px solid transparent;
    border-right: 8px solid #ffffff;
    border-bottom: 10px solid transparent;
  }
  .dark .chat-bubble-bot::before {
    border-right-color: #1f2937;
  }
`;

export default function SamsChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [faqData, setFaqData] = useState([]);
    const [randomQuestions, setRandomQuestions] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [siteType, setSiteType] = useState('pkkmb');
    
    // Idle Popup States
    const [showIdlePopup, setShowIdlePopup] = useState(false);
    const [hasClosedPopup, setHasClosedPopup] = useState(false);
    const [isPopupHiddenTemporarily, setIsPopupHiddenTemporarily] = useState(false);

    const messagesEndRef = useRef(null);

    useEffect(() => {
        // Detect site
        const currentSite = window.location.pathname.includes('/pose') ? 'pose' : 'pkkmb';
        setSiteType(currentSite);

        // Load FAQ
        const faqs = getFaqBySite(currentSite);
        setFaqData(faqs);
        
        // Initial Message
        const randomQs = getRandomQuestions(currentSite, 3);
        setRandomQuestions(faqs); 
        
        setMessages([
            { sender: 'bot', text: `Halo! Selamat datang di Portal ${currentSite.toUpperCase()}. Ada yang bisa saya bantu? Berikut beberapa pertanyaan yang sering ditanyakan:` },
            { sender: 'bot', isSuggestions: true, suggestions: randomQs.map(q => q.question) }
        ]);

        // Idle Popup Logic
        let idleTimer;
        if (!isOpen && !isPopupHiddenTemporarily) {
            idleTimer = setTimeout(() => {
                setShowIdlePopup(true);
            }, 5000); // 5 seconds
        }

        return () => clearTimeout(idleTimer);
    }, [isOpen, isPopupHiddenTemporarily]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const handleCloseIdlePopup = (e) => {
        e.stopPropagation();
        setShowIdlePopup(false);
        setIsPopupHiddenTemporarily(true);
        // Re-appear after 5 minutes (300000 ms)
        setTimeout(() => {
            setIsPopupHiddenTemporarily(false);
        }, 300000);
    };

    const handleSend = (textInput) => {
        const text = textInput || input;
        if (!text.trim()) return;

        const RATE_LIMIT_KEY = 'chatbot_limit';
        const limitDataStr = localStorage.getItem(RATE_LIMIT_KEY);
        let limitData = limitDataStr ? JSON.parse(limitDataStr) : { count: 0, firstSubmit: Date.now() };

        if (Date.now() - limitData.firstSubmit > 3600000) {
            limitData = { count: 0, firstSubmit: Date.now() };
        }

        if (limitData.count >= 30) { 
            setMessages(prev => [...prev, { sender: 'bot', text: 'Maaf, Anda telah mencapai batas pertanyaan (30 kali/jam). Silakan coba lagi nanti.' }]);
            if (!textInput) setInput('');
            return;
        }

        limitData.count += 1;
        localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(limitData));

        const newMessages = [...messages, { sender: 'user', text }];

        setMessages(newMessages);
        if (!textInput) setInput('');
        setIsTyping(true); // Aktifkan animasi berpikir
        
        // Exact / keyword match as fallback before fuse
        const normalizedInput = text.toLowerCase().trim();
        let exactMatch = faqData.find(faq => 
            faq.question.toLowerCase() === normalizedInput || 
            faq.keywords.some(k => k.toLowerCase() === normalizedInput)
        );

        let botAnswer = '';

        if (exactMatch) {
            botAnswer = exactMatch.answer;
        } else {
            const fuse = new Fuse(faqData, {
                keys: [
                    { name: 'keywords', weight: 0.8 },
                    { name: 'question', weight: 0.2 }
                ],
                threshold: 0.4, // Make it a bit more lenient
                ignoreLocation: true,
                includeScore: true
            });

            const result = fuse.search(text);

            if (result.length > 0 && result[0].score <= 0.5) {
                botAnswer = result[0].item.answer;
            } else {
                botAnswer = 'Maaf, saya tidak menemukan jawaban yang tepat. Silakan hubungi panitia melalui menu Kontak.';
            }
        }

        // Simulasi delay berfikir selama 1 detik
        setTimeout(async () => {
            setIsTyping(false); // Matikan animasi berpikir
            setMessages([...newMessages, { sender: 'bot', text: botAnswer }]);

            await supabase.from('riwayat_pertanyaan').insert([{
                pertanyaan: text,
                jawaban: botAnswer,
                site: siteType
            }]);
        }, 1000);
    };

    return (
        <>
            <style>{customStyles}</style>
            <div className="fixed bottom-4 right-4 z-50 flex items-end justify-end flex-col">
                
                {isOpen ? (
                    <div className="w-80 h-[28rem] rounded-2xl shadow-2xl flex flex-col border border-gray-200/50 dark:border-gray-700/50 overflow-hidden backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 mb-4 animate-in fade-in slide-in-from-bottom-5 duration-300">
                        {/* Header Modern */}
                        <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex justify-between items-center shadow-md">
                            <div className="flex items-center gap-3">
                                <div className="relative bg-white/20 p-2 rounded-full backdrop-blur-sm">
                                    <Bot size={22} className="text-white" />
                                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-indigo-600 rounded-full"></span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm leading-tight">Sams Asisten</h3>
                                    <p className="text-xs text-blue-100 opacity-90">Online</p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1.5 rounded-full transition-colors"><X size={20} /></button>
                        </div>

                        {/* Chat Area Background */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-gray-950/50 relative">
                            {/* Decorative background pattern */}
                            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, gray 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
                            
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex relative z-10 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} ${msg.isSuggestions ? 'flex-col gap-2' : ''}`}>
                                    {msg.isSuggestions ? (
                                        <div className="flex flex-col gap-2 mt-1">
                                            {msg.suggestions.map((sug, idx) => (
                                                <button 
                                                    key={idx}
                                                    onClick={() => handleSend(sug)}
                                                    className="text-left text-xs bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors shadow-sm"
                                                >
                                                    {sug}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className={`p-3 rounded-2xl max-w-[85%] text-sm shadow-sm ${msg.sender === 'user' ? 'bg-gradient-to-tr from-blue-600 to-blue-500 text-white chat-bubble-user ml-2' : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-100 chat-bubble-bot mr-2'}`}>
                                            {msg.text}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {isTyping && (
                                <div className="flex justify-start relative z-10">
                                    <div className="p-3 rounded-2xl max-w-[85%] text-sm bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-100 shadow-sm flex items-center chat-bubble-bot mr-2">
                                        <span className="italic opacity-70">Mengetik<span className="typing-dots"></span></span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="border-t border-gray-200/50 dark:border-gray-800/50 bg-white dark:bg-gray-900 flex flex-col relative z-20">
                            {/* Horizontal Scroll Suggestions */}
                            <div className="flex overflow-x-auto hide-scrollbar gap-2 px-3 py-2 border-b border-gray-100 dark:border-gray-800">
                                {randomQuestions.filter(q => !['halo', 'hi', 'hai', 'terima kasih'].includes(q.question.toLowerCase())).map((q, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSend(q.question)}
                                        className="whitespace-nowrap text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-full transition-colors"
                                    >
                                        {q.question}
                                    </button>
                                ))}
                            </div>
                            
                            <div className="p-3 flex gap-2">
                                <input
                                    type="text"
                                    maxLength={80}
                                    className="flex-1 p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder-gray-400"
                                    value={input}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (/^[a-zA-Z0-9\s?.,!-]*$/.test(val)) {
                                            setInput(val);
                                        }
                                    }}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Ketik pesan..."
                                    disabled={isTyping}
                                />
                                <button
                                    onClick={() => handleSend()}
                                    disabled={isTyping || !input.trim()}
                                    className={`p-2.5 rounded-xl transition-all flex items-center justify-center ${isTyping || !input.trim() ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg active:scale-95'}`}
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="relative animate-float-random flex items-center gap-3">
                        {/* Idle Popup */}
                        {showIdlePopup && (
                            <div className="bg-white dark:bg-gray-800 text-gray-800 dark:text-white px-4 py-2.5 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 relative animate-in fade-in slide-in-from-right-5 text-sm font-medium pr-8 max-w-[200px]">
                                Ada yang bisa dibantu?
                                <button 
                                    onClick={handleCloseIdlePopup}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
                                >
                                    <X size={14} />
                                </button>
                                {/* Triangle pointer */}
                                <div className="absolute top-1/2 -right-2 -translate-y-1/2 border-[6px] border-transparent border-l-white dark:border-l-gray-800 drop-shadow-sm"></div>
                            </div>
                        )}

                        <button
                            onClick={() => { setIsOpen(true); setShowIdlePopup(false); }}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-105 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 relative flex items-center justify-center group"
                        >
                            <Bot size={28} className="group-hover:animate-pulse" />
                            <Headset size={16} className="absolute -top-1 -right-1 text-blue-200" />
                            {/* Online indicator */}
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white dark:border-gray-900 rounded-full"></span>
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}