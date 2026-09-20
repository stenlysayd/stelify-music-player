import { jsonError, jsonOk } from "@/lib/http";
import { listFavoriteSongs } from "@/lib/services/songService";

export const runtime = "nodejs";

export async function GET() {
  try {
    return jsonOk(await listFavoriteSongs());
  } catch (error) {
    console.error("GET /api/favorites:", error);
    return jsonError(error);
  }
}
