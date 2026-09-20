import { Prisma } from "@prisma/client";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { deletePublicAsset, savePlaylistCover } from "./uploadService";

export function listPlaylists() {
  return prisma.playlist.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { songs: true } } },
  });
}

export async function getPlaylistById(id: number) {
  const playlist = await prisma.playlist.findUnique({
    where: { id },
    include: { songs: true },
  });

  if (!playlist) {
    throw new AppError("Playlist tidak ditemukan", 404);
  }

  return playlist;
}

function normalizeSongIds(value: unknown) {
  if (!Array.isArray(value)) return [];

  const ids = value
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);

  return [...new Set(ids)];
}

export async function createPlaylist(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new AppError("Payload playlist tidak valid", 400);
  }

  const body = payload as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : undefined;
  const songIds = normalizeSongIds(body.songIds);

  if (!name) {
    throw new AppError("Nama playlist wajib diisi", 400);
  }

  return prisma.playlist.create({
    data: {
      name,
      description,
      songs: songIds.length > 0 ? { connect: songIds.map((id) => ({ id })) } : undefined,
    },
  });
}

export async function updatePlaylistMetadata(id: number, formData: FormData) {
  const currentPlaylist = await getPlaylistById(id);
  const nameValue = formData.get("name");
  const descriptionValue = formData.get("description");
  const cover = formData.get("cover");

  const name = typeof nameValue === "string" ? nameValue.trim() : "";
  const description = typeof descriptionValue === "string" ? descriptionValue.trim() : "";

  if (!name) {
    throw new AppError("Nama playlist wajib diisi", 400);
  }

  const coverUrl = cover instanceof File ? await savePlaylistCover(cover, id) : null;

  try {
    const updatedPlaylist = await prisma.playlist.update({
      where: { id },
      data: {
        name,
        description,
        ...(coverUrl ? { coverUrl } : {}),
      },
    });

    if (coverUrl && currentPlaylist.coverUrl) {
      await deletePublicAsset(currentPlaylist.coverUrl);
    }

    return updatedPlaylist;
  } catch (error) {
    if (coverUrl) await deletePublicAsset(coverUrl);
    throw error;
  }
}

export async function updatePlaylistSongs(id: number, payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new AppError("Payload playlist tidak valid", 400);
  }

  const body = payload as Record<string, unknown>;
  const songId = Number(body.songId);
  const action = body.action;

  if (!Number.isInteger(songId) || songId <= 0) {
    throw new AppError("songId tidak valid", 400);
  }

  if (action !== "add" && action !== "remove") {
    throw new AppError("Action playlist tidak valid", 400);
  }

  const playlist = await getPlaylistById(id);
  const alreadyExists = playlist.songs.some((song) => song.id === songId);

  if (action === "add") {
    if (alreadyExists) {
      return {
        message: "Song already in playlist",
        alreadyAdded: true,
      };
    }

    return prisma.playlist.update({
      where: { id },
      data: { songs: { connect: { id: songId } } },
      include: { songs: true },
    });
  }

  if (!alreadyExists) {
    return { message: "Song not in playlist" };
  }

  return prisma.playlist.update({
    where: { id },
    data: { songs: { disconnect: { id: songId } } },
    include: { songs: true },
  });
}

export async function deletePlaylist(id: number) {
  const playlist = await getPlaylistById(id);

  try {
    await prisma.playlist.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new AppError("Playlist tidak ditemukan", 404);
    }

    throw error;
  }

  await deletePublicAsset(playlist.coverUrl);
  return { message: "Playlist deleted" };
}

export async function getPlaylistIdsForSong(songId: number) {
  const playlists = await prisma.playlist.findMany({
    where: {
      songs: {
        some: { id: songId },
      },
    },
    select: { id: true },
  });

  return playlists.map((playlist) => playlist.id);
}
