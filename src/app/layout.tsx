import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { Header } from "@/components/Header";


const rubik = Rubik({
  subsets: ["hebrew", "latin"],
  variable: "--font-rubik",
});

export const metadata: Metadata = {
  title: "עין צופיה - Ein Tsofia",
  description: "מערכת ניהול עין צופיה",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${rubik.variable} font-sans antialiased`}>
        <AuthProvider>
          <Header />
          <main className="min-h-[calc(100vh-80px)] flex flex-col">
            <div className="flex-1">
              {children}
            </div>
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}

