'use client';

import { useState, useEffect } from 'react';
import { Reorder, motion, AnimatePresence } from 'framer-motion';
import { AnalysisResult } from '@/lib/gemini';
import EmotionTimelineChart from './EmotionTimelineChart';
import { EmmaChatTile } from './EmmaChatTile';

interface DraggableDashboardProps {
    result: AnalysisResult;
    currentUserType: string;
}

interface Widget {
    id: string;
    title: string;
    type: 'emotion_graph' | 'emma_chat';
    height: number;
}

const AVAILABLE_WIDGETS: Widget[] = [
    { id: 'emotion_graph', title: 'גרף רגשות', type: 'emotion_graph', height: 400 },
    { id: 'emma_chat', title: 'העוזרת אמה', type: 'emma_chat', height: 500 },
];

export default function DraggableDashboard({ result, currentUserType }: DraggableDashboardProps) {
    const [widgets, setWidgets] = useState<Widget[]>([
        { id: 'emotion_graph_1', title: 'גרף רגשות', type: 'emotion_graph', height: 400 },
        { id: 'emma_chat_1', title: 'העוזרת אמה', type: 'emma_chat', height: 500 },
    ]);
    const [isBankOpen, setIsBankOpen] = useState(false);

    // Load layout from local storage
    useEffect(() => {
        const savedLayout = localStorage.getItem(`dashboardLayout_${currentUserType}`);
        if (savedLayout) {
            setWidgets(JSON.parse(savedLayout));
        }
    }, [currentUserType]);

    // Save layout to local storage
    useEffect(() => {
        localStorage.setItem(`dashboardLayout_${currentUserType}`, JSON.stringify(widgets));
    }, [widgets, currentUserType]);

    const addWidget = (type: 'emotion_graph' | 'emma_chat') => {
        const newWidget: Widget = {
            id: `${type}_${Date.now()}`,
            title: type === 'emotion_graph' ? 'גרף רגשות' : 'העוזרת אמה',
            type,
            height: type === 'emotion_graph' ? 400 : 500
        };
        setWidgets([...widgets, newWidget]);
        setIsBankOpen(false);
    };

    const removeWidget = (id: string) => {
        setWidgets(widgets.filter(w => w.id !== id));
    };

    const renderWidgetContent = (widget: Widget) => {
        switch (widget.type) {
            case 'emotion_graph':
                return result.emotion_timeline && result.emotion_timeline.length > 0 ? (
                    <EmotionTimelineChart data={result.emotion_timeline} />
                ) : <div className="text-gray-400 text-center p-4">אין נתונים לגרף רגשות</div>;
            case 'emma_chat':
                return <EmmaChatTile analysisResult={result} />;
            default:
                return null;
        }
    };

    return (
        <div className="relative min-h-[500px]">
            {/* Toolbar */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">🛠️ לוח עבודה אישי</h2>
                <button
                    onClick={() => setIsBankOpen(!isBankOpen)}
                    className="px-4 py-2 bg-cyan-600 text-white rounded-xl font-bold hover:bg-cyan-700 transition-all shadow-md flex items-center gap-2"
                >
                    {isBankOpen ? 'סגור בנק' : '➕ הוסף חלון'}
                </button>
            </div>

            {/* Widget Bank Drawer */}
            <AnimatePresence>
                {isBankOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-gray-100 rounded-2xl p-4 mb-6 overflow-hidden border border-gray-200"
                    >
                        <h3 className="font-bold text-gray-700 mb-3">בחר חלון להוספה:</h3>
                        <div className="flex gap-4">
                            {AVAILABLE_WIDGETS.map(w => (
                                <button
                                    key={w.id}
                                    onClick={() => addWidget(w.type)}
                                    className="flex-1 bg-white p-4 rounded-xl shadow-sm hover:shadow-md border border-gray-200 transition-all text-center group"
                                >
                                    <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                                        {w.type === 'emotion_graph' ? '📈' : '👩‍💼'}
                                    </div>
                                    <span className="font-bold text-gray-700">{w.title}</span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Draggable Area */}
            <Reorder.Group axis="y" values={widgets} onReorder={setWidgets} className="space-y-6">
                {widgets.map((widget) => (
                    <Reorder.Item key={widget.id} value={widget} dragListener={true}>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative group">
                            {/* Drag Handle & Header */}
                            <div className="bg-gray-50 p-3 flex justify-between items-center border-b border-gray-100 cursor-grab active:cursor-grabbing">
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-400">⋮⋮</span>
                                    <h3 className="font-bold text-gray-700">{widget.title}</h3>
                                </div>
                                <button
                                    onClick={() => removeWidget(widget.id)}
                                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                    title="הסר חלון"
                                >
                                    🗑️
                                </button>
                            </div>

                            {/* Content */}
                            <div style={{ height: widget.height }} className="p-4">
                                {renderWidgetContent(widget)}
                            </div>
                        </div>
                    </Reorder.Item>
                ))}
            </Reorder.Group>

            {widgets.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-3xl">
                    <p className="text-gray-500 text-lg mb-4">הלוח ריק</p>
                    <button
                        onClick={() => setIsBankOpen(true)}
                        className="text-cyan-600 font-bold hover:underline"
                    >
                        לחץ כאן להוספת חלונות
                    </button>
                </div>
            )}
        </div>
    );
}
