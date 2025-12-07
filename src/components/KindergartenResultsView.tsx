'use client';

import { AnalysisResult } from '@/lib/gemini';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import EmmaChatComponent from './EmmaChatComponent';
import VideoAnalysisPlayer from './VideoAnalysisPlayer';

interface KindergartenResultsViewProps {
    result: AnalysisResult;
    onReset: () => void;
    videoUrl: string | null;
}

export default function KindergartenResultsView({ result, onReset, videoUrl }: KindergartenResultsViewProps) {
    const [showRawJson, setShowRawJson] = useState(false);
    const [showPlayer, setShowPlayer] = useState(false);

    // Helper for Score Colors
    const getScoreColor = (score: number) => {
        if (score >= 8) return 'text-green-600 bg-green-50 border-green-200';
        if (score >= 5) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        return 'text-red-600 bg-red-50 border-red-200';
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-12 font-sans">
            {/* Header Section */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-3xl p-8 shadow-xl border border-pink-100 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-200 rounded-full blur-3xl opacity-20 -mr-10 -mt-10"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-200 rounded-full blur-3xl opacity-20 -ml-10 -mb-10"></div>

                <div className="flex items-center gap-6 z-10">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-5xl shadow-lg border-4 border-white ring-2 ring-pink-200">
                        👩‍🏫
                    </div>
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">הדוח של אמה</h1>
                        <p className="text-pink-600 font-medium text-lg mt-1">פיקוח פדגוגי וייעוץ חינוכי</p>
                        {result.duration && (
                            <div className="flex items-center gap-2 mt-2 text-gray-600">
                                <span className="text-lg">⏱️</span>
                                <span className="text-sm font-medium">זמן ניתוח: {result.duration.toFixed(1)} שניות</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex gap-3 z-10">
                    <button
                        onClick={() => setShowRawJson(true)}
                        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-bold hover:shadow-xl transition-all hover:scale-105"
                    >
                        📄 JSON מקורי
                    </button>
                    <button
                        onClick={onReset}
                        className="px-6 py-3 bg-white text-gray-600 rounded-2xl font-bold hover:bg-gray-50 transition-all shadow-sm border border-gray-200 hover:shadow-md"
                    >
                        🔄 ניתוח חדש
                    </button>
                    {videoUrl && (
                        <button
                            onClick={() => setShowPlayer(!showPlayer)}
                            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-2xl font-bold hover:shadow-xl transition-all hover:scale-105"
                        >
                            {showPlayer ? '❌ סגור' : '▶️ הצג סרטון'}
                        </button>
                    )}
                </div>
            </motion.div>

            {/* Scores Section */}
            {result.scores && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                    <ScoreCard
                        title="בטיחות"
                        score={result.scores.safety || result.scores.safety_score}
                        icon="🛡️"
                        color="blue"
                        tooltip="מדד בטיחות: בוחן סיכונים פיזיים, השגחה, ותגובה למצבי חירום."
                    />
                    <ScoreCard
                        title="אקלים רגשי"
                        score={result.scores.climate || result.scores.climate_score}
                        icon="🌈"
                        color="purple"
                        tooltip="אקלים רגשי: בוחן את האווירה בגן, יחסי צוות-ילדים, ותחושת המוגנות."
                    />
                    <ScoreCard
                        title="אינטראקציה חינוכית"
                        score={result.scores.interaction || result.scores.interaction_score}
                        icon="🧩"
                        color="orange"
                        tooltip="אינטראקציה חינוכית: בוחן את איכות התקשורת, תיווך למידה, ועידוד עצמאות."
                    />
                </motion.div>
            )}

            {/* Executive Summary & Timeline */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100"
            >
                <div className="flex items-center gap-3 mb-6 border-b pb-4">
                    <span className="text-3xl">📝</span>
                    <h2 className="text-2xl font-bold text-gray-800">סיכום מנהלים</h2>
                </div>

                <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed text-right" dir="rtl">
                    <p className="whitespace-pre-wrap">
                        {result.executive_summary?.analysis || result.educational_report || "לא התקבל סיכום."}
                    </p>
                </div>

                {/* Timeline - Support both key_events and key_events_timestamps */}
                {((result.executive_summary?.key_events && result.executive_summary.key_events.length > 0) ||
                    (result.executive_summary?.key_events_timestamps && result.executive_summary.key_events_timestamps.length > 0)) && (
                        <div className="mt-8 bg-gray-50 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-gray-700 mb-4 text-right">ציר זמן אירועים</h3>
                            <div className="space-y-3">
                                {(result.executive_summary.key_events || result.executive_summary.key_events_timestamps)?.map((event: any, idx: number) => (
                                    <div key={idx} className="flex items-start gap-4 flex-row-reverse group hover:bg-white p-2 rounded-lg transition-colors cursor-default">
                                        <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-lg font-mono text-sm font-bold min-w-[60px] text-center group-hover:bg-cyan-100 group-hover:text-cyan-700 transition-colors">
                                            {event.time}
                                        </span>
                                        <span className="text-gray-600 text-right flex-1 group-hover:text-gray-900">{event.event}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
            </motion.div>

            {/* Resource Audit - NEW */}
            {result.resource_audit && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 shadow-lg border border-blue-100"
                >
                    <div className="flex items-center gap-3 mb-6 border-b border-blue-200 pb-4">
                        <span className="text-3xl">🔍</span>
                        <h2 className="text-2xl font-bold text-gray-800">ביקורת משאבים וציוד</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <AuditItem icon="🍽️" title="ציוד אוכל" content={result.resource_audit.dining_equipment} />
                        <AuditItem icon="🛏️" title="מקומות שינה" content={result.resource_audit.sleeping_arrangements} />
                        <AuditItem icon="🏞️" title="ציוד חצר" content={result.resource_audit.yard_equipment} />
                        <AuditItem icon="🧸" title="משחקים וצעצועים" content={result.resource_audit.toys_and_games} />
                        <AuditItem icon="🪑" title="ארגונומיה" content={result.resource_audit.furniture_ergonomics} />
                        <AuditItem icon="📚" title="סביבה חינוכית" content={result.resource_audit.educational_environment} />
                    </div>
                </motion.div>
            )}

            {/* Developmental Milestone Check - NEW */}
            {result.developmental_milestone_check && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 shadow-lg border border-purple-100"
                >
                    <div className="flex items-center gap-3 mb-6 border-b border-purple-200 pb-4">
                        <span className="text-3xl">📊</span>
                        <h2 className="text-2xl font-bold text-gray-800">בדיקת אבני דרך התפתחותיות</h2>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white/70 rounded-2xl p-6">
                            <h3 className="font-bold text-purple-800 mb-2 text-right">פעילות שנצפתה:</h3>
                            <p className="text-gray-700 text-right" dir="rtl">{result.developmental_milestone_check.observed_activity}</p>
                        </div>

                        <div className="bg-white/70 rounded-2xl p-6">
                            <h3 className="font-bold text-purple-800 mb-2 text-right">אבן דרך מצופה לגיל:</h3>
                            <p className="text-gray-700 text-right" dir="rtl">{result.developmental_milestone_check.expected_milestone}</p>
                        </div>

                        <div className="flex items-center justify-between bg-white/70 rounded-2xl p-6 flex-row-reverse">
                            <div className={`ml-4 px-6 py-3 rounded-full font-bold text-lg ${result.developmental_milestone_check.verdict?.toLowerCase().includes('aligned') ||
                                result.developmental_milestone_check.verdict?.includes('תואם') ? 'bg-green-100 text-green-800 border-2 border-green-300' :
                                result.developmental_milestone_check.verdict?.toLowerCase().includes('advanced') ||
                                    result.developmental_milestone_check.verdict?.includes('מתקדם') ? 'bg-blue-100 text-blue-800 border-2 border-blue-300' :
                                    'bg-orange-100 text-orange-800 border-2 border-orange-300'
                                }`}>
                                {result.developmental_milestone_check.verdict}
                            </div>
                            <div className="text-right flex-1">
                                <h3 className="font-bold text-purple-800 mb-2">ניתוח מקצועי:</h3>
                                <p className="text-gray-700" dir="rtl">{result.developmental_milestone_check.professional_analysis}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Environmental Scan */}
            {result.environmental_scan && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-blue-50/50 rounded-3xl p-8 shadow-lg border border-blue-100"
                >
                    <div className="flex items-center gap-3 mb-6 border-b border-blue-200 pb-4">
                        <span className="text-3xl">🏠</span>
                        <h2 className="text-2xl font-bold text-blue-900">סריקה סביבתית</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-right" dir="rtl">
                        {result.environmental_scan.overview && (
                            <div className="bg-white p-4 rounded-xl shadow-sm">
                                <h4 className="font-bold text-blue-800 mb-2">סקירה כללית</h4>
                                <p className="text-gray-700">{result.environmental_scan.overview}</p>
                            </div>
                        )}
                        <div className="bg-white p-4 rounded-xl shadow-sm">
                            <h4 className="font-bold text-blue-800 mb-2">עומס חושי</h4>
                            <p className="text-gray-700">{result.environmental_scan.sensory_load}</p>
                        </div>
                        {result.environmental_scan.child_suitability && (
                            <div className="bg-white p-4 rounded-xl shadow-sm">
                                <h4 className="font-bold text-blue-800 mb-2">התאמה לילדים</h4>
                                <p className="text-gray-700">{result.environmental_scan.child_suitability}</p>
                            </div>
                        )}
                        {result.environmental_scan.staff_suitability && (
                            <div className="bg-white p-4 rounded-xl shadow-sm">
                                <h4 className="font-bold text-blue-800 mb-2">ארגונומיה לצוות</h4>
                                <p className="text-gray-700">{result.environmental_scan.staff_suitability}</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            {/* Stakeholder Recommendations */}
            {(result.stakeholder_specifics || result.stakeholder_recommendations) && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    className="bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 rounded-3xl p-8 shadow-xl border border-purple-100"
                >
                    <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center flex items-center justify-center gap-3">
                        <span>👥</span> המלצות לבעלי עניין
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StakeholderCard
                            title="למנהלת הגן"
                            data={result.stakeholder_specifics?.director}
                            legacyText={typeof result.stakeholder_recommendations?.director === 'string' ? result.stakeholder_recommendations.director : undefined}
                            icon="👩‍💼"
                            color="bg-purple-100 border-purple-300 text-purple-900"
                        />
                        <StakeholderCard
                            title="להורים"
                            data={result.stakeholder_specifics?.parents}
                            legacyText={typeof result.stakeholder_recommendations?.parents === 'string' ? result.stakeholder_recommendations.parents : undefined}
                            icon="👨‍👩‍👧‍👦"
                            color="bg-orange-100 border-orange-300 text-orange-900"
                        />
                        <StakeholderCard
                            title="לפיקוח / רשות"
                            data={result.stakeholder_specifics?.authority}
                            legacyText={typeof result.stakeholder_recommendations?.authority === 'string' ? result.stakeholder_recommendations.authority : undefined}
                            icon="🏛️"
                            color="bg-blue-100 border-blue-300 text-blue-900"
                        />
                    </div>
                </motion.div>
            )}

            {/* Keep vs Improve */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* To Keep */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-green-50/50 rounded-3xl p-6 border border-green-100 shadow-sm"
                >
                    <div className="flex items-center gap-3 mb-6 border-b border-green-200 pb-3">
                        <span className="text-2xl">🌟</span>
                        <h3 className="text-xl font-bold text-green-800">לשימור (חוזקות)</h3>
                    </div>

                    <div className="space-y-6">
                        {result.recommendations_to_keep && Array.isArray(result.recommendations_to_keep) ? (
                            result.recommendations_to_keep.map((item: any, i: number) => (
                                <SectionBlock
                                    key={i}
                                    title={item.category}
                                    content={item.action}
                                    justification={item.professional_justification}
                                    icon={item.category === 'Safety' ? '🛡️' : item.category === 'Interaction' ? '🤝' : '✨'}
                                />
                            ))
                        ) : (
                            result.good_things && (
                                <ul className="list-disc list-inside text-right text-gray-700 space-y-2" dir="rtl">
                                    {result.good_things.map((item: string, i: number) => <li key={i}>{item}</li>)}
                                </ul>
                            )
                        )}
                    </div>
                </motion.div>

                {/* To Improve */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-red-50/50 rounded-3xl p-6 border border-red-100 shadow-sm"
                >
                    <div className="flex items-center gap-3 mb-6 border-b border-red-200 pb-3">
                        <span className="text-2xl">🔧</span>
                        <h3 className="text-xl font-bold text-red-800">לשיפור (המלצות)</h3>
                    </div>

                    <div className="space-y-6">
                        {result.recommendations_to_improve && Array.isArray(result.recommendations_to_improve) ? (
                            result.recommendations_to_improve.map((item: any, i: number) => (
                                <SectionBlock
                                    key={i}
                                    title={item.category}
                                    content={item.action}
                                    justification={item.professional_justification}
                                    urgency={item.urgency}
                                    solution={item.suggested_solution}
                                    correctionModel={item.correction_model}
                                    emotionalActivities={item.emotional_response_activities}
                                    icon={item.category === 'Safety' ? '🛡️' : item.category === 'Interaction' ? '🤝' : '📝'}
                                    isImprove={true}
                                />
                            ))
                        ) : (
                            result.recommendations && result.recommendations.length > 0 && (
                                result.recommendations.slice(0, 3).map((rec: any, i: number) => (
                                    <div key={i} className="bg-white p-4 rounded-xl shadow-sm">
                                        <h4 className="font-bold mb-2 flex items-center gap-2">
                                            {rec.icon} {rec.title}
                                        </h4>
                                        <p className="text-sm text-gray-700">{rec.explanation}</p>
                                    </div>
                                ))
                            )
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Chat with Emma */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
            >
                <EmmaChatComponent analysisResult={result} />
            </motion.div>

            {/* Raw JSON Modal */}
            <AnimatePresence>
                {showRawJson && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowRawJson(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white rounded-3xl p-8 max-w-4xl w-full max-h-[80vh] overflow-auto shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6 border-b pb-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">📄</span>
                                    <h2 className="text-2xl font-bold text-gray-800">JSON מקורי מ-Gemini</h2>
                                </div>
                                <button
                                    onClick={() => setShowRawJson(false)}
                                    className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="bg-gray-900 rounded-2xl p-6 overflow-auto max-h-[60vh]">
                                <pre className="font-mono text-sm leading-relaxed" dir="ltr">
                                    {JSON.stringify(result, null, 2).split('\n').map((line, i) => {
                                        // Color based on content
                                        let color = 'text-gray-300'; // Default

                                        // Positive words - Green
                                        if (line.match(/"(Positive|Aligned|Advanced|good|excellent|safe)"/i) ||
                                            (line.match(/"(safety|climate|interaction)": (\d+)/) && parseInt(line.match(/\d+/)?.[0] || '0') >= 7)) {
                                            color = 'text-green-400';
                                        }
                                        // Negative words - Red
                                        else if (line.match(/"(Negative|Delayed|Immediate|High|urgent|danger)"/i) ||
                                            (line.match(/"(safety|climate|interaction)": (\d+)/) && parseInt(line.match(/\d+/)?.[0] || '0') < 5)) {
                                            color = 'text-red-400';
                                        }
                                        // Medium priority - Orange
                                        else if (line.match(/"Medium"/i)) {
                                            color = 'text-orange-400';
                                        }
                                        // Keys - Cyan
                                        else if (line.match(/^\s*"[^"]+"\s*:/)) {
                                            color = 'text-cyan-400';
                                        }

                                        return <div key={i} className={color}>{line}</div>;
                                    })}
                                </pre>
                            </div>

                            <div className="mt-6 flex gap-3">
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(JSON.stringify(result, null, 2));
                                        alert('JSON הועתק ללוח!');
                                    }}
                                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-bold hover:shadow-xl transition-all"
                                >
                                    📋 העתק ללוח
                                </button>
                                <button
                                    onClick={() => setShowRawJson(false)}
                                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                                >
                                    סגור
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Score Card Component
function ScoreCard({ title, score, icon, color, tooltip }: { title: string; score: number; icon: string; color: string; tooltip: string }) {
    const getColor = () => {
        if (score >= 8) return 'from-green-400 to-emerald-500';
        if (score >= 5) return 'from-yellow-400 to-orange-500';
        return 'from-red-400 to-pink-500';
    };

    return (
        <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow group relative">
            <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 rounded-3xl transition-opacity" style={{ background: `linear-gradient(135deg, ${getColor()})` }}></div>

            <div className="flex items-center justify-between mb-4">
                <span className="text-4xl">{icon}</span>
                <div className={`text-4xl font-black bg-gradient-to-br ${getColor()} bg-clip-text text-transparent`}>
                    {score}
                </div>
            </div>
            <h3 className="text-lg font-bold text-gray-800 text-right mb-2">{title}</h3>
            <p className="text-xs text-gray-500 text-right leading-relaxed">{tooltip}</p>
        </div>
    );
}

// Stakeholder Card Component
function StakeholderCard({ title, data, legacyText, icon, color }: {
    title: string;
    data?: { note: string; justification?: string; immediate_action_item?: string };
    legacyText?: string;
    icon: string;
    color: string;
}) {
    return (
        <div className={`${color} rounded-2xl p-6 border-2 shadow-sm`}>
            <div className="flex items-center gap-3 mb-4 justify-end">
                <h3 className="text-lg font-bold text-right">{title}</h3>
                <span className="text-3xl">{icon}</span>
            </div>
            {data ? (
                <>
                    <p className="text-sm font-medium text-right mb-3 leading-relaxed" dir="rtl">{data.note}</p>
                    {data.justification && (
                        <div className="bg-white/50 rounded-lg p-3 text-xs text-right" dir="rtl">
                            <strong>הנמקה:</strong> {data.justification}
                        </div>
                    )}
                    {data.immediate_action_item && (
                        <div className="bg-red-50 rounded-lg p-3 text-xs text-right border border-red-200" dir="rtl">
                            <strong>🎯 פעולה מיידית:</strong> {data.immediate_action_item}
                        </div>
                    )}
                </>
            ) : (
                <p className="text-sm text-right" dir="rtl">{legacyText || "אין המלצה."}</p>
            )}
        </div>
    );
}

// Audit Item Component
function AuditItem({ icon, title, content }: { icon: string; title: string; content?: string }) {
    if (!content) return null;

    return (
        <div className="bg-white/70 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3 justify-end">
                <h4 className="font-bold text-blue-800 text-right">{title}</h4>
                <span className="text-2xl">{icon}</span>
            </div>
            <p className="text-gray-700 text-sm text-right leading-relaxed" dir="rtl">{content}</p>
        </div>
    );
}

// Section Block Component
function SectionBlock({ title, content, justification, urgency, solution, icon, isImprove = false, correctionModel, emotionalActivities }: {
    title?: string;
    content?: string;
    justification?: string;
    urgency?: string;
    solution?: string;
    icon?: string;
    isImprove?: boolean;
    correctionModel?: { what_to_do?: string; what_to_say?: string };
    emotionalActivities?: { activity_name?: string; description?: string }[];
}) {
    if (!content) return null;

    const getUrgencyColor = (u?: string) => {
        switch (u) {
            case 'Immediate': return 'bg-red-100 text-red-800 border-red-300 animate-pulse';
            case 'High': return 'bg-red-100 text-red-800 border-red-200';
            case 'Medium': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'Low': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const getUrgencyLabel = (u?: string) => {
        switch (u) {
            case 'Immediate': return 'מיידי 🚨';
            case 'High': return 'גבוה';
            case 'Medium': return 'בינוני';
            case 'Low': return 'נמוך';
            default: return '';
        }
    };

    return (
        <div className={`bg-white p-4 rounded-xl shadow-sm border ${isImprove ? 'border-red-100' : 'border-green-100'}`}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span>{icon}</span>
                    <span className={`font-bold ${isImprove ? 'text-red-800' : 'text-green-800'}`}>{title}</span>
                </div>
                {urgency && (
                    <span className={`text-xs px-2 py-1 rounded-full font-bold border ${getUrgencyColor(urgency)}`}>
                        {getUrgencyLabel(urgency)}
                    </span>
                )}
            </div>
            <p className="text-gray-800 font-medium text-sm leading-relaxed text-right mb-2" dir="rtl">
                {content}
            </p>
            {justification && (
                <p className="text-gray-500 text-xs leading-relaxed text-right border-r-2 border-gray-200 pr-2 mb-2" dir="rtl">
                    {justification}
                </p>
            )}

            {/* Correction Model - NEW v12 */}
            {correctionModel && (correctionModel.what_to_do || correctionModel.what_to_say) && (
                <div className="bg-green-50 p-3 rounded-lg mt-3 border border-green-200" dir="rtl">
                    <span className="text-xs font-bold text-green-700 block mb-2">✅ תסריט תיקון (מה היה צריך לעשות):</span>
                    {correctionModel.what_to_do && (
                        <p className="text-xs text-green-800 mb-2"><strong>פעולה:</strong> {correctionModel.what_to_do}</p>
                    )}
                    {correctionModel.what_to_say && (
                        <p className="text-xs text-green-800"><strong>לומר:</strong> "{correctionModel.what_to_say}"</p>
                    )}
                </div>
            )}

            {/* Emotional Response Activities - NEW v12 */}
            {emotionalActivities && emotionalActivities.length > 0 && (
                <div className="bg-purple-50 p-3 rounded-lg mt-3 border border-purple-200" dir="rtl">
                    <span className="text-xs font-bold text-purple-700 block mb-2">🎯 פעילויות רגשיות מומלצות:</span>
                    <div className="space-y-2">
                        {emotionalActivities.map((activity, idx) => (
                            <div key={idx} className="bg-white p-2 rounded border border-purple-100">
                                <p className="text-xs font-bold text-purple-800">{activity.activity_name}</p>
                                <p className="text-xs text-gray-600 mt-1">{activity.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Legacy solution field */}
            {solution && (
                <div className="bg-blue-50 p-2 rounded-lg mt-2 text-right" dir="rtl">
                    <span className="text-xs font-bold text-blue-700 block mb-1">💡 פתרון מוצע:</span>
                    <p className="text-xs text-blue-800">{solution}</p>
                </div>
            )}
        </div>
    );
}

