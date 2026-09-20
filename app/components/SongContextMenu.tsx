"use client";

import React, { useState, useRef, useEffect } from "react";
import { MoreHorizontal, ListPlus, PlayCircle, Edit3, Trash2, ListMusic, Check } from "lucide-react";
import { usePlayerStore, Song } from "../hooks/usePlayerStore";

interface SongContextMenuProps {
  song: Song;
  onEdit: (song: Song) => void;
  onAddToPlaylist: (id: number) => void;
  onDelete: (id: number) => void;
}

export default function SongContextMenu({ song, onEdit, onAddToPlaylist, onDelete }: SongContextMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<'bottom' | 'top'>('bottom'); // State posisi
  const [message, setMessage] = useState("");
  
  const menuRef = useRef<HTMLDivElement>(null);
  const { addToQueue, playSongNext } = usePlayerStore();

  // Tutup menu jika klik di luar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setMessage("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- LOGIC SMART POSITIONING ---
  const toggleMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    
    if (!isOpen) {
      // Hitung jarak tombol ke bawah layar
      const buttonRect = e.currentTarget.getBoundingClientRect();
      const spaceBelow = window.innerHeight - buttonRect.bottom;
      
      // Jika sisa ruang di bawah kurang dari 250px (tinggi menu + player bar),
      // maka munculkan ke ATAS (Top).
      if (spaceBelow < 300) {
        setMenuPosition('top');
      } else {
        setMenuPosition('bottom');
      }
    }
    
    setIsOpen(!isOpen);
  };
  // -------------------------------

  const handlePlayNext = () => {
    playSongNext(song);
    showFeedback("Playing next!");
  };

  const handleAddToQueue = () => {
    addToQueue(song);
    showFeedback("Added to queue");
  };

  const showFeedback = (msg: string) => {
    setMessage(msg);
    setTimeout(() => {
      setMessage("");
      setIsOpen(false);
    }, 2000);
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button 
        onClick={toggleMenu} // Panggil fungsi toggleMenu baru
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`Menu opsi untuk ${song.title}`}
        className={`p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full transition ${isOpen ? "text-white bg-zinc-800" : "text-zinc-400 hover:text-white hover:bg-zinc-800"}`}
      >
        <MoreHorizontal size={20} />
      </button>

      {/* Dropdown / Dropup Menu */}
      {isOpen && (
        <div 
          role="menu"
          className={`
            absolute right-0 w-56 bg-[#1e1e1e] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden 
            animate-in fade-in zoom-in-95 duration-100 z-[100]
            ${menuPosition === 'top' 
                ? 'bottom-full mb-2 origin-bottom-right'  // Kelas untuk Dropup
                : 'top-full mt-2 origin-top-right'        // Kelas untuk Dropdown
            }
          `}
        >
          
          {message ? (
             <div role="status" aria-live="polite" className="p-3 text-center text-green-500 text-sm flex items-center justify-center gap-2 bg-green-500/10">
                <Check size={14} /> {message}
             </div>
          ) : (
            <div className="py-1">
              <button 
                role="menuitem"
                onClick={(e) => { e.stopPropagation(); handlePlayNext(); }}
                className="w-full text-left px-4 py-3 text-sm text-zinc-200 hover:bg-zinc-800 flex items-center gap-3 transition"
              >
                <PlayCircle size={16} className="text-zinc-400" /> Play Next
              </button>

              <button 
                role="menuitem"
                onClick={(e) => { e.stopPropagation(); handleAddToQueue(); }}
                className="w-full text-left px-4 py-3 text-sm text-zinc-200 hover:bg-zinc-800 flex items-center gap-3 transition"
              >
                <ListPlus size={16} className="text-zinc-400" /> Add to Queue
              </button>

              <div className="h-px bg-zinc-800 my-1 mx-2"></div>

              <button 
                role="menuitem"
                onClick={(e) => { e.stopPropagation(); onEdit(song); setIsOpen(false); }}
                className="w-full text-left px-4 py-3 text-sm text-zinc-200 hover:bg-zinc-800 flex items-center gap-3 transition"
              >
                <Edit3 size={16} className="text-zinc-400" /> Edit Info
              </button>

              <button 
                role="menuitem"
                onClick={(e) => { e.stopPropagation(); onAddToPlaylist(song.id); setIsOpen(false); }}
                className="w-full text-left px-4 py-3 text-sm text-zinc-200 hover:bg-zinc-800 flex items-center gap-3 transition"
              >
                <ListMusic size={16} className="text-zinc-400" /> Add to Playlist
              </button>

              <div className="h-px bg-zinc-800 my-1 mx-2"></div>

              <button 
                role="menuitem"
                onClick={(e) => { e.stopPropagation(); onDelete(song.id); setIsOpen(false); }}
                className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-3 transition"
              >
                <Trash2 size={16} /> Delete Song
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}