'use client';

import { useState, useEffect } from 'react';
import { analysisService, FeedbackLog } from '@/lib/analysisService';
import { motion } from 'framer-motion';

export default function FeedbackDashboard() {
    const [feedbackLogs, setFeedbackLogs] = useState<(FeedbackLog & { id: string })[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'good' | 'bad'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadFeedback();
    }, []);

    const loadFeedback = async () => {
        setLoading(true);
        const logs = await analysisService.getFeedback(true);
        setFeedbackLogs(logs);
        setLoading(false);
    };

    const filteredLogs = feedbackLogs.filter(log => {
        const matchesFilter = filter === 'all' || log.rating === filter;
        const matchesSearch = !searchTerm ||
            log.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.userId.includes(searchTerm);
        return matchesFilter && matchesSearch;
    });

    const exportToCSV = () => {
        const headers = ['תאריך', 'משתמש', 'חלק', 'דירוג', 'סיבות', 'הערה'];
        const rows = filteredLogs.map(log => [
            log.timestamp ? new Date(log.timestamp).toLocaleString('he-IL') : '',
            log.userId.substring(0, 8),
            log.section,
            log.rating === 'good' ? 'טוב' : 'מבעס',
            log.reasons?.join(', ') || '',
            log.comment || ''
        ]);

        const csv = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `feedback_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const stats = {
        total: feedbackLogs.length,
        good: feedbackLogs.filter(l => l.rating === 'good').length,
        bad: feedbackLogs.filter(l => l.rating === 'bad').length,
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-800 via-cyan-900 to-blue-900 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">📊 לוח משוב משתמשים</h1>
                            <p className="text-gray-600">צפייה וניתוח של כל הפידבקים שנשלחו במערכת</p>
                        </div>
                        <button
                            onClick={exportToCSV}
                            className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg flex items-center gap-2"
                        >
                            📥 ייצוא לאקסל (CSV)
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-blue-50 rounded-xl p-4 text-center">
                            <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
                            <div className="text-sm text-gray-600">סך הכל</div>
                        </div>
                        <div className="bg-green-50 rounded-xl p-4 text-center">
                            <div className="text-3xl font-bold text-green-600">{stats.good}</div>
                            <div className="text-sm text-gray-600">👍 טוב</div>
                        </div>
                        <div className="bg-red-50 rounded-xl p-4 text-center">
                            <div className="text-3xl font-bold text-red-600">{stats.bad}</div>
                            <div className="text-sm text-gray-600">👎 מבעס</div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-4 items-center">
                        <input
                            type="text"
                            placeholder="חיפוש לפי משתמש, חלק או הערה..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none text-right"
                        />
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as any)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none"
                        >
                            <option value="all">הכל</option>
                            <option value="good">👍 טוב בלבד</option>
                            <option value="bad">👎 מבעס בלבד</option>
                        </select>
                        <button
                            onClick={loadFeedback}
                            className="px-4 py-2 bg-cyan-600 text-white rounded-lg font-bold hover:bg-cyan-700 transition-colors"
                        >
                            🔄 רענן
                        </button>
                    </div>
                </div>

                {/* Feedback List */}
                <div className="bg-white rounded-3xl shadow-2xl p-8">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="text-4xl mb-4">⏳</div>
                            <p className="text-gray-600">טוען פידבקים...</p>
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-4xl mb-4">📭</div>
                            <p className="text-gray-600">אין פידבקים להצגה</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredLogs.map((log) => (
                                <motion.div
                                    key={log.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`p-4 rounded-xl border-r-4 ${log.rating === 'good'
                                        ? 'bg-green-50 border-green-500'
                                        : 'bg-red-50 border-red-500'
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-2xl">
                                                    {log.rating === 'good' ? '👍' : '👎'}
                                                </span>
                                                <div>
                                                    <div className="font-bold text-gray-800">
                                                        {log.section}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {log.timestamp
                                                            ? new Date(log.timestamp).toLocaleString('he-IL')
                                                            : 'לא זמין'}
                                                    </div>
                                                </div>
                                            </div>

                                            {log.reasons && log.reasons.length > 0 && (
                                                <div className="mb-2">
                                                    <span className="text-sm font-bold text-gray-700">סיבות: </span>
                                                    <span className="text-sm text-gray-600">
                                                        {log.reasons.join(', ')}
                                                    </span>
                                                </div>
                                            )}

                                            {log.comment && (
                                                <div className="bg-white p-3 rounded-lg border border-gray-200">
                                                    <span className="text-sm font-bold text-gray-700">הערה: </span>
                                                    <span className="text-sm text-gray-600">{log.comment}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="text-xs text-gray-400 font-mono">
                                            {log.userId.substring(0, 8)}...
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
