type AIIntentResultLike = {
  intent: string;
  payload?: Record<string, unknown>;
  reply: string;
  model?: string;
  degraded?: boolean;
};

type GeminiGenerateOptions = {
  model: string;
  prompt: string;
  useGoogleSearch?: boolean;
  json?: boolean;
  temperature?: number;
  maxOutputTokens?: number;
  apiKey?: string;
};

type FirecrawlDocument = {
  url: string;
  title?: string;
  markdown: string;
};

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const FIRECRAWL_API_BASE = "https://api.firecrawl.dev/v2";
const DEFAULT_GEMINI_MAIN_MODEL = "gemini-2.0-flash";
const DEFAULT_GEMINI_EXTRACT_MODEL = "gemini-1.5-flash";
const MAX_RESEARCH_CONTEXT_CHARS = 28_000;
const MAX_CRAWL_PAGES = 8;

function getGeminiApiKey() {
  return process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim() || "";
}

function getFirecrawlApiKey() {
  return process.env.FIRECRAWL_API_KEY?.trim() || "";
}

export function isGeminiModelId(modelName: string | undefined) {
  return Boolean(modelName?.trim().toLowerCase().startsWith("gemini-"));
}

export function resolveGeminiMainModel(requested?: string) {
  if (isGeminiModelId(requested)) return requested!.trim();
  return process.env.GEMINI_MAIN_MODEL?.trim() || DEFAULT_GEMINI_MAIN_MODEL;
}

function resolveGeminiExtractModel() {
  return process.env.GEMINI_EXTRACT_MODEL?.trim() || DEFAULT_GEMINI_EXTRACT_MODEL;
}

function extractTextFromGeminiResponse(data: Record<string, unknown>) {
  const candidates = data.candidates as Array<{
    content?: { parts?: Array<{ text?: string }> };
  }> | undefined;

  return candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim() || "";
}

function extractSourcesFromGeminiResponse(data: Record<string, unknown>) {
  const candidates = data.candidates as Array<{
    groundingMetadata?: {
      groundingChunks?: Array<{ web?: { uri?: string; title?: string } }>;
    };
  }> | undefined;

  const chunks = candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
  const sources = chunks
    .map((chunk) => chunk.web)
    .filter((web): web is { uri: string; title?: string } => Boolean(web?.uri))
    .filter((source, index, arr) => arr.findIndex((item) => item.uri === source.uri) === index)
    .slice(0, 6);

  return sources;
}

function withSources(text: string, sources: Array<{ uri: string; title?: string }>) {
  if (sources.length === 0) return text;
  const sourceLines = sources.map((source, index) => `- [${source.title || `Sumber ${index + 1}`}](${source.uri})`);
  return `${text}\n\nSumber:\n${sourceLines.join("\n")}`;
}

export async function runGeminiText(options: GeminiGenerateOptions) {
  const apiKey = options.apiKey?.trim() || getGeminiApiKey();
  if (!apiKey) throw new Error("GEMINI_API_KEY belum dipasang");

  const body: Record<string, unknown> = {
    contents: [
      {
        role: "user",
        parts: [{ text: options.prompt }],
      },
    ],
    generationConfig: {
      temperature: options.temperature ?? 0.35,
      maxOutputTokens: options.maxOutputTokens ?? 1600,
      ...(options.json ? { responseMimeType: "application/json" } : {}),
    },
  };

  if (options.useGoogleSearch) {
    body.tools = [{ google_search: {} }];
  }

  const response = await fetch(`${GEMINI_API_BASE}/${encodeURIComponent(options.model)}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as Record<string, unknown>;

  if (!response.ok) {
    const message = typeof data.error === "object" && data.error && "message" in data.error
      ? String((data.error as { message?: unknown }).message)
      : `Gemini request failed (${response.status})`;
    throw new Error(message);
  }

  return {
    text: extractTextFromGeminiResponse(data),
    sources: extractSourcesFromGeminiResponse(data),
  };
}

export async function runGeminiJson(options: {
  model: string;
  system: string;
  user: string;
  temperature?: number;
  maxOutputTokens?: number;
  apiKey?: string;
}) {
  const prompt = `${options.system}\n\n${options.user}\n\nReturn JSON only.`;
  const response = await runGeminiText({
    model: options.model,
    prompt,
    json: true,
    temperature: options.temperature ?? 0.25,
    maxOutputTokens: options.maxOutputTokens ?? 1400,
    apiKey: options.apiKey,
  });

  return response.text;
}

function extractUrls(message: string) {
  return [...new Set(message.match(/https?:\/\/[^\s<>()"]+/gi) ?? [])]
    .map((url) => url.replace(/[),.;]+$/g, ""))
    .slice(0, 5);
}

function isResearchLike(message: string) {
  const lower = message.toLowerCase();
  const explicitWeb = /(google|search web|cari di web|cari internet|internet|web|berita|news|update terbaru|latest|recent|hari ini|sekarang|docs terbaru|dokumentasi terbaru)/i.test(lower);
  const localMusic = /(?:putar(?:in)?|mainkan|play|setel(?:kan)?|carikan|cari)(?:\s+lagu|\s+musik)?/i.test(lower);
  if (localMusic && !explicitWeb) return false;

  return /(google|search web|web search|cari di web|cari internet|internet|terbaru|latest|recent|hari ini|sekarang|berita|news|update|rilis|harga|jadwal|status|siapa presiden|ceo|peraturan terbaru|docs terbaru)/i.test(lower);
}

function wantsCrawl(message: string) {
  return /(crawl|jelajahi|seluruh website|semua halaman|banyak halaman|crawl docs|dokumentasi lengkap|site map|sitemap)/i.test(message);
}

function wantsUrlRead(message: string, urls: string[]) {
  if (urls.length === 0) return false;
  return /(baca|ringkas|summarize|scrape|crawl|analisis|cek|url|link|halaman|artikel|docs|dokumentasi)/i.test(message) || urls.length > 0;
}

function trimContext(value: string, maxChars = MAX_RESEARCH_CONTEXT_CHARS) {
  return value.length > maxChars ? `${value.slice(0, maxChars)}\n...[dipangkas]` : value;
}

async function firecrawlFetch(path: string, init: RequestInit) {
  const apiKey = getFirecrawlApiKey();
  if (!apiKey) throw new Error("FIRECRAWL_API_KEY belum dipasang");

  const response = await fetch(`${FIRECRAWL_API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...(init.headers ?? {}),
    },
  });

  const data = (await response.json()) as Record<string, unknown>;

  if (!response.ok) {
    const message = typeof data.error === "string" ? data.error : `Firecrawl request failed (${response.status})`;
    throw new Error(message);
  }

  return data;
}

async function scrapeUrl(url: string): Promise<FirecrawlDocument> {
  const data = await firecrawlFetch("/scrape", {
    method: "POST",
    body: JSON.stringify({
      url,
      formats: ["markdown"],
      onlyMainContent: true,
      onlyCleanContent: true,
      removeBase64Images: true,
      blockAds: true,
      timeout: 60000,
    }),
  });

  const payload = (data.data ?? data) as {
    markdown?: string;
    metadata?: { title?: string; sourceURL?: string; url?: string };
  };

  return {
    url: payload.metadata?.sourceURL || payload.metadata?.url || url,
    title: payload.metadata?.title,
    markdown: payload.markdown || "",
  };
}

async function crawlUrl(url: string, prompt: string): Promise<FirecrawlDocument[]> {
  const started = await firecrawlFetch("/crawl", {
    method: "POST",
    body: JSON.stringify({
      url,
      prompt,
      limit: MAX_CRAWL_PAGES,
      maxDiscoveryDepth: 1,
      crawlEntireDomain: false,
      allowExternalLinks: false,
      scrapeOptions: {
        formats: ["markdown"],
        onlyMainContent: true,
        onlyCleanContent: true,
        removeBase64Images: true,
        blockAds: true,
        timeout: 60000,
      },
    }),
  });

  const crawlId = typeof started.id === "string" ? started.id : "";
  if (!crawlId) throw new Error("Firecrawl tidak mengembalikan crawl id");

  for (let attempt = 0; attempt < 8; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const status = await firecrawlFetch(`/crawl/${encodeURIComponent(crawlId)}`, { method: "GET" });
    if (status.status === "failed") throw new Error("Firecrawl crawl gagal");
    if (status.status === "completed") {
      const documents = (status.data as Array<{
        markdown?: string;
        metadata?: { title?: string; sourceURL?: string; url?: string };
      }> | undefined) ?? [];

      return documents
        .map((document) => ({
          url: document.metadata?.sourceURL || document.metadata?.url || url,
          title: document.metadata?.title,
          markdown: document.markdown || "",
        }))
        .filter((document) => document.markdown.trim().length > 0)
        .slice(0, MAX_CRAWL_PAGES);
    }
  }

  throw new Error(`Crawl masih berjalan. Coba lagi nanti dengan job id: ${crawlId}`);
}

async function summarizeDocuments(message: string, documents: FirecrawlDocument[]) {
  const docsContext = documents
    .map((doc, index) => [
      `SOURCE ${index + 1}: ${doc.title || "Untitled"}`,
      `URL: ${doc.url}`,
      trimContext(doc.markdown, Math.floor(MAX_RESEARCH_CONTEXT_CHARS / Math.max(1, documents.length))),
    ].join("\n"))
    .join("\n\n---\n\n");

  const prompt = `
Kamu adalah Aura, assistant riset web untuk user Indonesia.
Jawab permintaan user berdasarkan konten Firecrawl di bawah.
Jangan mengarang di luar konten. Kalau konten tidak cukup, katakan bagian mana yang tidak cukup.
Ringkas, praktis, dan sertakan link sumber di akhir.

Permintaan user:
${message}

Konten:
${docsContext}
`.trim();

  const model = resolveGeminiExtractModel();
  const result = await runGeminiText({
    model,
    prompt,
    temperature: 0.2,
    maxOutputTokens: 1800,
  });

  const explicitSources = documents
    .map((doc, index) => ({ uri: doc.url, title: doc.title || `Sumber ${index + 1}` }))
    .filter((source, index, arr) => arr.findIndex((item) => item.uri === source.uri) === index)
    .slice(0, 8);

  return {
    text: withSources(result.text, explicitSources),
    model,
  };
}

export async function handleResearchRequest(message: string): Promise<AIIntentResultLike | null> {
  const urls = extractUrls(message);
  const hasUrlRead = wantsUrlRead(message, urls);
  const hasResearchNeed = isResearchLike(message);

  if (!hasUrlRead && !hasResearchNeed) return null;

  try {
    if (hasUrlRead) {
      if (!getFirecrawlApiKey()) {
        return {
          intent: "NO_ACTION",
          payload: {},
          reply: "Aku bisa baca/crawl URL dengan Firecrawl, tapi FIRECRAWL_API_KEY belum dipasang.",
          degraded: true,
          model: "firecrawl",
        };
      }

      const documents = wantsCrawl(message)
        ? await crawlUrl(urls[0], message)
        : await Promise.all(urls.slice(0, 3).map((url) => scrapeUrl(url)));

      const summary = await summarizeDocuments(message, documents);
      return {
        intent: "NO_ACTION",
        payload: {},
        reply: summary.text,
        model: `firecrawl + ${summary.model}`,
      };
    }

    if (hasResearchNeed) {
      const model = resolveGeminiMainModel();
      const prompt = `
Kamu adalah Aura, assistant riset web.
Gunakan Google Search grounding untuk info baru/current.
Jawab dalam Bahasa Indonesia, singkat tapi lengkap.
Jika ada sumber dari grounding, gunakan sebagai dasar jawaban.

Pertanyaan user:
${message}
`.trim();

      const response = await runGeminiText({
        model,
        prompt,
        useGoogleSearch: true,
        temperature: 0.25,
        maxOutputTokens: 1800,
      });

      return {
        intent: "NO_ACTION",
        payload: {},
        reply: withSources(response.text, response.sources),
        model: `${model} + google_search`,
      };
    }
  } catch (error) {
    return {
      intent: "NO_ACTION",
      payload: {},
      reply: `Mode riset gagal sebentar: ${error instanceof Error ? error.message : "Unknown error"}`,
      degraded: true,
      model: "research-fallback",
    };
  }

  return null;
}
