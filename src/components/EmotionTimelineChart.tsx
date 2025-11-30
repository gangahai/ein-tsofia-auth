'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { EmotionTimelinePoint } from '@/lib/gemini';

interface EmotionTimelineChartProps {
    data: EmotionTimelinePoint[];
}

export default function EmotionTimelineChart({ data }: EmotionTimelineChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-8 text-center">
                <p className="text-gray-600">אין נתוני רגשות זמינים</p>
            </div>
        );
    }

    // Extract participant names from first data point
    const participantKeys = Object.keys(data[0] || {}).filter(
        key => key !== 'timestamp' && key !== 'timestampSeconds'
    );

    // Color palette for participants
    const colors = [
        '#8884d8', // blue
        '#82ca9d', // green
        '#ffc658', // yellow
        '#ff7c7c', // red
        '#a28bd4', // purple
    ];

    return (
        <div className="bg-white rounded-3xl p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">📈 גרף רגשות לאורך זמן</h3>
            <p className="text-sm text-gray-600 mb-4">
                רמת רגש: 1 = שלילי מאוד, 5 = חיובי מאוד
            </p>

            <ResponsiveContainer width="100%" height={400}>
                <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis
                        dataKey="timestamp"
                        label={{ value: 'זמן', position: 'insideBottomRight', offset: -10 }}
                        tick={{ fontSize: 12 }}
                    />
                    <YAxis
                        domain={[1, 5]}
                        ticks={[1, 2, 3, 4, 5]}
                        label={{ value: 'רמת רגש', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#fff',
                            border: '2px solid #e0e0e0',
                            borderRadius: '8px',
                            direction: 'rtl'
                        }}
                        labelStyle={{ fontWeight: 'bold', marginBottom: '8px' }}
                    />
                    <Legend
                        wrapperStyle={{ paddingTop: '20px', direction: 'rtl' }}
                    />
                    {participantKeys.map((key, index) => (
                        <Line
                            key={key}
                            type="monotone"
                            dataKey={key}
                            name={key.replace('_', ' ')}
                            stroke={colors[index % colors.length]}
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>

            <div className="mt-6 grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map(level => (
                    <div key={level} className="text-center p-2 bg-gray-50 rounded-lg">
                        <div className="font-bold text-lg">{level}</div>
                        <div className="text-xs text-gray-600">
                            {level === 1 && 'שלילי מאוד'}
                            {level === 2 && 'שלילי'}
                            {level === 3 && 'ניטרלי'}
                            {level === 4 && 'חיובי'}
                            {level === 5 && 'חיובי מאוד'}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
