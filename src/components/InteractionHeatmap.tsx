'use client';

import { InteractionDataPoint } from '@/lib/gemini';

interface InteractionHeatmapProps {
    interactions: InteractionDataPoint[];
    participantNames: string[];
}

export default function InteractionHeatmap({ interactions, participantNames }: InteractionHeatmapProps) {
    if (!interactions || interactions.length === 0 || participantNames.length === 0) {
        return (
            <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-8 text-center">
                <p className="text-gray-600">אין נתוני אינטר אקציה זמינים</p>
            </div>
        );
    }

    // Create matrix of interactions
    const matrix: Record<string, Record<string, { strength: number; type: string }>> = {};

    participantNames.forEach(from => {
        matrix[from] = {};
        participantNames.forEach(to => {
            matrix[from][to] = { strength: 0, type: 'neutral' };
        });
    });

    // Fill matrix with interaction data
    interactions.forEach(interaction => {
        if (matrix[interaction.from] && matrix[interaction.from][interaction.to]) {
            matrix[interaction.from][interaction.to] = {
                strength: interaction.strength,
                type: interaction.type
            };
        }
    });

    // Get color based on strength and type
    const getColor = (strength: number, type: string) => {
        if (strength === 0) return 'bg-gray-100';

        const intensity = Math.floor((strength / 10) * 5); // 0-5 levels

        if (type === 'supportive') {
            const greens = ['bg-green-100', 'bg-green-200', 'bg-green-300', 'bg-green-400', 'bg-green-500', 'bg-green-600'];
            return greens[intensity];
        } else if (type === 'conflicting') {
            const reds = ['bg-red-100', 'bg-red-200', 'bg-red-300', 'bg-red-400', 'bg-red-500', 'bg-red-600'];
            return reds[intensity];
        } else {
            const blues = ['bg-blue-100', 'bg-blue-200', 'bg-blue-300', 'bg-blue-400', 'bg-blue-500', 'bg-blue-600'];
            return blues[intensity];
        }
    };

    const getTypeIcon = (type: string) => {
        if (type === 'supportive') return '🤝';
        if (type === 'conflicting') return '⚠️';
        return '↔️';
    };

    return (
        <div className="bg-white rounded-3xl p-8">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">🔥 מפת חום - אינטראקציות בין משתתפים</h3>
            <p className="text-sm text-gray-600 mb-6">
                עוצמת האינטראקציה מוצגת בצבע (כהה יותר = חזק יותר)
            </p>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            <th className="p-2 border-2 border-gray-300 bg-gray-50"></th>
                            {participantNames.map(name => (
                                <th key={name} className="p-3 border-2 border-gray-300 bg-gray-50 font-bold text-sm">
                                    {name}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {participantNames.map(from => (
                            <tr key={from}>
                                <td className="p-3 border-2 border-gray-300 bg-gray-50 font-bold text-sm">
                                    {from}
                                </td>
                                {participantNames.map(to => {
                                    const cell = matrix[from][to];
                                    const isDiagonal = from === to;

                                    return (
                                        <td
                                            key={to}
                                            className={`p-4 border-2 border-gray-300 text-center transition-all hover:scale-105 cursor-pointer ${isDiagonal
                                                    ? 'bg-gray-200 cursor-not-allowed'
                                                    : getColor(cell.strength, cell.type)
                                                }`}
                                            title={isDiagonal ? 'עצמי' : `${from} → ${to}: ${cell.strength}/10 (${cell.type})`}
                                        >
                                            {!isDiagonal && cell.strength > 0 && (
                                                <div className="flex flex-col items-center">
                                                    <span className="text-2xl">{getTypeIcon(cell.type)}</span>
                                                    <span className="text-xs font-bold mt-1">{cell.strength}</span>
                                                </div>
                                            )}
                                            {isDiagonal && <span className="text-gray-400">—</span>}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Legend */}
            <div className="mt-6 flex flex-wrap gap-4 justify-center">
                <div className="flex items-center gap-2">
                    <span className="text-xl">🤝</span>
                    <span className="text-sm">תומך</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xl">⚠️</span>
                    <span className="text-sm">קונפליקט</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xl">↔️</span>
                    <span className="text-sm">ניטרלי</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-200 border border-gray-400"></div>
                    <span className="text-sm">עצמי</span>
                </div>
            </div>
        </div>
    );
}
