'use client';

import { useState, useEffect } from 'react';
import { AnalysisResult, TimelineEvent } from '@/lib/gemini';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';
import ReactPlayer from 'react-player';
import { EmmaAnalysisChat } from '@/components/EmmaAnalysisChat';

// Mock data for demo - in production, this would come from Firestore
const mockResults: AnalysisResult = {
    forensic_layer: {
        case_description: 'בסרטון נראית אינטראקציה משפחתית יומיומית בין אב לביתו. השיחה נסובה סביב חוויות היום של הילדה בבית הספר, תוך כדי משחק משותף בסלון.',
        environment: 'סלון ביתי מואר ומסודר, ישנם צעצועים פזורים על השטיח, טלוויזיה פועלת ברקע בעוצמה נמוכה.',
        facts: [
            'השיחה התרחשה בסלון הבית בשעות הבוקר',
            'משך הווידאו: 5 דקות ו-32 שניות',
            'טון הדיבור: רגוע במרבית הזמן, מתון פעם אחת',
            'שפת גוף: פתוחה ומכלילה במרבית הזמן'
        ],
        observations: [
            'קשר עין קבוע בין המשתתפים',
            'אין סימני מצוקה פיזית או חרדה',
            'תנוחת גוף פתוחה',
            'טון קול שקול ורגוע'
        ],
        timeline_events: [
            { timestamp: '00:00:15', event: 'תחילת שיחה - הצגת הנושא' },
            { timestamp: '00:01:30', event: 'דיון על רגשות' },
            { timestamp: '00:02:30', event: 'רגע מתוח קל - עליית טון' },
            { timestamp: '00:03:45', event: 'הקשבה אקטיבית' },
            { timestamp: '00:04:45', event: 'פתרון והרגעה' },
            { timestamp: '00:05:20', event: 'סיום חיובי' }
        ]
    },
    psychological_layer: {
        participant_analysis: [
            {
                name: 'יוסי',
                role: 'אב',
                actions: 'מקשיב, מהנהן, שואל שאלות פתוחות',
                feelings: 'סבלנות, אכפתיות, דאגה קלה',
                context: 'מנסה להבין מה עבר על בתו'
            },
            {
                name: 'דנה',
                role: 'ילדה',
                actions: 'משחקת בקוביות, מספרת בהתלהבות',
                feelings: 'התרגשות, ביטחון, שמחה',
                context: 'משתפת חוויה חיובית'
            }
        ],
        interpretations: [
            'קשר בריא וחיובי בין המשתתפים',
            'תקשורת פתוחה וישירה',
            'יכולת לפתור קונפליקטים בצורה בונה',
            'רמת אמפתיה גבוהה',
            'כבוד הדדי והקשבה אמי תית'
        ],
        emotional_states: {
            'יוסי (הורה)': 7,
            'דנה (ילדה)': 6
        },
        relationship_dynamics: [
            'יחסי הורה-ילד חיוביים עם תקשורת דו-כיוונית',
            'כבוד הדדי ויכולת להבעת רגשות',
            'יכולת להקשבה פעילה משני הצדדים',
            'סביבה רגשית בטוחה'
        ]
    },
    safety_layer: {
        verdict: 'safe',
        score: 8.5,
        risk_factors: [],
        protective_factors: [
            'תקשורת בריאה ופתוחה',
            'סביבה פיזית בטוחה',
            'תמיכה רגשית הדדית',
            'כבוד לגבולות אישיים',
            'יכולת פתרון קונפליקטים'
        ]
    },
    timeline_log: [
        { timestamp: '00:00:15', event: 'תחילת שיחה', stress_level: 3, warmth_level: 7, participant: 'יוסי' },
        { timestamp: '00:00:45', event: 'שיתוף רגשות', stress_level: 4, warmth_level: 8, participant: 'דנה' },
        { timestamp: '00:01:30', event: 'דיון על קשיים', stress_level: 5, warmth_level: 7, participant: 'יוסי' },
        { timestamp: '00:02:00', event: 'הקשבה והבנה', stress_level: 4, warmth_level: 9, participant: 'דנה' },
        { timestamp: '00:02:30', event: 'רגע מתוח', stress_level: 6, warmth_level: 5, participant: 'יוסי' },
        { timestamp: '00:03:00', event: 'הרגעה', stress_level: 4, warmth_level: 8, participant: 'דנה' },
        { timestamp: '00:03:45', event: 'חיבור רגשי', stress_level: 2, warmth_level: 9, participant: 'יוסי' },
        { timestamp: '00:04:45', event: 'פתרון', stress_level: 2, warmth_level: 9, participant: 'דנה' },
        { timestamp: '00:05:20', event: 'סיום חיובי', stress_level: 1, warmth_level: 10, participant: 'יוסי' }
    ],
    recommendations: [
        {
            title: 'המשך תקשורת פתוחה',
            explanation: 'שמור על השיחות הפתוחות והישירות שראינו בווידאו. זו הבסיס לקשר בריא.',
            why_it_works: 'תקשורת פתוחה מחזקת את האמון, מונעת אי-הבנות, ומאפשרת לילדים להרגיש בטוחים לשתף רגשות',
            icon: '💬'
        },
        {
            title: 'תגבר רגעי איכות יומיים',
            explanation: 'הקדש 15-20 דקות ביום לשיחה משמעותית ללא הסחות דעת (טלפון, טלוויזיה).',
            why_it_works: 'רגעי איכות מחזקים את הקשר הרגשי ומאפשרים לילד להרגיש נשמע ומוערך',
            icon: '⏰'
        },
        {
            title: 'הקשב בפעילות',
            explanation: 'המשך להשתמש בהקשבה פעילה - חזור על מה ששמעת, שאל שאלות הבהרה.',
            why_it_works: 'הקשבה פעילה מראה לילד שאתה באמת מבין אותו, ומחזקת את תחושת הביטחון',
            icon: '👂'
        },
        {
            title: 'תרגל ויסות רגשי משותף',
            explanation: 'ברגעים מאתגרים, נשום ביחד בעומק והסבר איך אתה מרגיש.',
            why_it_works: 'מודלינג של ויסות רגשי מלמד את הילד כלים להתמודדות עם רגשות קשים',
            icon: '🧘'
        },
        {
            title: 'חגוג הצלחות קטנות',
            explanation: 'הכיר בתקשורת המוצלחת והרגעים החיוביים.',
            why_it_works: 'חיזוק חיובי מחזק התנהגויות רצויות ומגביר מוטיבציה',
            icon: '🎉'
        }
    ]
};

export default function ResultsPage() {
    const [results] = useState<AnalysisResult>(mockResults);
    const [activeTab, setActiveTab] = useState<'forensic' | 'psychology' | 'safety'>('forensic');
    // Prepare chart data
    const chartData = results.timeline_log.map(log => ({
        time: log.timestamp,
        stress: log.stress_level,
        warmth: log.warmth_level,
        participant: log.participant
    }));

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-800 via-cyan-900 to-blue-900 p-4">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Executive Summary */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl shadow-2xl p-8"
                >
                    <div className="flex items-start gap-6">
                        <div className={`flex-shrink-0 w-32 h-32 rounded-full flex items-center justify-center text-5xl font-bold text-white ${results.safety_layer.verdict === 'safe' ? 'bg-gradient-to-br from-green-400 to-green-600' :
                            results.safety_layer.verdict === 'concerning' ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                                'bg-gradient-to-br from-red-400 to-red-600'
                            }`}>
                            {results.safety_layer.score}
                        </div>

                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">תוצאות הניתוח</h1>
                            <p className="text-xl text-gray-700 mb-4">
                                {results.safety_layer.verdict === 'safe' && 'הווידאו מציג אינטראקציה בטוחה וחיובית'}
                                {results.safety_layer.verdict === 'concerning' && 'נמצאו מספר נקודות לתשומת לב'}
                                {results.safety_layer.verdict === 'unsafe' && 'קיימים חששות בטיחותיים'}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {Object.keys(results.psychological_layer.emotional_states).map(name => (
                                    <span key={name} className="px-4 py-2 bg-cyan-100 text-cyan-700 rounded-full font-semibold">
                                        {name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Emma's Explanation */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-3xl shadow-2xl p-8"
                >
                    <div className="flex items-start gap-6">
                        <div className="flex-shrink-0">
                            <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-4xl">
                                🤖
                            </div>
                        </div>

                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">Emma מסבירה</h2>
                            <div className="space-y-3">
                                <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
                                    <p className="text-gray-700">
                                        לאחר ניתוח מעמיק של הווידאו, אני רואה אינטראקציה חיובית ובריאה. התקשורת פתוחה, יש הקשבה הדדית, והמשתתפים מראים כבוד אחד לשני.
                                    </p>
                                </div>

                                <details className="bg-gray-50 rounded-xl p-4 cursor-pointer">
                                    <summary className="font-semibold text-gray-800">איך הגעתי למסקנה הזו?</summary>
                                    <div className="mt-3 space-y-2 text-sm text-gray-700">
                                        <p>📊 <strong>שכבה משפטית:</strong> זיהיתי {results.forensic_layer.facts.length} עובדות מפתח</p>
                                        <p>🧠 <strong>שכבה פסיכולוגית:</strong> ניתחתי דינמיקה רגשית והתנהגות</p>
                                        <p>🛡️ <strong>שכבת בטיחות:</strong> הערכתי סיכונים וגורמים מגנים</p>
                                    </div>
                                </details>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Timeline Viewer */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-3xl shadow-2xl p-8"
                >
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">⏱️ ציר הזמן</h2>

                    {/* Video Player Placeholder */}
                    <div className="bg-gray-900 rounded-2xl aspect-video mb-6 flex items-center justify-center text-white">
                        <div className="text-center">
                            <div className="text-6xl mb-4">🎬</div>
                            <p>נגן וידאו (integration עם ReactPlayer)</p>
                        </div>
                    </div>

                    {/* Timeline Markers */}
                    <div className="space-y-2">
                        {results.timeline_log.map((event, i) => (
                            <motion.div
                                key={i}
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.3 + i * 0.05 }}
                                className="flex items-center gap-4 p-3 hover:bg-cyan-50 rounded-xl cursor-pointer transition-colors"
                            >
                                <span className="text-sm font-mono text-cyan-600 w-20">{event.timestamp}</span>
                                <div className={`w-3 h-3 rounded-full ${event.stress_level && event.stress_level > 5 ? 'bg-red-500' :
                                    event.warmth_level && event.warmth_level > 7 ? 'bg-green-500' :
                                        'bg-yellow-500'
                                    }`} />
                                <span className="flex-1 text-gray-700">{event.event}</span>
                                {event.participant && (
                                    <span className="text-sm text-gray-500">{event.participant}</span>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Emotional Graphs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-3xl shadow-2xl p-8"
                >
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">📊 גרפים רגשיים</h2>

                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <XAxis dataKey="time" />
                                <YAxis domain={[0, 10]} />
                                <Tooltip />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="stress"
                                    stroke="#ef4444"
                                    strokeWidth={3}
                                    name="מתח"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="warmth"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    name="חום"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Detailed Breakdown */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white rounded-3xl shadow-2xl p-8"
                >
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">📋 פירוט מלא</h2>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-6">
                        {[
                            { id: 'forensic', label: 'עובדות', icon: '⚖️' },
                            { id: 'psychology', label: 'פסיכולוגיה', icon: '🧠' },
                            { id: 'safety', label: 'בטיחות', icon: '🛡️' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-6 py-3 rounded-xl font-semibold transition-all ${activeTab === tab.id
                                    ? 'bg-gradient-to-l from-cyan-500 to-orange-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="space-y-4">
                        {activeTab === 'forensic' && (
                            <>
                                <div>
                                    <h4 className="font-bold text-gray-800 mb-2">עובדות מפתח:</h4>
                                    <ul className="space-y-2">
                                        {results.forensic_layer.facts.map((fact, i) => (
                                            <li key={i} className="text-gray-700 flex gap-2">
                                                <span className="text-cyan-500">▪</span> {fact}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-800 mb-2">תצפיות:</h4>
                                    <ul className="space-y-2">
                                        {results.forensic_layer.observations.map((obs, i) => (
                                            <li key={i} className="text-gray-700 flex gap-2">
                                                <span className="text-cyan-500">▪</span> {obs}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </>
                        )}

                        {activeTab === 'psychology' && (
                            <>
                                <div>
                                    <h4 className="font-bold text-gray-800 mb-2">פרשנויות:</h4>
                                    <ul className="space-y-2">
                                        {results.psychological_layer.interpretations.map((interp, i) => (
                                            <li key={i} className="text-gray-700 flex gap-2">
                                                <span className="text-purple-500">▪</span> {interp}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-800 mb-2">דינמיקה:</h4>
                                    <ul className="space-y-2">
                                        {results.psychological_layer.relationship_dynamics.map((dyn, i) => (
                                            <li key={i} className="text-gray-700 flex gap-2">
                                                <span className="text-purple-500">▪</span> {dyn}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </>
                        )}

                        {activeTab === 'safety' && (
                            <>
                                <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                                    <h4 className="font-bold text-green-800 mb-3">גורמים מגנים:</h4>
                                    <ul className="space-y-2">
                                        {results.safety_layer.protective_factors.map((factor, i) => (
                                            <li key={i} className="text-green-700 flex gap-2">
                                                <span>✓</span> {factor}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>

                {/* Recommendations */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white rounded-3xl shadow-2xl p-8"
                >
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">💡 המלצות מעשיות</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {results.recommendations.map((rec, i) => (
                            <motion.div
                                key={i}
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.6 + i * 0.1 }}
                                className="bg-gradient-to-br from-cyan-50 to-orange-50 border border-cyan-200 rounded-2xl p-6"
                            >
                                <div className="text-4xl mb-3">{rec.icon}</div>
                                <h4 className="font-bold text-gray-800 mb-2">{i + 1}. {rec.title}</h4>
                                <p className="text-sm text-gray-700 mb-3">{rec.explanation}</p>
                                <details className="text-xs text-gray-600">
                                    <summary className="cursor-pointer font-semibold">למה זה עובד?</summary>
                                    <p className="mt-2">{rec.why_it_works}</p>
                                </details>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Chat with Emma */}
                {/* Chat with Emma */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <EmmaAnalysisChat analysisResults={results} />
                </motion.div>

                {/* Export Options */}
                <div className="flex gap-4 justify-center pb-8">
                    <button className="px-8 py-4 bg-white text-gray-800 rounded-xl font-bold hover:bg-gray-100 transition-all shadow-lg">
                        📄 יצא PDF
                    </button>
                    <button className="px-8 py-4 bg-white text-gray-800 rounded-xl font-bold hover:bg-gray-100 transition-all shadow-lg">
                        🔗 שתף קישור
                    </button>
                    <button className="px-8 py-4 bg-white text-gray-800 rounded-xl font-bold hover:bg-gray-100 transition-all shadow-lg">
                        ✉️ שלח במייל
                    </button>
                </div>
            </div>
        </div>
    );
}
