"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Music, ListMusic, Play, Clock, User, TrendingUp, 
  Sparkles, ArrowRight, Radio, Shuffle, LayoutDashboard, AlertTriangle, Upload,
  BarChart3, History // ✅ TAMBAHAN: Icon baru
} from "lucide-react";
// ✅ PERUBAHAN: Path naik 2 level (../../)
import type { LucideIcon } from "lucide-react";
import { usePlayerStore, Song } from "./../hooks/usePlayerStore"; 
import EditSongModal from "./../components/EditSongModal";
import MissingMetadataModal from "./../components/MissingMetadataModal";

interface ArtistStat {
  name: string;
  count: number;
  percentage: number;
}

// ✅ TAMBAHAN: Interface untuk History
interface HistoryItem {
  id: number;
  songId: number;
  playedAt: string;
  song: Song;
}

interface DashboardData {
  totalSongs: number;
  totalPlaylists: number;
  totalDuration: string;
  topArtists: ArtistStat[];
  recentSongs: Song[];
  allSongs: Song[]; 
  favorites: Song[];
  oldestSong: Song | null;
  randomPicks: Song[];
  missingCount: number;
  // ✅ TAMBAHAN: Field data baru
  mostPlayed: Song[];
  history: HistoryItem[];
}

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  gradient: string;
}

interface CompactSongItemProps {
  song: Song;
  label?: React.ReactNode;
  onClick: () => void;
  colorClass?: string;
}

const stableScore = (song: Song, salt: number) => {
  const value = Math.sin(song.id * 999 + salt * 101) * 10000;
  return value - Math.floor(value);
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({
    totalSongs: 0,
    totalPlaylists: 0,
    totalDuration: "0m",
    topArtists: [],
    recentSongs: [],
    allSongs: [],
    favorites: [],
    oldestSong: null,
    randomPicks: [],
    missingCount: 0,
    // ✅ TAMBAHAN: Init state
    mostPlayed: [],
    history: []
  });
  
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("");
  const [timeString, setTimeString] = useState("");
  
  // State Modal
  const [isMissingModalOpen, setIsMissingModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [songToEdit, setSongToEdit] = useState<Song | null>(null);
  
  // Zustand Store
  const playSong = usePlayerStore((state) => state.playSong);
  const setQueue = usePlayerStore((state) => state.setQueue);

  // 1. JAM & SAPAAN
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hour = now.getHours();
      
      if (hour < 11) setGreeting("Selamat Pagi ☀️");
      else if (hour < 15) setGreeting("Selamat Siang 🌤️");
      else if (hour < 18) setGreeting("Selamat Sore 🌇");
      else setGreeting("Selamat Malam 🌙");

      setTimeString(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };

    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  // 2. FETCH DATA
  const fetchData = async () => {
    try {
      // ✅ TAMBAHAN: Fetch /api/analytics/stats
      const [songsRes, playlistsRes, favRes, statsRes] = await Promise.all([
        fetch("/api/songs"),
        fetch("/api/playlists"),
        fetch("/api/favorites"),
        fetch("/api/analytics/stats")
      ]);

      if (songsRes.ok && playlistsRes.ok && favRes.ok) {
        const songs: Song[] = await songsRes.json();
        const playlists = await playlistsRes.json();
        const favorites: Song[] = await favRes.json();
        
        // ✅ TAMBAHAN: Parse data stats
        let mostPlayed: Song[] = [];
        let history: HistoryItem[] = [];
        if (statsRes.ok) {
            const stats = await statsRes.json();
            mostPlayed = stats.mostPlayed || [];
            history = stats.history || [];
        }

        // A. Sort
        const sortedByDate = [...songs].sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA; 
        });

        // B. Hitung Statistik
        let totalSec = 0;
        let missingCounter = 0;
        const artistCount: Record<string, number> = {};

        songs.forEach(s => {
           if (s.duration) {
             const parts = s.duration.split(':').map(Number);
             let dur = 0;
             if (parts.length === 3) dur = (parts[0] * 3600) + (parts[1] * 60) + parts[2];
             else if (parts.length === 2) dur = (parts[0] * 60) + parts[1];
             totalSec += dur;
           }

           const art = s.artist || "Unknown Artist";
           artistCount[art] = (artistCount[art] || 0) + 1;

           if (!s.coverUrl || s.artist === "Unknown Artist" || !s.album || s.album === "Unknown Album") {
             missingCounter++;
           }
        });

        const h = Math.floor(totalSec / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        const durationStr = h > 0 ? `${h}j ${m}m` : `${m}m`;

        const sortedArtists = Object.entries(artistCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, count]) => ({
              name, 
              count, 
              percentage: Math.round((count / songs.length) * 100)
          }));

        const shuffled = [...songs].sort((a, b) => stableScore(a, songs.length) - stableScore(b, songs.length));

        setData({
          totalSongs: songs.length,
          totalPlaylists: playlists.length,
          totalDuration: durationStr,
          topArtists: sortedArtists,
          recentSongs: sortedByDate.slice(0, 6),
          allSongs: songs,
          favorites: favorites,
          oldestSong: sortedByDate.length > 0 ? sortedByDate[sortedByDate.length - 1] : null,
          randomPicks: shuffled.slice(0, 3),
          missingCount: missingCounter,
          // ✅ TAMBAHAN: Set data stats
          mostPlayed,
          history
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenEdit = (song: Song) => {
    setSongToEdit(song);
    setIsEditModalOpen(true);
  };

  const handleSongUpdated = () => {
    fetchData(); 
  };

  const StatCard = ({ icon: Icon, label, value, gradient }: StatCardProps) => (
    <div className={`${gradient} rounded-2xl p-6 hover:scale-105 transition-transform cursor-pointer shadow-lg shadow-black/20 text-white relative overflow-hidden group`}>
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
         <Icon size={100} />
      </div>
      <div className="relative z-10">
        <Icon className="mb-3 opacity-90" size={28} />
        <h3 className="text-3xl md:text-4xl font-black mb-1 tracking-tight">{loading ? "-" : value}</h3>
        <p className="text-sm opacity-90 font-semibold uppercase tracking-wide">{label}</p>
      </div>
    </div>
  );

  const SongCard = ({ song, onClick }: { song: Song, onClick: () => void }) => (
    <div 
      onClick={onClick}
      className="bg-zinc-800/40 hover:bg-zinc-700/60 p-4 rounded-xl transition-all cursor-pointer group backdrop-blur-sm border border-white/5 hover:border-white/10"
    >
      <div className="relative aspect-square w-full bg-zinc-900 rounded-lg mb-4 overflow-hidden shadow-xl">
        {song.coverUrl ? (
            <img 
              src={song.coverUrl} 
              alt={song.title}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
        ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-600">
                <Music size={40} />
            </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
          <button className="bg-green-500 text-black rounded-full p-3 shadow-2xl hover:scale-110 hover:bg-green-400 transition-all transform translate-y-4 group-hover:translate-y-0 duration-300">
            <Play size={24} fill="black" className="ml-1" />
          </button>
        </div>
      </div>
      <h4 className="font-bold text-white text-sm mb-1 truncate">{song.title}</h4>
      <p className="text-zinc-400 text-xs truncate">{song.artist}</p>
    </div>
  );

  // ✅ TAMBAHAN: Komponen list compact untuk Most Played & History
  const CompactSongItem = ({ song, label, onClick, colorClass = "text-zinc-500" }: CompactSongItemProps) => (
    <div onClick={onClick} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/10 cursor-pointer transition group">
       <div className="w-10 h-10 bg-zinc-800 rounded-lg overflow-hidden relative flex-shrink-0">
          {song.coverUrl ? <img src={song.coverUrl} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" /> : <Music size={16} className="m-auto mt-3 text-zinc-600"/>}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
             <Play size={14} fill="white" />
          </div>
       </div>
       <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-zinc-200 truncate group-hover:text-white">{song.title}</p>
          <p className="text-xs text-zinc-500 truncate">{song.artist}</p>
       </div>
       {label && <span className={`text-xs font-mono font-medium ${colorClass}`}>{label}</span>}
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a] overflow-hidden font-sans">
      
      {/* MODALS */}
      <MissingMetadataModal 
          isOpen={isMissingModalOpen} 
          onClose={() => setIsMissingModalOpen(false)} 
          songs={data.allSongs}
          onEditSong={handleOpenEdit}
      />
      
      <EditSongModal 
          isOpen={isEditModalOpen} 
          onClose={() => setIsEditModalOpen(false)} 
          song={songToEdit} 
          onSave={handleSongUpdated} 
      />

      {/* --- DASHBOARD CONTENT (SCROLLABLE) --- */}
      <div className="flex-1 overflow-y-auto relative scrollbar-main">
          
          {/* Mobile Header */}
          <div className="md:hidden sticky top-0 z-30 bg-black/80 backdrop-blur-md border-b border-white/10 pl-16 pr-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LayoutDashboard className="text-green-500" size={20} />
              <span className="font-bold text-lg">Dashboard</span>
            </div>
          </div>

          {/* HERO SECTION */}
          <div className="relative bg-gradient-to-b from-indigo-900 via-[#1e1b4b] to-[#121212] px-4 md:px-8 pt-8 md:pt-12 pb-10">
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 mix-blend-overlay pointer-events-none"></div>
            
            <div className="max-w-7xl mx-auto relative z-10">
              <div className="flex items-center gap-2 mb-4 bg-white/5 w-fit px-3 py-1 rounded-full border border-white/10 backdrop-blur-md">
                <Clock size={14} className="text-zinc-300" />
                <span className="text-xs text-zinc-200 font-medium tracking-wide">{timeString}</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-8 md:mb-12 tracking-tight text-white drop-shadow-xl">
                {greeting}
              </h1>
              
              {/* STATS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                  icon={Music} label="Total Lagu" value={data.totalSongs}
                  gradient="bg-gradient-to-br from-blue-600 to-blue-800"
                />
                <StatCard 
                  icon={ListMusic} label="Playlist" value={data.totalPlaylists}
                  gradient="bg-gradient-to-br from-purple-600 to-purple-800"
                />
                <StatCard 
                  icon={Clock} label="Total Durasi" value={data.totalDuration}
                  gradient="bg-gradient-to-br from-green-600 to-green-800"
                />
                <StatCard 
                  icon={User} label="Artis Teratas" value={data.topArtists[0]?.name || "-"}
                  gradient="bg-gradient-to-br from-orange-500 to-red-600"
                />
              </div>
            </div>
          </div>

          {/* CONTENT BODY */}
          <div className="px-4 md:px-8 py-8 max-w-7xl mx-auto space-y-12 pb-40">
            
            {/* RECENTLY ADDED */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                      <Sparkles className="text-yellow-400" size={20} />
                  </div>
                  <h2 className="text-2xl font-bold">Baru Ditambahkan</h2>
                </div>
                <Link href="/" className="text-xs font-bold text-zinc-500 hover:text-white transition flex items-center gap-1 uppercase tracking-wider group">
                  Lihat Semua <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              
              {data.recentSongs.length === 0 ? (
                  <div className="text-center py-10 text-zinc-600 bg-white/5 rounded-xl border border-white/5">Belum ada lagu. Upload sekarang!</div>
              ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    {data.recentSongs.map((song) => (
                      <SongCard 
                          key={song.id} 
                          song={song} 
                          onClick={() => { setQueue(data.recentSongs, "Baru Ditambahkan"); playSong(song); }} 
                      />
                    ))}
                  </div>
              )}
            </section>

            {/* ✅ BAGIAN BARU: ANALYTICS GRID (MOST PLAYED & HISTORY) */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               {/* KIRI: SERING DIPUTAR */}
               <div className="bg-[#181818]/80 backdrop-blur-md border border-white/5 rounded-3xl p-6 md:p-8 shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                     <div className="p-2 bg-green-500/20 rounded-lg"><BarChart3 className="text-green-500" size={20} /></div>
                     <h3 className="text-xl font-bold">Paling Sering Diputar</h3>
                  </div>
                  <div className="space-y-2">
                     {data.mostPlayed.length === 0 ? (
                        <p className="text-zinc-500 text-sm italic">Belum ada data pemutaran.</p>
                     ) : (
                        data.mostPlayed.slice(0, 5).map((song, i) => (
                           <CompactSongItem 
                              key={i} 
                              song={song} 
                              label={`${song.playCount ?? 0}x`}
                              colorClass="text-green-500"
                              onClick={() => { setQueue(data.mostPlayed, "Sering Diputar"); playSong(song); }} 
                           />
                        ))
                     )}
                  </div>
               </div>

               {/* KANAN: RIWAYAT PUTAR */}
               <div className="bg-[#181818]/80 backdrop-blur-md border border-white/5 rounded-3xl p-6 md:p-8 shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                     <div className="p-2 bg-blue-500/20 rounded-lg"><History className="text-blue-500" size={20} /></div>
                     <h3 className="text-xl font-bold">Riwayat Putar</h3>
                  </div>
                  <div className="space-y-2">
                     {data.history.length === 0 ? (
                        <p className="text-zinc-500 text-sm italic">Belum ada riwayat.</p>
                     ) : (
                        data.history.slice(0, 5).map((item, i) => (
                           <CompactSongItem 
                              key={i} 
                              song={item.song} 
                              label={new Date(item.playedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
                              colorClass="text-zinc-500"
                              onClick={() => playSong(item.song)} 
                           />
                        ))
                     )}
                  </div>
               </div>
            </section>
            {/* ✅ AKHIR BAGIAN BARU */}

            {/* GRID CHARTS & WIDGETS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* LEFT: TOP ARTISTS */}
              <div className="lg:col-span-2 bg-[#181818]/80 backdrop-blur-md border border-white/5 rounded-3xl p-6 md:p-8 shadow-xl">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold flex items-center gap-3">
                      <TrendingUp className="text-green-500" /> Statistik Artis
                    </h3>
                    <span className="text-xs font-bold text-zinc-500 bg-white/5 px-3 py-1 rounded-full">TOP 5</span>
                </div>

                <div className="space-y-6">
                    {data.topArtists.length === 0 ? (
                      <p className="text-zinc-500 text-sm">Belum cukup data.</p>
                    ) : (
                      data.topArtists.map((artist, idx) => (
                          <div key={idx} className="group cursor-default">
                            <div className="flex justify-between items-end mb-2">
                                <div className="flex items-center gap-4">
                                  <span className={`text-lg font-black w-6 ${idx === 0 ? 'text-yellow-500' : 'text-zinc-600'}`}>{idx + 1}</span>
                                  <span className="text-base font-semibold text-white group-hover:text-green-400 transition">{artist.name}</span>
                                </div>
                                <span className="text-xs font-bold text-zinc-500">{artist.count} Lagu</span>
                            </div>
                            <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                                <div 
                                  className="bg-gradient-to-r from-green-500 to-emerald-400 h-full rounded-full transition-all duration-1000 ease-out relative group-hover:brightness-110" 
                                  style={{ width: `${artist.percentage}%` }}
                                ></div>
                            </div>
                          </div>
                      ))
                    )}
                </div>
              </div>

              {/* RIGHT: WIDGETS */}
              <div className="flex flex-col gap-6">
                
                {/* Missing Metadata */}
                {data.missingCount > 0 && (
                    <div 
                        onClick={() => setIsMissingModalOpen(true)}
                        className="bg-gradient-to-r from-red-900/40 to-orange-900/40 border border-red-500/30 rounded-3xl p-6 cursor-pointer hover:border-red-500/60 transition group relative overflow-hidden"
                    >
                        <div className="relative z-10 flex items-center justify-between">
                          <div>
                              <h3 className="text-red-400 font-bold flex items-center gap-2 mb-1">
                                <AlertTriangle size={18} /> Rapikan Library
                              </h3>
                              <p className="text-zinc-300 text-sm font-medium">
                                <span className="text-white font-bold underline decoration-red-500">{data.missingCount} Lagu</span> data tidak lengkap.
                              </p>
                          </div>
                          <div className="bg-red-500 text-black p-2 rounded-full group-hover:scale-110 transition shadow-lg shadow-red-900/50">
                              <ArrowRight size={20} />
                          </div>
                        </div>
                        <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-red-600/20 blur-3xl rounded-full group-hover:bg-red-600/30 transition"></div>
                    </div>
                )}

                {/* Forgotten Gems */}
                <div className="bg-gradient-to-br from-[#181818] to-black border border-white/5 rounded-3xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Radio className="text-red-500" size={20} />
                      <h3 className="font-bold text-lg">Forgotten Gems</h3>
                    </div>
                    <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                      Lagu-lagu lama yang mungkin kamu rindukan.
                    </p>
                    <div className="space-y-3">
                      {data.randomPicks.map((song, i) => (
                          <div 
                            key={i} 
                            onClick={() => { setQueue(data.randomPicks, "Forgotten Gems"); playSong(song); }}
                            className="flex items-center gap-3 p-2 hover:bg-white/10 rounded-lg cursor-pointer group transition"
                          >
                            <div className="w-10 h-10 bg-zinc-800 rounded overflow-hidden flex-shrink-0 relative">
                                {song.coverUrl ? <img src={song.coverUrl} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" /> : <Music size={14} className="m-auto mt-3 text-zinc-600"/>}
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                  <Play size={12} fill="white" />
                                </div>
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-zinc-200 truncate group-hover:text-white">{song.title}</p>
                                <p className="text-xs text-zinc-500 truncate">{song.artist}</p>
                            </div>
                          </div>
                      ))}
                    </div>
                </div>

                {/* Time Capsule */}
                {data.oldestSong && (
                    <div className="bg-gradient-to-br from-amber-900/20 to-black border border-amber-900/30 rounded-3xl p-6 relative overflow-hidden group cursor-pointer" onClick={() => { setQueue([data.oldestSong!], "Time Capsule"); playSong(data.oldestSong!); }}>
                      <div className="relative z-10">
                          <h4 className="text-amber-500 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Clock size={12} /> Time Capsule
                          </h4>
                          <div className="flex items-center gap-3">
                            {data.oldestSong.coverUrl && <img src={data.oldestSong.coverUrl} alt="" loading="lazy" decoding="async" className="w-10 h-10 rounded shadow-md" />}
                            <div>
                                <p className="font-bold text-white truncate line-clamp-1 text-sm">{data.oldestSong.title}</p>
                                <p className="text-xs text-zinc-500">{new Date(data.oldestSong.createdAt || 0).getFullYear()}</p>
                            </div>
                          </div>
                      </div>
                      <div className="absolute inset-0 bg-amber-600/10 opacity-0 group-hover:opacity-100 transition" />
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                    <Link href="/upload" className="bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/20 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition cursor-pointer group">
                      <Upload className="text-blue-500 group-hover:scale-110 transition" />
                      <span className="text-xs font-bold text-blue-400">Upload</span>
                    </Link>
                    <button onClick={() => { 
                        if(data.recentSongs.length) { setQueue(data.recentSongs, "Shuffle All"); playSong(data.recentSongs[0]); }
                    }} className="bg-purple-600/10 hover:bg-purple-600/20 border border-purple-600/20 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition cursor-pointer group">
                      <Shuffle className="text-purple-500 group-hover:scale-110 transition" />
                      <span className="text-xs font-bold text-purple-400">Shuffle</span>
                    </button>
                </div>

              </div>
            </div>

          </div>
          
          {/* Bottom Spacer */}
          <div className="h-32" />
      </div>
    </div>
  );
}
