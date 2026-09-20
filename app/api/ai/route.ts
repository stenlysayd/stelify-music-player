import { NextResponse } from "next/server";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import * as Manager from "@/lib/ai/managerActions";
import { resolveMoodToKeyword } from "@/lib/ai/moodResolver";
import { handleResearchRequest, isGeminiModelId, resolveGeminiMainModel, runGeminiJson } from "@/lib/ai/researchService";

export const dynamic = "force-dynamic";

type PlaylistMode = "ADD_MISSING" | "REMOVE_MISMATCH";
type TaggingMode = "NORMAL" | "REPAIR";
type AtmosphereMode = "default" | "rain" | "sunset" | "midnight" | "focus";

interface TaggingSession {
  lastId?: number;
  targetEndId?: number;
  mode?: TaggingMode;
}

interface RequestContext {
  library?: string;
  nowPlaying?: string;
  currentVolume?: number;
  currentLyrics?: string;
  time?: string;
  hour?: number;
  typingSpeed?: number;
  currentVibe?: string;
}

interface AIRequest {
  message?: string;
  history?: string;
  modelName?: string;
  context?: RequestContext;
  apiKey?: string;
  provider?: string;
}

interface IntentPayload {
  id?: number;
  ids?: number[];
  keyword?: string;
  playlistName?: string;
  mode?: PlaylistMode;
  level?: number;
  volume?: number;
  action?: string;
  mood?: string;
  atmosphere?: AtmosphereMode;
  shuffle?: boolean;
  repeat?: "one" | "all" | "off";
  view?: "lyrics" | "queue";
}

interface AIIntentResult {
  intent: string;
  payload: IntentPayload;
  reply: string;
  model?: string;
  degraded?: boolean;
}

interface TagUpdate {
  id: number;
  genre?: unknown;
  mood?: unknown;
}

const SESSION_FILE = path.join(process.cwd(), "aura-tagging-session.json");
const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";
const FAST_GROQ_MODEL = "llama-3.1-8b-instant";
const MAX_LIBRARY_CONTEXT_CHARS = 14_000;
const MAX_HISTORY_CHARS = 4_000;

let groqClient: OpenAI | null = null;

function getGroqClient(customKey?: string, provider?: string) {
  if (customKey) {
    let baseURL = "https://api.groq.com/openai/v1";
    if (provider === "openrouter" || customKey.startsWith("sk-or-")) {
      baseURL = "https://openrouter.ai/api/v1";
    } else if (provider === "openai" || (customKey.startsWith("sk-") && !customKey.startsWith("gsk_") && !customKey.startsWith("sk-or-"))) {
      baseURL = "https://api.openai.com/v1";
    }
    return new OpenAI({
      apiKey: customKey,
      baseURL,
    });
  }

  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) return null;

  if (!groqClient) {
    groqClient = new OpenAI({
      apiKey,
      baseURL: "https://api.groq.com/openai/v1",
    });
  }

  return groqClient;
}

function isSafeModelId(value: string) {
  return /^[a-z0-9._/-]+$/i.test(value) && value.length <= 120 && !value.toLowerCase().includes("gemini");
}

function resolveModel(requested?: string, fallback = DEFAULT_GROQ_MODEL) {
  const candidates = [requested, process.env.GROQ_MODEL, fallback];
  for (const candidate of candidates) {
    const clean = candidate?.trim();
    if (clean && isSafeModelId(clean)) return clean;
  }
  return fallback;
}

function trimBlock(value: string | undefined, maxChars: number) {
  if (!value) return "";
  return value.length > maxChars ? `${value.slice(0, maxChars)}\n...[trimmed]` : value;
}

function getPublicFilePath(relativePath: string | null | undefined) {
  if (!relativePath || relativePath.startsWith("http")) return null;

  try {
    const publicDir = path.resolve(process.cwd(), "public");
    const cleanPath = decodeURIComponent(relativePath).replace(/^\/+/, "");
    const fullPath = path.resolve(publicDir, cleanPath);

    if (!fullPath.startsWith(`${publicDir}${path.sep}`)) return null;
    if (!fs.existsSync(fullPath)) return null;
    return fullPath;
  } catch {
    return null;
  }
}

function cleanFileNameForPrompt(relativePath: string | null | undefined) {
  if (!relativePath) return undefined;
  const baseName = path.basename(relativePath).replace(/\.[a-z0-9]+$/i, "");
  return decodeURIComponent(baseName)
    .replace(/^\d{10,}-/, "")
    .replace(/^[a-f0-9-]{20,}-/i, "")
    .replace(/[_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function readEmbeddedAudioTags(relativePath: string | null | undefined) {
  const filePath = getPublicFilePath(relativePath);
  if (!filePath) return null;

  try {
    const { parseFile } = await import("music-metadata");
    const metadata = await parseFile(filePath, { skipCovers: true, duration: false });

    return {
      title: metadata.common.title,
      artist: metadata.common.artist,
      album: metadata.common.album,
      genre: metadata.common.genre?.join(", "),
      year: metadata.common.year,
    };
  } catch {
    return null;
  }
}

async function enrichSongsForTagging<T extends {
  id: number;
  title: string;
  artist: string;
  album?: string | null;
  duration?: string | null;
  audioUrl?: string | null;
  genre?: string | null;
  mood?: string | null;
}>(songs: T[]) {
  return Promise.all(
    songs.map(async (song) => ({
      id: song.id,
      title: song.title,
      artist: song.artist,
      album: song.album || undefined,
      duration: song.duration || undefined,
      fileName: cleanFileNameForPrompt(song.audioUrl),
      currentGenre: song.genre || undefined,
      currentMood: song.mood || undefined,
      embeddedTags: await readEmbeddedAudioTags(song.audioUrl),
    })),
  );
}

function getSession(): TaggingSession {
  try {
    if (fs.existsSync(SESSION_FILE)) {
      return JSON.parse(fs.readFileSync(SESSION_FILE, "utf8")) as TaggingSession;
    }
  } catch {
    return {};
  }
  return {};
}

function saveSession(data: TaggingSession) {
  try {
    fs.writeFileSync(SESSION_FILE, JSON.stringify(data));
  } catch {
    // Best effort session persistence only.
  }
}

function stripJsonFences(raw: string) {
  return raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

function parseJsonObject(raw: string): Record<string, unknown> {
  const text = stripJsonFences(raw);

  try {
    const parsed = JSON.parse(text) as unknown;
    if (Array.isArray(parsed)) {
      const first = parsed[0];
      if (first && typeof first === "object") return first as Record<string, unknown>;
    }
    if (parsed && typeof parsed === "object") return parsed as Record<string, unknown>;
  } catch {
    // Try extracting the object below.
  }

  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) {
    throw new Error("AI response did not include a JSON object");
  }

  const parsed = JSON.parse(text.slice(first, last + 1)) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("AI response JSON was not an object");
  }
  return parsed as Record<string, unknown>;
}

function parseTagUpdates(raw: string): TagUpdate[] {
  const text = stripJsonFences(raw);

  const read = (value: unknown): TagUpdate[] => {
    if (Array.isArray(value)) return value as TagUpdate[];
    if (value && typeof value === "object") {
      const updates = (value as { updates?: unknown }).updates;
      if (Array.isArray(updates)) return updates as TagUpdate[];
    }
    return [];
  };

  try {
    const direct = read(JSON.parse(text) as unknown);
    if (direct.length > 0) return direct;
  } catch {
    // Continue with extraction.
  }

  const objectStart = text.indexOf("{");
  const objectEnd = text.lastIndexOf("}");
  if (objectStart !== -1 && objectEnd > objectStart) {
    try {
      const fromObject = read(JSON.parse(text.slice(objectStart, objectEnd + 1)) as unknown);
      if (fromObject.length > 0) return fromObject;
    } catch {
      // Continue with array extraction.
    }
  }

  const arrayStart = text.indexOf("[");
  const arrayEnd = text.lastIndexOf("]");
  if (arrayStart !== -1 && arrayEnd > arrayStart) {
    const fromArray = read(JSON.parse(text.slice(arrayStart, arrayEnd + 1)) as unknown);
    if (fromArray.length > 0) return fromArray;
  }

  throw new Error("AI response did not include tag updates");
}

function toPositiveInt(value: unknown) {
  const numberValue = typeof value === "number" ? value : typeof value === "string" ? Number.parseInt(value, 10) : NaN;
  return Number.isFinite(numberValue) && numberValue > 0 ? Math.floor(numberValue) : undefined;
}

function toNumber(value: unknown) {
  const numberValue = typeof value === "number" ? value : typeof value === "string" ? Number.parseFloat(value) : NaN;
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function clampVolume(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeIds(value: unknown) {
  const rawIds = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.match(/\d+/g) ?? []
      : [];

  const ids = rawIds
    .map((item) => toPositiveInt(item))
    .filter((id): id is number => Boolean(id));

  return [...new Set(ids)];
}

function normalizeAction(value: unknown) {
  if (typeof value !== "string") return undefined;
  const clean = value.toLowerCase().trim();
  const aliases: Record<string, string> = {
    previous: "prev",
    back: "prev",
    play: "resume",
    continue: "resume",
    stop: "pause",
    queue: "open_queue",
    lyrics: "open_lyrics",
    lyric: "open_lyrics",
    shuffle: "shuffle_on",
    repeat: "repeat_all",
  };
  return aliases[clean] ?? clean;
}

function normalizePayload(raw: unknown): IntentPayload {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const input = raw as Record<string, unknown>;
  const payload: IntentPayload = {};

  payload.id = toPositiveInt(input.id);
  const ids = normalizeIds(input.ids);
  if (ids.length > 0) payload.ids = ids;

  if (typeof input.keyword === "string") payload.keyword = input.keyword.trim();
  if (typeof input.mood === "string") payload.mood = input.mood.trim();
  if (typeof input.playlistName === "string") payload.playlistName = input.playlistName.trim();
  if (input.mode === "ADD_MISSING" || input.mode === "REMOVE_MISMATCH") payload.mode = input.mode;

  const level = toNumber(input.level);
  const volume = toNumber(input.volume);
  if (level !== undefined) payload.level = clampVolume(level);
  if (volume !== undefined) payload.volume = clampVolume(volume);

  const action = normalizeAction(input.action);
  if (action) payload.action = action;

  if (typeof input.atmosphere === "string") {
    const atmosphere = input.atmosphere.toLowerCase().trim();
    if (["default", "rain", "sunset", "midnight", "focus"].includes(atmosphere)) {
      payload.atmosphere = atmosphere as AtmosphereMode;
    }
  }

  if (typeof input.shuffle === "boolean") payload.shuffle = input.shuffle;
  if (input.repeat === "one" || input.repeat === "all" || input.repeat === "off") payload.repeat = input.repeat;
  if (input.view === "lyrics" || input.view === "queue") payload.view = input.view;

  return payload;
}

function inferIntent(payload: IntentPayload) {
  if (payload.ids?.length) return "PLAY_BATCH";
  if (payload.id) return "PLAY_ID";
  if (payload.keyword || payload.mood) return "PLAY_SEARCH";
  if (payload.level !== undefined || payload.volume !== undefined) return "SET_VOLUME";
  if (payload.action) return "CONTROL";
  return "NO_ACTION";
}

function normalizeAIResult(raw: Record<string, unknown>, fallbackReply: string, model?: string): AIIntentResult {
  const payload = normalizePayload(raw.payload);
  const intent = typeof raw.intent === "string" && raw.intent.trim() ? raw.intent.trim().toUpperCase() : inferIntent(payload);
  const reply = typeof raw.reply === "string" && raw.reply.trim() ? raw.reply.trim() : fallbackReply;

  return {
    intent,
    payload,
    reply,
    model,
  };
}

function inferAtmosphere(message: string): AtmosphereMode {
  const lower = message.toLowerCase();
  if (/(hujan|rain|galau|sedih|ambyar|nangis|lonely|sad)/.test(lower)) return "rain";
  if (/(sunset|senja|romantis|romantic|hangat|warm)/.test(lower)) return "sunset";
  if (/(malam|midnight|dark|gelap|night)/.test(lower)) return "midnight";
  if (/(fokus|focus|belajar|kerja|produktif)/.test(lower)) return "focus";
  return "default";
}

function cleanupKeyword(value: string) {
  return value
    .replace(/\b(dong|ya|please|tolong|sekarang|aja|nih|deh|buatku|untukku)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractIds(message: string) {
  return [...new Set((message.match(/\d+/g) ?? []).map(Number).filter((id) => Number.isInteger(id) && id > 0))];
}

function buildLocalIntent(message: string): AIIntentResult | null {
  const lower = message.toLowerCase();
  const atmosphere = inferAtmosphere(message);

  const volumeMatch =
    lower.match(/(?:volume|vol|suara)\D{0,12}(\d{1,3})/i) ??
    lower.match(/(\d{1,3})\s*%/i);

  if (volumeMatch) {
    return {
      intent: "SET_VOLUME",
      payload: { level: clampVolume(Number(volumeMatch[1])), atmosphere },
      reply: `Siap, volume aku set ke ${clampVolume(Number(volumeMatch[1]))}%.`,
    };
  }

  if (/\b(mute|senyap|diamkan)\b/.test(lower)) {
    return { intent: "SET_VOLUME", payload: { level: 0, atmosphere }, reply: "Siap, aku mute dulu." };
  }

  if (/\b(kecilkan|pelankan)\b/.test(lower)) {
    return { intent: "SET_VOLUME", payload: { level: 35, atmosphere }, reply: "Siap, aku pelankan volumenya." };
  }

  if (/\b(besarkan|keraskan)\b/.test(lower)) {
    return { intent: "SET_VOLUME", payload: { level: 80, atmosphere }, reply: "Siap, aku besarkan volumenya." };
  }

  if (/(lagu berikut|next|skip|lanjut lagu|ganti lagu)/.test(lower)) {
    return { intent: "CONTROL", payload: { action: "next", atmosphere }, reply: "Oke, aku skip ke lagu berikutnya." };
  }

  if (/(lagu sebelumnya|previous|prev|balik lagu|mundur lagu)/.test(lower)) {
    return { intent: "CONTROL", payload: { action: "prev", atmosphere }, reply: "Oke, aku balik ke lagu sebelumnya." };
  }

  if (/(pause|jeda|berhenti dulu|stop dulu)/.test(lower)) {
    return { intent: "CONTROL", payload: { action: "pause", atmosphere }, reply: "Aku pause dulu." };
  }

  if (/(resume|lanjutkan musik|play lagi|puter lagi|putar lagi)/.test(lower)) {
    return { intent: "CONTROL", payload: { action: "resume", atmosphere }, reply: "Aku lanjutkan musiknya." };
  }

  if (/(matikan|off|nonaktifkan).*(shuffle|acak)/.test(lower)) {
    return { intent: "CONTROL", payload: { action: "shuffle_off", atmosphere }, reply: "Shuffle aku matikan." };
  }

  if (/(shuffle|acak|random)/.test(lower)) {
    return { intent: "CONTROL", payload: { action: "shuffle_on", atmosphere }, reply: "Shuffle aku nyalakan." };
  }

  if (/(repeat one|ulang satu)/.test(lower)) {
    return { intent: "CONTROL", payload: { action: "repeat_one", atmosphere }, reply: "Repeat satu lagu aku aktifkan." };
  }

  if (/(repeat off|matikan repeat|ulang mati)/.test(lower)) {
    return { intent: "CONTROL", payload: { action: "repeat_off", atmosphere }, reply: "Repeat aku matikan." };
  }

  if (/(repeat|ulang semua)/.test(lower)) {
    return { intent: "CONTROL", payload: { action: "repeat_all", atmosphere }, reply: "Repeat semua aku aktifkan." };
  }

  if (/(buka|lihat|tampilkan).*(lirik|lyrics)/.test(lower)) {
    return { intent: "CONTROL", payload: { action: "open_lyrics", atmosphere }, reply: "Lirik aku bukakan." };
  }

  if (/(buka|lihat|tampilkan).*(queue|antrian)/.test(lower)) {
    return { intent: "CONTROL", payload: { action: "open_queue", atmosphere }, reply: "Antrian aku bukakan." };
  }

  if (/(like|sukai|favoritkan).*(lagu ini|ini)/.test(lower)) {
    return { intent: "LIKE", payload: { atmosphere }, reply: "Aku tandai lagu ini." };
  }

  if (/(putar|mainkan|play).*(favorit|favorite|disukai)/.test(lower)) {
    return { intent: "PLAY_FAVORITES", payload: { shuffle: /acak|shuffle|random/.test(lower), atmosphere }, reply: "Aku putarkan lagu favoritmu." };
  }

  if (/(duplikat|duplicate|lagu kembar)/.test(lower)) {
    return { intent: "FIND_ADVANCED_DUPLICATES", payload: { atmosphere }, reply: "Aku cek kemungkinan lagu duplikat." };
  }

  if (/(deep clean|bersih-bersih total|rapikan database|bersihkan database)/.test(lower)) {
    return { intent: "DEEP_CLEAN", payload: { atmosphere }, reply: "Aku mulai rapikan database musiknya." };
  }

  if (/(fix title|rapikan judul|perbaiki judul)/.test(lower)) {
    return { intent: "AUTO_FIX_TITLES", payload: { atmosphere }, reply: "Aku rapikan judul dan artist yang berantakan." };
  }

  if (/(clean trash|hapus sampah|buang sampah)/.test(lower)) {
    return { intent: "CLEAN_TRASH", payload: { atmosphere }, reply: "Aku bersihkan data kosongnya." };
  }

  const createPlaylist = message.match(/(?:buat|bikin|create)\s+playlist\s+(.+)/i);
  if (createPlaylist) {
    const rawKeyword = cleanupKeyword(createPlaylist[1]);
    const keyword = resolveMoodToKeyword(rawKeyword);
    return {
      intent: "CREATE_PLAYLIST",
      payload: { keyword, playlistName: `Aura ${rawKeyword}`, atmosphere },
      reply: `Aku buatkan playlist untuk ${rawKeyword}.`,
    };
  }

  const manageMode = /(isi|lengkapi|tambahkan).*(playlist)/.test(lower)
    ? "ADD_MISSING"
    : /(bersihkan|filter|buang).*(playlist)/.test(lower)
      ? "REMOVE_MISMATCH"
      : undefined;

  if (manageMode) {
    const [id] = extractIds(message);
    const nameMatch = message.match(/playlist\s+(.+)/i);
    return {
      intent: "MANAGE_PLAYLIST",
      payload: { id, playlistName: cleanupKeyword(nameMatch?.[1] ?? ""), mode: manageMode, atmosphere },
      reply: "Aku rapikan playlist itu.",
    };
  }

  const playMatch = message.match(/(?:putar(?:in)?|mainkan|play|setel(?:kan)?|carikan|cari)(?:\s+lagu|\s+musik)?\s+(.+)/i);
  if (playMatch) {
    const rawKeyword = cleanupKeyword(playMatch[1]);
    if (rawKeyword) {
      return {
        intent: "PLAY_SEARCH",
        payload: {
          keyword: resolveMoodToKeyword(rawKeyword),
          shuffle: /(acak|shuffle|random)/.test(lower),
          atmosphere,
        },
        reply: `Aku carikan lagu untuk "${rawKeyword}".`,
      };
    }
  }

  return null;
}

async function runGroqJson(options: {
  model: string;
  system: string;
  user: string;
  temperature?: number;
  maxCompletionTokens?: number;
  client?: OpenAI | null;
}) {
  const client = options.client ?? getGroqClient();
  if (!client) throw new Error("API Key belum dikonfigurasi");

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: options.system },
    { role: "user", content: options.user },
  ];

  const baseRequest = {
    model: options.model,
    messages,
    temperature: options.temperature ?? 0.25,
    max_completion_tokens: options.maxCompletionTokens ?? 1200,
  };

  try {
    const completion = await client.chat.completions.create({
      ...baseRequest,
      response_format: { type: "json_object" },
    });
    return completion.choices[0]?.message?.content ?? "{}";
  } catch (error) {
    console.warn("[AURA-GROQ] JSON mode failed, retrying plain JSON prompt.", error);
    const completion = await client.chat.completions.create(baseRequest);
    return completion.choices[0]?.message?.content ?? "{}";
  }
}

async function handleHardDelete(message: string): Promise<AIIntentResult | null> {
  const lower = message.toLowerCase();
  if (!/(hapus|delete|remove|buang)/.test(lower)) return null;
  if (lower.includes("playlist")) return null;
  if (!/(id|lagu|song|track)/.test(lower)) return null;

  const idsToDelete = extractIds(message);
  if (idsToDelete.length === 0) return null;

  return {
    intent: "NO_ACTION",
    payload: {},
    reply: `Demi keamanan koleksi lagu, penghapusan file lagu permanen (ID: ${idsToDelete.join(", ")}) dinonaktifkan lewat chat. Silakan gunakan menu konteks (titik tiga -> Hapus) pada lagu langsung di antarmuka.`,
  };
}

async function handleAutoTagging(message: string): Promise<AIIntentResult | null> {
  const lower = message.toLowerCase();
  const rangeMatch = lower.match(/(?:perbaiki|retag|tag ulang)\s+id\s+(\d+)\s*(?:-|sampai|to)\s*(\d+)/i);
  const isContinue = /\blanjut\b|\bcontinue\b|\bnext batch\b/.test(lower);
  const isAutoTagRequest =
    lower.includes("isi genre") ||
    lower.includes("isi mood") ||
    lower.includes("klasifikasikan") ||
    lower.includes("auto tag") ||
    Boolean(rangeMatch) ||
    isContinue;

  if (!isAutoTagRequest) return null;

  if (!getGroqClient()) {
    return {
      intent: "NO_ACTION",
      payload: {},
      reply: "GROQ_API_KEY belum dipasang, jadi auto-tagging belum bisa jalan. Kontrol musik dasar tetap bisa aku bantu.",
      degraded: true,
    };
  }

  const batchSize = 24;
  const session = getSession();
  let currentStartId = 0;
  let targetEndId = 0;
  let mode: TaggingMode = "NORMAL";

  if (rangeMatch) {
    currentStartId = Number.parseInt(rangeMatch[1], 10);
    targetEndId = Number.parseInt(rangeMatch[2], 10);
    mode = "REPAIR";
    saveSession({ lastId: currentStartId, targetEndId, mode });
  } else if (isContinue && session.mode === "REPAIR") {
    currentStartId = session.lastId ?? 0;
    targetEndId = session.targetEndId ?? 0;
    mode = "REPAIR";
  } else if (isContinue) {
    currentStartId = session.lastId ?? 0;
  }

  const songsToProcess =
    mode === "REPAIR"
      ? await Manager.getSongsByRange(currentStartId, targetEndId, batchSize)
      : await prisma.song.findMany({
          where: { OR: [{ genre: null }, { genre: "" }, { mood: null }, { mood: "" }] },
          take: batchSize,
          skip: currentStartId > 0 ? 1 : 0,
        cursor: currentStartId > 0 ? { id: currentStartId } : undefined,
        orderBy: { id: "asc" },
        select: { id: true, title: true, artist: true, album: true, duration: true, audioUrl: true, genre: true, mood: true },
      });

  if (!songsToProcess.length) {
    saveSession({ lastId: 0, mode: "NORMAL" });
    return {
      intent: "NO_ACTION",
      payload: {},
      reply: "Semua target sudah diperiksa. Database musiknya sudah rapi.",
    };
  }

  const songsForTagging = await enrichSongsForTagging(songsToProcess);

  const tagSystemPrompt = `
You are AURA's music metadata specialist.
Classify songs into specific genre and mood tags from the evidence provided.
Return exactly one JSON object with this shape:
{"updates":[{"id":1,"genre":"J-Pop, Anime","mood":"Energetic, Happy"}]}

Rules:
- Use comma-separated strings, not arrays.
- Keep each genre field to 1-4 useful tags.
- Keep each mood field to 1-5 useful tags.
- Evidence priority: embeddedTags > title/artist/album > fileName > currentGenre/currentMood.
- currentGenre/currentMood can be wrong during retag; use them only as weak hints.
- Do not guess from language alone. Indonesian title/artist does NOT automatically mean Indonesian Pop.
- Instrumental requires clear evidence such as instrumental, karaoke, piano, orchestra, orchestral, score, soundtrack, OST, BGM, classical, ambient, game music, or no-vocal metadata.
- Never label vocal Pop/J-Pop/K-Pop/Indonesian Pop as Instrumental unless the evidence explicitly says instrumental or soundtrack/score/BGM.
- If evidence is weak, return an empty string for that field instead of inventing a random genre or mood.
- Prefer specific tags such as Budots, Brazilian Funk, Vocaloid, J-Pop, K-Pop, Anime, Lo-Fi, Phonk, City Pop, Indonesian Pop, Rock, Metal, EDM, Future Bass, R&B, Soundtrack.
- Do not invent song IDs.
- Output JSON only.
`.trim();

  const tagUserPrompt = `
Songs to classify with local evidence:
${JSON.stringify(songsForTagging)}
`.trim();

  try {
    const model = resolveModel(process.env.GROQ_TAGGING_MODEL, FAST_GROQ_MODEL);
    const raw = await runGroqJson({
      model,
      system: tagSystemPrompt,
      user: tagUserPrompt,
      temperature: 0.15,
      maxCompletionTokens: 2800,
    });

    const validIds = new Set(songsToProcess.map((song) => song.id));
    const updates = parseTagUpdates(raw)
      .filter((update) => validIds.has(Number(update.id)))
      .map((update) => ({
        id: Number(update.id),
        genre: update.genre,
        mood: update.mood,
      }))
      .filter((update) => update.genre || update.mood);

    if (updates.length === 0) throw new Error("No valid tag updates returned");

    await Manager.updateTagsBatch(updates);

    const lastProcessed = songsToProcess[songsToProcess.length - 1].id;
    if (mode === "REPAIR" && lastProcessed >= targetEndId) {
      saveSession({ lastId: 0, mode: "NORMAL" });
    } else {
      saveSession({
        lastId: lastProcessed,
        targetEndId: mode === "REPAIR" ? targetEndId : 0,
        mode,
      });
    }

    return {
      intent: "REFRESH_LIBRARY",
      payload: {},
      model,
      reply: `Beres batch ID ${songsToProcess[0].id}-${lastProcessed}. Aku update ${updates.length} lagu. Ketik "lanjut" untuk batch berikutnya.`,
    };
  } catch (error) {
    console.error("[AURA-TAGGING]", error);
    const lastProcessed = songsToProcess[songsToProcess.length - 1]?.id;
    if (lastProcessed) {
      saveSession({
        lastId: lastProcessed,
        targetEndId: mode === "REPAIR" ? targetEndId : 0,
        mode,
      });
    }

    return {
      intent: "REFRESH_LIBRARY",
      payload: {},
      reply: "Batch ini gagal diparse, jadi aku skip supaya proses tidak macet. Ketik \"lanjut\" untuk teruskan.",
      degraded: true,
    };
  }
}

async function resolvePlaylistId(payload: IntentPayload) {
  if (payload.id) return payload.id;
  if (!payload.playlistName) return undefined;

  const playlists = await prisma.playlist.findMany({ select: { id: true, name: true } });
  const target = payload.playlistName.toLowerCase().trim();
  const exact = playlists.find((playlist) => playlist.name.toLowerCase() === target);
  if (exact) return exact.id;

  return playlists.find((playlist) => playlist.name.toLowerCase().includes(target) || target.includes(playlist.name.toLowerCase()))?.id;
}

async function postProcessResult(result: AIIntentResult): Promise<AIIntentResult> {
  const payload = result.payload;

  if (result.intent === "FIND_ADVANCED_DUPLICATES") {
    const duplicateGroups = await Manager.findSmartDuplicates();
    if (duplicateGroups.length === 0) {
      return {
        ...result,
        intent: "NO_ACTION",
        reply: "Aku cek, tidak ada grup lagu duplikat yang jelas. Library aman.",
      };
    }

    const lines = [`Aku menemukan ${duplicateGroups.length} grup lagu yang mirip:`, ""];
    duplicateGroups.slice(0, 12).forEach((group, groupIndex) => {
      lines.push(`Grup ${groupIndex + 1}`);
      group.forEach((song) => {
        lines.push(`- ID ${song.id}: ${song.title} - ${song.artist} (${song.duration ?? "unknown"})`);
      });
      lines.push("");
    });

    if (duplicateGroups.length > 12) lines.push(`Masih ada ${duplicateGroups.length - 12} grup lain yang aku sembunyikan biar chat tidak kepanjangan.`);
    lines.push('Kalau sudah yakin, tulis misalnya: "hapus ID 22 dan 89".');

    return { ...result, intent: "NO_ACTION", reply: lines.join("\n") };
  }

  if (result.intent === "MANAGE_PLAYLIST") {
    const playlistId = await resolvePlaylistId(payload);
    if (!playlistId || !payload.mode) {
      return {
        ...result,
        intent: "NO_ACTION",
        reply: "Aku belum bisa memastikan playlist dan modenya. Sebut nama atau ID playlistnya ya.",
      };
    }

    const response = await Manager.managePlaylistVibe(playlistId, payload.mode);
    return {
      ...result,
      intent: "REFRESH_LIBRARY",
      payload: { ...payload, id: playlistId },
      reply: `${response.message} Playlist sudah aku rapikan.`,
    };
  }

  if (result.intent === "CREATE_PLAYLIST") {
    const keyword = payload.keyword || payload.mood;
    if (!keyword) {
      return {
        ...result,
        intent: "NO_ACTION",
        reply: "Aku butuh vibe, genre, atau kata kunci untuk membuat playlist.",
      };
    }

    const resolvedKeyword = resolveMoodToKeyword(keyword);
    const playlistName = payload.playlistName || `Aura ${keyword}`;
    const response = await Manager.createSmartPlaylist(resolvedKeyword, playlistName);
    return {
      ...result,
      intent: "REFRESH_LIBRARY",
      payload: { ...payload, keyword: resolvedKeyword, playlistName },
      reply: response.message,
    };
  }

  if (result.intent === "PLAY_PLAYLIST") {
    const playlistId = await resolvePlaylistId(payload);
    if (!playlistId) {
      return {
        ...result,
        intent: "NO_ACTION",
        reply: "Aku belum menemukan playlist itu.",
      };
    }
    return { ...result, payload: { ...payload, id: playlistId } };
  }

  if (result.intent === "PLAY_SEARCH") {
    const originalKeyword = payload.keyword || payload.mood;
    if (!originalKeyword) {
      return {
        ...result,
        intent: "NO_ACTION",
        reply: "Aku butuh judul, artist, genre, atau mood untuk mencari lagu.",
      };
    }

    const resolvedKeyword = resolveMoodToKeyword(originalKeyword);
    let ids = await Manager.findSongIdsByKeyword(resolvedKeyword);

    if (ids.length === 0 && resolvedKeyword !== originalKeyword) {
      ids = await Manager.findSongIdsByKeyword(originalKeyword);
    }

    if (ids.length === 0) {
      return {
        ...result,
        intent: "NO_ACTION",
        payload: { ...payload, keyword: resolvedKeyword },
        reply: `Aku belum menemukan lagu untuk "${originalKeyword}". Coba keyword lain yang lebih spesifik.`,
      };
    }

    const limitedIds = ids.slice(0, 240);
    return {
      ...result,
      intent: "PLAY_BATCH",
      payload: { ...payload, keyword: resolvedKeyword, ids: limitedIds },
      reply: result.reply || `Aku putarkan hasil terbaik untuk "${originalKeyword}".`,
    };
  }

  if (result.intent === "AUTO_FIX_TITLES") {
    const response = await Manager.autoFixTitles();
    return { ...result, intent: "REFRESH_LIBRARY", reply: `${response.message} Judul dan artist sudah aku rapikan.` };
  }

  if (result.intent === "CLEAN_TRASH") {
    const response = await Manager.cleanUpTrash();
    return { ...result, intent: "REFRESH_LIBRARY", reply: response.message };
  }

  if (result.intent === "DEEP_CLEAN") {
    const response = await Manager.deepCleanLibrary();
    return { ...result, intent: "REFRESH_LIBRARY", reply: response.message };
  }

  if (result.intent === "SET_VOLUME") {
    const target = payload.level ?? payload.volume;
    if (target === undefined) return { ...result, intent: "NO_ACTION", reply: "Aku belum tahu volume targetnya." };
    return { ...result, payload: { ...payload, level: clampVolume(target) } };
  }

  if (result.intent === "CONTROL" && payload.action) {
    return { ...result, payload: { ...payload, action: normalizeAction(payload.action) } };
  }

  return result;
}

async function buildSystemPrompt(context: RequestContext | undefined) {
  const [totalSongs, playlists] = await Promise.all([
    prisma.song.count(),
    prisma.playlist.findMany({
      select: { id: true, name: true, description: true },
      orderBy: { name: "asc" },
      take: 80,
    }),
  ]);

  const playlistContext = playlists.length
    ? playlists.map((playlist) => `ID ${playlist.id}: ${playlist.name}${playlist.description ? ` (${playlist.description})` : ""}`).join("\n")
    : "No playlists yet.";

  return `
You are AURA, an AI waifu and music-room operator inside a private Next.js music player.
You answer mostly in Indonesian, warm and playful, but stay concise and useful.

Your job is to understand the user's request and return one JSON object only.
Do not include markdown outside JSON.

Available intents:
- PLAY_SEARCH: search by title, artist, genre, mood, or slang. payload {"keyword":"...","shuffle":boolean}
- PLAY_PLAYLIST: play an existing playlist. payload {"id":number} or {"playlistName":"..."}
- PLAY_ID: play a specific song ID. payload {"id":number}
- PLAY_BATCH: play specific song IDs. payload {"ids":[number]}
- PLAY_FAVORITES: play liked songs.
- QUEUE_ADD: add song(s) to queue. payload {"id":number} or {"ids":[number]}
- CONTROL: playback/UI control. payload {"action":"next|prev|pause|resume|shuffle_on|shuffle_off|repeat_one|repeat_all|repeat_off|open_queue|close_queue|open_lyrics|close_lyrics|like"}
- SET_VOLUME: set volume 0-100. payload {"level":number}
- LIKE: like or unlike current song.
- FIND_ADVANCED_DUPLICATES: check duplicate songs.
- MANAGE_PLAYLIST: fill or clean playlist by vibe. payload {"id":number or "playlistName":"...","mode":"ADD_MISSING|REMOVE_MISMATCH"}
- CREATE_PLAYLIST: create a smart playlist. payload {"keyword":"...","playlistName":"..."}
- AUTO_FIX_TITLES: normalize messy titles/artists.
- CLEAN_TRASH: delete broken empty song rows.
- DEEP_CLEAN: run safe library cleanup.
- NO_ACTION: normal chat, explanation, or unclear request.

Rules:
- For normal "play this mood/song" requests, prefer PLAY_SEARCH with a keyword. Do not invent song IDs.
- If the user asks for "galau", "sedih", "wibu", "anime", "fokus", "santai", "party", "phonk", "nightcore", map it to useful music keywords.
- Destructive hard delete is handled outside the model and requires explicit IDs. Do not choose delete intents.
- Always include payload.atmosphere as one of: default, rain, sunset, midnight, focus.
- Keep reply short unless reporting duplicate groups or database work.

Current context:
- Songs in database: ${totalSongs}
- Now playing: ${context?.nowPlaying || "None"}
- Volume: ${context?.currentVolume ?? "unknown"}%
- Time: ${context?.time || "unknown"}
- Current vibe: ${context?.currentVibe || "default"}
- Playlists:
${playlistContext}

Library excerpt for recognition:
${trimBlock(context?.library, MAX_LIBRARY_CONTEXT_CHARS) || "No library excerpt provided."}

Return JSON shape:
{
  "intent": "PLAY_SEARCH",
  "payload": {
    "keyword": "J-Pop",
    "atmosphere": "midnight",
    "shuffle": true
  },
  "reply": "Siap, aku putarkan J-Pop malam ini."
}
`.trim();
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AIRequest;
    const message = body.message?.trim();
    if (!message) {
      return NextResponse.json({ intent: "NO_ACTION", payload: {}, reply: "Pesannya masih kosong." });
    }

    console.log(`[AURA-API] User: ${message}`);

    const hardDelete = await handleHardDelete(message);
    if (hardDelete) return NextResponse.json(hardDelete);

    const autoTagging = await handleAutoTagging(message);
    if (autoTagging) return NextResponse.json(autoTagging);

    const researchResult = await handleResearchRequest(message);
    if (researchResult) {
      return NextResponse.json({
        ...researchResult,
        payload: {
          ...(researchResult.payload ?? {}),
          atmosphere: inferAtmosphere(message),
        },
      });
    }

    const localIntent = buildLocalIntent(message);
    if (localIntent) {
      return NextResponse.json(await postProcessResult(localIntent));
    }

    const system = await buildSystemPrompt(body.context);
    const user = `
Conversation history:
${trimBlock(body.history, MAX_HISTORY_CHARS) || "No previous history."}

User request:
${message}
`.trim();

    const requestedModel = body.modelName?.trim();
    const clientKey = typeof body.apiKey === "string" && body.apiKey.trim() ? body.apiKey.trim() : undefined;
    const clientProvider = typeof body.provider === "string" && body.provider.trim() ? body.provider.trim() : undefined;

    const preferGemini =
      clientProvider === "gemini" ||
      isGeminiModelId(requestedModel) ||
      (clientKey?.startsWith("AIza") ?? false) ||
      (process.env.AI_RESEARCH_PROVIDER ?? "").trim().toLowerCase() === "gemini";

    if (preferGemini) {
      try {
        const geminiModel = resolveGeminiMainModel(requestedModel);
        const raw = await runGeminiJson({
          model: geminiModel,
          system,
          user,
          temperature: 0.3,
          maxOutputTokens: 1400,
          apiKey: clientKey,
        });

        const parsed = parseJsonObject(raw);
        const aiResult = normalizeAIResult(parsed, "Aura siap bantu.", geminiModel);
        const result = await postProcessResult(aiResult);

        return NextResponse.json(result);
      } catch (error) {
        console.warn("[AURA-GEMINI] Falling back to Groq / OpenAI.", error);
      }
    }

    const client = getGroqClient(clientKey, clientProvider);
    if (!client) {
      return NextResponse.json({
        intent: "NO_ACTION",
        payload: { atmosphere: inferAtmosphere(message) },
        reply: "API Key belum terpasang. Masukkan API Key (Gemini/Groq/OpenRouter) di tombol kunci pojok kanan atas atau di .env.",
        degraded: true,
        model: "local-fallback",
      });
    }

    const model = isSafeModelId(requestedModel || "") ? (requestedModel as string) : resolveModel(requestedModel);
    const raw = await runGroqJson({
      model,
      system,
      user,
      temperature: 0.3,
      maxCompletionTokens: 1400,
      client,
    });

    const parsed = parseJsonObject(raw);
    const aiResult = normalizeAIResult(parsed, "Aura siap bantu.", model);
    const result = await postProcessResult(aiResult);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[AURA-ERROR]", error);
    return NextResponse.json({
      intent: "NO_ACTION",
      payload: {},
      reply: `Aura lagi error sebentar: ${error instanceof Error ? error.message : "Unknown error"}`,
      degraded: true,
    });
  }
}
