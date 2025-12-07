'use client';

import { useState } from 'react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/AuthProvider';
import { userTypeOptions, UserType } from '@/types/types';
import PrivacyPolicyModal from '@/components/PrivacyPolicyModal';
import { UserTypeIcons } from './UserTypeIcons';

export default function UserTypeSelection() {
    const { userProfile, refreshUserProfile } = useAuth();
    const [selectedType, setSelectedType] = useState<UserType>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);


    const handleSaveUserType = async () => {
        if (!userProfile || !selectedType) return;

        setIsSaving(true);
        try {
            await updateDoc(doc(db, 'users', userProfile.uid), {
                userType: selectedType,
                privacyPolicyAccepted: true,
                updatedAt: Timestamp.now(),
            });

            // Refresh user profile to get updated data
            await refreshUserProfile();
        } catch (error) {
            console.error('Error saving user type:', error);
            alert('שגיאה בשמירת סוג המשתמש. אנא נסה שוב.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-800 mb-3">
                        ברוכים הבאים לעין צופיה! 👋
                    </h1>
                    <p className="text-lg text-gray-600">
                        אנא בחרו את סוג המשתמש שלכם כדי להמשיך
                    </p>
                </div>

                {/* User Type Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    {userTypeOptions.map((option) => (
                        <button
                            key={option.id}
                            onClick={() => setSelectedType(option.id)}
                            className={`
                relative p-6 rounded-2xl border-2 transition-all duration-300 transform
                ${selectedType === option.id
                                    ? 'border-indigo-500 shadow-xl scale-105 bg-white'
                                    : 'border-gray-200 hover:border-indigo-300 hover:shadow-lg bg-white/80 hover:scale-102'
                                }
              `}
                            style={{
                                backgroundColor: selectedType === option.id ? option.bgColor : undefined,
                            }}
                        >
                            {/* Selection Indicator */}
                            {selectedType === option.id && (
                                <div className="absolute top-3 left-3 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}



                            {/* Icon */}
                            <div className="w-16 h-16 mb-4 text-center mx-auto text-gray-700">
                                {UserTypeIcons[option.id] || option.icon}
                            </div>

                            {/* Title */}
                            <h3
                                className="text-xl font-bold text-center"
                                style={{ color: option.color }}
                            >
                                {option.title}
                            </h3>

                            {/* Animated Border */}
                            <div
                                className={`absolute inset-0 rounded-2xl transition-opacity duration-300 ${selectedType === option.id ? 'opacity-100' : 'opacity-0'
                                    }`}
                                style={{
                                    background: `linear-gradient(135deg, ${option.color}22, transparent)`,
                                    pointerEvents: 'none',
                                }}
                            />
                        </button>
                    ))}
                </div>

                {/* Continue Button */}
                <button
                    onClick={handleSaveUserType}
                    disabled={!selectedType || isSaving}
                    className={`
            w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg
            ${!selectedType || isSaving
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-l from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl transform hover:scale-105'
                        }
          `}
                >
                    {isSaving ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            שומר...
                        </span>
                    ) : (
                        'המשך'
                    )}
                </button>
            </div>

            {/* Privacy Policy Modal */}
            <PrivacyPolicyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />


        </div>
    );
}
