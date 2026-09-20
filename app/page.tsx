"use client";

import React, {
  useEffect,
  useState,
  Suspense,
  useMemo,
  useRef,
  memo,
  useCallback
} from "react";
import { Play, Pause, Search, Clock3, Heart } from "lucide-react";
import { usePlayerStore, Song } from "./hooks/usePlayerStore";
import AddToPlaylistModal from "./components/AddToPlaylistModal";
import SongContextMenu from "./components/SongContextMenu";
import EditSongModal from "./components/EditSongModal";
import PlaylistOptionsMenu from "./PlaylistOptionsMenu";
import Fuse from "fuse.js";

/* =======================
   CONFIG
======================= */
const IDLE_TIMEOUT = 10_000;

const FUSE_OPTIONS = {
  keys: [
    { name: "title", weight: 0.6 },
    { name: "artist", weight: 0.3 },
    { name: "album", weight: 0.1 }
  ],
  threshold: 0.4,
  ignoreLocation: true
};

/* =======================
   SONG ROW
======================= */
const SongListItem = memo(
  ({
    song,
    index,
    isCurrent,
    isPlaying,
    onPlay,
    onLike,
    onEdit,
    onAddToPlaylist,
    onDelete,
    lastUserActivityRef
  }: {
    song: Song;
    index: number;
    isCurrent: boolean;
    isPlaying: boolean;
    onPlay: (song: Song) => void;
    onLike: (e: React.MouseEvent, id: number) => void;
    onEdit: (s: Song) => void;
    onAddToPlaylist: (id: number) => void;
    onDelete: (id: number) => void;
    lastUserActivityRef: React.MutableRefObject<number>;
  }) => {
    const itemRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!isCurrent) return;

      const now = Date.now();
      if (now - lastUserActivityRef.current < IDLE_TIMEOUT) return;

      const t = setTimeout(() => {
        itemRef.current?.scrollIntoView({
          behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'instant' as ScrollBehavior : 'smooth' as ScrollBehavior,
          block: "center"
        });
      }, 120);

      return () => clearTimeout(t);
    }, [isCurrent]);

    return (
      <div
        ref={itemRef}
        onClick={() => onPlay(song)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPlay(song); } }}
        aria-label={`Putar ${song.title} oleh ${song.artist}`}
        className={`group grid grid-cols-[16px_minmax(0,1fr)_40px]
        md:grid-cols-[16px_4fr_2fr_2fr_1fr_140px]
        gap-4 px-4 py-2 rounded-md cursor-pointer transition items-center focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:outline-none
        ${isCurrent ? "bg-zinc-800/60" : "hover:bg-zinc-800/30"}`}
      >
        <div className="flex justify-center text-zinc-400">
          {isCurrent && isPlaying ? (
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          ) : (
            <>
              <span className={`group-hover:hidden ${isCurrent ? "text-green-500" : ""}`}>
                {index + 1}
              </span>
              <Play size={14} className="hidden group-hover:block text-white" />
            </>
          )}
        </div>

        <div className="flex items-center gap-3 min-w-0">
          {song.coverUrl ? (
            <img
              src={song.coverUrl}
              alt=""
              loading="lazy"
              decoding="async"
              className="w-10 h-10 rounded object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-zinc-800 rounded flex items-center justify-center">
              <Play size={16} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className={`truncate font-medium ${isCurrent ? "text-green-500" : "text-white"}`}>
                {song.title}
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLike(e, song.id);
                }}
                aria-label={song.isLiked ? 'Hapus dari favorit' : 'Tambah ke favorit'}
                className={`p-1.5 transition ${song.isLiked ? "text-green-500" : "text-zinc-500 hover:text-white"
                  }`}
              >
                <Heart size={16} className={song.isLiked ? "fill-green-500" : ""} />
              </button>
            </div>
            <p className="text-xs text-zinc-400 truncate">{song.artist}</p>
          </div>
        </div>

        <div className="hidden md:block truncate text-zinc-400">{song.album}</div>
        <div className="hidden md:block text-zinc-400">
          {song.createdAt ? new Date(song.createdAt).toLocaleDateString() : "-"}
        </div>
        <div className="hidden md:block text-right text-zinc-400">{song.duration}</div>

        <div className="flex justify-end">
          <SongContextMenu
            song={song}
            onEdit={onEdit}
            onAddToPlaylist={onAddToPlaylist}
            onDelete={onDelete}
          />
        </div>
      </div>
    );
  }
);

SongListItem.displayName = "SongListItem";

/* =======================
   PAGE WRAPPER
======================= */
export default function HomePageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>}>
      <HomePage />
    </Suspense>
  );
}

/* =======================
   MAIN PAGE
======================= */
function HomePage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSongId, setSelectedSongId] = useState<number | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [songToEdit, setSongToEdit] = useState<Song | null>(null);

  /* ===== USER ACTIVITY TRACKER ===== */
  const lastUserActivityRef = useRef(0);

  const markUserActive = useCallback(() => {
    lastUserActivityRef.current = Date.now();
  }, []);

  useEffect(() => {
    const events = ["scroll", "keydown", "mousedown", "touchstart"];
    events.forEach(e =>
      window.addEventListener(e, markUserActive, { passive: true })
    );
    return () => {
      events.forEach(e => window.removeEventListener(e, markUserActive));
    };
  }, [markUserActive]);

  /* ===== PLAYER STORE ===== */
  const currentSong = usePlayerStore(s => s.currentSong);
  const isPlaying = usePlayerStore(s => s.isPlaying);
  const playSong = usePlayerStore(s => s.playSong);
  const togglePlay = usePlayerStore(s => s.togglePlay);
  const setQueue = usePlayerStore(s => s.setQueue);
  const toggleLike = usePlayerStore(s => s.toggleLike);

  useEffect(() => {
    fetch("/api/songs")
      .then(r => r.json())
      .then(setSongs);
  }, []);

  /* ===== SEARCH ===== */
  const filteredSongs = useMemo(() => {
    if (!searchQuery) return songs;
    return new Fuse(songs, FUSE_OPTIONS).search(searchQuery).map(r => r.item);
  }, [songs, searchQuery]);

  /* ===== TOTAL DURATION ===== */
  const totalDurationString = useMemo(() => {
    let total = 0;
    for (const s of songs) {
      if (!s.duration) continue;
      const [m, sec] = s.duration.split(":").map(Number);
      total += (m || 0) * 60 + (sec || 0);
    }
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    return h > 0 ? `, sekitar ${h} jam ${m} menit` : `, sekitar ${m} menit`;
  }, [songs]);

  const filteredSongsRef = useRef(filteredSongs);
  useEffect(() => {
    filteredSongsRef.current = filteredSongs;
  }, [filteredSongs]);

  const openEditModal = useCallback((song: Song) => {
    setSongToEdit(song);
    setIsEditModalOpen(true);
  }, []);
  const handleSongUpdated = useCallback((updatedSong: Song) => {
    // 1. Update list lagu di halaman
    setSongs(prev =>
      prev.map(song =>
        song.id === updatedSong.id ? { ...song, ...updatedSong } : song
      )
    );

    // 2. Kalau lagu yang sedang diputar itu lagu yang diedit → update player state juga
    const playerState = usePlayerStore.getState();
    if (playerState.currentSong?.id === updatedSong.id) {
      usePlayerStore.setState({
        currentSong: {
          ...playerState.currentSong,
          ...updatedSong
        }
      });
    }

    // 3. Tutup modal edit
    setIsEditModalOpen(false);
    setSongToEdit(null);
  }, []);


  const handleHeaderPlay = useCallback(() => {
    const list = filteredSongsRef.current;
    if (!list.length) return;

    setQueue(list, "SEMUA LAGU");
    const current = usePlayerStore.getState().currentSong;
    if (current && list.some(s => s.id === current.id)) togglePlay();
    else playSong(list[0]);
  }, [playSong, setQueue, togglePlay]);

  const handleResetPlaylist = useCallback(() => {
    setSongs(prev => [...prev].sort((a, b) => a.id - b.id));
  }, []);

  const handleChangeOrder = useCallback(() => {
    setSongs(prev => [...prev].reverse());
  }, []);

  const handleDeleteSong = useCallback(async (id: number) => {
    const ok = window.confirm("Hapus lagu ini beserta file audio dan cover?");
    if (!ok) return;

    try {
      const res = await fetch(`/api/songs/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || "Gagal menghapus lagu");
      }

      setSongs(prev => prev.filter(song => song.id !== id));
      usePlayerStore.setState((state) => {
        const queue = state.queue.filter(song => song.id !== id);
        const originalQueue = state.originalQueue.filter(song => song.id !== id);
        const currentDeleted = state.currentSong?.id === id;

        if (currentDeleted) {
          return {
            queue,
            originalQueue,
            currentSong: null,
            currentIndex: -1,
            isPlaying: false,
            currentTime: 0,
            seekTime: null,
          };
        }

        return {
          queue,
          originalQueue,
          currentIndex: queue.findIndex(song => song.id === state.currentSong?.id),
        };
      });
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Gagal menghapus lagu");
    }
  }, []);

  return (
    <div className="h-screen text-white flex flex-col overflow-hidden bg-black">
      <AddToPlaylistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        songId={selectedSongId}
      />
      <EditSongModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        song={songToEdit}
        onSave={handleSongUpdated}
      />


      <div className="flex-1 overflow-y-auto scrollbar-main bg-gradient-to-b from-indigo-900/40 to-black">
        {/* ===== HEADER LAMA (FINAL) ===== */}
        <div className="h-64 md:h-80 bg-gradient-to-b from-indigo-900 via-purple-900 to-black/20 p-4 md:p-8 flex flex-col md:flex-row items-center md:items-end gap-6 shrink-0">
          <div className="w-32 h-32 md:w-56 md:h-56 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg shadow-2xl flex items-center justify-center flex-shrink-0">
            <svg className="w-12 h-12 md:w-24 md:h-24 text-white opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="2" />
            </svg>
          </div>
          <div className="flex flex-col gap-2 pb-2 text-center md:text-left">
            <span className="text-xs md:text-sm font-semibold uppercase">Playlist</span>
            <h1 className="text-4xl md:text-7xl font-black mb-2">My Playlist</h1>
            <div className="text-zinc-300 text-xs md:text-sm font-semibold opacity-90">
              Stelify Collection • {songs.length} lagu{totalDurationString}
            </div>
          </div>
        </div>

        {/* ===== CONTROLS ===== */}
        <div className="px-6 py-6 flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex gap-4 items-center">
            <button
              onClick={handleHeaderPlay}
              aria-label={isPlaying ? 'Jeda' : 'Putar semua'}
              className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-black"
            >
              {isPlaying ? <Pause fill="black" /> : <Play fill="black" />}
            </button>
            <PlaylistOptionsMenu
              onReset={handleResetPlaylist}
              onChangeOrder={handleChangeOrder}
            />
          </div>

          <div className="relative w-full md:max-w-md">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search songs..."
              aria-label="Cari lagu"
              className="w-full bg-zinc-800 pl-12 pr-4 py-3 rounded-full"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
          </div>
        </div>

        <div
          className="
    hidden md:grid
    grid-cols-[16px_4fr_2fr_2fr_1fr_140px]
    items-center
    gap-4
    px-4
    py-3
    border-b border-white/10
    text-zinc-400 text-xs font-bold
    sticky top-0
    bg-[#121212]/90 backdrop-blur-md
    z-10
  "
        >
          <div className="text-center">#</div>
          <div>TITLE</div>
          <div>ALBUM</div>
          <div>DATE ADDED</div>

          {/* DURATION — RIGHT */}
          <div className="flex justify-end">
            <Clock3 size={14} />
          </div>

          {/* ACTION — RIGHT */}
          <div className="flex justify-end pr-2">
            Action
          </div>
        </div>


        <div className="space-y-1 px-4">
          {filteredSongs.length === 0 ? (
            <div className="py-20 text-center text-zinc-400">
              <p className="text-lg font-semibold text-white">Tidak ada lagu ditemukan</p>
              <p className="text-sm mt-1">{searchQuery ? `Tidak ada hasil untuk "${searchQuery}"` : 'Library kamu masih kosong. Upload lagu untuk memulai.'}</p>
            </div>
          ) : (
            filteredSongs.map((s, i) => (
              <SongListItem
                key={s.id}
                song={s}
                index={i}
                isCurrent={currentSong?.id === s.id}
                isPlaying={isPlaying}
                onPlay={(song) => {
                  setQueue(filteredSongsRef.current, "SEMUA LAGU");
                  playSong(song);
                }}
                onLike={(e, id) => toggleLike(id)}
                onEdit={openEditModal}
                onAddToPlaylist={(id) => {
                  setSelectedSongId(id);
                  setIsModalOpen(true);
                }}
                onDelete={handleDeleteSong}
                lastUserActivityRef={lastUserActivityRef}
              />
            ))
          )}
          <div className="h-40" />
        </div>
      </div>
    </div>
  );
}
