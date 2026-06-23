import { promises as fs } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { UPLOADS_DIR } from "@/lib/storage-paths";

const MIME_BY_EXT: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const rel = slug.join("/");
  const full = path.resolve(UPLOADS_DIR, rel);
  const root = path.resolve(UPLOADS_DIR);

  if (!full.startsWith(root + path.sep) && full !== root) {
    return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
  }

  try {
    const bytes = await fs.readFile(full);
    const ext = path.extname(full).toLowerCase();
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": MIME_BY_EXT[ext] || "application/octet-stream",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
