"use client";

import React, { useState, useEffect } from "react";
import { X, Save, FileText } from "lucide-react";
import { Song } from "../hooks/usePlayerStore";

interface EditSongModalProps {
  isOpen: boolean;
  onClose: () => void;
  song: Song | null;
  onSave: (updatedSong: Song) => void;
}

export default function EditSongModal({ isOpen, onClose, song, onSave }: EditSongModalProps) {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [album, setAlbum] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [loading, setLoading] = useState(false);

  // --- PERBAIKAN DI SINI ---
  // Gunakan 'song', bukan 'playlist'.
  // Tidak perlu cleanup image karena modal ini cuma edit teks.
  useEffect(() => {
    if (isOpen && song) {
      setTitle(song.title || "");
      setArtist(song.artist || "");
      setAlbum(song.album || "");
      setLyrics(song.lyrics || "");
    }
  }, [isOpen, song]);
  // -------------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!song) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/songs/${song.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title, 
          artist, 
          album, 
          lyrics 
        }),
      });

      if (res.ok) {
        const updatedData = await res.json();
        onSave(updatedData);
        onClose();
      } else {
        alert("Gagal mengupdate lagu");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !song) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-zinc-900">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="text-blue-500" /> Edit Metadata
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition">
            <X />
          </button>
        </div>

        {/* Form Scrollable */}
        <div className="p-6 overflow-y-auto">
          <form id="edit-form" onSubmit={handleSubmit} className="space-y-4">
            
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Title</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Artist */}
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Artist</label>
                <input 
                  type="text" 
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Album */}
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Album</label>
                <input 
                  type="text" 
                  value={album}
                  onChange={(e) => setAlbum(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Lyrics */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Lyrics (.lrc)</label>
              <textarea 
                value={lyrics}
                onChange={(e) => setLyrics(e.target.value)}
                rows={8}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="[00:12.00] Paste lyrics here..."
              />
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-zinc-400 hover:text-white transition"
            type="button"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="edit-form"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold transition flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? "Saving..." : <><Save size={18} /> Save Changes</>}
          </button>
        </div>

      </div>
    </div>
  );
}