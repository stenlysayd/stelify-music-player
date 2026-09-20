import { Prisma } from "@prisma/client";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { deletePublicAsset, saveAudioUpload } from "./uploadService";

export function listSongs() {
  return prisma.song.findMany({
    orderBy: { id: "desc" },
  });
}

export function listFavoriteSongs() {
  return prisma.song.findMany({
    where: { isLiked: true },
    orderBy: { id: "desc" },
  });
}

export async function getSongById(id: number) {
  const song = await prisma.song.findUnique({ where: { id } });

  if (!song) {
    throw new AppError("Lagu tidak ditemukan", 404);
  }

  return song;
}

export async function songExists(title: unknown, artist: unknown) {
  if (typeof title !== "string" || typeof artist !== "string") {
    return false;
  }

  const safeTitle = title.trim();
  const safeArtist = artist.trim();
  if (!safeTitle || !safeArtist) return false;

  const existingSong = await prisma.song.findFirst({
    where: {
      title: { equals: safeTitle },
      artist: { equals: safeArtist },
    },
    select: { id: true },
  });

  return Boolean(existingSong);
}

function optionalText(value: FormDataEntryValue | null, fallback: string) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

export async function createSongFromForm(formData: FormData) {
  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new AppError("File audio wajib diisi", 400);
  }

  const stored = await saveAudioUpload(file);

  try {
    return await prisma.song.create({
      data: {
        title: optionalText(formData.get("title"), file.name.replace(/\.[^/.]+$/, "")),
        artist: optionalText(formData.get("artist"), "Unknown Artist"),
        album: optionalText(formData.get("album"), "Unknown Album"),
        audioUrl: stored.audioUrl,
        coverUrl: stored.coverUrl,
        duration: stored.duration,
        lyrics: optionalText(formData.get("lyrics"), ""),
      },
    });
  } catch (error) {
    await Promise.all([
      deletePublicAsset(stored.audioUrl),
      deletePublicAsset(stored.coverUrl),
    ]);
    throw error;
  }
}

function setTextIfPresent(
  data: Prisma.SongUpdateInput,
  source: Record<string, unknown>,
  key: "title" | "artist" | "album" | "lyrics" | "genre" | "mood"
) {
  if (!(key in source)) return;

  const value = source[key];
  if (value === null) {
    if (key === "title" || key === "artist") {
      throw new AppError(`${key} tidak boleh kosong`, 400);
    }

    switch (key) {
      case "album":
        data.album = null;
        break;
      case "lyrics":
        data.lyrics = null;
        break;
      case "genre":
        data.genre = null;
        break;
      case "mood":
        data.mood = null;
        break;
    }
    return;
  }

  if (typeof value !== "string") {
    throw new AppError(`${key} harus berupa teks`, 400);
  }

  const trimmed = value.trim();
  if ((key === "title" || key === "artist") && !trimmed) {
    throw new AppError(`${key} tidak boleh kosong`, 400);
  }

  switch (key) {
    case "title":
      data.title = trimmed;
      break;
    case "artist":
      data.artist = trimmed;
      break;
    case "album":
      data.album = trimmed;
      break;
    case "lyrics":
      data.lyrics = trimmed;
      break;
    case "genre":
      data.genre = trimmed;
      break;
    case "mood":
      data.mood = trimmed;
      break;
  }
}

export async function updateSong(id: number, payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new AppError("Payload update tidak valid", 400);
  }

  const source = payload as Record<string, unknown>;
  const data: Prisma.SongUpdateInput = {};

  if ("isLiked" in source) {
    if (typeof source.isLiked !== "boolean") {
      throw new AppError("isLiked harus boolean", 400);
    }
    data.isLiked = source.isLiked;
  }

  setTextIfPresent(data, source, "title");
  setTextIfPresent(data, source, "artist");
  setTextIfPresent(data, source, "album");
  setTextIfPresent(data, source, "lyrics");
  setTextIfPresent(data, source, "genre");
  setTextIfPresent(data, source, "mood");

  if (Object.keys(data).length === 0) {
    return getSongById(id);
  }

  try {
    return await prisma.song.update({
      where: { id },
      data,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new AppError("Lagu tidak ditemukan", 404);
    }

    throw error;
  }
}

export async function deleteSong(id: number) {
  const song = await getSongById(id);

  await prisma.song.delete({ where: { id } });

  let shouldDeleteCover = false;
  if (song.coverUrl) {
    const remainingWithCover = await prisma.song.count({
      where: { coverUrl: song.coverUrl },
    });
    if (remainingWithCover === 0) {
      shouldDeleteCover = true;
    }
  }

  await Promise.all([
    deletePublicAsset(song.audioUrl),
    shouldDeleteCover ? deletePublicAsset(song.coverUrl) : Promise.resolve(),
  ]);

  return { message: "Deleted" };
}
