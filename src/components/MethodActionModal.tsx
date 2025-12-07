import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EmmaAvatar } from './EmmaAvatar';

interface MethodActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    methodName: string;
    methodId?: string;
    onAction: (action: 'reanalyze' | 'change_question' | 'new_video' | 'chat', payload?: string) => void;
}

const METHOD_LABELS: Record<string, { he: string; en: string }> = {
    'adler': { he: 'אדלר', en: 'Adler' },
    'montessori': { he: 'מונטסורי', en: 'Montessori' },
    'attachment': { he: 'היקשרות', en: 'Attachment' },
    'cbt': { he: 'CBT', en: 'CBT' },
    'new_authority': { he: 'הסמכות החדשה', en: 'New Authority' },
    'positive_discipline': { he: 'משמעת חיובית', en: 'Positive Discipline' }
};

export function MethodActionModal({ isOpen, onClose, methodName, onAction }: MethodActionModalProps) {
    const [step, setStep] = useState<'menu' | 'question_input'>('menu');
    const [newQuestion, setNewQuestion] = useState('');

    if (!isOpen) return null;

    // Use methodName as ID to look up labels, fallback to methodName itself if not found
    // If the passed methodName is already the full string (e.g. from older code), try to handle or just default.
    // Given the issues, we assume methodName passed IN IS the ID (e.g. 'adler').
    const labels = METHOD_LABELS[methodName] || { he: methodName, en: methodName };
    const headerDisplay = `${labels.he} (${labels.en})`;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-white/20"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Modern Header */}
                    <div className="bg-gradient-to-b from-indigo-50 to-white pt-8 pb-4 px-6 text-center relative">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors shadow-sm"
                        >
                            <span className="text-xl leading-none">&times;</span>
                        </button>

                        <div className="mb-4 flex justify-center">
                            <EmmaAvatar size="xl" className="shadow-xl ring-4 ring-white" />
                        </div>

                        <h2 className="text-xl font-bold text-gray-800">בחרת בגישת {headerDisplay}</h2>
                        <p className="text-sm text-gray-500 mt-1 max-w-[200px] mx-auto leading-relaxed">
                            אני כאן כדי לעזור לך ליישם אותה בצורה הטובה ביותר.
                        </p>
                    </div>

                    {/* Modern Content Actions */}
                    <div className="p-6 pt-2 space-y-3">
                        {step === 'menu' ? (
                            <>
                                <button
                                    onClick={() => onAction('reanalyze')}
                                    className="w-full p-4 bg-white border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/50 rounded-2xl flex items-center justify-between gap-4 transition-all group shadow-sm hover:shadow-md"
                                >
                                    <div className="text-right">
                                        <div className="font-bold text-gray-800 group-hover:text-indigo-700 transition-colors">לנתח מחדש בגישת {labels.he}</div>
                                        <div className="text-xs text-gray-400 mt-0.5">עם אותה השאלה</div>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <span className="text-xl">🔄</span>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setStep('question_input')}
                                    className="w-full p-4 bg-white border border-gray-100 hover:border-purple-200 hover:bg-purple-50/50 rounded-2xl flex items-center justify-between gap-4 transition-all group shadow-sm hover:shadow-md"
                                >
                                    <div className="text-right">
                                        <div className="font-bold text-gray-800 group-hover:text-purple-700 transition-colors">לשנות שאלה ולנתח מחדש</div>
                                        <div className="text-xs text-gray-400 mt-0.5">באותה גישה ({headerDisplay})</div>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <span className="text-xl">✏️</span>
                                    </div>
                                </button>

                                <div className="h-px bg-gray-100 my-2" />

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => onAction('new_video')}
                                        className="p-3 bg-gray-50 hover:bg-gray-100/80 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all text-center group"
                                    >
                                        <span className="text-2xl group-hover:-translate-y-1 transition-transform">📹</span>
                                        <span className="text-xs font-bold text-gray-600">סרטון חדש</span>
                                    </button>

                                    <button
                                        onClick={() => onAction('chat')}
                                        className="p-3 bg-teal-50 hover:bg-teal-100/80 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all text-center group"
                                    >
                                        <span className="text-2xl group-hover:-translate-y-1 transition-transform">💬</span>
                                        <span className="text-xs font-bold text-teal-700">צ'אט עם אמה</span>
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                                    <label className="block text-sm font-bold text-gray-700 mb-2 text-right">מה מטריד אותך?</label>
                                    <textarea
                                        value={newQuestion}
                                        onChange={(e) => setNewQuestion(e.target.value)}
                                        placeholder="למשל: הילד לא מקשיב לי..."
                                        className="w-full bg-white border-0 rounded-xl focus:ring-2 focus:ring-indigo-200 p-3 min-h-[100px] text-right text-sm shadow-inner placeholder-gray-400"
                                        autoFocus
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setStep('menu')}
                                        className="px-6 py-3 text-gray-400 font-bold hover:bg-gray-50 rounded-xl transition-colors text-sm"
                                    >
                                        ביטול
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (newQuestion.trim()) {
                                                onAction('change_question', newQuestion);
                                            }
                                        }}
                                        disabled={!newQuestion.trim()}
                                        className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-xl hover:shadow-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:shadow-none text-sm flex items-center justify-center gap-2"
                                    >
                                        <span>בצע ניתוח</span>
                                        <span>✨</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
