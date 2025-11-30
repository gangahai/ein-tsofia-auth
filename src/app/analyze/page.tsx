'use client';

import { useState, useEffect } from 'react';
import VideoUpload from '@/components/VideoUpload';
import { identifyParticipants, deepAnalysis, quickAnalysis, Participant, AnalysisResult, DetailedCost, Recommendation } from '@/lib/gemini';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { defaultPrompts } from '@/lib/defaultPrompts';
import PromptEditorModal from '@/components/PromptEditorModal';
import EmotionTimelineChart from '@/components/EmotionTimelineChart';
import EventTimeline from '@/components/EventTimeline';
import InteractionHeatmap from '@/components/InteractionHeatmap';
import AnalysisCostsModal from '@/components/AnalysisCostsModal';
import { useAuth } from '@/components/AuthProvider';
import { analysisService } from '@/lib/analysisService';
import DraggableDashboard from '@/components/DraggableDashboard';
import FeedbackComponent from '@/components/FeedbackComponent';
import AddAnalysisModal from '@/components/AddAnalysisModal';
import CustomEditor from '@/components/CustomEditor';

type AnalysisStep = 'upload' | 'identify' | 'analyzing' | 'quick_analyzing' | 'results' | 'quick_results';

export default function AnalyzePage() {
    const { user } = useAuth();
    const router = useRouter();
    const [step, setStep] = useState<AnalysisStep>('upload');
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [quickResult, setQuickResult] = useState<{ description: string; recommendation: Recommendation; usageMetadata?: any; detailedCost?: DetailedCost[] } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [videoMetadata, setVideoMetadata] = useState<{
        duration: string;
        size: string;
        resolution: string;
        format: string;
    } | null>(null);

    // For re-analysis
    const [savedVideoFile, setSavedVideoFile] = useState<File | null>(null);
    const [savedParticipants, setSavedParticipants] = useState<Participant[]>([]);
    const [currentUserType, setCurrentUserType] = useState<string>('family');
    const [initialStats, setInitialStats] = useState<DetailedCost[]>([]);

    // Layout configuration
    const [layoutConfig, setLayoutConfig] = useState<string[]>([
        'emotion_graph', 'event_timeline', 'interaction_heatmap',
        'interpretations', 'dynamics', 'risk_factors'
    ]);

    // Load layout from local storage on mount
    useEffect(() => {
        const savedPrompts = localStorage.getItem(`customPrompts_${currentUserType}`);
        if (savedPrompts) {
            const parsed = JSON.parse(savedPrompts);
            if (parsed.layoutConfig) {
                setLayoutConfig(parsed.layoutConfig);
            }
        }
    }, [currentUserType]);

    // Handle video upload complete
    const handleUploadComplete = async (file: File, mode: 'regular' | 'quick') => {
        setVideoFile(file);
        setSavedVideoFile(file);

        // Extract metadata
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
            window.URL.revokeObjectURL(video.src);
            const durationSec = video.duration;
            const minutes = Math.floor(durationSec / 60);
            const seconds = Math.floor(durationSec % 60);
            const duration = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            const resolution = `${video.videoWidth}x${video.videoHeight}`;
            const size = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
            const format = file.type.split('/')[1].toUpperCase();

            setVideoMetadata({ duration, size, resolution, format });
        };
        video.src = URL.createObjectURL(file);

        // If quick mode, show analyzing screen immediately
        if (mode === 'quick') {
            setLoading(true);
            setStep('quick_analyzing');
        } else {
            setLoading(true);
            setStep('analyzing');
        }

        try {
            // 1. Identify Participants (Safety check removed per user request)
            console.log('👥 Identifying participants...');
            const idResult = await identifyParticipants(file);
            setParticipants(idResult.participants);
            setSavedParticipants(idResult.participants);

            const idCost: DetailedCost = {
                stepName: 'זיהוי משתתפים',
                model: 'Gemini 2.0 Flash Exp',
                inputTokens: idResult.usageMetadata?.promptTokenCount || 0,
                outputTokens: idResult.usageMetadata?.candidatesTokenCount || 0,
                totalCost: 0, // Free model
                durationSeconds: idResult.duration || 0
            };

            const previousStats = [idCost];
            setInitialStats(previousStats);

            // If quick mode, continue to analysis without stopping at identify screen
            if (mode === 'quick') {
                await handleStartQuickAnalysis(file, idResult.participants, previousStats);
            } else {
                await runAnalysis(file, idResult.participants, previousStats);
            }

        } catch (error) {
            console.error('❌ Participant identification failed:', error);
            const defaultParticipants = [
                { id: 'person_2', name: 'משתתף 2', role: 'child' }
            ];
            setParticipants(defaultParticipants);
            setSavedParticipants(defaultParticipants);

            if (mode === 'quick') {
                await handleStartQuickAnalysis(file, defaultParticipants, []);
            } else {
                await runAnalysis(file, defaultParticipants, []);
            }
        }
    };

    const handleReset = () => {
        setStep('upload');
        setVideoFile(null);
        setParticipants([]);
        setAnalysisResult(null);
        setSavedVideoFile(null);
        setSavedParticipants([]);
        setVideoMetadata(null);
        setInitialStats([]);
        setQuickResult(null);
    };

    // Start quick analysis
    const handleStartQuickAnalysis = async (
        fileOverride?: File,
        participantsOverride?: Participant[],
        statsOverride?: DetailedCost[]
    ) => {
        const file = fileOverride || videoFile;
        const parts = participantsOverride || participants;
        const stats = statsOverride || initialStats;

        if (!file) return;
        setLoading(true);
        setStep('quick_analyzing');
        setError(null);

        try {
            const result = await quickAnalysis(file, parts, stats);
            setQuickResult(result);
            setLoading(false);
            setStep('quick_results');

            // Log cost
            if (user && result.usageMetadata) {
                analysisService.logAnalysis({
                    userId: user.uid,
                    videoMetadata: {
                        duration: videoMetadata?.duration || '00:00',
                        size: videoMetadata?.size || '0 MB',
                        resolution: videoMetadata?.resolution || 'Unknown',
                        format: videoMetadata?.format || 'UNKNOWN'
                    },
                    usageMetadata: result.usageMetadata,
                    cost: { input: 0, output: 0, total: 0 } // Free model
                }).catch(console.error);
            }
        } catch (error: any) {
            console.error('Quick analysis failed:', error);
            setLoading(false);
            setError(error?.message || 'שגיאה בניתוח בזק');
        }
    };

    // Start analysis
    const handleStartAnalysis = async () => {
        if (!videoFile) return;
        await runAnalysis(videoFile, participants);
    };

    // Run analysis
    const runAnalysis = async (file: File, parts: Participant[], previousStats: DetailedCost[] = []) => {
        setLoading(true);
        setError(null);

        try {
            const userType = ((localStorage.getItem('userType') as any) || 'family') as 'family' | 'caregiver' | 'kindergarten';
            setCurrentUserType(userType);
            const customPromptsKey = `customPrompts_${userType}`;
            const saved = localStorage.getItem(customPromptsKey);
            const customPrompts = saved ? JSON.parse(saved) : defaultPrompts[userType];

            // Update layout if present in saved prompts
            if (customPrompts.layoutConfig) {
                setLayoutConfig(customPrompts.layoutConfig);
            }

            console.log('🧠 Starting analysis with prompts:', customPrompts);

            const result = await deepAnalysis(file, parts, customPrompts, previousStats);
            setAnalysisResult(result);
            setLoading(false);
            setStep('results');

            // Log analysis cost (Non-blocking)
            if (user && result.usageMetadata) {
                try {
                    const inputRate = 0.075 / 1000000;
                    const outputRate = 0.30 / 1000000;
                    const inputTokens = result.usageMetadata.promptTokenCount;
                    const outputTokens = result.usageMetadata.candidatesTokenCount;
                    const inputCost = inputTokens * inputRate;
                    const outputCost = outputTokens * outputRate;

                    const format = file.type && file.type.includes('/') ? file.type.split('/')[1].toUpperCase() : 'UNKNOWN';

                    analysisService.logAnalysis({
                        userId: user.uid,
                        videoMetadata: {
                            duration: '00:00', // Placeholder
                            size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
                            resolution: 'Unknown',
                            format: format
                        },
                        usageMetadata: result.usageMetadata,
                        cost: {
                            input: inputCost,
                            output: outputCost,
                            total: inputCost + outputCost
                        }
                    }).catch(e => console.error('Background logging failed:', e));
                } catch (logError) {
                    console.error('Error preparing log data:', logError);
                }
            }
        } catch (error: any) {
            console.error('❌ Analysis failed:', error);
            setLoading(false);
            setError(error?.message || 'שגיאה לא ידועה בניתוח');
        }
    };

    // Re-analyze with new prompts
    const handleReanalyze = async (newUserType: string, newPrompts: any) => {
        localStorage.setItem('userType', newUserType);
        const key = `customPrompts_${newUserType}`;
        localStorage.setItem(key, JSON.stringify(newPrompts));
        setCurrentUserType(newUserType);

        // Update layout if present
        if (newPrompts.layoutConfig) {
            setLayoutConfig(newPrompts.layoutConfig);
        }

        setStep('analyzing');
        setLoading(true);
        setError(null);

        try {
            console.log('🔄 Re-analyzing with new prompts:', newPrompts.sections.identity.substring(0, 50) + '...');
            const result = await deepAnalysis(savedVideoFile!, savedParticipants, newPrompts, initialStats);
            setAnalysisResult(result);
            setLoading(false);
            setStep('results');

            // Log re-analysis cost (Non-blocking)
            if (user && result.usageMetadata && videoMetadata) {
                try {
                    const inputRate = 0.075 / 1000000;
                    const outputRate = 0.30 / 1000000;
                    const inputTokens = result.usageMetadata.promptTokenCount;
                    const outputTokens = result.usageMetadata.candidatesTokenCount;
                    const inputCost = inputTokens * inputRate;
                    const outputCost = outputTokens * outputRate;

                    analysisService.logAnalysis({
                        userId: user.uid,
                        videoMetadata: videoMetadata,
                        usageMetadata: result.usageMetadata,
                        cost: {
                            input: inputCost,
                            output: outputCost,
                            total: inputCost + outputCost
                        }
                    }).catch(e => console.error('Background logging failed:', e));
                } catch (logError) {
                    console.error('Error preparing log data:', logError);
                }
            }
        } catch (error: any) {
            console.error('❌ Re-analysis failed:', error);
            setLoading(false);
            setError(error?.message || 'שגיאה בניתוח חוזר');
        }
    };

    const goBack = () => {
        const steps: AnalysisStep[] = ['upload', 'identify', 'analyzing', 'results'];
        // Handle quick analysis path
        if (step === 'quick_analyzing' || step === 'quick_results') {
            setStep('identify');
            return;
        }

        const currentIndex = steps.indexOf(step);
        if (currentIndex > 0) {
            setStep(steps[currentIndex - 1]);
        }
    };

    return (
        <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-slate-800 via-cyan-900 to-blue-900 p-4">
            <div className="max-w-6xl mx-auto">
                <div className="bg-white rounded-3xl shadow-2xl p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">🎬 ניתוח וידאו</h1>
                            <p className="text-gray-600">מערכת ניתוח Gemini AI מתקדמת</p>
                        </div>
                        {step !== 'upload' && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={goBack}
                                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-all"
                            >
                                ← חזרה
                            </motion.button>
                        )}
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {step === 'upload' && (
                        <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <VideoUpload onUploadComplete={handleUploadComplete} />
                        </motion.div>
                    )}

                    {step === 'identify' && (
                        <ParticipantIdentificationView
                            participants={participants}
                            loading={loading}
                            onStartAnalysis={handleStartAnalysis}
                            onStartQuickAnalysis={handleStartQuickAnalysis}
                        />
                    )}

                    {step === 'quick_analyzing' && (
                        <AnalyzingView
                            loading={loading}
                            error={error}
                            onRetry={handleStartQuickAnalysis}
                            isQuick={true}
                        />
                    )}

                    {step === 'analyzing' && (
                        <AnalyzingView
                            loading={loading}
                            error={error}
                            onRetry={handleStartAnalysis}
                        />
                    )}

                    {step === 'results' && analysisResult && (
                        <ResultsView
                            result={analysisResult}
                            currentUserType={currentUserType}
                            onReanalyze={handleReanalyze}
                            onReset={handleReset}
                            layoutConfig={layoutConfig}
                            videoMetadata={videoMetadata}
                            userId={user?.uid}
                        />
                    )}

                    {step === 'quick_results' && quickResult && (
                        <QuickResultsView
                            result={quickResult}
                            currentUserType={currentUserType}
                            onReset={handleReset}
                            videoMetadata={videoMetadata}
                            userId={user?.uid || ''}
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// Participant Identification View
// Participant Identification View
function ParticipantIdentificationView({
    participants,
    loading,
    onStartAnalysis,
    onStartQuickAnalysis
}: {
    participants: Participant[];
    loading: boolean;
    onStartAnalysis: () => void;
    onStartQuickAnalysis: () => void;
}) {
    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-12"
        >
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">👥 זיהוי משתתפים</h2>
            {loading ? (
                <div className="text-center">
                    <div className="text-6xl mb-4">🔍</div>
                    <p className="text-gray-600 text-lg">מזהה אנשים בוידאו...</p>
                </div>
            ) : (
                <>
                    <div className="bg-cyan-50 border-2 border-cyan-200 rounded-2xl p-6 mb-8">
                        <p className="text-xl font-bold text-gray-800 text-center mb-4">
                            זיהינו {participants.length} משתתפים
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {participants.map((p, i) => (
                                <div key={i} className="bg-white border border-cyan-300 rounded-xl p-4 text-center">
                                    <div className="text-4xl mb-2">👤</div>
                                    <h4 className="font-bold text-gray-800">{p.name}</h4>
                                    <p className="text-sm text-cyan-700 font-semibold">{p.role}</p>
                                    {p.age ? (
                                        <p className="text-sm text-gray-600">גיל: {p.age}</p>
                                    ) : (
                                        <p className="text-sm text-gray-600 italic">מבוגר</p>
                                    )}
                                    {p.notes && <p className="text-xs text-gray-500 mt-1" dir="rtl">{p.notes}</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-center gap-4">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onStartAnalysis}
                            className="px-8 py-4 bg-gradient-to-l from-cyan-500 to-orange-500 text-white rounded-xl font-bold text-lg hover:from-cyan-600 hover:to-orange-600 transition-all shadow-lg"
                        >
                            🧠 ניתוח מעמיק
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onStartQuickAnalysis}
                            className="px-8 py-4 bg-white border-2 border-purple-500 text-purple-600 rounded-xl font-bold text-lg hover:bg-purple-50 transition-all shadow-lg flex items-center gap-2"
                        >
                            ⚡ ניתוח בזק
                        </motion.button>
                    </div>
                </>
            )}
        </motion.div >
    );
}

// Analyzing View
function AnalyzingView({ loading, error, onRetry, isQuick = false }: { loading: boolean; error: string | null; onRetry: () => void; isQuick?: boolean }) {
    if (error) {
        return (
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-3xl p-12 text-center"
            >
                <div className="text-8xl mb-6">❌</div>
                <h2 className="text-3xl font-bold text-gray-800 mb-4">שגיאה בניתוח</h2>
                <p className="text-gray-700 text-lg mb-6" dir="rtl">{error}</p>
                <p className="text-gray-600 text-sm mb-8">בדוק את ה-Console (F12) לפרטים נוספים</p>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onRetry}
                    className="px-8 py-4 bg-gradient-to-l from-cyan-500 to-orange-500 text-white rounded-xl font-bold hover:from-cyan-600 hover:to-orange-600 transition-all shadow-lg"
                >
                    🔄 נסה שוב
                </motion.button>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-12 text-center"
        >
            <div className="animate-pulse text-8xl mb-6">🧠</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">{isQuick ? 'מבצע ניתוח בזק...' : 'מבצע ניתוח מעמיק...'}</h2>
            <p className="text-gray-600 text-lg mb-6">
                {isQuick ? 'Gemini Flash מבצע סריקה מהירה של הסרטון' : 'Gemini AI מנתח את הסרטון לפי הפרומפטים המותאמים אישית שלך'}
            </p>
            <div className="flex justify-center">
                <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-l from-cyan-500 to-orange-500"
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 3, repeat: Infinity }}
                    />
                </div>
            </div>
        </motion.div>
    );
}

// Results View
function ResultsView({
    result,
    currentUserType,
    onReanalyze,
    onReset,
    layoutConfig,
    videoMetadata,
    userId
}: {
    result: AnalysisResult;
    currentUserType: string;
    onReanalyze: (userType: string, prompts: any) => void;
    onReset: () => void;
    layoutConfig: string[];
    videoMetadata: { duration: string; size: string; resolution: string; format: string; } | null;
    userId?: string;
}) {
    const [showPromptEditor, setShowPromptEditor] = useState(false);
    const [showCostsModal, setShowCostsModal] = useState(false);

    const userTypeLabels: Record<string, string> = {
        family: 'בית (משפחה)',
        caregiver: 'מטפל מקצועי',
        kindergarten: 'מוסדי (גן ילדים)'
    };

    const renderWindowContent = (type: string) => {
        switch (type) {
            case 'emotion_graph':
                return result.emotion_timeline && result.emotion_timeline.length > 0 ? (
                    <EmotionTimelineChart data={result.emotion_timeline} />
                ) : <div className="text-gray-400 text-center p-4">אין נתונים לגרף רגשות</div>;
            case 'event_timeline':
                return result.forensic_layer.timeline_events && result.forensic_layer.timeline_events.length > 0 ? (
                    <EventTimeline events={result.forensic_layer.timeline_events} />
                ) : <div className="text-gray-400 text-center p-4">אין נתונים לציר זמן</div>;
            case 'interaction_heatmap':
                return result.interactions && result.interactions.length > 0 ? (
                    <InteractionHeatmap
                        interactions={result.interactions}
                        participantNames={Object.keys(result.psychological_layer.emotional_states || {})}
                    />
                ) : <div className="text-gray-400 text-center p-4">אין נתונים למפת חום</div>;
            case 'interpretations':
                return (
                    <div className="h-full overflow-y-auto">
                        <h4 className="font-bold mb-2">🧠 פרשנויות:</h4>
                        <ul className="space-y-2 text-sm">
                            {result.psychological_layer.interpretations.map((item, i) => (
                                <li key={i} className="bg-purple-50 p-2 rounded border-r-2 border-purple-300 text-gray-800">{item}</li>
                            ))}
                        </ul>
                    </div>
                );
            case 'dynamics':
                return (
                    <div className="h-full overflow-y-auto">
                        <h4 className="font-bold mb-2">🔄 דינמיקה:</h4>
                        <ul className="space-y-2 text-sm">
                            {result.psychological_layer.relationship_dynamics.map((item, i) => (
                                <li key={i} className="bg-green-50 p-2 rounded border-r-2 border-green-300 text-gray-800">{item}</li>
                            ))}
                        </ul>
                    </div>
                );
            case 'risk_factors':
                return (
                    <div className="h-full overflow-y-auto">
                        <h4 className="font-bold mb-2">🛡️ גורמי סיכון:</h4>
                        <ul className="space-y-2 text-sm">
                            {result.safety_layer.risk_factors.map((item, i) => (
                                <li key={i} className="bg-red-50 p-2 rounded border-r-2 border-red-300 text-gray-800">{item}</li>
                            ))}
                        </ul>
                    </div>
                );
            case 'facts':
                return (
                    <div className="h-full overflow-y-auto">
                        <h4 className="font-bold mb-2">📋 עובדות:</h4>
                        <ul className="space-y-2 text-sm">
                            {result.forensic_layer.facts.map((item, i) => (
                                <li key={i} className="bg-gray-50 p-2 rounded border-r-2 border-gray-300 text-gray-800">{item}</li>
                            ))}
                        </ul>
                    </div>
                );
            case 'observations':
                return (
                    <div className="h-full overflow-y-auto">
                        <h4 className="font-bold mb-2">👀 תצפיות:</h4>
                        <ul className="space-y-2 text-sm">
                            {result.forensic_layer.observations.map((item, i) => (
                                <li key={i} className="bg-blue-50 p-2 rounded border-r-2 border-blue-300 text-gray-800">{item}</li>
                            ))}
                        </ul>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="space-y-6"
            >
                {/* Header - Reused in QuickResultsView */}
                <ResultsHeader
                    title="📊 דוח ניתוח מתקדם"
                    currentUserType={currentUserType}
                    userTypeLabels={userTypeLabels}
                    onShowCosts={() => setShowCostsModal(true)}
                    onShowPromptEditor={() => setShowPromptEditor(true)}
                    onReset={onReset}
                    isQuick={false}
                />

                {/* 1. Case Description (Objective) */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border-r-4 border-gray-400">
                    <h3 className="text-xl font-bold text-gray-800 mb-3">📄 תיאור מקרה (אובייקטיבי)</h3>
                    <p className="text-gray-700 leading-relaxed">
                        {result.forensic_layer.case_description || "לא התקבל תיאור מקרה."}
                    </p>
                    <FeedbackComponent
                        section="case_description"
                        contextData={result.forensic_layer.case_description}
                    />
                </div>

                {/* 2. Participants & Environment */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-3xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-800 mb-3">👥 משתתפים ותפקידים</h3>
                        <div className="space-y-3">
                            {result.psychological_layer.participant_analysis?.map((p, i) => (
                                <div key={i} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                                    <div>
                                        <span className="font-bold text-gray-800">{p.name}</span>
                                        <span className="text-xs text-gray-500 mr-2">({p.role})</span>
                                    </div>
                                </div>
                            )) || <p className="text-gray-500">אין מידע על משתתפים</p>}
                        </div>
                    </div>
                    <div className="bg-white rounded-3xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-800 mb-3">📍 סביבת האירוע</h3>
                        <p className="text-gray-700">
                            {result.forensic_layer.environment || "לא התקבל תיאור סביבה."}
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm">
                    <FeedbackComponent
                        section="participants_environment"
                        contextData={`Environment: ${result.forensic_layer.environment}\nParticipants: ${result.psychological_layer.participant_analysis?.map(p => `${p.name} (${p.role})`).join(', ')}`}
                    />
                </div>

                {/* 3. Deep Interaction Analysis */}
                <div className="bg-white rounded-3xl p-8 shadow-sm">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">🧩 ניתוח אינטראקציה עמוק</h3>
                    <div className="grid gap-4">
                        {result.psychological_layer.participant_analysis?.map((p, i) => (
                            <div key={i} className="bg-gradient-to-l from-blue-50 to-transparent p-4 rounded-xl border border-blue-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="font-bold text-lg text-blue-800">{p.name}</span>
                                    <span className="text-xs bg-white px-2 py-1 rounded-full border border-blue-200">{p.role}</span>
                                </div>
                                <div className="grid md:grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <span className="font-bold text-gray-600 block mb-1">פעולות:</span>
                                        <span className="text-gray-700">{p.actions}</span>
                                    </div>
                                    <div>
                                        <span className="font-bold text-gray-600 block mb-1">רגשות:</span>
                                        <span className="text-gray-700">{p.feelings}</span>
                                    </div>
                                    <div>
                                        <span className="font-bold text-gray-600 block mb-1">הקשר:</span>
                                        <span className="text-gray-700">{p.context}</span>
                                    </div>
                                </div>
                            </div>
                        )) || <p className="text-gray-500">אין ניתוח אינטראקציה זמין</p>}
                    </div>
                    <FeedbackComponent
                        section="interaction_analysis"
                        contextData={JSON.stringify(result.psychological_layer.participant_analysis, null, 2)}
                    />
                </div>

                {/* 4. Recommendations */}
                {result.recommendations && result.recommendations.length > 0 && (
                    <div className="bg-white rounded-3xl p-8 shadow-sm border-r-4 border-yellow-400">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">💡 3 המלצות מובילות</h3>
                        <div className="grid md:grid-cols-3 gap-4">
                            {result.recommendations.slice(0, 3).map((rec, i) => (
                                <div key={i} className="bg-yellow-50 p-4 rounded-xl">
                                    <h4 className="font-bold mb-2 flex items-center gap-2">
                                        {rec.icon} {rec.title}
                                    </h4>
                                    <p className="text-sm text-gray-700">{rec.explanation}</p>
                                </div>
                            ))}
                        </div>
                        <FeedbackComponent
                            section="recommendations"
                            contextData={JSON.stringify(result.recommendations, null, 2)}
                        />
                    </div>
                )}

                {/* 5. Dynamic Dashboard (Drag & Drop) */}
                <DraggableDashboard result={result} currentUserType={currentUserType} />

            </motion.div >

            {/* Prompt Editor Modal */}
            < PromptEditorModal
                isOpen={showPromptEditor}
                onClose={() => setShowPromptEditor(false)
                }
                currentUserType={currentUserType}
                onReanalyze={onReanalyze}
            />

            <AnalysisCostsModal
                isOpen={showCostsModal}
                onClose={() => setShowCostsModal(false)}
                videoData={videoMetadata || undefined}
                usageMetadata={result.usageMetadata}
                detailedCost={result.detailedCost}
            />
        </>
    );
}



// ... (existing imports)

// Quick Results View
function QuickResultsView({
    result,
    currentUserType,
    onReset,
    videoMetadata,
    userId // Add userId prop
}: {
    result: { description: string; recommendation: Recommendation; usageMetadata?: any; detailedCost?: DetailedCost[] };
    currentUserType: string;
    onReset: () => void;
    videoMetadata: any;
    userId: string;
}) {
    const [showCostsModal, setShowCostsModal] = useState(false);
    const [showAddAnalysis, setShowAddAnalysis] = useState(false);
    const [customAnalyses, setCustomAnalyses] = useState<{ id: string; content: string; title: string }[]>([]);

    const userTypeLabels: Record<string, string> = {
        family: 'בית (משפחה)',
        caregiver: 'מטפל מקצועי',
        kindergarten: 'מוסדי (גן ילדים)'
    };

    const handleAnalysisComplete = (content: string, title: string) => {
        setCustomAnalyses(prev => [...prev, { id: Date.now().toString(), content, title }]);
    };

    const handleRemoveAnalysis = (id: string) => {
        setCustomAnalyses(prev => prev.filter(a => a.id !== id));
    };

    return (
        <>
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="space-y-6"
            >
                {/* Header */}
                <ResultsHeader
                    title="⚡ דוח ניתוח בזק"
                    currentUserType={currentUserType}
                    userTypeLabels={userTypeLabels}
                    onShowCosts={() => setShowCostsModal(true)}
                    onShowPromptEditor={() => { }} // No prompt editor for quick analysis
                    onReset={onReset}
                    isQuick={true}
                />

                {/* 1. Description */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border-r-4 border-purple-500">
                    <h3 className="text-xl font-bold text-gray-800 mb-3">📝 תיאור כללי</h3>
                    <p className="text-gray-800 text-lg leading-relaxed whitespace-pre-wrap">
                        {result.description}
                    </p>
                    <FeedbackComponent
                        section="quick_description"
                        contextData={result.description}
                    />
                </div>

                {/* 2. Recommendation */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border-r-4 border-yellow-400">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">💡 המלצה לפעולה</h3>
                    <div className="bg-yellow-50 p-6 rounded-2xl">
                        <h4 className="font-bold text-xl mb-3 flex items-center gap-2 text-gray-900">
                            {result.recommendation.icon} {result.recommendation.title}
                        </h4>
                        <p className="text-gray-800 text-lg mb-4">{result.recommendation.explanation}</p>
                        <div className="bg-white/50 p-4 rounded-xl">
                            <span className="font-bold text-gray-600 block mb-1 text-sm">למה זה יעבוד?</span>
                            <p className="text-gray-700 text-sm">{result.recommendation.why_it_works}</p>
                        </div>
                    </div>
                    <FeedbackComponent
                        section="quick_recommendation"
                        contextData={`Title: ${result.recommendation.title}\nExplanation: ${result.recommendation.explanation}\nWhy it works: ${result.recommendation.why_it_works}`}
                    />
                </div>

                {/* Add Analysis Button */}
                <div className="flex justify-center mt-8">
                    <button
                        onClick={() => setShowAddAnalysis(true)}
                        className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                    >
                        <span className="text-2xl">✨</span>
                        הוסף ניתוח מתקדם
                    </button>
                </div>

                {/* Custom Analyses (Inline) */}
                <div className="space-y-8">
                    {customAnalyses.map((analysis) => (
                        <CustomEditor
                            key={analysis.id}
                            initialContent={analysis.content}
                            title={analysis.title}
                            userId={userId}
                            onClose={() => handleRemoveAnalysis(analysis.id)}
                            variant="inline"
                            onAddAnalysis={() => setShowAddAnalysis(true)}
                        />
                    ))}
                </div>

            </motion.div>

            <AddAnalysisModal
                isOpen={showAddAnalysis}
                onClose={() => setShowAddAnalysis(false)}
                onAnalysisComplete={handleAnalysisComplete}
                videoData={videoMetadata}
                initialAnalysis={result}
                existingAnalyses={customAnalyses}
            />

            <AnalysisCostsModal
                isOpen={showCostsModal}
                onClose={() => setShowCostsModal(false)}
                videoData={videoMetadata || undefined}
                usageMetadata={result.usageMetadata}
                detailedCost={result.detailedCost}
            />
        </>
    );
}


// Reusable Header Component
function ResultsHeader({
    title,
    currentUserType,
    userTypeLabels,
    onShowCosts,
    onShowPromptEditor,
    onReset,
    isQuick
}: {
    title: string;
    currentUserType: string;
    userTypeLabels: Record<string, string>;
    onShowCosts: () => void;
    onShowPromptEditor: () => void;
    onReset: () => void;
    isQuick: boolean;
}) {
    return (
        <div className="bg-white rounded-3xl p-6 flex justify-between items-center shadow-sm">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-1">{title}</h2>
                <p className="text-sm text-gray-600">
                    פרופיל: <span className="font-bold text-cyan-600">{userTypeLabels[currentUserType] || currentUserType}</span>
                </p>
            </div>
            <div className="flex gap-3">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onShowCosts}
                    className="px-6 py-3 bg-white border-2 border-cyan-500 text-cyan-600 rounded-xl font-bold hover:bg-cyan-50 transition-all shadow-lg flex items-center gap-2"
                >
                    💰 עלויות ניתוח
                </motion.button>

                {!isQuick && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onShowPromptEditor}
                        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-bold hover:from-purple-600 hover:to-blue-600 transition-all shadow-lg flex items-center gap-2"
                    >
                        ⚙️ מעבדת הפרומפטים
                    </motion.button>
                )}

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onReset}
                    className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl font-bold hover:from-gray-600 hover:to-gray-700 transition-all shadow-lg flex items-center gap-2"
                >
                    🔄 נתח עוד סיטואציה
                </motion.button>
            </div>
        </div>
    );
}
