'use client';

import { AnalysisResult } from '@/lib/gemini';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import EmmaChatComponent from './EmmaChatComponent';

interface KindergartenResultsViewProps {
    result: AnalysisResult;
    onReset: () => void;
    videoUrl: string | null;
}

export default function KindergartenResultsView({ result, onReset, videoUrl }: KindergartenResultsViewProps) {
    const [showRawJson, setShowRawJson] = useState(false);

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12 relative z-10">
            {/* Premium Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-[2rem] p-10"
            >
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-8">
                        <motion.div
                            className="w-28 h-28 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center text-6xl shadow-2xl"
                            whileHover={{ rotate: -5, scale: 1.05 }}
                        >
                            👩‍🏫
                        </motion.div>
                        <div>
                            <h1 className="text-5xl font-bold text-white mb-2 text-glow">הדוח של אמה</h1>
                            <div className="flex items-center gap-3">
                                <div className="badge badge-info">פיקוח פדגוגי</div>
                                {result.duration && (
                                    <div className="badge badge-success">
                                        ⏱️ {result.duration.toFixed(1)}s
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <motion.button
                            onClick={() => setShowRawJson(true)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="btn-primary"
                        >
                            📄 JSON מקורי
                        </motion.button>
                        <motion.button
                            onClick={onReset}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="btn-secondary"
                        >
                            🔄 ניתוח חדש
                        </motion.button>
                    </div>
                </div>
            </motion.div>

            {/* Premium Scores */}
            {result.scores && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-8"
                >
                    <ScoreCard title="בטיחות" score={result.scores.safety || 0} icon="🛡️" color="from-blue-500 to-cyan-500" />
                    <ScoreCard title="אקלים רגשי" score={result.scores.climate || 0} icon="🌈" color="from-purple-500 to-pink-500" />
                    <ScoreCard title="אינטראקציה חינוכית" score={result.scores.interaction || 0} icon="🧩" color="from-orange-500 to-yellow-500" />
                </motion.div>
            )}

            {/* Executive Summary */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-card rounded-[2rem] p-10"
            >
                <div className="flex items-center gap-4 mb-8">
                    <span className="text-5xl">📝</span>
                    <h2 className="text-4xl font-bold text-white">סיכום מנהלים</h2>
                </div>

                <div className="prose prose-lg max-w-none text-slate-300 leading-relaxed text-right" dir="rtl">
                    <p className="whitespace-pre-wrap text-lg">
                        {result.executive_summary?.analysis || "לא התקבל סיכום."}
                    </p>
                </div>

                {result.executive_summary?.key_events && result.executive_summary.key_events.length > 0 && (
                    <div className="mt-10 bg-white/5 rounded-2xl p-8 border border-white/10">
                        <h3 className="text-2xl font-bold text-white mb-6 text-right">ציר זמן אירועים</h3>
                        <div className="space-y-4">
                            {result.executive_summary.key_events.map((event: any, idx: number) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="flex items-start gap-4 flex-row-reverse p-5 rounded-xl hover:bg-white/10 transition-all border border-white/5"
                                >
                                    <span className="badge badge-info font-mono text-sm min-w-[70px] text-center">
                                        {event.time}
                                    </span>
                                    <span className="text-slate-300 text-right flex-1 text-base">{event.event}</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}
            </motion.div>

            {/* Resource Audit */}
            {result.resource_audit && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass-card rounded-[2rem] p-10"
                >
                    <div className="flex items-center gap-4 mb-8">
                        <span className="text-5xl">🔍</span>
                        <h2 className="text-4xl font-bold text-white">ביקורת משאבים וציוד</h2>
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

            {/* Developmental Milestone Check */}
            {result.developmental_milestone_check && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="glass-card rounded-[2rem] p-10"
                >
                    <div className="flex items-center gap-4 mb-8">
                        <span className="text-5xl">📊</span>
                        <h2 className="text-4xl font-bold text-white">בדיקת אבני דרך התפתחותיות</h2>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-blue-500/10 rounded-2xl p-8 border-2 border-blue-500/30 card-hover">
                            <h3 className="font-bold text-blue-300 mb-4 text-right text-2xl">פעילות שנצפתה:</h3>
                            <p className="text-slate-200 text-right text-lg leading-relaxed" dir="rtl">{result.developmental_milestone_check.observed_activity}</p>
                        </div>

                        <div className="bg-purple-500/10 rounded-2xl p-8 border-2 border-purple-500/30 card-hover">
                            <h3 className="font-bold text-purple-300 mb-4 text-right text-2xl">אבן דרך מצופה לגיל:</h3>
                            <p className="text-slate-200 text-right text-lg leading-relaxed" dir="rtl">{result.developmental_milestone_check.expected_milestone}</p>
                        </div>

                        <div className="flex items-center justify-between bg-green-500/10 rounded-2xl p-8 flex-row-reverse border-2 border-green-500/30 neon-border">
                            <div className="badge badge-success text-xl px-8 py-4">
                                {result.developmental_milestone_check.verdict}
                            </div>
                            <div className="text-right flex-1 ml-8">
                                <h3 className="font-bold text-green-300 mb-3 text-2xl">ניתוח מקצועי:</h3>
                                <p className="text-slate-200 text-lg leading-relaxed" dir="rtl">{result.developmental_milestone_check.professional_analysis}</p>
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
                    className="glass-card rounded-[2rem] p-10"
                >
                    <div className="flex items-center gap-4 mb-8">
                        <span className="text-5xl">🏠</span>
                        <h2 className="text-4xl font-bold text-white">סריקה סביבתית</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-right" dir="rtl">
                        <div className="bg-cyan-500/10 p-8 rounded-2xl border-2 border-cyan-500/30 card-hover">
                            <h4 className="font-bold text-cyan-300 mb-4 text-2xl">עומס חושי</h4>
                            <p className="text-slate-200 text-lg leading-relaxed">{result.environmental_scan.sensory_load}</p>
                        </div>
                        {result.environmental_scan.layout_analysis && (
                            <div className="bg-indigo-500/10 p-8 rounded-2xl border-2 border-indigo-500/30 card-hover">
                                <h4 className="font-bold text-indigo-300 mb-4 text-2xl">ניתוח עיצוב המרחב</h4>
                                <p className="text-slate-200 text-lg leading-relaxed">{result.environmental_scan.layout_analysis}</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            {/* Stakeholder Recommendations */}
            {result.stakeholder_specifics && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                    className="glass-card rounded-[2rem] p-10"
                >
                    <h2 className="text-4xl font-bold text-white mb-10 text-center flex items-center justify-center gap-4">
                        <span>👥</span> המלצות לבעלי עניין
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StakeholderCard
                            title="למנהלת הגן"
                            data={result.stakeholder_specifics.director}
                            icon="👩‍💼"
                            color="from-purple-500 to-pink-500"
                        />
                        <StakeholderCard
                            title="להורים"
                            data={result.stakeholder_specifics.parents}
                            icon="👨‍👩‍👧‍👦"
                            color="from-orange-500 to-red-500"
                        />
                        <StakeholderCard
                            title="לפיקוח / רשות"
                            data={result.stakeholder_specifics.authority}
                            icon="🏛️"
                            color="from-blue-500 to-cyan-500"
                        />
                    </div>
                </motion.div>
            )}

            {/* Keep vs Improve */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="glass-card rounded-[2rem] p-10"
                >
                    <div className="flex items-center gap-4 mb-8">
                        <span className="text-4xl">🌟</span>
                        <h3 className="text-3xl font-bold text-green-400">לשימור</h3>
                    </div>

                    <div className="space-y-5">
                        {result.recommendations_to_keep && Array.isArray(result.recommendations_to_keep) && (
                            result.recommendations_to_keep.map((item: any, i: number) => (
                                <SectionBlock
                                    key={i}
                                    title={item.category}
                                    content={item.action}
                                    justification={item.professional_justification}
                                    type="keep"
                                />
                            ))
                        )}
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="glass-card rounded-[2rem] p-10"
                >
                    <div className="flex items-center gap-4 mb-8">
                        <span className="text-4xl">🔧</span>
                        <h3 className="text-3xl font-bold text-red-400">לשיפור</h3>
                    </div>

                    <div className="space-y-5">
                        {result.recommendations_to_improve && Array.isArray(result.recommendations_to_improve) && (
                            result.recommendations_to_improve.map((item: any, i: number) => (
                                <SectionBlock
                                    key={i}
                                    title={item.category}
                                    content={item.action}
                                    justification={item.professional_justification}
                                    urgency={item.urgency}
                                    correctionModel={item.correction_model}
                                    emotionalActivities={item.emotional_response_activities}
                                    type="improve"
                                />
                            ))
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
                <EmmaChatComponent analysisReport={result} />
            </motion.div>

            {/* Raw JSON Modal */}
            <AnimatePresence>
                {showRawJson && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
                        onClick={() => setShowRawJson(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="glass-card rounded-[2rem] p-10 max-w-5xl w-full max-h-[85vh] overflow-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <span className="text-4xl">📄</span>
                                    <h2 className="text-3xl font-bold text-white">JSON מקורי מ-Gemini</h2>
                                </div>
                                <button
                                    onClick={() => setShowRawJson(false)}
                                    className="text-slate-400 hover:text-white text-4xl transition-colors"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="bg-slate-900/90 rounded-2xl p-8 overflow-auto max-h-[60vh] border border-white/10">
                                <pre className="font-mono text-sm text-green-300" dir="ltr">
                                    {JSON.stringify(result, null, 2)}
                                </pre>
                            </div>

                            <div className="mt-8 flex gap-4">
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(JSON.stringify(result, null, 2));
                                        alert('JSON הועתק ללוח!');
                                    }}
                                    className="btn-primary"
                                >
                                    📋 העתק ללוח
                                </button>
                                <button
                                    onClick={() => setShowRawJson(false)}
                                    className="btn-secondary"
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

// Premium Score Card
function ScoreCard({ title, score, icon, color }: { title: string; score: number; icon: string; color: string }) {
    const getScoreColor = () => {
        if (score >= 8) return 'from-green-500 to-emerald-600';
        if (score >= 5) return 'from-yellow-500 to-orange-500';
        return 'from-red-500 to-pink-500';
    };

    return (
        <motion.div
            className="glass-card rounded-[2rem] p-8 card-hover relative overflow-hidden"
            whileHover={{ y: -8 }}
        >
            <div className={`absolute top-0 right-0 w-48 h-48 bg-gradient-to-br ${color} opacity-20 rounded-full blur-3xl`} />

            <div className="relative">
                <div className="flex items-center justify-between mb-6">
                    <span className="text-5xl">{icon}</span>
                    <div className="score-circle">
                        <span className="score-number">{score}</span>
                    </div>
                </div>
                <h3 className="text-2xl font-bold text-white text-right mb-4">{title}</h3>
                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${score * 10}%` }} />
                </div>
            </div>
        </motion.div>
    );
}

// Premium Audit Item
function AuditItem({ icon, title, content }: { icon: string; title: string; content?: string }) {
    if (!content) return null;

    return (
        <motion.div
            className="bg-white/5 rounded-2xl p-7 border border-white/10 card-hover"
            whileHover={{ y: -4 }}
        >
            <div className="flex items-center gap-3 mb-4 justify-end">
                <h4 className="font-bold text-white text-right text-xl">{title}</h4>
                <span className="text-3xl">{icon}</span>
            </div>
            <p className="text-slate-300 text-base text-right leading-relaxed" dir="rtl">{content}</p>
        </motion.div>
    );
}

// Premium Stakeholder Card
function StakeholderCard({ title, data, icon, color }: {
    title: string;
    data?: { note: string; justification?: string; immediate_action_item?: string };
    icon: string;
    color: string;
}) {
    return (
        <motion.div
            className="glass-card rounded-2xl p-8 card-hover relative overflow-hidden"
            whileHover={{ y: -8 }}
        >
            <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${color} opacity-15 rounded-full blur-3xl`} />

            <div className="relative">
                <div className="flex items-center gap-3 mb-5 justify-end">
                    <h3 className="text-xl font-bold text-white text-right">{title}</h3>
                    <span className="text-4xl">{icon}</span>
                </div>
                {data && (
                    <>
                        <p className="text-base font-medium text-slate-200 text-right mb-4 leading-relaxed" dir="rtl">{data.note}</p>
                        {data.justification && (
                            <div className="bg-white/10 rounded-xl p-4 text-sm text-right mb-3" dir="rtl">
                                <strong className="text-white">הנמקה:</strong> <span className="text-slate-300">{data.justification}</span>
                            </div>
                        )}
                        {data.immediate_action_item && (
                            <div className="bg-red-500/20 rounded-xl p-4 text-sm text-right border-2 border-red-500/30" dir="rtl">
                                <strong className="text-red-300">🎯 פעולה מיידית:</strong> <span className="text-slate-200">{data.immediate_action_item}</span>
                            </div>
                        )}
                    </>
                )}
            </div>
        </motion.div>
    );
}

// Premium Section Block
function SectionBlock({ title, content, justification, urgency, type, correctionModel, emotionalActivities }: {
    title?: string;
    content?: string;
    justification?: string;
    urgency?: string;
    type: 'keep' | 'improve';
    correctionModel?: { what_to_do?: string; what_to_say?: string };
    emotionalActivities?: { activity_name?: string; description?: string }[];
}) {
    if (!content) return null;

    const getUrgencyBadge = (u?: string) => {
        switch (u) {
            case 'Immediate': return <span className="badge badge-error text-xs">מיידי 🚨</span>;
            case 'High': return <span className="badge badge-warning text-xs">גבוה ⚠️</span>;
            case 'Medium': return <span className="badge badge-warning text-xs">בינוני ⏰</span>;
            case 'Low': return <span className="badge badge-info text-xs">נמוך ℹ️</span>;
            default: return null;
        }
    };

    return (
        <motion.div
            className={`${type === 'improve' ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'} p-7 rounded-2xl border-2`}
            whileHover={{ x: type === 'improve' ? -5 : 5 }}
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className={`font-bold text-lg ${type === 'improve' ? 'text-red-300' : 'text-green-300'}`}>{title}</span>
                </div>
                {urgency && getUrgencyBadge(urgency)}
            </div>
            <p className="text-slate-200 font-medium text-base leading-relaxed text-right mb-3" dir="rtl">
                {content}
            </p>
            {justification && (
                <p className="text-slate-400 text-sm leading-relaxed text-right border-r-2 border-white/20 pr-4 mb-3" dir="rtl">
                    {justification}
                </p>
            )}

            {correctionModel && (correctionModel.what_to_do || correctionModel.what_to_say) && (
                <div className="bg-green-500/20 p-5 rounded-xl mt-4 border-2 border-green-500/30" dir="rtl">
                    <span className="text-sm font-bold text-green-300 block mb-3">✅ תסריט תיקון:</span>
                    {correctionModel.what_to_do && (
                        <p className="text-sm text-green-200 mb-2"><strong>פעולה:</strong> {correctionModel.what_to_do}</p>
                    )}
                    {correctionModel.what_to_say && (
                        <p className="text-sm text-green-200"><strong>לומר:</strong> "{correctionModel.what_to_say}"</p>
                    )}
                </div>
            )}

            {emotionalActivities && emotionalActivities.length > 0 && (
                <div className="bg-purple-500/20 p-5 rounded-xl mt-4 border-2 border-purple-500/30" dir="rtl">
                    <span className="text-sm font-bold text-purple-300 block mb-3">🎯 פעילויות רגשיות:</span>
                    <div className="space-y-3">
                        {emotionalActivities.map((activity, idx) => (
                            <div key={idx} className="bg-white/10 p-3 rounded-lg border border-white/10">
                                <p className="text-sm font-bold text-purple-200">{activity.activity_name}</p>
                                <p className="text-xs text-slate-300 mt-1">{activity.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
}
