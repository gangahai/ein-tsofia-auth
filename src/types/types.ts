// TypeScript types for Ein Tsofia system

import { Timestamp } from 'firebase/firestore';

export type UserType = 'family' | 'caregiver' | 'kindergarten' | null;

export interface UserProfile {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL?: string | null;
    userType: UserType;
    privacyPolicyAccepted: boolean;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface UserTypeOption {
    id: UserType;
    icon: string;
    title: string;
    color: string;
    bgColor: string;
    hoverColor: string;
    description: string;
}

export const userTypeOptions: UserTypeOption[] = [
    {
        id: 'family',
        icon: '🏠',
        title: 'פרטי (ביתי)',
        color: '#4F46E5', // indigo
        bgColor: '#EEF2FF',
        hoverColor: '#E0E7FF',
        description: 'מיקוד בדינמיקה הבין-אישית בבית, ניתוח אינטראקציות רגשיות וחיזוק הקשר ההורי והמשפחתי.'
    },
    {
        id: 'caregiver',
        icon: '👨‍⚕️',
        title: 'מקצועי (מטפל)',
        color: '#0891B2', // cyan
        bgColor: '#ECFEFF',
        hoverColor: '#CFFAFE',
        description: 'כלים קליניים מעמיקים, אבחון דפוסי התנהגות וסימנים דקים של תקשורת לא מילולית.'
    },
    {
        id: 'kindergarten',
        icon: '🏫',
        title: 'מוסדי (גני ילדים)',
        color: '#DC2626', // red
        bgColor: '#FEF2F2',
        hoverColor: '#FEE2E2',
        description: 'ניתוח אינטראקציות קבוצתיות, זיהוי דפוסים חברתיים ושיפור האקלים החינוכי בגן.'
    }
];

export interface PromptSection {
    identity: string;
    forensic: string;
    psychology: string;
    safety: string;
    output: string;
}

export interface PromptConfig {
    sections: PromptSection;
    unified?: string;
    keywords: string[];
    sensitivity: number;
    lastUpdated?: Date;
    version: number;
    layoutConfig?: string[];
}
