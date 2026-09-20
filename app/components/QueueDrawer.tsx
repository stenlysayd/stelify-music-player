"use client";

import React, { useEffect, useRef } from "react";
import { usePlayerStore } from "../hooks/usePlayerStore";
import { X, Play, Music, ListMusic, AlignLeft, Trash2 } from "lucide-react";

export default function QueueDrawer() {
  const { 
    queue, 
    currentSong, 
    currentIndex, 
    isQueueOpen, 
    toggleQueue, 
    playSong,
    removeFromQueue
  } = usePlayerStore();

  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isQueueOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') toggleQueue();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isQueueOpen, toggleQueue]);

  if (!isQueueOpen) return null;

  const nextUpSongs = queue.slice(currentIndex + 1);

  return (
    // ✅ PERBAIKAN: Ubah z-40 menjadi z-[60]
    <aside 
      ref={drawerRef}
      role="dialog"
      aria-modal="true"
      aria-label="Antrean lagu"
      className="fixed right-2 md:right-4 top-2 md:top-4 bottom-[6.5rem] w-[85vw] md:w-96 bg-[#121212] border border-zinc-800 shadow-2xl z-[60] flex flex-col rounded-xl overflow-hidden animate-in slide-in-from-right-10 duration-200"
    >
      
      {/* 1. HEADER */}
      <div className="px-5 py-4 flex items-center justify-between bg-[#121212] border-b border-zinc-800/50 shadow-sm z-10">
        <h2 className="text-white font-bold text-lg flex items-center gap-2">
          Antrean
        </h2>
        <button 
          onClick={toggleQueue} 
          aria-label="Tutup antrean"
          className="text-zinc-400 hover:text-white hover:bg-zinc-800 p-2.5 rounded-full transition"
        >
          <X size={20} />
        </button>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-[#121212]">
        
        {/* 2. SECTION: SEKARANG MEMUTAR */}
        {currentSong && (
          <div>
            <h3 className="text-zinc-400 text-sm font-bold mb-3">Sekarang Memutar</h3>
            <div className="group relative bg-zinc-900/50 hover:bg-zinc-800 rounded-lg p-3 transition border border-transparent hover:border-zinc-700 flex items-center gap-3">
               
               <div className="relative w-12 h-12 flex-shrink-0 rounded-md overflow-hidden shadow-md">
                  {currentSong.coverUrl ? (
                    <img src={currentSong.coverUrl} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-zinc-500">
                       <Music size={20} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 flex items-end justify-center gap-[2px] pb-1">
                     <div className="w-1 bg-green-500 h-2 animate-pulse"></div>
                     <div className="w-1 bg-green-500 h-4 animate-pulse delay-75"></div>
                     <div className="w-1 bg-green-500 h-3 animate-pulse delay-150"></div>
                  </div>
               </div>

               <div className="min-w-0 flex-1">
                  <h4 className="text-green-500 font-bold text-base truncate">{currentSong.title}</h4>
                  <p className="text-zinc-400 text-xs truncate">{currentSong.artist}</p>
               </div>
            </div>
          </div>
        )}

        {/* 3. SECTION: BERIKUTNYA */}
        <div>
           <div className="flex items-center justify-between mb-2">
              <h3 className="text-zinc-400 text-sm font-bold">Berikutnya</h3>
              {nextUpSongs.length > 0 && (
                 <span className="text-xs text-zinc-400 border border-zinc-800 px-2 py-0.5 rounded-full">
                   {nextUpSongs.length} Lagu
                 </span>
              )}
           </div>

           {nextUpSongs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-400 gap-3 border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
                 <ListMusic size={32} className="opacity-50" />
                 <div className="text-center">
                    <p className="text-sm font-medium">Antrean kosong</p>
                    <p className="text-xs opacity-70">Tambahkan lagu untuk diputar selanjutnya</p>
                 </div>
              </div>
           ) : (
              <div className="space-y-1">
                 {nextUpSongs.map((song, i) => {
                   const originalIndex = currentIndex + 1 + i;

                   return (
                     <div 
                        key={`${song.id}-${originalIndex}`} 
                        className="group flex items-center gap-3 p-2 rounded-md hover:bg-zinc-800/80 transition relative cursor-default"
                     >
                        <div 
                          role="button"
                          tabIndex={0}
                          aria-label={`Putar ${song.title}`}
                          className="w-6 h-6 flex items-center justify-center flex-shrink-0 cursor-pointer text-zinc-500 hover:text-white"
                          onClick={() => playSong(song)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); playSong(song); } }}
                        >
                           <span className="text-xs font-mono group-hover:hidden">{i + 1}</span>
                           <Play size={12} className="hidden group-hover:block fill-white" />
                        </div>

                        <div className="w-10 h-10 flex-shrink-0 rounded bg-zinc-800 overflow-hidden relative">
                           {song.coverUrl ? (
                             <img src={song.coverUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition" />
                           ) : (
                             <Music size={14} className="m-auto mt-3 text-zinc-600" />
                           )}
                        </div>

                        <div 
                          role="button"
                          tabIndex={0}
                          className="min-w-0 flex-1 cursor-pointer"
                          onClick={() => playSong(song)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); playSong(song); } }}
                        >
                           <p className="text-zinc-300 text-sm font-medium truncate group-hover:text-white transition">{song.title}</p>
                           <p className="text-zinc-400 text-xs truncate group-hover:text-zinc-300">{song.artist}</p>
                        </div>

                        <button 
                          onClick={(e) => { 
                             e.stopPropagation(); 
                             removeFromQueue(originalIndex); 
                          }}
                          aria-label={`Hapus ${song.title} dari antrean`}
                          className="text-zinc-400 hover:text-red-500 p-2.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 transition"
                          title="Hapus dari antrean"
                        >
                          <Trash2 size={14} />
                        </button>
                     </div>
                   );
                 })}
              </div>
           )}
        </div>
      </div>
    </aside>
  );
}