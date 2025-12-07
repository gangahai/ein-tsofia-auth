'use client';

import { useState } from 'react';
import { userTypeOptions, UserType } from '@/types/types';
import PrivacyPolicyModal from '@/components/PrivacyPolicyModal';
import { useAuth } from '@/components/AuthProvider';
import { UserTypeIcons } from '@/components/UserTypeIcons';


export default function Home() {
  const { user, loading, signInWithGoogle } = useAuth();
  const [selectedType, setSelectedType] = useState<UserType>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showLockedCaregiver, setShowLockedCaregiver] = useState(false);

  // Login States
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-slate-800 via-cyan-900 to-blue-900 flex items-center justify-center">
        <div className="text-white text-2xl">טוען...</div>
      </div>
    );
  }

  const handleGoogleSignIn = async () => {
    if (!agreedToTerms) {
      alert('יש להסכים לתנאי השימוש ומדיניות הפרטיות');
      return;
    }

    setIsLoginLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Error signing in:', error);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any;
      if (err.code === 'auth/popup-closed-by-user' || err.message?.includes('popup-closed-by-user')) {
        console.log('User closed the login popup explicitly.');
        return;
      }

      const errorMessage = err.message || 'שגיאה לא ידועה';
      alert(`שגיאה בכניסה: ${errorMessage}`);
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleSelection = (typeId: UserType) => {
    if (typeId === 'caregiver') {
      setShowLockedCaregiver(!showLockedCaregiver);
      return;
    }

    // Save to localStorage (optional)
    if (typeof window !== 'undefined' && typeId) {
      localStorage.setItem('userType', typeId);
    }

    // Navigate immediately
    window.location.href = '/analyze';
  };



  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-slate-800 via-cyan-900 to-blue-900 p-4">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header - Always Visible */}
        <div className="bg-white rounded-3xl shadow-2xl p-5 md:p-8 mb-6 md:mb-8">
          <div className="text-center">
            <img
              src="/logo-new.jpg"
              alt="עין צופיה"
              className="w-32 md:w-40 h-auto mx-auto mb-3 md:mb-4"
            />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              עין צופיה
            </h1>
            <p className="text-base md:text-lg text-gray-600">
              המערכת שמבינה ועוזרת לתקן
            </p>
          </div>

          {/* CONTENT BASED ON AUTH STATUS */}
          {!user ? (
            <div className="max-w-md mx-auto mt-8 animate-fadeIn">
              <div className="text-center mb-6">
                <p className="text-gray-700 text-sm md:text-base font-medium">
                  התחברו עם חשבון Google שלכם כדי להתחיל
                </p>
              </div>

              {/* Terms Agreement */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 mb-6">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700 leading-relaxed text-right">
                    אני מסכים/ה ל
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(true)}
                      className="text-cyan-600 hover:text-cyan-700 underline mx-1 font-bold"
                    >
                      תנאי השימוש ומדיניות הפרטיות
                    </button>
                  </span>
                </label>
                <div className="mt-3 mr-8 text-xs text-slate-500 leading-relaxed border-t border-gray-200 pt-3">
                  <ul className="list-disc list-inside space-y-1 opacity-80">
                    <li>קראתי והבנתי את תנאי השימוש ומדיניות הפרטיות.</li>
                    <li>אני מבין/ה שהמערכת היא כלי עזר בלבד ואינה מחליפה ייעוץ מקצועי.</li>
                    <li>השימוש במערכת והאחריות על התוצאות חלים עליי בלבד.</li>
                  </ul>
                </div>
              </div>

              {/* Google Sign In Button */}
              <button
                onClick={handleGoogleSignIn}
                disabled={!agreedToTerms || isLoginLoading}
                className={`
                        w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg flex items-center justify-center gap-3
                        ${!agreedToTerms || isLoginLoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-white text-gray-800 hover:shadow-xl transform hover:scale-105 border-2 border-gray-200 hover:border-cyan-300'
                  }
                    `}
              >
                {isLoginLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    מתחבר...
                  </span>
                ) : (
                  <>
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    כניסה עם Google
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="text-center animate-fadeIn">
              {/* Text removed as requested */}
            </div>
          )}
        </div>

        {/* User Type Cards Grid - ONLY SHOW IF LOGGED IN */}
        {user && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5 mb-8 animate-slideUp">
              {userTypeOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleSelection(option.id)}
                  disabled={false} // Initially active
                  className={`
                        relative p-3 md:p-8 rounded-2xl border-3 transition-all duration-300 transform group overflow-hidden
                        ${selectedType === option.id
                      ? 'border-4 shadow-2xl scale-105 bg-white ring-4 ring-opacity-50'
                      : 'border-2 border-gray-200 hover:border-gray-300 hover:shadow-xl bg-white/90 hover:scale-102 cursor-pointer'
                    }
                    `}
                  style={{
                    backgroundColor: selectedType === option.id ? option.bgColor : undefined,
                    borderColor: selectedType === option.id ? option.color : undefined,
                  }}
                >
                  {/* Selection Indicator */}
                  {selectedType === option.id && (
                    <div
                      className="absolute top-4 left-4 w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center shadow-lg"
                      style={{ backgroundColor: option.color }}
                    >
                      <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}

                  {/* Icon */}
                  <div className={`w-12 h-12 md:w-20 md:h-20 mb-2 md:mb-5 text-center mx-auto transform transition-transform ${option.id !== 'caregiver' ? 'group-hover:scale-110' : ''} text-gray-700`}>
                    {option.id && UserTypeIcons[option.id] ? UserTypeIcons[option.id] : option.icon}
                  </div>

                  {/* Title */}
                  <h3
                    className="text-xl md:text-2xl font-bold text-center mb-1 md:mb-2"
                    style={{ color: selectedType === option.id ? option.color : '#374151' }}
                  >
                    {option.title}
                  </h3>

                  {/* Blocking Overlay for Caregiver - Click to Toggle */}
                  {option.id === 'caregiver' && (
                    <>
                      <div className={`absolute inset-0 bg-slate-900/90 backdrop-blur-sm transition-all duration-300 flex flex-col items-center justify-center z-20 text-center p-4 ${showLockedCaregiver ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
                        <span className="text-4xl mb-2">🔒</span>
                        <p className="text-white font-bold text-lg">
                          למנויים - נדרש תשלום
                        </p>
                      </div>

                      {/* Always Visible Lock Icon */}
                      <div className="absolute top-2 left-2 z-10 text-gray-400 bg-gray-100 rounded-full p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </>
                  )}

                  {/* Tooltip for Non-Caregiver */}
                  {option.id !== 'caregiver' && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 bg-white p-4 rounded-xl shadow-xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 pointer-events-none transform translate-y-2 group-hover:translate-y-0">
                      <p className="text-sm font-medium leading-relaxed text-center relative z-10 text-slate-700">
                        {option.description}
                      </p>
                      {/* Arrow */}
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white transform rotate-45 border-b border-r border-slate-100 shadow-sm z-0"></div>
                    </div>
                  )}

                  {/* Hover Glow Effect */}
                  {option.id !== 'caregiver' && (
                    <div
                      className={`absolute inset-0 rounded-2xl transition-opacity duration-300 pointer-events-none ${selectedType === option.id ? 'opacity-20' : 'opacity-0 group-hover:opacity-10'
                        }`}
                      style={{
                        background: `radial-gradient(circle at center, ${option.color}, transparent 70%)`,
                      }}
                    />
                  )}

                  {/* Selection Animation (Ripple/Pulse) */}
                  {selectedType === option.id && (
                    <span className="absolute inset-0 rounded-2xl ring-4 ring-offset-2 ring-indigo-500 animate-pulse transition-all duration-500"></span>
                  )}
                </button>
              ))}
            </div>

            {/* Continue Button Removed - Auto Navigation */}
          </>
        )}
      </div>


      {/* Privacy Policy Modal */}
      <PrivacyPolicyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div >
  );
}

