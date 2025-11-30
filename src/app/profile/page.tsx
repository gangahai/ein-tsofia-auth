'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { Header } from '@/components/Header';
import CustomEditor from '@/components/CustomEditor';

interface SavedAnalysis {
    id: string;
    title: string;
    content: string;
    type: string;
    timestamp: any;
}

export default function ProfilePage() {
    const { user } = useAuth();
    const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAnalysis, setSelectedAnalysis] = useState<SavedAnalysis | null>(null);

    useEffect(() => {
        if (!user) return;

        const fetchAnalyses = async () => {
            try {
                const q = query(
                    collection(db, 'saved_analyses'),
                    where('userId', '==', user.uid),
                    orderBy('timestamp', 'desc')
                );
                const snapshot = await getDocs(q);
                const analyses = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as SavedAnalysis[];
                setSavedAnalyses(analyses);
            } catch (error) {
                console.error('Error fetching analyses:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalyses();
    }, [user]);

    if (!user) return <div className="text-center p-10">נא להתחבר כדי לצפות בפרופיל</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-20" dir="rtl">
            <Header />

            <main className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex items-center gap-4 mb-8">
                    {user.photoURL && (
                        <img src={user.photoURL} alt={user.displayName || ''} className="w-16 h-16 rounded-full border-2 border-blue-500" />
                    )}
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">הפרופיל שלי</h1>
                        <p className="text-gray-600">שלום, {user.displayName}</p>
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-8 shadow-sm">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        📂 דוחות שמורים
                        <span className="text-sm font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                            {savedAnalyses.length} דוחות
                        </span>
                    </h2>

                    {loading ? (
                        <div className="text-center py-10 text-gray-500">טוען דוחות...</div>
                    ) : savedAnalyses.length === 0 ? (
                        <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                            <p className="text-xl text-gray-400">עדיין אין דוחות שמורים</p>
                            <p className="text-gray-400 text-sm mt-2">דוחות שתשמור יופיעו כאן</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {savedAnalyses.map((analysis) => (
                                <motion.div
                                    key={analysis.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md transition-shadow group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-2xl">
                                            {analysis.type === 'intervention_plan' ? '🛠️' : '📄'}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800 text-lg group-hover:text-blue-600 transition-colors">
                                                {analysis.title}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                {analysis.timestamp?.toDate().toLocaleDateString('he-IL')} • {analysis.timestamp?.toDate().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setSelectedAnalysis(analysis)}
                                        className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 font-medium transition-colors"
                                    >
                                        צפה בדוח
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {selectedAnalysis && (
                <CustomEditor
                    initialContent={selectedAnalysis.content}
                    title={selectedAnalysis.title}
                    userId={user.uid}
                    onClose={() => setSelectedAnalysis(null)}
                    variant="modal"
                />
            )}
        </div>
    );
}
