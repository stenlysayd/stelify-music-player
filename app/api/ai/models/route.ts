import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface DetectedModel {
  id: string;
  label: string;
  provider: "gemini" | "groq" | "openrouter" | "openai" | "custom";
  description?: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";

    if (!rawKey) {
      return NextResponse.json(
        { success: false, error: "API Key tidak boleh kosong." },
        { status: 400 }
      );
    }

    // 1. Deteksi Google Gemini (dimulai dengan "AIza" atau panjang ~39 char)
    if (rawKey.startsWith("AIza") || rawKey.length === 39) {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(rawKey)}`,
        { method: "GET", headers: { "Content-Type": "application/json" } }
      );
      const geminiData = await geminiRes.json().catch(() => null);

      if (geminiRes.ok && geminiData?.models) {
        const validModels: DetectedModel[] = geminiData.models
          .filter((m: { name?: string; supportedGenerationMethods?: string[] }) => {
            const name = m.name || "";
            const methods = m.supportedGenerationMethods || [];
            return name.includes("gemini") && methods.includes("generateContent");
          })
          .map((m: { name: string; displayName?: string; description?: string }) => {
            const shortId = m.name.replace("models/", "");
            return {
              id: shortId,
              label: m.displayName || shortId.replace(/-/g, " ").toUpperCase(),
              provider: "gemini",
              description: m.description || "Google Gemini Model"
            };
          });

        // Urutkan model unggulan di depan
        const priorityOrder = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-2.5-flash", "gemini-1.5-pro"];
        validModels.sort((a, b) => {
          const idxA = priorityOrder.indexOf(a.id);
          const idxB = priorityOrder.indexOf(b.id);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
          return a.id.localeCompare(b.id);
        });

        return NextResponse.json({
          success: true,
          provider: "gemini",
          models: validModels
        });
      } else if (geminiData?.error) {
        return NextResponse.json(
          { success: false, error: `Google Gemini: ${geminiData.error.message || "Invalid API Key"}` },
          { status: 400 }
        );
      }
    }

    // 2. Deteksi Groq Cloud (dimulai dengan "gsk_")
    if (rawKey.startsWith("gsk_")) {
      const groqRes = await fetch("https://api.groq.com/openai/v1/models", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${rawKey}`,
          "Content-Type": "application/json"
        }
      });
      const groqData = await groqRes.json().catch(() => null);

      if (groqRes.ok && Array.isArray(groqData?.data)) {
        const validModels: DetectedModel[] = groqData.data
          .filter((m: { id?: string }) => {
            const id = (m.id || "").toLowerCase();
            return !id.includes("whisper") && !id.includes("guard");
          })
          .map((m: { id: string; owned_by?: string }) => ({
            id: m.id,
            label: m.id.replace(/-/g, " ").toUpperCase(),
            provider: "groq",
            description: `Groq Cloud (${m.owned_by || "Meta/Mistral"})`
          }));

        // Prioritaskan model populer
        const priorityOrder = [
          "llama-3.3-70b-versatile",
          "llama-3.1-8b-instant",
          "mixtral-8x7b-32768",
          "deepseek-r1-distill-llama-70b",
          "gemma2-9b-it"
        ];
        validModels.sort((a, b) => {
          const idxA = priorityOrder.indexOf(a.id);
          const idxB = priorityOrder.indexOf(b.id);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
          return a.id.localeCompare(b.id);
        });

        return NextResponse.json({
          success: true,
          provider: "groq",
          models: validModels
        });
      } else if (groqData?.error) {
        return NextResponse.json(
          { success: false, error: `Groq: ${groqData.error.message || "Invalid API Key"}` },
          { status: 400 }
        );
      }
    }

    // 3. Deteksi OpenRouter (dimulai dengan "sk-or-")
    if (rawKey.startsWith("sk-or-")) {
      const orRes = await fetch("https://openrouter.ai/api/v1/models", {
        headers: {
          Authorization: `Bearer ${rawKey}`,
          "Content-Type": "application/json"
        }
      });
      const orData = await orRes.json().catch(() => null);

      if (orRes.ok && Array.isArray(orData?.data)) {
        const validModels: DetectedModel[] = orData.data.slice(0, 50).map((m: { id: string; name?: string }) => ({
          id: m.id,
          label: m.name || m.id,
          provider: "openrouter",
          description: "OpenRouter AI"
        }));

        return NextResponse.json({
          success: true,
          provider: "openrouter",
          models: validModels
        });
      } else if (orData?.error) {
        return NextResponse.json(
          { success: false, error: `OpenRouter: ${orData.error.message || "Invalid API Key"}` },
          { status: 400 }
        );
      }
    }

    // 4. Deteksi OpenAI / Compatible (dimulai dengan "sk-")
    if (rawKey.startsWith("sk-")) {
      const oaiRes = await fetch("https://api.openai.com/v1/models", {
        headers: {
          Authorization: `Bearer ${rawKey}`,
          "Content-Type": "application/json"
        }
      });
      const oaiData = await oaiRes.json().catch(() => null);

      if (oaiRes.ok && Array.isArray(oaiData?.data)) {
        const validModels: DetectedModel[] = oaiData.data
          .filter((m: { id?: string }) => (m.id || "").startsWith("gpt-"))
          .map((m: { id: string }) => ({
            id: m.id,
            label: m.id.toUpperCase(),
            provider: "openai",
            description: "OpenAI Model"
          }));

        return NextResponse.json({
          success: true,
          provider: "openai",
          models: validModels
        });
      } else if (oaiData?.error) {
        return NextResponse.json(
          { success: false, error: `OpenAI: ${oaiData.error.message || "Invalid API Key"}` },
          { status: 400 }
        );
      }
    }

    // 5. Fallback Probe: coba Gemini dan Groq
    const [testGemini, testGroq] = await Promise.allSettled([
      fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(rawKey)}`),
      fetch("https://api.groq.com/openai/v1/models", {
        headers: { Authorization: `Bearer ${rawKey}` }
      })
    ]);

    if (testGemini.status === "fulfilled" && testGemini.value.ok) {
      const geminiData = await testGemini.value.json().catch(() => null);
      if (geminiData?.models) {
        const validModels: DetectedModel[] = geminiData.models
          .filter((m: { name?: string; supportedGenerationMethods?: string[] }) => {
            const name = m.name || "";
            const methods = m.supportedGenerationMethods || [];
            return name.includes("gemini") && methods.includes("generateContent");
          })
          .map((m: { name: string; displayName?: string }) => {
            const shortId = m.name.replace("models/", "");
            return {
              id: shortId,
              label: m.displayName || shortId.replace(/-/g, " ").toUpperCase(),
              provider: "gemini"
            };
          });

        return NextResponse.json({
          success: true,
          provider: "gemini",
          models: validModels
        });
      }
    }

    if (testGroq.status === "fulfilled" && testGroq.value.ok) {
      const groqData = await testGroq.value.json().catch(() => null);
      if (Array.isArray(groqData?.data)) {
        const validModels: DetectedModel[] = groqData.data
          .filter((m: { id?: string }) => !(m.id || "").toLowerCase().includes("whisper"))
          .map((m: { id: string }) => ({
            id: m.id,
            label: m.id.replace(/-/g, " ").toUpperCase(),
            provider: "groq"
          }));

        return NextResponse.json({
          success: true,
          provider: "groq",
          models: validModels
        });
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Tidak dapat mengenali format API Key atau autentikasi gagal. Pastikan key valid dari Google AI Studio (AIza...) atau Groq (gsk_...)."
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("[AI-MODELS-DETECT] Error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan internal saat memeriksa API Key." },
      { status: 500 }
    );
  }
}
