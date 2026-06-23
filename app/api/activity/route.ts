// Log a view/action event from client-side admin pages.
import { NextRequest, NextResponse } from "next/server";
import { mutate, uid } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const actor = await currentUser();
  const now = new Date().toISOString();
  await mutate((db) => {
    db.activities.unshift({
      id: uid("act_"),
      quote_id: body.quote_id ?? "",
      user: actor?.name ?? "unknown",
      user_id: actor?.id ?? "system",
      type: body.type ?? "view",
      message: body.message ?? "",
      created_at: now,
    });
  });
  return NextResponse.json({ ok: true });
}
