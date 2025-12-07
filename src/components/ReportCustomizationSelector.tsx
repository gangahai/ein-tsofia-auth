import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type ReportTileType =
    | 'video_player'
    | 'case_description'
    | 'participants'
    | 'recommendations'
    | 'emotion_graph'
    | 'heatmap'
    | 'intervention_plan'
    | 'emma_chat';

interface ReportCustomizationSelectorProps {
    onComplete: (selectedTiles: ReportTileType[]) => void;
    initialSelection?: ReportTileType[];
    onCancel?: () => void;
}

const AVAILABLE_TILES: { id: ReportTileType; title: string; icon: string; description: string; previewColor: string }[] = [
    {
        id: 'video_player',
        title: 'נגן וידאו חכם',
        icon: '🎬',
        description: 'נגן וידאו עם ציר זמן אינטראקטיבי, התראות בטיחות וציוני רגש.',
        previewColor: 'bg-gray-900'
    },
    {
        id: 'case_description',
        title: 'תיאור אירוע',
        icon: '📝',
        description: 'סיכום מילולי מקיף של הסיטואציה, הסביבה וההתרחשויות.',
        previewColor: 'bg-purple-100'
    },
    {
        id: 'participants',
        title: 'זיהוי משתתפים',
        icon: '👥',
        description: 'רשימת המשתתפים שזוהו, תפקידים, גילאים ומאפיינים.',
        previewColor: 'bg-cyan-100'
    },
    {
        id: 'recommendations',
        title: 'המלצות לפעולה',
        icon: '💡',
        description: '3 המלצות פרקטיות ומיידיות לטיפול או שימור המצב.',
        previewColor: 'bg-yellow-100'
    },
    {
        id: 'emotion_graph',
        title: 'גרף רגשות',
        icon: '📈',
        description: 'תרשים המציג את השינוי ברגשות המשתתפים לאורך זמן.',
        previewColor: 'bg-blue-50'
    },
    {
        id: 'heatmap',
        title: 'מפת אינטראקציות',
        icon: '🔥',
        description: 'ויזואליזציה של הקשרים והדינמיקה בין המשתתפים.',
        previewColor: 'bg-red-50'
    },
    {
        id: 'intervention_plan',
        title: 'תוכנית התערבות',
        icon: '📋',
        description: 'תוכנית עבודה מסודרת ומובנית (בדומה לדוח בזק).',
        previewColor: 'bg-green-50'
    },
    {
        id: 'emma_chat',
        title: 'שיח עם אמה',
        icon: '👩‍💼',
        description: 'צ\'אט אינטראקטיבי עם העוזרת החכמה לניתוח מעמיק.',
        previewColor: 'bg-indigo-50'
    }
];

export default function ReportCustomizationSelector({ onComplete, initialSelection, onCancel }: ReportCustomizationSelectorProps) {
    const [selected, setSelected] = useState<ReportTileType[]>(initialSelection || AVAILABLE_TILES.map(t => t.id));
    const [hoveredTile, setHoveredTile] = useState<string | null>(null);

    const toggleTile = (id: ReportTileType) => {
        if (selected.includes(id)) {
            setSelected(selected.filter(item => item !== id));
        } else {
            setSelected([...selected, id]);
        }
    };

    const handleSelectAll = () => {
        if (selected.length === AVAILABLE_TILES.length) {
            setSelected([]);
        } else {
            setSelected(AVAILABLE_TILES.map(t => t.id));
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 shadow-xl max-w-5xl mx-auto"
        >
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">🛠️ הרכבת דוח מותאם אישית</h2>
                <p className="text-gray-600">בחר את הרכיבים שברצונך לכלול בדוח הניתוח. תוכל לשנות זאת גם בהמשך.</p>
            </div>

            <div className="flex gap-8">
                {/* Selection Grid */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {AVAILABLE_TILES.map((tile) => (
                        <motion.div
                            key={tile.id}
                            onMouseEnter={() => setHoveredTile(tile.id)}
                            onMouseLeave={() => setHoveredTile(null)}
                            onClick={() => toggleTile(tile.id)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`
                                p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4
                                ${selected.includes(tile.id)
                                    ? 'border-cyan-500 bg-cyan-50 shadow-md'
                                    : 'border-gray-200 bg-white hover:border-cyan-300'}
                            `}
                        >
                            <div className={`
                                w-6 h-6 rounded flex items-center justify-center border transition-colors
                                ${selected.includes(tile.id) ? 'bg-cyan-500 border-cyan-500 text-white' : 'border-gray-300 bg-white'}
                            `}>
                                {selected.includes(tile.id) && '✓'}
                            </div>
                            <div className="text-2xl">{tile.icon}</div>
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-800">{tile.title}</h3>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Preview Panel */}
                <div className="w-80 hidden md:block">
                    <div className="sticky top-4 bg-gray-50 rounded-2xl p-6 border border-gray-200 h-[500px] flex flex-col items-center justify-center text-center transition-all duration-300">
                        <AnimatePresence mode="wait">
                            {hoveredTile ? (
                                <motion.div
                                    key={hoveredTile}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="w-full h-full flex flex-col items-center"
                                >
                                    <div className="text-6xl mb-6">{AVAILABLE_TILES.find(t => t.id === hoveredTile)?.icon}</div>
                                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                                        {AVAILABLE_TILES.find(t => t.id === hoveredTile)?.title}
                                    </h3>
                                    <p className="text-gray-600 mb-6">
                                        {AVAILABLE_TILES.find(t => t.id === hoveredTile)?.description}
                                    </p>

                                    {/* Abstract Visual Representation */}
                                    <div className={`w-full h-32 rounded-lg shadow-inner ${AVAILABLE_TILES.find(t => t.id === hoveredTile)?.previewColor} flex items-center justify-center opacity-80`}>
                                        <span className="text-xs text-gray-500 font-mono">תצוגה מקדימה</span>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="default"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-gray-400"
                                >
                                    <div className="text-6xl mb-4">👆</div>
                                    <p>רחף מעל אפשרות<br />כדי לראות הסבר</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex justify-between items-center pt-6 border-t border-gray-100">
                <button
                    onClick={handleSelectAll}
                    className="text-gray-500 hover:text-cyan-600 font-medium text-sm underline"
                >
                    {selected.length === AVAILABLE_TILES.length ? 'נקה הכל' : 'בחר הכל'}
                </button>

                <div className="flex gap-4">
                    {onCancel && (
                        <button
                            onClick={onCancel}
                            className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            ביטול
                        </button>
                    )}
                    <button
                        onClick={() => onComplete(selected)}
                        disabled={selected.length === 0}
                        className={`
                            px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all
                            ${selected.length > 0
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 hover:scale-105'
                                : 'bg-gray-300 cursor-not-allowed'}
                        `}
                    >
                        המשך לניתוח ({selected.length} רכיבים)
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
