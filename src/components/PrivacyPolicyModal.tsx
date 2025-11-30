'use client';

import { privacyPolicyContent } from '@/lib/privacyPolicy';

interface PrivacyPolicyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function PrivacyPolicyModal({ isOpen, onClose }: PrivacyPolicyModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-l from-cyan-600 to-orange-600 text-white p-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">{privacyPolicyContent.title}</h2>
                        <p className="text-cyan-100 text-sm mt-1">עדכון אחרון: {privacyPolicyContent.lastUpdated}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                        aria-label="סגור"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(80vh-180px)] p-6 space-y-6">
                    {privacyPolicyContent.sections.map((section) => (
                        <div key={section.id} className="space-y-2">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <span className="flex items-center justify-center w-7 h-7 bg-cyan-100 text-cyan-600 rounded-full text-sm font-bold">
                                    {section.id}
                                </span>
                                {section.title}
                            </h3>
                            <p className="text-gray-700 leading-relaxed whitespace-pre-line pr-9">
                                {section.content}
                            </p>
                        </div>
                    ))}

                    {/* Contact Section */}
                    <div className="mt-8 p-4 bg-cyan-50 rounded-xl border border-cyan-200">
                        <h3 className="text-lg font-bold text-cyan-900 mb-2">יצירת קשר</h3>
                        <div className="space-y-1 text-cyan-700">
                            <p className="flex items-center gap-2">
                                <span>📧</span>
                                <a href={`mailto:${privacyPolicyContent.contact.email}`} className="hover:underline">
                                    {privacyPolicyContent.contact.email}
                                </a>
                            </p>
                            <p className="flex items-center gap-2">
                                <span>🌐</span>
                                <a href={`https://${privacyPolicyContent.contact.website}`} className="hover:underline" target="_blank" rel="noopener noreferrer">
                                    {privacyPolicyContent.contact.website}
                                </a>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4">
                    <button
                        onClick={onClose}
                        className="w-full bg-gradient-to-l from-cyan-600 to-orange-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-cyan-700 hover:to-orange-700 transition-all shadow-lg"
                    >
                        סגור
                    </button>
                </div>
            </div>
        </div>
    );
}
