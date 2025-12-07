'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { chatWithEmma } from '@/lib/gemini';
import type { AnalysisResult } from '@/lib/gemini';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface EmmaChatComponentProps {
    analysisReport: AnalysisResult;
}

export default function EmmaChatComponent({ analysisReport }: EmmaChatComponentProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: '👋 שלום! אני אמה, היועצת הפדגוגית שלך. אני כאן כדי לענות על כל שאלה לגבי הדוח. במה אוכל לעזור לך?'
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await chatWithEmma(input, analysisReport);
            const assistantMessage: Message = { role: 'assistant', content: response };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage: Message = {
                role: 'assistant',
                content: '😔 סליחה, נתקלתי בבעיה. אנא נסה שוב.'
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    };

    const quickQuestions = [
        '🎯 מה הנקודות החשובות ביותר לשיפור?',
        '⭐ מה החוזקות העיקריות שנצפו?',
        '📊 איך ניתן לשפר את האקלים הרגשי?',
        '🔍 האם יש סכנות בטיחותיות?'
    ];

    return (
        <div className="glass-card rounded-[2rem] overflow-hidden">
            {/* Premium Header */}
            <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-8 relative overflow-hidden">
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/20 rounded-full blur-3xl" />
                </div>

                <div className="relative flex items-center gap-6">
                    <motion.div
                        className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-4xl shadow-2xl"
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 4, repeat: Infinity }}
                    >
                        👩‍🏫
                    </motion.div>
                    <div className="flex-1">
                        <h3 className="text-4xl font-bold text-white mb-2 text-glow">צ'אט עם אמה</h3>
                        <div className="flex items-center gap-2">
                            <motion.span
                                className="w-3 h-3 rounded-full bg-green-400"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                            <span className="text-white/90 font-semibold">פעילה עכשיו</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Premium Messages */}
            <div className="h-[500px] overflow-y-auto p-8 bg-slate-900/40 space-y-6">
                {messages.map((message, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className={`flex ${message.role === 'user' ? 'justify-start' : 'justify-end'}`}
                    >
                        <div className={`flex items-start gap-4 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <motion.div
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-xl ${message.role === 'user'
                                        ? 'bg-blue-500'
                                        : 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500'
                                    }`}
                                whileHover={{ rotate: 5, scale: 1.1 }}
                            >
                                {message.role === 'user' ? '👤' : '👩‍🏫'}
                            </motion.div>

                            <motion.div
                                className={`rounded-2xl p-6 shadow-2xl relative overflow-hidden ${message.role === 'user'
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-white/10 text-slate-100 border border-white/10'
                                    }`}
                                whileHover={{ y: -2 }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />

                                <div className={`relative z-10 ${message.role === 'user' ? 'text-right' : 'text-right'}`} dir="rtl">
                                    <ReactMarkdown className="prose prose-invert prose-sm max-w-none">
                                        {message.content}
                                    </ReactMarkdown>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                ))}

                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-end"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-2xl shadow-xl">
                                👩‍🏫
                            </div>
                            <div className="bg-white/10 rounded-2xl px-8 py-5 border border-white/10">
                                <div className="flex gap-2">
                                    {[0, 1, 2].map((i) => (
                                        <motion.div
                                            key={i}
                                            className="w-3 h-3 bg-indigo-400 rounded-full"
                                            animate={{
                                                scale: [1, 1.5, 1],
                                                opacity: [0.5, 1, 0.5]
                                            }}
                                            transition={{
                                                duration: 1,
                                                repeat: Infinity,
                                                delay: i * 0.2
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Premium Quick Questions */}
            {messages.length <= 1 && (
                <div className="px-8 py-6 bg-white/5 border-t border-white/10">
                    <p className="text-sm text-slate-400 mb-4 text-right font-semibold">💡 שאלות מהירות:</p>
                    <div className="flex flex-wrap gap-3 justify-end">
                        {quickQuestions.map((question, idx) => (
                            <motion.button
                                key={idx}
                                onClick={() => setInput(question)}
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-5 py-3 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl text-sm font-medium border border-white/10 hover:border-indigo-500/50 transition-all"
                            >
                                {question}
                            </motion.button>
                        ))}
                    </div>
                </div>
            )}

            {/* Premium Input */}
            <div className="p-8 bg-white/5 border-t border-white/10">
                <div className="flex gap-4">
                    <motion.button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        whileHover={input.trim() && !isLoading ? { scale: 1.05 } : {}}
                        whileTap={input.trim() && !isLoading ? { scale: 0.95 } : {}}
                        className={`btn-primary ${(!input.trim() || isLoading) && 'opacity-50 cursor-not-allowed'}`}
                    >
                        {isLoading ? '⏳' : '🚀'} שלח
                    </motion.button>

                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                        placeholder="שאל את אמה משהו..."
                        disabled={isLoading}
                        className="flex-1 px-6 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-right disabled:opacity-50 text-lg"
                        dir="rtl"
                    />
                </div>

                <p className="text-xs text-slate-500 mt-4 text-right">
                    💬 אמה משתמשת ב-Gemini AI לניתוח הדוח. לחץ Enter כדי לשלוח.
                </p>
            </div>
        </div>
    );
}
