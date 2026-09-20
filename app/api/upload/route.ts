import { jsonError, jsonOk } from "@/lib/http";
import { saveAudioUpload } from "@/lib/services/uploadService";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return jsonOk({ error: "No file uploaded" }, { status: 400 });
    }

    const stored = await saveAudioUpload(file);
    return jsonOk({
      url: stored.audioUrl,
      duration: stored.duration,
      coverUrl: stored.coverUrl,
    });
  } catch (error) {
    console.error("POST /api/upload:", error);
    return jsonError(error);
  }
}
