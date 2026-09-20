import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

export async function recordSongPlay(songId: number) {
  if (!Number.isInteger(songId) || songId <= 0) {
    throw new AppError("Song ID required", 400);
  }

  const song = await prisma.song.findUnique({
    where: { id: songId },
    select: { id: true },
  });

  if (!song) {
    throw new AppError("Lagu tidak ditemukan", 404);
  }

  await prisma.$transaction([
    prisma.song.update({
      where: { id: songId },
      data: { playCount: { increment: 1 } },
    }),
    prisma.history.create({
      data: { songId },
    }),
  ]);

  return { success: true };
}

export async function getAnalyticsStats() {
  const [mostPlayed, history] = await Promise.all([
    prisma.song.findMany({
      orderBy: { playCount: "desc" },
      take: 10,
    }),
    prisma.history.findMany({
      orderBy: { playedAt: "desc" },
      take: 20,
      include: { song: true },
    }),
  ]);

  return { mostPlayed, history };
}
