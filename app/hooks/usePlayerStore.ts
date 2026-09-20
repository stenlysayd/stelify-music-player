import { create } from 'zustand';

export interface Song {
  id: number;
  title: string;
  artist: string;
  audioUrl: string;
  coverUrl?: string | null;
  album?: string;
  duration?: string;
  lyrics?: string;
  createdAt?: string | Date;
  isLiked?: boolean;

  playCount?: number;
  genre?: string | null;
  mood?: string | null;
}

export type RepeatMode = 'off' | 'all' | 'one';

interface PlayerState {
  // Data
  queue: Song[];
  originalQueue: Song[];
  queueTitle: string;
  currentSong: Song | null;
  currentIndex: number;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  showLyrics: boolean;
  isQueueOpen: boolean;
  seekTime: number | null;

  // State Mode
  repeatMode: RepeatMode;
  isShuffle: boolean;

  // Actions
  setQueue: (songs: Song[], title?: string) => void;
  playSong: (song: Song) => void;
  playNext: () => void;
  playPrev: () => void;
  togglePlay: () => void;
  setVolume: (vol: number) => void;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (state: boolean) => void;
  toggleLyrics: () => void;
  toggleLike: (id: number) => void;
  toggleQueue: () => void;
  setSeekTime: (time: number | null) => void;

  toggleRepeat: () => void;
  toggleShuffle: () => void;
  
  // ✅ NEW SETTERS FOR AI
  setRepeat: (mode: RepeatMode) => void;
  setShuffle: (state: boolean) => void;

  addToQueue: (song: Song) => void;
  playSongNext: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;

  // --- NEW ACTIONS FOR AI ---
  playPlaylist: (id: number) => Promise<void>;
  playFavorites: () => Promise<void>;

  // ✅ PENTING: Definisi fungsi baru
  playSongById: (id: number) => Promise<void>;
  addSongToQueueById: (id: number) => Promise<void>;
}

const shuffleArray = (array: Song[]) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

export const usePlayerStore = create<PlayerState>((set, get) => ({
  queue: [],
  originalQueue: [],
  queueTitle: "Semua Lagu",
  currentIndex: -1,
  currentSong: null,
  isPlaying: false,
  volume: 0.8,
  currentTime: 0,
  showLyrics: false,
  isQueueOpen: false,
  seekTime: null,

  repeatMode: 'off',
  isShuffle: false,

  setQueue: (songs, title) => set({
    queue: songs,
    originalQueue: songs,
    currentIndex: -1,
    queueTitle: title || "Daftar Lagu"
  }),

  playSong: (song) => {
    const { queue } = get();
    let index = queue.findIndex((s) => s.id === song.id);

    let newQueue = queue;
    if (index === -1) {
      newQueue = [song, ...queue];
      index = 0;
    }

    set({
      queue: newQueue,
      currentSong: song,
      currentIndex: index,
      isPlaying: true,
      currentTime: 0,
    });
  },

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setIsPlaying: (state) => set({ isPlaying: state }),

  playNext: () => {
    const { queue, currentIndex, repeatMode } = get();
    if (queue.length === 0) return;

    if (repeatMode === 'one') {
      set({ seekTime: 0, isPlaying: true });
      return;
    }

    let nextIndex = currentIndex + 1;
    if (nextIndex >= queue.length) {
      if (repeatMode === 'all') {
        nextIndex = 0;
      } else {
        set({ isPlaying: false });
        return;
      }
    }

    set({
      currentIndex: nextIndex,
      currentSong: queue[nextIndex],
      isPlaying: true,
      currentTime: 0,
    });
  },

  playPrev: () => {
    const { queue, currentIndex, currentTime } = get();

    if (currentTime > 3) {
      set({ seekTime: 0 });
      return;
    }

    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) prevIndex = queue.length - 1;

    set({
      currentIndex: prevIndex,
      currentSong: queue[prevIndex],
      isPlaying: true,
      currentTime: 0,
    });
  },

  toggleShuffle: () => {
    const { isShuffle, originalQueue, currentSong } = get();
    const newShuffleState = !isShuffle;

    if (newShuffleState) {
      const shuffled = shuffleArray([...originalQueue]);
      if (currentSong) {
        const songIndex = shuffled.findIndex(s => s.id === currentSong.id);
        if (songIndex !== -1) {
          shuffled.splice(songIndex, 1);
          shuffled.unshift(currentSong);
        }
      }
      set({ isShuffle: true, queue: shuffled, currentIndex: 0 });
    } else {
      const newIndex = originalQueue.findIndex(s => s.id === currentSong?.id);
      set({ isShuffle: false, queue: originalQueue, currentIndex: newIndex !== -1 ? newIndex : 0 });
    }
  },

  // ✅ New Action: Set Shuffle Explicitly
  setShuffle: (state: boolean) => {
    const { isShuffle, originalQueue, currentSong } = get();
    if (state === isShuffle) return; // No change needed

    if (state) {
      // Enable Shuffle
      const shuffled = shuffleArray([...originalQueue]);
      if (currentSong) {
        const songIndex = shuffled.findIndex(s => s.id === currentSong.id);
        if (songIndex !== -1) {
          shuffled.splice(songIndex, 1);
          shuffled.unshift(currentSong);
        }
      }
      set({ isShuffle: true, queue: shuffled, currentIndex: 0 });
    } else {
      // Disable Shuffle
      const newIndex = originalQueue.findIndex(s => s.id === currentSong?.id);
      set({ isShuffle: false, queue: originalQueue, currentIndex: newIndex !== -1 ? newIndex : 0 });
    }
  },

  toggleRepeat: () => set((state) => {
    const modes: RepeatMode[] = ['off', 'all', 'one'];
    const nextIndex = (modes.indexOf(state.repeatMode) + 1) % modes.length;
    return { repeatMode: modes[nextIndex] };
  }),

  // ✅ New Action: Set Repeat Explicitly
  setRepeat: (mode: RepeatMode) => set({ repeatMode: mode }),

  setVolume: (vol) => set({ volume: vol }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setSeekTime: (time) => set({ seekTime: time }),
  toggleLyrics: () => set((state) => ({ showLyrics: !state.showLyrics })),
  toggleQueue: () => set((state) => ({ isQueueOpen: !state.isQueueOpen })),

  toggleLike: async (id) => {
    const { queue, originalQueue, currentSong } = get();
    const targetSong =
      queue.find(s => s.id === id) ||
      originalQueue.find(s => s.id === id) ||
      (currentSong?.id === id ? currentSong : null);
    const newStatus = !targetSong?.isLiked;

    set((state) => ({
      queue: state.queue.map(s => s.id === id ? { ...s, isLiked: newStatus } : s),
      originalQueue: state.originalQueue.map(s => s.id === id ? { ...s, isLiked: newStatus } : s),
      currentSong: state.currentSong?.id === id ? { ...state.currentSong, isLiked: newStatus } : state.currentSong
    }));

    try {
      await fetch(`/api/songs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isLiked: newStatus }),
      });
    } catch (e) { console.error(e); }
  },

  playSongNext: (song) => {
    const { queue, currentIndex } = get();
    const newQueue = [...queue];
    newQueue.splice(currentIndex + 1, 0, song);
    set({ queue: newQueue });
  },

  // ✅ UPDATE: Tambahkan ke KEDUA queue agar UI langsung update tanpa harus ganti lagu
  addToQueue: (song) => set((state) => ({ 
    queue: [...state.queue, song],
    originalQueue: [...state.originalQueue, song] 
  })),

  removeFromQueue: (index) => {
    const { queue, originalQueue, currentIndex } = get();
    if (index === currentIndex || index < 0 || index >= queue.length) return;
    const removedSong = queue[index];
    const newQueue = queue.filter((_, i) => i !== index);
    const newOriginalQueue = originalQueue.filter(s => s.id !== removedSong?.id);
    let newCurrentIndex = currentIndex;
    if (index < currentIndex) newCurrentIndex -= 1;
    set({ queue: newQueue, originalQueue: newOriginalQueue, currentIndex: newCurrentIndex });
  },

  clearQueue: () => {
    const { currentSong } = get();
    if (currentSong) {
      set({ queue: [currentSong], currentIndex: 0 });
    } else {
      set({ queue: [], currentIndex: -1 });
    }
  },

  // ==========================================
  // 🔥🔥🔥 NEW FUNCTIONS (SEJAJAR, JANGAN BERSARANG) 🔥🔥🔥
  // ==========================================

  playPlaylist: async (id: number) => {
    try {
      console.log(`[Store] Fetching playlist ID: ${id}`);
      const res = await fetch(`/api/playlists/${id}`);
      if (!res.ok) throw new Error("Gagal mengambil playlist");

      const data = await res.json();
      const songs = data.songs || [];
      const title = data.name || data.title || "Playlist";

      if (songs.length === 0) {
        console.warn("[Store] Playlist kosong!");
        return;
      }

      set({
        queue: songs,
        originalQueue: songs,
        queueTitle: title,
        currentSong: songs[0],
        currentIndex: 0,
        isPlaying: true,
        currentTime: 0,
        isShuffle: false
      });
      console.log(`[Store] Playing ${songs.length} songs from playlist.`);
    } catch (error) {
      console.error("[Store] Error playing playlist:", error);
    }
  },

  playFavorites: async () => {
    try {
      console.log("[Store] Fetching favorites...");
      const res = await fetch(`/api/favorites`);
      if (!res.ok) throw new Error("Gagal mengambil favorites");
      const songs = await res.json();

      if (songs.length === 0) {
        console.warn("[Store] Favorites kosong!");
        return;
      }

      set({
        queue: songs,
        originalQueue: songs,
        queueTitle: "Lagu Favorit",
        currentSong: songs[0],
        currentIndex: 0,
        isPlaying: true,
        currentTime: 0,
        isShuffle: false
      });
    } catch (error) {
      console.error("[Store] Error playing favorites:", error);
    }
  },

  // ✅ FUNGSI PLAY ID (ASYNC FETCH)
  playSongById: async (id: number) => {
    const { originalQueue } = get();

    // 1. Coba cari di memori lokal dulu
    let song = originalQueue.find(s => s.id === id);

    // 2. Kalau GAK ADA, ambil dari API (Database)
    if (!song) {
      try {
        console.log(`[Store] Lagu ${id} tidak ada di queue, mengambil dari server...`);
        const res = await fetch(`/api/songs/${id}`);
        if (res.ok) {
          song = await res.json();
        }
      } catch (e) {
        console.error("[Store] Gagal fetch lagu:", e);
      }
    }

    // 3. Mainkan kalau ketemu
    if (song) {
      get().playSong(song);
      console.log(`[Store] Memainkan lagu: ${song.title}`);
    } else {
      console.error(`[Store] Lagu ID ${id} benar-benar tidak ditemukan.`);
    }
  },

  // ✅ FITUR BATCH SMART QUEUE
  addSongToQueueById: async (id: number) => {
    const { originalQueue } = get();

    // 1. Cek apakah lagu ada di memori lokal?
    let song = originalQueue.find(s => s.id === id);

    // 2. Kalau GAK ADA, ambil dari Server (Database)
    if (!song) {
      try {
        console.log(`[Store] Lagu ID ${id} tidak ada di RAM. Fetching server...`);
        const res = await fetch(`/api/songs/${id}`);
        if (res.ok) {
          song = await res.json();
        }
      } catch (e) {
        console.error("[Store] Gagal fetch lagu untuk antrean:", e);
      }
    }

    // 3. Masukkan ke Antrean
    if (song) {
      get().addToQueue(song); // Panggil fungsi addToQueue yang sudah ada
      console.log(`[Store] Berhasil antrekan: ${song.title}`);
    } else {
      console.error(`[Store] Lagu ID ${id} gagal ditemukan di Database.`);
    }
  }

}));