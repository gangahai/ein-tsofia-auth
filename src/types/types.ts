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
}

export const userTypeOptions: UserTypeOption[] = [
    {
        id: 'family',
        icon: '🏠',
        title: 'פרטי (ביתי)',
        color: '#4F46E5', // indigo
        bgColor: '#EEF2FF',
        hoverColor: '#E0E7FF'
    },
    {
        id: 'caregiver',
        icon: '👨‍⚕️',
        title: 'מקצועי (מטפל)',
        color: '#0891B2', // cyan
        bgColor: '#ECFEFF',
        hoverColor: '#CFFAFE'
    },
    {
        id: 'kindergarten',
        icon: '🏫',
        title: 'מוסדי (גני ילדים)',
        color: '#DC2626', // red
        bgColor: '#FEF2F2',
        hoverColor: '#FEE2E2'
    }
];
