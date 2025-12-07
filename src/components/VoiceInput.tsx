'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SpeakerProfile {
    role: string;
    age_estimate: string;
    gender: string;
}

interface VoiceInputProps {
    onTranscriptionComplete: (text: string, speakerProfile?: SpeakerProfile) => void;
}

const THOUGHT_BUBBLES = [
    "שיעורי בית - המלחמה היומית",
    "התינוקת שלי לא מפסיקה לבכות :(",
    "זמן מסך - המאבק היומיומי",
    "הבלגן האינסופי בחדר הילדים"
];

const ROLES = ["אבא", "אמא", "ילד", "ילדה", "סבא", "סבתא", "מטפל/ת"];
const AGE_RANGES = ["0-3", "4-6", "7-12", "13-18", "19-30", "30-50", "50+"];

export default function VoiceInput({ onTranscriptionComplete }: VoiceInputProps) {
    const [isHovering, setIsHovering] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [currentBubbleIndex, setCurrentBubbleIndex] = useState(0);
    const [showEditModal, setShowEditModal] = useState(false);
    const [transcribedText, setTranscribedText] = useState('');
    const [tempText, setTempText] = useState('');
    const [speakerProfile, setSpeakerProfile] = useState<SpeakerProfile | null>(null);
    const [showProfileEdit, setShowProfileEdit] = useState(false);

    const [isProcessing, setIsProcessing] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    // Cycle through bubbles
    // Cycle through bubbles automatically
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentBubbleIndex(prev => (prev + 1) % THOUGHT_BUBBLES.length);
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    const startRecording = async () => {
        try {
            setIsRecording(true); // Optimistic UI update to prevent flash of 'Start' button
            setTranscribedText(''); // Reset previous text

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });

                // Switch to processing state immediately
                setIsProcessing(true);
                setIsRecording(false);

                const formData = new FormData();
                formData.append('audio', audioBlob);

                try {
                    const response = await fetch('/api/transcribe', {
                        method: 'POST',
                        body: formData
                    });

                    if (!response.ok) throw new Error('Transcription failed');

                    const data = await response.json();

                    // Format emotion message
                    const emotionMessage = `\n\n(זיהיתי שהטון שלך: ${data.emotion}. אל תדאג, אני כאן כדי לעזור ❤️)`;
                    const fullText = data.text + emotionMessage;

                    setTranscribedText(data.text);
                    setTempText(fullText);
                    setSpeakerProfile(data.speaker_profile);
                    setShowEditModal(true);
                } catch (error) {
                    console.error('Error transcribing:', error);
                    alert('שגיאה בתמלול ההקלטה. אנא נסה שוב.');
                } finally {
                    setIsProcessing(false);
                }

                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
        } catch (err) {
            console.error('Error accessing microphone:', err);
            setIsRecording(false); // Revert state on error
            alert('לא ניתן לגשת למיקרופון. אנא ודא שיש לך הרשאות.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            // State updates happen in onstop handler
        }
    };

    const handleSave = () => {
        onTranscriptionComplete(tempText, speakerProfile || undefined);
        setShowEditModal(false);
    };

    return (
        <div className="relative flex justify-center items-center my-4 w-full">
            {/* Thought Bubbles Animation */}
            <AnimatePresence mode='wait'>
                {!isRecording && !isProcessing && !transcribedText && (
                    <motion.div
                        key={currentBubbleIndex}
                        initial={{ opacity: 0, y: 10, scale: 0.8 }}
                        animate={{ opacity: 1, y: -40, scale: 1 }}
                        exit={{ opacity: 0, y: -80, scale: 0.9 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="absolute -top-10 bg-white px-4 py-2 rounded-2xl shadow-xl border border-indigo-100 text-indigo-900 text-sm font-bold whitespace-nowrap z-10"
                    >
                        💭 {THOUGHT_BUBBLES[currentBubbleIndex]}
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-b border-r border-indigo-100"></div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Processing State */}
            {isProcessing ? (
                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    <span className="text-indigo-800 font-medium animate-pulse">מעבד הקלטה...</span>
                </div>
            ) : !isRecording && transcribedText ? (
                <div className="flex items-center gap-4">
                    {/* Show Transcript Button */}
                    <motion.button
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileHover={{ scale: 1.05, translateY: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowEditModal(true)}
                        className="relative group overflow-hidden px-6 py-4 rounded-2xl bg-white border-2 border-indigo-100 shadow-[0_8px_20px_-6px_rgba(79,70,229,0.3)] hover:shadow-[0_12px_25px_-8px_rgba(79,70,229,0.4)] transition-all flex items-center gap-3"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <span className="text-2xl relative z-10">📝</span>
                        <span className="font-bold text-indigo-700 relative z-10">הצג תמלול</span>
                    </motion.button>

                    {/* Record Again Button */}
                    <motion.button
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileHover={{ scale: 1.05, translateY: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            setTranscribedText('');
                            startRecording();
                        }}
                        className="relative group overflow-hidden px-6 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 shadow-[0_8px_20px_-6px_rgba(99,102,241,0.5)] hover:shadow-[0_12px_25px_-8px_rgba(99,102,241,0.6)] text-white font-bold transition-all flex items-center gap-3"
                    >
                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <span className="text-2xl relative z-10">🎙️</span>
                        <span className="relative z-10">הקלט מחדש</span>
                    </motion.button>
                </div>
            ) : (
                /* Default / Active Recording Button */
                <motion.button
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                    onClick={isRecording ? stopRecording : startRecording}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                    relative px-10 py-5 rounded-3xl font-bold text-xl shadow-[0_10px_30px_-10px_rgba(79,70,229,0.5)] flex items-center gap-4 transition-all overflow-hidden border-4
                    ${isRecording
                            ? 'bg-gradient-to-r from-rose-500 via-red-500 to-rose-600 border-rose-200 text-white shadow-rose-200'
                            : 'bg-white border-indigo-100 text-indigo-900 hover:border-indigo-200'
                        }
                `}
                >
                    {/* Background Gradient for Active State - Pulse Effect */}
                    {isRecording && (
                        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    )}

                    {/* Background Gradient for Inactive State */}
                    {!isRecording && (
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 opacity-100 group-hover:opacity-80 transition-opacity"></div>
                    )}

                    <span className="text-3xl relative z-10 filter drop-shadow-sm transition-transform duration-300 transform group-hover:scale-110">
                        {isRecording ? '⏹️' : '🎙️'}
                    </span>
                    <span className="relative z-10 tracking-wide">
                        {isRecording ? 'לחץ לסיום הקלטה' : 'אני מחכה לשמוע מה מטריד אותך?'}
                    </span>

                    {/* Recording Ripple Effect */}
                    {isRecording && (
                        <>
                            <span className="absolute inset-0 rounded-3xl border-2 border-white/40 animate-ping"></span>
                        </>
                    )}
                </motion.button>
            )}

            {/* Edit Modal */}
            <AnimatePresence>
                {showEditModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl overflow-y-auto max-h-[90vh]"
                        >
                            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <span>📝</span> עריכת הטקסט שלך
                            </h3>

                            {/* Speaker Profile Section */}
                            {speakerProfile && (
                                <div className="mb-6 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="font-bold text-indigo-900 flex items-center gap-2">
                                            👤 זיהוי דובר
                                        </h4>
                                        <button
                                            onClick={() => setShowProfileEdit(!showProfileEdit)}
                                            className="text-sm text-indigo-600 hover:text-indigo-800 underline"
                                        >
                                            {showProfileEdit ? 'סגור עריכה' : 'זה לא אני? לחץ לתיקון'}
                                        </button>
                                    </div>

                                    {!showProfileEdit ? (
                                        <div className="flex gap-4 text-gray-700">
                                            <span className="bg-white px-3 py-1 rounded-lg shadow-sm">
                                                תפקיד: <strong>{speakerProfile.role}</strong>
                                            </span>
                                            <span className="bg-white px-3 py-1 rounded-lg shadow-sm">
                                                גיל משוער: <strong>{speakerProfile.age_estimate}</strong>
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-4 mt-2">
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">תפקיד</label>
                                                <select
                                                    value={speakerProfile.role}
                                                    onChange={(e) => setSpeakerProfile({ ...speakerProfile, role: e.target.value })}
                                                    className="w-full p-2 rounded-lg border border-indigo-200 text-gray-700"
                                                >
                                                    {ROLES.map(role => (
                                                        <option key={role} value={role}>{role}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-500 mb-1">גיל</label>
                                                <select
                                                    value={speakerProfile.age_estimate}
                                                    onChange={(e) => setSpeakerProfile({ ...speakerProfile, age_estimate: e.target.value })}
                                                    className="w-full p-2 rounded-lg border border-indigo-200 text-gray-700"
                                                >
                                                    {AGE_RANGES.map(age => (
                                                        <option key={age} value={age}>{age}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <p className="text-gray-600 mb-4">
                                הנה מה ששמעתי. אתה מוזמן לדייק אותי או להוסיף פרטים:
                            </p>

                            <textarea
                                value={tempText}
                                onChange={(e) => setTempText(e.target.value)}
                                className="w-full h-40 p-4 border-2 border-indigo-100 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none text-lg leading-relaxed resize-none text-gray-900"
                                dir="rtl"
                                placeholder="הקלד כאן..."
                            />

                            <div className="flex gap-3 justify-end mt-6">
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                                >
                                    ביטול
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg"
                                >
                                    אשר ושלח לאמה ✨
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
