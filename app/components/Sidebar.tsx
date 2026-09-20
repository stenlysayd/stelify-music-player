"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation"; // Import ini
import {
  Home, Heart, Plus, Library, Upload,
  RefreshCcw, ListMusic, Disc, Bot, Sparkles, LayoutDashboard, X
} from "lucide-react";

interface Playlist {
  id: number;
  name: string;
  coverUrl?: string | null;
}

export default function Sidebar() {
  const pathname = usePathname(); // Hook untuk cek URL
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const fetchPlaylists = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/playlists?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setPlaylists(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylists();
    const handleRefresh = () => fetchPlaylists();
    window.addEventListener("refreshSidebar", handleRefresh);
    return () => window.removeEventListener("refreshSidebar", handleRefresh);
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const handleCreatePlaylist = async () => {
    const name = prompt("Nama Playlist baru:");
    if (!name) return;
    try {
      await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, songIds: [] }),
      });
      fetchPlaylists();
    } catch (e) {
      alert("Gagal membuat playlist");
    }
  };

  const SidebarContent = () => (
    <>
      {/* 1. KOTAK ATAS: NAVIGASI */}
      <div className="bg-[#121212] rounded-xl p-4 flex flex-col gap-4 shadow-lg border border-zinc-900">
        <div className="flex items-center gap-3 px-2 md:hidden mb-2">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center font-bold text-black">S</div>
          <span className="font-bold text-white text-lg">Stelify Music</span>
        </div>

        {/* Menu Home */}
        <Link
          href="/"
          aria-current={pathname === '/' ? 'page' : undefined}
          className={`flex items-center gap-4 font-bold px-2 transition ${pathname === '/' ? 'text-white' : 'text-zinc-400 hover:text-white'}`}
        >
          <Home size={24} />
          <span>Home</span>
        </Link>

        {/* --- MENU DASHBOARD BARU --- */}
        <Link
          href="/dashboard"
          aria-current={pathname === '/dashboard' ? 'page' : undefined}
          className={`flex items-center gap-4 font-bold px-2 transition ${pathname === '/dashboard' ? 'text-white' : 'text-zinc-400 hover:text-white'}`}
        >
          <LayoutDashboard size={24} />
          <span>Dashboard</span>
        </Link>
        {/* --------------------------- */}

        {/* Menu Upload */}
        <Link
          href="/upload"
          aria-current={pathname === '/upload' ? 'page' : undefined}
          className={`flex items-center gap-4 font-bold px-2 transition ${pathname === '/upload' ? 'text-white' : 'text-zinc-400 hover:text-white'}`}
        >
          <Upload size={24} />
          <span>Upload Lagu</span>
        </Link>
      </div>

      {/* 2. KOTAK BAWAH: LIBRARY */}
      <div className="bg-[#121212] rounded-xl flex-1 flex flex-col overflow-hidden shadow-lg border border-zinc-900 mt-2">

        <div className="p-4 shadow-sm z-10 bg-[#121212]">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={fetchPlaylists}
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition group font-bold"
            >
              <Library size={24} className="group-hover:text-white" />
              <span>Koleksi Kamu</span>
            </button>

            <div className="flex items-center gap-1">
              <button onClick={handleCreatePlaylist} aria-label="Buat playlist baru" className="text-zinc-400 hover:text-white hover:bg-zinc-800 p-2.5 rounded-full transition">
                <Plus size={20} />
              </button>
              <button onClick={fetchPlaylists} aria-label="Muat ulang daftar playlist" className={`text-zinc-400 hover:text-white hover:bg-zinc-800 p-2.5 rounded-full transition ${loading ? 'animate-spin' : ''}`}>
                <RefreshCcw size={18} />
              </button>
            </div>
          </div>

<div className="flex gap-2 overflow-x-auto pb-2 hover:overflow-x-scroll scrollbar-sidebar">
  
  {/* 1. SEMUA LAGU (Icon: Disc) */}
  <Link href="/" className={`${pathname === '/' ? 'bg-white text-black' : 'bg-zinc-800 hover:bg-zinc-700 text-white'} px-3.5 py-1.5 rounded-full text-xs font-medium cursor-pointer transition flex items-center gap-1 whitespace-nowrap`}>
    <Disc size={12} /> Semua Lagu
  </Link>

  {/* 2. DISUKAI (Icon: Heart Hijau) */}
  <Link href="/favorites" className={`${pathname === '/favorites' ? 'bg-white text-black' : 'bg-zinc-800 hover:bg-zinc-700 text-white'} px-3.5 py-1.5 rounded-full text-xs font-medium cursor-pointer transition flex items-center gap-1 whitespace-nowrap`}>
    <Heart size={12} fill="currentColor" className="text-green-500" /> Disukai
  </Link>

  {/* 3. WAIFU (Icon: Sparkles Pink) - Diganti biar beda sama Love */}
  <Link href="/waifu" className={`${pathname === '/waifu' ? 'bg-white text-black' : 'bg-zinc-800 hover:bg-zinc-700 text-white'} px-3.5 py-1.5 rounded-full text-xs font-medium cursor-pointer transition flex items-center gap-1 whitespace-nowrap`}>
    <Sparkles size={12} className="text-pink-500" /> Waifu
  </Link>

  {/* 4. AI STELIFY (Icon: Bot Indigo/Ungu) - Diganti jadi Robot */}
  <Link href="/ai-room" className={`${pathname === '/ai-room' ? 'bg-white text-black' : 'bg-zinc-800 hover:bg-zinc-700 text-white'} px-3.5 py-1.5 rounded-full text-xs font-medium cursor-pointer transition flex items-center gap-1 whitespace-nowrap`}>
    <Bot size={12} className="text-indigo-400" /> AI Stelify
  </Link>

</div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4 hover:overflow-y-scroll scrollbar-sidebar">
          {playlists.length === 0 ? (
            <div className="mt-8 p-4 bg-zinc-800/30 rounded-lg text-center mx-2 border border-dashed border-zinc-800">
              <p className="text-zinc-400 font-bold text-sm mb-1">Belum ada playlist</p>
              <button onClick={handleCreatePlaylist} className="mt-2 bg-white text-black text-xs font-bold px-4 py-2 rounded-full hover:scale-105 transition">
                Buat yang pertama
              </button>
            </div>
          ) : (
            playlists.map((pl) => (
              <Link
                key={pl.id}
                href={`/playlist/${pl.id}`}
                className={`flex items-center gap-3 p-2 rounded-md transition group cursor-pointer ${pathname === `/playlist/${pl.id}` ? 'bg-zinc-800' : 'hover:bg-[#1f1f1f]'}`}
              >
                <div className="w-12 h-12 rounded bg-zinc-800 flex items-center justify-center flex-shrink-0 shadow overflow-hidden">
                  {pl.coverUrl ? (
                    <img
                      src={pl.coverUrl}
                      className="w-full h-full object-cover"
                      alt={pl.name}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <span className="text-zinc-500 font-bold text-lg group-hover:text-white">
                      {pl.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`font-semibold truncate ${pathname === `/playlist/${pl.id}` ? 'text-green-500' : 'text-white'}`}>
                    {pl.name}
                  </p>
                  <p className="text-xs text-zinc-400 flex items-center gap-1">
                    <ListMusic size={10} /> Playlist
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Tombol Menu Mobile */}
      <div className="md:hidden fixed top-4 left-4 z-[70]">
        <button
          onClick={() => setIsMobileOpen(true)}
          aria-label="Buka menu navigasi"
          aria-expanded={isMobileOpen}
          className="p-2 bg-black/50 backdrop-blur-md border border-zinc-800 rounded-full text-white shadow-xl"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
      </div>

      {pathname !== '/waifu' && (
        <>
          <aside
            className="hidden md:flex w-64 lg:w-72 xl:w-80 flex-col gap-2 bg-black p-2"
            style={{
              height: "calc(100vh - var(--global-player-height, 0px))",
            }}
          >
            <SidebarContent />
          </aside>

          <div
            className={`fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${isMobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
            onClick={() => setIsMobileOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Menu Navigasi"
              className={`absolute top-0 left-0 bottom-0 w-[85vw] max-w-[300px] bg-black p-2 flex flex-col gap-2 shadow-2xl transition-transform duration-300 ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-end p-2">
                <button onClick={() => setIsMobileOpen(false)} aria-label="Tutup menu" className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition">
                  <X size={20} />
                </button>
              </div>
              {isMobileOpen ? <SidebarContent /> : null}
            </div>
          </div>
        </>
      )}
    </>
  );
}
