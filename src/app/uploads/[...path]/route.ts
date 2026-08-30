import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import { resolveLocalBasePath } from "@/shared/storage";

// MIME type dari ekstensi — kebalikan dari MIME_EXT_MAP di shared/storage
const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
};

type Params = { params: Promise<{ path: string[] }> };

// Serve file dari local storage (STORAGE_LOCAL_PATH) — folder ini di luar /public
// sehingga harus disajikan lewat route handler (lihat docs/ARCHITECTURE.md).
export async function GET(_req: Request, { params }: Params) {
  const { path: segments } = await params;
  const relative = segments.join("/");

  try {
    const basePath = path.resolve(resolveLocalBasePath());
    const target = path.resolve(basePath, relative);

    // Cegah directory traversal — hasil resolve wajib tetap di dalam basePath
    if (target !== basePath && !target.startsWith(basePath + path.sep)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const stat = await fs.stat(target);
    if (!stat.isFile()) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const data = await fs.readFile(target);
    const ext = path.extname(target).toLowerCase();
    return new NextResponse(new Uint8Array(data), {
      status: 200,
      headers: {
        "Content-Type": MIME_BY_EXT[ext] ?? "application/octet-stream",
        "Content-Length": String(stat.size),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
