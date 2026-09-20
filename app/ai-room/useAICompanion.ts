import { useState, useEffect, useCallback, useRef } from 'react';
import { handleAIIntent, type PlayerController } from '@/lib/ai/intentHandler';
import { usePlayerStore, Song } from '@/app/hooks/usePlayerStore';

export type AtmosphereMode = 'default' | 'rain' | 'sunset' | 'midnight' | 'focus';
// 1. Definisikan tipe ekspresi
export type AuraExpression = 'idle' | 'happy' | 'shy' | 'working' | 'confused';

const DEFAULT_AI_MODEL = "gemini-2.0-flash";
const MAX_LIBRARY_CONTEXT = 220;

export const useAICompanion = (playerStoreActions?: PlayerController) => {
  const [messages, setMessages] = useState<{ sender: 'user' | 'ai'; text: string }[]>([
    { sender: 'ai', text: 'Aura online. Gemini mode siap, Groq fallback aktif, kontrol musik lokal juga aman.' }
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const [isAfk, setIsAfk] = useState(false);
  const [atmosphere, setAtmosphere] = useState<AtmosphereMode>('default');
  const [aiModel, setAiModelState] = useState<string>(DEFAULT_AI_MODEL);
  const [apiKey, setApiKeyState] = useState<string>('');
  const [provider, setProviderState] = useState<string>('');
  const [customModels, setCustomModels] = useState<Array<{ id: string; label: string; provider: string; description?: string }>>([]);
  
  // 2. Tambah State Ekspresi (Default: idle)
  const [expression, setExpression] = useState<AuraExpression>('idle');

  // Library State untuk God Mode
  const [fullLibrary, setFullLibrary] = useState<Song[]>([]);

  const currentSong = usePlayerStore((state) => state.currentSong);
  const volume = usePlayerStore((state) => state.volume);

  const typingStats = useRef({ keystrokes: 0, startTime: 0, wpm: 0 });
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch Library Function
  const fetchLibrary = useCallback(async (): Promise<Song[]> => {
    try {
      const res = await fetch('/api/songs'); 
      if (res.ok) {
        const data = await res.json();
        setFullLibrary(data); 
        console.log(`[AI] Library refreshed: ${data.length} songs.`);
        return data;
      }
    } catch (e) {
      console.error("[AI] Gagal load library:", e);
    }
    return [];
  }, []);

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  useEffect(() => {
    const savedModel = window.localStorage.getItem('aura-ai-model');
    const savedKey = window.localStorage.getItem('aura-api-key') || '';
    const savedProvider = window.localStorage.getItem('aura-provider') || '';
    const savedModelsStr = window.localStorage.getItem('aura-custom-models');

    if (savedKey) setApiKeyState(savedKey);
    if (savedProvider) setProviderState(savedProvider);

    if (savedModelsStr) {
      try {
        const parsed = JSON.parse(savedModelsStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCustomModels(parsed);
        }
      } catch {
        // Ignore JSON error
      }
    }

    if (savedModel) {
      setAiModelState(savedModel);
    }
  }, []);

  const setAiModel = useCallback((model: string) => {
    setAiModelState(model);
    window.localStorage.setItem('aura-ai-model', model);
  }, []);

  const saveApiKeyConfig = useCallback((key: string, prov: string, models: Array<{ id: string; label: string; provider: string; description?: string }>, selectedModel?: string) => {
    setApiKeyState(key);
    setProviderState(prov);
    setCustomModels(models);

    window.localStorage.setItem('aura-api-key', key);
    window.localStorage.setItem('aura-provider', prov);
    window.localStorage.setItem('aura-custom-models', JSON.stringify(models));

    const modelToUse = selectedModel || (models.length > 0 ? models[0].id : DEFAULT_AI_MODEL);
    setAiModelState(modelToUse);
    window.localStorage.setItem('aura-ai-model', modelToUse);
  }, []);

  const resetApiKeyConfig = useCallback(() => {
    setApiKeyState('');
    setProviderState('');
    setCustomModels([]);

    window.localStorage.removeItem('aura-api-key');
    window.localStorage.removeItem('aura-provider');
    window.localStorage.removeItem('aura-custom-models');

    setAiModelState(DEFAULT_AI_MODEL);
    window.localStorage.setItem('aura-ai-model', DEFAULT_AI_MODEL);
  }, []);

  const trackTyping = () => {
    const now = Date.now();
    if (typingStats.current.startTime === 0) typingStats.current.startTime = now;
    typingStats.current.keystrokes++;
    const durationMin = (now - typingStats.current.startTime) / 60000;
    if (durationMin > 0) {
      typingStats.current.wpm = Math.round((typingStats.current.keystrokes / 5) / durationMin);
    }
  };

  const resetAfkTimer = useCallback(() => {
    setIsAfk(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setIsAfk(true), 60000); 
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', resetAfkTimer);
    window.addEventListener('keydown', resetAfkTimer);
    resetAfkTimer();
    return () => {
      window.removeEventListener('mousemove', resetAfkTimer);
      window.removeEventListener('keydown', resetAfkTimer);
    };
  }, [resetAfkTimer]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isThinking) return;

    const currentWpm = typingStats.current.wpm;
    typingStats.current = { keystrokes: 0, startTime: 0, wpm: 0 };

    setMessages((prev) => [...prev, { sender: 'user', text }]);
    setIsThinking(true);
    // Saat user kirim pesan, Aura 'mikir' (ekspresi working sementara)
    setExpression('working');
    resetAfkTimer();

    const historyContext = messages.slice(-10).map(m => 
      `${m.sender === 'user' ? 'User' : 'Aura'}: ${m.text}`
    ).join('\n');

    const libraryExcerpt = fullLibrary.slice(0, MAX_LIBRARY_CONTEXT);
    const songLibrary = libraryExcerpt.map((s) => 
      `ID:${s.id}|${s.title}|${s.artist}|${s.genre || ''}|${s.mood || ''}`
    ).join('\n') + (fullLibrary.length > libraryExcerpt.length ? `\n...${fullLibrary.length - libraryExcerpt.length} more songs indexed locally` : '');

    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    const hour = now.getHours();

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: text,
          history: historyContext,
          modelName: aiModel, 
          apiKey: apiKey || undefined,
          provider: provider || undefined,
          context: {
            library: songLibrary || "No songs available",
            nowPlaying: currentSong ? `${currentSong.title} - ${currentSong.artist}` : "None",
            currentVolume: Math.round(volume * 100),
            currentLyrics: currentSong?.lyrics || "No lyrics available",
            time: timeString,
            hour: hour,
            typingSpeed: currentWpm, 
            currentVibe: atmosphere
          }
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.reply || `AI request failed with ${res.status}`);
      }
      if (data.reply) {
        setMessages((prev) => [...prev, { sender: 'ai', text: data.reply }]);
      }

      // 3. LOGIKA UBAH EKSPRESI BERDASARKAN INTENT
      let newExpr: AuraExpression = 'idle';

      switch (data.intent) {
          case 'PLAY_SEARCH':
          case 'PLAY_PLAYLIST':
          case 'PLAY_ID':
          case 'PLAY_BATCH':
          case 'PLAY_FAVORITES':
          case 'QUEUE_ADD':
              newExpr = 'happy'; // Senang muter lagu
              break;
          case 'AUTO_FIX_TITLES':
          case 'DEEP_CLEAN':
          case 'CLEAN_TRASH':
          case 'REFRESH_LIBRARY':
          case 'FIND_DUPLICATES':
          case 'FIND_ADVANCED_DUPLICATES':
          case 'MANAGE_PLAYLIST':
          case 'CREATE_PLAYLIST':
              newExpr = 'working'; // Semangat kerja
              break;
          case 'NO_ACTION': 
              // Kalau chat biasa, bisa jadi shy atau idle
              newExpr = 'shy'; 
              break;
          default:
              newExpr = 'idle';
      }

      // Kalau reply mengandung kata maaf/bingung, override jadi confused
      if (data.reply && (data.reply.toLowerCase().includes("maaf") || data.reply.toLowerCase().includes("bingung") || data.reply.toLowerCase().includes("error"))) {
          newExpr = 'confused';
      }

      setExpression(newExpr);

      // ✅ Pass fullLibrary ke parameter ke-4
      let libraryForIntent = fullLibrary;
      if ((data.intent === 'PLAY_BATCH' || data.intent === 'QUEUE_ADD') && libraryForIntent.length === 0) {
        libraryForIntent = await fetchLibrary();
      }

      handleAIIntent(data, playerStoreActions ?? usePlayerStore.getState(), fetchLibrary, libraryForIntent);

      if (data.payload?.atmosphere) {
        setAtmosphere(data.payload.atmosphere as AtmosphereMode);
      }

    } catch (err) {
      console.error(err);
      setMessages((prev) => [...prev, { sender: 'ai', text: "system error." }]);
      setExpression('confused'); // Error = Pusing
    } finally {
      setIsThinking(false);
    }
  };

  return { 
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
  };
};
