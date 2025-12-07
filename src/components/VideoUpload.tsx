'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { compressVideo } from '@/lib/videoCompression';
import { getDefaultPrompts } from '@/lib/defaultPrompts';
import VoiceInput from './VoiceInput';
import VideoRecorder from './VideoRecorder';
import VideoPreviewModal from './VideoPreviewModal';

interface VideoUploadProps {
    onUploadComplete: (file: File, mode: 'regular' | 'quick', voiceData?: { text: string, speakerProfile?: any }) => void;
    allowQuickAnalysis?: boolean;
    userType?: string; // Add userType to know which prompt to show
    onLoadDemo?: () => void; // Add demo loader
}

export default function VideoUpload({ onUploadComplete, allowQuickAnalysis = true, userType = 'family', onLoadDemo }: VideoUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [showTips, setShowTips] = useState(false);
    const [shouldCompress, setShouldCompress] = useState(false);
    const [compressing, setCompressing] = useState(false);
    const [compressionProgress, setCompressionProgress] = useState(0);
    const [showPromptModal, setShowPromptModal] = useState(false);
    const [voiceData, setVoiceData] = useState<{ text: string, speakerProfile?: any } | null>(null);
    const [showRecorder, setShowRecorder] = useState(false);
    const [showCameraTips, setShowCameraTips] = useState(false);
    const [showContextWarning, setShowContextWarning] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);

    // File validation
    const validateFile = (file: File): string | null => {
        console.log('🔍 Validating file:', { name: file.name, type: file.type, size: file.size });

        const validTypes = [
            'video/mp4',
            'video/quicktime',
            'video/x-msvideo',
            'video/avi',
            'video/msvideo',
        ];

        if (!validTypes.includes(file.type)) {
            return `סוג קובץ לא נתמך (${file.type}). אנא העלה MP4, MOV או AVI`;
        }

        // Check file size (max 2GB for compression, 500MB raw)
        const maxSize = shouldCompress ? 2000 * 1024 * 1024 : 500 * 1024 * 1024;
        if (file.size > maxSize) {
            return `גודל הקובץ חורג מ-${shouldCompress ? '2GB' : '500MB'}`;
        }

        return null;
    };

    // Handle file selection
    const handleFileSelect = useCallback((file: File) => {
        const validationError = validateFile(file);
        if (validationError) {
            setError(validationError);
            setSelectedFile(null);
            return;
        }

        setError(null);
        setSelectedFile(file);
    }, [shouldCompress]);

    // Drag & Drop handlers
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    }, [handleFileSelect]);

    // File input handler
    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    // Handle transcription from VoiceInput
    const handleTranscription = (text: string, speakerProfile?: any) => {
        console.log('📝 Transcription received:', text);
        console.log('👤 Speaker Profile:', speakerProfile);

        // Store in state to be passed with upload
        setVoiceData({ text, speakerProfile });
    };

    // Upload handler where we intercept
    const handleUpload = async (mode: 'regular' | 'quick' = 'regular', force: boolean = false) => {
        if (!selectedFile) return;

        // Check for missing voice context (only if not forced)
        if (!force && !voiceData) {
            setShowContextWarning(true);
            return;
        }

        try {
            setShowContextWarning(false); // Ensure modal is closed
            let fileToUpload = selectedFile;

            // Compression logic
            if (shouldCompress && selectedFile.size > 50 * 1024 * 1024) { // Only compress if > 50MB
                setCompressing(true);
                try {
                    console.log('🔄 Starting compression...');
                    fileToUpload = await compressVideo(selectedFile, (progress) => {
                        setCompressionProgress(progress);
                    });
                    console.log('✅ Compression complete:', { original: selectedFile.size, compressed: fileToUpload.size });
                } catch (compError) {
                    console.error('⚠️ Compression failed, using original file:', compError);
                    // Continue with original file if compression fails
                } finally {
                    setCompressing(false);
                }
            }

            setUploading(true);

            // Simulate upload progress
            for (let i = 0; i <= 100; i += 10) {
                setUploadProgress(i);
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Simulate upload delay
            await new Promise(resolve => setTimeout(resolve, 500));
            setUploadProgress(100);

            // Pass file and voice data to parent
            onUploadComplete(fileToUpload, mode, voiceData || undefined);
            setUploading(false);
        } catch (err) {
            console.error('Upload error:', err);
            setError('שגיאה בהעלאת הקובץ. אנא נסה שנית.');
            setUploading(false);
        }
    };

    const handleScrollToVoice = () => {
        setShowContextWarning(false);
        const voiceSection = document.getElementById('voice-input-section');
        if (voiceSection) {
            voiceSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Optional: flash the section
            voiceSection.classList.add('ring-4', 'ring-indigo-300');
            setTimeout(() => voiceSection.classList.remove('ring-4', 'ring-indigo-300'), 2000);
        }
    };

    const handleRecordingComplete = (file: File) => {
        setShowRecorder(false);
        handleFileSelect(file);
    };

    return (
        <div className="w-full max-w-4xl mx-auto relative">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                <div className="p-2 md:p-6">
                    {/* Header or Analyze Button */}
                    <div className="text-center mb-2 md:mb-6 min-h-[60px] md:min-h-[100px] flex items-center justify-center">
                        {!selectedFile ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                            >
                                <div className="inline-block w-8 h-8 md:w-24 md:h-24 mb-1 md:mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="w-full h-full drop-shadow-md">
                                        <defs>
                                            <linearGradient id="clapperMain" x1="0%" y1="0%" x2="0%" y2="100%">
                                                <stop offset="0%" stopColor="#6366f1" />
                                                <stop offset="100%" stopColor="#4338ca" />
                                            </linearGradient>
                                            <linearGradient id="clapperStripes" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#ffffff" />
                                                <stop offset="100%" stopColor="#e0e7ff" />
                                            </linearGradient>
                                        </defs>

                                        {/* Main Body */}
                                        <rect x="8" y="24" width="48" height="34" rx="6" fill="url(#clapperMain)" className="shadow-lg" />

                                        {/* Clapper Top - Angled */}
                                        <g transform="rotate(-15, 8, 24)">
                                            <rect x="8" y="10" width="48" height="12" rx="3" fill="#312e81" />
                                            <path d="M12 10 L20 22 M28 10 L36 22 M44 10 L52 22" stroke="white" strokeWidth="4" strokeLinecap="round" />
                                        </g>

                                        {/* Play Icon */}
                                        <path d="M28 36 L40 43 L28 50 Z" fill="white" className="drop-shadow-sm" />
                                    </svg>
                                </div>
                                <h2 className="text-sm md:text-xl font-bold text-gray-800 mb-0 md:mb-1">העלאת סרטון לניתוח</h2>
                                <p className="text-[10px] md:text-sm text-gray-600">בחר אפשרות להעלאת סרטון</p>
                            </motion.div>
                        ) : (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(99, 102, 241, 0.4)" }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleUpload('regular')} // This will trigger the check
                                disabled={uploading}
                                className={`
                                    w-56 h-56 rounded-full font-bold text-xl shadow-2xl flex flex-col items-center justify-center gap-3 transition-all border-4 border-white ring-4 ring-indigo-100 relative overflow-hidden group
                                    ${uploading
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 text-white'
                                    }
                                `}
                            >
                                {uploading ? (
                                    <>
                                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                                        <span className="text-4xl animate-spin mb-2">⏳</span>
                                        <span className="text-sm">מעלה... {uploadProgress}%</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

                                        {/* Modern Brain/AI Icon */}
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-indigo-100 drop-shadow-md">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                                        </svg>

                                        <span className="relative z-10 text-lg tracking-wide">נתח סרטון</span>
                                        <span className="text-[10px] opacity-70 font-normal bg-black/10 px-2 py-0.5 rounded-full">AI Deep Analysis</span>
                                    </>
                                )}
                            </motion.button>
                        )}
                    </div>

                    {/* Upload Options Container */}
                    <div className="grid grid-cols-2 gap-3 md:gap-6 mb-4 md:mb-6">
                        {/* Option 1: File Upload */}
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`
                                relative border-3 border-dashed rounded-2xl p-2 md:p-8 text-center transition-all duration-300 cursor-pointer group
                                ${isDragging
                                    ? 'border-indigo-500 bg-indigo-50 scale-105'
                                    : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                                }
                            `}
                        >
                            <input
                                type="file"
                                accept="video/*"
                                onChange={handleFileInput}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="space-y-1 md:space-y-4">
                                <div className="w-10 h-10 md:w-20 md:h-20 mx-auto transform group-hover:scale-110 transition-transform duration-300">
                                    {/* Soft 3D Cloud with Arrow */}
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="w-full h-full drop-shadow-md">
                                        <defs>
                                            <linearGradient id="softCloud" x1="0%" y1="0%" x2="0%" y2="100%">
                                                <stop offset="0%" stopColor="#ffffff" />
                                                <stop offset="100%" stopColor="#f1f5f9" />
                                            </linearGradient>
                                        </defs>
                                        <path d="M16 42 C10 42 6 38 6 32 C6 26 10 22 16 22 L18 22 C20 12 30 6 40 8 C48 10 52 16 52 22 L54 22 C58 22 62 26 62 30 C62 36 58 42 52 42 L16 42 Z" fill="url(#softCloud)" stroke="#cbd5e1" strokeWidth="1.5" />

                                        {/* Blue Arrow Up */}
                                        <path d="M32 46 L32 26 M32 26 L24 34 M32 26 L40 34" stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" className="drop-shadow-sm" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-base font-bold text-gray-700">העלאת קובץ</p>
                                    <p className="text-[10px] text-gray-500 mt-1">MP4, MOV, AVI (עד 500MB)</p>
                                </div>
                            </div>
                        </div>

                        {/* Option 2: Record Video */}
                        <div className="relative border-3 border-dashed border-gray-200 rounded-2xl p-2 md:p-8 text-center hover:border-purple-300 hover:bg-purple-50 transition-all duration-300 flex flex-col justify-center items-center gap-2 md:gap-4 group">
                            <button
                                onClick={() => setShowRecorder(true)}
                                className="w-full h-full flex flex-col items-center justify-center gap-4"
                            >
                                <div className="w-10 h-10 md:w-20 md:h-20 mx-auto transform group-hover:scale-110 transition-transform duration-300">
                                    {/* Soft 3D Camera */}
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="w-full h-full drop-shadow-md">
                                        <defs>
                                            <linearGradient id="softCamera" x1="0%" y1="0%" x2="0%" y2="100%">
                                                <stop offset="0%" stopColor="#c084fc" />
                                                <stop offset="100%" stopColor="#a855f7" />
                                            </linearGradient>
                                            <linearGradient id="lensReflect" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#60a5fa" />
                                                <stop offset="100%" stopColor="#2563eb" />
                                            </linearGradient>
                                        </defs>

                                        {/* Camera Body */}
                                        <rect x="8" y="20" width="48" height="32" rx="8" fill="url(#softCamera)" className="shadow-lg" />

                                        {/* Top Button */}
                                        <path d="M44 20 L44 16 L52 16 L52 20" fill="#9333ea" />

                                        {/* Lens System */}
                                        <circle cx="32" cy="36" r="12" fill="#e2e8f0" />
                                        <circle cx="32" cy="36" r="10" fill="#1e293b" />
                                        <circle cx="32" cy="36" r="6" fill="url(#lensReflect)" />
                                        <circle cx="34" cy="34" r="2" fill="white" opacity="0.6" />

                                        {/* Flash */}
                                        <circle cx="48" cy="28" r="3" fill="#fbbf24" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-base font-bold text-gray-700">צילום סרטון</p>
                                    <p className="text-[10px] text-gray-500 mt-1">פתח מצלמה והקלט</p>
                                </div>
                            </button>

                            {/* Camera Tips Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowCameraTips(!showCameraTips);
                                }}
                                className="absolute top-2 right-2 p-2 text-purple-400 hover:text-purple-600 transition-colors"
                                title="טיפים לצילום"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                            </button>

                            {/* 720p Note REMOVED */}

                            {/* Camera Tips Popover */}
                            <AnimatePresence>
                                {showCameraTips && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                        className="absolute top-10 right-2 w-64 bg-white rounded-xl shadow-xl border border-purple-100 p-4 z-20 text-right"
                                    >
                                        <h4 className="font-bold text-purple-800 mb-2 text-sm">טיפים לצילום נכון:</h4>
                                        <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                                            <li>החזק את הטלפון לרוחב (Landscape)</li>
                                            <li>ודא שיש תאורה טובה על הפנים</li>
                                            <li>השתדל למנוע רעשי רקע חזקים</li>
                                            <li>צלם את האינטראקציה כולה</li>
                                        </ul>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Recorder Modal */}
                    {showRecorder && (
                        <VideoRecorder
                            onRecordingComplete={handleRecordingComplete}
                            onCancel={() => setShowRecorder(false)}
                        />
                    )}

                    {/* Preview Modal */}
                    <AnimatePresence>
                        {showPreviewModal && selectedFile && (
                            <VideoPreviewModal
                                file={selectedFile}
                                onClose={() => setShowPreviewModal(false)}
                            />
                        )}
                    </AnimatePresence>

                    {/* Context Warning Modal */}
                    <AnimatePresence>
                        {showContextWarning && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
                                >
                                    <div className="p-6 text-center">
                                        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                                            🎙️
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">רגע אחד...</h3>
                                        <p className="text-gray-600 mb-6 leading-relaxed">
                                            כדי להוסיף הסבר מה מטריד אותך, הקלט זה יתן תוצאה מדוייקת יותר.
                                            <br />
                                            <span className="text-sm text-gray-500 mt-2 block">האם תרצה להוסיף הקלטה או להמשיך כך?</span>
                                        </p>

                                        <div className="flex flex-col gap-3">
                                            <button
                                                onClick={handleScrollToVoice}
                                                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-200"
                                            >
                                                <span>🎤</span>
                                                <span>כן, אני רוצה להקליט</span>
                                            </button>
                                            <button
                                                onClick={() => handleUpload('regular', true)}
                                                className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
                                            >
                                                המשך ניתוח ללא הקלטה
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>

                    {/* Error Message */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2"
                            >
                                <span>⚠️</span>
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Selected File Preview - Always keep visible to allow changing */}
                    <AnimatePresence>
                        {selectedFile && !uploading && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-6 bg-indigo-50 p-4 rounded-xl flex items-center justify-between border border-indigo-100 cursor-pointer hover:bg-indigo-100 transition-colors group"
                                onClick={() => setShowPreviewModal(true)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-xl group-hover:scale-110 transition-transform">🎥</div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-gray-800">{selectedFile.name}</p>
                                        </div>
                                        <p className="text-xs text-gray-500">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedFile(null);
                                    }}
                                    className="p-2 hover:bg-indigo-200 rounded-full text-indigo-400 hover:text-indigo-600 transition-colors z-10"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Voice Input Section */}
                    {(userType === 'family' || userType === 'kindergarten') && (
                        <div id="voice-input-section" className="mt-6 border-t border-gray-100 pt-6 transition-all duration-300 rounded-2xl">
                            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-1 border-2 border-dashed border-gray-200 hover:border-indigo-200 transition-colors">
                                <VoiceInput onTranscriptionComplete={handleTranscription} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
