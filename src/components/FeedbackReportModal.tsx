'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { analysisService, FeedbackLog } from '@/lib/analysisService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { API_KEYS, APIKeyName, getSelectedAPIKeyName, setSelectedAPIKey } from '@/config/apiKeys';

interface FeedbackReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function FeedbackReportModal({ isOpen, onClose }: FeedbackReportModalProps) {
    const [logs, setLogs] = useState<(FeedbackLog & { id: string })[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterRating, setFilterRating] = useState<'all' | 'good' | 'bad'>('all');
    const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'week' | 'custom'>('all');
    const [customDate, setCustomDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedContext, setSelectedContext] = useState<string | null>(null);
    const [userMap, setUserMap] = useState<Record<string, string>>({});
    const [selectedAPIKeyName, setSelectedAPIKeyNameState] = useState<APIKeyName>(getSelectedAPIKeyName());

    useEffect(() => {
        if (isOpen) {
            loadFeedback();
            fetchUsers();
        }
    }, [isOpen]);

    const loadFeedback = async (force = false) => {
        setLoading(true);
        const data = await analysisService.getFeedback(force);
        setLogs(data);
        setLoading(false);
    };

    const fetchUsers = async () => {
        try {
            const snapshot = await getDocs(collection(db, 'users'));
            const map: Record<string, string> = {};
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                if (data.displayName) {
                    map[doc.id] = data.displayName;
                }
            });
            setUserMap(map);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const resetFilters = () => {
        setFilterRating('all');
        setDateFilter('all');
        setSearchTerm('');
        setCustomDate('');
    };

    const filteredLogs = logs.filter(log => {
        // Rating Filter
        const matchesRating = filterRating === 'all' || log.rating === filterRating;

        // Search Filter
        const searchLower = searchTerm.toLowerCase();
        const userName = userMap[log.userId]?.toLowerCase() || '';
        const matchesSearch =
            (log.userId && log.userId.toLowerCase().includes(searchLower)) ||
            (userName && userName.includes(searchLower)) ||
            (log.comment && log.comment.toLowerCase().includes(searchLower)) ||
            (log.section && log.section.toLowerCase().includes(searchLower));

        // Date Filter
        let matchesDate = true;
        if (dateFilter !== 'all' && log.timestamp) {
            const logDate = new Date(log.timestamp);
            // Check if valid date (not epoch default for legacy)
            if (logDate.getFullYear() === 1970) return false; // Legacy logs don't match specific dates

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            switch (dateFilter) {
                case 'today':
                    matchesDate = logDate >= today;
                    break;
                case 'yesterday':
                    matchesDate = logDate >= yesterday && logDate < today;
                    break;
                case 'week':
                    const lastWeek = new Date(today);
                    lastWeek.setDate(lastWeek.getDate() - 7);
                    matchesDate = logDate >= lastWeek;
                    break;
                case 'custom':
                    if (customDate) {
                        const selected = new Date(customDate);
                        selected.setHours(0, 0, 0, 0);
                        const nextDay = new Date(selected);
                        nextDay.setDate(nextDay.getDate() + 1);
                        matchesDate = logDate >= selected && logDate < nextDay;
                    }
                    break;
            }
        } else if (dateFilter !== 'all' && !log.timestamp) {
            // If filtering by date but log has no timestamp, exclude it
            matchesDate = false;
        }

        return matchesRating && matchesSearch && matchesDate;
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-6xl h-[80vh] flex flex-col shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-700 flex flex-col gap-4 bg-slate-800/50">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl">🛠️</span>
                            <div>
                                <h2 className="text-2xl font-bold text-white">דוח משוב משתמשים</h2>
                                <p className="text-slate-400 text-sm">כלי למפתחים</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* API Key Selector */}
                            <div className="flex items-center gap-2 bg-slate-800 px-3 py-2 rounded-lg border border-slate-600">
                                <span className="text-xs text-slate-400">API Key:</span>
                                <select
                                    value={selectedAPIKeyName}
                                    onChange={(e) => {
                                        const newKey = e.target.value as APIKeyName;
                                        setSelectedAPIKey(newKey);
                                        setSelectedAPIKeyNameState(newKey);
                                        // Reload page to apply new API key
                                        window.location.reload();
                                    }}
                                    className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-white focus:ring-2 focus:ring-cyan-500 outline-none font-bold"
                                >
                                    {Object.keys(API_KEYS).map(keyName => (
                                        <option key={keyName} value={keyName}>{keyName}</option>
                                    ))}
                                </select>
                            </div>
                            <button
                                onClick={() => loadFeedback(true)}
                                className="p-2 hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-white"
                                title="רענן נתונים"
                            >
                                🔄
                            </button>
                            <div className="text-xs text-slate-500 font-mono">
                                {filteredLogs.length}/{logs.length}
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-slate-700 rounded-full transition-colors text-slate-400 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    {/* Filters Toolbar */}
                    <div className="flex flex-wrap items-center gap-3 bg-slate-800 p-3 rounded-xl border border-slate-700">
                        {/* Search */}
                        <div className="relative">
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                            <input
                                type="text"
                                placeholder="חפש..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-slate-900 border border-slate-600 rounded-lg pr-9 pl-3 py-1.5 text-sm text-white focus:ring-2 focus:ring-cyan-500 outline-none text-right w-40"
                            />
                        </div>

                        {/* Rating Filter */}
                        <select
                            value={filterRating}
                            onChange={(e) => setFilterRating(e.target.value as any)}
                            className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                        >
                            <option value="all">כל הדירוגים</option>
                            <option value="good">👍 טוב</option>
                            <option value="bad">👎 מבעס</option>
                        </select>

                        {/* Date Filter */}
                        <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value as any)}
                            className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                        >
                            <option value="all">כל הזמן</option>
                            <option value="today">היום</option>
                            <option value="yesterday">אתמול</option>
                            <option value="week">השבוע האחרון</option>
                            <option value="custom">תאריך ספציפי</option>
                        </select>

                        {/* Custom Date Picker */}
                        {dateFilter === 'custom' && (
                            <input
                                type="date"
                                value={customDate}
                                onChange={(e) => setCustomDate(e.target.value)}
                                className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                            />
                        )}

                        {/* Reset Button */}
                        {(filterRating !== 'all' || dateFilter !== 'all' || searchTerm !== '') && (
                            <button
                                onClick={resetFilters}
                                className="text-xs text-cyan-400 hover:text-cyan-300 underline mr-2"
                            >
                                נקה סינון
                            </button>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6 relative">
                    {loading ? (
                        <div className="flex justify-center items-center h-full">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="text-center text-slate-500 mt-20">
                            <p className="text-xl">אין משובים תואמים לחיפוש 🤷‍♂️</p>
                            <button onClick={resetFilters} className="mt-4 text-cyan-400 hover:underline">
                                נקה סינון
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto" dir="rtl">
                            <table className="w-full text-sm text-right text-slate-300">
                                <thead className="text-xs uppercase bg-slate-800 text-slate-400 sticky top-0">
                                    <tr>
                                        <th className="px-6 py-3 rounded-tr-lg">תאריך</th>
                                        <th className="px-6 py-3">משתמש</th>
                                        <th className="px-6 py-3">מדור</th>
                                        <th className="px-6 py-3">דירוג</th>
                                        <th className="px-6 py-3">סיבות</th>
                                        <th className="px-6 py-3">הערה</th>
                                        <th className="px-6 py-3 rounded-tl-lg">הקשר</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLogs.map((log) => (
                                        <tr key={log.id} className="bg-slate-800/30 border-b border-slate-700 hover:bg-slate-700/30 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap font-mono text-slate-400">
                                                {log.timestamp && log.timestamp.getFullYear() !== 1970
                                                    ? log.timestamp.toLocaleString('he-IL')
                                                    : <span className="text-slate-600 text-xs">ישן</span>}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-white">
                                                {userMap[log.userId] || <span className="text-slate-500 text-xs font-mono">{log.userId?.substring(0, 8)}...</span>}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-300">
                                                {translateSection(log.section)}
                                            </td>
                                            <td className="px-6 py-4">
                                                {log.rating === 'good' ? (
                                                    <span className="bg-green-900/30 text-green-400 px-2 py-1 rounded-full text-xs border border-green-800 inline-flex items-center gap-1 whitespace-nowrap">
                                                        <span>👍</span>
                                                        <span>טוב</span>
                                                    </span>
                                                ) : (
                                                    <span className="bg-red-900/30 text-red-400 px-2 py-1 rounded-full text-xs border border-red-800 inline-flex items-center gap-1 whitespace-nowrap">
                                                        <span>👎</span>
                                                        <span>מבעס</span>
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {log.reasons && log.reasons.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {log.reasons.map((r, i) => (
                                                            <span key={i} className="bg-slate-700 px-2 py-0.5 rounded text-xs text-slate-300">
                                                                {r}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-600">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 max-w-xs truncate" title={log.comment}>
                                                {log.comment || <span className="text-slate-600">-</span>}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => log.contextData && setSelectedContext(log.contextData)}
                                                    disabled={!log.contextData}
                                                    className={`p-1.5 rounded-lg transition-colors ${log.contextData
                                                        ? 'bg-slate-700 hover:bg-cyan-600 text-slate-300 hover:text-white'
                                                        : 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                                                        }`}
                                                    title={log.contextData ? "הצג הקשר" : "אין מידע הקשר"}
                                                >
                                                    👁️
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Context Modal */}
                    <AnimatePresence>
                        {selectedContext && (
                            <div className="absolute inset-0 z-50 flex items-center justify-center p-10 bg-black/60 backdrop-blur-sm">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl w-full max-w-2xl max-h-full flex flex-col"
                                >
                                    <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                                        <h3 className="text-lg font-bold text-white">הקשר למשוב</h3>
                                        <button onClick={() => setSelectedContext(null)} className="text-slate-400 hover:text-white">✕</button>
                                    </div>
                                    <div className="p-6 overflow-auto text-right text-slate-300 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                                        {selectedContext}
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
                {/* Diagnostics Panel (Hidden by default, toggleable) */}
                <div className="p-4 border-t border-slate-700 bg-slate-900/50 text-xs text-slate-500 flex justify-between items-center">
                    <div>
                        מזהה משתמש: <span className="font-mono text-slate-400">{analysisService.getCurrentUserId() || 'לא מחובר'}</span>
                    </div>
                    <button
                        onClick={async () => {
                            const { collection, getCountFromServer } = await import('firebase/firestore');
                            const { db } = await import('@/lib/firebase');

                            try {
                                alert('בודק נתונים ב-Firestore... אנא המתן');
                                const feedbackCount = await getCountFromServer(collection(db, 'feedback_logs'));
                                const analysisCount = await getCountFromServer(collection(db, 'analysis_logs'));
                                const savedCount = await getCountFromServer(collection(db, 'saved_analyses'));

                                alert(
                                    `📊 דוח נתונים טכני:\n\n` +
                                    `📝 משובים (feedback_logs): ${feedbackCount.data().count}\n` +
                                    `🎬 ניתוחים (analysis_logs): ${analysisCount.data().count}\n` +
                                    `💾 דוחות שמורים (saved_analyses): ${savedCount.data().count}\n\n` +
                                    `אם המספרים כאן שונים ממה שאתה רואה בטבלה, יש בעיית סינון.\n` +
                                    `אם המספרים נמוכים, הנתונים לא קיימים במסד הנתונים.`
                                );
                            } catch (e: any) {
                                alert(`שגיאה בבדיקת נתונים: ${e.message}`);
                            }
                        }}
                        className="text-cyan-600 hover:text-cyan-400 underline"
                    >
                        הרץ בדיקת מערכת 🛠️
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

function translateSection(section: string): string {
    const map: Record<string, string> = {
        'case_description': 'תיאור מקרה',
        'participants_environment': 'משתתפים וסביבה',
        'interaction_analysis': 'ניתוח אינטראקציה',
        'recommendations': 'המלצות',
        'general': 'כללי',
        'quick_description': 'תיאור תמציתי',
        'quick_recommendation': 'המלצה לפעולה'
    };
    return map[section] || section;
}
