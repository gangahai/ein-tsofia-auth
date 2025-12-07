import React from 'react';

// Sticker-style 3D Icons for a "Special" look
export const UserTypeIcons: Record<string, React.ReactNode> = {
    family: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl filter hover:brightness-110 transition-all">
            <defs>
                <linearGradient id="houseBody" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#818CF8" />
                    <stop offset="100%" stopColor="#4F46E5" />
                </linearGradient>
                <linearGradient id="roof" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#F472B6" />
                    <stop offset="100%" stopColor="#DB2777" />
                </linearGradient>
                <filter id="shadow">
                    <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.3" />
                </filter>
            </defs>
            <g filter="url(#shadow)">
                {/* House Base */}
                <rect x="25" y="45" width="50" height="40" rx="4" fill="url(#houseBody)" stroke="#312E81" strokeWidth="2" />
                {/* Door */}
                <path d="M42 65H58V85H42V65Z" fill="#C7D2FE" stroke="#312E81" strokeWidth="2" />
                {/* Roof */}
                <path d="M15 45L50 15L85 45" fill="url(#roof)" stroke="#831843" strokeWidth="2" strokeLinejoin="round" />
                <path d="M20 45L50 20L80 45" fill="none" stroke="#FCE7F3" strokeWidth="2" opacity="0.5" />
                {/* Heart Badge */}
                <circle cx="70" cy="40" r="12" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="2" />
                <path d="M70 45L66 40C64 38 64 36 66 35C67 34 69 34 70 36C71 34 73 34 74 35C76 36 76 38 74 40L70 45Z" fill="#EC4899" />
            </g>
        </svg>
    ),
    caregiver: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl filter hover:brightness-110 transition-all">
            <defs>
                <linearGradient id="clipBoard" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#22D3EE" />
                    <stop offset="100%" stopColor="#0891B2" />
                </linearGradient>
            </defs>
            <g filter="url(#shadow)">
                {/* Clipboard */}
                <rect x="25" y="20" width="50" height="65" rx="4" fill="url(#clipBoard)" stroke="#164E63" strokeWidth="2" />
                {/* Paper */}
                <rect x="30" y="30" width="40" height="50" fill="#FFFFFF" stroke="#CFFAFE" strokeWidth="1" />
                {/* Lines */}
                <path d="M35 40H65M35 50H65M35 60H50" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
                {/* Clip */}
                <rect x="35" y="15" width="30" height="10" rx="2" fill="#64748B" stroke="#334155" strokeWidth="2" />
                {/* Stethoscope wrapping */}
                <path d="M20 30C15 40 15 60 25 70" fill="none" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
                <circle cx="25" cy="70" r="6" fill="#CBD5E1" stroke="#475569" strokeWidth="2" />
                <circle cx="70" cy="70" r="14" fill="#F43F5E" stroke="#881337" strokeWidth="2" />
                <path d="M64 70H76M70 64V76" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
            </g>
        </svg>
    ),
    kindergarten: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl filter hover:brightness-110 transition-all">
            <defs>
                <linearGradient id="blockRed" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#F87171" />
                    <stop offset="100%" stopColor="#DC2626" />
                </linearGradient>
                <linearGradient id="blockBlue" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#60A5FA" />
                    <stop offset="100%" stopColor="#2563EB" />
                </linearGradient>
                <linearGradient id="blockYellow" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FBBF24" />
                    <stop offset="100%" stopColor="#D97706" />
                </linearGradient>
            </defs>
            <g filter="url(#shadow)">
                {/* Building Blocks */}
                {/* Bottom Block Left */}
                <rect x="20" y="55" width="25" height="25" rx="2" fill="url(#blockYellow)" stroke="#B45309" strokeWidth="2" />
                <circle cx="32.5" cy="67.5" r="5" fill="#FDE68A" opacity="0.6" />
                {/* Bottom Block Right */}
                <rect x="45" y="55" width="25" height="25" rx="2" fill="url(#blockBlue)" stroke="#1E40AF" strokeWidth="2" />
                {/* Top Block */}
                <path d="M32 30L58 30L45 15L32 30Z" fill="url(#blockRed)" stroke="#991B1B" strokeWidth="2" strokeLinejoin="round" />
                <rect x="32" y="30" width="26" height="25" rx="2" fill="url(#blockRed)" stroke="#991B1B" strokeWidth="2" />
                {/* Flag */}
                <path d="M58 30V10L75 18L58 25" fill="#10B981" stroke="#065F46" strokeWidth="2" strokeLinejoin="round" />
                <line x1="58" y1="10" x2="58" y2="55" stroke="#374151" strokeWidth="2" />
            </g>
        </svg>
    )
};
