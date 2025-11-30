'use client';

import { motion } from 'framer-motion';
import { Participant } from '@/lib/gemini';

export interface EmotionPoint {
    timestamp: string; // "MM:SS"
    timestampSeconds: number; // For plotting
    participantId: string;
    participantName: string;
    emotionLevel: number; // 1-5
    event?: string; // What happened at this moment
}

interface EmotionGraphProps {
    emotionTimeline: EmotionPoint[];
    participants: Participant[];
    onPointClick?: (point: EmotionPoint) => void;
}

const COLORS = [
    '#4F46E5', // indigo
    '#0891B2', // cyan
    '#DC2626', // red
    '#059669', // green
    '#7C3AED', // purple
    '#EA580C', // orange
];

export default function EmotionGraph({ emotionTimeline, participants, onPointClick }: EmotionGraphProps) {
    if (emotionTimeline.length === 0) {
        return (
            <div className="bg-white rounded-3xl p-12 text-center">
                <p className="text-gray-500">אין נתונים להצגה</p>
            </div>
        );
    }

    // Get min/max timestamp for scaling
    const maxSeconds = Math.max(...emotionTimeline.map(p => p.timestampSeconds));
    const timelineWidth = 800; // pixels

    // Group by participant
    const byParticipant = participants.map((participant, index) => ({
        participant,
        points: emotionTimeline.filter(p => p.participantId === participant.id),
        color: COLORS[index % COLORS.length]
    }));

    // Identify anomalies (emotion < 2)
    const anomalies = emotionTimeline.filter(p => p.emotionLevel < 2);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-8"
        >
            <h2 className="text-3xl font-bold text-gray-800 mb-6">📊 גרף רגשות</h2>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mb-8">
                {byParticipant.map(({ participant, color }) => (
                    <div key={participant.id} className="flex items-center gap-2">
                        <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: color }}
                        />
                        <span className="text-sm font-semibold text-gray-700">
                            {participant.name}
                        </span>
                    </div>
                ))}
            </div>

            {/* Graph Container */}
            <div className="relative border-2 border-gray-200 rounded-2xl p-6 overflow-x-auto">
                {/* Y-axis labels (Emotion Level) */}
                <div className="absolute right-0 top-6 h-64 flex flex-col justify-between text-sm text-gray-500 pr-2">
                    <span>5 😊</span>
                    <span>4</span>
                    <span>3 😐</span>
                    <span>2</span>
                    <span>1 😢</span>
                </div>

                {/* Graph area */}
                <div className="mr-16 relative h-64" style={{ width: timelineWidth }}>
                    {/* Horizontal gridlines */}
                    {[1, 2, 3, 4, 5].map(level => (
                        <div
                            key={level}
                            className="absolute w-full border-t border-gray-100"
                            style={{
                                bottom: `${((level - 1) / 4) * 100}%`,
                                opacity: level === 2 ? 0.5 : 0.2 // Highlight threshold
                            }}
                        />
                    ))}

                    {/* Anomaly zone (below 2) */}
                    <div
                        className="absolute w-full bg-red-50 border-t-2 border-red-300"
                        style={{
                            height: '25%',
                            bottom: 0
                        }}
                    >
                        <span className="text-xs text-red-600 font-bold absolute top-1 right-2">
                            אזור חריג
                        </span>
                    </div>

                    {/* Plot lines and points for each participant */}
                    {byParticipant.map(({ participant, points, color }) => {
                        if (points.length === 0) return null;

                        return (
                            <svg
                                key={participant.id}
                                className="absolute top-0 left-0 w-full h-full pointer-events-none"
                                style={{ overflow: 'visible' }}
                            >
                                {/* Line connecting points */}
                                <polyline
                                    points={points
                                        .map(p => {
                                            const x = (p.timestampSeconds / maxSeconds) * timelineWidth;
                                            const y = 256 - ((p.emotionLevel - 1) / 4) * 256;
                                            return `${x},${y}`;
                                        })
                                        .join(' ')}
                                    fill="none"
                                    stroke={color}
                                    strokeWidth="3"
                                    opacity="0.6"
                                />

                                {/* Points */}
                                {points.map((point, i) => {
                                    const x = (point.timestampSeconds / maxSeconds) * timelineWidth;
                                    const y = 256 - ((point.emotionLevel - 1) / 4) * 256;
                                    const isAnomaly = point.emotionLevel < 2;

                                    return (
                                        <g key={i}>
                                            <circle
                                                cx={x}
                                                cy={y}
                                                r={isAnomaly ? 8 : 6}
                                                fill={color}
                                                stroke="white"
                                                strokeWidth="2"
                                                className="pointer-events-auto cursor-pointer hover:r-10 transition-all"
                                                onClick={() => onPointClick?.(point)}
                                                style={{ pointerEvents: 'auto' }}
                                            />
                                            {isAnomaly && (
                                                <text
                                                    x={x}
                                                    y={y - 15}
                                                    textAnchor="middle"
                                                    fontSize="20"
                                                >
                                                    ⚠️
                                                </text>
                                            )}
                                        </g>
                                    );
                                })}
                            </svg>
                        );
                    })}
                </div>

                {/* X-axis (Timeline) */}
                <div className="mr-16 mt-4 relative h-8" style={{ width: timelineWidth }}>
                    {/* Time markers */}
                    {emotionTimeline
                        .filter((_, i) => i % Math.ceil(emotionTimeline.length / 10) === 0)
                        .map((point, i) => (
                            <div
                                key={i}
                                className="absolute text-xs text-gray-500"
                                style={{
                                    left: `${(point.timestampSeconds / maxSeconds) * 100}%`,
                                    transform: 'translateX(-50%)'
                                }}
                            >
                                {point.timestamp}
                            </div>
                        ))}
                </div>
            </div>

            {/* Anomalies Summary */}
            {anomalies.length > 0 && (
                <div className="mt-6 bg-red-50 border-2 border-red-200 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-red-800 mb-4 flex items-center gap-2">
                        ⚠️ אירועים חריגים שזוהו ({anomalies.length})
                    </h3>
                    <div className="space-y-3">
                        {anomalies.map((anomaly, i) => (
                            <div key={i} className="bg-white rounded-xl p-4 border border-red-200">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-bold text-gray-800">
                                        {anomaly.participantName} - {anomaly.timestamp}
                                    </span>
                                    <span className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded-full">
                                        רגש: {anomaly.emotionLevel}/5
                                    </span>
                                </div>
                                {anomaly.event && (
                                    <p className="text-gray-700 text-sm">{anomaly.event}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Instructions */}
            <div className="mt-4 text-sm text-gray-500 text-center">
                💡 לחץ על נקודה בגרף לראות פרטים נוספים
            </div>
        </motion.div>
    );
}
