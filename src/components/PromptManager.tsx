'use client';

import { useState, useEffect } from 'react';
import { UserType } from '@/types/types';
import {
    getDefaultPrompts,
    loadCustomPrompts,
    saveCustomPrompts,
    resetToDefaults,
    PromptConfig
} from '@/lib/defaultPrompts';

type TabType = 'identity' | 'forensic' | 'psychology' | 'safety';

export default function PromptManager() {
    // Get userType from localStorage
    const [userType, setUserType] = useState<Exclude<UserType, null> | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('identity');
    const [config, setConfig] = useState<PromptConfig | null>(null);
    const [hasChanges, setHasChanges] = useState(false);

    // Load userType and prompts on mount
    useEffect(() => {
        const savedType = localStorage.getItem('userType') as Exclude<UserType, null>;
        if (savedType) {
            setUserType(savedType);
            // Load custom prompts or defaults
            const custom = loadCustomPrompts(savedType);
            setConfig(custom || getDefaultPrompts(savedType));
        }
    }, []);

    if (!userType || !config) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-800 via-cyan-900 to-blue-900 flex items-center justify-center p-4">
                <div className="text-white text-xl">טוען...</div>
            </div>
        );
    }

    const tabs: { id: TabType; label: string; icon: string }[] = [
        { id: 'identity', label: 'זהות ומטרה', icon: '🎯' },
        { id: 'forensic', label: 'מבט משפטי', icon: '⚖️' },
        { id: 'psychology', label: 'פסיכולוגיה', icon: '🧠' },
        { id: 'safety', label: 'בטיחות', icon: '🛡️' }
    ];

    const handleTextChange = (section: TabType, value: string) => {
        setConfig({
            ...config,
            sections: {
                ...config.sections,
                [section]: value
            }
        });
        setHasChanges(true);
    };

    const handleKeywordAdd = (keyword: string) => {
        if (keyword.trim() && !config.keywords.includes(keyword.trim())) {
            setConfig({
                ...config,
                keywords: [...config.keywords, keyword.trim()]
            });
            setHasChanges(true);
        }
    };

    const handleKeywordRemove = (keyword: string) => {
        setConfig({
            ...config,
            keywords: config.keywords.filter(k => k !== keyword)
        });
        setHasChanges(true);
    };

    const handleSensitivityChange = (value: number) => {
        setConfig({
            ...config,
            sensitivity: value
        });
        setHasChanges(true);
    };

    const handleSave = () => {
        saveCustomPrompts(userType, config);
        setHasChanges(false);
        alert('✅ ההגדרות נשמרו בהצלחה!');
    };

    const handleReset = () => {
        if (confirm('האם אתה בטוח שברצונך לאפס למצב ברירת המחדל?')) {
            const defaults = resetToDefaults(userType);
            setConfig(defaults);
            setHasChanges(false);
        }
    };

    const handleResetSection = () => {
        const defaults = getDefaultPrompts(userType);
        setConfig({
            ...config,
            sections: {
                ...config.sections,
                [activeTab]: defaults.sections[activeTab]
            }
        });
        setHasChanges(true);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-800 via-cyan-900 to-blue-900 p-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-3xl shadow-2xl p-6 mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">⚙️ ניהול פרומפטים</h1>
                    <p className="text-gray-600">התאם את הפרומפטים לצרכים המיוחדים שלך</p>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Panel - Tabs and Editor */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Tab Navigation */}
                        <div className="bg-white rounded-2xl shadow-xl p-2 flex gap-2 overflow-x-auto">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                    flex-1 min-w-[140px] py-3 px-4 rounded-xl font-semibold transition-all
                    ${activeTab === tab.id
                                            ? 'bg-gradient-to-l from-cyan-500 to-orange-500 text-white shadow-lg scale-105'
                                            : 'text-gray-600 hover:bg-gray-100'
                                        }
                  `}
                                >
                                    <span className="block text-xl mb-1">{tab.icon}</span>
                                    <span className="text-sm">{tab.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Text Editor */}
                        <div className="bg-white rounded-2xl shadow-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-800">
                                    {tabs.find(t => t.id === activeTab)?.label}
                                </h2>
                                <button
                                    onClick={handleResetSection}
                                    className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                                >
                                    🔄 אפס סעיף זה
                                </button>
                            </div>
                            <textarea
                                value={config.sections[activeTab]}
                                onChange={(e) => handleTextChange(activeTab, e.target.value)}
                                className="w-full h-64 p-4 border-2 border-gray-200 rounded-xl focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 outline-none resize-none font-sans text-gray-700 leading-relaxed"
                                dir="rtl"
                                placeholder="הזן את הפרומפט..."
                            />
                        </div>
                    </div>

                    {/* Right Panel - Settings */}
                    <div className="space-y-6">
                        {/* Keywords */}
                        <div className="bg-white rounded-2xl shadow-xl p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">🔑 מילות מפתח</h3>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {config.keywords.map((keyword, index) => (
                                    <span
                                        key={index}
                                        className="flex items-center gap-2 px-3 py-1 bg-cyan100 text-cyan-700 rounded-full text-sm"
                                    >
                                        {keyword}
                                        <button
                                            onClick={() => handleKeywordRemove(keyword)}
                                            className="hover:text-red-600"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <input
                                type="text"
                                placeholder="הוסף מילת מפתח..."
                                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-cyan-500 outline-none"
                                dir="rtl"
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        handleKeywordAdd(e.currentTarget.value);
                                        e.currentTarget.value = '';
                                    }
                                }}
                            />
                        </div>

                        {/* Sensitivity */}
                        <div className="bg-white rounded-2xl shadow-xl p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">📊 רמת רגישות</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">רמה נוכחית:</span>
                                    <span className="text-2xl font-bold text-cyan-600">{config.sensitivity}</span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="10"
                                    value={config.sensitivity}
                                    onChange={(e) => handleSensitivityChange(Number(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                />
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>נמוכה (1)</span>
                                    <span>גבוהה (10)</span>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <button
                                onClick={handleSave}
                                disabled={!hasChanges}
                                className={`
                  w-full py-4 px-6 rounded-xl font-bold text-lg transition-all shadow-lg
                  ${hasChanges
                                        ? 'bg-gradient-to-l from-cyan-500 to-orange-500 text-white hover:from-cyan-600 hover:to-orange-600 hover:scale-105'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }
                `}
                            >
                                {hasChanges ? '💾 שמור שינויים' : '✓ הכל שמור'}
                            </button>

                            <button
                                onClick={handleReset}
                                className="w-full py-3 px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-colors"
                            >
                                🔄 אפס הכל לברירת מחדל
                            </button>

                            <button
                                onClick={() => window.location.href = '/'}
                                className="w-full py-3 px-6 bg-white border-2 border-gray-300 hover:border-cyan-500 text-gray-700 rounded-xl font-semibold transition-colors"
                            >
                                ← חזור לדף הבית
                            </button>
                        </div>

                        {/* Info */}
                        {config.lastUpdated && (
                            <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4">
                                <p className="text-sm text-cyan-700">
                                    <strong>עדכון אחרון:</strong><br />
                                    {new Date(config.lastUpdated).toLocaleString('he-IL')}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
