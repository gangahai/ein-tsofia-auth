export const API_KEYS = {
    'GanGah': process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'AIzaSyAApvSqk7dfyxq4HpnygQiY-LO8jFtDQNw',
    'סירגי': 'AIzaSyBXCmTDuk6lkNLQud5Rkv9TvfuvSYo_X4o'
} as const;

export type APIKeyName = keyof typeof API_KEYS;

/**
 * Get the currently selected API key from localStorage
 * Falls back to 'GanGah' if nothing is selected or in SSR context
 */
export function getSelectedAPIKey(): string {
    // Server-side rendering fallback
    if (typeof window === 'undefined') {
        return API_KEYS['GanGah'];
    }

    try {
        const selectedKey = localStorage.getItem('selectedAPIKey') as APIKeyName | null;
        if (selectedKey && selectedKey in API_KEYS) {
            return API_KEYS[selectedKey];
        }
    } catch (e) {
        console.warn('Failed to read selectedAPIKey from localStorage', e);
    }

    return API_KEYS['GanGah'];
}

/**
 * Get the name of the currently selected API key
 */
export function getSelectedAPIKeyName(): APIKeyName {
    if (typeof window === 'undefined') {
        return 'GanGah';
    }

    try {
        const selectedKey = localStorage.getItem('selectedAPIKey') as APIKeyName | null;
        if (selectedKey && selectedKey in API_KEYS) {
            return selectedKey;
        }
    } catch (e) {
        console.warn('Failed to read selectedAPIKey from localStorage', e);
    }

    return 'GanGah';
}

/**
 * Set the selected API key name in localStorage
 */
export function setSelectedAPIKey(keyName: APIKeyName): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.setItem('selectedAPIKey', keyName);
    } catch (e) {
        console.error('Failed to save selectedAPIKey to localStorage', e);
    }
}
