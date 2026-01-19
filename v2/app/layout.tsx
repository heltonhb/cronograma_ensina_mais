import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ensina Mais Gestão",
  description: "Sistema de Gestão de Vendas e Cronograma",
  manifest: "/manifest.json",
};

import { ToastProvider } from "../contexts/ToastContext";
import { AuthProvider } from "../contexts/AuthContext";
import { TemplatesProvider } from "../contexts/TemplatesContext";
import { GamificationProvider } from "../contexts/GamificationContext";

// ... existing imports

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <ToastProvider>
            <TemplatesProvider>
              <GamificationProvider>
                {children}
              </GamificationProvider>
            </TemplatesProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
