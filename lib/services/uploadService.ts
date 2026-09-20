import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { parseFile } from "music-metadata";
import { AppError } from "@/lib/errors";

const AUDIO_DIR = "music";
const COVER_DIR = "covers";
const MAX_AUDIO_SIZE = 50 * 1024 * 1024;
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const ALLOWED_AUDIO_EXTENSIONS = new Set([".mp3", ".wav", ".ogg", ".m4a", ".aac", ".flac"]);
const ALLOWED_IMAGE_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/jpg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export interface StoredAudio {
  audioUrl: string;
  coverUrl: string | null;
  duration: string;
}

function formatDuration(seconds?: number) {
  if (!seconds || seconds < 0) return "0:00";

  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

function getPublicPath(relativePath: string) {
  const publicDir = path.resolve(process.cwd(), "public");
  const fullPath = path.resolve(publicDir, relativePath);

  if (!fullPath.startsWith(publicDir + path.sep)) {
    throw new AppError("Path file tidak valid", 400);
  }

  return fullPath;
}

function sanitizeBaseName(name: string) {
  const parsed = path.parse(name);
  const base = parsed.name
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9.\-_]/g, "")
    .slice(0, 120);

  return base || "audio";
}

function assertAudioFile(file: File) {
  if (!file || file.size === 0) {
    throw new AppError("File audio wajib diisi", 400);
  }

  if (file.size > MAX_AUDIO_SIZE) {
    throw new AppError("Ukuran audio maksimal 50MB", 413);
  }

  const ext = path.extname(file.name).toLowerCase();
  if (!file.type.startsWith("audio/") || !ALLOWED_AUDIO_EXTENSIONS.has(ext)) {
    throw new AppError("File harus berupa audio MP3/WAV/OGG/M4A/AAC/FLAC", 400);
  }
}

function getImageExtension(file: File) {
  const extension = ALLOWED_IMAGE_TYPES.get(file.type);
  if (!extension) {
    throw new AppError("Cover harus berupa JPG, PNG, atau WEBP", 400);
  }

  return extension;
}

async function storePublicFile(folder: string, filename: string, data: Buffer) {
  const uploadDir = getPublicPath(folder);
  await mkdir(uploadDir, { recursive: true });

  const relativePath = path.posix.join(folder, filename);
  const fullPath = getPublicPath(relativePath);
  await writeFile(fullPath, data);

  return `/${relativePath}`;
}

async function extractEmbeddedCover(filePath: string, uniqueBase: string) {
  const metadata = await parseFile(filePath);
  const picture = metadata.common.picture?.[0];

  if (!picture) {
    return {
      coverUrl: null,
      duration: formatDuration(metadata.format.duration),
    };
  }

  const imageExtension = ALLOWED_IMAGE_TYPES.get(picture.format) ?? "jpg";
  const coverUrl = await storePublicFile(
    COVER_DIR,
    `${uniqueBase}-cover.${imageExtension}`,
    Buffer.from(picture.data)
  );

  return {
    coverUrl,
    duration: formatDuration(metadata.format.duration),
  };
}

export async function saveAudioUpload(file: File): Promise<StoredAudio> {
  assertAudioFile(file);

  const ext = path.extname(file.name).toLowerCase();
  const uniqueBase = `${Date.now()}-${randomUUID()}-${sanitizeBaseName(file.name)}`;
  const filename = `${uniqueBase}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const audioUrl = await storePublicFile(AUDIO_DIR, filename, buffer);
  const audioPath = getPublicPath(audioUrl.slice(1));

  try {
    const metadata = await extractEmbeddedCover(audioPath, uniqueBase);
    return {
      audioUrl,
      coverUrl: metadata.coverUrl,
      duration: metadata.duration,
    };
  } catch (error) {
    console.warn("Metadata audio gagal dibaca:", error);
    return {
      audioUrl,
      coverUrl: null,
      duration: "0:00",
    };
  }
}

export async function savePlaylistCover(file: File, playlistId: number) {
  if (!file || file.size === 0) return null;

  if (file.size > MAX_IMAGE_SIZE) {
    throw new AppError("Ukuran cover maksimal 8MB", 413);
  }

  const extension = getImageExtension(file);
  const filename = `playlist-${playlistId}-${Date.now()}-${randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  return storePublicFile(COVER_DIR, filename, buffer);
}

export async function deletePublicAsset(url?: string | null) {
  if (!url || url.startsWith("http")) return;

  const relativePath = url.startsWith("/") ? url.slice(1) : url;
  const normalized = path.posix.normalize(relativePath.replace(/\\/g, "/"));

  // Only allow deleting assets strictly within music/ or covers/
  if (!normalized.startsWith(`${AUDIO_DIR}/`) && !normalized.startsWith(`${COVER_DIR}/`)) {
    return;
  }

  const fullPath = getPublicPath(normalized);

  try {
    await unlink(fullPath);
  } catch (error) {
    const maybeNodeError = error as NodeJS.ErrnoException;
    if (maybeNodeError.code !== "ENOENT") {
      console.warn(`Gagal hapus file ${url}:`, error);
    }
  }
}
