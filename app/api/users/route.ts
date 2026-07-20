import { NextRequest, NextResponse } from "next/server";
import { getDB, mutate, uid } from "@/lib/db";
import type { AdminUser } from "@/lib/types";

export async function GET() {
  const db = await getDB();
  return NextResponse.json(db.users.map((u) => ({ ...u, password: undefined })));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.email || !body.password || !body.name) {
    return NextResponse.json({ error: "name, email, password required" }, { status: 400 });
  }
  const user: AdminUser = await mutate((db) => {
    const existing = db.users.find((u) => u.email.toLowerCase() === body.email.toLowerCase());
    if (existing) {
      existing.name = body.name;
      existing.password = body.password;
      existing.role = body.role ?? "manager";
      existing.active = true;
      existing.receive_admin_notifications = typeof body.receive_admin_notifications === "boolean" ? body.receive_admin_notifications : true;
      return existing;
    }
    const u: AdminUser = {
      id: uid("usr_"),
      name: body.name,
      email: body.email,
      password: body.password,
      role: body.role ?? "manager",
      active: true,
      receive_admin_notifications: typeof body.receive_admin_notifications === "boolean" ? body.receive_admin_notifications : true,
      created_at: new Date().toISOString(),
    };
    db.users.push(u);
    return u;
  });
  return NextResponse.json({ ok: true, user: { ...user, password: undefined } });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  await mutate((db) => {
    const u = db.users.find((x) => x.id === body.id);
    if (!u) return;
    if (typeof body.name === "string") u.name = body.name;
    if (typeof body.email === "string") u.email = body.email;
    if (typeof body.password === "string" && body.password) u.password = body.password;
    if (body.role === "admin" || body.role === "manager") u.role = body.role;
    if (typeof body.active === "boolean") u.active = body.active;
    if (typeof body.receive_admin_notifications === "boolean") {
      u.receive_admin_notifications = body.receive_admin_notifications;
    }
  });
  return NextResponse.json({ ok: true });
}
