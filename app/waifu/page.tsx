"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePlayerStore } from "../hooks/usePlayerStore";
import { Play, Pause, Mic2, Music } from "lucide-react";
import { usePathname } from "next/navigation";
import { parseLRC } from "../utils/lrcParser";

const globalStyles = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');
body { font-family: 'Poppins', sans-serif; overflow: hidden; }

input[type=range]::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 12px; width: 12px;
  border-radius: 50%; background: #333;
  cursor: pointer; margin-top: -5px; 
}
input[type=range]::-webkit-slider-runnable-track {
  width: 100%; height: 2px;
  cursor: pointer; background: transparent;
}

.sakura {
  position: absolute;
  pointer-events: none;
  background: linear-gradient(120deg, rgba(255, 183, 197, 0.9), rgba(255, 197, 208, 0.9));
  border-radius: 10px;
}

@keyframes fall {
  0% { opacity: 0.9; top: -10%; }
  100% { opacity: 0.2; top: 110%; }
}

@keyframes blow-soft-left { 0% { margin-left: 0; } 100% { margin-left: -50%; } }
@keyframes blow-medium-left { 0% { margin-left: 0; } 100% { margin-left: -100%; } }
@keyframes blow-soft-right { 0% { margin-left: 0; } 100% { margin-left: 50%; } }
@keyframes blow-medium-right { 0% { margin-left: 0; } 100% { margin-left: 100%; } }

@keyframes sway-0 { 0% { transform: rotate(-5deg); } 40% { transform: rotate(28deg); } 100% { transform: rotate(3deg); } }
@keyframes sway-1 { 0% { transform: rotate(10deg); } 40% { transform: rotate(43deg); } 100% { transform: rotate(15deg); } }
@keyframes sway-2 { 0% { transform: rotate(15deg); } 40% { transform: rotate(56deg); } 100% { transform: rotate(22deg); } }
@keyframes sway-3 { 0% { transform: rotate(25deg); } 40% { transform: rotate(74deg); } 100% { transform: rotate(37deg); } }
@keyframes sway-4 { 0% { transform: rotate(40deg); } 40% { transform: rotate(68deg); } 100% { transform: rotate(25deg); } }
@keyframes sway-5 { 0% { transform: rotate(50deg); } 40% { transform: rotate(78deg); } 100% { transform: rotate(40deg); } }
@keyframes sway-6 { 0% { transform: rotate(65deg); } 40% { transform: rotate(92deg); } 100% { transform: rotate(58deg); } }
@keyframes sway-7 { 0% { transform: rotate(72deg); } 40% { transform: rotate(118deg); } 100% { transform: rotate(68deg); } }
@keyframes sway-8 { 0% { transform: rotate(94deg); } 40% { transform: rotate(136deg); } 100% { transform: rotate(82deg); } }
`;

const SakuraOptimized = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let animationFrameId: number;
        let lastTime = 0;
        const delay = 400;

        const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
        const randomArrayElem = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

        const createPetal = (timestamp: number) => {
            if (timestamp - lastTime > delay) {
                const petal = document.createElement("div");
                petal.classList.add("sakura");

                const minSize = 10;
                const maxSize = 16;
                const size = randomInt(minSize, maxSize);
                const fallSpeed = 1;
                const fallTime = (window.innerHeight * 0.007 + Math.random() * 5) * fallSpeed;

                const blowAnimations = ["blow-soft-left", "blow-medium-left", "blow-soft-right", "blow-medium-right"];
                const swayAnimations = ["sway-0", "sway-1", "sway-2", "sway-3", "sway-4", "sway-5", "sway-6", "sway-7", "sway-8"];
                const blowAnim = randomArrayElem(blowAnimations);
                const swayAnim = randomArrayElem(swayAnimations);

                const animations = `fall ${fallTime}s linear 0s 1, ${blowAnim} ${((fallTime > 30 ? fallTime : 30) - 20 + randomInt(0, 20))}s linear 0s infinite, ${swayAnim} ${randomInt(2, 4)}s linear 0s infinite`;

                petal.style.animation = animations;
                petal.style.borderRadius = `${randomInt(maxSize, maxSize + 10)}px ${randomInt(1, Math.floor(size / 4))}px`;
                petal.style.height = `${size}px`;
                petal.style.width = `${size}px`;
                petal.style.left = `${Math.random() * window.innerWidth}px`;
                petal.style.marginTop = `${-(Math.floor(Math.random() * 20) + 15)}px`;

                petal.addEventListener("animationend", (ev) => {
                    if (ev.animationName === "fall") {
                        petal.remove();
                    }
                });

                container.appendChild(petal);
                lastTime = timestamp;
            }

            animationFrameId = requestAnimationFrame(createPetal);
        };

        animationFrameId = requestAnimationFrame(createPetal);

        return () => {
            cancelAnimationFrame(animationFrameId);
            if (container) container.innerHTML = "";
        };
    }, []);

    return <div ref={containerRef} className="absolute inset-0 z-20 pointer-events-none overflow-hidden" />;
};

function WaifuLyricsPanel({
    lyrics,
    currentTime,
    onSeek,
}: {
    lyrics?: string | null;
    currentTime: number;
    onSeek: (time: number) => void;
}) {
    const lines = useMemo(() => parseLRC(lyrics), [lyrics]);
    const containerRef = useRef<HTMLDivElement>(null);
    const isSongChangingRef = useRef(false);

    const activeIndex = useMemo(() => {
        if (lines.length === 0) return 0;
        const index = lines.findIndex((line, i) => {
            const nextLine = lines[i + 1];
            return currentTime >= line.time && (!nextLine || currentTime < nextLine.time);
        });
        return index === -1 ? 0 : index;
    }, [currentTime, lines]);

    const scrollToActiveLine = useCallback((index: number) => {
        const container = containerRef.current;
        if (!container) return;
        const activeElement = container.children[index] as HTMLElement;
        if (!activeElement) return;

        // Scroll lokal pada container saja — cegah scrollIntoView menggeser ancestor/navbar
        const targetScrollTop =
            activeElement.offsetTop - (container.clientHeight / 2) + (activeElement.clientHeight / 2);

        container.scrollTo({
            top: Math.max(0, targetScrollTop),
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
        });
    }, []);

    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTo({ top: 0, behavior: "instant" });
        }
        isSongChangingRef.current = true;
        const timeout = setTimeout(() => {
            isSongChangingRef.current = false;
        }, 500);
        return () => clearTimeout(timeout);
    }, [lyrics]);

    useEffect(() => {
        if (lines.length === 0) return;
        if (isSongChangingRef.current && activeIndex > 0) return;
        if (activeIndex === 0) {
            isSongChangingRef.current = false;
        }
        scrollToActiveLine(activeIndex);
    }, [activeIndex, lines.length, scrollToActiveLine]);

    if (!lyrics || lyrics.trim() === "") {
        return (
            <div className="flex flex-col items-center justify-center h-56 text-slate-500 font-poppins text-center p-6">
                <p className="text-sm font-bold text-slate-700 mb-1">Belum ada lirik untuk lagu ini</p>
                <p className="text-xs text-slate-400">Kamu bisa menambahkan file .lrc di menu Edit Info</p>
            </div>
        );
    }

    if (lines.length === 0) {
        return (
            <div className="overflow-y-auto max-h-[260px] md:max-h-[300px] px-2 py-3 text-slate-700 whitespace-pre-line text-xs md:text-sm leading-relaxed font-medium">
                {lyrics}
            </div>
        );
    }

    return (
        <div className="relative w-full h-[260px] md:h-[300px] overflow-hidden">
            {/* Top and Bottom gentle fade gradients */}
            <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white/90 via-white/50 to-transparent z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white/90 via-white/50 to-transparent z-10 pointer-events-none" />

            <div
                ref={containerRef}
                className="relative w-full h-full overflow-y-auto px-2 py-6 space-y-2.5 scrollbar-thin"
            >
                {lines.map((line, index) => {
                    const isActive = index === activeIndex;
                    return (
                        <button
                            key={index}
                            type="button"
                            onClick={() => onSeek(line.time)}
                            className={`w-full text-left transition-all duration-300 cursor-pointer block rounded-xl px-3 py-1.5 ${
                                isActive
                                    ? "text-[#304CD3] font-extrabold text-base md:text-lg scale-[1.01] bg-white/80 shadow-sm border border-blue-200/60"
                                    : "text-slate-500 hover:text-slate-800 text-xs md:text-sm font-medium hover:bg-white/40"
                            }`}
                        >
                            {line.text}
                        </button>
                    );
                })}
                <div className="h-16" />
            </div>
        </div>
    );
}

export default function WaifuPage() {
    const [time, setTime] = useState(() => new Date());

    const { 
        currentSong, 
        isPlaying, 
        togglePlay, 
        currentTime, 
        setSeekTime, 
        queue, 
        currentIndex,
        showLyrics,
        toggleLyrics
    } = usePlayerStore();

    const parseDurationToSeconds = (durationStr?: string) => {
        if (!durationStr) return 0;
        const parts = durationStr.split(":").map(Number);
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        return 0;
    };

    const duration = parseDurationToSeconds(currentSong?.duration) || 180;
    const progressPercent = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("en-US", { weekday: "short", day: "2-digit", month: "short" });
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = Number(e.target.value);
        setSeekTime(val);
    };

    const currentNum = (currentIndex + 1).toString().padStart(2, "0");
    const nextNum1 = (currentIndex + 2).toString().padStart(2, "0");
    const nextNum2 = (currentIndex + 3).toString().padStart(2, "0");
    const nextNum3 = (currentIndex + 4).toString().padStart(2, "0");

    const pathname = usePathname();
    const isActive = pathname === "/waifu";

    return (
        <>
            <style>{globalStyles}</style>

            <div className="relative w-full h-screen overflow-hidden bg-transparent text-[#4A4A4A] selection:bg-purple-200">
                <div className="absolute inset-0 z-0">
                    <img
                        src="/bg-sakura2.png"
                        alt="Sakura Background"
                        className="w-full h-full object-cover blur-[4px] opacity-70 scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#EBF4F8]/70 via-[#EBF4F8]/50 to-[#EBF4F8]/20" />
                </div>

                <SakuraOptimized />

                <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }} />

                <div className="absolute top-[0%] left-[-16%] w-[90%] h-[140%] z-0 pointer-events-none opacity-[0.7] ">
                    <img src="/shinobu.png" alt="Ghost" className="w-full h-full object-cover object-[center_20%] scale-[1] blur-[1px]" />
                </div>

                <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#ffffff96] via-[#ebf4f880] to-transparent w-[80%]" />

                <div className="absolute inset-y-0 right-0 w-[60%] h-full z-10 flex items-end justify-end pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0, scale: 1.1, x: 50 }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            x: 0,
                            y: [0, -15, 0],
                        }}
                        transition={{
                            duration: 1.2,
                            y: { duration: 6, repeat: Infinity, ease: "easeInOut" },
                        }}
                        className="relative w-full h-full"
                    >
                        <img src="/shinobu.png" alt="Waifu Main" className="w-full h-[110%] mt-[-5%] object-cover object-[center_top] scale-[1.05] origin-top drop-shadow-2xl" />
                    </motion.div>
                </div>

                <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
                    <motion.div
                        animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.3, 0.2] }}
                        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -bottom-20 -right-20 w-[600px] h-[600px] bg-purple-400/20 rounded-full blur-[120px]"
                    />
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
                        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                        className="absolute top-[40%] right-[-50px] w-[400px] h-[400px] bg-pink-300/15 rounded-full blur-[100px]"
                    />
                    <div className="absolute bottom-[150px] right-[100px] w-[80px] h-[80px] bg-white/40 rounded-full blur-[40px]" />
                </div>

                <div className="absolute inset-0 z-30 flex flex-col justify-between px-8 md:px-20 py-8 md:py-10 overflow-hidden">
                    <nav className="flex items-center gap-16 w-full pl-2 shrink-0">
                        <Link href="/dashboard" className="w-10 h-10 rounded-full border border-white/60 shadow-sm overflow-hidden cursor-pointer hover:scale-110 transition-transform relative z-50">
                            <img src="/shinobu.png" className="w-full h-full object-cover object-[center_12%] scale-[2.8]" alt="Profile" />
                        </Link>
                        <div className="hidden md:flex gap-12 text-[14px] font-medium text-slate-500/90 tracking-wide relative z-50">
                            <Link href="/" className="text-[#2c2c2c] font-bold relative cursor-pointer hover:scale-105 transition hover:text-purple-600">All Song</Link>
                            <Link href="/dashboard" className="hover:text-purple-600 transition cursor-pointer">Dashboard</Link>
                            <Link href="/upload" className="hover:text-purple-600 transition cursor-pointer">Upload</Link>
                            <Link href="/favorites" className="hover:text-purple-600 transition cursor-pointer">Favorites</Link>
                            <Link
                                href="/waifu"
                                className={`transition cursor-pointer ${isActive
                                    ? "text-purple-600 font-semibold"
                                    : "hover:text-purple-600"
                                    }`}
                            >
                                Waifu
                            </Link>
                            <Link href="/ai-room" className="hover:text-purple-600 transition cursor-pointer">AI-Room</Link>
                        </div>
                    </nav>

                    <div className="flex-1 min-h-0 flex flex-col justify-center max-w-[550px] relative pt-2 md:pt-4 pl-2">
                        <div className="absolute -left-6 top-[28%] h-[40%] w-[1px] bg-slate-300/60 hidden md:block" />

                        {/* Tab Switcher: Song Info <-> Lyrics */}
                        <div className="flex items-center gap-2 mb-4 relative z-40">
                            <button
                                type="button"
                                onClick={() => showLyrics && toggleLyrics()}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                    !showLyrics
                                        ? "bg-[#304CD3] text-white shadow-md shadow-blue-600/20"
                                        : "bg-white/70 hover:bg-white text-slate-600 border border-white/80 backdrop-blur-md"
                                }`}
                            >
                                <Music size={13} /> Song Info
                            </button>
                            <button
                                type="button"
                                onClick={() => !showLyrics && toggleLyrics()}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                    showLyrics
                                        ? "bg-[#304CD3] text-white shadow-md shadow-blue-600/20"
                                        : "bg-white/70 hover:bg-white text-slate-600 border border-white/80 backdrop-blur-md"
                                }`}
                            >
                                <Mic2 size={13} /> Lyrics
                            </button>
                        </div>

                        {!showLyrics ? (
                            <>
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-end gap-1 mb-1 font-poppins pl-1">
                                    <span className="text-sm font-bold text-[#555]">{currentNum}</span>
                                    <span className="text-[10px] font-medium text-slate-400 mb-[3px]">/{queue.length || "00"}</span>
                                </motion.div>

                                <motion.h1
                                    key={(currentSong?.id || "title") + "-title"}
                                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}
                                    className="text-[4rem] md:text-[5rem] font-[800] text-[#48424e] leading-[0.95] tracking-tight mb-4 line-clamp-2"
                                >
                                    {currentSong?.title || "No Song"} <span className="text-[#304CD3]">.</span>
                                </motion.h1>

                                <motion.p
                                    key={(currentSong?.id || "artist") + "-artist"}
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                                    className="text-[#5a5a5a] text-[18px] leading-[1.6] mb-10 font-medium pr-16"
                                >
                                    {currentSong?.artist || "Select a song to play from the Dashboard"}
                                </motion.p>

                                <motion.button
                                    onClick={togglePlay}
                                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="bg-[#304CD3] text-white px-9 py-3.5 rounded-full w-fit text-[13px] font-bold shadow-xl shadow-blue-600/20 hover:bg-[#253a9e] transition-all flex items-center gap-3 relative z-40"
                                >
                                    {isPlaying ? (
                                        <>Pause <Pause size={16} fill="white" /></>
                                    ) : (
                                        <>Play Now <Play size={16} fill="white" /></>
                                    )}
                                </motion.button>
                            </>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3 }}
                                className="w-full max-w-[500px] rounded-3xl bg-white/55 backdrop-blur-xl border border-white/80 shadow-[0_12px_36px_rgba(48,76,211,0.08)] p-5 relative z-40"
                            >
                                <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200/60">
                                    <div className="min-w-0 pr-4">
                                        <h2 className="text-base font-bold text-slate-800 truncate">{currentSong?.title || "No Song"}</h2>
                                        <p className="text-xs text-slate-500 truncate">{currentSong?.artist || "Unknown Artist"}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={togglePlay}
                                        className="w-9 h-9 rounded-full bg-[#304CD3] hover:bg-[#253a9e] text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                                        title={isPlaying ? "Pause" : "Play"}
                                    >
                                        {isPlaying ? <Pause size={15} fill="white" /> : <Play size={15} fill="white" className="ml-0.5" />}
                                    </button>
                                </div>
                                
                                <WaifuLyricsPanel
                                    lyrics={currentSong?.lyrics}
                                    currentTime={currentTime}
                                    onSeek={(t) => setSeekTime(t)}
                                />
                            </motion.div>
                        )}
                    </div>

                    <footer className="w-full flex items-end justify-between pb-1 pl-2 relative z-40">
                        <div className="flex flex-col gap-2 w-[300px] relative group">
                            <div className="absolute -top-6 left-0 text-[10px] font-mono text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                {Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(0).padStart(2, "0")} / {Math.floor(duration / 60)}:{(duration % 60).toFixed(0).padStart(2, "0")}
                            </div>

                            <span className="text-[12px] font-bold text-slate-800 pl-1">{currentNum}</span>

                            <div className="relative w-full h-[2px] bg-slate-300/70 rounded-full flex items-center hover:h-[4px] transition-all duration-300">
                                <motion.div
                                    className="absolute left-0 top-0 h-full bg-[#2c2c2c] z-10 pointer-events-none rounded-full"
                                    style={{ width: `${progressPercent}%` }}
                                    layoutId="progress"
                                />
                                <input
                                    type="range"
                                    min={0}
                                    max={duration}
                                    value={currentTime}
                                    onChange={handleSeek}
                                    className="absolute inset-0 w-full h-4 -top-2 opacity-0 cursor-pointer z-20"
                                />
                            </div>

                            <div className="flex gap-8 text-[10px] font-bold text-slate-400 tracking-wider pl-1">
                                <span className="text-slate-800">{nextNum1}</span>
                                <span>{nextNum2}</span>
                                <span>{nextNum3}</span>
                            </div>
                        </div>

                        <div className="hidden md:flex gap-16">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold text-slate-800 mb-1 uppercase tracking-wider">Instagram</span>
                                <span className="text-[10px] font-medium text-slate-500 lowercase tracking-normal">Nx_eryl</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold text-slate-800 mb-1 uppercase tracking-wider">Art By</span>
                                <span className="text-[10px] font-medium text-slate-500 capitalize tracking-normal">Tooku on Pixiv</span>
                            </div>
                        </div>

                        <div className="flex flex-col items-end min-w-[100px]">
                            <span className="text-[10px] font-bold text-slate-800 mb-1 capitalize tracking-normal">
                                {formatDate(time)}
                            </span>
                            <span className="text-[11px] font-black text-[#5a4fcf] tracking-wide">
                                {formatTime(time)}
                            </span>
                        </div>
                    </footer>
                </div>
            </div>
        </>
    );
}
