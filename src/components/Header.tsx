'use client';

import { useAuth } from './AuthProvider';
import { EmmaWidget } from './EmmaWidget';
import { SettingsMenu } from './SettingsMenu';
import Link from 'next/link';
import { useState } from 'react';
import { User } from 'firebase/auth';
import { UserProfile } from '@/types/types';

interface UserProfileDisplayProps {
    user: User;
    userProfile: UserProfile | null;
}

function UserProfileDisplay({ user, userProfile }: UserProfileDisplayProps) {
    const [imageError, setImageError] = useState(false);

    return (
        <div className="flex items-center gap-2 bg-slate-800/50 py-1.5 px-3 rounded-full border border-slate-700">
            <div className="text-right hidden sm:block">
                <p className="text-sm font-bold">{user.displayName || 'משתמש'}</p>
                <p className="text-xs text-slate-400">{userProfile?.userType === 'family' ? 'משפחה' : userProfile?.userType === 'caregiver' ? 'מטפל' : 'אורח'}</p>
            </div>
            {!imageError && user.photoURL ? (
                <img
                    src={user.photoURL}
                    alt={user.displayName || ''}
                    className="w-8 h-8 rounded-full border border-slate-600"
                    onError={() => setImageError(true)}
                />
            ) : (
                <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-xs font-bold text-white">
                    {user.displayName?.[0]?.toUpperCase() || 'U'}
                </div>
            )}
        </div>
    );
}

export function Header() {
    const { user, userProfile } = useAuth();

    return (
        <header className="bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
                    <div className="w-16 h-16 flex items-center justify-center">
                        <img src="/header-logo.jpg" alt="Ein Tsofia" className="w-full h-full object-contain" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-wide">עין צופיה</h1>
                        <p className="text-xs text-slate-400">מערכת ניהול חכמה</p>
                    </div>
                </Link>

                {/* Right Side Actions */}
                <div className="flex items-center gap-2">
                    {/* Settings Menu */}
                    <SettingsMenu />

                    {/* Emma Widget in Header Mode */}
                    <div className="border-l border-slate-700 pl-2 ml-1">
                        <EmmaWidget mode="header" />
                    </div>

                    {/* User Profile */}
                    {user && (
                        <UserProfileDisplay user={user} userProfile={userProfile} />
                    )}
                </div>
            </div>
        </header>
    );
}
