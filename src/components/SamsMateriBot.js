'use client';

import { useState, useEffect, useRef } from 'react';
import { Bot, Headset, X, Send } from 'lucide-react';
import { generateMateriAnswer } from '@/api/openai/materi';
import { saveChatHistory } from '@/api/openai/chat';

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
    border-left: 8px solid #059669; /* emerald-600 */
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

export default function SamsMateriBot({ materiContext, isMobile }) {
    // For mobile it might be embedded directly, but let's keep it consistent
    // if embedded, we don't need the floating button
    const [isOpen, setIsOpen] = useState(!isMobile);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [remainingMessages, setRemainingMessages] = useState(15);

    const messagesEndRef = useRef(null);

    useEffect(() => {
        // Initial Message
        setMessages([
            { sender: 'bot', text: `Halo. Saya SamsMateriBot. Silakan tanyakan hal-hal yang kurang jelas mengenai materi ini.` }
        ]);

        // Force open on desktop embedded, close on mobile initially if floating
        if (!isMobile) {
            setIsOpen(true);
        }
    }, [isMobile]);

    useEffect(() => {
        const RATE_LIMIT_KEY = 'materi_chatbot_limit';
        const limitDataStr = localStorage.getItem(RATE_LIMIT_KEY);
        if (limitDataStr) {
            const limitData = JSON.parse(limitDataStr);
            if (Date.now() - limitData.firstSubmit > 3600000) {
                setRemainingMessages(15);
            } else {
                setRemainingMessages(Math.max(0, 15 - limitData.count));
            }
        }
    }, [messages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [messages, isTyping]);

    const handleSend = async (textInput) => {
        const inputanUser = textInput || input;
        if (!inputanUser.trim()) return;

        const RATE_LIMIT_KEY = 'materi_chatbot_limit';
        const limitDataStr = localStorage.getItem(RATE_LIMIT_KEY);
        let limitData = limitDataStr ? JSON.parse(limitDataStr) : { count: 0, firstSubmit: Date.now() };

        if (Date.now() - limitData.firstSubmit > 3600000) {
            limitData = { count: 0, firstSubmit: Date.now() };
        }

        if (limitData.count >= 15) {
            setMessages(prev => [...prev, { sender: 'bot', text: 'Maaf, Anda telah mencapai batas pertanyaan (15 kali/jam). Silakan coba lagi nanti.' }]);
            if (!textInput) setInput('');
            return;
        }

        limitData.count += 1;
        localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(limitData));
        setRemainingMessages(15 - limitData.count);

        const newMessages = [...messages, { sender: 'user', text: inputanUser }];

        setMessages(newMessages);
        if (!textInput) setInput('');
        setIsTyping(true);

        try {
            const { answer } = await generateMateriAnswer(inputanUser, materiContext);
            setMessages([...newMessages, { sender: 'bot', text: answer }]);
            await saveChatHistory(inputanUser, answer, 'pkkmb_materi', true);
        } catch (error) {
            console.error("OpenAI Error:", error);
            setMessages([...newMessages, { sender: 'bot', text: 'Maaf, terjadi kesalahan pada server AI.' }]);
        } finally {
            setIsTyping(false);
        }
    };

    const wrapperClass = isMobile
        ? `fixed z-[9999] flex flex-col bottom-4 right-4 items-end justify-end`
        : `w-full h-full flex flex-col relative rounded-2xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-800`;

    return (
        <>
            <style>{customStyles}</style>
            <div className={wrapperClass}>

                {isOpen ? (
                    <div className={`flex flex-col overflow-hidden backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 duration-300 ${isMobile ? 'w-80 h-[28rem] rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 mb-4 animate-in fade-in slide-in-from-bottom-5' : 'w-full h-[600px]'}`}>
                        {/* Header Modern - Emerald Theme for Materi Bot */}
                        <div className="p-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex justify-between items-center shadow-md">
                            <div className="flex items-center gap-3">
                                <div className="relative bg-white/20 p-2 rounded-full backdrop-blur-sm">
                                    <Bot size={22} className="text-white" />
                                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-teal-600 rounded-full"></span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm leading-tight">Sams Materi Bot</h3>
                                    <p className="text-xs text-emerald-100 opacity-90">Online</p>
                                </div>
                            </div>
                            {isMobile && (
                                <div className="flex items-center gap-1">
                                    <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1.5 rounded-full transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Chat Area Background */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-emerald-50/30 dark:bg-gray-950/50 relative">
                            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, gray 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>

                            {messages.map((msg, i) => (
                                <div key={i} className={`flex relative z-10 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`p-3 rounded-2xl max-w-[85%] text-sm shadow-sm ${msg.sender === 'user' ? 'bg-gradient-to-tr from-emerald-600 to-emerald-500 text-white chat-bubble-user ml-2' : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-100 chat-bubble-bot mr-2'}`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}

                            {isTyping && (
                                <div className="flex justify-start relative z-10">
                                    <div className="p-3 rounded-2xl max-w-[85%] text-sm bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-100 shadow-sm flex items-center chat-bubble-bot mr-2">
                                        <span className="italic opacity-70">Menganalisis <span className="typing-dots"></span></span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="border-t border-gray-200/50 dark:border-gray-800/50 bg-white dark:bg-gray-900 flex flex-col relative z-20">
                            <div className="p-3 flex gap-2 items-end">
                                <div className="flex-1 relative">
                                    <textarea
                                        rows={1}
                                        maxLength={100}
                                        style={{ resize: 'none', maxHeight: '120px' }}
                                        className="w-full p-2.5 pb-6 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder-gray-400 hide-scrollbar"
                                        value={input}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (/^[a-zA-Z0-9\s?.,!]*$/.test(val)) {
                                                setInput(val);
                                            }
                                            e.target.style.height = 'auto';
                                            e.target.style.height = e.target.scrollHeight + 'px';
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSend();
                                                e.target.style.height = 'auto';
                                            }
                                        }}
                                        placeholder="Tanya soal materi..."
                                        disabled={isTyping || remainingMessages <= 0}
                                    />
                                    <div className="absolute bottom-1.5 right-3 flex gap-3 text-[10px] text-gray-400 pointer-events-none">
                                        <span>Sisa pesan: {remainingMessages}</span>
                                        <span className={(100 - input.length) === 0 ? "text-red-500 font-bold" : ""}>Sisa karakter: {100 - input.length}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleSend()}
                                    disabled={isTyping || !input.trim() || remainingMessages <= 0 || (100 - input.length) === 0}
                                    className={`p-2.5 rounded-xl transition-all flex items-center justify-center h-[46px] ${isTyping || !input.trim() || remainingMessages <= 0 || (100 - input.length) === 0 ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg active:scale-95'}`}
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    isMobile && (
                        <div className="relative animate-float-random flex items-center gap-3">
                            <button
                                onClick={() => setIsOpen(true)}
                                className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 rounded-full shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-105 hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 relative flex items-center justify-center group"
                            >
                                <Bot size={28} className="group-hover:animate-pulse" />
                                <Headset size={16} className="absolute -top-1 -right-1 text-emerald-200" />
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white dark:border-gray-900 rounded-full"></span>
                            </button>
                        </div>
                    )
                )}
            </div>
        </>
    );
}
