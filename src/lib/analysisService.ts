import { db } from './firebase';
import { collection, addDoc, query, where, getDocs, Timestamp, orderBy, limit } from 'firebase/firestore';

export interface AnalysisLog {
    userId: string;
    timestamp: Date;
    videoMetadata: {
        duration: string;
        size: string;
        resolution: string;
        format: string;
    };
    usageMetadata: {
        promptTokenCount: number;
        candidatesTokenCount: number;
        totalTokenCount: number;
    };
    cost: {
        input: number;
        output: number;
        total: number;
    };
}

const COLLECTION_NAME = 'analysis_logs';

// Cache for feedback logs
let cachedFeedback: (FeedbackLog & { id: string })[] | null = null;
let lastFetchTime = 0;

export const analysisService = {
    /**
     * Log a new analysis to Firestore
     */
    logAnalysis: async (log: Omit<AnalysisLog, 'timestamp'>) => {
        try {
            await addDoc(collection(db, COLLECTION_NAME), {
                ...log,
                timestamp: Timestamp.now()
            });
            console.log('✅ Analysis cost logged successfully');
        } catch (error) {
            console.error('❌ Error logging analysis cost:', error);
        }
    },

    /**
     * Get analysis history for a user
     */
    getHistory: async (userId: string, period: 'day' | 'week' | 'month' | 'all' = 'all') => {
        try {
            // Optimization: Query only by userId and sort by timestamp.
            // This uses default Firestore indexes and avoids the need for a custom composite index
            // (userId + timestamp) which can cause delays or failures if not created.
            // We will filter by date in memory since the number of logs per user is expected to be manageable.
            const q = query(
                collection(db, COLLECTION_NAME),
                where('userId', '==', userId),
                orderBy('timestamp', 'desc')
            );

            const snapshot = await getDocs(q);

            let logs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp.toDate()
            })) as (AnalysisLog & { id: string })[];

            // Client-side filtering
            if (period !== 'all') {
                const now = new Date();
                const startDate = new Date();

                switch (period) {
                    case 'day':
                        startDate.setHours(0, 0, 0, 0);
                        break;
                    case 'week':
                        startDate.setDate(now.getDate() - 7);
                        break;
                    case 'month':
                        startDate.setMonth(now.getMonth() - 1);
                        break;
                }

                logs = logs.filter(log => log.timestamp >= startDate);
            }

            return logs;

        } catch (error) {
            console.error('❌ Error fetching analysis history:', error);
            return [];
        }
    },

    /**
     * Log user feedback
     */
    logFeedback: async (feedback: FeedbackLog) => {
        try {
            // Remove undefined fields (Firestore doesn't allow undefined values)
            const cleanedFeedback = Object.fromEntries(
                Object.entries({
                    ...feedback,
                    timestamp: Timestamp.now()
                }).filter(([_, value]) => value !== undefined)
            );

            await addDoc(collection(db, 'feedback_logs'), cleanedFeedback);
            console.log('✅ Feedback logged successfully');
            // Invalidate cache so new feedback appears immediately
            cachedFeedback = null;
        } catch (error) {
            console.error('❌ Error logging feedback:', error);
        }
    },

    /**
     * Get all feedback logs (for developers)
     */
    getFeedback: async (forceRefresh = false) => {
        try {
            // Return cached data if available and fresh (less than 5 minutes old)
            if (!forceRefresh && cachedFeedback && (Date.now() - lastFetchTime < 5 * 60 * 1000)) {
                console.log('🚀 Returning cached feedback logs');
                return cachedFeedback;
            }

            console.log('🔄 Fetching fresh feedback logs...');

            // Reverting to fetch ALL logs to ensure no data is hidden due to missing timestamps
            // We will sort client-side.
            const q = query(
                collection(db, 'feedback_logs')
            );

            const snapshot = await getDocs(q);

            console.log(`📊 Fetched ${snapshot.docs.length} feedback logs`);

            const logs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate() || new Date(0) // Default to epoch if missing
            })) as (FeedbackLog & { id: string })[];

            // Sort by timestamp descending (newest first)
            logs.sort((a, b) => {
                const timeA = a.timestamp ? a.timestamp.getTime() : 0;
                const timeB = b.timestamp ? b.timestamp.getTime() : 0;
                return timeB - timeA;
            });

            // Update cache
            cachedFeedback = logs;
            lastFetchTime = Date.now();

            return logs;

        } catch (error) {
            console.error('❌ Error fetching feedback:', error);
            return [];
        }
    },

    /**
     * Run a custom analysis (Participant, Intervention, etc.)
     */
    runCustomAnalysis: async (type: 'participant_analysis' | 'intervention_plan' | 'custom_plan', data: any, options: any) => {
        try {
            const response = await fetch('/api/analyze/custom', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, data, options })
            });

            if (!response.ok) throw new Error('Failed to run analysis');

            const result = await response.json();
            return result.result;
        } catch (error) {
            console.error('❌ Error running custom analysis:', error);
            throw error;
        }
    },

    /**
     * Save a generated analysis result
     */
    saveAnalysisResult: async (userId: string, title: string, content: string, type: string) => {
        try {
            await addDoc(collection(db, 'saved_analyses'), {
                userId,
                title,
                content,
                type,
                timestamp: Timestamp.now()
            });
            console.log('✅ Analysis saved successfully');
        } catch (error) {
            console.error('❌ Error saving analysis:', error);
            throw error;
        }
    },

    /**
     * Get current user ID synchronously (if available)
     */
    getCurrentUserId: () => {
        const { auth } = require('./firebase');
        return auth.currentUser?.uid || null;
    }
};

export interface FeedbackLog {
    userId: string;
    section: string;
    rating: 'good' | 'bad';
    reasons?: string[]; // For 'bad' rating
    comment?: string;
    contextData?: string;
    timestamp?: Date;
}
