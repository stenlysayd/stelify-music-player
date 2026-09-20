import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

type SongSearchShape = {
  id: number;
  title: string;
  artist: string;
  album?: string | null;
  genre?: string | null;
  mood?: string | null;
};

type VibeRule = {
  allow: string[];
  reject?: string[];
  overrideReject?: string[];
  requireStrongMatch?: boolean;
};

const VIBE_RULES: Record<string, VibeRule> = {
  instrumental: {
    allow: [
      'instrumental',
      'score',
      'bgm',
      'cinematic',
      'orchestral',
      'orchestra',
      'classical',
      'ambient',
      'piano',
      'video game music',
      'gamelan',
      'jazz fusion',
    ],
    reject: ['pop', 'indonesian pop', 'dangdut', 'k-pop', 'j-pop', 'edm', 'dance', 'disco', 'rap', 'hip hop', 'hip-hop', 'r&b', 'vocaloid'],
    overrideReject: ['instrumental', 'orchestral version', 'orchestra version', '(orchestra)', 'score', 'bgm'],
    requireStrongMatch: true,
  },
  instrumen: {
    allow: ['instrumental', 'score', 'bgm', 'cinematic', 'orchestral', 'orchestra', 'classical', 'ambient', 'piano'],
    reject: ['pop', 'indonesian pop', 'dangdut', 'k-pop', 'j-pop', 'edm', 'dance', 'disco', 'rap', 'hip hop', 'hip-hop', 'r&b', 'vocaloid'],
    overrideReject: ['instrumental', 'orchestral version', 'orchestra version', '(orchestra)', 'score', 'bgm'],
    requireStrongMatch: true,
  },
  ost: { allow: ['ost', 'soundtrack', 'score', 'bgm', 'cinematic', 'orchestral', 'video game music'] },
  soundtrack: { allow: ['soundtrack', 'ost', 'score', 'bgm', 'cinematic', 'orchestral', 'video game music'] },
  rock: { allow: ['rock', 'metal', 'punk', 'grunge', 'emo', 'post-hardcore', 'alternative rock', 'indonesian rock', 'j-rock'] },
  metal: { allow: ['metal', 'rock', 'hardcore', 'punk'] },
  anime: { allow: ['anime', 'soundtrack', 'ost', 'touhou', 'j-pop', 'j-rock', 'vocaloid'] },
  'j-pop': { allow: ['j-pop', 'city pop', 'j-rock', 'anime'] },
  'j-rock': { allow: ['j-rock', 'j-pop', 'anime'] },
  wibu: { allow: ['anime', 'vocaloid', 'touhou', 'j-pop', 'j-rock', 'video game music', 'soundtrack'] },
  santai: { allow: ['chill', 'jazz', 'lo-fi', 'acoustic', 'r&b', 'soul', 'pop', 'indonesian pop', 'folk', 'ambient'] },
  kerja: { allow: ['chill', 'jazz', 'lo-fi', 'instrumental', 'focus', 'classical', 'soundtrack', 'folk', 'ambient'] },
  fokus: { allow: ['chill', 'jazz', 'lo-fi', 'instrumental', 'focus', 'classical', 'ambient', 'piano'] },
  tidur: { allow: ['chill', 'lo-fi', 'acoustic', 'ballad', 'sleep', 'ambient', 'calm'] },
  chill: { allow: ['chill', 'jazz', 'lo-fi', 'acoustic', 'r&b', 'soul', 'instrumental', 'focus', 'ambient'] },
  pop: { allow: ['pop', 'ballad', 'indonesian pop', 'western pop', 'k-pop', 'j-pop'] },
  party: { allow: ['electronic', 'edm', 'house', 'dance', 'phonk', 'remix', 'club', 'budots', 'hyperpop', 'party'] },
  galau: { allow: ['sad', 'ballad', 'indonesian pop', 'heartbroken', 'melancholic', 'emotional'] },
  indo: { allow: ['indonesian pop', 'pop', 'dangdut', 'indonesian rock'] },
};

const songSearchSelect = {
  id: true,
  title: true,
  artist: true,
  album: true,
  genre: true,
  mood: true,
};

const cleanString = (str: string | null) => {
  if (!str) return '';
  return str.toLowerCase().replace(/[\s\-_().,!"'\[\]]/g, '').trim();
};

const durationToSeconds = (d: string | null) => {
  if (!d) return 0;
  const parts = d.split(':').map(Number);
  if (parts.length !== 2) return 0;
  return parts[0] * 60 + parts[1];
};

const sanitizeTag = (val: unknown): string | null => {
  if (!val) return null;
  if (Array.isArray(val)) return val.join(', ');
  return String(val).replace(/[\[\]"]/g, '');
};

function getSongSearchText(song: SongSearchShape) {
  return [song.title, song.artist, song.album, song.genre, song.mood].filter(Boolean).join(' ').toLowerCase();
}

function getVibeRuleFromKeyword(keyword: string) {
  const clean = keyword.toLowerCase().trim();
  return Object.entries(VIBE_RULES).find(([key]) => clean.includes(key))?.[1] ?? null;
}

function matchesVibeRule(song: SongSearchShape, rule: VibeRule) {
  const text = getSongSearchText(song);
  const hasAllowed = rule.allow.some((keyword) => text.includes(keyword));
  if (!hasAllowed) return false;

  const rejected = rule.reject?.some((keyword) => text.includes(keyword)) ?? false;
  if (!rejected) return true;

  const hasRejectOverride = rule.overrideReject?.some((keyword) => text.includes(keyword)) ?? false;
  if (hasRejectOverride) return true;

  const evidenceText = [song.title, song.album, song.genre, song.mood].filter(Boolean).join(' ').toLowerCase();
  const hasStrongAllowed = rule.allow.some((keyword) => evidenceText.includes(keyword));
  return !rule.requireStrongMatch && hasStrongAllowed;
}

function buildKeywordWhere(keywords: string[]) {
  return {
    OR: keywords.flatMap((keyword) => [
      { title: { contains: keyword } },
      { artist: { contains: keyword } },
      { album: { contains: keyword } },
      { genre: { contains: keyword } },
      { mood: { contains: keyword } },
    ]),
  };
}

const deletePhysicalFile = async (relativePath: string | null) => {
  if (!relativePath || relativePath.startsWith('http')) return;
  try {
    const publicDir = path.resolve(process.cwd(), 'public');
    const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
    const normalized = path.posix.normalize(cleanPath.replace(/\\/g, '/'));

    // Boundary check: only allow files inside music/ or covers/
    if (!normalized.startsWith('music/') && !normalized.startsWith('covers/')) return;

    const fullPath = path.resolve(publicDir, normalized);
    if (!fullPath.startsWith(publicDir + path.sep)) return;

    await fs.promises.unlink(fullPath).catch(() => {});
  } catch (error) {
    console.error(`Failed to delete file ${relativePath}:`, error);
  }
};

export async function getUntaggedSongs(limit = 20) {
  return prisma.song.findMany({
    where: { OR: [{ genre: null }, { genre: '' }, { mood: null }, { mood: '' }] },
    take: limit,
    orderBy: { id: 'asc' },
    select: { id: true, title: true, artist: true, album: true, duration: true, audioUrl: true, genre: true, mood: true },
  });
}

export async function getSongsByRange(startId: number, endId: number, limit = 20) {
  return prisma.song.findMany({
    where: {
      id: { gte: startId, lte: endId },
    },
    take: limit,
    orderBy: { id: 'asc' },
    select: { id: true, title: true, artist: true, album: true, duration: true, audioUrl: true, genre: true, mood: true },
  });
}

export async function updateTagsBatch(updates: { id: number; genre?: unknown; mood?: unknown }[]) {
  const promises = updates.map((item) => {
    return prisma.song.update({
      where: { id: item.id },
      data: {
        genre: sanitizeTag(item.genre),
        mood: sanitizeTag(item.mood),
      },
    });
  });
  await prisma.$transaction(promises);
  return { count: updates.length };
}

export async function deleteSongsHard(ids: number[]) {
  const songs = await prisma.song.findMany({
    where: { id: { in: ids } },
    select: { id: true, audioUrl: true, coverUrl: true },
  });

  if (songs.length === 0) return { message: 'Gak ada lagu.' };

  for (const song of songs) {
    await deletePhysicalFile(song.audioUrl);
    if (song.coverUrl && !song.coverUrl.includes('default')) {
      const shareCount = await prisma.song.count({
        where: { coverUrl: song.coverUrl, id: { notIn: ids } },
      });
      if (shareCount === 0) {
        await deletePhysicalFile(song.coverUrl);
      }
    }
  }

  await prisma.song.deleteMany({ where: { id: { in: ids } } });
  return { message: `Berhasil musnahkan ${songs.length} lagu.` };
}

export async function findSmartDuplicates() {
  const songs = await prisma.song.findMany({
    select: { id: true, title: true, artist: true, duration: true },
    orderBy: { title: 'asc' },
  });

  const groups: Record<string, typeof songs> = {};

  for (const song of songs) {
    const simpleTitle = cleanString(song.title).substring(0, 15);
    const simpleArtist = cleanString(song.artist).substring(0, 5);
    const key = `${simpleTitle}|${simpleArtist}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(song);
  }

  const duplicates = Object.values(groups).filter((group) => group.length > 1);
  return duplicates.filter((group) => {
    const d1 = durationToSeconds(group[0].duration);
    const d2 = durationToSeconds(group[1].duration);
    return Math.abs(d1 - d2) < 5;
  });
}

export async function managePlaylistVibe(playlistId: number, mode: 'ADD_MISSING' | 'REMOVE_MISMATCH') {
  const playlist = await prisma.playlist.findUnique({
    where: { id: playlistId },
    include: { songs: true },
  });
  if (!playlist) return { message: 'Playlist gak ketemu.' };

  let targetVibe = '';
  let selectedRule: VibeRule | null = null;
  const pName = playlist.name.toLowerCase();

  for (const [key, rule] of Object.entries(VIBE_RULES)) {
    if (pName.includes(key)) {
      targetVibe = key.toUpperCase();
      selectedRule = rule;
      break;
    }
  }

  if (!targetVibe) {
    if (playlist.songs.length === 0) return { message: 'Playlist kosong & nama tidak spesifik.' };
    const counts: Record<string, number> = {};
    playlist.songs.forEach((song) => {
      if (song.genre) {
        song.genre.split(',').forEach((genre) => {
          const clean = genre.trim().toLowerCase();
          if (clean) counts[clean] = (counts[clean] || 0) + 1;
        });
      }
    });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    if (top) {
      targetVibe = top[0].toUpperCase();
      selectedRule = { allow: [top[0]] };
    }
  }

  if (!selectedRule) return { message: 'Vibe playlist belum bisa dipastikan.' };

  if (mode === 'ADD_MISSING') {
    const candidates = await prisma.song.findMany({
      where: {
        id: { notIn: playlist.songs.map((song) => song.id) },
        ...buildKeywordWhere(selectedRule.allow),
      },
      take: 120,
      select: songSearchSelect,
    });

    const matchedCandidates = candidates.filter((song) => matchesVibeRule(song, selectedRule)).slice(0, 20);
    if (matchedCandidates.length === 0) {
      return { message: `Playlist "${playlist.name}" (${targetVibe}) udah lengkap atau belum ada kandidat yang benar-benar cocok.` };
    }

    await prisma.playlist.update({
      where: { id: playlistId },
      data: { songs: { connect: matchedCandidates.map((song) => ({ id: song.id })) } },
    });
    return { message: `Menambahkan ${matchedCandidates.length} lagu ${targetVibe}.` };
  }

  if (mode === 'REMOVE_MISMATCH') {
    const impostors = playlist.songs.filter((song) => !matchesVibeRule(song, selectedRule));
    if (impostors.length === 0) return { message: 'Playlist isinya udah valid!' };

    await prisma.playlist.update({
      where: { id: playlistId },
      data: { songs: { disconnect: impostors.map((song) => ({ id: song.id })) } },
    });
    return { message: `Membuang ${impostors.length} lagu mismatch.` };
  }

  return { message: 'Mode error.' };
}

export async function autoFixTitles() {
  const songs = await prisma.song.findMany();
  let c = 0;
  const updates = [];
  const toTitle = (s: string) => s.replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());

  for (const s of songs) {
    const nt = toTitle(s.title);
    const na = toTitle(s.artist);
    if (nt !== s.title || na !== s.artist) {
      updates.push(prisma.song.update({ where: { id: s.id }, data: { title: nt, artist: na } }));
      c++;
    }
  }
  if (updates.length > 0) await prisma.$transaction(updates);
  return { message: `Fixed ${c} titles.` };
}

export async function createSmartPlaylist(keyword: string, playlistName: string) {
  const rule = getVibeRuleFromKeyword(keyword);
  const searchKeywords = rule?.allow ?? [keyword];
  const candidates = await prisma.song.findMany({
    where: buildKeywordWhere(searchKeywords),
    take: 250,
    select: songSearchSelect,
  });
  const songs = rule ? candidates.filter((song) => matchesVibeRule(song, rule)) : candidates;

  if (songs.length === 0) return { message: 'Lagu tidak ditemukan.' };
  await prisma.playlist.create({
    data: { name: playlistName, description: `Auto by Aura (${keyword})`, songs: { connect: songs.map((song) => ({ id: song.id })) } },
  });
  return { message: `Playlist ${playlistName} dibuat dengan ${songs.length} lagu.` };
}

export async function cleanUpTrash() {
  const res = await prisma.song.deleteMany({ where: { OR: [{ title: '' }, { audioUrl: '' }] } });
  return { message: `Deleted ${res.count} trash.` };
}

export async function deepCleanLibrary() {
  const songs = await prisma.song.findMany();
  let c = 0;
  const updates = [];
  const mapGenre = (g: string) => {
    if (!g) return '';
    const lower = g.toLowerCase().trim();
    if (['indo pop', 'pop indo'].includes(lower)) return 'Indonesian Pop';
    return g;
  };

  for (const s of songs) {
    let { title, genre } = s;
    let change = false;
    const cleanT = title.replace(/\(MP3_320K\)|\(Lyrics\)/gi, '').trim();
    if (cleanT !== title) {
      title = cleanT;
      change = true;
    }
    if (genre) {
      const cleanG = genre.split(',').map(mapGenre).join(', ');
      if (cleanG !== genre) {
        genre = cleanG;
        change = true;
      }
    }
    if (change) {
      updates.push(prisma.song.update({ where: { id: s.id }, data: { title, genre } }));
      c++;
    }
  }
  if (updates.length > 0) await prisma.$transaction(updates);
  return { message: `Deep Cleaned ${c} items.` };
}

export async function findSongIdsByKeyword(keyword: string) {
  const rule = getVibeRuleFromKeyword(keyword);
  const searchKeywords = rule?.allow ?? [keyword];
  const songs = await prisma.song.findMany({
    where: buildKeywordWhere(searchKeywords),
    select: songSearchSelect,
  });

  if (!rule) return songs.map((song) => song.id);
  return songs.filter((song) => matchesVibeRule(song, rule)).map((song) => song.id);
}
