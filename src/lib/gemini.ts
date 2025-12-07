import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { getSelectedAPIKey } from '@/config/apiKeys';

const apiKey = getSelectedAPIKey();
const genAI = new GoogleGenerativeAI(apiKey);

export interface Participant {
  name: string;
  age?: string;
  role: string;
  relationship?: string;
  notes?: string;
  id?: string;
}

export interface Recommendation {
  title: string;
  explanation: string;
  icon?: string;
  why_it_works?: string;
  content?: string; // For practical_tools
}

export interface DetailedCost {
  stage: string;
  stepName?: string;
  model?: string;
  durationSeconds?: number;
  tokens: number;
  cost: number;
  totalCost?: number;
  inputTokens?: number;
  outputTokens?: number;
}

export interface AnalysisResult {
  [key: string]: any;
  usageMetadata?: any;
  detailedCost?: DetailedCost[];
  duration?: number;
}

export interface QuickAnalysisTimelineEvent {
  time: string;
  event: string;
}

export interface TimelineEvent {
  timestamp: string;
  event: string;
  stress_level?: number;
  warmth_level?: number;
  participant?: string;
}

/**
 * Convert a File to a GenerativePart for Gemini API
 */
async function fileToGenerativePart(file: File): Promise<{ inlineData: { data: string; mimeType: string } }> {
  const base64Data = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.readAsDataURL(file);
  });

  return {
    inlineData: {
      data: base64Data,
      mimeType: file.type,
    },
  };
}

/**
 * Clean JSON response from Gemini API
 * Handles both JSON objects and arrays, and extracts JSON from noisy responses
 */
function cleanJsonResponse(response: string): string {
  let cleaned = response.trim();

  // Remove markdown code blocks
  cleaned = cleaned.replace(/```json\s*/g, '').replace(/```\s*/g, '');

  // Remove leading/trailing whitespace
  cleaned = cleaned.trim();

  // Try to extract JSON from between curly braces (handles responses with extra text/emojis)
  // Match the first complete JSON object
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }

  // Fix common JSON errors:
  // 1. Remove trailing commas in arrays and objects
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');

  // 2. Remove control characters (but keep valid whitespace)
  cleaned = cleaned.replace(/[\x00-\x09\x0B-\x0C\x0E-\x1F\x7F]/g, '');

  // 3. Fix unescaped quotes in strings (basic attempt)
  // This is tricky, but we can try to escape quotes that appear inside string values
  // by looking for patterns like: "text with " quote" 
  // However, this is complex and error-prone, so we'll just log a warning

  // 4. Try to fix incomplete arrays/objects by finding matching braces
  const openBraces = (cleaned.match(/\{/g) || []).length;
  const closeBraces = (cleaned.match(/\}/g) || []).length;
  const openBrackets = (cleaned.match(/\[/g) || []).length;
  const closeBrackets = (cleaned.match(/\]/g) || []).length;

  // Add missing closing braces/brackets
  if (openBraces > closeBraces) {
    cleaned += '}'.repeat(openBraces - closeBraces);
  }
  if (openBrackets > closeBrackets) {
    cleaned += ']'.repeat(openBrackets - closeBrackets);
  }

  return cleaned;
}

/**
 * Identify Participants in video
 */
export async function identifyParticipants(videoFile: File): Promise<{ participants: Participant[] }> {
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
      const videoData = await fileToGenerativePart(videoFile);

      const prompt = `
      Analyze this video and identify all people visible.
      For each person provide:
      - Estimated age (child/adult/elderly)
      - Apparent role (child, parent, teacher, caregiver, etc.)
      
      Return ONLY a JSON array of participants.
      `;

      const result = await model.generateContent({
        contents: [
          { role: 'user', parts: [{ text: prompt }, videoData] }
        ],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              participants: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    name: { type: SchemaType.STRING },
                    age: { type: SchemaType.STRING },
                    role: { type: SchemaType.STRING }
                  }
                }
              }
            }
          }
        }
      });

      const response = result.response.text();
      const cleanResponse = cleanJsonResponse(response);
      const parsed = JSON.parse(cleanResponse);

      return { participants: parsed.participants || [] };

    } catch (error: any) {
      attempts++;
      console.warn(`⚠️ Identify Participants attempt ${attempts} failed:`, error.message);

      if (attempts === maxAttempts) throw error;

      // Exponential backoff
      const delay = Math.pow(2, attempts) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error("Failed to identify participants after retries");
}

/**
 * Quick Safety Scan
 */
export async function quickSafetyScan(videoFile: File): Promise<{
  verdict: 'safe' | 'concerning' | 'unsafe';
  score: number;
  risk_level?: string;
  immediate_action_required?: boolean;
}> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    const videoData = await fileToGenerativePart(videoFile);

    const prompt = `
    Perform ONLY a quick safety scan of this video.
    Look for immediate safety concerns.
    
    Provide:
    - verdict: "safe" | "concerning" | "unsafe"
    - score: 0-10 (10 = very safe)
    `;

    const result = await model.generateContent({
      contents: [
        { role: 'user', parts: [{ text: prompt }, videoData] }
      ],
      generationConfig: {
        temperature: 0.3,
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            verdict: { type: SchemaType.STRING },
            score: { type: SchemaType.NUMBER }
          }
        }
      }
    });

    const response = result.response.text();
    const cleanResponse = cleanJsonResponse(response);
    const parsed = JSON.parse(cleanResponse);

    return {
      verdict: parsed.verdict || 'safe',
      score: parsed.score || 7,
      immediate_action_required: false
    };
  } catch (error) {
    console.error('Safety scan error:', error);
    return {
      verdict: 'safe',
      score: 7,
      immediate_action_required: false
    };
  }
}

/**
 * Quick Analysis - Fast general analysis
 */
export async function quickAnalysis(
  videoFile: File,
  customPrompts: any
): Promise<{ description: string; recommendation: any; timeline?: QuickAnalysisTimelineEvent[] }> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    const videoData = await fileToGenerativePart(videoFile);

    const prompt = `
    Perform a quick analysis of this video.
    Provide:
    - Brief description
    - One main recommendation
    - Timeline of key events
    
    ${customPrompts.sections?.identity || ''}
    `;

    const result = await model.generateContent([prompt, videoData]);
    const response = result.response.text();

    return {
      description: response,
      recommendation: {
        title: 'Quick Recommendation',
        explanation: 'Based on quick analysis',
        icon: '💡'
      },
      timeline: []
    };
  } catch (error) {
    console.error('Quick analysis error:', error);
    throw error;
  }
}

/**
   * Fast Kindergarten Analysis - Quick kindergarten-specific analysis
   */
export async function fastKindergartenAnalysis(
  videoFile: File,
  customPrompts: any
): Promise<Partial<AnalysisResult>> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    const videoData = await fileToGenerativePart(videoFile);

    const prompt = `
    ${customPrompts.unified || customPrompts.sections?.identity || ''}
    
    Provide ONLY the scores and basic safety layer for now (fast response):
    {
      "scores": {
        "safety_score": 0-10,
        "climate_score": 0-10,
        "interaction_score": 0-10
      },
      "safety_layer": {
        "verdict": "safe" | "concerning" | "unsafe",
        "score": 0-10
      }
    }
    `;

    const result = await model.generateContent({
      contents: [
        { role: 'user', parts: [{ text: prompt }, videoData] }
      ],
      generationConfig: {
        temperature: 0.5,
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            scores: {
              type: SchemaType.OBJECT,
              properties: {
                safety_score: { type: SchemaType.NUMBER },
                climate_score: { type: SchemaType.NUMBER },
                interaction_score: { type: SchemaType.NUMBER }
              }
            },
            safety_layer: {
              type: SchemaType.OBJECT,
              properties: {
                verdict: { type: SchemaType.STRING },
                score: { type: SchemaType.NUMBER }
              }
            }
          }
        }
      }
    });

    const response = result.response.text();
    const cleanResponse = cleanJsonResponse(response);
    const parsed = JSON.parse(cleanResponse);

    return {
      scores: parsed.scores,
      safety_layer: parsed.safety_layer,
      recommendations: []
    };
  } catch (error) {
    console.error('Fast kindergarten analysis error:', error);
    return {
      scores: {
        safety_score: 5,
        climate_score: 5,
        interaction_score: 5
      },
      safety_layer: {
        verdict: 'concerning',
        score: 5
      },
      recommendations: []
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
  userType: 'family' | 'kindergarten' | 'caregiver' | null,
  previousStats: DetailedCost[] = [],
  voiceData?: { text: string, speakerProfile?: any },
  method?: string
): Promise<AnalysisResult> {
  const startTime = Date.now();
  try {
    console.log('🔬 Starting deep analysis with Gemini 2.5 Pro...');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro', generationConfig: { responseMimeType: "application/json" } });
    const videoData = await fileToGenerativePart(videoFile);

    const participantContext = participants.map(p =>
      `${p.name} (${p.age || 'מבוגר'}, ${p.role})${p.relationship ? ` - ${p.relationship}` : ''}`
    ).join('\n');

    let voiceContext = '';
    if (voiceData) {
      voiceContext = `
      מידע קולי נוסף מהמשתמש:
      תמלול דברי המשתמש: "${voiceData.text}"
      ${voiceData.speakerProfile ? `פרופיל דובר מזוהה: ${JSON.stringify(voiceData.speakerProfile)}` : ''}
      `;
    }

    let corePromptContent = '';

    if (customPrompts.unified) {
      corePromptContent = `
      ${customPrompts.unified}
      
      המשתתפים בסרטון:
      ${participantContext}

      ${voiceContext}
      
      מילות מפתח להתמקד: ${customPrompts.keywords.join(', ')}
        `;
    } else {
      corePromptContent = `
      ${customPrompts.sections.identity}
      
      המשתתפים בסרטון:
      ${participantContext}

      ${voiceContext}
      
      בצע ניתוח מעמיק לפי השכבות הבאות:
      
      1. שכבה משפטית (Forensic):
      ${customPrompts.sections.forensic}
      
      2. שכבה פסיכולוגית:
      ${customPrompts.sections.psychology}
      
      3. שכבה בטיחותית:
      ${customPrompts.sections.safety}
      
      מילות מפתח להתמקד: ${customPrompts.keywords.join(', ')}
      
      ${customPrompts.sections.output ? customPrompts.sections.output : ''}
        `;
    }

    // Append Method Instruction if present
    if (method) {
      corePromptContent += `
      
      ⚠️ CRITICAL INSTRUCTION: EDUCATIONAL APPROACH - ${method}
      You must analyze this video and provide recommendations specifically through the lens of the "${method}" approach.
      - Interpret the child's behavior and the adult's reaction using the principles of ${method}.
      - Your "Insight" (תובנה) should explain the situation based on ${method} theory.
      - Your "Practical Tools" (כלים לשינוי) must be specific techniques from the ${method} toolkit.
      - Your "Encouragement" should reflect the values of ${method}.
      `;
    }

    const prompt = `
      חשוב ביותר: ענה בעברית בלבד!
      כל המילים והתיאורים חייבים להיות בעברית.
      
      ${corePromptContent}
      
      הנחיות קריטיות למבנה התשובה:
      1. החזר אך ורק JSON תקין.
      2. אל תחזיר שום טקסט לפני או אחרי ה-JSON.
      3. אל תחזיר רשימת זמנים (timestamps) או תמלול גולמי.
      4. הקפד על מבנה ה-JSON המבוקש בדיוק.
      5. כל הטקסטים בתוך ה-JSON חייבים להיות בעברית.
      
      ⚠️ CRITICAL - דיוק ואמינות (למניעת המצאות):
      - תאר רק מה שאתה רואה בפועל בסרטון - אל תמציא או תשער
      - אם משהו לא ברור או לא נראה בבירור, ציין "לא ברור מהסרטון" במקום לנחש
      - התבסס אך ורק על עובדות חזותיות ושמיעתיות מהסרטון
      - אל תוסיף אלמנטים שלא קיימים (כמו חיות, אנשים, או חפצים שלא נראים)
      
      ⚠️ CRITICAL - עומק ואיכות התשובה:
      - צור תשובות מפורטות ומקצועיות על סמך מה שנראה בסרטון
      - כל סעיף צריך להכיל ניתוח עם הסבר והמלצות פרקטיות
      - שמור על איזון בין עומק לתמציתיות - תיאור ברור וממוקד
      
      ⚠️ CRITICAL - פורמט זמן (timestamp):
      - עבור שדה 'timestamp' ב-timeline: השתמש אך ורק בפורמט "MM:SS"
      - דוגמאות תקינות: "00:05", "01:30", "02:45"
      - אל תחזיר רצף מספרים ארוך, טווח זמנים, או מספר timestamps
    `;

    // Detect analysis type from userType parameter
    const isFamilyAnalysis = userType === 'family';

    console.log(`🔍 UserType: ${userType} → Using ${isFamilyAnalysis ? 'FAMILY' : 'KINDERGARTEN'} schema`);

    // Retry logic for 503 Overloaded errors
    let result;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        // Reverting to Gemini 2.5 Pro as requested
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
        result = await model.generateContent({
          contents: [
            { role: 'user', parts: [{ text: prompt }, videoData] }
          ],
          generationConfig: {
            temperature: 0.5,
            topP: 0.9,
            topK: 40,
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
            responseSchema: isFamilyAnalysis ? {
              // === FAMILY SCHEMA V6.0 - Emma's Brain (Simplified) ===
              type: SchemaType.OBJECT,
              properties: {
                empathy: { type: SchemaType.STRING, description: "Warm, validating opening acknowledging the user's feelings and situation. Use short paragraphs with line breaks (\\n\\n) between thoughts." },
                insight: {
                  type: SchemaType.STRING,
                  description: `Deep psychological/scientific explanation of the behavior (The 'Why'). 
MUST be formatted with:
- Multiple paragraphs separated by blank lines (\\n\\n)
- Each paragraph focusing on one key point
- Use **bold** for emphasis on key terms
- Keep paragraphs short (2-4 sentences each)

Example:
"מה שאתה רואה כאן הוא תגובת המוח ל**עומס חושי**.

כשילד מרגיש לחוץ, האמיגדלה (amygdala) שולחת אות מצוקה. הקורטקס הקדם-מצחי, שאחראי על שליטה עצמית, עוד לא מפותח מספיק בגיל הזה.

לכן התגובה שאתה רואה - זה לא \"רצון להרגיז\". זה ביולוגיה."`
                },
                practical_tools: {
                  type: SchemaType.ARRAY,
                  items: {
                    type: SchemaType.OBJECT,
                    properties: {
                      title: { type: SchemaType.STRING, description: "Name of the tool (e.g., 'שיטת ה-DTI', 'טכניקת ההסטת דעת')" },
                      content: {
                        type: SchemaType.STRING,
                        description: `Detailed step-by-step explanation. MUST include:
1. A clear header ending with ':'
2. Numbered steps (1. 2. 3.) with line breaks between them
3. Each step should be on a new line

Example format:
"ללמד התערבות עדים (Upstander):
1. **הסטה ישירה (Direct):** מודל שלושת ה-ד'ים (Distract, Delegate, האצלה). המטרה היא להפוך את הנערבים מנופסים פסיביים למתערבים אקטיביים ובטוחים
2. **הסטת דעת (Distract):** ללמד אותם לבצור הסטת דעת שקטיסלת את תשומת הלב מהצעימות
3. **האצלה (Delegate):** ללמד אותם מייד לבקור אחראי-מאמן, מורה, הורה, או אפילו"`
                      }
                    }
                  },
                  description: "3-4 concrete, actionable tools with clear step-by-step instructions"
                },
                encouragement: { type: SchemaType.STRING, description: "Optimistic closing statement offering hope and support" },
                academic_research: {
                  type: SchemaType.OBJECT,
                  properties: {
                    title: { type: SchemaType.STRING },
                    summary: { type: SchemaType.STRING },
                    url: { type: SchemaType.STRING, description: "Link to a reputable source or search query" }
                  },
                  description: "A relevant academic study or article summary"
                },
                related_concepts: {
                  type: SchemaType.ARRAY,
                  items: {
                    type: SchemaType.OBJECT,
                    properties: {
                      concept: { type: SchemaType.STRING },
                      explanation: { type: SchemaType.STRING }
                    }
                  },
                  description: "1-2 psychological concepts mentioned in the analysis"
                },
                key_moments: {
                  type: SchemaType.ARRAY,
                  items: {
                    type: SchemaType.OBJECT,
                    properties: {
                      timestamp: { type: SchemaType.STRING },
                      description: { type: SchemaType.STRING },
                      significance: { type: SchemaType.STRING }
                    }
                  },
                  description: "3 key moments from the video"
                }
              },
              required: ["empathy", "insight", "practical_tools", "encouragement", "academic_research", "related_concepts", "key_moments"]
            } : {

              // === KINDERGARTEN SCHEMA ===
              type: SchemaType.OBJECT,
              properties: {
                executive_summary: {
                  type: SchemaType.OBJECT,
                  properties: {
                    analysis: { type: SchemaType.STRING },
                    key_events: {
                      type: SchemaType.ARRAY,
                      items: {
                        type: SchemaType.OBJECT,
                        properties: {
                          time: { type: SchemaType.STRING },
                          event: { type: SchemaType.STRING }
                        }
                      }
                    }
                  }
                },
                resource_audit: {
                  type: SchemaType.OBJECT,
                  properties: {
                    dining_equipment: { type: SchemaType.STRING },
                    sleeping_arrangements: { type: SchemaType.STRING },
                    yard_equipment: { type: SchemaType.STRING },
                    toys_and_games: { type: SchemaType.STRING },
                    furniture_ergonomics: { type: SchemaType.STRING },
                    educational_environment: { type: SchemaType.STRING }
                  }
                },
                developmental_milestone_check: {
                  type: SchemaType.OBJECT,
                  properties: {
                    observed_activity: { type: SchemaType.STRING },
                    child_emotional_state: { type: SchemaType.STRING },
                    expected_milestone: { type: SchemaType.STRING },
                    verdict: { type: SchemaType.STRING },
                    professional_analysis: { type: SchemaType.STRING }
                  }
                },
                environmental_scan: {
                  type: SchemaType.OBJECT,
                  properties: {
                    sensory_load: { type: SchemaType.STRING },
                    layout_analysis: { type: SchemaType.STRING }
                  }
                },
                recommendations_to_keep: {
                  type: SchemaType.ARRAY,
                  items: {
                    type: SchemaType.OBJECT,
                    properties: {
                      category: { type: SchemaType.STRING },
                      action: { type: SchemaType.STRING },
                      professional_justification: { type: SchemaType.STRING },
                      sentiment: { type: SchemaType.STRING }
                    }
                  }
                },
                recommendations_to_improve: {
                  type: SchemaType.ARRAY,
                  items: {
                    type: SchemaType.OBJECT,
                    properties: {
                      category: { type: SchemaType.STRING },
                      action: { type: SchemaType.STRING },
                      professional_justification: { type: SchemaType.STRING },
                      urgency: { type: SchemaType.STRING },
                      sentiment: { type: SchemaType.STRING },
                      correction_model: {
                        type: SchemaType.OBJECT,
                        properties: {
                          what_to_do: { type: SchemaType.STRING },
                          what_to_say: { type: SchemaType.STRING }
                        }
                      },
                      emotional_response_activities: {
                        type: SchemaType.ARRAY,
                        items: {
                          type: SchemaType.OBJECT,
                          properties: {
                            activity_name: { type: SchemaType.STRING },
                            description: { type: SchemaType.STRING }
                          }
                        }
                      }
                    }
                  }
                },
                stakeholder_specifics: {
                  type: SchemaType.OBJECT,
                  properties: {
                    director: {
                      type: SchemaType.OBJECT,
                      properties: {
                        note: { type: SchemaType.STRING },
                        immediate_action_item: { type: SchemaType.STRING }
                      }
                    },
                    parents: {
                      type: SchemaType.OBJECT,
                      properties: {
                        note: { type: SchemaType.STRING },
                        justification: { type: SchemaType.STRING }
                      }
                    },
                    authority: {
                      type: SchemaType.OBJECT,
                      properties: {
                        note: { type: SchemaType.STRING },
                        justification: { type: SchemaType.STRING }
                      }
                    }
                  }
                },
                scores: {
                  type: SchemaType.OBJECT,
                  properties: {
                    safety: { type: SchemaType.NUMBER },
                    climate: { type: SchemaType.NUMBER },
                    interaction: { type: SchemaType.NUMBER }
                  }
                }
              },
              required: ["executive_summary", "resource_audit", "developmental_milestone_check", "environmental_scan", "recommendations_to_keep", "recommendations_to_improve", "stakeholder_specifics", "scores"]
            }
          }
        });
        break; // Success!
      } catch (error: any) {
        attempts++;
        console.warn(`⚠️ Gemini API attempt ${attempts} failed: `, error.message);

        // Check for RECITATION blocking (content similarity to copyrighted material)
        if (error.message?.includes('RECITATION') || error.message?.includes('blocked')) {
          console.warn('🔒 Content was blocked due to RECITATION. Retrying with modified prompt...');
          if (attempts === maxAttempts) {
            throw new Error("המודל חסם את התשובה בגלל דמיון לתוכן מוגן. נסה שוב או שנה את הסרטון.");
          }
        } else if (error.message?.includes('503') || error.status === 503) {
          if (attempts === maxAttempts) {
            console.warn('⚠️ Server overloaded. Falling back to Gemini 2.0 Flash...');
            try {
              const flashModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
              result = await flashModel.generateContent({
                contents: [
                  { role: 'user', parts: [{ text: prompt }, videoData] }
                ],
                generationConfig: {
                  temperature: 0.5,
                  responseMimeType: "application/json",
                  responseSchema: isFamilyAnalysis ? {
                    // === FAMILY SCHEMA V6.0 - Emma's Brain (Simplified) ===
                    type: SchemaType.OBJECT,
                    properties: {
                      empathy: { type: SchemaType.STRING, description: "Warm, validating opening acknowledging the user's feelings and situation" },
                      insight: { type: SchemaType.STRING, description: "Deep psychological/scientific explanation of the behavior (The 'Why')" },
                      practical_tools: {
                        type: SchemaType.ARRAY,
                        items: {
                          type: SchemaType.OBJECT,
                          properties: {
                            title: { type: SchemaType.STRING },
                            content: { type: SchemaType.STRING }
                          }
                        },
                        description: "3-4 concrete, actionable steps or tools"
                      },
                      encouragement: { type: SchemaType.STRING, description: "Optimistic closing statement offering hope and support" },
                      academic_research: {
                        type: SchemaType.OBJECT,
                        properties: {
                          title: { type: SchemaType.STRING },
                          summary: { type: SchemaType.STRING },
                          url: { type: SchemaType.STRING, description: "Link to a reputable source or search query" }
                        },
                        description: "A relevant academic study or article summary"
                      },
                      related_concepts: {
                        type: SchemaType.ARRAY,
                        items: {
                          type: SchemaType.OBJECT,
                          properties: {
                            concept: { type: SchemaType.STRING },
                            explanation: { type: SchemaType.STRING }
                          }
                        },
                        description: "1-2 psychological concepts mentioned in the analysis"
                      },
                      key_moments: {
                        type: SchemaType.ARRAY,
                        items: {
                          type: SchemaType.OBJECT,
                          properties: {
                            timestamp: { type: SchemaType.STRING },
                            description: { type: SchemaType.STRING },
                            significance: { type: SchemaType.STRING }
                          }
                        },
                        description: "3 key moments from the video"
                      }
                    },
                    required: ["empathy", "insight", "practical_tools", "encouragement", "academic_research", "related_concepts", "key_moments"]
                  } : {
                    // === KINDERGARTEN SCHEMA (Fallback) ===
                    type: SchemaType.OBJECT,
                    properties: {
                      executive_summary: { type: SchemaType.OBJECT, properties: { analysis: { type: SchemaType.STRING } } }
                    }
                  }
                }
              });
              break; // Success with fallback!
            } catch (fallbackError) {
              console.error('❌ Fallback to Flash also failed:', fallbackError);
              throw new Error("SERVER_OVERLOADED");
            }
          }
        } else {
          if (attempts === maxAttempts) throw error;
        }

        const delay = Math.pow(2, attempts) * 1000;
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    if (!result) throw new Error("Failed to generate content after retries");

    const response = result.response.text();
    const cleanResponse = cleanJsonResponse(response);
    let parsed: any;
    try {
      parsed = JSON.parse(cleanResponse);

      console.log('🎯 === EMMA ANALYSIS RESULT (RAW) ===');
      console.log(JSON.stringify(parsed, null, 2));
      console.log('=== END RAW RESULT ===');

    } catch (e) {
      console.warn('⚠️ Initial JSON parse failed, attempting regex extraction...');
      console.error('Raw response preview:', response.substring(0, 500));
      console.error('Cleaned response preview:', cleanResponse.substring(0, 500));
      try {
        // Try to find JSON block between ```json and ``` or just { ... }
        // Match the LAST json block if multiple exist, or the largest one
        const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
          console.log('✅ Regex extraction successful');
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (e2) {
        console.error('❌ JSON Parse Error in deepAnalysis.');
        console.error('Raw response (first 1000 chars):', response.substring(0, 1000));
        console.error('Parse error:', e2 instanceof Error ? e2.message : String(e2));
        throw new Error('Failed to parse analysis results: ' + (e2 instanceof Error ? e2.message : String(e2)));
      }
    }

    // Post-processing for KINDERGARTEN schema only
    if (!isFamilyAnalysis) {
      // 1. Map Executive Summary to Educational Report
      if (parsed.executive_summary) {
        const exec = parsed.executive_summary;
        let report = `** סיכום מנהלים:**\n${exec.analysis} \n\n`;
        if (exec.key_events && exec.key_events.length > 0) {
          report += `** אירועים מרכזיים:**\n`;
          exec.key_events.forEach((e: any) => {
            report += `- ${e.time}: ${e.event} \n`;
          });
        }
        parsed.educational_report = report;
      }

      // 2. Map Recommendations to Keep to Good Things
      if (parsed.recommendations_to_keep && Array.isArray(parsed.recommendations_to_keep)) {
        parsed.good_things = parsed.recommendations_to_keep.map((item: any) =>
          `${item.category}: ${item.action} - ${item.professional_justification} `
        );
      }

      // 3. Map Recommendations to Improve to Recommendations
      if (parsed.recommendations_to_improve && Array.isArray(parsed.recommendations_to_improve)) {
        parsed.recommendations = parsed.recommendations_to_improve.map((item: any) => ({
          title: `${item.category} (${item.urgency})`,
          explanation: `${item.action} \n${item.professional_justification} `,
          icon: item.category === 'Safety' ? '🛡️' : item.category === 'Interaction' ? '🤝' : '📝',
          urgency: item.urgency,
          suggested_solution: item.suggested_solution
        }));
      }

      // 4. Map Scores to Safety Layer
      if (parsed.scores) {
        const safetyScore = parsed.scores.safety || parsed.scores.safety_score || 0;
        parsed.safety_layer = {
          verdict: safetyScore >= 8 ? 'safe' : safetyScore >= 5 ? 'concerning' : 'unsafe',
          score: safetyScore
        };
      }
    }

    const duration = (Date.now() - startTime) / 1000;

    // Calculate costs
    const usage = result.response.usageMetadata;
    const inputTokens = usage?.promptTokenCount || 0;
    const outputTokens = usage?.candidatesTokenCount || 0;
    const cost = (inputTokens * 0.0000001) + (outputTokens * 0.0000004);

    const currentStats: DetailedCost = {
      stage: 'Deep Analysis',
      tokens: inputTokens + outputTokens,
      cost: cost
    };

    return {
      ...parsed,
      usageMetadata: usage,
      detailedCost: [...previousStats, currentStats],
      duration
    };

  } catch (error: any) {
    console.error('❌ Deep analysis error:', error);

    // Handle RECITATION error (Copyright/Verbatim content)
    if (error.message?.includes('RECITATION') || error.toString().includes('RECITATION')) {
      console.warn('⚠️ RECITATION error detected. (Retry logic disabled due to context scope issues)');
      throw new Error('RECITATION_ERROR');
    }

    // Handle other safety blocks
    if (error.message?.includes('SAFETY') || error.toString().includes('SAFETY')) {
      throw new Error('SAFETY_ERROR');
    }

    throw error;
  }
}

/**
 * Chat with Emma - Interactive session based on analysis results
 */
export async function chatWithEmma(
  history: { role: string; parts: { text: string }[] }[],
  message: string,
  analysisResult: AnalysisResult
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

    const systemPrompt = `
    You are "Emma", a senior pedagogical supervisor and behavioral analyst.
    You have just analyzed a kindergarten video and produced the following report:
    ${JSON.stringify(analysisResult, null, 2)}

    Your goal is to answer the user's questions about this specific report, explain your findings, and offer professional advice.

    Guidelines:
    - Answer in HEBREW only.
    - Be professional, empathetic, and constructive.
    - Refer to specific data points from the report(scores, events, recommendations).
    - If the user asks about something not in the report, use your general professional knowledge but clarify it's a general answer.
      `;

    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: systemPrompt }]
        },
        {
          role: 'model',
          parts: [{ text: 'הבנתי. אני אמה, ואני כאן כדי לדון בדוח ולענות על שאלות.' }]
        },
        ...history.map(h => ({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.parts[0].text }]
        }))
      ] as any
    });

    const result = await chat.sendMessage(message);
    return result.response.text();

  } catch (error) {
    console.error('Chat with Emma error:', error);
    return "סליחה, נתקלתי בבעיה בעיבוד התשובה. אנא נסה שנית.";
  }
}
