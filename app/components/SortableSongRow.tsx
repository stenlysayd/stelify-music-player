"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Play, GripVertical } from "lucide-react";
import { Song } from "../hooks/usePlayerStore";
import SongContextMenu from "./SongContextMenu";

interface SortableSongRowProps {
  song: Song;
  index: number;
  isCurrent: boolean;
  isPlaying: boolean;
  onPlay: () => void;
  onRemove: () => void;
  onEdit?: () => void;
  onAddToPlaylist?: () => void;
}

export default function SortableSongRow({
  song,
  index,
  isCurrent,
  isPlaying,
  onPlay,
  onRemove,
  onEdit,
  onAddToPlaylist,
}: SortableSongRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: song.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.5 : 1,
  };

  const formatDuration = (d?: string) => d || "0:00";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group relative flex items-center gap-2 md:gap-4 p-2 rounded-lg mb-1 transition-colors
        ${isCurrent ? "bg-white/10 border border-white/5" : "hover:bg-white/5 border border-transparent"}
        ${isDragging ? "bg-zinc-800 shadow-xl scale-[1.02]" : ""}
      `}
    >
      {/* --- 1. DRAG HANDLE (Muncul di Mobile & Desktop) --- */}
      {/* Area sentuh diperbesar untuk HP */}
      <div 
        aria-label={`Ubah urutan ${song.title}`}
        className="flex items-center justify-center text-zinc-400 p-2 cursor-grab active:cursor-grabbing active:text-white touch-none"
        {...attributes} 
        {...listeners}
      >
        <GripVertical size={20} />
      </div>

      {/* --- 2. INDEX / PLAY (Desktop Only) --- */}
      <div className="hidden md:flex w-8 justify-center text-zinc-500 font-mono text-sm" onClick={onPlay}>
        {isCurrent && isPlaying ? (
           <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
        ) : (
           <>
             <span className="group-hover:hidden">{index + 1}</span>
             <Play size={14} className="hidden group-hover:block text-white fill-white cursor-pointer" />
           </>
        )}
      </div>

      {/* --- 3. INFO UTAMA (Cover + Teks) --- */}
      <div className="flex-1 flex items-center gap-3 min-w-0 cursor-pointer" onClick={onPlay}>
        {/* Cover Art (Ukuran Pas di Mobile) */}
        <div className="relative w-12 h-12 md:w-10 md:h-10 flex-shrink-0 rounded overflow-hidden bg-zinc-800 shadow-sm">
           {song.coverUrl ? (
             <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover" />
           ) : (
             <div className="w-full h-full flex items-center justify-center text-zinc-600 text-[10px]">🎵</div>
           )}
           {/* Overlay Play saat Active */}
           {isCurrent && isPlaying && (
             <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="w-1 h-3 bg-green-500 mx-[1px] animate-bounce motion-reduce:animate-none" />
                <div className="w-1 h-4 bg-green-500 mx-[1px] animate-bounce delay-75 motion-reduce:animate-none" />
                <div className="w-1 h-2 bg-green-500 mx-[1px] animate-bounce delay-150 motion-reduce:animate-none" />
             </div>
           )}
        </div>

        {/* Teks Info */}
        <div className="min-w-0 flex-1">
          <p className={`font-semibold text-sm truncate ${isCurrent ? 'text-green-500' : 'text-white'}`}>
            {song.title}
          </p>
          <p className="text-xs text-zinc-400 truncate flex items-center gap-1">
             {song.artist}
             {/* Di HP, tampilkan album jika muat */}
             {song.album && <span className="hidden sm:inline text-zinc-600">• {song.album}</span>}
          </p>
        </div>
      </div>

      {/* --- 4. METADATA (Desktop Only) --- */}
      <div className="hidden md:block w-1/4 text-zinc-400 text-sm truncate px-2">
        {song.album || "Unknown"}
      </div>
      <div className="hidden md:block w-32 text-zinc-400 text-sm truncate text-right px-2">
        {song.createdAt ? new Date(song.createdAt).toLocaleDateString() : "-"}
      </div>
      <div className="hidden md:block w-16 text-right text-zinc-400 text-sm font-mono">
        {formatDuration(song.duration)}
      </div>
      
      {/* --- 5. ACTION MENU --- */}
      <div className="flex items-center justify-end pl-2">
         <SongContextMenu 
            song={song}
            onEdit={onEdit || (() => {})} 
            onAddToPlaylist={onAddToPlaylist || (() => {})} 
            onDelete={onRemove}
         />
      </div>
    </div>
  );
}