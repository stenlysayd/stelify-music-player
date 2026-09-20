"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Music, Camera } from "lucide-react";

interface EditPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlist: { id: number; name: string; description?: string | null; coverUrl?: string | null };
  onSave: () => void;
}

export default function EditPlaylistModal({ isOpen, onClose, playlist, onSave }: EditPlaylistModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Effect untuk Reset Form saat modal dibuka
  useEffect(() => {
    if (isOpen && playlist) { // (Ganti 'playlist' jadi 'song' jika di EditSongModal)
      setName(playlist.name);
      setDescription(playlist.description || "");
      setPreview(playlist.coverUrl || null);
      setImageFile(null);
    }
  }, [isOpen, playlist]);

  // 2. Effect KHUSUS untuk Cleanup Memory (Anti Memory Leak)
  useEffect(() => {
    // Cleanup function ini jalan otomatis setiap kali 'preview' berubah 
    // ATAU saat komponen di-unmount/tutup.
    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]); // PENTING: Dependency ke 'preview'

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      if (imageFile) {
        formData.append("cover", imageFile);
      }

      const res = await fetch(`/api/playlists/${playlist.id}`, {
        method: "PATCH",
        body: formData,
      });

      if (res.ok) {
        onSave();
        onClose();
      }
    } catch (error) {
      alert("Gagal menyimpan perubahan");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-[#282828] w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex justify-between items-center p-6 pb-4">
          <h2 className="text-xl font-bold text-white">Edit details</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white"><X size={24} /></button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 pt-0 flex flex-col md:flex-row gap-6">

          {/* Kiri: Image Upload */}
          <div
            className="group relative w-40 h-40 md:w-48 md:h-48 bg-[#121212] shadow-lg flex-shrink-0 flex items-center justify-center cursor-pointer overflow-hidden rounded-md"
            onClick={() => fileInputRef.current?.click()}
          >
            {preview ? (
              <img src={preview} className="w-full h-full object-cover" />
            ) : (
              <Music size={64} className="text-zinc-600" />
            )}

            {/* Overlay saat hover */}
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200">
              <Camera size={32} className="text-white mb-2" />
              <span className="text-xs text-white font-medium">Choose photo</span>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleImageChange} />
          </div>

          {/* Kanan: Inputs */}
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-[#3e3e3e] text-white text-sm rounded p-3 outline-none focus:ring-1 focus:ring-white/50 font-bold"
                placeholder="Name"
              />
            </div>
            <div className="flex-1 flex flex-col gap-1 h-full">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-[#3e3e3e] text-white text-sm rounded p-3 outline-none focus:ring-1 focus:ring-white/50 resize-none h-full min-h-[100px]"
                placeholder="Add an optional description"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="bg-white text-black font-bold px-8 py-3 rounded-full hover:scale-105 active:scale-95 transition disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}