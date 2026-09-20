"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MoreHorizontal } from 'lucide-react'; 

interface PlaylistOptionsMenuProps {
  onReset: () => void;
  onChangeOrder: () => void;
}

export default function PlaylistOptionsMenu({ onReset, onChangeOrder }: PlaylistOptionsMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleReset = () => {
    onReset(); 
    setIsMenuOpen(false); 
  };

  const handleChangeOrder = () => {
    onChangeOrder(); 
    setIsMenuOpen(false); 
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []); // ✅ PERBAIKAN: Array kosong, bukan [menuRef]


  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      
      <div>
        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)} 
          className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-white transition"
          id="menu-button"
          aria-expanded={isMenuOpen}
          aria-haspopup="true"
        >
          <span className="sr-only">Buka opsi</span>
          <MoreHorizontal className="w-8 h-8" />
        </button>
      </div>

      {isMenuOpen && (
        <div
          className="origin-top-left absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-[#1e1e1e] border border-zinc-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-[100]" 
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="menu-button"
        >
          <div className="py-1" role="none">
            <button
              onClick={handleReset}
              className="text-gray-200 hover:bg-zinc-800 hover:text-white block w-full text-left px-4 py-2 text-sm"
              role="menuitem"
            >
              Reset Playlist
            </button>
            <button
              onClick={handleChangeOrder}
              className="text-gray-200 hover:bg-zinc-800 hover:text-white block w-full text-left px-4 py-2 text-sm"
              role="menuitem"
            >
              Ubah Urutan Lagu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}