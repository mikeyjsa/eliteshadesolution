// Self-profile edit — any authenticated user can update their own name, email, password.
// Role and active status are intentionally excluded.
import { NextRequest, NextResponse } from "next/server";
import { mutate } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  await mutate((db) => {
    const u = db.users.find((x) => x.id === me.id);
    if (!u) return;
    if (typeof body.name === "string" && body.name.trim()) u.name = body.name.trim();
    if (typeof body.email === "string" && body.email.trim()) u.email = body.email.trim();
    if (typeof body.password === "string" && body.password.trim()) u.password = body.password.trim();
    // role and active are NOT editable here
  });
  return NextResponse.json({ ok: true });
}
