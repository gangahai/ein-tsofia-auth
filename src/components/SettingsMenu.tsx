'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthProvider';
import { useRouter } from 'next/navigation';
import FeedbackReportModal from './FeedbackReportModal';

export function SettingsMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeModal, setActiveModal] = useState<'privacy' | 'about' | 'password' | null>(null);
    const [showFeedbackReport, setShowFeedbackReport] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [passwordError, setPasswordError] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { signOut } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await signOut();
            router.push('/'); // Redirect to the main landing page
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const handleDeveloperLogin = () => {
        if (passwordInput === '1234') {
            setActiveModal(null);
            setShowFeedbackReport(true);
            setPasswordInput('');
            setPasswordError(false);
        } else {
            setPasswordError(true);
        }
    };

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleMenu = () => setIsOpen(!isOpen);

    return (
        <div className="relative" ref={menuRef}>
            {/* Settings Button */}
            <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleMenu}
                className="p-2 rounded-full hover:bg-slate-700/50 text-slate-300 hover:text-white transition-colors"
                title="הגדרות"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.217.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full left-0 mt-3 w-64 bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden z-50 ring-1 ring-black/5"
                    >
                        <div className="p-2 space-y-1">
                            {/* Language */}
                            <div className="px-4 py-3 flex items-center justify-between rounded-xl hover:bg-slate-700/50 transition-colors group cursor-default">
                                <div className="flex items-center gap-3">
                                    <span className="text-xl">🌐</span>
                                    <span className="text-sm font-medium text-slate-200">שפה</span>
                                </div>
                                <div className="flex items-center gap-2 bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-600">
                                    <span className="text-xs font-bold text-slate-300">עברית</span>
                                    <span className="text-sm">🇮🇱</span>
                                </div>
                            </div>

                            <div className="h-px bg-slate-700/50 my-1 mx-2" />

                            {/* Privacy */}
                            <button
                                onClick={() => { setActiveModal('privacy'); setIsOpen(false); }}
                                className="w-full px-4 py-3 flex items-center justify-between rounded-xl hover:bg-slate-700/50 text-right transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-xl group-hover:scale-110 transition-transform">🔒</span>
                                    <span className="text-sm font-medium text-slate-200 group-hover:text-white">פרטיות</span>
                                </div>
                                <span className="text-slate-500 group-hover:text-slate-400">→</span>
                            </button>

                            {/* About */}
                            <button
                                onClick={() => { setActiveModal('about'); setIsOpen(false); }}
                                className="w-full px-4 py-3 flex items-center justify-between rounded-xl hover:bg-slate-700/50 text-right transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-xl group-hover:scale-110 transition-transform">ℹ️</span>
                                    <span className="text-sm font-medium text-slate-200 group-hover:text-white">אודות</span>
                                </div>
                                <span className="text-slate-500 group-hover:text-slate-400">→</span>
                            </button>

                            {/* Developers (Hidden/Protected) */}
                            <button
                                onClick={() => { setActiveModal('password'); setIsOpen(false); }}
                                className="w-full px-4 py-3 flex items-center justify-between rounded-xl hover:bg-slate-700/50 text-right transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-xl group-hover:scale-110 transition-transform">🛠️</span>
                                    <span className="text-sm font-medium text-slate-200 group-hover:text-white">מפתחים</span>
                                </div>
                                <span className="text-slate-500 group-hover:text-slate-400">→</span>
                            </button>

                            <div className="h-px bg-slate-700/50 my-1 mx-2" />

                            {/* Logout */}
                            <button
                                onClick={handleLogout}
                                className="w-full px-4 py-3 flex items-center justify-between rounded-xl hover:bg-red-500/10 text-right transition-all group mt-1"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-xl group-hover:scale-110 transition-transform">🚪</span>
                                    <span className="text-sm font-bold text-red-400 group-hover:text-red-300">התנתק</span>
                                </div>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modals */}
            <AnimatePresence>
                {activeModal && (
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

                            {activeModal === 'privacy' && (
                                <div className="text-right">
                                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center justify-end gap-3 border-b pb-4">
                                        מדיניות פרטיות <span className="text-3xl">🔒</span>
                                    </h2>
                                    <div className="space-y-4 text-gray-600 leading-relaxed">
                                        <p className="text-lg font-medium text-gray-800">
                                            מערכת <strong>עין צופיה</strong> מחויבת לשמירה על פרטיותך.
                                        </p>
                                        <ul className="space-y-3 pr-4">
                                            <li className="flex items-start gap-2">
                                                <span className="text-cyan-500 mt-1">•</span>
                                                <span>כל הסרטונים מועלים לשרתים מאובטחים ומוצפנים.</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-cyan-500 mt-1">•</span>
                                                <span>הניתוח מתבצע ע"י AI ללא מעורבות אנושית.</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-cyan-500 mt-1">•</span>
                                                <span>המידע האישי נשמר בסודיות מוחלטת.</span>
                                            </li>
                                        </ul>
                                        <div className="bg-cyan-50 p-4 rounded-xl border border-cyan-100 mt-6 flex items-center gap-3">
                                            <span className="text-2xl">🛡️</span>
                                            <p className="text-sm text-cyan-900 font-bold">
                                                המידע שלך בטוח איתנו.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

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
                                        כניסת מפתחים <span className="text-3xl">🛠️</span>
                                    </h2>
                                    <div className="space-y-4">
                                        <p className="text-gray-600 mb-2">אנא הזן סיסמת מפתחים:</p>
                                        <input
                                            type="password"
                                            value={passwordInput}
                                            onChange={(e) => {
                                                setPasswordInput(e.target.value);
                                                setPasswordError(false);
                                            }}
                                            onKeyDown={(e) => e.key === 'Enter' && handleDeveloperLogin()}
                                            className="w-full p-3 border border-gray-300 rounded-xl text-center text-2xl tracking-widest focus:ring-2 focus:ring-cyan-500 outline-none text-gray-800"
                                            autoFocus
                                            placeholder="••••"
                                        />
                                        {passwordError && (
                                            <p className="text-red-500 text-sm font-bold text-center">סיסמה שגויה</p>
                                        )}
                                        <button
                                            onClick={handleDeveloperLogin}
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

            <FeedbackReportModal
                isOpen={showFeedbackReport}
                onClose={() => setShowFeedbackReport(false)}
            />
        </div>
    );
}
