// Gemini API Client for Ein Tsofia
// Handles video analysis using Google Gemini 2.0 Flash

import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'YOUR_API_KEY_HERE';
const genAI = new GoogleGenerativeAI(API_KEY);

export interface AnalysisResult {
  forensic_layer: {
    case_description: string; // Objective summary
    environment: string; // Setting description
    facts: string[];
    observations: string[];
    timeline_events: TimelineEvent[];
  };
  psychological_layer: {
    participant_analysis: {
      name: string;
      role: string;
      actions: string;
      feelings: string;
      context: string;
    }[];
    interpretations: string[];
    emotional_states: Record<string, number>;
    relationship_dynamics: string[];
  };
  safety_layer: {
    verdict: 'safe' | 'concerning' | 'unsafe';
    score: number; // 1-10
    risk_factors: string[];
    protective_factors: string[];
  };
  timeline_log: TimelineEvent[];
  recommendations: Recommendation[];
  emotion_timeline?: EmotionTimelinePoint[]; // For emotion graph
  interactions?: InteractionDataPoint[]; // For heatmap
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
  detailedCost?: DetailedCost[];
}

export interface DetailedCost {
  stepName: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
  durationSeconds: number;
}

export interface TimelineEvent {
  timestamp: string; // "HH:MM:SS"
  event: string;
  stress_level?: number; // 1-10
  warmth_level?: number; // 1-10
  participant?: string;
}

export interface Recommendation {
  title: string;
  explanation: string;
  why_it_works: string;
  icon?: string;
}

export interface Participant {
  id: string;
  name: string;
  age?: number;
  role: string; // 'parent' | 'child' | 'caregiver' | etc
  relationship?: string;
  notes?: string;
}

export interface EmotionPoint {
  timestamp: string; // "MM:SS"
  timestampSeconds: number; // For plotting
  participantId: string;
  participantName: string;
  emotionLevel: number; // 1-5 (1=very negative, 5=very positive)
  event?: string; // What happened at this moment
}

export interface Anomaly {
  timestamp: string;
  timestampSeconds: number;
  participantId: string;
  participantName: string;
  emotionLevel: number;
  description: string; // Detailed explanation
  severity: 'low' | 'medium' | 'high';
}

// New interfaces for charts
export interface EmotionTimelinePoint {
  timestamp: string; // "MM:SS"
  timestampSeconds: number;
  [participantId: string]: number | string; // participant_1: 3, participant_2: 4, etc.
}

export interface InteractionDataPoint {
  from: string; // participant name
  to: string; // participant name
  strength: number; // 1-10
  type: string; // "supportive", "conflicting", "neutral", etc.
}

/**
 * Quick Safety Scan - 10 seconds
 * Returns immediate safety assessment
 */
export async function quickSafetyScan(videoFile: File): Promise<{
  score: number;
  verdict: 'safe' | 'concerning' | 'unsafe';
  urgent_flags: string[];
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
  duration?: number;
}> {
  const startTime = Date.now();
  try {
    console.log('🔍 Starting quick safety scan...', { fileName: videoFile.name, size: videoFile.size });
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    console.log('📁 Converting video file...');
    const videoData = await fileToGenerativePart(videoFile);

    const prompt = `
      חשוב: ענה בעברית בלבד! כל התשובה חייבת להיות בעברית.
      
      בצע סריקת בטיחות מהירה של הסרטון הזה.
      ענה בפורמט JSON בלבד:
      {
        "score": <מספר 1-10, 10 = בטוח מאוד>,
        "verdict": "safe" | "concerning" | "unsafe",
        "urgent_flags": [<רשימת דגלים דחופים בעברית, אם יש>]
      }
      
      התמקד בזיהוי מהיר של:
      - התנהגויות מדאיגות (אלימות, מצוקה קיצונית)
      - צרכים דחופים
      - רמת סיכון כללית
    `;

    console.log('🚀 Sending request to Gemini API...');
    const result = await model.generateContent([prompt, videoData]);
    const response = result.response.text();
    console.log('✅ Got safety scan response:', response);

    // Parse JSON response
    const cleanResponse = cleanJsonResponse(response);
    const parsed = JSON.parse(cleanResponse);

    const duration = (Date.now() - startTime) / 1000;
    return {
      ...parsed,
      usageMetadata: result.response.usageMetadata,
      duration
    };
  } catch (error: any) {
    console.error('❌ Quick safety scan error:', error);
    // Return default concerning result (no popup alert)
    return {
      score: 5,
      verdict: 'concerning',
      urgent_flags: ['לא ניתן לבצע סריקה - נסה שנית']
    };
  }
}

/**
 * Identify Participants - 20 seconds
 * Detects and labels people in the video
 */
export async function identifyParticipants(videoFile: File): Promise<{
  participants: Participant[];
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
  duration?: number;
}> {
  const startTime = Date.now();
  try {
    console.log('👥 Starting participant identification...', { fileName: videoFile.name });
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    console.log('📁 Converting video file for participant ID...');
    const videoData = await fileToGenerativePart(videoFile);

    const prompt = `
      חשוב מאוד: ענה בעברית בלבד! כל התיאורים והתשובות חייבים להיות בעברית.
      
      ספור וזהה את כל האנשים המופיעים בסרטון הזה.
      
      הנחיות לזיהוי:
      
      1. **גיל וקטגוריה:**
         - ילד (עד גיל 12): כתוב את הגיל המשוער
         - נער (13-19): כתוב את הגיל המשוער
         - מבוגר (20+): 
           * גבר: כתוב "מבוגר" (ללא גיל ספציפי)
           * אישה: כתוב גיל משוער עם הפחתה של 3-5 שנים (להחמיא!)
      
      2. **תפקיד לפי הסיטואציה:**
         זהה את התפקיד האמיתי בהקשר (לא רק הורה/ילד):
         - הורה/אמא/אבא
         - מטפל/מטפלת
         - גננת/מחנכת
         - ילד/תינוק
         - נער/נערה
         - מבוגר (תפקיד לא ברור)
         - אח/אחות
         - סבא/סבתא
      
      3. **מין:**
         זהה אם אפשר: זכר/נקבה/לא ברור
      
      4. **מראה:**
         תיאור קצר בעברית - בגדים, צבע שיער, מאפיינים בולטים
      
      ענה בפורמט JSON בלבד:
      [
        {
          "id": "person_1",
          "estimated_age": <גיל מספרי לילדים/נוער, "מבוגר" למבוגרים, או גיל מופחת לנשים מבוגרות>,
          "age_category": "ילד" | "נער" | "מבוגר",
          "gender": "זכר" | "נקבה" | "לא ברור",
          "appearance": "<תיאור קצר בעברית>",
          "likely_role": "<תפקיד לפי הקשר>"
        }
      ]
      
      דוגמאות:
      - ילדה בת 5: 
        "estimated_age": 5, "age_category": "ילד", "gender": "נקבה", "likely_role": "ילדה"
      
      - נער בן 16: 
        "estimated_age": 16, "age_category": "נער", "gender": "זכר", "likely_role": "נער"
      
      - גבר מבוגר: 
        "estimated_age": "מבוגר", "age_category": "מבוגר", "gender": "זכר", "likely_role": "אבא"
      
      - אישה מבוגרת (נראית כ-35): 
        "estimated_age": 32, "age_category": "מבוגר", "gender": "נקבה", "likely_role": "אמא"
        (שים לב: הפחתנו 3 שנים להחמיא)
      
      - גננת: 
        "estimated_age": 28, "age_category": "מבוגר", "gender": "נקבה", "likely_role": "גננת"
    `;

    console.log('🚀 Sending participant ID request...');
    const result = await model.generateContent([prompt, videoData]);
    const response = result.response.text();
    console.log('✅ Got participants:', response);

    // Parse JSON using robust cleaner
    const cleanResponse = cleanJsonResponse(response);
    let parsed;
    try {
      parsed = JSON.parse(cleanResponse);
    } catch (e) {
      console.error('JSON Parse Error in identifyParticipants. Raw:', response, 'Cleaned:', cleanResponse);
      // Fallback: try to find any JSON-like array structure
      const match = response.match(/\[[\s\S]*\]/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch (e2) {
          throw new Error('Failed to parse JSON response');
        }
      } else {
        throw new Error('No JSON found in response');
      }
    }

    // Map to our Participant interface
    const participants: Participant[] = parsed.map((p: any, i: number) => {
      // Format age display
      let displayAge: number | undefined;
      if (p.age_category === 'ילד' || p.age_category === 'נער') {
        displayAge = typeof p.estimated_age === 'number' ? p.estimated_age : undefined;
      } else if (p.age_category === 'מבוגר' && p.gender === 'נקבה' && typeof p.estimated_age === 'number') {
        // Adult woman with specific age (already reduced)
        displayAge = p.estimated_age;
      }
      // Adult men get undefined (will show "מבוגר" in UI)

      return {
        id: p.id || `person_${i + 1}`,
        name: `משתתף ${i + 1}`,
        age: displayAge,
        role: p.likely_role || 'אחר',
        notes: `${p.appearance || ''}${p.gender ? ` (${p.gender})` : ''}`.trim()
      };
    });

    const duration = (Date.now() - startTime) / 1000;
    return {
      participants,
      usageMetadata: result.response.usageMetadata,
      duration
    };
  } catch (error: any) {
    console.error('❌ Participant identification error:', error);
    // Return dummy participants for testing if API fails
    return {
      participants: [
        { id: 'p1', name: 'משתתף 1', role: 'לא ידוע', notes: 'זיהוי נכשל' }
      ]
    };
  }
}

/**
 * Deep Analysis - 60+ seconds
 * Comprehensive analysis using custom prompts
 */
export async function deepAnalysis(
  videoFile: File,
  participants: Participant[],
  customPrompts: any,
  previousStats: DetailedCost[] = []
): Promise<AnalysisResult> {
  const startTime = Date.now();
  try {
    console.log('🔬 Starting deep analysis...');
    console.log('🎭 Using Identity Prompt:', customPrompts.sections.identity.substring(0, 100) + '...');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    console.log('📁 Converting video file for deep analysis...');
    const videoData = await fileToGenerativePart(videoFile);

    // Build comprehensive prompt with custom prompts + participant context
    const participantContext = participants.map(p =>
      `${p.name} (${p.age || 'מבוגר'}, ${p.role})${p.relationship ? ` - ${p.relationship}` : ''}`
    ).join('\n');

    const prompt = `
      חשוב ביותר: ענה בעברית בלבד!
      הנחיה קריטית: היה תמציתי וממוקד. השתמש בנקודות (Bullet points) ככל האפשר. הימנע מפסקאות ארוכות ומתיאורים מיותרים.
      כל המילים והתיאורים חייבים להיות בעברית.
      
      ${customPrompts.sections.identity}
      
      המשתתפים בסרטון:
      ${participantContext}
      
      בצע ניתוח מעמיק לפי השכבות הבאות:
      
      1. שכבה משפטית (Forensic):
      ${customPrompts.sections.forensic}
      
      2. שכבה פסיכולוגית:
      ${customPrompts.sections.psychology}
      
      3. שכבה בטיחותית:
      ${customPrompts.sections.safety}
      
      מילות מפתח להתמקד: ${customPrompts.keywords.join(', ')}
      
      הנחיות:
      - כל התשובות בעברית בלבד!
      - כלול המלצות מעשיות ומועילות
      - השתמש בשפה ברורה ומקצועית
      
      החזר JSON במבנה הבא (כל הטקסט בעברית):
      {
        "forensic_layer": {
          "case_description": "תאור מפורט, ארוך ומקיף מאוד של המקרה (לפחות 3 פסקאות). תאר את ההשתלשלות המלאה.",
          "environment": "תאור מפורט של הסביבה, תאורה, רעשי רקע, וחפצים רלוונטיים",
          "facts": [<רשימה ארוכה של עובדות חשובות בעברית>],
          "observations": [<תצפיות מפורטות בעברית>],
          "timeline_events": [{
            "timestamp": "HH:MM:SS",
            "event": "תאור מפורט של האירוע - בעברית",
            "stress_level": <1-10>,
            "warmth_level": <1-10>
          }]
        },
        "psychological_layer": {
          "participant_analysis": [
            {
              "name": "שם המשתתף",
              "role": "תפקיד משוער",
              "actions": "פירוט מלא של הפעולות",
              "feelings": "ניתוח מעמיק של הרגשות",
              "context": "הקשר האינטראקציה בהרחבה"
            }
          ],
          "interpretations": [<פרשנויות פסיכולוגיות מעמיקות ומנומקות>],
          "emotional_states": {
            "participant_name": <רמת מתח 1-10>
          },
          "relationship_dynamics": [<ניתוח מפורט של הדינמיקה בין המשתתפים>]
        },
        "safety_layer": {
          "verdict": "safe" | "concerning" | "unsafe",
          "score": <ציון 1-10>,
          "risk_factors": [<גורמי סיכון מפורטים>],
          "protective_factors": [<גורמים מגנים מפורטים>]
        },
        "emotion_timeline": [
          {
            "timestamp": "MM:SS",
            "timestampSeconds": <מספר>,
            "person_1": <רמת רגש 1-5 (1=שלילי מאוד, 5=חיובי מאוד)>,
            "person_2": <רמת רגש 1-5>,
            ...
          }
        ],
        "interactions": [
          {
            "from": "שם משתתף 1",
            "to": "שם משתתף 2",
            "strength": <עוצמה 1-10>,
            "type": "supportive" | "conflicting" | "neutral"
          }
        ],
        "recommendations": [
          {
            "title": "כותרת בעברית",
            "explanation": "הסבר מפורט, מעשי ויישומי (לפחות 2 משפטים)",
            "why_it_works": "הסבר פסיכולוגי מעמיק למה זה יעבוד",
            "icon": "אמוג'י"
          }
        ]
      }
      
      הנחיות נוספות:
      - emotion_timeline: דגום כל 30 שניות של הוידאו, תן ציון רגשי 1-5 לכל משתתף
      - interactions: זהה את כל האינטראקציות בין משתתפים (מי דיבר עם מי, תמיכה/קונפליקט)
    `;

    console.log('🚀 Sending deep analysis request with temperature:', customPrompts.temperature || 0.7);

    const result = await model.generateContent({
      contents: [
        { role: 'user', parts: [{ text: prompt }, videoData] }
      ],
      generationConfig: {
        temperature: customPrompts.temperature || 0.7,
        topP: 0.8,
        topK: 40
      }
    });

    const response = result.response.text();
    console.log('✅ Got deep analysis response');
    console.log('📄 Raw response preview:', response.substring(0, 500));

    // Extract JSON using robust cleaner
    const cleanResponse = cleanJsonResponse(response);
    let parsed;
    try {
      parsed = JSON.parse(cleanResponse);
    } catch (e) {
      console.error('JSON Parse Error in deepAnalysis. Raw:', response, 'Cleaned:', cleanResponse);
      // Fallback: try to find any JSON-like structure
      const match = response.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch (e2) {
          throw new Error('Failed to parse JSON response');
        }
      } else {
        throw new Error('No JSON found in response');
      }
    }

    const duration = (Date.now() - startTime) / 1000;

    // Calculate costs
    const usage = result.response.usageMetadata;
    const inputRate = 0.075 / 1000000; // Gemini 2.5 Flash rates (approx)
    const outputRate = 0.30 / 1000000;

    const currentCost: DetailedCost = {
      stepName: 'ניתוח מעמיק',
      model: 'Gemini 2.5 Flash',
      inputTokens: usage?.promptTokenCount || 0,
      outputTokens: usage?.candidatesTokenCount || 0,
      totalCost: (usage?.promptTokenCount || 0) * inputRate + (usage?.candidatesTokenCount || 0) * outputRate,
      durationSeconds: duration
    };

    const allCosts = [...previousStats, currentCost];

    return {
      ...parsed,
      usageMetadata: usage,
      detailedCost: allCosts
    };

  } catch (error: any) {
    console.error('❌ Deep analysis error:', error);
    throw error;
  }
}

/**
 * Quick Analysis - 15 seconds
 * Fast analysis with 2 specific outputs: Description & Recommendation
 */
export async function quickAnalysis(
  videoFile: File,
  participants: Participant[],
  previousStats: DetailedCost[] = []
): Promise<{
  description: string;
  recommendation: Recommendation;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
  detailedCost?: DetailedCost[];
}> {
  const startTime = Date.now();
  try {
    console.log('⚡ Starting quick analysis...');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const videoData = await fileToGenerativePart(videoFile);

    const participantContext = participants.map(p =>
      `${p.name} (${p.age || 'מבוגר'}, ${p.role})${p.relationship ? ` - ${p.relationship}` : ''}`
    ).join('\n');

    const prompt = `
      חשוב ביותר: ענה בעברית בלבד!
      
      המשתתפים בסרטון:
      ${participantContext}
      
      בצע ניתוח בזק (Quick Analysis) מקיף ומדויק.
      
      הקפד להקשיב גם לפסקול (אודיו) ולנתח את הטון והדיבור, לא רק את הויזואליה.
      
      עליך לספק שני דברים בלבד:

      1. **תיאור כללי (General Description):**
         זהו ניתוח תמציתי אך מקיף הכולל:
         - **תיאור הסביבה:** איפה זה קורה? (גן שעשועים, כיתה, בית, חצר וכו')
         - **ניתוח בטיחות רגשית ופיזית:** מה קורה מבחינת בטיחות? האם יש צעקות, בכי, אלימות, נפילה, או להפך - רוגע ושמחה?
         - **ניתוח קולי (Audio):** התייחס לטון הדיבור, צעקות, בכי או מילים שנאמרו.
         - **הסבר מבוסס ראיות:** הסבר בקצרה *למה* אתה חושב ככה (למשל: "מזהה הבעת פנים כועסת ושומע צעקות רמות").
         - אורך: עד 4-5 שורות. היה חד ומדויק.
      
      2. **המלצה לפעולה:**
         ההמלצה הכי חשובה ודחופה לשיפור המצב או לשימורו.
      
      ענה בפורמט JSON בלבד:
      {
        "description": "התיאור הכללי המקיף (כולל סביבה, בטיחות, אודיו והסבר)",
        "recommendation": {
          "title": "כותרת ההמלצה",
          "explanation": "הסבר קצר ופרקטי",
          "why_it_works": "הסבר פסיכולוגי קצר",
          "icon": "אמוג'י מתאים"
        }
      }
    `;

    const result = await model.generateContent([prompt, videoData]);
    const response = result.response.text();

    // Extract JSON using robust cleaner
    const cleanResponse = cleanJsonResponse(response);
    let parsed;
    try {
      parsed = JSON.parse(cleanResponse);
    } catch (e) {
      console.error('JSON Parse Error. Raw:', response, 'Cleaned:', cleanResponse);
      // Fallback: try to find any JSON-like structure
      const match = response.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch (e2) {
          throw new Error('Failed to parse JSON response');
        }
      } else {
        throw new Error('No JSON found in response');
      }
    }

    const duration = (Date.now() - startTime) / 1000;

    // Calculate costs (Flash Exp is free currently, but logging structure)
    const usage = result.response.usageMetadata;
    const currentCost: DetailedCost = {
      stepName: 'ניתוח בזק',
      model: 'Gemini 2.0 Flash Exp',
      inputTokens: usage?.promptTokenCount || 0,
      outputTokens: usage?.candidatesTokenCount || 0,
      totalCost: 0, // Free
      durationSeconds: duration
    };

    return {
      ...parsed,
      usageMetadata: usage,
      detailedCost: [...previousStats, currentCost]
    };

  } catch (error: any) {
    console.error('❌ Quick analysis error:', error);
    throw error;
  }
}

// Helper to convert file to generative part
async function fileToGenerativePart(file: File): Promise<{ inlineData: { data: string; mimeType: string } }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      const base64Content = base64data.split(',')[1];
      resolve({
        inlineData: {
          data: base64Content,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Helper to clean JSON response from Gemini
 * Removes markdown code blocks and any text before/after the JSON object
 */
function cleanJsonResponse(text: string): string {
  let cleaned = text.trim();

  // Remove markdown code blocks
  cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '');

  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');

  // Determine if it's likely an object or an array based on which comes first
  let startIndex = -1;
  let endIndex = -1;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    // It's an object
    startIndex = firstBrace;
    endIndex = cleaned.lastIndexOf('}');
  } else if (firstBracket !== -1) {
    // It's an array
    startIndex = firstBracket;
    endIndex = cleaned.lastIndexOf(']');
  }

  if (startIndex !== -1 && endIndex !== -1) {
    cleaned = cleaned.substring(startIndex, endIndex + 1);
  }

  return cleaned;
}
