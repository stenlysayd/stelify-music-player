import { jsonError, jsonOk } from "@/lib/http";
import { songExists } from "@/lib/services/songService";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    return jsonOk({ exists: await songExists(body.title, body.artist) });
  } catch (error) {
    console.error("POST /api/songs/check:", error);
    return jsonError(error);
  }
}
