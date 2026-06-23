import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { createBackup, currentDbRaw, parseBackup, readBackup } from "@/lib/backups";
import { replaceDB } from "@/lib/db";

function forbidden() {
  return NextResponse.json({ error: "Admin only" }, { status: 403 });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await currentUser();
  if (!me || me.role !== "admin") return forbidden();
  const { id } = await params;
  try {
    const raw = await readBackup(id);
    return new NextResponse(raw, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${id}.json"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Backup not found" }, { status: 404 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await currentUser();
  if (!me || me.role !== "admin") return forbidden();
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  if (body?.action !== "restore") {
    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  }
  try {
    const currentRaw = await currentDbRaw();
    await createBackup(currentRaw, "pre_restore");
    const parsed = await parseBackup(id);
    await replaceDB(parsed);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not restore backup" }, { status: 500 });
  }
}
