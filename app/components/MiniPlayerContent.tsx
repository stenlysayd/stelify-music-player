import React from 'react';
import { Shuffle, SkipBack, Pause, Play, SkipForward, Repeat, Repeat1, Heart, X } from "lucide-react";
import { Song, RepeatMode } from "../hooks/usePlayerStore";

type RangeStyle = React.CSSProperties & { "--value": string };

interface MiniPlayerContentProps {
  currentSong: Song | null;
  isPlaying: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  currentTime: number;
  duration: number;
  toggleShuffle: () => void;
  playPrev: () => void;
  togglePlay: () => void;
  playNext: () => void;
  toggleRepeat: () => void;
  toggleLike: (id: number) => void;
  onClosePip: () => void;
  handleSeek: (e: React.ChangeEvent<HTMLInputElement>) => void;
  formatTime: (time: number) => string;
}

export default function MiniPlayerContent({
  currentSong, isPlaying, isShuffle, repeatMode, currentTime, duration,
  toggleShuffle, playPrev, togglePlay, playNext, toggleRepeat, toggleLike, onClosePip, handleSeek, formatTime
}: MiniPlayerContentProps) {
  
  if (!currentSong) return null;

  // --- LOGIC ADDED: Calculate progress percentage ---
  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex flex-col w-full h-screen relative group bg-black overflow-hidden select-none">
        {/* Background & Overlay */}
        <div className="absolute inset-0 z-0">
             {currentSong.coverUrl ? <img src={currentSong.coverUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-zinc-900" />}
        </div>
        <div className="absolute inset-0 z-10 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-100 group-hover:opacity-0 transition-opacity duration-200" />
        
        {/* Tombol Close */}
        <div className="absolute top-0 right-0 z-50 p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button onClick={onClosePip} className="p-1.5 bg-transparent hover:bg-white/10 rounded-full text-white/80 hover:text-white">
                <X size={20} />
            </button>
        </div>

        {/* Controls Tengah */}
        <div className="absolute inset-0 z-20 flex flex-col justify-center items-center gap-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="flex items-center gap-5">
                <button onClick={toggleShuffle} className={`${isShuffle ? "text-green-500" : "text-zinc-400 hover:text-white"}`}><Shuffle size={20} /></button>
                <button onClick={playPrev} className="text-white hover:text-zinc-300 transition"><SkipBack size={28} fill="white" /></button>
                <button onClick={togglePlay} className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 transition shadow-lg">
                    {isPlaying ? <Pause size={28} fill="black" /> : <Play size={28} fill="black" className="ml-1" />}
                </button>
                <button onClick={playNext} className="text-white hover:text-zinc-300 transition"><SkipForward size={28} fill="white" /></button>
                <button onClick={toggleRepeat} className={`${repeatMode !== 'off' ? "text-green-500" : "text-zinc-400 hover:text-white"}`}>
                    {repeatMode === 'one' ? <Repeat1 size={20} /> : <Repeat size={20} />}
                </button>
            </div>
        </div>

        {/* Info Bawah */}
        <div className="absolute bottom-0 left-2 right-2 z-20 p-4 flex flex-col gap-1">
            <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 mb-2 translate-y-2 group-hover:translate-y-0">
                 <div className="flex items-center gap-2 text-[10px] font-medium text-zinc-300">
                    <span>{formatTime(currentTime)}</span>
                    
                    {/* --- PROGRESS BAR MODIFIED --- */}
                    <input 
                        type="range" 
                        min={0} 
                        max={duration || 0} 
                        value={currentTime} 
                        onChange={handleSeek} 
                        // Logic for the green/white bar effect
                        style={{ "--value": `${progressPercent}%` } as RangeStyle}
                        className="flex-1 h-1 bg-transparent appearance-none cursor-pointer mini-player-range transition-all" 
                    />
                    
                    <span>{formatTime(duration)}</span>
                 </div>
            </div>
            <div className="flex items-end justify-between transition-all duration-200">
                <div className="min-w-0 flex-1 pr-2">
                    <h2 className="text-white font-bold text-base leading-tight truncate drop-shadow-md">{currentSong.title}</h2>
                    <p className="text-zinc-300 text-xs truncate drop-shadow-md mt-0.5">{currentSong.artist}</p>
                </div>
                <button onClick={() => toggleLike(currentSong.id)} className="mb-1 text-white hover:scale-110 transition drop-shadow-md">
                     <Heart size={22} className={currentSong.isLiked ? "text-green-500 fill-green-500" : "text-white"} />
                </button>
            </div>
        </div>

        {/* --- CSS STYLE INJECTION FOR PROGRESS BAR --- */}
        <style jsx>{`
            /* Track (Background Bar) */
            .mini-player-range::-webkit-slider-runnable-track {
                height: 4px;
                border-radius: 2px;
                /* Gradient: Green/White on left, transparent/grey on right */
                background: linear-gradient(to right, #1db954 0%, #1db954 var(--value), rgba(255,255,255,0.3) var(--value), rgba(255,255,255,0.3) 100%);
            }

            /* Thumb (Circle handle) - Hidden by default, shown on hover/active */
            .mini-player-range::-webkit-slider-thumb {
                appearance: none;
                width: 0;
                height: 0;
                background: white;
                border-radius: 50%;
                margin-top: -4px; 
                transition: all 0.2s;
            }

            /* Hover state for thumb */
            .mini-player-range:hover::-webkit-slider-thumb {
                width: 12px;
                height: 12px;
                box-shadow: 0 0 10px rgba(0,0,0,0.5);
            }
        `}</style>
    </div>
  );
}
