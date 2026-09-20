import { createReadStream } from "fs";
import { stat } from "fs/promises";
import path from "path";
import { Readable } from "stream";

const CONTENT_TYPES: Record<string, string> = {
  ".aac": "audio/aac",
  ".flac": "audio/flac",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".m4a": "audio/mp4",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".png": "image/png",
  ".wav": "audio/wav",
  ".webp": "image/webp",
};

function getSafePublicAssetPath(folder: string, segments: string[]) {
  const publicDir = path.resolve(process.cwd(), "public");
  const folderDir = path.resolve(publicDir, folder);
  const requestedPath = path.resolve(folderDir, ...segments);

  if (requestedPath !== folderDir && requestedPath.startsWith(folderDir + path.sep)) {
    return requestedPath;
  }

  throw new Error("Invalid asset path");
}

function getContentType(filePath: string) {
  return CONTENT_TYPES[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
}

function nodeStreamToWeb(filePath: string, start?: number, end?: number) {
  return Readable.toWeb(createReadStream(filePath, { start, end })) as ReadableStream<Uint8Array>;
}

export async function servePublicAsset(
  request: Request,
  folder: "covers" | "music",
  segments: string[]
) {
  try {
    const filePath = getSafePublicAssetPath(folder, segments);
    const fileStat = await stat(filePath);

    if (!fileStat.isFile()) {
      return new Response("Not Found", { status: 404 });
    }

    const contentType = getContentType(filePath);
    const baseHeaders = {
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": contentType,
    };

    const range = request.headers.get("range");
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match || (!match[1] && !match[2])) {
        return new Response("Invalid Range", { status: 416 });
      }

      const fileSize = fileStat.size;
      let start: number;
      let end: number;

      if (!match[1] && match[2]) {
        // Suffix byte range: bytes=-500 (last 500 bytes)
        const suffixLength = Number(match[2]);
        start = Math.max(0, fileSize - suffixLength);
        end = fileSize - 1;
      } else {
        start = Number(match[1]);
        end = match[2] ? Number(match[2]) : fileSize - 1;
      }

      if (start >= fileSize || end >= fileSize || start > end) {
        return new Response("Range Not Satisfiable", {
          status: 416,
          headers: {
            ...baseHeaders,
            "Content-Range": `bytes */${fileSize}`,
          },
        });
      }

      const headers = {
        ...baseHeaders,
        "Content-Length": String(end - start + 1),
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      };

      if (request.method === "HEAD") {
        return new Response(null, { status: 206, headers });
      }

      return new Response(nodeStreamToWeb(filePath, start, end), {
        status: 206,
        headers,
      });
    }

    const headers = {
      ...baseHeaders,
      "Content-Length": String(fileStat.size),
    };

    if (request.method === "HEAD") {
      return new Response(null, { headers });
    }

    return new Response(nodeStreamToWeb(filePath), { headers });
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid asset path") {
      return new Response("Bad Request", { status: 400 });
    }

    const maybeNodeError = error as NodeJS.ErrnoException;
    if (maybeNodeError.code === "ENOENT") {
      return new Response("Not Found", { status: 404 });
    }

    console.error(`Failed to serve /${folder}/${segments.join("/")}:`, error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
