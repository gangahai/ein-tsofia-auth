'use client';

import { useState, useEffect } from 'react';
import { analysisService, FeedbackLog } from '@/lib/analysisService';
import { useAuth } from '@/components/AuthProvider';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function AdminDashboardPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [logs, setLogs] = useState<(FeedbackLog & { id: string })[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'good' | 'bad'>('all');

    useEffect(() => {
        // Simple protection: Check if user is logged in
        // Real admin check would go here (e.g., check custom claim or specific email)
        if (!user) {
            // router.push('/'); // Uncomment to enforce login
        }

        loadFeedback();
    }, [user]);

    const loadFeedback = async () => {
        setLoading(true);
        const data = await analysisService.getFeedback(true);
        setLogs(data);
        setLoading(false);
    };

    const filteredLogs = logs.filter(log => {
        if (filter === 'all') return true;
        return log.rating === filter;
    });

    // Stats
    const total = logs.length;
    const good = logs.filter(l => l.rating === 'good').length;
    const bad = logs.filter(l => l.rating === 'bad').length;

    return (
        <div className="min-h-screen bg-gray-50 p-8" dir="rtl">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">📊 דשבורד מנהל - משוב משתמשים</h1>
                    <div className="flex gap-4">
                        <button
                            onClick={loadFeedback}
                            className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 text-gray-700 font-medium transition-colors flex items-center gap-2"
                        >
                            🔄 רענן נתונים
                        </button>
                        <button
                            onClick={() => router.push('/analyze')}
                            className="px-4 py-2 bg-gray-800 text-white rounded-lg shadow-sm hover:bg-gray-700 font-medium transition-colors"
                        >
                            חזרה למערכת
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-gray-500 font-medium mb-2">סה"כ משובים</h3>
                        <p className="text-4xl font-bold text-gray-900">{total}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100 bg-green-50/30">
                        <h3 className="text-green-600 font-medium mb-2">👍 משוב חיובי</h3>
                        <p className="text-4xl font-bold text-green-700">{good} <span className="text-lg font-normal text-green-600/70">({total > 0 ? Math.round((good / total) * 100) : 0}%)</span></p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 bg-red-50/30">
                        <h3 className="text-red-600 font-medium mb-2">👎 משוב שלילי</h3>
                        <p className="text-4xl font-bold text-red-700">{bad} <span className="text-lg font-normal text-red-600/70">({total > 0 ? Math.round((bad / total) * 100) : 0}%)</span></p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === 'all' ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                    >
                        הכל
                    </button>
                    <button
                        onClick={() => setFilter('good')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === 'good' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                    >
                        👍 חיובי
                    </button>
                    <button
                        onClick={() => setFilter('bad')}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === 'bad' ? 'bg-red-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                    >
                        👎 שלילי
                    </button>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-gray-600 text-sm">תאריך</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 text-sm">משתמש</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 text-sm">דירוג</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 text-sm">חלק בדוח</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 text-sm">הערות / סיבות</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 text-sm">הקשר (Context)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                            טוען נתונים...
                                        </td>
                                    </tr>
                                ) : filteredLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                            לא נמצאו רשומות
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLogs.map((log) => (
                                        <motion.tr
                                            key={log.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap" dir="ltr">
                                                {log.timestamp ? new Date(log.timestamp).toLocaleString('he-IL') : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 font-mono text-xs">
                                                {log.userId?.substring(0, 8)}...
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                {log.rating === 'good' ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        👍 טוב
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                        👎 מבעס
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                {log.section}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                {log.rating === 'bad' && (
                                                    <div className="flex flex-col gap-1">
                                                        {log.reasons && log.reasons.length > 0 && (
                                                            <div className="flex flex-wrap gap-1">
                                                                {log.reasons.map((r, i) => (
                                                                    <span key={i} className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded textxs">
                                                                        {r}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {log.comment && (
                                                            <p className="text-red-600 italic">"{log.comment}"</p>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={log.contextData}>
                                                {log.contextData || '-'}
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
