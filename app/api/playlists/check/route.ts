import { jsonError, jsonOk, parsePositiveInt } from "@/lib/http";
import { getPlaylistIdsForSong } from "@/lib/services/playlistService";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawSongId = searchParams.get("songId");

    if (!rawSongId) {
      return jsonOk({ playlistIds: [] });
    }

    const songId = parsePositiveInt(rawSongId, "songId");
    return jsonOk({ playlistIds: await getPlaylistIdsForSong(songId) });
  } catch (error) {
    console.error("GET /api/playlists/check:", error);
    return jsonError(error);
  }
}
