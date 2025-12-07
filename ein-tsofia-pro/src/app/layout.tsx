import type { Metadata } from "next";
import "./globals.css";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Ein Tsofia Pro - ניתוח פדגוגי חכם",
  description: "מערכת ניתוח וידאו פדגוגית מתקדמת עם אמה",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className="flex flex-col min-h-screen">
        <main className="flex-grow relative z-10">
          {children}
        </main>

        {/* Futuristic Footer */}
        <footer className="relative z-20 mt-auto border-t border-white/10 bg-slate-900/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative w-48 h-16 transition-transform hover:scale-105 duration-300">
                <Image
                  src="/logo.png"
                  alt="Ein Tsofia Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            <div className="text-center md:text-left text-slate-400 text-sm">
              <p className="font-medium">© כל הזכויות שמורות למערכת עין צופיה - רשת גן גחליליות 2025</p>
              <p className="text-xs mt-1 text-slate-500">מערכת ניהול חכמה | פותח ע"י אהרון</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
