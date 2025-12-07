'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { AnalysisResult, chatWithEmma } from '@/lib/gemini';

interface Message {
    role: 'user' | 'model';
    text: string;
}

interface EmmaChatComponentProps {
    analysisResult: AnalysisResult;
}

export default function EmmaChatComponent({ analysisResult }: EmmaChatComponentProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'model',
            text: 'שלום! אני אמה. כתבתי את הדוח הזה עבורך. יש לך שאלות על מה שראיתי, או שתרצה להתייעץ לגבי ההמלצות?'
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
        setIsLoading(true);

        try {
            // Prepare history for API (excluding the welcome message if needed, or keeping it)
            const history = messages.map(m => ({
                role: m.role,
                parts: [{ text: m.text }]
            }));

            const response = await chatWithEmma(history, userMessage, analysisResult);

            setMessages(prev => [...prev, { role: 'model', text: response }]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { role: 'model', text: 'סליחה, נתקלתי בבעיה בתקשורת. אפשר לנסות שוב?' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden flex flex-col h-[600px]">
            {/* Header */}
            <div className="bg-indigo-50 p-4 border-b border-indigo-100 flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-2xl border-2 border-indigo-200 shadow-sm">
                    👩‍🏫
                </div>
                <div>
                    <h3 className="font-bold text-gray-800">שיחה עם אמה</h3>
                    <p className="text-xs text-indigo-600 font-medium">יועצת חינוכית וירטואלית</p>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
                {messages.map((msg, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${msg.role === 'user'
                                ? 'bg-indigo-600 text-white rounded-br-none'
                                : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                                }`}
                        >
                            <div className={`prose prose-sm max-w-none ${msg.role === 'user' ? 'text-white' : 'text-gray-800'}`} dir="rtl">
                                <ReactMarkdown>{msg.text}</ReactMarkdown>
                            </div>
                        </div>
                    </motion.div>
                ))}

                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start"
                    >
                        <div className="bg-white rounded-2xl rounded-bl-none p-4 border border-gray-200 shadow-sm flex items-center gap-2">
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                    </motion.div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100">
                <div className="flex gap-2 items-end">
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className={`p-3 rounded-xl transition-all flex-shrink-0 ${!input.trim() || isLoading
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
                            }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 transform rotate-180">
                            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                        </svg>
                    </button>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="כתוב הודעה לאמה..."
                        className="flex-1 bg-gray-100 border-0 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-none text-right text-gray-800"
                        rows={1}
                        style={{ minHeight: '50px', maxHeight: '150px' }}
                        dir="rtl"
                    />
                </div>
            </div>
        </div>
    );
}
