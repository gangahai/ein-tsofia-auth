'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { defaultPrompts, defaultPromptsEn, defaultPromptsHe } from '@/lib/defaultPrompts';
import type { UserType, PromptConfig } from '@/types/types';

interface PromptEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUserType: string;
    onReanalyze: (userType: string, prompts: any) => void;
}

export default function PromptEditorModal({
    isOpen,
    onClose,
    currentUserType,
    onReanalyze
}: PromptEditorModalProps) {
    // Current selected 'hat' (persona) to edit
    const [selectedHat, setSelectedHat] = useState<Exclude<UserType, null>>((currentUserType as Exclude<UserType, null>) || 'family');

    // Store prompts for all types so we can switch between them without losing edits
    const [allPrompts, setAllPrompts] = useState<Record<string, any>>({});

    // Default language mode (can be toggled if needed, but keeping it simple as requested)
    const [isHebrewMode, setIsHebrewMode] = useState(false);

    // Initial load of all prompts
    useEffect(() => {
        if (isOpen) {
            const initialPrompts: Record<string, any> = {};
            const types: Exclude<UserType, null>[] = ['family', 'caregiver', 'kindergarten'];

            types.forEach(type => {
                // ALWAYS load fresh defaults first (from the .prompt.ts files)
                const defaults = isHebrewMode ? defaultPromptsHe : defaultPromptsEn;
                const freshPrompt = { ...defaults[type] };

                // Try to load from local storage
                const key = `customPrompts_${type}`;
                const saved = localStorage.getItem(key);

                if (saved) {
                    try {
                        const parsed = JSON.parse(saved);
                        // Version check: if saved version is older than current, use fresh
                        if (parsed && parsed.version && freshPrompt.version && parsed.version >= freshPrompt.version) {
                            // Use saved (it's up to date or newer)
                            initialPrompts[type] = parsed;
                        } else {
                            // Saved is outdated, use fresh and clear old cache
                            console.log(`🔄 Clearing outdated cache for ${type} (saved v${parsed?.version || 0} < fresh v${freshPrompt.version})`);
                            localStorage.removeItem(key);
                            initialPrompts[type] = freshPrompt;
                        }
                    } catch (e) {
                        console.error('Failed to parse saved prompts for', type);
                        initialPrompts[type] = freshPrompt;
                    }
                } else {
                    // No saved data, use fresh
                    initialPrompts[type] = freshPrompt;
                }
            });

            setAllPrompts(initialPrompts);
            setSelectedHat((currentUserType as Exclude<UserType, null>) || 'family');
        }
    }, [isOpen, isHebrewMode]);

    // Save handler
    const handleSave = () => {
        // Save ALL modified prompts to local storage
        Object.entries(allPrompts).forEach(([type, promptData]) => {
            if (promptData) {
                localStorage.setItem(`customPrompts_${type}`, JSON.stringify(promptData));
            }
        });

        // Trigger re-analyze with the CURRENTLY selected user type's prompt
        // The user expects the "Run" button to run what they are looking at, usually.
        // But the system needs to know which context to switch to.
        // If I am editing "Kindergarten" but my props say I am "Family", does saving switch me to "Kindergarten" view?
        // Probably safer to re-analyze with the selectedHat and its prompts.
        onReanalyze(selectedHat, allPrompts[selectedHat]);
        onClose();
    };

    const handlePromptChange = (newValue: string) => {
        setAllPrompts(prev => ({
            ...prev,
            [selectedHat]: {
                ...prev[selectedHat],
                sections: {
                    ...prev[selectedHat]?.sections,
                    identity: newValue // We are editing the main 'identity' section which holds the prompt
                }
            }
        }));
    };

    const handleResetCurrent = () => {
        const defaults = isHebrewMode ? defaultPromptsHe : defaultPromptsEn;
        setAllPrompts(prev => ({
            ...prev,
            [selectedHat]: { ...defaults[selectedHat] }
        }));
        // Clear from localStorage
        localStorage.removeItem(`customPrompts_${selectedHat}`);
    };

    const handleClearAllCache = () => {
        const types: Exclude<UserType, null>[] = ['family', 'caregiver', 'kindergarten'];
        types.forEach(type => {
            localStorage.removeItem(`customPrompts_${type}`);
        });

        // Reload fresh prompts
        const initialPrompts: Record<string, any> = {};
        const defaults = isHebrewMode ? defaultPromptsHe : defaultPromptsEn;
        types.forEach(type => {
            initialPrompts[type] = { ...defaults[type] };
        });
        setAllPrompts(initialPrompts);

        console.log('✅ Cache cleared, fresh prompts loaded');
    };

    if (!isOpen) return null;

    const hats = [
        { id: 'family', icon: '🏠', label: 'בית (משפחה)', color: 'from-orange-400 to-amber-500' }, // Changed to Amber/Orange (Warm home)
        { id: 'caregiver', icon: '💼', label: 'מקצועי (מטפל)', color: 'from-cyan-400 to-blue-500' }, // Blue/Cyan (Pro)
        { id: 'kindergarten', icon: '🏫', label: 'מוסדי (גן ילדים)', color: 'from-emerald-400 to-green-600' } // Green (Growth/Institution)
    ];

    // Helper to get full editable text
    const getPromptText = () => {
        const p = allPrompts[selectedHat];
        if (!p) return '';
        // If 'unified' exists (legacy or manual), prefer it? Or just identity?
        // Current standard seems to be putting everything in 'identity' for simplicity in this editor.
        // Let's concatenate if multiple exist, but for now we look primarily at identity.
        return p.sections?.identity || '';
    };

    const currentPromptText = getPromptText();

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">🛠️ מעבדת הפרומפטים</h2>
                            <p className="text-gray-500 text-sm">ערוך ושלוט על מוח המערכת עבור כל סוג משתמש</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center hover:bg-red-100 hover:text-red-500 transition-colors"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Navigation - The 3 Hats */}
                    <div className="p-6 grid grid-cols-3 gap-4 bg-white">
                        {hats.map((hat) => {
                            const isSelected = selectedHat === hat.id;
                            return (
                                <motion.button
                                    key={hat.id}
                                    onClick={() => setSelectedHat(hat.id as any)}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`
                                        relative overflow-hidden rounded-2xl p-4 transition-all duration-300 border-2
                                        flex flex-col items-center justify-center gap-2 text-center h-28
                                        ${isSelected
                                            ? `border-transparent shadow-lg text-white bg-gradient-to-br ${hat.color}`
                                            : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-gray-100'
                                        }
                                    `}
                                >
                                    <span className="text-4xl filter drop-shadow-md">{hat.icon}</span>
                                    <span className={`font-bold text-lg ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                                        {hat.label}
                                    </span>
                                    {isSelected && (
                                        <motion.div
                                            layoutId="active-indicator"
                                            className="absolute bottom-2 w-1.5 h-1.5 bg-white rounded-full opacity-70"
                                        />
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* Main Editor Area */}
                    <div className="flex-1 p-6 bg-gray-50 overflow-hidden flex flex-col min-h-[400px]">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-bold text-gray-500 uppercase tracking-wide">
                                עורך פרומפט ({hats.find(h => h.id === selectedHat)?.label})
                            </label>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleClearAllCache}
                                    className="text-xs text-red-600 hover:text-red-700 font-medium px-3 py-1 bg-red-50 rounded-full border border-red-200"
                                >
                                    🗑️ נקה Cache (כל הכובעים)
                                </button>
                                <button
                                    onClick={handleResetCurrent}
                                    className="text-xs text-orange-600 hover:text-orange-700 font-medium px-3 py-1 bg-orange-50 rounded-full border border-orange-200"
                                >
                                    🔄 שחזר לברירת מחדל
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 relative rounded-xl overflow-hidden border border-gray-200 shadow-inner bg-white min-h-[500px]">
                            <textarea
                                value={currentPromptText}
                                onChange={(e) => handlePromptChange(e.target.value)}
                                className="absolute inset-0 w-full h-full p-6 text-sm font-mono text-gray-700 leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 overflow-auto"
                                style={{
                                    scrollbarWidth: 'thin',
                                    scrollbarColor: '#cbd5e0 transparent'
                                }}
                                placeholder="הכנס את תוכן הפרומפט כאן..."
                                dir="ltr" // Prompts are usually mixed or English technical, LTR often better for code structure
                                spellCheck={false}
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-2 text-center">
                            * שינויים נשמרים מקומית ומשפיעים על הניתוחים הבאים עבור משתמש זה.
                        </p>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-gray-100 bg-white flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                            ביטול
                        </button>
                        <button
                            onClick={handleSave}
                            className={`
                                px-8 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all transform hover:-translate-y-0.5
                                bg-gradient-to-r ${hats.find(h => h.id === selectedHat)?.color}
                            `}
                        >
                            שמור והפעל ({hats.find(h => h.id === selectedHat)?.label})
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
