'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { analysisService } from '@/lib/analysisService';
import { useAuth } from '@/components/AuthProvider';

interface FeedbackComponentProps {
    section: string;
    userId?: string; // Optional, falls back to auth context
    contextData?: string; // Optional text context for the feedback
}

export default function FeedbackComponent({ section, userId: propUserId, contextData }: FeedbackComponentProps) {
    const { user } = useAuth();
    const userId = propUserId || user?.uid;

    const [rating, setRating] = useState<'good' | 'bad' | null>(null);
    const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
    const [comment, setComment] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [isHoveringGood, setIsHoveringGood] = useState(false);
    const [isHoveringBad, setIsHoveringBad] = useState(false);

    const reasons = [
        { id: 'inaccurate', label: 'תשובה לא תואמת למתרחש' },
        { id: 'verbose', label: 'חופר מידי' },
        { id: 'bad_recommendation', label: 'המלצה לא טובה' },
        { id: 'other', label: 'רשום הערה' }
    ];

    const toggleReason = (reasonLabel: string) => {
        setSelectedReasons(prev =>
            prev.includes(reasonLabel)
                ? prev.filter(r => r !== reasonLabel)
                : [...prev, reasonLabel]
        );
    };

    const submitFeedback = async (
        rateVal: 'good' | 'bad',
        reasonsVal: string[],
        commentVal: string
    ) => {
        if (!userId) return;

        // Optimistic update: Lock immediately
        setSubmitted(true);
        setIsLocked(true);

        try {
            await analysisService.logFeedback({
                userId,
                section,
                rating: rateVal,
                reasons: reasonsVal,
                comment: commentVal,
                contextData
            });
        } catch (err) {
            console.error('❌ Error in logFeedback:', err);
            // Optional: Revert lock on error? 
            // For feedback, it's better to just let it be "submitted" even if it failed silently,
            // rather than annoying the user to try again.
        }
    };

    const handleRate = (value: 'good' | 'bad') => {
        if (isLocked) return; // Prevent changes if locked

        if (rating === value) {
            setRating(null); // Allow deselect
            setSubmitted(false);
        } else {
            setRating(value);
            if (value === 'good') {
                submitFeedback(value, [], '');
            }
        }
    };

    const handleSubmitBad = () => {
        submitFeedback('bad', selectedReasons, comment);
        // setRating(null); // Don't reset rating, keep it visible as selected
    };

    if (submitted && rating === 'good') {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-left py-2 text-green-600 font-bold text-sm pl-4"
            >
                תודה! 🙏
            </motion.div>
        );
    }

    return (
        <div className="flex justify-end gap-1.5 mt-2 opacity-60 hover:opacity-100 transition-opacity">
            {/* Bad Button */}
            <div className="relative group/bad">
                <motion.button
                    whileHover={!isLocked ? { scale: 1.1 } : {}}
                    whileTap={!isLocked ? { scale: 0.9 } : {}}
                    onClick={() => handleRate('bad')}
                    disabled={isLocked}
                    className={`w-6 h-6 flex items-center justify-center rounded-full shadow-sm border border-gray-100 transition-all ${rating === 'bad' ? 'bg-red-100 text-red-600' : isLocked ? 'bg-gray-50 text-gray-300 cursor-default' : 'bg-white hover:bg-gray-50 text-gray-400'}`}
                >
                    <span className="text-xs">👎</span>
                </motion.button>

                {/* Tooltip */}
                {!rating && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 py-0.5 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover/bad:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        לא טוב
                    </div>
                )}

                {/* Floating Negative Feedback Form */}
                <AnimatePresence>
                    {rating === 'bad' && !isLocked && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            className="absolute bottom-full left-0 mb-3 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 p-4 z-50 text-right"
                        >
                            <div>
                                <p className="text-sm font-bold text-gray-700 mb-2">מה לא עבד טוב?</p>
                                <div className="space-y-2 mb-3">
                                    {reasons.map((r) => (
                                        <label key={r.id} className="flex items-center justify-end gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors">
                                            <span className="text-xs text-gray-600">{r.label}</span>
                                            <input
                                                type="checkbox"
                                                checked={selectedReasons.includes(r.label)}
                                                onChange={() => toggleReason(r.label)}
                                                className="w-3 h-3 text-cyan-600 rounded focus:ring-cyan-500"
                                            />
                                        </label>
                                    ))}
                                </div>

                                {selectedReasons.includes('רשום הערה') && (
                                    <textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="פרט כאן..."
                                        className="w-full p-2 border border-gray-300 rounded-lg text-xs mb-3 text-right focus:ring-2 focus:ring-cyan-500 outline-none text-gray-800"
                                        rows={2}
                                        autoFocus
                                    />
                                )}

                                <button
                                    onClick={handleSubmitBad}
                                    className="w-full py-2 bg-cyan-600 text-white rounded-lg text-xs font-bold hover:bg-cyan-700 transition-colors shadow-md"
                                >
                                    שלח משוב
                                </button>
                            </div>
                            {/* Arrow */}
                            <div className="absolute -bottom-2 left-2 w-4 h-4 bg-white transform rotate-45 border-b border-r border-gray-100"></div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Good Button */}
            <div className="relative group/good">
                <motion.button
                    whileHover={!isLocked ? { scale: 1.1 } : {}}
                    whileTap={!isLocked ? { scale: 0.9 } : {}}
                    onClick={() => handleRate('good')}
                    disabled={isLocked}
                    className={`w-6 h-6 flex items-center justify-center rounded-full shadow-sm border border-gray-100 transition-all ${rating === 'good' ? 'bg-green-100 text-green-600' : isLocked ? 'bg-gray-50 text-gray-300 cursor-default' : 'bg-white hover:bg-gray-50 text-gray-400'}`}
                >
                    <span className="text-xs">👍</span>
                </motion.button>

                {/* Tooltip */}
                {!rating && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 py-0.5 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover/good:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                        טוב
                    </div>
                )}
            </div>
        </div>
    );
}
