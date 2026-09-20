import { jsonError, jsonOk } from "@/lib/http";
import { recordSongPlay } from "@/lib/services/analyticsService";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    return jsonOk(await recordSongPlay(Number(body.songId)));
  } catch (error) {
    console.error("POST /api/analytics/record:", error);
    return jsonError(error);
  }
}
