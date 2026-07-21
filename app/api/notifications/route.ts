import { NextRequest, NextResponse } from "next/server";
import { getDB, mutate } from "@/lib/db";

export async function GET() {
  const db = await getDB();
  return NextResponse.json(db.notifications);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const now = new Date().toISOString();

  await mutate((db) => {
    if (body?.action === "mark_all_read") {
      db.notifications.forEach((notification) => {
        notification.read_at ||= now;
      });
      return;
    }
    if (typeof body?.id === "string") {
      const notification = db.notifications.find((item) => item.id === body.id);
      if (!notification) return;
      notification.read_at = body.read === false ? null : now;
    }
  });

  return NextResponse.json({ ok: true });
}
