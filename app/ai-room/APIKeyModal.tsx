"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Key, X, Check, Eye, EyeOff, Loader2, Sparkles, AlertCircle, Trash2, Cpu } from "lucide-react";

export interface CustomAIModel {
  id: string;
  label: string;
  provider: "gemini" | "groq" | "openrouter" | "openai" | "custom";
  description?: string;
}

interface APIKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiKey: string, provider: string, models: CustomAIModel[], selectedModel?: string) => void;
  onReset: () => void;
  currentApiKey?: string;
  currentProvider?: string;
}

export default function APIKeyModal({
  isOpen,
  onClose,
  onSave,
  onReset,
  currentApiKey = "",
  currentProvider = ""
}: APIKeyModalProps) {
  const [apiKey, setApiKey] = useState(currentApiKey);
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectedProvider, setDetectedProvider] = useState<string>(currentProvider);
  const [detectedModels, setDetectedModels] = useState<CustomAIModel[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>("");

  useEffect(() => {
    setApiKey(currentApiKey);
    setDetectedProvider(currentProvider);
    try {
      const saved = window.localStorage.getItem("aura-custom-models");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDetectedModels(parsed);
          setSelectedModelId(parsed[0].id);
        }
      }
    } catch {
      // Ignore JSON error
    }
  }, [currentApiKey, currentProvider, isOpen]);

  // Real-time Provider Guess
  const getGuessedProvider = (val: string) => {
    const trimmed = val.trim();
    if (trimmed.startsWith("AIza") || (trimmed.length === 39 && !trimmed.includes("-"))) return "Google Gemini";
    if (trimmed.startsWith("gsk_")) return "Groq Cloud";
    if (trimmed.startsWith("sk-or-")) return "OpenRouter";
    if (trimmed.startsWith("sk-")) return "OpenAI / DeepSeek";
    return null;
  };

  const guessed = getGuessedProvider(apiKey);

  const handleDetectModels = async () => {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      setError("Masukkan API Key terlebih dahulu.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: trimmed }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal memverifikasi API Key");
      }

      setDetectedProvider(data.provider);
      setDetectedModels(data.models || []);
      if (data.models && data.models.length > 0) {
        setSelectedModelId(data.models[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mendeteksi model.");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!apiKey.trim()) {
      setError("Masukkan API Key terlebih dahulu.");
      return;
    }
    if (detectedModels.length === 0) {
      setError("Klik tombol 'Cek & Deteksi Model' terlebih dahulu untuk memverifikasi key.");
      return;
    }

    onSave(apiKey.trim(), detectedProvider, detectedModels, selectedModelId);
    onClose();
  };

  const handleClear = () => {
    setApiKey("");
    setDetectedModels([]);
    setDetectedProvider("");
    setError(null);
    onReset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border border-indigo-500/30 rounded-3xl p-6 md:p-8 shadow-2xl text-white overflow-hidden"
        >
          {/* Header Glow */}
          <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />

          {/* Title & Close */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                <Key size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-wide">Konfigurasi API Key AI</h3>
                <p className="text-xs text-zinc-400">Masukkan key apa saja, model akan dideteksi otomatis</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* Input Box */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-300">API Key</label>
                {guessed && (
                  <span className="text-[11px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                    ✦ {guessed}
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setError(null);
                  }}
                  placeholder="AIzaSy... / gsk_... / sk-or-..."
                  className="w-full bg-slate-950/80 border border-indigo-500/25 focus:border-indigo-400 rounded-2xl py-3 pl-4 pr-12 text-sm text-indigo-100 placeholder:text-zinc-600 outline-none transition font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1"
                >
                  {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-red-300 text-xs">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Detect Button */}
            <button
              onClick={handleDetectModels}
              disabled={loading || !apiKey.trim()}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Memeriksa & Mengambil Model...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Cek & Deteksi Model Otomatis</span>
                </>
              )}
            </button>

            {/* Detected Models List */}
            {detectedModels.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 flex items-center gap-1.5 font-medium">
                    <Check size={14} className="text-green-400" />
                    {detectedModels.length} Model Ditemukan ({detectedProvider.toUpperCase()})
                  </span>
                  <span className="text-[10px] text-indigo-400 font-mono">Pilih model default:</span>
                </div>

                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-indigo-500/30">
                  {detectedModels.map((m) => {
                    const isSelected = selectedModelId === m.id;
                    return (
                      <div
                        key={m.id}
                        onClick={() => setSelectedModelId(m.id)}
                        className={`p-2.5 rounded-xl text-xs cursor-pointer transition border flex items-center justify-between ${
                          isSelected
                            ? "bg-indigo-600/20 border-indigo-400 text-white font-bold"
                            : "bg-slate-950/40 border-white/5 hover:border-white/15 text-zinc-300"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Cpu size={14} className={isSelected ? "text-indigo-400" : "text-zinc-500"} />
                          <span className="truncate">{m.label}</span>
                        </div>
                        {isSelected && <Check size={14} className="text-indigo-400 shrink-0 ml-2" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10 gap-3">
            {currentApiKey ? (
              <button
                type="button"
                onClick={handleClear}
                className="py-2.5 px-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
              >
                <Trash2 size={14} />
                <span>Reset Key</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 text-xs text-zinc-400 hover:text-white rounded-xl hover:bg-white/5 transition font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={detectedModels.length === 0}
                className="py-2.5 px-5 bg-green-500 hover:bg-green-400 disabled:opacity-40 disabled:cursor-not-allowed text-black text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-green-500/20"
              >
                <Check size={14} />
                <span>Terapkan Model</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
