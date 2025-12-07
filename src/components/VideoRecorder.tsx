'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface VideoRecorderProps {
    onRecordingComplete: (file: File) => void;
    onCancel: () => void;
}

export default function VideoRecorder({ onRecordingComplete, onCancel }: VideoRecorderProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        startCamera();
        return () => {
            isMounted.current = false;
            stopCamera();
        };
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRecording) {
            interval = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                },
                audio: true
            });

            // Check if component is still mounted
            if (!isMounted.current) {
                mediaStream.getTracks().forEach(track => track.stop());
                return;
            }

            setStream(mediaStream);
            streamRef.current = mediaStream;

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setError(null);
        } catch (err) {
            if (!isMounted.current) return;
            console.error('Error accessing camera:', err);
            setError('לא ניתן לגשת למצלמה. אנא ודא שיש לך הרשאות.');
        }
    };

    const stopCamera = () => {
        const currentStream = streamRef.current;
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
            setStream(null);
            streamRef.current = null;
        }
    };

    const startRecording = () => {
        if (!stream) return;

        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                chunksRef.current.push(e.data);
            }
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'video/mp4' });
            const file = new File([blob], `recording_${Date.now()}.mp4`, { type: 'video/mp4' });
            onRecordingComplete(file);
        };

        mediaRecorder.start();
        setIsRecording(true);
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center sm:p-4">
            <div className="w-full max-w-4xl bg-gray-900 rounded-none sm:rounded-3xl overflow-hidden shadow-2xl relative h-full sm:h-auto flex flex-col sm:block">
                {/* Header */}
                <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/50 to-transparent z-10 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                        <span className="text-white font-mono text-lg">{formatTime(recordingTime)}</span>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-2 bg-black/30 hover:bg-black/50 rounded-full text-white transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Video Preview */}
                <div className="relative flex-1 bg-black flex items-center justify-center">
                    {error ? (
                        <div className="absolute inset-0 flex items-center justify-center text-red-400 p-4 text-center">
                            {error}
                        </div>
                    ) : (
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-cover transform scale-x-[-1]"
                        />
                    )}
                </div>

                {/* Controls */}
                <div className="p-4 sm:p-8 bg-gray-800 flex justify-center items-center gap-8 shrink-0 relative z-20">
                    {!isRecording ? (
                        <button
                            onClick={startRecording}
                            disabled={!!error}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-white flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-500 rounded-full"></div>
                        </button>
                    ) : (
                        <button
                            onClick={stopRecording}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-white flex items-center justify-center hover:scale-105 transition-transform"
                        >
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-500 rounded-md"></div>
                        </button>
                    )}
                </div>

                <div className="absolute bottom-20 sm:bottom-24 left-0 right-0 text-center pointer-events-none z-10">
                    <p className="text-white/70 text-xs sm:text-sm bg-black/30 inline-block px-3 py-1 rounded-full backdrop-blur-sm mx-2">
                        {isRecording ? 'מקליט... לחץ על הריבוע לעצירה' : 'לחץ על העיגול האדום להתחלת הקלטה'}
                    </p>
                </div>
            </div>
        </div>
    );
}
