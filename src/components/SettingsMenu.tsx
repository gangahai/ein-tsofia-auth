'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthProvider';
import { useRouter, usePathname } from 'next/navigation';
import FeedbackReportModal from './FeedbackReportModal';
import { User } from 'firebase/auth';
import { UserProfile } from '@/types/types';
import PrivacyPolicyModal from './PrivacyPolicyModal';

interface SettingsMenuProps {
    user: User | null;
    userProfile: UserProfile | null;
}

export function SettingsMenu({ user, userProfile }: SettingsMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeModal, setActiveModal] = useState<'privacy' | 'about' | 'password' | null>(null);
    const [showFeedbackReport, setShowFeedbackReport] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [passwordError, setPasswordError] = useState(false);
    const [imageError, setImageError] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { signOut } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [passwordTarget, setPasswordTarget] = useState<'developer' | 'prompt'>('developer');

    const handleLogout = async () => {
        try {
            await signOut();
            router.push('/'); // Redirect to the main landing page
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const handlePasswordSubmit = () => {
        if (passwordTarget === 'developer') {
            if (passwordInput === '1234') {
                setActiveModal(null);
                setShowFeedbackReport(true);
                setPasswordInput('');
                setPasswordError(false);
            } else {
                setPasswordError(true);
            }
        } else if (passwordTarget === 'prompt') {
            if (passwordInput === '8787') {
                setActiveModal(null);
                setPasswordInput('');
                setPasswordError(false);
                window.dispatchEvent(new CustomEvent('SHOW_PROMPT_VIEWER'));
            } else {
                setPasswordError(true);
            }
        }
    };

    const toggleMenu = () => setIsOpen(!isOpen);

    if (!user) return null;

    return (
        <div className="relative" ref={menuRef}>
            {/* Backdrop for closing menu */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* User Profile Button (Acts as Settings Toggle) */}
            <button
                type="button"
                onClick={toggleMenu}
                className="relative group flex items-center gap-2 bg-slate-800/50 py-1.5 px-3 rounded-full border border-slate-700 hover:bg-slate-700 hover:border-slate-500 transition-all overflow-hidden shadow-sm hover:shadow-md"
            >
                {/* Normal State - Fades out on hover */}
                <div className="flex items-center gap-2 transition-all duration-300 group-hover:opacity-0 group-hover:translate-y-2">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-slate-200">{user.displayName || 'משתמש'}</p>
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
                        <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                            {user.displayName?.[0]?.toUpperCase() || 'U'}
                        </div>
                    )}
                </div>

                {/* Hover State - Fades in */}
                <div className="absolute inset-0 flex items-center justify-center bg-slate-800/90 text-white font-bold opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-full group-hover:translate-y-0 backdrop-blur-sm">
                    <span className="text-xl">⚙️</span>
                </div>
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full left-0 mt-3 w-56 bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-[0_0_40px_-10px_rgba(8,145,178,0.3)] border border-slate-700/50 overflow-hidden z-50 ring-1 ring-white/10"
                    >
                        {/* Header Gradient Line */}
                        <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 opacity-80" />

                        <div className="p-3 space-y-2">
                            {/* Language */}
                            <div className="w-full px-4 py-3 flex items-center justify-between rounded-xl bg-slate-800/40 border border-slate-700/30 group cursor-default shadow-sm hover:bg-slate-800/60 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 shadow-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S12 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S12 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                                        </svg>
                                    </div>
                                    <span className="text-sm font-medium text-slate-300">שפה</span>
                                </div>
                                <div className="px-2 py-1 rounded text-xs font-bold bg-slate-900 text-slate-400 border border-slate-700 flex gap-1.5 items-center">
                                    <span>🇮🇱</span>
                                    <span>עברית</span>
                                </div>
                            </div>

                            <div className="h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent my-2" />

                            {/* Analyze Page Tools */}
                            {pathname === '/analyze' && (
                                <>
                                    <div className="px-4 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-80">כלים</div>

                                    {/* Show Prompt */}
                                    <button
                                        onClick={() => {
                                            setPasswordTarget('prompt');
                                            setActiveModal('password');
                                            setIsOpen(false);
                                        }}
                                        className="w-full px-3 py-2.5 flex items-center justify-between rounded-xl hover:bg-slate-800 transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700/50 flex items-center justify-center text-slate-400 group-hover:text-pink-400 group-hover:border-pink-500/30 group-hover:bg-pink-500/10 transition-all shadow-sm">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            </div>
                                            <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">הצג פרומפט</span>
                                        </div>
                                    </button>

                                    {/* Demo Report */}
                                    <button
                                        onClick={() => {
                                            window.dispatchEvent(new CustomEvent('LOAD_DEMO_ANALYSIS'));
                                            setIsOpen(false);
                                        }}
                                        className="w-full px-3 py-2.5 flex items-center justify-between rounded-xl hover:bg-slate-800 transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700/50 flex items-center justify-center text-slate-400 group-hover:text-amber-400 group-hover:border-amber-500/30 group-hover:bg-amber-500/10 transition-all shadow-sm">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-1.23-7.579-2.618M5 14.5l1.402 1.402c1.232 1.232.65 3.318-1.065 3.61a48.309 48.309 0 01-1.932-.61" />
                                                    {/* Added bubbles or simpler Flask icon */}
                                                </svg>
                                            </div>
                                            <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">דוח לדוגמה</span>
                                        </div>
                                    </button>

                                    <div className="h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent my-2" />
                                </>
                            )}

                            {/* Privacy */}
                            <button
                                onClick={() => { setActiveModal('privacy'); setIsOpen(false); }}
                                className="w-full px-3 py-2.5 flex items-center justify-between rounded-xl hover:bg-slate-800 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700/50 flex items-center justify-center text-slate-400 group-hover:text-cyan-400 group-hover:border-cyan-500/30 group-hover:bg-cyan-500/10 transition-all shadow-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                        </svg>
                                    </div>
                                    <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">פרטיות</span>
                                </div>
                            </button>

                            {/* About */}
                            <button
                                onClick={() => { setActiveModal('about'); setIsOpen(false); }}
                                className="w-full px-3 py-2.5 flex items-center justify-between rounded-xl hover:bg-slate-800 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700/50 flex items-center justify-center text-slate-400 group-hover:text-blue-400 group-hover:border-blue-500/30 group-hover:bg-blue-500/10 transition-all shadow-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                                        </svg>
                                    </div>
                                    <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">אודות</span>
                                </div>
                            </button>

                            {/* Developers */}
                            <button
                                onClick={() => {
                                    setPasswordTarget('developer');
                                    setActiveModal('password');
                                    setIsOpen(false);
                                }}
                                className="w-full px-3 py-2.5 flex items-center justify-between rounded-xl hover:bg-slate-800 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700/50 flex items-center justify-center text-slate-400 group-hover:text-purple-400 group-hover:border-purple-500/30 group-hover:bg-purple-500/10 transition-all shadow-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 18" />
                                        </svg>
                                    </div>
                                    <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">מפתחים</span>
                                </div>
                            </button>

                            <div className="h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent my-2" />

                            {/* Logout */}
                            <button
                                onClick={handleLogout}
                                className="w-full px-3 py-2.5 flex items-center justify-between rounded-xl hover:bg-red-900/10 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700/50 flex items-center justify-center text-slate-400 group-hover:text-red-400 group-hover:border-red-500/30 group-hover:bg-red-500/10 transition-all shadow-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                                        </svg>
                                    </div>
                                    <span className="text-sm font-bold text-slate-300 group-hover:text-red-400">התנתק</span>
                                </div>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modals */}
            <AnimatePresence>
                {activeModal && activeModal !== 'privacy' && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setActiveModal(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative overflow-hidden"
                        >
                            <button
                                onClick={() => setActiveModal(null)}
                                className="absolute top-4 left-4 p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            {activeModal === 'about' && (
                                <div className="text-right">
                                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center justify-end gap-3 border-b pb-4">
                                        אודות המערכת <span className="text-3xl">ℹ️</span>
                                    </h2>
                                    <div className="space-y-6 text-gray-600 leading-relaxed">
                                        <div className="flex justify-center mb-8">
                                            <div className="w-28 h-28 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-full flex items-center justify-center text-5xl shadow-inner border border-cyan-100">
                                                👁️
                                            </div>
                                        </div>
                                        <p className="text-lg text-center font-medium text-gray-800">
                                            מערכת מתקדמת לניתוח אירועים וסיטואציות באמצעות בינה מלאכותית.
                                        </p>
                                        <p className="text-center text-gray-500">
                                            המערכת מספקת תובנות עמוקות, מזהה רגשות ודינמיקות, ומסייעת בקבלת החלטות מושכלות בזמן אמת.
                                        </p>
                                        <div className="bg-gray-50 rounded-xl p-4 mt-8 text-center">
                                            <p className="text-sm font-bold text-gray-800">גרסה 1.0.0 (Beta)</p>
                                            <p className="text-xs text-gray-500 mt-1">פותח ע"י צוות עין צופיה</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeModal === 'password' && (
                                <div className="text-right">
                                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center justify-end gap-3 border-b pb-4">
                                        {passwordTarget === 'developer' ? 'כניסת מפתחים' : 'צפייה בפרומפט'} <span className="text-3xl">{passwordTarget === 'developer' ? '🛠️' : '👁️'}</span>
                                    </h2>
                                    <div className="space-y-4">
                                        <p className="text-gray-600 mb-2">אנא הזן סיסמה:</p>
                                        <input
                                            type="password"
                                            value={passwordInput}
                                            onChange={(e) => {
                                                setPasswordInput(e.target.value);
                                                setPasswordError(false);
                                            }}
                                            onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                                            className="w-full p-3 border border-gray-300 rounded-xl text-center text-2xl tracking-widest focus:ring-2 focus:ring-cyan-500 outline-none text-gray-800"
                                            autoFocus
                                            placeholder="••••"
                                        />
                                        {passwordError && (
                                            <p className="text-red-500 text-sm font-bold text-center">סיסמה שגויה</p>
                                        )}
                                        <button
                                            onClick={handlePasswordSubmit}
                                            className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-colors mt-4"
                                        >
                                            כניסה
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <PrivacyPolicyModal
                isOpen={activeModal === 'privacy'}
                onClose={() => setActiveModal(null)}
            />

            <FeedbackReportModal
                isOpen={showFeedbackReport}
                onClose={() => setShowFeedbackReport(false)}
            />
        </div>
    );
}
