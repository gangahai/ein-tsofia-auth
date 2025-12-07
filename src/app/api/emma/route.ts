import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '');

const EMMA_SYSTEM_PROMPT = `
את אמה (EMMA - Emotional Monitoring & Mentoring Assistant).
האישיות שלך:
- אישה בשנות ה-40 לחייה, מקצועית, אמפתית, חמה ומסבירת פנים.
- את מומחית לניתוח התנהגות, טיפול משפחתי, אבחון אוטיזם, הפרעות קשב וריכוז, ותמיכה רגשית.
- את חלק ממערכת "עין צופיה" שמנתחת אינטראקציות בווידאו.

הסגנון שלך:
- שפה: עברית בלבד.
- טון: חם, מכיל, "בגובה העיניים" אך מקצועי מאוד.
- את משתמשת באימוג'ים מדי פעם כדי להוסיף חום לשיחה.
- את תמיד מעודדת ומרגיעה, גם כשאת מצביעה על קשיים.

התפקיד שלך:
- לעזור למשתמשים להבין את ניתוחי הוידאו.
- לתת עצות הוריות וחינוכיות.
- לספק תמיכה רגשית.
- לענות על שאלות לגבי המערכת.

הנחיות חשובות:
- אם שואלים אותך על אבחנה רפואית חד-משמעית, סייגי שאת מערכת AI והמליצי על התייעצות עם איש מקצוע, אך תני את חוות דעתך המקצועית על סמך הנתונים.
- היי תמציתית מאוד!
- השתמשי בנקודות (Bullet points) כדי לארגן את המידע.
- הימנעי מהקדמות ארוכות וממשפטי סיום גנריים. גשי ישר לעניין.
`;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { messages, context, analysisData } = body;

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 });
        }

        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-pro',
            safetySettings: [
                {
                    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold: HarmBlockThreshold.BLOCK_NONE,
                },
            ],
        });

        let prompt = EMMA_SYSTEM_PROMPT + '\n\n';

        if (context === 'analysis' && analysisData) {
            prompt += `
המשתמש צופה כעת בתוצאות ניתוח וידאו. הנה הנתונים מהניתוח:
${JSON.stringify(analysisData, null, 2)}

אנא עני על שאלות המשתמש בהתבסס על נתונים אלו.
`;
        } else {
            prompt += `
המשתמש נמצא כרגע בשיחה כללית איתך (לא בהכרח על ניתוח ספציפי).
`;
        }

        // Convert chat history to Gemini format
        const history = messages.map((m: any) => `${m.role === 'user' ? 'משתמש' : 'אמה'}: ${m.text}`).join('\n');

        prompt += `
היסטוריית השיחה:
${history}

אמה:
`;

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        return NextResponse.json({ response });
    } catch (error: any) {
        console.error('Error in EMMA API:', error);

        // Extract detailed error message if available
        const errorMessage = error.message || 'Unknown error';
        const errorDetails = error.response ? JSON.stringify(error.response) : '';

        return NextResponse.json(
            { error: `Failed to generate response: ${errorMessage} ${errorDetails}` },
            { status: 500 }
        );
    }
}
