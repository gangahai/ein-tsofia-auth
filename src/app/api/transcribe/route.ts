import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const audioFile = formData.get('audio') as File;

        if (!audioFile) {
            return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
        }

        // Convert file to base64
        const arrayBuffer = await audioFile.arrayBuffer();
        const base64Audio = Buffer.from(arrayBuffer).toString('base64');

        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const result = await model.generateContent({
            contents: [
                {
                    role: 'user',
                    parts: [
                        {
                            text: `Transcribe the following audio to Hebrew accurately. 
                        Also analyze the emotional tone of the speaker.
                        Additionally, estimate the speaker's profile:
                        - Role: Father, Mother, Boy, Girl, Grandparent, etc.
                        - Age Estimate: e.g., "30-40", "5-8", etc.
                        - Gender: Male, Female
                        
                        Return a JSON object with:
                        - text: The Hebrew transcription
                        - emotion: A brief description of the emotion (in Hebrew)
                        - speaker_profile: Object containing role, age_estimate, gender (all in Hebrew)`
                        },
                        {
                            inlineData: {
                                mimeType: audioFile.type || 'audio/webm',
                                data: base64Audio
                            }
                        }
                    ]
                }
            ],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        text: { type: SchemaType.STRING },
                        emotion: { type: SchemaType.STRING },
                        speaker_profile: {
                            type: SchemaType.OBJECT,
                            properties: {
                                role: { type: SchemaType.STRING },
                                age_estimate: { type: SchemaType.STRING },
                                gender: { type: SchemaType.STRING }
                            },
                            required: ["role", "age_estimate", "gender"]
                        }
                    },
                    required: ["text", "emotion", "speaker_profile"]
                }
            }
        });

        const responseText = result.response.text();
        const jsonResponse = JSON.parse(responseText);

        return NextResponse.json(jsonResponse);

    } catch (error) {
        console.error('Transcription error:', error);
        return NextResponse.json({ error: 'Transcription failed' }, { status: 500 });
    }
}
