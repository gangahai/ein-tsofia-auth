'use client';

import { useState } from 'react';
import { userTypeOptions, UserType } from '@/types/types';
import PrivacyPolicyModal from '@/components/PrivacyPolicyModal';
import LoginPage from '@/components/LoginPage';
import { useAuth } from '@/components/AuthProvider';

import { EmmaAvatar } from '@/components/EmmaAvatar';

export default function Home() {
  const { user, loading } = useAuth();
  const [selectedType, setSelectedType] = useState<UserType>(null);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-slate-800 via-cyan-900 to-blue-900 flex items-center justify-center">
        <div className="text-white text-2xl">טוען...</div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user) {
    return <LoginPage />;
  }

  const handleContinue = () => {
    if (!selectedType || !agreedToPrivacy) return;

    // Save to localStorage (optional)
    if (typeof window !== 'undefined') {
      localStorage.setItem('userType', selectedType);
    }

    setSubmitted(true);
  };

  // Success screen after submission
  if (submitted && selectedType) {
    const selectedOption = userTypeOptions.find(opt => opt.id === selectedType);

    return (
      <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-cyan-50 via-blue-50 to-orange-50 flex items-start justify-center p-4 pt-12">
        <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
          <div className="text-8xl mb-6 animate-bounce">{selectedOption?.icon}</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">מעולה! 🎉</h1>
          <h2 className="text-2xl font-bold mb-6" style={{ color: selectedOption?.color }}>
            {selectedOption?.title}
          </h2>

          {/* Emma's Explanation */}
          <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-right border-r-4" style={{ borderColor: selectedOption?.color }}>
            <div className="flex items-center gap-3 mb-3">
              <EmmaAvatar size="sm" showStatus={false} />
              <span className="font-bold text-gray-700">אמה:</span>
            </div>
            <p className="text-gray-700 leading-relaxed text-lg">
              {selectedType === 'family' && "בתור משפחה, המערכת תתמקד בדינמיקה הבין-אישית בבית. אנתח את האינטראקציות הרגשיות, אזהה רגעי חיבור ומצוקה, ואספק המלצות לחיזוק הקשר ההורי והמשפחתי. המטרה היא ליצור סביבה ביתית תומכת ומצמיחה."}
              {selectedType === 'caregiver' && "כמטפל מקצועי, הניתוח יספק לך כלים קליניים מעמיקים. אבחן דפוסי התנהגות, אזהה סימנים דקים של תקשורת לא מילולית, ואציע אסטרטגיות התערבות מותאמות אישית. המטרה היא לתמוך בתהליך הטיפולי ולדייק את האבחנה."}
              {selectedType === 'kindergarten' && "בסביבה החינוכית, אתמקד באינטראקציות הקבוצתיות והפרטניות בגן. אזהה דפוסים חברתיים, רמות מעורבות, וצרכים רגשיים של הילדים. ההמלצות יעזרו לצוות החינוכי ליצור אקלים גן מיטבי ומותאם לכל ילד."}
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <button
              onClick={() => window.location.href = '/analyze'}
              className="w-full py-5 bg-gradient-to-l from-cyan-500 to-orange-500 text-white rounded-2xl font-bold text-2xl hover:from-cyan-600 hover:to-orange-600 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105"
            >
              🎬 ניתוח וידאו
            </button>
            <button
              onClick={() => {
                setSubmitted(false);
                setSelectedType(null);
                setAgreedToPrivacy(false);
              }}
              className="w-full py-4 bg-white border-2 border-gray-200 hover:border-gray-400 text-gray-600 rounded-xl font-semibold transition-all hover:bg-gray-50"
            >
              ← בחר קטגוריה אחרת
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-slate-800 via-cyan-900 to-blue-900 p-4">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
          <div className="text-center">
            <img
              src="/logo-new.jpg"
              alt="עין צופיה"
              className="w-40 h-auto mx-auto mb-4"
            />
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              עין צופיה
            </h1>
            <p className="text-lg text-gray-600">
              המערכת שמבינה ועוזרת לתקן
            </p>
          </div>

          {/* Instruction Text */}
          <div className="text-center mb-8">
            <p className="text-xl text-white">
              אנא בחרו את סוג המשתמש שלכם
            </p>
          </div>
        </div>

        {/* User Type Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          {userTypeOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedType(option.id)}
              className={`
                relative p-8 rounded-2xl border-3 transition-all duration-300 transform
                ${selectedType === option.id
                  ? 'border-4 shadow-2xl scale-105 bg-white ring-4 ring-opacity-50'
                  : 'border-2 border-gray-200 hover:border-gray-300 hover:shadow-xl bg-white/90 hover:scale-102'
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
                  className="absolute top-4 left-4 w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: option.color }}
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}

              {/* Icon */}
              <div className="text-7xl mb-5 text-center transform transition-transform hover:scale-110">
                {option.icon}
              </div>

              {/* Title */}
              <h3
                className="text-2xl font-bold text-center"
                style={{ color: selectedType === option.id ? option.color : '#374151' }}
              >
                {option.title}
              </h3>

              {/* Hover Glow Effect */}
              <div
                className={`absolute inset-0 rounded-2xl transition-opacity duration-300 pointer-events-none ${selectedType === option.id ? 'opacity-20' : 'opacity-0 group-hover:opacity-10'
                  }`}
                style={{
                  background: `radial-gradient(circle at center, ${option.color}, transparent 70%)`,
                }}
              />
            </button>
          ))}
        </div>

        {/* Privacy Agreement Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border-2 border-gray-100">
          <label className="flex items-start gap-4 cursor-pointer group">
            <input
              type="checkbox"
              checked={agreedToPrivacy}
              onChange={(e) => setAgreedToPrivacy(e.target.checked)}
              className="mt-1.5 w-6 h-6 rounded-lg border-2 border-gray-300 text-cyan-500 focus:ring-4 focus:ring-cyan-200 cursor-pointer transition-all"
            />
            <span className="text-gray-700 text-lg leading-relaxed">
              אני מאשר/ת שקראתי והבנתי את{' '}
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="text-cyan-400 hover:text-cyan-300 font-bold underline decoration-2 underline-offset-4 hover:decoration-cyan-300 transition-all"
              >
                מדיניות הפרטיות
              </button>
              {' '}ואני מסכים/ה לתנאי השימוש
            </span>
          </label>

          {/* Privacy Policy Link */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="mt-5 text-base text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-2 transition-colors hover:gap-3"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            קרא את מדיניות הפרטיות המלאה ←
          </button>
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={!selectedType || !agreedToPrivacy}
          className={`
            w-full py-5 px-8 rounded-2xl font-bold text-2xl transition-all duration-300 shadow-2xl
            ${!selectedType || !agreedToPrivacy
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed scale-100'
              : 'bg-gradient-to-l from-cyan-500 to-orange-500 text-white hover:from-cyan-600 hover:to-orange-600 hover:shadow-3xl transform hover:scale-105 active:scale-95'
            }
          `}
        >
          המשך ←
        </button>
      </div>

      {/* Privacy Policy Modal */}
      <PrivacyPolicyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

