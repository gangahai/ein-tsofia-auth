'use client';

import { useAuth } from '@/components/AuthProvider';

export default function DashboardPage() {
    const { userProfile, signOut } = useAuth();

    const userTypeLabels: Record<string, string> = {
        family: 'בית (משפחה)',
        caregiver: 'מטפל',
        kindergarten: 'גן ילדים',
        hospital: 'בית חולים',
        nursing_home: 'בית אבות',
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {userProfile?.photoURL && (
                                <img
                                    src={userProfile.photoURL}
                                    alt={userProfile.displayName || 'User'}
                                    className="w-16 h-16 rounded-full border-4 border-indigo-200"
                                />
                            )}
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800">
                                    שלום, {userProfile?.displayName}! 👋
                                </h1>
                                <p className="text-gray-600 mt-1">
                                    סוג משתמש: <span className="font-semibold text-indigo-600">
                                        {userProfile?.userType ? userTypeLabels[userProfile.userType] : 'לא מוגדר'}
                                    </span>
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={signOut}
                            className="px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors shadow-lg"
                        >
                            יציאה
                        </button>
                    </div>
                </div>

                {/* Dashboard Content */}
                <div className="bg-white rounded-2xl shadow-lg p-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">לוח המחוונים</h2>
                    <p className="text-gray-600 leading-relaxed">
                        ברוכים הבאים למערכת עין צופיה! כאן תוכלו לנהל את הפעילויות שלכם במערכת.
                    </p>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200">
                            <div className="text-4xl mb-3">📊</div>
                            <h3 className="text-lg font-bold text-gray-800">נתונים</h3>
                            <p className="text-gray-600 text-sm mt-1">צפייה בנתונים ודוחות</p>
                        </div>

                        <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
                            <div className="text-4xl mb-3">⚙️</div>
                            <h3 className="text-lg font-bold text-gray-800">הגדרות</h3>
                            <p className="text-gray-600 text-sm mt-1">ניהול הגדרות המערכת</p>
                        </div>

                        <div className="p-6 bg-gradient-to-br from-pink-50 to-red-50 rounded-xl border-2 border-pink-200">
                            <div className="text-4xl mb-3">👥</div>
                            <h3 className="text-lg font-bold text-gray-800">משתמשים</h3>
                            <p className="text-gray-600 text-sm mt-1">ניהול משתמשים</p>
                        </div>

                        <div className="p-6 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl border-2 border-cyan-200">
                            <div className="text-4xl mb-3">📝</div>
                            <h3 className="text-lg font-bold text-gray-800">דיווחים</h3>
                            <p className="text-gray-600 text-sm mt-1">ניהול דיווחים ומעקב</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
