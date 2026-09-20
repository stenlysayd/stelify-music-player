"use client";

import React, { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import AudioPlayer, { RHAP_UI } from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";
import {
  Volume2,
  Mic2,
  Heart,
  ListMusic,
  VolumeX,
  Shuffle,
  Repeat,
  Repeat1,
  ChevronDown,
  MoreHorizontal,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ListPlus,
  Edit3,
  X,
  PictureInPicture2
} from "lucide-react";
import { usePlayerStore } from "../hooks/usePlayerStore";
import LyricsView from "./LyricsView";
import AddToPlaylistModal from "./AddToPlaylistModal";
import EditSongModal from "./EditSongModal";

// Import komponen Mini Player
import MiniPlayerContent from "./MiniPlayerContent";

import { usePathname } from "next/navigation"; // ✅ Import pathname

type RangeStyle = React.CSSProperties & { "--value": string };

interface DocumentPictureInPictureController {
  requestWindow(options?: { width?: number; height?: number }): Promise<Window>;
}

declare global {
  interface Window {
    documentPictureInPicture?: DocumentPictureInPictureController;
  }
}

export default function GlobalPlayer() {
  const pathname = usePathname(); // ✅ Cek URL
  const isWaifuPage = pathname === '/waifu'; // ✅ Hanya sembunyikan player di halaman waifu yang punya player sendiri
  const playerRef = useRef<AudioPlayer>(null);
  const lastVolumeRef = useRef<number>(0.8);
  const mobileContainerRef = useRef<HTMLDivElement>(null);

  // --- REFS UNTUK MOBILE PIP ---
  const pipVideoRef = useRef<HTMLVideoElement>(null);
  const pipCanvasRef = useRef<HTMLCanvasElement>(null);

  // --- STATE UNTUK DESKTOP DOCUMENT PIP ---
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const [isMobileFull, setIsMobileFull] = useState(false);
  const [bgColor, setBgColor] = useState("#121212");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAddToPlaylistOpen, setIsAddToPlaylistOpen] = useState(false);
  const [isEditSongOpen, setIsEditSongOpen] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  const {
    currentSong,
    isPlaying,
    volume,
    showLyrics,
    isQueueOpen,
    seekTime,
    repeatMode,
    isShuffle,
    queueTitle,
    queue,
    currentIndex,
    toggleLyrics,
    toggleLike,
    toggleQueue,
    setSeekTime,
    setIsPlaying,
    playNext,
    playPrev,
    setCurrentTime,
    setVolume,
    toggleRepeat,
    toggleShuffle,
    togglePlay
  } = usePlayerStore();

  useEffect(() => {
    // Desktop only
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;

    if (currentSong && isDesktop) {
      document.documentElement.style.setProperty(
        "--global-player-height",
        "96px" // tinggi player desktop lu
      );
    } else {
      document.documentElement.style.setProperty(
        "--global-player-height",
        "0px"
      );
    }

    return () => {
      document.documentElement.style.setProperty(
        "--global-player-height",
        "0px"
      );
    };
  }, [currentSong]);


  useEffect(() => {
    setIsMobileDevice(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  // 1. KEYBOARD SHORTCUTS
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA"].includes(target.tagName) || target.isContentEditable) return;

      const state = usePlayerStore.getState();

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          state.togglePlay();
          break;
        case 'ArrowRight':
          state.playNext();
          break;
        case 'ArrowLeft':
          state.playPrev();
          break;
        case 'ArrowUp':
          e.preventDefault();
          // Safety check for NaN
          state.setVolume(Math.min((state.volume || 0) + 0.05, 1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          // Safety check for NaN
          state.setVolume(Math.max((state.volume || 0) - 0.05, 0));
          break;
        case 'KeyM':
          if (state.volume > 0) {
            lastVolumeRef.current = state.volume;
            state.setVolume(0);
          } else {
            state.setVolume(lastVolumeRef.current || 0.8);
          }
          break;
        case 'KeyS': state.toggleShuffle(); break;
        case 'KeyR': state.toggleRepeat(); break;
        case 'KeyF': if (state.currentSong) state.toggleLike(state.currentSong.id); break;
        case 'KeyL': state.toggleLyrics(); break;
        case 'KeyQ': state.toggleQueue(); break;
        case 'KeyP': handleTogglePiP(); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pipWindow, isMobileDevice]);

  // 2. SYNC PLAYER STATE
  useEffect(() => {
    const audio = playerRef.current?.audio.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(e => console.log("Autoplay blocked:", e));
      if (pipVideoRef.current && !pipVideoRef.current.ended) pipVideoRef.current.play().catch(() => { });
    } else {
      audio.pause();
      if (pipVideoRef.current) pipVideoRef.current.pause();
    }
  }, [isPlaying]);

  // --- PERBAIKAN ERROR VOLUME ---
  useEffect(() => {
    const audio = playerRef.current?.audio.current;
    // Cek apakah volume adalah angka valid (finite) sebelum di-set
    if (audio && typeof volume === 'number' && Number.isFinite(volume)) {
      // Pastikan nilai diantara 0 dan 1 untuk mencegah error range
      audio.volume = Math.min(Math.max(volume, 0), 1);
    }
  }, [volume]);
  // ------------------------------

  useEffect(() => {
    const audio = playerRef.current?.audio.current;
    if (audio && seekTime !== null) {
      audio.currentTime = seekTime;
      setSeekTime(null);
      if (!isPlaying) setIsPlaying(true);
    }
  }, [seekTime]);

  // 3. MEDIA SESSION API
  useEffect(() => {
    if (!currentSong || !("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentSong.title,
      artist: currentSong.artist,
      album: currentSong.album || "Stelify Music",
      artwork: currentSong.coverUrl ? [{ src: currentSong.coverUrl, sizes: "512x512", type: "image/jpeg" }] : [],
    });
    navigator.mediaSession.setActionHandler("play", () => setIsPlaying(true));
    navigator.mediaSession.setActionHandler("pause", () => setIsPlaying(false));
    navigator.mediaSession.setActionHandler("previoustrack", playPrev);
    navigator.mediaSession.setActionHandler("nexttrack", playNext);
    navigator.mediaSession.setActionHandler("seekto", (d) => { if (d.seekTime) setSeekTime(d.seekTime); });
  }, [currentSong, setIsPlaying, playPrev, playNext, setSeekTime]);

  // 4. LOGIKA PIP MOBILE (CANVAS HACK)
  useEffect(() => {
    if (!currentSong || !pipCanvasRef.current || !pipVideoRef.current || !isMobileDevice) return;
    const ctx = pipCanvasRef.current.getContext('2d');
    if (!ctx) return;
    pipCanvasRef.current.width = 512;
    pipCanvasRef.current.height = 512;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = currentSong.coverUrl || "/placeholder.png";
    img.onload = () => {
      ctx.drawImage(img, 0, 0, 512, 512);
    };
    if (pipVideoRef.current.srcObject === null) {
      const stream = pipCanvasRef.current.captureStream(0);
      pipVideoRef.current.srcObject = stream;
      pipVideoRef.current.muted = true;
    }
    if (isPlaying) pipVideoRef.current.play().catch(() => { });
  }, [currentSong, isMobileDevice]);

  // =========================================================================
  // FITUR BARU 2: HANDLE SONG ENDED (ANALITIK)
  // Fungsi ini menggantikan playNext() langsung di onEnded
  // =========================================================================
  const handleSongEnded = async () => {
    // 1. Kirim laporan ke database (Play Count & History)
    if (currentSong) {
      // Kita gunakan fetch tanpa await agar UI tidak menunggu response (fire and forget)
      fetch("/api/analytics/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId: currentSong.id }),
      }).catch(err => console.error("Gagal mencatat history:", err));
    }

    // 2. Lanjut ke lagu berikutnya (Fungsi asli)
    playNext();
  };

  // 6. FUNGSI TOGGLE PIP
  const handleTogglePiP = async () => {
    // A. Strategi Mobile
    if (isMobileDevice) {
      if (!pipVideoRef.current) return;
      try {
        if (document.pictureInPictureElement) await document.exitPictureInPicture();
        else {
          await pipVideoRef.current.play();
          await pipVideoRef.current.requestPictureInPicture();
        }
      } catch { console.warn("PiP tidak didukung browser ini."); }
      return;
    }

    // B. Strategi Desktop (Document PiP)
    if (!window.documentPictureInPicture) {
      console.warn("Gunakan Chrome/Edge terbaru untuk fitur ini.");
      return;
    }

    if (pipWindow) {
      pipWindow.close();
      setPipWindow(null);
    } else {
      try {
        const newPipWindow = await window.documentPictureInPicture.requestWindow({
          width: 350, height: 350,
        });

        // Copy Styles (Tailwind)
        const allStyles = document.head.querySelectorAll('style, link[rel="stylesheet"]');
        allStyles.forEach((style) => {
          newPipWindow.document.head.appendChild(style.cloneNode(true));
        });

        newPipWindow.document.body.className = "bg-black text-white overflow-hidden";
        newPipWindow.document.body.style.height = "100vh";
        newPipWindow.document.body.style.margin = "0";

        newPipWindow.addEventListener("pagehide", () => setPipWindow(null));
        setPipWindow(newPipWindow);
      } catch (err) { console.error(err); }
    }
  };

  useEffect(() => { setBgColor("#121212"); }, [currentSong?.id]);
  useEffect(() => {
    if (!isMobileFull) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileFull(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isMobileFull]);

  useEffect(() => { if (mobileContainerRef.current) mobileContainerRef.current.scrollTo({ top: 0, behavior: 'instant' }); }, [currentSong?.id]);

  if (!currentSong) return null;

  const duration = playerRef.current?.audio.current?.duration || 0;
  const currentTimeUI = usePlayerStore.getState().currentTime;

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? "0" + sec : sec}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    const audio = playerRef.current?.audio.current;
    if (audio) { audio.currentTime = val; setCurrentTime(val); }
  };

  const updateBackgroundFromImage = (image: HTMLImageElement) => {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      canvas.width = 1;
      canvas.height = 1;
      ctx.drawImage(image, 0, 0, 1, 1);
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
      // Clamp luminance to max 30% to prevent white-on-white text
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      const factor = luminance > 0.3 ? 0.3 / luminance : 1;
      const cr = Math.round(r * factor);
      const cg = Math.round(g * factor);
      const cb = Math.round(b * factor);
      setBgColor(`rgb(${cr}, ${cg}, ${cb})`);
    } catch {
      setBgColor("#121212");
    }
  };

  const handleMenuOption = (action: 'queue' | 'playlist' | 'edit') => {
    setIsMobileMenuOpen(false);
    switch (action) {
      case 'queue': toggleQueue(); setIsMobileFull(false); break;
      case 'playlist': setIsAddToPlaylistOpen(true); break;
      case 'edit': setIsEditSongOpen(true); break;
    }
  };

  // Safe volume for display (prevents NaN in range input)
  const displayVolume = Number.isFinite(volume) ? volume : 0.8;

  return (
    <>
      {/* --- RENDER MINI PLAYER KE JENDELA BARU (PORTAL) --- */}
      {pipWindow && createPortal(
        <MiniPlayerContent
          currentSong={currentSong}
          isPlaying={isPlaying}
          isShuffle={isShuffle}
          repeatMode={repeatMode}
          currentTime={currentTimeUI}
          duration={duration}
          toggleShuffle={toggleShuffle}
          playPrev={playPrev}
          togglePlay={togglePlay}
          playNext={playNext}
          toggleRepeat={toggleRepeat}
          toggleLike={toggleLike}
          onClosePip={() => { pipWindow.close(); setPipWindow(null); }}
          handleSeek={handleSeek}
          formatTime={formatTime}
        />,
        pipWindow.document.body
      )}

      {/* --- ELEMENT TERSEMBUNYI UNTUK MOBILE PIP --- */}
      <div className="hidden">
        <canvas ref={pipCanvasRef} />
        <video ref={pipVideoRef} muted playsInline />
      </div>

      <AddToPlaylistModal isOpen={isAddToPlaylistOpen} onClose={() => setIsAddToPlaylistOpen(false)} songId={currentSong.id} />
      <EditSongModal
        isOpen={isEditSongOpen}
        onClose={() => setIsEditSongOpen(false)}
        song={currentSong}
        onSave={(updatedSong) => {
          usePlayerStore.setState((state) => ({
            currentSong: state.currentSong?.id === updatedSong.id ? { ...state.currentSong, ...updatedSong } : state.currentSong,
            queue: state.queue.map((s) => (s.id === updatedSong.id ? { ...s, ...updatedSong } : s)),
            originalQueue: state.originalQueue.map((s) => (s.id === updatedSong.id ? { ...s, ...updatedSong } : s)),
          }));
        }}
      />

      {/* --- DESKTOP PLAYER --- */}
      <div className={`${isWaifuPage ? 'hidden' : 'hidden md:block'} fixed bottom-0 left-0 right-0 bg-black/95 border-t border-zinc-900 backdrop-blur-xl z-50 pb-safe`}>
        <div className="grid grid-cols-3 items-center px-4 py-3 max-w-screen-2xl mx-auto">
          {/* Kiri: Info Lagu */}
          <div className="flex items-center gap-4 min-w-0 overflow-hidden pr-2">
            {currentSong.coverUrl ? <img src={currentSong.coverUrl} alt={currentSong.title + ' - Album cover'} className="w-14 h-14 object-cover rounded shadow-lg flex-shrink-0" /> : <div className="w-14 h-14 bg-zinc-800 rounded"></div>}
            <div className="min-w-0 flex-1">
              <p className="font-normal text-sm text-white truncate cursor-pointer hover:underline">{currentSong.title}</p>
              <p className="text-xs text-zinc-400 truncate cursor-pointer hover:underline">{currentSong.artist}</p>
            </div>
            <button
              onClick={() => toggleLike(currentSong.id)}
              title="Sukai (F)"
              aria-label={currentSong.isLiked ? 'Hapus dari favorit' : 'Tambah ke favorit'}
              aria-pressed={currentSong.isLiked}
              className={`transition p-1 rounded-full hover:bg-white/10 ${currentSong.isLiked ? "text-green-500" : "text-zinc-400 hover:text-white"}`}
            >
              <Heart size={18} className={currentSong.isLiked ? "fill-green-500" : ""} />
            </button>
          </div>

          {/* Tengah: Player Controls */}
          <div className="flex flex-col items-center w-full custom-audio-player-wrapper">
            <AudioPlayer
              ref={playerRef}
              src={currentSong.audioUrl}
              autoPlay={true}
              autoPlayAfterSrcChange={true}
              loop={repeatMode === 'one'}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}

              // --- GUNAKAN HANDLER BARU ---
              onEnded={handleSongEnded}
              // ----------------------------

              onListen={(e) => {
                const target = e.target as HTMLAudioElement;
                if (target) setCurrentTime(target.currentTime);
              }}
              onClickNext={playNext}
              onClickPrevious={playPrev}
              showSkipControls={true}
              showJumpControls={false}
              layout="horizontal"
              customControlsSection={[
                <button key="s" onClick={toggleShuffle} className={`mx-3 transition ${isShuffle ? "text-green-500" : "text-zinc-400 hover:text-white"}`} title="Shuffle (S)" aria-label="Acak" aria-pressed={isShuffle}>
                  <Shuffle size={20} />
                </button>,
                RHAP_UI.MAIN_CONTROLS,
                <button key="r" onClick={toggleRepeat} className={`mx-3 transition ${repeatMode !== 'off' ? "text-green-500" : "text-zinc-400 hover:text-white"}`} title="Repeat (R)" aria-label={repeatMode === 'one' ? 'Ulangi satu' : repeatMode === 'all' ? 'Ulangi semua' : 'Ulangi'} aria-pressed={repeatMode !== 'off'}>
                  {repeatMode === 'one' ? <Repeat1 size={20} /> : <Repeat size={20} />}
                </button>
              ]}
              customProgressBarSection={[RHAP_UI.CURRENT_TIME, RHAP_UI.PROGRESS_BAR, RHAP_UI.DURATION]}
              customAdditionalControls={[]}
              customVolumeControls={[]}
              className="spotify-player-minimal"
            />
          </div>

          {/* Kanan: Extra Controls */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={handleTogglePiP}
              title="Mini Player (P)"
              aria-label="Mini Player"
              aria-pressed={!!pipWindow}
              className={`p-2 rounded-full transition-all ${pipWindow ? 'text-green-500 bg-white/10' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
            >
              <PictureInPicture2 size={20} />
            </button>
            <button onClick={toggleLyrics} title="Lirik (L)" aria-label="Lirik" aria-pressed={showLyrics} className={`p-2 rounded-full transition-all ${showLyrics ? 'text-green-500 bg-white/10' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}><Mic2 size={20} /></button>
            <button onClick={toggleQueue} title="Antrean (Q)" aria-label="Antrean" aria-pressed={isQueueOpen} className={`p-2 rounded-full transition-all ${isQueueOpen ? 'text-green-500 bg-white/10' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}><ListMusic size={20} /></button>
            <div className="flex items-center gap-2 w-24 group ml-2">
              <button onClick={() => setVolume(displayVolume > 0 ? 0 : (lastVolumeRef.current || 0.8))} title="Mute (M)" aria-label={displayVolume === 0 ? 'Bunyikan' : 'Bisukan'}>{displayVolume === 0 ? <VolumeX size={18} className="text-red-500" /> : <Volume2 size={18} className="text-zinc-400 group-hover:text-white transition" />}</button>
              <input
                type="range" min="0" max="1" step="0.01" value={displayVolume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                title="Volume (Arrow Up/Down)"
                aria-label="Volume"
                style={{ "--value": `${displayVolume * 100}%` } as RangeStyle}
                className="w-full h-1 bg-zinc-600 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* --- MOBILE MINI PLAYER --- */}
      <div
        className={`md:hidden fixed bottom-16 left-2 right-2 bg-[#282828] border-b border-zinc-800 rounded-lg p-2 flex items-center justify-between shadow-xl z-40 transition-transform duration-300 ${isMobileFull ? 'translate-y-[200%]' : 'translate-y-0'}`}
        onClick={() => setIsMobileFull(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsMobileFull(true); } }}
        aria-label={`Buka player: ${currentSong.title}`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {currentSong.coverUrl ? <img src={currentSong.coverUrl} alt={currentSong.title + ' cover'} className="w-10 h-10 rounded-md object-cover rounded-full animate-spin-slow motion-reduce:animate-none" /> : <div className="w-10 h-10 bg-zinc-800 rounded-md"></div>}
          <div className="flex flex-col overflow-hidden">
            <span className="text-white text-sm font-bold truncate">{currentSong.title}</span>
            <span className="text-zinc-400 text-xs truncate">{currentSong.artist}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 pr-2">
          <button onClick={(e) => { e.stopPropagation(); handleTogglePiP(); }} className="text-zinc-400 p-2">
            <PictureInPicture2 size={20} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="text-white p-1">
            {isPlaying ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" />}
          </button>
        </div>
        <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${(currentTimeUI / (duration || 1)) * 100}%` }} />
        </div>
      </div>

      {/* --- MOBILE FULL SCREEN PLAYER --- */}
      <div
        ref={mobileContainerRef}
        style={{ background: `linear-gradient(to bottom, ${bgColor} 0%, #000000 80%)` }}
        className={`md:hidden fixed inset-0 z-[60] flex flex-col transition-transform duration-300 ease-in-out overflow-y-auto ${isMobileFull ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="flex items-center justify-between p-6 pt-12 sticky top-0 z-10">
          <button onClick={() => setIsMobileFull(false)} className="text-white"><ChevronDown size={28} /></button>
          <div className="flex flex-col items-center text-center">
            <span className="text-xs font-bold tracking-widest text-zinc-400 uppercase">MEMAINKAN DARI PLAYLIST</span>
            <span className="text-xs font-bold text-white truncate max-w-[200px] mt-1">{queueTitle}</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-white"><MoreHorizontal size={24} /></button>
        </div>

        <div className="flex-1 px-8 pb-10 flex flex-col">
          <div className={`w-full aspect-square bg-zinc-800/50 rounded-xl shadow-2xl mb-8 overflow-hidden relative flex-shrink-0 ${showLyrics ? 'hidden' : 'block'}`}>
            {currentSong.coverUrl ? (
              <img src={currentSong.coverUrl} alt={currentSong.title + ' album art'} onLoad={(event) => updateBackgroundFromImage(event.currentTarget)} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-600"><Mic2 size={64} /></div>
            )}
            <button onClick={(e) => { e.stopPropagation(); handleTogglePiP(); }} className="absolute top-4 right-4 bg-black/50 p-2 rounded-full backdrop-blur-md text-white border border-white/10">
              <PictureInPicture2 size={20} className="text-white" />
            </button>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div className="overflow-hidden">
              <h2 className="text-2xl font-bold text-white truncate">{currentSong.title}</h2>
              <p className="text-lg text-zinc-300/80 truncate">{currentSong.artist}</p>
            </div>
            <button onClick={() => toggleLike(currentSong.id)} className={`${currentSong.isLiked ? "text-green-500" : "text-zinc-400"}`}>
              <Heart size={28} className={currentSong.isLiked ? "fill-green-500" : ""} />
            </button>
          </div>

          <div className="mb-6 group">
            <input type="range" min={0} max={duration || 0} value={currentTimeUI} onChange={handleSeek} style={{ "--value": `${(currentTimeUI / (duration || 1)) * 100}%` } as RangeStyle} className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-white hover:h-2 transition-all" />
            <div className="flex justify-between text-xs text-zinc-400 mt-2 font-medium"><span>{formatTime(currentTimeUI)}</span><span>{formatTime(duration)}</span></div>
          </div>

          <div className="flex items-center justify-between mb-10">
            <button onClick={toggleShuffle} className={`${isShuffle ? "text-green-500" : "text-zinc-300"}`}><Shuffle size={24} /></button>
            <button onClick={playPrev} className="text-white hover:scale-110 transition"><SkipBack size={36} fill="white" /></button>
            <button onClick={togglePlay} className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 transition shadow-lg">
              {isPlaying ? <Pause size={32} fill="black" /> : <Play size={32} fill="black" className="ml-1" />}
            </button>
            <button onClick={playNext} className="text-white hover:scale-110 transition"><SkipForward size={36} fill="white" /></button>
            <button onClick={toggleRepeat} className={`${repeatMode !== 'off' ? "text-green-500" : "text-zinc-300"}`}>
              {repeatMode === 'one' ? <Repeat1 size={24} /> : <Repeat size={24} />}
            </button>
          </div>
          <div style={{ backgroundColor: `${bgColor}40` }} className="rounded-2xl p-4 mt-auto min-h-[300px] flex flex-col backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4"><h3 className="text-white font-bold text-lg">Lyrics</h3><button onClick={toggleLyrics} className="bg-white/20 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{showLyrics ? 'Hide' : 'Show'}</button></div>
            {showLyrics && <LyricsView key={currentSong.id} lrc={currentSong.lyrics} onSeek={setSeekTime} className="h-[300px]" />}
          </div>
        </div>
      </div>

      {/* MOBILE MENU */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-[#181818] rounded-t-3xl p-6 pb-10 animate-in slide-in-from-bottom duration-300 flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-4 mb-6 border-b border-zinc-800 pb-4">
              {currentSong.coverUrl && <img src={currentSong.coverUrl} alt={currentSong.title} className="w-12 h-12 rounded-md shadow" />}
              <div><p className="text-white font-bold truncate">{currentSong.title}</p><p className="text-zinc-400 text-sm truncate">{currentSong.artist}</p></div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="ml-auto text-zinc-400 p-2"><X size={24} /></button>
            </div>
            <button onClick={handleTogglePiP} className="flex items-center gap-4 w-full p-3 hover:bg-zinc-800 rounded-lg transition text-left text-white font-medium"><PictureInPicture2 size={24} className="text-zinc-400" /> Toggle Mini Player</button>
            <button onClick={() => handleMenuOption('queue')} className="flex items-center gap-4 w-full p-3 hover:bg-zinc-800 rounded-lg transition text-left text-white font-medium"><ListMusic size={24} className="text-zinc-400" /> Tampilkan Queue</button>
            <button onClick={() => handleMenuOption('playlist')} className="flex items-center gap-4 w-full p-3 hover:bg-zinc-800 rounded-lg transition text-left text-white font-medium"><ListPlus size={24} className="text-zinc-400" /> Add to Playlist</button>
            <button onClick={() => handleMenuOption('edit')} className="flex items-center gap-4 w-full p-3 hover:bg-zinc-800 rounded-lg transition text-left text-white font-medium"><Edit3 size={24} className="text-zinc-400" /> Edit Info</button>
          </div>
        </div>
      )}

      <style jsx global>{`
        .spotify-player-minimal.rhap_container { background: transparent !important; box-shadow: none !important; padding: 0 !important; width: 100%; }
        .spotify-player-minimal .rhap_main { display: flex !important; flex-direction: column-reverse !important; gap: 5px; }
        .spotify-player-minimal .rhap_controls-section { display: flex; justify-content: center; align-items: center; flex: 0 0 auto; margin-bottom: 4px; }
        .spotify-player-minimal .rhap_progress-section { display: flex; align-items: center; gap: 8px; width: 100%; }
        .spotify-player-minimal .rhap_time { color: #a7a7a7 !important; font-size: 12px; min-width: 40px; font-weight: 400; }
        .spotify-player-minimal .rhap_progress-container { flex: 1; height: 4px; cursor: pointer; }
        .spotify-player-minimal .rhap_progress-bar { background-color: #4d4d4d !important; height: 4px; border-radius: 2px; }
        .spotify-player-minimal .rhap_progress-filled { background-color: #1db954 !important; height: 4px; border-radius: 2px; }
        .spotify-player-minimal .rhap_progress-indicator { background: white !important; width: 12px; height: 12px; top: -4px; opacity: 0; box-shadow: 0 2px 4px rgba(0,0,0,0.5); transition: opacity 0.2s; }
        .spotify-player-minimal .rhap_progress-bar:hover .rhap_progress-indicator { opacity: 1 !important; }
        .spotify-player-minimal .rhap_volume-container { display: none !important; }
        input[type="range"]::-webkit-slider-thumb { appearance: none; width: 12px; height: 12px; border-radius: 50%; background: white; cursor: pointer; opacity: 0; transition: opacity 0.2s; margin-top: -4px; }
        input[type="range"]:hover::-webkit-slider-thumb { opacity: 1; }
        input[type="range"]::-webkit-slider-runnable-track { height: 4px; border-radius: 2px; background: linear-gradient(to right, white 0%, white var(--value, 0%), rgba(255,255,255,0.2) var(--value, 0%), rgba(255,255,255,0.2) 100%); }
        input[type="range"]:hover::-webkit-slider-runnable-track { background: linear-gradient(to right, #1db954 0%, #1db954 var(--value, 0%), rgba(255,255,255,0.2) var(--value, 0%), rgba(255,255,255,0.2) 100%) !important; }
        @media (hover: none) {
          input[type="range"]::-webkit-slider-thumb { opacity: 1; }
        }
        @media (max-width: 768px) {
          .spotify-player-minimal .rhap_time { display: none !important; }
          .spotify-player-minimal .rhap_controls-section { margin-right: -10px; }
          .spotify-player-minimal .rhap_main-controls-button { font-size: 26px !important; }
          .spotify-player-minimal .rhap_skip-button { font-size: 20px !important; }
          input[type="range"]::-webkit-slider-runnable-track { background: linear-gradient(to right, white 0%, white var(--value, 0%), rgba(255,255,255,0.3) var(--value, 0%), rgba(255,255,255,0.3) 100%); }
        }
      `}</style>
    </>
  );
}
