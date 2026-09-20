"use client";

import React, { useCallback, useMemo, useEffect, useRef } from "react";
import { parseLRC } from "../utils/lrcParser";
import { usePlayerStore } from "../hooks/usePlayerStore";

interface LyricsViewProps {
  lrc: string | null | undefined;
  onSeek?: (time: number) => void;
  className?: string;
}

export default function LyricsView({ lrc, onSeek, className = "" }: LyricsViewProps) {
  const currentTime = usePlayerStore((state) => state.currentTime);

  const lines = useMemo(() => parseLRC(lrc), [lrc]);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Ref untuk menandai bahwa lagu baru saja diganti
  const isSongChangingRef = useRef(false);

  const scrollToActiveLine = useCallback((index: number) => {
    const container = containerRef.current;
    if (!container) return;
    const activeElement = container.children[index] as HTMLElement;
    if (!activeElement) return;

    const targetScrollTop = 
      activeElement.offsetTop - (container.clientHeight / 2) + (activeElement.clientHeight / 2);

    container.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  }, []);

  const activeIndex = useMemo(() => {
    if (lines.length === 0) return 0;

    const index = lines.findIndex((line, i) => {
      const nextLine = lines[i + 1];
      return currentTime >= line.time && (!nextLine || currentTime < nextLine.time);
    });

    return index === -1 ? 0 : index;
  }, [currentTime, lines]);

  // 1. Reset posisi saat lagu (lrc) berubah
  useEffect(() => {
    if (containerRef.current) {
      // Paksa scroll ke paling atas tanpa animasi smooth agar instan
      containerRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
    
    // Aktifkan mode "Ganti Lagu"
    isSongChangingRef.current = true;

    // Matikan mode "Ganti Lagu" setelah 500ms (memberi waktu agar currentTime stabil)
    const timeout = setTimeout(() => {
      isSongChangingRef.current = false;
    }, 500);

    return () => clearTimeout(timeout);
  }, [lrc]);

  // 2. Sinkronisasi lirik dengan waktu
  useEffect(() => {
    if (lines.length === 0) return;
    // --- LOGIC BARU: Cek Guard ---
    // Jika kita sedang dalam mode "Ganti Lagu" DAN index yang ditemukan bukan 0
    // (artinya currentTime kemungkinan masih nyangkut di waktu lagu lama),
    // maka JANGAN scroll. Biarkan tetap di atas.
    if (isSongChangingRef.current && activeIndex > 0) {
      return; 
    }
    // Jika index sudah 0 (waktu sudah reset), kita bisa matikan guard lebih cepat
    if (activeIndex === 0) {
        isSongChangingRef.current = false;
    }
    // -----------------------------

    scrollToActiveLine(activeIndex);
  }, [activeIndex, lines.length, scrollToActiveLine]);

  if (lines.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center h-full text-zinc-400 select-none ${className}`}>
         <p className="text-2xl font-bold mb-2">Sepertinya lirik belum ada</p>
         <p className="text-sm">Coba upload file .lrc dulu ya</p>
         <p className="text-sm">Atau Tambahkan Manual di Edit Info😊</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-y-auto px-8 md:px-16 py-10 w-full text-left select-none ${className}`}
      // Hapus style scrollBehavior di sini agar tidak konflik dengan 'instant' scroll saat reset
    >
      {lines.map((line, index) => {
        const isActive = index === activeIndex;
        return (
          <button
            key={index}
            type="button"
            aria-current={isActive ? 'step' : undefined}
            onClick={() => onSeek && onSeek(line.time)}
            className={`
              w-full text-left py-3 md:py-4 font-bold transition-all duration-300 cursor-pointer origin-left block
              ${isActive 
                ? "text-white text-2xl md:text-4xl lg:text-5xl opacity-100 scale-100" 
                : "text-zinc-500 hover:text-zinc-300 text-lg md:text-2xl lg:text-3xl opacity-70 hover:opacity-100 scale-95 hover:scale-100"
              }
            `}
          >
            {line.text}
          </button>
        );
      })}
      <div className="h-32 md:h-44" />
    </div>
  );
}
