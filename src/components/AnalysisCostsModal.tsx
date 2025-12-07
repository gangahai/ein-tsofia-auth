'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthProvider';
import { analysisService, AnalysisLog } from '@/lib/analysisService';
import { DetailedCost } from '@/lib/gemini';

interface AnalysisCostsModalProps {
    isOpen: boolean;
    onClose: () => void;
    videoData?: {
        duration: string;
        size: string;
        resolution: string;
        format: string;
    };
    usageMetadata?: {
        promptTokenCount: number;
        candidatesTokenCount: number;
        totalTokenCount: number;
    };
    detailedCost?: DetailedCost[];
}

export default function AnalysisCostsModal({ isOpen, onClose, videoData, usageMetadata, detailedCost }: AnalysisCostsModalProps) {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
    const [historyPeriod, setHistoryPeriod] = useState<'day' | 'week' | 'month'>('week');
    const [historyLogs, setHistoryLogs] = useState<AnalysisLog[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && activeTab === 'history' && user) {
            loadHistory();
        }
    }, [isOpen, activeTab, historyPeriod, user]);

    const loadHistory = async () => {
        if (!user) return;
        setLoadingHistory(true);
        const logs = await analysisService.getHistory(user.uid, historyPeriod);
        setHistoryLogs(logs);
        setLoadingHistory(false);
    };

    if (!isOpen) return null;

    // Current Analysis Data
    const data = videoData || {
        duration: 'לא זמין',
        size: 'לא זמין',
        resolution: 'לא זמין',
        format: 'לא זמין'
    };

    const inputRate = 0.075 / 1000000;
    const outputRate = 0.30 / 1000000;
    const inputTokens = usageMetadata?.promptTokenCount || 0;
    const outputTokens = usageMetadata?.candidatesTokenCount || 0;
    const inputCost = inputTokens * inputRate;
    const outputCost = outputTokens * outputRate;
    const totalCost = inputCost + outputCost;

    // History Aggregation
    const totalHistoryCost = historyLogs.reduce((sum, log) => sum + log.cost.total, 0);
    const totalHistoryTokens = historyLogs.reduce((sum, log) => sum + log.usageMetadata.totalTokenCount, 0);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">💰 ניהול עלויות</h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                    </div>

                    {/* Tabs */}
                    <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                        <button
                            onClick={() => setActiveTab('current')}
                            className={`flex-1 py-2 rounded-lg font-bold transition-all ${activeTab === 'current' ? 'bg-white shadow text-cyan-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            ניתוח נוכחי
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`flex-1 py-2 rounded-lg font-bold transition-all ${activeTab === 'history' ? 'bg-white shadow text-cyan-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            היסטוריה
                        </button>
                    </div>

                    {activeTab === 'current' ? (
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                            {/* Technical Data */}
                            <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
                                <h3 className="font-bold text-gray-700 mb-3 border-b border-gray-200 pb-2">📼 נתונים טכניים</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div><span className="text-gray-500 block">משך:</span><span className="font-bold text-gray-800">{data.duration}</span></div>
                                    <div><span className="text-gray-500 block">גודל:</span><span className="font-bold text-gray-800">{data.size}</span></div>
                                    <div><span className="text-gray-500 block">רזולוציה:</span><span className="font-bold text-gray-800">{data.resolution}</span></div>
                                    <div><span className="text-gray-500 block">פורמט:</span><span className="font-bold text-gray-800">{data.format}</span></div>
                                </div>
                            </div>

                            {/* Detailed Breakdown */}
                            {detailedCost && detailedCost.length > 0 && (
                                <div className="bg-white rounded-xl p-4 mb-6 border border-gray-200 shadow-sm">
                                    <h3 className="font-bold text-gray-700 mb-3 border-b border-gray-200 pb-2">📊 פירוט לפי שלבים</h3>
                                    <div className="space-y-2 text-sm">
                                        {detailedCost.map((step, i) => (
                                            <div key={i} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
                                                <div>
                                                    <span className="font-bold text-gray-800 block">{step.stepName}</span>
                                                    <span className="text-xs text-gray-500">{step.model || 'N/A'} • {step.durationSeconds?.toFixed(1) || '0.0'}s</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-bold text-cyan-700 block">${(step.totalCost ?? step.cost ?? 0).toFixed(5)}</span>
                                                    <span className="text-xs text-gray-400">{(step.inputTokens ?? 0) + (step.outputTokens ?? 0) || step.tokens || 0} טוקנים</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Costs Breakdown */}
                            <div className="bg-cyan-50 rounded-xl p-4 mb-6 border border-cyan-200">
                                <h3 className="font-bold text-cyan-800 mb-3 border-b border-cyan-200 pb-2">💳 סיכום עלויות</h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-cyan-700">טוקנים קלט ({inputTokens.toLocaleString()}):</span>
                                        <span className="font-bold text-cyan-900">${inputCost.toFixed(5)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-cyan-700">טוקנים פלט ({outputTokens.toLocaleString()}):</span>
                                        <span className="font-bold text-cyan-900">${outputCost.toFixed(5)}</span>
                                    </div>
                                    <div className="border-t border-cyan-200 pt-2 mt-2 flex justify-between text-lg">
                                        <span className="font-bold text-cyan-800">סה"כ לתשלום:</span>
                                        <span className="font-bold text-cyan-900">${totalCost.toFixed(5)}</span>
                                    </div>
                                </div>
                                {!usageMetadata && (
                                    <p className="text-xs text-red-500 mt-2 text-center">* לא התקבלו נתוני שימוש. העלויות הן הערכה או 0.</p>
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            {/* History Filters */}
                            <div className="flex justify-center gap-2 mb-4">
                                {(['day', 'week', 'month'] as const).map((period) => (
                                    <button
                                        key={period}
                                        onClick={() => setHistoryPeriod(period)}
                                        className={`px-4 py-1 rounded-full text-sm font-bold transition-colors ${historyPeriod === period ? 'bg-cyan-100 text-cyan-700 border border-cyan-300' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                    >
                                        {period === 'day' ? 'היום' : period === 'week' ? 'השבוע' : 'החודש'}
                                    </button>
                                ))}
                            </div>

                            {loadingHistory ? (
                                <div className="text-center py-8 text-gray-500">טוען נתונים...</div>
                            ) : (
                                <>
                                    {/* Summary Card */}
                                    <div className="bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl p-4 text-white mb-4 shadow-lg">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-cyan-100 text-sm">סה"כ עלות לתקופה</p>
                                                <p className="text-3xl font-bold">${totalHistoryCost.toFixed(4)}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-cyan-100 text-sm">סה"כ ניתוחים</p>
                                                <p className="text-2xl font-bold">{historyLogs.length}</p>
                                            </div>
                                        </div>
                                        <div className="mt-2 pt-2 border-t border-white/20 text-xs text-cyan-100">
                                            סה"כ טוקנים: {totalHistoryTokens.toLocaleString()}
                                        </div>
                                    </div>

                                    {/* Logs List */}
                                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                        {historyLogs.length === 0 ? (
                                            <p className="text-center text-gray-500 py-4">אין נתונים לתקופה זו</p>
                                        ) : (
                                            historyLogs.map((log, i) => (
                                                <div key={i} className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex justify-between items-center text-sm">
                                                    <div>
                                                        <p className="font-bold text-gray-700">
                                                            {log.timestamp instanceof Date ? log.timestamp.toLocaleDateString('he-IL') : 'תאריך לא חוקי'}
                                                            <span className="text-gray-400 font-normal mx-1">|</span>
                                                            {log.timestamp instanceof Date ? log.timestamp.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) : ''}
                                                        </p>
                                                        <p className="text-xs text-gray-500">{log.videoMetadata.duration} • {log.videoMetadata.size}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-cyan-700">${log.cost.total.toFixed(4)}</p>
                                                        <p className="text-xs text-gray-400">{log.usageMetadata.totalTokenCount.toLocaleString()} טוקנים</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </>
                            )}
                        </motion.div>
                    )}

                    <div className="text-center mt-6">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition-colors"
                        >
                            סגור
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
