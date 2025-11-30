'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { analysisService } from '@/lib/analysisService';

interface CustomEditorProps {
    initialContent: string;
    title: string;
    userId: string;
    onClose: () => void;
    variant?: 'modal' | 'inline';
    onAddAnalysis?: () => void;
}

export default function CustomEditor({ initialContent, title, userId, onClose, variant = 'modal', onAddAnalysis }: CustomEditorProps) {
    const [content, setContent] = useState(initialContent);
    const [isSaving, setIsSaving] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const printRef = useRef<HTMLDivElement>(null); // Dedicated ref for PDF generation
    const contentRef = useRef<HTMLDivElement>(null);

    const isInterventionPlan = title.includes('תוכנית התערבות');

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await analysisService.saveAnalysisResult(userId, title, content, 'custom');
            alert('התוכנית נשמרה בהצלחה! ✅');
        } catch (error) {
            console.error('Error saving:', error);
            alert('שגיאה בשמירה ❌');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!printRef.current) return;
        setIsDownloading(true);

        try {
            const element = printRef.current;

            // Capture the dedicated print container
            const canvas = await html2canvas(element, {
                scale: 2, // Keep high quality
                useCORS: true,
                backgroundColor: '#ffffff',
                onclone: (clonedDoc) => {
                    // Ensure the cloned element is visible for capture
                    const clonedElement = clonedDoc.getElementById('print-container');
                    if (clonedElement) {
                        clonedElement.style.display = 'block';
                    }
                }
            });

            // Use JPEG with 0.7 quality for much smaller file size
            const imgData = canvas.toDataURL('image/jpeg', 0.7);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            // If height exceeds A4, we might need multiple pages, but for now let's fit or split
            // Simple fit for single page reports, or let it expand if needed (jsPDF doesn't auto-split images)
            // Given the user's report of "one page", we'll stick to fitting width.

            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${title.replace(/\s+/g, '_')}.pdf`);

        } catch (error: any) {
            console.error('Error generating PDF:', error);
            alert(`שגיאה ביצירת PDF: ${error.message || 'שגיאה לא ידועה'} \nנסה שוב או פנה לתמיכה.`);
        } finally {
            setIsDownloading(false);
        }
    };

    const Container = variant === 'modal' ? motion.div : 'div';
    const containerProps = variant === 'modal' ? {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        className: "bg-white rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden"
    } : {
        className: "bg-white rounded-3xl w-full flex flex-col shadow-sm border-r-4 border-cyan-500 overflow-hidden mt-8"
    };

    const Wrapper = variant === 'modal' ?
        ({ children }: { children: React.ReactNode }) => (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                {children}
            </div>
        ) :
        ({ children }: { children: React.ReactNode }) => <>{children}</>;

    return (
        <Wrapper>
            <Container {...containerProps}>
                {/* Header */}
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                    <div className="flex gap-2">
                        {isInterventionPlan && onAddAnalysis && (
                            <button
                                onClick={onAddAnalysis}
                                className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm ml-2"
                            >
                                🛠️ בנה תוכנית חדשה
                            </button>
                        )}
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 text-sm"
                        >
                            {isSaving ? 'שומר...' : '💾 שמור'}
                        </button>
                        <button
                            onClick={handleDownloadPDF}
                            disabled={isDownloading}
                            className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2 text-sm"
                        >
                            {isDownloading ? 'מכין PDF...' : '📄 PDF'}
                        </button>
                        <button
                            onClick={onClose}
                            className="px-3 py-1.5 text-gray-600 hover:bg-gray-200 rounded-lg text-sm"
                        >
                            {variant === 'modal' ? 'סגור' : 'הסר'}
                        </button>
                    </div>
                </div>

                {/* Editor Area (Interactive) */}
                <div className={`flex-1 overflow-auto p-8 bg-gray-100 ${variant === 'inline' ? 'min-h-[600px]' : ''}`}>
                    <div
                        ref={contentRef} // Keep ref here for scrolling/focus if needed, but not for print
                        className="bg-white p-10 shadow-lg min-h-full rounded-xl max-w-3xl mx-auto text-right"
                        dir="rtl"
                    >
                        {/* Header for PDF */}
                        <div className="mb-8 border-b-2 border-purple-500 pb-4">
                            <h1 className="text-3xl font-bold text-purple-700 mb-2">{title}</h1>
                            <p className="text-gray-500">נוצר ע"י מערכת עין צופיה (אמה AI)</p>
                            <p className="text-gray-400 text-sm">{new Date().toLocaleDateString('he-IL')}</p>
                        </div>

                        {/* Content */}
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full h-full min-h-[500px] resize-none outline-none text-gray-800 text-lg leading-relaxed font-sans"
                            placeholder="התוכן יופיע כאן..."
                        />

                        {/* Footer for PDF */}
                        <div className="mt-10 pt-6 border-t border-gray-200 text-center text-gray-400 text-sm">
                            <p className="font-bold">עין צופיה - מערכת לניתוח וידאו חינוכי וטיפולי</p>
                            <p className="mt-2 text-xs text-gray-400 border-t border-gray-100 pt-2 inline-block">
                                ⚠️ אזהרה: המערכת מבוססת בינה מלאכותית ועלולה לטעות. יש להפעיל שיקול דעת ולבדוק את התוצאות.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Hidden Print Container (For PDF Generation) */}
                <div
                    id="print-container"
                    ref={printRef}
                    className="fixed top-0 left-0 bg-white p-12 text-right"
                    style={{
                        width: '210mm', // A4 width
                        minHeight: '297mm', // A4 height
                        zIndex: -1000,
                        visibility: 'hidden' // Hidden from user, but renderable by html2canvas
                    }}
                    dir="rtl"
                >
                    <div className="mb-8 border-b-2 border-purple-500 pb-4">
                        <h1 className="text-3xl font-bold text-purple-700 mb-2">{title}</h1>
                        <p className="text-gray-500">נוצר ע"י מערכת עין צופיה (אמה AI)</p>
                        <p className="text-gray-400 text-sm">{new Date().toLocaleDateString('he-IL')}</p>
                    </div>

                    <div className="text-gray-800 text-lg leading-relaxed font-sans whitespace-pre-wrap">
                        {content}
                    </div>

                    <div className="mt-10 pt-6 border-t border-gray-200 text-center text-gray-400 text-sm">
                        <p className="font-bold">עין צופיה - מערכת לניתוח וידאו חינוכי וטיפולי</p>
                        <p className="mt-2 text-xs text-gray-400 border-t border-gray-100 pt-2 inline-block">
                            ⚠️ אזהרה: המערכת מבוססת בינה מלאכותית ועלולה לטעות. יש להפעיל שיקול דעת ולבדוק את התוצאות.
                        </p>
                    </div>
                </div>

            </Container>
        </Wrapper>
    );
}
