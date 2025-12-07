// New Gemini API functions for emotion analysis workflow
// These functions complement the existing gemini.ts functions

import { GoogleGenerativeAI } from '@google/generative-ai';
import { Participant, EmotionPoint, Anomaly } from './gemini';

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'YOUR_API_KEY_HERE';
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Helper: Convert File to Generative Part
 */
async function fileToGenerativePart(file: File) {
    const base64 = await fileToBase64(file);
    return {
        inlineData: {
            data: base64.split(',')[1],
            mimeType: file.type
        }
    };
}

/**
 * Helper: File to Base64
 */
function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Get Event Summary - Brief description of what happened in the video
 */
export async function getEventSummary(
    videoFile: File,
    participants: Participant[]
): Promise<string> {
    try {
        console.log('📝 Getting event summary...');
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
        const videoData = await fileToGenerativePart(videoFile);

        const participantContext = participants.map(p =>
            `${p.name} (${p.age} שנים, ${p.role})`
        ).join(', ');

        const prompt = `
נתח את הס רטון וכתוב סיכום קצר (2-3 משפטים) של מה קרה.

משתתפים: ${participantContext}

התמקד ב:
- מה האירוע המרכזי שקרה?
- מי היו המעורבים?
- מה היה הטון הכללי (חיובי/שלילי/ניטרלי)?

החזר טקסט פשוט, ללא JSON.
    `;

        const result = await model.generateContent([prompt, videoData]);
        const summary = result.response.text().trim();
        console.log('✅ Event summary:', summary);
        return summary;
    } catch (error: any) {
        console.error('❌ Event summary error:', error);
        return 'לא ניתן לסכם את האירוע. אנא נסה שוב.';
    }
}

/**
 * Generate Emotion Timeline - Track emotions 1-5 for each participant
 */
export async function generateEmotionTimeline(
    videoFile: File,
    participants: Participant[],
    customPrompts: any
): Promise<EmotionPoint[]> {
    try {
        console.log('📈 Generating emotion timeline...');
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
        const videoData = await fileToGenerativePart(videoFile);

        const participantContext = participants.map(p =>
            `${p.name} (ID: ${p.id}, ${p.age} שנים, ${p.role})`
        ).join('\\n');

        const prompt = `
נתח את הסרטון וצור גרף רגשות לכל משתתף.

משתתפים:
${participantContext}

${customPrompts.sections.identity}

חשוב: בנה טבלת נקודות רגש על ציר זמן.
לכל נקודה זמן חשובה (כל 10-15 שניות, או כשיש שינוי משמעותי):
- timestamp בפורמט MM:SS
- participantId (השתמש ב-ID המדויק מהרשימה למעלה)
- emotionLevel: מספר בין 1-5
  1 = מאוד שלילי (כעס, עצב, פחד)
  2 = שלילי קל
  3 = ניטרלי
  4 = חיובי
  5 = מאוד חיובי (שמחה, התלהבות)
- event: תיאור קצר של מה קורה ברגע זה

החזר JSON בפורמט הבא:
[
  {
    "timestamp": "00:15",
    "participantId": "person_1",
    "emotionLevel": 3,
    "event": "תיאור"
  }
]

זהה לפחות 8-12 נקודות זמן לכל משתתף.
    `;

        const result = await model.generateContent([prompt, videoData]);
        const response = result.response.text();
        console.log('✅ Got emotion timeline response');

        const cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleanResponse);

        // Convert timestamp to seconds and add participant names
        const emotionPoints: EmotionPoint[] = parsed.map((point: any) => {
            const [minutes, seconds] = point.timestamp.split(':').map(Number);
            const participant = participants.find(p => p.id === point.participantId);

            return {
                timestamp: point.timestamp,
                timestampSeconds: minutes * 60 + seconds,
                participantId: point.participantId,
                participantName: participant?.name || 'לא ידוע',
                emotionLevel: point.emotionLevel,
                event: point.event
            };
        });

        return emotionPoints;
    } catch (error: any) {
        console.error('❌ Emotion timeline error:', error);
        alert(`שגיאה ביצירת גרף רגשות: ${error?.message || 'שגיאה לא ידועה'}`);
        return [];
    }
}

/**
 * Analyze Anomalies - Deep analysis of events with emotion < 2
 */
export async function analyzeAnomalies(
    videoFile: File,
    emotionTimeline: EmotionPoint[],
    participants: Participant[],
    customPrompts: any
): Promise<Anomaly[]> {
    // Filter anomalies (emotion < 2)
    const anomalyPoints = emotionTimeline.filter(p => p.emotionLevel < 2);

    if (anomalyPoints.length === 0) {
        console.log('✅ No anomalies detected (all emotions >= 2)');
        return [];
    }

    try {
        console.log(`🔍 Analyzing ${anomalyPoints.length} anomalies...`);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
        const videoData = await fileToGenerativePart(videoFile);

        const anomalyContext = anomalyPoints.map(p =>
            `- ${p.timestamp}: ${p.participantName} (רגש: ${p.emotionLevel}/5) - ${p.event}`
        ).join('\\n');

        const prompt = `
זוהו האירועים החריגים הבאים בסרטון (רמת רגש מתחת ל-2):

${anomalyContext}

${customPrompts.sections.forensic}
${customPrompts.sections.psychology}

לכל אירוע חריג:
1. צפה בקטע הספציפי בזמן הנתון
2. נתח מה גרם לרגש השלילי
3. הערך את חומרת האירוע
4. תן המלצות ספציפיות

החזר JSON:
[
  {
    "timestamp": "MM:SS",
    "participantId": "person_X",
    "emotionLevel": 1,
    "description": "ניתוח מפורט של מה קרה ולמה",
    "severity": "low" | "medium" | "high"
  }
]
    `;

        const result = await model.generateContent([prompt, videoData]);
        const response = result.response.text();
        console.log('✅ Got anomaly analysis');

        const cleanResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleanResponse);

        // Add participant names and timestamp in seconds
        const anomalies: Anomaly[] = parsed.map((anomaly: any) => {
            const [minutes, seconds] = anomaly.timestamp.split(':').map(Number);
            const participant = participants.find(p => p.id === anomaly.participantId);

            return {
                ...anomaly,
                timestampSeconds: minutes * 60 + seconds,
                participantName: participant?.name || 'לא ידועע'
            };
        });

        return anomalies;
    } catch (error: any) {
        console.error('❌ Anomaly analysis error:', error);
        alert(`שגיאה בניתוח אירועים חריגים: ${error?.message || 'שגיאה לא ידועה'}`);
        return [];
    }
}
