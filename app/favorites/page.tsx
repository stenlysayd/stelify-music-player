"use client";

import React, { useEffect, useState, useRef } from "react";
import { Play, Pause, Heart, Clock3, Music } from "lucide-react";
import { usePlayerStore, Song } from "./../hooks/usePlayerStore"; 

export default function FavoritesPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  // Ref untuk Auto Scroll
  const activeSongRef = useRef<HTMLDivElement>(null);

  // --- ZUSTAND OPTIMIZATION (SELECTORS) ---
  const currentSong = usePlayerStore((state) => state.currentSong);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  
  // Actions
  const playSong = usePlayerStore((state) => state.playSong);
  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const setQueue = usePlayerStore((state) => state.setQueue);
  const toggleLike = usePlayerStore((state) => state.toggleLike);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const res = await fetch("/api/favorites");
        if (res.ok) {
          const data = await res.json();
          setSongs(data);
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchFavorites();
  }, []);

  // --- LOGIKA AUTO SCROLL ---
  useEffect(() => {
    if (activeSongRef.current && currentSong) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setTimeout(() => {
        activeSongRef.current?.scrollIntoView({
            behavior: prefersReducedMotion ? 'auto' : 'smooth',
            block: 'center',
        });
      }, 100);
    }
  }, [currentSong?.id]); 

  const handlePlayAll = () => {
    if (songs.length > 0) {
      setQueue(songs, "LAGU DISUKAI");
      playSong(songs[0]);
    }
  };

  const handlePlayRow = (song: Song) => {
    if (currentSong?.id === song.id) {
      togglePlay();
    } else {
      setQueue(songs, "LAGU DISUKAI");
      playSong(song);
    }
  };

  const formatDuration = (d?: string) => d || "0:00";

  if (loading) return <div className="bg-black min-h-screen text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="h-screen text-white flex flex-col overflow-hidden bg-black">
      <div className="flex flex-1 h-full pt-16 md:pt-0 overflow-hidden">
        {/* CONTAINER UTAMA */}
        <div className="flex-1 relative h-full flex flex-col min-w-0">
            {/* B. TAMPILAN LIST */}
            <div className={`flex-1 flex flex-col h-full overflow-y-auto bg-gradient-to-b from-indigo-900 via-[#121212] to-[#121212] ${currentSong ? "pb-0" : "pb-8"} scrollbar-main`}>
                {/* HEADER */}
                <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center md:items-end text-center md:text-left bg-gradient-to-b from-white/5 to-transparent">
                    <div className="w-40 h-40 md:w-60 md:h-60 bg-gradient-to-br from-indigo-500 to-purple-500 shadow-2xl shadow-indigo-500/20 flex items-center justify-center flex-shrink-0 rounded-lg">
                        <Heart size={80} fill="white" className="text-white animate-pulse" />
                    </div>
                    <div className="flex flex-col gap-2 w-full min-w-0">
                        <span className="text-xs font-bold uppercase tracking-wider hidden md:block">Playlist</span>
                        <h1 className="text-3xl md:text-7xl font-black truncate leading-tight tracking-tighter">Lagu yang Disukai</h1>
                        <div className="flex items-center justify-center md:justify-start gap-2 mt-2 text-sm font-bold text-white">
                            <span>Stelify Music</span><span className="w-1 h-1 bg-white rounded-full"></span><span>{songs.length} lagu</span>
                        </div>
                    </div>
                </div>

                {/* CONTROLS */}
                <div className="px-6 md:px-8 py-4 sticky top-0 z-20 bg-[#121212]/95 backdrop-blur-xl flex items-center justify-between border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <button aria-label={isPlaying ? 'Jeda' : 'Putar semua favorit'} onClick={handlePlayAll} className="w-12 h-12 md:w-14 md:h-14 bg-green-500 rounded-full flex items-center justify-center hover:scale-105 transition shadow-lg text-black translate-y-0 hover:-translate-y-1">
                            {isPlaying && songs.some(s => s.id === currentSong?.id) ? <Pause className="w-6 h-6 md:w-7 md:h-7 fill-black" /> : <Play className="w-6 h-6 md:w-7 md:h-7 fill-black ml-1" />}
                        </button>
                    </div>
                </div>

                {/* LIST ITEMS */}
                <div className="px-2 md:px-8 bg-[#121212]">
                    <div className="hidden md:grid grid-cols-[40px_4fr_2fr_1fr_50px] gap-4 text-zinc-400 text-xs font-bold border-b border-white/10 pb-2 mb-4 px-4 pt-4">
                        <div className="text-center">#</div>
                        <div>TITLE</div>
                        <div>ALBUM</div>
                        <div className="text-right"><Clock3 size={16} className="ml-auto" /></div>
                        <div className="text-center">Action</div>
                    </div>

                    <div className="space-y-1">
                        {songs.length === 0 && !loading ? (
                          <div className="py-20 text-center">
                            <Heart size={48} className="mx-auto text-zinc-600 mb-4" />
                            <p className="text-lg font-semibold text-white">Belum ada lagu yang disukai</p>
                            <p className="text-sm text-zinc-400 mt-1">Sukai lagu untuk menambahkannya ke sini</p>
                          </div>
                        ) : (
                          songs.map((s, i) => {
                            const isCurrent = currentSong?.id === s.id;
                            return (
                                <div 
                                    key={s.id}
                                    ref={isCurrent ? activeSongRef : null} 
                                    onClick={() => handlePlayRow(s)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handlePlayRow(s); } }}
                                    className={`group flex md:grid md:grid-cols-[40px_4fr_2fr_1fr_50px] gap-3 md:gap-4 p-2 rounded-lg hover:bg-white/10 transition items-center cursor-pointer border border-transparent focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:outline-none ${isCurrent ? "bg-white/10 border-white/5" : ""}`}
                                >
                                    <div className="flex items-center justify-center">
                                        <span className="hidden md:block text-zinc-400 font-mono text-sm w-8 text-center group-hover:hidden">
                                            {isCurrent && isPlaying ? <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mx-auto" /> : i + 1}
                                        </span>
                                        <Play size={14} className="hidden md:hidden group-hover:md:block text-white fill-white" />
                                        <div className="md:hidden relative w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-zinc-800">
                                            {s.coverUrl ? <img src={s.coverUrl} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" /> : <Music size={20} className="text-zinc-500 m-auto mt-3" />}
                                            {isCurrent && (<div className="absolute inset-0 bg-black/40 flex items-center justify-center">{isPlaying ? (<div className="flex gap-[2px] items-end h-4"><div className="w-1 bg-green-500 h-full animate-pulse"></div><div className="w-1 bg-green-500 h-2 animate-pulse delay-75"></div><div className="w-1 bg-green-500 h-3 animate-pulse delay-150"></div></div>) : (<Play size={16} className="text-white fill-white" />)}</div>)}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="hidden md:block relative w-10 h-10 flex-shrink-0 rounded overflow-hidden bg-zinc-800">
                                            {s.coverUrl ? <img src={s.coverUrl} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" /> : null}
                                        </div>
                                        <div className="min-w-0"><p className={`font-medium text-sm truncate ${isCurrent ? 'text-green-500' : 'text-white'}`}>{s.title}</p><p className="text-xs text-zinc-400 truncate">{s.artist}</p></div>
                                    </div>
                                    <div className="hidden md:block text-zinc-400 text-sm truncate">{s.album || "Unknown"}</div>
                                    <div className="hidden md:block text-right text-zinc-400 text-sm font-mono">{formatDuration(s.duration)}</div>
                                    <div className="flex justify-end md:justify-center">
                                        <button onClick={(e) => { e.stopPropagation(); setSongs(prev => prev.filter(item => item.id !== s.id)); toggleLike(s.id); }} className="p-2 text-green-500 hover:text-white hover:bg-zinc-700 rounded-full transition" title="Hapus dari Favorit">
                                            <Heart size={20} className="fill-green-500 hover:fill-none transition" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                        )}
                    </div>

                    {/* SPACER BESAR */}
                    <div className="w-full h-[150px] shrink-0" />
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
