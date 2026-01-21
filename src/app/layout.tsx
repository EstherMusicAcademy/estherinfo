import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { TopNav } from "@/components/layout/TopNav";
import { RoleProvider } from "@/components/role/RoleProvider";
import { SupabaseAuthProvider } from "@/components/auth/SupabaseAuthProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { PageTransition } from "@/components/ui/PageTransition";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Esther Teach - 음악 교육 관리 시스템",
  description: "학생 관리, 평가, 연습실 예약 등 음악 교육을 위한 통합 관리 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <SupabaseAuthProvider>
          <ThemeProvider>
            <RoleProvider>
              <ToastProvider>
                <TopNav />
                <PageTransition>
                  {children}
                </PageTransition>
              </ToastProvider>
            </RoleProvider>
          </ThemeProvider>
        </SupabaseAuthProvider>
      </body>
    </html>
  );
}
