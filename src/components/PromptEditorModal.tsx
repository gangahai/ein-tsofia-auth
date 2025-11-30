'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { defaultPrompts, defaultPromptsEn, defaultPromptsHe } from '@/lib/defaultPrompts';
import type { UserType } from '@/types/types';

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
    const [selectedUserType, setSelectedUserType] = useState<string>(currentUserType || 'family');
    const [prompts, setPrompts] = useState<any>(defaultPrompts[(currentUserType || 'family') as Exclude<UserType, null>]);
    const [activeTab, setActiveTab] = useState<'identity' | 'forensic' | 'psychology' | 'safety' | 'output'>('identity');
    const [isHebrewMode, setIsHebrewMode] = useState(false); // Default to English (false)

    // Default layout configuration
    const [layoutConfig, setLayoutConfig] = useState<string[]>([
        'emotion_graph', 'event_timeline', 'interaction_heatmap',
        'interpretations', 'dynamics', 'risk_factors'
    ]);

    // Update prompts when user type changes
    useEffect(() => {
        const key = `customPrompts_${selectedUserType}`;
        const saved = localStorage.getItem(key);
        let loaded = false;

        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Check version compatibility
                const currentVersion = defaultPromptsEn[(selectedUserType || 'family') as Exclude<UserType, null>].version || 0;
                const savedVersion = parsed.version || 0;

                if (savedVersion >= currentVersion) {
                    setPrompts(parsed);
                    if (parsed.layoutConfig) {
                        setLayoutConfig(parsed.layoutConfig);
                    }
                    loaded = true;
                }
            } catch (e) {
                console.error('Failed to parse saved prompts', e);
            }
        }

        if (!loaded) {
            // Load default based on current language mode
            const defaults = isHebrewMode ? defaultPromptsHe : defaultPromptsEn;
            setPrompts(defaults[(selectedUserType || 'family') as Exclude<UserType, null>]);
        }
    }, [selectedUserType]); // Removed isHebrewMode from dependencies to prevent overwriting on toggle

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleSave = () => {
        const promptsWithLayout = {
            ...prompts,
            layoutConfig
        };
        onReanalyze(selectedUserType, promptsWithLayout);
        onClose();
    };

    const handleReset = () => {
        // Reset based on current language mode
        const defaults = isHebrewMode ? defaultPromptsHe : defaultPromptsEn;
        setPrompts(defaults[(selectedUserType || 'family') as Exclude<UserType, null>]);
        setLayoutConfig([
            'emotion_graph', 'event_timeline', 'interaction_heatmap',
            'interpretations', 'dynamics', 'risk_factors'
        ]);
    };

    const toggleLanguage = () => {
        const newMode = !isHebrewMode;
        setIsHebrewMode(newMode);
        // Switch defaults immediately
        const defaults = newMode ? defaultPromptsHe : defaultPromptsEn;
        setPrompts(defaults[(selectedUserType || 'family') as Exclude<UserType, null>]);
    };

    const updateSection = (section: string, value: string) => {
        setPrompts({
            ...prompts,
            sections: {
                ...prompts.sections,
                [section]: value
            }
        });
    };

    const updateKeywords = (keywords: string) => {
        setPrompts({
            ...prompts,
            keywords: keywords.split(',').map(k => k.trim()).filter(k => k)
        });
    };

    const updateLayoutSlot = (index: number, value: string) => {
        const newLayout = [...layoutConfig];
        newLayout[index] = value;
        setLayoutConfig(newLayout);
    };

    if (!isOpen) return null;

    const userTypes = [
        { id: 'family', icon: '🏠', label: 'בית (משפחה)' },
        { id: 'caregiver', icon: '👨‍⚕️', label: 'מטפל מקצועי' },
        { id: 'kindergarten', icon: '🏫', label: 'מוסדי (גן ילדים)' }
    ];

    const tabs = [
        { id: 'identity', label: 'זהות', icon: '🎭' },
        { id: 'forensic', label: 'משפטי', icon: '📋' },
        { id: 'psychology', label: 'פסיכולוגי', icon: '🧠' },
        { id: 'safety', label: 'בטיחות', icon: '🛡️' },
        { id: 'output', label: 'פלט (דוח)', icon: '📄' }
    ];

    const windowOptions = [
        { id: 'emotion_graph', label: '📈 גרף רגשות', type: 'graph' },
        { id: 'event_timeline', label: '⏱️ ציר זמן אירועים', type: 'graph' },
        { id: 'interaction_heatmap', label: '🔥 מפת חום', type: 'graph' },
        { id: 'interpretations', label: '🧠 פרשנויות', type: 'detail' },
        { id: 'dynamics', label: '🔄 דינמיקה', type: 'detail' },
        { id: 'risk_factors', label: '🛡️ גורמי סיכון', type: 'detail' },
        { id: 'facts', label: '📋 עובדות', type: 'detail' },
        { id: 'observations', label: '👀 תצפיות', type: 'detail' }
    ];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-3xl font-bold text-gray-800">🔬 מעבדת הפרומפטים</h2>
                        <motion.button
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 text-3xl leading-none"
                        >
                            ×
                        </motion.button>
                    </div>
                    {/* User Type Selection */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-bold text-gray-700">בחר תפקיד:</h3>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={toggleLanguage}
                                className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${isHebrewMode
                                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                    }`}
                            >
                                {isHebrewMode ? '🇮🇱 עברית' : '🇺🇸 אנגלית (מומלץ)'}
                                <span className="text-xs opacity-70">
                                    {isHebrewMode ? '(לחץ לתרגום לאנגלית)' : '(לחץ לתרגום לעברית)'}
                                </span>
                            </motion.button>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {userTypes.map(type => (
                                <motion.button
                                    key={type.id}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => setSelectedUserType(type.id)}
                                    className={`p-4 rounded-xl font-bold transition-all ${selectedUserType === type.id
                                        ? 'bg-gradient-to-l from-cyan-500 to-orange-500 text-white shadow-lg'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    <div className="text-2xl mb-1">{type.icon}</div>
                                    <div className="text-sm">{type.label}</div>
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="mb-6">
                        <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
                            {tabs.map(tab => (
                                <motion.button
                                    key={tab.id}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`px-4 py-2 font-bold transition-all whitespace-nowrap ${activeTab === tab.id
                                        ? 'border-b-2 border-cyan-500 text-cyan-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {tab.icon} {tab.label}
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="mb-6">
                        {activeTab === 'output' ? (
                            <div className="space-y-6">
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                                    <h4 className="font-bold text-blue-800 mb-2">📌 רכיבים קבועים בדוח:</h4>
                                    <ul className="list-disc list-inside text-sm text-blue-700 grid grid-cols-2 gap-2">
                                        <li>תיאור מקרה אובייקטיבי</li>
                                        <li>פרטי משתתפים ותפקידים</li>
                                        <li>תיאור סביבה</li>
                                        <li>ניתוח אינטראקציה עמוק</li>
                                        <li>3 המלצות מעשיות</li>
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="font-bold text-gray-700 mb-3">🪟 סידור 6 החלונות הדינמיים:</h4>
                                    <div className="grid grid-cols-3 gap-4">
                                        {layoutConfig.map((slotId, index) => (
                                            <div key={index} className="border-2 border-dashed border-gray-300 rounded-xl p-3 bg-gray-50">
                                                <div className="text-xs text-gray-500 mb-1">חלון {index + 1}</div>
                                                <select
                                                    value={slotId}
                                                    onChange={(e) => updateLayoutSlot(index, e.target.value)}
                                                    className="w-full p-2 rounded border border-gray-300 text-sm font-bold"
                                                    dir="rtl"
                                                >
                                                    <optgroup label="גרפים">
                                                        {windowOptions.filter(o => o.type === 'graph').map(opt => (
                                                            <option key={opt.id} value={opt.id}>{opt.label}</option>
                                                        ))}
                                                    </optgroup>
                                                    <optgroup label="פרטים">
                                                        {windowOptions.filter(o => o.type === 'detail').map(opt => (
                                                            <option key={opt.id} value={opt.id}>{opt.label}</option>
                                                        ))}
                                                    </optgroup>
                                                </select>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="relative">
                                <textarea
                                    value={prompts.sections[activeTab]}
                                    onChange={(e) => updateSection(activeTab, e.target.value)}
                                    className={`w-full h-64 p-4 border-2 border-gray-200 rounded-xl focus:border-cyan-500 outline-none resize-none ${isHebrewMode ? 'text-right' : 'text-left'}`}
                                    dir={isHebrewMode ? "rtl" : "ltr"}
                                    placeholder={`הכנס הוראות ${tabs.find(t => t.id === activeTab)?.label}...`}
                                />
                                <div className="absolute bottom-4 left-4 text-xs text-gray-400 bg-white px-2 rounded opacity-70">
                                    {isHebrewMode ? 'עברית' : 'English'}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Keywords */}
                    <div className="mb-6">
                        <h3 className="font-bold text-gray-700 mb-2">מילות מפתח (מופרדות בפסיקים):</h3>
                        <input
                            type="text"
                            value={prompts.keywords.join(', ')}
                            onChange={(e) => updateKeywords(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-cyan-500 outline-none"
                            dir="rtl"
                            placeholder="לדוגמה: אמא, ילד, רגשות, משחק"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSave}
                            className="flex-1 px-6 py-4 bg-gradient-to-l from-cyan-500 to-orange-500 text-white rounded-xl font-bold hover:from-cyan-600 hover:to-orange-600 transition-all shadow-lg"
                        >
                            ✅ שמור ונתח מחדש
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleReset}
                            className="px-6 py-4 bg-yellow-100 text-yellow-700 rounded-xl font-bold hover:bg-yellow-200 transition-all"
                        >
                            🔄 איפוס לברירת מחדל
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onClose}
                            className="px-6 py-4 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-all"
                        >
                            ביטול
                        </motion.button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence >
    );
}
