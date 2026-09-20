import { jsonError, jsonOk } from "@/lib/http";
import { createSongFromForm, listSongs } from "@/lib/services/songService";

export const runtime = "nodejs";

export async function GET() {
  try {
    return jsonOk(await listSongs());
  } catch (error) {
    console.error("GET /api/songs:", error);
    return jsonError(error);
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const song = await createSongFromForm(formData);
    return jsonOk(song, { status: 201 });
  } catch (error) {
    console.error("POST /api/songs:", error);
    return jsonError(error);
  }
}
