import { jsonError, jsonOk } from "@/lib/http";
import { createPlaylist, listPlaylists } from "@/lib/services/playlistService";

export const runtime = "nodejs";

export async function GET() {
  try {
    return jsonOk(await listPlaylists());
  } catch (error) {
    console.error("GET /api/playlists:", error);
    return jsonError(error);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    return jsonOk(await createPlaylist(body), { status: 201 });
  } catch (error) {
    console.error("POST /api/playlists:", error);
    return jsonError(error);
  }
}
