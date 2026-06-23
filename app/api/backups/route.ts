import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { createBackup, listBackups } from "@/lib/backups";
import { getDB } from "@/lib/db";

function forbidden() {
  return NextResponse.json({ error: "Admin only" }, { status: 403 });
}

export async function GET(req: Request) {
  const me = await currentUser();
  if (!me || me.role !== "admin") return forbidden();

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(50, Math.max(5, Number(searchParams.get("pageSize")) || 10));
  const all = await listBackups();
  const start = (page - 1) * pageSize;

  return NextResponse.json({
    items: all.slice(start, start + pageSize),
    total: all.length,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(all.length / pageSize)),
  });
}

export async function POST() {
  const me = await currentUser();
  if (!me || me.role !== "admin") return forbidden();
  const db = await getDB();
  const backup = await createBackup(db, "manual");
  return NextResponse.json({ ok: true, backup });
}
