'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { compressVideo } from '@/lib/videoCompression';

interface VideoUploadProps {
    onUploadComplete: (file: File, mode: 'regular' | 'quick') => void;
}

export default function VideoUpload({ onUploadComplete }: VideoUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [showTips, setShowTips] = useState(false);
    const [shouldCompress, setShouldCompress] = useState(true);
    const [compressing, setCompressing] = useState(false);
    const [compressionProgress, setCompressionProgress] = useState(0);

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

    // Upload handler
    const handleUpload = async (mode: 'regular' | 'quick' = 'regular') => {
        if (!selectedFile) return;

        try {
            let fileToUpload = selectedFile;

            if (shouldCompress) {
                // Smart Compression: Skip if file is small (< 50MB)
                const SMART_COMPRESSION_THRESHOLD = 50 * 1024 * 1024; // 50MB

                if (selectedFile.size < SMART_COMPRESSION_THRESHOLD) {
                    console.log('🚀 Smart Compression: File is small (<50MB), skipping compression for speed.');
                    // Proceed with original file
                } else {
                    setCompressing(true);
                    setCompressionProgress(0);

                    try {
                        fileToUpload = await compressVideo(selectedFile, (progress) => {
                            setCompressionProgress(progress);
                        });
                    } catch (err) {
                        console.error('Compression failed:', err);
                        setError('דחיסת הוידאו נכשלה. מנסה להעלות את הקובץ המקורי...');
                        // Fallback to original file
                    } finally {
                        setCompressing(false);
                    }
                }
            }

            setUploading(true);
            setUploadProgress(0);

            // Simulate upload progress
            const interval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        return 100;
                    }
                    return prev + 10;
                });
            }, 200);

            await new Promise(resolve => setTimeout(resolve, 2500));

            setUploading(false);
            onUploadComplete(fileToUpload, mode);

        } catch (err) {
            console.error('Upload failed:', err);
            setError('ההעלאה נכשלה. אנא נסה שנית.');
            setUploading(false);
        }
    };

    // Format file size
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
            {/* Upload Area */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
            border-4 border-dashed rounded-3xl p-12 text-center transition-all duration-300
            ${isDragging
                            ? 'border-cyan-500 bg-cyan-50 scale-105'
                            : 'border-gray-300 bg-white hover:border-cyan-400'
                        }
          `}
                >
                    {!selectedFile ? (
                        <>
                            {/* Upload Icon */}
                            <motion.div
                                animate={{ y: isDragging ? -10 : 0 }}
                                className="mb-6"
                            >
                                <svg
                                    className="w-24 h-24 mx-auto text-cyan-500"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                    />
                                </svg>
                            </motion.div>

                            <h3 className="text-2xl font-bold text-gray-800 mb-2">
                                {isDragging ? 'שחרר כאן' : 'גרור ושחרר וידאו'}
                            </h3>
                            <p className="text-gray-600 mb-6">
                                או לחץ לבחירת קובץ מהמחשב
                            </p>

                            {/* File Input */}
                            <input
                                type="file"
                                accept="video/mp4,video/quicktime,video/x-msvideo,video/avi,video/msvideo"
                                onChange={handleFileInput}
                                className="hidden"
                                id="video-upload"
                            />
                            <label
                                htmlFor="video-upload"
                                className="inline-block px-8 py-4 bg-gradient-to-l from-cyan-500 to-orange-500 text-white rounded-xl font-semibold cursor-pointer hover:from-cyan-600 hover:to-orange-600 transition-all shadow-lg hover:scale-105"
                            >
                                📂 בחר קובץ
                            </label>

                            {/* Supported Formats */}
                            <p className="mt-6 text-sm text-gray-500">
                                פורמטים נתמכים: MP4, MOV, AVI<br />
                                מקסימום: 500MB (או 2GB עם דחיסה)
                            </p>
                        </>
                    ) : (
                        <>
                            {/* Selected File Info */}
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-cyan-50 border border-cyan-200 rounded-2xl p-6"
                            >
                                <div className="mb-4">
                                    <span className="text-6xl">🎬</span>
                                </div>

                                <h4 className="text-xl font-bold text-gray-800 mb-2">
                                    {selectedFile.name}
                                </h4>

                                <div className="grid grid-cols-2 gap-4 text-gray-700 mb-6">
                                    <div>
                                        <span className="text-sm text-gray-500">גודל:</span>
                                        <div className="font-semibold">{formatFileSize(selectedFile.size)}</div>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-500">סוג:</span>
                                        <div className="font-semibold">{selectedFile.type.split('/')[1].toUpperCase()}</div>
                                    </div>
                                </div>

                                {/* Compression Toggle */}
                                <div className="mb-6 flex items-center justify-center gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm max-w-md mx-auto">
                                    <div className="flex-1 text-right">
                                        <span className="font-bold text-gray-800 block">אופטימיזציה לניתוח</span>
                                        <span className="text-xs text-gray-500">מומלץ! (פעיל אוטומטית רק בקבצים מעל 50MB)</span>
                                    </div>
                                    <button
                                        onClick={() => setShouldCompress(!shouldCompress)}
                                        className={`w-12 h-6 rounded-full p-1 transition-colors ${shouldCompress ? 'bg-cyan-500' : 'bg-gray-300'}`}
                                    >
                                        <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${shouldCompress ? '-translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>

                                {/* Upload Button */}
                                {!uploading && !compressing ? (
                                    <div className="flex gap-3 justify-center">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleUpload('regular')}
                                            className="px-8 py-3 bg-gradient-to-l from-cyan-500 to-orange-500 text-white rounded-xl font-bold hover:from-cyan-600 hover:to-orange-600 transition-all shadow-lg"
                                        >
                                            ▶️ התחל ניתוח
                                        </motion.button>

                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleUpload('quick')}
                                            className="px-8 py-3 bg-white border-2 border-purple-500 text-purple-600 rounded-xl font-bold hover:bg-purple-50 transition-all shadow-lg flex items-center gap-2"
                                        >
                                            ⚡ ניתוח בזק
                                        </motion.button>

                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setSelectedFile(null)}
                                            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                                        >
                                            ביטול
                                        </motion.button>
                                    </div>
                                ) : (
                                    <div>
                                        {/* Progress Bars */}
                                        {compressing && (
                                            <div className="mb-3">
                                                <div className="flex justify-between text-sm text-gray-600 mb-2">
                                                    <span>דוחס וידאו... (זה עשוי לקחת רגע)</span>
                                                    <span>{compressionProgress}%</span>
                                                </div>
                                                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${compressionProgress}%` }}
                                                        className="h-full bg-purple-500"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {uploading && (
                                            <div className="mb-3">
                                                <div className="flex justify-between text-sm text-gray-600 mb-2">
                                                    <span>מעלה לשרת...</span>
                                                    <span>{uploadProgress}%</span>
                                                </div>
                                                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${uploadProgress}%` }}
                                                        className="h-full bg-gradient-to-l from-cyan-500 to-orange-500"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        </>
                    )}
                </div>

                {/* Error Message */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-center"
                        >
                            ❌ {error}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Recording Tips Button */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-8 text-center"
            >
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowTips(true)}
                    className="px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-bold hover:from-purple-600 hover:to-blue-600 transition-all shadow-lg flex items-center gap-3 mx-auto"
                >
                    💡 המלצות לצילום נכון
                </motion.button>
            </motion.div>

            {/* Recording Tips Modal */}
            <AnimatePresence>
                {showTips && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
                        onClick={() => setShowTips(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-3xl p-8 max-w-2xl max-h-[80vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-3xl font-bold text-gray-800">💡 המלצות לצילום</h3>
                                <motion.button
                                    whileHover={{ scale: 1.1, rotate: 90 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setShowTips(false)}
                                    className="text-gray-500 hover:text-gray-700 text-2xl"
                                >
                                    ✕
                                </motion.button>
                            </div>

                            <div className="space-y-6 text-right" dir="rtl">
                                {/* תאורה */}
                                <div className="bg-yellow-50 border-r-4 border-yellow-400 p-4 rounded-lg">
                                    <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                                        💡 תאורה
                                    </h4>
                                    <ul className="space-y-2 text-gray-700">
                                        <li>• צלם במקום מואר היטב</li>
                                        <li>• עדיף אור טבעי או תאורה רכה</li>
                                        <li>• הימנע מאור ישיר מאחור (backlight)</li>
                                    </ul>
                                </div>

                                {/* קול */}
                                <div className="bg-blue-50 border-r-4 border-blue-400 p-4 rounded-lg">
                                    <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                                        🎤 איכות קול
                                    </h4>
                                    <ul className="space-y-2 text-gray-700">
                                        <li>• צלם במקום שקט ללא רעשי רקע</li>
                                        <li>• ודא שהמיקרופון לא חסום</li>
                                        <li>• שמור על מרחק סביר מהמצלמה</li>
                                    </ul>
                                </div>

                                {/* זווית צילום */}
                                <div className="bg-green-50 border-r-4 border-green-400 p-4 rounded-lg">
                                    <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                                        📹 זווית צילום
                                    </h4>
                                    <ul className="space-y-2 text-gray-700">
                                        <li>• הקפד לכלול את כל המשתתפים במסך</li>
                                        <li>• צלם בגובה העיניים</li>
                                        <li>• שמור על יציבות המצלמה (השתמש בחצובה אם אפשר)</li>
                                    </ul>
                                </div>

                                {/* תוכן */}
                                <div className="bg-purple-50 border-r-4 border-purple-400 p-4 rounded-lg">
                                    <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                                        🎬 תוכן הצילום
                                    </h4>
                                    <ul className="space-y-2 text-gray-700">
                                        <li>• צלם אינטראקציות טבעיות</li>
                                        <li>• משך מומלץ: 5-15 דקות</li>
                                        <li>• הימנע מעריכה או חיתוך</li>
                                        <li>• שמור על פרטיות - אל תכלול פרטים מזהים מיותרים</li>
                                    </ul>
                                </div>

                                {/* טכני */}
                                <div className="bg-red-50 border-r-4 border-red-400 p-4 rounded-lg">
                                    <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                                        ⚙️ דרישות טכניות
                                    </h4>
                                    <ul className="space-y-2 text-gray-700">
                                        <li>• פורמט: MP4, MOV או AVI</li>
                                        <li>• גודל מקסימלי: 500MB (או 2GB עם דחיסה)</li>
                                        <li>• משך מקסימלי: 30 דקות</li>
                                        <li>• רזולוציה מומלצת: 720p ומעלה</li>
                                    </ul>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setShowTips(false)}
                                className="mt-6 w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-bold hover:from-purple-600 hover:to-blue-600 transition-all"
                            >
                                הבנתי, תודה!
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
