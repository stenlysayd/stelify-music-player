import { jsonError, jsonOk, parsePositiveInt } from "@/lib/http";
import { deleteSong, getSongById, updateSong } from "@/lib/services/songService";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    return jsonOk(await getSongById(parsePositiveInt(id, "songId")));
  } catch (error) {
    console.error("GET /api/songs/[id]:", error);
    return jsonError(error);
  }
}

export async function PATCH(req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = await req.json();
    return jsonOk(await updateSong(parsePositiveInt(id, "songId"), body));
  } catch (error) {
    console.error("PATCH /api/songs/[id]:", error);
    return jsonError(error);
  }
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    return jsonOk(await deleteSong(parsePositiveInt(id, "songId")));
  } catch (error) {
    console.error("DELETE /api/songs/[id]:", error);
    return jsonError(error);
  }
}
