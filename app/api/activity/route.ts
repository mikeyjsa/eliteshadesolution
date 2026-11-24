// Log a view/action event from client-side admin pages.
import { NextRequest, NextResponse } from "next/server";
import { mutate, uid } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const actor = await currentUser();
  if (!actor) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const body = await req.json();
  const now = new Date().toISOString();
  await mutate((db) => {
    db.activities.unshift({
      id: uid("act_"),
      quote_id: body.quote_id ?? "",
      user: actor.name,
      user_id: actor.id,
      type: body.type ?? "view",
      message: body.message ?? "",
      created_at: now,
    });
  });
  return NextResponse.json({ ok: true });
}
