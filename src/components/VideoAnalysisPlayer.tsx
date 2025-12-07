import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuickAnalysisTimelineEvent } from '@/lib/gemini';

interface VideoAnalysisPlayerProps {
    videoUrl: string;
    timeline: QuickAnalysisTimelineEvent[];
}

export default function VideoAnalysisPlayer({ videoUrl, timeline }: VideoAnalysisPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [hoveredEvent, setHoveredEvent] = useState<QuickAnalysisTimelineEvent | null>(null);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [prevVolume, setPrevVolume] = useState(1);

    // Convert "MM:SS" or "HH:MM:SS" or "MM:SS-MM:SS" to seconds
    const parseTimestamp = (timestamp: string) => {
        if (!timestamp) return 0;

        // Handle ranges (take start time)
        const startTime = timestamp.split('-')[0].trim();

        const parts = startTime.split(':').map(Number);
        if (parts.length === 3) {
            return parts[0] * 3600 + parts[1] * 60 + parts[2];
        }
        if (parts.length === 2) {
            return parts[0] * 60 + parts[1];
        }
        return 0;
    };

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = Number(e.target.value);
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = Number(e.target.value);
        setVolume(newVolume);
        setIsMuted(newVolume === 0);
        if (videoRef.current) {
            videoRef.current.volume = newVolume;
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            if (isMuted) {
                videoRef.current.volume = prevVolume;
                setVolume(prevVolume);
                setIsMuted(false);
            } else {
                setPrevVolume(volume);
                videoRef.current.volume = 0;
                setVolume(0);
                setIsMuted(true);
            }
        }
    };

    const jumpToTime = (timestamp: string) => {
        const seconds = parseTimestamp(timestamp);
        if (videoRef.current) {
            videoRef.current.currentTime = seconds;
            setCurrentTime(seconds);
            if (!isPlaying) {
                videoRef.current.play();
                setIsPlaying(true);
            }
        }
    };

    const getSafetyColor = (level: string) => {
        switch (level) {
            case 'safe': return 'bg-green-500';
            case 'caution': return 'bg-yellow-500';
            case 'danger': return 'bg-red-500';
            default: return 'bg-gray-400';
        }
    };

    const getSafetyColorText = (level: string) => {
        switch (level) {
            case 'safe': return 'text-green-600';
            case 'caution': return 'text-yellow-600';
            case 'danger': return 'text-red-600';
            default: return 'text-gray-600';
        }
    };

    return (
        <div className="bg-black rounded-3xl overflow-hidden shadow-2xl border border-gray-800" dir="rtl">
            {/* Video Player */}
            <div className="relative aspect-video bg-gray-900 group">
                <video
                    ref={videoRef}
                    src={videoUrl}
                    className="w-full h-full object-contain"
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onClick={togglePlay}
                />

                {/* Overlay Controls (Play/Pause Center) */}
                {!isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer" onClick={togglePlay}>
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                            <span className="text-4xl text-white ml-2">▶</span>
                        </div>
                    </div>
                )}

                {/* Bottom Controls Bar */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity z-30">
                    <div className="flex items-center gap-4 flex-row-reverse">

                        {/* Volume Control (Now First/Rightmost) - Extended hover area */}
                        <div className="relative flex items-center justify-center group/vol w-10 pb-12">
                            <button
                                onClick={toggleMute}
                                className="text-white hover:text-cyan-400 transition-colors z-20 text-xl absolute bottom-0 left-1/2 -translate-x-1/2"
                            >
                                {isMuted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
                            </button>

                            {/* Vertical Slider Popup */}
                            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-10 h-24 bg-gray-900/95 rounded-xl flex items-end justify-center pb-3 opacity-0 group-hover/vol:opacity-100 transition-all duration-300 pointer-events-none group-hover/vol:pointer-events-auto border border-gray-700 shadow-2xl">
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={volume}
                                    onChange={handleVolumeChange}
                                    className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-cyan-500 -rotate-90 mb-8"
                                />
                            </div>
                        </div>

                        <button onClick={togglePlay} className="text-white hover:text-cyan-400 transition-colors text-xl">
                            {isPlaying ? '⏸' : '▶'}
                        </button>

                        <span className="text-white text-sm font-mono min-w-[100px] text-center" dir="ltr">
                            {new Date(currentTime * 1000).toISOString().substr(14, 5)} / {new Date((duration || 0) * 1000).toISOString().substr(14, 5)}
                        </span>

                        <input
                            type="range"
                            min="0"
                            max={duration || 100}
                            value={currentTime}
                            onChange={handleSeek}
                            className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-cyan-500 rotate-180"
                        />
                    </div>
                </div>
            </div>

            {/* Interactive Timeline */}
            <div className="bg-gray-900 p-6">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <span>⏱️</span> ציר זמן אירועים ורגשות
                </h3>

                <div className="relative h-16 bg-gray-800 rounded-xl mb-2 cursor-pointer group rotate-180">
                    {/* Background Track */}
                    <div className="absolute inset-x-0 top-1/2 h-1 bg-gray-700 -translate-y-1/2 rounded-full mx-4" />

                    {/* Current Time Indicator */}
                    <motion.div
                        className="absolute top-0 bottom-0 w-0.5 bg-cyan-500 z-10"
                        style={{ right: `${(currentTime / duration) * 100}%` }}
                        animate={{ right: `${(currentTime / duration) * 100}%` }}
                        transition={{ type: 'tween', ease: 'linear', duration: 0.1 }}
                    />

                    {/* Events */}
                    {timeline.map((event, index) => {
                        const eventTime = parseTimestamp(event.timestamp);
                        const position = (eventTime / (duration || 1)) * 100;

                        return (
                            <div
                                key={index}
                                className="absolute top-1/2 -translate-y-1/2 group"
                                style={{ right: `${position}%` }}
                                onMouseEnter={() => setHoveredEvent(event)}
                                onMouseLeave={() => setHoveredEvent(null)}
                                onClick={() => jumpToTime(event.timestamp)}
                            >
                                {/* Event Dot */}
                                <motion.div
                                    whileHover={{ scale: 1.5 }}
                                    className={`w-4 h-4 rounded-full border-2 border-gray-900 ${getSafetyColor(event.safety_level)} cursor-pointer shadow-lg relative z-20`}
                                />
                            </div>
                        );
                    })}
                </div>

                {/* Event Details Panel */}
                <div className="h-24 mt-2">
                    <AnimatePresence mode="wait">
                        {hoveredEvent ? (
                            <motion.div
                                key="details"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="bg-gray-800 rounded-xl p-3 border border-gray-700 flex items-center justify-between"
                            >
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`font-bold text-lg ${getSafetyColorText(hoveredEvent.safety_level)}`}>
                                            {hoveredEvent.timestamp}
                                        </span>
                                        <span className="text-white font-medium">{hoveredEvent.description}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-400">ציון רגשי:</span>
                                        <div className="flex gap-0.5">
                                            {[...Array(10)].map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`w-1.5 h-3 rounded-sm ${i < hoveredEvent.emotion_score ? getSafetyColor(hoveredEvent.safety_level) : 'bg-gray-700'}`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-xs text-gray-400 ml-1">({hoveredEvent.emotion_score}/10)</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => jumpToTime(hoveredEvent.timestamp)}
                                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-cyan-400 rounded-lg text-sm font-bold transition-colors"
                                >
                                    נגן ▶
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center justify-center h-full text-gray-500 text-sm"
                            >
                                ריחף מעל נקודה בציר הזמן לפרטים
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
