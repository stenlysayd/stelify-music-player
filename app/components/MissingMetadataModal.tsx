"use client";

import React, { useMemo } from "react";
// ✅ PERBAIKAN: Semua import icon disatukan di atas
import { X, AlertTriangle, ImageOff, UserX, Disc, Edit3, CheckCircle } from "lucide-react";
import { Song } from "../hooks/usePlayerStore";

interface MissingMetadataModalProps {
  isOpen: boolean;
  onClose: () => void;
  songs: Song[];
  onEditSong: (song: Song) => void;
}

export default function MissingMetadataModal({ isOpen, onClose, songs, onEditSong }: MissingMetadataModalProps) {
  
  // Filter lagu yang bermasalah
  const problemSongs = useMemo(() => {
    return songs.filter(s => 
        !s.coverUrl || 
        s.artist === "Unknown Artist" || 
        !s.album || s.album === "Unknown Album"
    );
  }, [songs]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#181818] border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-[#181818]">
          <div className="flex items-center gap-3">
             <div className="bg-red-500/10 p-2 rounded-full text-red-500">
                <AlertTriangle size={24} />
             </div>
             <div>
                <h3 className="text-xl font-bold text-white">Rapikan Library</h3>
                <p className="text-xs text-zinc-400">Ditemukan {problemSongs.length} lagu dengan data tidak lengkap.</p>
             </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition bg-zinc-800 p-2 rounded-full">
            <X size={20} />
          </button>
        </div>

        {/* List Songs */}
        <div className="p-2 overflow-y-auto flex-1 bg-[#121212]">
           {problemSongs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-zinc-500 gap-4">
                 <div className="bg-green-500/10 p-4 rounded-full text-green-500">
                    <CheckCircle size={40} />
                 </div>
                 <p>Library kamu sudah rapi! 🎉</p>
              </div>
           ) : (
              <div className="space-y-1">
                 {problemSongs.map((song) => {
                    const missingCover = !song.coverUrl;
                    const missingArtist = song.artist === "Unknown Artist";
                    const missingAlbum = !song.album || song.album === "Unknown Album";

                    return (
                       <div 
                          key={song.id} 
                          className="flex items-center gap-4 p-3 hover:bg-zinc-800 rounded-lg transition group border border-transparent hover:border-zinc-700"
                       >
                          {/* Cover Preview */}
                          <div className="w-12 h-12 bg-zinc-900 rounded-md flex items-center justify-center flex-shrink-0 text-zinc-600">
                             {song.coverUrl ? (
                                <img src={song.coverUrl} className="w-full h-full object-cover rounded-md" />
                             ) : (
                                <ImageOff size={20} className="text-red-500" />
                             )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                             <h4 className="font-bold text-white truncate text-sm">{song.title}</h4>
                             <div className="flex gap-2 mt-1">
                                {missingArtist && (
                                   <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded flex items-center gap-1 border border-red-500/20">
                                      <UserX size={10} /> No Artist
                                   </span>
                                )}
                                {missingAlbum && (
                                   <span className="text-[10px] bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded flex items-center gap-1 border border-orange-500/20">
                                      <Disc size={10} /> No Album
                                   </span>
                                )}
                                {missingCover && (
                                   <span className="text-[10px] bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded flex items-center gap-1 border border-yellow-500/20">
                                      <ImageOff size={10} /> No Cover
                                   </span>
                                )}
                             </div>
                          </div>

                          {/* Edit Button */}
                          <button 
                             onClick={() => onEditSong(song)}
                             className="bg-white text-black px-4 py-2 rounded-full text-xs font-bold hover:scale-105 transition flex items-center gap-2"
                          >
                             <Edit3 size={14} /> Edit
                          </button>
                       </div>
                    );
                 })}
              </div>
           )}
        </div>

      </div>
    </div>
  );
}