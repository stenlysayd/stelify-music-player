"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Trash2, ListMusic, Play, MoreHorizontal, Clock3, Pause } from "lucide-react";
import { usePlayerStore, Song } from "../../hooks/usePlayerStore";
import SortableSongRow from "../../components/SortableSongRow";
import EditPlaylistModal from "../../components/EditPlaylistModal";
import AddToPlaylistModal from "../../components/AddToPlaylistModal"; 
import EditSongModal from "../../components/EditSongModal"; 

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

interface PlaylistData {
  id: number;
  name: string;
  description?: string;
  coverUrl?: string;
  songs: Song[];
}

export default function PlaylistPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  
  const [playlist, setPlaylist] = useState<PlaylistData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 1. Ref untuk Auto Scroll
  const activeSongRef = useRef<HTMLDivElement>(null);

  // Modal States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddToPlaylistOpen, setIsAddToPlaylistOpen] = useState(false);
  const [isEditSongOpen, setIsEditSongOpen] = useState(false);
  const [selectedSongId, setSelectedSongId] = useState<number | null>(null);
  const [songToEdit, setSongToEdit] = useState<Song | null>(null);

  // --- ZUSTAND OPTIMIZATION (SELECTORS) ---
  const currentSong = usePlayerStore((state) => state.currentSong);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  // Hapus showLyrics local karena sudah ditangani global overlay
  
  const playSong = usePlayerStore((state) => state.playSong);
  const setQueue = usePlayerStore((state) => state.setQueue);
  const togglePlay = usePlayerStore((state) => state.togglePlay);
  // Hapus setSeekTime jika tidak dipakai di sini (karena lirik view sudah dihapus)
  // ----------------------------------------

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchPlaylist = async () => {
    try {
      const res = await fetch(`/api/playlists/${id}`);
      if (res.ok) {
        const data = await res.json();
        setPlaylist(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylist();
  }, [id]);

  // --- LOGIKA AUTO SCROLL ---
  useEffect(() => {
    if (activeSongRef.current && currentSong) {
      activeSongRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center', 
      });
    }
  }, [currentSong?.id]); 
  // --------------------------

  // --- HANDLERS ---

  const handlePlay = (song: Song) => {
    if (!playlist) return;
    if (currentSong?.id === song.id) {
      togglePlay();
    } else {
      setQueue(playlist.songs, playlist.name);
      playSong(song);
    }
  };

  const handlePlayAll = () => {
    if (playlist && playlist.songs.length > 0) {
      setQueue(playlist.songs, playlist.name);
      if (currentSong && playlist.songs.some(s => s.id === currentSong.id)) {
         togglePlay();
      } else {
         playSong(playlist.songs[0]);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id && playlist) {
      const oldIndex = playlist.songs.findIndex((s) => s.id === active.id);
      const newIndex = playlist.songs.findIndex((s) => s.id === over?.id);
      const newSongs = arrayMove(playlist.songs, oldIndex, newIndex);
      setPlaylist({ ...playlist, songs: newSongs });
    }
  };

  const handleRemoveSongFromPlaylist = async (songId: number) => {
    if (!playlist) return;
    const previousSongs = playlist.songs;
    setPlaylist({ ...playlist, songs: playlist.songs.filter(s => s.id !== songId) });

    try {
      const res = await fetch(`/api/playlists/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId, action: 'remove' }),
      });
      if (!res.ok) throw new Error("Failed");
    } catch (e) { 
        setPlaylist({ ...playlist, songs: previousSongs });
        alert("Gagal menghapus lagu"); 
    }
  };

  const handleDeletePlaylist = async () => {
    if (!confirm("Yakin ingin menghapus playlist ini?")) return;
    try {
      const res = await fetch(`/api/playlists/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/"); 
        router.refresh();
      }
    } catch (e) {
      alert("Gagal menghapus playlist");
    }
  };

  const handleSongUpdated = (updated: Song) => {
     if(playlist) {
         setPlaylist({...playlist, songs: playlist.songs.map(s => s.id === updated.id ? updated : s)});
     }
  };

  const totalDurationString = useMemo(() => {
    if (!playlist || playlist.songs.length === 0) return "";
    const totalSeconds = playlist.songs.reduce((acc, song) => {
      if (!song.duration) return acc;
      const parts = song.duration.split(':');
      if (parts.length === 2) return acc + (parseInt(parts[0]) * 60) + parseInt(parts[1]);
      return acc;
    }, 0);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return hours > 0 ? `, sekitar ${hours} jam ${minutes} menit` : `, sekitar ${minutes} menit`;
  }, [playlist]);

  if (loading) return <div className="h-screen bg-black text-white flex items-center justify-center">Loading...</div>;
  if (!playlist) return <div className="h-screen bg-black text-white flex items-center justify-center">Playlist tidak ditemukan</div>;

  const isPlayingThisPlaylist = isPlaying && playlist.songs.some(s => s.id === currentSong?.id);

  return (
    <div className="h-screen text-white flex flex-col overflow-hidden bg-black">
      
      <EditPlaylistModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} playlist={playlist} onSave={fetchPlaylist} />
      <AddToPlaylistModal isOpen={isAddToPlaylistOpen} onClose={() => setIsAddToPlaylistOpen(false)} songId={selectedSongId} />
      <EditSongModal isOpen={isEditSongOpen} onClose={() => setIsEditSongOpen(false)} song={songToEdit} onSave={handleSongUpdated} />

      <div className="flex flex-1 h-full pt-16 md:pt-0 overflow-hidden">
        {/* Sidebar dihapus dari sini karena sudah ada di layout.tsx global */}
        
        {/* CONTAINER UTAMA */}
        <div className="flex-1 relative h-full flex flex-col min-w-0 transition-colors duration-500 bg-gradient-to-b from-[#2a2a2a] to-[#121212]">
            
            {/* LIRIK OVERLAY DIHAPUS DARI SINI */}
            {/* Sekarang ditangani oleh Global LyricsOverlay di layout.tsx */}

            {/* B. TAMPILAN LIST PLAYLIST */}
            <div className={`flex-1 flex flex-col h-full overflow-y-auto ${currentSong ? "pb-0" : "pb-8"} scrollbar-main`}>
                
                {/* HEADER */}
                <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center md:items-end text-center md:text-left bg-gradient-to-b from-white/5 to-transparent">
                   <div 
                     className="w-48 h-48 md:w-60 md:h-60 bg-[#282828] shadow-2xl shadow-black/50 flex items-center justify-center flex-shrink-0 group relative overflow-hidden rounded-lg cursor-pointer"
                     onClick={() => setIsEditOpen(true)}
                   >
                      {playlist.coverUrl ? (
                        <img src={playlist.coverUrl} className="w-full h-full object-cover" />
                      ) : (
                        <ListMusic size={64} className="text-zinc-600" />
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                         <span className="text-white font-bold text-sm">Edit Photo</span>
                      </div>
                   </div>

                   <div className="flex flex-col gap-2 w-full min-w-0">
                      <span className="text-xs font-bold uppercase tracking-wider hidden md:block">Playlist</span>
                      <h1 
                        className="text-3xl md:text-6xl lg:text-7xl font-black truncate leading-tight tracking-tighter cursor-pointer hover:scale-[1.01] origin-center md:origin-left transition"
                        onClick={() => setIsEditOpen(true)}
                      >
                        {playlist.name}
                      </h1>
                      <p className="text-zinc-400 text-sm font-medium mt-2 line-clamp-2 max-w-2xl mx-auto md:mx-0">
                        {playlist.description || "Tidak ada deskripsi."}
                      </p>
                      <div className="flex items-center justify-center md:justify-start gap-2 mt-2 text-sm font-bold text-white">
                         <span>Stelify Music</span><span className="w-1 h-1 bg-white rounded-full"></span><span>{playlist.songs.length} lagu{totalDurationString}</span>
                      </div>
                   </div>
                </div>

                {/* CONTROLS */}
                <div className="px-4 md:px-8 py-4 md:py-6 sticky top-0 z-20 bg-[#121212]/95 backdrop-blur-xl flex items-center justify-between border-b border-white/5">
                   <div className="flex items-center gap-4">
                      <button aria-label={isPlayingThisPlaylist ? 'Jeda' : 'Putar semua'} onClick={handlePlayAll} className="w-12 h-12 md:w-14 md:h-14 bg-green-500 rounded-full flex items-center justify-center hover:scale-105 transition shadow-lg text-black">
                         {isPlayingThisPlaylist ? <Pause className="w-6 h-6 md:w-7 md:h-7 fill-black" /> : <Play className="w-6 h-6 md:w-7 md:h-7 fill-black ml-1" />}
                      </button>
                      <button aria-label="Edit playlist info" onClick={() => setIsEditOpen(true)} className="text-zinc-400 hover:text-white transition p-2" title="Edit Playlist Info">
                         <MoreHorizontal size={32} />
                      </button>
                   </div>
                   <button aria-label="Hapus playlist" onClick={handleDeletePlaylist} className="text-zinc-400 hover:text-red-500 transition p-2" title="Hapus Playlist">
                     <Trash2 size={24} />
                   </button>
                </div>

                {/* LIST LAGU */}
                <div className="px-2 md:px-8 bg-[#121212]">
                   <div className="hidden md:flex items-center gap-4 px-4 pb-2 border-b border-white/10 text-zinc-400 text-xs font-bold sticky top-[105px] bg-[#121212] z-10 mb-2 pt-4">
                      <div className="w-[40px]"></div>
                      <div className="w-8 text-center">#</div>
                      <div className="flex-1">TITLE</div>
                      <div className="w-1/4">ALBUM</div>
                      <div className="w-32 text-right">DATE ADDED</div>
                      <div className="w-16 text-right"><Clock3 size={16} className="ml-auto" /></div>
                      <div className="w-[40px]"></div>
                   </div>

                   <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                     <SortableContext items={playlist.songs.map(s => s.id)} strategy={verticalListSortingStrategy}>
                       <div className="space-y-1">
                         {playlist.songs.map((s, i) => (
                           <div key={s.id} ref={currentSong?.id === s.id ? activeSongRef : null}>
                               <SortableSongRow
                                 song={s}
                                 index={i}
                                 isCurrent={currentSong?.id === s.id}
                                 isPlaying={isPlaying}
                                 onPlay={() => handlePlay(s)}
                                 onRemove={() => handleRemoveSongFromPlaylist(s.id)}
                                 onEdit={() => {
                                   setSongToEdit(s);
                                   setIsEditSongOpen(true);
                                 }}
                                 onAddToPlaylist={() => {
                                   setSelectedSongId(s.id);
                                   setIsAddToPlaylistOpen(true);
                                 }}
                               />
                           </div>
                         ))}
                       </div>
                     </SortableContext>
                   </DndContext>
                   
                   {playlist.songs.length === 0 && (
                      <div className="text-center py-20 text-zinc-500 flex flex-col items-center gap-4">
                         <ListMusic size={48} opacity={0.5} />
                         <p className="text-sm">Belum ada lagu di playlist ini.</p>
                      </div>
                   )}
                </div>

                {/* SPACER BESAR */}
                <div className="w-full h-32 shrink-0" />
            </div>
        </div>
      </div>
    </div>
  );
}