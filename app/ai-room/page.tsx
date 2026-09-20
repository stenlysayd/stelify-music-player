'use client';

import { Avatar } from './Avatar';
import { ChatPanel } from './ChatPanel';
import { useAICompanion } from './useAICompanion';
import { Atmosphere } from './Atmosphere'; 
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Key } from 'lucide-react';
import APIKeyModal from './APIKeyModal';

const AVAILABLE_MODELS = [
  { id: "gemini-2.0-flash", label: "GEMINI 2.0 FLASH" },
  { id: "gemini-1.5-flash", label: "GEMINI 1.5 FLASH" },
  { id: "llama-3.3-70b-versatile", label: "LLAMA 3.3 70B" },
  { id: "llama-3.1-8b-instant", label: "LLAMA 3.1 8B FAST" },
];

const AFK_TEXTS = ["LISTENING...", "STILL HERE", "WITH YOU", "...", "MUSIC STAYS"];

export default function AIRoomPage() {
  const { 
    messages, 
    sendMessage, 
    isThinking, 
    isAfk, 
    atmosphere, 
    trackTyping, 
    aiModel, 
    setAiModel, 
    expression,
    apiKey,
    provider,
    customModels,
    saveApiKeyConfig,
    resetApiKeyConfig,
  } = useAICompanion();

  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [textIndex, setTextIndex] = useState(0);

  // Combine custom models from user with built-in fallbacks
  const availableOptions = [
    ...(customModels.length > 0 ? customModels.map(m => ({ id: m.id, label: m.label })) : []),
    ...AVAILABLE_MODELS.filter(base => !customModels.some(cm => cm.id === base.id)),
  ];

  useEffect(() => {
    if (!isAfk) return;
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % AFK_TEXTS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isAfk]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-[#020202] via-[#0a0a14] to-[#050510] text-white transition-all duration-1000">
      
      {/* ✅ FIX 1: ATMOSPHERE LAYER - Tetap z-0, tapi sekarang tidak tertutup */}
      <Atmosphere mode={atmosphere} />

      {/* ✅ FIX 2: BASE BACKGROUND - Pindah ke z-[-2] agar di belakang Atmosphere */}
      <div className="absolute inset-0 z-[-2] bg-gradient-to-br from-black via-[#0a0a1a] to-[#1a1a2e]" />
      
      {/* ✅ FIX 3: FLOATING ORBS - Pindah ke z-[-1] agar di belakang Atmosphere */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[140px] animate-[float_20s_ease-in-out_infinite] pointer-events-none z-[-1]" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[140px] animate-[float_25s_ease-in-out_infinite_reverse] pointer-events-none z-[-1]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-600/4 rounded-full blur-[160px] animate-[float_30s_ease-in-out_infinite] pointer-events-none z-[-1]" />

      {/* ✅ FIX 4: GRAIN TEXTURE - Turunkan opacity dan pindah ke z-[2] (DI ATAS Atmosphere untuk efek film) */}
      <div className="absolute inset-0 z-[2] opacity-[0.015] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVy idD0iYSIgeD0iMCIgeT0iMCI+PjZUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PGZlQ29sb3JNYXRyaXggdHlwZT0ic2F0dXJhdGUiIHZhbHVlcz0iMCIvPjwvZmlsdGVyLjxwYXRo idD0iQzAgMGgzMDB2MzAwSDB6IiBmaWx0ZXI9InVybCgjYSkiIG9wYWNpdHk9Ii4wNSIvPjwvc3ZnPg==')] animate-[grain_8s_steps(10)_infinite] pointer-events-none mix-blend-overlay" />
      
      {/* ✅ FIX 5: VIGNETTE - Kurangi opacity dan pindah ke z-[3] */}
      <div className="absolute inset-0 z-[3] bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.3)_100%)] pointer-events-none" />
      
      {/* Avatar Layer - z-10 tetap di atas Atmosphere */}
      <div className="absolute inset-0 z-10 flex items-end justify-center pb-0">
         <Avatar expression={expression} isTalking={false} />
      </div>

      {/* Model Selector & API Key Settings - z-[60] */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="absolute top-5 md:top-6 right-4 md:right-6 z-[60] flex items-center gap-2 md:gap-3"
      >
        <button
          type="button"
          onClick={() => setIsKeyModalOpen(true)}
          title={apiKey ? `Custom API Key Connected (${provider || 'Active'})` : "Enter Custom API Key"}
          className="relative flex items-center gap-1.5 px-3 py-3 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-800/90 border border-indigo-500/25 hover:border-indigo-400/50 text-indigo-300 text-xs font-mono font-bold transition-all shadow-[0_4px_20px_rgba(99,102,241,0.15)] hover:shadow-[0_8px_28px_rgba(99,102,241,0.25)] backdrop-blur-2xl group cursor-pointer"
        >
          <Key className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-200 transition-colors" />
          <span className="hidden sm:inline text-[10px] tracking-wider uppercase">API KEY</span>
          {apiKey ? (
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-amber-400/50" />
          )}
        </button>

        <label htmlFor="ai-model-select" className="text-[9px] md:text-[10px] text-indigo-400/70 font-mono font-bold hidden md:block uppercase tracking-[0.25em] bg-gradient-to-br from-indigo-500/10 to-purple-500/5 px-3 py-2 rounded-xl border border-indigo-500/20 backdrop-blur-md shadow-[0_4px_12px_rgba(99,102,241,0.1)]">
          AI BRAIN
        </label>
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600/30 via-purple-600/30 to-cyan-600/30 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
          
          <select 
            id="ai-model-select"
            aria-label="Pilih model AI"
            value={aiModel} 
            onChange={(e) => setAiModel(e.target.value)}
            className="relative appearance-none bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-2xl border border-indigo-500/25 hover:border-indigo-400/50 focus:border-indigo-400/70 text-xs text-indigo-300 font-bold font-mono py-3.5 pl-4 pr-11 rounded-2xl cursor-pointer transition-all duration-400 outline-none w-48 sm:w-56 md:w-64 uppercase tracking-[0.15em] shadow-[0_4px_20px_rgba(99,102,241,0.15),inset_0_1px_0_rgba(255,255,255,0.1)] hover:shadow-[0_8px_28px_rgba(99,102,241,0.25),inset_0_1px_0_rgba(255,255,255,0.15)] focus:shadow-[0_8px_32px_rgba(99,102,241,0.35),inset_0_0_16px_rgba(99,102,241,0.12)]"
          >
            {availableOptions.map((model) => (
              <option key={model.id} value={model.id} className="bg-slate-900 text-gray-300 py-2">
                {model.label}
              </option>
            ))}
          </select>
          
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300 group-hover:translate-y-[-45%] group-hover:scale-110">
            <svg className="w-3.5 h-3.5 text-indigo-400/70 group-hover:text-indigo-300 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          
          <div className="absolute -right-1 -top-1 w-2.5 h-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
          </div>
          
          <div className="absolute top-1 left-1 right-12 h-px bg-gradient-to-r from-white/10 via-white/5 to-transparent rounded-t-2xl pointer-events-none" />
        </div>
      </motion.div>

      {/* Chat Panel - z-50 */}
      <ChatPanel 
        messages={messages} 
        onSend={sendMessage} 
        isThinking={isThinking}
        isAfk={isAfk}
        trackTyping={trackTyping} 
      />

      {/* AFK Text Overlay - z-[5] agar di atas Atmosphere tapi di bawah UI */}
      <AnimatePresence mode='wait'>
        {isAfk && (
          <motion.div 
            key={textIndex}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute top-10 md:top-12 left-6 md:left-12 z-[5] pointer-events-none hidden md:block"
          >
            <div className="relative">
              <h1 aria-hidden="true" className="absolute inset-0 text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter text-indigo-600/15 uppercase select-none blur-3xl">
                {AFK_TEXTS[textIndex]}
              </h1>
              <h1 aria-hidden="true" className="absolute inset-0 text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter text-purple-600/10 uppercase select-none blur-2xl">
                {AFK_TEXTS[textIndex]}
              </h1>
              
              <h1 className="relative text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter bg-gradient-to-br from-white/12 via-indigo-300/10 to-purple-300/8 bg-clip-text text-transparent uppercase select-none drop-shadow-[0_0_40px_rgba(99,102,241,0.15)]">
                {AFK_TEXTS[textIndex]}
              </h1>
              
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.03] to-transparent animate-[scan_3s_ease-in-out_infinite] pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/[0.02] via-transparent to-pink-500/[0.02] animate-[shimmer_4s_ease-in-out_infinite] pointer-events-none" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        @keyframes grain {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-5%, -10%); }
          20% { transform: translate(-15%, 5%); }
          30% { transform: translate(7%, -25%); }
          40% { transform: translate(-5%, 25%); }
          50% { transform: translate(-15%, 10%); }
          60% { transform: translate(15%, 0%); }
          70% { transform: translate(0%, 15%); }
          80% { transform: translate(3%, 35%); }
          90% { transform: translate(-10%, 10%); }
        }
        
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.6; }
          33% { transform: translate(35px, -35px) scale(1.15); opacity: 0.8; }
          66% { transform: translate(-25px, 25px) scale(0.92); opacity: 0.5; }
        }
        
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(60px, 60px); }
        }
        
        @keyframes scan {
          0% { transform: translateY(-100%); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(100%); opacity: 0; }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); opacity: 0.5; }
          50% { opacity: 1; }
          100% { transform: translateX(100%); opacity: 0.5; }
        }
        
        @media (prefers-reduced-motion: reduce) {
          .floating, .floating-reverse, .jitter {
            animation: none !important;
          }
        }
      `}</style>

      {/* Custom API Key & Model Config Modal */}
      <APIKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        onSave={saveApiKeyConfig}
        onReset={resetApiKeyConfig}
        currentApiKey={apiKey}
        currentProvider={provider}
      />

    </div>
  );
}
