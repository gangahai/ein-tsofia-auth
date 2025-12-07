import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const API_KEY = "AIzaSyAApvSqk7dfyxq4HpnygQiY-LO8jFtDQNw"; // Hardcoded for debug
console.log("🔑 DEBUG: Using Hardcoded API Key:", API_KEY ? "Yes" : "No");
const genAI = new GoogleGenerativeAI(API_KEY);

// Helper to clean JSON response
function cleanJsonResponse(text: string): string {
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    return cleaned;
}

// Helper to convert file to generative part
async function fileToGenerativePart(file: File): Promise<{ inlineData: { data: string; mimeType: string } }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            const base64Data = base64String.split(',')[1];
            resolve({
                inlineData: {
                    data: base64Data,
                    mimeType: file.type,
                },
            });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export interface AnalysisResult {
    executive_summary?: {
        analysis: string;
        key_events?: { time: string; event: string }[];
    };
    resource_audit?: {
        dining_equipment?: string;
        sleeping_arrangements?: string;
        yard_equipment?: string;
        toys_and_games?: string;
        furniture_ergonomics?: string;
        educational_environment?: string;
    };
    developmental_milestone_check?: {
        observed_activity?: string;
        child_emotional_state?: string;
        expected_milestone?: string;
        verdict?: string;
        professional_analysis?: string;
    };
    environmental_scan?: {
        sensory_load?: string;
        layout_analysis?: string;
    };
    recommendations_to_keep?: {
        category: string;
        action: string;
        professional_justification: string;
        sentiment?: string;
    }[];
    recommendations_to_improve?: {
        category: string;
        action: string;
        professional_justification: string;
        urgency: string;
        sentiment?: string;
        correction_model?: {
            what_to_do?: string;
            what_to_say?: string;
        };
        emotional_response_activities?: {
            activity_name?: string;
            description?: string;
        }[];
    }[];
    stakeholder_specifics?: {
        director: { note: string; immediate_action_item?: string };
        parents: { note: string; justification: string };
        authority: { note: string; justification: string };
    };
    scores?: {
        safety?: number;
        climate?: number;
        interaction?: number;
    };
    duration?: number;
}

const EMMA_PROMPT = `You are "Emma", a senior pedagogical supervisor specializing in early childhood education (ages 0-3), a certified behavior analyst.
**You are also an expert Educational Environment Designer and Learning Spaces Specialist.**
Your goal is to watch video footage from a kindergarten and generate a comprehensive professional educational report that is HIGHLY ACTIONABLE and EMOTIONALLY INTELLIGENT.

**Your Persona Guidelines:**
1.  **The "Modeling" Approach:** When you identify a mistake, you must provide the EXACT alternative behavior and script (what should have been said/done).
2.  **Emotional Architect:** Understand that behavior stems from emotional needs. Provide 3 specific activities to address the underlying emotional lack (e.g., need for control, need for attention, sensory overload).
3.  **Critical Resource Auditor:** Brutally and honestly assess if equipment is SUFFICIENT and SUITABLE.
4.  **Scientific Basis:** Back every claim with professional reasoning.

**Output Consistency Rules:**
- **Length:** The "Executive Summary" MUST be at least 3-5 sentences long.
- **Language:** HEBREW ONLY.

**Task Requirements (JSON Output):**

1.  **Resource Audit:** Critical check of equipment suitability.
2.  **Developmental Check:** Activity + CHILD EMOTION + Milestone analysis.
3.  **Executive Summary:** Concise analysis with timestamps.
4. **Environmental Scan:** Sensory load & layout analysis.
5.  **Preservation (Keep):** 3 structured recommendations.
6.  **Improvement (Fix):** 3 recommendations containing:
    - **Correction Script:** What to do/say instead.
    - **3 Remedial Activities:** Specific emotional-response games/actions.
7.  **Scoring:** 1-10 assessment.
8.  **Stakeholder Messages:** Specific notes for Parents, Authority, and Director (Must be LAST).`;

export async function analyzeVideo(videoFile: File): Promise<AnalysisResult> {
    const startTime = Date.now();

    try {
        console.log('🧠 Starting Emma analysis with Gemini 2.5 Flash...');
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const videoData = await fileToGenerativePart(videoFile);

        const result = await model.generateContent({
            contents: [
                { role: 'user', parts: [{ text: EMMA_PROMPT }, videoData] }
            ],
            generationConfig: {
                temperature: 0.7,
                topP: 0.8,
                topK: 40,
                responseMimeType: "application/json",
                responseSchema: {
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

        const response = result.response.text();
        const cleanResponse = cleanJsonResponse(response);
        const parsed: AnalysisResult = JSON.parse(cleanResponse);

        const duration = (Date.now() - startTime) / 1000;
        parsed.duration = duration;

        console.log('✅ Emma analysis complete!');
        return parsed;

    } catch (error: any) {
        console.error('❌ Emma analysis error:', error);
        throw error;
    }
}

export async function chatWithEmma(
    history: { role: string; parts: { text: string }[] }[],
    message: string,
    analysisResult: AnalysisResult
): Promise<string> {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const systemPrompt = `
    You are "Emma", a senior pedagogical supervisor and behavioral analyst.
    You have just analyzed a kindergarten video and produced the following report:
    ${JSON.stringify(analysisResult, null, 2)}

    Your goal is to answer the user's questions about this specific report, explain your findings, and offer professional advice.

    Guidelines:
    - Answer in HEBREW only.
    - Be professional, empathetic, and constructive.
    - Refer to specific data points from the report (scores, events, recommendations).
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
        return "סליחה, נתקלתי בבעיה בעיבוד התשובה. אנא נסה שוב.";
    }
}
