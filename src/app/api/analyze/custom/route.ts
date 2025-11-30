import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '');

const SYSTEM_PROMPT = `
אתה מומחה לניתוח התנהגות, פסיכולוגיה חינוכית וטיפול משפחתי.
תפקידך הוא לנתח נתונים מאינטראקציות מצולמות ולספק תובנות מעמיקות ותוכניות פעולה פרקטיות.

הנחיות כלליות:
- שפה: עברית בלבד.
- טון: מקצועי, אמפתי, מעודד ומעשי.
- מבנה: השתמש בכותרות, נקודות (Bullet points) ופסקה קצרה לכל רעיון.
- עיצוב: השתמש ב-Markdown לעיצוב הטקסט (מודגש, כותרות וכו').
`;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { type, data, options } = body;

        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash', // Using the faster model for analysis
            safetySettings: [
                { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            ],
        });

        let prompt = SYSTEM_PROMPT + '\n\n';

        // Context from previous analysis
        prompt += `
נתוני הניתוח הראשוני:
${JSON.stringify(data.initialAnalysis, null, 2)}
`;

        if (data.participants) {
            prompt += `
משתתפים מזוהים:
${JSON.stringify(data.participants, null, 2)}
`;
        }

        // Specific Logic based on Type
        switch (type) {
            case 'participant_analysis':
                prompt += `
משימה: בצע ניתוח משתתפים ${options.depth === 'deep' ? 'מעמיק' : 'ממוקד'}.
עליך להתייחס באופן ספציפי לנקודות הבאות ולחבר ביניהן:
1. **מה נאמר (מלל):** ציטוטים או תמצית דברים שנאמרו.
2. **שפת גוף והבעות פנים:** ניתוח תנועות, מבטים, מימיקה וטון דיבור.
3. **הקשר ורגש:** מה המשתתף מרגיש? מה המניע שלו? איך זה מתחבר למה שהוא אומר ועושה?
4. **דינמיקה:** האינטראקציה בין המשתתפים.

${options.depth === 'deep' ? '5. ניתוח גורמי רקע והשפעות סביבתיות (על בסיס הנתונים בלבד).' : ''}

פלט רצוי: דוח מובנה, עשיר ומחובר להתרחשויות בוידאו.
`;
                break;

            case 'intervention_plan':
                prompt += `
משימה: בנה תוכנית התערבות בגישת ${options.method} (${options.focus === 'emotional' ? 'מיקוד רגשי' : 'מיקוד קוגניטיבי/שכלי'}).

התבסס על ניתוח המצב (כולל מלל, שפת גוף ורגשות) כדי להתאים את התוכנית.

הסבר על הגישה שנבחרה (${options.method}):
${getMethodDescription(options.method)}

מבנה התוכנית:
1. **מטרות העל:** 2-3 מטרות מרכזיות.
2. **ניתוח המצב הנוכחי:** בקצרה, על בסיס הוידאו (התייחסות למה שנאמר ושודר).
3. **עקרונות מנחים:** כיצד ליישם את גישת ${options.method} במקרה זה.
4. **תוכנית פעולה שלבית:**
   - שלב 1: התחלה מיידית (מה עושים מחר בבוקר).
   - שלב 2: ביסוס והעמקה (תהליך של שבועיים-חודש).
   - שלב 3: שימור והכללה (לטווח הארוך).
5. **כלים מעשיים:** תרגילים או טכניקות ספציפיות.
6. **הזמנה לחקירה:** משפט סיום המזמין את המשתמש להמשיך ולחקור.
`;
                break;

            case 'custom_plan':
                prompt += `
משימה: בנה תוכנית מותאמת אישית על פי בקשת המשתמש.

בקשת המשתמש / הנחיות נוספות:
"${options.customInstructions}"

התייחס לנתוני הוידאו ולבקשה הספציפית. בנה תוכנית פרקטית, ישימה ומעוצבת היטב.
`;
                break;

            default:
                return NextResponse.json({ error: 'Invalid analysis type' }, { status: 400 });
        }

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        return NextResponse.json({ result: response });

    } catch (error: any) {
        console.error('Error in Custom Analysis API:', error);
        return NextResponse.json(
            { error: `Failed to generate analysis: ${error.message}` },
            { status: 500 }
        );
    }
}

function getMethodDescription(method: string): string {
    switch (method) {
        case 'CBT': return 'טיפול קוגניטיבי-התנהגותי: התמקדות בשינוי דפוסי חשיבה והתנהגות, זיהוי "מחשבות אוטומטיות" ויצירת חוויות מתקנות.';
        case 'DBT': return 'טיפול דיאלקטי-התנהגותי: שילוב של קבלה ושינוי, ויסות רגשי, עמידות במצוקה ומיינדפולנס.';
        case 'Narrative': return 'גישה נרטיבית: החצנת הבעיה ("הבעיה היא הבעיה, האדם הוא לא הבעיה"), יצירת סיפור אלטרנטיבי מעצים וגילוי כוחות.';
        default: return '';
    }
}
