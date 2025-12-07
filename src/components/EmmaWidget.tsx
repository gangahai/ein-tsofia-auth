'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EmmaAvatar } from './EmmaAvatar';
import { AnalysisResult } from '@/lib/gemini';

interface Message {
    role: 'user' | 'emma';
    text: string;
}

interface EmmaWidgetProps {
    mode?: 'floating' | 'header';
    analysisResult?: AnalysisResult;
    userId?: string;
}

export function EmmaWidget({ mode = 'floating', analysisResult, userId }: EmmaWidgetProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [showGreeting, setShowGreeting] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    // Auto-hide greeting after 5 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowGreeting(false);
        }, 5000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        // Initial greeting
        if (messages.length === 0) {
            setMessages([
                {
                    role: 'emma',
                    text: 'שלום! אני אמה, העוזרת האישית שלך במערכת עין צופיה. אני כאן כדי לעזור לך בכל שאלה, התייעצות או תמיכה רגשית. איך אני יכולה לעזור לך היום?'
                }
            ]);
        }
    }, []);

    const [isPulsing, setIsPulsing] = useState(false);

    // Pulse animation effect
    useEffect(() => {
        const interval = setInterval(() => {
            setIsPulsing(true);
            setTimeout(() => setIsPulsing(false), 2000); // Pulse for 2 seconds
        }, 10000); // Every 10 seconds

        return () => clearInterval(interval);
    }, []);

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const userMsg = inputValue;
        setInputValue('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsTyping(true);

        try {
            const response = await fetch('/api/emma', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, { role: 'user', text: userMsg }],
                    context: 'general'
                })
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            setMessages(prev => [...prev, { role: 'emma', text: data.response }]);
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => [...prev, { role: 'emma', text: `שגיאה: ${error instanceof Error ? error.message : 'בעיה בתקשורת'}` }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className={`z-50 font-sans ${mode === 'floating' ? 'fixed bottom-6 right-6 flex flex-col items-end' : 'relative'}`}>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className={`bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col
                            ${mode === 'floating' ? 'mb-4 w-80 sm:w-96' : 'absolute top-14 left-0 w-80 sm:w-96'}
                        `}
                        style={{ maxHeight: '600px', height: '500px' }}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 flex items-center justify-between text-white">
                            <div className="flex items-center gap-3">
                                <EmmaAvatar size="sm" className="border-2 border-white/50" showStatus />
                                <div>
                                    <h3 className="font-bold text-sm">Emma</h3>
                                    <p className="text-xs text-purple-100">זמינה להתייעצות</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                            ? 'bg-purple-600 text-white rounded-br-none'
                                            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm'
                                            }`}
                                    >
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-bl-none shadow-sm flex gap-1">
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="כתוב הודעה..."
                                className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 text-right"
                                dir="rtl"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!inputValue.trim() || isTyping}
                                className="p-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Greeting Bubble */}
            <AnimatePresence>
                {mode === 'floating' && !isOpen && showGreeting && (
                    <motion.div
                        initial={{ opacity: 0, x: 20, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 10, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                        className="absolute bottom-2 right-full mr-4 w-max pointer-events-none"
                    >
                        <div className="bg-purple-50/90 backdrop-blur-sm px-4 py-2 rounded-2xl rounded-br-none shadow-lg border border-purple-100 flex items-center gap-2">
                            <span className="text-purple-900 font-medium text-sm">אני כאן בשבילך</span>
                            <span className="text-xs">💜</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                    setIsOpen(!isOpen);
                    setShowGreeting(false);
                }}
                className={`relative group ${mode === 'header' ? 'flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 transition-colors' : ''}`}
            >
                {mode === 'floating' && isPulsing && (
                    <div className="absolute inset-0 bg-purple-600 rounded-full animate-ping opacity-20 group-hover:opacity-40"></div>
                )}

                <div className={`relative ${mode === 'floating' ? 'bg-white p-1 rounded-full shadow-lg border border-gray-100' : ''} overflow-hidden`}>
                    <EmmaAvatar size={mode === 'header' ? 'md' : 'md'} />
                </div>

                {mode === 'header' && (
                    <div className="text-right hidden md:block">
                        <span className="block text-sm font-bold text-white">Emma</span>
                        <span className="block text-xs text-purple-200">עוזרת אישית</span>
                    </div>
                )}

                {!isOpen && (
                    <span className={`absolute block h-3 w-3 rounded-full bg-green-500 ring-2 ring-white ${mode === 'floating' ? 'top-0 right-0 h-4 w-4 bg-green-500' : 'bottom-1 right-1'}`} />
                )}
            </motion.button>
        </div>
    );
}
