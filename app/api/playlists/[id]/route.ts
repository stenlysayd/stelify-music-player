import { jsonError, jsonOk, parsePositiveInt } from "@/lib/http";
import {
  deletePlaylist,
  getPlaylistById,
  updatePlaylistMetadata,
  updatePlaylistSongs,
} from "@/lib/services/playlistService";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    return jsonOk(await getPlaylistById(parsePositiveInt(id, "playlistId")));
  } catch (error) {
    console.error("GET /api/playlists/[id]:", error);
    return jsonError(error);
  }
}

export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const playlistId = parsePositiveInt(id, "playlistId");
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      return jsonOk(await updatePlaylistMetadata(playlistId, await req.formData()));
    }

    return jsonOk(await updatePlaylistSongs(playlistId, await req.json()));
  } catch (error) {
    console.error("PATCH /api/playlists/[id]:", error);
    return jsonError(error);
  }
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    return jsonOk(await deletePlaylist(parsePositiveInt(id, "playlistId")));
  } catch (error) {
    console.error("DELETE /api/playlists/[id]:", error);
    return jsonError(error);
  }
}
