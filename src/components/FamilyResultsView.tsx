'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EmmaWidget } from './EmmaWidget';
import { AnalysisResult } from '@/lib/gemini';
import FeedbackComponent from './FeedbackComponent';
import VideoAnalysisPlayer from './VideoAnalysisPlayer';

import { MethodActionModal } from './MethodActionModal';

interface FamilyResultsViewProps {
    result: AnalysisResult;
    userId?: string;
    onReset?: () => void;
    videoUrl?: string | null;
    onReanalyze?: (method: string, newQuestion?: string) => void;
    userQuestion?: string;
}

export default function FamilyResultsView({ result, userId, onReset, videoUrl, onReanalyze, userQuestion }: FamilyResultsViewProps) {
    // Check if we have the new structured format
    const isStructured = typeof result.empathy === 'string';

    // Fallback for old string format or if model fails to structure
    const legacyContent = typeof result.emma_opinion === 'string' ? result.emma_opinion : null;

    // Helper to render text with bold markdown
    const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

    // Video Modal State
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
    const [initialVideoTime, setInitialVideoTime] = useState<string | null>(null);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const renderText = (text: string) => {
        if (!text) return null;

        // Clean delimiters if present
        const cleanText = text.replace(/_delimiter_/g, '');

        // Split by lines for better control
        const lines = cleanText.split('\n');

        return lines.map((line, lineIndex) => {
            // Handle headers (lines ending with :)
            if (line.trim().endsWith(':') && line.trim().length > 3) {
                return (
                    <h4 key={lineIndex} className="font-bold text-gray-900 mt-4 mb-2 text-lg">
                        {line.trim()}
                    </h4>
                );
            }

            // Handle numbered lists (1. 2. 3. etc)
            const numberedMatch = line.match(/^(\d+\.\s*)/);
            if (numberedMatch) {
                const content = line.substring(numberedMatch[0].length);
                return (
                    <div key={lineIndex} className="flex gap-2 mb-2 items-start">
                        <span className="font-bold text-teal-700 flex-shrink-0">{numberedMatch[1]}</span>
                        <span className="flex-1">{renderInlineFormatting(content)}</span>
                    </div>
                );
            }

            // Handle bullet points (-, *, •)
            const bulletMatch = line.match(/^[\-\*•]\s+/);
            if (bulletMatch) {
                const content = line.substring(bulletMatch[0].length);
                return (
                    <div key={lineIndex} className="flex gap-2 mb-2 items-start">
                        <span className="text-teal-600 flex-shrink-0">•</span>
                        <span className="flex-1">{renderInlineFormatting(content)}</span>
                    </div>
                );
            }

            // Regular paragraphs
            if (line.trim()) {
                return (
                    <p key={lineIndex} className="mb-2">
                        {renderInlineFormatting(line)}
                    </p>
                );
            }

            // Empty lines
            return <div key={lineIndex} className="h-2"></div>;
        });
    };

    const renderInlineFormatting = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={index} className="font-bold text-indigo-900">{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    const handleMomentClick = (timestamp: string) => {
        setInitialVideoTime(timestamp);
        setIsVideoModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 via-amber-50 to-orange-50 p-2 md:p-8 pb-32 md:pb-8" dir="rtl">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Top Navigation */}
                <div className="flex justify-between items-center bg-white/80 backdrop-blur-sm p-2 md:p-3 rounded-xl shadow-sm z-10">
                    <div className="flex items-center gap-2 md:gap-4">
                        <h1 className="text-base md:text-2xl font-bold text-gray-800 flex items-center gap-1.5">
                            <span>🏡</span> המוח של אמה
                        </h1>
                        {result.duration && (
                            <div className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border border-indigo-100 whitespace-nowrap">
                                <span>⏱️</span>
                                <span>{formatDuration(result.duration)} דק'</span>
                            </div>
                        )}
                    </div>
                    {onReset && (
                        <button
                            onClick={onReset}
                            className="bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-indigo-600 hover:border-indigo-200 transition-all p-1.5 md:px-3 md:py-1.5 flex items-center gap-1 md:gap-2 shadow-sm"
                            title="ניתוח חדש"
                        >
                            <span className="text-lg md:text-base">✨</span>
                            <span className="hidden md:inline text-sm font-bold">ניתוח חדש</span>
                        </button>
                    )}
                </div>

                {/* Main Content Grid */}
                {isStructured ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* 1. Empathy Tile (Full Width) */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="md:col-span-2 bg-gradient-to-r from-rose-100 to-pink-50 rounded-2xl p-3 md:p-8 shadow-sm border border-rose-200 relative pb-10"
                        >
                            <div className="flex items-start gap-3">
                                <span className="text-2xl md:text-4xl">💗</span>
                                <div>
                                    {userQuestion && (
                                        <div className="mb-4 bg-white/60 p-4 rounded-xl border border-rose-100">
                                            <p className="text-sm text-rose-600 font-bold mb-1">שאלתך:</p>
                                            <p className="text-rose-900 font-medium">"{userQuestion}"</p>
                                        </div>
                                    )}
                                    {/* Empathy Section Text */}
                                    <div className="w-full text-right">
                                        <h2 className="text-lg font-bold text-rose-800 mb-2 text-right">אני רואה אותך</h2>
                                        <p className="text-sm md:text-base text-rose-900 leading-relaxed font-medium whitespace-pre-line break-words text-right">
                                            {result.empathy}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <FeedbackComponent section="family_empathy" userId={userId} contextData={result.empathy} />
                        </motion.div>

                        {/* 2. Deep Insight Tile */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.5 }}
                            className="bg-white rounded-2xl p-3 md:p-8 shadow-lg border-t-4 border-indigo-500 relative pb-10"
                        >
                            <div className="flex items-center gap-2 md:gap-3 mb-3">
                                <span className="text-xl md:text-3xl">🧠</span>
                                <h2 className="text-lg font-bold text-gray-800">מבט לעומק</h2>
                            </div>
                            <div className="prose prose-indigo text-gray-700 leading-relaxed whitespace-pre-line break-words">
                                {renderText(result.insight)}
                            </div>
                            <div className="mt-2 text-right">
                                <FeedbackComponent section="family_insight_text" userId={userId} contextData={result.insight} />
                            </div>

                            {/* Key Moments Section */}
                            {/* Key Moments Section - Smaller margins */}
                            {result.key_moments && result.key_moments.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-indigo-100">
                                    <h3 className="text-base font-bold text-indigo-900 mb-3 flex items-center gap-2">
                                        <span>📸</span> רגעים ששווה לשים לב אליהם
                                    </h3>
                                    <div className="flex flex-col gap-3">
                                        {result.key_moments.map((moment: any, idx: number) => (
                                            <div
                                                key={idx}
                                                className="flex flex-col md:flex-row items-start gap-3 md:gap-4 p-3 rounded-xl hover:bg-indigo-50 transition-all cursor-pointer group border border-transparent hover:border-indigo-100"
                                                onClick={() => handleMomentClick(moment.timestamp)}
                                            >
                                                <div className="w-full md:w-40 flex-shrink-0 aspect-video bg-gray-900 rounded-lg overflow-hidden relative shadow-md group-hover:shadow-lg transition-all self-center md:self-start">
                                                    {/* Placeholder for thumbnail */}
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-colors">
                                                        <span className="text-white text-2xl opacity-80 group-hover:opacity-100">▶️</span>
                                                    </div>
                                                    <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                                                        {moment.timestamp}
                                                    </div>
                                                </div>
                                                <div className="flex-1 py-1 w-full">
                                                    <h4 className="font-bold text-indigo-900 text-sm mb-1">רגע מפתח #{idx + 1}</h4>
                                                    <p className="text-sm text-gray-600 leading-relaxed">
                                                        {moment.description}
                                                    </p>
                                                    {moment.significance && (
                                                        <p className="text-xs text-indigo-600 mt-1.5 italic">
                                                            💡 {moment.significance}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <FeedbackComponent section="family_insight" userId={userId} contextData={result.insight} />
                        </motion.div>

                        {/* 3. Practical Tools Tile */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 3.0 }}
                            className="bg-white rounded-2xl p-3 md:p-8 shadow-lg border-t-4 border-teal-500 relative pb-10"
                        >
                            <div className="flex items-center gap-2 md:gap-3 mb-4">
                                <span className="text-xl md:text-3xl">🛠️</span>
                                <h2 className="text-lg font-bold text-gray-800">כלים לשינוי</h2>
                            </div>
                            <div className="space-y-4">

                                {(() => {
                                    let rawTools = result.practical_tools;

                                    // Handle stringified JSON
                                    if (typeof rawTools === 'string') {
                                        try {
                                            rawTools = JSON.parse(rawTools);
                                        } catch (e) {
                                            console.error("Failed to parse practical_tools string", e);
                                            // Fallback: If it's a string, try to split it by newlines or numbers to make it readable
                                            const splitTools = String(rawTools).split(/\n\d+\.|•|\*/).filter(t => t.trim().length > 10).map(t => ({ content: t.trim() }));
                                            if (splitTools.length > 0) rawTools = splitTools;
                                            else return <p className="whitespace-pre-line text-teal-800 text-sm md:text-base">{String(rawTools)}</p>;
                                        }
                                    }

                                    if (!Array.isArray(rawTools)) return null;

                                    // Smart Merging Logic: Fix cases where Gemini splits Title and Content into separate items
                                    const mergedTools: any[] = [];
                                    for (let i = 0; i < rawTools.length; i++) {
                                        const current = rawTools[i];
                                        const next = rawTools[i + 1];

                                        const currentHasTitle = current.title && typeof current.title === 'string' && current.title.trim().length > 0;
                                        const currentHasContent = (current.content || current.description || current.text || current.explanation || current.body) && String(current.content || current.description || current.text || current.explanation || current.body).trim().length > 0;

                                        // Case 1: Orphan Title (current) followed by Content (next) -> MERGE
                                        if (currentHasTitle && !currentHasContent && next && !next.title) {
                                            mergedTools.push({
                                                ...next,
                                                title: current.title,
                                                content: next.content || next.description || next.text || next.explanation || next.body
                                            });
                                            i++; // Skip next item
                                        }
                                        // Case 2: Normal Item (has content) -> KEEP
                                        else if (currentHasContent) {
                                            mergedTools.push(current);
                                        }
                                        // Case 3: Title Only (and no next content to merge) -> KEEP (maybe just a tip?)
                                        else if (currentHasTitle) {
                                            mergedTools.push(current);
                                        }
                                    }

                                    return mergedTools.map((tool: any, index: number) => {
                                        // Robust content extraction
                                        let content = tool.content || tool.description || tool.text || tool.explanation || tool.summary || tool.steps || tool.action || '';
                                        let title = tool.title || '';

                                        // Extraction: Try to find title in content if title is missing (e.g. "**Title:** Content")
                                        if (!title && typeof content === 'string') {
                                            const titleMatch = content.match(/^[\*\"\']{0,2}(.+?)[\*\"\']{0,2}[:\-](.+)/);
                                            if (titleMatch) {
                                                title = titleMatch[1].trim();
                                                content = titleMatch[2].trim();
                                            }
                                        }

                                        title = title || `כלי #${index + 1}`;

                                        if (Array.isArray(content)) {
                                            content = content.join('\n');
                                        }



                                        return (
                                            <div key={index} className="bg-teal-50 rounded-xl p-5 border border-teal-100 shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-3 mb-3 border-b border-teal-200 pb-2">
                                                    <span className="text-2xl">✨</span>
                                                    <h3 className="font-bold text-teal-900 text-lg">{title}</h3>
                                                </div>
                                                <p className="text-teal-800 text-base whitespace-pre-line leading-relaxed break-words">
                                                    {renderText(content)}
                                                </p>
                                                <FeedbackComponent section={`family_tool_${index}`} userId={userId} contextData={typeof content === 'string' ? content : JSON.stringify(content)} />
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </motion.div>

                        {/* 4. Encouragement Tile (Full Width) */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 4.5 }}
                            className="md:col-span-2 bg-gradient-to-r from-amber-100 to-orange-50 rounded-2xl p-3 md:p-8 shadow-sm border border-amber-200 text-center"
                        >
                            <span className="text-2xl md:text-4xl block mb-2">✨</span>
                            <p className="text-xl font-bold text-amber-900 italic">
                                "{result.encouragement}"
                            </p>
                            <div className="flex justify-center mt-4">
                                <div className="w-1/2">
                                    <FeedbackComponent section="family_encouragement" userId={userId} contextData={result.encouragement} />
                                </div>
                            </div>
                        </motion.div>

                        {/* 5. Academic Research & Concepts (New) */}
                        {(result.academic_research || result.related_concepts) && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 6.0 }}
                                className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6"
                            >
                                {/* Research Tile */}
                                {result.academic_research && (
                                    <div className="bg-blue-50 rounded-3xl p-6 border border-blue-100 flex flex-col h-full">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="text-2xl">🎓</span>
                                                <h3 className="font-bold text-blue-900">מה אומר המדע?</h3>
                                            </div>
                                            <h4 className="font-bold text-blue-800 mb-2">{result.academic_research.title}</h4>
                                            <p className="text-blue-700 text-sm mb-3 leading-relaxed">
                                                {result.academic_research.summary}
                                            </p>
                                            <a
                                                href={result.academic_research.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 text-xs font-bold hover:underline flex items-center gap-1"
                                            >
                                                קרא עוד במאמר המלא ↗
                                            </a>
                                        </div>
                                        <FeedbackComponent section="family_research" userId={userId} contextData={result.academic_research.title} />
                                    </div>
                                )}

                                {/* Concepts Tile */}
                                {result.related_concepts && (
                                    <div className="bg-purple-50 rounded-3xl p-6 border border-purple-100 flex flex-col h-full">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="text-2xl">💡</span>
                                                <h3 className="font-bold text-purple-900">מושגים להרחבה</h3>
                                            </div>
                                            <div className="space-y-3">
                                                {result.related_concepts.map((item: any, idx: number) => (
                                                    <div key={idx}>
                                                        <h4 className="font-bold text-purple-800 text-sm">{item.concept}</h4>
                                                        <p className="text-purple-700 text-xs leading-relaxed">
                                                            {item.explanation}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <FeedbackComponent section="family_concepts" userId={userId} />
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* 6. Educational Approaches Grid */}
                        <div className="md:col-span-2 mt-8 mb-6">
                            <div className="text-center max-w-xs md:max-w-2xl mx-auto">
                                <span className="text-3xl md:text-4xl block mb-2 filter drop-shadow-md">🌍</span>
                                <div className="relative inline-block">
                                    <h3 className="text-lg md:text-xl font-bold text-gray-800 leading-tight mb-2 relative z-10 px-4 py-1">
                                        ישנן עוד גישות חינוך וטיפול רבות ומגוונות בעולם
                                    </h3>
                                    {/* Halo Effect */}
                                    <div className="absolute inset-0 bg-blue-100/50 blur-xl rounded-full -z-0"></div>
                                </div>
                                <motion.div
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true }}
                                    className="text-center mt-4 px-4"
                                >
                                    <div className="leading-tight md:leading-normal">
                                        {"הכי חשוב זה למצוא מה עובד לך,".split("").map((char, index) => (
                                            <motion.span
                                                key={`p1-${index}`}
                                                variants={{
                                                    hidden: { opacity: 0, y: 10 },
                                                    visible: { opacity: 1, y: 0 }
                                                }}
                                                transition={{ duration: 0.05, delay: index * 0.04 }}
                                                className="text-xl md:text-2xl font-medium text-gray-700 inline-block"
                                                style={{ whiteSpace: "pre" }}
                                            >
                                                {char}
                                            </motion.span>
                                        ))}
                                        <br className="md:hidden" />
                                        {" מה עוזר למשפחה שלך.".split("").map((char, index) => (
                                            <motion.span
                                                key={`p2-${index}`}
                                                variants={{
                                                    hidden: { opacity: 0, y: 10 },
                                                    visible: { opacity: 1, y: 0 }
                                                }}
                                                transition={{ duration: 0.05, delay: (index + 30) * 0.04 }}
                                                className="text-xl md:text-2xl font-medium text-gray-700 inline-block"
                                                style={{ whiteSpace: "pre" }}
                                            >
                                                {char}
                                            </motion.span>
                                        ))}
                                    </div>
                                </motion.div>
                            </div>
                        </div>

                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4 md:gap-6">
                            {[
                                {
                                    id: 'adler',
                                    name: 'אדלר (Adler)',
                                    icon: '🤝',
                                    summary: 'שיתוף פעולה, שוויון ערך, עידוד ותחושת שייכות.',
                                    color: 'bg-blue-50 border-blue-200 text-blue-800'
                                },
                                {
                                    id: 'montessori',
                                    name: 'מונטסורי (Montessori)',
                                    icon: '🌱',
                                    summary: 'עצמאות, למידה דרך חוויה, סביבה מותאמת לילד.',
                                    color: 'bg-green-50 border-green-200 text-green-800'
                                },
                                {
                                    id: 'attachment',
                                    name: 'היקשרות (Attachment)',
                                    icon: '🤗',
                                    summary: 'ביטחון רגשי, זמינות הורית, ויסות רגשי משותף.',
                                    color: 'bg-rose-50 border-rose-200 text-rose-800'
                                },
                                {
                                    id: 'cbt',
                                    name: 'CBT (קוגניטיבי-התנהגותי)',
                                    icon: '🧠',
                                    summary: 'זיהוי מחשבות, שינוי דפוסים, פתרון בעיות מעשי.',
                                    color: 'bg-cyan-50 border-cyan-200 text-cyan-800'
                                },
                                {
                                    id: 'new_authority',
                                    name: 'הסמכות החדשה (New Authority)',
                                    icon: '⚓',
                                    summary: 'נוכחות הורית, התנגדות לא אלימה, רשת תמיכה.',
                                    color: 'bg-slate-50 border-slate-200 text-slate-800'
                                },
                                {
                                    id: 'positive_discipline',
                                    name: 'משמעת חיובית (Positive Discipline)',
                                    icon: '✨',
                                    summary: 'אדיבות ותקיפות יחד, כבוד הדדי, התמקדות בפתרונות.',
                                    color: 'bg-amber-50 border-amber-200 text-amber-800'
                                }
                            ].map((method) => (
                                <motion.div
                                    key={method.id}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        setSelectedMethod(method.id);
                                        setIsMethodModalOpen(true);
                                    }}
                                    className={`relative p-4 rounded-2xl border cursor-pointer transition-all shadow-sm hover:shadow-md group ${method.color}`}
                                >
                                    <div className="flex flex-col items-center justify-center gap-2 mb-2 text-center">
                                        <span className="text-3xl">{method.icon}</span>
                                        <h4 className="font-bold text-base">{method.name}</h4>
                                    </div>
                                    <p className="text-xs opacity-90 leading-relaxed text-center font-medium">
                                        {method.summary}
                                    </p>

                                    {/* Hover Overlay */}
                                    <div className="absolute inset-0 bg-white/90 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center backdrop-blur-sm">
                                        <span className="text-sm font-bold text-gray-800">לחץ לניתוח בגישה זו 👈</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>


                ) : (
                    // Legacy Fallback
                    <div className="bg-white rounded-3xl p-8 shadow-lg">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">דוח ניתוח</h2>
                        <div className="prose max-w-none whitespace-pre-line">
                            {legacyContent || "לא התקבל תוכן לניתוח."}
                        </div>
                    </div>
                )}

                {/* Method Action Modal */}
                <MethodActionModal
                    isOpen={isMethodModalOpen}
                    onClose={() => setIsMethodModalOpen(false)}
                    methodName={selectedMethod || ''}
                    methodId={selectedMethod || ''}
                    onAction={(action, payload) => {
                        if (action === 'reanalyze') {
                            onReanalyze?.(selectedMethod || '');
                            setIsMethodModalOpen(false);
                        } else if (action === 'change_question' && payload) {
                            onReanalyze?.(selectedMethod || '', payload);
                            setIsMethodModalOpen(false);
                        } else if (action === 'chat') {
                            // Handle chat
                            setIsMethodModalOpen(false);
                        }
                    }}
                />

                {/* Video Player Modal */}
                <AnimatePresence>
                    {isVideoModalOpen && videoUrl && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                            onClick={() => setIsVideoModalOpen(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-black rounded-3xl overflow-hidden w-full max-w-4xl shadow-2xl relative"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={() => setIsVideoModalOpen(false)}
                                    className="absolute top-4 right-4 z-50 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
                                >
                                    ✕
                                </button>
                                <VideoAnalysisPlayer
                                    videoUrl={videoUrl}
                                    timeline={result.key_moments?.map((m: any) => ({
                                        timestamp: m.timestamp,
                                        description: m.description,
                                        safety_level: 'safe',
                                        emotion_score: 5
                                    })) || []}
                                />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </div >
    );
}
