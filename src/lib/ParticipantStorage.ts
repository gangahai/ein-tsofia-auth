// Participant Storage - Managing saved participants in localStorage
// Allows auto-recognition of participants across multiple analyses

import { Participant } from './gemini';

const STORAGE_KEY = 'ein_tsofia_participants';

export interface SavedParticipant extends Participant {
    savedAt: string; // ISO timestamp
    usageCount: number; // How many times this participant was identified
}

/**
 * Save or update a participant in localStorage
 */
export function saveParticipant(participant: Participant): void {
    const saved = loadAllParticipants();

    // Check if participant already exists (by name or similarity)
    const existingIndex = saved.findIndex(p =>
        p.name.toLowerCase() === participant.name.toLowerCase()
    );

    if (existingIndex >= 0) {
        // Update existing participant
        saved[existingIndex] = {
            ...participant,
            savedAt: new Date().toISOString(),
            usageCount: saved[existingIndex].usageCount + 1
        };
    } else {
        // Add new participant
        saved.push({
            ...participant,
            savedAt: new Date().toISOString(),
            usageCount: 1
        });
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    console.log('💾 Saved participant:', participant.name);
}

/**
 * Save multiple participants at once
 */
export function saveParticipants(participants: Participant[]): void {
    participants.forEach(p => saveParticipant(p));
}

/**
 * Load all saved participants
 */
export function loadAllParticipants(): SavedParticipant[] {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return [];

        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error('Error loading participants:', error);
        return [];
    }
}

/**
 * Find a matching participant by description or age
 * Returns null if no good match found
 */
export function findMatchingParticipant(
    description: string,
    age?: number
): SavedParticipant | null {
    const saved = loadAllParticipants();

    // Try exact name match first
    const exactMatch = saved.find(p =>
        p.name.toLowerCase() === description.toLowerCase()
    );
    if (exactMatch) return exactMatch;

    // Try fuzzy match by description/notes
    const fuzzyMatch = saved.find(p => {
        const notesMatch = p.notes?.toLowerCase().includes(description.toLowerCase());
        const ageMatch = age && p.age === age;
        return notesMatch || ageMatch;
    });

    return fuzzyMatch || null;
}

/**
 * Auto-fill participant data from saved participants
 * Matches by description from AI identification
 */
export function autoFillParticipants(identifiedParticipants: Participant[]): Participant[] {
    return identifiedParticipants.map(identified => {
        const match = findMatchingParticipant(identified.notes || '', identified.age);

        if (match) {
            console.log(`✅ Auto-filled ${identified.id} with saved data:`, match.name);
            return {
                ...identified,
                name: match.name,
                relationship: match.relationship,
                // Keep AI's notes but append saved ones
                notes: match.notes ? `${identified.notes}\n\nהערות קודמות: ${match.notes}` : identified.notes
            };
        }

        return identified;
    });
}

/**
 * Clear all saved participants (for privacy/reset)
 */
export function clearAllParticipants(): void {
    localStorage.removeItem(STORAGE_KEY);
    console.log('🗑️ Cleared all saved participants');
}

/**
 * Get statistics about saved participants
 */
export function getParticipantStats(): {
    total: number;
    mostUsed: SavedParticipant | null;
} {
    const saved = loadAllParticipants();

    if (saved.length === 0) {
        return { total: 0, mostUsed: null };
    }

    const mostUsed = saved.reduce((prev, current) =>
        (current.usageCount > prev.usageCount) ? current : prev
    );

    return {
        total: saved.length,
        mostUsed
    };
}
