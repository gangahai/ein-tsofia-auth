'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { analysisService } from '@/lib/analysisService';

interface AddAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAnalysisComplete: (result: string, title: string) => void;
    videoData: any;
    initialAnalysis: any;
    existingAnalyses?: { title: string }[];
}

export default function AddAnalysisModal({
    isOpen,
    onClose,
    onAnalysisComplete,
    videoData,
    initialAnalysis,
    existingAnalyses = []
}: AddAnalysisModalProps) {
    const [step, setStep] = useState<'select' | 'configure' | 'loading'>('select');
    const [selectedType, setSelectedType] = useState<'participant' | 'intervention' | null>(null);

    // Configuration States
    const [participantDepth, setParticipantDepth] = useState<'regular' | 'deep'>('regular');
    const [interventionMethod, setInterventionMethod] = useState<'CBT' | 'DBT' | 'Narrative' | 'Custom'>('CBT');
    const [interventionFocus, setInterventionFocus] = useState<'emotional' | 'cognitive'>('emotional');
    const [customInstructions, setCustomInstructions] = useState('');

    // Filter options based on existing analyses
    const hasParticipantAnalysis = existingAnalyses.some(a => a.title.includes('ניתוח משתתפים'));

    const handleRunAnalysis = async () => {
        setStep('loading');
        try {
            let result = '';
            let title = '';

            if (selectedType === 'participant') {
                title = `ניתוח משתתפים (${participantDepth === 'deep' ? 'מעמיק' : 'רגיל'})`;
                result = await analysisService.runCustomAnalysis('participant_analysis', { initialAnalysis }, { depth: participantDepth });
            } else if (selectedType === 'intervention') {
                if (interventionMethod === 'Custom') {
                    title = 'תוכנית התערבות מותאמת אישית';
                    result = await analysisService.runCustomAnalysis('custom_plan', { initialAnalysis }, { customInstructions });
                } else {
                    title = `תוכנית התערבות - ${interventionMethod}`;
                    result = await analysisService.runCustomAnalysis('intervention_plan', { initialAnalysis }, { method: interventionMethod, focus: interventionFocus });
                }
            }

            onAnalysisComplete(result, title);
            onClose();
            // Reset state for next time
            setStep('select');
            setSelectedType(null);
        } catch (error) {
            console.error('Analysis failed:', error);
            alert('שגיאה בביצוע הניתוח');
            setStep('configure');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl text-right"
                dir="rtl"
            >
                {step === 'loading' ? (
                    <div className="flex flex-col items-center justify-center py-10">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mb-4"></div>
                        <p className="text-white text-lg">אמה מנתחת את הנתונים...</p>
                    </div>
                ) : step === 'select' ? (
                    <>
                        <h2 className="2xl font-bold text-white mb-6">בחר סוג ניתוח נוסף</h2>
                        <div className="space-y-4">
                            {!hasParticipantAnalysis && (
                                <button
                                    onClick={() => { setSelectedType('participant'); setStep('configure'); }}
                                    className="w-full p-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl flex items-center justify-between group transition-all"
                                >
                                    <span className="text-2xl group-hover:scale-110 transition-transform">👥</span>
                                    <div className="text-right flex-1 mr-4">
                                        <h3 className="text-lg font-bold text-white">ניתוח משתתפים</h3>
                                        <p className="text-slate-400 text-sm">ניתוח מעמיק של המשתתפים, רגשות ודינמיקה.</p>
                                    </div>
                                    <span className="text-slate-500">←</span>
                                </button>
                            )}

                            <button
                                onClick={() => { setSelectedType('intervention'); setStep('configure'); }}
                                className="w-full p-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl flex items-center justify-between group transition-all"
                            >
                                <span className="text-2xl group-hover:scale-110 transition-transform">📋</span>
                                <div className="text-right flex-1 mr-4">
                                    <h3 className="text-lg font-bold text-white">בניית תוכנית התערבות</h3>
                                    <p className="text-slate-400 text-sm">תוכנית פעולה פרקטית מבוססת שיטות טיפול.</p>
                                </div>
                                <span className="text-slate-500">←</span>
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-6">
                            <button onClick={() => setStep('select')} className="text-slate-400 hover:text-white">→ חזרה</button>
                            <h2 className="text-xl font-bold text-white">
                                {selectedType === 'participant' ? 'הגדרות ניתוח משתתפים' : 'הגדרות תוכנית התערבות'}
                            </h2>
                        </div>

                        {selectedType === 'participant' && (
                            <div className="space-y-4">
                                <label className="block text-slate-300 mb-2">רמת עומק:</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setParticipantDepth('regular')}
                                        className={`flex-1 p-3 rounded-lg border ${participantDepth === 'regular' ? 'bg-cyan-900/30 border-cyan-500 text-cyan-400' : 'bg-slate-800 border-slate-600 text-slate-400'}`}
                                    >
                                        רגיל
                                    </button>
                                    <button
                                        onClick={() => setParticipantDepth('deep')}
                                        className={`flex-1 p-3 rounded-lg border ${participantDepth === 'deep' ? 'bg-purple-900/30 border-purple-500 text-purple-400' : 'bg-slate-800 border-slate-600 text-slate-400'}`}
                                    >
                                        מעמיק
                                    </button>
                                </div>
                            </div>
                        )}

                        {selectedType === 'intervention' && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-slate-300 mb-2">שיטת טיפול:</label>
                                    <select
                                        value={interventionMethod}
                                        onChange={(e) => setInterventionMethod(e.target.value as any)}
                                        className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white outline-none focus:ring-2 focus:ring-cyan-500"
                                    >
                                        <option value="CBT">CBT (קוגניטיבי-התנהגותי)</option>
                                        <option value="DBT">DBT (דיאלקטי-התנהגותי)</option>
                                        <option value="Narrative">גישה נרטיבית</option>
                                        <option value="Custom">מותאם אישית</option>
                                    </select>
                                    <p className="text-xs text-slate-500 mt-2">
                                        {interventionMethod === 'CBT' && 'שינוי דפוסי חשיבה והתנהגות.'}
                                        {interventionMethod === 'DBT' && 'ויסות רגשי, קבלה ושינוי.'}
                                        {interventionMethod === 'Narrative' && 'יצירת סיפור אלטרנטיבי מעצים.'}
                                        {interventionMethod === 'Custom' && 'בנה תוכנית לפי ההנחיות שלך.'}
                                    </p>
                                </div>

                                {interventionMethod !== 'Custom' ? (
                                    <div>
                                        <label className="block text-slate-300 mb-2">מיקוד:</label>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setInterventionFocus('emotional')}
                                                className={`flex-1 p-3 rounded-lg border ${interventionFocus === 'emotional' ? 'bg-pink-900/30 border-pink-500 text-pink-400' : 'bg-slate-800 border-slate-600 text-slate-400'}`}
                                            >
                                                רגשי ❤️
                                            </button>
                                            <button
                                                onClick={() => setInterventionFocus('cognitive')}
                                                className={`flex-1 p-3 rounded-lg border ${interventionFocus === 'cognitive' ? 'bg-blue-900/30 border-blue-500 text-blue-400' : 'bg-slate-800 border-slate-600 text-slate-400'}`}
                                            >
                                                שכלי 🧠
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-slate-300 mb-2">הנחיות לאמה:</label>
                                        <textarea
                                            value={customInstructions}
                                            onChange={(e) => setCustomInstructions(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white h-24 resize-none focus:ring-2 focus:ring-cyan-500"
                                            placeholder="למשל: תתמקדי בחיזוק הביטחון העצמי של הילד..."
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            onClick={handleRunAnalysis}
                            className="w-full mt-8 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 rounded-xl shadow-lg transition-all transform hover:scale-[1.02]"
                        >
                            {selectedType === 'participant' ? 'נתח משתתפים ✨' : 'בנה תוכנית 🚀'}
                        </button>
                    </>
                )}
            </motion.div>
        </div>
    );
}
