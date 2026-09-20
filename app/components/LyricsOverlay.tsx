"use client";

import React, { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { usePlayerStore } from "../hooks/usePlayerStore";
import LyricsView from "./LyricsView";
import { X, Music2 } from "lucide-react";

export default function LyricsOverlay() {
  const pathname = usePathname();
  const isWaifu = pathname === "/waifu";

  // Ambil state langsung di sini
  const showLyrics = usePlayerStore((state) => state.showLyrics);
  const currentSong = usePlayerStore((state) => state.currentSong);
  const setSeekTime = usePlayerStore((state) => state.setSeekTime);
  const toggleLyrics = usePlayerStore((state) => state.toggleLyrics);

  // 1. Buat Ref untuk Container yang bisa di-scroll
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 2. Reset Scroll ke Atas saat Lagu Berganti
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [currentSong?.id]);

  useEffect(() => {
    if (!showLyrics) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') toggleLyrics();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showLyrics, toggleLyrics]);

  // Jika lirik tidak aktif, tidak ada lagu, atau sedang di halaman waifu (waifu punya panel lirik terintegrasi sendiri)
  if (!showLyrics || !currentSong || isWaifu) return null;

  return (
    <div 
      className={`
        fixed top-0 bottom-20 md:bottom-24 z-40
        ${isWaifu ? "left-0" : "left-0 md:left-64 lg:left-72 xl:left-80"}
        right-0
        bg-[#09090b]/95 backdrop-blur-2xl
        flex flex-col
        animate-in fade-in duration-200
      `}
    >
      {/* Top Bar / Header */}
      <div className="flex items-center justify-between px-6 md:px-12 py-4 border-b border-white/10 shrink-0 bg-black/20">
        <div className="flex items-center gap-3 min-w-0">
          {currentSong.coverUrl ? (
            <img 
              src={currentSong.coverUrl} 
              alt={currentSong.title} 
              className="w-10 h-10 rounded-md object-cover shadow"
            />
          ) : (
            <div className="w-10 h-10 rounded-md bg-zinc-800 flex items-center justify-center text-zinc-500">
              <Music2 size={18} />
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-white font-bold text-sm md:text-base truncate">{currentSong.title}</h2>
            <p className="text-zinc-400 text-xs truncate">{currentSong.artist}</p>
          </div>
        </div>

        <button
          onClick={toggleLyrics}
          aria-label="Tutup lirik (Esc)"
          title="Tutup lirik (Esc)"
          className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition"
        >
          <X size={22} />
        </button>
      </div>

      {/* Scrollable Lyrics Container */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto scrollbar-lyrics px-6 md:px-12 py-8"
      >
        <div className="w-full max-w-5xl mx-auto">
          {/* Core Lyrics View */}
          <LyricsView 
            key={currentSong.id} 
            lrc={currentSong.lyrics} 
            onSeek={setSeekTime} 
            className="h-auto !px-0 !py-0 !overflow-visible" 
          />

          {/* Footer Info Lagu */}
          <div className="mt-16 pt-8 border-t border-white/10 flex items-center gap-4 opacity-70">
            {currentSong.coverUrl && (
              <img 
                src={currentSong.coverUrl} 
                className="w-14 h-14 rounded-md shadow-lg object-cover" 
                alt={currentSong.title}
              />
            )}
            <div>
              <h3 className="text-lg font-bold text-white">{currentSong.title}</h3>
              <p className="text-zinc-400 text-sm">{currentSong.artist}</p>
              {currentSong.album && <p className="text-zinc-500 text-xs mt-0.5">{currentSong.album}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}