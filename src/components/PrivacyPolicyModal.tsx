'use client';

import { useState } from 'react';
import { legalContent, faqContent } from '@/lib/legalContent';

interface PrivacyPolicyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function PrivacyPolicyModal({ isOpen, onClose }: PrivacyPolicyModalProps) {
    const [activeTab, setActiveTab] = useState<'legal' | 'faq'>('legal');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-l from-slate-800 to-slate-900 text-white p-6 shrink-0">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold">מרכז המידע והפרטיות</h2>
                            <p className="text-slate-400 text-sm mt-1">עין צופיה - המערכת הבטוחה לניתוח וידאו</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/70 hover:text-white hover:bg-white/10 rounded-full p-2 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-4 border-b border-white/10">
                        <button
                            onClick={() => setActiveTab('legal')}
                            className={`pb-3 px-2 text-sm font-bold transition-all relative ${activeTab === 'legal' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            תנאי שימוש ופרטיות
                            {activeTab === 'legal' && (
                                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400 rounded-t-full" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('faq')}
                            className={`pb-3 px-2 text-sm font-bold transition-all relative ${activeTab === 'faq' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            שאלות נפוצות (FAQ)
                            {activeTab === 'faq' && (
                                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400 rounded-t-full" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                    {activeTab === 'legal' ? (
                        <div className="space-y-8 max-w-3xl mx-auto">
                            <div className="text-center mb-8 border-b pb-8">
                                <h1 className="text-2xl font-bold text-slate-900 mb-2">{legalContent.title}</h1>
                                <p className="text-slate-500 text-sm">עדכון אחרון: {legalContent.lastUpdated}</p>
                                <div className="mt-4 text-sm text-slate-600 bg-white p-3 rounded-lg border inline-block">
                                    <p><strong>{legalContent.companyInfo.name}</strong></p>
                                    <p>ח.פ: {legalContent.companyInfo.id}</p>
                                    <p>{legalContent.companyInfo.address}</p>
                                </div>
                            </div>

                            {legalContent.sections.map((section) => {
                                const isSummary = section.id === "תקציר";
                                return (
                                    <div key={section.id} className={`bg-white p-6 rounded-xl shadow-sm border ${isSummary ? 'border-cyan-200 bg-cyan-50/30' : 'border-slate-100'}`}>
                                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-3">
                                            <span className={`flex items-center justify-center h-8 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold ${isSummary ? 'w-auto px-3 bg-cyan-100 text-cyan-800' : 'w-8'}`}>
                                                {section.id}
                                            </span>
                                            {section.title}
                                        </h3>
                                        {isSummary ? (
                                            <ul className="space-y-3">
                                                {section.content.split('\n').filter(line => line.trim()).map((line, i) => {
                                                    const parts = line.replace(/^[•\-\*]\s*/, '').split(':');
                                                    const title = parts[0];
                                                    const rest = parts.slice(1).join(':');

                                                    return (
                                                        <li key={i} className="flex items-start gap-3 text-base text-slate-700">
                                                            <span className="text-cyan-500 font-bold mt-1.5 text-lg">•</span>
                                                            <span className="flex-1 leading-relaxed">
                                                                {rest ? (
                                                                    <>
                                                                        <strong className="font-bold text-slate-900">{title}:</strong>
                                                                        {rest}
                                                                    </>
                                                                ) : (
                                                                    line.replace(/^[•\-\*]\s*/, '')
                                                                )}
                                                            </span>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        ) : (
                                            <div className="text-slate-600 leading-relaxed whitespace-pre-line text-sm pr-11">
                                                {section.content}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="space-y-4 max-w-2xl mx-auto">
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-slate-900">שאלות ותשובות נפוצות</h2>
                                <p className="text-slate-500 mt-2">כל מה שחשוב לדעת על בטיחות ופרטיות במערכת</p>
                            </div>

                            {faqContent.map((item, index) => (
                                <div key={index} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
                                    <div className="p-5">
                                        <h3 className="font-bold text-lg text-slate-800 mb-2 flex items-start gap-3">
                                            <span className="text-cyan-500 mt-1">?</span>
                                            {item.question}
                                        </h3>
                                        <p className="text-slate-600 leading-relaxed pr-6 border-r-2 border-cyan-100 mr-1 mt-3">
                                            {item.answer}
                                        </p>
                                    </div>
                                </div>
                            ))}

                            <div className="mt-8 bg-cyan-50 p-6 rounded-2xl text-center border border-cyan-100">
                                <p className="text-cyan-900 font-medium mb-1">יש לך שאלות נוספות?</p>
                                <a href={`mailto:${legalContent.companyInfo.email}`} className="text-cyan-600 font-bold hover:underline">
                                    {legalContent.companyInfo.email}
                                </a>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-white border-t border-slate-100 flex justify-end shrink-0">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
                    >
                        סגור
                    </button>
                </div>
            </div>
        </div>
    );
}
