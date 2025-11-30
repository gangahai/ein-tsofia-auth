'use client';

import { useState, useRef, useEffect } from 'react';
import { EmmaAvatar } from './EmmaAvatar';
import { AnalysisResult } from '@/lib/gemini';

interface EmmaAnalysisChatProps {
    analysisResults: AnalysisResult;
}

interface Message {
    role: 'user' | 'emma';
    text: string;
}

export function EmmaAnalysisChat({ analysisResults }: EmmaAnalysisChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

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
                    context: 'analysis',
                    analysisData: analysisResults
                })
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            setMessages(prev => [...prev, { role: 'emma', text: data.response }]);
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => [...prev, { role: 'emma', text: 'מצטערת, נתקלתי בבעיה בתקשורת. אנא נסה שוב מאוחר יותר.' }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-2xl p-8 flex flex-col h-[600px]">
            <div className="flex items-center gap-4 mb-6 border-b border-gray-100 pb-4">
                <EmmaAvatar size="md" />
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">שיחה עם Emma</h2>
                    <p className="text-gray-500 text-sm">מומחית לניתוח התנהגות ורגש</p>
                </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-12 flex flex-col items-center">
                        <EmmaAvatar size="xl" className="mb-4 opacity-50 grayscale" />
                        <p className="text-lg font-medium">שאל אותי כל שאלה על הניתוח!</p>
                        <p className="text-sm opacity-70">אני מכירה את כל הפרטים של הוידאו ויכולה לתת תובנות מעמיקות.</p>
                    </div>
                ) : (
                    messages.map((msg, i) => (
                        <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                            {msg.role === 'emma' && (
                                <div className="flex-shrink-0 mt-1">
                                    <EmmaAvatar size="sm" />
                                </div>
                            )}
                            <div className={`max-w-[80%] px-5 py-3 rounded-2xl text-base leading-relaxed ${msg.role === 'user'
                                    ? 'bg-gradient-to-l from-cyan-500 to-blue-500 text-white rounded-br-none'
                                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                                }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))
                )}
                {isTyping && (
                    <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-1">
                            <EmmaAvatar size="sm" />
                        </div>
                        <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-none">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="flex gap-3 pt-4 border-t border-gray-100">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="שאל שאלה על הניתוח..."
                    className="flex-1 px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-cyan-500 focus:bg-white outline-none transition-all text-gray-800"
                    dir="rtl"
                />
                <button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isTyping}
                    className="px-8 py-4 bg-gradient-to-l from-cyan-500 to-orange-500 text-white rounded-2xl font-bold hover:from-cyan-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                    שלח
                </button>
            </div>
        </div>
    );
}
