'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VideoUpload from '@/components/VideoUpload';
import {
    defaultPromptsEn,
    saveCustomPrompts,
    loadCustomPrompts,
    getDefaultPrompts
} from '@/lib/defaultPrompts';
import { PromptConfig } from '@/types/types';

interface KindergartenUploadViewProps {
    onUploadComplete: (file: File, mode: 'regular' | 'quick') => void;
    onBack: () => void;
    onLoadDemo?: () => void;
}

export default function KindergartenUploadView({ onUploadComplete, onBack, onLoadDemo }: KindergartenUploadViewProps) {
    const [prompts, setPrompts] = useState<PromptConfig>(defaultPromptsEn.kindergarten);
    const [isEditing, setIsEditing] = useState(false);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        // Load custom prompts if they exist
        const saved = loadCustomPrompts('kindergarten');
        const defaults = defaultPromptsEn.kindergarten;

        // Check if we have saved prompts and if they are the current version
        if (saved && saved.version >= defaults.version) {
            setPrompts({
                ...saved,
                unified: saved.unified || defaults.unified // Ensure unified exists
            });
        } else {
            // If no saved prompts or outdated version, use defaults (English)
            setPrompts(defaults);
        }
    }, []);

    const handleSave = () => {
        if (prompts) {
            saveCustomPrompts('kindergarten', prompts);
            setIsEditing(false);
        }
    };

    const handleReset = () => {
        const defaults = getDefaultPrompts('kindergarten');
        if (defaults) {
            setPrompts(defaults);
        }
        setIsEditing(false);
    };

    if (!prompts) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8 flex items-center justify-center">
            <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12">

                {/* Left Side: Upload & Persona */}
                <div className="space-y-8">
                    {/* Emma Persona Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-3xl p-8 shadow-2xl border-4 border-pink-100 relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400" />
                        <div className="flex items-start gap-6">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full bg-pink-100 flex items-center justify-center text-5xl border-4 border-white shadow-lg">
                                    👩‍🏫
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full border-2 border-white">
                                    Online
                                </div>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800 mb-1">שלום, אני אמה</h1>
                                <h2 className="text-lg text-pink-600 font-bold mb-3">המדריכה הפדגוגית שלך</h2>
                                <p className="text-gray-600 leading-relaxed">
                                    אני כאן כדי לעזור לך לנתח את האינטראקציות בגן. העלי סרטון, ואני אפיק עבורך דוח מפורט עם המלצות מעשיות לשיפור האקלים החינוכי.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Upload Area */}
                    {/* Upload Area */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <VideoUpload
                            onUploadComplete={onUploadComplete}
                            allowQuickAnalysis={false}
                            userType="kindergarten"
                        />

                        {/* Demo Button */}
                        {onLoadDemo && (
                            <motion.button
                                onClick={onLoadDemo}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-full mt-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-2 px-4 rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                                <span className="text-lg">🎭</span>
                                <span>טען דו"ח לדוגמה</span>
                            </motion.button>
                        )}
                    </motion.div>

                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-white/70 hover:text-white transition-colors px-4"
                    >
                        <span>➡️</span> חזרה למסך הראשי
                    </button>
                </div>

                {/* Right Side: Prompt Preview */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className={`bg-white/95 backdrop-blur rounded-3xl p-6 shadow-2xl flex flex-col transition-all duration-300 ${expanded ? 'fixed inset-4 z-50 h-auto' : 'h-[600px]'}`}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">🧠</span>
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">המוח של אמה</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold border border-purple-200">
                                        Model: Gemini 2.5 Flash
                                    </span>
                                    <span className="text-xs text-gray-400">Deep Analysis</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className={`px-3 py-1 rounded-lg text-sm font-bold transition-colors ${isEditing ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}
                            >
                                {isEditing ? 'שמור שינויים' : '✏️ ערוך'}
                            </button>
                            <button
                                onClick={() => setExpanded(!expanded)}
                                className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-200"
                            >
                                {expanded ? 'הקטן' : 'הגדל'}
                            </button>
                        </div>
                    </div>

                    {/* Content Area - Single Unified Prompt */}
                    <div className="flex-1 overflow-y-auto bg-gray-50 rounded-xl p-4 border border-gray-100 font-mono text-sm leading-relaxed custom-scrollbar">
                        {isEditing ? (
                            <textarea
                                value={prompts.unified}
                                onChange={(e) => setPrompts({
                                    ...prompts,
                                    unified: e.target.value
                                })}
                                className="w-full h-full bg-transparent border-none resize-none focus:ring-0 p-0 text-gray-700"
                                dir="ltr"
                                placeholder="Enter your custom prompt here..."
                            />
                        ) : (
                            <div className="whitespace-pre-wrap text-gray-700" dir="ltr">
                                {prompts.unified}
                            </div>
                        )}
                    </div>

                    {isEditing && (
                        <div className="mt-4 flex justify-end gap-3">
                            <button
                                onClick={handleReset}
                                className="px-4 py-2 text-gray-500 hover:text-gray-700 font-bold text-sm"
                            >
                                אפס לברירת מחדל
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                            >
                                שמור שינויים
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        </div >
    );
}
