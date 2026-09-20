import { Song } from '@/app/hooks/usePlayerStore';

export interface AIResponse {
  reply: string;
  intent: string;
  payload?: {
    mood?: string;
    id?: number;
    ids?: number[];
    volume?: number;
    level?: number;
    action?: string;
    keyword?: string;
    playlistName?: string;
    atmosphere?: string;
    // ✅ NEW COMPOSITE FLAGS
    shuffle?: boolean;
    repeat?: 'one' | 'all' | 'off';
    view?: 'lyrics' | 'queue';
  };
}

export interface PlayerController {
  currentSong?: Song | null;
  showLyrics?: boolean;
  isQueueOpen?: boolean;
  isShuffle?: boolean;
  setShuffle?: (state: boolean) => void;
  setRepeat?: (mode: 'one' | 'all' | 'off') => void;
  toggleLyrics?: () => void;
  toggleQueue?: () => void;
  playPause?: () => void;
  togglePlay?: () => void;
  playNext?: () => void;
  playPrev?: () => void;
  setIsPlaying?: (state: boolean) => void;
  toggleShuffle?: () => void;
  toggleRepeat?: () => void;
  playFavorites?: () => void;
  playSongById?: (id: number) => void;
  addSongToQueueById?: (id: number) => void;
  setVolume?: (volume: number) => void;
  playPlaylist?: (id: number) => void;
  toggleLike?: (id: number) => void;
  setQueue?: (songs: Song[], title?: string) => void;
  playSong?: (song: Song) => void;
}

// ✅ Tambahkan parameter fullLibrary
export const handleAIIntent = (
  response: AIResponse,
  player: PlayerController,
  refreshLibrary?: () => void,
  fullLibrary: Song[] = [] // Default array kosong
) => {
  const { intent, payload } = response;

  console.log(`[AI-ROOM] Intent: ${intent}`, payload);

  // --- HELPER: HANDLE COMPOSITE FLAGS (Shuffle/Repeat/View) ---
  const handleCompositeFlags = () => {
    // 1. Handle Shuffle Flag
    if (payload?.shuffle === true) {
      if (player.setShuffle) player.setShuffle(true);
    } else if (payload?.shuffle === false) {
      if (player.setShuffle) player.setShuffle(false);
    }

    // 2. Handle Repeat Flag
    if (payload?.repeat) {
      if (player.setRepeat) player.setRepeat(payload.repeat);
    }

    // 3. Handle View/UI Flag
    if (payload?.view === 'lyrics') {
      // Cek kondisi agar tidak menutup lirik yang sudah terbuka
      if (player.showLyrics === false && player.toggleLyrics) player.toggleLyrics();
      else if (player.showLyrics === undefined && player.toggleLyrics) player.toggleLyrics();
    } else if (payload?.view === 'queue') {
      if (player.isQueueOpen === false && player.toggleQueue) player.toggleQueue();
      else if (player.isQueueOpen === undefined && player.toggleQueue) player.toggleQueue();
    }
  };

  try {
    switch (intent) {
      // --- BASIC CONTROLS ---
      case 'PLAYPAUSE':
        if (player.playPause) player.playPause();
        else if (player.togglePlay) player.togglePlay();
        break;

      case 'NEXT':
        if (player.playNext) player.playNext();
        break;

      case 'PREVIOUS':
        if (player.playPrev) player.playPrev();
        break;

      // --- SHUFFLE & REPEAT (SPECIFIC) ---
      case 'SHUFFLE':
        if (player.setShuffle) player.setShuffle(true);
        else if (player.toggleShuffle && !player.isShuffle) player.toggleShuffle();
        break;

      case 'SHUFFLE_OFF':
        if (player.setShuffle) player.setShuffle(false);
        else if (player.toggleShuffle && player.isShuffle) player.toggleShuffle();
        break;

      case 'REPEAT_ONE':
        if (player.setRepeat) player.setRepeat('one');
        else if (player.toggleRepeat) player.toggleRepeat();
        break;

      case 'REPEAT_ALL':
        if (player.setRepeat) player.setRepeat('all');
        else if (player.toggleRepeat) player.toggleRepeat();
        break;

      case 'REPEAT_OFF':
        if (player.setRepeat) player.setRepeat('off');
        else if (player.toggleRepeat) player.toggleRepeat();
        break;

      case 'PLAY_FAVORITES':
        if (player.playFavorites) player.playFavorites();
        break;

      // --- GOD MODE ACTIONS ---

      case 'PLAY_ID':
        if (payload?.id && player.playSongById) {
          player.playSongById(payload.id);
          // Bisa apply flag juga di sini jika mau
          setTimeout(() => handleCompositeFlags(), 500);
        }
        break;

      case 'QUEUE_ADD':
        if (payload?.ids && Array.isArray(payload.ids)) {
          console.log(`📚 Batch Queue: ${payload.ids.length}`);
          payload.ids.forEach((id) => {
            if (player.addSongToQueueById) player.addSongToQueueById(id);
          });
        }
        else if (payload?.id && player.addSongToQueueById) {
          player.addSongToQueueById(payload.id);
        }
        break;

      case 'SET_VOLUME':
        // ✅ FIX: Cek 'volume' ATAU 'level' karena AI kadang kirim 'level'
        const targetVol = payload?.volume ?? payload?.level;

        if (targetVol !== undefined && player.setVolume) {
          console.log(`🔊 Mengubah Volume ke: ${targetVol}%`);
          // Player butuh rentang 0.0 - 1.0, AI kirim 0 - 100
          player.setVolume(targetVol / 100);
        }
        break;

      case 'CONTROL':
      case 'CONTROLS':   // Jaga-jaga AI typo pake 'S'
      case 'UI_CONTROL': // Jaga-jaga AI pake nama lama
        // 🔀 Shuffle
        if (payload?.action === 'shuffle_on') {
          if (player.setShuffle) player.setShuffle(true);
          else if (player.toggleShuffle && !player.isShuffle) player.toggleShuffle();
        }

        if (payload?.action === 'shuffle_off') {
          if (player.setShuffle) player.setShuffle(false);
          else if (player.toggleShuffle && player.isShuffle) player.toggleShuffle();
        }

        // 🔁 Repeat
        if (payload?.action === 'repeat_all') {
          if (player.setRepeat) player.setRepeat('all');
        }
        if (payload?.action === 'repeat_one') {
          if (player.setRepeat) player.setRepeat('one');
        }
        if (payload?.action === 'repeat_off') {
          if (player.setRepeat) player.setRepeat('off');
        }

        // Playback Actions
        if (payload?.action === 'next') player.playNext?.();
        if (payload?.action === 'prev') player.playPrev?.();
        if (payload?.action === 'pause') player.setIsPlaying?.(false);
        if (payload?.action === 'resume') player.setIsPlaying?.(true);

        // UI Actions (Queue & Lyrics)
        if (payload?.action === 'open_queue' || payload?.action === 'queue') {
          if (player.isQueueOpen === false && player.toggleQueue) player.toggleQueue();
          else if (player.isQueueOpen === undefined && player.toggleQueue) player.toggleQueue();
        }
        if (payload?.action === 'close_queue') {
          if (player.isQueueOpen === true && player.toggleQueue) player.toggleQueue();
        }

        if (payload?.action === 'open_lyrics' || payload?.action === 'lyrics') {
          if (player.showLyrics === false && player.toggleLyrics) player.toggleLyrics();
          else if (player.showLyrics === undefined && player.toggleLyrics) player.toggleLyrics();
        }
        if (payload?.action === 'close_lyrics') {
          if (player.showLyrics === true && player.toggleLyrics) player.toggleLyrics();
        }

        // Like / Favorite Action
        if (payload?.action === 'like' || payload?.action === 'unlike') {
          if (player.currentSong && player.toggleLike) player.toggleLike(player.currentSong.id);
        }
        break;

      case 'PLAY_PLAYLIST':
        if (payload?.id && player.playPlaylist) {
          console.log(`📂 Memutar Playlist ID: ${payload.id} (Composite Mode)`);
          player.playPlaylist(payload.id);

          // ✅ DELAY EXECUTION: Tunggu playlist loading baru apply shuffle/etc
          setTimeout(() => handleCompositeFlags(), 500);
        }
        break;

      case 'LIKE':
        if (player.currentSong && player.toggleLike) player.toggleLike(player.currentSong.id);
        break;

      case 'PLAY_BATCH':
        if (payload?.ids && Array.isArray(payload.ids) && fullLibrary.length > 0) {
          console.log(`⚡ Batch Play: ${payload.ids.length} songs`);

          // 1. Filter lagu dari Full Library berdasarkan ID yang dikirim AI
          const selectedSongs = fullLibrary.filter(s => payload.ids?.includes(s.id));

          if (selectedSongs.length > 0) {
            // 2. Replace Queue & Play (Jika store mendukung)
            if (player.setQueue && player.playSong) {
              player.setQueue(selectedSongs, "Smart Search Result");
              player.playSong(selectedSongs[0]);

              // ✅ DELAY EXECUTION: Tunggu queue set baru apply shuffle/etc
              setTimeout(() => handleCompositeFlags(), 500);
            }
          } else {
            console.warn("Lagu batch tidak ditemukan di library lokal.");
          }
        }
        break;

      // ✅ REFRESH DATA
      case 'REFRESH_LIBRARY':
        console.log("🔄 Database berubah, me-refresh library...");
        if (refreshLibrary) {
          refreshLibrary();
        }
        break;

      default:
        break;
    }
  } catch (err) {
    console.error("GAGAL EKSEKUSI INTENT:", err);
  }
};
