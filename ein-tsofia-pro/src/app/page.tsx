'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { analyzeVideo } from '@/lib/gemini';
import type { AnalysisResult } from '@/lib/gemini';
import KindergartenResultsView from '@/components/KindergartenResultsView';

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const handleLogin = () => {
    if (!agreedToTerms) {
      setLoginError('יש לאשר את תנאי השימוש');
      return;
    }

    if (username === 'anat' && password === 'anat9') {
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('שם משתמש או סיסמה שגויים');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setVideoUrl(URL.createObjectURL(file));
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setAnalysisStatus('מעלה סרטון...');

    try {
      setAnalysisProgress(20);
      setAnalysisStatus('אמה מנתחת את הסרטון...');

      const result = await analyzeVideo(selectedFile);

      setAnalysisProgress(100);
      setAnalysisResult(result);
      setIsAnalyzing(false);
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysisStatus('שגיאה בניתוח. אנא נסה שנית.');
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setSelectedFile(null);
    setVideoUrl(null);
    setAnalysisProgress(0);
    setAnalysisStatus('');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative">
        <div className="gradient-mesh" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="glass-card rounded-[2rem] p-12 max-w-md w-full relative z-10"
        >
          <div className="text-center mb-10">
            <motion.div
              className="w-24 h-24 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl mx-auto flex items-center justify-center text-5xl mb-6 shadow-2xl"
              animate={{ rotate: [0, 2, -2, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              whileHover={{ scale: 1.05 }}
            >
              👩‍🏫
            </motion.div>
            <h1 className="text-5xl font-bold text-white mb-3 text-glow">Ein Tsofia Pro</h1>
            <div className="badge badge-info mx-auto">
              מערכת ניתוח פדגוגי AI
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2 text-right">שם משתמש</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-right transition-all placeholder-slate-500"
                dir="rtl"
                placeholder="הכנס שם משתמש..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2 text-right">סיסמה</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-right transition-all placeholder-slate-500"
                dir="rtl"
                placeholder="הכנס סיסמה..."
              />
            </div>

            <div className="flex items-start gap-3 p-5 bg-white/5 rounded-xl border border-white/10">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 w-6 h-6 text-indigo-600 rounded-lg focus:ring-indigo-500"
              />
              <label htmlFor="terms" className="text-sm text-slate-300 text-right flex-1 cursor-pointer leading-relaxed" dir="rtl">
                אני מאשר/ת את תנאי השימוש במערכת ומסכים/ה לעיבוד הנתונים למטרות מחקר ופיתוח חינוכי.
              </label>
            </div>

            {loginError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/30 text-red-300 px-5 py-4 rounded-xl text-sm text-right"
              >
                {loginError}
              </motion.div>
            )}

            <motion.button
              onClick={handleLogin}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full btn-primary text-lg"
            >
              ✨ כניסה למערכת
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (analysisResult) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="gradient-mesh" />
        <KindergartenResultsView
          result={analysisResult}
          onReset={handleReset}
          videoUrl={videoUrl}
        />
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative">
        <div className="gradient-mesh" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-[2rem] p-12 max-w-2xl w-full text-center relative z-10"
        >
          <motion.div
            className="w-32 h-32 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full mx-auto flex items-center justify-center text-6xl mb-8 shadow-2xl"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            👩‍🏫
          </motion.div>

          <h2 className="text-4xl font-bold text-white mb-4 text-glow">אמה מנתחת את הסרטון...</h2>
          <p className="text-slate-300 mb-10 text-xl">{analysisStatus}</p>

          <div className="progress-bar mb-8">
            <motion.div
              className="progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${analysisProgress}%` }}
            />
          </div>

          <div className="text-5xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-10">
            {analysisProgress}%
          </div>

          <div className="space-y-4 text-right max-w-lg mx-auto" dir="rtl">
            {[
              { label: 'העלאת הסרטון למערכת', threshold: 20, icon: '📤' },
              { label: 'ניתוח מעמיק - בדיקת אבני דרך', threshold: 60, icon: '🔍' },
              { label: 'ביקורת משאבים וציוד', threshold: 80, icon: '🎯' },
              { label: 'המלצות לבעלי עניין', threshold: 100, icon: '✅' }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center gap-4 justify-between p-5 rounded-xl transition-all ${analysisProgress >= step.threshold
                    ? 'bg-green-500/10 border border-green-500/30 text-green-300'
                    : 'bg-white/5 border border-white/10 text-slate-400'
                  }`}
              >
                <span className="font-semibold flex items-center gap-2">
                  <span>{step.icon}</span>
                  <span>{step.label}</span>
                </span>
                {analysisProgress >= step.threshold ? (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-green-400 text-2xl"
                  >
                    ✓
                  </motion.span>
                ) : (
                  <span className="w-6 h-6 rounded-full border-2 border-slate-600" />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 relative">
      <div className="gradient-mesh" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-[2rem] p-10 mb-8"
        >
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div className="flex items-center gap-6">
              <motion.div
                className="w-24 h-24 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center text-5xl shadow-2xl"
                whileHover={{ rotate: -5, scale: 1.05 }}
              >
                👩‍🏫
              </motion.div>
              <div>
                <h1 className="text-5xl font-bold text-white mb-2 text-glow">Ein Tsofia Pro</h1>
                <p className="text-slate-300 text-xl">ניתוח פדגוגי חכם עם אמה</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="badge badge-success">
                <span className="w-2 h-2 rounded-full bg-white"></span>
                Gemini 2.5 Flash
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 glass-card rounded-[2rem] p-10"
          >
            <div className="flex items-center gap-4 mb-10">
              <span className="text-5xl">📹</span>
              <h2 className="text-4xl font-bold text-white">העלאת סרטון לניתוח</h2>
            </div>

            <div className="border-2 border-dashed border-white/20 rounded-3xl p-20 text-center hover:border-indigo-500/50 hover:bg-white/5 transition-all duration-300 group">
              {!selectedFile ? (
                <label className="cursor-pointer block">
                  <div className="space-y-8">
                    <motion.div
                      className="w-32 h-32 mx-auto bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-2xl neon-border"
                      whileHover={{ rotate: 5 }}
                    >
                      <span className="text-6xl">🎬</span>
                    </motion.div>
                    <div>
                      <p className="text-3xl font-bold text-white mb-4">גרור סרטון לכאן</p>
                      <p className="text-slate-400 text-xl">או לחץ לבחירת קובץ מהמחשב</p>
                    </div>
                    <div className="inline-block px-8 py-4 rounded-full bg-white/5 border border-white/10 text-sm font-semibold text-slate-300">
                      <span className="text-indigo-400">MP4, MOV, AVI</span> | עד <span className="text-purple-400">500MB</span>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              ) : (
                <motion.div
                  className="space-y-8"
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                >
                  <div className="w-36 h-36 mx-auto bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center shadow-2xl">
                    <span className="text-7xl">✅</span>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-white mb-2">{selectedFile.name}</p>
                    <p className="text-slate-400 text-xl">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <div className="flex gap-4 justify-center pt-6">
                    <motion.button
                      onClick={handleAnalyze}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="btn-primary px-12 text-xl"
                    >
                      <span className="mr-3">🚀</span> נתח סרטון
                    </motion.button>
                    <motion.button
                      onClick={() => {
                        setSelectedFile(null);
                        setVideoUrl(null);
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="btn-secondary px-12 text-xl"
                    >
                      ביטול
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {[
              { title: 'המוח של אמה', icon: '🧠', desc: 'אמה היא יועצת חינוכית בכירה (0-3). היא מנתחת בגישת "מודלינג" - נותנת תסריטים מדויקים לתיקון ופעילויות רגשיות.', color: 'from-blue-500 to-cyan-500' },
              { title: 'יכולות ניתוח', icon: '⚡', desc: 'בדיקת אבני דרך התפתחותיות • ביקורת משאבים וציוד • סריקה סביבתית מלאה', color: 'from-purple-500 to-pink-500' },
              { title: 'סטטוס מערכת', icon: '🔌', desc: '', color: 'from-green-500 to-emerald-500' }
            ].map((card, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                whileHover={{ scale: 1.02, y: -4 }}
                className="glass-card rounded-3xl p-8 card-hover relative overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${card.color} opacity-10 rounded-full blur-3xl`} />

                <div className="relative">
                  <div className="flex items-center gap-4 mb-5 justify-end">
                    <h3 className="font-bold text-white text-2xl">{card.title}</h3>
                    <span className="text-4xl">{card.icon}</span>
                  </div>
                  {card.desc ? (
                    <p className="text-sm text-slate-300 text-right leading-relaxed" dir="rtl">
                      {card.desc}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      <div className="badge badge-success w-full justify-center">
                        <span className="w-2 h-2 rounded-full bg-white"></span>
                        Gemini 2.5 Flash
                      </div>
                      <div className="badge badge-success w-full justify-center">
                        <span className="w-2 h-2 rounded-full bg-white"></span>
                        Firebase Storage
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
