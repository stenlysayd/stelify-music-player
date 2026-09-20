import { jsonError, jsonOk } from "@/lib/http";
import { getAnalyticsStats } from "@/lib/services/analyticsService";

export const runtime = "nodejs";

export async function GET() {
  try {
    return jsonOk(await getAnalyticsStats());
  } catch (error) {
    console.error("GET /api/analytics/stats:", error);
    return jsonError(error);
  }
}
