"use client";

import React, { useState, useRef, useEffect } from "react";
import { Upload, Music, X, CheckCircle, AlertCircle, Loader2, FileText, Edit3, Save, Info } from "lucide-react"; 
import * as jsmediatags from "jsmediatags";
import { fetchLrcFromApi } from "../utils/lrcFetcher"; 

interface UploadItem {
  id: string;
  file: File;
  title: string;
  artist: string;
  album: string;
  lyrics: string;
  duration: number;
  status: "pending" | "uploading" | "success" | "error"; 
  isEditing: boolean;
}

const createUploadItemId = (file: File) => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${file.name}`;
};

export default function UploadForm() {
  const [queue, setQueue] = useState<UploadItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // State untuk notifikasi duplikat
  const [skippedCount, setSkippedCount] = useState(0);
  const [showToast, setShowToast] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Efek untuk menghilangkan toast otomatis setelah 5 detik
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  // 1. HELPER: Dapatkan Durasi
  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = document.createElement("audio");
      audio.src = URL.createObjectURL(file);
      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(audio.src);
        resolve(audio.duration);
      };
      audio.onerror = () => resolve(0);
    });
  };

  // 2. HELPER: Cek Duplikat ke API
  const checkIsDuplicate = async (title: string, artist: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/songs/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, artist }),
      });
      const data = await res.json();
      return data.exists;
    } catch (e) {
      return false;
    }
  };

  // 3. PROSES FILE (Metadata + Lirik + Return status duplikat)
  const processFile = async (file: File): Promise<{ item: UploadItem, isDuplicate: boolean }> => {
    return new Promise(async (resolve) => {
      let title = file.name.replace(/\.[^/.]+$/, ""); 
      let artist = "Unknown Artist";
      let album = "Unknown Album";
      let duration = 0;

      // Ambil Durasi
      try { duration = await getAudioDuration(file); } catch (e) {}

      // Baca ID3 Tags
      await new Promise<void>((tagResolve) => {
        jsmediatags.read(file, {
          onSuccess: (tag) => {
            if (tag.tags.title) title = tag.tags.title;
            if (tag.tags.artist) artist = tag.tags.artist;
            if (tag.tags.album) album = tag.tags.album;
            tagResolve();
          },
          onError: () => tagResolve()
        });
      });

      // Cek Duplikat SEBELUM fetch lirik (agar hemat resource & cepat)
      const isDup = await checkIsDuplicate(title, artist);
      
      let lyrics = "";
      // Hanya cari lirik jika bukan duplikat
      if (!isDup && artist !== "Unknown Artist") {
         try { lyrics = await fetchLrcFromApi(artist, title, duration); } catch (err) {}
      }

      const newItem: UploadItem = {
        id: createUploadItemId(file),
        file,
        title,
        artist,
        album,
        lyrics,
        duration,
        status: "pending",
        isEditing: false
      };

      resolve({ item: newItem, isDuplicate: isDup });
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: File[] = Array.from(files);
    
    // Proses semua file secara paralel
    const processedResults = await Promise.all(newFiles.map(processFile));
    
    // Filter: Pisahkan yang duplikat dan yang baru
    const newItems: UploadItem[] = [];
    let duplicatesFound = 0;

    processedResults.forEach(res => {
        if (res.isDuplicate) {
            duplicatesFound++;
        } else {
            newItems.push(res.item);
        }
    });

    // Update Queue hanya dengan lagu baru
    setQueue((prev) => [...prev, ...newItems]);
    
    // Tampilkan notifikasi jika ada yang dilewati (diskip)
    if (duplicatesFound > 0) {
        setSkippedCount(duplicatesFound);
        setShowToast(true);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemove = (id: string) => {
    setQueue(queue.filter(item => item.id !== id));
  };

  const handleUpdateItem = <K extends keyof UploadItem>(id: string, field: K, value: UploadItem[K]) => {
    setQueue(queue.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const toggleEdit = async (id: string) => {
     const item = queue.find(q => q.id === id);
     if (!item) return;

     if (item.isEditing) {
        setQueue(queue.map(q => q.id === id ? { ...q, isEditing: false } : q));
     } else {
        setQueue(queue.map(q => q.id === id ? { ...q, isEditing: true } : q));
     }
  }

  const handleUploadAll = async () => {
    setIsProcessing(true);
    
    const pendingItems = queue.filter(q => q.status === "pending" || q.status === "error");

    for (const item of pendingItems) {
      setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: "uploading" } : q));

      try {
        const formData = new FormData();
        formData.append("file", item.file);
        formData.append("title", item.title);
        formData.append("artist", item.artist);
        formData.append("album", item.album);
        formData.append("lyrics", item.lyrics || "");
        
        const res = await fetch("/api/songs", { 
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Upload failed");

        setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: "success" } : q));
      } catch (err) {
        console.error(err);
        setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: "error" } : q));
      }
    }

    setIsProcessing(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto relative pb-10">
      
      {/* FLOATING TOAST NOTIFICATION (Pemberitahuan Duplikat) */}
      {showToast && (
          <div className="fixed top-20 right-4 md:right-10 z-50 bg-yellow-600/90 text-white px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
              <Info className="w-5 h-5 flex-shrink-0" />
              <div>
                  <p className="font-bold text-sm">Info Upload</p>
                  <p className="text-xs">{skippedCount} lagu dilewati karena sudah ada.</p>
              </div>
              <button onClick={() => setShowToast(false)} className="ml-2 hover:text-black/50"><X size={16}/></button>
          </div>
      )}

      {/* DROP ZONE */}
      <div 
        className="border-2 border-dashed border-zinc-700 bg-zinc-900/50 hover:bg-zinc-900 transition rounded-xl p-6 md:p-8 text-center cursor-pointer group"
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="w-14 h-14 md:w-16 md:h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition">
          <Upload className="text-zinc-400 group-hover:text-white" size={28} />
        </div>
        <h3 className="text-lg md:text-xl font-bold text-white mb-2">Pilih Lagu (Batch)</h3>
        <p className="text-zinc-400 text-sm">Klik untuk memilih banyak file MP3 sekaligus.</p>
        
        <input 
          ref={fileInputRef}
          type="file" 
          accept="audio/*" 
          multiple
          className="hidden" 
          onChange={handleFileChange}
        />
      </div>

      {/* QUEUE LIST */}
      {queue.length > 0 && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
             <h2 className="text-lg md:text-xl font-bold">Antrean ({queue.length})</h2>
             <button onClick={() => setQueue([])} className="text-sm text-red-400 hover:text-red-300">Clear All</button>
          </div>

          <div className="grid gap-3">
            {queue.map((item) => (
              <div 
                key={item.id} 
                className={`
                    bg-zinc-900 border p-3 md:p-4 rounded-lg flex flex-col md:flex-row gap-3 md:gap-4 transition
                    ${item.status === 'success' ? 'opacity-50 border-green-900/30' : 'border-zinc-800'}
                `}
              >
                
                {/* Icon Status */}
                <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-zinc-800 rounded-md flex-shrink-0 self-start md:self-center">
                  {item.status === 'pending' && <Music size={20} className="text-zinc-400" />}
                  {item.status === 'uploading' && <Loader2 size={20} className="text-blue-500 animate-spin" />}
                  {item.status === 'success' && <CheckCircle size={20} className="text-green-500" />}
                  {item.status === 'error' && <AlertCircle size={20} className="text-red-500" />}
                </div>

                {/* Form / Info */}
                <div className="flex-1 min-w-0">
                  {item.isEditing ? (
                     <div className="grid grid-cols-1 gap-2">
                        <input value={item.title} onChange={(e) => handleUpdateItem(item.id, 'title', e.target.value)} className="bg-zinc-950 p-2 rounded text-sm border border-zinc-700 w-full" placeholder="Title" />
                        <input value={item.artist} onChange={(e) => handleUpdateItem(item.id, 'artist', e.target.value)} className="bg-zinc-950 p-2 rounded text-sm border border-zinc-700 w-full" placeholder="Artist" />
                        <textarea value={item.lyrics} onChange={(e) => handleUpdateItem(item.id, 'lyrics', e.target.value)} className="bg-zinc-950 p-2 rounded text-sm border border-zinc-700 font-mono h-24 w-full" placeholder="Lyrics..." />
                     </div>
                  ) : (
                     <div>
                        <h4 className="font-bold text-white truncate text-sm md:text-base">{item.title}</h4>
                        <p className="text-xs md:text-sm text-zinc-400 truncate">{item.artist} • {item.album}</p>
                        
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                           {item.lyrics ? (
                             <span className="text-[10px] md:text-xs bg-green-900/30 text-green-400 px-2 py-0.5 rounded flex items-center gap-1">
                               <FileText size={10} /> Lirik
                             </span>
                           ) : (
                             <span className="text-[10px] md:text-xs bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded">No Lyrics</span>
                           )}
                           <span className="text-[10px] md:text-xs text-zinc-600">{Math.floor(item.duration / 60)}:{Math.floor(item.duration % 60).toString().padStart(2, '0')}</span>
                        </div>
                     </div>
                  )}
                </div>

                {/* Actions Button */}
                <div className="flex items-center gap-1 md:gap-2 self-end md:self-center">
                  {item.status === 'pending' && (
                    <>
                       <button onClick={() => toggleEdit(item.id)} className="p-2 hover:bg-zinc-700 rounded-full text-zinc-400 hover:text-white transition" title="Edit">
                         {item.isEditing ? <Save size={18} className="text-blue-400"/> : <Edit3 size={18}/>}
                       </button>
                       <button onClick={() => handleRemove(item.id)} className="p-2 hover:bg-zinc-700 rounded-full text-zinc-400 hover:text-red-500 transition" title="Hapus">
                         <X size={18} />
                       </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* UPLOAD BUTTON - (STATIC POSITION) */}
          {/* Tombol ini sekarang ada di dalam aliran dokumen biasa (bukan fixed), 
              sehingga bisa discroll sampai terlihat meskipun ada player music di bawah */}
          <div className="mt-8 mb-8 w-full">
             <button
               onClick={handleUploadAll}
               disabled={isProcessing || queue.filter(q => q.status === 'pending').length === 0}
               className={`w-full py-4 rounded-xl font-bold text-lg shadow-xl flex items-center justify-center gap-2 transition
                 ${isProcessing || queue.filter(q => q.status === 'pending').length === 0
                   ? "bg-zinc-800 cursor-not-allowed text-zinc-500 border border-zinc-700" 
                   : "bg-green-600 hover:bg-green-500 text-white"
                 }`}
             >
               {isProcessing ? (
                 <> <Loader2 className="animate-spin" /> Mengupload... </>
               ) : (
                 <> <Upload /> Upload ({queue.filter(q => q.status === 'pending').length}) Lagu </>
               )}
             </button>
          </div>

        </div>
      )}
    </div>
  );
}
