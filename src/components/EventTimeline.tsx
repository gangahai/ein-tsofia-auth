'use client';

import { TimelineEvent } from '@/lib/gemini';
import { motion } from 'framer-motion';

interface EventTimelineProps {
    events: TimelineEvent[];
}

export default function EventTimeline({ events }: EventTimelineProps) {
    if (!events || events.length === 0) {
        return (
            <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-8 text-center">
                <p className="text-gray-600">אין אירועים לתצוגה</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">⏱️ ציר זמן אינטראקטיבי</h3>

            <div className="relative">
                {/* Timeline line */}
                <div className="absolute right-8 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 to-orange-500"></div>

                {/* Events */}
                <div className="space-y-6">
                    {events.map((event, index) => {
                        // Determine color based on stress/warmth
                        let bgColor = 'bg-blue-50';
                        let borderColor = 'border-blue-300';
                        let dotColor = 'bg-blue-500';

                        if (event.stress_level && event.stress_level > 7) {
                            bgColor = 'bg-red-50';
                            borderColor = 'border-red-300';
                            dotColor = 'bg-red-500';
                        } else if (event.warmth_level && event.warmth_level > 7) {
                            bgColor = 'bg-green-50';
                            borderColor = 'border-green-300';
                            dotColor = 'bg-green-500';
                        } else if (event.stress_level && event.stress_level > 4) {
                            bgColor = 'bg-yellow-50';
                            borderColor = 'border-yellow-300';
                            dotColor = 'bg-yellow-500';
                        }

                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="relative"
                            >
                                {/* Timeline dot */}
                                <div className={`absolute right-6 w-5 h-5 rounded-full ${dotColor} border-4 border-white shadow-lg z-10`}></div>

                                {/* Event card */}
                                <div className={`mr-16 ${bgColor} border-2 ${borderColor} rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-sm font-bold text-cyan-700">{event.timestamp}</span>
                                        {event.participant && (
                                            <span className="text-xs bg-white px-2 py-1 rounded-full">
                                                {event.participant}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-gray-800 font-medium" dir="rtl">{event.event}</p>

                                    {/* Indicators */}
                                    <div className="flex gap-4 mt-3">
                                        {event.stress_level !== undefined && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-600">מתח:</span>
                                                <div className="flex gap-1">
                                                    {[...Array(10)].map((_, i) => (
                                                        <div
                                                            key={i}
                                                            className={`w-2 h-4 rounded ${i < event.stress_level!
                                                                    ? 'bg-red-500'
                                                                    : 'bg-gray-200'
                                                                }`}
                                                        ></div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {event.warmth_level !== undefined && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-600">חום:</span>
                                                <div className="flex gap-1">
                                                    {[...Array(10)].map((_, i) => (
                                                        <div
                                                            key={i}
                                                            className={`w-2 h-4 rounded ${i < event.warmth_level!
                                                                    ? 'bg-green-500'
                                                                    : 'bg-gray-200'
                                                                }`}
                                                        ></div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
