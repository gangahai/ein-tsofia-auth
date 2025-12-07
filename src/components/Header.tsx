'use client';

import { useAuth } from './AuthProvider';
import { SettingsMenu } from './SettingsMenu';
import Link from 'next/link';


export function Header() {
    const { user, userProfile } = useAuth();

    return (
        <header className="bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg sticky top-0 z-40">
            <div className="max-w-5xl mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
                    <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center">
                        <img src="/header-logo.jpg" alt="Ein Tsofia" className="w-full h-full object-contain" />
                    </div>
                    <div className="flex flex-col items-center md:items-start">
                        <h1 className="text-lg md:text-xl font-bold tracking-wide">עין צופיה</h1>
                        <p className="text-[10px] text-cyan-200 mt-0.5 font-medium tracking-wide">מתחילים תהליך קסום יחד</p>
                    </div>
                </Link>

                {/* Right Side Actions - Unified Menu */}
                <div className="flex items-center gap-2">
                    {user && (
                        <SettingsMenu user={user} userProfile={userProfile} />
                    )}
                </div>
            </div>
        </header>
    );
}
