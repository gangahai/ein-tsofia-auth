'use client';

import { useState, useEffect } from 'react';
import VideoUpload from '@/components/VideoUpload';
import { identifyParticipants, deepAnalysis, quickAnalysis, fastKindergartenAnalysis, Participant, AnalysisResult, DetailedCost, Recommendation, QuickAnalysisTimelineEvent, quickSafetyScan } from '@/lib/gemini';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { defaultPrompts, getDefaultPrompts } from '@/lib/defaultPrompts';
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
import VideoAnalysisPlayer from '@/components/VideoAnalysisPlayer';
import ReportCustomizationSelector, { ReportTileType } from '@/components/ReportCustomizationSelector';
import KindergartenUploadView from '@/components/KindergartenUploadView';
import KindergartenResultsView from '@/components/KindergartenResultsView';
import FamilyResultsView from '@/components/FamilyResultsView';

// Helper to load custom prompts
const loadCustomPrompts = (userType: string) => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem(`customPrompts_${userType}`);
    return saved ? JSON.parse(saved) : null;
};

type AnalysisStep = 'upload' | 'identify' | 'customization' | 'analyzing' | 'quick_analyzing' | 'results' | 'quick_results';

// Security Ticker Component - Compact & Centered
const SecurityTicker = () => {
    const messages = [
        "🔒 בטיחות מקסימלית לסרטונים - לא כמו בצאט רגיל שם המידע משמש לאימון מודלים ושימוש מסחרי",
        "📊 דוח מקצועי וממוקד לשינוי + עצות מעשיות",
        "🎓 גישות חינוך וטיפול חדשניות, המתעדכנות לפי בחירת המשתמש",
        "🧠 המערכת לא רק רואה היא מרגישה ומבינה לעומק",
        "⏳ העיבוד לוקח לעיתים כמה דקות - בגלל שהמערכת לא סתם זורקת תשובות - עיבוד עומק זה תהליך",
        "🗣️ פרט במילים שלך מה מפריע לך בדיוק, זה יעזור לאמה לתת לך תשובה ועצה מעולים מאוד",
        "✨ אל תתייאש אם הניתוח הראשון לא בדיוק מה שציפית, בדוק עוד סיטואציה תשאל עמוק ותראה זה קסם!",
        "📂 אתה יכול להעלות קבצי מידע על המשפחה שלך הכל נשמר בכספת ויכול לעזור לאמה לתת תשובות יותר ממוקדות"
    ];

    const [index, setIndex] = useState(0);

    useEffect(() => {
        const currentMessage = messages[index];
        // Base duration 5s, add 2.5s for long messages (> 60 chars) to allow reading time
        const duration = currentMessage.length > 60 ? 7500 : 5000;

        const timer = setTimeout(() => {
            setIndex((prev) => (prev + 1) % messages.length);
        }, duration);
        return () => clearTimeout(timer);
    }, [index]);

    return (
        <div className="h-8 md:h-6 overflow-hidden relative w-full mx-auto block mb-2 md:mb-0">
            <AnimatePresence mode="wait">
                <motion.div
                    key={index}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute w-full text-center text-cyan-600 text-xs md:text-sm font-medium flex items-center justify-center gap-2 px-4"
                >
                    {messages[index]}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default function AnalyzePage() {
    const { user } = useAuth();
    const router = useRouter();

    // -- State Definitions --
    // Layout and Config
    const [currentUserType, setCurrentUserType] = useState<string>('family');
    const [layoutConfig, setLayoutConfig] = useState<string[]>([
        'emotion_graph', 'event_timeline', 'interaction_heatmap',
        'interpretations', 'dynamics', 'risk_factors'
    ]);

    // Data
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [savedVideoFile, setSavedVideoFile] = useState<File | null>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [savedParticipants, setSavedParticipants] = useState<Participant[]>([]);
    const [initialStats, setInitialStats] = useState<DetailedCost[]>([]);
    const [videoMetadata, setVideoMetadata] = useState<{
        duration: string;
        size: string;
        resolution: string;
        format: string;
    } | null>(null);
    const [voiceData, setVoiceData] = useState<{ text: string, speakerProfile?: any } | null>(null);

    // Analysis Status
    const [step, setStep] = useState<AnalysisStep>('upload');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [analysisStatus, setAnalysisStatus] = useState<string>('');
    const [analysisProgress, setAnalysisProgress] = useState<number>(0);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    // Results
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [quickResult, setQuickResult] = useState<{ description: string; recommendation: Recommendation; timeline?: QuickAnalysisTimelineEvent[]; usageMetadata?: any; detailedCost?: DetailedCost[] } | null>(null);

    // UI State
    const [showPromptEditor, setShowPromptEditor] = useState(false);
    const [selectedTiles, setSelectedTiles] = useState<ReportTileType[]>([]);

    // -- Effects & Helpers --

    // Load user type on mount
    useEffect(() => {
        const storedUserType = localStorage.getItem('userType') as string;
        if (storedUserType) {
            setCurrentUserType(storedUserType);
        }
    }, []);

    // Load layout
    useEffect(() => {
        const savedPrompts = loadCustomPrompts(currentUserType);
        if (savedPrompts && savedPrompts.layoutConfig) {
            setLayoutConfig(savedPrompts.layoutConfig);
        }
    }, [currentUserType]);

    // Load Demo Analysis
    const loadDemoAnalysis = () => {
        if (currentUserType === 'family') {
            const { mockFamilyAnalysis } = require('@/lib/mockData');
            setAnalysisResult(mockFamilyAnalysis);
            // Set mock voice data for demo
            setVoiceData({
                text: "איך להתמודד עם התקפי זעם בגן המשחקים?",
                speakerProfile: { role: "אמא", age_estimate: "30-40" }
            });
        } else {
            const { mockKindergartenAnalysis } = require('@/lib/mockData');
            setAnalysisResult(mockKindergartenAnalysis);
        }
        setStep('results');
        setLoading(false);
        setError(null);
    };

    // Listen for global events
    useEffect(() => {
        const handleShowPrompt = () => setShowPromptEditor(true);
        const handleLoadDemo = () => loadDemoAnalysis();

        window.addEventListener('SHOW_PROMPT_VIEWER', handleShowPrompt);
        window.addEventListener('LOAD_DEMO_ANALYSIS', handleLoadDemo);

        return () => {
            window.removeEventListener('SHOW_PROMPT_VIEWER', handleShowPrompt);
            window.removeEventListener('LOAD_DEMO_ANALYSIS', handleLoadDemo);
        };
    }, [currentUserType]);
    const analysisSteps = [
        "מעבד את הוידאו...",
        "מנתח את הסאונד והטון...",
        "מזהה הבעות פנים...",
        "בונה פרופיל פסיכולוגי...",
        "מתייעץ עם מומחים (וירטואליים)...",
        "מנסח תובנות והמלצות...",
        "אמה מסיימת את הניתוח..."
    ];

    // Run analysis
    const runAnalysis = async (file: File, parts: Participant[], previousStats: DetailedCost[] = [], tiles: ReportTileType[] = [], currentVoiceData?: { text: string, speakerProfile?: any }, method?: string) => {
        if (!file || !currentUserType) return;

        const startTime = Date.now(); // Capture start time
        setStep('analyzing');
        setAnalysisProgress(0);
        setCurrentStepIndex(0);
        setLoading(true);
        setError(null);

        // Simulate progress steps
        const stepInterval = setInterval(() => {
            setCurrentStepIndex(prev => {
                // Don't advance to the last step (100%) until the actual analysis is done
                if (prev < analysisSteps.length - 2) return prev + 1;
                return prev;
            });
        }, 4500); // Slower progress: Change step every 4.5 seconds

        try {
            let participantsData: Participant[] = parts;

            // Skip identification for Kindergarten
            if (currentUserType === 'kindergarten') {
                // For Kindergarten, we skip explicit ID but might want dummy participants for the prompt context
                if (participantsData.length === 0) {
                    participantsData = [{ id: 'p1', name: 'צוות וילדים', role: 'כללי' }];
                }
                setAnalysisProgress(10);
            } else if (participantsData.length === 0) {
                // Identify Participants (30%) - only if not provided
                const identificationResult = await identifyParticipants(file);
                participantsData = identificationResult.participants;
                setParticipants(participantsData);
                setSavedParticipants(participantsData);
                setAnalysisProgress(30);
            }

            // Deep Analysis with Gemini 2.5 Pro
            setAnalysisProgress(40);

            // Load custom prompts
            const customPrompts = loadCustomPrompts(currentUserType) || getDefaultPrompts(currentUserType as any);

            // Use passed voice data or fall back to state
            const voiceDataToUse = currentVoiceData || voiceData || undefined;

            const deepResult = await deepAnalysis(file, participantsData, customPrompts, currentUserType as any, previousStats, voiceDataToUse, method);

            // Calculate total duration
            const endTime = Date.now();
            const totalDuration = (endTime - startTime) / 1000;
            deepResult.duration = totalDuration; // Overwrite duration with client-side total

            clearInterval(stepInterval);

            // Force progress to 100% and show final step
            setCurrentStepIndex(analysisSteps.length - 1);
            setAnalysisProgress(100);

            // Small delay to let user see "Emma is finishing..."
            setTimeout(() => {
                setAnalysisResult(deepResult);
                setLoading(false);
                setStep('results');
            }, 1500);

            // Log analysis cost (Non-blocking)
            if (user && analysisResult?.usageMetadata) {
                // ... logging logic ...
            }

        } catch (error: any) {
            console.error('Analysis failed:', error);
            clearInterval(stepInterval);
            setError('שגיאה בניתוח הוידאו. אנא נסה שנית.');
            setLoading(false);
            // setStep('upload'); // Stay on analyzing to show error
        }
    };

    const handleMethodReanalyze = (method: string, newQuestion?: string) => {
        if (!savedVideoFile) return;

        // If new question provided, update voice data
        let voiceDataToUse = voiceData;
        if (newQuestion) {
            voiceDataToUse = { text: newQuestion, speakerProfile: voiceData?.speakerProfile };
            setVoiceData(voiceDataToUse);
        }

        runAnalysis(savedVideoFile, savedParticipants, [], [], voiceDataToUse || undefined, method);
    };

    // Handle video upload complete
    const handleUploadComplete = async (file: File, mode: 'regular' | 'quick', voiceData?: { text: string, speakerProfile?: any }) => {
        setVideoFile(file);
        setSavedVideoFile(file);

        if (voiceData) {
            setVoiceData(voiceData);
        }

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

        if (currentUserType === 'kindergarten' || currentUserType === 'family') {
            // Kindergarten and Family flow: Skip identification and customization, go straight to analysis
            setStep('analyzing');
            // Run analysis immediately with empty participants and tiles, passing voice data
            await runAnalysis(file, [], [], [], voiceData);
        } else {
            setStep('customization');
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
            const result = await deepAnalysis(savedVideoFile!, savedParticipants, newPrompts, newUserType as any, initialStats);
            setAnalysisResult(result);
            setLoading(false);
            setStep('results');
        } catch (error: any) {
            console.error('❌ Re-analysis failed:', error);
            setLoading(false);
            setError(error?.message || 'שגיאה בניתוח חוזר');
        }
    };

    const goBack = () => {
        const steps: AnalysisStep[] = ['upload', 'identify', 'customization', 'analyzing', 'results'];

        if (step === 'quick_analyzing' || step === 'quick_results') {
            setStep('identify');
            return;
        }

        // Special handling for going back from results
        if (step === 'results') {
            // If family/kindergarten, go straight to upload (skip analyzing/customization)
            if (currentUserType === 'kindergarten' || currentUserType === 'family') {
                setStep('upload');
                return;
            }
            // For pro users, go back to customization
            setStep('customization');
            return;
        }

        const currentIndex = steps.indexOf(step);
        if (currentIndex > 0) {
            // Skip 'customization' for family/kindergarten when going back
            if (step === 'analyzing' && (currentUserType === 'kindergarten' || currentUserType === 'family')) {
                setStep('upload');
            } else if (step === 'customization') {
                setStep('upload');
            } else {
                setStep(steps[currentIndex - 1]);
            }
        }
    };

    const handleCustomizationComplete = (tiles: ReportTileType[]) => {
        setSelectedTiles(tiles);
        setStep('analyzing');
        // Start analysis with selected tiles
        if (savedVideoFile) {
            handleStartAnalysis(tiles);
        }
    };

    const handleStartAnalysis = async (tiles: ReportTileType[]) => {
        if (!savedVideoFile) return;
        await runAnalysis(savedVideoFile, savedParticipants, initialStats, tiles);
    };

    const handleReset = () => {
        setVideoFile(null);
        setSavedVideoFile(null);
        setAnalysisResult(null);
        setStep('upload');
        setParticipants([]);
        setSavedParticipants([]);
        setVoiceData(null);
        setAnalysisProgress(0);
        setError(null);
    };

    return (
        <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-slate-800 via-cyan-900 to-blue-900 p-4">
            <div className="max-w-6xl mx-auto">
                {/* Standard Header - Hide for Kindergarten Upload/Results as they have their own */}
                {!(currentUserType === 'kindergarten' && (step === 'upload' || step === 'results')) && (
                    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-4 md:px-6 md:py-4 mb-6 relative z-10">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-0 mb-3">
                            {/* Right Side: Title + Badges */}
                            <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                                <h1 className="text-lg md:text-xl font-bold text-gray-800 shrink-0">🎬 ניתוח וידאו</h1>
                                <span className="bg-cyan-100 text-cyan-800 text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0">PRO</span>
                                <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shrink-0 whitespace-nowrap">
                                    נשארו לך 2 ניתוחים חינם 🎁
                                </span>
                            </div>

                            {/* Left Side: Back Button */}
                            {/* Back Button Removed as per request */}
                            <div className="w-16"></div>
                        </div>

                        {/* Bottom: Ticker (Full Width Row) */}
                        <div className="w-full border-t border-gray-100 pt-3">
                            <SecurityTicker />
                        </div>
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {step === 'upload' && (
                        <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            {currentUserType === 'kindergarten' ? (
                                <KindergartenUploadView
                                    onUploadComplete={handleUploadComplete}
                                    onBack={() => router.push('/')}
                                    onLoadDemo={loadDemoAnalysis}
                                />
                            ) : (
                                <VideoUpload
                                    onUploadComplete={handleUploadComplete}
                                />
                            )}
                        </motion.div>
                    )}

                    {step === 'identify' && (
                        <ParticipantIdentificationView
                            participants={participants}
                            loading={loading}
                            onContinue={() => setStep('customization')}
                        />
                    )}

                    {step === 'customization' && (
                        <motion.div key="customization" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <ReportCustomizationSelector
                                onComplete={handleCustomizationComplete}
                                onCancel={() => setStep('identify')}
                            />
                        </motion.div>
                    )}

                    {step === 'analyzing' && (
                        <AnalyzingView
                            loading={loading}
                            error={error}
                            status={analysisStatus}
                            currentStep={analysisSteps[currentStepIndex]}
                            progress={((currentStepIndex + 1) / analysisSteps.length) * 100}
                            onRetry={() => handleStartAnalysis(selectedTiles)}
                        />
                    )}

                    {step === 'results' && analysisResult && (
                        currentUserType === 'family' ? (
                            <FamilyResultsView
                                result={analysisResult}
                                onReset={handleReset}
                                videoUrl={videoFile ? URL.createObjectURL(videoFile) : null}
                                onReanalyze={handleMethodReanalyze}
                                userQuestion={voiceData?.text}
                            />
                        ) : currentUserType === 'kindergarten' ? (
                            <KindergartenResultsView
                                result={analysisResult}
                                onReset={handleReset}
                                videoUrl={videoFile ? URL.createObjectURL(videoFile) : null}
                            />
                        ) : (
                            <ResultsView
                                result={analysisResult}
                                currentUserType={currentUserType}
                                onReanalyze={handleReanalyze}
                                onReset={handleReset}
                                layoutConfig={layoutConfig}
                                videoMetadata={videoMetadata}
                                userId={user?.uid}
                                selectedTiles={selectedTiles}
                                videoUrl={videoFile ? URL.createObjectURL(videoFile) : null}
                                onUpdateTiles={setSelectedTiles}
                                onShowPromptEditor={() => setShowPromptEditor(true)}
                            />
                        )
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {showPromptEditor && (
                        <PromptEditorModal
                            isOpen={showPromptEditor}
                            onClose={() => setShowPromptEditor(false)}
                            currentUserType={currentUserType}
                            onReanalyze={(userType, prompts) => {
                                handleReanalyze(userType, prompts);
                                setShowPromptEditor(false);
                            }}
                        />
                    )}
                </AnimatePresence>
            </div >
        </div >
    );
}


// Participant Identification View
function ParticipantIdentificationView({
    participants,
    loading,
    onContinue
}: {
    participants: Participant[];
    loading: boolean;
    onContinue: () => void;
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
                            {participants.map((p: any, i: number) => (
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
                            onClick={onContinue}
                            className="px-8 py-4 bg-gradient-to-l from-cyan-500 to-orange-500 text-white rounded-xl font-bold text-lg hover:from-cyan-600 hover:to-orange-600 transition-all shadow-lg"
                        >
                            המשך להתאמת הדוח ➡️
                        </motion.button>
                    </div>
                </>
            )}
        </motion.div >
    );
}

// Analyzing View
function AnalyzingView({
    loading,
    error,
    status,
    onRetry,
    isQuick = false,
    currentStep,
    progress
}: {
    loading: boolean;
    error: string | null;
    status?: string;
    onRetry: () => void;
    isQuick?: boolean;
    currentStep?: string;
    progress?: number;
}) {
    if (error) {
        const isOverloaded = error === 'SERVER_OVERLOADED' || error.includes('503');
        const isRecitation = error === 'RECITATION_ERROR' || error.includes('RECITATION');
        const isSafety = error === 'SAFETY_ERROR' || error.includes('SAFETY');

        let errorTitle = 'שגיאה בניתוח';
        let errorMessage = 'שגיאה בניתוח הוידאו. אנא נסה שנית.';
        let errorIcon = '❌';

        if (isOverloaded) {
            errorTitle = 'השרת עמוס כרגע';
            errorMessage = 'אנחנו חווים עומס חריג. אנא נסו שוב בעוד דקה.';
            errorIcon = '⏳';
        } else if (isRecitation) {
            errorTitle = 'שגיאת זכויות יוצרים';
            errorMessage = 'אמה ניסתה לצטט מקורות אקדמיים מוגנים. המערכת חסמה את התשובה כדי להגן על זכויות יוצרים. אנא נסו שוב (לרוב זה מסתדר בניסיון שני).';
            errorIcon = '©️';
        } else if (isSafety) {
            errorTitle = 'חסימת בטיחות';
            errorMessage = 'התוכן זוהה כלא בטוח או מפר מדיניות שימוש. אנא בדקו את הסרטון.';
            errorIcon = '🛡️';
        } else {
            // Default: Show the raw error message to help the user understand what went wrong
            errorMessage = `שגיאה: ${error}`;
        }

        return (
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-3xl p-12 text-center"
            >
                <div className="text-8xl mb-6">{errorIcon}</div>
                <h2 className="text-3xl font-bold text-gray-800 mb-4">
                    {errorTitle}
                </h2>
                <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
                    {errorMessage}
                </p>
                <div className="flex justify-center gap-4">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onRetry}
                        className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-bold text-lg shadow-lg flex items-center gap-2"
                    >
                        <span>🔄</span> נסה שוב
                    </motion.button>
                    {!isQuick && (
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => window.location.reload()}
                            className="px-8 py-4 bg-gray-100 text-gray-700 rounded-xl font-bold text-lg hover:bg-gray-200 transition-all"
                        >
                            חזרה להתחלה
                        </motion.button>
                    )}
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-12 text-center max-w-2xl mx-auto"
        >
            <div className="relative w-32 h-32 mx-auto mb-8">
                {/* Outer glow pulse */}
                <motion.div
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 opacity-20 blur-xl"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.2, 0.4, 0.2]
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Middle rotating ring */}
                <motion.div
                    className="absolute inset-2 rounded-full border-4 border-transparent bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 bg-clip-border"
                    style={{
                        background: 'linear-gradient(white, white) padding-box, linear-gradient(135deg, #06b6d4, #a855f7, #ec4899) border-box'
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />

                {/* Inner core orb */}
                <motion.div
                    className="absolute inset-6 rounded-full bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-600 shadow-2xl"
                    animate={{
                        scale: [1, 1.1, 1],
                    }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                    {/* Shine effect */}
                    <div className="absolute top-2 left-2 w-8 h-8 bg-white/30 rounded-full blur-md"></div>
                </motion.div>

                {/* Floating particles */}
                {[...Array(3)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-2 h-2 bg-cyan-400 rounded-full"
                        style={{
                            left: '50%',
                            top: '50%',
                        }}
                        animate={{
                            x: [0, Math.cos(i * 120 * Math.PI / 180) * 60, 0],
                            y: [0, Math.sin(i * 120 * Math.PI / 180) * 60, 0],
                            opacity: [0, 1, 0],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.4,
                            ease: "easeInOut"
                        }}
                    />
                ))}
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {currentStep || status || (isQuick ? 'מבצע ניתוח בזק...' : 'מבצע ניתוח מעמיק...')}
            </h2>
            <p className="text-gray-500 mb-8 text-lg">
                הניתוח עשוי לקחת מספר דקות - אמה עובדת בשבילך...
            </p>

            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden mb-4">
                <motion.div
                    className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-full shadow-lg"
                    initial={{ width: "0%" }}
                    animate={{ width: `${progress || 0}%` }}
                    transition={{ duration: 0.5 }}
                />
            </div>
            <p className="text-xs text-gray-400 font-mono">{Math.round(progress || 0)}%</p>
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
    userId,
    selectedTiles,
    videoUrl,
    onUpdateTiles,
    onShowPromptEditor
}: {
    result: AnalysisResult;
    currentUserType: string;
    onReanalyze: (userType: string, prompts: any) => void;
    onReset: () => void;
    layoutConfig: string[];
    videoMetadata: { duration: string; size: string; resolution: string; format: string; } | null;
    userId?: string;
    selectedTiles: ReportTileType[];
    videoUrl: string | null;
    onUpdateTiles: (tiles: ReportTileType[]) => void;
    onShowPromptEditor: () => void;
}) {
    const [showCostsModal, setShowCostsModal] = useState(false);
    const [showCustomization, setShowCustomization] = useState(false);

    const userTypeLabels: Record<string, string> = {
        family: 'בית (משפחה)',
        caregiver: 'מטפל מקצועי',
        kindergarten: 'מוסדי (גן ילדים)'
    };

    const isTileSelected = (tile: ReportTileType) => selectedTiles.includes(tile);

    return (
        <>
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="space-y-6"
            >
                {/* Header */}
                <ResultsHeader
                    title="📊 דוח ניתוח מתקדם"
                    currentUserType={currentUserType}
                    userTypeLabels={userTypeLabels}
                    onShowCosts={() => setShowCostsModal(true)}
                    onShowPromptEditor={onShowPromptEditor}
                    onReset={onReset}
                    isQuick={false}
                    onCustomize={() => setShowCustomization(true)}
                />

                {/* 1. Video Player & Timeline (New) */}
                {isTileSelected('video_player') && videoUrl && (
                    <VideoAnalysisPlayer
                        videoUrl={videoUrl}
                        timeline={result.forensic_layer.timeline_events?.map((e: any) => ({
                            timestamp: e.timestamp,
                            description: e.event,
                            safety_level: 'safe', // Defaulting as deep analysis might not have this exact field yet, or map it
                            emotion_score: 5 // Default
                        })) || []}
                    />
                )}

                {/* 2. Case Description */}
                {isTileSelected('case_description') && (
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
                )}

                {/* 3. Participants */}
                {isTileSelected('participants') && (
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-3xl p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-800 mb-3">👥 משתתפים ותפקידים</h3>
                            <div className="space-y-3">
                                {result.psychological_layer.participant_analysis?.map((p: any, i: number) => (
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
                )}

                {/* 4. Heatmap (Interaction Analysis) */}
                {isTileSelected('heatmap') && (
                    <div className="bg-white rounded-3xl p-8 shadow-sm">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">🧩 ניתוח אינטראקציה עמוק</h3>
                        <div className="grid gap-4">
                            {result.psychological_layer.participant_analysis?.map((p: any, i: number) => (
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

                        {/* Actual Heatmap Component if available in data */}
                        {result.interactions && result.interactions.length > 0 && (
                            <InteractionHeatmap
                                interactions={result.interactions}
                                participantNames={Object.keys(result.psychological_layer.emotional_states || {})}
                            />
                        )}
                    </div>
                )}

                {/* 5. Recommendations */}
                {isTileSelected('recommendations') && result.recommendations && result.recommendations.length > 0 && (
                    <div className="bg-white rounded-3xl p-8 shadow-sm border-r-4 border-yellow-400">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">💡 3 המלצות מובילות</h3>
                        <div className="grid md:grid-cols-3 gap-4">
                            {result.recommendations.slice(0, 3).map((rec: any, i: number) => (
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

                {/* 6. Emotion Graph */}
                {isTileSelected('emotion_graph') && result.emotion_timeline && result.emotion_timeline.length > 0 && (
                    <div className="bg-white rounded-3xl p-8 shadow-sm">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">📈 גרף רגשות</h3>
                        <EmotionTimelineChart data={result.emotion_timeline} />
                    </div>
                )}

                {/* 7. Intervention Plan (Using Recommendations/Draggable Dashboard logic) */}
                {isTileSelected('intervention_plan') && (
                    <div className="bg-white rounded-3xl p-8 shadow-sm border-r-4 border-green-500">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">📋 תוכנית התערבות</h3>
                        <p className="text-gray-600 mb-4">תוכנית עבודה מוצעת על בסיס הניתוח:</p>
                        {/* Placeholder for specific intervention plan logic - reusing recommendations for now */}
                        <div className="space-y-4">
                            {result.recommendations?.map((rec: any, i: number) => (
                                <div key={i} className="flex items-start gap-3 bg-green-50 p-4 rounded-xl">
                                    <span className="text-2xl">{rec.icon}</span>
                                    <div>
                                        <h4 className="font-bold text-gray-800">{rec.title}</h4>
                                        <p className="text-sm text-gray-700 mt-1">{rec.explanation}</p>
                                        <div className="mt-2 text-xs bg-white/50 p-2 rounded text-green-800">
                                            <strong>למה זה יעבוד?</strong> {rec.why_it_works}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 8. EMMA Chat (Placeholder) */}
                {isTileSelected('emma_chat') && (
                    <div className="bg-white rounded-3xl p-8 shadow-sm border-r-4 border-indigo-500">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">👩‍💼 שיח עם אמה</h3>
                        <div className="bg-indigo-50 p-6 rounded-xl text-center">
                            <p className="text-indigo-800 font-medium">אמה זמינה לשיחה על הניתוח.</p>
                            <button className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors">
                                התחל צ'אט
                            </button>
                        </div>
                    </div>
                )}

                {/* Legacy Dashboard (Optional - maybe hide if using tiles?) */}
                {/* <DraggableDashboard result={result} currentUserType={currentUserType} /> */}

            </motion.div >

            {/* Customization Modal */}
            <AnimatePresence>
                {showCustomization && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <ReportCustomizationSelector
                            initialSelection={selectedTiles}
                            onComplete={(tiles) => {
                                onUpdateTiles(tiles);
                                setShowCustomization(false);
                            }}
                            onCancel={() => setShowCustomization(false)}
                        />
                    </div>
                )}
            </AnimatePresence>

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
    isQuick,
    onCustomize
}: {
    title: string;
    currentUserType: string;
    userTypeLabels: Record<string, string>;
    onShowCosts: () => void;
    onShowPromptEditor: () => void;
    onReset: () => void;
    isQuick: boolean;
    onCustomize?: () => void;
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
                {onCustomize && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onCustomize}
                        className="px-6 py-3 bg-white border-2 border-indigo-500 text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-all shadow-lg flex items-center gap-2"
                    >
                        ✏️ התאם דוח
                    </motion.button>
                )}

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
