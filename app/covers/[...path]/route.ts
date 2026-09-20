import { servePublicAsset } from "@/lib/mediaResponse";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ path: string[] }>;
}

export async function GET(request: Request, { params }: RouteContext) {
  const { path } = await params;
  return servePublicAsset(request, "covers", path);
}

export async function HEAD(request: Request, { params }: RouteContext) {
  const { path } = await params;
  return servePublicAsset(request, "covers", path);
}
