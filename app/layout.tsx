import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import GlobalPlayer from "./components/GlobalPlayer";
import QueueDrawer from "./components/QueueDrawer"; 
// ✅ PERBAIKAN: Import komponen global di sini
import Sidebar from "./components/Sidebar";
import LyricsOverlay from "./components/LyricsOverlay";

// Memaksa render dinamis agar aman saat build/deploy
export const dynamic = 'force-dynamic';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Stelify Music",
  description: "Web Music Player",
  manifest: "/manifest.json", // <--- TAMBAHKAN INI
};

// Opsional: Untuk mengatur warna status bar di HP (Next.js 14+)
export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-black text-white overflow-hidden`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-green-500 focus:text-black focus:font-bold focus:rounded-md"
        >
          Skip to main content
        </a>
        {/* ✅ PERBAIKAN: Struktur Layout Global (Flexbox) */}
        <div className="flex h-screen overflow-hidden">
            {/* Sidebar Kiri */}
            <Sidebar /> 
            
            {/* Konten Utama Kanan */}
            <main id="main-content" tabIndex={-1} className="flex-1 relative flex flex-col min-w-0 outline-none">
               {children}
            </main>
        </div>
        
        {/* ✅ PERBAIKAN: Komponen Overlay Global */}
        <LyricsOverlay />
        <div role="region" aria-label="Audio Player">
          <GlobalPlayer />
        </div>
        <QueueDrawer />
      </body>
    </html>
  );
}
